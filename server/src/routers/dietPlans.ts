import express from "express";
import { dietPlanController } from "../controllers/dietPlanController";
import { validateDietPlan } from "../middleware/dietPlanMiddleware";

const router = express.Router();

router.post("/", validateDietPlan, dietPlanController.addDietPlan);

router.get("/", dietPlanController.getDietPlans);

router.get("/:id", dietPlanController.getDietPlanByUserId);

router.delete("/:id", dietPlanController.deleteDietPlan);

router.put("/:id", dietPlanController.updateDietPlan);

export default router;
