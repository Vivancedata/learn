---
id: dl-building-networks
title: Building Networks with TensorFlow/Keras
type: lesson
duration: 60 mins
order: 2
section: fundamentals
prevLessonId: dl-intro-neural-networks
nextLessonId: dl-cnn-basics
---

# Building Networks with TensorFlow/Keras

TensorFlow and Keras make building neural networks simple. This lesson covers how to create, train, and evaluate models using these industry-standard tools.

## TensorFlow and Keras Overview

- **TensorFlow**: Google's open-source deep learning framework
- **Keras**: High-level API for building neural networks (now part of TensorFlow)

```python
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

print(f"TensorFlow version: {tf.__version__}")
```

## Your First Keras Model

### Sequential API (Simple, Linear Stack)

```python
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout

# Build model
model = Sequential([
    Dense(128, activation='relu', input_shape=(784,)),
    Dropout(0.2),
    Dense(64, activation='relu'),
    Dropout(0.2),
    Dense(10, activation='softmax')
])

# View architecture
model.summary()
```

### Functional API (Flexible, Complex Architectures)

```python
from tensorflow.keras import Model, Input

# Define input
inputs = Input(shape=(784,))

# Build layers
x = Dense(128, activation='relu')(inputs)
x = Dropout(0.2)(x)
x = Dense(64, activation='relu')(x)
x = Dropout(0.2)(x)
outputs = Dense(10, activation='softmax')(x)

# Create model
model = Model(inputs=inputs, outputs=outputs)
```

## Compiling the Model

Configure the learning process:

```python
model.compile(
    optimizer='adam',                    # Optimization algorithm
    loss='categorical_crossentropy',     # Loss function
    metrics=['accuracy']                 # Metrics to track
)
```

### Common Optimizers
```python
# SGD with momentum
optimizer = keras.optimizers.SGD(learning_rate=0.01, momentum=0.9)

# Adam (usually best default)
optimizer = keras.optimizers.Adam(learning_rate=0.001)

# RMSprop (good for RNNs)
optimizer = keras.optimizers.RMSprop(learning_rate=0.001)
```

### Common Loss Functions
```python
# Classification
'categorical_crossentropy'  # Multi-class, one-hot labels
'sparse_categorical_crossentropy'  # Multi-class, integer labels
'binary_crossentropy'  # Binary classification

# Regression
'mse'  # Mean Squared Error
'mae'  # Mean Absolute Error
```

## Preparing Data

### Loading and Preprocessing MNIST

```python
from tensorflow.keras.datasets import mnist
from tensorflow.keras.utils import to_categorical

# Load data
(X_train, y_train), (X_test, y_test) = mnist.load_data()

# Reshape: (60000, 28, 28) -> (60000, 784)
X_train = X_train.reshape(-1, 784).astype('float32')
X_test = X_test.reshape(-1, 784).astype('float32')

# Normalize: [0, 255] -> [0, 1]
X_train /= 255.0
X_test /= 255.0

# One-hot encode labels
y_train = to_categorical(y_train, 10)
y_test = to_categorical(y_test, 10)

print(f"Training: {X_train.shape}, {y_train.shape}")
print(f"Test: {X_test.shape}, {y_test.shape}")
```

## Training the Model

```python
history = model.fit(
    X_train, y_train,
    epochs=20,
    batch_size=128,
    validation_split=0.2,  # Use 20% for validation
    verbose=1
)
```

### Understanding Training Output
```
Epoch 1/20
375/375 [==============================] - 2s 5ms/step
- loss: 0.4521
- accuracy: 0.8723
- val_loss: 0.1876
- val_accuracy: 0.9456
```

## Evaluating the Model

```python
# Evaluate on test set
test_loss, test_accuracy = model.evaluate(X_test, y_test, verbose=0)
print(f"Test Accuracy: {test_accuracy:.2%}")

# Make predictions
predictions = model.predict(X_test[:5])
predicted_classes = predictions.argmax(axis=1)
print(f"Predicted: {predicted_classes}")
print(f"Actual: {y_test[:5].argmax(axis=1)}")
```

## Visualizing Training History

```python
import matplotlib.pyplot as plt

# Plot training history
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))

# Accuracy
ax1.plot(history.history['accuracy'], label='Training')
ax1.plot(history.history['val_accuracy'], label='Validation')
ax1.set_title('Model Accuracy')
ax1.set_xlabel('Epoch')
ax1.set_ylabel('Accuracy')
ax1.legend()

# Loss
ax2.plot(history.history['loss'], label='Training')
ax2.plot(history.history['val_loss'], label='Validation')
ax2.set_title('Model Loss')
ax2.set_xlabel('Epoch')
ax2.set_ylabel('Loss')
ax2.legend()

plt.tight_layout()
plt.show()
```

