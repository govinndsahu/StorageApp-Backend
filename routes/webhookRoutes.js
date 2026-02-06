import express from "express";
import {
  handleGitHubWebhook,
  handleRazorpayWebhook,
} from "../controllers/webhookController.js";
import {
  githubWebhookLimiter,
  razorpayWebhookLimiter,
} from "../utils/limiter.js";

const router = express.Router();

router.post("/razorpay", razorpayWebhookLimiter, handleRazorpayWebhook);

router.post("/github", githubWebhookLimiter, handleGitHubWebhook);

export default router;
