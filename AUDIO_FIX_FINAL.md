# CRITICAL FIX - GitHub Actions Workflow Error

## Problem Found

Your GitHub Actions workflow **deletes the entire `www` folder** and copies from `web/`:

```yaml
rm -rf calorieai-android/www/*
cp -r web/* calorieai-android/www/
```

This **overwrites** your Cordova-specific `audio.js` file with the web version that doesn't have Android support!

## What This Caused

- APK was built with web-only audio.js
- No Cordova Media/Capture plugin support
- Microphone permission never requested
- Recording always failed

## Fix Applied

**1. Fixed GitHub Actions workflow** (`.github/workflows/build-android-apk.yml`):
   - Changed to **selective copy** instead of deleting everything
   - Now preserves Cordova-specific files
   - Only syncs HTML, CSS, JS, and assets from web

**2. Created bulletproof Android audio.js**:
   - Requests permission **on app startup**
   - Requests permission **again before first recording**
   - Uses native media capture (most reliable)
   - Detailed console logging for debugging
   - Proper error messages pointing to Settings

## How to Use Fixed Version

### Option 1: Rebuild Locally (if you have Android SDK)

```powershell
cd C:\Users\akona\OneDrive\Dev\CalorieAI\calorieai-android
npx cordova build android --debug
```

APK location:
`calorieai-android\platforms\android\app\build\outputs\apk\debug\app-debug.apk`

### Option 2: Push to GitHub (Recommended)

```powershell
cd C:\Users\akona\OneDrive\Dev\CalorieAI

# Add all changes
git add .

# Commit with descriptive message
git commit -m "FIX: Audio recording and GitHub Actions workflow

- Fixed workflow to preserve Cordova-specific files
- Created Android-optimized audio manager
- Forces mic permission on startup and first use
- Uses native media capture for reliability"

# Push to trigger GitHub Actions build
git push origin main
```

Then:
1. Go to https://github.com/konashevich/CalorieAI/actions
2. Wait for build to complete (~5-10 min)
3. Download APK from Artifacts
4. Install on Android device

## What Will Happen Now

**On first app launch:**
- Android will prompt: "Allow CalorieAI to record audio?"
- User taps "Allow"

**On first Mic button tap:**
- If permission wasn't granted, it prompts again
- Native Android recorder opens
- User records and stops
- App processes and sends to AI

## How to Verify It's Working

After installing the APK:

1. **Check app details**:
   - Settings → Apps → CalorieAI
   - Should show Microphone permission (initially "Not allowed")

2. **Open CalorieAI**:
   - Should immediately see permission prompt
   - Tap "Allow"

3. **Tap Mic button**:
   - Native recorder should open (not error)
   - Record for a few seconds
   - Stop recording
   - Should see "Recording saved. Click 'Send to AI'"

4. **Check browser console** (if using Chrome debugging):
   ```
   [AudioManager] Initializing... {isCordova: true}
   [AudioManager] Requesting initial permissions...
   [AudioManager] Permission granted: true
   ```

## If It Still Doesn't Work

Check Android Settings → Apps → CalorieAI → Permissions:
- Microphone: Must be "Allowed"
- If shows "Denied" with no prompt, you previously selected "Don't ask again"
- Manually toggle to "Allowed"

## Files Changed

1. `.github/workflows/build-android-apk.yml` - Fixed to preserve Cordova files
2. `calorieai-android/www/js/audio.js` - Complete rewrite for Android
3. This document for your reference

---

**Next Steps:** Commit and push to GitHub, or rebuild locally and install fresh APK.
