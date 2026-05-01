import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { purchasesApi } from '../../../api/purchases';
import { AppText } from '../../../components/AppText';
import { Screen } from '../../../components/Screen';
import type { Purchase } from '../../../types';
import { theme } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';

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
    <Screen padded={false} scroll={false}>
      <View style={styles.content}>
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
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
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            >
              <View style={styles.amountIcon}>
                <Ionicons name="receipt-outline" size={22} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={styles.amount}>Rs. {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</AppText>
                <AppText dim variant="caption">
                  {new Date(item.createdAt).toLocaleString()}
                </AppText>
              </View>
              <View style={styles.pointsEarned}>
                <Ionicons name="arrow-up" size={14} color={theme.colors.success} />
                <AppText variant="caption" style={styles.pointsText}>
                  {item.pointsEarned} pts
                </AppText>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            purchasesQuery.isLoading ? (
              <View style={styles.empty}>
                <Ionicons name="hourglass-outline" size={48} color={theme.colors.textLight} />
                <AppText dim style={{ marginTop: 12 }}>Loading transactions…</AppText>
              </View>
            ) : (
              <View style={styles.empty}>
                <Ionicons name="cart-outline" size={48} color={theme.colors.textLight} />
                <AppText dim style={{ marginTop: 12 }}>No purchases yet</AppText>
                <AppText dim variant="caption">Transactions will appear here</AppText>
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

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    maxWidth: theme.spacing.layout.maxContentWidth,
    alignSelf: 'center',
    width: '100%',
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
  rowPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  amountIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: {
    fontWeight: '700',
    fontSize: 16,
  },
  pointsEarned: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.success + '12',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pointsText: {
    fontWeight: '700',
    color: theme.colors.success,
  },
  empty: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
});
