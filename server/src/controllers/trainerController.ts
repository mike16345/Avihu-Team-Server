import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ITrainer } from "../interfaces/ITrainer";
import BaseController from "./BaseController";
import TrainerService from "../services/trainerService";
import {
  extractBodyFromEvent,
  extractPaginationParamsFromEvent,
  extractQueryFromEvent,
} from "../utils/utils";
import { StatusCode } from "../enums/StatusCode";
import {
  BlockBackgroundValidation,
  BlockTipDefaultValidation,
  DietTipGoalValidation,
} from "../models/trainerModel";
import { requireAuthContext } from "../utils/authContext";

const ensureOwnTrainerOrAdmin = (
  targetTrainerId: string | undefined
): { ok: true } | { ok: false; message: string; status: StatusCode } => {
  if (!targetTrainerId) {
    return { ok: false, message: "trainerId is required", status: StatusCode.BAD_REQUEST };
  }
  const auth = requireAuthContext();
  if (auth.role === "admin") return { ok: true };
  const callerTrainerId = auth.trainerId ?? auth.userId;
  if (!callerTrainerId) {
    return { ok: false, message: "Auth context missing", status: StatusCode.UNAUTHORIZED };
  }
  if (callerTrainerId !== targetTrainerId) {
    return {
      ok: false,
      message: "לא ניתן לגשת לנתונים של מאמן אחר",
      status: StatusCode.FORBIDDEN,
    };
  }
  return { ok: true };
};

export default class TrainerController extends BaseController<ITrainer, TrainerService> {
  constructor() {
    super(new TrainerService());
  }

  create = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const payload = extractBodyFromEvent(event);
      const trainer = await this.service.createTrainer(payload);
      const response = this.successResponse({
        status: StatusCode.CREATED,
        data: trainer,
        message: "Trainer created successfully!",
      });

