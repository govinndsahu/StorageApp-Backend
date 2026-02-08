import Razorpay from "razorpay";
import Subscription from "../models/subscriptionModel.js";
import User from "../models/userModel.js";
import { spawn } from "child_process";
import crypto from "crypto";
import rzpInstance from "../config/razorpay.js";

export const PLANS = {
  // plan_S8wfYi15eCR8zL: {
  //   storageQuotaBytes: 2 * 1024 ** 3,
  //   accessLevel: 1
  // },
  plan_S9nWAqeA9tmsWd: {
    storageQuotaBytes: 2 * 1024 ** 3,
    accessLevel: 1,
  },
  plan_S8wpuHAaQpzWi2: {
    storageQuotaBytes: 2 * 1024 ** 3,
    accessLevel: 1,
  },
  // plan_S8wkQjs5WgcfEW: {
  //   storageQuotaBytes: 5 * 1024 ** 3,
  // accessLevel: 2
  // },
  plan_S9npNgRcj2NGAx: {
    storageQuotaBytes: 5 * 1024 ** 3,
    accessLevel: 2,
  },
  plan_S8wsxGtrzqGL3d: {
    storageQuotaBytes: 5 * 1024 ** 3,
    accessLevel: 2,
  },
  plan_S8wls3JKqs516M: {
    storageQuotaBytes: 10 * 1024 ** 3,
    accessLevel: 3,
  },
  plan_S8wtzbeNBj5Q17: {
    storageQuotaBytes: 10 * 1024 ** 3,
    accessLevel: 3,
  },
};

export const handleRazorpayWebhook = async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  res.end("OK");
  const isSignatureValid = Razorpay.validateWebhookSignature(
    JSON.stringify(req.body),
    signature,
    process.env.RAZORPAY_WEBHOOK_SECRET,
  );

  console.log(req.body.event);

  if (!isSignatureValid) {
    return console.log("Signature not verified");
  }

  if (
    req.body.event === "subscription.activated" ||
    req.body.event === "subscription.resumed"
  ) {
    const rzpSubscription = req.body.payload.subscription.entity;
    const planId = rzpSubscription.plan_id;
    const subscription = await Subscription.findOneAndUpdate(
      {
        razorpaySubscriptionId: rzpSubscription.id,
      },
      {
        status: rzpSubscription.status,
        accessLevel: PLANS[planId].accessLevel,
      },
    );

    const storageQuotaBytes = PLANS[planId].storageQuotaBytes;

    await User.findByIdAndUpdate(subscription.userId, {
      maxStorageInBytes: storageQuotaBytes,
    });

    const subscriptions = await Subscription.find({
      userId: subscription.userId,
      status: "active",
    });

    if (subscriptions.length > 1) {
      const oldSubscription = subscriptions.find(
        (s) => s.razorpaySubscriptionId !== rzpSubscription.id,
      );

      await rzpInstance.subscriptions.cancel(
        oldSubscription.razorpaySubscriptionId,
        false,
      );

      await Subscription.findOneAndDelete({
        razorpaySubscriptionId: oldSubscription.razorpaySubscriptionId,
      });
    }
  }

  if (req.body.event === "subscription.paused") {
    const rzpSubscription = req.body.payload.subscription.entity;

    const subscription = await Subscription.findOneAndUpdate(
      {
        razorpaySubscriptionId: rzpSubscription.id,
      },
      { status: req.body.event.split(".")[1], accessLevel: 0 },
    );

    await User.findByIdAndUpdate(subscription.userId, {
      maxStorageInBytes: 1 * 1024 ** 3,
    });
  }

  if (req.body.event === "subscription.cancelled") {
    const rzpSubscription = req.body.payload.subscription.entity;

    const subscription = await Subscription.findOne({
      razorpaySubscriptionId: rzpSubscription.id,
    });

    if (!subscription) {
      return console.log("subscription doesn't exist in database!");
    }

    await subscription.deleteOne();

    await User.findByIdAndUpdate(subscription.userId, {
      maxStorageInBytes: 1 * 1024 ** 3,
    });
  }
};

export const handleGitHubWebhook = async (req, res, next) => {
  try {
    const GitHubSignature = req.headers["x-hub-signature-256"];

    if (!GitHubSignature) return res.end("OK");

    const signature =
      "sha256=" +
      crypto
        .createHmac("sha256", "Gs12@087799")
        .update(JSON.stringify(req.body))
        .digest("hex");

    if (GitHubSignature !== signature) return res.end("OK");

    res.end("OK");

    const repositoryName = req.body.repository.name;

    const bashFile =
      repositoryName === "StorageApp-Frontend"
        ? "deploy-frontend-ec2.sh"
        : "deploy-backend.sh";

    console.log(repositoryName);
    console.log(bashFile);

    const bashChildProcess = spawn("bash", [`/home/ubuntu/${bashFile}`]);

    bashChildProcess.stdout.on("data", (data) => {
      process.stdout.write(data);
    });

    bashChildProcess.stderr.on("data", (data) => {
      process.stderr.write(data);
    });

    bashChildProcess.on("close", (code) => {
      if (code === 0) {
        console.log("Script executed successfully!");
      } else {
        console.log("Script execution failed!");
      }
    });

    bashChildProcess.on("error", (err) => {
      console.log("Error in spawning the process!");
      console.log(err);
    });
  } catch (error) {
    next(error);
  }
};
