---
id: cv-image-processing
title: Image Processing with OpenCV
type: lesson
duration: 50 mins
order: 2
section: fundamentals
prevLessonId: cv-intro-to-cv
nextLessonId: cv-cnns
---

# Image Processing with OpenCV

OpenCV (Open Source Computer Vision Library) is the most widely used library for image processing. This lesson covers essential operations for manipulating and analyzing images.

## Reading and Writing Images

```python
import cv2
import numpy as np

# Read an image
image = cv2.imread("photo.jpg")  # BGR format
image_gray = cv2.imread("photo.jpg", cv2.IMREAD_GRAYSCALE)
image_unchanged = cv2.imread("photo.jpg", cv2.IMREAD_UNCHANGED)  # Includes alpha

# Check if image loaded
if image is None:
    print("Error: Could not load image")

# Get image properties
height, width, channels = image.shape
print(f"Size: {width}x{height}, Channels: {channels}")

# Save an image
cv2.imwrite("output.jpg", image)
cv2.imwrite("output.png", image)  # Lossless
```

## Basic Image Operations

### Resizing

```python
# Resize to specific dimensions
resized = cv2.resize(image, (640, 480))

# Resize by scale factor
scaled = cv2.resize(image, None, fx=0.5, fy=0.5)

# Different interpolation methods
# INTER_NEAREST - fastest, pixelated
# INTER_LINEAR - good for enlarging (default)
# INTER_AREA - good for shrinking
# INTER_CUBIC - high quality, slower
resized_quality = cv2.resize(image, (1920, 1080), interpolation=cv2.INTER_CUBIC)
```

### Cropping

```python
# Crop is just array slicing
# image[y_start:y_end, x_start:x_end]
cropped = image[100:400, 200:500]

# Crop center region
h, w = image.shape[:2]
center_x, center_y = w // 2, h // 2
crop_size = 200
cropped_center = image[
    center_y - crop_size:center_y + crop_size,
    center_x - crop_size:center_x + crop_size
]
```

### Rotation

```python
# Get rotation matrix
height, width = image.shape[:2]
center = (width // 2, height // 2)

# Rotate 45 degrees around center
rotation_matrix = cv2.getRotationMatrix2D(center, 45, 1.0)
rotated = cv2.warpAffine(image, rotation_matrix, (width, height))

# Simple 90-degree rotations
rotated_90 = cv2.rotate(image, cv2.ROTATE_90_CLOCKWISE)
rotated_180 = cv2.rotate(image, cv2.ROTATE_180)
rotated_270 = cv2.rotate(image, cv2.ROTATE_90_COUNTERCLOCKWISE)
```

### Flipping

```python
# Flip horizontally (mirror)
flipped_h = cv2.flip(image, 1)

# Flip vertically
flipped_v = cv2.flip(image, 0)

# Flip both
flipped_both = cv2.flip(image, -1)
```

## Color Space Conversions

```python
# BGR to RGB (for matplotlib display)
rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

# BGR to Grayscale
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# BGR to HSV (Hue, Saturation, Value)
hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

# BGR to LAB (perceptually uniform)
lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)

# Split channels
b, g, r = cv2.split(image)
h, s, v = cv2.split(hsv)

# Merge channels
merged = cv2.merge([b, g, r])
```

## Image Filtering

### Blurring / Smoothing

```python
# Average blur
blur_avg = cv2.blur(image, (5, 5))

# Gaussian blur (most common)
blur_gaussian = cv2.GaussianBlur(image, (5, 5), 0)

# Median blur (good for salt-and-pepper noise)
blur_median = cv2.medianBlur(image, 5)

# Bilateral filter (edge-preserving smoothing)
blur_bilateral = cv2.bilateralFilter(image, 9, 75, 75)
```

### Sharpening

```python
# Sharpening kernel
kernel_sharpen = np.array([
    [0, -1, 0],
    [-1, 5, -1],
    [0, -1, 0]
])

sharpened = cv2.filter2D(image, -1, kernel_sharpen)

# Unsharp masking (more control)
gaussian = cv2.GaussianBlur(image, (9, 9), 10.0)
unsharp = cv2.addWeighted(image, 1.5, gaussian, -0.5, 0)
```

