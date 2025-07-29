import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
  SafeAreaView,
  Modal,
  Pressable,
  ActivityIndicator,
  StatusBar,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import Toast from "react-native-toast-message";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { SocketProvider, useSocket } from "@/contexts/SocketContext";
import { apiCall, API_ENDPOINTS } from "@/config/api";
import { LocationActionSheet } from "@/components/LocationActionSheet";
import { LocationPicker } from "@/components/LocationPicker";
import { LocationMessage } from "@/components/LocationMessage";
import { LiveLocationMap } from "@/components/LiveLocationMap";
import * as Location from "expo-location";

const { width, height } = Dimensions.get("window");
const isSmallScreen = width < 375;
const isTablet = width > 768;

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  type: "one_time" | "live";
  isActive?: boolean;
}

interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  type: string;
  timestamp: string;
  location?: LocationData;
}

function ChatContent() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showLocationSheet, setShowLocationSheet] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showLiveLocationMap, setShowLiveLocationMap] = useState(false);
  const [isLiveLocationMode, setIsLiveLocationMode] = useState(false);
  const {
    messages,
    sendMessage,
    onlineUsers,
    isConnected,
    isAuthenticated,
    shareLocation,
    startLiveLocation,
    updateLiveLocation,
    stopLiveLocation,
    liveLocations,
    isLiveLocationActive,
  } = useSocket();
  const flatListRef = useRef<FlatList>(null);
  const liveLocationInterval = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const shouldUpdateLocation = useRef(false);

  useEffect(() => {
    loadRecentMessages();
  }, []);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setIsKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener?.remove();
      keyboardDidShowListener?.remove();
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd();
    }
  }, [messages]);

  const loadRecentMessages = async () => {
    try {
      const response = await apiCall(`${API_ENDPOINTS.GET_MESSAGES}?limit=50`);
      if (response.success && response.data?.messages) {
        // Messages will be handled by socket context for real-time updates
        console.log("Recent messages loaded:", response.data.messages.length);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (messageText.trim()) {
      sendMessage(messageText);
      setMessageText("");
      // Keep keyboard open after sending
      if (Platform.OS === "ios") {
        // Small delay to prevent keyboard flicker
        setTimeout(() => {
          flatListRef.current?.scrollToEnd();
        }, 100);
      }
    }
  };

  const handleLogout = async () => {
    try {
      // Always stop location updates
      shouldUpdateLocation.current = false;
      if (liveLocationInterval.current) {
        clearInterval(liveLocationInterval.current);
        liveLocationInterval.current = null;
      }
      
      // Stop live location if active
      if (isLiveLocationActive) {
        stopLiveLocation();
      }
      
      // Close menu first to prevent re-render
      setShowMenu(false);
      
      // Perform logout
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleLocationMenuPress = () => {
    setShowLocationSheet(true);
  };

  const handleShareLocation = () => {
    setShowLocationSheet(false);
    setIsLiveLocationMode(false);
    setShowLocationPicker(true);
  };

  const handleShareLiveLocation = () => {
    setShowLocationSheet(false);
    setIsLiveLocationMode(true);
    setShowLocationPicker(true);
  };

  const handleLocationSelect = async (location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  }) => {
    setShowLocationPicker(false);

    try {
      if (isLiveLocationMode) {
        // Start live location sharing
        startLiveLocation(
          location.latitude,
          location.longitude,
          location.accuracy
        );

        // Set flag to enable location updates
        shouldUpdateLocation.current = true;
        
        // Set up periodic location updates every 30 seconds
        liveLocationInterval.current = setInterval(async () => {
          // Check if we should still update location
          if (!shouldUpdateLocation.current) {
            console.log("Location updates disabled, clearing interval");
            if (liveLocationInterval.current) {
              clearInterval(liveLocationInterval.current);
              liveLocationInterval.current = null;
            }
            return;
          }
          
          try {
            const currentLocation = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });
            updateLiveLocation(
              currentLocation.coords.latitude,
              currentLocation.coords.longitude,
              currentLocation.coords.accuracy || undefined
            );
          } catch (error) {
            console.error("Failed to update live location:", error);
          }
        }, 30000); // Update every 30 seconds

        Toast.show({
          type: "success",
          text1: "Live location started",
          text2: "Your location will be shared for 1 hour",
        });
      } else {
        // Share one-time location
        shareLocation(location.latitude, location.longitude, location.accuracy);
        Toast.show({
          type: "success",
          text1: "Location shared",
          text2: "Your current location has been sent",
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to share location. Please try again.");
      console.error("Location sharing error:", error);
    }
  };

  const handleStopLiveLocation = () => {
    console.log("handleStopLiveLocation called, isLiveLocationActive:", isLiveLocationActive);
    
    // Always disable the update flag and clear interval
    shouldUpdateLocation.current = false;
    if (liveLocationInterval.current) {
      console.log("Clearing live location interval");
      clearInterval(liveLocationInterval.current);
      liveLocationInterval.current = null;
    }
    
    if (isLiveLocationActive) {
      console.log("Stopping live location via socket");
      stopLiveLocation();
      Toast.show({
        type: "info",
        text1: "Live location stopped",
        text2: "Location sharing has been disabled",
      });
    } else {
      console.log("Live location already inactive, just cleared interval");
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldUpdateLocation.current = false;
      if (liveLocationInterval.current) {
        clearInterval(liveLocationInterval.current);
        liveLocationInterval.current = null;
      }
    };
  }, []);

  // Check user authentication after all hooks
  if (!user) {
    return <Redirect href="/login" />;
  }

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.userId === user.id;
    const messageTime = new Date(item.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Check if we need to show date separator
    const showDateSeparator =
      index === 0 ||
      new Date(item.timestamp).toDateString() !==
        new Date(messages[index - 1]?.timestamp).toDateString();

    const styles = createStyles(theme);

    // If this is a location message, render LocationMessage component
    if (item.type === "location" && item.location) {
      return (
        <>
          {showDateSeparator && (
            <View style={styles.dateSeparatorContainer}>
              <View style={styles.dateSeparator}>
                <Text style={styles.dateSeparatorText}>
                  {new Date(item.timestamp).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </Text>
              </View>
            </View>
          )}
          <View
            style={[styles.messageContainer, isOwnMessage && styles.ownMessage]}
          >
            {!isOwnMessage && (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.username.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <LocationMessage
              location={item.location}
              username={item.username}
              timestamp={item.timestamp}
              isOwn={isOwnMessage}
            />
          </View>
        </>
      );
    }

    // Regular text message
    return (
      <>
        {showDateSeparator && (
          <View style={styles.dateSeparatorContainer}>
            <View style={styles.dateSeparator}>
              <Text style={styles.dateSeparatorText}>
                {new Date(item.timestamp).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </View>
          </View>
        )}
        <View
          style={[styles.messageContainer, isOwnMessage && styles.ownMessage]}
        >
          {!isOwnMessage && (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View
            style={[
              styles.messageWrapper,
              isOwnMessage && styles.ownMessageWrapper,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                isOwnMessage && styles.ownMessageBubble,
              ]}
            >
              {!isOwnMessage && (
                <Text style={styles.username}>{item.username}</Text>
              )}
              <Text
                style={[
                  styles.messageText,
                  isOwnMessage && styles.ownMessageText,
                ]}
              >
                {item.content}
              </Text>
              <View style={styles.messageFooter}>
                <Text
                  style={[
                    styles.timestamp,
                    isOwnMessage && styles.ownTimestamp,
                  ]}
                >
                  {messageTime}
                </Text>
                {isOwnMessage && <Text style={styles.messageStatus}>✓</Text>}
              </View>
            </View>
          </View>
        </View>
      </>
    );
  };

  const styles = createStyles(theme);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.loadingContent}>
          <View style={styles.loadingIconContainer}>
            <Ionicons
              name="chatbubbles"
              size={60}
              color={theme.isDark ? "#00a884" : "#128c7e"}
            />
          </View>
          <ActivityIndicator
            size="large"
            color={theme.isDark ? "#00a884" : "#128c7e"}
            style={styles.loadingSpinner}
          />
          <Text style={styles.loadingTitle}>ChatApp</Text>
          <Text style={styles.loadingSubtitle}>
            Loading your conversations...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={theme.isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.isDark ? "#2a2f32" : "#128c7e"}
        translucent={false}
      />
      {/* Header with proper safe area */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.groupAvatar}>
              <Text style={styles.groupAvatarText}>TC</Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerTitle}>Team Chat</Text>
              <Text style={styles.headerSubtitle}>
                {isConnected && isAuthenticated ? (
                  <Text style={styles.onlineStatus}>
                    {onlineUsers.length} members online
                  </Text>
                ) : (
                  <Text style={styles.offlineStatus}>Connecting...</Text>
                )}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            {/* Live Location Map Button */}
            <TouchableOpacity
              onPress={() => setShowLiveLocationMap(true)}
              style={styles.headerButton}
            >
              <Ionicons name="map" size={20} color="#fff" />
              {liveLocations.length > 0 && (
                <View style={styles.liveLocationBadge}>
                  <Text style={styles.liveLocationBadgeText}>
                    {liveLocations.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleTheme} style={styles.headerButton}>
              <Ionicons
                name={theme.isDark ? "sunny" : "moon"}
                size={20}
                color="#fff"
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowMenu(true)}
              style={styles.headerButton}
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Messages */}
      <View style={styles.messagesContainer}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={[
            styles.messagesContent,
            { paddingBottom: isKeyboardVisible ? 20 : 16 },
          ]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          keyboardShouldPersistTaps="handled"
        />
      </View>

      {/* Input Area with keyboard-aware positioning */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 60 : 0}
      >
        <View
          style={[
            styles.inputContainer,
            {
              paddingBottom:
                Platform.OS === "ios"
                  ? Math.max(insets.bottom, 8)
                  : isKeyboardVisible
                  ? 8
                  : Math.max(insets.bottom, 8),
            },
          ]}
        >
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.locationButton}
              onPress={handleLocationMenuPress}
              disabled={!isConnected || !isAuthenticated}
            >
              <Ionicons
                name="location"
                size={20}
                color={
                  isConnected && isAuthenticated
                    ? theme.isDark
                      ? "#00a884"
                      : "#ffffff"
                    : "#999"
                }
              />
            </TouchableOpacity>
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Type a message..."
                placeholderTextColor={
                  theme.isDark ? "rgba(233, 237, 239, 0.5)" : "rgba(0,0,0,0.4)"
                }
                multiline
                maxLength={500}
                editable={isConnected && isAuthenticated}
                selectionColor={theme.isDark ? "#00a884" : "#128c7e"}
                cursorColor={theme.isDark ? "#00a884" : "#128c7e"}
              />
            </View>
            <TouchableOpacity
              style={[
                styles.sendButton,
                messageText.trim() && isConnected && isAuthenticated
                  ? styles.sendButtonActive
                  : styles.sendButtonInactive,
              ]}
              onPress={handleSendMessage}
              disabled={!messageText.trim() || !isConnected || !isAuthenticated}
              activeOpacity={0.8}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Live Location Status */}
          {isLiveLocationActive && (
            <View style={styles.liveLocationStatus}>
              <View style={styles.liveLocationIndicator}>
                <Ionicons name="radio-button-on" size={12} color="#4CAF50" />
                <Text style={styles.liveLocationText}>Live location is on</Text>
              </View>
              <TouchableOpacity onPress={handleStopLiveLocation}>
                <Text style={styles.stopLiveLocationText}>Stop</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={toggleTheme}>
              <Text style={styles.menuItemText}>
                {theme.isDark ? "Light Mode" : "Dark Mode"}
              </Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={[styles.menuItem, styles.logoutMenuItem]}
              onPress={handleLogout}
            >
              <Text style={[styles.menuItemText, styles.logoutText]}>
                Logout
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Location Action Sheet */}
      <LocationActionSheet
        visible={showLocationSheet}
        onClose={() => setShowLocationSheet(false)}
        onShareLocation={handleShareLocation}
        onShareLiveLocation={handleShareLiveLocation}
      />

      {/* Location Picker Modal */}
      <Modal
        visible={showLocationPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationPicker(false)}
      >
        <View style={styles.locationPickerOverlay}>
          <LocationPicker
            onLocationSelect={handleLocationSelect}
            onCancel={() => setShowLocationPicker(false)}
            isLiveMode={isLiveLocationMode}
          />
        </View>
      </Modal>

      {/* Live Location Map */}
      <LiveLocationMap
        visible={showLiveLocationMap}
        onClose={() => setShowLiveLocationMap(false)}
      />
    </View>
  );
}

export default function ChatScreen() {
  return (
    <SocketProvider>
      <ChatContent />
    </SocketProvider>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.isDark ? "#0b141a" : "#e5ddd5",
    },
    loadingContainer: {
      flex: 1,
      backgroundColor: theme.isDark ? "#0b141a" : "#e5ddd5",
    },
    loadingContent: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 32,
    },
    loadingIconContainer: {
      marginBottom: 24,
      padding: 20,
      borderRadius: 50,
      backgroundColor: theme.isDark
        ? "rgba(0, 168, 132, 0.1)"
        : "rgba(18, 140, 126, 0.1)",
    },
    loadingSpinner: {
      marginBottom: 24,
    },
    loadingTitle: {
      fontSize: 28,
      fontWeight: "700",
      color: theme.isDark ? "#e9edef" : "#2c3e50",
      marginBottom: 8,
      letterSpacing: -0.5,
    },
    loadingSubtitle: {
      fontSize: 16,
      color: theme.isDark
        ? "rgba(233, 237, 239, 0.7)"
        : "rgba(44, 62, 80, 0.7)",
      textAlign: "center",
      fontWeight: "400",
    },

    // Header Styles - Professional
    header: {
      backgroundColor: theme.isDark ? "#2a2f32" : "#128c7e",
      paddingBottom: 12,
      paddingHorizontal: 20,
      elevation: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      zIndex: 1000,
    },
    headerContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    groupAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.isDark ? "#00a884" : "#ffffff",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      borderWidth: theme.isDark ? 0 : 2,
      borderColor: theme.isDark ? "transparent" : "rgba(255,255,255,0.3)",
    },
    avatarIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: "rgba(255,255,255,0.3)",
    },
    headerInfo: {
      flex: 1,
    },
    headerTitle: {
      color: "#fff",
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 3,
      letterSpacing: -0.3,
    },
    headerSubtitle: {
      fontSize: 13,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    onlineIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#25d366",
      marginRight: 6,
    },
    onlineStatus: {
      color: "#fff",
      opacity: 0.8,
      fontSize: 13,
    },
    offlineStatus: {
      color: "#fff",
      opacity: 0.6,
    },
    headerRight: {
      flexDirection: "row",
      alignItems: "center",
    },
    headerButton: {
      width: 42,
      height: 42,
      borderRadius: 21,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 10,
      backgroundColor: "rgba(255,255,255,0.1)",
    },
    headerButtonIcon: {
      color: "#fff",
      fontSize: 18,
    },
    groupAvatarText: {
      color: theme.isDark ? "#fff" : "#128c7e",
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 0.5,
    },

    // Date Separator
    dateSeparatorContainer: {
      alignItems: "center",
      marginVertical: 16,
    },
    dateSeparator: {
      backgroundColor: theme.isDark
        ? "rgba(255,255,255,0.15)"
        : "rgba(0,0,0,0.1)",
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    dateSeparatorText: {
      color: theme.isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.6)",
      fontSize: 12,
      fontWeight: "500",
    },

    // Messages Container
    messagesContainer: {
      flex: 1,
    },
    // Message Styles - WhatsApp-like
    messagesList: {
      flex: 1,
      paddingHorizontal: 12,
    },
    messagesContent: {
      paddingTop: 20,
      paddingBottom: 16,
    },
    messageContainer: {
      flexDirection: "row",
      marginBottom: 12,
      alignItems: "flex-end",
    },
    ownMessage: {
      flexDirection: "row-reverse",
    },
    avatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.isDark ? "#00a884" : "#128c7e",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
      marginBottom: 4,
    },
    avatarText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "700",
    },
    messageWrapper: {
      maxWidth: isTablet ? width * 0.6 : width * 0.75,
      position: "relative",
    },
    ownMessageWrapper: {
      alignSelf: "flex-end",
    },
    messageBubble: {
      backgroundColor: theme.isDark ? "#262d31" : "#fff",
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 12,
      elevation: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
    },
    ownMessageBubble: {
      backgroundColor: theme.isDark ? "#005c4b" : "#d1f2eb",
    },
    messageTail: {
      position: "absolute",
      bottom: 0,
      left: -6,
      width: 0,
      height: 0,
      borderTopWidth: 10,
      borderTopColor: theme.isDark ? "#262d31" : "#fff",
      borderRightWidth: 10,
      borderRightColor: "transparent",
    },
    ownMessageTail: {
      left: "auto",
      right: -6,
      borderTopColor: theme.isDark ? "#005c4b" : "#d1f2eb",
      borderLeftWidth: 10,
      borderLeftColor: "transparent",
      borderRightWidth: 0,
    },
    username: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.isDark ? "#00a884" : "#128c7e",
      marginBottom: 3,
    },
    messageText: {
      fontSize: 15,
      color: theme.isDark ? "#e9edef" : "#2c3e50",
      lineHeight: 22,
      fontWeight: "400",
    },
    ownMessageText: {
      color: theme.isDark ? "#e9edef" : "#2c3e50",
    },
    messageFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      marginTop: 6,
    },
    timestamp: {
      fontSize: 11,
      color: theme.isDark ? "rgba(233, 237, 239, 0.6)" : "rgba(0,0,0,0.5)",
    },
    ownTimestamp: {
      color: theme.isDark ? "rgba(233, 237, 239, 0.6)" : "rgba(0,0,0,0.5)",
    },
    messageStatus: {
      fontSize: 14,
      color: theme.isDark ? "#00a884" : "#128c7e",
      marginLeft: 4,
      fontWeight: "600",
    },

    // Input Area - WhatsApp-like
    inputContainer: {
      backgroundColor: theme.isDark ? "#1e2428" : "#f0f2f5",
      paddingHorizontal: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.isDark
        ? "rgba(255,255,255,0.1)"
        : "rgba(0,0,0,0.1)",
      minHeight: 72,
      position: "relative",
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
    },
    textInputContainer: {
      flex: 1,
      backgroundColor: theme.isDark ? "#2a2f32" : "#fff",
      borderRadius: isSmallScreen ? 22 : 24,
      marginHorizontal: 8,
      minHeight: isSmallScreen ? 44 : 48,
      maxHeight: isSmallScreen ? 100 : 120,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      borderWidth: 1,
      borderColor: theme.isDark ? "#3a4a5c" : "#e1e8ed",
      justifyContent: "center",
    },
    textInput: {
      flex: 1,
      fontSize: isSmallScreen ? 14 : 16,
      color: theme.isDark ? "#e9edef" : "#2c3e50",
      paddingVertical: 12,
      paddingHorizontal: isSmallScreen ? 12 : 16,
      textAlignVertical: "center",
      minHeight: isSmallScreen ? 44 : 48,
      outline: "none",
      borderWidth: 0,
      outlineOffset: 0,
    },
    sendButton: {
      width: isSmallScreen ? 44 : 48,
      height: isSmallScreen ? 44 : 48,
      borderRadius: isSmallScreen ? 22 : 24,
      justifyContent: "center",
      alignItems: "center",
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 5,
    },
    sendButtonActive: {
      backgroundColor: theme.isDark ? "#00a884" : "#128c7e",
    },
    sendButtonInactive: {
      backgroundColor: theme.isDark
        ? "rgba(0, 168, 132, 0.6)"
        : "rgba(18, 140, 126, 0.7)",
    },
    locationButton: {
      width: isSmallScreen ? 44 : 48,
      height: isSmallScreen ? 44 : 48,
      borderRadius: isSmallScreen ? 22 : 24,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.isDark ? "rgba(255,255,255,0.1)" : "#128c7e",
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
    },
    liveLocationStatus: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: theme.isDark ? "#2a2f32" : "#fff",
      marginTop: 8,
      marginHorizontal: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: "#4CAF50",
      elevation: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    liveLocationIndicator: {
      flexDirection: "row",
      alignItems: "center",
    },
    liveLocationText: {
      color: theme.isDark ? "#e9edef" : "#2c3e50",
      fontSize: 14,
      marginLeft: 6,
      fontWeight: "500",
    },
    stopLiveLocationText: {
      color: "#FF5722",
      fontSize: 14,
      fontWeight: "600",
    },
    locationPickerOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    liveLocationBadge: {
      position: "absolute",
      top: -2,
      right: -2,
      backgroundColor: "#4CAF50",
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "#fff",
    },
    liveLocationBadgeText: {
      color: "#fff",
      fontSize: 11,
      fontWeight: "600",
    },
    // Menu Modal Styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.4)",
      justifyContent: "flex-start",
      alignItems: "flex-end",
      paddingTop: 95,
      paddingRight: 20,
    },
    menuContainer: {
      backgroundColor: theme.isDark ? "#2a2f32" : "#fff",
      borderRadius: 12,
      minWidth: 170,
      paddingVertical: 12,
      elevation: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
    },
    menuItem: {
      paddingHorizontal: 20,
      paddingVertical: 14,
    },
    menuItemText: {
      fontSize: 16,
      color: theme.isDark ? "#e9edef" : "#2c3e50",
      fontWeight: "600",
    },
    menuDivider: {
      height: 1,
      backgroundColor: theme.isDark
        ? "rgba(255,255,255,0.15)"
        : "rgba(0,0,0,0.1)",
      marginVertical: 6,
    },
    logoutMenuItem: {
      // Additional styling for logout if needed
    },
    logoutText: {
      color: "#e74c3c",
    },
  });
