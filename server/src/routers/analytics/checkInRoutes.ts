import express from "express";
import { AnalyticsController } from "../../controllers/analyticsController";

const router = express.Router();

router.get(`/`, AnalyticsController.getAllCheckInUsers);

router.patch(`/:id`, AnalyticsController.checkOffUser);

export default router;
