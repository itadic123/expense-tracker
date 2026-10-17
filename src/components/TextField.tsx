import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { sr } from '../i18n/sr';
import { colors, fonts, radius } from '../theme';

type Props = TextInputProps & { label: string };

export function TextField({ label, style, secureTextEntry, ...rest }: Props) {
  const [visible, setVisible] = useState(false);
  const hidden = Boolean(secureTextEntry) && !visible;
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View>
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[styles.input, secureTextEntry && styles.inputWithToggle, style]}
          secureTextEntry={hidden}
          {...rest}
        />
        {secureTextEntry && (
          <Pressable
            onPress={() => setVisible((v) => !v)}
            style={styles.toggle}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={visible ? sr.auth.hidePassword : sr.auth.showPassword}
          >
            <Text style={styles.toggleText}>{visible ? sr.auth.hidePassword : sr.auth.showPassword}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontFamily: fonts.medium, fontSize: 14, color: colors.textMuted, marginLeft: 4 },
  input: {
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 18,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.text,
  },
  inputWithToggle: { paddingRight: 90 },
  toggle: { position: 'absolute', right: 16, top: 0, bottom: 0, justifyContent: 'center' },
  toggleText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.accent },
});
