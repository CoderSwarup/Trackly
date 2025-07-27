import UserService from '../../services/UserService.js';
import User from '../../models/User.js';
import { validateSocketData } from '../../middlewares/validation.js';
import { socketAuthSchema } from '../../validators/schemas.js';
import { publishMessage, CHANNELS } from '../../config/redisClient.js';
import { verifyToken } from '../../utils/jwt.js';
import logger from '../../utils/logger.js';

export const handleUserLogin = async (socket, data) => {
  try {
    // Validate the authentication data (token or username/password)
    const validatedData = validateSocketData(socketAuthSchema, data);

    let user;

    if (validatedData.token) {
      // New token-based authentication
      const decoded = verifyToken(validatedData.token);
      user = await User.findById(decoded.userId);

      if (!user) {
        throw new Error('User not found');
      }

      await UserService.setUserOnline(user.username, socket.id);
    } else {
      // Legacy password-based authentication (for existing users)
      const { username, password } = validatedData;
      const result = await UserService.loginOrRegister(username, password);
      user = result.user;
      await UserService.setUserOnline(username, socket.id);
    }

    // Store user data in socket
    socket.user = user;
    socket.username = user.username;

    // Join general chat room
    socket.join('general');

    // Get active users
    const activeUsers = await UserService.getActiveUsers();

    // Notify user of successful login
    socket.emit('login_success', {
      user: user.toJSON(),
      activeUsers
    });

    // Notify other users about new user joining
    socket.to('general').emit('user_joined', {
      user: user.toJSON(),
      timestamp: new Date()
    });

    // Publish user joined event for scalability
    await publishMessage(CHANNELS.USER_JOINED, {
      user: user.toJSON(),
      socketId: socket.id,
      timestamp: new Date()
    });

    logger.info(`User ${socket.username} logged in with socket ${socket.id}`);
  } catch (error) {
    console.log(error);

    logger.error('Login error:', error.message);
    socket.emit('login_error', {
      message: error.message
    });
  }
};

export const handleUserLogout = async (socket) => {
  try {
    if (socket.username) {
      await UserService.setUserOffline(socket.username);

      // Notify other users about user leaving
      socket.to('general').emit('user_left', {
        username: socket.username,
        timestamp: new Date()
      });

      // Publish user left event for scalability
      await publishMessage(CHANNELS.USER_LEFT, {
        username: socket.username,
        socketId: socket.id,
        timestamp: new Date()
      });

      logger.info(`User ${socket.username} logged out`);
    }
  } catch (error) {
    logger.error('Logout error:', error.message);
  }
};

export const handleDisconnect = async (socket) => {
  try {
    if (socket.username) {
      await UserService.setUserOffline(socket.username);

      // Notify other users about user disconnecting
      socket.to('general').emit('user_left', {
        username: socket.username,
        timestamp: new Date()
      });

      // Publish user left event for scalability
      await publishMessage(CHANNELS.USER_LEFT, {
        username: socket.username,
        socketId: socket.id,
        timestamp: new Date()
      });

      logger.info(`User ${socket.username} disconnected`);
    }
  } catch (error) {
    logger.error('Disconnect error:', error.message);
  }
};