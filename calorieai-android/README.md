# CalorieAI Android - Cordova Project

## 🎉 Project Setup Complete!

Your CalorieAI web app has been successfully packaged as a Cordova Android project!

## 📁 Project Structure

```
calorieai-android/
├── www/                    # Your web app files
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js
│   ├── css/
│   ├── js/
│   │   ├── cordova-integration.js  # NEW: Cordova bridge
│   │   └── ... (other JS files)
│   └── assets/
├── platforms/             # Platform-specific builds
│   └── android/          # Android platform files
├── plugins/              # Cordova plugins
├── config.xml            # App configuration
├── build-apk.ps1         # Build script
├── BUILD_GUIDE.md        # Detailed build instructions
└── package.json          # Project dependencies
```

## 🔧 What's Been Done

### ✅ Cordova Project Created
- Package ID: `com.calorieai.app`
- App Name: CalorieAI
- Android platform added

### ✅ Plugins Installed
- `cordova-plugin-media-capture` - Audio recording
- `cordova-plugin-file` - File system access
- `cordova-plugin-camera` - Camera for food labels
- `cordova-plugin-device` - Device information
- `cordova-plugin-network-information` - Network status

### ✅ Web Files Copied
- All files from `web/` folder copied to `www/`
- Cordova integration module added
- index.html updated with Cordova script

### ✅ Configuration Complete
- Android permissions configured in config.xml
- App icons configured
- Android SDK target set to API 35 (Android 14)
- Minimum SDK set to API 24 (Android 7.0)

## 🚀 Next Steps - Building the APK

### Option A: Quick Start (If you have Android Studio)

1. Make sure Android Studio and JDK are installed
2. Set environment variables (see BUILD_GUIDE.md)
3. Run the build script:
   ```powershell
   .\build-apk.ps1
   ```
4. Choose option 1 for Debug APK

### Option B: Full Setup Guide

If you don't have Android development tools installed yet:

1. **Read BUILD_GUIDE.md** for complete setup instructions
2. Install required tools:
   - Java JDK 17+
   - Android Studio
   - Android SDK
3. Set up environment variables
4. Build the APK

### Quick Command Reference

```powershell
# Check requirements
npx cordova requirements android

# Build debug APK (for testing)
npx cordova build android --debug

# Build release APK (for distribution)
npx cordova build android --release

# Run on connected device
npx cordova run android

# Run on emulator
npx cordova emulate android

# List installed plugins
npx cordova plugin list

# View platform info
npx cordova platform list
```

## 📱 What This App Does

CalorieAI is now a native Android app with:

- ✅ **Voice recording** with native Android media capture
- ✅ **Camera access** for food label scanning
- ✅ **Offline storage** with IndexedDB
- ✅ **Network detection** for online/offline modes
- ✅ **Native back button** handling
- ✅ **App pause/resume** event handling
- ✅ **All PWA features** from the web version

## 🔌 Cordova Integration

The `cordova-integration.js` file bridges Cordova features with your web app:

- **Device events**: pause, resume, back button
- **Network status**: online/offline detection
- **Permissions**: camera and microphone
- **File system**: storage path access
- **Native capture**: uses Cordova APIs when available

## 📋 Current Status

| Component | Status |
|-----------|--------|
| Cordova Project | ✅ Created |
| Android Platform | ✅ Added |
| Plugins | ✅ Installed |
| Web Files | ✅ Copied |
| Configuration | ✅ Complete |
| Build Tools | ⚠️ Need to install |
| APK | ⏳ Ready to build |

## ⚙️ Required Environment Setup

Before building, you need:

1. **Java JDK 17+**
   - Download: https://adoptium.net/

2. **Android Studio**
   - Download: https://developer.android.com/studio
   - Install Android SDK, Platform Tools, Build Tools

3. **Environment Variables**
   - `JAVA_HOME` → JDK installation path
   - `ANDROID_HOME` → Android SDK path
   - `ANDROID_SDK_ROOT` → Android SDK path

See **BUILD_GUIDE.md** for detailed setup instructions.

## 🎯 Building Your First APK

Once you have the tools installed:

1. **Option 1: Use the build script**
   ```powershell
   .\build-apk.ps1
   ```
   Choose option 1 for Debug APK

2. **Option 2: Manual build**
   ```powershell
   npx cordova build android --debug
   ```

3. **Find your APK**
   ```
   platforms\android\app\build\outputs\apk\debug\app-debug.apk
   ```

4. **Install on device**
   - Enable USB Debugging on your Android phone
   - Connect via USB
   - Run: `npx cordova run android`
   - Or manually transfer and install the APK

## 📝 Updating the App

When you make changes to the web app:

1. Edit files in `../web/` directory
2. Copy to Cordova project:
   ```powershell
   Remove-Item -Path www\* -Recurse -Force
   Copy-Item -Path ..\web\* -Destination www\ -Recurse -Force
   ```
3. Rebuild:
   ```powershell
   npx cordova build android
   ```

## 🐛 Troubleshooting

### "Requirements check failed"
- Install JDK 17+ and Android Studio
- Set JAVA_HOME and ANDROID_HOME environment variables
- See BUILD_GUIDE.md section "Setup Android Development Environment"

### "Build failed"
- Run: `npx cordova requirements android` to see what's missing
- Check BUILD_GUIDE.md troubleshooting section

### "App crashes on device"
- Check logcat: `adb logcat | Select-String "CalorieAI"`
- Verify permissions are granted in device settings
- Test with demo data to rule out storage issues

## 📚 Documentation

- **BUILD_GUIDE.md** - Complete build instructions
- **config.xml** - App configuration and permissions
- **build-apk.ps1** - Build automation script
- **../README.md** - Original web app documentation

## 🎉 You're Ready!

Your CalorieAI web app is now packaged and ready to become an Android app!

**Next:** Read **BUILD_GUIDE.md** and install the required tools to build your APK.

---

**Package**: com.calorieai.app  
**Version**: 1.0.0  
**Platform**: Android 7.0+ (API 24+)  
**Cordova**: 12.0.0
