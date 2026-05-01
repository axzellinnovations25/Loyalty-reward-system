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
import { Ionicons } from '@expo/vector-icons';

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
      {query.isLoading ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass-outline" size={48} color={theme.colors.textLight} />
          <AppText dim style={{ marginTop: 12 }}>Loading settings…</AppText>
        </View>
      ) : (
        <>
          {/* Points Section */}
          <View style={styles.sectionHeader}>
            <Ionicons name="diamond-outline" size={18} color={theme.colors.primary} />
            <AppText variant="h3">Points Configuration</AppText>
          </View>
          <Card style={styles.card}>
            <AppInput label="Spend per 1 point (LKR)" value={pointsPerAmount} onChangeText={setPointsPerAmount} keyboardType="number-pad" icon="cash-outline" />
            <View style={{ height: theme.spacing.md }} />
            <AppInput label="Points for Rs. 1 discount" value={redemptionValue} onChangeText={setRedemptionValue} keyboardType="number-pad" icon="swap-horizontal-outline" />
            <View style={{ height: theme.spacing.md }} />
            <AppInput label="Min points to redeem" value={minRedeemPoints} onChangeText={setMinRedeemPoints} keyboardType="number-pad" icon="shield-checkmark-outline" />
          </Card>

          {/* Expiry Section */}
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={18} color={theme.colors.warning} />
            <AppText variant="h3">Expiry Rules</AppText>
          </View>
          <Card style={styles.card}>
            <AppInput label="Points expire after (months, 0 = never)" value={pointsExpiryMonths} onChangeText={setPointsExpiryMonths} keyboardType="number-pad" icon="calendar-outline" />
            <View style={{ height: theme.spacing.md }} />
            <AppInput label="Warning before expiry (days)" value={expiryWarningDays} onChangeText={setExpiryWarningDays} keyboardType="number-pad" icon="notifications-outline" />
          </Card>

          <AppButton
            title="Save Settings"
            size="lg"
            loading={mutation.isPending}
            onPress={async () => {
              try {
                await mutation.mutateAsync();
                Alert.alert('Saved', 'Settings updated successfully.');
              } catch (e) {
                Alert.alert('Error', e instanceof Error ? e.message : 'Save failed');
              }
            }}
          />
          <View style={{ height: theme.spacing.xxl }} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginTop: theme.spacing.md,
  },
  card: {
    marginBottom: theme.spacing.md,
  },
});
