import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { IconSymbol } from '@/components/ui/IconSymbol';

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
      paddingBottom: 34, // Safe area bottom
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
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
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
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Share Location</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <IconSymbol name="xmark" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.option} 
            onPress={onShareLocation}
            activeOpacity={0.7}
          >
            <View style={styles.optionIcon}>
              <IconSymbol name="location" size={20} color={theme.colors.primary} />
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
              <IconSymbol name="location.fill" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Share Live Location</Text>
              <Text style={styles.optionDescription}>
                Share your location for 1 hour with real-time updates
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};