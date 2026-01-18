---
id: cv-transfer-learning
title: Transfer Learning
type: lesson
duration: 50 mins
order: 4
section: deep-learning
prevLessonId: cv-cnns
nextLessonId: cv-object-detection
---

# Transfer Learning for Computer Vision

Transfer learning leverages pre-trained models to achieve excellent results with limited data. Instead of training from scratch, we use models trained on millions of images.

## Why Transfer Learning?

### The Problem
- Training from scratch requires massive datasets (millions of images)
- Training is computationally expensive (days on GPUs)
- Risk of overfitting with small datasets

### The Solution
Pre-trained models on ImageNet (1.4M images, 1000 classes) already know:
- Low-level features: edges, textures, colors
- Mid-level features: shapes, patterns
- High-level features: object parts, concepts

```python
# Training from scratch: weeks, millions of images
# Transfer learning: hours, hundreds of images
```

## Transfer Learning Strategies

### Strategy 1: Feature Extraction
Use pre-trained model as fixed feature extractor.

```python
import torch
import torch.nn as nn
from torchvision import models

# Load pre-trained ResNet
model = models.resnet50(pretrained=True)

# Freeze all layers
for param in model.parameters():
    param.requires_grad = False

# Replace final layer
num_features = model.fc.in_features
model.fc = nn.Linear(num_features, 10)  # 10 classes

# Only fc layer will be trained
```

### Strategy 2: Fine-tuning
Train some layers, freeze others.

```python
model = models.resnet50(pretrained=True)

# Freeze early layers
for name, param in model.named_parameters():
    if "layer4" not in name and "fc" not in name:
        param.requires_grad = False

# Replace classifier
model.fc = nn.Linear(model.fc.in_features, 10)

# Use smaller learning rate for pre-trained layers
optimizer = torch.optim.Adam([
    {'params': model.layer4.parameters(), 'lr': 1e-5},
    {'params': model.fc.parameters(), 'lr': 1e-3}
])
```

### Strategy 3: Full Fine-tuning
Train entire network with small learning rate.

```python
model = models.resnet50(pretrained=True)
model.fc = nn.Linear(model.fc.in_features, 10)

# All parameters trainable
optimizer = torch.optim.Adam(model.parameters(), lr=1e-5)
```

## Complete Training Pipeline

```python
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from tqdm import tqdm

# Device
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Data transforms
train_transform = transforms.Compose([
    transforms.RandomResizedCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

val_transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

# Load dataset
train_dataset = datasets.ImageFolder('data/train', transform=train_transform)
val_dataset = datasets.ImageFolder('data/val', transform=val_transform)

train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True, num_workers=4)
val_loader = DataLoader(val_dataset, batch_size=32, shuffle=False, num_workers=4)

# Model
model = models.resnet50(pretrained=True)
for param in model.parameters():
    param.requires_grad = False

num_classes = len(train_dataset.classes)
model.fc = nn.Sequential(
    nn.Dropout(0.5),
    nn.Linear(model.fc.in_features, num_classes)
)
model = model.to(device)

# Training setup
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.fc.parameters(), lr=0.001)
scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=7, gamma=0.1)

# Training function
def train_epoch(model, loader, criterion, optimizer):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for images, labels in tqdm(loader):
        images, labels = images.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item()
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()

    return running_loss / len(loader), correct / total

# Validation function
def validate(model, loader, criterion):
    model.train(False)
    running_loss = 0.0
    correct = 0
    total = 0

    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            loss = criterion(outputs, labels)

            running_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()

    return running_loss / len(loader), correct / total

# Training loop
best_acc = 0.0
for epoch in range(20):
    train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer)
    val_loss, val_acc = validate(model, val_loader, criterion)
    scheduler.step()

    print(f"Epoch {epoch+1}: Train Loss={train_loss:.4f}, Acc={train_acc:.4f} | "
          f"Val Loss={val_loss:.4f}, Acc={val_acc:.4f}")

    if val_acc > best_acc:
        best_acc = val_acc
        torch.save(model.state_dict(), 'best_model.pth')
```

## Popular Pre-trained Models

