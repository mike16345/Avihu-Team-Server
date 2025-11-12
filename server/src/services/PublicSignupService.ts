import { google, sheets_v4 } from "googleapis";
import { BaseService } from "./BaseService";
import UnsentLeadRepository from "../repositories/Leads/UnsentLeadRepository";
import { IUnsentLead } from "../interfaces/IUnsentLead";

const APPEND_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

interface SignupPayload {
  fullName: string;
  email: string;
  phone?: string;
  source?: string;
  deviceId?: string;
}

interface SignupResult {
  ok: boolean;
  stored?: boolean;
}

interface RetrySummary {
  attempted: number;
  succeeded: number;
  failed: number;
}

export default class PublicSignupService extends BaseService<IUnsentLead, UnsentLeadRepository> {
  constructor() {
    super(new UnsentLeadRepository(), "unsent-leads");
  }

  private buildSheetsClient(scopes: string[]): sheets_v4.Sheets {
    const email = process.env.GCP_CLIENT_EMAIL;
    const key = (process.env.GCP_PRIVATE_KEY || "").replace(/\\n/g, "\n");
    const sheetId = process.env.SHEET_ID;

    if (!email || !key || !sheetId) {
      throw new Error("Missing Google Sheets configuration");
    }

    const auth = new google.auth.JWT({
      email,
      key,
      scopes,
    });

    return google.sheets({ version: "v4", auth });
  }

  private async appendRow(values: string[], sheets?: sheets_v4.Sheets): Promise<void> {
    const sheetsClient = sheets || this.buildSheetsClient([APPEND_SCOPE]);
    const spreadsheetId = process.env.SHEET_ID!;
    const range = process.env.SHEET_RANGE || "Leads!A1";

    await sheetsClient.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [values],
      },
    });
  }

  private sanitizeErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
      return error.message.slice(0, 500);
    }

    if (typeof error === "string") {
      return error.slice(0, 500);
    }

    return "Unknown error";
  }

  async submitSignup(payload: SignupPayload): Promise<SignupResult> {
    const timestamp = new Date().toISOString();
    const row = [
      timestamp,
      payload.fullName,
      payload.email,
      payload.phone || "",
      payload.source || "",
      payload.deviceId || "",
    ];

    try {
      await this.appendRow(row);
      return { ok: true };
    } catch (error) {
      console.error("[PublicSignupService] Failed to append lead", error);

      await this.repository.create({
        ...payload,
        retryCount: 0,
        errorMessage: this.sanitizeErrorMessage(error),
      });

      return { ok: false, stored: true };
    }
  }

  async retryUnsentLeads(): Promise<RetrySummary> {
    const leads = await this.repository.getAllLeads();
    const summary: RetrySummary = {
      attempted: leads.length,
      succeeded: 0,
      failed: 0,
    };

    if (!leads.length) {
      console.log("[PublicSignupService] No unsent leads to retry");
      return summary;
    }

    const sheets = this.buildSheetsClient([APPEND_SCOPE]);

    for (const lead of leads) {
      const timestamp = lead.createdAt
        ? new Date(lead.createdAt).toISOString()
        : new Date().toISOString();
      const row = [
        timestamp,
        lead.fullName,
        lead.email,
        lead.phone || "",
        lead.source || "",
        lead.deviceId || "",
      ];

      try {
        await this.appendRow(row, sheets);
        await this.repository.deleteById(lead._id!.toString());
        summary.succeeded += 1;
      } catch (error) {
        summary.failed += 1;
        await this.repository.updateById(lead._id!.toString(), {
          update: {
            retryCount: (lead.retryCount || 0) + 1,
            errorMessage: this.sanitizeErrorMessage(error),
          },
          options: { new: true },
        });
      }
    }

    console.log(
      `[PublicSignupService] Retry summary - attempted: ${summary.attempted}, succeeded: ${summary.succeeded}, failed: ${summary.failed}`
    );

    return summary;
  }
}
