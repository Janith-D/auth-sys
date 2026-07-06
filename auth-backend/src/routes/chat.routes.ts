import { Router } from "express";
import {
  getConversations,
  getMessages,
  sendMessage,
  getUsers,
} from "../controllers/chat.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

router.use(protect);

router.get("/conversations", getConversations);
router.get("/users", getUsers);
router.get("/messages/:userId", getMessages);
router.post("/send", sendMessage);

export default router;
