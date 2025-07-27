import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Redirect } from "expo-router";
import Toast from "react-native-toast-message";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const { width, height } = Dimensions.get("window");

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  if (user) {
    return <Redirect href="/chat" />;
  }

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Toast.show({
        type: "error",
        text1: "Validation Error",
        text2: "Please enter both username and password",
      });
      return;
    }

    if (username.trim().length < 3) {
      Toast.show({
        type: "error",
        text1: "Invalid Username",
        text2: "Username must be at least 3 characters long",
      });
      return;
    }

    if (password.length < 6) {
      Toast.show({
        type: "error",
        text1: "Invalid Password",
        text2: "Password must be at least 6 characters long",
      });
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(username.trim(), password);

      if (success) {
        Toast.show({
          type: "success",
          text1: "Welcome!",
          text2: "Successfully logged in",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Login Failed",
          text2: "Please check your credentials and try again",
        });
      }
    } catch (error: any) {
      const errorMessage =
        error?.message || "Something went wrong. Please try again.";

      // Parse validation errors from backend
      if (errorMessage.includes("Password must be at least 6 characters")) {
        Toast.show({
          type: "error",
          text1: "Password Too Short",
          text2: "Password must be at least 6 characters long",
        });
      } else if (
        errorMessage.includes("Username must be at least 3 characters")
      ) {
        Toast.show({
          type: "error",
          text1: "Username Too Short",
          text2: "Username must be at least 3 characters long",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.backgroundPattern} />

          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Ionicons name="chatbubbles" size={28} color="#fff" />
              </View>
              <Text style={styles.title}>ChatApp</Text>
              <Text style={styles.subtitle}>
                Connect with friends instantly
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your username"
                  placeholderTextColor={
                    theme.isDark
                      ? "rgba(233, 237, 239, 0.5)"
                      : "rgba(44, 62, 80, 0.5)"
                  }
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  selectionColor={theme.isDark ? "#00a884" : "#128c7e"}
                  cursorColor={theme.isDark ? "#00a884" : "#128c7e"}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  placeholderTextColor={
                    theme.isDark
                      ? "rgba(233, 237, 239, 0.5)"
                      : "rgba(44, 62, 80, 0.5)"
                  }
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  selectionColor={theme.isDark ? "#00a884" : "#128c7e"}
                  cursorColor={theme.isDark ? "#00a884" : "#128c7e"}
                />
              </View>

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.buttonText}>Continue</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.infoText}>
                New to ChatApp? An account will be created automatically
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.isDark ? "#0b141a" : "#e5ddd5",
    },
    keyboardContainer: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      minHeight: height,
    },
    backgroundPattern: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: height * 0.55,
      backgroundColor: theme.isDark ? "#2a2f32" : "#128c7e",
    },
    content: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
      paddingTop: 10,
      paddingBottom: 10,
    },
    header: {
      alignItems: "center",
      marginBottom: 20,
    },
    logoContainer: {
      marginBottom: 11,
      padding: 15,
      borderRadius: 50,
      backgroundColor: "rgba(255,255,255,0.15)",
    },
    title: {
      fontSize: 34,
      fontWeight: "700",
      color: "#ffffff",
      marginBottom: 12,
      letterSpacing: -1,
    },
    subtitle: {
      fontSize: 16,
      color: "rgba(255,255,255,0.9)",
      textAlign: "center",
      fontWeight: "400",
    },
    form: {
      backgroundColor: theme.isDark ? "#1e2428" : "#ffffff",
      borderRadius: 16,
      padding: 32,
      marginHorizontal: 8,
      elevation: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
    },
    inputContainer: {
      marginBottom: 24,
    },
    inputLabel: {
      fontSize: 15,
      fontWeight: "600",
      color: theme.isDark ? "#e9edef" : "#2c3e50",
      marginBottom: 8,
    },
    input: {
      borderWidth: 1.5,
      borderColor: theme.isDark ? "#3a4a5c" : "#e1e8ed",
      borderRadius: 10,
      paddingHorizontal: 18,
      paddingVertical: 18,
      fontSize: 16,
      color: theme.isDark ? "#e9edef" : "#2c3e50",
      backgroundColor: theme.isDark ? "#2a2f32" : "#f8f9fa",
      fontWeight: "500",
    },
    button: {
      backgroundColor: theme.isDark ? "#00a884" : "#128c7e",
      borderRadius: 10,
      paddingVertical: 18,
      alignItems: "center",
      marginTop: 12,
      elevation: 4,
      shadowColor: theme.isDark ? "#00a884" : "#128c7e",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    buttonDisabled: {
      backgroundColor: theme.isDark ? "#3a4a5c" : "#bdc3c7",
      shadowOpacity: 0,
      elevation: 0,
    },
    buttonText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    infoText: {
      textAlign: "center",
      marginTop: 24,
      color: theme.isDark ? "rgba(233, 237, 239, 0.7)" : "#7f8c8d",
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "500",
    },
    themeToggle: {
      position: "absolute",
      top: 50,
      right: 24,
      backgroundColor: "rgba(255,255,255,0.15)",
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 25,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
      flexDirection: "row",
      alignItems: "center",
    },
    themeIcon: {
      marginRight: 6,
    },
    themeToggleText: {
      color: "#ffffff",
      fontSize: 14,
      fontWeight: "600",
    },
  });
