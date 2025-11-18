import { Router } from "express";
import { UsersController } from "./user.controller.js";
import { validate } from "../../core/middlewares/validation.middleware.js";
import { getPublicProfileSchema } from "./user.validation.js";

const router = Router();
const usersController = new UsersController();

router.get(
  "/:id/public-profile",
  validate(getPublicProfileSchema),
  usersController.getPublicProfile
);

export default router;
