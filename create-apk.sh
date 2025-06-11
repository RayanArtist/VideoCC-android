#!/bin/bash

echo "Building Video CC APK..."

# Build the web assets first
npm run build

# Sync with Capacitor
npx cap sync android

# Navigate to android directory
cd android

# Clean previous builds
./gradlew clean

# Build the APK
./gradlew assembleDebug

echo "APK build completed!"
ls -la app/build/outputs/apk/debug/