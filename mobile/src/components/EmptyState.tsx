import { StyleSheet, View } from 'react-native';
import { theme } from '../theme';
import { AppText } from './AppText';

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <AppText variant="h3">◎</AppText>
      </View>
      <AppText variant="h3" style={styles.title}>
        {title}
      </AppText>
      {message ? (
        <AppText dim style={styles.message}>
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  icon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    maxWidth: 320,
  },
});
