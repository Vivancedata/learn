# VivanceData Mobile App Release Guide

This document provides comprehensive instructions for building and releasing the VivanceData mobile apps for iOS and Android using Capacitor.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Development Workflow](#development-workflow)
4. [Building for iOS](#building-for-ios)
5. [Building for Android](#building-for-android)
6. [App Store Requirements](#app-store-requirements)
7. [Google Play Store Requirements](#google-play-store-requirements)
8. [App Icons](#app-icons)
9. [Splash Screens](#splash-screens)
10. [Deep Links Configuration](#deep-links-configuration)
11. [Push Notifications](#push-notifications)
12. [Privacy Policy](#privacy-policy)
13. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### For iOS Development

- macOS (required for iOS development)
- Xcode 15.0 or later
- Xcode Command Line Tools: `xcode-select --install`
- Apple Developer Account ($99/year for App Store distribution)
- CocoaPods: `sudo gem install cocoapods`

### For Android Development

- Android Studio (latest stable version)
- JDK 17 or later
- Android SDK (API 34 recommended)
- Android Emulator or physical device
- Google Play Developer Account ($25 one-time fee)

### Common Requirements

- Node.js 18+ and npm
- Git

---

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Add Native Platforms

Run these commands once to add the iOS and Android projects:

```bash
# Add iOS platform
npx cap add ios

# Add Android platform
npx cap add android
```

### 3. Build the Web App

```bash
npm run build:mobile
```

### 4. Sync Native Projects

```bash
npx cap sync
```

---

## Development Workflow

### Standard Build Cycle

```bash
# 1. Make changes to your web app

# 2. Build for mobile
npm run build:mobile

# 3. Sync to native projects
npm run cap:sync

# 4. Open in IDE
npm run cap:open:ios    # Opens Xcode
npm run cap:open:android # Opens Android Studio
```

### Live Reload Development

For faster development with live reload:

```bash
# iOS
npm run mobile:dev:ios

# Android
npm run mobile:dev:android
```

This runs the app with live reload from your development server.

### One-Command Build and Open

```bash
# iOS
npm run mobile:ios

# Android
npm run mobile:android
```

---

## Building for iOS

### Development Build

1. Open the project in Xcode:
   ```bash
   npm run cap:open:ios
   ```

2. Select your development team in Signing & Capabilities

3. Select a simulator or connected device

4. Click the Play button or press Cmd+R

### Production Build

1. In Xcode, select "Any iOS Device" as the target

2. Go to Product > Archive

3. Once archived, click "Distribute App"

4. Choose "App Store Connect" for App Store distribution

5. Follow the prompts to upload to App Store Connect

### App Store Connect

1. Log in to [App Store Connect](https://appstoreconnect.apple.com)

2. Create a new app with bundle ID: `com.vivancedata.learn`

3. Fill in app information, screenshots, and metadata

4. Submit for review

---

## Building for Android

### Development Build

1. Open the project in Android Studio:
   ```bash
   npm run cap:open:android
   ```

2. Select a device or emulator

3. Click the Run button or press Shift+F10

### Production Build (APK)

```bash
cd android
./gradlew assembleRelease
```

The APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

### Production Build (AAB for Play Store)

```bash
cd android
./gradlew bundleRelease
```

The bundle will be at: `android/app/build/outputs/bundle/release/app-release.aab`

### Signing the App

1. Generate a keystore (first time only):
   ```bash
   keytool -genkey -v -keystore vivancedata-release.keystore -alias vivancedata -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Create `android/keystore.properties`:
   ```properties
   storeFile=../vivancedata-release.keystore
   storePassword=YOUR_STORE_PASSWORD
   keyAlias=vivancedata
   keyPassword=YOUR_KEY_PASSWORD
   ```

3. Update `android/app/build.gradle` to use the keystore for release builds

### Google Play Console

1. Log in to [Google Play Console](https://play.google.com/console)

2. Create a new app

3. Upload the AAB file

4. Fill in store listing, content rating, and pricing

5. Submit for review

---

## App Store Requirements

### Screenshots Required

| Device | Size (pixels) | Quantity |
|--------|---------------|----------|
| iPhone 6.7" (Pro Max) | 1290 x 2796 | 3-10 |
| iPhone 6.5" (Plus/Max) | 1242 x 2688 | 3-10 |
| iPhone 5.5" | 1242 x 2208 | 3-10 |
| iPad Pro 12.9" (6th gen) | 2048 x 2732 | 3-10 |
| iPad Pro 12.9" (2nd gen) | 2048 x 2732 | 3-10 |

### App Store Metadata

- **App Name**: VivanceData (30 characters max)
- **Subtitle**: Learn AI & Data Science (30 characters max)
- **Description**: 4000 characters max
- **Keywords**: 100 characters, comma-separated
- **Support URL**: Required
- **Privacy Policy URL**: Required (see Privacy Policy section)
- **Category**: Education
- **Age Rating**: 4+ (or appropriate based on content)

### Required Information

- Contact information for App Review
- Demo account credentials (if login required)
- Notes for reviewers explaining app functionality

---

## Google Play Store Requirements

### Screenshots Required

| Type | Size (pixels) | Quantity |
|------|---------------|----------|
| Phone | 1080 x 1920 to 1440 x 2960 | 2-8 |
| 7" Tablet | 1200 x 1920 | 0-8 |
| 10" Tablet | 1600 x 2560 | 0-8 |

### Store Listing Assets

- **Feature Graphic**: 1024 x 500 (required)
- **App Icon**: 512 x 512 (required)
- **Promo Video**: YouTube URL (optional)

### Play Store Metadata

- **Title**: 30 characters max
- **Short Description**: 80 characters max
- **Full Description**: 4000 characters max
- **Category**: Education
- **Content Rating**: Complete questionnaire
- **Target Audience**: Complete declaration

### Required Declarations

- Data safety declaration
- App content declaration
- Advertising declaration
- Target age group

---

## App Icons

### iOS App Icon

Create icons in the following sizes and place in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`:

| Size | Scale | Filename |
|------|-------|----------|
| 20pt | 2x | Icon-App-20x20@2x.png (40x40) |
| 20pt | 3x | Icon-App-20x20@3x.png (60x60) |
| 29pt | 2x | Icon-App-29x29@2x.png (58x58) |
| 29pt | 3x | Icon-App-29x29@3x.png (87x87) |
| 40pt | 2x | Icon-App-40x40@2x.png (80x80) |
| 40pt | 3x | Icon-App-40x40@3x.png (120x120) |
| 60pt | 2x | Icon-App-60x60@2x.png (120x120) |
| 60pt | 3x | Icon-App-60x60@3x.png (180x180) |
| 1024pt | 1x | Icon-App-1024x1024@1x.png |

### Android App Icon

Create icons and place in `android/app/src/main/res/`:

| Density | Size | Folder |
|---------|------|--------|
| mdpi | 48x48 | mipmap-mdpi |
| hdpi | 72x72 | mipmap-hdpi |
| xhdpi | 96x96 | mipmap-xhdpi |
| xxhdpi | 144x144 | mipmap-xxhdpi |
| xxxhdpi | 192x192 | mipmap-xxxhdpi |

Also create adaptive icons:
- `ic_launcher_foreground.xml` - Foreground layer
- `ic_launcher_background.xml` - Background layer

### Icon Generation Tools

- [App Icon Generator](https://appicon.co/) - Generate all sizes from one image
- [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/) - Android icons
- Figma/Sketch templates

---

## Splash Screens

See `public/splash/README.md` for detailed splash screen specifications.

### Quick Setup

1. Create your splash screen images
2. Place in `public/splash/` directory
3. Run `npx cap sync` to copy to native projects
4. Configure in `capacitor.config.ts` (already done)

---

## Deep Links Configuration

### iOS Universal Links

1. Create `.well-known/apple-app-site-association` file on your server:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.vivancedata.learn",
        "paths": [
          "/course/*",
          "/courses/*",
          "/lesson/*",
          "/path/*",
          "/paths/*",
          "/assessment/*",
          "/leaderboard",
          "/profile",
          "/profile/*",
          "/settings",
          "/search"
        ]
      }
    ]
  }
}
```

2. Add Associated Domains capability in Xcode:
   - `applinks:vivancedata.com`

### Android App Links

1. Create `.well-known/assetlinks.json` file on your server:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.vivancedata.learn",
      "sha256_cert_fingerprints": ["YOUR_FINGERPRINT"]
    }
  }
]
```

2. Get your fingerprint:
```bash
keytool -list -v -keystore vivancedata-release.keystore
```

3. Verify in `android/app/src/main/AndroidManifest.xml`:
```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="https" android:host="vivancedata.com" />
</intent-filter>
```

---

## Push Notifications

### iOS Push Notifications

1. Enable Push Notifications capability in Xcode

2. Create APNs key in Apple Developer Portal:
   - Go to Certificates, Identifiers & Profiles
   - Create a new Key for Apple Push Notifications service
   - Download the .p8 file

3. Configure your push notification service with:
   - Key ID
   - Team ID
   - Bundle ID
   - .p8 key file

### Android Push Notifications (Firebase)

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)

2. Add an Android app with package name: `com.vivancedata.learn`

3. Download `google-services.json` and place in `android/app/`

4. The Capacitor Push Notifications plugin handles the rest

---

## Privacy Policy

A privacy policy is **required** for both App Store and Google Play.

### Required Disclosures

Your privacy policy must disclose:

1. **Data Collection**
   - User account information (email, name)
   - Learning progress data
   - Usage analytics
   - Device information

2. **Data Usage**
   - Personalization of learning experience
   - Progress tracking and recommendations
   - Push notifications for study reminders
   - Analytics for app improvement

3. **Data Sharing**
   - Third-party analytics (PostHog)
   - Error tracking (Sentry)
   - Payment processing (Stripe)

4. **User Rights**
   - Access to personal data
   - Data deletion requests
   - Account termination

5. **Contact Information**
   - Email for privacy inquiries
   - Data protection officer (if applicable)

### Template Location

Create your privacy policy and host it at: `https://vivancedata.com/privacy`

---

## Troubleshooting

### Common Issues

#### Build fails with "No signing certificate"

In Xcode:
1. Go to Signing & Capabilities
2. Check "Automatically manage signing"
3. Select your team

#### Android build fails with SDK version error

Update `android/variables.gradle`:
```gradle
ext {
    minSdkVersion = 22
    compileSdkVersion = 34
    targetSdkVersion = 34
}
```

#### Capacitor sync fails

```bash
# Clear and reinstall
rm -rf node_modules
rm -rf ios/App/Pods
rm -rf android/.gradle
npm install
npx cap sync
```

#### White screen on app launch

1. Check browser console for errors (Safari for iOS, Chrome for Android)
2. Verify `webDir` in `capacitor.config.ts` matches build output
3. Ensure `npm run build:mobile` completed successfully

#### Deep links not working

iOS:
- Verify Associated Domains capability is enabled
- Check apple-app-site-association is accessible
- Test: `xcrun simctl openurl booted "vivancedata://course/test"`

Android:
- Verify intent filters in AndroidManifest.xml
- Check assetlinks.json is accessible
- Test: `adb shell am start -a android.intent.action.VIEW -d "vivancedata://course/test"`

### Getting Help

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Capacitor Discord](https://ionic.link/discord)
- [Stack Overflow - Capacitor](https://stackoverflow.com/questions/tagged/capacitor)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | TBD | Initial release |

---

## Checklist for Release

### Pre-Release

- [ ] All tests passing
- [ ] Build succeeds on both platforms
- [ ] Deep links tested
- [ ] Push notifications tested
- [ ] Privacy policy published
- [ ] App icons added
- [ ] Splash screens added
- [ ] Screenshots captured

### iOS Release

- [ ] App Store Connect app created
- [ ] All metadata filled in
- [ ] Screenshots uploaded
- [ ] Build uploaded via Xcode
- [ ] TestFlight testing completed
- [ ] Submitted for review

### Android Release

- [ ] Google Play Console app created
- [ ] Store listing completed
- [ ] Content rating completed
- [ ] AAB uploaded
- [ ] Internal testing completed
- [ ] Submitted for review
