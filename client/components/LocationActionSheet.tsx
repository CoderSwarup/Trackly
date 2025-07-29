import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface LocationActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onShareLocation: () => void;
  onShareLiveLocation: () => void;
}

export const LocationActionSheet: React.FC<LocationActionSheetProps> = ({
  visible,
  onClose,
  onShareLocation,
  onShareLiveLocation,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: theme.colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: Math.max(insets.bottom + 20, 40),
      maxHeight: '60%',
      minHeight: 280,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      paddingBottom: 10,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    closeButton: {
      padding: 5,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      marginBottom: 8,
      borderRadius: 12,
      marginHorizontal: 16,
    },
    optionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 15,
    },
    optionContent: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 2,
    },
    optionDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    liveLocationOption: {
      backgroundColor: theme.colors.primary + '10',
    },
    liveLocationIcon: {
      backgroundColor: theme.colors.primary + '30',
    },
    cancelButton: {
      marginTop: 16,
      marginHorizontal: 16,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      elevation: 1,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent={false}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.container} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Share Location</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.option} 
            onPress={onShareLocation}
            activeOpacity={0.7}
          >
            <View style={styles.optionIcon}>
              <Ionicons name="location-outline" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Share Current Location</Text>
              <Text style={styles.optionDescription}>
                Send your current location once
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.option, styles.liveLocationOption]} 
            onPress={onShareLiveLocation}
            activeOpacity={0.7}
          >
            <View style={[styles.optionIcon, styles.liveLocationIcon]}>
              <Ionicons name="location" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Share Live Location</Text>
              <Text style={styles.optionDescription}>
                Share your location for 1 hour with real-time updates
              </Text>
            </View>
          </TouchableOpacity>
          
          {/* Cancel Button */}
          <TouchableOpacity 
            style={[styles.cancelButton, { backgroundColor: theme.colors.surface }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelButtonText, { color: theme.colors.text }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};