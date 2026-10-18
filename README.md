# HB+ Access

HB+ Access is an Expo application built with React Native and React Native Web. The same UI and Firebase sign-in flow runs on web, Android, and iOS; a Node.js API verifies Firebase ID tokens, enforces the email-domain policy, and stores profiles in MongoDB Atlas.

## Requirements

- Node.js 24.12 or newer
- Expo Go or an Android/iOS emulator for development
- Firebase Authentication with Google enabled
- Google OAuth client IDs for web, Android, and iOS
- MongoDB Atlas cluster and database user

## Configure Firebase and Google sign-in

1. In Firebase Console for project `auth-hbplus`, enable Google under **Authentication → Sign-in method**.
2. Add `localhost` and any production web host under **Authentication → Settings → Authorized domains**.
3. In Google Cloud Console, create OAuth client IDs for the web app and each native app. Use Android package `fit.hbplus.access` and iOS bundle ID `fit.hbplus.access`. Configure the Android signing certificate SHA-1 fingerprints for the build you are using.
4. Add the three client IDs to the Expo public environment variables in `.env`: `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`, and `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`. These client IDs are public OAuth configuration, not client secrets.
5. In **Project settings → Service accounts**, create/download a Firebase Admin service-account JSON credential for the server. Keep it private and out of source control. Set `GOOGLE_APPLICATION_CREDENTIALS` to its path under the ignored `secrets/` directory, or provide its JSON contents as the server-only `FIREBASE_SERVICE_ACCOUNT_JSON`.

The Firebase web API configuration lives in `src/firebaseConfig.js`. It is public client configuration; restrict its API key by API and website referrer in Google Cloud Console. Never put Firebase Admin credentials, MongoDB credentials, or `SESSION_SECRET` in an `EXPO_PUBLIC_` variable.

## Configure MongoDB Atlas

1. Create an Atlas database user with read/write access to the application database.
2. In Atlas **Network Access**, allow the public IP of the machine running the Node API. On a phone on your Wi-Fi, the API machine's network firewall must also permit connections on port 3001.
3. In Atlas, choose **Connect → Drivers → Node.js** and copy the connection string. Replace the password placeholder with the database user's password and URL-encode special characters.
4. Set `MONGODB_URI` and `MONGODB_DB_NAME` in `.env`. `DNS_SERVERS=8.8.8.8,8.8.4.4` optionally configures Google Public DNS for Atlas SRV lookups; this is not an Atlas IP allowlist entry.

The server creates a `users` collection with a unique `firebaseUid` index and upserts the verified user's profile after sign-in. New profiles receive the `user` role.

## Run the API and web app

Install dependencies and start both Expo and the API:

```sh
npm install
npm run dev
```

Open the Expo terminal and press `w` to open the React Native Web app, or run `npm run dev:web` in a separate terminal for web-only development. The API listens on port `3001`; Expo web uses port `8081`.

For web deployments where the API is hosted on another origin, set `EXPO_PUBLIC_API_URL` to the API base URL and add the exact web origin to the server's comma-separated `WEB_ORIGINS` setting. Prefer deploying the web app and API on the same origin.

## Run on Android and iOS

Run `npm run dev` and open the Expo Go app to scan the development QR code. For an Android emulator, Expo can also launch it with `npm run android`; for an iOS simulator on macOS, use `npm run ios`.

The default API URL is `http://10.0.2.2:3001` on the Android emulator and `http://localhost:3001` on the iOS simulator. A physical phone cannot use those emulator addresses: set `EXPO_PUBLIC_API_URL` to the development computer's LAN address, for example `http://192.168.1.25:3001`, and allow that connection through the computer's firewall. Do not use an `http://` API URL in production.

Native Google sign-in requires platform OAuth client IDs and a development build configured with this app's bundle/package IDs. Create a development build with EAS or the platform's native build tools after configuring the OAuth clients; Expo Go does not have your app-specific native OAuth configuration.

## Production

Export the web app and start the API:

```sh
npm run build
npm start
```

Set `NODE_ENV=production`, `FIREBASE_PROJECT_ID`, `MONGODB_URI`, and a unique `SESSION_SECRET` of at least 32 characters in the server environment. Supply Firebase Admin credentials using the hosting platform's application-default credentials or a server-only secret. Serve the app and API over HTTPS.

Web uses an HttpOnly, SameSite session cookie. Native apps receive a signed session token and store it using platform secure storage. The API verifies Firebase tokens at sign-in, checks email verification and the configured domain, and supports bearer sessions for mobile requests. `SKIP_EMAIL_DOMAIN_CHECK=true` is honored only in non-production development.

## Deploy to Netlify

This project includes `netlify.toml`. Netlify runs the Expo web export, publishes `dist/`, and rewrites `/api/*` to a serverless function that wraps the existing Express API.

1. Push this project to GitHub and import the repository in Netlify.
2. In **Site configuration → Environment variables**, add server-only `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `MONGODB_URI`, `MONGODB_DB_NAME`, `SESSION_SECRET`, and `ALLOWED_DOMAIN`. Set `NODE_ENV=production`; keep `SKIP_EMAIL_DOMAIN_CHECK` unset or `false`.
3. Add the Netlify site hostname to Firebase Authentication's authorized domains and the OAuth web client's allowed JavaScript origins.
4. Allow Atlas access from the network used by your Netlify Functions. If your Atlas network policy requires fixed outbound IPs, configure a Netlify plan/network setup that provides static egress; do not open Atlas to `0.0.0.0/0` as a permanent workaround.
5. Deploy. Netlify will build with `npm run build`; API routes stay same-origin so the browser session cookie works.

Do not add `MONGODB_URI`, Firebase Admin credentials, or `SESSION_SECRET` as `EXPO_PUBLIC_*` variables. Netlify's `EXPO_PUBLIC_API_URL=/` build setting points the web client at the same-origin API rewrite.
# hbplus
