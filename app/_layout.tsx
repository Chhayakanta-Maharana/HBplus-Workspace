import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Stack,
  useRootNavigationState,
  useRouter,
  useSegments,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { SplashScreenView } from '../src/components/SplashScreenView';
import { colors } from '../src/theme';

function RootAuthGuard() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const navigationState = useRootNavigationState();

  const isNavReady = Boolean(navigationState?.key);
  const firstSegment = segments[0];
  const inProtectedGroup = firstSegment === '(protected)';
  const isPublicAuthRoute =
    firstSegment === 'login' || firstSegment === 'reset-password';

  const shouldRedirectToLogin = !isLoading && !user && !isPublicAuthRoute;
  const shouldRedirectToDashboard =
    !isLoading && Boolean(user) && !inProtectedGroup;

  useEffect(() => {
    if (!isNavReady || isLoading) {
      return;
    }

    if (!user && !isPublicAuthRoute) {
      router.replace('/login');
    } else if (user && !inProtectedGroup) {
      router.replace('/dashboard');
    }
  }, [isNavReady, isLoading, user, isPublicAuthRoute, inProtectedGroup, router]);

  const showSplash =
    isLoading ||
    !isNavReady ||
    shouldRedirectToLogin ||
    shouldRedirectToDashboard;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="(protected)" />
      </Stack>

      {showSplash ? (
        <View style={styles.splashOverlay} pointerEvents="auto">
          <SplashScreenView
            message={
              isLoading
                ? 'Verifying workspace session...'
                : 'Redirecting...'
            }
          />
        </View>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootAuthGuard />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  splashOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 999,
  },
});
