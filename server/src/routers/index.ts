import express from "express";
import userRouter from "./users";
import weighInsRouter from "./weighIns/";
import workoutPlanRouter from "./workoutPlans";
import dietPlanRouter from "./dietPlans";
import recordSetsRouter from "./recordedSets";
import presetsRouter from "./presets/";

const router = express.Router();

router.use("/users", userRouter);
router.use("/weighIns", weighInsRouter);
router.use("/workoutPlans", workoutPlanRouter);
router.use("/dietPlans", dietPlanRouter);
router.use("/recordedSets", recordSetsRouter);
router.use("/presets", presetsRouter);

export default router;
