@echo off
setlocal

REM build-apk-java.cmd
REM Usage: build-apk-java.cmd [17|21]
REM Sets JAVA_HOME for this build only (does not affect Android Studio or system),
REM ensures ANDROID_SDK_ROOT if missing, then runs the PowerShell build menu.

set "JAVA_MAJOR=%~1"
if "%JAVA_MAJOR%"=="" set "JAVA_MAJOR=17"

REM Try to resolve a JDK installation matching the requested major version.
set "JAVA_CAND="
set "JDK_BASE1=C:\Program Files\Java"
set "JDK_BASE2=C:\Program Files\Eclipse Adoptium"

for /f "delims=" %%D in ('dir /b /ad /o-n "%JDK_BASE1%\jdk-%JAVA_MAJOR%*" 2^>NUL') do if not defined JAVA_CAND set "JAVA_CAND=%JDK_BASE1%\%%D"
if not defined JAVA_CAND for /f "delims=" %%D in ('dir /b /ad /o-n "%JDK_BASE2%\jdk-%JAVA_MAJOR%*" 2^>NUL') do if not defined JAVA_CAND set "JAVA_CAND=%JDK_BASE2%\%%D"

if not defined JAVA_CAND (
  echo Could not auto-detect JDK %JAVA_MAJOR% under:
  echo   %JDK_BASE1%\jdk-%JAVA_MAJOR%*
  echo   %JDK_BASE2%\jdk-%JAVA_MAJOR%*
  echo.
  echo Edit this file to hardcode your JDK path, e.g.:
  echo   set "JAVA_CAND=C:\Program Files\Java\jdk-%JAVA_MAJOR%"
  echo.
  goto CONTINUE
)

set "JAVA_HOME=%JAVA_CAND%"
set "PATH=%JAVA_HOME%\bin;%PATH%"

:CONTINUE

REM Set ANDROID_SDK_ROOT if not set; prefer the standard user location.
if not defined ANDROID_SDK_ROOT (
  set "_DEFAULT_SDK=%USERPROFILE%\AppData\Local\Android\Sdk"
  if exist "%_DEFAULT_SDK%" set "ANDROID_SDK_ROOT=%_DEFAULT_SDK%"
)
if not defined ANDROID_HOME set "ANDROID_HOME=%ANDROID_SDK_ROOT%"

REM Add common SDK tools to PATH for this session.
if defined ANDROID_SDK_ROOT (
  set "PATH=%ANDROID_SDK_ROOT%\platform-tools;%ANDROID_SDK_ROOT%\emulator;%ANDROID_SDK_ROOT%\cmdline-tools\latest\bin;%PATH%"
)

REM Show what we’re using this run.
where java >NUL 2>&1 && for /f "delims=" %%J in ('java -version 2^>^&1 ^| findstr /c:"version"') do echo Using %%J
if defined JAVA_HOME echo JAVA_HOME=%JAVA_HOME%
if defined ANDROID_SDK_ROOT echo ANDROID_SDK_ROOT=%ANDROID_SDK_ROOT%

REM Run the PowerShell build menu.
set "SCRIPT_DIR=%~dp0"
cd /d "%SCRIPT_DIR%"
powershell -ExecutionPolicy Bypass -NoProfile -File "%SCRIPT_DIR%build-apk.ps1"

endlocal