## Edge Detection

```python
# Convert to grayscale first
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# Canny edge detection
edges_canny = cv2.Canny(gray, 100, 200)

# Sobel (directional gradients)
sobel_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
sobel_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
sobel_combined = cv2.magnitude(sobel_x, sobel_y)

# Laplacian
laplacian = cv2.Laplacian(gray, cv2.CV_64F)
```

## Thresholding

```python
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

# Simple threshold
_, thresh_binary = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
_, thresh_inv = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY_INV)

# Otsu's automatic thresholding
_, thresh_otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

# Adaptive thresholding (handles varying lighting)
thresh_adaptive = cv2.adaptiveThreshold(
    gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv2.THRESH_BINARY, 11, 2
)
```

## Morphological Operations

```python
# Create a kernel
kernel = np.ones((5, 5), np.uint8)

# Erosion (shrink white regions)
eroded = cv2.erode(thresh, kernel, iterations=1)

# Dilation (expand white regions)
dilated = cv2.dilate(thresh, kernel, iterations=1)

# Opening (erosion then dilation) - removes noise
opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)

# Closing (dilation then erosion) - fills holes
closing = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

# Gradient (edge detection)
gradient = cv2.morphologyEx(thresh, cv2.MORPH_GRADIENT, kernel)
```

## Contour Detection

```python
# Find contours
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
_, thresh = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
contours, hierarchy = cv2.findContours(
    thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE
)

# Draw contours
image_with_contours = image.copy()
cv2.drawContours(image_with_contours, contours, -1, (0, 255, 0), 2)

# Contour properties
for contour in contours:
    area = cv2.contourArea(contour)
    perimeter = cv2.arcLength(contour, True)
    x, y, w, h = cv2.boundingRect(contour)

    # Filter by area
    if area > 1000:
        cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 2)
```

## Histogram Analysis

```python
import matplotlib.pyplot as plt

# Calculate histogram
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
hist = cv2.calcHist([gray], [0], None, [256], [0, 256])

# Plot histogram
plt.plot(hist)
plt.title('Grayscale Histogram')
plt.xlabel('Pixel Value')
plt.ylabel('Frequency')
plt.show()

# Histogram equalization (improve contrast)
equalized = cv2.equalizeHist(gray)

# CLAHE (Contrast Limited Adaptive Histogram Equalization)
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
clahe_result = clahe.apply(gray)
```

## Practical Example: Document Scanner

```python
def scan_document(image_path):
    image = cv2.imread(image_path)
    orig = image.copy()

    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Edge detection
    edges = cv2.Canny(blurred, 75, 200)

    # Find contours
    contours, _ = cv2.findContours(
        edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE
    )

    # Sort by area, get largest
    contours = sorted(contours, key=cv2.contourArea, reverse=True)

    # Find document contour (4 points)
    for contour in contours:
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * peri, True)

        if len(approx) == 4:
            doc_contour = approx
            break

    # Perspective transform would go here
    return doc_contour

# Usage
contour = scan_document("document.jpg")
```

## Knowledge Check

1. What color format does OpenCV use by default when reading images?
   - BGR (Blue, Green, Red)
   - RGB (Red, Green, Blue)
   - HSV (Hue, Saturation, Value)
   - Grayscale

2. Which blur method is best for removing salt-and-pepper noise?
   - Median blur
   - Gaussian blur
   - Average blur
   - Bilateral filter

3. What does morphological opening do?
   - Erosion followed by dilation - removes small noise
   - Dilation followed by erosion - fills holes
   - Edge detection
   - Color conversion

4. Which edge detection method is most commonly used?
   - Canny
   - Gaussian blur
   - Median filter
   - Histogram equalization

5. What is CLAHE used for?
   - Improving image contrast adaptively
   - Detecting edges
   - Finding contours
   - Blurring images
