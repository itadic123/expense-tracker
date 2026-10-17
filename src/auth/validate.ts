import { sr } from '../i18n/sr';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(email: string, password: string): string | undefined {
  if (!email.trim() || !password) return sr.auth.errors.required;
  if (!EMAIL.test(email.trim())) return sr.auth.errors.invalidEmail;
}

export function validateSignup(fullName: string, email: string, password: string, confirm: string): string | undefined {
  if (!fullName.trim() || !email.trim() || !password || !confirm) return sr.auth.errors.required;
  if (!EMAIL.test(email.trim())) return sr.auth.errors.invalidEmail;
  if (password.length < 8) return sr.auth.errors.shortPassword;
  if (password !== confirm) return sr.auth.errors.passwordMismatch;
}
