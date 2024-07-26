import express from "express";
import userRouter from "./users";
import weighInsRouter from "./weighIns";
import workoutPlanRouter from "./workoutPlans";
import workoutPlanPresetRouter from "./workoutPlanPresets";
import dietPlanRouter from "./dietPlans";
import recordSetsRouter from "./recordedSets";

const router = express.Router();

router.use("/users", userRouter);
router.use("/weighIns", weighInsRouter);
router.use("/workoutPlans", workoutPlanRouter);
router.use("/workoutPlansPresets", workoutPlanPresetRouter);
router.use("/dietPlans", dietPlanRouter);
router.use("/recordedSets", recordSetsRouter);

export default router;
