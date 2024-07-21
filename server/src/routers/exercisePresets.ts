import express from "express";
import { exercisePresetController } from "../controllers/exercisePresetController";

const router = express.Router();

router.post(`/`, exercisePresetController.addExercise);
router.get(`/`, exercisePresetController.getExercises);
router.get(`/:id`, exercisePresetController.getExerciseById);
router.delete(`/:id`, exercisePresetController.deleteExercise);
router.put(`/:id`, exercisePresetController.updateExercise);

export default router;
