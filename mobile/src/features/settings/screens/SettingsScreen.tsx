import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { settingsApi } from '../../../api/settings';
import { AppButton } from '../../../components/AppButton';
import { AppInput } from '../../../components/AppInput';
import { AppText } from '../../../components/AppText';
import { Card } from '../../../components/Card';
import { Screen } from '../../../components/Screen';
import type { ShopSettings } from '../../../types';
import { theme } from '../../../theme';

export function SettingsScreen() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await settingsApi.get();
      return (res as any).data ?? res;
    },
  });

  const settings = query.data as ShopSettings | undefined;
  const [pointsPerAmount, setPointsPerAmount] = useState('');
  const [redemptionValue, setRedemptionValue] = useState('');
  const [minRedeemPoints, setMinRedeemPoints] = useState('');
  const [pointsExpiryMonths, setPointsExpiryMonths] = useState('');
  const [expiryWarningDays, setExpiryWarningDays] = useState('');

  useEffect(() => {
    if (!settings) return;
    setPointsPerAmount(String(settings.pointsPerAmount ?? ''));
    setRedemptionValue(String(settings.redemptionValue ?? ''));
    setMinRedeemPoints(String(settings.minRedeemPoints ?? ''));
    setPointsExpiryMonths(String(settings.pointsExpiryMonths ?? ''));
    setExpiryWarningDays(String(settings.expiryWarningDays ?? ''));
  }, [settings]);

  const mutation = useMutation({
    mutationFn: async () => {
      const ppa = Number(pointsPerAmount);
      if (!ppa || ppa <= 0) throw new Error('Invalid points per amount.');
      const rv = Number(redemptionValue);
      if (!rv || rv <= 0) throw new Error('Invalid redemption value.');
      const min = Number(minRedeemPoints);
      if (min < 0) throw new Error('Invalid min redeem points.');
      const pem = Number(pointsExpiryMonths);
      if (pem < 0) throw new Error('Invalid points expiry months.');
      const ewd = Number(expiryWarningDays);
      if (ewd < 0) throw new Error('Invalid expiry warning days.');

      return await settingsApi.update({
        pointsPerAmount: ppa,
        redemptionValue: rv,
        minRedeemPoints: min,
        pointsExpiryMonths: pem,
        expiryWarningDays: ewd,
      });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  return (
    <Screen scroll>
      <View style={styles.header}>
        <AppText variant="h2">Settings</AppText>
        <AppText dim>Shop configuration for points and redemptions.</AppText>
      </View>

      <Card>
        {query.isLoading ? (
          <AppText dim>Loading…</AppText>
        ) : (
          <>
            <AppInput label="Points per amount" value={pointsPerAmount} onChangeText={setPointsPerAmount} keyboardType="number-pad" />
            <View style={{ height: theme.spacing.itemGap }} />
            <AppInput label="Redemption value (pts for 1 LKR)" value={redemptionValue} onChangeText={setRedemptionValue} keyboardType="number-pad" />
            <View style={{ height: theme.spacing.itemGap }} />
            <AppInput label="Min redeem points" value={minRedeemPoints} onChangeText={setMinRedeemPoints} keyboardType="number-pad" />
            <View style={{ height: theme.spacing.itemGap }} />
            <AppInput label="Points expiry months (0 = never)" value={pointsExpiryMonths} onChangeText={setPointsExpiryMonths} keyboardType="number-pad" />
            <View style={{ height: theme.spacing.itemGap }} />
            <AppInput label="Expiry warning days" value={expiryWarningDays} onChangeText={setExpiryWarningDays} keyboardType="number-pad" />
            <View style={{ height: theme.spacing.lg }} />
            <AppButton
              title="Save"
              loading={mutation.isPending}
              onPress={async () => {
                try {
                  await mutation.mutateAsync();
                  Alert.alert('Saved', 'Settings updated.');
                } catch (e) {
                  Alert.alert('Error', e instanceof Error ? e.message : 'Save failed');
                }
              }}
            />
          </>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
    marginBottom: theme.spacing.lg,
  },
});
