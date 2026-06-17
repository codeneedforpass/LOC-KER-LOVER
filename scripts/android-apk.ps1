# Build Android debug APK (Windows)
# Requires: Android SDK at %LOCALAPPDATA%\Android\Sdk, JDK 21 at %LOCALAPPDATA%\jdk-21

$ErrorActionPreference = "Stop"

$jdk = "$env:LOCALAPPDATA\jdk-21"
$sdk = "$env:LOCALAPPDATA\Android\Sdk"

if (-not (Test-Path "$jdk\bin\java.exe")) {
  Write-Error "JDK 21 not found at $jdk. Run README Android section setup first."
}

$env:JAVA_HOME = $jdk
$env:ANDROID_HOME = $sdk
$env:PATH = "$jdk\bin;$sdk\platform-tools;$env:PATH"

Push-Location $PSScriptRoot\..
npm run build
npx cap sync android
Push-Location android
.\gradlew.bat assembleDebug
Pop-Location
Copy-Item "android\app\build\outputs\apk\debug\app-debug.apk" "Loc-Ker-Lover-debug.apk" -Force
Write-Host "APK ready: $(Resolve-Path Loc-Ker-Lover-debug.apk)"
Pop-Location
