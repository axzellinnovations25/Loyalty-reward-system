import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { rewardsApi } from '../../../api/rewards';
import { AppButton } from '../../../components/AppButton';
import { AppInput } from '../../../components/AppInput';
import { AppText } from '../../../components/AppText';
import { Card } from '../../../components/Card';
import { Screen } from '../../../components/Screen';
import type { Reward } from '../../../types';
import { theme } from '../../../theme';

export function RewardsScreen() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [minPoints, setMinPoints] = useState('');
  const [discountValue, setDiscountValue] = useState('');

  const listQuery = useQuery({
    queryKey: ['rewards'],
    queryFn: async () => {
      const res = await rewardsApi.list();
      const payload = (res as any).data ?? res;
      return payload.data ?? payload;
    },
  });

  const items = useMemo<Reward[]>(() => (Array.isArray(listQuery.data) ? (listQuery.data as Reward[]) : []), [listQuery.data]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const mp = Number(minPoints);
      const dv = Number(discountValue);
      if (!name.trim()) throw new Error('Enter a reward name.');
      if (!mp || mp <= 0) throw new Error('Enter min points.');
      if (!dv || dv <= 0) throw new Error('Enter discount value.');
      return await rewardsApi.create({ name: name.trim(), minPoints: mp, discountValue: dv });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['rewards'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await rewardsApi.delete(id);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['rewards'] });
    },
  });

  return (
    <Screen scroll>
      <View style={styles.header}>
        <AppText variant="h2">Reward tiers</AppText>
        <AppText dim>Configure redemption tiers for customers.</AppText>
      </View>

      <Card>
        <AppText variant="h3">Create tier</AppText>
        <View style={{ height: theme.spacing.sm }} />
        <AppInput label="Name" value={name} onChangeText={setName} placeholder="Gold tier" />
        <View style={{ height: theme.spacing.itemGap }} />
        <AppInput label="Min points" value={minPoints} onChangeText={setMinPoints} keyboardType="number-pad" placeholder="0" />
        <View style={{ height: theme.spacing.itemGap }} />
        <AppInput
          label="Discount value (LKR)"
          value={discountValue}
          onChangeText={setDiscountValue}
          keyboardType="decimal-pad"
          placeholder="0.00"
        />
        <View style={{ height: theme.spacing.md }} />
        <AppButton
          title="Create"
          loading={createMutation.isPending}
          onPress={async () => {
            try {
              await createMutation.mutateAsync();
              setName('');
              setMinPoints('');
              setDiscountValue('');
              Alert.alert('Created', 'Reward tier added.');
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Create failed');
            }
          }}
        />
      </Card>

      <View style={{ height: theme.spacing.lg }} />
      <Card style={styles.list}>
        <AppText variant="h3">Tiers</AppText>
        <View style={{ height: theme.spacing.sm }} />
        <FlatList
          data={items}
          keyExtractor={(r) => r.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <Pressable
              onLongPress={() =>
                Alert.alert('Delete tier?', 'This cannot be undone.', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await deleteMutation.mutateAsync(item.id);
                      } catch (e) {
                        Alert.alert('Error', e instanceof Error ? e.message : 'Delete failed');
                      }
                    },
                  },
                ])
              }
              style={styles.row}
            >
              <View style={{ flex: 1 }}>
                <AppText style={{ fontWeight: '800' }}>{item.name}</AppText>
                <AppText dim variant="caption">
                  Min {item.minPoints} pts • Discount Rs. {Number(item.discountValue).toFixed(2)}
                </AppText>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={listQuery.isLoading ? <AppText dim>Loading…</AppText> : <AppText dim>No tiers yet.</AppText>}
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
});

