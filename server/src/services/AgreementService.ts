import { AgreementTemplateService } from "./AgreementTemplateService";
import { SignedAgreementService } from "./SignedAgreementService";
import {
  AgreementAnswerValue,
  IAgreementAnswer,
  IAgreementTemplate,
  ISignedAgreement,
} from "../interfaces/IAgreement";
import { createSignedAgreementPdf } from "../utils/agreementsPdf";
import {
  getObjectBuffer,
  getPresignedGetUrl,
  getPresignedPutUrl,
  putObjectBuffer,
} from "../utils/s3Helpers";
import { sha256 } from "../utils/crypto";
import { stripBase64DataUrl } from "../utils/utils";
import { StatusCode } from "../enums/StatusCode";
import mongoose, { isValidObjectId } from "mongoose";
import { IFormQuestion } from "../interfaces/IForm";

const DOWNLOAD_URL_TTL_SECONDS = 60 * 10;
const UPLOAD_URL_TTL_SECONDS = 60 * 10;

export class AgreementService {
  private templateService: AgreementTemplateService;
  private signedService: SignedAgreementService;

  constructor() {
    this.templateService = new AgreementTemplateService();
    this.signedService = new SignedAgreementService();
  }

  async getCurrentAgreement(params: {
    agreementId?: string;
    groupId?: string;
  }): Promise<(IAgreementTemplate & { pdfUrl?: string }) | null> {
    const template = await this.templateService.getActiveTemplate({
      ...(params.agreementId ? { agreementId: params.agreementId } : {}),
      ...(params.groupId ? { groupId: params.groupId } : {}),
    });

    if (!template) return null;
    const pdfUrl = await getPresignedGetUrl(template.templatePdfS3Key, DOWNLOAD_URL_TTL_SECONDS);

    return { ...template, pdfUrl };
  }

  async createTemplateUploadUrl(params: {
    agreementId?: string;
    groupId?: string;
    contentType: string;
    questions: IFormQuestion[];
  }) {
    const isObjectId = isValidObjectId(params.agreementId);
    const agreementId = isObjectId ? params.agreementId : new mongoose.Types.ObjectId().toString();

    const latest = await this.templateService.getLatestTemplate({
      agreementId,
      ...(params.groupId ? { groupId: params.groupId } : {}),
    });

    const nextVersion = (latest?.version ?? 0) + 1;
    const templatePdfS3Key = `agreements/templates/${agreementId}/${nextVersion}.pdf`;

    const template: Omit<IAgreementTemplate, "_id"> = {
      agreementId,
      groupId: params.groupId,
      version: nextVersion,
      active: true,
      templatePdfS3Key,
      questions: params.questions,
      createdAt: new Date(),
    };

    const created = await this.templateService.create(template as any);

    const uploadUrl = await getPresignedPutUrl(
      templatePdfS3Key,
      params.contentType,
      UPLOAD_URL_TTL_SECONDS
    );

    return {
      uploadUrl,
      templatePdfS3Key,
      version: created.version,
      agreementId: created.agreementId, // crucial for the client
    };
  }

  async activateTemplate(params: {
    agreementId: string;
    version: number;
    groupId?: string;
    questions: IFormQuestion[];
  }) {
    const templateQuery = {
      agreementId: params.agreementId,
      ...(params.groupId ? { groupId: params.groupId } : {}),
    };

    const updated = await this.templateService.updateOne(
      { ...templateQuery, version: params.version },
      { active: true, questions: params.questions }
    );

    if (!updated) {
      throw { status: StatusCode.NOT_FOUND, message: "Agreement template not found." };
    }

    await this.templateService.deactivateTemplates({
      ...templateQuery,
      version: { $ne: params.version },
    });

    return updated;
  }

