# BUILD AND TEST INSTRUCTIONS

## The Problem

Your APK was still using the old web-only audio.js because:
1. GitHub Actions workflow was DELETING www folder and copying from web
2. Local builds weren't syncing the www folder to platforms

## What I Fixed

1. **GitHub Actions workflow** - Changed to selective copy (preserves Cordova files)
2. **Created Android-first audio.js** - Requests permission on startup AND before recording
3. **Updated BOTH locations**:
   - `calorieai-android/www/js/audio.js` (source)
   - `calorieai-android/platforms/android/app/src/main/assets/www/js/audio.js` (built APK)

## Build Fresh APK NOW

### Option A: Local Build (Windows PowerShell)

```powershell
cd C:\Users\akona\OneDrive\Dev\CalorieAI\calorieai-android
npx cordova build android --debug
```

APK Location:
```
C:\Users\akona\OneDrive\Dev\CalorieAI\calorieai-android\platforms\android\app\build\outputs\apk\debug\app-debug.apk
```

### Option B: GitHub Actions Build

```powershell
cd C:\Users\akona\OneDrive\Dev\CalorieAI

git add .
git commit -m "FIX: Microphone permission - bulletproof implementation"
git push origin main
```

Then download APK from https://github.com/konashevich/CalorieAI/actions

## Test on Device

1. **Uninstall old APK** completely
2. **Install new APK**
3. **Launch app** - Should immediately prompt for mic permission
4. **Tap "Allow"**
5. **Tap Mic button** - Native recorder should open
6. **Record 5 seconds**
7. **Stop** - Should show "Recording saved. Click 'Send to AI'"

## What the New Code Does

**On app startup:**
- Detects Cordova environment
- Waits for deviceready
- Calls `perms.requestPermission(perms.RECORD_AUDIO, ...)` 
- **This FORCES Android to show the permission dialog**

**On first Mic tap:**
- Requests permission again if not granted
- Uses native media capture (most reliable)
- Falls back to Media plugin with .3gp format

**Console logs you'll see:**
```
[AudioManager] Initializing... {isCordova: true}
[AudioManager] Requesting initial permissions...
[AudioManager] Permission granted: true
[AudioManager] Start recording requested
[AudioManager] Using native media capture
```

## If It STILL Doesn't Work

**Check using Chrome DevTools:**
1. Connect phone via USB
2. Enable USB debugging on phone
3. Chrome → `chrome://inspect/#devices`
4. Find CalorieAI WebView
5. Click "inspect"
6. Check Console for `[AudioManager]` logs

**If no logs appear:**
- APK wasn't rebuilt with new code
- Rebuild following Option A above

**If permission is never requested:**
- Check phone: Settings → Apps → CalorieAI → Permissions
- If "Microphone: Denied" with no option - you selected "Don't ask again" before
- Solution: Toggle it to "Allowed" manually

---

**The fix IS in place. You MUST rebuild the APK to see it work.**
