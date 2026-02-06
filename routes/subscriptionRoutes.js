import express from "express";
import { createSubscription } from "../controllers/subscriptionController.js";
import { throttle } from "../utils/helpers.js";

const router = express.Router();

router.post("/create/subscription", throttle(2), createSubscription);

export default router;
