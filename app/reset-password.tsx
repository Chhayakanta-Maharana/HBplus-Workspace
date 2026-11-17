import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  confirmPasswordReset,
  verifyPasswordResetCode,
} from 'firebase/auth';
import { auth } from '../src/services/firebase';
import { mapAuthError } from '../src/services/auth';
import { BrandLogo } from '../src/components/BrandLogo';
import { ErrorBanner } from '../src/components/ErrorBanner';
import { colors, radii, spacing } from '../src/theme';

const loginBackground = require('../assets/login-bg.jpg');

export default function ResetPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ oobCode?: string }>();
  const oobCode = typeof params.oobCode === 'string' ? params.oobCode : '';

  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(Boolean(oobCode));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    oobCode
      ? null
      : 'Password reset link is missing or invalid. Please request a fresh link from the Login page.'
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!oobCode || !auth) {
      return;
    }

    let isCancelled = false;

    void verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        if (!isCancelled) {
          setVerifiedEmail(email);
          setIsVerifying(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setError(
            'This password reset link has expired or has already been used. Please request a new reset link from the Login page.'
          );
          setIsVerifying(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [oobCode]);

  const handleConfirmReset = async () => {
    if (!auth || !oobCode) {
      return;
    }

    setError(null);

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter them.');
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccessMessage(
        'Your password has been updated successfully. You can now sign in with your new password.'
      );
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ImageBackground
      source={loginBackground}
      resizeMode="cover"
      style={styles.background}
    >
      <View style={styles.scrim}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.brandWrap}>
              <BrandLogo size="md" />
            </View>

            <View style={styles.glassCard}>
              <Text style={styles.title}>Reset Password</Text>
              {verifiedEmail ? (
                <Text style={styles.subtitle}>
                  Create a new password for {verifiedEmail}
                </Text>
              ) : (
                <Text style={styles.subtitle}>
                  Secure password recovery for your workspace account
                </Text>
              )}

              {isVerifying ? (
                <View style={styles.centerState}>
                  <ActivityIndicator size="small" color="#F59E0B" />
                  <Text style={styles.stateText}>
                    Verifying password reset link...
                  </Text>
                </View>
              ) : successMessage ? (
                <View style={styles.successBox}>
                  <Ionicons
                    name="checkmark-circle"
                    size={22}
                    color="#34D399"
                  />
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              ) : error && !verifiedEmail ? (
                <ErrorBanner message={error} />
              ) : (
                <View style={styles.form}>
                  {error ? (
                    <ErrorBanner
                      message={error}
                      onDismiss={() => setError(null)}
                    />
                  ) : null}

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>New Password</Text>
                    <View style={styles.inputBox}>
                      <Ionicons
                        name="shield-outline"
                        size={18}
                        color="#64748B"
                        style={styles.icon}
                      />
                      <TextInput
                        value={newPassword}
                        onChangeText={setNewPassword}
                        placeholder="Enter new password (min 6 chars)"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        style={styles.input}
                      />
                      <Pressable
                        onPress={() => setShowPassword((prev) => !prev)}
                        hitSlop={8}
                      >
                        <Ionicons
                          name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                          size={19}
                          color="#475569"
                        />
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.fieldGroup}>
                    <Text style={styles.label}>Confirm Password</Text>
                    <View style={styles.inputBox}>
                      <Ionicons
                        name="lock-closed-outline"
                        size={18}
                        color="#64748B"
                        style={styles.icon}
                      />
                      <TextInput
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Confirm new password"
                        placeholderTextColor="#94A3B8"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        onSubmitEditing={() => void handleConfirmReset()}
                        style={styles.input}
                      />
                    </View>
                  </View>

                  <Pressable
                    onPress={() => void handleConfirmReset()}
                    disabled={isSubmitting}
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      pressed && styles.pressed,
                    ]}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color={colors.white} />
                    ) : (
                      <Text style={styles.primaryBtnText}>Update Password</Text>
                    )}
                  </Pressable>
                </View>
              )}

              <Pressable
                onPress={() => router.replace('/login')}
                style={({ pressed }) => [
                  styles.backBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons name="arrow-back" size={16} color={colors.white} />
                <Text style={styles.backBtnText}>Back to Login</Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 22, 0.45)',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  brandWrap: {
    backgroundColor: 'rgba(17, 18, 20, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.lg,
  },
  glassCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: 'rgba(20, 22, 28, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: radii.lg + 4,
    padding: spacing.xl,
    gap: spacing.md,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      } as Record<string, unknown>,
      default: {},
    }),
  },
  title: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(230, 237, 247, 0.8)',
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
  },
  centerState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm + 4,
  },
  stateText: {
    color: colors.text,
    fontSize: 14,
  },
  form: {
    gap: spacing.md,
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    color: colors.white,
    fontSize: 13.5,
    fontWeight: '500',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.sm,
    height: 46,
    paddingHorizontal: spacing.sm + 4,
  },
  icon: {
    marginRight: spacing.sm + 2,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#0F172A',
    fontSize: 14.5,
    ...Platform.select({
      web: { outlineStyle: 'none' } as Record<string, unknown>,
      default: {},
    }),
  },
  primaryBtn: {
    width: '100%',
    height: 46,
    borderRadius: radii.sm,
    backgroundColor: '#EB1423',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    ...Platform.select({
      web: { cursor: 'pointer' } as Record<string, unknown>,
      default: {},
    }),
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 4,
    backgroundColor: 'rgba(52, 211, 153, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    borderRadius: radii.md,
    padding: spacing.md,
  },
  successText: {
    flex: 1,
    color: '#A7F3D0',
    fontSize: 13.5,
    lineHeight: 20,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    ...Platform.select({
      web: { cursor: 'pointer' } as Record<string, unknown>,
      default: {},
    }),
  },
  backBtnText: {
    color: colors.white,
    fontSize: 13.5,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.78,
  },
});