      await this.afterAction(response);

      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };

  getAll = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const query = extractQueryFromEvent(event);
      const data = await this.service.findWithCounts(query);
      const response = this.successResponse({
        status: StatusCode.OK,
        data,
        message: "Trainers retrieved successfully!",
      });

      await this.afterAction(response);

      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };

  getPaginated = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const query = extractPaginationParamsFromEvent(event);
      const data = await this.service.findPaginatedWithCounts(query);
      const response = this.successResponse({
        status: StatusCode.OK,
        data,
        message: "Trainers retrieved successfully!",
      });

      await this.afterAction(response);

      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };

  getOne = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const { id, error } = this.getParamsOrError(event, ["id"]);

      if (error) return error;

      const data = await this.service.getTrainerWithOverview(id);
      const response = this.successResponse({
        status: StatusCode.OK,
        data,
        message: "Trainer retrieved successfully!",
      });

      await this.afterAction(response);

      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };

  update = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const { id, error } = this.getParamsOrError(event, ["id"]);

      if (error) return error;

      const payload = extractBodyFromEvent(event);
      const trainer = await this.service.updateTrainer(id, payload);
      const response = this.successResponse({
        status: StatusCode.OK,
        data: trainer,
        message: "Trainer updated successfully!",
      });

      await this.afterAction(response);

      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };

  getBlockBackgrounds = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const query = extractQueryFromEvent(event) as { trainerId?: string };
      const authCheck = ensureOwnTrainerOrAdmin(query?.trainerId);
      if (!authCheck.ok) {
        return this.errorResponse({ message: authCheck.message, status: authCheck.status });
      }

      const data = await this.service.getBlockBackgrounds(query.trainerId!);
      const response = this.successResponse({
        status: StatusCode.OK,
        data,
        message: "Block backgrounds retrieved successfully!",
      });

      await this.afterAction(response);
      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };

  upsertBlockBackground = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const body = extractBodyFromEvent(event) as {
        trainerId?: string;
        status?: string;
        url?: string;
      };
      const authCheck = ensureOwnTrainerOrAdmin(body?.trainerId);
      if (!authCheck.ok) {
        return this.errorResponse({ message: authCheck.message, status: authCheck.status });
      }
      if (!body?.status || !body?.url) {
        return this.errorResponse({
          message: "status and url are required",
          status: StatusCode.BAD_REQUEST,
        });
      }

      const { error } = BlockBackgroundValidation.validate({
        status: body.status,
        url: body.url,
      });
      if (error) {
        return this.errorResponse({
          message: error.details.map((d) => d.message).join(", "),
          status: StatusCode.BAD_REQUEST,
        });
      }

      const data = await this.service.upsertBlockBackground(
        body.trainerId!,
        body.status as any,
        body.url
      );
      const response = this.successResponse({
        status: StatusCode.OK,
        data,
        message: "Block background saved successfully!",
      });

      await this.afterAction(response);
      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };

  deleteBlockBackground = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const body = extractBodyFromEvent(event) as {
        trainerId?: string;
        status?: string;
      };
      const authCheck = ensureOwnTrainerOrAdmin(body?.trainerId);
      if (!authCheck.ok) {
        return this.errorResponse({ message: authCheck.message, status: authCheck.status });
      }
      if (!body?.status) {
        return this.errorResponse({
          message: "status is required",
          status: StatusCode.BAD_REQUEST,
        });
      }

      const data = await this.service.deleteBlockBackground(
        body.trainerId!,
        body.status as any
      );
      const response = this.successResponse({
        status: StatusCode.OK,
        data,
        message: "Block background removed successfully!",
      });

      await this.afterAction(response);
      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };

  getBlockTipDefaults = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const query = extractQueryFromEvent(event) as { trainerId?: string };
      const authCheck = ensureOwnTrainerOrAdmin(query?.trainerId);
      if (!authCheck.ok) {
        return this.errorResponse({ message: authCheck.message, status: authCheck.status });
      }

      const data = await this.service.getBlockTipDefaults(query.trainerId!);
      const response = this.successResponse({
        status: StatusCode.OK,
        data,
        message: "Block tip defaults retrieved successfully!",
      });
      await this.afterAction(response);
      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };

  upsertBlockTipDefault = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const body = extractBodyFromEvent(event) as {
        trainerId?: string;
        status?: string;
        tips?: string[];
      };
      const authCheck = ensureOwnTrainerOrAdmin(body?.trainerId);
      if (!authCheck.ok) {
        return this.errorResponse({ message: authCheck.message, status: authCheck.status });
      }
      if (!body?.status || !Array.isArray(body?.tips)) {
        return this.errorResponse({
          message: "status and tips are required",
          status: StatusCode.BAD_REQUEST,
        });
      }

      const { error } = BlockTipDefaultValidation.validate({
        status: body.status,
        tips: body.tips,
      });
      if (error) {
        return this.errorResponse({
          message: error.details.map((d) => d.message).join(", "),
          status: StatusCode.BAD_REQUEST,
        });
      }

      const data = await this.service.upsertBlockTipDefault(
        body.trainerId!,
        body.status as any,
        body.tips
      );
      const response = this.successResponse({
        status: StatusCode.OK,
        data,
        message: "Block tip default saved successfully!",
      });
      await this.afterAction(response);
      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };

  deleteBlockTipDefault = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const body = extractBodyFromEvent(event) as {
        trainerId?: string;
        status?: string;
      };
      const authCheck = ensureOwnTrainerOrAdmin(body?.trainerId);
      if (!authCheck.ok) {
        return this.errorResponse({ message: authCheck.message, status: authCheck.status });
      }
      if (!body?.status) {
        return this.errorResponse({
          message: "status is required",
          status: StatusCode.BAD_REQUEST,
        });
      }

      const data = await this.service.deleteBlockTipDefault(
        body.trainerId!,
        body.status as any
      );
      const response = this.successResponse({
        status: StatusCode.OK,
        data,
        message: "Block tip default removed successfully!",
      });
      await this.afterAction(response);
      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };

  getDietTipGoals = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const query = extractQueryFromEvent(event) as { trainerId?: string };
      const authCheck = ensureOwnTrainerOrAdmin(query?.trainerId);
      if (!authCheck.ok) {
        return this.errorResponse({ message: authCheck.message, status: authCheck.status });
      }

      const data = await this.service.getDietTipGoals(query.trainerId!);
      const response = this.successResponse({
        status: StatusCode.OK,
        data,
        message: "Diet tip goals retrieved successfully!",
      });
      await this.afterAction(response);
      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };

  upsertDietTipGoal = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const body = extractBodyFromEvent(event) as {
        trainerId?: string;
        key?: string;
        label?: string;
        tips?: string[];
      };
      const authCheck = ensureOwnTrainerOrAdmin(body?.trainerId);
      if (!authCheck.ok) {
        return this.errorResponse({ message: authCheck.message, status: authCheck.status });
      }
      if (!body?.key || !body?.label || !Array.isArray(body?.tips)) {
        return this.errorResponse({
          message: "key, label and tips are required",
          status: StatusCode.BAD_REQUEST,
        });
      }

      const { error } = DietTipGoalValidation.validate({
        key: body.key,
        label: body.label,
        tips: body.tips,
      });
      if (error) {
        return this.errorResponse({
          message: error.details.map((d) => d.message).join(", "),
          status: StatusCode.BAD_REQUEST,
        });
      }

      const data = await this.service.upsertDietTipGoal(
        body.trainerId!,
        body.key,
        body.label,
        body.tips
      );
      const response = this.successResponse({
        status: StatusCode.OK,
        data,
        message: "Diet tip goal saved successfully!",
      });
      await this.afterAction(response);
      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };

  deleteDietTipGoal = async (
    event: APIGatewayProxyEvent
  ): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const body = extractBodyFromEvent(event) as {
        trainerId?: string;
        key?: string;
      };
      const authCheck = ensureOwnTrainerOrAdmin(body?.trainerId);
      if (!authCheck.ok) {
        return this.errorResponse({ message: authCheck.message, status: authCheck.status });
      }
      if (!body?.key) {
        return this.errorResponse({
          message: "key is required",
          status: StatusCode.BAD_REQUEST,
        });
      }

      const data = await this.service.deleteDietTipGoal(body.trainerId!, body.key);
      const response = this.successResponse({
        status: StatusCode.OK,
        data,
        message: "Diet tip goal removed successfully!",
      });
      await this.afterAction(response);
      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };

  delete = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    await this.beforeAction(event);

    try {
      const { id, error } = this.getParamsOrError(event, ["id"]);

      if (error) return error;

      const trainer = await this.service.deleteTrainer(id);
      const response = this.successResponse({
        status: StatusCode.OK,
        data: trainer,
        message: "Trainer deleted successfully!",
      });

      await this.afterAction(response);

      return response;
    } catch (err) {
      return this.errorResponse(err);
    }
  };
}
