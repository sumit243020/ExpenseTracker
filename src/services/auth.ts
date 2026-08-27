import type { UserProfile } from '../types';
import { clearSession, getUserProfile, saveUserProfile } from './storage';
import { useAppStore } from '../store/useAppStore';
import { loadExpensesForEmail } from './storage';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(normalizeEmail(email));
}

function profileFromEmail(email: string, name?: string): UserProfile {
  const normalized = normalizeEmail(email);
  const local = normalized.split('@')[0] || 'User';
  const display =
    (name?.trim() || local).replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) =>
      c.toUpperCase(),
    );
  return {
    id: `email:${normalized}`,
    name: display,
    email: normalized,
  };
}

/** Email-only login — creates or restores a local account for that email. */
export async function loginWithEmail(
  email: string,
  name?: string,
): Promise<UserProfile> {
  if (!isValidEmail(email)) {
    throw new Error('Enter a valid email address');
  }

  const user = profileFromEmail(email, name);
  await saveUserProfile(user);

  const expenses = await loadExpensesForEmail(user.email);
  const store = useAppStore.getState();
  store.setExpenses(expenses);
  store.setUser(user);
  return user;
}

export async function restoreSession(): Promise<UserProfile | null> {
  const user = await getUserProfile();
  if (!user?.email || !isValidEmail(user.email)) return null;
  const expenses = await loadExpensesForEmail(user.email);
  const store = useAppStore.getState();
  store.setExpenses(expenses);
  return user;
}

export async function signOut(): Promise<void> {
  await clearSession();
  useAppStore.getState().logout();
}
