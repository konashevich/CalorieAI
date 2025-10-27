# GitHub Actions - Automated APK Build Setup

## 🎯 Overview

Your CalorieAI project now has **automated APK building** via GitHub Actions! Every time you push code to GitHub, the APK will be built automatically in the cloud.

---

## ✅ What's Been Set Up

### 1. **Debug APK Workflow** (`.github/workflows/build-android-apk.yml`)
- **Triggers on**: Push to `main` or `develop` branches
- **Builds**: Unsigned debug APK for testing
- **Duration**: ~5-10 minutes per build
- **Output**: Debug APK available in Actions artifacts

### 2. **Release APK Workflow** (`.github/workflows/build-release-apk.yml`)
- **Triggers on**: Git tags (e.g., `v1.0.0`)
- **Builds**: Signed release APK (if keystore configured)
- **Duration**: ~5-10 minutes per build
- **Output**: APK attached to GitHub Release

---

## 🚀 How to Use

### **Building Debug APK (Testing)**

Simply push your code to GitHub:

```bash
git add .
git commit -m "Update app"
git push origin main
```

**That's it!** GitHub Actions will automatically:
1. Set up Android build environment
2. Install Node.js, JDK, and Android SDK
3. Copy latest web files to Cordova
4. Build debug APK
5. Upload APK as artifact

### **Downloading Your APK**

1. Go to your GitHub repository
2. Click **Actions** tab
3. Click on the latest workflow run
4. Scroll down to **Artifacts**
5. Download `CalorieAI-debug-XXXXXXX.zip`
6. Extract and install the APK on your Android device

---

## 📦 Building Release APK

### **Option 1: Without Signing (Simple)**

Just create a version tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This will build an **unsigned release APK** that you can sign manually later.

### **Option 2: With Automatic Signing (Recommended)**

#### Step 1: Create a Keystore (One-Time Setup)

On your local machine:

```bash
keytool -genkey -v -keystore release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias calorieai
```

Answer the prompts:
- **Keystore password**: Choose a strong password (save it!)
- **Key password**: Can be same as keystore password
- **Name, Organization, etc.**: Fill in your details

**⚠️ IMPORTANT**: Keep this keystore file safe! You'll need it for all future updates.

#### Step 2: Convert Keystore to Base64

```bash
# On Windows PowerShell:
[Convert]::ToBase64String([IO.File]::ReadAllBytes("release-key.jks")) | Set-Clipboard

# On Linux/Mac:
base64 -w 0 release-key.jks | pbcopy  # Mac
base64 -w 0 release-key.jks | xclip   # Linux
```

#### Step 3: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add these secrets:

| Secret Name | Value | Example |
|------------|-------|---------|
| `ANDROID_KEYSTORE_BASE64` | Base64 string from Step 2 | MIIKfAIBA... |
| `ANDROID_KEYSTORE_PASSWORD` | Your keystore password | MySecurePass123 |
| `ANDROID_KEY_ALIAS` | Your key alias | calorieai |
| `ANDROID_KEY_PASSWORD` | Your key password | MySecurePass123 |

#### Step 4: Create Release

```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions will:
1. Build the APK
2. Sign it with your keystore
3. Create a GitHub Release
4. Attach the signed APK

---

## 🔄 Manual Trigger

You can also trigger builds manually without pushing code:

1. Go to **Actions** tab on GitHub
2. Select **Build Android APK** workflow
3. Click **Run workflow**
4. Choose branch and click **Run workflow**

---

## 📊 Workflow Features

### **Debug APK Workflow**
✅ Automatic build on code push  
✅ Copies latest web files automatically  
✅ Builds debug APK (no signing needed)  
✅ Uploads APK to GitHub artifacts  
✅ Retains APK for 30 days  
✅ Comments on Pull Requests with build info  

### **Release APK Workflow**
✅ Triggered by version tags  
✅ Optional automatic signing  
✅ Creates GitHub Release  
✅ Attaches APK to release  
✅ Retains APK for 90 days  
✅ Can be triggered manually  

---

## 🛠️ Workflow Configuration

### **Triggers**

**Debug APK builds on**:
- Push to `main` branch
- Push to `develop` branch
- Changes in `calorieai-android/` folder
- Changes in `web/` folder
- Manual trigger

**Release APK builds on**:
- Git tags matching `v*.*.*` pattern
- Manual trigger

### **Build Environment**

- **OS**: Ubuntu Latest
- **Node.js**: v20
- **JDK**: 17 (Temurin)
- **Android SDK**: Latest
- **Cordova**: Latest

---

## 📝 Customization

### **Change Trigger Branches**

Edit `.github/workflows/build-android-apk.yml`:

```yaml
on:
  push:
    branches: [ main, develop, feature/android ]  # Add more branches
