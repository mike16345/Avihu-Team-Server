import express from "express";
import { validateWeighIn } from "../../middleware/weighInsMiddleware";
import WeighInController from "../../controllers/weighInsController";

const router = express.Router();

router.post("/:id", validateWeighIn, WeighInController.addWeighIn);

router.post("/bulk/:id", WeighInController.addManyWeighIns);

router.get("/:id", WeighInController.getWeighInsById);

router.get("/user/:id", WeighInController.getWeighInsByUserId);

router.delete("/:weighInId", WeighInController.deleteWeighInById);

router.delete("/user/:id", WeighInController.deleteUserWeighIns);

router.put("/:id", validateWeighIn, WeighInController.updateWeighIn);

export default router;
