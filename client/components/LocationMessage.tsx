import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { useTheme } from "@/contexts/ThemeContext";
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
  const insets = useSafeAreaInsets();

  const [showMapModal, setShowMapModal] = useState(false);

  const openInMaps = () => {
    setShowMapModal(true);
  };

  const formatCoordinates = () => {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  };

  const formatTime = () => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getLocationTypeText = () => {
    if (location.type === "live") {
      return location.isActive
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
    accuracyText: {
      fontSize: 11,
      color: isOwn ? "rgba(255,255,255,0.6)" : theme.colors.textSecondary,
    },
    liveIndicator: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: location.isActive ? "#4CAF50" : "#FF9800",
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
    liveStatusText: {
      color: "white",
      fontSize: isSmallScreen ? 9 : 10,
      fontWeight: "700",
      marginLeft: 4,
      letterSpacing: 0.3,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.locationIcon}>
          <Ionicons
            name={location.type === "live" ? "location" : "location-outline"}
            size={20}
            color={
              location.type === "live" && location.isActive
                ? "#4CAF50"
                : isOwn
                ? theme.isDark
                  ? "#fff"
                  : "#128c7e"
                : theme.colors.primary
            }
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.typeText}>{getLocationTypeText()}</Text>
          {!isOwn && <Text style={styles.usernameText}>{username}</Text>}
        </View>
        {location.type === "live" && (
          <View style={styles.liveIndicator}>
            <Ionicons name="radio-button-on" size={8} color="white" />
            <Text style={styles.liveIndicatorText}>
              {location.isActive ? "LIVE" : "STOPPED"}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.coordinatesContainer}>
        <Text style={styles.coordinatesText}>{formatCoordinates()}</Text>
      </View>

      {/* Mini map preview */}
      <View style={styles.mapPreview}>
        <LocationMapView location={location} height={120} interactive={false} />
      </View>

      <TouchableOpacity style={styles.actionButton} onPress={openInMaps}>
        <Ionicons name="map-outline" size={16} color="#ffffff" />
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
              location={location}
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
                    location.type === "live" ? "location" : "location-outline"
                  }
                  size={24}
                  color={
                    location.type === "live" && location.isActive
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
                {location.accuracy && (
                  <Text
                    style={[
                      styles.accuracyInfo,
                      { color: theme.colors.textSecondary },
                    ]}
                  >
                    Accuracy: ±{Math.round(location.accuracy)}m
                  </Text>
                )}
              </View>

              {location.type === "live" && (
                <View
                  style={[
                    styles.liveStatusBadge,
                    {
                      backgroundColor: location.isActive
                        ? "#4CAF50"
                        : "#FF9800",
                    },
                  ]}
                >
                  <Ionicons name="radio-button-on" size={12} color="white" />
                  <Text style={styles.liveStatusText}>
                    {location.isActive ? "LIVE" : "STOPPED"}
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
