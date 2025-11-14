import { Router } from "express";
import {
  createOrderController,
  listBuyerOrdersController,
  listSellerOrdersController,
  updateOrderStatusController,
} from "../controllers/order.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { validateBody } from "../middleware/validate.js";
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from "../schemas/order.schema.js";

const router = Router();

router.post(
  "/",
  authMiddleware,
  requireRole("buyer"),
  validateBody(createOrderSchema),
  createOrderController
);
router.get(
  "/me",
  authMiddleware,
  requireRole("buyer"),
  listBuyerOrdersController
);

router.get(
  "/seller/incoming",
  authMiddleware,
  requireRole("seller"),
  listSellerOrdersController
);
router.patch(
  "/:id/status",
  authMiddleware,
  requireRole("seller"),
  validateBody(updateOrderStatusSchema),
  updateOrderStatusController
);

export default router;
