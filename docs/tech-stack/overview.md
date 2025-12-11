---
sidebar_position: 1
---

# Tech Stack Overview
*Complete Technical Architecture for Amply*

This document provides the master reference for Amply's technical infrastructure. Each component links to detailed documentation.

## Architecture Diagram

```
                                   ┌─────────────────────────────────┐
                                   │         CloudFront CDN          │
                                   │   (assets, widgets, caching)    │
                                   └───────────────┬─────────────────┘
                                                   │
       ┌───────────────────────────────────────────┼───────────────────────────────────────────┐
       │                                           │                                           │
       ▼                                           ▼                                           ▼
┌─────────────────┐                     ┌─────────────────┐                     ┌─────────────────┐
│  Docs Site      │                     │  Public Website │                     │   Widgets       │
│  (Docusaurus)   │                     │     (React)     │                     │   (Preact)      │
│                 │                     │                 │                     │                 │
│ docs.amply-     │                     │ amply-impact.org│                     │ widgets.amply-  │
│ impact.org      │                     │ /public/*       │                     │ impact.org      │
│                 │                     │ + marketing     │                     │                 │
│   [Netlify]     │                     │ + dashboard     │                     │   [S3 + CF]     │
└─────────────────┘                     └────────┬────────┘                     └────────┬────────┘
                                                 │                                       │
                                                 │              ┌────────────────────────┘
                                                 │              │
                                                 ▼              ▼
                                        ┌─────────────────────────┐
                                        │      API Gateway        │
                                        │   api.amply-impact.org  │
                                        └───────────┬─────────────┘
                                                    │
                                        ┌───────────▼─────────────┐
                                        │                         │
                                        │    Python Backend       │
                                        │    (FastAPI on ECS)     │
                                        │                         │
                                        │  ┌─────────────────┐    │
                                        │  │ Modules:        │    │
                                        │  │ - Ledger        │    │
                                        │  │ - Payments      │    │
                                        │  │ - Donations     │    │
                                        │  │ - Organizations │    │
                                        │  │ - Users         │    │
                                        │  │ - Campaigns     │    │
                                        │  │ - Businesses    │    │
                                        │  │ - Webhooks      │    │
                                        │  └─────────────────┘    │
                                        │                         │
                                        └──┬─────┬─────┬─────┬────┘
                                           │     │     │     │
                    ┌──────────────────────┘     │     │     └──────────────────────┐
                    │                            │     │                            │
                    ▼                            ▼     ▼                            ▼
             ┌───────────┐              ┌─────────────────────┐              ┌───────────┐
             │PostgreSQL │              │       Redis         │              │    S3     │
             │  (RDS)    │              │   (ElastiCache)     │              │  Storage  │
             │           │              │                     │              │           │
             │ + Ledger  │              │ Sessions, Cache,    │              │ Docs,     │
             │   Tables  │              │ Rate Limits         │              │ Exports,  │
             └───────────┘              └─────────────────────┘              │ Checkpts  │
                                                                             └───────────┘
                    │                            │
                    │                            ▼
                    │                     ┌───────────┐
                    │                     │   SQS +   │
                    │                     │  Celery   │
                    │                     │ (future)  │
                    │                     └───────────┘
                    │
                    ▼
             ┌───────────┐              ┌───────────┐              ┌───────────┐
             │  Stripe   │              │    SES    │              │  Sentry   │
             │  Connect  │              │   Email   │              │  Errors   │
             └───────────┘              └───────────┘              └───────────┘
```

## Domain Structure

| URL | Purpose | Hosting |
|-----|---------|---------|
| `amply-impact.org` | Main site (marketing + public + dashboard) | AWS (S3 + CloudFront + ECS) |
| `amply-impact.org/public/*` | Public resources (org profiles, donation pages) | Same |
| `amply-impact.org/dashboard/*` | Authenticated user dashboard | Same |
| `api.amply-impact.org` | REST API | AWS ECS |
| `docs.amply-impact.org` | Documentation | Netlify (Docusaurus) |
| `widgets.amply-impact.org` | Embeddable widget bundle | AWS S3 + CloudFront |

## Component Summary

### Core Infrastructure

| Component | Technology | Documentation |
|-----------|------------|---------------|
| Backend API | Python + FastAPI | [amply-backend/](./amply-backend/overview.md) |
| Ledger System | PostgreSQL + custom hash chain | [architecture/ledger.md](../architecture/ledger.md) |
| Payment Processing | Stripe Connect | [stripe/](./stripe/overview.md) |
| Database | RDS PostgreSQL | [aws/rds.md](./aws/rds.md) |

