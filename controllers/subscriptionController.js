import rzpInstance from "../config/razorpay.js";
import Subscription from "../models/subscriptionModel.js";

export const createSubscription = async (req, res, next) => {
  try {
    const existingSubscription = await Subscription.findOne({
      userId: req.user._id,
    }).lean();

    if (existingSubscription) {
      const subscription = await rzpInstance.subscriptions.fetch(
        existingSubscription.razorpaySubscriptionId,
      );

      if (subscription.plan_id === req.body.planId) {
        if (subscription.status === "active") {
          return res.status(409).json({
            message: "Plan is already active!",
          });
        } else {
          return res.status(201).json({ subscriptionId: subscription.id });
        }
      }
    }

    const newSubscription = await rzpInstance.subscriptions.create({
      plan_id: req.body.planId,
      total_count: 120,
    });

    const subscription = new Subscription({
      razorpaySubscriptionId: newSubscription.id,
      userId: req.user._id,
    });

    await subscription.save();

    return res.status(201).json({ subscriptionId: newSubscription.id });
  } catch (error) {
    next(error);
  }
};
