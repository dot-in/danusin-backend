import { Router } from "express";
import { UsersController } from "./user.controller.js";
import { validate } from "../../core/middlewares/validation.middleware.js";
import { authenticate } from "../../core/middlewares/auth.middleware.js";
import {
  getPublicProfileSchema,
  updateProfileSchema,
  updateEmailSchema,
  updatePhoneSchema,
  changePasswordSchema,
  createStoreSchema,
  getUserOrdersSchema,
} from "./user.validation.js";

const router = Router();
const usersController = new UsersController();

router.get("/:id/public-profile", validate(getPublicProfileSchema), usersController.getPublicProfile);
router.get("/me", authenticate, usersController.getMyProfile);
router.patch("/me", authenticate, validate(updateProfileSchema), usersController.updateProfile);
router.patch("/me/profile-image", authenticate, usersController.updateProfileImage);
router.patch("/me/email", authenticate, validate(updateEmailSchema), usersController.updateEmail);
router.patch("/me/phone", authenticate, validate(updatePhoneSchema), usersController.updatePhone);
router.patch("/me/password", authenticate, validate(changePasswordSchema), usersController.changePassword);
router.get("/me/orders", authenticate, validate(getUserOrdersSchema), usersController.getUserOrders);
router.post("/me/store", authenticate, validate(createStoreSchema), usersController.createStore);
router.get("/me/store", authenticate, usersController.getMyStore);

export default router;
