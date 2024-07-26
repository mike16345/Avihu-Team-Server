import { Request, Response } from "express";
import { DietPlanServices } from "../services/dietPlanService";
import { DietPlanSchemaValidation } from "../models/dietPlanModel";
import { StatusCode } from "../enums/StatusCode";

class DietPlanController {
  addDietPlan = async (req: Request, res: Response) => {
    const dietPlan = req.body;

    try {
      const dietPlanResult = await DietPlanServices.addDietPlan(dietPlan);

      return res.status(StatusCode.CREATED).send(dietPlanResult);
    } catch (err: any) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  };

  updateDietPlan = async (req: Request, res: Response) => {
    const dietPlanId = req.params.id;
    const newDietPlan = req.body;

    try {
      const updatedDietPlan = await DietPlanServices.updateDietPlan(dietPlanId, newDietPlan);

      return res.status(StatusCode.OK).send(updatedDietPlan);
    } catch (err: any) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  };

  async updateDietPlanByUserId(req: Request, res: Response) {
    const userId = req.params.id;
    const newDietPlan = req.body;

    try {
      const updatedDietPlan = await DietPlanServices.updateDietPlanByUserId(userId, newDietPlan);

      return res.status(StatusCode.OK).send(updatedDietPlan);
    } catch (err: any) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  }

  deleteDietPlan = async (req: Request, res: Response) => {
    const userId = req.params.id;

    try {
      const response = await DietPlanServices.deleteDietPlan(userId);

      if (typeof response == "string") {
        res.status(404).send({ message: response });
      }

      return res.status(StatusCode.OK).send(response);
    } catch (err: any) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  };

  deleteDietPlanByUserId = async (req: Request, res: Response) => {
    const dietPlanId = req.params.id;

    try {
      const response = await DietPlanServices.deleteDietPlanByUserId(dietPlanId);

      return res.status(StatusCode.OK).send(response);
    } catch (err: any) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  };

  getDietPlans = async (req: Request, res: Response) => {
    try {
      const dietPlans = await DietPlanServices.getAllDietPlans();

      res.status(StatusCode.OK).send(dietPlans);
    } catch (err: any) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  };

  getDietPlanById = async (req: Request, res: Response) => {
    const dietPlanId = req.params.id;

    if (!dietPlanId || typeof dietPlanId !== "string") {
      return res
        .status(StatusCode.BAD_REQUEST)
        .send({ message: "Diet Plan ID is required and should be a string." });
    }

    try {
      const dietPlan = await DietPlanServices.getDietPlanById(dietPlanId);

      return res.status(StatusCode.OK).send(dietPlan);
    } catch (err: any) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  };

  getDietPlanByUserId = async (req: Request, res: Response) => {
    const userId = req.params.id;

    if (!userId || typeof userId !== "string") {
      return res
        .status(StatusCode.BAD_REQUEST)
        .send({ message: "User ID is required and should be a string." });
    }

    try {
      const dietPlan = await DietPlanServices.getDietPlanByUserId(userId);

      return res.status(StatusCode.OK).send(dietPlan);
    } catch (err: any) {
      return res.status(StatusCode.INTERNAL_SERVER_ERROR).send({ message: err.message });
    }
  };
}

export const dietPlanController = new DietPlanController();
