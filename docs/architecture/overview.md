---
sidebar_position: 1
---

# Architecture
*How Amply's Systems Work*

This section provides technical documentation on Amply's system architecture for developers, auditors, and technically curious stakeholders.

## System Overview

Amply's architecture is designed around three core principles:
1. **Transparency by design**: Every transaction recorded, verifiable, and auditable
2. **Security first**: Financial data protected with industry-standard practices
3. **Scalability**: Handle growth from hundreds to millions of transactions

### High-Level Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         Clients                                  │
│   Websites  │  Mobile Apps  │  POS Systems  │  Business Systems │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       API Gateway                                │
│              Authentication │ Rate Limiting │ Routing            │
└──────────────────────────────┬──────────────────────────────────┘
                               │
┌──────────────────────────────┼──────────────────────────────────┐
│                              ▼                                   │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│   │  Donations   │   │Organizations │   │   Accounts   │        │
│   │   Service    │   │   Service    │   │   Service    │        │
│   └──────┬───────┘   └──────────────┘   └──────────────┘        │
│          │                                                       │
│          ▼                                                       │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐        │
│   │   Ledger     │◄──│   Payment    │   │   Events     │        │
│   │   Service    │   │   Service    │   │   Service    │        │
│   └──────┬───────┘   └──────┬───────┘   └──────────────┘        │
│          │                  │                                    │
│                        Core Services                             │
└──────────────────────────────┼──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      External Services                           │
│         Stripe Connect   │   Cloud Infrastructure                │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### Ledger Service

The heart of Amply's transparency:
- Tamper-evident transaction recording
- Hash chain integrity
- Multi-tenant isolation
- Public visibility controls

→ [Ledger Architecture](./ledger.md)

### Payment Service

Handles all money movement:
- Stripe Connect integration
- Multi-currency support
- Payout orchestration
- Fee calculation

→ [Payment Flows](./stripe-flows.md)

### Data Model

Multi-tenant structure:
- Organizations
- Funds and projects
- Transactions
- Users and roles

→ [Data Model](./data-model.md)

### API Gateway

Request handling:
- Authentication (API keys, OAuth)
- Rate limiting
- Request validation
- Response caching

→ [API Documentation](../api/overview.md)

## Key Design Decisions

### Why Stripe Connect?

Amply uses Stripe Connect for payment processing:

**Benefits:**
- PCI compliance handled by Stripe
- Multi-party payouts
- Global payment methods
- Fraud prevention
- Regulatory compliance

**Trade-offs:**
- Processing fees apply
- Geographic limitations
- Platform dependency

### Why a Custom Ledger?

Rather than blockchain, Amply uses a custom tamper-evident ledger:

**Reasoning:**
- Full control over data model
- No mining/consensus overhead
- Privacy controls possible
- Traditional database performance
- Auditable integrity guarantees

**Implementation:**
- Hash chains link entries
- Periodic public checkpoints
- Third-party verification possible
- Open-source verification tools

### Multi-Tenant Architecture

Each organization has isolated data:

**Isolation:**
- Separate data partitions
- Row-level security
- Tenant-scoped queries
- Audit logging per tenant

**Shared Infrastructure:**
- Common services
- Unified API
- Centralized monitoring
- Efficient resource use

## Security Architecture

### Data Protection

**At Rest:**
- Encrypted storage
- Key management
- Regular backups
- Geographic redundancy

**In Transit:**
- TLS 1.3 everywhere
- Certificate pinning (mobile)
- API authentication required

### Access Control

**Authentication:**
- API keys for services
- OAuth 2.0 for users
- MFA for sensitive operations

**Authorization:**
- Role-based access control
- Organization-scoped permissions
- Audit logging

### Compliance

- SOC 2 Type II (in progress)
- GDPR compliant
- PCI DSS (via Stripe)
- Regular security audits

## Infrastructure

### Cloud Platform

Amply runs on major cloud infrastructure:
- Primary compute and storage
- Global CDN for static assets
- Managed database services
- Auto-scaling for traffic

### Monitoring

**Observability:**
- Distributed tracing
- Centralized logging
- Metrics and alerting
- Error tracking

**Reliability:**
- Health checks
- Automatic failover
- Disaster recovery
- Incident response

### Development

**Practices:**
- CI/CD pipelines
- Automated testing
- Code review required
- Security scanning

**Environments:**
- Development
- Staging
- Sandbox (for integrators)
- Production

## Open Source

### Public Components

These are open source:

**Verification Tools:**
- Ledger verification scripts
- Hash chain validators
- Checkpoint tools

**SDKs and Libraries:**
- JavaScript SDK
- Python SDK
- API client libraries

### Source Access

For transparency:
- Core algorithms documented
- Verification methodology public
- Independent audits published
- Security disclosures handled responsibly

---

**Related:**
- [Ledger Architecture](./ledger.md)
- [Payment Flows](./stripe-flows.md)
- [Data Model](./data-model.md)
- [API Documentation](../api/overview.md)
