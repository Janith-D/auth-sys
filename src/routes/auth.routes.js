const express = require("express");
const {
  register,
  login,
  refreshAccessToken,
  logout,
  getMe
} = require("../controllers/auth.controller");

const {
  protect,
  authorizeRoles
} = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", logout);

router.get("/me", protect, getMe);

// Example admin-only route
router.get("/admin-only", protect, authorizeRoles("admin"), (req, res) => {
  res.json({
    success: true,
    message: "Welcome admin"
  });
});

module.exports = router;