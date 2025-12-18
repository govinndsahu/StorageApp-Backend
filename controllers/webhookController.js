import Razorpay from "razorpay";
import Subscription from "../models/subscriptionModel.js";
import User from "../models/userModel.js";

export const PLANS = {
  plan_RpkRbZ15VUKwVv: {
    storageQuotaBytes: 2 * 1024 ** 3,
  },
  plan_RpkT5YPxO8Xepy: {
    storageQuotaBytes: 2 * 1024 ** 3,
  },
  plan_RpkUZZBhfeRzIu: {
    storageQuotaBytes: 5 * 1024 ** 3,
  },
  plan_RpkVvNRxSrioHR: {
    storageQuotaBytes: 5 * 1024 ** 3,
  },
  plan_RpkWmbpbzTwJ5a: {
    storageQuotaBytes: 10 * 1024 ** 3,
  },
  plan_RpkXniI9bBu7dG: {
    storageQuotaBytes: 10 * 1024 ** 3,
  },
};

export const handleRazorpayWebhook = async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  console.log(signature);
  const isSignatureValid = Razorpay.validateWebhookSignature(
    JSON.stringify(req.body),
    signature,
    process.env.RAZORPAY_WEBHOOK_SECRET
  );
  console.log(isSignatureValid);
  if (isSignatureValid) {
    if (req.body.event === "subscription.activated") {
      const rzpSubscription = req.body.payload.subscription.entity;
      const planId = rzpSubscription.plan_id;
      const subscription = await Subscription.findOne({
        razorpaySubscriptionId: rzpSubscription.id,
      });
      subscription.status = rzpSubscription.status;
      await subscription.save();
      const storageQuotaBytes = PLANS[planId].storageQuotaBytes;
      const user = await User.findById(subscription.userId);
      user.maxStorageInBytes = storageQuotaBytes;
      await user.save();
    }
  } else {
    console.log("Signature not verified");
  }
  res.end("OK");
};
