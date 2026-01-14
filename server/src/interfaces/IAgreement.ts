import mongoose from "mongoose";

export interface IAgreementQuestionDefinition {
  questionId: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: string[];
}

export type AgreementAnswerValue = string | number | boolean | string[] | null;

export interface IAgreementAnswer {
  questionId: string;
  value: AgreementAnswerValue;
}

export interface IAgreementTemplate {
  _id: mongoose.Types.ObjectId;
  groupId?: string;
  agreementId: string;
  version: number;
  active: boolean;
  templatePdfS3Key: string;
  questions: IAgreementQuestionDefinition[];
  createdAt: Date;
}

export interface ISignedAgreement {
  _id: mongoose.Types.ObjectId;
  groupId?: string;
  userId: string;
  agreementId: string;
  agreementVersion: number;
  answers: IAgreementAnswer[];
  signedAt: Date;
  templatePdfS3Key: string;
  signedPdfS3Key: string;
  signatureS3Key?: string;
  signatureSha256?: string;
  signedPdfSha256: string;
}
