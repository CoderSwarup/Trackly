import client from '../config/redisClient.js';
import { v4 as uuidv4 } from 'uuid';

const MESSAGES_LIST = 'chat_messages';
const MESSAGE_PREFIX = 'message:';

export class Message {
  constructor({ id, userId, username, content, type = 'text', timestamp = new Date(), location = null }) {
    this.id = id || uuidv4();
    this.userId = userId;
    this.username = username;
    this.content = content;
    this.type = type; // 'text', 'location', 'live_location'
    this.timestamp = timestamp;
    this.location = location;
  }

  async save() {
    try {
      console.log('Message.save() called for message:', this.id);
      
      const messageData = {
        id: this.id,
        userId: this.userId,
        username: this.username,
        content: this.content,
        type: this.type,
        timestamp: this.timestamp.toISOString(),
        location: this.location ? JSON.stringify(this.location) : ''
      };

      console.log('Message data to save:', messageData);
      
      await client.hSet(`${MESSAGE_PREFIX}${this.id}`, messageData);
      console.log('hSet completed');
      
      await client.lPush(MESSAGES_LIST, this.id);
      console.log('lPush completed');
      
      await client.expire(`${MESSAGE_PREFIX}${this.id}`, 86400 * 7); // 7 days TTL
      console.log('expire completed');
      
      return this;
    } catch (error) {
      console.error('Message.save() error details:', error);
      throw new Error(`Error saving message: ${error.message}`);
    }
  }

  static async getRecentMessages(limit = 50) {
    try {
      const messageIds = await client.lRange(MESSAGES_LIST, 0, limit - 1);
      const messages = [];

      for (const messageId of messageIds) {
        const messageData = await client.hGetAll(`${MESSAGE_PREFIX}${messageId}`);
        if (messageData && messageData.id) {
          messages.push(new Message({
            id: messageData.id,
            userId: messageData.userId,
            username: messageData.username,
            content: messageData.content,
            type: messageData.type,
            timestamp: new Date(messageData.timestamp),
            location: messageData.location && messageData.location !== '' ? JSON.parse(messageData.location) : null
          }));
        }
      }

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      throw new Error(`Error getting recent messages: ${error.message}`);
    }
  }

  static async deleteOldMessages(days = 7) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const messageIds = await client.lRange(MESSAGES_LIST, 0, -1);
      let deletedCount = 0;

      for (const messageId of messageIds) {
        const messageData = await client.hGetAll(`${MESSAGE_PREFIX}${messageId}`);
        if (messageData && messageData.timestamp) {
          const messageDate = new Date(messageData.timestamp);
          if (messageDate < cutoffDate) {
            await client.del(`${MESSAGE_PREFIX}${messageId}`);
            await client.lRem(MESSAGES_LIST, 0, messageId);
            deletedCount++;
          }
        }
      }

      return deletedCount;
    } catch (error) {
      throw new Error(`Error deleting old messages: ${error.message}`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      username: this.username,
      content: this.content,
      type: this.type,
      timestamp: this.timestamp,
      location: this.location
    };
  }
}

export default Message;