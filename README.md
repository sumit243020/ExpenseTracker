# ExpenseTracker

React Native (Expo) daily expense tracker with Google Sign-In, shake-to-add, and Google Sheets storage.

## Quick start

```bash
nvm use 22
npm install
npx expo start
```

Tap **Continue with Demo Account** until you plug in Google OAuth client IDs.

## Google Cloud setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com).
2. Enable **Google Sheets API** and **Google Drive API**.
3. Configure OAuth consent screen (External + test users).
4. Create OAuth client IDs:
   - **Web application** (required for `expo-auth-session`)
   - **Android** (package `com.expensetracker.app` + SHA-1 from EAS)
5. Put the Web client ID in `src/config.ts` (`GOOGLE_CONFIG.webClientId`).

Scopes used: `userinfo.email`, `userinfo.profile`, `spreadsheets`, `drive.file`.

## Build APK (EAS)

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile preview
```

After the first build, copy the Android keystore SHA-1 from EAS credentials into your Google Cloud Android OAuth client, or Google Sign-In will fail on the APK.
