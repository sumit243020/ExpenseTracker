# ExpenseTracker

Daily expense tracker for Android (Expo / React Native).

## Features

- **Email login** — enter your email to start (no Google setup)
- **Dashboard** — today / week / month totals + category breakdown
- **Add expense** — floating **+** button or **shake** the phone (in-app)
- **Expenses list** — search, filter, edit, delete
- **Local storage** — each email keeps its own expenses on the device

## Run locally

```bash
nvm use 22
npm install
npx expo start
```

## Build APK

```bash
npm install -g eas-cli
eas login
eas build -p android --profile production
```

Preview / internal APK:

```bash
eas build -p android --profile preview
```
