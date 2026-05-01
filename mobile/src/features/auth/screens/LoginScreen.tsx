import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { authApi } from '../../../api/auth';
import { AppButton } from '../../../components/AppButton';
import { AppInput } from '../../../components/AppInput';
import { AppText } from '../../../components/AppText';
import { Screen } from '../../../components/Screen';
import { useAuth } from '../../../hooks/useAuth';
import { theme } from '../../../theme';

export function LoginScreen() {
  const { setAuth } = useAuth();
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;
  const isLandscape = width > height;
  const isLandscapeSplit = isLandscape && width >= 720;
  
  // Dynamic scaling for tablet to fill space better
  const logoSize = isLandscapeSplit ? 160 : 110;
  const iconSize = isLandscapeSplit ? 72 : 48;
  const titleSize = isLandscapeSplit ? 56 : 42;
  const subtitleSize = isLandscapeSplit ? 20 : 16;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    setError(null);
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authApi.login({ username: email, password });
      const payload = (res as any).data ?? res;
      await setAuth(payload.user, payload.token);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const header = (
    <View style={[styles.header, isLandscapeSplit && styles.headerLandscape]}>
      <View style={[styles.logoContainer, { width: logoSize, height: logoSize, borderRadius: logoSize * 0.3 }]}>
        <LinearGradient
          colors={['#ffffff', '#f0fdfa']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name="basket" size={iconSize} color={theme.colors.primary} />
        <View style={[styles.logoBadge, isLandscapeSplit && { width: 36, height: 36, borderRadius: 18, top: -6, right: -6 }]}>
          <Ionicons name="sparkles" size={isLandscapeSplit ? 18 : 14} color="#F59E0B" />
        </View>
      </View>
      <AppText variant="title" style={[styles.title, { fontSize: titleSize }]}>
        TillMate
      </AppText>
      <AppText variant="caption" style={[styles.subtitle, { fontSize: subtitleSize, marginTop: isLandscapeSplit ? 10 : 6 }]}>
        Loyalty & Sales Platform
      </AppText>
    </View>
  );

  const loginCard = (
    <View style={[styles.glassCard, isTablet && !isLandscapeSplit && styles.glassCardTablet]}>
      <AppText style={styles.formTitle}>Staff Sign In</AppText>

      <View style={styles.formSpace}>
        <AppInput
          label="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="name@shop.com"
          icon="mail-outline"
        />

        <View style={{ height: theme.spacing.md }} />

        <AppInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          icon="lock-closed-outline"
        />
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={16} color={theme.colors.error} />
          <AppText variant="caption" style={styles.errorText}>
            {error}
          </AppText>
        </View>
      ) : (
        <View style={{ height: theme.spacing.md }} />
      )}

      <View style={{ height: theme.spacing.lg }} />

      <AppButton 
        title="Continue" 
        size="lg" 
        onPress={handleLogin} 
        loading={isLoading} 
        style={styles.signInButton}
      />

      <AppText style={styles.footerNote}>Contact your administrator if you&apos;ve lost access.</AppText>
    </View>
  );

  return (
    <Screen padded={false}>
      <LinearGradient
        colors={theme.colors.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        {/* Subtle background decorative shapes */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={[
              styles.scrollContent, 
              isTablet && !isLandscapeSplit && styles.scrollContentTablet,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {isLandscapeSplit ? (
              <View style={styles.landscapeRow}>
                <View style={styles.landscapeLeft}>
                  {header}
                </View>
                <View style={styles.landscapeRight}>
                  {loginCard}
                </View>
              </View>
            ) : (
              <>
                {header}
                {loginCard}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: '-10%',
    right: '-5%',
    width: '50%',
    aspectRatio: 1,
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: '-20%',
    left: '-10%',
    width: '70%',
    aspectRatio: 1,
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
    paddingTop: 80,
    paddingBottom: 60,
  },
  scrollContentTablet: {
    padding: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
  },
  headerLandscape: {
    marginBottom: 0,
    alignItems: 'center',
  },
  logoContainer: {
    width: 110,
    height: 110,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  logoBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFBEB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: theme.colors.white,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  landscapeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 1300, // much wider max
    gap: '8%', // Use percentage gap to spread out
  },
  landscapeLeft: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 550, // Let the logo side breathe
  },
  landscapeRight: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 550, // Increase max width for tablet form
  },
  glassCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 28,
    padding: theme.spacing.xl,
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 25 },
    shadowOpacity: 0.2,
    shadowRadius: 35,
    elevation: 25,
  },
  glassCardTablet: {
    padding: 40,
    maxWidth: 460,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 32,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  formSpace: {
    marginBottom: theme.spacing.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.error + '10',
    borderRadius: theme.spacing.borderRadius.md,
  },
  errorText: {
    color: theme.colors.error,
    flex: 1,
    fontWeight: '600',
  },
  signInButton: {
    height: 56,
    borderRadius: theme.spacing.borderRadius.lg,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  footerNote: {
    textAlign: 'center',
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 28,
    fontWeight: '500',
  },
});
