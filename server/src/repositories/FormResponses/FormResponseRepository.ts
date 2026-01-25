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

  findOne = async (options: FindOptions<IFormResponse>): Promise<any> => {
    const { query, queryOptions, projection } = options;
    const queryResult = this.model.findOne(query, projection, queryOptions);
    const response = await this.populateForm(queryResult);

    if (!response) {
      throw { status: StatusCode.NOT_FOUND, message: FIND_ONE_FAILURE };
    }

    return response;
  };

  findById = async (id: string | Types.ObjectId): Promise<any> => {
    const response = await this.populateForm(this.model.findById(id));

    if (!response) {
      throw { status: StatusCode.NOT_FOUND, message: FIND_ONE_FAILURE };
    }

    return response;
  };

  find = async (options: FindOptions<IFormResponse>): Promise<any> => {
    const { query, queryOptions, projection } = options;
    const responses = await this.populateForm(this.model.find(query, projection, queryOptions));

    return responses;
  };

  create = async (doc: IFormResponse): Promise<IFormResponse> => {
    const newDoc = await this.model.create(doc);

    if (doc.formType === "onboarding") {
      await User.findByIdAndUpdate(doc.userId, { completedOnboarding: true });
    }

    return newDoc;
  };
}
