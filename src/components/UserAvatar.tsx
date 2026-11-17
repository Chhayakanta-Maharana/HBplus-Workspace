import React, { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

interface UserAvatarProps {
  name: string;
  photoURL: string | null;
  size?: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return 'U';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function UserAvatar({ name, photoURL, size = 40 }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const borderRadius = size / 2;

  if (photoURL && !imageError) {
    return (
      <Image
        source={{ uri: photoURL }}
        onError={() => setImageError(true)}
        style={[
          styles.image,
          { width: size, height: size, borderRadius },
        ]}
        accessibilityLabel={`${name} avatar`}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { width: size, height: size, borderRadius },
      ]}
      accessibilityLabel={`${name} initials`}
    >
      <Text style={[styles.initials, { fontSize: Math.max(11, Math.round(size * 0.36)) }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.panelElevated,
  },
  fallback: {
    backgroundColor: colors.accentMuted,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.accent,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
