import React from 'react';
import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { SplashScreenView } from '../../src/components/SplashScreenView';
import { colors } from '../../src/theme';

export default function ProtectedLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreenView />;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="dashboard" />
    </Stack>
  );
}
