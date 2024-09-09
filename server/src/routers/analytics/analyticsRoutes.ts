import express from "express";
import { AnalyticsController } from "../../controllers/analyticsController";

const router = express.Router();

router.get(`/:collection`, AnalyticsController.getUsersWithNoPlans);
router.get(`/users/expiring`, AnalyticsController.getUsersFinishingThisMonth);

export default router;
