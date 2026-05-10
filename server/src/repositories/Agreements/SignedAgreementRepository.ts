import { Document, Types } from "mongoose";
import { ISignedAgreement } from "../../interfaces/IAgreement";
import { SignedAgreementModel } from "../../models/signedAgreementModel";
import { FindOptions } from "../../types/mongooseTypes";
import { BaseRepository } from "../BaseRepository";
import { User } from "../../models/userModel";
import { PaginationParams } from "../../utils/pagination";

export class SignedAgreementRepository extends BaseRepository<ISignedAgreement> {
  constructor() {
    super(SignedAgreementModel, { type: "trainer", field: "trainerId" });
  }

  private populateUserId(docs: any[]) {
    return this.model.populate(docs, {
      path: "userId",
      select: "firstName lastName",
      model: User,
    });
  }

  async find(
    options?: FindOptions<ISignedAgreement>
  ): Promise<
    (Document<unknown, {}, ISignedAgreement, {}> &
      ISignedAgreement &
      Required<{ _id: Types.ObjectId }> & { __v: number })[]
  > {
    const { query = {}, queryOptions = {}, projection = {} } = options ?? {};

    const results = await this.model.find(query, projection, queryOptions);

    return this.populateUserId(results);
  }

  async findOne(options: FindOptions<ISignedAgreement>): Promise<any> {
    const result = await super.findOne(options);

    const populatedResult = await this.populateUserId([result]);
    const firstResult = populatedResult && populatedResult.length > 0 ? populatedResult[0] : null;

    return firstResult;
  }

  async getPaginated(paginationParams: PaginationParams): Promise<any> {
    const paginated = await super.getPaginated(paginationParams);
    paginated.results = await this.populateUserId(paginated.results);

    return paginated;
  }

  create = async (doc: ISignedAgreement): Promise<ISignedAgreement> => {
    const newDoc = await this.model.create(doc);

    await User.findByIdAndUpdate(doc.userId, { onboardingStep: "completed" });

    return newDoc;
  };
}
