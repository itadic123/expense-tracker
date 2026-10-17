import { Redirect, Stack } from 'expo-router';

import { useAuth } from '../../auth/AuthProvider';
import { ProfileProvider } from '../../profile/ProfileProvider';
import { colors } from '../../theme';

export default function AppLayout() {
  const { session } = useAuth();
  if (!session) return <Redirect href="/" />;
  return (
    <ProfileProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
    </ProfileProvider>
  );
}
