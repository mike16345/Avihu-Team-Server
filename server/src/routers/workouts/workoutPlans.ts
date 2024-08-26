import express from "express";
import { workoutPlanController } from "../../controllers/workoutPlanController";
import { validateWorkoutPlan } from "../../middleware/workoutPlanMiddleware";

const router = express.Router();

router.post("/:userId", validateWorkoutPlan, workoutPlanController.addWorkoutPlan);

router.put("/:id", validateWorkoutPlan, workoutPlanController.updateWorkoutPlan);

router.put("/user/:userId", validateWorkoutPlan, workoutPlanController.updateWorkoutPlanByUserId);

router.delete("/:id", workoutPlanController.deleteWorkoutPlan);

router.get("/", workoutPlanController.getAllWorkoutPlans);

router.get("/:id", workoutPlanController.getWorkoutPlanById);

router.get("/user/:userId", workoutPlanController.getWorkoutPlanByUserId);

export default router;
