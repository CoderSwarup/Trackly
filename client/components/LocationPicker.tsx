import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import * as Location from 'expo-location';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/ui/IconSymbol';

interface LocationPickerProps {
  onLocationSelect: (location: { latitude: number; longitude: number; accuracy?: number }) => void;
  onCancel: () => void;
  isLiveMode?: boolean;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  onLocationSelect,
  onCancel,
  isLiveMode = false
}) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<Location.LocationPermissionResponse | null>(null);

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    const { status } = await Location.getForegroundPermissionsAsync();
    setPermissionStatus({ status } as Location.LocationPermissionResponse);
  };

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus({ status } as Location.LocationPermissionResponse);
    return status === 'granted';
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      // Web fallback - use browser geolocation API
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) {
          Alert.alert('Error', 'Geolocation is not supported by this browser.');
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            onLocationSelect({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy || undefined,
            });
          },
          (error) => {
            Alert.alert('Error', 'Unable to get your current location. Please enable location permissions in your browser.');
            console.error('Web geolocation error:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          }
        );
        return;
      }

      // Native platform logic
      if (permissionStatus?.status !== 'granted') {
        const granted = await requestLocationPermission();
        if (!granted) {
          Alert.alert('Permission Denied', 'Location permission is required to share your location.');
          return;
        }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 1,
      });

      onLocationSelect({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
      });
    } catch (error) {
      Alert.alert('Error', 'Unable to get your current location. Please try again.');
      console.error('Location error:', error);
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      padding: 20,
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 15,
      borderTopRightRadius: 15,
      minHeight: 200,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    closeButton: {
      padding: 5,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    icon: {
      marginBottom: 15,
    },
    description: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
      lineHeight: 22,
    },
    button: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 30,
      paddingVertical: 12,
      borderRadius: 25,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    buttonText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    cancelButton: {
      marginTop: 15,
      padding: 10,
    },
    cancelText: {
      color: theme.colors.textSecondary,
      fontSize: 16,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isLiveMode ? 'Share Live Location' : 'Share Location'}
        </Text>
        <TouchableOpacity style={styles.closeButton} onPress={onCancel}>
          <IconSymbol name="xmark" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.icon}>
          <IconSymbol 
            name={isLiveMode ? "location.fill" : "location"} 
            size={50} 
            color={theme.colors.primary} 
          />
        </View>
        
        <Text style={styles.description}>
          {isLiveMode 
            ? 'Share your live location with the group for 1 hour. Your location will update in real-time.'
            : 'Share your current location with the group.'
          }
        </Text>

        <TouchableOpacity 
          style={styles.button} 
          onPress={getCurrentLocation}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <IconSymbol name="location.fill" size={16} color="white" />
          )}
          <Text style={styles.buttonText}>
            {loading ? 'Getting Location...' : 'Share Location'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};