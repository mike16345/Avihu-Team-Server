import { Router } from "express";
import { DietPlanPresetController } from "../../controllers/dietPlanPresetController";
import { validateDietPlanPreset } from "../../middleware/dietPlanMiddleware";

export const router = Router();

router.get("/", DietPlanPresetController.getDietPlanPresets);

router.post("/", validateDietPlanPreset, DietPlanPresetController.addDietPlanPreset);

router.put("/:id", validateDietPlanPreset, DietPlanPresetController.updateDietPlanPreset);

router.delete("/:id", DietPlanPresetController.deleteDietPlanPreset);

export default router;
