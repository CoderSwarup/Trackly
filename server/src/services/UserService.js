import User from '../models/User.js';
import logger from '../utils/logger.js';
import { generateToken } from '../utils/jwt.js';

export class UserService {
  static async loginOrRegister(username, password) {
    try {
      if (!username || !password) {
        throw new Error('Username and password are required');
      }

      // Check if user exists
      let user = await User.findByUsername(username);
      console.log(user, "USER IS");

      if (user) {
        const isValidPassword = await user.comparePassword(password);
        if (!isValidPassword) {
          throw new Error('Invalid credentials');
        }
        logger.info(`User ${username} logged in`);
      } else {
        // Create new user
        user = new User({ username, password });
        await user.save();
        logger.info(`New user ${username} registered`);
      }

      // Generate JWT token for the user
      const token = generateToken({
        userId: user.id,
        username: user.username
      });

      return { user, token };
    } catch (error) {
      logger.error('UserService.loginOrRegister error:', error.message);
      throw error;
    }
  }

  static async setUserOnline(username, socketId) {
    try {
      const user = await User.findByUsername(username);
      if (!user) {
        throw new Error('User not found');
      }

      await user.setOnline(socketId);
      logger.info(`User ${username} is now online with socket ${socketId}`);

      return user;
    } catch (error) {
      logger.error('UserService.setUserOnline error:', error.message);
      throw error;
    }
  }

  static async setUserOffline(username) {
    try {
      const user = await User.findByUsername(username);
      if (!user) {
        logger.warn(`Attempted to set offline non-existent user: ${username}`);
        return null;
      }

      await user.setOffline();
      logger.info(`User ${username} is now offline`);

      return user;
    } catch (error) {
      logger.error('UserService.setUserOffline error:', error.message);
      throw error;
    }
  }

  static async getActiveUsers() {
    try {
      return await User.getActiveUsers();
    } catch (error) {
      logger.error('UserService.getActiveUsers error:', error.message);
      throw error;
    }
  }

  static async findUserBySocketId(socketId) {
    try {
      // This is not the most efficient way, but works for small scale
      const activeUsers = await User.getActiveUsers();
      return activeUsers.find(user => user.socketId === socketId);
    } catch (error) {
      logger.error('UserService.findUserBySocketId error:', error.message);
      throw error;
    }
  }

  static async validateUserSession(username, socketId) {
    try {
      const user = await User.findByUsername(username);
      if (!user || !user.isOnline || user.socketId !== socketId) {
        return false;
      }
      return true;
    } catch (error) {
      logger.error('UserService.validateUserSession error:', error.message);
      return false;
    }
  }
}

export default UserService;