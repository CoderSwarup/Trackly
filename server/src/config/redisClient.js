
import { createClient } from 'redis';
import config from './config.js';

const client = createClient({
  url: config.REDIS_URL,
});

client.on('error', (err) => console.log('Redis Client Error', err));

export const connectRedis = async () => {
  try {
    await client.connect();
    return true
  } catch (error) {
    throw new Error(error?.message || "Redis Connection Error")
  }
};

export default client;
