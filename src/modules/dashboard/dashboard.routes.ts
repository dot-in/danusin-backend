import { Router } from "express";
import { DashboardController } from "./dashboard.controller.js";
import {
  authenticate,
} from "../../core/middlewares/auth.middleware.js";

const router = Router();
const dashboardController = new DashboardController();

router.get(
  "/seller/summary",
  authenticate,
  dashboardController.getSellerSummary
);

router.get(
  "/seller",
  authenticate,
  dashboardController.getSellerSummary
);

router.get(
  "/buyer/summary",
  authenticate,
  dashboardController.getBuyerSummary
);

router.get(
  "/buyer",
  authenticate,
  dashboardController.getBuyerSummary
);

export default router;
