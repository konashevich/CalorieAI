# CalorieAI Android APK Build Guide

## 📱 Overview

This guide will help you build the CalorieAI Android APK from the Cordova project. The app has been configured with all necessary permissions and plugins for audio recording, camera access, and offline functionality.

## ✅ Prerequisites

Before building the APK, you need to install the following tools:

### 1. **Node.js and npm** ✅ (Already Installed)
- Node.js v22.16.0
- npm v11.6.1

### 2. **Cordova CLI** ✅ (Already Installed)
- Cordova v12.0.0

### 3. **Java Development Kit (JDK)**
- **Required Version**: JDK 17 or later
- **Download**: https://adoptium.net/ or https://www.oracle.com/java/technologies/downloads/

To check if JDK is installed:
```powershell
java -version
```

### 4. **Android Studio**
- **Download**: https://developer.android.com/studio
- **Required Components**:
  - Android SDK
  - Android SDK Platform Tools
  - Android SDK Build Tools
  - Android Emulator (optional, for testing)

### 5. **Gradle**
- Usually comes with Android Studio
- Cordova will use it automatically

## 🔧 Setup Android Development Environment

### Step 1: Install Android Studio
1. Download Android Studio from https://developer.android.com/studio
2. Install Android Studio (use default settings)
3. Open Android Studio and complete the setup wizard
4. In Android Studio, go to **Tools → SDK Manager**
5. Install the following:
   - Android SDK Platform 35 (or latest)
   - Android SDK Build-Tools 35.x.x
   - Android SDK Platform-Tools
   - Android SDK Command-line Tools

### Step 2: Set Environment Variables

#### Windows PowerShell:
Add these to your system environment variables:

```powershell
# Android SDK path (adjust if different)
$env:ANDROID_HOME = "C:\Users\YourUsername\AppData\Local\Android\Sdk"
$env:ANDROID_SDK_ROOT = "C:\Users\YourUsername\AppData\Local\Android\Sdk"

# Add to PATH
$env:PATH += ";$env:ANDROID_HOME\platform-tools"
$env:PATH += ";$env:ANDROID_HOME\tools"
$env:PATH += ";$env:ANDROID_HOME\cmdline-tools\latest\bin"

# Java JDK path (adjust if different)
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
```

To make these permanent, add them through:
- **Control Panel → System → Advanced System Settings → Environment Variables**

### Step 3: Verify Installation

Run this command to check if all requirements are met:

```powershell
npx cordova requirements android
```

You should see:
- ✅ Java JDK: installed
- ✅ Android SDK: installed
- ✅ Android target: installed
- ✅ Gradle: installed

## 🏗️ Building the APK

### Option 1: Using the Build Script (Recommended)

We've created a PowerShell script to make building easier:

```powershell
.\build-apk.ps1
```

The script offers these options:
1. **Debug APK** - Unsigned APK for testing on your device
2. **Release APK** - Requires keystore for signing
3. **Clean Build** - Removes and reinstalls Android platform
4. **Check Requirements** - Verifies your build environment
5. **Exit**

### Option 2: Manual Build Commands

#### Build Debug APK (for testing):
```powershell
npx cordova build android --debug
```

#### Build Release APK (for distribution):
```powershell
npx cordova build android --release
```

#### Build and Run on Device:
```powershell
npx cordova run android
```

#### Build and Run on Emulator:
```powershell
npx cordova emulate android
```

## 📦 APK Output Locations

After building, you'll find the APK files here:

### Debug APK:
```
platforms\android\app\build\outputs\apk\debug\app-debug.apk
```

### Release APK (unsigned):
```
platforms\android\app\build\outputs\apk\release\app-release-unsigned.apk
```

## 🔐 Signing the Release APK

To distribute your app outside of testing, you need to sign the release APK.

### Step 1: Create a Keystore

```powershell
keytool -genkey -v -keystore calorieai-release-key.keystore -alias calorieai -keyalg RSA -keysize 2048 -validity 10000
```

This will ask for:
- Keystore password (remember this!)
- Your name and organization details
- Key password (can be same as keystore password)

**⚠️ IMPORTANT**: Keep this keystore file safe! You need it to update your app in the future.

### Step 2: Create build.json

Create a file named `build.json` in the `calorieai-android` folder:

```json
{
    "android": {
        "release": {
            "keystore": "calorieai-release-key.keystore",
            "storePassword": "your-keystore-password",
            "alias": "calorieai",
            "password": "your-key-password",
            "keystoreType": ""
        }
    }
}
```

**⚠️ Security Note**: Never commit `build.json` to version control!

### Step 3: Build Signed Release APK

```powershell
npx cordova build android --release
```

The signed APK will be at:
```
platforms\android\app\build\outputs\apk\release\app-release.apk
```

## 📲 Installing the APK

### On Physical Device:

1. **Enable Developer Mode** on your Android device:
   - Go to **Settings → About Phone**
   - Tap **Build Number** 7 times
   - Developer Options will be enabled

2. **Enable USB Debugging**:
   - Go to **Settings → Developer Options**
   - Enable **USB Debugging**

