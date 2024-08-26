import sessionsRouter from "./Sessions";
import { Router } from "express";

const router = Router();

router.use("/", sessionsRouter);

export default router;
