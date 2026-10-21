# Тестирање на телефону са Expo Go

Ово покреће апликацију са вашег рачунара на ваш Android телефон. Свака измена у коду се одмах види на телефону.
*(Testing the app on your phone with Expo Go — step by step, Windows.)*

## Једном, на почетку (one-time setup)

1. **Node.js** — download the **LTS** version from https://nodejs.org and install it with the default options.
2. **Git** — download from https://git-scm.com and install with the default options.
3. **Expo Go on the phone** — install "Expo Go" from the Google Play Store.
4. **Get the project.** Open the folder where you want it (for example `C:\trosko`), click the address bar, type `cmd` and press Enter. In the black window run:
   ```
   git clone https://github.com/itadic123/expense-tracker
   cd expense-tracker
   ```
   The repo is private, so a browser window opens asking you to sign in to GitHub. Sign in and allow.
5. **Add the Supabase keys.** In the `expense-tracker` folder, open `.env.example` in Notepad, put in your real values, and save it as `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://jsudeypbotgqycjsvrxw.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=(the anon key you pasted earlier)
   ```
   In Notepad's Save dialog choose **Save as type: All files**, otherwise it becomes `.env.txt` and the app won't see it.
6. **Install the packages** (takes a few minutes, only needed once and after updates):
   ```
   npm install
   ```

## Сваки пут кад тестирате (every time)

1. Phone and computer on **the same Wi‑Fi**.
2. In the `expense-tracker` folder, open `cmd` and run:
   ```
   npx expo start
   ```
   If Windows asks about the firewall, click **Allow** (private networks).
3. A QR code appears in the window. Open **Expo Go** on the phone → **Scan QR code** → scan it. The app loads in 10–30 seconds.
4. To stop, press `Ctrl + C` in the window.

Useful keys in that window: `r` reloads the app, `j` opens the debugger.

## Кад направим измене (getting my latest changes)

Stop the server (`Ctrl + C`), then:
```
git pull
npm install
npx expo start
```
Your `.env` file stays as it is.

## Ако нешто не ради (troubleshooting)

- **Phone can't connect / spins forever** (different network, office Wi‑Fi, firewall): run `npx expo start --tunnel` instead. The first time it asks to install `@expo/ngrok`, answer `y`.
- **"Project is incompatible with this version of Expo Go"**: the phone's Expo Go is for a different Expo version. Send me a screenshot and I'll sort it out.
- **Red error screen on the phone**: send me a screenshot of it.
- **"Supabase keys missing" message in the app**: the `.env` file is missing, misnamed (`.env.txt`), or you started the server before creating it. Fix it and run `npx expo start -c`.

## Шта ради у Expo Go (what works here)

- Email login and sign‑up, profile, photo from camera or gallery, dashboard, statistics, bottom bar: yes.
- Receipt QR scanning with the camera: yes (uses the phone's native scanner), but saving a receipt still needs the `scan-receipt` function deployed in Supabase.
- Google login: not yet, it hasn't been set up.

Expo Go is only for testing. The real standalone Android app (an APK you install without Expo Go) is built separately with EAS.

## Права Android апликација (standalone APK)

When testing in Expo Go looks good, this builds an APK you can install on any Android phone without Expo Go. The build runs in Expo's cloud, so nothing extra is needed on your computer.

1. Create a free account at https://expo.dev/signup.
2. In the `expense-tracker` folder, in `cmd`:
   ```
   npx eas-cli@latest login
   npx eas-cli@latest init
   ```
   `init` links the project to your Expo account; answer `y` to its questions.
3. Give the build the Supabase keys (the `.env` file is not uploaded). Run each line once, with your real values:
   ```
   npx eas-cli@latest env:create --name EXPO_PUBLIC_SUPABASE_URL --value https://jsudeypbotgqycjsvrxw.supabase.co --environment preview --environment production --visibility plaintext
   npx eas-cli@latest env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value YOUR_ANON_KEY --environment preview --environment production --visibility plaintext
   ```
4. Build:
   ```
   npx eas-cli@latest build -p android --profile preview
   ```
   It answers `y` to create a signing key the first time. The build takes about 10–20 minutes; when it finishes, it prints a link and a QR code. Open it on the phone, download the APK and install it (Android asks to allow installing from this source).

For the Google Play Store later, the same command with `--profile production` makes the file Google wants.
