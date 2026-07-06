import jwt from "jsonwebtoken";
import User from "../models/user.model";
import RefreshToken from "../models/refreshToken.model";
import { generateAccessToken, generateRefreshToken } from "../utils/generateToken";
import { IJwtPayload, LoginBody, RegisterBody } from "../types";

const getRefreshTokenExpiryDate = (): Date => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
};

export const registerUser = async (body: RegisterBody) => {
  const { name, email, password } = body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const err = new Error("User already exists");
    (err as any).statusCode = 409;
    throw err;
  }

  const user = await User.create({ name, email, password });
  return user;
};

export const loginUser = async (body: LoginBody) => {
  const { email, password } = body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    const err = new Error("Invalid email or password");
    (err as any).statusCode = 401;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error("Account is disabled");
    (err as any).statusCode = 403;
    throw err;
  }

  const accessToken = generateAccessToken({ _id: user._id.toString(), role: user.role });
  const refreshToken = generateRefreshToken({ _id: user._id.toString() });

  await RefreshToken.create({
    user: user._id as any,
    token: refreshToken,
    expiresAt: getRefreshTokenExpiryDate(),
  } as any);

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

export const refreshAccessTokenService = async (refreshToken: string) => {
  const storedToken = await RefreshToken.findOne({
    token: refreshToken,
    isRevoked: false,
  });

  if (!storedToken) {
    const err = new Error("Invalid refresh token");
    (err as any).statusCode = 403;
    throw err;
  }

  const decoded = jwt.verify(
    refreshToken,
    process.env.JWT_REFRESH_SECRET as string
  ) as IJwtPayload;

  const user = await User.findById(decoded.id);

  if (!user || !user.isActive) {
    const err = new Error("User not found or inactive");
    (err as any).statusCode = 403;
    throw err;
  }

  const newAccessToken = generateAccessToken({ _id: user._id.toString(), role: user.role });
  return { accessToken: newAccessToken };
};

export const logoutUser = async (refreshToken: string): Promise<void> => {
  await RefreshToken.findOneAndUpdate(
    { token: refreshToken },
    { isRevoked: true }
  );
};
