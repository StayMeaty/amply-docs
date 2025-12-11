---
sidebar_position: 5
---

# SQS
*Message Queue for Background Jobs*

Amazon SQS provides the message queue backend for Celery workers.

## Queues

| Queue | Purpose | Configuration |
|-------|---------|---------------|
| `amply-celery` | Main task queue | Standard |
| `amply-celery-high` | High priority tasks | Standard |
| `amply-celery-low` | Low priority / batch | Standard |
| `amply-celery-dlq` | Dead letter queue | Standard |

## Queue Configuration

### Main Queue

```yaml
QueueName: amply-celery
Attributes:
  VisibilityTimeout: 1800            # 30 minutes (task timeout + buffer)
  MessageRetentionPeriod: 1209600    # 14 days
  MaximumMessageSize: 262144         # 256 KB
  ReceiveMessageWaitTimeSeconds: 20  # Long polling
  DelaySeconds: 0

  # Dead letter queue
  RedrivePolicy:
    deadLetterTargetArn: arn:aws:sqs:...:amply-celery-dlq
    maxReceiveCount: 5               # After 5 failures, move to DLQ
```

### High Priority Queue

```yaml
QueueName: amply-celery-high
Attributes:
  VisibilityTimeout: 600             # 10 minutes
  # Workers poll this queue first
```

### Dead Letter Queue

```yaml
QueueName: amply-celery-dlq
Attributes:
  MessageRetentionPeriod: 1209600    # 14 days
  # Messages here need manual investigation
```

## Celery Configuration

```python
# jobs/celery_app.py
from celery import Celery

app = Celery('amply')

app.conf.update(
    # SQS as broker
    broker_url='sqs://',
    broker_transport_options={
        'region': 'eu-central-1',
        'visibility_timeout': 1800,
        'polling_interval': 1,
        'wait_time_seconds': 20,
        'queue_name_prefix': 'amply-',
        'predefined_queues': {
            'celery': {
                'url': 'https://sqs.eu-central-1.amazonaws.com/xxxx/amply-celery',
            },
            'high': {
                'url': 'https://sqs.eu-central-1.amazonaws.com/xxxx/amply-celery-high',
            },
            'low': {
                'url': 'https://sqs.eu-central-1.amazonaws.com/xxxx/amply-celery-low',
            },
        },
    },

    # Redis for results (optional)
    result_backend='redis://...',

    # Task routing
    task_routes={
        'amply.jobs.webhooks.*': {'queue': 'high'},
        'amply.jobs.checkpoints.*': {'queue': 'celery'},
        'amply.jobs.reports.*': {'queue': 'low'},
    },

    # Task settings
    task_serializer='json',
    accept_content=['json'],
    task_acks_late=True,           # Ack after completion
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,   # Fair distribution
)
```

## Task Routing

```python
# High priority - webhooks, payments
@app.task(queue='high')
def dispatch_webhook(endpoint_id: str, event: dict):
    pass

# Normal priority - checkpoints, donations
@app.task(queue='celery')
def generate_checkpoint():
    pass

# Low priority - reports, cleanup
@app.task(queue='low')
def generate_monthly_report(org_id: str):
    pass
```

## Worker Configuration

```bash
# Worker for high priority queue (responds quickly)
celery -A amply.jobs.celery_app worker \
  -Q high,celery \
  --concurrency=4 \
  --loglevel=info

# Worker for low priority queue
celery -A amply.jobs.celery_app worker \
  -Q low \
  --concurrency=2 \
  --loglevel=info
```

In ECS, separate services for different queues:

```yaml
# amply-worker-high
command: ["celery", "-A", "amply.jobs.celery_app", "worker", "-Q", "high,celery", "-c", "4"]

# amply-worker-low
command: ["celery", "-A", "amply.jobs.celery_app", "worker", "-Q", "low", "-c", "2"]
```

## Message Format

SQS messages contain serialised Celery tasks:

