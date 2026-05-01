import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { messagesApi } from '../../../api/messages';
import { AppText } from '../../../components/AppText';
import { Screen } from '../../../components/Screen';
import type { MessageLog } from '../../../types';
import { theme } from '../../../theme';
import { Ionicons } from '@expo/vector-icons';

export function MessagesScreen() {
  const query = useQuery({
    queryKey: ['messages'],
    queryFn: async () => {
      const res = await messagesApi.list({ limit: 50 });
      const payload = (res as any).data ?? res;
      return payload.items ? payload : payload.data ?? payload;
    },
  });

  const items = useMemo<MessageLog[]>(() => query.data?.items ?? query.data ?? [], [query.data]);

  const channelIcon = (channel: string): keyof typeof Ionicons.glyphMap => {
    if (channel === 'whatsapp') return 'logo-whatsapp';
    return 'chatbubble-outline';
  };

  const statusColor = (status: string) => {
    return status === 'sent' ? theme.colors.success : theme.colors.danger;
  };

  return (
    <Screen padded={false} scroll={false}>
      <View style={styles.content}>
        <FlatList
          data={items}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={styles.channelIcon}>
                <Ionicons name={channelIcon(item.channel)} size={22} color={theme.colors.info} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText style={styles.title}>{item.title ?? 'Message'}</AppText>
                <AppText dim variant="caption">
                  {new Date(item.createdAt).toLocaleDateString()}
                </AppText>
              </View>
              <View style={[styles.statusDot, { backgroundColor: statusColor(item.status) }]} />
              <AppText variant="caption" style={{ fontWeight: '600', color: statusColor(item.status) }}>
                {item.status.toUpperCase()}
              </AppText>
            </View>
          )}
          ListEmptyComponent={
            query.isLoading ? (
              <View style={styles.empty}>
                <Ionicons name="hourglass-outline" size={48} color={theme.colors.textLight} />
                <AppText dim style={{ marginTop: 12 }}>Loading messages…</AppText>
              </View>
            ) : (
              <View style={styles.empty}>
                <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.textLight} />
                <AppText dim style={{ marginTop: 12 }}>No messages yet</AppText>
                <AppText dim variant="caption">Messages sent to customers will show here</AppText>
              </View>
            )
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    maxWidth: theme.spacing.layout.maxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  listContent: {
    paddingBottom: 100,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.borderRadius.lg,
    marginBottom: 8,
    ...theme.spacing.shadows.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.02)',
  },
  channelIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.info + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    fontSize: 15,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  empty: {
    padding: theme.spacing.xxl,
    alignItems: 'center',
    gap: 4,
  },
});
