import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useSocket } from "@/contexts/SocketContext";
import { Ionicons } from "@expo/vector-icons";

// Conditional import for react-native-maps (only on native platforms)
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

// Type definitions for optional imports
type Region = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type AnimatedRegion = any;

if (Platform.OS !== "web") {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  type: "one_time" | "live";
  isActive?: boolean;
}

interface LocationMapViewProps {
  location?: LocationData;
  showCurrentUser?: boolean;
  showAllLocations?: boolean;
  height?: number;
  interactive?: boolean;
  zoomLevel?: "close" | "medium" | "far";
  showControls?: boolean;
}

interface LiveLocationMarker {
  userId: string;
  username: string;
  location: LocationData;
  animatedCoordinate?: AnimatedRegion;
}

const { width, height } = Dimensions.get("window");

export const LocationMapView: React.FC<LocationMapViewProps> = ({
  location,
  showCurrentUser = false,
  showAllLocations = false,
  height: customHeight = 200,
  interactive = true,
  zoomLevel = "medium",
  showControls = true,
}) => {
  const { theme } = useTheme();
  const { liveLocations } = useSocket();
  const mapRef = useRef<any>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [liveMarkers, setLiveMarkers] = useState<LiveLocationMarker[]>([]);
  const [currentZoom, setCurrentZoom] = useState(zoomLevel);
  const [mapReady, setMapReady] = useState(false);

  const getZoomDelta = (level: string) => {
    switch (level) {
      case "close":
        return { latitudeDelta: 0.005, longitudeDelta: 0.005 };
      case "medium":
        return { latitudeDelta: 0.01, longitudeDelta: 0.01 };
      case "far":
        return { latitudeDelta: 0.05, longitudeDelta: 0.05 };
      default:
        return { latitudeDelta: 0.01, longitudeDelta: 0.01 };
    }
  };

  useEffect(() => {
    if (location) {
      const zoomDeltas = getZoomDelta(currentZoom);
      const newRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        ...zoomDeltas,
      };
      setRegion(newRegion);

      // Animate to the location with better timing
      if (mapRef.current && mapReady) {
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.animateToRegion(newRegion, 800);
          }
        }, 100);
      }
    }
  }, [location, currentZoom, mapReady]);

  useEffect(() => {
    if (showAllLocations && liveLocations.length > 0) {
      // Update live markers with smooth animation
      const newMarkers = liveLocations.map((liveLocation) => {
        const existingMarker = liveMarkers.find(
          (m) => m.userId === liveLocation.userId
        );

        let animatedCoordinate = existingMarker?.animatedCoordinate;
        
        // Create or update animated coordinate
        if (Platform.OS !== "web") {
          const { AnimatedRegion } = require("react-native-maps");
          
          if (existingMarker && existingMarker.animatedCoordinate) {
            // Animate existing coordinate to new position
            animatedCoordinate = existingMarker.animatedCoordinate;
            animatedCoordinate.timing({
              latitude: liveLocation.latitude,
              longitude: liveLocation.longitude,
              duration: 1000,
              useNativeDriver: false,
            }).start();
          } else {
            // Create new animated coordinate for new marker
            animatedCoordinate = new AnimatedRegion({
              latitude: liveLocation.latitude,
              longitude: liveLocation.longitude,
              latitudeDelta: 0,
              longitudeDelta: 0,
            });
          }
        }

        return {
          userId: liveLocation.userId,
          username: liveLocation.username,
          location: {
            latitude: liveLocation.latitude,
            longitude: liveLocation.longitude,
            accuracy: liveLocation.accuracy,
            timestamp: liveLocation.timestamp,
            type: "live" as const,
            isActive: liveLocation.isActive,
          },
          animatedCoordinate,
        };
      });

      setLiveMarkers(newMarkers);

      // Fit all markers in view
      if (newMarkers.length > 0 && mapRef.current && mapReady) {
        const coordinates = newMarkers.map((marker) => ({
          latitude: marker.location.latitude,
          longitude: marker.location.longitude,
        }));

        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.fitToCoordinates(coordinates, {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: true,
            });
          }
        }, 100);
      }
    }
  }, [liveLocations, showAllLocations, mapReady]);

  const getMarkerColor = (
    locationType: "one_time" | "live",
    isActive?: boolean
  ) => {
    if (locationType === "live") {
      return isActive ? "#4CAF50" : "#FF9800";
    }
    return theme.colors.primary;
  };

  const renderMarker = (
    markerLocation: LocationData,
    key: string,
    username?: string,
    animated?: boolean,
    animatedCoordinate?: AnimatedRegion
  ) => {
    if (animated && animatedCoordinate) {
      return (
        <Marker.Animated
          key={key}
          coordinate={animatedCoordinate as any}
          title={username || "Location"}
          description={`${
            markerLocation.type === "live" ? "Live Location" : "Shared Location"
          } ${
            markerLocation.accuracy
              ? `(±${Math.round(markerLocation.accuracy)}m)`
              : ""
          }`}
          pinColor={getMarkerColor(
            markerLocation.type,
            markerLocation.isActive
          )}
        >
          <View
            style={[
              styles.customMarker,
              {
                backgroundColor: getMarkerColor(
                  markerLocation.type,
                  markerLocation.isActive
                ),
                borderColor: theme.colors.background,
              },
            ]}
          >
            <Ionicons
              name={
                markerLocation.type === "live" ? "location" : "location-outline"
              }
              size={16}
              color="white"
            />
            {markerLocation.type === "live" && markerLocation.isActive && (
              <View style={styles.liveIndicator}>
                <View style={styles.livePulse} />
              </View>
            )}
          </View>
          {username && (
            <View
              style={[
                styles.usernameLabel,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <Text style={[styles.usernameText, { color: theme.colors.text }]}>
                {username}
              </Text>
            </View>
          )}
        </Marker.Animated>
      );
    }

    return (
      <Marker
        key={key}
        coordinate={{
          latitude: markerLocation.latitude,
          longitude: markerLocation.longitude,
        }}
        title={username || "Location"}
        description={`${
          markerLocation.type === "live" ? "Live Location" : "Shared Location"
        } ${
          markerLocation.accuracy
            ? `(±${Math.round(markerLocation.accuracy)}m)`
            : ""
        }`}
        pinColor={getMarkerColor(markerLocation.type, markerLocation.isActive)}
      >
        <View
          style={[
            styles.customMarker,
            {
              backgroundColor: getMarkerColor(
                markerLocation.type,
                markerLocation.isActive
              ),
              borderColor: theme.colors.background,
            },
          ]}
        >
          <Ionicons
            name={
              markerLocation.type === "live" ? "location" : "location-outline"
            }
            size={16}
            color="white"
          />
          {markerLocation.type === "live" && markerLocation.isActive && (
            <View style={styles.liveIndicator}>
              <View style={styles.livePulse} />
            </View>
          )}
        </View>
        {username && (
          <View
            style={[
              styles.usernameLabel,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <Text style={[styles.usernameText, { color: theme.colors.text }]}>
              {username}
            </Text>
          </View>
        )}
      </Marker>
    );
  };

  // Web fallback - show a placeholder
  if (Platform.OS === "web") {
    return (
      <View
        style={[
          styles.webFallback,
          { height: customHeight, backgroundColor: theme.colors.surface },
        ]}
      >
        <Ionicons
          name="map-outline"
          size={32}
          color={theme.colors.textSecondary}
        />
        <Text style={[styles.webFallbackText, { color: theme.colors.text }]}>
          Interactive Map
        </Text>
        <Text
          style={[
            styles.webFallbackSubtext,
            { color: theme.colors.textSecondary },
          ]}
        >
          {location
            ? `Location: ${location.latitude.toFixed(
                4
              )}, ${location.longitude.toFixed(4)}`
            : "Maps are available on mobile devices"}
        </Text>
      </View>
    );
  }

  if (!region && !location && (!showAllLocations || liveMarkers.length === 0)) {
    return (
      <View
        style={[
          styles.noLocationContainer,
          { height: customHeight, backgroundColor: theme.colors.surface },
        ]}
      >
        <Ionicons
          name="location-outline"
          size={32}
          color={theme.colors.textSecondary}
        />
        <Text
          style={[styles.noLocationText, { color: theme.colors.textSecondary }]}
        >
          No location data available
        </Text>
      </View>
    );
  }

  // Use default Google Maps styling for better visibility
  const mapStyle = undefined;

  const handleZoomIn = () => {
    if (mapRef.current && location && mapReady) {
      const currentRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta:
          currentZoom === "far"
            ? 0.01
            : currentZoom === "medium"
            ? 0.005
            : 0.002,
        longitudeDelta:
          currentZoom === "far"
            ? 0.01
            : currentZoom === "medium"
            ? 0.005
            : 0.002,
      };

      if (mapRef.current) {
        mapRef.current.animateToRegion(currentRegion, 300);
      }

      if (currentZoom === "far") setCurrentZoom("medium");
      else if (currentZoom === "medium") setCurrentZoom("close");
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current && location && mapReady) {
      const currentRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta:
          currentZoom === "close"
            ? 0.01
            : currentZoom === "medium"
            ? 0.05
            : 0.1,
        longitudeDelta:
          currentZoom === "close"
            ? 0.01
            : currentZoom === "medium"
            ? 0.05
            : 0.1,
      };

      if (mapRef.current) {
        mapRef.current.animateToRegion(currentRegion, 300);
      }

      if (currentZoom === "close") setCurrentZoom("medium");
      else if (currentZoom === "medium") setCurrentZoom("far");
    }
  };

  const handleMyLocation = () => {
    if (location && mapRef.current && mapReady) {
      const zoomDeltas = getZoomDelta("close");
      const newRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        ...zoomDeltas,
      };

      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 800);
      }
      setCurrentZoom("close");
    }
  };

  return (
    <View
      style={[styles.container, { height: customHeight }]}
      pointerEvents="box-none"
    >
      <MapView
        ref={mapRef}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        style={[styles.map, { flex: 1 }]}
        pointerEvents="auto"
        onMapReady={() => setMapReady(true)}
        onRegionChangeComplete={(region: any) => {
          // Update zoom level based on region changes
          if (region.latitudeDelta < 0.008) setCurrentZoom("close");
          else if (region.latitudeDelta < 0.03) setCurrentZoom("medium");
          else setCurrentZoom("far");
        }}
        initialRegion={
          region || {
            latitude: location?.latitude || 37.78825,
            longitude: location?.longitude || -122.4324,
            ...getZoomDelta(currentZoom),
          }
        }
        // Essential gesture controls
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={interactive}
        pitchEnabled={interactive}
        // Map configuration
        mapType="standard"
        showsUserLocation={showCurrentUser}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsBuildings={true}
        showsTraffic={false}
        showsPointsOfInterest={true}
        loadingEnabled={false}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
        minZoomLevel={3}
        maxZoomLevel={20}
      >
        {/* Single location marker */}
        {location && renderMarker(location, "single-location")}

        {/* Multiple live location markers */}
        {showAllLocations &&
          liveMarkers.map((marker) =>
            renderMarker(
              marker.location,
              `live-${marker.userId}`,
              marker.username,
              true,
              marker.animatedCoordinate
            )
          )}
      </MapView>

      {/* Enhanced Map Controls */}
      {interactive && showControls && (
        <View style={styles.mapControlsContainer} pointerEvents="box-none">
          <View style={styles.zoomControls} pointerEvents="box-none">
            <TouchableOpacity
              style={[
                styles.zoomButton,
                { backgroundColor: theme.colors.background },
              ]}
              onPress={handleZoomIn}
              disabled={currentZoom === "close"}
            >
              <Ionicons
                name="add"
                size={20}
                color={
                  currentZoom === "close"
                    ? theme.colors.textSecondary
                    : theme.colors.text
                }
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.zoomButton,
                styles.zoomButtonBottom,
                { backgroundColor: theme.colors.background },
              ]}
              onPress={handleZoomOut}
              disabled={currentZoom === "far"}
            >
              <Ionicons
                name="remove"
                size={20}
                color={
                  currentZoom === "far"
                    ? theme.colors.textSecondary
                    : theme.colors.text
                }
              />
            </TouchableOpacity>
          </View>

          {location && (
            <TouchableOpacity
              style={[
                styles.myLocationButton,
                { backgroundColor: theme.colors.background },
              ]}
              onPress={handleMyLocation}
            >
              <Ionicons name="locate" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Location info overlay for single location */}
      {location && !showAllLocations && (
        <View
          style={[
            styles.locationInfo,
            { backgroundColor: theme.colors.background },
          ]}
          pointerEvents="none"
        >
          <View style={styles.locationInfoContent}>
            <Ionicons
              name={location.type === "live" ? "location" : "location-outline"}
              size={16}
              color={getMarkerColor(location.type, location.isActive)}
            />
            <Text
              style={[styles.locationInfoText, { color: theme.colors.text }]}
            >
              {location.type === "live" ? "Live Location" : "Shared Location"}
            </Text>
            {location.accuracy && (
              <Text
                style={[
                  styles.accuracyText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                ±{Math.round(location.accuracy)}m
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    flex: 1,
  },
  noLocationContainer: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  noLocationText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: "center",
  },
  webFallback: {
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#ccc",
  },
  webFallbackText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  webFallbackSubtext: {
    marginTop: 4,
    fontSize: 12,
    textAlign: "center",
  },
  customMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    position: "relative",
  },
  liveIndicator: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "white",
  },
  usernameLabel: {
    position: "absolute",
    top: 35,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  usernameText: {
    fontSize: 10,
    fontWeight: "600",
  },
  locationInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  locationInfoContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationInfoText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  accuracyText: {
    fontSize: 12,
  },
  mapControlsContainer: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 1000,
  },
  zoomControls: {
    marginBottom: 12,
  },
  zoomButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  zoomButtonBottom: {
    marginTop: 2,
  },
  myLocationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
});
