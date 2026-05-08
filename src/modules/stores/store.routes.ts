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

router.get("/my", authenticate, storeController.getMyStore);
router.post("/", authenticate, validate(createStoreSchema), storeController.createStore);
router.patch("/", authenticate, validate(updateStoreSchema), storeController.updateStore);
router.get("/:id", validate(getStoreByIdSchema), storeController.getStoreById);

export default router;
