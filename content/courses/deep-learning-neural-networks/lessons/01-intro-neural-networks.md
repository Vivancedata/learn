---
id: dl-intro-neural-networks
title: Introduction to Neural Networks
type: lesson
duration: 55 mins
order: 1
section: fundamentals
nextLessonId: dl-building-networks
---

# Introduction to Neural Networks

Neural networks are computing systems inspired by the brain. They learn patterns from data through interconnected layers of artificial neurons.

## What is a Neural Network?

A neural network is a function that maps inputs to outputs through layers of mathematical transformations:

```
Input → [Layer 1] → [Layer 2] → ... → [Layer N] → Output
```

Each layer transforms data, learning increasingly abstract features.

## The Artificial Neuron (Perceptron)

A single neuron computes a weighted sum of inputs plus a bias, then applies an activation function:

```
         x₁ ──w₁──┐
                  │
         x₂ ──w₂──┼──→ Σ(w·x) + b ──→ f(z) ──→ output
                  │
         x₃ ──w₃──┘

output = f(w₁x₁ + w₂x₂ + w₃x₃ + b)
       = f(Σ wᵢxᵢ + b)
```

```python
import numpy as np

def neuron(inputs, weights, bias, activation_fn):
    """Single artificial neuron"""
    z = np.dot(inputs, weights) + bias  # Weighted sum
    return activation_fn(z)              # Apply activation

# Example
inputs = np.array([1.0, 2.0, 3.0])
weights = np.array([0.5, -0.5, 0.3])
bias = 0.1

# Linear output
z = np.dot(inputs, weights) + bias  # 1*0.5 + 2*(-0.5) + 3*0.3 + 0.1 = 0.5
```

## Activation Functions

Activation functions introduce non-linearity, enabling networks to learn complex patterns:

### Sigmoid
```python
def sigmoid(z):
    return 1 / (1 + np.exp(-z))

# Output: (0, 1) - good for probabilities
# Problem: Vanishing gradients for large |z|
```

### ReLU (Rectified Linear Unit)
```python
def relu(z):
    return np.maximum(0, z)

# Output: [0, ∞) - most popular for hidden layers
# Fast, avoids vanishing gradients
```

### Tanh
```python
def tanh(z):
    return np.tanh(z)

# Output: (-1, 1) - zero-centered
# Better than sigmoid, still has gradient issues
```

### Softmax (for multi-class output)
```python
def softmax(z):
    exp_z = np.exp(z - np.max(z))  # Numerical stability
    return exp_z / exp_z.sum()

# Output: probabilities that sum to 1
```

## Network Architecture

### Layers
- **Input Layer**: Receives raw data (no computation)
- **Hidden Layers**: Transform data (where learning happens)
- **Output Layer**: Produces final prediction

```python
# Simple network structure
network = {
    'input_size': 784,      # e.g., 28x28 image flattened
    'hidden_layers': [128, 64],  # Two hidden layers
    'output_size': 10       # e.g., 10 digit classes
}
```

### Dense (Fully Connected) Layers

Every neuron connects to every neuron in the previous layer:

```python
class DenseLayer:
    def __init__(self, input_size, output_size):
        # Initialize weights randomly
        self.weights = np.random.randn(input_size, output_size) * 0.01
        self.bias = np.zeros(output_size)

    def forward(self, x):
        return np.dot(x, self.weights) + self.bias
```

## Forward Propagation

Data flows through the network, layer by layer:

```python
def forward_pass(x, layers, activations):
    """Forward propagation through network"""
    current = x
    for layer, activation in zip(layers, activations):
        z = np.dot(current, layer['weights']) + layer['bias']
        current = activation(z)
    return current

# Example: 3-layer network
layers = [
    {'weights': W1, 'bias': b1},  # Input to Hidden1
    {'weights': W2, 'bias': b2},  # Hidden1 to Hidden2
    {'weights': W3, 'bias': b3},  # Hidden2 to Output
]
activations = [relu, relu, softmax]

output = forward_pass(input_data, layers, activations)
```

## Loss Functions

Loss measures how wrong our predictions are:

### Mean Squared Error (Regression)
```python
def mse_loss(y_true, y_pred):
    return np.mean((y_true - y_pred) ** 2)
```

### Cross-Entropy (Classification)
```python
def cross_entropy_loss(y_true, y_pred):
    # y_true: one-hot encoded
    # y_pred: softmax probabilities
    epsilon = 1e-15  # Prevent log(0)
    y_pred = np.clip(y_pred, epsilon, 1 - epsilon)
    return -np.sum(y_true * np.log(y_pred))
```

## Backpropagation: How Networks Learn

Backpropagation computes gradients of the loss with respect to each weight, using the chain rule:

