import { Router } from "express";
import { DashboardController } from "./dashboard.controller.js";
import { authenticate, authorize } from "../../core/middlewares/auth.middleware.js";

const router = Router();
const dashboardController = new DashboardController();

router.get("/seller/summary", authenticate, authorize("seller"), dashboardController.getSellerSummary);
router.get("/buyer/summary", authenticate, dashboardController.getBuyerSummary);

export default router;
