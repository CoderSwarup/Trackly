import Location from '../models/Location.js';
import logger from '../utils/logger.js';

export class LocationService {
  static async shareOneTimeLocation(userId, username, locationData) {
    try {
      const { latitude, longitude, accuracy } = locationData;
      
      if (!latitude || !longitude) {
        throw new Error('Latitude and longitude are required');
      }

      // Create location record
      const location = new Location({
        userId,
        username,
        latitude,
        longitude,
        accuracy,
        type: 'one_time'
      });

      await location.save();

      logger.info(`One-time location shared by ${username}`);
      return location;
    } catch (error) {
      logger.error('LocationService.shareOneTimeLocation error:', error.message);
      throw error;
    }
  }

  static async startLiveLocationSharing(userId, username, locationData) {
    try {
      const { latitude, longitude, accuracy } = locationData;
      
      if (!latitude || !longitude) {
        throw new Error('Latitude and longitude are required');
      }

      // Stop any existing live location sharing for this user
      await LocationService.stopLiveLocationSharing(userId);

      // Create new live location record
      const location = new Location({
        userId,
        username,
        latitude,
        longitude,
        accuracy,
        type: 'live'
      });

      await location.save();

      logger.info(`Live location sharing started by ${username}`);
      return location;
    } catch (error) {
      logger.error('LocationService.startLiveLocationSharing error:', error.message);
      throw error;
    }
  }

  static async updateLiveLocation(userId, locationData) {
    try {
      const { latitude, longitude, accuracy } = locationData;
      
      if (!latitude || !longitude) {
        throw new Error('Latitude and longitude are required');
      }

      // Find existing live location for user
      const userLocations = await Location.getUserLocations(userId);
      const activeLiveLocation = userLocations.find(loc => 
        loc.type === 'live' && loc.isActive
      );

      if (!activeLiveLocation) {
        throw new Error('No active live location sharing found for user');
      }

      // Update the location
      activeLiveLocation.latitude = latitude;
      activeLiveLocation.longitude = longitude;
      activeLiveLocation.accuracy = accuracy;
      activeLiveLocation.timestamp = new Date();

      await activeLiveLocation.save();
      
      return activeLiveLocation;
    } catch (error) {
      logger.error('LocationService.updateLiveLocation error:', error.message);
      throw error;
    }
  }

  static async stopLiveLocationSharing(userId) {
    try {
      const userLocations = await Location.getUserLocations(userId);
      const activeLiveLocations = userLocations.filter(loc => 
        loc.type === 'live' && loc.isActive
      );

      const stoppedLocations = [];
      for (const location of activeLiveLocations) {
        await location.stopLiveTracking();
        stoppedLocations.push(location);
      }

      if (stoppedLocations.length > 0) {
        logger.info(`Live location sharing stopped for user ${userId}`);
      }

      return stoppedLocations;
    } catch (error) {
      logger.error('LocationService.stopLiveLocationSharing error:', error.message);
      throw error;
    }
  }

  static async getActiveLiveLocations() {
    try {
      return await Location.getActiveLiveLocations();
    } catch (error) {
      logger.error('LocationService.getActiveLiveLocations error:', error.message);
      throw error;
    }
  }

  static async getAllRecentLocations(hours = 24) {
    try {
      return await Location.getAllRecentLocations(hours);
    } catch (error) {
      logger.error('LocationService.getAllRecentLocations error:', error.message);
      throw error;
    }
  }

  static async getUserLocations(userId, includeInactive = false) {
    try {
      return await Location.getUserLocations(userId, includeInactive);
    } catch (error) {
      logger.error('LocationService.getUserLocations error:', error.message);
      throw error;
    }
  }

  static async getLocationById(locationId, type = 'one_time') {
    try {
      return await Location.findById(locationId, type);
    } catch (error) {
      logger.error('LocationService.getLocationById error:', error.message);
      throw error;
    }
  }

  static validateLocationData(data) {
    const { latitude, longitude, accuracy } = data;

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error('Invalid location coordinates');
    }

    if (latitude < -90 || latitude > 90) {
      throw new Error('Invalid latitude value (must be between -90 and 90)');
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error('Invalid longitude value (must be between -180 and 180)');
    }

    if (accuracy !== undefined && (typeof accuracy !== 'number' || accuracy < 0)) {
      throw new Error('Invalid accuracy value (must be a positive number)');
    }

    return true;
  }
}

export default LocationService;