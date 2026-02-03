# VivanceData PWA Icons

This directory contains all icons required for the Progressive Web App (PWA) functionality.

## Required Icons

### Standard Icons (for manifest.json)

| Filename | Size | Purpose |
|----------|------|---------|
| `icon-72.png` | 72x72 | Android splash screen |
| `icon-96.png` | 96x96 | Android splash screen |
| `icon-128.png` | 128x128 | Chrome Web Store |
| `icon-144.png` | 144x144 | MS tile, Safari pinned tab |
| `icon-152.png` | 152x152 | Apple touch icon (iPad) |
| `icon-192.png` | 192x192 | Android home screen |
| `icon-384.png` | 384x384 | High-res displays |
| `icon-512.png` | 512x512 | Android splash screen, PWA install |

### Maskable Icons

| Filename | Size | Purpose |
|----------|------|---------|
| `icon-maskable-192.png` | 192x192 | Android adaptive icon |
| `icon-maskable-512.png` | 512x512 | Android adaptive icon (high-res) |

**Note:** Maskable icons should have a safe zone (content within the center 80% of the image) as Android may crop them into different shapes.

### Apple-Specific Icons

| Filename | Size | Purpose |
|----------|------|---------|
| `apple-touch-icon.png` | 180x180 | iOS home screen |
| `apple-touch-icon-precomposed.png` | 180x180 | Older iOS (no effects) |

### Shortcut Icons

| Filename | Size | Purpose |
|----------|------|---------|
| `shortcut-continue.png` | 96x96 | "Continue Learning" shortcut |
| `shortcut-progress.png` | 96x96 | "My Progress" shortcut |
| `shortcut-courses.png` | 96x96 | "Browse Courses" shortcut |
| `shortcut-paths.png` | 96x96 | "Learning Paths" shortcut |

### Notification Badge

| Filename | Size | Purpose |
|----------|------|---------|
| `badge-72.png` | 72x72 | Push notification badge (monochrome) |

## Screenshots

Screenshots should be placed in `/public/screenshots/`:

| Filename | Size | Form Factor | Description |
|----------|------|-------------|-------------|
| `mobile-home.png` | 390x844 | narrow | Home page on mobile |
| `mobile-courses.png` | 390x844 | narrow | Courses list on mobile |
| `mobile-lesson.png` | 390x844 | narrow | Lesson view on mobile |
| `desktop-home.png` | 1920x1080 | wide | Home page on desktop |
| `desktop-dashboard.png` | 1920x1080 | wide | Dashboard on desktop |

## Generating Icons

### Option 1: Using a PWA Icon Generator

1. Visit [RealFaviconGenerator](https://realfavicongenerator.net/) or [PWA Asset Generator](https://www.pwabuilder.com/imageGenerator)
2. Upload your high-resolution logo (at least 512x512)
3. Download and extract the generated icons
4. Copy them to this directory

### Option 2: Using ImageMagick (CLI)

If you have ImageMagick installed:

```bash
# Standard icons
for size in 72 96 128 144 152 192 384 512; do
  convert logo.png -resize ${size}x${size} icon-${size}.png
done

# Apple touch icon
convert logo.png -resize 180x180 apple-touch-icon.png

# Badge (should be monochrome)
convert logo.png -resize 72x72 -colorspace Gray badge-72.png
```

### Option 3: Using Sharp (Node.js)

```javascript
const sharp = require('sharp');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  sharp('logo.png')
    .resize(size, size)
    .toFile(`icon-${size}.png`);
});
```

### Option 4: Using pwa-asset-generator

```bash
# Install the tool
npm install -g pwa-asset-generator

# Generate all required icons from a source image
pwa-asset-generator ./logo.svg ./public/icons -i ./public/index.html -m ./public/manifest.json
```

## Icon Design Guidelines

### Standard Icons
- Use your app's primary logo
- Ensure the logo is visible at all sizes
- Use a solid background color (matches `theme_color` in manifest)
- Recommended: Use the brand color `#6366f1` (indigo) or dark `#0f172a`

### Maskable Icons
- Place content within the center 80% of the canvas
- Use a solid background that extends to all edges
- The safe zone is a circle centered in the image
- Test at: https://maskable.app/editor

### Badge Icons
- Keep it simple and recognizable at small sizes
- Use monochrome (single color) for best results
- Typically shows on notifications

### Shortcut Icons
- Clear, simple iconography
- Consistent style across all shortcuts
- Should be recognizable at 96x96
- Use recognizable symbols (play button for continue, chart for progress, etc.)

## Testing Icons

1. **Chrome DevTools**: Open DevTools > Application > Manifest to preview
2. **Android**: Install the PWA and check the home screen icon
3. **iOS**: Add to Home Screen and verify the icon appearance
4. **PWA Builder**: Use [PWABuilder](https://www.pwabuilder.com/) to validate your manifest
5. **Maskable.app**: Test maskable icons at https://maskable.app/

## Icon Checklist

### Standard Icons
- [ ] icon-72.png (72x72)
- [ ] icon-96.png (96x96)
- [ ] icon-128.png (128x128)
- [ ] icon-144.png (144x144)
- [ ] icon-152.png (152x152)
- [ ] icon-192.png (192x192)
- [ ] icon-384.png (384x384)
- [ ] icon-512.png (512x512)

### Maskable Icons
- [ ] icon-maskable-192.png (192x192)
- [ ] icon-maskable-512.png (512x512)

### Apple Icons
- [ ] apple-touch-icon.png (180x180)

### Notification
- [ ] badge-72.png (72x72, monochrome)

### Shortcuts
- [ ] shortcut-continue.png (96x96)
- [ ] shortcut-progress.png (96x96)
- [ ] shortcut-courses.png (96x96)
- [ ] shortcut-paths.png (96x96)

### Screenshots
- [ ] /screenshots/mobile-home.png (390x844)
- [ ] /screenshots/mobile-courses.png (390x844)
- [ ] /screenshots/mobile-lesson.png (390x844)
- [ ] /screenshots/desktop-home.png (1920x1080)
- [ ] /screenshots/desktop-dashboard.png (1920x1080)

## Related Files

- `/public/manifest.json` - PWA manifest referencing these icons
- `/src/app/layout.tsx` - Meta tags for Apple icons
- `/public/sw.js` - Service worker caching icons

## Resources

- [Web App Manifest - MDN](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Maskable Icons](https://web.dev/maskable-icon/)
- [PWA Builder](https://www.pwabuilder.com/)
- [Real Favicon Generator](https://realfavicongenerator.net/)