3. **Install via USB**:
   ```powershell
   npx cordova run android
   ```

4. **Install via APK file**:
   - Transfer the APK to your device
   - Enable **Install Unknown Apps** for your file manager
   - Tap the APK file to install

### On Emulator:

1. Open Android Studio
2. Go to **Tools → Device Manager**
3. Create a new virtual device
4. Start the emulator
5. Run:
   ```powershell
   npx cordova emulate android
   ```

## 🧪 Testing the APK

After installing, test these features:

### ✅ Core Functionality Checklist:
- [ ] App opens without crashes
- [ ] Bottom navigation works (Record, Processed, Cook, Eat tabs)
- [ ] Microphone permission requested
- [ ] Audio recording works
- [ ] Camera permission requested
- [ ] Camera opens for food label scanning
- [ ] Data persists after closing app
- [ ] Offline mode works
- [ ] Network status detected
- [ ] Back button navigation works
- [ ] App doesn't crash when minimized/resumed

### 🔍 Permission Testing:
- [ ] Microphone permission prompt appears
- [ ] Camera permission prompt appears
- [ ] Storage permission granted (Android 12 and below)
- [ ] Media permissions granted (Android 13+)

## 🐛 Troubleshooting

### Problem: "Cordova requirements check failed"
**Solution**: Make sure all environment variables are set correctly (ANDROID_HOME, JAVA_HOME)

### Problem: "Failed to find 'JAVA_HOME'"
**Solution**: 
1. Install JDK 17 or later
2. Set JAVA_HOME environment variable
3. Restart PowerShell/Command Prompt

### Problem: "SDK location not found"
**Solution**:
1. Install Android Studio and SDK
2. Set ANDROID_HOME environment variable
3. Run `npx cordova requirements android` to verify

### Problem: "Gradle build failed"
**Solution**:
1. Clear Gradle cache: `.\gradlew clean` (in platforms\android folder)
2. Or rebuild: Run build script option 3 (Clean build)

### Problem: "App crashes on startup"
**Solution**:
1. Check Android Logcat for errors:
   ```powershell
   adb logcat | Select-String "CalorieAI"
   ```
2. Make sure all permissions are in config.xml
3. Check if cordova.js is loaded in index.html

### Problem: "Camera/Microphone not working"
**Solution**:
1. Check if permissions are granted in device settings
2. Verify plugins are installed: `npx cordova plugin list`
3. Try reinstalling plugins:
   ```powershell
   npx cordova plugin remove cordova-plugin-camera
   npx cordova plugin add cordova-plugin-camera
   ```

## 📋 Installed Plugins

The following Cordova plugins are installed:

- **cordova-plugin-media-capture** - Audio recording
- **cordova-plugin-file** - File system access
- **cordova-plugin-camera** - Camera access
- **cordova-plugin-device** - Device information
- **cordova-plugin-network-information** - Network status

To view all plugins:
```powershell
npx cordova plugin list
```

## 🔄 Updating the App

When you make changes to the web files:

1. Update files in `c:\Users\akona\OneDrive\Dev\CalorieAI\web\`
2. Copy updated files to Cordova:
   ```powershell
   cd c:\Users\akona\OneDrive\Dev\CalorieAI\calorieai-android
   Remove-Item -Path www\* -Recurse -Force
   Copy-Item -Path ..\web\* -Destination www\ -Recurse -Force
   ```
3. Rebuild the APK:
   ```powershell
   npx cordova build android
   ```

## 📊 Build Configuration

### App Details:
- **Package Name**: com.calorieai.app
- **App Name**: CalorieAI
- **Version**: 1.0.0
- **Min Android Version**: Android 7.0 (API 24)
- **Target Android Version**: Android 14 (API 35)

### Permissions Configured:
- RECORD_AUDIO - Audio recording
- MODIFY_AUDIO_SETTINGS - Audio settings
- CAMERA - Camera access
- INTERNET - Network access
- ACCESS_NETWORK_STATE - Network status
- READ_MEDIA_IMAGES - Image access (Android 13+)
- READ_MEDIA_AUDIO - Audio access (Android 13+)
- WRITE_EXTERNAL_STORAGE - Storage (Android 12 and below)
- READ_EXTERNAL_STORAGE - Storage (Android 12 and below)

## 🚀 Next Steps

After successfully building and testing the APK:

1. **Test thoroughly** on different Android devices
2. **Fix any bugs** that appear on real devices
3. **Optimize performance** if needed
4. **Create app icons** for different resolutions
5. **Prepare for Google Play Store** (if planning to publish)

## 📚 Additional Resources

- **Cordova Documentation**: https://cordova.apache.org/docs/en/latest/
- **Android Developer Guide**: https://developer.android.com/guide
- **Cordova Plugin Registry**: https://cordova.apache.org/plugins/

## ❓ Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Run `npx cordova requirements android` to verify setup
3. Check Android Logcat for error messages
4. Review Cordova documentation for specific errors

---

**Good luck building your CalorieAI Android app! 🎉**
