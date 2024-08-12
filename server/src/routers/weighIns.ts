import express from "express";
import { weighInsController } from "../controllers/weighInsController";
import { validateWeighIn } from "../middleware/weighInsMiddleware";

const router = express.Router();

router.post("/:id", validateWeighIn, weighInsController.addWeighIn);

router.post("/bulk/:id", weighInsController.addManyWeighIns);

router.get("/:id", weighInsController.getWeighInsByUserId);

router.get("/user/:id", weighInsController.getWeighInsByUserId);

router.delete("/:weighInId", weighInsController.deleteWeighInById);

router.delete("/user/:id", weighInsController.deleteUserWeighIns);

router.put("/:id", validateWeighIn, weighInsController.updateWeighIn);

export default router;
