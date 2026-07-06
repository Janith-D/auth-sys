export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface Message {
  _id: string;
  sender: User;
  receiver: User;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  user: User;
  lastMessage: string | null;
  lastMessageAt: string | null;
}
