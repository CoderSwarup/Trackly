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

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  type: 'one_time' | 'live';
  isActive?: boolean;
}

interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  type: string;
  timestamp: string;
  location?: LocationData;
}

interface User {
  id: string;
  username: string;
  isOnline: boolean;
  lastSeen: string;
}

interface LiveLocationState {
  id: string;
  userId: string;
  username: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  isActive: boolean;
}

interface SocketContextType {
  socket: Socket | null;
  messages: Message[];
  onlineUsers: User[];
  liveLocations: LiveLocationState[];
  sendMessage: (content: string) => void;
  shareLocation: (latitude: number, longitude: number, accuracy?: number) => void;
  startLiveLocation: (latitude: number, longitude: number, accuracy?: number) => void;
  updateLiveLocation: (latitude: number, longitude: number, accuracy?: number) => void;
  stopLiveLocation: () => void;
  isConnected: boolean;
  isAuthenticated: boolean;
  isLiveLocationActive: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<User[]>([]);
  const [liveLocations, setLiveLocations] = useState<LiveLocationState[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLiveLocationActive, setIsLiveLocationActive] = useState(false);
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
        
        // Request active locations
        newSocket.emit("get_active_locations");
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

      // Location sharing events
      newSocket.on("location_shared", (data) => {
        console.log("Location shared:", data);
        // Add location message to chat
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        }
      });

      newSocket.on("location_shared_success", (data) => {
        console.log("Location shared successfully:", data);
      });

      // Live location events
      newSocket.on("live_location_started", (data) => {
        console.log("Live location started:", data);
        if (data.location) {
          setLiveLocations((prev) => {
            const filtered = prev.filter(loc => loc.userId !== data.location.userId);
            return [...filtered, data.location];
          });
        }
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        }
      });

      newSocket.on("live_location_started_success", (data) => {
        console.log("Live location started successfully:", data);
        setIsLiveLocationActive(true);
      });

      newSocket.on("live_location_updated", (data) => {
        console.log("Live location updated:", data);
        if (data.location) {
          setLiveLocations((prev) => 
            prev.map(loc => 
              loc.userId === data.location.userId ? data.location : loc
            )
          );
        }
      });

      newSocket.on("live_location_updated_success", (data) => {
        console.log("Live location updated successfully:", data);
      });

      newSocket.on("live_location_stopped", (data) => {
        console.log("Live location stopped:", data);
        if (data.userId) {
          setLiveLocations((prev) => 
            prev.filter(loc => loc.userId !== data.userId)
          );
        }
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        }
      });

      newSocket.on("live_location_stopped_success", (data) => {
        console.log("Live location stopped successfully:", data);
        setIsLiveLocationActive(false);
      });

      // Active locations response
      newSocket.on("active_locations", (data) => {
        console.log("Active locations received:", data);
        setLiveLocations(data.liveLocations || []);
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

  const shareLocation = (latitude: number, longitude: number, accuracy?: number) => {
    if (socket && isAuthenticated) {
      console.log("Sharing location:", { latitude, longitude, accuracy });
      socket.emit("share_location", {
        latitude,
        longitude,
        accuracy,
      });
    } else {
      console.log("Cannot share location - not authenticated or no socket");
    }
  };

  const startLiveLocation = (latitude: number, longitude: number, accuracy?: number) => {
    if (socket && isAuthenticated) {
      console.log("Starting live location:", { latitude, longitude, accuracy });
      socket.emit("start_live_location", {
        latitude,
        longitude,
        accuracy,
      });
    } else {
      console.log("Cannot start live location - not authenticated or no socket");
    }
  };

  const updateLiveLocation = (latitude: number, longitude: number, accuracy?: number) => {
    if (socket && isAuthenticated && isLiveLocationActive) {
      console.log("Updating live location:", { latitude, longitude, accuracy });
      socket.emit("update_live_location", {
        latitude,
        longitude,
        accuracy,
      });
    } else {
      console.log("Cannot update live location - not authenticated, no socket, or not active");
    }
  };

  const stopLiveLocation = () => {
    if (socket && isAuthenticated && isLiveLocationActive) {
      console.log("Stopping live location");
      socket.emit("stop_live_location");
    } else {
      console.log("Cannot stop live location - not authenticated, no socket, or not active");
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        messages,
        onlineUsers,
        liveLocations,
        sendMessage,
        shareLocation,
        startLiveLocation,
        updateLiveLocation,
        stopLiveLocation,
        isConnected,
        isAuthenticated,
        isLiveLocationActive,
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
