# FieldGuide mobile app (React Native + Expo)

Same API as the web app: camera/gallery → `POST /api/predict` → top-3 species + herbicides → feedback.

## Run
1. Start the **ml-service** and **backend** first (see the root README). The backend listens on port 5000.
2. Install the **Expo Go** app on your phone (same Wi-Fi as your computer).
3. In this folder:
   ```bash
   npm install
   npx expo install --fix      # aligns package versions with your Expo SDK / Expo Go
   npx expo start
   ```
4. Scan the QR code with Expo Go (Android) or the Camera app (iOS).

## Connecting to the backend
- A built app calls the hosted backend set in `app.json` (`expo.extra.apiUrl`); it never falls back to localhost. While developing with `expo start`, and only if `extra.apiUrl` is empty, it uses the computer that serves Expo on port 5000. To test a local backend with a build, use `ALLOW_LOCAL_API=1 npm run build:release` and Server settings.
- If it can't connect: open **Account → Server settings**, enter `http://<your computer's LAN IP>:5000`, and tap **Test connection**. A phone can't use `localhost`.
- Allow Node/port 5000 through your computer's firewall.
- You can also set `EXPO_PUBLIC_API_URL` (see `.env.example`).

## Screens
Identify tab: Upload (camera / gallery) → Review → Analyzing → Possible matches → Results (herbicides + feedback).
Herbicides tab: searchable database. Learn tab: how it works, resistance tips, species list. Account tab: sign in / register, My scans, Server settings.

## Notes
- If Expo Go says the project SDK doesn't match, change the `expo` version in `package.json` to the SDK your Expo Go supports, then run `npx expo install --fix`.
- Plain `http://` is allowed in the app build (set up via `expo-build-properties`) for local-network testing; use an https backend for production.
- Not run on a device here (no network in my environment); the code was syntax-checked only.

## Managing herbicides (add / edit / delete)
- Sign in as an **administrator** (the migration creates `admin@deepweed.app` / `Admin@1234` — change it). Only admins see the **Add herbicide**, **Edit** and **Delete** buttons; the API enforces this too (401 without a login, 403 for non-admins).
- **Run `npm run db:migrate` again** in `backend/` first. It adds the new columns (`application_timing`, `crop`, `mode_of_action`, `pre_harvest_interval`) and is safe to re-run.
- Form fields: weed species\*, herbicide name\*, active ingredient, crop to apply on, dosage\*, application measures, correct time to apply, mode-of-action group, pre-harvest interval, safety notes (\* required).
- Pick the weed from the suggestion list (the species the AI model knows): identified weeds are matched to herbicide records by name, so a record entered under a model species shows up automatically in that weed's results.
- The same herbicide can be saved for the same weed on different crops; an exact duplicate (same weed + herbicide + crop) is rejected with a clear message.

## Feedback: farmer → admin → reply
- Farmers send feedback in two ways: after an identification (Yes/No, the species they think it is, a comment) and as a free message under **My feedback** (web header link / mobile Account tab).
- **Admins** get a **Feedback inbox** in the same place: every item shows the farmer, date, their verdict, the scan it refers to (weed, confidence, crop) and their message. Opening an item marks it as read (*New → Reviewed*); an admin can **reply** and mark it **Resolved** (or reopen it). Filter by All / New / Reviewed / Resolved.
- Farmers read the replies under **My feedback**. A number badge shows new feedback for admins and unread replies for farmers.
- **Run `npm run db:migrate` again** (adds reply tracking columns; safe to re-run).
- API: `GET /api/feedback` (admin inbox), `GET /api/feedback/summary` (admin counts), `PATCH /api/feedback/:id` `{ status?, reply? }` (admin), `GET /api/feedback/my`, `PATCH /api/feedback/:id/seen`.
- Replies are shown in-app; there is no email or push notification yet. Counts refresh when pages change (web) or every minute (mobile).

## Offline use (Nokia 2.4 and other Android phones)

