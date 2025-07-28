import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, Platform } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useSocket } from "@/contexts/SocketContext";
import { IconSymbol } from "@/components/ui/IconSymbol";

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
}) => {
  const { theme } = useTheme();
  const { liveLocations } = useSocket();
  const mapRef = useRef<any>(null);
  const [region, setRegion] = useState<Region | null>(null);
  const [liveMarkers, setLiveMarkers] = useState<LiveLocationMarker[]>([]);

  useEffect(() => {
    if (location) {
      const newRegion = {
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      setRegion(newRegion);

      // Animate to the location
      if (mapRef.current) {
        mapRef.current.animateToRegion(newRegion, 1000);
      }
    }
  }, [location]);

  useEffect(() => {
    if (showAllLocations && liveLocations.length > 0) {
      // Update live markers with animation
      const newMarkers = liveLocations.map((liveLocation) => {
        const existingMarker = liveMarkers.find(
          (m) => m.userId === liveLocation.userId
        );

        let animatedCoordinate;
        // Create or update animated coordinate
        if (Platform.OS !== "web") {
          const { AnimatedRegion } = require("react-native-maps");
          animatedCoordinate = new AnimatedRegion({
            latitude: liveLocation.latitude,
            longitude: liveLocation.longitude,
            latitudeDelta: 0,
            longitudeDelta: 0,
          });
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
      if (newMarkers.length > 0 && mapRef.current) {
        const coordinates = newMarkers.map((marker) => ({
          latitude: marker.location.latitude,
          longitude: marker.location.longitude,
        }));

        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    }
  }, [liveLocations, showAllLocations]);

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
            <IconSymbol
              name={
                markerLocation.type === "live" ? "location.fill" : "location"
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
          <IconSymbol
            name={markerLocation.type === "live" ? "location.fill" : "location"}
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
        <IconSymbol name="map" size={32} color={theme.colors.textSecondary} />
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
        <IconSymbol
          name="location"
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

  const mapStyle = theme.isDark
    ? [
        {
          featureType: "all",
          elementType: "geometry",
          stylers: [{ color: "#242f3e" }],
        },
        {
          featureType: "all",
          elementType: "labels.text.stroke",
          stylers: [{ lightness: -80 }],
        },
        {
          featureType: "administrative",
          elementType: "labels.text.fill",
          stylers: [{ color: "#746855" }],
        },
        {
          featureType: "road",
          elementType: "geometry.fill",
          stylers: [{ color: "#2b3544" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#17263c" }],
        },
      ]
    : undefined;

  return (
    <View style={[styles.container, { height: customHeight }]}>
      <MapView
        ref={mapRef}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        style={styles.map}
        initialRegion={
          region || {
            latitude: 37.78825,
            longitude: -122.4324,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }
        }
        customMapStyle={mapStyle}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={interactive}
        pitchEnabled={interactive}
        showsUserLocation={showCurrentUser}
        showsMyLocationButton={interactive && showCurrentUser}
        mapType="standard"
        showsPointsOfInterest={false}
        showsCompass={interactive}
        showsScale={interactive}
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

      {/* Location info overlay for single location */}
      {location && !showAllLocations && (
        <View
          style={[
            styles.locationInfo,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <View style={styles.locationInfoContent}>
            <IconSymbol
              name={location.type === "live" ? "location.fill" : "location"}
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
});
