import type { PropsWithChildren } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, type StyleProp, View, type ViewStyle } from 'react-native';
import { theme } from '../theme';

type ScreenProps = PropsWithChildren<{
  padded?: boolean;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}>;

export function Screen({ children, padded = true, scroll = false, contentStyle }: ScreenProps) {
  const content = <View style={[styles.container, padded && styles.padded, contentStyle]}>{children}</View>;
  return (
    <SafeAreaView style={styles.safeArea}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  padded: {
    padding: theme.spacing.containerPadding,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
