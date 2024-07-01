import express from "express";
import { workoutPlanController } from "../controllers/workoutPlanController";

const router = express.Router();

router.post("/", workoutPlanController.addWorkoutPlan);

// router.put("/:id", workoutPlanController.updateWorkoutPlan);

router.put("/:id", workoutPlanController.updateWorkoutPlanByUserId);

router.delete("/:id", workoutPlanController.deleteWorkoutPlan);

router.get("/", workoutPlanController.getAllWorkoutPlans);

router.get("/:id", workoutPlanController.getWorkoutPlanById);

export default router;
