import { Router } from "express";
import workoutPlanPresetRouter from "./workoutPlanPresets";
import exercisePresetRouter from "./exercisePresets";

const presetsRouter = Router();

presetsRouter.use("/workoutPlans", workoutPlanPresetRouter);
presetsRouter.use("/exercises", exercisePresetRouter);

export default presetsRouter;
