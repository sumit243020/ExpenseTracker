# ExpenseTracker (Angular Ionic + Java)

Production stack:

| Folder | Stack | Role |
|--------|--------|------|
| `ionic-app/` | Angular 22 + Ionic 9 + Capacitor | Android APK (email login, dashboard, shake-to-add) |
| `backend/` | Spring Boot 2.7 + H2 + JWT | REST API for multi-device sync |

The older React Native / Expo app remains in the repo root for reference; **use `ionic-app` + `backend` going forward**.

## Install APK (v2.0.0)

Local build output:

`dist/ExpenseTracker-ionic-2.0.0.apk`

Uninstall any previous ExpenseTracker, then install this APK.

- Opens **email login** (no Google setup)
- Works **offline** on the phone (local storage)
- Optional: set Java API URL in **Settings** to sync with the backend

## Run Java backend

```bash
cd backend
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64   # or Java 11+
mvn -DskipTests package
java -jar target/expense-tracker-api-1.0.0.jar
```

API: `http://localhost:8080`

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","name":"You"}'
```

## Run Ionic (web)

```bash
cd ionic-app
nvm use 22
npm install
npm start
```

## Rebuild Android APK

```bash
cd ionic-app
nvm use 22
npm run build
npx cap sync android
export ANDROID_HOME=$HOME/Android/Sdk
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
cd android && ./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

## API endpoints

- `POST /api/auth/login` `{ email, name? }` → `{ token, user }`
- `GET /api/expenses` (Bearer token)
- `POST /api/expenses` `{ date, description, category, amount }`
- `PUT /api/expenses/{id}`
- `DELETE /api/expenses/{id}`
