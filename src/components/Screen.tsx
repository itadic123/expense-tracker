import { ReactElement, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControlProps, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '../theme';

// Centers content in a phone-width column so the web app looks like the mobile design.
type Props = { children: ReactNode; scroll?: boolean; refreshControl?: ReactElement<RefreshControlProps>; withNav?: boolean };

const ALL_EDGES = ['top', 'right', 'bottom', 'left'] as const;
// The bottom nav already keeps clear of the home indicator.
const NAV_EDGES = ['top', 'right', 'left'] as const;

export function Screen({ children, scroll = true, refreshControl, withNav = false }: Props) {
  const edges = withNav ? NAV_EDGES : ALL_EDGES;
  const content = <View style={styles.column}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {scroll ? (
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" refreshControl={refreshControl}>
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  column: { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center', paddingHorizontal: 20, paddingVertical: 16 },
});
