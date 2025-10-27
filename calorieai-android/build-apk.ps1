# CalorieAI Android APK Build Script
# This script builds the Android APK for CalorieAI

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CalorieAI Android APK Build Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "config.xml")) {
    Write-Host "Error: config.xml not found. Please run this script from the calorieai-android directory." -ForegroundColor Red
    exit 1
}

# Menu
Write-Host "Select build type:" -ForegroundColor Yellow
Write-Host "1. Debug APK (unsigned, for testing)"
Write-Host "2. Release APK (requires keystore)"
Write-Host "3. Clean build (removes platform and reinstalls)"
Write-Host "4. Check requirements"
Write-Host "5. Exit"
Write-Host ""

$choice = Read-Host "Enter your choice (1-5)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Building DEBUG APK..." -ForegroundColor Green
        Write-Host ""
        
        # Build debug APK
        npx cordova build android --debug
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "DEBUG APK BUILD SUCCESSFUL!" -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "APK Location:" -ForegroundColor Yellow
            Write-Host "platforms\android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "You can install this APK on your Android device for testing." -ForegroundColor Yellow
            Write-Host "Enable 'Install from Unknown Sources' in your device settings." -ForegroundColor Yellow
        } else {
            Write-Host ""
            Write-Host "Build failed! Check the error messages above." -ForegroundColor Red
        }
    }
    
    "2" {
        Write-Host ""
        Write-Host "Building RELEASE APK..." -ForegroundColor Green
        Write-Host ""
        Write-Host "Note: You need a keystore file to sign the release APK." -ForegroundColor Yellow
        Write-Host "If you don't have one, choose option 1 for debug APK first." -ForegroundColor Yellow
        Write-Host ""
        
        $proceed = Read-Host "Do you have a keystore ready? (y/n)"
        
        if ($proceed -eq "y" -or $proceed -eq "Y") {
            # Build release APK
            npx cordova build android --release
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host ""
                Write-Host "========================================" -ForegroundColor Green
                Write-Host "RELEASE APK BUILD SUCCESSFUL!" -ForegroundColor Green
                Write-Host "========================================" -ForegroundColor Green
                Write-Host ""
                Write-Host "Unsigned APK Location:" -ForegroundColor Yellow
                Write-Host "platforms\android\app\build\outputs\apk\release\app-release-unsigned.apk" -ForegroundColor Cyan
                Write-Host ""
                Write-Host "You need to sign this APK before distributing it." -ForegroundColor Yellow
                Write-Host "See the BUILD_GUIDE.md for signing instructions." -ForegroundColor Yellow
            } else {
                Write-Host ""
                Write-Host "Build failed! Check the error messages above." -ForegroundColor Red
            }
        } else {
            Write-Host "Build cancelled." -ForegroundColor Yellow
        }
    }
    
    "3" {
        Write-Host ""
        Write-Host "Cleaning build..." -ForegroundColor Green
        Write-Host ""
        
        # Remove platforms
        if (Test-Path "platforms\android") {
            Write-Host "Removing Android platform..." -ForegroundColor Yellow
            npx cordova platform remove android
        }
        
        # Re-add platform
        Write-Host "Re-adding Android platform..." -ForegroundColor Yellow
        npx cordova platform add android
        
        Write-Host ""
        Write-Host "Clean complete! You can now build the APK." -ForegroundColor Green
    }
    
    "4" {
        Write-Host ""
        Write-Host "Checking build requirements..." -ForegroundColor Green
        Write-Host ""
        
        # Check Cordova
        Write-Host "Checking Cordova..." -ForegroundColor Yellow
        npx cordova --version
        
        # Check Android requirements
        Write-Host ""
        Write-Host "Checking Android requirements..." -ForegroundColor Yellow
        npx cordova requirements android
        
        Write-Host ""
        Write-Host "If you see errors above, you may need to install:" -ForegroundColor Yellow
        Write-Host "- Android Studio (https://developer.android.com/studio)" -ForegroundColor Cyan
        Write-Host "- Java Development Kit (JDK 17 or later)" -ForegroundColor Cyan
        Write-Host "- Gradle (usually included with Android Studio)" -ForegroundColor Cyan
    }
    
    "5" {
        Write-Host "Exiting..." -ForegroundColor Yellow
        exit 0
    }
    
    default {
        Write-Host "Invalid choice. Exiting..." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
