import app from './app.js';
import { createServer } from 'node:http';
import socketServer from './socket/index.js';
import logger from './utils/logger.js';
import config from './config/config.js';
import { connectRedis } from './config/redisClient.js';

const PORT = process.env.PORT || 3000;


const server = createServer(app)
const io = socketServer(server)
app.set('io', io);



(async () => {
      try {

            const isRedisConnect = await connectRedis()
            if (isRedisConnect) {
                  logger.info("Redis Connection Initialize Successfully")
            }
            // Start server
            server.listen(config.PORT, () => {
                  logger.info('APPLICATION_STARTED', {
                        meta: {
                              PORT: config.PORT,
                              SERVER_URL: config.SERVER_URL,
                        },
                  });
            });
      } catch (err) {
            logger.error('APPLICATION_ERROR', { meta: err });

            server.close((error) => {
                  if (error) {
                        logger.error('APPLICATION_ERROR', { meta: error });
                  }

                  process.exit(1);
            });
      }
})();

