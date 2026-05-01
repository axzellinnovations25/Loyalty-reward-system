import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { customersApi } from '../../../api/customers';
import { AppButton } from '../../../components/AppButton';
import { AppInput } from '../../../components/AppInput';
import { AppText } from '../../../components/AppText';
import { Card } from '../../../components/Card';
import { Screen } from '../../../components/Screen';
import type { Customer } from '../../../types';
import type { CustomersStackParamList } from '../../../types/navigation';
import { theme } from '../../../theme';

type Props = NativeStackScreenProps<CustomersStackParamList, 'CustomerDetail'>;

export function CustomerDetailScreen({ route }: Props) {
  const { id } = route.params;
  const qc = useQueryClient();

  const customerQuery = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const res = await customersApi.get(id);
      const payload = (res as any).data ?? res;
      return payload.data ?? payload;
    },
  });

  const customer = customerQuery.data as Customer | undefined;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const updateMutation = useMutation({
    mutationFn: async () => {
      return await customersApi.update(id, { name, phone });
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['customer', id] });
      await qc.invalidateQueries({ queryKey: ['customers'] });
    },
  });

  return (
    <Screen scroll>
      <Card>
        <AppText variant="h3">Profile</AppText>
        <View style={{ height: theme.spacing.sm }} />

        {customerQuery.isLoading ? (
          <AppText dim>Loading…</AppText>
        ) : customer ? (
          <>
            <AppText dim variant="caption">
              Points balance
            </AppText>
            <AppText variant="h2" style={styles.points}>
              {customer.totalPoints.toLocaleString()} pts
            </AppText>
            <View style={{ height: theme.spacing.md }} />

            <AppInput label="Name" value={name} onChangeText={setName} placeholder={customer.name} />
            <View style={{ height: theme.spacing.itemGap }} />
            <AppInput label="Phone" value={phone} onChangeText={setPhone} placeholder={customer.phone} keyboardType="phone-pad" />

            <View style={{ height: theme.spacing.lg }} />
            <AppButton
              title="Save changes"
              loading={updateMutation.isPending}
              onPress={async () => {
                try {
                  await updateMutation.mutateAsync();
                  Alert.alert('Saved', 'Customer updated successfully.');
                } catch (e) {
                  Alert.alert('Error', e instanceof Error ? e.message : 'Update failed');
                }
              }}
            />
          </>
        ) : (
          <AppText dim>Customer not found.</AppText>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  points: {
    color: theme.colors.primary,
  },
});
