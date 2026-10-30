# Stride

Stride runs as a web app or a Capacitor iOS app.

## Run the web app

```sh
npm ci
npm run build
STRIDE_API_TARGET=http://127.0.0.1:8100 npm run preview -- --port 5180
```

Open `http://localhost:5180`. Set `STRIDE_API_TARGET` to the Laravel API's origin. The browser calls `/api/stride` on the same origin; Vite forwards those requests. Use a production build to test installation, caching, and service worker updates.

## Install on iPhone

Serve the app over HTTPS. In Safari, choose Share, then Add to Home Screen. Open Stride from its icon. In Profile, open Notifications, enable notifications on the device, and choose workout reminders, weigh-in reminders, or coach updates. Use Send a test notification to check delivery.

Profile also has Install & saved data. It shows pending changes and lets the browser keep app data for longer. Storage permission does not replace a backup.

## Offline use

Opened plans and exercises are cached for the signed-in account. Workout starts, set logs, session completions, and weigh-ins are saved locally before sending. They sync when the app is open and connected again. Weigh-ins keep their original date, and workouts keep their recorded start and completion times.

The app keeps pending changes when a request fails. Install & saved data offers retry and explicit discard controls. Sign-out and account reset are blocked while changes are pending. AI coaching and other account edits need a connection. A first sign-in needs a connection too.

App updates wait for the Update button so a new version does not interrupt a workout. Clearing website data removes the local cache and unsynced changes.

## Hosting and push setup

```sh
docker build -t stride-pwa .
docker run --rm -p 5180:80 stride-pwa
```

Put an HTTPS reverse proxy in front of the container. The supplied nginx configuration forwards `/api/stride/` to `https://dashboard.cecko.dev`.

The production target is `https://stride.cecko.dev`. Dokploy manages it as `stride-web-app` in the `cecko` project's production environment, with HTTPS routed to container port 80. The initial release uses Dokploy's source ZIP upload and Dockerfile build. Automatic Git deployments are disabled until the source changes are published.

The companion Laravel API change must be deployed too. Install its locked Composer dependencies and run its database migration. Configure `STRIDE_PUSH_PUBLIC_KEY`, `STRIDE_PUSH_PRIVATE_KEY`, and `STRIDE_PUSH_SUBJECT` with a valid contact URI. Keep the private key in the API environment only. The API's `stride:push-keys` command can generate keys in a local `.env`; it prints only the public key.

Run the Laravel scheduler every minute. The `stride:send-push-notifications` command handles reminders, retries, and expired subscriptions. Workout reminders apply to training days until the session is done; weigh-in reminders stop after a weight entry for that day. Coach updates use the existing coach messages. Delivery follows the account's saved timezone and notification preferences.

Background reminders use server push. Rest-timer notifications are future work. Physical iPhone push delivery still needs verification after deployment.
