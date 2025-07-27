
import { createClient } from 'redis';
import config from './config.js';
import logger from '../utils/logger.js';

// Main Redis client for data operations
const client = createClient({
  url: config.REDIS_URL,
});

const publisher = createClient({
  url: config.REDIS_URL,
});

const subscriber = createClient({
  url: config.REDIS_URL,
});

// Error handlers
client.on('error', (err) => logger.error('Redis Client Error:', err));
publisher.on('error', (err) => logger.error('Redis Publisher Error:', err));
subscriber.on('error', (err) => logger.error('Redis Subscriber Error:', err));

// Connection handlers
client.on('connect', () => logger.info('Redis client connected'));
publisher.on('connect', () => logger.info('Redis publisher connected'));
subscriber.on('connect', () => logger.info('Redis subscriber connected'));

export const connectRedis = async () => {
  try {
    await Promise.all([
      client.connect(),
      publisher.connect(),
      subscriber.connect()
    ]);

    logger.info('All Redis connections established');
    return true;
  } catch (error) {
    logger.error('Redis connection error:', error.message);
    throw new Error(error?.message || "Redis Connection Error");
  }
};

export const disconnectRedis = async () => {
  try {
    await Promise.all([
      client.quit(),
      publisher.quit(),
      subscriber.quit()
    ]);
    logger.info('All Redis connections closed');
  } catch (error) {
    logger.error('Redis disconnection error:', error.message);
  }
};

// Pub/Sub channels
export const CHANNELS = {
  CHAT_MESSAGE: 'chat:message',
  USER_JOINED: 'user:joined',
  USER_LEFT: 'user:left',
  LOCATION_SHARED: 'location:shared',
  LIVE_LOCATION_UPDATE: 'location:live_update',
  LIVE_LOCATION_STOPPED: 'location:live_stopped'
};

// Helper functions for pub/sub
export const publishMessage = async (channel, data) => {
  try {
    await publisher.publish(channel, JSON.stringify(data));
    logger.debug(`Published message to ${channel}`);
  } catch (error) {
    logger.error(`Error publishing to ${channel}:`, error.message);
    throw error;
  }
};

export const subscribeToChannel = async (channel, callback) => {
  try {
    await subscriber.subscribe(channel, (message) => {
      try {
        const data = JSON.parse(message);
        callback(data);
      } catch (error) {
        logger.error(`Error parsing message from ${channel}:`, error.message);
      }
    });
    logger.info(`Subscribed to channel: ${channel}`);
  } catch (error) {
    logger.error(`Error subscribing to ${channel}:`, error.message);
    throw error;
  }
};

export { client as default, publisher, subscriber };
