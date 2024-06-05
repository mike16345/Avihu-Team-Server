import express from "express";
import { weighInsController } from "../controllers/weighInsController";

const router = express.Router();

router.post("/:id", weighInsController.addWeighIn);

router.get("/:id", weighInsController.getWeighInsByUserId);

router.delete("/:id", weighInsController.deleteWeighIns);

router.put("/:id", weighInsController.updateWeighIn);

export default router;
