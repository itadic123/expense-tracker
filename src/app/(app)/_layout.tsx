import { Redirect, Stack } from 'expo-router';
import { View } from 'react-native';

import { useAuth } from '../../auth/AuthProvider';
import { BottomNav } from '../../components/BottomNav';
import { ProfileProvider } from '../../profile/ProfileProvider';
import { colors } from '../../theme';

export default function AppLayout() {
  const { session } = useAuth();
  if (!session) return <Redirect href="/" />;
  return (
    <ProfileProvider>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack screenOptions={{ headerShown: false, animation: 'none', contentStyle: { backgroundColor: colors.background } }} />
        <BottomNav />
      </View>
    </ProfileProvider>
  );
}
