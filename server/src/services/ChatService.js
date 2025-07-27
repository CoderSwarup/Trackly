import Message from '../models/Message.js';
import UserService from './UserService.js';
import logger from '../utils/logger.js';

export class ChatService {
  static async sendMessage(userId, username, content, type = 'text', location = null) {
    try {
      console.log('ChatService.sendMessage called with:', { userId, username, content, type, location });
      
      if (!content && type === 'text') {
        throw new Error('Message content is required');
      }

      if (type === 'location' && !location) {
        throw new Error('Location data is required for location messages');
      }

      const message = new Message({
        userId,
        username,
        content,
        type,
        location
      });

      console.log('Message object created:', message);
      
      const savedMessage = await message.save();
      console.log('Message saved successfully:', savedMessage);
      
      logger.info(`Message sent by ${username}: ${type}`);

      return savedMessage;
    } catch (error) {
      console.error('ChatService.sendMessage error details:', error);
      logger.error('ChatService.sendMessage error:', error.message);
      throw error;
    }
  }

  static async getRecentMessages(limit = 50) {
    try {
      return await Message.getRecentMessages(limit);
    } catch (error) {
      logger.error('ChatService.getRecentMessages error:', error.message);
      throw error;
    }
  }

  static async sendLocationMessage(userId, username, locationData) {
    try {
      const { latitude, longitude, accuracy, type = 'one_time' } = locationData;

      if (!latitude || !longitude) {
        throw new Error('Latitude and longitude are required');
      }

      const location = {
        latitude,
        longitude,
        accuracy,
        type,
        timestamp: new Date()
      };

      const content = type === 'live' ?
        `${username} is sharing live location` :
        `${username} shared location`;

      return await ChatService.sendMessage(
        userId,
        username,
        content,
        'location',
        location
      );
    } catch (error) {
      logger.error('ChatService.sendLocationMessage error:', error.message);
      throw error;
    }
  }

  static async cleanupOldMessages(days = 7) {
    try {
      const deletedCount = await Message.deleteOldMessages(days);
      logger.info(`Cleaned up ${deletedCount} old messages`);
      return deletedCount;
    } catch (error) {
      logger.error('ChatService.cleanupOldMessages error:', error.message);
      throw error;
    }
  }

  static async validateMessageData(data) {
    const { content, type = 'text', location } = data;

    if (type === 'text' && (!content || content.trim().length === 0)) {
      throw new Error('Text message content cannot be empty');
    }

    if (type === 'location' && !location) {
      throw new Error('Location data is required for location messages');
    }

    if (type === 'location' && location) {
      const { latitude, longitude } = location;
      if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        throw new Error('Invalid location coordinates');
      }
      if (latitude < -90 || latitude > 90) {
        throw new Error('Invalid latitude value');
      }
      if (longitude < -180 || longitude > 180) {
        throw new Error('Invalid longitude value');
      }
    }

    return true;
  }
}

export default ChatService;