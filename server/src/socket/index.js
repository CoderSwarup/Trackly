import { Server } from 'socket.io';
import { handleUserLogin, handleUserLogout, handleDisconnect } from './handlers/authHandler.js';
import { handleSendMessage, handleGetRecentMessages, handleTyping } from './handlers/chatHandler.js';
import { 
  handleShareOneTimeLocation, 
  handleStartLiveLocationSharing, 
  handleUpdateLiveLocation, 
  handleStopLiveLocationSharing,
  handleGetActiveLocations 
} from './handlers/locationHandler.js';
import { subscribeToChannel, CHANNELS } from '../config/redisClient.js';
import logger from '../utils/logger.js';

const socketServer = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
      skipMiddlewares: true,
    }
  });

  // Set up Redis pub/sub for scalability
  setupRedisPubSub(io);

  // Socket connection handler
  io.on('connection', (socket) => {
    logger.info(`New client connected: ${socket.id}`);

    // Authentication events
    socket.on('login', (data) => handleUserLogin(socket, data));
    socket.on('logout', () => handleUserLogout(socket));

    // Chat events
    socket.on('send_message', (data) => handleSendMessage(socket, data));
    socket.on('get_recent_messages', (data) => handleGetRecentMessages(socket, data));
    socket.on('typing', (data) => handleTyping(socket, data));

    // Location events
    socket.on('share_location', (data) => handleShareOneTimeLocation(socket, data));
    socket.on('start_live_location', (data) => handleStartLiveLocationSharing(socket, data));
    socket.on('update_live_location', (data) => handleUpdateLiveLocation(socket, data));
    socket.on('stop_live_location', () => handleStopLiveLocationSharing(socket));
    socket.on('get_active_locations', () => handleGetActiveLocations(socket));

    // Disconnect handler
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
      handleDisconnect(socket);
    });

    // Error handler
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, closing socket server...');
    io.close();
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received, closing socket server...');
    io.close();
  });

  return io;
};

// Set up Redis pub/sub for horizontal scaling
const setupRedisPubSub = (io) => {
  // Subscribe to chat messages (for multi-server scaling only)
  // Messages are now delivered immediately in chatHandler
  subscribeToChannel(CHANNELS.CHAT_MESSAGE, (data) => {
    // Only needed for cross-server scaling - skip if single server
    // const { message, room } = data;
    // io.in(room).emit('new_message', message);
    logger.debug('Chat message published to Redis for scaling');
  });

  // Subscribe to user events
  subscribeToChannel(CHANNELS.USER_JOINED, (data) => {
    const { user } = data;
    io.to('general').emit('user_joined', {
      user,
      timestamp: new Date()
    });
  });

  subscribeToChannel(CHANNELS.USER_LEFT, (data) => {
    const { username } = data;
    io.to('general').emit('user_left', {
      username,
      timestamp: new Date()
    });
  });

  // Subscribe to location events
  subscribeToChannel(CHANNELS.LOCATION_SHARED, (data) => {
    const { location, type, sharedBy, room } = data;
    io.to(room).emit('location_shared', {
      location,
      type,
      sharedBy,
      timestamp: new Date()
    });
  });

  subscribeToChannel(CHANNELS.LIVE_LOCATION_UPDATE, (data) => {
    const { location, type, sharedBy, userId, room } = data;
    if (type === 'started') {
      io.to(room).emit('live_location_started', {
        location,
        sharedBy,
        userId,
        timestamp: new Date()
      });
    } else if (type === 'updated') {
      io.to(room).emit('live_location_updated', {
        location,
        sharedBy,
        userId,
        timestamp: new Date()
      });
    }
  });

  subscribeToChannel(CHANNELS.LIVE_LOCATION_STOPPED, (data) => {
    const { userId, stoppedBy, room } = data;
    io.to(room).emit('live_location_stopped', {
      userId,
      stoppedBy,
      timestamp: new Date()
    });
  });

  logger.info('Redis pub/sub channels set up for Socket.io scaling');
};

export default socketServer;