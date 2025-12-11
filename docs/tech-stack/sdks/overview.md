---
sidebar_position: 1
---

# SDKs & Client Libraries
*Official Client Libraries for the Amply API*

Amply provides official SDKs to simplify integration with the Amply API.

## Available SDKs

| Language | Package | Status |
|----------|---------|--------|
| Python | `amply-python` | Stable |
| JavaScript/TypeScript | `@amply/sdk` | Stable |
| PHP | `amply/amply-php` | Planned |
| Ruby | `amply-ruby` | Planned |

## Python SDK

### Installation

```bash
pip install amply-python
```

### Quick Start

```python
from amply import AmplyClient

# Initialise client
client = AmplyClient(api_key="sk_live_xxxxx")

# Get organisation
org = client.organisations.get("org_abc123")
print(f"Organisation: {org.name}")

# List donations
donations = client.donations.list(
    organisation_id=org.id,
    limit=10,
    status="completed"
)

for donation in donations:
    print(f"{donation.id}: {donation.amount} {donation.currency}")
```

### Configuration

```python
from amply import AmplyClient

client = AmplyClient(
    api_key="sk_live_xxxxx",
    base_url="https://api.amply-impact.org/v1",  # Default
    timeout=30,  # Request timeout in seconds
    max_retries=3,  # Retry failed requests
)

# Or from environment
# AMPLY_API_KEY=sk_live_xxxxx
client = AmplyClient.from_env()
```

### Resources

#### Organisations

```python
# Get organisation
org = client.organisations.get("org_abc123")

# List organisations (public)
orgs = client.organisations.list(
    country="DE",
    sdg=[1, 2, 3],
    limit=50
)

# Update organisation (requires auth)
org = client.organisations.update(
    "org_abc123",
    name="Updated Name",
    description="New description"
)
```

#### Donations

```python
# Create donation
donation = client.donations.create(
    organisation_id="org_abc123",
    amount=50.00,
    currency="EUR",
    donor_email="donor@example.com",
    fund_id="fund_general",
    metadata={"source": "api"}
)

# Get donation
donation = client.donations.get(donation.id)

# List donations
donations = client.donations.list(
    organisation_id="org_abc123",
    status="completed",
    created_after="2025-01-01",
    limit=100
)

# Refund donation
refund = client.donations.refund(
    donation.id,
    reason="Donor request"
)
```

#### Campaigns

```python
# Create campaign
campaign = client.campaigns.create(
    organisation_id="org_abc123",
    name="Winter Appeal 2025",
    goal=10000.00,
    currency="EUR",
    ends_at="2025-12-31"
)

# Get campaign with stats
campaign = client.campaigns.get(
    campaign.id,
    expand=["stats", "donations"]
)

print(f"Progress: {campaign.stats.total_raised}/{campaign.goal}")
```

#### Funds

```python
# List funds
funds = client.funds.list(organisation_id="org_abc123")

# Create fund
fund = client.funds.create(
    organisation_id="org_abc123",
    name="Education Program",
    description="Support our education initiatives"
)
```

#### Webhooks

```python
# Create webhook endpoint
webhook = client.webhooks.create(
    organisation_id="org_abc123",
    url="https://your-site.com/webhooks/amply",
    events=["donation.completed", "donation.refunded"]
)

# List webhooks
webhooks = client.webhooks.list(organisation_id="org_abc123")

# Delete webhook
client.webhooks.delete(webhook.id)
```

### Pagination

```python
# Iterate over all donations
for donation in client.donations.list(organisation_id="org_abc123"):
    print(donation.id)

# Manual pagination
page = client.donations.list(
    organisation_id="org_abc123",
    limit=50
)

while page:
    for donation in page.data:
        process(donation)

    page = page.next_page()
```

### Error Handling

```python
from amply import AmplyClient
from amply.exceptions import (
    AmplyError,
    AuthenticationError,
    NotFoundError,
    ValidationError,
    RateLimitError,
)

client = AmplyClient(api_key="sk_live_xxxxx")

try:
    donation = client.donations.get("don_invalid")
except NotFoundError:
    print("Donation not found")
except ValidationError as e:
    print(f"Invalid request: {e.errors}")
except RateLimitError as e:
    print(f"Rate limited. Retry after {e.retry_after} seconds")
except AuthenticationError:
    print("Invalid API key")
except AmplyError as e:
    print(f"API error: {e}")
```

### Async Support

```python
import asyncio
from amply import AsyncAmplyClient

async def main():
    client = AsyncAmplyClient(api_key="sk_live_xxxxx")

    # Async operations
    org = await client.organisations.get("org_abc123")
    donations = await client.donations.list(organisation_id=org.id)

    await client.close()

asyncio.run(main())

# Or use context manager
async with AsyncAmplyClient(api_key="sk_live_xxxxx") as client:
    org = await client.organisations.get("org_abc123")
```

## JavaScript/TypeScript SDK

### Installation

```bash
npm install @amply/sdk
# or
yarn add @amply/sdk
```

### Quick Start

```typescript
import { AmplyClient } from '@amply/sdk';

const client = new AmplyClient({
  apiKey: 'sk_live_xxxxx',
});

// Get organisation
const org = await client.organisations.get('org_abc123');
console.log(`Organisation: ${org.name}`);

// List donations
const donations = await client.donations.list({
  organisationId: org.id,
  limit: 10,
  status: 'completed',
});

for (const donation of donations.data) {
  console.log(`${donation.id}: ${donation.amount} ${donation.currency}`);
}
```

