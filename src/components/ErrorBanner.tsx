import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radii, spacing } from '../theme';

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <Ionicons
        name="alert-circle"
        size={20}
        color={colors.error}
        style={styles.icon}
      />
      <Text style={styles.message}>{message}</Text>
      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Dismiss error message"
          style={({ pressed }) => [
            styles.dismissButton,
            pressed && styles.dismissPressed,
          ]}
        >
          <Ionicons name="close" size={18} color={colors.error} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.errorBackground,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm + 4,
  },
  icon: {
    marginTop: 1,
  },
  message: {
    flex: 1,
    color: colors.error,
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '500',
  },
  dismissButton: {
    padding: 2,
    borderRadius: radii.sm,
  },
  dismissPressed: {
    opacity: 0.7,
  },
});