### ResNet Family
```python
from torchvision import models

resnet18 = models.resnet18(pretrained=True)   # 11M params
resnet50 = models.resnet50(pretrained=True)   # 25M params
resnet101 = models.resnet101(pretrained=True) # 44M params
```

### EfficientNet Family
```python
# Best accuracy/efficiency trade-off
efficientnet = models.efficientnet_b0(pretrained=True)  # 5M params
efficientnet_b7 = models.efficientnet_b7(pretrained=True)  # 66M params
```

### Vision Transformers
```python
# State-of-the-art for large datasets
vit = models.vit_b_16(pretrained=True)  # 86M params
```

### Model Selection Guide

| Model | Params | Speed | Accuracy | Use Case |
|-------|--------|-------|----------|----------|
| MobileNetV3 | 5M | Fast | Good | Mobile, edge |
| EfficientNet-B0 | 5M | Medium | Great | Balanced |
| ResNet-50 | 25M | Medium | Great | General |
| EfficientNet-B4 | 19M | Slow | Excellent | High accuracy |
| ViT-B/16 | 86M | Slow | SOTA | Large datasets |

## Hugging Face Transformers

```python
from transformers import AutoImageProcessor, AutoModelForImageClassification
import torch
from PIL import Image

# Load model
processor = AutoImageProcessor.from_pretrained("google/vit-base-patch16-224")
model = AutoModelForImageClassification.from_pretrained("google/vit-base-patch16-224")

# Predict
image = Image.open("cat.jpg")
inputs = processor(images=image, return_tensors="pt")

with torch.no_grad():
    outputs = model(**inputs)
    logits = outputs.logits
    predicted_class = logits.argmax(-1).item()
    print(f"Predicted: {model.config.id2label[predicted_class]}")
```

## Fine-tuning with Hugging Face

```python
from transformers import TrainingArguments, Trainer
from datasets import load_dataset

# Load dataset
dataset = load_dataset("food101", split="train[:5000]")

# Preprocessing
def preprocess(examples):
    inputs = processor(examples["image"], return_tensors="pt")
    inputs["labels"] = examples["label"]
    return inputs

dataset = dataset.map(preprocess, batched=True)

# Training
training_args = TrainingArguments(
    output_dir="./vit-food",
    num_train_epochs=3,
    per_device_train_batch_size=16,
    learning_rate=2e-5,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=dataset,
)

trainer.train()
```

## Best Practices

### 1. Learning Rate
```python
# Larger LR for new layers, smaller for pre-trained
optimizer = optim.Adam([
    {'params': model.features.parameters(), 'lr': 1e-5},
    {'params': model.classifier.parameters(), 'lr': 1e-3}
])
```

### 2. Gradual Unfreezing
```python
# Start frozen, gradually unfreeze
for epoch in range(epochs):
    if epoch == 5:
        for param in model.layer4.parameters():
            param.requires_grad = True
    if epoch == 10:
        for param in model.layer3.parameters():
            param.requires_grad = True
```

### 3. Data Augmentation
```python
# Strong augmentation for small datasets
train_transform = transforms.Compose([
    transforms.RandomResizedCrop(224, scale=(0.7, 1.0)),
    transforms.RandomHorizontalFlip(),
    transforms.ColorJitter(0.3, 0.3, 0.3),
    transforms.RandomRotation(20),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])
```

## Knowledge Check

1. What is the main benefit of transfer learning?
   - Leveraging pre-trained knowledge to achieve good results with less data
   - Faster inference time
   - Smaller model size
   - No need for GPUs

2. When using a pre-trained model as a feature extractor, what do you freeze?
   - All layers except the final classifier
   - Only the first layer
   - Nothing
   - The classifier only

3. What learning rate should you use for pre-trained layers during fine-tuning?
   - A smaller learning rate than for new layers
   - A larger learning rate than for new layers
   - The same learning rate
   - Learning rate doesn't matter

4. Which model family offers the best accuracy/efficiency trade-off?
   - EfficientNet
   - AlexNet
   - VGG
   - LeNet

5. When should you use full fine-tuning instead of feature extraction?
   - When you have a large dataset and the target domain differs from ImageNet
   - When you have very little data
   - When you need fast training
   - When deploying on mobile
