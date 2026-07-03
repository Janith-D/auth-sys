const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const errorMiddleware = require("./moddleware/error.middleware");
const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP",
});
app.use("/api", limiter);

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Auth system API" });
});

app.use(errorMiddleware);

module.exports = app;
