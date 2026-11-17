# HB+ Workspace — Domain-Restricted Cross-Platform App

A cross-platform **React Native + React Native for Web** application built with **Expo (SDK 58)**, **Expo Router**, **TypeScript**, **Firebase Authentication (Google OAuth 2.0 + Email/Password)**, and **Cloud Firestore**. Access is strictly restricted to verified company accounts (`@hbplus.fit` by default, configurable via environment variable).

---

## Live Demo & Evaluation Credentials

- **Web App (Netlify — Desktop & Mobile Browser):** `https://<your-netlify-site>.netlify.app` *(update after deploying to Netlify)*
- **Android App (Direct Installable APK via EAS Cloud):** `https://expo.dev/accounts/chhayakanta/projects/hbplus-workspace/builds` *(direct APK link will be updated once the EAS preview build completes)*

### Fixed Admin Credentials (For Quick Evaluation)

| Role | Email | Password | Capabilities |
| --- | --- | --- | --- |
| **Admin** | `admin@hbplus.fit` | `Admin@123` | Full Dashboard, **Team & Account Provisioning** (create new `@hbplus.fit` user accounts), promote/demote other users, **Assign Tasks** to all users or a particular user, delete tasks |

### Quick Evaluator Walkthrough

1. **Test Domain Restriction (Blocked Domain):**
   - Attempt to sign in with any `@gmail.com` email (via Google Sign-In or manual Email/Password).
   - The app immediately revokes any session and shows the exact error banner:
     > `Access restricted. Please login using your official domain email.`
2. **Test Protected Routes:**
   - While logged out, navigate directly to `/dashboard` → automatically redirected to `/login` with zero flicker.
3. **Test Admin Features:**
   - Log in with `admin@hbplus.fit` / `Admin@123`.
   - Open **Team** → create a new `@hbplus.fit` user account (e.g., `member@hbplus.fit` with role `User`).
   - Open **Tasks** → assign a task to that particular user (or to **All Users**).
4. **Test Normal User Role (RBAC):**
   - Log out and sign in with the newly created `member@hbplus.fit` credentials.
   - Verify the **Team** tab and **Assign Task** controls are hidden, only assigned tasks are visible, status can be updated (`Pending` → `In Progress` → `Completed`), and self-role-change is blocked by Firestore rules.

---

## Tech Stack

