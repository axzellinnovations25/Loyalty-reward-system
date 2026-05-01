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
import { Ionicons } from '@expo/vector-icons';

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
      {customerQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="hourglass-outline" size={48} color={theme.colors.textLight} />
          <AppText dim style={{ marginTop: 12 }}>Loading profile…</AppText>
        </View>
      ) : customer ? (
        <>
          {/* Profile Header Card */}
          <Card style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.profileAvatar}>
                <AppText style={styles.profileAvatarText}>
                  {customer.name?.[0]?.toUpperCase() ?? '?'}
                </AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="h2" style={{ letterSpacing: -0.3 }}>{customer.name}</AppText>
                <AppText dim variant="caption">{customer.phone}</AppText>
              </View>
            </View>
          </Card>

          {/* Points Card */}
          <Card variant="primary" style={styles.pointsCard}>
            <View style={styles.pointsRow}>
              <View style={styles.pointsIcon}>
                <Ionicons name="diamond" size={28} color={theme.colors.white} />
              </View>
              <View>
                <AppText variant="label" color="rgba(255,255,255,0.6)">Points Balance</AppText>
                <AppText variant="h2" color={theme.colors.white}>
                  {customer.totalPoints?.toLocaleString()} pts
                </AppText>
              </View>
            </View>
          </Card>

          {/* Edit Form */}
          <View style={styles.sectionHeader}>
            <Ionicons name="create-outline" size={20} color={theme.colors.text} />
            <AppText variant="h3">Edit Profile</AppText>
          </View>
          <Card style={styles.formCard}>
            <AppInput label="Name" value={name} onChangeText={setName} placeholder={customer.name} icon="person-outline" />
            <View style={{ height: theme.spacing.md }} />
            <AppInput label="Phone" value={phone} onChangeText={setPhone} placeholder={customer.phone} keyboardType="phone-pad" icon="call-outline" />
            <View style={{ height: theme.spacing.xl }} />
            <AppButton
              title="Save Changes"
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
          </Card>
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.colors.textLight} />
          <AppText dim style={{ marginTop: 12 }}>Customer not found</AppText>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xxl,
  },
  profileCard: {
    marginBottom: theme.spacing.md,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontWeight: '800',
    fontSize: 26,
    color: theme.colors.primary,
  },
  pointsCard: {
    marginBottom: theme.spacing.lg,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  pointsIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  formCard: {
    marginBottom: theme.spacing.lg,
  },
});
