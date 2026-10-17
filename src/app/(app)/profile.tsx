import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '../../auth/AuthProvider';
import { Avatar } from '../../components/Avatar';
import { Button } from '../../components/Button';
import { EditableField } from '../../components/EditableField';
import { FormMessage } from '../../components/FormMessage';
import { Screen } from '../../components/Screen';
import { sr } from '../../i18n/sr';
import { formatIsoDate, formatRSD, parseAmount, parseSerbianDate } from '../../lib/format';
import { useProfile } from '../../profile/ProfileProvider';
import { colors, fonts, radius } from '../../theme';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.7,
};

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const { profile, error: loadError, save, setAvatar } = useProfile();
  const [photoError, setPhotoError] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const t = sr.profile;

  async function pick(source: 'camera' | 'gallery') {
    setPhotoError(undefined);
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return setPhotoError(source === 'camera' ? t.errors.cameraDenied : t.errors.galleryDenied);
    }
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
        : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (result.canceled) return;

    const asset = result.assets[0];
    setUploading(true);
    try {
      await setAvatar(asset.uri, asset.mimeType ?? 'image/jpeg');
    } catch {
      setPhotoError(t.errors.upload);
    } finally {
      setUploading(false);
    }
  }

  const name = profile?.full_name ?? '';
  const earnings = profile?.monthly_earnings ?? null;
  const dob = profile?.date_of_birth ?? null;

  return (
    <Screen withNav>
      <Text style={styles.title}>{t.title}</Text>

      <View style={styles.photo}>
        <View>
          <Avatar url={profile?.avatar_url} name={name || session?.user.email || ''} size={112} />
          {uploading && (
            <View style={styles.uploading}>
              <ActivityIndicator color={colors.white} />
            </View>
          )}
        </View>
        <Text style={styles.photoName}>{name || session?.user.email}</Text>
        <View style={styles.photoButtons}>
          <Button label={t.takePhoto} variant="secondary" onPress={() => pick('camera')} disabled={uploading} style={styles.photoBtn} />
          <Button label={t.choosePhoto} variant="secondary" onPress={() => pick('gallery')} disabled={uploading} style={styles.photoBtn} />
        </View>
        <FormMessage error={photoError} />
      </View>

      <FormMessage error={loadError ? sr.dashboard.loadError : undefined} />

      {profile && (
        <View style={styles.fields}>
          <EditableField
            label={t.fullName}
            display={profile.full_name}
            initialText={profile.full_name ?? ''}
            parse={(s) => (s.trim() ? { value: s.trim() } : { error: t.errors.name })}
            onSave={(full_name) => save({ full_name })}
            inputProps={{ autoComplete: 'name' }}
          />
          <EditableField
            label={t.dateOfBirth}
            display={dob ? formatIsoDate(dob) : null}
            initialText={dob ? formatIsoDate(dob).slice(0, -1) : ''}
            parse={(s) => {
              const iso = parseSerbianDate(s);
              return iso ? { value: iso } : { error: t.errors.date };
            }}
            onSave={(date_of_birth) => save({ date_of_birth })}
            inputProps={{ placeholder: t.datePlaceholder, keyboardType: 'numbers-and-punctuation' }}
          />
          <EditableField
            label={t.monthlyEarnings}
            display={earnings != null ? formatRSD(earnings) : null}
            initialText={earnings != null ? String(earnings) : ''}
            parse={(s) => {
              const n = parseAmount(s);
              return n !== undefined ? { value: n } : { error: t.errors.amount };
            }}
            onSave={(monthly_earnings) => save({ monthly_earnings })}
            inputProps={{ placeholder: t.amountPlaceholder, keyboardType: 'decimal-pad' }}
          />
          <View style={styles.readonly}>
            <Text style={styles.readonlyLabel}>{t.email}</Text>
            <Text style={styles.readonlyValue}>{session?.user.email}</Text>
          </View>
        </View>
      )}

      <Button label={t.signOut} variant="secondary" onPress={signOut} style={styles.signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.bold, fontSize: 28, color: colors.text, marginBottom: 20 },
  photo: { alignItems: 'center', gap: 12, marginBottom: 24 },
  uploading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 56,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoName: { fontFamily: fonts.bold, fontSize: 20, color: colors.text },
  photoButtons: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  photoBtn: { flex: 1, height: 48 },
  fields: { gap: 12 },
  readonly: { padding: 16, gap: 6, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  readonlyLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted },
  readonlyValue: { fontFamily: fonts.medium, fontSize: 16, color: colors.textMuted },
  signOut: { marginTop: 28 },
});
