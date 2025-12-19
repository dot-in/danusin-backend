import { Router } from "express";
import { AuthController } from "./auth.controller.js";
import { authenticate } from "../../core/middlewares/auth.middleware.js";
import { validate } from "../../core/middlewares/validation.middleware.js";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
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

// Note: upgrade-seller has been replaced with create-store in users module
// Use POST /users/me/store instead

export default router;
