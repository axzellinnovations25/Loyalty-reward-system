import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { purchasesApi } from '../../../api/purchases';
import { AppText } from '../../../components/AppText';
import { Card } from '../../../components/Card';
import { Screen } from '../../../components/Screen';
import type { Purchase } from '../../../types';
import { theme } from '../../../theme';

export function PurchasesScreen() {
  const qc = useQueryClient();
  const purchasesQuery = useQuery({
    queryKey: ['purchases'],
    queryFn: async () => {
      const res = await purchasesApi.list({ limit: 50 });
      const payload = (res as any).data ?? res;
      return payload.items ? payload : payload.data ?? payload;
    },
  });

  const items = useMemo<Purchase[]>(() => purchasesQuery.data?.items ?? purchasesQuery.data ?? [], [purchasesQuery.data]);

  const voidMutation = useMutation({
    mutationFn: async (id: string) => {
      await purchasesApi.void(id);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['purchases'] });
    },
  });

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <AppText variant="h2">Purchases</AppText>
        <AppText dim>Recent transactions. Long-press to void.</AppText>
      </View>

      <Card style={styles.list}>
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => (
            <Pressable
              onLongPress={() => {
                Alert.alert('Void purchase?', 'This will reverse points issued for this purchase.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Void',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await voidMutation.mutateAsync(item.id);
                      } catch (e) {
                        Alert.alert('Error', e instanceof Error ? e.message : 'Void failed');
                      }
                    },
                  },
                ]);
              }}
              style={styles.row}
            >
              <View style={{ flex: 1 }}>
                <AppText style={styles.amount}>Rs. {Number(item.amount).toFixed(2)}</AppText>
                <AppText dim variant="caption">
                  {new Date(item.createdAt).toLocaleString()}
                </AppText>
              </View>
              <AppText variant="caption" style={styles.points}>
                +{item.pointsEarned} pts
              </AppText>
            </Pressable>
          )}
          ListEmptyComponent={
            purchasesQuery.isLoading ? (
              <View style={styles.empty}>
                <AppText dim>Loading…</AppText>
              </View>
            ) : (
              <View style={styles.empty}>
                <AppText dim>No purchases yet.</AppText>
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
  amount: {
    fontWeight: '800',
  },
  points: {
    fontWeight: '800',
    color: theme.colors.success,
  },
  empty: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
});

