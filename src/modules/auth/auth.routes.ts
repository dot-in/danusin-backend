import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { authenticate } from "../../core/middlewares/auth.middleware.js";
import { validate } from "../../core/middlewares/validation.middleware.js";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  upgradeSellerSchema,
} from "./auth.validation.js";

const router = Router();
const authController = new AuthController();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.get("/me", authenticate, authController.getMe);
router.put(
  "/me",
  authenticate,
  validate(updateProfileSchema),
  authController.updateMe
);
router.post(
  "/upgrade-seller",
  authenticate,
  validate(upgradeSellerSchema),
  authController.upgradeSeller
);

export default router;
