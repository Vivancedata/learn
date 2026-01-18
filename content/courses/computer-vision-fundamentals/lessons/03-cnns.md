---
id: cv-cnns
title: Convolutional Neural Networks
type: lesson
duration: 60 mins
order: 3
section: deep-learning
prevLessonId: cv-image-processing
nextLessonId: cv-transfer-learning
---

# Convolutional Neural Networks

Convolutional Neural Networks (CNNs) are the backbone of modern computer vision. They automatically learn hierarchical features from images, from edges to complex patterns.

## Why CNNs for Images?

### Problem with Fully Connected Networks

A 224x224 RGB image has 224 * 224 * 3 = 150,528 pixels. A single fully connected layer with 1000 neurons would need 150 million parameters!

```python
# FC approach (bad for images)
# 150,528 inputs * 1,000 neurons = 150,528,000 parameters

# CNN approach (efficient)
# 3x3 kernel * 3 channels * 64 filters = 1,728 parameters
```

### CNN Advantages

1. **Parameter Sharing**: Same kernel applied across entire image
2. **Translation Invariance**: Detects features regardless of position
3. **Hierarchical Learning**: Low-level to high-level features

## The Convolution Operation

```python
import torch
import torch.nn as nn

# Input: batch of images (batch, channels, height, width)
input_image = torch.randn(1, 3, 224, 224)

# Convolution layer
# in_channels=3 (RGB), out_channels=64, kernel_size=3x3
conv = nn.Conv2d(in_channels=3, out_channels=64, kernel_size=3, padding=1)

# Apply convolution
output = conv(input_image)
print(output.shape)  # torch.Size([1, 64, 224, 224])
```

### How Convolution Works

```
Input (3x3 region):     Kernel (3x3):        Output:
[1, 2, 3]               [1, 0, -1]
[4, 5, 6]       *       [1, 0, -1]    =     sum = -4
[7, 8, 9]               [1, 0, -1]

1*1 + 2*0 + 3*(-1) + 4*1 + 5*0 + 6*(-1) + 7*1 + 8*0 + 9*(-1) = -4
```

### Convolution Parameters

```python
conv = nn.Conv2d(
    in_channels=3,      # Input channels (3 for RGB)
    out_channels=64,    # Number of filters (output depth)
    kernel_size=3,      # Size of the kernel (3x3)
    stride=1,           # Step size when sliding kernel
    padding=1,          # Zero-padding around input
    dilation=1,         # Spacing between kernel elements
    bias=True           # Add bias term
)
```

### Output Size Formula

```
Output_size = (Input_size - Kernel_size + 2*Padding) / Stride + 1

Example: Input=224, Kernel=3, Padding=1, Stride=1
Output = (224 - 3 + 2*1) / 1 + 1 = 224
```

## Pooling Layers

Reduce spatial dimensions while keeping important features.

```python
# Max Pooling (most common)
maxpool = nn.MaxPool2d(kernel_size=2, stride=2)

# Input: 1x64x224x224
# Output: 1x64x112x112

# Average Pooling
avgpool = nn.AvgPool2d(kernel_size=2, stride=2)

# Global Average Pooling (flatten to 1x1)
gap = nn.AdaptiveAvgPool2d(1)
# Input: 1x64x7x7 → Output: 1x64x1x1
```

## Building a CNN from Scratch

```python
import torch.nn as nn
import torch.nn.functional as F

class SimpleCNN(nn.Module):
    def __init__(self, num_classes=10):
        super(SimpleCNN, self).__init__()

        # Convolutional layers
        self.conv1 = nn.Conv2d(3, 32, kernel_size=3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, kernel_size=3, padding=1)
        self.conv3 = nn.Conv2d(64, 128, kernel_size=3, padding=1)

        # Pooling
        self.pool = nn.MaxPool2d(2, 2)

        # Fully connected layers
        self.fc1 = nn.Linear(128 * 28 * 28, 512)
        self.fc2 = nn.Linear(512, num_classes)

        # Dropout for regularization
        self.dropout = nn.Dropout(0.5)

    def forward(self, x):
        # Conv block 1: 224 -> 112
        x = self.pool(F.relu(self.conv1(x)))

        # Conv block 2: 112 -> 56
        x = self.pool(F.relu(self.conv2(x)))

        # Conv block 3: 56 -> 28
        x = self.pool(F.relu(self.conv3(x)))

        # Flatten
        x = x.view(x.size(0), -1)

        # Fully connected
        x = F.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)

        return x

model = SimpleCNN(num_classes=10)
print(model)
```

## Batch Normalization

Normalizes layer inputs, speeds up training, adds regularization.

