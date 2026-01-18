---
id: de-intro
title: Introduction to Data Engineering
type: lesson
duration: 45 mins
order: 1
section: fundamentals
nextLessonId: de-data-modeling
---

# Introduction to Data Engineering

Data engineering is the discipline of designing, building, and maintaining the infrastructure and systems that enable data collection, storage, and analysis. Data engineers build the pipelines that make data science possible.

## What is Data Engineering?

```
Raw Data Sources          Data Engineering           Analytics Ready
┌─────────────┐     ┌──────────────────────┐     ┌─────────────┐
│ Databases   │     │ Extract              │     │ Dashboards  │
│ APIs        │────▶│ Transform            │────▶│ ML Models   │
│ Files       │     │ Load                 │     │ Reports     │
│ Streams     │     │ Orchestrate          │     │ Analytics   │
└─────────────┘     └──────────────────────┘     └─────────────┘
```

### Data Engineer vs Data Scientist

| Aspect | Data Engineer | Data Scientist |
|--------|---------------|----------------|
| Focus | Data infrastructure | Analysis & modeling |
| Output | Pipelines, APIs | Models, insights |
| Tools | Spark, Airflow, SQL | Python, R, notebooks |
| Skills | Software engineering | Statistics, ML |
| Question | "How do we get the data?" | "What does the data tell us?" |

## The Modern Data Stack

### Traditional Stack (Pre-2015)
```
Sources → ETL Tool → Data Warehouse → BI Tool
         (Informatica)  (Oracle)     (Tableau)
```

### Modern Stack (2015+)
```
Sources → Ingestion → Cloud Warehouse → Transformation → Analytics
         (Fivetran)   (Snowflake)      (dbt)           (Looker)
                           │
                      Orchestration
                        (Airflow)
```

### Key Components

**1. Data Ingestion**
- Batch: Airbyte, Fivetran, custom scripts
- Streaming: Kafka, Kinesis, Pulsar

**2. Storage**
- Data Lakes: S3, GCS, Azure Blob
- Data Warehouses: Snowflake, BigQuery, Redshift

**3. Transformation**
- SQL-based: dbt
- Code-based: Spark, Python

**4. Orchestration**
- Airflow, Prefect, Dagster

**5. Quality & Observability**
- Great Expectations, Monte Carlo, dbt tests

## Data Pipeline Fundamentals

### What is a Data Pipeline?

A data pipeline is a series of processing steps that move data from source to destination:

```python
# Simple pipeline example
def extract():
    """Pull data from source"""
    return pd.read_csv("source_data.csv")

def transform(df):
    """Clean and transform data"""
    df = df.dropna()
    df["created_at"] = pd.to_datetime(df["created_at"])
    df["amount_usd"] = df["amount"] * df["exchange_rate"]
    return df

def load(df):
    """Write to destination"""
    df.to_sql("processed_orders", engine, if_exists="append")

# Run pipeline
data = extract()
transformed = transform(data)
load(transformed)
```

### ETL vs ELT

**ETL (Extract, Transform, Load)**
```
Source → Transform (outside warehouse) → Load → Warehouse
```
- Transform before loading
- Used with on-premise systems
- Limited by ETL server capacity

**ELT (Extract, Load, Transform)**
```
Source → Load → Warehouse → Transform (inside warehouse)
```
- Load raw data first, transform in warehouse
- Leverages warehouse computing power
- Modern approach with cloud warehouses

```sql
-- ELT: Transform in warehouse with dbt
SELECT
    order_id,
    customer_id,
    order_date,
    SUM(line_total) as order_total
FROM {{ ref('stg_orders') }}
GROUP BY 1, 2, 3
```

## Data Quality

### The Cost of Bad Data

- IBM estimates bad data costs US companies $3.1 trillion per year
- 27% of data in enterprise systems is inaccurate
- Poor data quality leads to wrong decisions

### Data Quality Dimensions

```python
# 1. Completeness - No missing values
assert df["email"].notna().all(), "Missing emails found"

# 2. Accuracy - Values are correct
assert df["age"].between(0, 120).all(), "Invalid ages"

# 3. Consistency - Same format everywhere
assert df["phone"].str.match(r'\d{3}-\d{3}-\d{4}').all()

# 4. Timeliness - Data is up to date
max_delay = datetime.now() - df["updated_at"].max()
assert max_delay < timedelta(hours=24), "Data too stale"

# 5. Uniqueness - No duplicates
assert df["id"].is_unique, "Duplicate IDs found"
```

