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

router.post("/", authenticate, validate(createOrderSchema), ordersController.create);
router.get("/me", authenticate, ordersController.getMyOrders);
router.get("/seller/incoming", authenticate, authorize("seller"), ordersController.getIncomingOrders);
router.post("/:id/cancel", authenticate, ordersController.cancelOrder);
router.get("/:id", authenticate, validate(getOrderSchema), ordersController.getById);
router.patch("/:id/status", authenticate, authorize("seller"), validate(updateOrderStatusSchema), ordersController.updateStatus);

export default router;
