import { ReactElement, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, RefreshControlProps, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useIsWide } from '../lib/layout';
import { colors } from '../theme';

// Centers content in a phone-width column. Signed-in pages (withNav) get more room on desktop;
// `wide` pages (dashboard, statistics, receipts) use the full desktop width.
type Props = {
  children: ReactNode;
  scroll?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
  withNav?: boolean;
  wide?: boolean;
};

const ALL_EDGES = ['top', 'right', 'bottom', 'left'] as const;
// The bottom nav already keeps clear of the home indicator.
const NAV_EDGES = ['top', 'right', 'left'] as const;

export function Screen({ children, scroll = true, refreshControl, withNav = false, wide = false }: Props) {
  const isWide = useIsWide();
  const edges = withNav ? NAV_EDGES : ALL_EDGES;
  const desktop = isWide && withNav;
  const content = <View style={[styles.column, desktop && (wide ? styles.desktopWide : styles.desktop)]}>{children}</View>;
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
  desktop: { maxWidth: 760, paddingHorizontal: 40, paddingVertical: 36 },
  desktopWide: { maxWidth: 1200, paddingHorizontal: 40, paddingVertical: 36 },
});
