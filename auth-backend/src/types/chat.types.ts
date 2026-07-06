import { Document, ObjectId } from "mongoose";

export interface IMessage extends Document {
  sender: ObjectId;
  receiver: ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SendMessageBody {
  receiverId: string;
  content: string;
}

export interface SocketAuth {
  userId: string;
  role: string;
}
