import { google, sheets_v4 } from "googleapis";
import { BaseService } from "./BaseService";
import UnsentLeadRepository from "../repositories/Leads/UnsentLeadRepository";
import { IUnsentLead } from "../interfaces/IUnsentLead";

const READ_SCOPE = "https://www.googleapis.com/auth/spreadsheets.readonly";

export interface LeadRow {
  timestamp: string;
  fullName: string;
  email: string;
  phone: string;
  source: string;
  deviceId: string;
}

export default class AdminLeadsService extends BaseService<IUnsentLead, UnsentLeadRepository> {
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

  async getLeads(): Promise<LeadRow[]> {
    const sheets = this.buildSheetsClient([READ_SCOPE]);
    const spreadsheetId = process.env.SHEET_ID!;
    const range = "Leads!A2:F";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    const leads = rows.map((row) => ({
      timestamp: row[0] || "",
      fullName: row[1] || "",
      email: row[2] || "",
      phone: row[3] || "",
      source: row[4] || "",
      deviceId: row[5] || "",
    }));

    console.log(`[AdminLeadsService] Fetched ${leads.length} leads`);

    return leads;
  }
}
