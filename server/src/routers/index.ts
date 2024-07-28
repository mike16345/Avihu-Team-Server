import express from "express";
import userRouter from "./users";
import weighInsRouter from "./weighIns";
import workoutPlanRouter from "./workoutPlans";
import workoutPlanPresetRouter from "./workoutPlanPresets";
import recordedSetsRouter from "./recordedSets";
import menuItemRouter from './menuItemPresets';
import dietPlanRouter from "./dietPlans";
import exercisePresetRouter from "./exercisePresets";
import muscleGroupPresetsRouter from "./muscleGroupPresets";

const router = express.Router();

router.use("/users", userRouter);
router.use("/weighIns", weighInsRouter);
router.use("/workoutPlans", workoutPlanRouter);
router.use("/workoutPlansPresets", workoutPlanPresetRouter);
router.use("/dietPlans", dietPlanRouter);
router.use("/presets/exercises", exercisePresetRouter);
router.use("/workoutPlansPresets", workoutPlanPresetRouter);
router.use("/presets/muscleGroups", muscleGroupPresetsRouter);
router.use("/recordedSets", recordedSetsRouter);
router.use("/menuItems", menuItemRouter);

export default router;
