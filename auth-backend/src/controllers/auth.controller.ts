import { Response, NextFunction } from "express";
import asyncHandler from "../utils/asyncHandler";
import * as authService from "../service/auth.service";
import { AuthRequest, RegisterBody, LoginBody, RefreshTokenBody } from "../types";

export const register = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body as RegisterBody;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error("Name, email and password are required");
    }

    if (password.length < 8) {
      res.status(400);
      throw new Error("Password must be at least 8 characters");
    }

    const user = await authService.registerUser({ name, email, password });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  }
);

export const login = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { email, password } = req.body as LoginBody;

    if (!email || !password) {
      res.status(400);
      throw new Error("Email and password are required");
    }

    const result = await authService.loginUser({ email, password });

    res.status(200).json({
      success: true,
      message: "Login successful",
      ...result,
    });
  }
);

export const refreshAccessToken = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body as RefreshTokenBody;

    if (!refreshToken) {
      res.status(401);
      throw new Error("Refresh token is required");
    }

    const result = await authService.refreshAccessTokenService(refreshToken);

    res.status(200).json({
      success: true,
      ...result,
    });
  }
);

export const logout = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { refreshToken } = req.body as RefreshTokenBody;

    if (!refreshToken) {
      res.status(400);
      throw new Error("Refresh token is required");
    }

    await authService.logoutUser(refreshToken);

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  }
);

export const getMe = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  }
);
