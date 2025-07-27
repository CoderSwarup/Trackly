import UserService from '../services/UserService.js';
import User from '../models/User.js';
import httpResponse from '../utils/httpResponse.js';
import httpError from '../utils/httpError.js';
import responseMessage from '../constant/responseMessage.js';

export const userController = {
  async loginOrRegister(req, res, next) {
    try {
      const { username, password } = req.body;
      
      const result = await UserService.loginOrRegister(username, password);
      
      httpResponse(req, res, 200, responseMessage.SUCCESS, {
        user: result.user.toJSON(),
        token: result.token,
        message: 'User authenticated successfully'
      });
    } catch (error) {
      httpError(next, error, req, 400);
    }
  },

  async getActiveUsers(req, res, next) {
    try {
      const activeUsers = await UserService.getActiveUsers();
      
      httpResponse(req, res, 200, responseMessage.SUCCESS, {
        activeUsers,
        count: activeUsers.length
      });
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  async getUserStatus(req, res, next) {
    try {
      const { username } = req.params;
      
      if (!username) {
        throw new Error('Username is required');
      }

      const user = await User.findByUsername(username);
      
      if (!user) {
        httpResponse(req, res, 404, 'User not found');
        return;
      }

      httpResponse(req, res, 200, responseMessage.SUCCESS, {
        user: user.toJSON()
      });
    } catch (error) {
      httpError(next, error, req, 400);
    }
  }
};

export default userController;