What works **with no internet** once the app is installed: identifying a weed (the AI model runs on the phone), herbicide advice for the result, the Herbicides tab (saved copy), Learn, your scan history, and staying signed in. Feedback and messages you write offline are **saved on the phone and sent automatically** when the connection returns.
What needs a connection: signing in / creating an account, the admin tools (add/edit/delete herbicides, feedback inbox), and downloading new herbicide data.

### One-time: make the on-device model
The server model is Keras (`.h5`); the phone needs TensorFlow Lite. In the model service's Python environment:
```bash
cd ml-service
python convert_to_tflite.py                 # add --image some_weed.jpg to compare with the server; --preprocess mobilenet if you use that on the server
```
It writes `mobile-app/assets/model/weed_classifier.tflite` and `model_meta.json`, and prints how closely TFLite matches Keras. **`--preprocess` must match the server's `PREPROCESS`.**
(The zip ships a placeholder file there, so until you run this the app simply uses the server when online.)

### Build and install on the phone (command line)
Offline use needs a real app build (Expo Go cannot run the on-device model, and a debug build needs your computer's Metro server). Requirements: Node 20+, JDK 17, Android SDK command-line tools (`ANDROID_HOME` set; `adb` on PATH), then `sdkmanager --licenses`.
```bash
cd mobile-app
npm install
npx expo install --fix        # aligns versions with your Expo SDK
npm run test:logic            # optional: tests of the offline logic, no phone needed
npx expo prebuild --platform android --clean
```
On the phone: Settings → About phone → tap *Build number* 7 times → Developer options → enable **USB debugging**, plug in the USB cable and accept the prompt. Check with `adb devices`. Then:
```bash
npm run build:release         # = npx expo run:android --variant release --device  (builds, installs, launches)
```
or build the APK by hand and install it:
```bash
cd android && ./gradlew assembleRelease
adb install -r app/build/outputs/apk/release/app-release.apk
```
Gradle downloads whatever SDK pieces it still needs (the first build takes a while). A release build contains the JavaScript, so it runs without your computer.

### First run (needs the backend once)
1. Phone on the same Wi-Fi as the computer running the backend. Open the app → Account → **Server settings** → enter `http://<computer IP>:5000` → *Test connection*. (Release builds allow plain `http://` for this local-network use.)
2. Open **Herbicides** once so the herbicide data is downloaded to the phone. Settings shows when it was last updated and whether the on-device model is **Ready**.
3. Turn on airplane mode and identify a weed.

### If something goes wrong
- *Settings says the model is "Installed but could not be loaded"*: re-run the converter with `--quant none`, rebuild, and check `adb logcat *:E | grep -i tflite`.
- *`INSTALL_FAILED_NO_MATCHING_ABIS`*: run `adb shell getprop ro.product.cpu.abi` and send me the result.
- *Different answers on the phone and the server*: preprocessing mismatch (see `--preprocess`), or just small differences from a lighter model; compare with `--image`.
- Not run on a real phone here; the native TFLite library (`react-native-fast-tflite`) is the part most likely to need a version tweak on first build.

## Languages (English, chiShona, isiNdebele)
Both apps have a language switcher on every screen: a dropdown in the web header, and an **EN / SN / ND** button in every mobile header. The choice is remembered on the device.

- Translations live in `frontend/src/locales/{en,sn,nd}.json` and `mobile-app/src/locales/{en,sn,nd}.json` (same keys in both; edit the JSON, no code changes needed).
- To add a language: add `xx.json` with the same keys and register it in `LANGUAGES` in `src/lib/i18n.jsx` (web) / `src/lib/i18n.js` (mobile).
- **Please have a native Shona and Ndebele speaker (ideally an agronomist) review the translations**, especially the herbicide, resistance and feedback wording. They are a good first draft, not a certified translation.
- Not translated: weed names (they come from the model), herbicide records (they come from the database, in English), and error messages sent by the backend. Herbicide records can be added in other languages by entering them in the database.
