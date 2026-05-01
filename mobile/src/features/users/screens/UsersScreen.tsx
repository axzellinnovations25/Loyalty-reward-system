import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { usersApi } from '../../../api/users';
import { AppInput } from '../../../components/AppInput';
import { AppText } from '../../../components/AppText';
import { Screen } from '../../../components/Screen';
import type { User } from '../../../types';
import { theme } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';

export function UsersScreen() {
  const [search, setSearch] = useState('');

  const query = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await usersApi.list();
      const payload = (res as any).data ?? res;
      return payload.data ?? payload;
    },
  });

  const items = useMemo<User[]>(() => {
    const all = (Array.isArray(query.data) ? (query.data as User[]) : []) ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter((u) => `${u.name} ${u.username} ${u.email}`.toLowerCase().includes(q));
  }, [query.data, search]);

  return (
    <Screen padded={false} scroll={false}>
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <AppInput value={search} onChangeText={setSearch} placeholder="Search by name or username" icon="search" />
        </View>

        <FlatList
          data={items}
          keyExtractor={(u) => u.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.name) }]}>
                <AppText style={styles.avatarText}>{item.name?.[0]?.toUpperCase() ?? '?'}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={styles.name}>{item.name}</AppText>
                <AppText dim variant="caption">{item.username}</AppText>
              </View>
              {item.isActive === false ? (
                <View style={styles.inactiveBadge}>
                  <AppText variant="caption" style={{ fontWeight: '700', color: theme.colors.danger, fontSize: 11 }}>
                    INACTIVE
                  </AppText>
                </View>
              ) : (
                <View style={styles.activeBadge}>
                  <View style={styles.activeDot} />
                  <AppText variant="caption" style={{ fontWeight: '600', color: theme.colors.success, fontSize: 11 }}>
                    Active
                  </AppText>
                </View>
              )}
            </View>
          )}
          ListEmptyComponent={
            query.isLoading ? (
              <View style={styles.empty}>
                <Ionicons name="hourglass-outline" size={48} color={theme.colors.textLight} />
                <AppText dim style={{ marginTop: 12 }}>Loading staff…</AppText>
              </View>
            ) : (
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={48} color={theme.colors.textLight} />
                <AppText dim style={{ marginTop: 12 }}>No staff users found</AppText>
              </View>
            )
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Screen>
  );
}

function getAvatarColor(name: string) {
  const colors = ['#4F46E5', '#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6'];
  const index = (name?.charCodeAt(0) || 0) % colors.length;
  return colors[index] + '18';
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    maxWidth: theme.spacing.layout.maxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  searchContainer: {
    marginBottom: theme.spacing.md,
  },
  listContent: {
    paddingBottom: 100,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    gap: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.borderRadius.lg,
    marginBottom: 8,
    ...theme.spacing.shadows.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '800',
    fontSize: 18,
    color: theme.colors.text,
  },
  name: {
    fontWeight: '700',
    fontSize: 15,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: theme.colors.success + '12',
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
  inactiveBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: theme.colors.danger + '12',
  },
  empty: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
    gap: 4,
  },
});
