import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/AppText';
import { Card } from '../../../components/Card';
import { Screen } from '../../../components/Screen';
import type { MoreStackParamList } from '../../../types/navigation';
import { theme } from '../../../theme';
import { useAuth } from '../../../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<MoreStackParamList, 'MoreHome'>;

const items: { title: string; subtitle: string; to: keyof MoreStackParamList; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { title: 'Purchases', subtitle: 'View transactions and void', to: 'Purchases', icon: 'receipt-outline', color: theme.colors.primary },
  { title: 'Reward Tiers', subtitle: 'Configure rewards', to: 'Rewards', icon: 'trophy-outline', color: theme.colors.warning },
  { title: 'Messages', subtitle: 'View message logs', to: 'Messages', icon: 'chatbubble-outline', color: theme.colors.info },
  { title: 'Staff Users', subtitle: 'Manage shop users', to: 'Users', icon: 'people-outline', color: theme.colors.success },
  { title: 'Settings', subtitle: 'Shop configuration', to: 'Settings', icon: 'settings-outline', color: theme.colors.secondary },
];

export function MoreScreen({ navigation }: Props) {
  const { user, clearAuth } = useAuth();
  return (
    <Screen scroll contentStyle={styles.screenContent}>
      <View style={styles.container}>
        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <View style={styles.profileAvatar}>
              <AppText style={styles.profileAvatarText}>
                {user?.name?.[0]?.toUpperCase() ?? 'S'}
              </AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="h2" style={styles.profileName}>{user?.name ?? 'Shop Staff'}</AppText>
              <AppText dim style={styles.profileEmail}>
                {(user as any)?.email ?? (user as any)?.username ?? 'Shop Owner'}
              </AppText>
            </View>
            <View style={styles.badge}>
              <AppText style={styles.badgeText}>Admin</AppText>
            </View>
          </View>
        </Card>

        {/* Menu List */}
        <AppText variant="h3" style={styles.sectionTitle}>Management</AppText>
        <View style={styles.menuContainer}>
          {items.map((item, index) => (
            <Pressable
              key={item.to}
              onPress={() => navigation.navigate(item.to)}
              style={({ pressed }) => [
                styles.menuRow,
                index !== items.length - 1 && styles.menuRowBorder,
                pressed && styles.menuRowPressed,
              ]}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>
              <View style={styles.menuTextContainer}>
                <AppText style={styles.menuTitle}>{item.title}</AppText>
                <AppText dim variant="caption">{item.subtitle}</AppText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.border} />
            </Pressable>
          ))}
        </View>

        <Pressable
          onPress={() => clearAuth()}
          style={({ pressed }) => [styles.signOut, pressed && styles.signOutPressed]}
        >
          <Ionicons name="log-out-outline" size={20} color={theme.colors.danger} />
          <AppText style={styles.signOutText}>Sign Out Securely</AppText>
        </Pressable>
        <AppText style={styles.versionText}>TillMate App v1.0.0</AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    paddingTop: theme.spacing.lg,
  },
  container: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  profileCard: {
    marginBottom: theme.spacing.xl,
    padding: theme.spacing.xl,
    borderRadius: 24,
    backgroundColor: theme.colors.surface,
    ...theme.spacing.shadows.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontWeight: '800',
    fontSize: 28,
    color: theme.colors.primary,
  },
  profileName: {
    fontWeight: '800',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: theme.colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    marginBottom: 12,
    paddingHorizontal: 8,
    color: theme.colors.textMuted,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  menuContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    overflow: 'hidden',
    ...theme.spacing.shadows.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    marginBottom: theme.spacing.xxl,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.surface,
  },
  menuRowPressed: {
    backgroundColor: theme.colors.backgroundSubtle,
  },
  menuRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '50', // 50% opacity border
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  menuTitle: {
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 2,
    color: theme.colors.text,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.danger + '25',
    ...theme.spacing.shadows.sm,
  },
  signOutPressed: {
    backgroundColor: theme.colors.danger + '08',
  },
  signOutText: {
    color: theme.colors.danger,
    fontWeight: '700',
    fontSize: 16,
  },
  versionText: {
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 40,
    color: theme.colors.textLight,
    fontSize: 13,
    fontWeight: '500',
  },
});
