import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '../../../components/AppText';
import { Card } from '../../../components/Card';
import { Screen } from '../../../components/Screen';
import type { MoreStackParamList } from '../../../types/navigation';
import { theme } from '../../../theme';
import { useAuth } from '../../../hooks/useAuth';

type Props = NativeStackScreenProps<MoreStackParamList, 'MoreHome'>;

const items: { title: string; subtitle: string; to: keyof MoreStackParamList }[] = [
  { title: 'Purchases', subtitle: 'View transactions and void', to: 'Purchases' },
  { title: 'Reward Tiers', subtitle: 'Configure rewards', to: 'Rewards' },
  { title: 'Messages', subtitle: 'View message logs', to: 'Messages' },
  { title: 'Staff Users', subtitle: 'Manage shop users', to: 'Users' },
  { title: 'Settings', subtitle: 'Shop configuration', to: 'Settings' },
];

export function MoreScreen({ navigation }: Props) {
  const { user, clearAuth } = useAuth();
  return (
    <Screen scroll>
      <Card style={styles.profile} variant="flat">
        <AppText variant="h3">{user?.name ?? 'Shop Staff'}</AppText>
        <AppText dim variant="caption">
          {user?.email ?? user?.username ?? ''}
        </AppText>
      </Card>

      <View style={{ height: theme.spacing.md }} />

      <Card style={styles.list}>
        {items.map((item) => (
          <Pressable key={item.to} onPress={() => navigation.navigate(item.to)} style={styles.row}>
            <View style={{ flex: 1 }}>
              <AppText variant="h3">{item.title}</AppText>
              <AppText dim variant="caption">
                {item.subtitle}
              </AppText>
            </View>
            <AppText dim>{'›'}</AppText>
          </Pressable>
        ))}
      </Card>

      <View style={{ height: theme.spacing.lg }} />
      <Pressable onPress={() => clearAuth()} style={styles.signOut}>
        <AppText style={styles.signOutText}>Sign out</AppText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: {
    padding: theme.spacing.md,
    gap: 2,
  },
  list: {
    padding: 0,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 12,
  },
  signOut: {
    height: 48,
    borderRadius: theme.spacing.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  signOutText: {
    color: theme.colors.danger,
    fontWeight: '700',
  },
});
