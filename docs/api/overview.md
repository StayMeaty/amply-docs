---
sidebar_position: 1
---

# API Documentation
*Build Custom Integrations with Amply*

Amply provides a RESTful API for programmatic access to donation processing, organization data, and reporting.

## Overview

### Base URL

```
Production: https://api.amply-impact.org/v1
Sandbox:    https://sandbox.api.amply-impact.org/v1
```

### Authentication

All API requests require authentication via API key:

```bash
curl https://api.amply-impact.org/v1/organizations \
  -H "Authorization: Bearer sk_live_xxx"
```

**Key Types:**
- `sk_live_xxx`: Production keys
- `sk_test_xxx`: Sandbox keys

Generate keys in your Amply dashboard under Settings → API.

### Response Format

All responses are JSON:

```json
{
  "data": { ... },
  "meta": {
    "request_id": "req_abc123",
    "timestamp": "2025-01-15T14:30:00Z"
  }
}
```

**Error Responses:**
```json
{
  "error": {
    "code": "invalid_request",
    "message": "Organization ID is required",
    "param": "organization_id"
  },
  "meta": {
    "request_id": "req_abc123"
  }
}
```

## Core Endpoints

### Organizations

**List Organizations**
```
GET /organizations
```

Query parameters:
- `limit`: Number of results (default 20, max 100)
- `offset`: Pagination offset
- `sdg`: Filter by SDG (1-17)
- `country`: Filter by country code

**Get Organization**
```
GET /organizations/{org_id}
```

Returns organization details, verification status, and public metrics.

**Get Organization Ledger**
```
GET /organizations/{org_id}/ledger
```

Query parameters:
- `start_date`: Begin date filter
- `end_date`: End date filter
- `type`: Transaction type filter
- `visibility`: Minimum visibility level (requires auth)

### Donations

**Create Donation**
```
POST /donations
```

Request body:
```json
{
  "organization_id": "org_xyz",
  "amount": 5000,
  "currency": "USD",
  "payment_method": "pm_card_xxx",
  "donor": {
    "email": "donor@example.com",
    "name": "Jane Donor"
  },
  "visibility": "public_full",
  "metadata": {
    "campaign_id": "camp_123",
    "source": "website"
  }
}
```

**Get Donation**
```
GET /donations/{donation_id}
```

**List Donations**
```
GET /donations
```

Query parameters:
- `organization_id`: Filter by organization
- `campaign_id`: Filter by campaign
- `status`: Filter by status
- `start_date`, `end_date`: Date range

### Campaigns

**List Campaigns**
```
GET /campaigns
```

**Get Campaign**
```
GET /campaigns/{campaign_id}
```

**Create Campaign**
```
POST /campaigns
```

**Update Campaign**
```
PATCH /campaigns/{campaign_id}
```

### Funds

**List Funds**
```
GET /organizations/{org_id}/funds
```

**Get Fund**
```
GET /funds/{fund_id}
```

**Get Fund Transactions**
```
GET /funds/{fund_id}/transactions
```

## Webhooks

### Configuration

Set up webhooks in your dashboard or via API:

```
POST /webhooks
{
  "url": "https://your-site.com/webhooks/amply",
  "events": ["donation.created", "payout.completed"]
}
```

### Event Types

| Event | Description |
|-------|-------------|
| `donation.created` | New donation received |
| `donation.completed` | Donation successfully processed |
| `donation.refunded` | Donation refunded |
| `campaign.goal_reached` | Campaign hit goal |
| `payout.initiated` | Payout started |
| `payout.completed` | Payout arrived |

### Webhook Payload

```json
{
  "id": "evt_xxx",
  "type": "donation.created",
  "created": "2025-01-15T14:30:00Z",
  "data": {
    "object": {
      "id": "don_xxx",
      "amount": 5000,
      "organization_id": "org_xyz"
    }
  }
}
```

### Verification

Verify webhook signatures:

```python
import hmac
import hashlib

def verify_webhook(payload, signature, secret):
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)
```

## SDKs

### JavaScript/TypeScript

```bash
npm install @amply/sdk
```

```javascript
import { Amply } from '@amply/sdk';

const amply = new Amply('sk_live_xxx');

// Create a donation
const donation = await amply.donations.create({
  organizationId: 'org_xyz',
  amount: 5000,
  currency: 'USD',
  paymentMethod: 'pm_card_xxx'
});
```

### Python

```bash
pip install amply-sdk
```

```python
from amply import Amply

amply = Amply('sk_live_xxx')

# Create a donation
donation = amply.donations.create(
    organization_id='org_xyz',
    amount=5000,
    currency='USD',
    payment_method='pm_card_xxx'
)
```

### Other Languages

- PHP: `composer require amply/amply-php`
- Ruby: `gem install amply`
- Java: Maven/Gradle package available

## Rate Limits

### Standard Limits

| Tier | Requests/minute |
|------|-----------------|
| Free | 60 |
| Standard | 300 |
| Enterprise | Custom |

### Headers

Rate limit info in response headers:
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 298
X-RateLimit-Reset: 1705330200
```

### Handling Limits

When rate limited (HTTP 429):
```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Too many requests",
    "retry_after": 32
  }
}
```

Implement exponential backoff:
```javascript
async function apiCall(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (e) {
      if (e.status === 429) {
        await sleep(Math.pow(2, i) * 1000);
        continue;
      }
      throw e;
    }
  }
}
```

## Sandbox Environment

### Purpose

Test your integration without real payments:
- No real money moves
- Test card numbers work
- Full API functionality
- Separate from production

### Test Cards

| Number | Behavior |
|--------|----------|
| 4242 4242 4242 4242 | Succeeds |
| 4000 0000 0000 0002 | Declines |
| 4000 0000 0000 3220 | Requires 3DS |

### Sandbox Keys

Use test keys for sandbox:
```
sk_test_xxx (API key)
```

All sandbox data is isolated from production.

## Error Codes

### HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Server Error |

### Error Types

| Code | Description |
|------|-------------|
| `invalid_request` | Missing or invalid parameters |
| `authentication_error` | Invalid API key |
| `authorization_error` | Insufficient permissions |
| `not_found` | Resource doesn't exist |
| `rate_limit_exceeded` | Too many requests |
| `payment_error` | Payment processing failed |
| `server_error` | Amply system error |

## Pagination

### Cursor-Based

For large result sets:

```
GET /donations?limit=50
```

Response includes pagination:
```json
{
  "data": [...],
  "has_more": true,
  "next_cursor": "cur_xxx"
}
```

Next page:
```
GET /donations?limit=50&cursor=cur_xxx
```

### Offset-Based

For smaller sets:
```
GET /organizations?limit=20&offset=40
```

## Versioning

### API Versions

API versioned in URL:
```
https://api.amply-impact.org/v1/...
```

### Breaking Changes

When breaking changes occur:
- New version released (v2)
- Old version supported for 12+ months
- Migration guides provided
- Deprecation warnings in headers

### Changelog

Major changes announced:
- Email to developers
- Dashboard notifications
- Documentation updates
- API changelog

## Support

### Resources

- Documentation: docs.amply-impact.org/api
- API Reference: api.amply-impact.org/docs
- SDKs: github.com/amply-impact

### Help

- Email: developers@amply-impact.org

---

**Related:**
- [Architecture Overview](../architecture/overview.md)
- [Integrations](../integrations/overview.md)
- [Widgets](../integrations/widgets.md)
