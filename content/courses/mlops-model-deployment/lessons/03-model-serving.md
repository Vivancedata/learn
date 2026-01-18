---
id: mlops-model-serving
title: Model Serving with FastAPI
type: lesson
duration: 55 mins
order: 3
section: deployment
prevLessonId: mlops-docker
nextLessonId: mlops-mlflow
---

# Model Serving with FastAPI

Model serving exposes your ML model as an API that applications can call. FastAPI is a modern Python framework perfect for building high-performance ML APIs.

## Why FastAPI for ML?

- **Fast**: Built on Starlette and Pydantic, one of the fastest Python frameworks
- **Type Safety**: Automatic validation with Pydantic models
- **Auto Documentation**: Generates OpenAPI/Swagger docs
- **Async Support**: Handles concurrent requests efficiently
- **Easy to Learn**: Simple, Pythonic syntax

## Basic Model Serving

### Simple Prediction API

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI(
    title="ML Prediction API",
    description="API for serving ML predictions",
    version="1.0.0"
)

# Load model at startup
model = None

@app.on_event("startup")
async def load_model():
    global model
    model = joblib.load("model.pkl")
    print("Model loaded successfully")

# Request/Response schemas
class PredictionRequest(BaseModel):
    features: list[float]

    class Config:
        json_schema_extra = {
            "example": {
                "features": [5.1, 3.5, 1.4, 0.2]
            }
        }

class PredictionResponse(BaseModel):
    prediction: int
    probability: float
    class_name: str

