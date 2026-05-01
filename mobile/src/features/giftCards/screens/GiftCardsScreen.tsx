import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { giftCardsApi } from '../../../api/giftCards';
import { AppButton } from '../../../components/AppButton';
import { AppInput } from '../../../components/AppInput';
import { AppText } from '../../../components/AppText';
import { Card } from '../../../components/Card';
import { Screen } from '../../../components/Screen';
import type { GiftCard } from '../../../types';
import type { GiftCardsStackParamList } from '../../../types/navigation';
import { theme } from '../../../theme';

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

  return (
    <Screen scroll>
      <View style={styles.header}>
        <AppText variant="h2">Gift Cards</AppText>
        <AppText dim>Create and redeem gift cards.</AppText>
      </View>

      <Card>
        <AppText variant="h3">Create</AppText>
        <View style={{ height: theme.spacing.sm }} />
        <AppInput label="Value (LKR)" value={value} onChangeText={setValue} keyboardType="decimal-pad" placeholder="0.00" />
        <View style={{ height: theme.spacing.itemGap }} />
        <AppInput label="Expiry date (YYYY-MM-DD)" value={expiryDate} onChangeText={setExpiryDate} placeholder="Optional" />
        <View style={{ height: theme.spacing.md }} />
        <AppButton
          title="Create gift card"
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
        <View style={{ height: theme.spacing.md }} />
        <AppButton title="Scan / redeem" variant="secondary" onPress={() => navigation.navigate('ScanGiftCard')} />
      </Card>

      <View style={{ height: theme.spacing.lg }} />
      <Card style={styles.list}>
        <AppText variant="h3">Recent</AppText>
        <View style={{ height: theme.spacing.sm }} />
        <FlatList
          data={cards}
          keyExtractor={(c) => c.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <Pressable style={styles.row}>
              <View style={{ flex: 1 }}>
                <AppText style={{ fontWeight: '800' }}>{item.code}</AppText>
                <AppText dim variant="caption">
                  {item.status.toUpperCase()} • Rs. {Number(item.value).toFixed(2)}
                </AppText>
              </View>
              <AppText dim variant="caption">
                {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '—'}
              </AppText>
            </Pressable>
          )}
          ListEmptyComponent={listQuery.isLoading ? <AppText dim>Loading…</AppText> : <AppText dim>No gift cards yet.</AppText>}
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
    padding: theme.spacing.md,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
});

