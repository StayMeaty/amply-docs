---
sidebar_position: 10
---

# Secrets Manager
*Credential and Secret Storage*

AWS Secrets Manager stores sensitive credentials and API keys.

## Secrets

| Secret Name | Purpose | Rotation |
|-------------|---------|----------|
| `amply/database-url` | PostgreSQL connection string | Manual |
| `amply/redis-url` | Redis connection string | Manual |
| `amply/stripe-secret-key` | Stripe API secret key | Manual |
| `amply/stripe-webhook-secret` | Stripe webhook signing secret | Manual |
| `amply/sentry-dsn` | Sentry project DSN | Manual |
| `amply/checkpoint-signing-key` | Ledger checkpoint signing key | Annual |
| `amply/session-secret` | Session encryption key | Annual |
| `amply/api-encryption-key` | API key encryption | Annual |

## Secret Structure

### Database URL

```json
{
  "name": "amply/database-url",
  "value": "postgresql+asyncpg://amply_app:password@amply-prod.xxxxx.eu-central-1.rds.amazonaws.com:5432/amply?sslmode=require"
}
```

### Stripe Keys

```json
{
  "name": "amply/stripe-secret-key",
  "value": "sk_live_xxxxx"
}

{
  "name": "amply/stripe-webhook-secret",
  "value": "whsec_xxxxx"
}
```

### Checkpoint Signing Key

```json
{
  "name": "amply/checkpoint-signing-key",
  "value": {
    "private_key": "-----BEGIN RSA PRIVATE KEY-----\n...",
    "key_id": "amply-checkpoint-key-2025",
    "valid_from": "2025-01-01",
    "valid_until": "2026-01-01"
  }
}
```

## Environment-Specific Secrets

```
amply/prod/database-url
amply/prod/stripe-secret-key

amply/staging/database-url
amply/staging/stripe-secret-key    # Uses test mode key

amply/sandbox/database-url
amply/sandbox/stripe-secret-key    # Uses test mode key
```

## Accessing Secrets

### From ECS

Task definition references:

```yaml
containerDefinitions:
  - name: api
    secrets:
      - name: DATABASE_URL
        valueFrom: arn:aws:secretsmanager:eu-central-1:xxxx:secret:amply/prod/database-url

      - name: STRIPE_SECRET_KEY
        valueFrom: arn:aws:secretsmanager:eu-central-1:xxxx:secret:amply/prod/stripe-secret-key

      - name: REDIS_URL
        valueFrom: arn:aws:secretsmanager:eu-central-1:xxxx:secret:amply/prod/redis-url
```

### From Application Code

```python
import boto3
import json

secrets_client = boto3.client('secretsmanager', region_name='eu-central-1')

def get_secret(secret_name: str) -> str | dict:
    """Retrieve secret from Secrets Manager."""
    response = secrets_client.get_secret_value(SecretId=secret_name)

    if 'SecretString' in response:
        secret = response['SecretString']
        # Try to parse as JSON
        try:
            return json.loads(secret)
        except json.JSONDecodeError:
            return secret

    # Binary secret
    return response['SecretBinary']

# Usage
signing_key = get_secret('amply/checkpoint-signing-key')
private_key = signing_key['private_key']
```

### Caching

Cache secrets to reduce API calls:

```python
from cachetools import TTLCache

secret_cache = TTLCache(maxsize=100, ttl=300)  # 5 minute cache

def get_secret_cached(secret_name: str) -> str | dict:
    """Get secret with caching."""
    if secret_name in secret_cache:
        return secret_cache[secret_name]

    secret = get_secret(secret_name)
    secret_cache[secret_name] = secret
    return secret
```

## IAM Permissions

### ECS Task Role

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:eu-central-1:xxxx:secret:amply/prod/*"
      ]
    }
  ]
}
```

### CI/CD Role (limited)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": [
        "arn:aws:secretsmanager:eu-central-1:xxxx:secret:amply/staging/*",
        "arn:aws:secretsmanager:eu-central-1:xxxx:secret:amply/sandbox/*"
      ]
    }
  ]
}
```

## Rotation

### Automatic Rotation (Future)

For database credentials:

```yaml
RotationConfiguration:
  RotationLambdaArn: arn:aws:lambda:...:amply-secret-rotation
  RotationRules:
    AutomaticallyAfterDays: 30
```

### Manual Rotation Process

1. Generate new secret value
2. Update secret in Secrets Manager
3. Restart ECS tasks to pick up new value
4. Verify application works
5. Revoke old credential

```bash
# Update secret
aws secretsmanager put-secret-value \
  --secret-id amply/prod/database-url \
  --secret-string "new-connection-string"

# Force ECS to restart and pick up new secret
aws ecs update-service \
  --cluster amply-prod \
  --service amply-api \
  --force-new-deployment
```

## Secret Versioning

Secrets Manager maintains versions:

```bash
# Get current version
aws secretsmanager get-secret-value \
  --secret-id amply/prod/stripe-secret-key

# Get previous version
aws secretsmanager get-secret-value \
  --secret-id amply/prod/stripe-secret-key \
  --version-stage AWSPREVIOUS
```

## Monitoring

### CloudTrail

All secret access is logged:
- GetSecretValue
- PutSecretValue
- RotateSecret

### Alerts

```yaml
# Unusual access pattern
- AlarmName: secrets-unusual-access
  MetricName: GetSecretValueCount
  Threshold: 1000    # Per 5 minutes
```

## Cost

- $0.40 per secret per month
- $0.05 per 10,000 API calls

Estimated: ~$5/month for 10 secrets

---

**Related:**
- [AWS Overview](./overview.md)
- [ECS](./ecs.md)
- [Backend Services](../amply-backend/services.md)
