import express from "express";
import { MuscleGroupController } from "../controllers/muscleGroupController";
import { checkIfItemExixts } from "../middleware/muscleGroupMiddleWare";


const router = express.Router();

// Put a space between each route. 

router.get(`/`, MuscleGroupController.getAllMuscleGroups)
router.get(`/:id`, MuscleGroupController.getMuscleGroupById)
router.post(`/`, checkIfItemExixts, MuscleGroupController.addMuscleGroup)
router.put(`/:id`, MuscleGroupController.editMuscleGroup)
router.delete(`/:id`, MuscleGroupController.deleteMuscleGroup)

export default router