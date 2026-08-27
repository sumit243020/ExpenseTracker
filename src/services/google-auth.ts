import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { GOOGLE_CONFIG, GOOGLE_SCOPES } from '../config';
import type { UserProfile } from '../types';
import {
  clearAllAuthData,
  getTokens,
  getUserProfile,
  saveTokens,
  saveUserProfile,
} from './storage';
import { useAppStore } from '../store/useAppStore';

WebBrowser.maybeCompleteAuthSession();

const USERINFO_URL = 'https://www.googleapis.com/oauth2/v3/userinfo';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

export function isGoogleConfigured(): boolean {
  return (
    !!GOOGLE_CONFIG.webClientId &&
    !GOOGLE_CONFIG.webClientId.startsWith('YOUR_') &&
    GOOGLE_CONFIG.webClientId.includes('.apps.googleusercontent.com')
  );
}

/**
 * Safe IDs so expo-auth-session never receives the YOUR_* placeholders
 * (those can crash native auth request construction in release builds).
 */
function resolvedGoogleIds() {
  if (isGoogleConfigured()) {
    return {
      webClientId: GOOGLE_CONFIG.webClientId,
      androidClientId: GOOGLE_CONFIG.androidClientId.startsWith('YOUR_')
        ? GOOGLE_CONFIG.webClientId
        : GOOGLE_CONFIG.androidClientId,
      iosClientId: GOOGLE_CONFIG.iosClientId.startsWith('YOUR_')
        ? GOOGLE_CONFIG.webClientId
        : GOOGLE_CONFIG.iosClientId,
    };
  }
  // Structurally valid dummy — Demo login is used until real IDs are set.
  const dummy =
    '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com';
  return {
    webClientId: dummy,
    androidClientId: dummy,
    iosClientId: dummy,
  };
}

export function useGoogleAuthRequest() {
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'expensetracker',
  });
  const ids = resolvedGoogleIds();

  return Google.useAuthRequest({
    clientId: ids.webClientId,
    androidClientId: ids.androidClientId,
    iosClientId: ids.iosClientId,
    webClientId: ids.webClientId,
    scopes: [...GOOGLE_SCOPES],
    redirectUri,
    extraParams: isGoogleConfigured()
      ? {
          access_type: 'offline',
          prompt: 'consent',
        }
      : undefined,
  });
}

async function fetchUserProfile(accessToken: string): Promise<UserProfile> {
  const res = await fetch(USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to load Google profile (${res.status})`);
  }
  const data = (await res.json()) as {
    sub: string;
    name?: string;
    email: string;
    picture?: string;
  };
  return {
    id: data.sub,
    name: data.name ?? data.email.split('@')[0],
    email: data.email,
    photoUrl: data.picture,
  };
}

/**
 * Applies a successful auth response: stores tokens + profile, updates zustand.
 */
export async function handleGoogleAuthResponse(
  response: AuthSession.AuthSessionResult,
): Promise<boolean> {
  if (response.type !== 'success') return false;

  const authentication = response.authentication;
  const accessToken =
    authentication?.accessToken ?? response.params.access_token;
  const refreshToken =
    authentication?.refreshToken ?? response.params.refresh_token;
  const expiresIn = authentication?.expiresIn;

  if (!accessToken) {
    throw new Error(
      'Google Sign-In did not return an access token. Check your OAuth Client ID and scopes.',
    );
  }

  const expiresAt = expiresIn
    ? Date.now() + expiresIn * 1000
    : Date.now() + 3600 * 1000;

  const user = await fetchUserProfile(accessToken);
  await saveTokens({ accessToken, refreshToken, expiresAt });
  await saveUserProfile(user);

  const store = useAppStore.getState();
  store.setAccessToken(accessToken);
  store.setUser(user);

  return true;
}

/** Refresh access token using stored refresh token. */
export async function refreshAccessToken(): Promise<string | null> {
  const tokens = await getTokens();
  if (!tokens?.refreshToken) return tokens?.accessToken ?? null;

  const body = new URLSearchParams({
    client_id: GOOGLE_CONFIG.webClientId,
    grant_type: 'refresh_token',
    refresh_token: tokens.refreshToken,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    console.warn('Token refresh failed', await res.text());
    return null;
  }

  const data = (await res.json()) as {
    access_token: string;
    expires_in?: number;
    refresh_token?: string;
  };

  const expiresAt = data.expires_in
    ? Date.now() + data.expires_in * 1000
    : Date.now() + 3600 * 1000;

  await saveTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? tokens.refreshToken,
    expiresAt,
  });
  useAppStore.getState().setAccessToken(data.access_token);
  return data.access_token;
}

/** Returns a valid access token, refreshing if near expiry. */
export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await getTokens();
  if (!tokens?.accessToken) return null;

  const skewMs = 60_000;
  if (tokens.expiresAt && tokens.expiresAt - skewMs < Date.now()) {
    return refreshAccessToken();
  }
  return tokens.accessToken;
}

/** Silent restore on cold start. */
export async function restoreSession(): Promise<{
  accessToken: string;
  user: UserProfile;
} | null> {
  const [profile, tokens] = await Promise.all([getUserProfile(), getTokens()]);
  if (!profile || !tokens?.accessToken) return null;

  let accessToken = tokens.accessToken;
  const skewMs = 60_000;
  if (tokens.expiresAt && tokens.expiresAt - skewMs < Date.now()) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      await clearAllAuthData();
      return null;
    }
    accessToken = refreshed;
  }

  return { accessToken, user: profile };
}

export async function signOut(): Promise<void> {
  await clearAllAuthData();
  useAppStore.getState().logout();
}
