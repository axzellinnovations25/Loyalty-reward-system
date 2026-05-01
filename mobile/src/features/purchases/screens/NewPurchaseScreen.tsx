import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { customersApi } from '../../../api/customers';
import { purchasesApi } from '../../../api/purchases';
import { redemptionsApi } from '../../../api/redemptions';
import { settingsApi } from '../../../api/settings';
import { AppButton } from '../../../components/AppButton';
import { AppInput } from '../../../components/AppInput';
import { AppText } from '../../../components/AppText';
import { Card } from '../../../components/Card';
import { Screen } from '../../../components/Screen';
import type { Customer, Purchase, RedemptionPreview, ShopSettings } from '../../../types';
import { theme } from '../../../theme';

export function NewPurchaseScreen() {
  const qc = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [amount, setAmount] = useState('');
  const [applyRedemption, setApplyRedemption] = useState(false);
  const [redemptionPoints, setRedemptionPoints] = useState('');

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await settingsApi.get();
      return (res as any).data ?? res;
    },
  });
  const settings = settingsQuery.data as ShopSettings | undefined;

  const customersQuery = useQuery({
    queryKey: ['customerSearch', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const res = await customersApi.list({ search: searchQuery, limit: 10 });
      const payload = (res as any).data ?? res;
      const page = payload.data ?? payload;
      return (page.items ?? []) as Customer[];
    },
  });

  const recentPurchasesQuery = useQuery({
    queryKey: ['recentPurchases'],
    queryFn: async () => {
      const res = await purchasesApi.list({ limit: 5 });
      const payload = (res as any).data ?? res;
      return (payload.items ?? payload.data?.items ?? []) as Purchase[];
    },
  });

  const numericAmount = Number(amount || 0);
  const pointsEarned = useMemo(() => {
    if (!settings || !numericAmount) return 0;
    const pointsPerAmount = Number(settings.pointsPerAmount || 0);
    if (!pointsPerAmount) return 0;
    return Math.floor(numericAmount / pointsPerAmount);
  }, [settings, numericAmount]);

  const redemptionPreviewQuery = useQuery({
    queryKey: ['redemptionPreview', selectedCustomer?.id, numericAmount],
    enabled: !!selectedCustomer?.id && numericAmount > 0,
    queryFn: async () => {
      const res = await redemptionsApi.preview(selectedCustomer!.id, selectedCustomer!.totalPoints);
      return (res as any).data ?? res;
    },
  });

  useEffect(() => {
    // Reset redemption when switching customer/amount
    setApplyRedemption(false);
    setRedemptionPoints('');
  }, [selectedCustomer?.id, amount]);

  useEffect(() => {
    const preview = redemptionPreviewQuery.data as RedemptionPreview | undefined;
    if (!preview || !settings) return;
    if (numericAmount <= 0) return;
    // Default to min redeem points when possible
    const min = Number(settings.minRedeemPoints ?? preview.minRedeemPoints ?? 0);
    if (min > 0) setRedemptionPoints(String(min));
  }, [redemptionPreviewQuery.data, settings, numericAmount]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!selectedCustomer) throw new Error('Select a customer.');
      if (!numericAmount || numericAmount <= 0) throw new Error('Enter a valid amount.');
      await purchasesApi.create({ customerId: selectedCustomer.id, amount: numericAmount });
      if (applyRedemption && Number(redemptionPoints || 0) > 0) {
        await redemptionsApi.create({
          customerId: selectedCustomer.id,
          pointsRedeemed: Number(redemptionPoints || 0),
          billAmount: numericAmount,
        });
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['recentPurchases'] });
      await qc.invalidateQueries({ queryKey: ['purchases'] });
      await qc.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  return (
    <Screen scroll>
      <Card>
        <AppInput
          label="Customer"
          value={searchQuery}
          onChangeText={(t) => {
            setSearchQuery(t);
            setSelectedCustomer(null);
          }}
          placeholder="Search by name or phone"
        />

        {selectedCustomer ? (
          <View style={styles.selected}>
            <AppText style={styles.selectedName}>{selectedCustomer.name}</AppText>
            <AppText dim variant="caption">
              {selectedCustomer.phone} • {selectedCustomer.totalPoints.toLocaleString()} pts
            </AppText>
          </View>
        ) : customersQuery.data?.length ? (
          <View style={styles.suggestions}>
            {customersQuery.data.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => {
                  setSelectedCustomer(c);
                  setSearchQuery(c.name);
                }}
                style={styles.suggestionRow}
              >
                <AppText style={{ fontWeight: '700' }}>{c.name}</AppText>
                <AppText dim variant="caption">
                  {c.phone}
                </AppText>
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={{ height: theme.spacing.md }} />
        <AppInput label="Amount (LKR)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" />

        <View style={{ height: theme.spacing.md }} />
        <Card variant="flat" style={styles.inlineCard}>
          <AppText dim variant="caption">
            Points to earn
          </AppText>
          <AppText variant="h2">{pointsEarned ? `+${pointsEarned}` : '—'}</AppText>
        </Card>

        <View style={{ height: theme.spacing.md }} />
        <Pressable
          style={[styles.toggle, applyRedemption && styles.toggleOn]}
          onPress={() => setApplyRedemption((v) => !v)}
          disabled={!redemptionPreviewQuery.data}
        >
          <AppText style={styles.toggleTitle}>Apply redemption</AppText>
          <AppText dim variant="caption">
            {redemptionPreviewQuery.data ? 'Optional discount using points' : 'Select customer and amount'}
          </AppText>
        </Pressable>

        {applyRedemption ? (
          <View style={{ marginTop: theme.spacing.md }}>
            <AppInput
              label="Points to redeem"
              value={redemptionPoints}
              onChangeText={setRedemptionPoints}
              keyboardType="number-pad"
              placeholder="0"
            />
            {redemptionPreviewQuery.data ? (
              <AppText dim variant="caption" style={{ marginTop: 8 }}>
                Preview: discount Rs. {(redemptionPreviewQuery.data as any).discountValue ?? '—'} • Remaining{' '}
                {(redemptionPreviewQuery.data as any).remainingPoints ?? '—'} pts
              </AppText>
            ) : null}
          </View>
        ) : null}

        <View style={{ height: theme.spacing.lg }} />
        <AppButton
          title="Complete purchase"
          loading={createMutation.isPending}
          onPress={async () => {
            try {
              await createMutation.mutateAsync();
              Alert.alert('Success', 'Purchase recorded.');
              setAmount('');
              setSelectedCustomer(null);
              setSearchQuery('');
              setApplyRedemption(false);
              setRedemptionPoints('');
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Failed to create purchase');
            }
          }}
        />
      </Card>

      <View style={{ height: theme.spacing.lg }} />
      <Card style={styles.recent}>
        <AppText variant="h3">Recent purchases</AppText>
        <View style={{ height: theme.spacing.sm }} />
        <FlatList
          data={recentPurchasesQuery.data ?? []}
          keyExtractor={(p) => p.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.recentRow}>
              <View style={{ flex: 1 }}>
                <AppText style={{ fontWeight: '700' }}>Rs. {Number(item.amount).toFixed(2)}</AppText>
                <AppText dim variant="caption">
                  {new Date(item.createdAt).toLocaleString()}
                </AppText>
              </View>
              <AppText variant="caption" style={styles.recentPoints}>
                +{item.pointsEarned} pts
              </AppText>
            </View>
          )}
          ListEmptyComponent={<AppText dim>No recent purchases.</AppText>}
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
  suggestions: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.borderRadius.md,
    overflow: 'hidden',
  },
  suggestionRow: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 2,
  },
  selected: {
    marginTop: 10,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.spacing.borderRadius.md,
    gap: 2,
  },
  selectedName: {
    fontWeight: '800',
  },
  inlineCard: {
    padding: theme.spacing.md,
    gap: 4,
  },
  toggle: {
    padding: theme.spacing.md,
    borderRadius: theme.spacing.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: 4,
  },
  toggleOn: {
    borderColor: theme.colors.primary,
  },
  toggleTitle: {
    fontWeight: '800',
  },
  recent: {
    padding: theme.spacing.md,
    gap: 8,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 12,
  },
  recentPoints: {
    fontWeight: '800',
    color: theme.colors.success,
  },
});