### Frontend Applications

| Component | Technology | Documentation |
|-----------|------------|---------------|
| Public Website | React | [amply-public-website/](./amply-public-website/overview.md) |
| Dashboard | React | [amply-dashboard/](./amply-dashboard/overview.md) |
| Widgets | Preact | [widgets/](./widgets/overview.md) |
| Documentation | Docusaurus | [netlify/docusaurus/](./netlify/docusaurus/overview.md) |

### AWS Services

| Service | Purpose | Documentation |
|---------|---------|---------------|
| ECS Fargate | Backend compute | [aws/ecs.md](./aws/ecs.md) |
| RDS PostgreSQL | Primary database | [aws/rds.md](./aws/rds.md) |
| ElastiCache Redis | Caching, sessions | [aws/elasticache.md](./aws/elasticache.md) |
| S3 | Object storage | [aws/s3.md](./aws/s3.md) |
| SQS | Message queue | [aws/sqs.md](./aws/sqs.md) |
| SES | Transactional email | [aws/ses.md](./aws/ses.md) |
| CloudFront | CDN | [aws/cloudfront.md](./aws/cloudfront.md) |
| Route 53 | DNS | [aws/route53.md](./aws/route53.md) |
| Secrets Manager | Credentials | [aws/secrets-manager.md](./aws/secrets-manager.md) |

### External Services

| Service | Purpose | Documentation |
|---------|---------|---------------|
| Netlify | Static hosting (docs) | [netlify/](./netlify/netlify.md) |
| Sentry | Error tracking | [sentry.md](./sentry.md) |
| Stripe | Payments | [stripe/](./stripe/overview.md) |
| GitHub | Source control + CI/CD | [ci-cd/](./ci-cd/overview.md) |

### Developer Tools

| Component | Purpose | Documentation |
|-----------|---------|---------------|
| SDKs | Client libraries | [sdks/](./sdks/overview.md) |
| Verification CLI | Ledger verification | [amply-verify/](./amply-verify/overview.md) |
| CI/CD | Automated pipelines | [ci-cd/](./ci-cd/overview.md) |

## GitHub Repositories

| Repository | Purpose | Status |
|------------|---------|--------|
| `amply-backend` | Python monolith backend (includes ledger module) | Planned |
| `amply-verify` | Open-source ledger verification CLI | Planned |
| `amply-web` | React frontend (public + dashboard) | Planned |
| `amply-widgets` | Embeddable widget bundle | Planned |
| `amply-docs` | Documentation (Docusaurus) | Active |
| `amply-sdk-python` | Python SDK | Planned |
| `amply-sdk-js` | JavaScript/TypeScript SDK | Planned |
| `amply-infrastructure` | Terraform IaC | Planned |

## Environment Strategy

| Environment | Purpose | URL Pattern |
|-------------|---------|-------------|
| Production | Live platform | `amply-impact.org` |
| Staging | Pre-production testing | `staging.amply-impact.org` |
| Sandbox | Integrator testing (test Stripe) | `sandbox.amply-impact.org` |
| Local | Developer machines | `localhost:*` |

## Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend architecture | Monolith | Transactional integrity, simpler development |
| Backend language | Python + FastAPI | Modern async, good ecosystem, team familiarity |
| Database | PostgreSQL | ACID, JSON support, row-level security |
| Frontend | React | Component model, ecosystem, team familiarity |
| Hosting | AWS | Full control, scalability, enterprise features |
| Static hosting | Netlify | Free tier, easy deploys, good DX |
| Payments | Stripe Connect | PCI compliance, multi-party payouts |
| Error tracking | Sentry | Industry standard, good Python/React support |

## Cross-Cutting Concerns

### Security

- TLS everywhere (enforced)
- Encrypted at rest (RDS, S3)
- Secrets in AWS Secrets Manager
- API authentication via Bearer tokens
- User authentication via sessions + OAuth
- RBAC with organisation scope

### Monitoring

- **Errors**: Sentry
- **Metrics**: CloudWatch
- **Logs**: CloudWatch Logs
- **Uptime**: CloudWatch Synthetics or external

### Compliance

- **PCI DSS**: Via Stripe.js (SAQ-A)
- **GDPR**: Data anonymisation support
- **SOC 2**: Target certification

---

**Next Steps:**
1. [Backend Architecture](./amply-backend/overview.md)
2. [Ledger Architecture](../architecture/ledger.md)
3. [AWS Infrastructure](./aws/overview.md)
