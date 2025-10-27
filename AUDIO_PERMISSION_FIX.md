# Audio Recording Permission Fix 4

## Issue
Audio recording was failing in the Android APK with error: "Failed to start recording. Please check your microphone."

## Root Causes

1. Missing `cordova-plugin-media` plugin (was listed in config.xml but not installed)
2. Missing `cordova-plugin-android-permissions` plugin for runtime permission handling
3. No runtime permission request before attempting to record

## Changes Made

### 1. Installed Missing Plugins

- ✅ `cordova-plugin-media@^7.0.0` - For audio recording on Android (adds RECORD_AUDIO permission)
- ✅ `cordova-plugin-android-permissions@^1.1.5` - For runtime permission handling

**Note**: The plugins automatically add the necessary Android manifest permissions. No manual config.xml changes needed.

### 2. Updated `cordova-integration.js`

- Added runtime permission request on app start
- Properly requests RECORD_AUDIO, CAMERA, and storage permissions
- Handles permission denial gracefully

### 3. Updated `audio.js`

- Added permission check before starting Cordova recording
- Requests RECORD_AUDIO permission if not already granted
- Shows user-friendly error if permission is denied

## Build Error Fix

**IMPORTANT**: If you get this build error:
```
ParseError at [row,col]:[42,75]
Message: http://www.w3.org/TR/1999/REC-xml-names-19990114#AttributePrefixUnbound
```

This means `config.xml` has incorrect permission syntax. The fix:
- ✅ Remove manual `<uses-permission>` tags from config.xml
- ✅ Let the Cordova plugins add permissions automatically
- ✅ The plugins (`cordova-plugin-media`, `cordova-plugin-camera`) handle manifest permissions

## How to Rebuild the APK

### Prerequisites
You need Android development environment set up:
1. Android Studio installed
2. ANDROID_HOME environment variable set
3. Java JDK (17 or later)

### Build Steps

#### Option 1: Using the Build Script (Recommended)
```powershell
cd calorieai-android
.\build-apk.ps1
```
Then select option 1 for Debug APK or option 2 for Release APK.

#### Option 2: Manual Build
```powershell
cd calorieai-android

# For debug APK (testing)
npx cordova build android --debug

# For release APK (production)
npx cordova build android --release
```

#### Option 3: If You Get Android SDK Errors
First, make sure Android Studio is installed and ANDROID_HOME is set:
```powershell
# Check if ANDROID_HOME is set
$env:ANDROID_HOME

# If not set, add it (replace path with your Android SDK location)
$env:ANDROID_HOME = "C:\Users\YourUsername\AppData\Local\Android\Sdk"
```

Then rebuild:
```powershell
cd calorieai-android
npx cordova build android --debug
```

### Install on Device

1. **Find the APK**:
   - Debug: `calorieai-android\platforms\android\app\build\outputs\apk\debug\app-debug.apk`
   - Release: `calorieai-android\platforms\android\app\build\outputs\apk\release\app-release.apk`

2. **Transfer to Android device** (USB, Google Drive, email, etc.)

3. **On Android device**:
   - Enable "Install from Unknown Sources" in Settings
   - Tap the APK file to install
   - Grant permissions when prompted

## Testing the Fix

After installing the updated APK:

1. **First Launch**:
   - App will request microphone permission
   - Tap "Allow" when prompted

2. **Recording Test**:
   - Go to the Record tab
   - Tap the microphone button
   - If permission wasn't granted at startup, you'll be prompted again
   - Start recording - should work without errors!

3. **If Still Not Working**:
   - Go to Android Settings → Apps → CalorieAI → Permissions
   - Manually enable Microphone permission
   - Try recording again

## What Changed Technically

### Before:
- No manifest permissions → Android blocked microphone access
- No runtime permission request → User never prompted
- Media plugin not installed → Recording API unavailable

### After:
- ✅ Manifest permissions in AndroidManifest.xml
- ✅ Runtime permission request on app start
- ✅ Additional permission check before recording
- ✅ Media plugin properly installed
- ✅ User-friendly error messages

## Additional Notes

- **Android 6.0+** requires runtime permissions even if listed in manifest
- The fix handles both cases: permission at startup AND on-demand
- Users can revoke permissions anytime in Android settings
- App will re-request permission when needed

## Quick Test Without Full Setup

If you can't build the APK yourself:
1. The platform has been updated and plugins installed
2. Ask someone with Android development environment to build
3. Or use a CI/CD service like GitHub Actions (see GITHUB_ACTIONS_QUICKSTART.md)

## Related Files Modified

- ✅ `calorieai-android/config.xml` - Added permissions
- ✅ `calorieai-android/www/js/cordova-integration.js` - Added permission handling
- ✅ `calorieai-android/www/js/audio.js` - Added permission check before recording
- ✅ Plugins installed: cordova-plugin-media, cordova-plugin-android-permissions
