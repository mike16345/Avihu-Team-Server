import { Request, Response } from "express";
import { DietPlanServices } from "../services/dietPlanService";
import { DietPlanSchemaValidation } from "../models/dietPlanModel";

class DietPlanController {
  addDietPlan = async (req: Request, res: Response) => {
    const data = req.body;

    try {
      const dietPlanResult = await DietPlanServices.addDietPlan(data);

      return res.status(201).json(dietPlanResult);
    } catch (err) {
      return res.status(500).json({ message: "An error occurred while adding the diet plan." });
    }
  };

  updateDietPlan = async (req: Request, res: Response) => {
    const dietPlanId = req.params.id;
    const newDietPlan = req.body;

    const { error, value } = DietPlanSchemaValidation.validate(newDietPlan);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    try {
      const updatedDietPlan = await DietPlanServices.updateDietPlan(dietPlanId, value);

      return res.status(200).json(updatedDietPlan);
    } catch (err) {
      return res.status(500).json({ message: "An error occurred while updating the diet plan." });
    }
  };

  deleteDietPlan = async (req: Request, res: Response) => {
    const userId = req.params.id;

    try {
      const response = await DietPlanServices.deleteDietPlan(userId);

      return res.status(200).json(response);
    } catch (err) {
      return res.status(500).json({ message: "An error occurred while deleting the diet plan." });
    }
  };

  getDietPlans = async (req: Request, res: Response) => {
    try {
      const dietPlans = await DietPlanServices.getAllDietPlans();

      res.status(201).send(dietPlans);
    } catch (err) {
      return res
        .status(500)
        .send({ message: "An error occurred while retrieving all diet plans." });
    }
  };

  getDietPlanByUserId = async (req: Request, res: Response) => {
    const { id: userId } = req.query;

    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ message: "User ID is required and should be a string." });
    }

    try {
      const dietPlan = await DietPlanServices.getDietPlanByUserId(userId as string);

      return res.status(200).json(dietPlan);
    } catch (err) {
      return res.status(500).json({ message: "An error occurred while retrieving the diet plan." });
    }
  };
}

export const dietPlanController = new DietPlanController();