### Data Validation with Great Expectations

```python
import great_expectations as ge

# Create expectations
df = ge.from_pandas(pandas_df)

# Define expectations
df.expect_column_values_to_not_be_null("customer_id")
df.expect_column_values_to_be_between("amount", 0, 10000)
df.expect_column_values_to_match_regex("email", r".+@.+\..+")
df.expect_column_values_to_be_unique("order_id")

# Validate
results = df.validate()
print(f"Success: {results['success']}")
```

## Batch vs Streaming

### Batch Processing
Process data in large chunks on a schedule.

```python
# Daily batch job
@schedule(cron="0 2 * * *")  # Run at 2 AM daily
def daily_sales_pipeline():
    yesterday = date.today() - timedelta(days=1)

    # Process all orders from yesterday
    orders = extract_orders(date=yesterday)
    aggregated = aggregate_sales(orders)
    load_to_warehouse(aggregated)
```

**Use cases:**
- Daily reports
- Historical analysis
- ML model training

### Stream Processing
Process data in real-time as it arrives.

```python
# Streaming with Kafka
from kafka import KafkaConsumer

consumer = KafkaConsumer(
    'orders',
    bootstrap_servers=['localhost:9092']
)

for message in consumer:
    order = json.loads(message.value)
    process_order(order)
    update_real_time_dashboard(order)
```

**Use cases:**
- Real-time dashboards
- Fraud detection
- IoT sensor data

### Comparison

| Aspect | Batch | Streaming |
|--------|-------|-----------|
| Latency | Minutes to hours | Milliseconds to seconds |
| Complexity | Lower | Higher |
| Cost | Lower | Higher |
| Tools | Spark, Airflow | Kafka, Flink |
| Use Case | Reports, ML training | Real-time analytics |

## Data Engineering Best Practices

### 1. Idempotency
Pipeline can be run multiple times with same result.

```python
# Bad: Appends duplicates
df.to_sql("orders", engine, if_exists="append")

# Good: Upsert or replace
df.to_sql("orders", engine, if_exists="replace")

# Better: Partition-aware replace
execute_sql(f"""
    DELETE FROM orders WHERE date = '{target_date}';
    INSERT INTO orders SELECT * FROM staging_orders;
""")
```

### 2. Incremental Processing
Only process new/changed data.

```python
# Get last processed timestamp
last_run = get_last_run_timestamp()

# Only fetch new records
new_records = query(f"""
    SELECT * FROM source_table
    WHERE updated_at > '{last_run}'
""")

# Process and load
process_and_load(new_records)

# Update checkpoint
save_checkpoint(datetime.now())
```

### 3. Data Lineage
Track where data comes from and goes.

```sql
-- dbt documentation
{{ config(
    materialized='table',
    description='Daily aggregated sales by product category'
) }}

-- Lineage: stg_orders -> stg_products -> fct_daily_sales
SELECT ...
FROM {{ ref('stg_orders') }} o
JOIN {{ ref('stg_products') }} p ON o.product_id = p.id
```

### 4. Testing
Test data at every stage.

```python
def test_no_null_primary_keys():
    df = load_table("dim_customers")
    assert df["customer_id"].notna().all()

def test_referential_integrity():
    orders = load_table("fct_orders")
    customers = load_table("dim_customers")
    assert orders["customer_id"].isin(customers["customer_id"]).all()
```

## Knowledge Check

1. What is the main difference between ETL and ELT?
   - ELT transforms data inside the warehouse; ETL transforms before loading
   - They are the same thing
   - ELT is older than ETL
   - ETL is only for streaming

2. Which is NOT a data quality dimension?
   - Performance speed
   - Completeness
   - Accuracy
   - Uniqueness

3. When should you use stream processing instead of batch?
   - When you need real-time or near real-time data processing
   - When cost is the priority
   - For monthly reports
   - For training ML models

4. What does idempotency mean for data pipelines?
   - Running the pipeline multiple times produces the same result
   - The pipeline runs faster
   - The pipeline uses less memory
   - The pipeline processes all data

5. What is data lineage?
   - Tracking data origin, transformations, and destinations
   - The speed of data processing
   - The size of the data
   - The format of the data
