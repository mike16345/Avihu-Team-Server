import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import BaseController from "./BaseController";
import { AgreementTemplateService } from "../services/AgreementTemplateService";
import { AgreementService } from "../services/AgreementService";
import { StatusCode } from "../enums/StatusCode";
import { extractBodyFromEvent, extractQueryFromEvent } from "../utils/utils";
import { IAgreementTemplate } from "../interfaces/IAgreement";

export class AgreementController extends BaseController<
  IAgreementTemplate,
  AgreementTemplateService
> {
  private agreementService: AgreementService;

  constructor() {
    super(new AgreementTemplateService());
    this.agreementService = new AgreementService();
  }

  getCurrentAgreement = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const query = extractQueryFromEvent(event);
      const agreementId = query.agreementId;
      const groupId = query.groupId;

      const agreement = await this.agreementService.getCurrentAgreement({ agreementId, groupId });

      if (!agreement) {
        return this.errorResponse("Active agreement not found.", StatusCode.NOT_FOUND);
      }

      const response = this.successResponse({
        status: StatusCode.OK,
        data: {
          agreementId: agreement.agreementId,
          version: agreement.version,
          pdfUrl: agreement.pdfUrl,
          questions: agreement.questions,
        },
      });

      await this.afterAction(response);

      return response;
    } catch (err: any) {
      return this.errorResponse(err);
    }
  };

  signAgreement = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const body = extractBodyFromEvent(event);
      const {
        agreementId,
        agreementVersion,
        answers,
        signaturePngBase64,
        userId,
        groupId,
        userDisplayName,
      } = body;

      if (!userId) {
        return this.errorResponse("userId is required.", StatusCode.BAD_REQUEST);
      }

      const result = await this.agreementService.signAgreement({
        agreementId,
        agreementVersion,
        answers,
        signaturePngBase64,
        userId,
        groupId,
        userDisplayName,
      });

      const response = this.successResponse({
        status: StatusCode.OK,
        data: {
          signedAgreementId: String((result.signedAgreement as any)?._id || ""),
          signedAt: result.signedAgreement.signedAt,
          signedPdfUrl: result.signedPdfUrl,
        },
      });

      await this.afterAction(response);

      return response;
    } catch (err: any) {
      return this.errorResponse(err, err?.status || err?.statusCode);
    }
  };
}
