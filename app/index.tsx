import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { SplashScreenView } from '../src/components/SplashScreenView';

export default function IndexRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreenView />;
  }

  if (user) {
    return <Redirect href="/dashboard" />;
  }

  return <Redirect href="/login" />;
}