### TypeScript Types

```typescript
import type {
  Organisation,
  Donation,
  Campaign,
  Fund,
  Webhook,
  ListParams,
  PaginatedResponse,
} from '@amply/sdk';

// Fully typed responses
const donation: Donation = await client.donations.get('don_abc123');

// Type-safe parameters
const params: ListParams<Donation> = {
  organisationId: 'org_abc123',
  status: 'completed',
  limit: 50,
  createdAfter: new Date('2025-01-01'),
};

const result: PaginatedResponse<Donation> = await client.donations.list(params);
```

### Resources

```typescript
// Organisations
const org = await client.organisations.get('org_abc123');
const orgs = await client.organisations.list({ country: 'DE' });

// Donations
const donation = await client.donations.create({
  organisationId: 'org_abc123',
  amount: 50.00,
  currency: 'EUR',
  donorEmail: 'donor@example.com',
});

// Campaigns
const campaign = await client.campaigns.create({
  organisationId: 'org_abc123',
  name: 'Winter Appeal',
  goal: 10000,
  currency: 'EUR',
});

// Webhooks
const webhook = await client.webhooks.create({
  organisationId: 'org_abc123',
  url: 'https://your-site.com/webhooks',
  events: ['donation.completed'],
});
```

### Pagination

```typescript
// Auto-pagination
for await (const donation of client.donations.list({ organisationId: 'org_abc123' })) {
  console.log(donation.id);
}

// Manual pagination
let page = await client.donations.list({
  organisationId: 'org_abc123',
  limit: 50,
});

while (page) {
  for (const donation of page.data) {
    process(donation);
  }
  page = await page.nextPage();
}
```

### Error Handling

```typescript
import {
  AmplyError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
} from '@amply/sdk';

try {
  const donation = await client.donations.get('don_invalid');
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log('Donation not found');
  } else if (error instanceof ValidationError) {
    console.log('Validation errors:', error.errors);
  } else if (error instanceof RateLimitError) {
    console.log(`Rate limited. Retry after ${error.retryAfter}s`);
  } else if (error instanceof AuthenticationError) {
    console.log('Invalid API key');
  } else if (error instanceof AmplyError) {
    console.log('API error:', error.message);
  }
}
```

### Webhook Signature Verification

```typescript
import { verifyWebhookSignature } from '@amply/sdk';

// Express middleware example
app.post('/webhooks/amply', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-amply-signature'];
  const webhookSecret = process.env.AMPLY_WEBHOOK_SECRET;

  try {
    const event = verifyWebhookSignature(
      req.body,
      signature,
      webhookSecret
    );

    switch (event.type) {
      case 'donation.completed':
        handleDonationCompleted(event.data);
        break;
      case 'donation.refunded':
        handleDonationRefunded(event.data);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ error: 'Invalid signature' });
  }
});
```

## Webhook Events

### Event Types

| Event | Description |
|-------|-------------|
| `donation.created` | Donation initiated |
| `donation.completed` | Payment successful |
| `donation.failed` | Payment failed |
| `donation.refunded` | Donation refunded |
| `campaign.created` | Campaign created |
| `campaign.completed` | Campaign reached goal |
| `campaign.ended` | Campaign end date reached |
| `payout.created` | Payout initiated |
| `payout.completed` | Payout successful |

### Event Payload

```json
{
  "id": "evt_abc123",
  "type": "donation.completed",
  "created": "2025-01-15T10:30:00Z",
  "data": {
    "id": "don_xyz789",
    "amount": 50.00,
    "currency": "EUR",
    "organisation_id": "org_abc123",
    "donor_email": "donor@example.com",
    "fund_id": "fund_general",
    "completed_at": "2025-01-15T10:30:00Z"
  }
}
```

### Signature Verification

```python
# Python
import hmac
import hashlib

def verify_signature(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(f"sha256={expected}", signature)
```

```typescript
// TypeScript
import { createHmac, timingSafeEqual } from 'crypto';

function verifySignature(
  payload: Buffer,
  signature: string,
  secret: string
): boolean {
  const expected = `sha256=${createHmac('sha256', secret)
    .update(payload)
    .digest('hex')}`;

  return timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

## SDK Development

### Repository Structure

```
amply-sdks/
├── python/
│   ├── amply/
│   │   ├── __init__.py
│   │   ├── client.py
│   │   ├── resources/
│   │   │   ├── organisations.py
│   │   │   ├── donations.py
│   │   │   └── ...
│   │   ├── exceptions.py
│   │   └── types.py
│   ├── tests/
│   ├── setup.py
│   └── README.md
├── javascript/
│   ├── src/
│   │   ├── index.ts
│   │   ├── client.ts
│   │   ├── resources/
│   │   └── types.ts
│   ├── tests/
│   ├── package.json
│   └── README.md
└── openapi/
    └── amply-api.yaml    # OpenAPI spec (SDK generation source)
```

### Versioning

SDKs follow semantic versioning aligned with the API:

| API Version | SDK Version |
|-------------|-------------|
| v1.0 | 1.0.x |
| v1.1 | 1.1.x |
| v2.0 | 2.0.x |

---

**Related:**
- [API Overview](./amply-backend/api.md)
- [Webhooks](./amply-backend/api.md#webhooks)
