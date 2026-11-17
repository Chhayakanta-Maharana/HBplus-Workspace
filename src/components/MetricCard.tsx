import React, { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../theme';

interface MetricCardProps {
  label: string;
  value: string;
  deltaText: string;
  icon: keyof typeof Ionicons.glyphMap;
  variant?: 'dark' | 'light';
  positive?: boolean;
  sparkHeights?: number[];
  animationIndex?: number;
}

const DEFAULT_SPARK = [32, 54, 42, 74, 58, 88, 72];
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export function MetricCard({
  label,
  value,
  deltaText,
  icon,
  variant = 'light',
  positive = true,
  sparkHeights = DEFAULT_SPARK,
  animationIndex = 0,
}: MetricCardProps) {
  const isDark = variant === 'dark';

  const [cardOpacity] = useState(() => new Animated.Value(0));
  const [cardTranslateY] = useState(() => new Animated.Value(18));
  const [sparkAnims] = useState(() =>
    sparkHeights.map(() => new Animated.Value(0))
  );

  const isNumericValue = /^\d+$/.test(value.trim());
  const targetNumber = isNumericValue ? Number.parseInt(value.trim(), 10) : 0;
  const [displayNumber, setDisplayNumber] = useState(
    isNumericValue ? 0 : targetNumber
  );

  // Staggered card + sparkline bar entrance animation
  useEffect(() => {
    const baseDelay = animationIndex * 90;

    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 420,
        delay: baseDelay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 460,
        delay: baseDelay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.stagger(
        45,
        sparkAnims.map((anim) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 520,
            delay: baseDelay + 120,
            easing: Easing.out(Easing.back(1.1)),
            useNativeDriver: false,
          })
        )
      ),
    ]).start();
  }, [animationIndex, cardOpacity, cardTranslateY, sparkAnims]);

  // Smooth count-up animation for numeric stats
  useEffect(() => {
    if (!isNumericValue) {
      return;
    }

    const counter = new Animated.Value(0);
    const listenerId = counter.addListener(({ value: v }) => {
      setDisplayNumber(Math.round(v));
    });

    Animated.timing(counter, {
      toValue: targetNumber,
      duration: 680,
      delay: animationIndex * 90 + 80,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => {
      counter.removeListener(listenerId);
      counter.stopAnimation();
    };
  }, [animationIndex, isNumericValue, targetNumber]);

  const renderedValue = isNumericValue ? String(displayNumber) : value;

  return (
    <Animated.View
      style={[
        styles.card,
        isDark ? styles.cardDark : styles.cardLight,
        {
          opacity: cardOpacity,
          transform: [{ translateY: cardTranslateY }],
        },
      ]}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconBox,
            isDark ? styles.iconBoxDark : styles.iconBoxLight,
          ]}
        >
          <Ionicons
            name={icon}
            size={18}
            color={isDark ? '#F59E0B' : '#EA580C'}
          />
        </View>
        <Ionicons
          name="ellipsis-vertical"
          size={15}
          color={isDark ? '#6B7280' : '#94A3B8'}
        />
      </View>

      <View style={styles.bodyRow}>
        <View style={styles.textGroup}>
          <Text
            style={[
              styles.label,
              isDark ? styles.labelDark : styles.labelLight,
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          <Text
            style={[
              styles.value,
              isDark ? styles.valueDark : styles.valueLight,
            ]}
            numberOfLines={1}
          >
            {renderedValue}
          </Text>
        </View>

        {/* Animated Mini Amber Sparkline */}
        <View style={styles.sparklineWrap} aria-hidden>
          {sparkHeights.map((pct, idx) => {
            const targetHeight = Math.max(8, Math.round((pct / 100) * 34));
            const animVal = sparkAnims[idx] ?? new Animated.Value(1);
            const animatedHeight = animVal.interpolate({
              inputRange: [0, 1],
              outputRange: [3, targetHeight],
            });

            return (
              <Animated.View
                key={`${label}-bar-${idx}`}
                style={[
                  styles.sparkBar,
                  {
                    height: animatedHeight,
                    backgroundColor:
                      idx === sparkHeights.length - 1
                        ? '#F59E0B'
                        : isDark
                          ? 'rgba(245, 158, 11, 0.42)'
                          : 'rgba(251, 146, 60, 0.36)',
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.deltaRow}>
        <Ionicons
          name={positive ? 'arrow-up' : 'shield-checkmark-outline'}
          size={12}
          color={positive ? '#10B981' : '#F59E0B'}
        />
        <Text
          style={[
            styles.deltaText,
            positive ? styles.deltaPositive : styles.deltaNeutral,
          ]}
          numberOfLines={1}
        >
          {deltaText}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    minWidth: 0,
    borderRadius: radii.lg + 4,
    padding: spacing.md + 2,
    gap: spacing.sm + 4,
    borderWidth: 1,
  },
  cardDark: {
    backgroundColor: '#141619',
    borderColor: '#23262C',
    ...Platform.select({
      web: {
        boxShadow: '0 8px 24px rgba(15, 23, 42, 0.14)',
      } as Record<string, unknown>,
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.18,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
      },
    }),
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(15, 23, 42, 0.04)',
      } as Record<string, unknown>,
      default: {
        shadowColor: '#0F172A',
        shadowOpacity: 0.05,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
      },
    }),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxDark: {
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.28)',
  },
  iconBoxLight: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  bodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  textGroup: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  labelDark: {
    color: '#9CA3AF',
  },
  labelLight: {
    color: '#64748B',
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  valueDark: {
    color: '#FFFFFF',
  },
  valueLight: {
    color: '#0F172A',
  },
  sparklineWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 36,
    paddingBottom: 2,
  },
  sparkBar: {
    width: 5,
    borderRadius: 3,
  },
  deltaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  deltaText: {
    fontSize: 11.5,
    fontWeight: '500',
    flex: 1,
  },
  deltaPositive: {
    color: '#10B981',
  },
  deltaNeutral: {
    color: '#D97706',
  },
});