```

### **Change APK Retention**

```yaml
- name: Upload Debug APK
  uses: actions/upload-artifact@v4
  with:
    retention-days: 60  # Change from 30 to 60 days
```

### **Add Build Notifications**

You can add Slack, Discord, or email notifications by adding steps to the workflow.

---

## 🔍 Monitoring Builds

### **Check Build Status**

1. Go to **Actions** tab
2. See all workflow runs
3. Green checkmark = Success
4. Red X = Failed (click to see logs)

### **View Build Logs**

1. Click on a workflow run
2. Click on **Build Android APK** job
3. Expand steps to see detailed logs

### **Common Issues**

**Build fails with "No space left on device"**
- GitHub runners have limited space
- Usually resolves on retry

**Build fails with Gradle errors**
- Check the logs for specific error
- Often related to dependency issues
- Retry usually works

---

## 📱 Installing APK on Device

### **From Artifacts**

1. Download APK from GitHub Actions
2. Transfer to Android device
3. Enable "Install from Unknown Sources"
4. Tap APK to install

### **From Release**

1. Go to **Releases** page
2. Download APK from latest release
3. Install on device

---

## 🔒 Security Notes

### **Secrets Safety**
- ✅ GitHub Secrets are encrypted
- ✅ Never exposed in logs
- ✅ Only accessible to workflows
- ✅ Can't be read after creation

### **Keystore Safety**
- ⚠️ Keep `release-key.jks` file secure
- ⚠️ Backup keystore safely
- ⚠️ Never commit keystore to repository
- ⚠️ You need same keystore to update app

### **.gitignore Protection**

Make sure these are in `.gitignore`:

```gitignore
*.jks
*.keystore
build.json
release-key.*
```

---

## 📊 Build Statistics

### **Typical Build Times**
- Debug APK: 5-7 minutes
- Release APK: 6-8 minutes
- First build: 8-10 minutes (downloads dependencies)

### **APK Sizes**
- Debug APK: ~15-20 MB
- Release APK (unsigned): ~10-15 MB
- Release APK (signed): ~10-15 MB

---

## 🎯 Quick Reference

### **Push Code → Get Debug APK**
```bash
git add .
git commit -m "Your message"
git push
# Wait 5-10 minutes
# Download APK from Actions artifacts
```

### **Create Release → Get Signed APK**
```bash
git tag v1.0.0
git push origin v1.0.0
# Wait 5-10 minutes
# APK available in Releases
```

### **Manual Build**
1. Go to Actions tab
2. Click "Run workflow"
3. Wait 5-10 minutes
4. Download from artifacts

---

## ✅ What Happens Next

Every time you push code:

1. **GitHub Actions triggers** 🚀
2. **Sets up build environment** (Node.js, JDK, Android SDK)
3. **Installs Cordova** and dependencies
4. **Copies web files** to Cordova project
5. **Builds APK** for Android
6. **Uploads APK** to artifacts
7. **You get notified** (if enabled)
8. **Download and test** on your device!

---

## 🎉 Benefits

✅ **No local Android Studio needed** - Builds in the cloud  
✅ **Automatic builds** - Push code, get APK  
✅ **Consistent environment** - Same build every time  
✅ **Version history** - All APKs saved in artifacts  
✅ **Easy sharing** - Send artifact link to testers  
✅ **Free for public repos** - GitHub Actions included  

---

## 📞 Troubleshooting

### **Build Failed**
1. Check the Actions logs
2. Look for red error messages
3. Common issues:
   - Gradle dependency errors (retry)
   - Out of space (retry)
   - Configuration errors (fix and push)

### **Can't Download APK**
1. Make sure build succeeded (green checkmark)
2. Scroll to artifacts section
3. Click to download ZIP file
4. Extract APK from ZIP

### **APK Won't Install**
1. Enable "Install from Unknown Sources"
2. Check Android version (need 7.0+)
3. Try debug APK first (easier to install)

---

## 🔄 Updating Web Files

The workflow automatically copies your latest web files before building:

```yaml
- name: Copy latest web files to Cordova
  run: |
    rm -rf calorieai-android/www/*
    cp -r web/* calorieai-android/www/
```

So just update files in the `web/` folder and push!

---

## 📚 Additional Resources

- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Cordova Build Docs**: https://cordova.apache.org/docs/en/latest/guide/cli/
- **Android Signing Docs**: https://developer.android.com/studio/publish/app-signing

---

**Setup Complete!** 🎉

Your CalorieAI app will now build automatically on every push to GitHub. No local Android Studio required!

**Next Steps**:
1. Push your code to GitHub
2. Watch the Actions tab for build progress
3. Download APK from artifacts
4. Install and test on Android device
5. Report any issues and iterate!
