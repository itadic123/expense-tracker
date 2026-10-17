import { Link } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { useAuth } from '../../auth/AuthProvider';
import { validateLogin } from '../../auth/validate';
import { AuthHeader, authStyles, Footer, GoogleSection } from '../../components/AuthChrome';
import { Button } from '../../components/Button';
import { FormMessage } from '../../components/FormMessage';
import { Screen } from '../../components/Screen';
import { TextField } from '../../components/TextField';
import { sr } from '../../i18n/sr';

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState<'email' | 'google' | null>(null);

  async function submit() {
    const invalid = validateLogin(email, password);
    if (invalid) return setError(invalid);
    setError(undefined);
    setBusy('email');
    const result = await signIn(email.trim(), password);
    setBusy(null);
    setError(result.error);
  }

  async function google() {
    setError(undefined);
    setBusy('google');
    const result = await signInWithGoogle();
    setBusy(null);
    setError(result.error);
  }

  const t = sr.auth;
  return (
    <Screen>
      <AuthHeader title={t.loginTitle} subtitle={t.loginSubtitle} />
      <View style={authStyles.form}>
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
          autoComplete="current-password"
          onSubmitEditing={submit}
        />
        <FormMessage error={error} />
        <Button label={t.login} onPress={submit} loading={busy === 'email'} disabled={busy !== null} />
      </View>
      <GoogleSection onPress={google} loading={busy === 'google'} />
      <Footer>
        <Text style={authStyles.footerText}>{t.noAccount}</Text>
        <Link href="/signup" replace>
          <Text style={authStyles.link}>{t.toSignup}</Text>
        </Link>
      </Footer>
    </Screen>
  );
}
