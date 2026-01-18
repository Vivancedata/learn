---
id: cv-intro-to-cv
title: Introduction to Computer Vision
type: lesson
duration: 45 mins
order: 1
section: fundamentals
nextLessonId: cv-image-processing
---

# Introduction to Computer Vision

Computer vision is the field of AI that enables computers to interpret and understand visual information from the world. From facial recognition to self-driving cars, CV is transforming every industry.

## What is Computer Vision?

Computer vision aims to replicate human visual perception using algorithms and machine learning:

```
Image/Video → CV System → Understanding
                          - What objects are present?
                          - Where are they located?
                          - What's happening?
```

### The Challenge

For humans, vision is effortless. For computers, it's incredibly complex:

```python
# To a computer, an image is just numbers
import numpy as np

# A simple 3x3 grayscale image
image = np.array([
    [120, 130, 125],
    [118, 200, 122],
    [115, 128, 119]
])
# How do we go from numbers to "this is a cat"?
```

## Core Computer Vision Tasks

### Image Classification
Assign a label to an entire image.

```python
from torchvision import models, transforms
from PIL import Image
import torch

# Load pre-trained model
model = models.resnet50(pretrained=True)
model.set_mode_to_inference()

# Preprocess image
transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                        std=[0.229, 0.224, 0.225])
])

image = Image.open("cat.jpg")
input_tensor = transform(image).unsqueeze(0)

# Predict
with torch.no_grad():
    output = model(input_tensor)
    _, predicted = torch.max(output, 1)
    print(f"Predicted class: {predicted.item()}")
```

### Object Detection
Locate and classify multiple objects within an image.

```python
from ultralytics import YOLO

model = YOLO("yolov8n.pt")
results = model("street.jpg")

for result in results:
    for box in result.boxes:
        cls = result.names[int(box.cls)]
        conf = float(box.conf)
        bbox = box.xyxy[0].tolist()
        print(f"{cls}: {conf:.2f} at {bbox}")
# Output: car: 0.95 at [100, 200, 300, 400]
#         person: 0.89 at [400, 150, 480, 380]
```

### Image Segmentation
Classify every pixel in an image.

```python
# Semantic segmentation: label each pixel
# Instance segmentation: distinguish individual objects

from transformers import pipeline

segmenter = pipeline("image-segmentation")
result = segmenter("room.jpg")

for segment in result:
    print(f"{segment['label']}: {segment['score']:.2f}")
# Output: wall: 0.98
#         floor: 0.96
#         chair: 0.94
```

### Pose Estimation
Detect human body keypoints and skeleton.

```python
# Using MediaPipe for pose detection
import mediapipe as mp
import cv2

mp_pose = mp.solutions.pose
pose = mp_pose.Pose()

image = cv2.imread("person.jpg")
results = pose.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

# Access landmarks
if results.pose_landmarks:
    for landmark in results.pose_landmarks.landmark:
        print(f"x: {landmark.x}, y: {landmark.y}")
```

### Facial Recognition
Identify individuals from their facial features.

```python
import face_recognition

# Load known face
known_image = face_recognition.load_image_file("known_person.jpg")
known_encoding = face_recognition.face_encodings(known_image)[0]

# Compare with unknown face
unknown_image = face_recognition.load_image_file("unknown.jpg")
unknown_encoding = face_recognition.face_encodings(unknown_image)[0]

match = face_recognition.compare_faces([known_encoding], unknown_encoding)
print(f"Match: {match[0]}")
```

## Digital Image Representation

### Grayscale Images
Single channel, values from 0 (black) to 255 (white).

```python
import numpy as np
import matplotlib.pyplot as plt

# Create grayscale gradient
image = np.zeros((100, 100), dtype=np.uint8)
for i in range(100):
    image[:, i] = int(i * 2.55)

plt.imshow(image, cmap='gray')
plt.colorbar()
plt.show()
```

### Color Images (RGB)
Three channels: Red, Green, Blue.

```python
import cv2
import numpy as np

# Read image
image = cv2.imread("photo.jpg")  # BGR format in OpenCV
print(f"Shape: {image.shape}")  # (height, width, channels)
# Example: (480, 640, 3)

# Access pixel value
pixel = image[100, 200]  # [B, G, R]
print(f"Pixel at (100, 200): B={pixel[0]}, G={pixel[1]}, R={pixel[2]}")

# Convert to RGB for matplotlib
image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
```

### Color Spaces

```python
# Convert between color spaces
hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)  # Hue, Saturation, Value
lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)  # Lightness, a, b
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)  # Grayscale

# HSV is useful for color-based detection
# Example: Detect red objects
lower_red = np.array([0, 100, 100])
upper_red = np.array([10, 255, 255])
mask = cv2.inRange(hsv, lower_red, upper_red)
```

## Evolution of Computer Vision

### Rule-Based Era (1960s-1990s)
- Hand-crafted features
- Edge detection, template matching
- Limited real-world performance

### Feature Engineering Era (2000s)
- SIFT, SURF, HOG features
- SVM, Random Forest classifiers
- Object detection with sliding windows

### Deep Learning Era (2012-Present)
- AlexNet wins ImageNet (2012) - revolution begins
- VGG, ResNet, EfficientNet - better architectures
- YOLO, Faster R-CNN - real-time detection
- Vision Transformers - attention for images

```python
# Traditional CV vs Deep Learning

# Traditional: Manual feature extraction
from skimage.feature import hog

features = hog(gray_image,
               orientations=9,
               pixels_per_cell=(8, 8),
               cells_per_block=(2, 2))

# Deep Learning: Learned features
model = models.resnet50(pretrained=True)
features = model.features(image_tensor)
```

## Real-World Applications

### Healthcare
- Cancer detection in medical images
- Retinal disease diagnosis
- Surgical assistance robots

### Automotive
- Self-driving cars
- Driver monitoring
- Traffic sign recognition

### Retail
- Automated checkout
- Inventory management
- Customer analytics

### Security
- Surveillance and anomaly detection
- Face recognition access control
- License plate recognition

### Agriculture
- Crop health monitoring
- Yield prediction
- Automated harvesting

## CV Libraries Overview

### OpenCV
```python
import cv2

# Read, process, display images
image = cv2.imread("image.jpg")
gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
edges = cv2.Canny(gray, 100, 200)
```

### PyTorch + torchvision
```python
import torch
from torchvision import models, transforms

# Pre-trained models, datasets, transforms
model = models.resnet50(pretrained=True)
```

### Ultralytics (YOLO)
```python
from ultralytics import YOLO

# State-of-the-art object detection
model = YOLO("yolov8n.pt")
results = model("image.jpg")
```

### Hugging Face Transformers
```python
from transformers import pipeline

# Vision transformers and pipelines
classifier = pipeline("image-classification")
```

## Knowledge Check

1. What is the primary goal of computer vision?
   - Enable computers to interpret and understand visual information
   - Create better displays
   - Store images efficiently
   - Compress video files

2. Which CV task assigns a single label to an entire image?
   - Image classification
   - Object detection
   - Image segmentation
   - Pose estimation

3. How is a color image typically represented in computers?
   - As a 3D array with height, width, and 3 color channels (RGB)
   - As a single number per pixel
   - As text description
   - As a 1D array

4. What event is considered the start of the deep learning revolution in CV?
   - AlexNet winning ImageNet 2012
   - Invention of the camera
   - First digital image
   - Release of OpenCV

5. Which library is best known for real-time object detection with YOLO?
   - Ultralytics
   - Pandas
   - Requests
   - Flask
