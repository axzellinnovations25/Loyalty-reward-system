import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { messagesApi } from '../../../api/messages';
import { AppText } from '../../../components/AppText';
import { Card } from '../../../components/Card';
import { Screen } from '../../../components/Screen';
import type { MessageLog } from '../../../types';
import { theme } from '../../../theme';

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

  return (
    <Screen scroll>
      <View style={styles.header}>
        <AppText variant="h2">Messages</AppText>
        <AppText dim>Broadcast log and delivery status.</AppText>
      </View>

      <Card style={styles.list}>
        <FlatList
          data={items}
          keyExtractor={(m) => m.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <AppText style={{ fontWeight: '700' }}>{item.title ?? 'Message'}</AppText>
                <AppText dim variant="caption">
                  {item.channel.toUpperCase()} • {item.status.toUpperCase()}
                </AppText>
              </View>
              <AppText dim variant="caption">
                {new Date(item.createdAt).toLocaleDateString()}
              </AppText>
            </View>
          )}
          ListEmptyComponent={query.isLoading ? <AppText dim>Loading…</AppText> : <AppText dim>No messages yet.</AppText>}
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

