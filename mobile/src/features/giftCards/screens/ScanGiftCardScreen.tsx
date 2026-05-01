import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { giftCardsApi } from '../../../api/giftCards';
import { AppButton } from '../../../components/AppButton';
import { AppInput } from '../../../components/AppInput';
import { AppText } from '../../../components/AppText';
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
      <View style={styles.header}>
        <AppText variant="h2">Redeem gift card</AppText>
        <AppText dim>Enter the code from the customer’s gift card.</AppText>
      </View>

      <Card>
        <AppInput label="Gift card code" value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="XXXX-XXXX" />
        <View style={{ height: theme.spacing.lg }} />
        <AppButton
          title="Redeem"
          loading={redeemMutation.isPending}
          onPress={async () => {
            try {
              await redeemMutation.mutateAsync();
              Alert.alert('Success', 'Gift card redeemed.');
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
  header: {
    gap: 6,
    marginBottom: theme.spacing.lg,
  },
});
