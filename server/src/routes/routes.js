import { Router } from "express";
import httpError from "../utils/httpError.js";
import responseMessage from "../constant/responseMessage.js";
import httpResponse from "../utils/httpResponse.js";
import apiController from "../controllers/api.controller.js";
import userController from '../controllers/userController.js';
import chatController from '../controllers/chatController.js';
import locationController from '../controllers/locationController.js';
import { validateRequest } from '../middlewares/validation.js';
import { authLimiter, chatLimiter } from '../middlewares/rateLimiter.js';
import { 
  userLoginSchema, 
  sendMessageSchema, 
  shareLocationSchema,
  queryParamsSchema 
} from '../validators/schemas.js';

const routes = Router()

// Health check
routes.get("/test", apiController.self)

// User routes
routes.post('/users/auth', authLimiter, validateRequest(userLoginSchema), userController.loginOrRegister);
routes.get('/users/active', userController.getActiveUsers);
routes.get('/users/:username/status', userController.getUserStatus);

// Chat routes
routes.get('/chat/messages', validateRequest(queryParamsSchema, 'query'), chatController.getRecentMessages);
routes.post('/chat/messages', chatLimiter, validateRequest(sendMessageSchema), chatController.sendMessage);
routes.delete('/chat/cleanup', chatController.cleanupOldMessages);

// Location routes
routes.get('/locations/live', locationController.getActiveLiveLocations);
routes.get('/locations/recent', validateRequest(queryParamsSchema, 'query'), locationController.getRecentLocations);
routes.post('/locations/share', validateRequest(shareLocationSchema), locationController.shareOneTimeLocation);
routes.get('/locations/:locationId', locationController.getLocationById);
routes.get('/locations/user/:userId', locationController.getUserLocations);
routes.post('/locations/user/:userId/live/stop', locationController.stopUserLiveLocation);

export default routes