## Callbacks

Control training with callbacks:

```python
from tensorflow.keras.callbacks import (
    EarlyStopping, ModelCheckpoint, ReduceLROnPlateau
)

callbacks = [
    # Stop if validation loss doesn't improve
    EarlyStopping(
        monitor='val_loss',
        patience=5,
        restore_best_weights=True
    ),

    # Save best model
    ModelCheckpoint(
        'best_model.keras',
        monitor='val_accuracy',
        save_best_only=True
    ),

    # Reduce learning rate on plateau
    ReduceLROnPlateau(
        monitor='val_loss',
        factor=0.5,
        patience=3
    )
]

history = model.fit(
    X_train, y_train,
    epochs=100,
    batch_size=128,
    validation_split=0.2,
    callbacks=callbacks
)
```

## Regularization Techniques

### Dropout

Randomly drops neurons during training to prevent overfitting:

```python
model = Sequential([
    Dense(256, activation='relu', input_shape=(784,)),
    Dropout(0.5),  # Drop 50% of neurons
    Dense(128, activation='relu'),
    Dropout(0.3),
    Dense(10, activation='softmax')
])
```

### L2 Regularization

Penalizes large weights:

```python
from tensorflow.keras.regularizers import l2

model = Sequential([
    Dense(256, activation='relu', input_shape=(784,),
          kernel_regularizer=l2(0.01)),
    Dense(128, activation='relu',
          kernel_regularizer=l2(0.01)),
    Dense(10, activation='softmax')
])
```

### Batch Normalization

Normalizes layer outputs for faster, more stable training:

```python
from tensorflow.keras.layers import BatchNormalization

model = Sequential([
    Dense(256, input_shape=(784,)),
    BatchNormalization(),
    keras.layers.Activation('relu'),
    Dense(128),
    BatchNormalization(),
    keras.layers.Activation('relu'),
    Dense(10, activation='softmax')
])
```

## Saving and Loading Models

```python
# Save entire model
model.save('my_model.keras')

# Load model
loaded_model = keras.models.load_model('my_model.keras')

# Save only weights
model.save_weights('model_weights.weights.h5')

# Load weights (need same architecture)
model.load_weights('model_weights.weights.h5')
```

## Complete Example: MNIST Classifier

```python
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
from tensorflow.keras.datasets import mnist
from tensorflow.keras.utils import to_categorical

# Load and preprocess data
(X_train, y_train), (X_test, y_test) = mnist.load_data()
X_train = X_train.reshape(-1, 784).astype('float32') / 255.0
X_test = X_test.reshape(-1, 784).astype('float32') / 255.0
y_train = to_categorical(y_train, 10)
y_test = to_categorical(y_test, 10)

# Build model
model = keras.Sequential([
    layers.Dense(256, activation='relu', input_shape=(784,)),
    layers.BatchNormalization(),
    layers.Dropout(0.3),
    layers.Dense(128, activation='relu'),
    layers.BatchNormalization(),
    layers.Dropout(0.3),
    layers.Dense(10, activation='softmax')
])

# Compile
model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Train
history = model.fit(
    X_train, y_train,
    epochs=20,
    batch_size=128,
    validation_split=0.2,
    callbacks=[
        keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True)
    ]
)

# Evaluate
test_loss, test_acc = model.evaluate(X_test, y_test)
print(f"\nTest Accuracy: {test_acc:.2%}")
```

## Knowledge Check

1. What is the purpose of the compile() method in Keras?
   - To configure the optimizer, loss function, and metrics for training
   - To build the model architecture
   - To load training data
   - To save the model

2. What does Dropout do during training?
   - Randomly sets a fraction of neurons to zero to prevent overfitting
   - Speeds up training
   - Increases model accuracy
   - Reduces memory usage

3. When should you use EarlyStopping?
   - To stop training when validation performance stops improving
   - To speed up each epoch
   - To reduce model size
   - To increase batch size

4. What is the difference between categorical_crossentropy and sparse_categorical_crossentropy?
   - categorical needs one-hot encoded labels, sparse uses integer labels
   - They are identical
   - sparse is faster
   - categorical is for binary classification

5. What does model.fit() return?
   - A History object containing training and validation metrics over epochs
   - The trained model
   - The test accuracy
   - The model weights
