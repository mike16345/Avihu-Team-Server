import { Router } from "express";
import SessionController from "../../controllers/SessionController";

const router = Router();

router.post("/", SessionController.startSession);

router.get("/", SessionController.getAllSessions);

router.get("/:sessionId", SessionController.getSessionById);

router.get("/type/:type", SessionController.getSessionsByType);

router.get("/user/:id", SessionController.getSessionsByUserId);

router.put("/:sessionId", SessionController.refreshSession);

router.delete("/all", SessionController.endAllSessions);

router.delete("/:sessionId", SessionController.endSession);

export default router;
