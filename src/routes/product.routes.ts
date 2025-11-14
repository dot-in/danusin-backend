import { Router } from "express";
import {
  createProductController,
  updateProductController,
  deleteProductController,
  getProductController,
  listProductsController,
  listSellerProductsController,
} from "../controllers/product.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { requireRole } from "../middleware/role.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
  createProductSchema,
  updateProductSchema,
} from "../schemas/product.schema.js";
import { listProductsQuerySchema } from "../schemas/query.schema.js";

const router = Router();

router.get("/", validateQuery(listProductsQuerySchema), listProductsController);
router.get(
  "/me/mine",
  authMiddleware,
  requireRole("seller"),
  listSellerProductsController
);
router.get("/:id", getProductController);

router.post(
  "/",
  authMiddleware,
  requireRole("seller"),
  validateBody(createProductSchema),
  createProductController
);
router.put(
  "/:id",
  authMiddleware,
  requireRole("seller"),
  validateBody(updateProductSchema),
  updateProductController
);
router.delete(
  "/:id",
  authMiddleware,
  requireRole("seller"),
  deleteProductController
);

export default router;
