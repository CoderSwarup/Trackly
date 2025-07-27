import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "../config/api";
import { useAuth } from "./AuthContext";

interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  type: string;
  timestamp: string;
}

interface User {
  id: string;
  username: string;
  isOnline: boolean;
  lastSeen: string;
}

interface SocketContextType {
  socket: Socket | null;
  messages: Message[];
  onlineUsers: User[];
  sendMessage: (content: string) => void;
  isConnected: boolean;
  isAuthenticated: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);

      newSocket.on("connect", () => {
        console.log("Connected to server");
        setIsConnected(true);

        // Authenticate user after connection using JWT token
        newSocket.emit("login", {
          token: token,
        });
      });

      newSocket.on("disconnect", () => {
        console.log("Disconnected from server");
        setIsConnected(false);
        setIsAuthenticated(false);
      });

      // Authentication success
      newSocket.on("login_success", (data) => {
        console.log("Login successful:", data);
        setIsAuthenticated(true);
        setOnlineUsers(data.activeUsers || []);

        // Request recent messages
        newSocket.emit("get_recent_messages", { limit: 50 });
      });

      // Authentication error
      newSocket.on("login_error", (data) => {
        console.log("DATA ", data);

        console.error("Login error:", data.message);
        setIsAuthenticated(false);
      });

      // New message from other users
      newSocket.on("new_message", (message: Message) => {
        console.log("New message received:", message);
        setMessages((prev) => [...prev, message]);
      });

      // Confirmation that our message was sent (don't add to messages, it will come via new_message)
      newSocket.on("message_sent", (message: Message) => {
        console.log("Message sent confirmation:", message);
        // Don't add to messages here - it will be broadcasted back via new_message
      });

      // Recent messages response
      newSocket.on("recent_messages", (data) => {
        console.log("Recent messages received:", data.messages);
        setMessages(data.messages || []);
      });

      // User joined
      newSocket.on("user_joined", (data) => {
        console.log("User joined:", data.user);
        setOnlineUsers((prev) => [...prev, data.user]);
      });

      // User left
      newSocket.on("user_left", (data) => {
        console.log("User left:", data.username);
        setOnlineUsers((prev) =>
          prev.filter((user) => user.username !== data.username)
        );
      });

      // Message error
      newSocket.on("message_error", (data) => {
        console.error("Message error:", data.message);
      });

      return () => {
        if (newSocket) {
          newSocket.emit("logout");
          newSocket.close();
        }
        setSocket(null);
        setIsConnected(false);
        setIsAuthenticated(false);
      };
    }
  }, [user, token]);

  const sendMessage = (content: string) => {
    if (socket && isAuthenticated && content.trim()) {
      console.log("Sending message:", content);
      socket.emit("send_message", {
        content: content.trim(),
        type: "text",
      });
    } else {
      console.log("Cannot send message - not authenticated or no socket");
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        messages,
        onlineUsers,
        sendMessage,
        isConnected,
        isAuthenticated,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
