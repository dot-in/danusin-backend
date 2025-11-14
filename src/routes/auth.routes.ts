import { Router } from "express";
import {
  registerController,
  loginController,
  profileController,
  updateProfileController,
  upgradeSellerController,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  upgradeSellerSchema,
} from "../schemas/auth.schema.js";

const router = Router();

router.post("/register", validateBody(registerSchema), registerController);
router.post("/login", validateBody(loginSchema), loginController);
router.get("/me", authMiddleware, profileController);
router.put(
  "/me",
  authMiddleware,
  validateBody(updateProfileSchema),
  updateProfileController
);
router.post(
  "/upgrade-seller",
  authMiddleware,
  validateBody(upgradeSellerSchema),
  upgradeSellerController
);

export default router;
