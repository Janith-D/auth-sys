const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const RefreshToken = require("../models/refreshToken.model");
const asyncHandler = require("../utils/asyncHandler");
const {
  generateAccessToken,
  generateRefreshToken
} = require("../utils/generateToken");

const getRefreshTokenExpiryDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
};

// REGISTER
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Name, email and password are required");
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error("Password must be at least 8 characters");
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    res.status(409);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    email,
    password
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// LOGIN
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error("Account is disabled");
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  await RefreshToken.create({
    user: user._id,
    token: refreshToken,
    expiresAt: getRefreshTokenExpiryDate()
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

// REFRESH ACCESS TOKEN
const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(401);
    throw new Error("Refresh token is required");
  }

  const storedToken = await RefreshToken.findOne({
    token: refreshToken,
    isRevoked: false
  });

  if (!storedToken) {
    res.status(403);
    throw new Error("Invalid refresh token");
  }

  const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

  const user = await User.findById(decoded.id);

  if (!user || !user.isActive) {
    res.status(403);
    throw new Error("User not found or inactive");
  }

  const newAccessToken = generateAccessToken(user);

  res.status(200).json({
    success: true,
    accessToken: newAccessToken
  });
});

// LOGOUT
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400);
    throw new Error("Refresh token is required");
  }

  await RefreshToken.findOneAndUpdate(
    { token: refreshToken },
    { isRevoked: true }
  );

  res.status(200).json({
    success: true,
    message: "Logout successful"
  });
});

// GET CURRENT USER
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
});

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  getMe
};