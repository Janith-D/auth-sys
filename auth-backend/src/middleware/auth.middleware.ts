import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import asyncHandler from "../utils/asyncHandler";
import { AuthRequest, IJwtPayload } from "../types";

const protect = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      res.status(401);
      throw new Error("Not authorized, token missing");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET as string
    ) as IJwtPayload;

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      res.status(401);
      throw new Error("User not found");
    }

    if (!user.isActive) {
      res.status(403);
      throw new Error("Account is disabled");
    }

    req.user = user;
    next();
  }
);

const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error("You do not have permission");
    }
    next();
  };
};

export { protect, authorizeRoles };
