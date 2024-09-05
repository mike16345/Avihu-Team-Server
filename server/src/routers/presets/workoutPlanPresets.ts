import express from "express";
import { WorkoutPlanPresetsController } from "../../controllers/workoutPlanPresetController";
import { validateWorkoutPlanPreset } from "../../middleware/workoutPlanMiddleware";

const router = express.Router();

router.get("/", WorkoutPlanPresetsController.getAllWorkoutPlanPresets);
router.get("/:presetId", WorkoutPlanPresetsController.getWorkoutPlanPresetById);
router.post("/", validateWorkoutPlanPreset, WorkoutPlanPresetsController.addWorkoutPlanPreset);
router.put(
  "/:presetId",
  validateWorkoutPlanPreset,
  WorkoutPlanPresetsController.updateWorkoutPlanPreset
);

router.delete("/:presetId", WorkoutPlanPresetsController.deleteWorkoutPlanPreset);

export default router;
