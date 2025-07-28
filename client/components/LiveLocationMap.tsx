import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Platform,
  StatusBar,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useSocket } from "@/contexts/SocketContext";
import { IconSymbol } from "@/components/ui/IconSymbol";

// Conditional import for react-native-maps (only on native platforms)
let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

// Type definitions for optional imports
type AnimatedRegion = any;

if (Platform.OS !== "web") {
  const Maps = require("react-native-maps");
  MapView = Maps.default;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

interface LiveLocationMapProps {
  visible: boolean;
  onClose: () => void;
}

interface LiveLocationMarker {
  userId: string;
  username: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  isActive: boolean;
  animatedCoordinate: AnimatedRegion;
}

const { width, height } = Dimensions.get("window");

export const LiveLocationMap: React.FC<LiveLocationMapProps> = ({
  visible,
  onClose,
}) => {
  const { theme } = useTheme();
  const { liveLocations, isLiveLocationActive } = useSocket();
  const mapRef = useRef<any>(null);
  const [markers, setMarkers] = useState<LiveLocationMarker[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  useEffect(() => {
    if (visible && liveLocations.length > 0) {
      // Update markers with smooth animation
      const newMarkers = liveLocations.map((location) => {
        const existingMarker = markers.find(
          (m) => m.userId === location.userId
        );

        let animatedCoordinate;
        // Create or update animated coordinate
        if (Platform.OS !== "web") {
          const { AnimatedRegion } = require("react-native-maps");
          animatedCoordinate = new AnimatedRegion({
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0,
            longitudeDelta: 0,
          });
        }

        return {
          userId: location.userId,
          username: location.username,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          timestamp: location.timestamp,
          isActive: location.isActive,
          animatedCoordinate,
        };
      });

      setMarkers(newMarkers);

      // Fit all markers in view
      if (newMarkers.length > 0 && mapRef.current) {
        const coordinates = newMarkers.map((marker) => ({
          latitude: marker.latitude,
          longitude: marker.longitude,
        }));

        setTimeout(() => {
          mapRef.current?.fitToCoordinates(coordinates, {
            edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
            animated: true,
          });
        }, 500);
      }
    }
  }, [liveLocations, visible]);

  const formatLastUpdate = (timestamp: string) => {
    const now = new Date();
    const updateTime = new Date(timestamp);
    const diffSeconds = Math.floor(
      (now.getTime() - updateTime.getTime()) / 1000
    );

    if (diffSeconds < 60) return `Updated ${diffSeconds}s ago`;
    if (diffSeconds < 3600)
      return `Updated ${Math.floor(diffSeconds / 60)}m ago`;
    return `Updated ${Math.floor(diffSeconds / 3600)}h ago`;
  };

  const getMarkerColor = (isActive: boolean) => {
    return isActive ? "#4CAF50" : "#FF9800";
  };

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
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} />

        {/* Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.background,
              borderBottomColor: theme.colors.border,
            },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <IconSymbol name="arrow.left" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Live Locations
          </Text>
          <View style={styles.headerRight}>
            <View
              style={[styles.liveIndicator, { backgroundColor: "#4CAF50" }]}
            >
              <IconSymbol name="circle.fill" size={8} color="white" />
              <Text style={styles.liveText}>
                {markers.filter((m) => m.isActive).length}
              </Text>
            </View>
          </View>
        </View>

        {/* Map */}
        <View style={styles.mapContainer}>
          {Platform.OS === "web" ? (
            <View
              style={[
                styles.webMapFallback,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <IconSymbol
                name="map"
                size={64}
                color={theme.colors.textSecondary}
              />
              <Text style={[styles.webMapTitle, { color: theme.colors.text }]}>
                Live Location Map
              </Text>
              <Text
                style={[
                  styles.webMapText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                Interactive maps are available on mobile devices
              </Text>
              {markers.length > 0 && (
                <View style={styles.webLocationList}>
                  <Text
                    style={[
                      styles.webLocationListTitle,
                      { color: theme.colors.text },
                    ]}
                  >
                    Active Locations ({markers.length})
                  </Text>
                  {markers.slice(0, 3).map((marker) => (
                    <Text
                      key={marker.userId}
                      style={[
                        styles.webLocationItem,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      📍 {marker.username}: {marker.latitude.toFixed(4)},{" "}
                      {marker.longitude.toFixed(4)}
                    </Text>
                  ))}
                  {markers.length > 3 && (
                    <Text
                      style={[
                        styles.webLocationItem,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      ... and {markers.length - 3} more
                    </Text>
                  )}
                </View>
              )}
            </View>
          ) : markers.length > 0 ? (
            <MapView
              ref={mapRef}
              provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
              style={styles.map}
              customMapStyle={mapStyle}
              showsUserLocation={true}
              showsMyLocationButton={true}
              mapType="standard"
              showsPointsOfInterest={false}
              showsCompass={true}
              showsScale={true}
              initialRegion={{
                latitude: markers[0]?.latitude || 37.78825,
                longitude: markers[0]?.longitude || -122.4324,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
            >
              {markers.map((marker) => (
                <Marker.Animated
                  key={`live-${marker.userId}`}
                  coordinate={marker.animatedCoordinate as any}
                  onPress={() =>
                    setSelectedUser(
                      selectedUser === marker.userId ? null : marker.userId
                    )
                  }
                >
                  <View
                    style={[
                      styles.customMarker,
                      {
                        backgroundColor: getMarkerColor(marker.isActive),
                        borderColor: theme.colors.background,
                        transform: [
                          { scale: selectedUser === marker.userId ? 1.2 : 1.0 },
                        ],
                      },
                    ]}
                  >
                    <IconSymbol name="location.fill" size={18} color="white" />
                    {marker.isActive && (
                      <>
                        <View style={styles.liveIndicatorMarker}>
                          <View style={styles.livePulse} />
                        </View>
                        <View
                          style={[
                            styles.pulseRing,
                            { borderColor: getMarkerColor(marker.isActive) },
                          ]}
                        />
                      </>
                    )}
                  </View>
                  <View
                    style={[
                      styles.usernameLabel,
                      {
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.usernameText,
                        { color: theme.colors.text },
                      ]}
                    >
                      {marker.username}
                    </Text>
                  </View>
                </Marker.Animated>
              ))}
            </MapView>
          ) : (
            <View
              style={[
                styles.noLocationContainer,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <IconSymbol
                name="location"
                size={48}
                color={theme.colors.textSecondary}
              />
              <Text
                style={[styles.noLocationTitle, { color: theme.colors.text }]}
              >
                No Live Locations
              </Text>
              <Text
                style={[
                  styles.noLocationText,
                  { color: theme.colors.textSecondary },
                ]}
              >
                When someone shares their live location, you'll see it here in
                real-time
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Panel - User List */}
        {markers.length > 0 && (
          <View
            style={[
              styles.bottomPanel,
              {
                backgroundColor: theme.colors.background,
                borderTopColor: theme.colors.border,
              },
            ]}
          >
            <Text style={[styles.bottomTitle, { color: theme.colors.text }]}>
              Active Locations ({markers.length})
            </Text>
            {markers.map((marker) => (
              <TouchableOpacity
                key={marker.userId}
                style={[
                  styles.userItem,
                  {
                    backgroundColor:
                      selectedUser === marker.userId
                        ? theme.colors.primary + "20"
                        : "transparent",
                    borderColor: theme.colors.border,
                  },
                ]}
                onPress={() => {
                  setSelectedUser(marker.userId);
                  mapRef.current?.animateToRegion(
                    {
                      latitude: marker.latitude,
                      longitude: marker.longitude,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    },
                    1000
                  );
                }}
              >
                <View style={styles.userInfo}>
                  <View
                    style={[
                      styles.userAvatar,
                      { backgroundColor: getMarkerColor(marker.isActive) },
                    ]}
                  >
                    <Text style={styles.userAvatarText}>
                      {marker.username.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.userDetails}>
                    <Text
                      style={[styles.userName, { color: theme.colors.text }]}
                    >
                      {marker.username}
                    </Text>
                    <Text
                      style={[
                        styles.userStatus,
                        { color: theme.colors.textSecondary },
                      ]}
                    >
                      {marker.isActive ? "Live • " : "Stopped • "}
                      {formatLastUpdate(marker.timestamp)}
                    </Text>
                    {marker.accuracy && (
                      <Text
                        style={[
                          styles.userAccuracy,
                          { color: theme.colors.textSecondary },
                        ]}
                      >
                        Accuracy: ±{Math.round(marker.accuracy)}m
                      </Text>
                    )}
                  </View>
                </View>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: getMarkerColor(marker.isActive) },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Your live location status */}
        {isLiveLocationActive && (
          <View
            style={[styles.myLocationStatus, { backgroundColor: "#4CAF50" }]}
          >
            <IconSymbol name="location.fill" size={16} color="white" />
            <Text style={styles.myLocationText}>
              You are sharing your live location
            </Text>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  headerRight: {
    alignItems: "center",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  noLocationContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  noLocationTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  noLocationText: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  customMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    position: "relative",
  },
  liveIndicatorMarker: {
    position: "absolute",
    top: -3,
    right: -3,
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
  pulseRing: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    opacity: 0.6,
  },
  usernameLabel: {
    position: "absolute",
    top: 40,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 60,
    alignItems: "center",
  },
  usernameText: {
    fontSize: 11,
    fontWeight: "600",
  },
  bottomPanel: {
    maxHeight: height * 0.4,
    borderTopWidth: 1,
    paddingTop: 16,
  },
  bottomTitle: {
    fontSize: 18,
    fontWeight: "600",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userAvatarText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  userStatus: {
    fontSize: 13,
    marginBottom: 2,
  },
  userAccuracy: {
    fontSize: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  myLocationStatus: {
    position: "absolute",
    top: 80,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  myLocationText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  webMapFallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  webMapTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  webMapText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  webLocationList: {
    alignSelf: "stretch",
    backgroundColor: "rgba(0,0,0,0.05)",
    padding: 16,
    borderRadius: 12,
  },
  webLocationListTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  webLocationItem: {
    fontSize: 14,
    marginBottom: 4,
  },
});
