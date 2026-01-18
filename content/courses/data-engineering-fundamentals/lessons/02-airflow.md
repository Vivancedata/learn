---
id: de-airflow
title: Workflow Orchestration with Airflow
type: lesson
duration: 55 mins
order: 2
section: orchestration
prevLessonId: de-intro
nextLessonId: de-spark
---

# Workflow Orchestration with Airflow

Apache Airflow is the most popular workflow orchestration tool for data pipelines. It lets you programmatically author, schedule, and monitor complex data workflows.

## What is Workflow Orchestration?

Orchestration manages the execution of interconnected tasks:

```
Without Orchestration:
- Run scripts manually
- Hope dependencies are met
- Check logs manually for errors
- No retry logic
- No monitoring

With Orchestration:
- Automated scheduling
- Dependency management
- Automatic retries
- Centralized monitoring
- Alerting on failures
```

## Airflow Concepts

### DAGs (Directed Acyclic Graphs)

A DAG defines the workflow structure and dependencies:

```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'data-team',
    'depends_on_past': False,
    'start_date': datetime(2024, 1, 1),
    'email_on_failure': True,
    'email': ['team@company.com'],
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'daily_sales_pipeline',
    default_args=default_args,
    description='Process daily sales data',
    schedule_interval='0 6 * * *',  # Run at 6 AM daily
    catchup=False,
)
```

### Tasks and Operators

Tasks are individual units of work:

```python
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.providers.postgres.operators.postgres import PostgresOperator

# Python task
def extract_data():
    import pandas as pd
    df = pd.read_csv('/data/sales.csv')
    df.to_parquet('/tmp/sales.parquet')

extract_task = PythonOperator(
    task_id='extract_data',
    python_callable=extract_data,
    dag=dag,
)

# Bash task
transform_task = BashOperator(
    task_id='transform_data',
    bash_command='python /scripts/transform.py',
    dag=dag,
)

# SQL task
load_task = PostgresOperator(
    task_id='load_to_warehouse',
    postgres_conn_id='warehouse',
    sql='sql/load_sales.sql',
    dag=dag,
)

# Define dependencies
extract_task >> transform_task >> load_task
```

### TaskFlow API (Modern Approach)

```python
from airflow.decorators import dag, task
from datetime import datetime

@dag(
    schedule_interval='@daily',
    start_date=datetime(2024, 1, 1),
    catchup=False,
)
def sales_pipeline():

    @task()
    def extract():
        import pandas as pd
        return pd.read_csv('/data/sales.csv').to_dict()

    @task()
    def transform(data: dict):
        import pandas as pd
        df = pd.DataFrame(data)
        df['total'] = df['quantity'] * df['price']
        return df.to_dict()

    @task()
    def load(data: dict):
        import pandas as pd
        df = pd.DataFrame(data)
        df.to_sql('sales', engine, if_exists='append')

    # Define dependencies via function calls
    raw_data = extract()
    transformed = transform(raw_data)
    load(transformed)

# Instantiate DAG
sales_dag = sales_pipeline()
```

## Common Operators

### PythonOperator

```python
from airflow.operators.python import PythonOperator

def my_function(execution_date, **kwargs):
    print(f"Running for {execution_date}")
    # Access task instance
    ti = kwargs['ti']
    ti.xcom_push(key='result', value=42)

task = PythonOperator(
    task_id='python_task',
    python_callable=my_function,
    provide_context=True,
)
```

### BashOperator

```python
from airflow.operators.bash import BashOperator

task = BashOperator(
    task_id='run_script',
    bash_command='python /scripts/process.py --date {{ ds }}',
)
```

### Sensors (Wait for Conditions)

```python
from airflow.sensors.filesystem import FileSensor
from airflow.sensors.external_task import ExternalTaskSensor

# Wait for file
wait_for_file = FileSensor(
    task_id='wait_for_file',
    filepath='/data/input/{{ ds }}.csv',
    poke_interval=60,
    timeout=3600,
)

# Wait for another DAG
wait_for_upstream = ExternalTaskSensor(
    task_id='wait_for_upstream',
    external_dag_id='upstream_dag',
    external_task_id='final_task',
    timeout=7200,
)
```

### Database Operators

```python
from airflow.providers.postgres.operators.postgres import PostgresOperator

task = PostgresOperator(
    task_id='create_table',
    postgres_conn_id='my_postgres',
    sql="""
        CREATE TABLE IF NOT EXISTS sales (
            id SERIAL PRIMARY KEY,
            date DATE,
            amount DECIMAL(10, 2)
        );
    """,
)
```

