import { useQuery } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { customersApi } from '../../../api/customers';
import { AppInput } from '../../../components/AppInput';
import { AppText } from '../../../components/AppText';
import { Card } from '../../../components/Card';
import { Screen } from '../../../components/Screen';
import type { Customer } from '../../../types';
import type { CustomersStackParamList } from '../../../types/navigation';
import { theme } from '../../../theme';

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
    <Screen scroll={false}>
      <View style={styles.header}>
        <AppText variant="h2">Customers</AppText>
        <AppText dim>Search by name or phone.</AppText>
      </View>

      <AppInput value={search} onChangeText={setSearch} placeholder="Search customers" />
      <View style={{ height: theme.spacing.md }} />

      <Card style={styles.list}>
        <FlatList
          data={customers}
          keyExtractor={(c) => c.id}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => navigation.navigate('CustomerDetail', { id: item.id })}>
              <View style={styles.avatar}>
                <AppText style={styles.avatarText}>{item.name?.[0]?.toUpperCase() ?? '?'}</AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={styles.name}>{item.name}</AppText>
                <AppText dim variant="caption">
                  {item.phone}
                </AppText>
              </View>
              <AppText variant="caption" style={styles.points}>
                {item.totalPoints?.toLocaleString?.() ?? item.totalPoints} pts
              </AppText>
            </Pressable>
          )}
          ListEmptyComponent={
            customersQuery.isLoading ? (
              <View style={styles.empty}>
                <AppText dim>Loading…</AppText>
              </View>
            ) : (
              <View style={styles.empty}>
                <AppText dim>No customers found.</AppText>
              </View>
            )
          }
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontWeight: '800',
  },
  name: {
    fontWeight: '700',
  },
  points: {
    fontWeight: '800',
    color: theme.colors.primary,
  },
  empty: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
});
