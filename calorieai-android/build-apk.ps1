# CalorieAI Android APK Build Script
# Builds the Android APK for CalorieAI with environment checks, setup, and optional web sync

# ---------------------------
# Styling helpers
# ---------------------------
function Write-Title($text) { Write-Host "`n========================================" -ForegroundColor Cyan; Write-Host $text -ForegroundColor Cyan; Write-Host "========================================`n" -ForegroundColor Cyan }
function Write-Ok($text)    { Write-Host "[OK] $text" -ForegroundColor Green }
function Write-Info($text)  { Write-Host "$text" -ForegroundColor Yellow }
function Write-Err($text)   { Write-Host "[ERROR] $text" -ForegroundColor Red }

# ---------------------------
# Utility helpers
# ---------------------------
function Assert-InProjectRoot {
    if (-not (Test-Path "config.xml")) {
        Write-Err "config.xml not found. Run this script from the calorieai-android directory."
        exit 1
    }
}

function Test-CommandExists($name) { return $null -ne (Get-Command $name -ErrorAction SilentlyContinue) }

function Run-Cmd($command, [switch]$IgnoreExitCode) {
    Write-Info "> $command"
    & cmd.exe /c $command
    $code = $LASTEXITCODE
    if (-not $IgnoreExitCode -and $code -ne 0) { throw "Command failed ($code): $command" }
}

function Ensure-Npm {
    if (-not (Test-CommandExists node)) { throw "Node.js is not installed or not in PATH." }
    if (-not (Test-CommandExists npm))  { throw "npm is not installed or not in PATH." }
    if (-not (Test-CommandExists npx))  { throw "npx is not available (npm missing)." }
    Write-Ok "Node.js, npm, and npx detected"
}

function Ensure-NpmPackages {
    $needsInstall = -not (Test-Path "node_modules")
    if (-not $needsInstall) {
        try {
            $lock = Get-Item "package-lock.json" -ErrorAction Stop
            $mods = Get-Item "node_modules" -ErrorAction Stop
            if ($lock.LastWriteTime -gt $mods.LastWriteTime) { $needsInstall = $true }
        } catch { $needsInstall = $true }
    }
    if ($needsInstall) {
        if (Test-Path "package-lock.json") {
            Write-Info "Installing npm dependencies (npm ci)..."
            Run-Cmd "npm ci"
        } else {
            Write-Info "Installing npm dependencies (npm install)..."
            Run-Cmd "npm install"
        }
        Write-Ok "npm dependencies installed"
    } else {
        Write-Ok "npm dependencies already installed"
    }
}

function Ensure-CordovaCLI {
    Write-Info "Checking Cordova CLI via npx..."
    & npx --yes cordova --version | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Cordova CLI not available via npx. Ensure devDependencies include 'cordova'." }
    Write-Ok "Cordova CLI available"
}

function Ensure-AndroidPlatform {
    if (Test-Path "platforms\android\app\build.gradle") { Write-Ok "Android platform already present"; return }
    Write-Info "Adding Android platform (cordova-android)..."
    Run-Cmd "npx cordova platform add android"
    Write-Ok "Android platform added"
}

function Sync-WebFilesIfPresent {
    try {
        $parent = Resolve-Path ".." -ErrorAction Stop
        $webPath = Join-Path $parent.Path "web"
        if (Test-Path "$webPath\index.html") {
            Write-Info "Syncing web files from ../web to ./www ..."
            try {
                if (Test-Path "www") { Remove-Item -Path "www\*" -Recurse -Force -ErrorAction SilentlyContinue }
                Copy-Item -Path "$webPath\*" -Destination "www\" -Recurse -Force
                Write-Ok "Web files synced"
            } catch { Write-Err "Failed to sync web files: $($_.Exception.Message)" }
        } else {
            Write-Info "No ../web folder with index.html found; skipping web sync"
        }
    } catch { Write-Info "Parent directory not resolvable; skipping web sync" }
}

function Ensure-Prepare {
    Write-Info "Preparing Cordova project (plugins, www, Android resources)..."
    Run-Cmd "npx cordova prepare android"
    Write-Ok "Cordova prepare complete"
}

