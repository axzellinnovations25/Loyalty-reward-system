import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { usersApi } from '../../../api/users';
import { AppInput } from '../../../components/AppInput';
import { AppText } from '../../../components/AppText';
import { Card } from '../../../components/Card';
import { Screen } from '../../../components/Screen';
import type { User } from '../../../types';
import { theme } from '../../../theme';

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
    <Screen scroll={false}>
      <View style={styles.header}>
        <AppText variant="h2">Staff users</AppText>
        <AppText dim>Search by name, username, or email.</AppText>
      </View>

      <AppInput value={search} onChangeText={setSearch} placeholder="Search users" />
      <View style={{ height: theme.spacing.md }} />

      <Card style={styles.list}>
        <FlatList
          data={items}
          keyExtractor={(u) => u.id}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <AppText style={{ fontWeight: '800' }}>{item.name}</AppText>
                <AppText dim variant="caption">
                  {item.username} • {item.role}
                </AppText>
              </View>
              <AppText dim variant="caption">
                {item.isActive === false ? 'Inactive' : ''}
              </AppText>
            </View>
          )}
          ListEmptyComponent={query.isLoading ? <AppText dim>Loading…</AppText> : <AppText dim>No users found.</AppText>}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
    marginBottom: theme.spacing.lg,
  },
  list: {
    flex: 1,
    padding: 0,
    overflow: 'hidden',
  },
  listContent: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    gap: 12,
  },
  sep: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginLeft: theme.spacing.lg,
  },
});
