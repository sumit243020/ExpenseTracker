/** OAuth / Google Cloud placeholders — replace with your real client IDs. */
export const GOOGLE_CONFIG = {
  /** Web application OAuth client ID (used by expo-auth-session) */
  webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  /** Android OAuth client ID (optional; needed for standalone APK) */
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
  pendingQueue: 'et_pending_queue',
  currency: 'et_currency',
  monthlyBudget: 'et_monthly_budget',
  budgetAlertsEnabled: 'et_budget_alerts',
  shakeSensitivity: 'et_shake_sensitivity',
} as const;