function Show-EnvHints {
    Write-Host "`nEnvironment hints:" -ForegroundColor DarkCyan
    Write-Host "- JAVA_HOME: $env:JAVA_HOME"
    Write-Host "- ANDROID_HOME: $env:ANDROID_HOME"
    Write-Host "- ANDROID_SDK_ROOT: $env:ANDROID_SDK_ROOT"
}

function Run-RequirementsCheck {
    Write-Info "Checking Cordova/Android requirements..."
    & npx cordova requirements android
    Write-Host "`nIf any items show as missing, install or configure them and re-run." -ForegroundColor Yellow
    Show-EnvHints
}

function Preflight {
    Assert-InProjectRoot
    Ensure-Npm
    Ensure-NpmPackages
    Ensure-CordovaCLI
    Ensure-AndroidPlatform
    Sync-WebFilesIfPresent
    Ensure-Prepare
}

function Build-Debug {
    Write-Info "Building DEBUG APK..."
    Run-Cmd "npx cordova build android --debug"
    $apk = "platforms\android\app\build\outputs\apk\debug\app-debug.apk"
    if (Test-Path $apk) {
        Write-Title "DEBUG APK BUILD SUCCESSFUL!"
        Write-Info "APK Location:"
        Write-Host $apk -ForegroundColor Cyan
        Write-Host "Install on device for testing. Enable 'Install from Unknown Sources' on your device." -ForegroundColor Yellow
    } else { throw "Build completed but APK not found at expected path: $apk" }
}

function Build-Release {
    Write-Info "Building RELEASE APK..."
    Write-Host "Note: For a signed release, create build.json with keystore details (see BUILD_GUIDE.md)." -ForegroundColor Yellow
    Run-Cmd "npx cordova build android --release"
    $unsigned = "platforms\android\app\build\outputs\apk\release\app-release-unsigned.apk"
    $signed   = "platforms\android\app\build\outputs\apk\release\app-release.apk"
    if (Test-Path $signed) {
        Write-Title "SIGNED RELEASE APK BUILD SUCCESSFUL!"; Write-Info "APK Location:"; Write-Host $signed -ForegroundColor Cyan
    } elseif (Test-Path $unsigned) {
        Write-Title "RELEASE APK BUILD SUCCESSFUL (UNSIGNED)!"; Write-Info "Unsigned APK Location:"; Write-Host $unsigned -ForegroundColor Cyan; Write-Host "Sign the APK before distribution. See BUILD_GUIDE.md for steps." -ForegroundColor Yellow
    } else { throw "Build completed but release APK not found at expected path." }
}

function Clean-RebuildPlatform {
    Write-Info "Cleaning Android platform..."
    if (Test-Path "platforms\android") { Run-Cmd "npx cordova platform remove android" -IgnoreExitCode }
    Ensure-AndroidPlatform
    Ensure-Prepare
    Write-Ok "Clean complete."
}

# ---------------------------
# Script start
# ---------------------------
Write-Title "CalorieAI Android APK Build Script"
Assert-InProjectRoot

Write-Host "Select build type:" -ForegroundColor Yellow
Write-Host "1. Debug APK (unsigned, for testing)"
Write-Host "2. Release APK (signed if build.json present)"
Write-Host "3. Clean build (remove and re-add Android platform)"
Write-Host "4. Check requirements"
Write-Host "5. Sync web assets (../web -> ./www)"
Write-Host "6. Exit"
Write-Host ""

$choice = Read-Host "Enter your choice (1-6)"

try {
    switch ($choice) {
        "1" { Preflight; Build-Debug }
        "2" { Preflight; Build-Release }
        "3" { Clean-RebuildPlatform }
        "4" { Run-RequirementsCheck }
        "5" { Sync-WebFilesIfPresent; Ensure-Prepare; Write-Ok "Web assets synced and prepared." }
        "6" { Write-Info "Exiting..."; exit 0 }
        default { Write-Err "Invalid choice. Exiting..."; exit 1 }
    }
    Write-Host "`nPress any key to exit..."; $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} catch {
    Write-Err $_; Write-Host "`nTip: Run option 4 to diagnose environment issues." -ForegroundColor Yellow; Show-EnvHints
    Write-Host "`nPress any key to exit..."; $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown"); exit 1
}