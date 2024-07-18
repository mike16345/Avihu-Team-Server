import express from "express";
import { validateWorkoutPreset } from "../middleware/workoutPlanMiddleware";
import { WorkoutPlanPresetsController } from "../controllers/workoutPlanPresetController";

const router = express.Router();

router.post("/", validateWorkoutPreset, WorkoutPlanPresetsController.addWorkoutPlanPreset);

export default router;
