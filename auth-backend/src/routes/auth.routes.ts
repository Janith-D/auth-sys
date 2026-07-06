import { Router, Request, Response } from "express";
import {
  register,
  login,
  refreshAccessToken,
  logout,
  getMe,
} from "../controllers/auth.controller";
import { protect, authorizeRoles } from "../middleware/auth.middleware";
import { AuthRequest } from "../types";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.get(
  "/admin-only",
  protect,
  authorizeRoles("admin"),
  (req: AuthRequest, res: Response) => {
    res.json({
      success: true,
      message: "Welcome admin",
    });
  }
);

export default router;
