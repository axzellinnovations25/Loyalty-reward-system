import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { reportsApi } from '../../../api/reports';
import { AppText } from '../../../components/AppText';
import { Card } from '../../../components/Card';
import { Screen } from '../../../components/Screen';
import { GradientView } from '../../../components/GradientView';
import type { DashboardSummary } from '../../../types';
import { theme } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../hooks/useAuth';

export function DashboardScreen() {
  const { clearAuth } = useAuth();
  const summaryQuery = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: async () => {
      const res = await reportsApi.getSummary();
      return (res as any).data ?? res;
    },
  });

  const summary = summaryQuery.data as DashboardSummary | undefined;

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.container} bounces={false}>
        <GradientView style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <AppText variant="h2" color={theme.colors.white}>Store Insights</AppText>
              <AppText color="rgba(255, 255, 255, 0.6)">Live performance metrics</AppText>
            </View>
            <TouchableOpacity style={styles.profileButton} onPress={() => clearAuth()}>
              <Ionicons name="log-out-outline" size={22} color={theme.colors.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.mainKpiContainer}>
            <AppText variant="label" color="rgba(255, 255, 255, 0.5)">Total Revenue</AppText>
            <AppText style={styles.mainKpiValue}>
              {summary?.totalRevenue != null ? `Rs. ${Number(summary.totalRevenue).toLocaleString()}` : 'Rs. 0'}
            </AppText>
            <View style={styles.trendContainer}>
              <Ionicons name="trending-up" size={16} color={theme.colors.success} />
              <AppText variant="caption" color={theme.colors.success} style={{ marginLeft: 4 }}>+12.5% from yesterday</AppText>
            </View>
          </View>
        </GradientView>

        <View style={styles.content}>
          <View style={styles.statsGrid}>
            <StatCard
              label="Active Customers"
              value={summary?.totalCustomers?.toString() ?? '0'}
              icon="people"
              color={theme.colors.primary}
            />
            <StatCard
              label="New Purchases"
              value={summary?.totalPurchases?.toString() ?? '0'}
              icon="cart"
              color={theme.colors.warning}
            />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <AppText variant="h3">Quick Actions</AppText>
              <TouchableOpacity>
                <AppText variant="caption" color={theme.colors.primary}>View All</AppText>
              </TouchableOpacity>
            </View>
            
            <View style={styles.actionRow}>
              <ActionCard icon="scan-outline" label="Scan QR" color={theme.colors.primary} />
              <ActionCard icon="person-add-outline" label="Add Client" color={theme.colors.success} />
              <ActionCard icon="gift-outline" label="Issue Gift" color={theme.colors.info} />
            </View>
          </View>

          <View style={styles.section}>
            <AppText variant="h3" style={styles.sectionTitle}>Performance Analytics</AppText>
            <Card style={styles.analyticsCard}>
              <View style={styles.analyticsRow}>
                <View style={styles.analyticsItem}>
                  <AppText variant="label">Points Given</AppText>
                  <AppText variant="h2">{summary?.totalPointsOutstanding ?? '0'}</AppText>
                </View>
                <View style={styles.divider} />
                <View style={styles.analyticsItem}>
                  <AppText variant="label">Redeemed</AppText>
                  <AppText variant="h2">{summary?.totalRedemptions ?? '0'}</AppText>
                </View>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: '65%' }]} />
              </View>
              <AppText variant="caption" dim>You&apos;ve reached 65% of your monthly goal</AppText>
            </Card>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <Card style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '10' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View>
        <AppText variant="h3">{value}</AppText>
        <AppText variant="caption" dim>{label}</AppText>
      </View>
    </Card>
  );
}

function ActionCard({ icon, label, color }: { icon: any; label: string; color: string }) {
  return (
    <TouchableOpacity style={styles.actionCard}>
      <View style={[styles.actionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color={theme.colors.white} />
      </View>
      <AppText variant="caption" style={{ marginTop: 8, fontWeight: '600' }}>{label}</AppText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 50,
    paddingHorizontal: theme.spacing.lg,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.danger,
    borderWidth: 2,
    borderColor: theme.colors.primaryDark,
  },
  mainKpiContainer: {
    alignItems: 'center',
  },
  mainKpiValue: {
    fontSize: 42,
    fontWeight: '800',
    color: theme.colors.white,
    marginVertical: 4,
    letterSpacing: -1,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    marginTop: -30,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    ...theme.spacing.shadows.md,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginTop: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: '30%',
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: 20,
    alignItems: 'center',
    ...theme.spacing.shadows.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyticsCard: {
    padding: theme.spacing.lg,
    ...theme.spacing.shadows.md,
  },
  analyticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  analyticsItem: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
});
