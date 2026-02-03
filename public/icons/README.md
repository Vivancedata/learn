# PWA Icons

This directory should contain the following icon files for the Progressive Web App:

## Required Icons

| File | Size | Purpose |
|------|------|---------|
| `icon-72.png` | 72x72 | Small icon |
| `icon-96.png` | 96x96 | Shortcut icon |
| `icon-128.png` | 128x128 | Medium icon |
| `icon-144.png` | 144x144 | Windows tile |
| `icon-152.png` | 152x152 | Apple touch icon |
| `icon-192.png` | 192x192 | Android home screen |
| `icon-384.png` | 384x384 | Large icon |
| `icon-512.png` | 512x512 | Splash screen / maskable |
| `badge-72.png` | 72x72 | Notification badge |

## Optional Shortcut Icons

| File | Size | Purpose |
|------|------|---------|
| `courses-96.png` | 96x96 | Courses shortcut |
| `paths-96.png` | 96x96 | Learning paths shortcut |

## Generating Icons

### Option 1: Online Generator
Use a PWA icon generator like:
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

### Option 2: Using ImageMagick

```bash
# From a source SVG (recommended)
convert -background none source.svg -resize 192x192 icon-192.png
convert -background none source.svg -resize 512x512 icon-512.png

# Generate all sizes from a high-res PNG
for size in 72 96 128 144 152 192 384 512; do
  convert source-512.png -resize ${size}x${size} icon-${size}.png
done
```

### Option 3: Using Sharp (Node.js)

```javascript
const sharp = require('sharp');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

sizes.forEach(size => {
  sharp('source.png')
    .resize(size, size)
    .toFile(`icon-${size}.png`);
});
```

## Icon Design Guidelines

1. **Use a transparent background** for PNG icons
2. **Keep important content within safe zone** (center 80% for maskable icons)
3. **Use simple, recognizable shapes** that work at small sizes
4. **Match your brand colors** (theme color: #6366f1)
5. **Test on both light and dark backgrounds**

## Maskable Icons

For Android Adaptive Icons, the icon should have extra padding so the
important content is within the "safe zone" (center 80% of the image).

You can test maskable icons at: https://maskable.app/editor