```python
class CNNWithBatchNorm(nn.Module):
    def __init__(self, num_classes=10):
        super().__init__()
        self.conv1 = nn.Conv2d(3, 64, 3, padding=1)
        self.bn1 = nn.BatchNorm2d(64)  # Normalize after 64 filters

        self.conv2 = nn.Conv2d(64, 128, 3, padding=1)
        self.bn2 = nn.BatchNorm2d(128)

        self.pool = nn.MaxPool2d(2, 2)

    def forward(self, x):
        x = self.pool(F.relu(self.bn1(self.conv1(x))))
        x = self.pool(F.relu(self.bn2(self.conv2(x))))
        return x
```

## Famous CNN Architectures

### LeNet-5 (1998)
First successful CNN for digit recognition.

```python
class LeNet5(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(1, 6, 5)
        self.conv2 = nn.Conv2d(6, 16, 5)
        self.fc1 = nn.Linear(16 * 5 * 5, 120)
        self.fc2 = nn.Linear(120, 84)
        self.fc3 = nn.Linear(84, 10)
```

### VGG (2014)
Deep networks with small 3x3 kernels.

```python
# VGG-16 structure
# 2x Conv64 -> Pool
# 2x Conv128 -> Pool
# 3x Conv256 -> Pool
# 3x Conv512 -> Pool
# 3x Conv512 -> Pool
# FC 4096 -> FC 4096 -> FC 1000

from torchvision.models import vgg16
model = vgg16(pretrained=True)
```

### ResNet (2015)
Skip connections enable very deep networks.

```python
class ResidualBlock(nn.Module):
    def __init__(self, in_channels, out_channels, stride=1):
        super().__init__()
        self.conv1 = nn.Conv2d(in_channels, out_channels, 3,
                               stride=stride, padding=1)
        self.bn1 = nn.BatchNorm2d(out_channels)
        self.conv2 = nn.Conv2d(out_channels, out_channels, 3,
                               stride=1, padding=1)
        self.bn2 = nn.BatchNorm2d(out_channels)

        # Skip connection
        self.shortcut = nn.Sequential()
        if stride != 1 or in_channels != out_channels:
            self.shortcut = nn.Sequential(
                nn.Conv2d(in_channels, out_channels, 1, stride=stride),
                nn.BatchNorm2d(out_channels)
            )

    def forward(self, x):
        out = F.relu(self.bn1(self.conv1(x)))
        out = self.bn2(self.conv2(out))
        out += self.shortcut(x)  # Skip connection
        out = F.relu(out)
        return out
```

## Training a CNN

```python
import torch
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms

# Data transforms
transform = transforms.Compose([
    transforms.Resize(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# Dataset and DataLoader
train_dataset = datasets.CIFAR10(root='./data', train=True,
                                  download=True, transform=transform)
train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True)

# Model, loss, optimizer
model = SimpleCNN(num_classes=10)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), lr=0.001)

# Training loop
for epoch in range(10):
    model.train()
    running_loss = 0.0

    for images, labels in train_loader:
        optimizer.zero_grad()

        outputs = model(images)
        loss = criterion(outputs, labels)

        loss.backward()
        optimizer.step()

        running_loss += loss.item()

    print(f"Epoch {epoch+1}, Loss: {running_loss/len(train_loader):.4f}")
```

## Data Augmentation

Artificially expand training data to improve generalization.

```python
from torchvision import transforms

train_transform = transforms.Compose([
    transforms.RandomResizedCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.RandomRotation(15),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# More advanced augmentations with Albumentations
import albumentations as A
from albumentations.pytorch import ToTensorV2

transform = A.Compose([
    A.RandomCrop(224, 224),
    A.HorizontalFlip(p=0.5),
    A.RandomBrightnessContrast(p=0.2),
    A.GaussNoise(p=0.1),
    A.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ToTensorV2()
])
```

## Knowledge Check

1. Why are CNNs better than fully connected networks for images?
   - Parameter sharing and translation invariance
   - They are faster
   - They use less GPU memory
   - They work with larger images

2. What does a max pooling layer do?
   - Reduces spatial dimensions by taking the maximum value in each region
   - Increases image resolution
   - Normalizes the values
   - Adds more channels

3. What is the purpose of skip connections in ResNet?
   - Allow gradients to flow directly, enabling training of very deep networks
   - Make the network faster
   - Reduce memory usage
   - Add more parameters

4. What does batch normalization do?
   - Normalizes layer inputs to stabilize and speed up training
   - Reduces batch size
   - Increases image resolution
   - Detects edges

5. Why is data augmentation important?
   - Artificially expands training data to improve generalization
   - Makes training faster
   - Reduces model size
   - Improves image quality
