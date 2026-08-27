/**
 * App-level Google OAuth Client IDs (SAME for every user).
 * These only identify the app to Google — they do NOT choose whose sheet is used.
 * After login, each user gets their own access token and the app creates
 * ExpenseTracker_<theirEmail> inside THAT user's Google Drive.
 */
export const GOOGLE_CONFIG = {
  /** Web application OAuth client ID (used by expo-auth-session) */
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  /** Android OAuth client ID (needed for release APK Google Sign-In) */
  androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  /** iOS OAuth client ID (optional) */
  iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
};

export const APP_NAME = 'ExpenseTracker';
export const APP_TAGLINE = 'Track every rupee, effortlessly';

export const SHEET_TAB_NAME = 'Expenses';
export const SHEET_HEADERS = [
  'RowID',
  'Date',
  'Description',
  'Category',
  'Amount',
  'CreatedAt',
] as const;

export const GOOGLE_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
] as const;

export const STORAGE_KEYS = {
  accessToken: 'et_access_token',
  refreshToken: 'et_refresh_token',
  tokenExpiry: 'et_token_expiry',
  userProfile: 'et_user_profile',
  spreadsheetId: 'et_spreadsheet_id',
  spreadsheetEmail: 'et_spreadsheet_email',
  pendingQueue: 'et_pending_queue',
  currency: 'et_currency',
  monthlyBudget: 'et_monthly_budget',
  budgetAlertsEnabled: 'et_budget_alerts',
  shakeSensitivity: 'et_shake_sensitivity',
} as const;
