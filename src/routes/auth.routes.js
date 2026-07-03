const { Router } = require("express");
const { register, login, logout, refresh, getMe } = require("../controllers/auth.controller");
const { authenticate } = require("../moddleware/auth.middleware");

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", authenticate, logout);
router.post("/refresh", refresh);
router.get("/me", authenticate, getMe);

module.exports = router;
