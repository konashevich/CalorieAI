# 🚀 CalorieAI Android - Quick Setup Checklist

## ✅ Phase 1: Cordova Setup (COMPLETED)

- [x] Install Node.js and npm
- [x] Install Cordova CLI globally
- [x] Create Cordova project
- [x] Add Android platform
- [x] Install required plugins:
  - [x] cordova-plugin-media-capture
  - [x] cordova-plugin-file
  - [x] cordova-plugin-camera
  - [x] cordova-plugin-device
  - [x] cordova-plugin-network-information
- [x] Copy web files to www/ folder
- [x] Configure config.xml with permissions
- [x] Create Cordova integration module
- [x] Create build scripts and documentation

## ⏳ Phase 2: Android Build Tools (TODO)

### Step 1: Install Java JDK
- [ ] Download JDK 17 or later from: https://adoptium.net/
- [ ] Install JDK (remember installation path)
- [ ] Verify: `java -version` in terminal

### Step 2: Install Android Studio
- [ ] Download from: https://developer.android.com/studio
- [ ] Install Android Studio
- [ ] Complete setup wizard
- [ ] Install SDK components:
  - [ ] Android SDK Platform 35
  - [ ] Android SDK Build-Tools
  - [ ] Android SDK Platform-Tools
  - [ ] Android SDK Command-line Tools

### Step 3: Set Environment Variables
- [ ] Open System Environment Variables (Control Panel → System → Advanced)
- [ ] Add JAVA_HOME (e.g., `C:\Program Files\Java\jdk-17`)
- [ ] Add ANDROID_HOME (e.g., `C:\Users\YourName\AppData\Local\Android\Sdk`)
- [ ] Add ANDROID_SDK_ROOT (same as ANDROID_HOME)
- [ ] Add to PATH:
  - [ ] `%ANDROID_HOME%\platform-tools`
  - [ ] `%ANDROID_HOME%\cmdline-tools\latest\bin`
  - [ ] `%ANDROID_HOME%\tools`
- [ ] Restart PowerShell/Terminal

### Step 4: Verify Installation
- [ ] Run: `npx cordova requirements android`
- [ ] All checks should show "installed" ✅

## 🏗️ Phase 3: Build APK

### Debug APK (for testing)
- [ ] Run build script: `.\build-apk.ps1`
- [ ] Choose option 1 (Debug APK)
- [ ] Wait for build to complete
- [ ] Find APK at: `platforms\android\app\build\outputs\apk\debug\app-debug.apk`

### Install on Device
- [ ] Enable Developer Options on Android device
- [ ] Enable USB Debugging
- [ ] Connect device via USB
- [ ] Run: `npx cordova run android`

## 🧪 Phase 4: Testing

### Permissions Test
- [ ] App requests microphone permission
- [ ] App requests camera permission
- [ ] Permissions can be granted

### Feature Test
- [ ] App opens successfully
- [ ] Navigation tabs work (Record, Processed, Cook, Eat)
- [ ] Audio recording works
- [ ] Camera opens for scanning
- [ ] Data persists after closing app
- [ ] Network status detected
- [ ] Back button works correctly
- [ ] App resumes properly after being minimized

### Offline Test
- [ ] Turn on Airplane mode
- [ ] App still works
- [ ] Can record audio offline
- [ ] Can view existing data
- [ ] Offline indicator shows

## 🎨 Phase 5: Polish (Optional)

### Icons
- [ ] Create proper PNG icons (not just SVG)
- [ ] Add icons for all densities (ldpi, mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)

### Splash Screen
- [ ] Create splash screen image
- [ ] Configure splash screen in config.xml

### Signing (for release)
- [ ] Create keystore: `keytool -genkey ...`
- [ ] Create build.json with keystore info
- [ ] Build signed release APK

## 📱 Phase 6: Distribution

### Testing Distribution
- [ ] Share APK file for testing
- [ ] Install on multiple devices
- [ ] Test on different Android versions

### Google Play Store (if applicable)
- [ ] Create developer account
- [ ] Prepare store listing (description, screenshots)
- [ ] Upload signed APK
- [ ] Submit for review

## 🔧 Troubleshooting Checklist

If build fails:
- [ ] Check all environment variables are set
- [ ] Restart terminal/PowerShell
- [ ] Run: `npx cordova requirements android`
- [ ] Try clean build: `.\build-apk.ps1` → option 3
- [ ] Check BUILD_GUIDE.md troubleshooting section

If app crashes:
- [ ] Check Android Logcat: `adb logcat | Select-String "CalorieAI"`
- [ ] Verify permissions in device settings
- [ ] Check cordova.js is loading
- [ ] Test with demo data

## 📚 Documentation Reference

- **README.md** - Project overview
- **BUILD_GUIDE.md** - Detailed build instructions
- **build-apk.ps1** - Automated build script
- **config.xml** - App configuration
- **../README.md** - Original web app docs

## 🎯 Current Status

**YOU ARE HERE** → Phase 2: Need to install Android build tools

**NEXT STEPS:**
1. Install JDK 17+
2. Install Android Studio
3. Set environment variables
4. Run: `npx cordova requirements android` to verify
5. Build your first APK!

## ⚡ Quick Commands

```powershell
# Check what's needed
npx cordova requirements android

# Build debug APK
npx cordova build android --debug

# Install on device
npx cordova run android

# View logs
adb logcat | Select-String "CalorieAI"

# List plugins
npx cordova plugin list
```

---

**Ready to continue?** → Start with Phase 2: Install Android Build Tools

See **BUILD_GUIDE.md** for detailed step-by-step instructions!
