import express from "express";
import { dietPlanController } from "../controllers/dietPlanController";

const router = express.Router();

router.post("/:id", dietPlanController.addDietPlan);

router.get("/:id", dietPlanController.getDietPlanByUserId);

router.delete("/:id", dietPlanController.deleteDietPlan);

router.put("/:id", dietPlanController.updateDietPlan);

export default router;
