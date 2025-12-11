---
sidebar_position: 1
---

# AWS Overview
*Cloud Infrastructure Architecture*

Amply runs on Amazon Web Services (AWS) for reliable, scalable, and secure hosting.

## AWS Account Structure

```
Amply AWS Organisation
├── amply-production       # Production workloads
├── amply-staging          # Pre-production testing
├── amply-sandbox          # Integrator testing environment
└── amply-shared-services  # Shared resources (CI/CD, monitoring)
```

## Region Strategy

**Primary Region**: `eu-central-1` (Frankfurt)
- EU data residency requirements
- Good latency for European users
- Full service availability

**Future**: Multi-region for global availability

## Architecture Diagram

```
                              ┌─────────────────┐
                              │    Route 53     │
                              │      DNS        │
                              └────────┬────────┘
                                       │
                              ┌────────▼────────┐
                              │   CloudFront    │
                              │      CDN        │
                              └────────┬────────┘
                                       │
        ┌──────────────────────────────┼──────────────────────────────┐
        │                              │                              │
        ▼                              ▼                              ▼
┌───────────────┐           ┌───────────────────┐           ┌───────────────┐
│      S3       │           │   Application     │           │      S3       │
│   (Static)    │           │   Load Balancer   │           │   (Widgets)   │
│               │           │                   │           │               │
│ React Frontend│           └─────────┬─────────┘           │ Widget Bundle │
└───────────────┘                     │                     └───────────────┘
                                      │
                           ┌──────────▼──────────┐
                           │                     │
                           │    ECS Fargate      │
                           │   (API + Workers)   │
                           │                     │
                           └──┬─────┬─────┬─────┬┘
                              │     │     │     │
           ┌──────────────────┤     │     │     ├──────────────────┐
           │                  │     │     │     │                  │
           ▼                  ▼     │     ▼     ▼                  ▼
    ┌───────────┐      ┌───────────┐│┌───────────┐          ┌───────────┐
    │    RDS    │      │ElastiCache││|   SQS     │          │    S3     │
    │PostgreSQL │      │   Redis   │││  Queues   │          │  Storage  │
    └───────────┘      └───────────┘│└───────────┘          └───────────┘
                                    │
                                    ▼
                            ┌───────────┐
                            │    SES    │
                            │   Email   │
                            └───────────┘
```

## Service Summary

| Service | Purpose | Documentation |
|---------|---------|---------------|
| **ECS Fargate** | API containers | [ecs.md](./ecs.md) |
| **RDS** | PostgreSQL database | [rds.md](./rds.md) |
| **ElastiCache** | Redis for caching/sessions | [elasticache.md](./elasticache.md) |
| **S3** | Object storage, checkpoints | [s3.md](./s3.md) |
| **SQS** | Message queue *(future - Celery)* | [sqs.md](./sqs.md) |
| **SES** | Transactional email | [ses.md](./ses.md) |
| **CloudFront** | CDN | [cloudfront.md](./cloudfront.md) |
| **Route 53** | DNS management | [route53.md](./route53.md) |
| **Secrets Manager** | Credential storage | [secrets-manager.md](./secrets-manager.md) |
| **CloudWatch** | Monitoring and logging | [cloudwatch.md](./cloudwatch.md) |

## VPC Architecture

```
VPC: 10.0.0.0/16
├── Public Subnets (2 AZs)
│   ├── 10.0.1.0/24 (eu-central-1a) - ALB, NAT Gateway
│   └── 10.0.2.0/24 (eu-central-1b) - ALB, NAT Gateway
│
├── Private Subnets (2 AZs)
│   ├── 10.0.10.0/24 (eu-central-1a) - ECS, RDS
│   └── 10.0.20.0/24 (eu-central-1b) - ECS, RDS
│
└── Isolated Subnets (2 AZs)
    ├── 10.0.100.0/24 (eu-central-1a) - RDS (multi-AZ)
    └── 10.0.200.0/24 (eu-central-1b) - RDS (multi-AZ)
```

## Security Groups

