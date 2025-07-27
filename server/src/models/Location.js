import client from '../config/redisClient.js';
import { v4 as uuidv4 } from 'uuid';

const LOCATION_PREFIX = 'location:';
const LIVE_LOCATION_PREFIX = 'live_location:';
const USER_LOCATIONS_SET = 'user_locations:';

export class Location {
  constructor({ 
    id, 
    userId, 
    username, 
    latitude, 
    longitude, 
    accuracy = null, 
    timestamp = new Date(), 
    type = 'one_time', // 'one_time' or 'live'
    isActive = true 
  }) {
    this.id = id || uuidv4();
    this.userId = userId;
    this.username = username;
    this.latitude = latitude;
    this.longitude = longitude;
    this.accuracy = accuracy;
    this.timestamp = timestamp;
    this.type = type;
    this.isActive = isActive;
  }

  async save() {
    try {
      const locationData = {
        id: this.id,
        userId: this.userId,
        username: this.username,
        latitude: this.latitude.toString(),
        longitude: this.longitude.toString(),
        accuracy: this.accuracy ? this.accuracy.toString() : null,
        timestamp: this.timestamp.toISOString(),
        type: this.type,
        isActive: this.isActive.toString()
      };

      const prefix = this.type === 'live' ? LIVE_LOCATION_PREFIX : LOCATION_PREFIX;
      await client.hSet(`${prefix}${this.id}`, locationData);
      
      // Add to user's location set
      await client.sAdd(`${USER_LOCATIONS_SET}${this.userId}`, this.id);

      // Set TTL based on type
      const ttl = this.type === 'live' ? 3600 : 86400; // 1 hour for live, 24 hours for one-time
      await client.expire(`${prefix}${this.id}`, ttl);
      
      return this;
    } catch (error) {
      throw new Error(`Error saving location: ${error.message}`);
    }
  }

  async stopLiveTracking() {
    if (this.type === 'live') {
      this.isActive = false;
      return await this.save();
    }
    throw new Error('Cannot stop tracking for non-live location');
  }

  static async findById(id, type = 'one_time') {
    try {
      const prefix = type === 'live' ? LIVE_LOCATION_PREFIX : LOCATION_PREFIX;
      const locationData = await client.hGetAll(`${prefix}${id}`);
      
      if (!locationData || !locationData.id) return null;

      return new Location({
        id: locationData.id,
        userId: locationData.userId,
        username: locationData.username,
        latitude: parseFloat(locationData.latitude),
        longitude: parseFloat(locationData.longitude),
        accuracy: locationData.accuracy ? parseFloat(locationData.accuracy) : null,
        timestamp: new Date(locationData.timestamp),
        type: locationData.type,
        isActive: locationData.isActive === 'true'
      });
    } catch (error) {
      throw new Error(`Error finding location: ${error.message}`);
    }
  }

  static async getUserLocations(userId, includeInactive = false) {
    try {
      const locationIds = await client.sMembers(`${USER_LOCATIONS_SET}${userId}`);
      const locations = [];

      for (const locationId of locationIds) {
        // Try both prefixes
        const oneTimeLocation = await Location.findById(locationId, 'one_time');
        const liveLocation = await Location.findById(locationId, 'live');
        
        const location = oneTimeLocation || liveLocation;
        if (location && (includeInactive || location.isActive)) {
          locations.push(location);
        }
      }

      return locations.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      throw new Error(`Error getting user locations: ${error.message}`);
    }
  }

  static async getActiveLiveLocations() {
    try {
      const keys = await client.keys(`${LIVE_LOCATION_PREFIX}*`);
      const locations = [];

      for (const key of keys) {
        const locationData = await client.hGetAll(key);
        if (locationData && locationData.isActive === 'true') {
          locations.push(new Location({
            id: locationData.id,
            userId: locationData.userId,
            username: locationData.username,
            latitude: parseFloat(locationData.latitude),
            longitude: parseFloat(locationData.longitude),
            accuracy: locationData.accuracy ? parseFloat(locationData.accuracy) : null,
            timestamp: new Date(locationData.timestamp),
            type: locationData.type,
            isActive: locationData.isActive === 'true'
          }));
        }
      }

      return locations;
    } catch (error) {
      throw new Error(`Error getting active live locations: ${error.message}`);
    }
  }

  static async getAllRecentLocations(hours = 24) {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hours);

      const oneTimeKeys = await client.keys(`${LOCATION_PREFIX}*`);
      const liveKeys = await client.keys(`${LIVE_LOCATION_PREFIX}*`);
      const allKeys = [...oneTimeKeys, ...liveKeys];
      
      const locations = [];

      for (const key of allKeys) {
        const locationData = await client.hGetAll(key);
        if (locationData && locationData.timestamp) {
          const timestamp = new Date(locationData.timestamp);
          if (timestamp >= cutoffTime) {
            locations.push(new Location({
              id: locationData.id,
              userId: locationData.userId,
              username: locationData.username,
              latitude: parseFloat(locationData.latitude),
              longitude: parseFloat(locationData.longitude),
              accuracy: locationData.accuracy ? parseFloat(locationData.accuracy) : null,
              timestamp: timestamp,
              type: locationData.type,
              isActive: locationData.isActive === 'true'
            }));
          }
        }
      }

      return locations.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      throw new Error(`Error getting recent locations: ${error.message}`);
    }
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      username: this.username,
      latitude: this.latitude,
      longitude: this.longitude,
      accuracy: this.accuracy,
      timestamp: this.timestamp,
      type: this.type,
      isActive: this.isActive
    };
  }
}

export default Location;