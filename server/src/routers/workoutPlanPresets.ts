import express from "express";
import { validateWorkoutPreset } from "../middleware/workoutPlanMiddleware";
import { WorkoutPlanPresetsController } from "../controllers/workoutPlanPresetController";

const router = express.Router();

router.get("/", WorkoutPlanPresetsController.getAllWorkoutPlanPresets);

router.post("/", validateWorkoutPreset, WorkoutPlanPresetsController.addWorkoutPlanPreset);

router.put(
  "/:presetId",
  validateWorkoutPreset,
  WorkoutPlanPresetsController.updateWorkoutPlanPreset
);

router.delete("/:presetId", WorkoutPlanPresetsController.deleteWorkoutPlanPreset);

export default router;
