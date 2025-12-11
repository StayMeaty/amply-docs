---
sidebar_position: 2
---

# ECS Fargate
*Container Compute for Backend*

Amazon ECS Fargate runs the Python backend API and Celery workers as serverless containers.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ECS Cluster: amply-prod                   │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  Service: amply-api                         │ │
│  │                                                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │ │
│  │  │   Task 1     │  │   Task 2     │  │   Task N     │     │ │
│  │  │  (API)       │  │  (API)       │  │  (API)       │     │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  Service: amply-worker                      │ │
│  │                                                             │ │
│  │  ┌──────────────┐  ┌──────────────┐                        │ │
│  │  │   Task 1     │  │   Task 2     │                        │ │
│  │  │  (Celery)    │  │  (Celery)    │                        │ │
│  │  └──────────────┘  └──────────────┘                        │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  Service: amply-beat                        │ │
│  │                                                             │ │
│  │  ┌──────────────┐                                          │ │
│  │  │   Task 1     │  (single instance for scheduler)         │ │
│  │  │ (Celery Beat)│                                          │ │
│  │  └──────────────┘                                          │ │
│  │                                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Services

### API Service

Runs the FastAPI application.

```yaml
# Task Definition
family: amply-api
cpu: 512           # 0.5 vCPU
memory: 1024       # 1 GB

containerDefinitions:
  - name: api
    image: xxxx.dkr.ecr.eu-central-1.amazonaws.com/amply-backend:latest
    command: ["uvicorn", "amply.main:app", "--host", "0.0.0.0", "--port", "8000"]
    portMappings:
      - containerPort: 8000
    environment:
      - name: ENVIRONMENT
        value: production
    secrets:
      - name: DATABASE_URL
        valueFrom: arn:aws:secretsmanager:...:amply/database-url
      - name: STRIPE_SECRET_KEY
        valueFrom: arn:aws:secretsmanager:...:amply/stripe-secret
    logConfiguration:
      logDriver: awslogs
      options:
        awslogs-group: /ecs/amply-api
        awslogs-region: eu-central-1
        awslogs-stream-prefix: api
    healthCheck:
      command: ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
      interval: 30
      timeout: 5
      retries: 3
```

**Service Configuration**:
```yaml
serviceName: amply-api
desiredCount: 2              # Minimum 2 for HA
launchType: FARGATE
platformVersion: LATEST

networkConfiguration:
  awsvpcConfiguration:
    subnets:
      - subnet-private-1a
      - subnet-private-1b
    securityGroups:
      - sg-ecs
    assignPublicIp: DISABLED

loadBalancers:
  - targetGroupArn: arn:aws:elasticloadbalancing:...:amply-api-tg
    containerName: api
    containerPort: 8000

deploymentConfiguration:
  minimumHealthyPercent: 100
  maximumPercent: 200

capacityProviderStrategy:
  - capacityProvider: FARGATE
    weight: 1
    base: 2
  - capacityProvider: FARGATE_SPOT
    weight: 3               # Use Spot for cost savings
```

### Worker Service

Runs Celery workers for background jobs.

```yaml
# Task Definition
family: amply-worker
cpu: 512
memory: 1024

containerDefinitions:
  - name: worker
    image: xxxx.dkr.ecr.eu-central-1.amazonaws.com/amply-backend:latest
    command: ["celery", "-A", "amply.jobs.celery_app", "worker", "--loglevel=info"]
    environment:
      - name: ENVIRONMENT
        value: production
    secrets:
      - name: DATABASE_URL
        valueFrom: arn:aws:secretsmanager:...:amply/database-url
    logConfiguration:
      logDriver: awslogs
      options:
        awslogs-group: /ecs/amply-worker
```

**Service Configuration**:
```yaml
serviceName: amply-worker
desiredCount: 2
launchType: FARGATE

# No load balancer - workers don't receive HTTP traffic

deploymentConfiguration:
  minimumHealthyPercent: 50    # Workers can scale down during deploy
  maximumPercent: 200
```

### Beat Service

Runs Celery Beat for scheduled tasks.

```yaml
# Task Definition
family: amply-beat
cpu: 256             # Minimal resources
memory: 512

containerDefinitions:
  - name: beat
    image: xxxx.dkr.ecr.eu-central-1.amazonaws.com/amply-backend:latest
    command: ["celery", "-A", "amply.jobs.celery_app", "beat", "--loglevel=info"]
```

**Service Configuration**:
```yaml
serviceName: amply-beat
desiredCount: 1              # MUST be exactly 1 to avoid duplicate schedules
launchType: FARGATE
```

## Auto Scaling

### API Service