- **Framework:** Expo (SDK 58) + React Native + React Native for Web (`react-native-web`)
- **Language:** TypeScript (strict mode)
- **Routing:** Expo Router (`app/_layout.tsx`, `app/login.tsx`, `app/reset-password.tsx`, `app/(protected)/dashboard.tsx`)
- **Authentication:** Firebase Authentication
  - **Web Google OAuth:** `signInWithPopup` + `GoogleAuthProvider` (`browserLocalPersistence` + `browserPopupRedirectResolver`)
  - **Native Google OAuth (Android / iOS):** `expo-auth-session` Google provider (`useIdTokenAuthRequest`) → `signInWithCredential` (`getReactNativePersistence` backed by chunked `expo-secure-store` Keychain/Keystore)
  - **Manual Email / Password:** `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `sendPasswordResetEmail`, and in-app `updatePassword` (all strictly domain-restricted)
- **Database & RBAC:** Cloud Firestore (`users/{uid}`, `tasks/{taskId}`) with server-enforced `firestore.rules`
- **State Management:** React Context (`AuthProvider`) + `useAuth()` hook

---

## Project Structure

```text
├── app/
│   ├── _layout.tsx                 # Root layout, AuthProvider, auth guard & dashboard skeleton splash
│   ├── index.tsx                   # Entry redirect route
│   ├── login.tsx                   # Responsive split frosted-glass login & registration screen
│   ├── reset-password.tsx          # Branded password reset screen
│   └── (protected)/
│       ├── _layout.tsx             # Protected route group guard
│       └── dashboard.tsx           # Protected responsive Quantro-style workspace dashboard
├── src/
│   ├── components/                 # BrandLogo (official HB+ PNG), DashboardCharts, ErrorBanner,
│   │                               # GoogleSignInButton, MetricCard, MobileBottomNav,
│   │                               # RecentSignInsTable, RoleBadge, Sidebar, SplashScreenView,
│   │                               # TasksPanel, TeamManagementPanel, UserAvatar
│   ├── context/
│   │   └── AuthContext.tsx         # AuthProvider & useAuth() hook
│   ├── services/
│   │   ├── firebase.ts             # Firebase App, Auth & Firestore initialization
│   │   ├── authPersistence.ts      # TypeScript fallback
│   │   ├── authPersistence.web.ts  # browserLocalPersistence + browserPopupRedirectResolver
│   │   ├── authPersistence.native.ts # expo-secure-store chunked persistence adapter
│   │   ├── nativeGoogleAuth.ts     # TypeScript fallback
│   │   ├── nativeGoogleAuth.web.ts # Web no-op
│   │   ├── nativeGoogleAuth.native.ts # expo-auth-session Google ID token flow
│   │   ├── auth.ts                 # Google & Email/Password auth, domain check, session revocation
│   │   ├── users.ts                # Firestore users/{uid} CRUD & Admin account provisioning
│   │   └── tasks.ts                # Firestore tasks/{taskId} RBAC task assignment & status updates
│   ├── theme/
│   │   └── index.ts                # Design tokens (spacing, radii, breakpoints)
│   ├── types/
│   │   └── auth.ts                 # TypeScript interfaces
│   └── utils/
│       └── domain.ts               # Domain normalization, strict email validation & fixed admin check
├── assets/
│   ├── hbplus-logo.png             # Official HB+ brand logo
│   └── login-bg.jpg                # Architectural dusk login background
├── public/
│   └── _redirects                  # Netlify SPA fallback (/* /index.html 200)
├── firestore.rules                 # Server-side domain & RBAC security rules (users + tasks)
├── eas.json                        # EAS Build profiles (development, preview, production)
├── netlify.toml                    # Netlify build (Node 22) & SPA redirect configuration
└── .env.example                    # Environment variable template (no secrets committed)
```

---

## Setup Instructions

### 1. Prerequisites

- **Node.js v22 LTS** (recommended for Expo SDK 58 — if using `nvm`, run `nvm install 22 && nvm use 22`)
- **npm** (bundled with Node.js)
- A [Firebase](https://console.firebase.google.com/) project with Authentication and Cloud Firestore enabled
- **For Android Emulator:** [Android Studio](https://developer.android.com/studio) with Android SDK & an AVD emulator configured
- **For iOS Simulator:** macOS with [Xcode](https://developer.apple.com/xcode/) and iOS Simulator installed
- **For Physical Phone Testing:** Expo Go app (quick UI/manual auth preview) or EAS Build preview APK (full native Google OAuth)

### 2. Clone & Install Dependencies

```bash
git clone <your-github-repo-url>
cd <repo-folder>
npm install
```

### 3. Firebase Project Setup

1. Open the [Firebase Console](https://console.firebase.google.com/) and create (or select) a project.
2. **Enable Authentication Providers:**
   - Go to **Build → Authentication → Sign-in method**.
   - Enable **Google** (set Project support email → Save).
   - Enable **Email/Password** (toggle Enable → Save).
3. **Create Cloud Firestore & Publish Security Rules:**
   - Go to **Build → Firestore Database → Create database** (Production mode).
   - Open the **Rules** tab, paste the full contents of `firestore.rules`, and click **Publish**.
4. **Register a Web App:**
   - Go to **Project Settings → General → Your apps → Add app (`</>`)**.
   - Copy `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, and `appId`.
5. **Configure Authorized Domains:**
   - Go to **Authentication → Settings → Authorized domains**.
   - Ensure `localhost` is present for local development and add your Netlify domain (`<your-site>.netlify.app`) for production.
6. *(Optional)* **Custom Branded Password Reset URL:**
   - Go to **Authentication → Templates → Password reset → Edit → Customize action URL** and set `https://<your-site>.netlify.app/reset-password` (or `http://localhost:8081/reset-password` locally).

### 4. Google OAuth 2.0 Client IDs (Web / Android / iOS)

Open [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials) for the **same Firebase project**:

1. **Web Client ID (`EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`):**
   - Copy the auto-created **Web client (auto created by Google Service)** Client ID.
   - Verify Authorized JavaScript origins include `http://localhost:8081` and `https://<your-site>.netlify.app`, and Authorized redirect URIs include `https://<your-project-id>.firebaseapp.com/__/auth/handler`.
