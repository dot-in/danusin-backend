import { Router } from "express";
import { StoreController } from "./store.controller.js";
import { authenticate } from "../../core/middlewares/auth.middleware.js";
import { validate } from "../../core/middlewares/validation.middleware.js";
import {
  createStoreSchema,
  updateStoreSchema,
  getStoreByIdSchema,
} from "./store.validation.js";

const router = Router();
const storeController = new StoreController();

// Get current user's store
router.get("/my", authenticate, storeController.getMyStore);

// Create store (upgrade to seller)
router.post(
  "/",
  authenticate,
  validate(createStoreSchema),
  storeController.createStore
);

// Update store
router.patch(
  "/",
  authenticate,
  validate(updateStoreSchema),
  storeController.updateStore
);

// Get store by ID (public)
router.get(
  "/:id",
  validate(getStoreByIdSchema),
  storeController.getStoreById
);

export default router;
