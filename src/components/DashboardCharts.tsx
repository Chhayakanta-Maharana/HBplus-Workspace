import React, { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radii, spacing } from '../theme';
import type { RecentSignInRecord } from '../types/auth';

interface DashboardChartsProps {
  records: RecentSignInRecord[];
  allowedDomain: string;
  isWide: boolean;
}

const WEEKLY_ACTIVITY = [
  { label: 'Mon', signIns: 42, active: 30 },
  { label: 'Tue', signIns: 58, active: 44 },
  { label: 'Wed', signIns: 51, active: 39 },
  { label: 'Thu', signIns: 76, active: 60 },
  { label: 'Fri', signIns: 94, active: 78, highlight: true },
  { label: 'Sat', signIns: 64, active: 48 },
  { label: 'Sun', signIns: 82, active: 68 },
];

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export function DashboardCharts({
  records,
  allowedDomain,
  isWide,
}: DashboardChartsProps) {
  const [chartMode, setChartMode] = useState<'signIns' | 'active'>('signIns');

  const [cardFade] = useState(() => new Animated.Value(0));
  const [cardSlide] = useState(() => new Animated.Value(18));
  const [barHeights] = useState(() =>
    WEEKLY_ACTIVITY.map(() => new Animated.Value(6))
  );
  const [tooltipScale] = useState(() => new Animated.Value(0.7));
  const [donutScale] = useState(() => new Animated.Value(0.78));
  const [donutSpin] = useState(() => new Animated.Value(0));

  // Entrance animation for cards & donut chart
  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardFade, {
        toValue: 1,
        duration: 480,
        delay: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(cardSlide, {
        toValue: 0,
        duration: 500,
        delay: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.spring(donutScale, {
        toValue: 1,
        friction: 7,
        tension: 65,
        delay: 240,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(donutSpin, {
        toValue: 1,
        duration: 780,
        delay: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, [cardFade, cardSlide, donutScale, donutSpin]);

  // Animate bars smoothly on mount AND whenever user switches Sign-Ins <-> Active
  useEffect(() => {
    tooltipScale.setValue(0.78);

    Animated.parallel([
      Animated.stagger(
        55,
        WEEKLY_ACTIVITY.map((point, idx) => {
          const rawVal =
            chartMode === 'signIns' ? point.signIns : point.active;
          const targetHeight = Math.max(24, Math.round((rawVal / 100) * 124));
          return Animated.timing(barHeights[idx], {
            toValue: targetHeight,
            duration: 520,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false,
          });
        })
      ),
      Animated.spring(tooltipScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        delay: 280,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, [barHeights, chartMode, tooltipScale]);

  const totalMembers = Math.max(records.length, 1);
  const adminCount = records.filter((r) => r.role === 'admin').length;

  const adminPct = Math.round((adminCount / totalMembers) * 100);
  const userPct = Math.max(100 - adminPct, 0);

  const breakdownItems = [
    { label: 'Verified Domain', pct: '100%', color: '#F97316' },
    { label: 'Standard Users', pct: `${userPct}%`, color: '#FACC15' },
    { label: 'Workspace Admins', pct: `${adminPct}%`, color: '#18181B' },
    { label: 'Blocked Domains', pct: '0%', color: '#CBD5E1' },
  ];

  const donutRotate = donutSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['-35deg', '0deg'],
  });

  return (
    <Animated.View
      style={[
        styles.row,
        !isWide && styles.rowStacked,
        {
          opacity: cardFade,
          transform: [{ translateY: cardSlide }],
        },
      ]}
    >
      {/* Left Card: Animated Authentication Overview */}
      <View style={[styles.card, isWide && styles.overviewCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <View style={styles.miniIcon}>
              <Ionicons name="stats-chart" size={15} color="#EA580C" />
            </View>
            <View style={styles.titleTextWrap}>
              <Text style={styles.cardTitle}>Authentication Overview</Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                Verified @{allowedDomain} sessions across web &amp; mobile
              </Text>
            </View>
          </View>

          <View style={styles.pillToggle}>
            <Pressable
              onPress={() => setChartMode('signIns')}
              style={[
                styles.toggleItem,
                chartMode === 'signIns' && styles.toggleItemActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  chartMode === 'signIns' && styles.toggleTextActive,
                ]}
              >
                Sign-Ins
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setChartMode('active')}
              style={[
                styles.toggleItem,
                chartMode === 'active' && styles.toggleItemActive,
              ]}
            >
              <Text
                style={[
                  styles.toggleText,
                  chartMode === 'active' && styles.toggleTextActive,
                ]}
              >
                Active
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Animated Chart Area */}
        <View style={styles.chartCanvas}>
          <View style={styles.gridOverlay} pointerEvents="none">
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
            <View style={styles.gridLine} />
          </View>

          <View style={styles.barsRow}>
            {WEEKLY_ACTIVITY.map((point, idx) => (
              <View key={point.label} style={styles.barColumn}>
                {point.highlight ? (
                  <Animated.View
                    style={[
                      styles.tooltipPill,
                      { transform: [{ scale: tooltipScale }] },
                    ]}
                  >
                    <Text style={styles.tooltipText}>{totalMembers} live</Text>
                  </Animated.View>
                ) : (
                  <View style={styles.tooltipSpacer} />
                )}

                <View style={styles.barTrack}>
                  <Animated.View
                    style={[
                      styles.barFill,
                      { height: barHeights[idx] },
                      point.highlight
                        ? styles.barFillHighlight
                        : styles.barFillDefault,
                    ]}
                  >
                    <View
                      style={[
                        styles.barTopCap,
                        point.highlight && styles.barTopCapHighlight,
                      ]}
                    />
                  </Animated.View>
                </View>

                <Text
                  style={[
                    styles.barLabel,
                    point.highlight && styles.barLabelHighlight,
                  ]}
                >
                  {point.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Right Card: Animated Access Breakdown Donut */}
      <View style={[styles.card, isWide && styles.breakdownCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.titleRow}>
            <View style={styles.miniIconDark}>
              <Ionicons name="pie-chart" size={14} color="#FFFFFF" />
            </View>
            <Text style={styles.cardTitle}>Access Breakdown</Text>
          </View>
          <View style={styles.periodChip}>
            <Text style={styles.periodText}>Live</Text>
          </View>
        </View>

        <View style={styles.donutSection}>
          <Animated.View
            style={[
              styles.donutRing,
              {
                transform: [{ scale: donutScale }, { rotate: donutRotate }],
              },
            ]}
          >
            <View style={styles.donutInner}>
              <Text style={styles.donutValue}>{totalMembers}</Text>
              <Text style={styles.donutCaption}>Verified</Text>
            </View>
          </Animated.View>

          <View style={styles.legendList}>
            {breakdownItems.map((item) => (
              <View key={item.label} style={styles.legendRow}>
                <View style={styles.legendLeft}>
                  <View
                    style={[styles.legendDot, { backgroundColor: item.color }]}
                  />
                  <Text style={styles.legendLabel} numberOfLines={1}>
                    {item.label}
                  </Text>
                </View>
                <Text style={styles.legendPct}>{item.pct}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowStacked: {
    flexDirection: 'column',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: radii.lg + 4,
    padding: spacing.lg - 4,
    gap: spacing.md,
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
  overviewCard: {
    flex: 1.55,
  },
  breakdownCard: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    flex: 1,
    minWidth: 0,
  },
  titleTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  miniIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniIconDark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#141619',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 1,
  },
  pillToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: radii.pill,
    padding: 3,
    gap: 2,
  },
  toggleItem: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radii.pill,
    ...Platform.select({
      web: { cursor: 'pointer' } as Record<string, unknown>,
      default: {},
    }),
  },
  toggleItemActive: {
    backgroundColor: '#141619',
  },
  toggleText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  periodChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  periodText: {
    color: '#475569',
    fontSize: 11.5,
    fontWeight: '600',
  },
  chartCanvas: {
    position: 'relative',
    paddingTop: spacing.sm,
    minHeight: 192,
    justifyContent: 'flex-end',
  },
  gridOverlay: {
    position: 'absolute',
    top: 32,
    left: 0,
    right: 0,
    bottom: 26,
    justifyContent: 'space-between',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  tooltipPill: {
    backgroundColor: '#141619',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 2,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
  },
  tooltipSpacer: {
    height: 22,
  },
  barTrack: {
    width: '100%',
    maxWidth: 38,
    height: 126,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  barFillDefault: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  barFillHighlight: {
    backgroundColor: '#FDE68A',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  barTopCap: {
    height: 4,
    width: '100%',
    backgroundColor: '#F59E0B',
  },
  barTopCapHighlight: {
    height: 5,
    backgroundColor: '#EA580C',
  },
  barLabel: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '500',
  },
  barLabelHighlight: {
    color: '#0F172A',
    fontWeight: '700',
  },
  donutSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingTop: spacing.xs,
    flex: 1,
  },
  donutRing: {
    width: 114,
    height: 114,
    borderRadius: 57,
    borderWidth: 15,
    borderTopColor: '#F97316',
    borderRightColor: '#FACC15',
    borderBottomColor: '#18181B',
    borderLeftColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  donutInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutValue: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  donutCaption: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
  legendList: {
    flex: 1,
    minWidth: 140,
    gap: spacing.sm + 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  legendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  legendLabel: {
    color: '#475569',
    fontSize: 12.5,
    fontWeight: '500',
    flexShrink: 1,
  },
  legendPct: {
    color: '#0F172A',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
