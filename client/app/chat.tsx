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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import Toast from "react-native-toast-message";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { SocketProvider, useSocket } from "@/contexts/SocketContext";
import { apiCall, API_ENDPOINTS } from "@/config/api";

const { width } = Dimensions.get("window");

interface Message {
  id: string;
  userId: string;
  username: string;
  content: string;
  type: string;
  timestamp: string;
}

function ChatContent() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (!user) {
    return <Redirect href="/login" />;
  }

  const [messageText, setMessageText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const { messages, sendMessage, onlineUsers, isConnected, isAuthenticated } =
    useSocket();
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadRecentMessages();
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
    }
  };

  const handleLogout = async () => {
    setShowMenu(false);

    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.userId === user?.id;
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
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
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputRow}>
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
              focusable={false}
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
      </View>

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
    </SafeAreaView>
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
      paddingTop: 12,
      paddingBottom: 12,
      paddingHorizontal: 20,
      elevation: 6,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
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
      backgroundColor: theme.isDark ? "#00a884" : "#0f7c70",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
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
      color: "#fff",
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
      maxWidth: width * 0.75,
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
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: theme.isDark
        ? "rgba(255,255,255,0.1)"
        : "rgba(0,0,0,0.1)",
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
    },
    textInputContainer: {
      flex: 1,
      backgroundColor: theme.isDark ? "#2a2f32" : "#fff",
      borderRadius: 24,
      marginRight: 8,
      minHeight: 48,
      maxHeight: 120,
      elevation: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      borderWidth: 1,
      borderColor: theme.isDark ? "#3a4a5c" : "#e1e8ed",
    },
    textInput: {
      flex: 1,
      fontSize: 16,
      color: theme.isDark ? "#e9edef" : "#2c3e50",
      paddingVertical: 5,
      paddingHorizontal: 16,
      textAlignVertical: "top",
      outline: "none",
      borderWidth: 0,
      outlineOffset: 0,
    },
    sendButton: {
      width: 50,
      height: 50,
      borderRadius: 25,
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
        : "rgba(18, 140, 126, 0.6)",
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