2. **Android Client ID (`EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`):**
   - Click **Create Credentials → OAuth client ID → Android**.
   - Package name: `fit.hbplus.workspace` (matches `app.json`).
   - Add your keystore **SHA-1** fingerprint (from `npx eas-cli@latest credentials -p android` for production, or local `debug.keystore` for emulator).
3. **iOS Client ID (`EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`):**
   - Click **Create Credentials → OAuth client ID → iOS**.
   - Bundle ID: `fit.hbplus.workspace` (matches `app.json`).
4. **OAuth Consent Screen (Audience):**
   - Under **Google Auth Platform → Audience**, publish the app for production (or add test users while in Testing mode).

### 5. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values (never commit `.env`):

```bash
cp .env.example .env
```

```env
# Allowed corporate email domain (without leading @)
# Switch to gmail.com temporarily for local testing if you do not have an @hbplus.fit account
EXPO_PUBLIC_ALLOWED_DOMAIN=hbplus.fit

# Permanent Fixed Admin Account (auto-provisions on first login)
EXPO_PUBLIC_FIXED_ADMIN_EMAIL=admin@hbplus.fit
EXPO_PUBLIC_FIXED_ADMIN_PASSWORD=Admin@123

# Firebase Web App Config
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...

# Google OAuth 2.0 Client IDs (for Native Android / iOS via expo-auth-session)
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=...
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=...
```

---

## How to Run on Web, Android Emulator, iOS Simulator & Mobile Devices

### A. Run on Web Browser

```bash
npm run web
```
Opens at `http://localhost:8081` (Metro bundler with `react-native-web`).

### B. Run on Android Emulator (Windows / macOS / Linux)

1. Open **Android Studio → Virtual Device Manager (Device Manager)** and click **Play (▶)** to boot an Android emulator (e.g., Pixel 7, API 34+).
2. Confirm the emulator is detected:
   ```bash
   adb devices
   ```
3. Launch the Expo app on the emulator:
   ```bash
   npm run android
   ```
   *(Or run `npx expo start -c` and press **`a`** in the terminal once the bundler is ready.)*

> **Note on Native Google OAuth on Android:** Expo Go runs under package ID `host.exp.exponent`, so Google OAuth custom redirect URIs (`fit.hbplus.workspace:/oauthredirect`) require a native **Development Build** (`npx expo run:android`) or **EAS Preview APK** (see Section E below). Manual login (`admin@hbplus.fit` / `Admin@123`), Dashboard, Tasks, Team, and Firestore all run directly inside Expo Go as well.

### C. Testing on iOS (For Reviewers — No Paid Apple Developer Account Required)

Because Apple requires a paid Apple Developer Program membership (\$99/year) to sign and install `.ipa` binaries on physical iPhones, iOS reviewers can test the app using any of the following **free options**:

1. **iPhone Safari (Live Netlify Web App — Recommended for Quick iOS Review):**
   - Open the live Netlify URL directly in **iPhone Safari** — the mobile-first responsive UI, Google Sign-In, Admin/User RBAC, Task Management, and animations all run cleanly in the browser.
2. **Expo Cloud Preview via Expo Go (`eas update` — Works Even When Local PC Is Off):**
   - Install **Expo Go** from the iOS App Store and scan the project's Expo Cloud preview QR code (published via `npx eas-cli@latest update`) to experience the native React Native bundle directly on an iPhone.
3. **Free iOS Simulator Build (macOS with Xcode):**
   - Run locally on macOS with Xcode Simulator:
     ```bash
     npm run ios
     ```
     *(Or run `npx expo start -c` and press **`i`** in the terminal.)*
   - Or generate a free cloud **iOS Simulator** build (no Apple Developer account required) using the `ios-simulator` profile in `eas.json`:
     ```bash
     npx eas-cli@latest build -p ios --profile ios-simulator
     ```
     Download the resulting `.tar.gz` archive and drag it onto the macOS iOS Simulator window.

### D. Run on Physical Phone (Expo Go — Quick Preview)

1. Install **Expo Go** from Google Play Store (Android) or App Store (iOS).
2. Start Metro with a clean cache:
   ```bash
   npx expo start -c
   ```
   *(If your phone and computer are on different networks, use `npx expo start --tunnel`.)*