## XComs (Cross-Communication)

Pass data between tasks:

```python
@task()
def extract():
    data = fetch_from_api()
    return data  # Automatically pushed to XCom

@task()
def transform(data):  # Automatically pulled from XCom
    return process(data)

@task()
def load(data):
    save_to_db(data)

# Pipeline
data = extract()
transformed = transform(data)
load(transformed)
```

### Manual XCom

```python
def push_data(**context):
    context['ti'].xcom_push(key='my_data', value={'count': 100})

def pull_data(**context):
    data = context['ti'].xcom_pull(task_ids='push_task', key='my_data')
    print(f"Received: {data}")
```

## Branching and Conditions

```python
from airflow.operators.python import BranchPythonOperator

def choose_branch(**context):
    execution_date = context['ds']
    if is_weekend(execution_date):
        return 'weekend_task'
    return 'weekday_task'

branch = BranchPythonOperator(
    task_id='branch',
    python_callable=choose_branch,
)

weekday_task = PythonOperator(task_id='weekday_task', ...)
weekend_task = PythonOperator(task_id='weekend_task', ...)

branch >> [weekday_task, weekend_task]
```

## Complete DAG Example

```python
from airflow.decorators import dag, task
from airflow.operators.email import EmailOperator
from datetime import datetime, timedelta

@dag(
    dag_id='etl_sales_pipeline',
    schedule_interval='0 6 * * *',
    start_date=datetime(2024, 1, 1),
    catchup=False,
    default_args={
        'owner': 'data-team',
        'retries': 3,
        'retry_delay': timedelta(minutes=5),
    },
    tags=['sales', 'production'],
)
def etl_sales():

    @task()
    def extract_orders(execution_date=None):
        import pandas as pd
        df = pd.read_csv(f'/data/orders_{execution_date}.csv')
        return df.to_dict()

    @task()
    def extract_products():
        import pandas as pd
        df = pd.read_csv('/data/products.csv')
        return df.to_dict()

    @task()
    def transform(orders: dict, products: dict):
        import pandas as pd
        orders_df = pd.DataFrame(orders)
        products_df = pd.DataFrame(products)

        merged = orders_df.merge(products_df, on='product_id')
        merged['revenue'] = merged['quantity'] * merged['price']

        return merged.to_dict()

    @task()
    def load(data: dict):
        import pandas as pd
        from sqlalchemy import create_engine

        df = pd.DataFrame(data)
        engine = create_engine('postgresql://...')
        df.to_sql('fact_sales', engine, if_exists='append', index=False)

        return len(df)

    @task()
    def notify(row_count: int):
        print(f"Pipeline complete. Loaded {row_count} rows.")

    # Build pipeline
    orders = extract_orders()
    products = extract_products()
    transformed = transform(orders, products)
    count = load(transformed)
    notify(count)

# Create DAG
dag = etl_sales()
```

## Best Practices

### 1. Keep DAGs Simple
```python
# Good: One DAG per pipeline
dag_sales = create_sales_dag()
dag_inventory = create_inventory_dag()

# Bad: One giant DAG for everything
```

### 2. Use Idempotent Tasks
```python
@task()
def load_data(date):
    # Delete existing data first
    execute(f"DELETE FROM sales WHERE date = '{date}'")
    # Then insert
    execute(f"INSERT INTO sales SELECT * FROM staging")
```

### 3. Fail Fast
```python
@task()
def validate_data(data):
    if len(data) == 0:
        raise ValueError("No data to process!")
    return data
```

### 4. Use Connections
```python
# Store credentials in Airflow Connections UI
from airflow.hooks.base import BaseHook

conn = BaseHook.get_connection('my_database')
engine = create_engine(f"postgresql://{conn.login}:{conn.password}@{conn.host}")
```

## Knowledge Check

1. What is a DAG in Airflow?
   - A directed acyclic graph defining workflow tasks and dependencies
   - A type of database
   - A scheduling algorithm
   - A programming language

2. What is the purpose of XComs?
   - Pass data between tasks in a DAG
   - Schedule tasks
   - Store logs
   - Send emails

3. When would you use a Sensor?
   - To wait for a condition before proceeding
   - To transform data
   - To load data
   - To extract data

4. What does the catchup parameter control?
   - Whether to run DAG for past dates when first enabled
   - The retry behavior
   - The schedule timing
   - The email notifications

5. What is the TaskFlow API?
   - A modern, decorator-based way to define Airflow DAGs
   - A REST API for Airflow
   - A database connector
   - A monitoring tool
