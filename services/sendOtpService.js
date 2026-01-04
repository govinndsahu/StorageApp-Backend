import { Resend } from "resend";
import OTP from "../models/otpModel.js";

const resend = new Resend(process.env.EMAIL_RESEND_KEY);

export const sendOtpService = async (email) => {
  const otp = Math.floor(Math.random() * 9000 + 1000).toString();

  await OTP.findOneAndUpdate(
    { email },
    { otp, createdAt: new Date() },
    { upsert: true }
  );

  const html = `
  <div style="font-family:sans-sarif;">
    <h2>Your OTP is: ${otp}</h2>
    <p>This OTP is valid for 10 minutes.</p>
  </div>
  `;

  await resend.emails.send({
    from: "Storage App <otp@govindsahu.me>",
    to: email,
    subject: "Storage App OTP",
    html,
  });

  return { success: true, message: "OTP sent successfully" };
};