3. Scan the terminal QR code (inside Expo Go on Android, or using the Camera app on iOS).

### E. Build Installable Production/Preview Android APK (EAS Cloud — No Android Studio Needed)

```bash
# 1. Log in to Expo
npx eas-cli@latest login

# 2. Upload your .env variables to EAS (or import them in expo.dev Project Settings -> Environment variables)
npx eas-cli@latest env:push --environment preview --path .env

# 3. Build a directly installable Android APK
npx eas-cli@latest build -p android --profile preview
```

Once complete, Expo provides a QR code and direct `.apk` download link to install on any Android device with full native Google OAuth support.

### F. Typecheck & Lint

```bash
npm run typecheck   # npx tsc --noEmit
npm run lint        # npx expo lint
```

---

## Authentication Flow

```text
+-------------------+      Web: signInWithPopup (hd=<domain>)        +------------------+
|   Login Screen    | ---------------------------------------------> |  Google OAuth    |
|  (app/login.tsx)  |   Native: expo-auth-session (hd=<domain>) ->   |  Account Picker  |
|  (Google or       |     ID token -> signInWithCredential           +--------+---------+
|   Email/Password) |                                                         |
+---------+---------+      Manual: signInWithEmailAndPassword                 v
          ^        \ ----------------------------------------------> +------------------+
          |                                                          |  Firebase Auth   |
          | No (Sign out, revoke session,                            |  Session Created |
          |  show exact restriction banner)                          +--------+---------+
          +----------------------------------------+                          |
                                                   |                          v
                                           +-------+--------+                 |
                                           | Email matches  | <---------------+
                                           | @<allowedDom>? |
                                           +-------+--------+
                                                   | Yes
                                                   v
                                           +------------------+
                                           | Firestore Rules  |
                                           | Verify email &   |
                                           | domain server-   |
                                           | side             |
                                           +-------+----------+
                                                   | Pass
                                                   v
                                           +------------------+
                                           | Upsert users/uid |
                                           | (first login =>  |
                                           |  role: "user")   |
                                           +-------+----------+
                                                   |
                                                   v
                                           +------------------+
                                           | Root Auth Guard  |
                                           | Redirect ->      |
                                           | /dashboard       |
                                           +------------------+
```

### Step-by-Step

1. **Splash / Session Hydration:** On launch, `app/_layout.tsx` displays a dashboard-matched skeleton overlay (`SplashScreenView`) while `onAuthStateChanged` resolves Firebase's persisted session (`browserLocalPersistence` on Web, chunked `expo-secure-store` Keychain/Keystore on Native). This eliminates route flicker.
2. **Sign-In:**
   - **Web Google:** Calls Firebase `signInWithPopup` with `GoogleAuthProvider` (`hd: allowedDomain`, `prompt: 'select_account'`).
   - **Native Google:** Uses `expo-auth-session` (`Google.useIdTokenAuthRequest`) with `extraParams: { hd: allowedDomain }`, then exchanges the returned ID token via `signInWithCredential`.
   - **Manual Email/Password:** Validates the allowed domain before and after calling `signInWithEmailAndPassword` / `createUserWithEmailAndPassword`.
3. **Domain Verification:** Both the sign-in handler and `onAuthStateChanged` validate `isEmailAllowed(user.email, allowedDomain)` before setting authenticated state.
4. **Profile Sync:** Authorized users sync `users/{uid}` in Cloud Firestore via `upsertUserProfile()` (creating `{ email, name, photoURL, role: "user", createdAt, lastLoginAt }` on first login, or updating `lastLoginAt` on returning logins without touching `role`).
5. **Protected Routes:** `RootAuthGuard` in `app/_layout.tsx` + `app/(protected)/_layout.tsx` blocks unauthenticated direct access to `/dashboard` and redirects logged-in users away from `/login`.
6. **Logout:** Clicking **Log out** calls Firebase `signOut(auth)`, clears React context state, removes persisted session storage, and redirects to `/login`.

---

## How Domain Restriction Works (Defense in Depth)

Domain restriction is enforced across **three independent layers**:

1. **OAuth Hosted Domain Hint (`hd` parameter):**
   - Both Web (`GoogleAuthProvider.setCustomParameters({ hd })`) and Native (`extraParams: { hd }`) send `hd=<allowedDomain>` to Google so the picker restricts/prioritizes organization accounts.
