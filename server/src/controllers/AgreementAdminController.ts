import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import BaseController from "./BaseController";
import { AgreementTemplateService } from "../services/AgreementTemplateService";
import { AgreementService } from "../services/AgreementService";
import { SignedAgreementService } from "../services/SignedAgreementService";
import { StatusCode } from "../enums/StatusCode";
import {
  extractBodyFromEvent,
  extractPaginationParamsFromEvent,
  extractQueryFromEvent,
} from "../utils/utils";
import { IAgreementTemplate } from "../interfaces/IAgreement";
import UserService from "../services/userService";
import { requireAdmin } from "../guards/AdminAccessGuard";
import { getPresignedGetUrl } from "../utils/s3Helpers";

const DOWNLOAD_URL_TTL_SECONDS = 60 * 10;

export class AgreementAdminController extends BaseController<
  IAgreementTemplate,
  AgreementTemplateService
> {
  private agreementService: AgreementService;
  private signedAgreementService: SignedAgreementService;
  private userService: UserService;

  constructor() {
    super(new AgreementTemplateService());
    this.agreementService = new AgreementService();
    this.signedAgreementService = new SignedAgreementService();
    this.userService = new UserService();
  }

  listSignedAgreements = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      await this.requireAdminFromEvent(event);

      const query = extractQueryFromEvent(event);
      const { page, limit } = extractPaginationParamsFromEvent(event);
      const filter: Record<string, any> = {};

      if (query.userId) filter.userId = query.userId;
      if (query.agreementId) filter.agreementId = query.agreementId;

      if (query.from || query.to) {
        filter.signedAt = {};
        if (query.from) {
          const fromDate = parseDateParam(query.from, "from");
          filter.signedAt.$gte = fromDate;
        }
        if (query.to) {
          const toDate = parseDateParam(query.to, "to");
          filter.signedAt.$lte = toDate;
        }
      }

      const result = await this.signedAgreementService.findPaginated({
        page,
        limit,
        query: filter,
        sort: { signedAt: -1 },
      });

      const response = this.successResponse({
        status: StatusCode.OK,
        data: result,
      });

      await this.afterAction(response);

      return response;
    } catch (err: any) {
      return this.errorResponse(err, err?.status || err?.statusCode);
    }
  };

  getSignedAgreementDownloadUrl = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      await this.requireAdminFromEvent(event);

      const { id, error } = this.getParamsOrError(event, ["id"]);
      if (error) return error;

      const signedAgreement = await this.signedAgreementService.findById(id);
      if (!signedAgreement) {
        return this.errorResponse("PDF לא קיים במערכת", 404);
      }

      const downloadUrl = await getPresignedGetUrl(
        signedAgreement?.signedPdfS3Key,
        DOWNLOAD_URL_TTL_SECONDS
      );

      const response = this.successResponse({
        status: StatusCode.OK,
        data: { downloadUrl },
      });

      await this.afterAction(response);

      return response;
    } catch (err: any) {
      return this.errorResponse(err, err?.status || err?.statusCode);
    }
  };

  createTemplateUploadUrl = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      await this.requireAdminFromEvent(event);
      const body = extractBodyFromEvent(event);

      const result = await this.agreementService.createTemplateUploadUrl({
        agreementId: body.agreementId,
        groupId: body.groupId,
        contentType: body.contentType,
      });

      const response = this.successResponse({
        status: StatusCode.OK,
        data: result,
      });

      await this.afterAction(response);

      return response;
    } catch (err: any) {
      return this.errorResponse(err, err?.status || err?.statusCode);
    }
  };

  activateTemplateVersion = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      await this.requireAdminFromEvent(event);
      const body = extractBodyFromEvent(event);

      const updated = await this.agreementService.activateTemplate({
        agreementId: body.agreementId,
        version: body.version,
        groupId: body.groupId,
        questions: body.questions || [],
      });

      const response = this.successResponse({
        status: StatusCode.OK,
        data: updated,
      });

      await this.afterAction(response);

      return response;
    } catch (err: any) {
      return this.errorResponse(err, err?.status || err?.statusCode);
    }
  };

  private async requireAdminFromEvent(event: APIGatewayProxyEvent) {
    const query = extractQueryFromEvent(event);
    const body = extractBodyFromEvent(event);
    const adminId = query.adminId || body.adminId;

    if (!adminId) {
      throw { statusCode: StatusCode.BAD_REQUEST, message: "adminId is required." };
    }

    const adminUser = await this.userService.findById(adminId);
    requireAdmin(adminUser);
  }
}

function parseDateParam(value: string, field: string): Date {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw { statusCode: StatusCode.BAD_REQUEST, message: `${field} must be a valid date.` };
  }
  return date;
}
