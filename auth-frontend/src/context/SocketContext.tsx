import { createContext, useContext, useEffect, useState, useRef, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import axios from "axios";
import { useAppSelector } from "../app/hooks";
import type { RootState } from "../app/store";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: string[];
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  onlineUsers: [],
});

export const useSocket = () => useContext(SocketContext);

interface SocketProviderProps {
  children: ReactNode;
}

const tryRefreshToken = async (): Promise<string | null> => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;
  try {
    const res = await axios.post("http://localhost:5000/api/auth/refresh-token", { refreshToken });
    const newToken = res.data.accessToken;
    if (newToken) {
      localStorage.setItem("accessToken", newToken);
      return newToken;
    }
  } catch {
    localStorage.clear();
    window.location.href = "/login";
  }
  return null;
};

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const isAuthenticated = useAppSelector((state: RootState) => !!state.auth.user);

  const connectSocket = async () => {
    if (socketRef.current?.connected) return;

    let token = localStorage.getItem("accessToken");
    if (!token) return;

    const socket = io("http://localhost:5000", {
      auth: { token },
    });

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("connect_error", async (err) => {
      console.error("Socket connection error:", err.message);
      setIsConnected(false);
      if (err.message === "Invalid token") {
        const newToken = await tryRefreshToken();
        if (newToken && newToken !== token) {
          token = newToken;
          socket.auth = { token: newToken };
          socket.connect();
        }
      }
    });
    socket.on("users:online", (users: string[]) => setOnlineUsers(users));

    socketRef.current = socket;
  };

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
        setOnlineUsers([]);
      }
      return;
    }

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider
      value={{ socket: socketRef.current, isConnected, onlineUsers }}
    >
      {children}
    </SocketContext.Provider>
  );
};
