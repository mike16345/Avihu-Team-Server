import { Router } from "express";
import SessionController from "../../controllers/SessionController";

const router = Router();

router.post("/", SessionController.startSession);

router.get("/:sessionId", SessionController.getSessionById);

router.put("/:sessionId", SessionController.refreshSession);

router.delete("/:sessionId", SessionController.endSession);

export default router;
