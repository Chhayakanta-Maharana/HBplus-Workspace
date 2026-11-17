import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { BrandLogo } from '../src/components/BrandLogo';
import { ErrorBanner } from '../src/components/ErrorBanner';
import {
  formatAllowedDomainChip,
  isEmailAllowed,
  UNAUTHORIZED_DOMAIN_ERROR,
} from '../src/utils/domain';
import { breakpoints, colors, radii, spacing } from '../src/theme';

const loginBackground = require('../assets/login-bg.jpg');
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

type AuthMode = 'login' | 'register';

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const isSplitLayout = width >= breakpoints.tablet;

  const {
    allowedDomain,
    error,
    isAuthenticating,
    isConfigured,
    signInWithGoogle,
    signInWithEmail,
    registerWithEmail,
    sendPasswordReset,
    clearError,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);

  // Smooth staggered entrance animations
  const [brandOpacity] = useState(() => new Animated.Value(0));
  const [brandSlide] = useState(() => new Animated.Value(-14));
  const [showcaseOpacity] = useState(() => new Animated.Value(0));
  const [showcaseSlide] = useState(() => new Animated.Value(18));
  const [dividerScaleY] = useState(() => new Animated.Value(0));
  const [formOpacity] = useState(() => new Animated.Value(0));
  const [formSlide] = useState(() => new Animated.Value(22));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(brandOpacity, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(brandSlide, {
        toValue: 0,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(dividerScaleY, {
        toValue: 1,
        duration: 620,
        delay: 120,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(showcaseOpacity, {
        toValue: 1,
        duration: 540,
        delay: 140,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(showcaseSlide, {
        toValue: 0,
        duration: 540,
        delay: 140,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 560,
        delay: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(formSlide, {
        toValue: 0,
        duration: 560,
        delay: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, [
    brandOpacity,
    brandSlide,
    dividerScaleY,
    formOpacity,
    formSlide,
    showcaseOpacity,
    showcaseSlide,
  ]);

  const isRegisterMode = mode === 'register';
  const activeError = localError ?? error;
  const domainChipLabel = formatAllowedDomainChip(allowedDomain);

  const handleDismissError = () => {
    setLocalError(null);
    clearError();
  };

  const handleToggleMode = () => {
    setLocalError(null);
    setInfoNotice(null);
    clearError();
    formOpacity.setValue(0.35);
    formSlide.setValue(10);
    setMode((prev) => (prev === 'login' ? 'register' : 'login'));
    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(formSlide, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  };

  // Separate Google Sign-In flow (independent from manual email/password)
  const handleGooglePress = () => {
    setLocalError(null);
    setInfoNotice(null);
    clearError();

    const trimmedEmail = email.trim();
    const hint =
      trimmedEmail.length > 0 && isEmailAllowed(trimmedEmail, allowedDomain)
        ? trimmedEmail
        : undefined;
    void signInWithGoogle(hint);
  };

  // Manual Email/Password Login or Registration flow
  const handleManualSubmit = () => {
    setLocalError(null);
    setInfoNotice(null);
    clearError();

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setLocalError('Please enter your email and password.');
      return;
    }

    if (!isEmailAllowed(trimmedEmail, allowedDomain)) {
      setLocalError(UNAUTHORIZED_DOMAIN_ERROR);
      return;
    }

    if (isRegisterMode) {
      if (!fullName.trim()) {
        setLocalError('Please enter your full name to register.');
        return;
      }
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters long.');
        return;
      }
      void registerWithEmail(fullName, trimmedEmail, password);
      return;
    }

    void signInWithEmail(trimmedEmail, password);
  };

  const handleForgotPassword = async () => {
    if (isSendingReset || isAuthenticating) {
      return;
    }

    setLocalError(null);
    setInfoNotice(null);
    clearError();

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setLocalError('Enter your email address above, then click "Forget password?".');
      return;
    }

    if (!isEmailAllowed(trimmedEmail, allowedDomain)) {
      setLocalError(UNAUTHORIZED_DOMAIN_ERROR);
      return;
    }

    setIsSendingReset(true);
    try {
      await sendPasswordReset(trimmedEmail);
      setInfoNotice(
        `Reset link sent to ${trimmedEmail}. Open the LATEST email (at the bottom of your Gmail thread) — clicking older emails shows "expired".`
      );
    } catch {
      // Error is handled in AuthContext
    } finally {
      setIsSendingReset(false);
    }
  };

  const renderFormContent = () => (
    <Animated.View
      style={[
        styles.formContainer,
        {
          opacity: formOpacity,
          transform: [{ translateY: formSlide }],
        },
      ]}
    >
      {/* Title */}
      <Text style={styles.loginTitle}>
        {isRegisterMode ? 'Register' : 'Login'}
      </Text>

      {/* Allowed domain chip */}
      <View style={styles.domainChipWrap}>
        <View style={styles.domainChip}>
          <Ionicons name="lock-closed" size={12} color={colors.accent} />
          <Text style={styles.domainChipText}>{domainChipLabel}</Text>
        </View>
      </View>

      {/* Full Name Field (Register mode only) */}
      {isRegisterMode ? (
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Full Name</Text>
          <View style={styles.inputBox}>
            <Ionicons
              name="person-outline"
              size={18}
              color="#64748B"
              style={styles.inputIcon}
            />
            <TextInput
              value={fullName}
              onChangeText={(val) => {
                setFullName(val);
                if (localError) setLocalError(null);
              }}
              placeholder="Enter your full name"
              placeholderTextColor="#94A3B8"
              autoCapitalize="words"
              editable={!isAuthenticating}
              style={styles.textInput}
              accessibilityLabel="Full name"
            />
          </View>
        </View>
      ) : null}

      {/* Email Field */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Email</Text>
        <View style={styles.inputBox}>
          <Ionicons
            name="mail-outline"
            size={18}
            color="#64748B"
            style={styles.inputIcon}
          />
          <TextInput
            value={email}
            onChangeText={(val) => {
              setEmail(val);
              if (localError) setLocalError(null);
            }}
            placeholder="Enter your Email"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isAuthenticating}
            style={styles.textInput}
            accessibilityLabel="Email address"
          />
        </View>
      </View>

      {/* Password Field */}
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Password</Text>
        <View style={styles.inputBox}>
          <Ionicons
            name="shield-outline"
            size={18}
            color="#64748B"
            style={styles.inputIcon}
          />
          <TextInput
            value={password}
            onChangeText={(val) => {
              setPassword(val);
              if (localError) setLocalError(null);
            }}
            placeholder={
              isRegisterMode
                ? 'Create a password (min 6 chars)'
                : 'Enter your password'
            }
            placeholderTextColor="#94A3B8"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isAuthenticating}
            onSubmitEditing={handleManualSubmit}
            style={styles.textInput}
            accessibilityLabel="Password"
          />
          <Pressable
            onPress={() => setShowPassword((prev) => !prev)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            style={styles.eyeButton}
          >
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={19}
              color="#475569"
            />
          </Pressable>
        </View>

        {!isRegisterMode ? (
          <Pressable
            onPress={() => void handleForgotPassword()}
            disabled={isSendingReset || isAuthenticating}
            style={({ pressed }) => [
              styles.forgotWrap,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
          >
            <Text style={styles.forgotText}>
              {isSendingReset ? 'Sending reset link...' : 'Forget password?'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {/* Divider: or continue with */}
      <View style={styles.orRow}>
        <View style={styles.orLine} />
        <Text style={styles.orText}>or continue with</Text>
        <View style={styles.orLine} />
      </View>

      {/* Centered Google Icon Button */}
      <View style={styles.googleIconRow}>
        <Pressable
          onPress={handleGooglePress}
          disabled={isAuthenticating}
          accessibilityRole="button"
          accessibilityLabel="Continue with Google"
          accessibilityState={{ busy: isAuthenticating, disabled: isAuthenticating }}
          style={({ pressed }) => [
            styles.googleCircleBtn,
            pressed && !isAuthenticating && styles.googleCirclePressed,
            isAuthenticating && styles.disabledBtn,
          ]}
        >
          {isAuthenticating ? (
            <ActivityIndicator size="small" color="#EA4335" />
          ) : (
            <View style={styles.googleGlyphWrap}>
              <FontAwesome name="google" size={24} color="#EA4335" />
            </View>
          )}
        </Pressable>
      </View>

      {/* Switch between Login & Register */}
      <View style={styles.registerGroup}>
        <Text style={styles.registerPrompt}>
          {isRegisterMode
            ? 'Already have an account ?'
            : "Don't have an account ?"}
        </Text>
        <Pressable
          onPress={handleToggleMode}
          accessibilityRole="button"
          style={({ pressed }) => pressed && styles.pressed}
        >
          <Text style={styles.registerLink}>
            {isRegisterMode ? 'Login here' : 'Register here'}
          </Text>
        </Pressable>
      </View>

      {/* Error / Info Banner */}
      {activeError ? (
        <ErrorBanner message={activeError} onDismiss={handleDismissError} />
      ) : null}

      {infoNotice && !activeError ? (
        <View style={styles.infoBanner}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.accent}
          />
          <Text style={styles.infoBannerText}>{infoNotice}</Text>
        </View>
      ) : null}

      {!isConfigured && !activeError && !infoNotice ? (
        <View style={styles.infoBanner}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.accent}
          />
          <Text style={styles.infoBannerText}>
            Configure Firebase keys in .env (see .env.example) to enable sign-in.
          </Text>
        </View>
      ) : null}

      {/* Full-width Red Manual Login / Register CTA Button */}
      <Pressable
        onPress={handleManualSubmit}
        disabled={isAuthenticating}
        accessibilityRole="button"
        accessibilityLabel={isRegisterMode ? 'Register account' : 'Login with email and password'}
        accessibilityState={{ busy: isAuthenticating, disabled: isAuthenticating }}
        style={({ pressed }) => [
          styles.redLoginButton,
          pressed && !isAuthenticating && styles.redLoginButtonPressed,
          isAuthenticating && styles.disabledBtn,
        ]}
      >
        {isAuthenticating ? (
          <View style={styles.redBtnContent}>
            <ActivityIndicator size="small" color={colors.white} />
            <Text style={styles.redLoginText}>
              {isRegisterMode ? 'Creating account...' : 'Signing in...'}
            </Text>
          </View>
        ) : (
          <View style={styles.redBtnContent}>
            <Text style={styles.redLoginText}>
              {isRegisterMode ? 'Register' : 'Login'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );

  return (
    <ImageBackground
      source={loginBackground}
      resizeMode="cover"
      style={styles.backgroundImage}
    >
      <View style={styles.globalScrim}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.flexOne}
          >
            {isSplitLayout ? (
              <View style={styles.splitContainer}>
                {/* Left Showcase Column */}
                <View style={styles.leftShowcase}>
                  <Animated.View
                    style={[
                      styles.leftBrandHeader,
                      {
                        opacity: brandOpacity,
                        transform: [{ translateY: brandSlide }],
                      },
                    ]}
                  >
                    <BrandLogo size="md" showTagline animated />
                  </Animated.View>

                  <Animated.View
                    style={[
                      styles.leftBottomCaption,
                      {
                        opacity: showcaseOpacity,
                        transform: [{ translateY: showcaseSlide }],
                      },
                    ]}
                  >
                    <Text style={styles.showcaseHeadline}>
                      Your team&apos;s workspace,{'\n'}in one place
                    </Text>
                    <Text style={styles.showcaseSubtext}>
                      Secure domain-restricted authentication for verified{' '}
                      @{allowedDomain} members.
                    </Text>
                  </Animated.View>
                </View>

                {/* Animated Vertical White Divider Line */}
                <View style={styles.dividerColumn}>
                  <Animated.View
                    style={[
                      styles.verticalWhiteLine,
                      { transform: [{ scaleY: dividerScaleY }] },
                    ]}
                  />
                </View>

                {/* Right Frosted Glass Panel */}
                <View style={styles.rightGlassPanel}>
                  <ScrollView
                    contentContainerStyle={styles.rightScrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                  >
                    {renderFormContent()}
                  </ScrollView>
                </View>
              </View>
            ) : (
              /* Mobile Single-Column Glass Overlay */
              <ScrollView
                contentContainerStyle={styles.mobileScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <Animated.View
                  style={[
                    styles.mobileBrandRow,
                    {
                      opacity: brandOpacity,
                      transform: [{ translateY: brandSlide }],
                    },
                  ]}
                >
                  <BrandLogo size="md" animated />
                </Animated.View>
                <View style={styles.mobileGlassCard}>{renderFormContent()}</View>
              </ScrollView>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: colors.background,
  },
  globalScrim: {
    flex: 1,
    backgroundColor: 'rgba(8, 12, 20, 0.24)',
  },
  safeArea: {
    flex: 1,
  },

  /* Desktop Split Layout */
  splitContainer: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  leftShowcase: {
    flex: 0.44,
    paddingHorizontal: spacing.xl + 8,
    paddingVertical: spacing.xl,
    justifyContent: 'space-between',
  },
  leftBrandHeader: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(11, 18, 32, 0.46)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.lg,
  },
  leftBottomCaption: {
    gap: spacing.sm,
    maxWidth: 380,
    backgroundColor: 'rgba(11, 18, 32, 0.48)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: spacing.lg - 4,
    borderRadius: radii.lg,
  },
  showcaseHeadline: {
    color: colors.white,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  showcaseSubtext: {
    color: 'rgba(230, 237, 247, 0.86)',
    fontSize: 13.5,
    lineHeight: 20,
  },

  /* Center Vertical White Line */
  dividerColumn: {
    width: 4,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  verticalWhiteLine: {
    width: 4,
    height: '72%',
    minHeight: 360,
    maxHeight: 620,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    ...Platform.select({
      web: {
        boxShadow: '0 0 14px rgba(255, 255, 255, 0.35)',
      } as Record<string, unknown>,
      default: {},
    }),
  },

  /* Right Smoked Glass Panel */
  rightGlassPanel: {
    flex: 0.56,
    backgroundColor: 'rgba(24, 28, 38, 0.56)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      } as Record<string, unknown>,
      default: {},
    }),
  },
  rightScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl + 16,
    paddingVertical: spacing.xl,
  },

  /* Mobile Layout */
  mobileScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  mobileBrandRow: {
    alignSelf: 'center',
    backgroundColor: 'rgba(11, 18, 32, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
  },
  mobileGlassCard: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    backgroundColor: 'rgba(18, 22, 32, 0.74)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: radii.lg + 4,
    padding: spacing.lg - 4,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      } as Record<string, unknown>,
      default: {},
    }),
  },

  /* Form Elements */
  formContainer: {
    width: '100%',
    maxWidth: 420,
    gap: spacing.md,
  },
  loginTitle: {
    color: colors.white,
    fontSize: 34,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  domainChipWrap: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  domainChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(11, 18, 32, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(34, 211, 238, 0.42)',
    paddingHorizontal: spacing.md - 4,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  domainChipText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radii.sm,
    height: 46,
    paddingHorizontal: spacing.sm + 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  inputIcon: {
    marginRight: spacing.sm + 2,
  },
  textInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    color: '#0F172A',
    fontSize: 14.5,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as Record<string, unknown>,
      default: {},
    }),
  },
  eyeButton: {
    padding: 4,
    marginLeft: spacing.xs,
  },
  forgotWrap: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  forgotText: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 12,
    fontStyle: 'italic',
  },

  /* Divider */
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    marginTop: spacing.xs,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
  },
  orText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '400',
  },

  /* Centered Google Button */
  googleIconRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  googleCircleBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.28)',
      } as Record<string, unknown>,
      default: {
        shadowColor: '#000000',
        shadowOpacity: 0.28,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
      },
    }),
  },
  googleCirclePressed: {
    transform: [{ scale: 0.95 }],
    opacity: 0.9,
  },
  googleGlyphWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Register prompt */
  registerGroup: {
    alignItems: 'center',
    gap: 2,
  },
  registerPrompt: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 13,
  },
  registerLink: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  /* Info Banner */
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 2,
    backgroundColor: 'rgba(11, 18, 32, 0.72)',
    borderWidth: 1,
    borderColor: colors.accentBorder,
    borderRadius: radii.sm,
    padding: spacing.sm + 4,
  },
  infoBannerText: {
    flex: 1,
    color: colors.text,
    fontSize: 12.5,
    lineHeight: 18,
  },

  /* Bright Red Full-Width CTA Button */
  redLoginButton: {
    width: '100%',
    height: 48,
    borderRadius: radii.sm,
    backgroundColor: '#EB1423',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
    ...Platform.select({
      web: {
        cursor: 'pointer',
        boxShadow: '0 6px 18px rgba(235, 20, 35, 0.38)',
      } as Record<string, unknown>,
      default: {
        shadowColor: '#EB1423',
        shadowOpacity: 0.38,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
      },
    }),
  },
  redLoginButtonPressed: {
    backgroundColor: '#CF101D',
    transform: [{ scale: 0.99 }],
  },
  redBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm + 2,
  },
  redLoginText: {
    color: colors.white,
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  disabledBtn: {
    opacity: 0.7,
  },
  pressed: {
    opacity: 0.75,
  },
});
