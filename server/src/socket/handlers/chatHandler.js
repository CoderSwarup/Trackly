import ChatService from '../../services/ChatService.js';
import { validateSocketData } from '../../middlewares/validation.js';
import { sendMessageSchema } from '../../validators/schemas.js';
import { publishMessage, CHANNELS } from '../../config/redisClient.js';
import logger from '../../utils/logger.js';

export const handleSendMessage = async (socket, data) => {
  try {
    if (!socket.user || !socket.username) {
      socket.emit('message_error', {
        message: 'User not authenticated'
      });
      return;
    }

    const validatedData = validateSocketData(sendMessageSchema, data);
    const { content, type = 'text' } = validatedData;

    const message = await ChatService.sendMessage(
      socket.user.id,
      socket.username,
      content,
      type
    );

    const messageData = message.toJSON();

    // IMMEDIATE delivery to all users in the room including sender
    socket.to('general').emit('new_message', messageData);
    socket.emit('new_message', messageData);

    // Also publish to Redis for scaling (backup/other instances)
    await publishMessage(CHANNELS.CHAT_MESSAGE, {
      message: messageData,
      room: 'general'
    });

    logger.info(`Message sent by ${socket.username} - delivered immediately`);
  } catch (error) {
    logger.error('Send message error:', error.message);
    socket.emit('message_error', {
      message: error.message
    });
  }
};

export const handleGetRecentMessages = async (socket, data = {}) => {
  try {
    if (!socket.user || !socket.username) {
      socket.emit('message_error', {
        message: 'User not authenticated'
      });
      return;
    }

    const limit = data.limit || 50;
    const messages = await ChatService.getRecentMessages(limit);

    socket.emit('recent_messages', {
      messages: messages.map(msg => msg.toJSON())
    });

    logger.debug(`Recent messages sent to ${socket.username}`);
  } catch (error) {
    logger.error('Get recent messages error:', error.message);
    socket.emit('message_error', {
      message: 'Failed to fetch recent messages'
    });
  }
};

export const handleTyping = (socket, data) => {
  try {
    if (!socket.user || !socket.username) {
      return;
    }

    const { isTyping } = data;

    socket.to('general').emit('user_typing', {
      username: socket.username,
      isTyping: Boolean(isTyping),
      timestamp: new Date()
    });

    logger.debug(`${socket.username} typing status: ${isTyping}`);
  } catch (error) {
    logger.error('Typing indicator error:', error.message);
  }
};