```json
{
  "body": "eyJ0YXNrIjogImFtcGx5LmpvYnMud2ViaG9va3MuZGlzcGF0Y2hfd2ViaG9vayIsIC...",
  "content-encoding": "utf-8",
  "content-type": "application/json",
  "headers": {
    "lang": "py",
    "task": "amply.jobs.webhooks.dispatch_webhook",
    "id": "abc123-def456-...",
    "retries": 0
  },
  "properties": {
    "correlation_id": "abc123-def456-...",
    "reply_to": null
  }
}
```

## Dead Letter Queue Handling

Messages in DLQ need investigation:

```python
# Script to process DLQ
import boto3
import json

sqs = boto3.client('sqs')
dlq_url = 'https://sqs.eu-central-1.amazonaws.com/xxxx/amply-celery-dlq'

def process_dlq():
    """Process messages in dead letter queue."""
    while True:
        response = sqs.receive_message(
            QueueUrl=dlq_url,
            MaxNumberOfMessages=10,
            WaitTimeSeconds=5
        )

        messages = response.get('Messages', [])
        if not messages:
            break

        for msg in messages:
            body = json.loads(msg['Body'])

            # Log for investigation
            logger.error(
                "DLQ message",
                task=body.get('headers', {}).get('task'),
                task_id=body.get('headers', {}).get('id'),
                receive_count=msg.get('Attributes', {}).get('ApproximateReceiveCount')
            )

            # Option 1: Retry to main queue
            # sqs.send_message(QueueUrl=main_queue_url, MessageBody=msg['Body'])

            # Option 2: Delete after logging
            sqs.delete_message(
                QueueUrl=dlq_url,
                ReceiptHandle=msg['ReceiptHandle']
            )
```

## Monitoring

### CloudWatch Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| ApproximateNumberOfMessagesVisible | Queue depth | > 1000 |
| ApproximateAgeOfOldestMessage | Message age | > 3600 (1 hour) |
| NumberOfMessagesReceived | Throughput | - |
| NumberOfMessagesSent | Tasks queued | - |

### Alarms

```yaml
# Queue depth too high
- AlarmName: sqs-amply-celery-depth
  MetricName: ApproximateNumberOfMessagesVisible
  Namespace: AWS/SQS
  Dimensions:
    - Name: QueueName
      Value: amply-celery
  Threshold: 1000
  EvaluationPeriods: 3

# Messages stuck (old)
- AlarmName: sqs-amply-celery-age
  MetricName: ApproximateAgeOfOldestMessage
  Threshold: 3600
  EvaluationPeriods: 2

# DLQ has messages
- AlarmName: sqs-amply-dlq-not-empty
  MetricName: ApproximateNumberOfMessagesVisible
  Dimensions:
    - Name: QueueName
      Value: amply-celery-dlq
  Threshold: 1
  ComparisonOperator: GreaterThanOrEqualToThreshold
```

## Auto Scaling

Scale workers based on queue depth:

```yaml
# ECS Service Auto Scaling
scalingPolicy:
  policyType: TargetTrackingScaling
  customizedMetricSpecification:
    metricName: ApproximateNumberOfMessagesVisible
    namespace: AWS/SQS
    dimensions:
      - name: QueueName
        value: amply-celery
    statistic: Average
  targetValue: 100              # 100 messages per worker
  scaleInCooldown: 300
  scaleOutCooldown: 60
```

## IAM Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
        "sqs:GetQueueUrl"
      ],
      "Resource": [
        "arn:aws:sqs:eu-central-1:xxxx:amply-celery",
        "arn:aws:sqs:eu-central-1:xxxx:amply-celery-high",
        "arn:aws:sqs:eu-central-1:xxxx:amply-celery-low"
      ]
    }
  ]
}
```

## Cost

SQS pricing:
- First 1 million requests/month: Free
- After: $0.40 per million requests

Estimated: < $5/month for typical usage

---

**Related:**
- [AWS Overview](./overview.md)
- [Background Jobs](../amply-backend/jobs.md)
- [ECS](./ecs.md)
