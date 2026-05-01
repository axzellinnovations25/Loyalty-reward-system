import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { giftCardsApi } from '../../../api/giftCards';
import { AppButton } from '../../../components/AppButton';
import { AppInput } from '../../../components/AppInput';
import { AppText } from '../../../components/AppText';
import { Card } from '../../../components/Card';
import { Screen } from '../../../components/Screen';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { GiftCard } from '../../../types';
import type { GiftCardsStackParamList } from '../../../types/navigation';
import { theme } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<GiftCardsStackParamList, 'GiftCardsHome'>;

export function GiftCardsScreen({ navigation }: Props) {
  const qc = useQueryClient();
  const [value, setValue] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const listQuery = useQuery({
    queryKey: ['giftCards'],
    queryFn: async () => {
      const res = await giftCardsApi.list({ limit: 50 });
      const payload = (res as any).data ?? res;
      return payload.items ? payload : payload.data ?? payload;
    },
  });

  const cards = useMemo<GiftCard[]>(() => listQuery.data?.items ?? listQuery.data ?? [], [listQuery.data]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const n = Number(value);
      if (!n || n <= 0) throw new Error('Enter a valid value.');
      return await giftCardsApi.create({ value: n, expiryDate: expiryDate || null });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['giftCards'] });
    },
  });

  const statusColor = (status: string) => {
    if (status === 'active') return theme.colors.success;
    if (status === 'used') return theme.colors.textMuted;
    return theme.colors.danger;
  };

  return (
    <Screen scroll>
      {/* Create Card */}
      <Card style={styles.createCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="add-circle" size={22} color={theme.colors.primary} />
          <AppText variant="h3">Create New</AppText>
        </View>
        <View style={{ height: theme.spacing.md }} />
        <AppInput label="Value (LKR)" value={value} onChangeText={setValue} keyboardType="decimal-pad" placeholder="0.00" icon="cash-outline" />
        <View style={{ height: theme.spacing.md }} />
        <AppInput label="Expiry (YYYY-MM-DD)" value={expiryDate} onChangeText={setExpiryDate} placeholder="Optional" icon="calendar-outline" />
        <View style={{ height: theme.spacing.lg }} />
        <AppButton
          title="Create Gift Card"
          loading={createMutation.isPending}
          onPress={async () => {
            try {
              const res = await createMutation.mutateAsync();
              const created = (res as any).data ?? res;
              Alert.alert('Created', `Code: ${created.code ?? ''}`);
              setValue('');
              setExpiryDate('');
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Create failed');
            }
          }}
        />
        <View style={{ height: theme.spacing.sm }} />
        <AppButton title="Scan / Redeem" variant="outline" onPress={() => navigation.navigate('ScanGiftCard')} />
      </Card>

      {/* List */}
      <View style={styles.sectionHeader}>
        <Ionicons name="gift" size={20} color={theme.colors.text} />
        <AppText variant="h3">Recent Vouchers</AppText>
      </View>
      <FlatList
        data={cards}
        keyExtractor={(c) => c.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.codeIcon}>
              <Ionicons name="card-outline" size={22} color={theme.colors.info} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText style={styles.code}>{item.code}</AppText>
              <AppText dim variant="caption">
                Rs. {Number(item.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </AppText>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '15' }]}>
              <AppText variant="caption" style={{ fontWeight: '700', color: statusColor(item.status), fontSize: 11 }}>
                {item.status.toUpperCase()}
              </AppText>
            </View>
          </View>
        )}
        ListEmptyComponent={
          listQuery.isLoading ? (
            <View style={styles.empty}><AppText dim>Loading…</AppText></View>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="gift-outline" size={48} color={theme.colors.textLight} />
              <AppText dim style={{ marginTop: 12 }}>No gift cards yet</AppText>
            </View>
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  createCard: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.borderRadius.lg,
    marginBottom: 8,
    ...theme.spacing.shadows.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  codeIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.info + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  code: {
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  empty: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
    gap: 4,
  },
});
