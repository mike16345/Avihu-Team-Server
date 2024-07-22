import express from "express";
import userRouter from "./users";
import weighInsRouter from "./weighIns";
import workoutPlanRouter from "./workoutPlans";
import workoutPlanPresetRouter from "./workoutPlanPresets";
import recordedSetsRouter from "./recordedSets";
import dietPlansRouter from "./dietPlans";
import exercisePresetsRouter from "./exercisePresets";
import menuItemRouter from './menuItemPresets';

const router = express.Router();

router.use("/users", userRouter);
router.use("/weighIns", weighInsRouter);
router.use("/workoutPlans", workoutPlanRouter);
router.use("/workoutPlansPresets", workoutPlanPresetRouter);
router.use("/recordedSets", recordedSetsRouter);
router.use("/dietPlans", dietPlansRouter);
router.use("/presets/exercises", exercisePresetsRouter);
router.use("/menuItems", menuItemRouter);

export default router;
