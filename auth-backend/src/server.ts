import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, ".env") });

import app from "./app";
import connectDB from "./db/connection";

const PORT = process.env.PORT || 5000;

connectDB();

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

process.on("unhandledRejection", (err: Error) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});
