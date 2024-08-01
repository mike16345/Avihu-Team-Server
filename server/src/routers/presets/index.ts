import { Router } from "express";
import workoutPlanPresetRouter from "./workoutPlanPresets";
import menuItemRouter from "./menuItemPresets";
import exercisePresetRouter from "./exercisePresets";
import muscleGroupPresetsRouter from "./muscleGroupPresets";
import dietPlanPresetsRouter from "./dietPlanPresets";

const presetsRouter = Router();

presetsRouter.use("/workoutPlans", workoutPlanPresetRouter);
presetsRouter.use("/exercises", exercisePresetRouter);
presetsRouter.use("/muscleGroups", muscleGroupPresetsRouter);
presetsRouter.use("/menuItems", menuItemRouter);
presetsRouter.use("/dietPlans", dietPlanPresetsRouter);

export default presetsRouter;
