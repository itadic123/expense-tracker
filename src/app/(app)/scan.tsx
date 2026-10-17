import { CameraView, scanFromURLAsync, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '../../components/Button';
import { FormMessage } from '../../components/FormMessage';
import { Screen } from '../../components/Screen';
import { sr } from '../../i18n/sr';
import { isFiscalReceiptUrl, scanReceipt } from '../../lib/receipts';
import { colors, fonts, radius } from '../../theme';

export default function Scan() {
  const [permission, requestPermission] = useCameraPermissions();
  const [link, setLink] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ error?: string; info?: string }>({});
  // The camera fires many times per second; only handle the first code until we're done with it.
  const handling = useRef(false);
  const t = sr.scan;

  async function submit(url: string) {
    if (handling.current) return;
    if (!isFiscalReceiptUrl(url)) return setMessage({ error: t.errors.notFiscal });
    handling.current = true;
    setBusy(true);
    setMessage({});
    const result = await scanReceipt(url);
    setBusy(false);
    handling.current = false;
    if (result.ok) {
      router.replace({ pathname: '/receipt/[id]', params: result.duplicate ? { id: result.id, duplicate: '1' } : { id: result.id } });
      return;
    }
    const errors = {
      not_fiscal_receipt: t.errors.notFiscal,
      read_failed: t.errors.readFailed,
      save_failed: t.errors.saveFailed,
      unknown: t.errors.generic,
    };
    setMessage({ error: errors[result.error] });
  }

  async function fromPhoto() {
    setMessage({});
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (picked.canceled) return;
    try {
      const codes = await scanFromURLAsync(picked.assets[0].uri, ['qr']);
      const code = codes.find((c) => isFiscalReceiptUrl(c.data)) ?? codes[0];
      if (!code) return setMessage({ error: t.errors.noQrInPhoto });
      await submit(code.data);
    } catch {
      setMessage({ error: t.errors.noQrInPhoto });
    }
  }

  return (
    <Screen>
      <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/dashboard'))} hitSlop={10}>
        <Text style={styles.back}>‹ {sr.profile.back}</Text>
      </Pressable>
      <Text style={styles.title}>{t.title}</Text>
      <Text style={styles.hint}>{t.hint}</Text>

      <View style={styles.cameraBox}>
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={busy ? undefined : ({ data }) => submit(data)}
          />
        ) : (
          <View style={styles.permission}>
            <Text style={styles.permissionText}>{t.cameraNeeded}</Text>
            <Button label={t.allowCamera} onPress={requestPermission} />
          </View>
        )}
        {busy && (
          <View style={styles.overlay}>
            <ActivityIndicator color={colors.white} size="large" />
            <Text style={styles.overlayText}>{t.reading}</Text>
          </View>
        )}
      </View>

      <FormMessage {...message} />

      <Button label={t.fromPhoto} variant="secondary" onPress={fromPhoto} disabled={busy} style={styles.photoBtn} />

      <Text style={styles.pasteLabel}>{t.pasteLabel}</Text>
      <TextInput
        value={link}
        onChangeText={setLink}
        placeholder={t.pastePlaceholder}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        style={styles.input}
        onSubmitEditing={() => submit(link)}
      />
      <Button label={t.submit} onPress={() => submit(link)} disabled={busy || !link.trim()} loading={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { fontFamily: fonts.semibold, fontSize: 16, color: colors.accent, marginBottom: 12 },
  title: { fontFamily: fonts.bold, fontSize: 28, color: colors.text },
  hint: { fontFamily: fonts.regular, fontSize: 15, color: colors.textMuted, marginTop: 6, marginBottom: 16 },
  cameraBox: {
    aspectRatio: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.accentDark,
    marginBottom: 16,
  },
  permission: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  permissionText: { fontFamily: fonts.medium, fontSize: 16, color: colors.white, textAlign: 'center' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  overlayText: { fontFamily: fonts.semibold, fontSize: 16, color: colors.white },
  photoBtn: { marginTop: 12 },
  pasteLabel: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted, marginTop: 24, marginBottom: 6, marginLeft: 4 },
  input: {
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 18,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text,
    marginBottom: 12,
  },
});
