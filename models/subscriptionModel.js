import { model, Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    planName: {
      type: String,
      required: true,
    },
    razorpaySubscriptionId: {
      type: String,
      required: true,
    },
    accessLevel: {
      type: Number,
      default: 0,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: [
        "created",
        "active",
        "pending",
        "past_due",
        "paused",
        "canceled",
        "in_grace",
      ],
      default: "created",
    },
  },
  {
    strict: "throw",
    timestamps: true,
    versionKey: false,
  },
);

const Subscription = model("Subscription", subscriptionSchema);

export default Subscription;
