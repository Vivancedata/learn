# VivanceData Splash Screen Assets

This directory contains splash screen images for the native iOS and Android apps.

## Design Guidelines

### Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Background | `#0f172a` | Slate 900 - primary background |
| Primary | `#6366f1` | Indigo 500 - accent color |
| Text | `#f8fafc` | Slate 50 - logo text |

### Logo Placement

- Center the VivanceData logo both horizontally and vertically
- Keep the logo at approximately 40-50% of the screen width
- Maintain safe margins of at least 10% from all edges

### Design Recommendations

1. **Keep it simple** - Use only the logo on a solid background
2. **No text below logo** - App name can be part of logo
3. **Consider dark/light modes** - Create assets for both if needed
4. **Test on multiple devices** - Ensure logo doesn't get cropped

---

## iOS Splash Screens

### Storyboard Approach (Recommended)

iOS uses a LaunchScreen.storyboard for splash screens, which is more flexible than static images.

The storyboard is located at: `ios/App/App/LaunchScreen.storyboard`

To customize:
1. Open the iOS project in Xcode: `npm run cap:open:ios`
2. Navigate to LaunchScreen.storyboard
3. Modify the view with your logo and background color

### Static Image Approach (Alternative)

If using static images, create the following sizes:

| Device | Portrait | Landscape |
|--------|----------|-----------|
| iPhone SE | 640 x 1136 | 1136 x 640 |
| iPhone 8 | 750 x 1334 | 1334 x 750 |
| iPhone 8 Plus | 1242 x 2208 | 2208 x 1242 |
| iPhone X/XS/11 Pro | 1125 x 2436 | 2436 x 1125 |
| iPhone XR/11 | 828 x 1792 | 1792 x 828 |
| iPhone XS Max/11 Pro Max | 1242 x 2688 | 2688 x 1242 |
| iPhone 12 mini | 1080 x 2340 | 2340 x 1080 |
| iPhone 12/12 Pro | 1170 x 2532 | 2532 x 1170 |
| iPhone 12 Pro Max | 1284 x 2778 | 2778 x 1284 |
| iPhone 14 | 1170 x 2532 | 2532 x 1170 |
| iPhone 14 Pro | 1179 x 2556 | 2556 x 1179 |
| iPhone 14 Pro Max | 1290 x 2796 | 2796 x 1290 |
| iPhone 15/15 Pro | 1179 x 2556 | 2556 x 1179 |
| iPhone 15 Pro Max | 1290 x 2796 | 2796 x 1290 |
| iPad (9.7") | 1536 x 2048 | 2048 x 1536 |
| iPad (10.2") | 1620 x 2160 | 2160 x 1620 |
| iPad Air (10.9") | 1640 x 2360 | 2360 x 1640 |
| iPad Pro (11") | 1668 x 2388 | 2388 x 1668 |
| iPad Pro (12.9") | 2048 x 2732 | 2732 x 2048 |

---

## Android Splash Screens

### Required Drawable Sizes

Create splash screen images for each density bucket:

| Density | Size | Folder |
|---------|------|--------|
| ldpi | 240 x 320 | `drawable-ldpi` |
| mdpi | 320 x 480 | `drawable-mdpi` |
| hdpi | 480 x 800 | `drawable-hdpi` |
| xhdpi | 720 x 1280 | `drawable-xhdpi` |
| xxhdpi | 1080 x 1920 | `drawable-xxhdpi` |
| xxxhdpi | 1440 x 2560 | `drawable-xxxhdpi` |

### File Naming

All splash screen files should be named: `splash.png`

Place them in: `android/app/src/main/res/drawable-{density}/splash.png`

### 9-Patch Images (Advanced)

For more flexible scaling, use 9-patch images (`splash.9.png`) that define stretchable regions.

---

## Capacitor Configuration

The splash screen is configured in `capacitor.config.ts`:

```typescript
plugins: {
  SplashScreen: {
    launchShowDuration: 2000,        // Show for 2 seconds
    backgroundColor: '#0f172a',       // Slate 900
    showSpinner: false,              // No loading spinner
    launchAutoHide: true,            // Auto-hide after duration
    launchFadeOutDuration: 300,      // Fade out animation
  },
}
```

### Programmatic Control

You can also control the splash screen in code:

```typescript
import { hideSplashScreen, showSplashScreen } from '@/lib/native'

// Hide splash screen when app is ready
await hideSplashScreen(300) // 300ms fade

// Show splash screen (e.g., during updates)
await showSplashScreen()
```

---

## Creating Splash Screens

### Using Figma

1. Create a new frame at 1440 x 2560 (xxxhdpi base)
2. Set background color to `#0f172a`
3. Add your logo centered
4. Export at different scales:
   - 100% = xxxhdpi
   - 75% = xxhdpi
   - 50% = xhdpi
   - 37.5% = hdpi
   - 25% = mdpi
   - 17% = ldpi

### Using Adobe Illustrator/Photoshop

1. Create an artboard at 1440 x 2560
2. Design your splash screen
3. Export using "Export for Screens" with size presets

### Using Capacitor Splash Screen Generator

You can use the Capacitor Assets tool:

```bash
npm install -g @capacitor/assets

# Generate all splash screens from a single source
npx @capacitor/assets generate --splash splash.png
```

### Online Tools

- [App Icon Generator](https://appicon.co/) - Also generates splash screens
- [Ape Tools](https://apetools.webprofusion.com/) - Splash screen generator
- [Make App Icon](https://makeappicon.com/) - iOS and Android assets

---

## Directory Structure

After creating your splash screens, your directory structure should look like:

```
public/
  splash/
    README.md (this file)
    splash-logo.svg (source logo)

ios/
  App/
    App/
      Assets.xcassets/
        SplashLogo.imageset/
          logo.png
          logo@2x.png
          logo@3x.png
      LaunchScreen.storyboard (configured to use SplashLogo)

android/
  app/
    src/
      main/
        res/
          drawable-ldpi/splash.png
          drawable-mdpi/splash.png
          drawable-hdpi/splash.png
          drawable-xhdpi/splash.png
          drawable-xxhdpi/splash.png
          drawable-xxxhdpi/splash.png
```

---

## Testing

### iOS

1. Open the project in Xcode
2. Product > Clean Build Folder
3. Run on simulator or device
4. The splash screen should appear immediately on launch

### Android

1. Open the project in Android Studio
2. Build > Clean Project
3. Run on emulator or device
4. The splash screen should appear immediately on launch

### Common Issues

**Splash screen not showing:**
- Ensure Capacitor is properly synced: `npx cap sync`
- Check that images are in the correct directories
- Verify file names match expected names

**Splash screen stretched/distorted:**
- Use the correct aspect ratio for each density
- Consider using 9-patch images on Android
- Use Storyboard constraints on iOS

**White flash before splash screen:**
- Set the background color in native config to match splash screen
- iOS: Set background in LaunchScreen.storyboard
- Android: Set windowBackground in styles.xml

---

## Placeholder Files

This directory should contain your splash screen assets. Here are placeholder files to replace:

1. `splash-logo.svg` - Vector logo for splash screen
2. `splash-2x.png` - iOS @2x splash logo
3. `splash-3x.png` - iOS @3x splash logo

Create these files with your VivanceData branding before running `npx cap sync`.
