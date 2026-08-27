# Deploy ExpenseTracker on Render (Docker) — both UI + API

Repo: https://github.com/sumit243020/ExpenseTracker

You will create **2 Web Services** (or use Blueprint once):

| Service | Code folder | Purpose |
|---------|-------------|---------|
| `expense-tracker-api` | `backend/` | Java APIs on the internet |
| `expense-tracker-web` | `ionic-app/` | Angular Ionic website |

---

## Method A — Blueprint (fastest, both at once)

1. Open https://dashboard.render.com/
2. **New +** → **Blueprint**
3. Connect GitHub repo **ExpenseTracker**, branch **main**
4. Render reads `render.yaml`
5. Click **Apply**
6. Wait until both services are **Live** (10–20 min first time)

Then jump to **Get URLs & test** below.

---

## Method B — Manual (matches the screen you are on)

You are on **New Web Service**. Do the **API first**, then the **UI**.

### Part 1 — Deploy Java Backend (API)

On the form you see now:

1. **Source:** `sumit243020 / ExpenseTracker` ✅ (keep)
2. **Name:** change to `expense-tracker-api`
3. **Language:** open the dropdown and choose **Docker**  
   (do **not** leave **Node** selected)
4. **Branch:** `main`
5. **Region:** pick any (e.g. Oregon). Use the **same region** for UI later.
6. **Root Directory:** type exactly:
   ```
   backend
   ```
7. Leave **Dockerfile Path** as `Dockerfile` (Render will use `backend/Dockerfile`)
8. **Instance type:** Free
9. Open **Advanced** → **Health Check Path:**
   ```
   /api/health
   ```
10. **Environment Variables** → Add:
    - Key: `APP_JWT_SECRET`
    - Value: any long random string (example: `MyExpenseSecret_ChangeThis_2026`)
11. Click **Create Web Service**
12. Wait until status is **Live**
13. Copy the URL, example:
    ```
    https://expense-tracker-api-xxxx.onrender.com
    ```

Test in browser:
```
https://expense-tracker-api-xxxx.onrender.com/api/health
```
You should see: `{"status":"ok",...}`

---

### Part 2 — Deploy Angular Ionic UI

1. **New +** → **Web Service** again
2. Same repo **ExpenseTracker**
3. Fill:
   - **Name:** `expense-tracker-web`
   - **Language:** **Docker** (not Node)
   - **Branch:** `main`
   - **Region:** same as API
   - **Root Directory:**
     ```
     ionic-app
     ```
   - **Dockerfile Path:** `Dockerfile`
   - **Instance type:** Free
4. **Environment Variables** → Add:
   - Key: `API_URL`
   - Value: your API URL from Part 1, full https, example:
     ```
     https://expense-tracker-api-xxxx.onrender.com
     ```
5. Click **Create Web Service**
6. Wait until **Live**
7. Open the UI URL:
   ```
   https://expense-tracker-web-xxxx.onrender.com
   ```
8. Login with any email → Dashboard

---

## Get URLs & test

```bash
# Health
curl https://YOUR-API.onrender.com/api/health

# Login
curl -X POST https://YOUR-API.onrender.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","name":"You"}'
```

### Android APK
In app **Settings**, set API URL to:
```
https://YOUR-API.onrender.com
```

---

## Important free-tier notes

- First request after idle can take **30–60 seconds** (cold start)
- H2 DB data may reset when the free service redeploys
- If UI login is offline: check `API_URL` on `expense-tracker-web` and redeploy

---

## If build fails

- Confirm **Language = Docker**
- Confirm **Root Directory** is `backend` or `ionic-app` (not empty)
- Confirm latest `main` is pushed with `Dockerfile` present in that folder
