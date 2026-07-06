import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Message from "../models/message.model";
import { IJwtPayload } from "../types";
import { SocketAuth } from "../types/chat.types";

let io: Server;

const onlineUsers = new Map<string, string>();

export const initializeSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: [
        process.env.CLIENT_URL || "http://localhost:5173",
        "http://localhost:5173",
        "http://localhost:5174",
      ],
      credentials: true,
    },
  });

  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET as string
      ) as IJwtPayload;
      (socket as any).user = { userId: decoded.id, role: decoded.role } as SocketAuth;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = (socket as any).user as SocketAuth;
    onlineUsers.set(user.userId, socket.id);

    io.emit("users:online", Array.from(onlineUsers.keys()));

    socket.join(user.userId);

    socket.on("message:send", async (data: { receiverId: string; content: string }) => {
      try {
        const message = await Message.create({
          sender: new mongoose.Types.ObjectId(user.userId),
          receiver: new mongoose.Types.ObjectId(data.receiverId),
          content: data.content,
        } as any);

        const populated = await (
          await message.populate("sender", "name email role")
        ).populate("receiver", "name email role");

        io.to(user.userId).emit("message:new", populated);
        io.to(data.receiverId).emit("message:new", populated);
      } catch (error) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("typing", (data: { receiverId: string }) => {
      io.to(data.receiverId).emit("typing", { userId: user.userId });
    });

    socket.on("stop-typing", (data: { receiverId: string }) => {
      io.to(data.receiverId).emit("stop-typing", { userId: user.userId });
    });

    socket.on("screen:offer", (data: { receiverId: string; name: string; sdp?: any }) => {
      io.to(data.receiverId).emit("screen:offer", { senderId: user.userId, name: data.name, sdp: data.sdp });
    });

    socket.on("screen:answer", (data: { receiverId: string; sdp: any }) => {
      io.to(data.receiverId).emit("screen:answer", { sdp: data.sdp });
    });

    socket.on("screen:ice-candidate", (data: { receiverId: string; candidate: any }) => {
      io.to(data.receiverId).emit("screen:ice-candidate", { candidate: data.candidate });
    });

    socket.on("screen:frame", (data: { receiverId: string; data: any }) => {
      io.to(data.receiverId).emit("screen:frame", { senderId: user.userId, data: data.data });
    });

    socket.on("screen:end", (data: { receiverId: string }) => {
      io.to(data.receiverId).emit("screen:end", { senderId: user.userId });
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(user.userId);
      io.emit("users:online", Array.from(onlineUsers.keys()));
    });
  });

  return io;
};

export const getIO = () => io;
export const getOnlineUsers = () => onlineUsers;
