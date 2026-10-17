import { supabase } from './supabase';

export type Profile = {
  id: string;
  full_name: string | null;
  date_of_birth: string | null;
  monthly_earnings: number | null;
  avatar_url: string | null;
};

export type ProfileChanges = Partial<Omit<Profile, 'id'>>;

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase!
    .from('profiles')
    .select('id, full_name, date_of_birth, monthly_earnings, avatar_url')
    .eq('id', userId)
    .single();
  if (error) throw error;
  // numeric columns come back as strings
  return { ...data, monthly_earnings: data.monthly_earnings === null ? null : Number(data.monthly_earnings) };
}

export async function updateProfile(userId: string, changes: ProfileChanges): Promise<void> {
  const { error } = await supabase!.from('profiles').update(changes).eq('id', userId);
  if (error) throw error;
}

// Uploads a local image (file:// on Android, blob: on web) and stores its public URL on the profile.
export async function uploadAvatar(userId: string, uri: string, mimeType = 'image/jpeg'): Promise<string> {
  const body = await (await fetch(uri)).arrayBuffer();
  const ext = mimeType.split('/')[1] ?? 'jpg';
  const path = `${userId}/avatar.${ext}`;
  const { error } = await supabase!.storage.from('avatars').upload(path, body, { contentType: mimeType, upsert: true });
  if (error) throw error;
  const { data } = supabase!.storage.from('avatars').getPublicUrl(path);
  // The path never changes, so bust caches with a version parameter.
  const url = `${data.publicUrl}?v=${Date.now()}`;
  await updateProfile(userId, { avatar_url: url });
  return url;
}
