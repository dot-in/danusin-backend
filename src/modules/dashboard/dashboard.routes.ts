import { Router } from "express";
import { DashboardController } from "./dashboard.controller.js";
import {
  authenticate,
  authorize,
} from "../../core/middlewares/auth.middleware.js";

const router = Router();
const dashboardController = new DashboardController();

// Seller dashboard routes
router.get(
  "/seller/summary",
  authenticate,
  // authorize("seller"),
  dashboardController.getSellerSummary
);

// Alias for backward compatibility - /seller points to /seller/summary
router.get(
  "/seller",
  authenticate,
  // authorize("seller"),
  dashboardController.getSellerSummary
);

// Buyer dashboard routes
router.get(
  "/buyer/summary",
  authenticate,
  // authorize("buyer"),
  dashboardController.getBuyerSummary
);

// Alias for backward compatibility - /buyer points to /buyer/summary
router.get(
  "/buyer",
  authenticate,
  // authorize("buyer"),
  dashboardController.getBuyerSummary
);

export default router;
