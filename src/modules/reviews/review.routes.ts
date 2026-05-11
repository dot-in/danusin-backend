import { Router } from "express";
import { ReviewController } from "./review.controller.js";
import { authenticate } from "../../core/middlewares/auth.middleware.js";
import { validate } from "../../core/middlewares/validation.middleware.js";
import { createReviewSchema, getProductReviewsSchema } from "./review.validation.js";

const router = Router();
const reviewController = new ReviewController();

router.post("/", authenticate, validate(createReviewSchema), reviewController.create);
router.get("/product/:id", validate(getProductReviewsSchema), reviewController.getProductReviews);

export default router;