  async signAgreement(params: {
    agreementId: string;
    agreementVersion: number;
    answers: IAgreementAnswer[];
    signaturePngBase64: string;
    userId: string;
    groupId?: string;
    userDisplayName?: string;
  }): Promise<{
    signedAgreement: ISignedAgreement;
    signedPdfUrl?: string;
  }> {
    const template = await this.templateService.getTemplateByVersion({
      agreementId: params.agreementId,
      version: params.agreementVersion,
      ...(params.groupId ? { groupId: params.groupId } : {}),
    });

    if (!template) {
      throw { status: StatusCode.NOT_FOUND, message: "Agreement template not found." };
    }

    if (!template.active) {
      throw {
        status: StatusCode.BAD_REQUEST,
        message: "Agreement version is not active.",
      };
    }

    const missingRequired = findMissingRequiredAnswers(template.questions, params.answers);
    if (missingRequired.length > 0) {
      throw {
        status: StatusCode.BAD_REQUEST,
        message: `Missing required answers: ${missingRequired.join(", ")}`,
      };
    }

    if (!params.signaturePngBase64 || !params.signaturePngBase64.trim()) {
      throw { status: StatusCode.BAD_REQUEST, message: "Signature is required." };
    }

    console.log(
      JSON.stringify({
        event: "SIGN_REQUEST_RECEIVED",
        agreementId: params.agreementId,
        version: params.agreementVersion,
        userId: params.userId,
        answersCount: params.answers.length,
      })
    );

    const templatePdfBytes = await getObjectBuffer(template.templatePdfS3Key);
    console.log(
      JSON.stringify({
        event: "SIGN_TEMPLATE_FETCHED",
        templatePdfS3Key: template.templatePdfS3Key,
      })
    );
    const signatureBuffer = decodeSignature(params.signaturePngBase64);
    const signedAt = new Date();

    const signedPdfBytes = await createSignedAgreementPdf({
      templatePdfBytes,
      signaturePngBytes: signatureBuffer,
      answers: params.answers,
      questions: template.questions,
      signedAt,
      userDisplayName: params.userDisplayName,
    });

    const signedPdfSha = sha256(signedPdfBytes);
    const signatureSha = sha256(signatureBuffer);

    console.log(
      JSON.stringify({
        event: "SIGN_PDF_CREATED",
        signedPdfSha256: signedPdfSha,
      })
    );

    const signedPdfS3Key = buildSignedPdfKey(params.agreementId, params.userId, signedAt);

    await putObjectBuffer(signedPdfS3Key, signedPdfBytes, "application/pdf");

    console.log(
      JSON.stringify({
        event: "SIGN_PDF_UPLOADED",
        signedPdfS3Key,
      })
    );

    const signedAgreement = await this.signedService.create({
      groupId: params.groupId,
      userId: params.userId,
      agreementId: params.agreementId,
      agreementVersion: params.agreementVersion,
      answers: params.answers,
      signedAt,
      templatePdfS3Key: template.templatePdfS3Key,
      signedPdfS3Key,
      signatureSha256: signatureSha,
      signedPdfSha256: signedPdfSha,
    } as ISignedAgreement);

    console.log(
      JSON.stringify({
        event: "SIGN_DB_SAVED",
        signedAgreementId: String((signedAgreement as any)?._id || ""),
      })
    );

    const signedPdfUrl = await getPresignedGetUrl(signedPdfS3Key, DOWNLOAD_URL_TTL_SECONDS);

    return { signedAgreement, signedPdfUrl };
  }
}

function decodeSignature(signaturePngBase64: string): Buffer {
  const { base64 } = stripBase64DataUrl(signaturePngBase64);
  const buffer = Buffer.from(base64, "base64");
  if (!buffer.length) {
    throw { status: StatusCode.BAD_REQUEST, message: "Invalid signature data." };
  }
  return buffer;
}

function buildSignedPdfKey(agreementId: string, userId: string, signedAt: Date): string {
  const safeIso = signedAt.toISOString().replace(/[:.]/g, "-");
  return `agreements/signed/${agreementId}/${userId}/${safeIso}.pdf`;
}

function findMissingRequiredAnswers(
  questions: IFormQuestion[],
  answers: IAgreementAnswer[]
): string[] {
  const required = questions.filter((question) => question.required);
  if (required.length === 0) return [];

  const answerMap = new Map<string, AgreementAnswerValue>();
  for (const answer of answers) {
    answerMap.set(answer.questionId, answer.value);
  }

  const missing: string[] = [];
  for (const question of required) {
    const value = answerMap.get(question._id?.toString() || "");

    if (isEmptyAnswer(value)) {
      if (question._id) {
        missing.push(question._id);
      }
    }
  }

  return missing;
}

function isEmptyAnswer(value: AgreementAnswerValue | undefined): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}