```
┌─────────────────────────────────────────────────────────────┐
│                         Internet                             │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTPS (443)
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  sg-alb: Application Load Balancer                          │
│  Inbound: 443 from 0.0.0.0/0                                │
│  Outbound: 8000 to sg-ecs                                   │
└─────────────────────────────┬───────────────────────────────┘
                              │ 8000
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  sg-ecs: ECS Tasks                                           │
│  Inbound: 8000 from sg-alb                                  │
│  Outbound: 5432 to sg-rds, 6379 to sg-redis, 443 to 0.0.0.0 │
└─────────────────────────────┬───────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │ 5432                │ 6379                │ 443
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│    sg-rds     │     │   sg-redis    │     │   External    │
│ Inbound: 5432 │     │ Inbound: 6379 │     │   (Stripe,    │
│  from sg-ecs  │     │  from sg-ecs  │     │    SES, S3)   │
└───────────────┘     └───────────────┘     └───────────────┘
```

## IAM Structure

### Roles

```
ECS Task Execution Role
├── AmazonECSTaskExecutionRolePolicy
├── SecretsManager read access
└── CloudWatch Logs write access

ECS Task Role (application)
├── S3 read/write (amply-storage-*)
├── SQS send/receive (amply-*)
├── SES send email
├── Secrets Manager read
└── CloudWatch metrics/logs

CI/CD Role (GitHub Actions)
├── ECR push
├── ECS deploy
├── S3 deploy (frontend)
└── CloudFront invalidate
```

### Policies

Least-privilege policies for each service:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::amply-storage-prod/*"
    }
  ]
}
```

## Cost Estimation

| Service | Configuration | Est. Monthly Cost |
|---------|---------------|-------------------|
| ECS Fargate | 2 × 0.5 vCPU, 1GB | ~$30 |
| RDS | db.t3.small, Multi-AZ | ~$50 |
| ElastiCache | cache.t3.micro | ~$15 |
| S3 | 100GB storage | ~$3 |
| CloudFront | 100GB transfer | ~$10 |
| SQS | 1M requests | ~$0.40 |
| SES | 10k emails | ~$1 |
| Route 53 | 1 hosted zone | ~$0.50 |
| Secrets Manager | 10 secrets | ~$4 |
| **Total** | | **~$115/month** |

*Estimates for initial scale. Costs increase with usage.*

## Terraform Structure

Infrastructure as Code using Terraform:

```
amply-infrastructure/
├── terraform/
│   ├── environments/
│   │   ├── production/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── terraform.tfvars
│   │   ├── staging/
│   │   └── sandbox/
│   │
│   └── modules/
│       ├── vpc/
│       ├── ecs/
│       ├── rds/
│       ├── elasticache/
│       ├── s3/
│       ├── cloudfront/
│       └── monitoring/
│
├── .github/
│   └── workflows/
│       └── terraform.yml
│
└── README.md
```

## Deployment Pipeline

```
GitHub Push
    │
    ▼
GitHub Actions
    │
    ├── Build Docker image
    ├── Push to ECR
    ├── Run Terraform plan
    ├── (on main) Apply Terraform
    └── Deploy to ECS
```

## Monitoring & Alerting

- **CloudWatch Dashboards**: Key metrics visualisation
- **CloudWatch Alarms**: Alert on thresholds
- **CloudWatch Logs**: Centralised logging
- **Sentry**: Application errors (see [sentry.md](../sentry.md))

## Backup Strategy

| Resource | Backup Method | Retention |
|----------|---------------|-----------|
| RDS | Automated snapshots | 7 days |
| RDS | Manual snapshots | Monthly, 1 year |
| S3 | Versioning | Forever |
| S3 | Cross-region replication | Critical buckets |

## Disaster Recovery

**RTO (Recovery Time Objective)**: 4 hours
**RPO (Recovery Point Objective)**: 1 hour

- Multi-AZ for RDS and ElastiCache
- S3 cross-region replication for critical data
- Infrastructure as Code for quick rebuilds
- Documented runbooks

---

**Related:**
- [ECS Fargate](./ecs.md)
- [RDS PostgreSQL](./rds.md)
- [CI/CD](../ci-cd/overview.md)
