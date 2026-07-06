import mongoose from "mongoose";
import Message from "../models/message.model";
import User from "../models/user.model";

export const getConversations = async (userId: string) => {
  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [
          { sender: new mongoose.Types.ObjectId(userId) },
          { receiver: new mongoose.Types.ObjectId(userId) },
        ],
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: null,
        userIds: {
          $addToSet: {
            $cond: [
              { $eq: ["$sender", new mongoose.Types.ObjectId(userId)] },
              "$receiver",
              "$sender",
            ],
          },
        },
      },
    },
  ]);

  if (!conversations.length) return [];

  const userIds = conversations[0].userIds;
  const users = await User.find({ _id: { $in: userIds } }).select("name email role");

  const result = [];
  for (const u of users) {
    const lastMsg = await Message.findOne({
      $or: [
        { sender: new mongoose.Types.ObjectId(userId), receiver: u._id },
        { sender: u._id, receiver: new mongoose.Types.ObjectId(userId) },
      ],
    } as any).sort({ createdAt: -1 });

    result.push({
      user: { id: u._id, name: u.name, email: u.email, role: u.role },
      lastMessage: lastMsg?.content || null,
      lastMessageAt: lastMsg?.createdAt || null,
    });
  }

  return result.sort(
    (a, b) =>
      new Date(b.lastMessageAt || 0).getTime() -
      new Date(a.lastMessageAt || 0).getTime()
  );
};

export const getMessages = async (userId: string, otherUserId: string) => {
  const messages = await Message.find({
    $or: [
      {
        sender: new mongoose.Types.ObjectId(userId),
        receiver: new mongoose.Types.ObjectId(otherUserId),
      },
      {
        sender: new mongoose.Types.ObjectId(otherUserId),
        receiver: new mongoose.Types.ObjectId(userId),
      },
    ],
  } as any)
    .sort({ createdAt: 1 })
    .populate("sender", "name email role")
    .populate("receiver", "name email role");

  return messages;
};

export const sendMessage = async (
  senderId: string,
  receiverId: string,
  content: string
) => {
  const receiver = await User.findById(receiverId);
  if (!receiver) {
    const err = new Error("Receiver not found");
    (err as any).statusCode = 404;
    throw err;
  }

  const message = await Message.create({
    sender: new mongoose.Types.ObjectId(senderId),
    receiver: new mongoose.Types.ObjectId(receiverId),
    content,
  } as any);

  const populated = await (
    await message.populate("sender", "name email role")
  ).populate("receiver", "name email role");

  return populated;
};

export const getUsers = async (currentUserId: string) => {
  const users = await User.find({
    _id: { $ne: new mongoose.Types.ObjectId(currentUserId) },
    isActive: true,
  } as any).select("name email role");
  return users.map((u) => ({
    id: u._id.toString(),
    name: u.name,
    email: u.email,
    role: u.role,
  }));
};
