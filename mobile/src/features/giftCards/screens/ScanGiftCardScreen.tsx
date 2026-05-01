import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { giftCardsApi } from '../../../api/giftCards';
import { AppButton } from '../../../components/AppButton';
import { AppInput } from '../../../components/AppInput';
import { Card } from '../../../components/Card';
import { Screen } from '../../../components/Screen';
import { theme } from '../../../theme';

export function ScanGiftCardScreen() {
  const [code, setCode] = useState('');

  const redeemMutation = useMutation({
    mutationFn: async () => {
      if (!code.trim()) throw new Error('Enter the gift card code.');
      await giftCardsApi.redeem({ code: code.trim() });
    },
  });

  return (
    <Screen scroll contentStyle={styles.screen}>
      <Card style={styles.card}>
        <AppInput
          label="Gift Card Code"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          placeholder="XXXX-XXXX"
          icon="card-outline"
        />
        <View style={{ height: theme.spacing.xl }} />
        <AppButton
          title="Redeem Now"
          size="lg"
          loading={redeemMutation.isPending}
          onPress={async () => {
            try {
              await redeemMutation.mutateAsync();
              Alert.alert('Success', 'Gift card redeemed successfully.');
              setCode('');
            } catch (e) {
              Alert.alert('Error', e instanceof Error ? e.message : 'Redeem failed');
            }
          }}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
  },
  card: {
    ...theme.spacing.shadows.md,
  },
});
