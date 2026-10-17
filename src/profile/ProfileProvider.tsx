import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { useAuth } from '../auth/AuthProvider';
import { fetchProfile, Profile, ProfileChanges, updateProfile, uploadAvatar } from '../lib/profile';

type ProfileContextValue = {
  profile: Profile | null;
  error: boolean;
  reload: () => Promise<void>;
  save: (changes: ProfileChanges) => Promise<void>;
  setAvatar: (uri: string, mimeType?: string) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

// Shared by the dashboard and profile screens so an edit on one shows up on the other.
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const userId = session!.user.id;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    try {
      setProfile(await fetchProfile(userId));
      setError(false);
    } catch {
      setError(true);
    }
  }, [userId]);

  useEffect(() => {
    let active = true;
    fetchProfile(userId)
      .then((p) => active && (setProfile(p), setError(false)))
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [userId]);

  const value: ProfileContextValue = {
    profile,
    error,
    reload,
    async save(changes) {
      await updateProfile(userId, changes);
      setProfile((p) => (p ? { ...p, ...changes } : p));
    },
    async setAvatar(uri, mimeType) {
      const url = await uploadAvatar(userId, uri, mimeType);
      setProfile((p) => (p ? { ...p, avatar_url: url } : p));
    },
  };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
}
