import { rateLimit } from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 1000 * 60 * 30,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

export const renameLimiter = rateLimit({
  windowMs: 1000 * 60,
  limit: 15,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

export const razorpayWebhookLimiter = rateLimit({
  windowMs: 1000 * 60,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

export const githubWebhookLimiter = rateLimit({
  windowMs: 1000 * 60,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
