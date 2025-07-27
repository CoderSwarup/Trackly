import LocationService from '../services/LocationService.js';
import httpResponse from '../utils/httpResponse.js';
import httpError from '../utils/httpError.js';
import responseMessage from '../constant/responseMessage.js';

export const locationController = {
  async getActiveLiveLocations(req, res, next) {
    try {
      const liveLocations = await LocationService.getActiveLiveLocations();
      
      httpResponse(req, res, 200, responseMessage.SUCCESS, {
        liveLocations: liveLocations.map(loc => loc.toJSON()),
        count: liveLocations.length
      });
    } catch (error) {
      httpError(next, error, req, 500);
    }
  },

  async getRecentLocations(req, res, next) {
    try {
      const hours = req.validatedQuery?.hours || parseInt(req.query.hours) || 24;
      
      if (hours < 1 || hours > 168) { // Max 7 days
        throw new Error('Hours must be between 1 and 168 (7 days)');
      }

      const locations = await LocationService.getAllRecentLocations(hours);
      
      httpResponse(req, res, 200, responseMessage.SUCCESS, {
        locations: locations.map(loc => loc.toJSON()),
        count: locations.length,
        hours
      });
    } catch (error) {
      httpError(next, error, req, 400);
    }
  },

  async getUserLocations(req, res, next) {
    try {
      const { userId } = req.params;
      const includeInactive = req.query.includeInactive === 'true';
      
      if (!userId) {
        throw new Error('User ID is required');
      }

      const locations = await LocationService.getUserLocations(userId, includeInactive);
      
      httpResponse(req, res, 200, responseMessage.SUCCESS, {
        locations: locations.map(loc => loc.toJSON()),
        count: locations.length,
        userId
      });
    } catch (error) {
      httpError(next, error, req, 400);
    }
  },

  async getLocationById(req, res, next) {
    try {
      const { locationId } = req.params;
      const type = req.query.type || 'one_time';
      
      if (!locationId) {
        throw new Error('Location ID is required');
      }

      const location = await LocationService.getLocationById(locationId, type);
      
      if (!location) {
        httpResponse(req, res, 404, 'Location not found');
        return;
      }

      httpResponse(req, res, 200, responseMessage.SUCCESS, {
        location: location.toJSON()
      });
    } catch (error) {
      httpError(next, error, req, 400);
    }
  },

  async shareOneTimeLocation(req, res, next) {
    try {
      const { userId, username, latitude, longitude, accuracy } = req.body;
      
      if (!userId || !username) {
        throw new Error('User ID and username are required');
      }

      LocationService.validateLocationData({ latitude, longitude, accuracy });

      const location = await LocationService.shareOneTimeLocation(userId, username, {
        latitude,
        longitude,
        accuracy
      });
      
      // Note: In real implementation, you'd emit this via socket.io
      // This endpoint is mainly for testing purposes
      
      httpResponse(req, res, 201, 'Location shared successfully', {
        location: location.toJSON()
      });
    } catch (error) {
      httpError(next, error, req, 400);
    }
  },

  async stopUserLiveLocation(req, res, next) {
    try {
      const { userId } = req.params;
      
      if (!userId) {
        throw new Error('User ID is required');
      }

      const stoppedLocations = await LocationService.stopLiveLocationSharing(userId);
      
      httpResponse(req, res, 200, responseMessage.SUCCESS, {
        stoppedLocations: stoppedLocations.map(loc => loc.toJSON()),
        count: stoppedLocations.length
      });
    } catch (error) {
      httpError(next, error, req, 400);
    }
  }
};

export default locationController;