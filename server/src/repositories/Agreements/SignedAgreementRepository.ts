import { ISignedAgreement } from "../../interfaces/IAgreement";
import { SignedAgreementModel } from "../../models/signedAgreementModel";
import { BaseRepository } from "../BaseRepository";

export class SignedAgreementRepository extends BaseRepository<ISignedAgreement> {
  constructor() {
    super(SignedAgreementModel);
  }
}
