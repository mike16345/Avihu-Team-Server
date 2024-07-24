import express from "express";
import { exercisePresetController } from "../controllers/exercisePresetController";
import { validateExercise } from "../middleware/exercisePresetMiddleware";


const router = express.Router();

router.post(`/`, validateExercise, exercisePresetController.addExercise);
router.get(`/`, exercisePresetController.getExercises);
router.get(`/:id`, exercisePresetController.getExerciseById);
router.delete(`/:id`, exercisePresetController.deleteExercise);
router.put(`/:id`, validateExercise, exercisePresetController.updateExercise);

export default router