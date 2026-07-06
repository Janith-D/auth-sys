import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 500,
  message: {
    success: false,
    message: "Too many requests, please try again later",
  },
});

export default authLimiter;
