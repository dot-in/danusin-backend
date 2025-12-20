import { Router } from "express";
import { ProductsController } from "./product.controller.js";
import {
  authenticate,
} from "../../core/middlewares/auth.middleware.js";
import { validate } from "../../core/middlewares/validation.middleware.js";
import {
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
  getProductSchema,
  getProductsSchema,
} from "./product.validation.js";

const router = Router();
const productsController = new ProductsController();

router.get("/", validate(getProductsSchema), productsController.getAll);
router.get(
  "/me/mine",
  authenticate,
  productsController.getMine
);
router.get("/:id", validate(getProductSchema), productsController.getById);
router.post(
  "/",
  authenticate,
  validate(createProductSchema),
  productsController.create
);
router.put(
  "/:id",
  authenticate,
  validate(updateProductSchema),
  productsController.update
);
router.delete(
  "/:id",
  authenticate,
  validate(deleteProductSchema),
  productsController.delete
);

export default router;
