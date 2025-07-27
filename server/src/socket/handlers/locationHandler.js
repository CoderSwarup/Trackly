import LocationService from '../../services/LocationService.js';
import { validateSocketData } from '../../middlewares/validation.js';
import { shareLocationSchema, liveLocationUpdateSchema } from '../../validators/schemas.js';
import { publishMessage, CHANNELS } from '../../config/redisClient.js';
import logger from '../../utils/logger.js';

export const handleShareOneTimeLocation = async (socket, data) => {
  try {
    if (!socket.user || !socket.username) {
      socket.emit('location_error', {
        message: 'User not authenticated'
      });
      return;
    }

    const validatedData = validateSocketData(shareLocationSchema, data);
    
    const location = await LocationService.shareOneTimeLocation(
      socket.user.id,
      socket.username,
      validatedData
    );

    // Emit location to all users in the room
    socket.to('general').emit('location_shared', {
      location: location.toJSON(),
      type: 'one_time',
      sharedBy: socket.username,
      timestamp: new Date()
    });

    // Send confirmation to sender
    socket.emit('location_shared_success', {
      location: location.toJSON()
    });

    // Publish location shared event for scalability
    await publishMessage(CHANNELS.LOCATION_SHARED, {
      location: location.toJSON(),
      type: 'one_time',
      sharedBy: socket.username,
      room: 'general'
    });

    logger.info(`One-time location shared by ${socket.username}`);
  } catch (error) {
    logger.error('Share one-time location error:', error.message);
    socket.emit('location_error', {
      message: error.message
    });
  }
};

export const handleStartLiveLocationSharing = async (socket, data) => {
  try {
    if (!socket.user || !socket.username) {
      socket.emit('location_error', {
        message: 'User not authenticated'
      });
      return;
    }

    const validatedData = validateSocketData(shareLocationSchema, data);
    
    const location = await LocationService.startLiveLocationSharing(
      socket.user.id,
      socket.username,
      validatedData
    );

    // Join live location room for this user
    socket.join(`live_location_${socket.user.id}`);

    // Emit live location start to all users in the room
    socket.to('general').emit('live_location_started', {
      location: location.toJSON(),
      sharedBy: socket.username,
      userId: socket.user.id,
      timestamp: new Date()
    });

    // Send confirmation to sender
    socket.emit('live_location_started_success', {
      location: location.toJSON()
    });

    // Publish live location start event for scalability
    await publishMessage(CHANNELS.LIVE_LOCATION_UPDATE, {
      location: location.toJSON(),
      type: 'started',
      sharedBy: socket.username,
      userId: socket.user.id,
      room: 'general'
    });

    logger.info(`Live location sharing started by ${socket.username}`);
  } catch (error) {
    logger.error('Start live location sharing error:', error.message);
    socket.emit('location_error', {
      message: error.message
    });
  }
};

export const handleUpdateLiveLocation = async (socket, data) => {
  try {
    if (!socket.user || !socket.username) {
      socket.emit('location_error', {
        message: 'User not authenticated'
      });
      return;
    }

    const validatedData = validateSocketData(liveLocationUpdateSchema, data);
    
    const location = await LocationService.updateLiveLocation(
      socket.user.id,
      validatedData
    );

    // Emit updated location to all users in the room
    socket.to('general').emit('live_location_updated', {
      location: location.toJSON(),
      sharedBy: socket.username,
      userId: socket.user.id,
      timestamp: new Date()
    });

    // Send confirmation to sender
    socket.emit('live_location_updated_success', {
      location: location.toJSON()
    });

    // Publish live location update event for scalability
    await publishMessage(CHANNELS.LIVE_LOCATION_UPDATE, {
      location: location.toJSON(),
      type: 'updated',
      sharedBy: socket.username,
      userId: socket.user.id,
      room: 'general'
    });

    logger.debug(`Live location updated by ${socket.username}`);
  } catch (error) {
    logger.error('Update live location error:', error.message);
    socket.emit('location_error', {
      message: error.message
    });
  }
};

export const handleStopLiveLocationSharing = async (socket) => {
  try {
    if (!socket.user || !socket.username) {
      socket.emit('location_error', {
        message: 'User not authenticated'
      });
      return;
    }

    const stoppedLocations = await LocationService.stopLiveLocationSharing(socket.user.id);

    if (stoppedLocations.length > 0) {
      // Leave live location room
      socket.leave(`live_location_${socket.user.id}`);

      // Emit live location stop to all users in the room
      socket.to('general').emit('live_location_stopped', {
        userId: socket.user.id,
        stoppedBy: socket.username,
        timestamp: new Date()
      });

      // Send confirmation to sender
      socket.emit('live_location_stopped_success', {
        stoppedLocations: stoppedLocations.map(loc => loc.toJSON())
      });

      // Publish live location stop event for scalability
      await publishMessage(CHANNELS.LIVE_LOCATION_STOPPED, {
        userId: socket.user.id,
        stoppedBy: socket.username,
        room: 'general'
      });

      logger.info(`Live location sharing stopped by ${socket.username}`);
    } else {
      socket.emit('location_error', {
        message: 'No active live location sharing found'
      });
    }
  } catch (error) {
    logger.error('Stop live location sharing error:', error.message);
    socket.emit('location_error', {
      message: error.message
    });
  }
};

export const handleGetActiveLocations = async (socket) => {
  try {
    if (!socket.user || !socket.username) {
      socket.emit('location_error', {
        message: 'User not authenticated'
      });
      return;
    }

    const liveLocations = await LocationService.getActiveLiveLocations();
    const recentLocations = await LocationService.getAllRecentLocations(24);

    socket.emit('active_locations', {
      liveLocations: liveLocations.map(loc => loc.toJSON()),
      recentLocations: recentLocations.map(loc => loc.toJSON())
    });

    logger.debug(`Active locations sent to ${socket.username}`);
  } catch (error) {
    logger.error('Get active locations error:', error.message);
    socket.emit('location_error', {
      message: 'Failed to fetch active locations'
    });
  }
};