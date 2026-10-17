import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { sr } from '../i18n/sr';
import { colors, fonts, radius } from '../theme';

type Parsed<T> = { value: T } | { error: string };

type Props<T> = {
  label: string;
  display: string | null;
  initialText: string;
  parse: (text: string) => Parsed<T>;
  onSave: (value: T) => Promise<void>;
  inputProps?: TextInputProps;
};

// One profile field that can be edited and saved on its own.
export function EditableField<T>({ label, display, initialText, parse, onSave, inputProps }: Props<T>) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(initialText);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const t = sr.profile;

  function start() {
    setText(initialText);
    setError(undefined);
    setEditing(true);
  }

  async function save() {
    const parsed = parse(text);
    if ('error' in parsed) return setError(parsed.error);
    setSaving(true);
    try {
      await onSave(parsed.value);
      setEditing(false);
    } catch {
      setError(t.errors.save);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <Text style={styles.label}>{label}</Text>
        {!editing && (
          <Pressable onPress={start} hitSlop={10} accessibilityRole="button">
            <Text style={styles.action}>{t.edit}</Text>
          </Pressable>
        )}
      </View>
      {editing ? (
        <>
          <TextInput
            value={text}
            onChangeText={setText}
            autoFocus
            onSubmitEditing={save}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            {...inputProps}
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <View style={styles.buttons}>
            <Pressable onPress={() => setEditing(false)} style={[styles.btn, styles.cancel]} disabled={saving}>
              <Text style={styles.cancelText}>{t.cancel}</Text>
            </Pressable>
            <Pressable onPress={save} style={[styles.btn, styles.save, saving && { opacity: 0.6 }]} disabled={saving}>
              <Text style={styles.saveText}>{t.save}</Text>
            </Pressable>
          </View>
        </>
      ) : (
        <Text style={[styles.value, !display && styles.empty]}>{display ?? t.notSet}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: 16, gap: 8 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted },
  action: { fontFamily: fonts.semibold, fontSize: 14, color: colors.accent },
  value: { fontFamily: fonts.semibold, fontSize: 17, color: colors.text },
  empty: { fontFamily: fonts.regular, color: colors.textMuted },
  input: {
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
  },
  error: { fontFamily: fonts.medium, fontSize: 13, color: colors.danger },
  buttons: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  btn: { height: 40, paddingHorizontal: 18, borderRadius: radius.pill, justifyContent: 'center' },
  cancel: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  save: { backgroundColor: colors.black },
  cancelText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.text },
  saveText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.white },
});