2. **Strict Client Validation & Immediate Revocation (`src/utils/domain.ts`, `src/services/auth.ts`, `src/context/AuthContext.tsx`):**
   - `isEmailAllowed()` splits strictly on `@` and checks an exact lowercase domain match against `EXPO_PUBLIC_ALLOWED_DOMAIN` (blocking spoofing attempts like `user@fakehbplus.fit` or `user@hbplus.fit.evil.com`).
   - On mismatch, the app never sets authenticated state, immediately executes `signOut(auth)` to clear any session, and shows the exact required error:
     > `Access restricted. Please login using your official domain email.`
3. **Server-Side Firestore Security Rules (`firestore.rules`):**
   - Every Firestore read/write enforces domain ownership server-side:
     ```javascript
     request.auth != null
       && request.auth.token.email is string
       && (
         request.auth.token.email.lower().matches('^[^@]+@hbplus\\.fit$')
         || isFixedAdminEmail()
       )
     ```
   - Any unauthorized client attempting direct Firestore API calls receives `PERMISSION_DENIED`.

---

## Role-Based Access Control (RBAC)

- **User Document Schema (`users/{uid}`):**
  ```json
  {
    "email": "alex@hbplus.fit",
    "name": "Alex Morgan",
    "photoURL": "https://...",
    "role": "user",
    "createdAt": "<ServerTimestamp>",
    "lastLoginAt": "<ServerTimestamp>"
  }
  ```
- **Default Role & Self-Elevation Prevention:**
  - Normal users can only create their own `users/{uid}` document with `role == "user"`.
  - On `update`, self-updates are restricted to `['name', 'photoURL', 'lastLoginAt']` with `request.resource.data.role == resource.data.role` — a user can **never** change their own role.
- **Admin Capabilities:**
  - **Team & Account Provisioning (Admin-Only Tab):** Hidden from normal users. Admins can create new `@<allowedDomain>` member accounts directly (using a secondary in-memory Firebase app instance so the Admin stays logged in) and promote/demote other users (`isAdmin() && !isOwner(uid)`).
  - **Task Assignment (`tasks/{taskId}`):** Admins can assign tasks to **All Users** (`assigneeUid: 'ALL'`) or a **particular user** (`assigneeUid: <uid>`), and delete tasks. Normal users only read tasks assigned to them or `'ALL'`, and can update only `['status', 'updatedAt']`.

---

## Token Handling & Security

- Firebase SDK manages ID and refresh tokens exclusively; tokens are never stored in plain text or logged.
- **Web:** `browserLocalPersistence` via `src/services/authPersistence.web.ts`.
- **iOS / Android:** `getReactNativePersistence` wrapped around a chunked, key-sanitized `expo-secure-store` adapter (`src/services/authPersistence.native.ts`), storing auth state in iOS Keychain / Android Keystore.
- **Secrets Hygiene:** `.env`, `.env.*`, and `*.jks` are listed in `.gitignore`; only `.env.example` is committed.

---

## Deployment (Netlify)

### 1. Verify Web Export Locally

```bash
npx expo export -p web
```
Produces the SPA bundle in `dist/` (including `dist/_redirects` copied from `public/_redirects`).

### 2. Deploy via Netlify Git Integration (Recommended)

1. Push this repository to GitHub.
2. In [Netlify](https://app.netlify.com/), click **Add new site → Import an existing project → GitHub**.
3. Netlify reads `netlify.toml` automatically:
   - **Node version:** `22`
   - **Build command:** `npx expo export -p web`
   - **Publish directory:** `dist`
   - **SPA Redirect:** `/* -> /index.html (200)`
4. Under **Site configuration → Environment variables**, add all `EXPO_PUBLIC_*` keys from `.env.example` (with `EXPO_PUBLIC_ALLOWED_DOMAIN=hbplus.fit`).
5. Click **Deploy site**.

### 3. Post-Deploy Firebase & Google Console Step

1. Copy your live Netlify hostname (e.g., `your-site.netlify.app`).
2. Add it to **Firebase Console → Authentication → Settings → Authorized domains**.
3. Add `https://your-site.netlify.app` to **Authorized JavaScript origins** on your Google Web OAuth Client ID in Google Cloud Console.
4. Update the **Live Demo** link at the top of this `README.md`.
