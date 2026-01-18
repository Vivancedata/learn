---
id: mlops-docker
title: Containerization with Docker
type: lesson
duration: 55 mins
order: 2
section: deployment
prevLessonId: mlops-intro
nextLessonId: mlops-model-serving
---

# Containerization with Docker

Docker packages your ML application and all its dependencies into a portable container. This ensures your model runs the same way everywhere - from your laptop to production.

## Why Docker for ML?

### The "It Works on My Machine" Problem

```
Data Scientist's laptop:
- Python 3.9.7
- scikit-learn 1.0.2
- numpy 1.21.4
- Ubuntu 20.04

Production server:
- Python 3.8.10
- scikit-learn 0.24.2
- numpy 1.19.5
- CentOS 7

Result: "ModuleNotFoundError" or different predictions
```

### Docker Solution

```
Docker Container:
┌─────────────────────────────┐
│  Your ML Application        │
│  ├── model.pkl              │
│  ├── app.py                 │
│  └── requirements.txt       │
├─────────────────────────────┤
│  Python 3.10                │
│  scikit-learn 1.3.0         │
│  numpy 1.24.0               │
├─────────────────────────────┤
│  Ubuntu 22.04               │
└─────────────────────────────┘
  Runs identically everywhere
```

## Docker Basics

### Key Concepts

- **Image**: Blueprint for containers (like a class)
- **Container**: Running instance of an image (like an object)
- **Dockerfile**: Instructions to build an image
- **Registry**: Storage for images (Docker Hub, ECR, GCR)

### Basic Commands

```bash
# Build an image
docker build -t my-ml-app:v1 .

# Run a container
docker run -p 8000:8000 my-ml-app:v1

# List containers
docker ps

# Stop a container
docker stop <container_id>

# Remove a container
docker rm <container_id>

# List images
docker images

# Remove an image
docker rmi my-ml-app:v1
```

## Writing Dockerfiles for ML

### Basic ML Dockerfile

```dockerfile
# Use official Python image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy requirements first (for caching)
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["python", "app.py"]
```

### Optimized ML Dockerfile

```dockerfile
# Stage 1: Build stage
FROM python:3.10-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Production stage
FROM python:3.10-slim

WORKDIR /app

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy application
COPY model/ ./model/
COPY src/ ./src/
COPY app.py .

# Create non-root user
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Example: FastAPI ML Application

### Project Structure

```
ml-api/
├── Dockerfile
├── requirements.txt
├── app.py
├── model/
│   ├── model.pkl
│   └── preprocessor.pkl
└── src/
    └── predict.py
```

### requirements.txt

```
fastapi==0.104.1
uvicorn==0.24.0
scikit-learn==1.3.2
pandas==2.1.3
numpy==1.26.2
joblib==1.3.2
```

### app.py

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI(title="ML Model API")

# Load model at startup
model = joblib.load("model/model.pkl")
preprocessor = joblib.load("model/preprocessor.pkl")

class PredictionRequest(BaseModel):
    features: list[float]

class PredictionResponse(BaseModel):
    prediction: float
    confidence: float

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    try:
        # Preprocess
        features = np.array(request.features).reshape(1, -1)
        processed = preprocessor.transform(features)

        # Predict
        prediction = model.predict(processed)[0]
        probabilities = model.predict_proba(processed)[0]
        confidence = max(probabilities)

        return PredictionResponse(
            prediction=float(prediction),
            confidence=float(confidence)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Building and Running

```bash
# Build the image
docker build -t ml-api:v1 .

# Run the container
docker run -d -p 8000:8000 --name ml-api ml-api:v1

# Test the API
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"features": [1.0, 2.0, 3.0, 4.0]}'

# View logs
docker logs ml-api

# Stop and remove
docker stop ml-api && docker rm ml-api
```

## Docker Compose for ML

When you need multiple services:

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - MODEL_PATH=/app/model/model.pkl
      - LOG_LEVEL=INFO
    volumes:
      - ./model:/app/model:ro
    depends_on:
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  prometheus:
    image: prom/prometheus:v2.47.0
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:10.2.0
    ports:
      - "3000:3000"
    depends_on:
      - prometheus
```

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down
```

## GPU Support

```dockerfile
# Use NVIDIA CUDA base image
FROM nvidia/cuda:11.8.0-cudnn8-runtime-ubuntu22.04

# Install Python
RUN apt-get update && apt-get install -y python3 python3-pip

# Install PyTorch with CUDA
RUN pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# Rest of your application
COPY . /app
WORKDIR /app
CMD ["python3", "app.py"]
```

```bash
# Run with GPU support
docker run --gpus all -p 8000:8000 my-gpu-app:v1
```

## Best Practices

### 1. Use .dockerignore

```
# .dockerignore
.git
.gitignore
__pycache__
*.pyc
*.pyo
.pytest_cache
.coverage
*.egg-info
venv/
.env
notebooks/
data/raw/
*.ipynb
```

### 2. Pin Versions

```dockerfile
# Bad
FROM python:3

# Good
FROM python:3.10.13-slim-bookworm
```

### 3. Order Instructions by Change Frequency

```dockerfile
# Rarely changes
FROM python:3.10-slim
WORKDIR /app

# Occasionally changes
COPY requirements.txt .
RUN pip install -r requirements.txt

# Frequently changes
COPY . .
```

### 4. Use Multi-Stage Builds

Reduces final image size by 50-80%.

## Knowledge Check

1. What problem does Docker solve for ML deployment?
   - Ensures consistent environments across development and production
   - Makes models train faster
   - Increases model accuracy
   - Reduces data storage

2. What is the difference between a Docker image and container?
   - Image is a blueprint; container is a running instance
   - They are the same thing
   - Container is larger than image
   - Image runs on production only

3. Why do we copy requirements.txt before the rest of the code?
   - To leverage Docker's layer caching for faster builds
   - It's required by Docker
   - To reduce image size
   - For security reasons

4. What does multi-stage builds accomplish?
   - Reduces final image size by excluding build dependencies
   - Makes containers run faster
   - Enables GPU support
   - Allows multiple applications

5. What is the purpose of a health check in Docker?
   - To verify the container is running correctly and restart if not
   - To check CPU usage
   - To measure memory
   - To count requests
