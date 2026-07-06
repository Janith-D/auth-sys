import { Response, NextFunction } from "express";
import asyncHandler from "../utils/asyncHandler";
import * as chatService from "../service/chat.service";
import { AuthRequest } from "../types";

export const getConversations = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const conversations = await chatService.getConversations(req.user!._id.toString());
    res.json({ success: true, data: conversations });
  }
);

export const getMessages = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const userId = req.params.userId as string;
    const messages = await chatService.getMessages(req.user!._id.toString(), userId);
    res.json({ success: true, data: messages });
  }
);

export const sendMessage = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { receiverId, content } = req.body;
    if (!receiverId || !content) {
      res.status(400);
      throw new Error("receiverId and content are required");
    }
    const message = await chatService.sendMessage(
      req.user!._id.toString(),
      receiverId,
      content
    );
    res.status(201).json({ success: true, data: message });
  }
);

export const getUsers = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const users = await chatService.getUsers(req.user!._id.toString());
    res.json({ success: true, data: users });
  }
);