```yaml
# Target Tracking Scaling
scalableTarget:
  serviceNamespace: ecs
  resourceId: service/amply-prod/amply-api
  scalableDimension: ecs:service:DesiredCount
  minCapacity: 2
  maxCapacity: 10

scalingPolicy:
  policyType: TargetTrackingScaling
  targetTrackingScalingPolicyConfiguration:
    targetValue: 70.0
    predefinedMetricSpecification:
      predefinedMetricType: ECSServiceAverageCPUUtilization
    scaleInCooldown: 300
    scaleOutCooldown: 60
```

### Worker Service

```yaml
# Scale based on SQS queue depth
scalingPolicy:
  policyType: TargetTrackingScaling
  customizedMetricSpecification:
    metricName: ApproximateNumberOfMessagesVisible
    namespace: AWS/SQS
    dimensions:
      - name: QueueName
        value: amply-celery-queue
    statistic: Average
  targetValue: 100.0          # Scale when queue > 100 messages
```

## Docker Configuration

```dockerfile
# Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY pyproject.toml .
RUN pip install --no-cache-dir .

# Copy application
COPY src/ src/

# Create non-root user
RUN useradd -m appuser
USER appuser

# Default command (overridden per service)
CMD ["uvicorn", "amply.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## ECR Repository

```bash
# Repository
aws ecr create-repository --repository-name amply-backend

# Lifecycle policy (keep last 10 images)
aws ecr put-lifecycle-policy \
  --repository-name amply-backend \
  --lifecycle-policy-text '{
    "rules": [{
      "rulePriority": 1,
      "description": "Keep last 10 images",
      "selection": {
        "tagStatus": "any",
        "countType": "imageCountMoreThan",
        "countNumber": 10
      },
      "action": { "type": "expire" }
    }]
  }'
```

## Deployment

### Blue/Green Deployment

```yaml
deploymentController:
  type: ECS                  # Rolling update (or CODE_DEPLOY for blue/green)

deploymentConfiguration:
  minimumHealthyPercent: 100
  maximumPercent: 200
  deploymentCircuitBreaker:
    enable: true
    rollback: true
```

### Deployment Process

```bash
# 1. Build and push image
docker build -t amply-backend .
docker tag amply-backend:latest xxxx.dkr.ecr.eu-central-1.amazonaws.com/amply-backend:v1.2.3
docker push xxxx.dkr.ecr.eu-central-1.amazonaws.com/amply-backend:v1.2.3

# 2. Update task definition with new image
aws ecs register-task-definition --cli-input-json file://task-definition.json

# 3. Update service
aws ecs update-service \
  --cluster amply-prod \
  --service amply-api \
  --task-definition amply-api:42
```

## Health Checks

### Container Health Check

```yaml
healthCheck:
  command: ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
  interval: 30
  timeout: 5
  retries: 3
  startPeriod: 60
```

### ALB Health Check

```yaml
healthCheckPath: /health
healthCheckIntervalSeconds: 30
healthCheckTimeoutSeconds: 5
healthyThresholdCount: 2
unhealthyThresholdCount: 3
```

### Health Endpoint

```python
# In FastAPI app
@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    try:
        # Check database
        await db.execute(text("SELECT 1"))

        # Check Redis
        await redis.ping()

        return {"status": "healthy"}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))
```

## Logging

All containers log to CloudWatch Logs:

```
/ecs/amply-api
/ecs/amply-worker
/ecs/amply-beat
```

Log format (JSON for structured logging):
```json
{
  "timestamp": "2025-01-15T14:30:00Z",
  "level": "INFO",
  "logger": "amply.api.donations",
  "message": "Donation created",
  "donation_id": "don_abc123",
  "amount": 5000,
  "request_id": "req_xyz789"
}
```

## Monitoring

### CloudWatch Metrics

- CPU utilization
- Memory utilization
- Running task count
- Request count (via ALB)
- Response time (via ALB)

### Alarms

```yaml
# High CPU
alarmName: amply-api-high-cpu
metricName: CPUUtilization
namespace: AWS/ECS
threshold: 80
evaluationPeriods: 3

# Unhealthy tasks
alarmName: amply-api-unhealthy
metricName: UnhealthyHostCount
namespace: AWS/ApplicationELB
threshold: 1
```

## Cost Optimisation

1. **Fargate Spot**: Use for workers (can handle interruptions)
2. **Right-sizing**: Start small, scale based on metrics
3. **Savings Plans**: Commit to compute for discounts
4. **Scale to zero**: In non-prod environments during off-hours

---

**Related:**
- [AWS Overview](./overview.md)
- [RDS](./rds.md)
- [SQS](./sqs.md)
- [CI/CD](../ci-cd/overview.md)
