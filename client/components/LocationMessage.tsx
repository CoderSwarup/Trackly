import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Animated,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
import { useSocket } from "@/contexts/SocketContext";
import { Ionicons } from "@expo/vector-icons";
import { LocationMapView } from "./LocationMapView";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  type: "one_time" | "live";
  isActive?: boolean;
}

interface LocationMessageProps {
  location: LocationData;
  username: string;
  timestamp: string;
  isOwn: boolean;
}

const { width, height } = Dimensions.get("window");
const isSmallScreen = width < 375;
const isTablet = width > 768;

export const LocationMessage: React.FC<LocationMessageProps> = ({
  location,
  username,
  timestamp,
  isOwn,
}) => {
  const { theme } = useTheme();
  const { liveLocations } = useSocket();
  const insets = useSafeAreaInsets();

  const [showMapModal, setShowMapModal] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [currentLocation, setCurrentLocation] = useState(location);

  // Animation for live location pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Update location data from live locations if it's a live location
  useEffect(() => {
    if (location.type === "live") {
      const liveLocationUpdate = liveLocations.find(
        (liveLocation) => liveLocation.username === username
      );

      if (liveLocationUpdate) {
        setCurrentLocation({
          latitude: liveLocationUpdate.latitude,
          longitude: liveLocationUpdate.longitude,
          accuracy: liveLocationUpdate.accuracy,
          timestamp: liveLocationUpdate.timestamp,
          type: "live",
          isActive: liveLocationUpdate.isActive,
        });
      }
    }
  }, [
    liveLocations,
    location.type,
    location.latitude,
    location.longitude,
    username,
  ]);

  useEffect(() => {
    if (currentLocation.type === "live" && currentLocation.isActive) {
      // Start pulsing animation for live locations
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    }
  }, [currentLocation.type, currentLocation.isActive, pulseAnim]);

  // Update time display for live locations
  useEffect(() => {
    if (currentLocation.type === "live" && currentLocation.isActive) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 5000); // Update every 5 seconds for active live locations

      return () => clearInterval(interval);
    }
  }, [currentLocation.type, currentLocation.isActive]);

  const openInMaps = () => {
    setShowMapModal(true);
  };

  const formatCoordinates = () => {
    return `${currentLocation.latitude.toFixed(
      6
    )}, ${currentLocation.longitude.toFixed(6)}`;
  };

  const formatTime = () => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatLocationTime = () => {
    if (currentLocation.timestamp) {
      const locationDate = new Date(currentLocation.timestamp);
      const diffSeconds = Math.floor(
        (currentTime - locationDate.getTime()) / 1000
      );

      if (diffSeconds < 10) return "Just now";
      if (diffSeconds < 60) return `${diffSeconds}s ago`;
      if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
      return `${Math.floor(diffSeconds / 3600)}h ago`;
    }
    return "";
  };

  const getLocationTypeText = () => {
    if (currentLocation.type === "live") {
      return currentLocation.isActive
        ? "Live Location (Active)"
        : "Live Location (Stopped)";
    }
    return "Location";
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: isOwn
        ? theme.isDark
          ? "#005c4b"
          : "#dcf8c6"
        : theme.isDark
        ? "#262d31"
        : "#ffffff",
      padding: 12,
      borderRadius: 15,
      width: "50%",
      borderBottomRightRadius: isOwn ? 5 : 15,
      borderBottomLeftRadius: isOwn ? 15 : 5,
      maxWidth: isTablet ? width * 0.6 : width * 0.75,
      alignSelf: isOwn ? "flex-end" : "flex-start",
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    locationIcon: {
      marginRight: 8,
    },
    animatedLocationIcon: {
      alignItems: "center",
      justifyContent: "center",
    },
    headerText: {
      flex: 1,
    },
    typeText: {
      fontSize: 14,
      fontWeight: "600",
      color: isOwn ? (theme.isDark ? "#fff" : "#2c3e50") : theme.colors.text,
    },
    usernameText: {
      fontSize: 12,
      color: isOwn ? "rgba(255,255,255,0.8)" : theme.colors.textSecondary,
      marginTop: 2,
    },
    coordinatesContainer: {
      backgroundColor: isOwn
        ? theme.isDark
          ? "rgba(255,255,255,0.1)"
          : "rgba(44, 62, 80, 0.1)"
        : theme.isDark
        ? theme.colors.surface
        : "#f8f9fa",
      padding: 8,
      borderRadius: 8,
      marginBottom: 8,
    },
    coordinatesRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    detailsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    coordinatesText: {
      fontSize: 12,
      fontFamily: "monospace",
      color: isOwn
        ? theme.isDark
          ? "#fff"
          : "#2c3e50"
        : theme.isDark
        ? theme.colors.textSecondary
        : "#6c757d",
      flex: 1,
    },
    locationTimeText: {
      fontSize: 10,
      color:
        currentLocation.type === "live" && currentLocation.isActive
          ? "#4CAF50"
          : "#FF9800",
      fontWeight: "600",
      marginLeft: 8,
    },
    accuracyBadge: {
      fontSize: 10,
      color: isOwn
        ? theme.isDark
          ? "rgba(255,255,255,0.7)"
          : "rgba(44, 62, 80, 0.7)"
        : theme.isDark
        ? "rgba(233, 237, 239, 0.7)"
        : "rgba(108, 117, 125, 0.8)",
      fontStyle: "italic",
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isOwn
        ? theme.isDark
          ? "rgba(255,255,255,0.2)"
          : "#128c7e"
        : theme.isDark
        ? theme.colors.primary
        : "#128c7e",
      padding: 10,
      borderRadius: 8,
      marginBottom: 8,
      elevation: 1,
    },
    actionButtonText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 6,
    },
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    timestampText: {
      fontSize: 11,
      color: isOwn ? "rgba(255,255,255,0.6)" : theme.colors.textSecondary,
    },
    statusContainer: {
      flexDirection: "row",
      alignItems: "center",
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 4,
    },
    statusText: {
      fontSize: 11,
      color: isOwn ? "rgba(255,255,255,0.8)" : theme.colors.text,
      fontWeight: "500",
    },
    accuracyText: {
      fontSize: 11,
      color: isOwn ? "rgba(255,255,255,0.6)" : theme.colors.textSecondary,
    },
    liveIndicator: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: currentLocation.isActive ? "#4CAF50" : "#FF9800",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      marginLeft: 8,
    },
    liveIndicatorText: {
      color: "white",
      fontSize: 10,
      fontWeight: "600",
      marginLeft: 4,
    },
    liveStatusText: {
      fontSize: 10,
      color: "#4CAF50",
      fontWeight: "600",
      fontStyle: "italic",
    },
    mapPreview: {
      borderRadius: 8,
      overflow: "hidden",
      marginBottom: 8,
    },
    mapModalContainer: {
      flex: 1,
      width: "100%",
      height: "100%",
    },
    mapModalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: isSmallScreen ? 12 : 16,
      paddingVertical: isSmallScreen ? 12 : 16,
      borderBottomWidth: 1,
      elevation: 4,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      minHeight: isSmallScreen ? 56 : 64,
    },
    mapModalClose: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    headerInfo: {
      flex: 1,
      marginHorizontal: 16,
      alignItems: "center",
    },
    mapModalTitle: {
      fontSize: 18,
      fontWeight: "700",
      textAlign: "center",
    },
    mapModalSubtitle: {
      fontSize: 13,
      textAlign: "center",
      marginTop: 2,
    },
    shareButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    fullMapContainer: {
      flex: 1,
      backgroundColor: theme.colors.surface,
    },
    bottomInfoCard: {
      borderTopWidth: 1,
      paddingHorizontal: isSmallScreen ? 16 : 20,
      paddingTop: isSmallScreen ? 12 : 16,
      elevation: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      width: "100%",
      minHeight: isSmallScreen ? 100 : 120,
      maxHeight: height * 0.25,
    },
    infoRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: isSmallScreen ? 8 : 12,
    },
    locationIconContainer: {
      width: isSmallScreen ? 44 : 48,
      height: isSmallScreen ? 44 : 48,
      borderRadius: isSmallScreen ? 22 : 24,
      backgroundColor: theme.isDark
        ? theme.colors.primary + "30"
        : theme.colors.primary + "20",
      justifyContent: "center",
      alignItems: "center",
      marginRight: isSmallScreen ? 12 : 16,
      flexShrink: 0,
    },
    infoContent: {
      flex: 1,
      paddingRight: 8,
    },
    coordinatesTitle: {
      fontSize: isSmallScreen ? 15 : 16,
      fontWeight: "600",
      marginBottom: 4,
      lineHeight: isSmallScreen ? 20 : 22,
    },
    coordinatesValue: {
      fontSize: isSmallScreen ? 13 : 14,
      fontFamily: "monospace",
      marginBottom: 4,
      lineHeight: isSmallScreen ? 16 : 18,
    },
    accuracyInfo: {
      fontSize: isSmallScreen ? 11 : 12,
      lineHeight: isSmallScreen ? 14 : 16,
    },
    liveStatusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: isSmallScreen ? 6 : 8,
      paddingVertical: isSmallScreen ? 3 : 4,
      borderRadius: isSmallScreen ? 10 : 12,
      marginLeft: isSmallScreen ? 6 : 8,
      alignSelf: "flex-start",
      flexShrink: 0,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.locationIcon}>
          {currentLocation.type === "live" && currentLocation.isActive ? (
            <Animated.View
              style={[
                styles.animatedLocationIcon,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Ionicons name="location" size={20} color="#4CAF50" />
            </Animated.View>
          ) : (
            <Ionicons
              name={
                currentLocation.type === "live"
                  ? "location"
                  : "location-outline"
              }
              size={20}
              color={
                currentLocation.type === "live" && !currentLocation.isActive
                  ? "#FF9800"
                  : isOwn
                  ? theme.isDark
                    ? "#fff"
                    : "#128c7e"
                  : theme.colors.primary
              }
            />
          )}
        </View>
        <View style={styles.headerText}>
          <Text style={styles.typeText}>{getLocationTypeText()}</Text>
          {currentLocation.type === "live" && (
            <Animated.View
              style={{ opacity: currentLocation.isActive ? pulseAnim : 1 }}
            >
              <Text style={styles.locationTimeText}>
                {formatLocationTime()}
              </Text>
            </Animated.View>
          )}
        </View>
      </View>

      <View style={styles.coordinatesContainer}>
        <View style={styles.coordinatesRow}>
          <Text style={styles.coordinatesText}>{formatCoordinates()}</Text>
        </View>

        <View style={styles.detailsRow}>
          {currentLocation.accuracy && (
            <Text style={styles.accuracyBadge}>
              ±{Math.round(currentLocation.accuracy)}m accuracy
            </Text>
          )}
          {currentLocation.type === "live" && currentLocation.isActive && (
            <Text style={styles.liveStatusText}>📍 Updating live</Text>
          )}
        </View>
      </View>

      {/* Mini map preview */}
      <View style={styles.mapPreview}>
        <LocationMapView
          location={currentLocation}
          height={120}
          interactive={false}
        />
      </View>

      <TouchableOpacity style={styles.actionButton} onPress={openInMaps}>
        <Ionicons name="map-outline" size={16} color="#ffffff" />
        <Text style={styles.actionButtonText}>View on Map</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.timestampText}>{formatTime()}</Text>
        {currentLocation.type === "live" && (
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: currentLocation.isActive
                    ? "#4CAF50"
                    : "#FF9800",
                },
              ]}
            />
            <Text style={styles.statusText}>
              {currentLocation.isActive ? "Live" : "Stopped"}
            </Text>
          </View>
        )}
      </View>

      {/* Enhanced Full Screen Map Modal */}
      <Modal
        visible={showMapModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setShowMapModal(false)}
      >
        <SafeAreaView
          style={[
            styles.mapModalContainer,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <StatusBar
            barStyle={theme.isDark ? "light-content" : "dark-content"}
          />

          {/* Professional Header */}
          <View
            style={[
              styles.mapModalHeader,
              {
                backgroundColor: theme.colors.background,
                borderBottomColor: theme.colors.border,
                paddingTop: insets.top > 0 ? 0 : 12,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => setShowMapModal(false)}
              style={[
                styles.mapModalClose,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>

            <View style={styles.headerInfo}>
              <Text
                style={[styles.mapModalTitle, { color: theme.colors.text }]}
              >
                {getLocationTypeText()}
              </Text>
              <Text
                style={[
                  styles.mapModalSubtitle,
                  { color: theme.colors.textSecondary },
                ]}
              >
                {!isOwn ? `Shared by ${username}` : "Your location"} •{" "}
                {formatTime()}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.shareButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={() => {
                // Add share functionality here
              }}
            >
              <Ionicons name="share-outline" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Full Height Interactive Map */}
          <View style={styles.fullMapContainer} pointerEvents="box-none">
            <LocationMapView
              location={currentLocation}
              height={
                height -
                insets.top -
                insets.bottom -
                (isSmallScreen ? 160 : 180)
              }
              interactive={true}
              showCurrentUser={true}
              zoomLevel="close"
              showControls={true}
            />
          </View>

          {/* Bottom Information Card */}
          <View
            style={[
              styles.bottomInfoCard,
              {
                backgroundColor: theme.colors.background,
                borderTopColor: theme.colors.border,
                paddingBottom: Math.max(insets.bottom + 20, 40),
              },
            ]}
          >
            <View style={styles.infoRow}>
              <View style={styles.locationIconContainer}>
                <Ionicons
                  name={
                    currentLocation.type === "live"
                      ? "location"
                      : "location-outline"
                  }
                  size={24}
                  color={
                    currentLocation.type === "live" && currentLocation.isActive
                      ? "#4CAF50"
                      : theme.colors.primary
                  }
                />
              </View>

              <View style={styles.infoContent}>
                <Text
                  style={[
                    styles.coordinatesTitle,
                    { color: theme.colors.text },
                  ]}
                >
                  Coordinates
                </Text>
                <Text
                  style={[
                    styles.coordinatesValue,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  {formatCoordinates()}
                </Text>
                {currentLocation.accuracy && (
                  <Text
                    style={[
                      styles.accuracyInfo,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Accuracy: ±{Math.round(currentLocation.accuracy)}m
                  </Text>
                )}
              </View>

              {currentLocation.type === "live" && (
                <View
                  style={[
                    styles.liveStatusBadge,
                    {
                      backgroundColor: currentLocation.isActive
                        ? "#4CAF50"
                        : "#FF9800",
                    },
                  ]}
                >
                  <Ionicons name="radio-button-on" size={12} color="white" />
                  <Text style={styles.liveStatusText}>
                    {currentLocation.isActive ? "LIVE" : "STOPPED"}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};
