import { Types } from "mongoose";
import { IFormResponse } from "../../interfaces/IFormResponse";
import { FormResponseModel } from "../../models/formResponseModel";
import { BaseRepository } from "../BaseRepository";
import { FindOptions } from "../../types/mongooseTypes";
import { StatusCode } from "../../enums/StatusCode";
import { FIND_ONE_FAILURE } from "../../constants/repository";
import { FormModel } from "../../models/formPresetModel";
import { User } from "../../models/userModel";

export class FormResponseRepository extends BaseRepository<IFormResponse> {
  constructor() {
    super(FormResponseModel);
  }

  private async populateForm(queryOrDocs: any) {
    const options = { path: "formId", select: "name type", model: FormModel };

    if (typeof queryOrDocs.populate === "function") {
      return queryOrDocs.populate(options);
    }

    return this.model.populate(queryOrDocs, options);
  }

  private populateUserId(docs: any[]) {
    return this.model.populate(docs, {
      path: "userId",
      select: "firstName lastName",
      model: User,
    });
  }

  findOne = async (options: FindOptions<IFormResponse>): Promise<any> => {
    const { query, queryOptions, projection } = options;
    const queryResult = this.model.findOne(query, projection, queryOptions);
    const res = await this.populateForm(queryResult);
    const finalRes = await this.populateUserId([res]);

    if (!finalRes) {
      throw { status: StatusCode.NOT_FOUND, message: FIND_ONE_FAILURE };
    }

    return Array.isArray(finalRes) ? finalRes[0] : null;
  };

  findById = async (id: string | Types.ObjectId): Promise<any> => {
    const form = await this.model.findById(id);
    const res = await this.populateForm(form);
    const finalRes = await this.populateUserId([res]);

    if (!finalRes) {
      throw { status: StatusCode.NOT_FOUND, message: FIND_ONE_FAILURE };
    }

    return Array.isArray(finalRes) ? finalRes[0] : null;
  };

  find = async (options: FindOptions<IFormResponse>): Promise<any> => {
    const { query, queryOptions, projection } = options;
    const forms = await this.model.find(query, projection, queryOptions);
    const res = await this.populateForm(forms);
    const finalRes = await this.populateUserId(res);

    return finalRes;
  };

  create = async (doc: IFormResponse): Promise<IFormResponse> => {
    const newDoc = await this.model.create(doc);

    if (doc.formType === "onboarding") {
      await User.findByIdAndUpdate(doc.userId, { onboardingStep: "agreement" });
    }

    return newDoc;
  };
}
