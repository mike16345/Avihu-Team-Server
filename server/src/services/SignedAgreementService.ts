import { ISignedAgreement } from "../interfaces/IAgreement";
import { SignedAgreementRepository } from "../repositories/Agreements/SignedAgreementRepository";
import { BaseService } from "./BaseService";

const baseKey = "signed-agreements";

export class SignedAgreementService extends BaseService<ISignedAgreement, SignedAgreementRepository> {
  constructor() {
    super(new SignedAgreementRepository(), baseKey);
  }
}
