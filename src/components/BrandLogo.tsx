import React, { useEffect, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { spacing } from '../theme';

const hbPlusLogoImage = require('../../assets/hbplus-logo.png');

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  subtitle?: string;
  compact?: boolean;
  animated?: boolean;
}

export function BrandLogo({
  size = 'md',
  showTagline = false,
  subtitle = 'Internal Operations Portal',
  compact = false,
  animated = false,
}: BrandLogoProps) {
  const isLarge = size === 'lg';
  const isSmall = size === 'sm';
  const iconSize = isLarge ? 48 : isSmall ? 34 : 42;
  const borderRadius = isLarge ? 12 : isSmall ? 9 : 11;

  const [pulseAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!animated) {
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.045,
          duration: 1800,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [animated, pulseAnim]);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.iconFrame,
          {
            width: iconSize,
            height: iconSize,
            borderRadius,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Image
          source={hbPlusLogoImage}
          resizeMode="cover"
          style={[
            styles.iconImage,
            {
              width: iconSize,
              height: iconSize,
              borderRadius,
            },
          ]}
          accessibilityLabel="HB+ logo"
        />
      </Animated.View>

      {!compact ? (
        <View style={styles.wordmarkGroup}>
          <Text
            style={[
              styles.title,
              isLarge && styles.titleLarge,
              isSmall && styles.titleSmall,
            ]}
            numberOfLines={1}
          >
            HB<Text style={styles.plusAccent}>+</Text> Workspace
          </Text>
          {showTagline ? (
            <Text style={styles.tagline} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    minWidth: 0,
  },
  iconFrame: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    backgroundColor: '#000000',
    ...Platform.select({
      web: {
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
      } as Record<string, unknown>,
      default: {
        shadowColor: '#000000',
        shadowOpacity: 0.3,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
      },
    }),
  },
  iconImage: {
    backgroundColor: '#000000',
  },
  wordmarkGroup: {
    justifyContent: 'center',
    minWidth: 0,
    flexShrink: 1,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  titleLarge: {
    fontSize: 20,
  },
  titleSmall: {
    fontSize: 15,
  },
  plusAccent: {
    color: '#F59E0B',
  },
  tagline: {
    color: '#9CA3AF',
    fontSize: 11.5,
    marginTop: 1,
  },
});