# Endpoints
@app.get("/")
def root():
    return {"message": "ML Prediction API", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy", "model_loaded": model is not None}

@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        features = np.array(request.features).reshape(1, -1)
        prediction = int(model.predict(features)[0])
        probabilities = model.predict_proba(features)[0]

        class_names = ["setosa", "versicolor", "virginica"]

        return PredictionResponse(
            prediction=prediction,
            probability=float(max(probabilities)),
            class_name=class_names[prediction]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Running the API

```bash
# Install dependencies
pip install fastapi uvicorn scikit-learn joblib

# Run with uvicorn
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Access documentation
# http://localhost:8000/docs (Swagger UI)
# http://localhost:8000/redoc (ReDoc)
```

## Advanced Patterns

### Batch Predictions

```python
class BatchPredictionRequest(BaseModel):
    instances: list[list[float]]

class BatchPredictionResponse(BaseModel):
    predictions: list[int]
    probabilities: list[float]

@app.post("/predict/batch", response_model=BatchPredictionResponse)
def predict_batch(request: BatchPredictionRequest):
    features = np.array(request.instances)
    predictions = model.predict(features).tolist()
    probabilities = model.predict_proba(features).max(axis=1).tolist()

    return BatchPredictionResponse(
        predictions=predictions,
        probabilities=probabilities
    )
```

### Async Predictions

```python
import asyncio
from concurrent.futures import ThreadPoolExecutor

executor = ThreadPoolExecutor(max_workers=4)

async def async_predict(features):
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        executor,
        lambda: model.predict(features)
    )

@app.post("/predict/async")
async def predict_async(request: PredictionRequest):
    features = np.array(request.features).reshape(1, -1)
    prediction = await async_predict(features)
    return {"prediction": int(prediction[0])}
```

### Request Validation

```python
from pydantic import BaseModel, Field, validator

class ValidatedRequest(BaseModel):
    features: list[float] = Field(
        ...,
        min_items=4,
        max_items=4,
        description="Exactly 4 numerical features required"
    )

    @validator("features", each_item=True)
    def validate_feature_range(cls, v):
        if v < 0 or v > 100:
            raise ValueError("Features must be between 0 and 100")
        return v
```

### Error Handling

```python
from fastapi import Request
from fastapi.responses import JSONResponse
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": str(exc),
            "type": type(exc).__name__,
            "path": str(request.url)
        }
    )

class ModelNotFoundError(Exception):
    pass

@app.exception_handler(ModelNotFoundError)
async def model_not_found_handler(request: Request, exc: ModelNotFoundError):
    return JSONResponse(
        status_code=503,
        content={"error": "Model not available", "detail": str(exc)}
    )
```

## Model Caching and Optimization

### LRU Cache for Predictions

```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def cached_predict(features_tuple: tuple):
    features = np.array(features_tuple).reshape(1, -1)
    return int(model.predict(features)[0])

@app.post("/predict/cached")
def predict_cached(request: PredictionRequest):
    # Convert list to tuple for caching
    features_tuple = tuple(request.features)
    prediction = cached_predict(features_tuple)
    return {"prediction": prediction}
```

### Redis Caching

```python
import redis
import json
import hashlib

redis_client = redis.Redis(host='localhost', port=6379)

def get_cache_key(features: list) -> str:
    return hashlib.md5(json.dumps(features).encode()).hexdigest()

@app.post("/predict/redis-cached")
def predict_with_redis_cache(request: PredictionRequest):
    cache_key = get_cache_key(request.features)

    # Check cache
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    # Compute prediction
    features = np.array(request.features).reshape(1, -1)
    prediction = int(model.predict(features)[0])

    result = {"prediction": prediction, "cached": False}

    # Store in cache (expire after 1 hour)
    redis_client.setex(cache_key, 3600, json.dumps(result))

    return result
```

## Logging and Monitoring

```python
import logging
import time
from fastapi import Request

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()

    response = await call_next(request)

    process_time = time.time() - start_time

    logger.info(
        f"{request.method} {request.url.path} "
        f"status={response.status_code} "
        f"duration={process_time:.3f}s"
    )

    response.headers["X-Process-Time"] = str(process_time)
    return response

# Prediction logging
@app.post("/predict")
def predict_with_logging(request: PredictionRequest):
    start = time.time()

    features = np.array(request.features).reshape(1, -1)
    prediction = int(model.predict(features)[0])

    duration = time.time() - start

    logger.info({
        "event": "prediction",
        "input_shape": features.shape,
        "prediction": prediction,
        "duration_ms": duration * 1000
    })

    return {"prediction": prediction}
```

## Complete Production API

```python
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import numpy as np
import logging
import time
from contextlib import asynccontextmanager

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Model storage
models = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Loading models...")
    models["classifier"] = joblib.load("model.pkl")
    models["preprocessor"] = joblib.load("preprocessor.pkl")
    logger.info("Models loaded successfully")
    yield
    # Shutdown
    logger.info("Shutting down...")
    models.clear()

app = FastAPI(
    title="Production ML API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Schemas
class PredictionRequest(BaseModel):
    features: list[float] = Field(..., min_items=4, max_items=4)

class PredictionResponse(BaseModel):
    prediction: int
    probability: float
    model_version: str = "1.0.0"
    latency_ms: float

# Endpoints
@app.get("/health")
def health():
    return {
        "status": "healthy",
        "models_loaded": list(models.keys())
    }

@app.post("/predict", response_model=PredictionResponse)
def predict(request: PredictionRequest):
    start = time.time()

    features = np.array(request.features).reshape(1, -1)
    processed = models["preprocessor"].transform(features)
    prediction = int(models["classifier"].predict(processed)[0])
    probability = float(models["classifier"].predict_proba(processed).max())

    latency = (time.time() - start) * 1000

    return PredictionResponse(
        prediction=prediction,
        probability=probability,
        latency_ms=round(latency, 2)
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## Knowledge Check

1. Why is FastAPI a good choice for ML serving?
   - High performance, automatic validation, and built-in documentation
   - It's the oldest Python framework
   - It only works with scikit-learn
   - It requires no dependencies

2. What is the purpose of Pydantic models in FastAPI?
   - Request/response validation and automatic schema generation
   - Database connections
   - Model training
   - File storage

3. Why load the model in a startup event?
   - To load it once when the server starts, not on every request
   - Because models can't be loaded in functions
   - It's required by FastAPI
   - To enable GPU support

4. What is the benefit of using Redis for prediction caching?
   - Avoid recomputing identical predictions, reducing latency
   - It makes models more accurate
   - It's required for production
   - To store model weights

5. What does the lifespan context manager handle?
   - Resource initialization at startup and cleanup at shutdown
   - Request logging
   - Error handling
   - Model training
