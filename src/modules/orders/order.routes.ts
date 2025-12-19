import { Router } from "express";
import { OrdersController } from "./order.controller.js";
import {
  authenticate,
  authorize,
} from "../../core/middlewares/auth.middleware.js";
import { validate } from "../../core/middlewares/validation.middleware.js";
import {
  createOrderSchema,
  getOrderSchema,
  updateOrderStatusSchema,
} from "./order.validation.js";

const router = Router();
const ordersController = new OrdersController();

router.post(
  "/",
  authenticate,
  // authorize("buyer"),
  validate(createOrderSchema),
  ordersController.create
);
router.get(
  "/me",
  authenticate,
  // authorize("buyer"),
  ordersController.getMyOrders
);
router.get(
  "/seller/incoming",
  authenticate,
  // authorize("seller"),
  ordersController.getIncomingOrders
);

// Alias route for backward compatibility / convenience
// GET /seller-orders -> same handler as /seller/incoming
// Alias for backward compatibility
router.get(
  "/seller-orders",
  authenticate,
  // authorize("seller"),
  ordersController.getIncomingOrders
);

// Allow buyer to cancel their order
// Example: POST /orders/:id/cancel
router.post(
  "/:id/cancel",
  authenticate,
  ordersController.cancelOrder
);

router.get(
  "/:id",
  authenticate,
  validate(getOrderSchema),
  ordersController.getById
);
router.patch(
  "/:id/status",
  authenticate,
  // authorize("seller"),
  validate(updateOrderStatusSchema),
  ordersController.updateStatus
);

export default router;
