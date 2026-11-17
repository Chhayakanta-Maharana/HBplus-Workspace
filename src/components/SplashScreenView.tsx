import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { breakpoints, radii, spacing } from '../theme';
import { BrandLogo } from './BrandLogo';

interface SplashScreenViewProps {
  message?: string;
}

export function SplashScreenView({
  message = 'Verifying workspace session...',
}: SplashScreenViewProps) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= breakpoints.desktop;

  return (
    <SafeAreaView style={styles.outerShell}>
      <View style={styles.layout}>
        {/* Left Dark Sidebar Skeleton (Desktop) */}
        {isDesktop ? (
          <View style={styles.sidebar}>
            <View style={styles.sidebarTop}>
              <View style={styles.brandMarkGroup}>
                <BrandLogo size="sm" animated />
              </View>

              <View style={styles.navSkeletonGroup}>
                <View style={[styles.navSkeletonItem, styles.navSkeletonActive]}>
                  <View style={styles.navIconActive} />
                  <View style={[styles.darkShimmerLine, { width: 92 }]} />
                </View>
                {[84, 72, 96].map((w, i) => (
                  <View key={`nav-${i}`} style={styles.navSkeletonItem}>
                    <View style={styles.navIconMuted} />
                    <View style={[styles.darkShimmerLine, { width: w }]} />
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.sidebarBottomCard}>
              <View style={styles.sidebarUserRow}>
                <View style={styles.darkCircle} />
                <View style={styles.flexOneGap}>
                  <View style={[styles.darkShimmerLine, { width: '75%' }]} />
                  <View style={[styles.darkShimmerLine, { width: '55%', height: 8 }]} />
                </View>
              </View>
              <View style={styles.amberPillSkeleton} />
            </View>
          </View>
        ) : null}

        {/* Right Column: Dark Top Bar + Rounded Light Content Sheet */}
        <View style={styles.rightColumn}>
          {/* Top Dark Chrome Bar */}
          <View style={styles.topDarkBar}>
            <View style={styles.searchSkeleton} />
            <View style={styles.topRightGroup}>
              {isDesktop ? <View style={styles.datePillSkeleton} /> : null}
              <View style={styles.darkCircleSmall} />
              <View style={styles.darkCircle} />
            </View>
          </View>

          {/* Rounded Crisp Light Canvas Skeleton */}
          <View
            style={[
              styles.contentSheet,
              isDesktop && styles.contentSheetDesktop,
            ]}
          >
            <View style={styles.canvasInner}>
              {/* Header + Live Status Pill */}
              <View style={styles.headerRow}>
                <View style={styles.headerTextSkeleton}>
                  <View style={styles.titleSkeleton} />
                  <View style={styles.subtitleSkeleton} />
                </View>

                <View style={styles.statusPill}>
                  <ActivityIndicator size="small" color="#F59E0B" />
                  <Text style={styles.statusText}>{message}</Text>
                </View>
              </View>

              {/* 4 Metric Cards Skeleton (1st Jet-Black Hero + 3 White) */}
              <View style={styles.metricsRow}>
                <View style={[styles.metricSkeleton, styles.metricDark]}>
                  <View style={styles.metricIconDark} />
                  <View style={[styles.darkShimmerLine, { width: '50%' }]} />
                  <View style={[styles.darkShimmerLine, { width: '72%', height: 22 }]} />
                </View>
                {[0, 1, 2].map((idx) => (
                  <View
                    key={`metric-${idx}`}
                    style={[styles.metricSkeleton, styles.metricLight]}
                  >
                    <View style={styles.metricIconLight} />
                    <View style={[styles.lightShimmerLine, { width: '55%' }]} />
                    <View style={[styles.lightShimmerLine, { width: '68%', height: 22 }]} />
                  </View>
                ))}
              </View>

              {/* Analytics Charts Row Skeleton */}
              <View style={[styles.chartsRow, !isDesktop && styles.chartsStacked]}>
                <View style={[styles.chartSkeleton, isDesktop && styles.chartLeft]}>
                  <View style={[styles.lightShimmerLine, { width: 160, height: 14 }]} />
                  <View style={styles.barsSkeletonRow}>
                    {[48, 72, 58, 92, 114, 76, 88].map((h, i) => (
                      <View
                        key={`bar-${i}`}
                        style={[
                          styles.barSkeleton,
                          { height: h },
                          i === 4 && styles.barSkeletonAccent,
                        ]}
                      />
                    ))}
                  </View>
                </View>

                <View style={[styles.chartSkeleton, isDesktop && styles.chartRight]}>
                  <View style={[styles.lightShimmerLine, { width: 130, height: 14 }]} />
                  <View style={styles.donutSkeletonRow}>
                    <View style={styles.donutSkeleton} />
                    <View style={styles.flexOneGap}>
                      <View style={[styles.lightShimmerLine, { width: '85%' }]} />
                      <View style={[styles.lightShimmerLine, { width: '70%' }]} />
                      <View style={[styles.lightShimmerLine, { width: '78%' }]} />
                    </View>
                  </View>
                </View>
              </View>

              {/* Recent Sign-Ins Table Skeleton */}
              <View style={styles.tableSkeleton}>
                <View style={styles.tableHeaderSkeleton}>
                  <View style={[styles.lightShimmerLine, { width: 140, height: 14 }]} />
                  <View style={[styles.lightShimmerLine, { width: 72, height: 24, borderRadius: 12 }]} />
                </View>
                {[0, 1, 2].map((row) => (
                  <View key={`row-${row}`} style={styles.tableRowSkeleton}>
                    <View style={styles.lightCircle} />
                    <View style={styles.flexOneGap}>
                      <View style={[styles.lightShimmerLine, { width: '36%' }]} />
                      <View style={[styles.lightShimmerLine, { width: '24%', height: 9 }]} />
                    </View>
                    <View style={[styles.lightShimmerLine, { width: 64, height: 22, borderRadius: 11 }]} />
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  outerShell: {
    flex: 1,
    backgroundColor: '#111214',
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#111214',
  },
  sidebar: {
    width: 244,
    height: '100%',
    backgroundColor: '#111214',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg - 4,
    justifyContent: 'space-between',
  },
  sidebarTop: {
    gap: spacing.lg,
  },
  brandMarkGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingHorizontal: spacing.xs,
  },
  amberLogoBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    height: 24,
  },
  logoBar: {
    width: 6,
    borderRadius: 3,
  },
  logoBarShort: {
    height: 11,
    backgroundColor: '#FACC15',
  },
  logoBarMid: {
    height: 17,
    backgroundColor: '#F59E0B',
  },
  logoBarTall: {
    height: 23,
    backgroundColor: '#EA580C',
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  navSkeletonGroup: {
    gap: 8,
  },
  navSkeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
  },
  navSkeletonActive: {
    backgroundColor: '#222429',
  },
  navIconActive: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#EA580C',
  },
  navIconMuted: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#1E2026',
  },
  sidebarBottomCard: {
    backgroundColor: '#1A1C20',
    borderWidth: 1,
    borderColor: '#272A30',
    borderRadius: radii.lg + 2,
    padding: spacing.md - 2,
    gap: spacing.md - 2,
  },
  sidebarUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
  },
  amberPillSkeleton: {
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(251, 191, 36, 0.25)',
  },
  rightColumn: {
    flex: 1,
    backgroundColor: '#111214',
  },
  topDarkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg - 4,
    paddingVertical: spacing.sm + 4,
    gap: spacing.md,
  },
  searchSkeleton: {
    flex: 1,
    maxWidth: 380,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: '#1D1F24',
    borderWidth: 1,
    borderColor: '#2A2D34',
  },
  topRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  datePillSkeleton: {
    width: 170,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: '#1D1F24',
    borderWidth: 1,
    borderColor: '#2A2D34',
  },
  darkCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#23262C',
  },
  darkCircleSmall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1D1F24',
  },
  darkShimmerLine: {
    height: 11,
    borderRadius: 6,
    backgroundColor: '#2A2D35',
  },
  contentSheet: {
    flex: 1,
    backgroundColor: '#F6F7F9',
    overflow: 'hidden',
  },
  contentSheetDesktop: {
    borderTopLeftRadius: 22,
  },
  canvasInner: {
    width: '100%',
    maxWidth: 1240,
    alignSelf: 'center',
    padding: spacing.lg,
    gap: spacing.lg - 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  headerTextSkeleton: {
    flex: 1,
    minWidth: 160,
    gap: 8,
  },
  titleSkeleton: {
    width: '65%',
    maxWidth: 220,
    height: 22,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  subtitleSkeleton: {
    width: '85%',
    maxWidth: 280,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    backgroundColor: '#141619',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.pill,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricSkeleton: {
    flex: 1,
    minWidth: 190,
    height: 132,
    borderRadius: radii.lg + 4,
    padding: spacing.md + 2,
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  metricDark: {
    backgroundColor: '#141619',
    borderColor: '#23262C',
  },
  metricLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  metricIconDark: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  metricIconLight: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#FFF7ED',
  },
  chartsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  chartsStacked: {
    flexDirection: 'column',
  },
  chartSkeleton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: radii.lg + 4,
    padding: spacing.lg - 4,
    gap: spacing.md,
    minHeight: 205,
    justifyContent: 'space-between',
  },
  chartLeft: {
    flex: 1.55,
  },
  chartRight: {
    flex: 1,
  },
  barsSkeletonRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm + 4,
    paddingTop: spacing.sm,
  },
  barSkeleton: {
    flex: 1,
    maxWidth: 36,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: '#FEF3C7',
  },
  barSkeletonAccent: {
    backgroundColor: '#FDE68A',
  },
  donutSkeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    flex: 1,
  },
  donutSkeleton: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 15,
    borderTopColor: '#F97316',
    borderRightColor: '#FACC15',
    borderBottomColor: '#E2E8F0',
    borderLeftColor: '#E2E8F0',
  },
  tableSkeleton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: radii.lg + 4,
    overflow: 'hidden',
  },
  tableHeaderSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 2,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  lightCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E2E8F0',
  },
  lightShimmerLine: {
    height: 11,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  flexOneGap: {
    flex: 1,
    gap: 8,
  },
});
