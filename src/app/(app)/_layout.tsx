import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';

import { useAuth } from '../../auth/AuthProvider';
import { BottomNav } from '../../components/BottomNav';
import { Sidebar } from '../../components/Sidebar';
import { useIsWide } from '../../lib/layout';
import { ProfileProvider } from '../../profile/ProfileProvider';
import { colors } from '../../theme';

export default function AppLayout() {
  const { session } = useAuth();
  const wide = useIsWide();
  if (!session) return <Redirect href="/" />;
  const stack = (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: colors.background } }} />
    </View>
  );
  return (
    <ProfileProvider>
      <View style={{ flex: 1, flexDirection: wide ? 'row' : 'column', backgroundColor: colors.background }}>
        {wide && <Sidebar />}
        {stack}
        {!wide && <BottomNav />}
      </View>
    </ProfileProvider>
  );
}
