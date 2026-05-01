import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { customersApi } from '../../../api/customers';
import { AppInput } from '../../../components/AppInput';
import { AppText } from '../../../components/AppText';
import { Screen } from '../../../components/Screen';
import type { Customer } from '../../../types';
import type { CustomersStackParamList } from '../../../types/navigation';
import { theme } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<CustomersStackParamList, 'CustomersHome'>;

export function CustomersScreen({ navigation }: Props) {
  const [search, setSearch] = useState('');

  const customersQuery = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => {
      const res = await customersApi.list({ search, limit: 50 });
      const payload = (res as any).data ?? res;
      return payload.data ?? payload;
    },
  });

  const customers = useMemo<Customer[]>(() => customersQuery.data?.items ?? [], [customersQuery.data]);

  return (
    <Screen padded={false} scroll={false}>
      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <AppInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or phone"
            icon="search"
          />
        </View>

        <FlatList
          data={customers}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => navigation.navigate('CustomerDetail', { id: item.id })}
            >
              <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.name) }]}>
                <AppText style={styles.avatarText}>{item.name?.[0]?.toUpperCase() ?? '?'}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={styles.name}>{item.name}</AppText>
                <AppText dim variant="caption">{item.phone}</AppText>
              </View>
              <View style={styles.pointsBadge}>
                <Ionicons name="diamond" size={12} color={theme.colors.primary} />
                <AppText variant="caption" style={styles.points}>
                  {item.totalPoints?.toLocaleString?.() ?? item.totalPoints}
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textLight} />
            </Pressable>
          )}
          ListEmptyComponent={
            customersQuery.isLoading ? (
              <View style={styles.empty}>
                <Ionicons name="hourglass-outline" size={48} color={theme.colors.textLight} />
                <AppText dim style={{ marginTop: 12 }}>Loading clients…</AppText>
              </View>
            ) : (
              <View style={styles.empty}>
                <Ionicons name="people-outline" size={48} color={theme.colors.textLight} />
                <AppText dim style={{ marginTop: 12 }}>No clients found</AppText>
                <AppText dim variant="caption">Try a different search term</AppText>
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
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
    gap: 14,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.borderRadius.lg,
    marginBottom: 8,
    ...theme.spacing.shadows.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  rowPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
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
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  points: {
    fontWeight: '700',
    color: theme.colors.primary,
  },
  empty: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
});
