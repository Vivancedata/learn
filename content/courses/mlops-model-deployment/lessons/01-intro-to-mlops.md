---
id: mlops-intro
title: Introduction to MLOps
type: lesson
duration: 45 mins
order: 1
section: fundamentals
nextLessonId: mlops-docker
---

# Introduction to MLOps

MLOps (Machine Learning Operations) applies DevOps principles to machine learning systems. It addresses the unique challenges of deploying and maintaining ML models in production.

## Why MLOps?

### The Production Gap

Most ML projects fail to reach production:
- 87% of ML projects never make it to production
- Only 22% of companies successfully deploy ML models
- Average time from prototype to production: 3+ months

### The Challenge

ML systems are fundamentally different from traditional software:

```
Traditional Software:
Code → Deploy → Done (until code changes)

ML Systems:
Code + Data + Model → Deploy → Monitor → Retrain → Redeploy
      ↑                               ↓
      └───────────────────────────────┘
```

## ML System Challenges

### 1. Data Dependencies
```python
# Your model depends on data quality
# If data changes, model performance changes

# Example: Feature drift
# Training: average_price = $50,000
# Production: average_price = $75,000 (inflation)
# Result: Model predictions become inaccurate
```

### 2. Reproducibility
```python
# Can you recreate this model?
# - Same data version?
# - Same preprocessing?
# - Same hyperparameters?
# - Same random seeds?
# - Same library versions?
```

### 3. Model Decay
```
Model Performance Over Time:
100% ─────┐
          │
 95% ─────│──────┐
          │      │
 90% ─────│──────│──────┐
          │      │      │
 85% ─────│──────│──────│────→ Time
     Deploy  3mo   6mo   12mo
```

### 4. Testing Complexity
Traditional software: Unit tests, integration tests
ML systems: Data tests, model tests, infrastructure tests

## The MLOps Lifecycle

```
┌──────────────────────────────────────────────────────────┐
│                     MLOps Lifecycle                       │
├───────────┬───────────┬───────────┬──────────┬───────────┤
│   Data    │  Model    │  Deploy   │ Monitor  │  Retrain  │
│ Pipeline  │ Training  │           │          │           │
├───────────┼───────────┼───────────┼──────────┼───────────┤
│ - Ingest  │ - Experi- │ - Package │ - Metrics│ - Trigger │
│ - Clean   │   ment    │ - Test    │ - Alerts │ - Validate│
│ - Feature │ - Train   │ - Deploy  │ - Logging│ - Deploy  │
│ - Store   │ - Evaluate│ - Serve   │ - Drift  │           │
└───────────┴───────────┴───────────┴──────────┴───────────┘
```

## MLOps Maturity Levels

### Level 0: Manual ML
- Jupyter notebooks for everything
- Manual model training and deployment
- No automation or monitoring

### Level 1: ML Pipeline Automation
- Automated training pipeline
- Model registry for versioning
- Basic CI/CD for deployment

### Level 2: CI/CD for ML
- Automated testing (data, model, code)
- Feature stores
- A/B testing and canary deployments
- Automated retraining

### Level 3: Full MLOps
- Automated everything
- Self-healing systems
- Multi-model orchestration
- Advanced monitoring and observability

## Key MLOps Practices

### 1. Version Everything

```bash
# Code versioning
git commit -m "Update feature engineering"

# Data versioning (DVC)
dvc add data/training_data.csv
git add data/training_data.csv.dvc
git commit -m "Update training data v2.1"

# Model versioning (MLflow)
mlflow.log_model(model, "model")
```

### 2. Automate Pipelines

```python
# Example: Training pipeline
def training_pipeline():
    # 1. Load and validate data
    data = load_data()
    validate_data(data)

    # 2. Feature engineering
    features = create_features(data)

    # 3. Train model
    model = train_model(features)

    # 4. Evaluate
    metrics = compute_metrics(model, test_data)

    # 5. Register if good enough
    if metrics["accuracy"] > 0.95:
        register_model(model, metrics)
```

### 3. Test Everything

```python
# Data tests
def test_data_schema():
    assert "feature_1" in df.columns
    assert df["feature_1"].dtype == float
    assert df["feature_1"].min() >= 0

# Model tests
def test_model_prediction_shape():
    predictions = model.predict(sample_input)
    assert predictions.shape == (100, 1)

def test_model_performance():
    accuracy = model.score(X_test, y_test)
    assert accuracy > 0.90
```

### 4. Monitor in Production

```python
# Log predictions and inputs
logger.info({
    "timestamp": datetime.now(),
    "input_features": features.tolist(),
    "prediction": prediction,
    "model_version": "1.2.3"
})

# Track metrics
metrics_client.record("prediction_latency", latency_ms)
metrics_client.record("prediction_count", 1)
```

## MLOps Tools Landscape

### Experiment Tracking
- **MLflow**: Open source, comprehensive
- **Weights & Biases**: Cloud-based, great UI
- **Neptune**: Experiment management

### Model Registry
- **MLflow Model Registry**
- **Vertex AI Model Registry** (GCP)
- **SageMaker Model Registry** (AWS)

### Feature Stores
- **Feast**: Open source
- **Tecton**: Enterprise
- **Databricks Feature Store**

### Orchestration
- **Airflow**: Workflow scheduling
- **Kubeflow**: Kubernetes-native
- **Prefect**: Modern Python-native

### Serving
- **TorchServe**: PyTorch models
- **TensorFlow Serving**: TF models
- **Seldon Core**: Kubernetes-native
- **FastAPI**: Custom REST APIs

### Monitoring
- **Prometheus + Grafana**: Metrics
- **Evidently**: ML-specific monitoring
- **Arize**: ML observability platform

## Practical Example: ML Project Structure

```
ml-project/
├── data/
│   ├── raw/
│   ├── processed/
│   └── features/
├── models/
│   └── trained/
├── src/
│   ├── data/
│   │   ├── load.py
│   │   └── preprocess.py
│   ├── features/
│   │   └── build_features.py
│   ├── models/
│   │   ├── train.py
│   │   └── predict.py
│   └── api/
│       └── app.py
├── tests/
│   ├── test_data.py
│   ├── test_model.py
│   └── test_api.py
├── notebooks/
│   └── exploration.ipynb
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── pyproject.toml
└── .github/
    └── workflows/
        └── ci.yml
```

## Knowledge Check

1. Why do most ML projects fail to reach production?
   - Lack of MLOps practices for deployment, monitoring, and maintenance
   - The models are too accurate
   - Not enough data scientists
   - Machine learning is too new

2. What makes ML systems different from traditional software?
   - ML systems depend on data and models that change over time
   - ML systems are always faster
   - ML systems don't need testing
   - ML systems never need updates

3. What is model decay?
   - Performance degradation over time as data distributions change
   - When a model file gets corrupted
   - When training takes too long
   - When models become too large

4. Which MLOps practice helps with reproducibility?
   - Version control for code, data, and models
   - Using Jupyter notebooks
   - Manual deployment
   - No testing

5. What is a feature store?
   - A centralized repository for storing and serving ML features
   - A place to buy ML models
   - A database for predictions
   - A type of model registry
