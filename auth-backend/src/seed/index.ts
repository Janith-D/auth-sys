import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, "../.env") });

import mongoose from "mongoose";
import User from "../models/user.model";

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    console.log("Connected to MongoDB");

    await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: "password123",
      role: "admin",
    });

    await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "password123",
      role: "user",
    });

    console.log("Seed data created successfully");
    process.exit(0);
  } catch (error) {
    const err = error as Error;
    console.error(`Seed error: ${err.message}`);
    process.exit(1);
  }
};

seed();
