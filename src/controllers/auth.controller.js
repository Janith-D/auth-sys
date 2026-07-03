const User = require("../models/user.model");
const RefreshToken = require("../models/refreshToken.model");
const asyncHandler = require("../utils/asyncHandler");
const { generateAccessToken, generateRefreshToken } = require("../utils/generateToken");
const jwt = require("jsonwebtoken");

const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(400).json({ message: "Email already in use" });
  }

  const user = await User.create({ name, email, password });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  await RefreshToken.create({ token: refreshToken, user: user._id });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  await RefreshToken.create({ token: refreshToken, user: user._id });

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
  });
});

const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;
  if (refreshToken) {
    await RefreshToken.findOneAndDelete({ token: refreshToken });
  }

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  res.json({ success: true, message: "Logged out successfully" });
});

const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;
  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token" });
  }

  const stored = await RefreshToken.findOne({ token: refreshToken });
  if (!stored) {
    return res.status(401).json({ message: "Invalid refresh token" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const accessToken = generateAccessToken(decoded.id);
    const newRefreshToken = generateRefreshToken(decoded.id);

    await RefreshToken.findByIdAndDelete(stored._id);
    await RefreshToken.create({ token: newRefreshToken, user: decoded.id });

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, accessToken });
  } catch {
    await RefreshToken.findByIdAndDelete(stored._id);
    return res.status(401).json({ message: "Refresh token expired" });
  }
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});

module.exports = { register, login, logout, refresh, getMe };
