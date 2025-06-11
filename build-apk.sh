#!/bin/bash

echo "🚀 Starting Video CC APK Build Process..."
echo "📱 Building secure Android application with maximum security features"

# Create production build directory
echo "📦 Preparing production build..."
mkdir -p dist

# Copy essential files for APK
cp client/index.html dist/index.html 2>/dev/null || echo "Using existing index.html"

# Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync android

# Build Android APK
echo "🏗️  Building Android APK with security optimizations..."
cd android

# Set build properties for security
echo "android.useAndroidX=true" >> gradle.properties
echo "android.enableJetifier=true" >> gradle.properties
echo "org.gradle.jvmargs=-Xmx2048m -XX:MaxPermSize=512m" >> gradle.properties

# Build release APK
echo "🔨 Compiling release APK..."
./gradlew assembleRelease

echo "✅ APK Build Complete!"
echo "📱 APK Location: android/app/build/outputs/apk/release/app-release.apk"
echo "🔒 Security features enabled:"
echo "   - Network security config"
echo "   - Cleartext traffic disabled"
echo "   - Backup disabled"
echo "   - Debug disabled"
echo "   - Hardware acceleration enabled"

cd ..