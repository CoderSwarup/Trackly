import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { LocationMapView } from './LocationMapView';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  type: 'one_time' | 'live';
  isActive?: boolean;
}

interface LocationMessageProps {
  location: LocationData;
  username: string;
  timestamp: string;
  isOwn: boolean;
}

export const LocationMessage: React.FC<LocationMessageProps> = ({
  location,
  username,
  timestamp,
  isOwn
}) => {
  const { theme } = useTheme();

  const [showMapModal, setShowMapModal] = useState(false);

  const openInMaps = () => {
    setShowMapModal(true);
  };

  const formatCoordinates = () => {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  };

  const formatTime = () => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getLocationTypeText = () => {
    if (location.type === 'live') {
      return location.isActive ? 'Live Location (Active)' : 'Live Location (Stopped)';
    }
    return 'Location';
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: isOwn ? (theme.isDark ? '#005c4b' : '#d1f2eb') : (theme.isDark ? '#262d31' : '#fff'),
      padding: 12,
      borderRadius: 15,
      borderBottomRightRadius: isOwn ? 5 : 15,
      borderBottomLeftRadius: isOwn ? 15 : 5,
      maxWidth: 280,
      alignSelf: isOwn ? 'flex-end' : 'flex-start',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    locationIcon: {
      marginRight: 8,
    },
    headerText: {
      flex: 1,
    },
    typeText: {
      fontSize: 14,
      fontWeight: '600',
      color: isOwn ? '#fff' : theme.colors.text,
    },
    usernameText: {
      fontSize: 12,
      color: isOwn ? 'rgba(255,255,255,0.8)' : theme.colors.textSecondary,
      marginTop: 2,
    },
    coordinatesContainer: {
      backgroundColor: isOwn ? 'rgba(255,255,255,0.1)' : theme.colors.surface,
      padding: 8,
      borderRadius: 8,
      marginBottom: 8,
    },
    coordinatesText: {
      fontSize: 12,
      fontFamily: 'monospace',
      color: isOwn ? '#fff' : theme.colors.textSecondary,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isOwn ? 'rgba(255,255,255,0.2)' : theme.colors.primary,
      padding: 8,
      borderRadius: 8,
      marginBottom: 8,
    },
    actionButtonText: {
      color: isOwn ? '#fff' : 'white',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 6,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    timestampText: {
      fontSize: 11,
      color: isOwn ? 'rgba(255,255,255,0.6)' : theme.colors.textSecondary,
    },
    accuracyText: {
      fontSize: 11,
      color: isOwn ? 'rgba(255,255,255,0.6)' : theme.colors.textSecondary,
    },
    liveIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: location.isActive ? '#4CAF50' : '#FF9800',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      marginLeft: 8,
    },
    liveIndicatorText: {
      color: 'white',
      fontSize: 10,
      fontWeight: '600',
      marginLeft: 4,
    },
    mapPreview: {
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 8,
    },
    mapModalContainer: {
      flex: 1,
    },
    mapModalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      paddingTop: 50, // Account for status bar
    },
    mapModalClose: {
      padding: 8,
    },
    mapModalTitle: {
      fontSize: 18,
      fontWeight: '600',
      flex: 1,
      textAlign: 'center',
    },
    mapModalRight: {
      width: 40, // Balance the close button
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.locationIcon}>
          <IconSymbol 
            name={location.type === 'live' ? 'location.fill' : 'location'} 
            size={20} 
            color={location.type === 'live' && location.isActive ? '#4CAF50' : (isOwn ? '#fff' : theme.colors.primary)} 
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.typeText}>{getLocationTypeText()}</Text>
          {!isOwn && <Text style={styles.usernameText}>{username}</Text>}
        </View>
        {location.type === 'live' && (
          <View style={styles.liveIndicator}>
            <IconSymbol 
              name="circle.fill" 
              size={6} 
              color="white" 
            />
            <Text style={styles.liveIndicatorText}>
              {location.isActive ? 'LIVE' : 'STOPPED'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.coordinatesContainer}>
        <Text style={styles.coordinatesText}>{formatCoordinates()}</Text>
      </View>

      {/* Mini map preview */}
      <View style={styles.mapPreview}>
        <LocationMapView 
          location={location}
          height={120}
          interactive={false}
        />
      </View>

      <TouchableOpacity style={styles.actionButton} onPress={openInMaps}>
        <IconSymbol name="map" size={16} color={isOwn ? '#fff' : 'white'} />
        <Text style={styles.actionButtonText}>View on Map</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.timestampText}>{formatTime()}</Text>
        {location.accuracy && (
          <Text style={styles.accuracyText}>
            ±{Math.round(location.accuracy)}m
          </Text>
        )}
      </View>

      {/* Full screen map modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowMapModal(false)}
      >
        <View style={styles.mapModalContainer}>
          <View style={[styles.mapModalHeader, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={() => setShowMapModal(false)} style={styles.mapModalClose}>
              <IconSymbol name="xmark" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.mapModalTitle, { color: theme.colors.text }]}>
              {getLocationTypeText()}
            </Text>
            <View style={styles.mapModalRight} />
          </View>
          <LocationMapView 
            location={location}
            height={600}
            interactive={true}
            showCurrentUser={true}
          />
        </View>
      </Modal>
    </View>
  );
};