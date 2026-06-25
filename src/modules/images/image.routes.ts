import { Router } from "express";
import { ImageController } from "./image.controller.js";
import { authenticate } from "../../core/middlewares/auth.middleware.js";
import { validate } from "../../core/middlewares/validation.middleware.js";
import {
  createImageSchema,
  updateImageSchema,
  getImagesQuerySchema,
  reorderImagesSchema,
  bulkCreateImagesSchema,
} from "./image.validation.js";

const router = Router();
const imageController = new ImageController();

router.get("/", validate(getImagesQuerySchema), imageController.getByEntity);
router.get("/:id", imageController.getById);
router.post("/", authenticate, validate(createImageSchema), imageController.create);
router.post("/bulk", authenticate, validate(bulkCreateImagesSchema), imageController.bulkCreate);
router.put("/:id", authenticate, validate(updateImageSchema), imageController.update);
router.patch("/:id/primary", authenticate, imageController.setPrimary);
router.delete("/:id", authenticate, imageController.delete);
router.post("/reorder", authenticate, validate(reorderImagesSchema), imageController.reorder);

export default router;