```
∂Loss/∂w = ∂Loss/∂output × ∂output/∂z × ∂z/∂w
```

```python
# Simplified backprop for one layer
def backward_pass(x, y_true, y_pred, weights):
    # Output layer gradient
    d_loss = y_pred - y_true  # For cross-entropy + softmax

    # Weight gradient
    d_weights = np.dot(x.T, d_loss)

    # Bias gradient
    d_bias = np.sum(d_loss, axis=0)

    return d_weights, d_bias
```

## Gradient Descent

Update weights to minimize loss:

```python
def gradient_descent_step(weights, gradients, learning_rate):
    """Update weights using gradients"""
    return weights - learning_rate * gradients

# Training loop
learning_rate = 0.01
for epoch in range(num_epochs):
    # Forward pass
    predictions = forward_pass(X, layers, activations)

    # Calculate loss
    loss = cross_entropy_loss(y, predictions)

    # Backward pass (compute gradients)
    gradients = backward_pass(X, y, predictions, layers)

    # Update weights
    for layer, grad in zip(layers, gradients):
        layer['weights'] -= learning_rate * grad['weights']
        layer['bias'] -= learning_rate * grad['bias']
```

## Building a Simple Neural Network from Scratch

```python
import numpy as np

class SimpleNeuralNetwork:
    def __init__(self, layer_sizes):
        self.weights = []
        self.biases = []

        # Initialize weights for each layer
        for i in range(len(layer_sizes) - 1):
            w = np.random.randn(layer_sizes[i], layer_sizes[i+1]) * 0.01
            b = np.zeros((1, layer_sizes[i+1]))
            self.weights.append(w)
            self.biases.append(b)

    def relu(self, z):
        return np.maximum(0, z)

    def relu_derivative(self, z):
        return (z > 0).astype(float)

    def softmax(self, z):
        exp_z = np.exp(z - np.max(z, axis=1, keepdims=True))
        return exp_z / np.sum(exp_z, axis=1, keepdims=True)

    def forward(self, X):
        self.activations = [X]
        self.z_values = []

        current = X
        for i in range(len(self.weights) - 1):
            z = np.dot(current, self.weights[i]) + self.biases[i]
            self.z_values.append(z)
            current = self.relu(z)
            self.activations.append(current)

        # Output layer with softmax
        z = np.dot(current, self.weights[-1]) + self.biases[-1]
        self.z_values.append(z)
        output = self.softmax(z)
        self.activations.append(output)

        return output

    def backward(self, y_true, learning_rate):
        m = y_true.shape[0]

        # Output layer gradient
        delta = self.activations[-1] - y_true

        for i in range(len(self.weights) - 1, -1, -1):
            # Gradients
            dw = np.dot(self.activations[i].T, delta) / m
            db = np.sum(delta, axis=0, keepdims=True) / m

            # Update weights
            self.weights[i] -= learning_rate * dw
            self.biases[i] -= learning_rate * db

            # Propagate gradient backward
            if i > 0:
                delta = np.dot(delta, self.weights[i].T)
                delta *= self.relu_derivative(self.z_values[i-1])

    def train(self, X, y, epochs, learning_rate):
        for epoch in range(epochs):
            # Forward pass
            output = self.forward(X)

            # Calculate loss
            loss = -np.mean(np.sum(y * np.log(output + 1e-15), axis=1))

            # Backward pass
            self.backward(y, learning_rate)

            if epoch % 100 == 0:
                print(f"Epoch {epoch}, Loss: {loss:.4f}")

# Example usage
nn = SimpleNeuralNetwork([784, 128, 64, 10])
# nn.train(X_train, y_train_onehot, epochs=1000, learning_rate=0.1)
```

## Why Deep Networks?

Deeper networks can learn more complex patterns:

- **Layer 1**: Learns edges, basic patterns
- **Layer 2**: Combines edges into shapes
- **Layer 3**: Combines shapes into parts
- **Layer 4+**: Combines parts into objects

## Knowledge Check

1. What is the purpose of an activation function?
   - To introduce non-linearity so the network can learn complex patterns
   - To speed up training
   - To reduce the number of parameters
   - To normalize inputs

2. In backpropagation, what mathematical rule is used to compute gradients?
   - The chain rule
   - The product rule
   - L'Hôpital's rule
   - The quotient rule

3. What does ReLU output for negative inputs?
   - Zero
   - The input value itself
   - One
   - Negative infinity

4. What is the purpose of the softmax function in the output layer?
   - To convert outputs to probabilities that sum to 1
   - To speed up training
   - To prevent overfitting
   - To reduce memory usage

5. Why do we need multiple hidden layers in deep learning?
   - To learn hierarchical features of increasing abstraction
   - Because one layer is too slow
   - To use more memory
   - To make the code more complex
