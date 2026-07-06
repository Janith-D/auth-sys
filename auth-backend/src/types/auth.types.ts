import { Request } from "express";
import { Document, ObjectId } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(enteredPassword: string): Promise<boolean>;
}

export interface IRefreshToken extends Document {
  user: ObjectId;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IJwtPayload {
  id: string;
  role?: string;
}

export interface AuthRequest extends Request {
  user?: IUser;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  accessToken?: string;
  refreshToken?: string;
  user?: T;
  stack?: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

export interface RefreshTokenBody {
  refreshToken: string;
}
