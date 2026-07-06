import jwt, { SignOptions } from "jsonwebtoken";

interface TokenUser {
  _id: string;
  role?: string;
}

const generateAccessToken = (user: TokenUser): string => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET as string,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRE || "15m" } as SignOptions
  );
};

const generateRefreshToken = (user: TokenUser): string => {
  return jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET as string,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRE || "7d" } as SignOptions
  );
};

export { generateAccessToken, generateRefreshToken };
