# 🚀 Quick Start - GitHub Actions APK Build

## ✅ Setup Complete!

Your CalorieAI project now builds APK automatically via GitHub Actions!

---

## 📋 What to Do Now

### **Step 1: Commit and Push the GitHub Actions Files**

```bash
# Make sure you're in the CalorieAI directory
cd c:\Users\akona\OneDrive\Dev\CalorieAI

# Add all files
git add .

# Commit
git commit -m "Add GitHub Actions for automated APK build"

# Push to GitHub
git push origin main
```

### **Step 2: Watch the Build**

1. Go to your GitHub repository: https://github.com/konashevich/CalorieAI
2. Click the **Actions** tab
3. You'll see "Build Android APK" workflow running
4. Click on it to watch the build progress (takes ~5-10 minutes)

### **Step 3: Download Your APK**

Once the build completes (green checkmark):

1. Scroll down to the **Artifacts** section
2. Click on `CalorieAI-debug-XXXXXXX`
3. Download the ZIP file
4. Extract the APK file
5. Transfer to your Android device and install!

---

## 🎯 How It Works

**Every time you push code to GitHub:**
1. ✅ GitHub Actions automatically starts
2. ✅ Sets up Android build environment (Node.js, JDK, Android SDK)
3. ✅ Copies your latest `web/` files to `calorieai-android/www/`
4. ✅ Builds the APK
5. ✅ Uploads APK to artifacts (available for 30 days)

**No Android Studio needed!** Everything builds in the cloud.

---

## 📱 Installing APK on Your Device

### **Method 1: Via USB**
1. Download APK from GitHub artifacts
2. Connect Android device to PC
3. Copy APK to device
4. Open file manager on device
5. Tap APK file
6. Allow "Install from Unknown Sources" if prompted
7. Install!

### **Method 2: Direct Download**
1. Download APK from GitHub on your phone's browser
2. Open Downloads folder
3. Tap APK file
4. Allow "Install from Unknown Sources" if prompted
5. Install!

---

## 🔄 Workflow Triggers

### **Automatic Builds (Debug APK)**

These actions will trigger an APK build:

```bash
# Any push to main or develop branch
git push origin main
git push origin develop

# Any change in web/ or calorieai-android/ folders
```

### **Release Builds (Signed APK)**

Create a version tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This creates a GitHub Release with the APK attached!

### **Manual Build**

Don't want to push code? Build manually:

1. Go to GitHub → Actions tab
2. Click "Build Android APK" workflow
3. Click "Run workflow" button
4. Select branch
5. Click "Run workflow"

---

## 📊 Build Status

Check build status at:
https://github.com/konashevich/CalorieAI/actions

- ✅ Green checkmark = Build succeeded, APK ready!
- 🟡 Yellow circle = Build in progress
- ❌ Red X = Build failed, check logs

---

## 🎨 Typical Workflow

### **Development Cycle:**

```bash
# 1. Make changes to web app
code web/index.html

# 2. Test locally (optional)
cd web
python -m http.server 8000

# 3. Commit and push
git add .
git commit -m "Add new feature"
git push

# 4. Wait ~5 minutes for build
# 5. Download APK from Actions artifacts
# 6. Install and test on device
# 7. Repeat!
```

### **Creating a Release:**

```bash
# 1. Update version in config.xml
# 2. Update CHANGELOG.md
# 3. Commit changes
git add .
git commit -m "Release v1.0.0"
git push

# 4. Create and push tag
git tag v1.0.0
git push origin v1.0.0

# 5. Check Releases page for APK
# https://github.com/konashevich/CalorieAI/releases
```

---

## 🔧 Customization

### **Change Which Branches Trigger Builds**

Edit `.github/workflows/build-android-apk.yml`:

```yaml
on:
  push:
    branches: [ main, develop, feature/my-branch ]  # Add your branches
```

### **Change APK Retention Time**

```yaml
with:
  retention-days: 60  # Change from 30 to 60 days
```

### **Add Email Notifications**

Add this step to the workflow:

```yaml
- name: Send Email on Success
  if: success()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: "✅ APK Build Successful!"
    to: your-email@example.com
    from: GitHub Actions
    body: "Your CalorieAI APK is ready to download!"
```

---

## 🐛 Troubleshooting

### **Build Failed**

Check the logs:
1. Go to Actions tab
2. Click failed workflow
3. Click "Build Android APK" job
4. Read the red error messages

Common fixes:
- **Gradle error**: Usually fixes itself on retry
- **Out of space**: Retry the workflow
- **Syntax error in config.xml**: Fix and push again

### **Can't Find APK**

Make sure:
1. Build succeeded (green checkmark)
2. Scroll all the way down to "Artifacts"
3. Click the artifact name to download
4. It downloads as a ZIP - extract it!

### **APK Won't Install**

1. Enable "Install from Unknown Sources" in Android settings
2. Make sure Android version is 7.0 or higher
3. Try uninstalling old version first
4. Use debug APK (easier to install than release)

---

## 📚 Documentation

- **Full Guide**: `.github/GITHUB_ACTIONS_SETUP.md`
- **Build Guide**: `calorieai-android/BUILD_GUIDE.md`
- **Review**: `REVIEW_SUMMARY.md`

---

## 🎉 Benefits

✅ **No Android Studio needed** - Builds in GitHub's cloud  
✅ **Automatic builds** - Push code, get APK  
✅ **Free** - GitHub Actions free for public repos  
✅ **Fast** - 5-10 minute builds  
✅ **Reliable** - Same environment every time  
✅ **Easy sharing** - Share artifact link with testers  
✅ **Version history** - All builds saved for 30 days  

---

## ⚡ Quick Commands

```bash
# Push and build APK
git add . && git commit -m "Update" && git push

# Create release
git tag v1.0.0 && git push origin v1.0.0

# Check build status
# Visit: https://github.com/konashevich/CalorieAI/actions
```

---

## 🎯 What You Get

After each push:
- ✅ Debug APK (unsigned, for testing)
- ✅ Available in Actions artifacts
- ✅ Retained for 30 days
- ✅ ~10-15 MB file size
- ✅ Installable on any Android 7.0+ device

After each release tag:
- ✅ Release APK (can be signed)
- ✅ Attached to GitHub Release
- ✅ Retained for 90 days
- ✅ Includes release notes
- ✅ Public download link

---

## ✅ You're All Set!

**Next action**: Push your code to GitHub and watch the magic happen!

```bash
git add .
git commit -m "🚀 Setup GitHub Actions for APK build"
git push origin main
```

Then go to: https://github.com/konashevich/CalorieAI/actions

Your APK will be ready in ~5-10 minutes! 🎉
