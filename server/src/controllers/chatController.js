import ChatService from '../services/ChatService.js';
import httpResponse from '../utils/httpResponse.js';
import httpError from '../utils/httpError.js';
import responseMessage from '../constant/responseMessage.js';

export const chatController = {
  async getRecentMessages(req, res, next) {
    try {
      // Use validated query params if available, otherwise fallback to original query
      const limit = req.validatedQuery?.limit || parseInt(req.query.limit) || 50;
      
      if (limit > 100) {
        throw new Error('Limit cannot exceed 100');
      }

      const messages = await ChatService.getRecentMessages(limit);
      
      httpResponse(req, res, 200, responseMessage.SUCCESS, {
        messages: messages.map(msg => msg.toJSON()),
        count: messages.length,
        limit
      });
    } catch (error) {
      httpError(next, error, req, 400);
    }
  },

  async sendMessage(req, res, next) {
    try {
      const { userId, username, content, type = 'text', location } = req.body;
      
      if (!userId || !username) {
        throw new Error('User ID and username are required');
      }

      const message = await ChatService.sendMessage(userId, username, content, type, location);
      
      // Note: In real implementation, you'd emit this via socket.io
      // This endpoint is mainly for testing purposes
      
      httpResponse(req, res, 201, 'Message sent successfully', {
        message: message.toJSON()
      });
    } catch (error) {
      httpError(next, error, req, 400);
    }
  },

  async cleanupOldMessages(req, res, next) {
    try {
      const days = req.validatedQuery?.days || parseInt(req.query.days) || 7;
      
      if (days < 1 || days > 30) {
        throw new Error('Days must be between 1 and 30');
      }

      const deletedCount = await ChatService.cleanupOldMessages(days);
      
      httpResponse(req, res, 200, responseMessage.SUCCESS, {
        deletedCount,
        message: `Cleaned up messages older than ${days} days`
      });
    } catch (error) {
      httpError(next, error, req, 400);
    }
  }
};

export default chatController;