# ExpenseTracker (Angular Ionic + Java)

| Folder | Stack | Role |
|--------|--------|------|
| `ionic-app/` | Angular + Ionic + Capacitor | Web UI + Android APK |
| `backend/` | Spring Boot + H2 + JWT | REST API |

## Deploy on Render (public internet)

**Step-by-step:** [DEPLOY_RENDER.md](./DEPLOY_RENDER.md)

On the Render form: set **Language = Docker** (not Node), then:

1. API → Root Directory `backend`
2. UI → Root Directory `ionic-app` + env `API_URL=https://your-api.onrender.com`

## Local run

```bash
# API
cd backend && mvn -DskipTests package && java -jar target/expense-tracker-api-1.0.0.jar

# UI
cd ionic-app && nvm use 22 && npm start
```

## APK

`dist/ExpenseTracker-ionic-2.0.0.apk` (set API URL in Settings after Render deploy)
