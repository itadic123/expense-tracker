import { Link } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { useAuth } from '../../auth/AuthProvider';
import { validateSignup } from '../../auth/validate';
import { AuthHeader, authStyles, Footer, GoogleSection } from '../../components/AuthChrome';
import { Button } from '../../components/Button';
import { FormMessage } from '../../components/FormMessage';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { sr } from '../../i18n/sr';

export default function Signup() {
  const { signUp, signInWithGoogle } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<{ error?: string; info?: string }>({});
  const [busy, setBusy] = useState<'email' | 'google' | null>(null);

  async function submit() {
    const invalid = validateSignup(fullName, email, password, confirm);
    if (invalid) return setMessage({ error: invalid });
    setMessage({});
    setBusy('email');
    const result = await signUp(fullName.trim(), email.trim(), password);
    setBusy(null);
    setMessage(result);
  }

  async function google() {
    setMessage({});
    setBusy('google');
    const result = await signInWithGoogle();
    setBusy(null);
    setMessage(result);
  }

  const t = sr.auth;
  return (
    <Screen>
      <AuthHeader title={t.signupTitle} subtitle={t.signupSubtitle} />
      <View style={authStyles.form}>
        <TextField label={t.fullName} value={fullName} onChangeText={setFullName} autoComplete="name" />
        <TextField
          label={t.email}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
        />
        <TextField
          label={t.password}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
        />
        <TextField
          label={t.confirmPassword}
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoComplete="new-password"
          onSubmitEditing={submit}
        />
        <FormMessage {...message} />
        <Button label={t.signup} onPress={submit} loading={busy === 'email'} disabled={busy !== null} />
      </View>
      <GoogleSection onPress={google} loading={busy === 'google'} />
      <Footer>
        <Text style={authStyles.footerText}>{t.haveAccount}</Text>
        <Link href="/login" replace>
          <Text style={authStyles.link}>{t.toLogin}</Text>
        </Link>
      </Footer>
    </Screen>
  );
}
