import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeInstance = stripe(stripeSecretKey);

export const processPayment = catchAsyncErrors(async (req, res, next) => {
  const myPayment = await stripeInstance.paymentIntents.create({
    amount: req.body.amount,
    currency: "inr",
    metadata: {
      company: process.env.COMPANY_NAME,
    },
  });

  res.status(200).json({ success: true, client_secret: myPayment.client_secret });
});

export const sendStripeApiKey = catchAsyncErrors(async (req, res, next) => {
  const stripeApiKey = process.env.STRIPE_API_KEY;
  res.status(200).json({ stripeApiKey });
});
