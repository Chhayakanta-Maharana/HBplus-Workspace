import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, radii, spacing } from '../theme';

interface GoogleSignInButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

function GoogleMark() {
  return (
    <View style={styles.googleBadge} aria-hidden>
      <Text style={styles.googleLetter}>G</Text>
    </View>
  );
}

export function GoogleSignInButton({
  onPress,
  loading = false,
  disabled = false,
}: GoogleSignInButtonProps) {
  const isDisabled = loading || disabled;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      style={({ pressed }) => [
        styles.button,
        pressed && !isDisabled && styles.buttonPressed,
        isDisabled && styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <View style={styles.contentRow}>
          <ActivityIndicator size="small" color={colors.googleButtonText} />
          <Text style={styles.label}>Signing in with Google...</Text>
        </View>
      ) : (
        <View style={styles.contentRow}>
          <GoogleMark />
          <Text style={styles.label}>Continue with Google</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    minHeight: 48,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.22)',
      } as Record<string, unknown>,
      default: {
        shadowColor: '#000000',
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
      },
    }),
  },
  buttonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.72,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm + 4,
  },
  googleBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  googleLetter: {
    fontSize: 13,
    fontWeight: '800',
    color: '#4285F4',
  },
  label: {
    color: colors.googleButtonText,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
});
