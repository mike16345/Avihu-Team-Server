import express from "express";
import { dietPlanController } from "../controllers/dietPlanController";
import { validateDietPlan } from "../middleware/dietPlanMiddleware";

const router = express.Router();

router.post("/", validateDietPlan, dietPlanController.addDietPlan);

router.get("/", dietPlanController.getDietPlans);

router.get("/user/:id", dietPlanController.getDietPlanByUserId);

router.delete("/:id", dietPlanController.deleteDietPlan);

router.put("/:id", validateDietPlan, dietPlanController.updateDietPlan);

router.put("/user/:id", validateDietPlan, dietPlanController.updateDietPlanByUserId);

export default router;
