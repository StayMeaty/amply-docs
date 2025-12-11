---
sidebar_position: 3
---

# API Reference
*REST API Endpoints*

Core API endpoints for the Amply platform.

## Base Information

### URLs

| Environment | Base URL |
|-------------|----------|
| Production | `https://api.amply-impact.org/v1` |
| Staging | `https://api.staging.amply-impact.org/v1` |

### Authentication

**Session auth** (dashboard users):
```http
Cookie: session=xxx
```

**API keys** (integrators):
```http
Authorization: Bearer sk_live_xxx
```

Key prefixes:
- `sk_live_` - Production keys
- `sk_test_` - Staging/sandbox keys

### Response Format

**Success**:
```json
{
  "data": { ... },
  "meta": {
    "request_id": "req_abc123"
  }
}
```

**Error**:
```json
{
  "error": {
    "code": "invalid_request",
    "message": "Human-readable message",
    "param": "field_name"
  }
}
```

### Pagination

```http
GET /donations?limit=50&cursor=cur_xxx
```

Response:
```json
{
  "data": [...],
  "has_more": true,
  "next_cursor": "cur_yyy"
}
```

---

## Public Endpoints

No authentication required. Read-only access to public ledger data.

### List Organisations

```http
GET /public/organisations
```

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `limit` | int | Results per page (default 20, max 100) |
| `cursor` | string | Pagination cursor |
| `country` | string | Filter by country code |

**Response**:
```json
{
  "data": [
    {
      "id": "org_xyz789",
      "name": "Example Charity",
      "country": "DE",
      "status": "verified",
      "profile": {
        "description": "...",
        "website": "https://...",
        "logo_url": "https://..."
      }
    }
  ],
  "has_more": false
}
```

### Get Organisation

```http
GET /public/organisations/:id
```

### Get Public Ledger

```http
GET /public/organisations/:id/ledger
```

**Query Parameters**:
| Param | Type | Description |
|-------|------|-------------|
| `limit` | int | Entries per page (default 50) |
| `cursor` | string | Pagination cursor |
| `start_date` | date | Filter from date |
| `end_date` | date | Filter to date |

**Response**:
```json
{
  "data": [
    {
      "id": "led_abc123",
      "type": "donation_received",
      "amount": 5000,
      "currency": "EUR",
      "created_at": "2025-01-15T14:30:00Z",
      "metadata": {
        "donation_id": "don_xyz789",
        "stripe_payment_intent_id": "pi_abc123...",
        "donor_name": "Jane Donor"
      },
      "entry_hash": "sha256:abc123...",
      "prev_entry_hash": "sha256:xyz789..."
    }
  ],
  "has_more": true,
  "next_cursor": "cur_xxx"
}
```

### Export Ledger

```http
GET /public/organisations/:id/ledger/export
```

Returns complete ledger as downloadable JSON for independent verification.

**Response**:
```json
{
  "downloaded_at": "2025-01-15T12:00:00Z",
  "organisation_id": "org_xyz789",
  "entry_count": 1234,
  "entries": [
    {
      "id": "led_000001",
      "timestamp": "2025-01-01T00:00:00Z",
      "organisation_id": "org_xyz789",
      "type": "donation_received",
      "amount": 5000,
      "currency": "EUR",
      "metadata": {
        "donation_id": "don_abc123",
        "stripe_payment_intent_id": "pi_xyz789...",
        "donor_name": "Jane Donor"
      },
      "prev_entry_hash": null,
      "entry_hash": "sha256:..."
    }
  ]
}
```

**Note**: The `stripe_payment_intent_id` in metadata enables third-party verification against Stripe records.

### Get Checkpoint

```http
GET /public/checkpoints/:id
```

**Response**:
```json
{
  "data": {
    "id": "chk_2025-01-15",
    "checkpoint_date": "2025-01-15",
    "cumulative_hash": "sha256:abc123...",
    "entry_count": 15842,
    "total_volume": 284729340
  }
}
```

### List Checkpoints

```http
GET /public/checkpoints
```

---

## Donations

### Create Donation

```http
POST /donations
```

**Request Body**:
```json
{
  "organisation_id": "org_xyz",
  "fund_id": "fund_abc",
  "amount": 5000,
  "currency": "EUR",
  "donor_email": "donor@example.com",
  "donor_name": "Jane Donor"
}
```

**Response**:
```json
{
  "data": {
    "id": "don_abc123",
    "status": "pending",
    "client_secret": "pi_xxx_secret_yyy"
  }
}
```

Use `client_secret` with Stripe.js to complete payment.

### Get Donation

```http
GET /donations/:id
```

Requires authentication. Returns donation details.

### List Donations

```http
GET /donations
```

Requires authentication. Returns donations for authenticated user or organisation.

---

## Organisations (Authenticated)

### Get My Organisations

```http
GET /me/organisations
```

Returns organisations the authenticated user belongs to.

### Get Organisation Details

```http
GET /organisations/:id
```

Requires membership in the organisation.

### Update Organisation

```http
PATCH /organisations/:id
```

Requires admin role.

### Get Stripe Connect URL

```http
GET /organisations/:id/stripe/connect
```

Returns URL to initiate Stripe Connect onboarding.

---

## Auth

### Login

```http
POST /auth/login
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "xxx"
}
```

**Response**: Sets session cookie and returns user info.

```json
{
  "data": {
    "user": {
      "id": "usr_abc123",
      "email": "user@example.com",
      "name": "Jane User"
    },
    "session": {
      "id": "ses_xyz789",
      "expires_at": "2025-01-22T14:30:00Z"
    }
  }
}
```

### Logout

```http
POST /auth/logout
```

Ends the current session.

### Logout Everywhere

```http
POST /auth/logout-all
```

Invalidates all sessions by rotating the user's security stamp. Forces re-authentication on all devices.

**Response**:
```json
{
  "data": {
    "sessions_revoked": 4,
    "message": "All sessions have been revoked"
  }
}
```

### Get Current User

```http
GET /auth/me
```

**Response**:
```json
{
  "data": {
    "id": "usr_abc123",
    "email": "user@example.com",
    "name": "Jane User",
    "security_settings": {
      "ip_binding": "country",
      "session_timeout_days": 7,
      "notify_new_device": true
    }
  }
}
```

### List Active Sessions

```http
GET /auth/sessions
```

Returns all active sessions for the current user. Useful for "Active Sessions" UI.

**Response**:
```json
{
  "data": [
    {
      "id": "ses_abc123",
      "created_at": "2025-01-10T09:00:00Z",
      "last_activity": "2025-01-15T14:30:00Z",
      "client": {
        "ip_address": "203.0.113.45",
        "ip_country": "DE",
        "ip_city": "Berlin",
        "browser_family": "Chrome",
        "os_family": "Windows",
        "device_type": "desktop"
      },
      "is_current": true
    },
    {
      "id": "ses_xyz789",
      "created_at": "2025-01-08T16:20:00Z",
      "last_activity": "2025-01-14T11:00:00Z",
      "client": {
        "ip_address": "198.51.100.22",
        "ip_country": "DE",
        "ip_city": "Munich",
        "browser_family": "Safari",
        "os_family": "iOS",
        "device_type": "mobile"
      },
      "is_current": false
    }
  ]
}
```

### Revoke Session

```http
DELETE /auth/sessions/:session_id
```

Revokes a specific session. Cannot revoke current session (use `/auth/logout` instead).

**Response**:
```json
{
  "data": {
    "revoked": true,
    "session_id": "ses_xyz789"
  }
}
```

### Change Password

```http
POST /auth/password
```

Changes password and rotates security stamp, invalidating all other sessions.

**Request Body**:
```json
{
  "current_password": "xxx",
  "new_password": "yyy"
}
```

**Response**:
```json
{
  "data": {
    "changed": true,
    "sessions_revoked": 3,
    "message": "Password changed. Other sessions have been logged out."
  }
}
```

### Update Security Settings

```http
PATCH /auth/security-settings
```

Updates user's security preferences.

**Request Body**:
```json
{
  "ip_binding": "subnet",
  "session_timeout_days": 14,
  "notify_new_device": true
}
```

**IP Binding Options**:
| Value | Description |
|-------|-------------|
| `none` | No IP validation |
| `country` | Alert on country change (default) |
| `subnet` | Alert on subnet change |
| `strict` | Alert on any IP change |

---

## Webhooks

### Stripe Webhook

```http
POST /webhooks/stripe
```

Receives Stripe webhook events. Verified using `Stripe-Signature` header.

**Handled Events**:
| Event | Action |
|-------|--------|
| `payment_intent.succeeded` | Complete donation, create ledger entry |
| `payment_intent.payment_failed` | Mark donation as failed |

---

## Rate Limiting

All endpoints (except webhooks and health checks) are rate limited to protect the platform and ensure fair usage.

### Rate Limit Tiers

#### Anonymous/Public (by IP)

| Endpoint | Limit | Window |
|----------|-------|--------|
| General public API | 60/min | Sliding |
| Donation initiation | 5/min | Sliding |
| Ledger viewing | 30/min | Sliding |
| Ledger export | 3/hour | Fixed |
| Widget embed | 300/min | Sliding |

#### Authenticated (by User ID)

| Endpoint | Limit | Window |
|----------|-------|--------|
| General dashboard API | 200/min | Sliding |
| Donation creation | 20/min | Sliding |
| Settings changes | 10/min | Sliding |
| Password changes | 3/hour | Fixed |

#### Organisation API Keys

| Endpoint | Limit | Window |
|----------|-------|--------|
| Read operations | 500/min | Sliding |
| Write operations | 100/min | Sliding |

#### Exempt (No Limits)

- `POST /webhooks/stripe` — Critical payment flow
- `GET /health`, `GET /ready` — Infrastructure probes

### Response Headers

All responses include rate limit headers:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1704067200
```

### Rate Limit Exceeded (429)

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0

{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Too many requests. Retry after 30 seconds.",
    "retry_after": 30
  }
}
```

### Implementation

Rate limiting uses **sliding window** algorithm with Redis:

```python
# Identifier priority
1. User ID (if authenticated)
2. API Key (if present)
3. IP address (fallback)

# Redis key format
ratelimit:{identifier}:{endpoint}:{window}
```

### Card Testing Prevention

Donation endpoints have multi-layer protection:

| Layer | Check | Limit |
|-------|-------|-------|
| IP | Requests from single IP | 5/min |
| Card | Same card fingerprint | 3/hour |
| Email domain | Disposable email domains | 50/hour |
| Global | Platform-wide donations | 1000/min |

### Widget Burst Handling

Widgets support burst traffic for viral embeds:

| Tier | Limit | Purpose |
|------|-------|---------|
| Burst | 100/10sec | Handle traffic spikes |
| Sustained | 500/min | Prevent abuse |

---

## Rate Limit Monitoring

### Metrics Emitted

All rate limit events emit CloudWatch metrics:

| Metric | Type | Dimensions |
|--------|------|------------|
| `RateLimitChecked` | Counter | endpoint, identifier_type |
| `RateLimitBlocked` | Counter | endpoint, identifier_type, reason |
| `RateLimitRemaining` | Gauge | endpoint |

### Detecting Attacks vs Legitimate Traffic

#### Attack Indicators

| Pattern | Indicator | Response |
|---------|-----------|----------|
| Single IP flood | >50 blocks/min from one IP | Auto-block IP |
| Distributed attack | >100 blocks/min on one endpoint | Alert security |
| Card testing | Multiple card fingerprints, same IP | Block + alert |
| Credential stuffing | High /auth/login blocks | CAPTCHA trigger |

#### Legitimate High Traffic Indicators

| Pattern | Indicator | Response |
|---------|-----------|----------|
| Widget viral | High widget traffic, valid referrers | Auto-scale limits |
| Geographic spike | Clustered region, organic growth | Monitor only |
| API integration | Single API key, consistent patterns | Contact for upgrade |

### CloudWatch Alarms

```yaml
# High block rate (potential attack)
HighBlockRate:
  Metric: RateLimitBlocked
  Threshold: 100
  Period: 60
  Action: SNS → security-alerts

# Single IP abuse
SingleIPAbuse:
  Metric: RateLimitBlocked
  Dimensions:
    identifier_type: ip
  Threshold: 50
  Period: 60
  Action: Lambda → auto_block_ip

# Widget traffic spike (may need scaling)
WidgetSpike:
  Metric: RateLimitBlocked
  Dimensions:
    endpoint: /widgets/*
  Threshold: 200
  Period: 300
  Action: SNS → ops-alerts

# Donation endpoint pressure (card testing?)
DonationPressure:
  Metric: RateLimitBlocked
  Dimensions:
    endpoint: /donations
  Threshold: 20
  Period: 60
  Action: SNS → security-alerts + Lambda → enhanced_logging
```

### Dashboard Queries

#### Top Blocked IPs (Last Hour)

```sql
SELECT
  ip_address,
  COUNT(*) as block_count,
  array_agg(DISTINCT endpoint) as endpoints
FROM rate_limit_logs
WHERE blocked = true
  AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
ORDER BY block_count DESC
LIMIT 20
```

#### Block Rate by Endpoint

```sql
SELECT
  endpoint,
  COUNT(*) FILTER (WHERE blocked) as blocked,
  COUNT(*) as total,
  ROUND(100.0 * COUNT(*) FILTER (WHERE blocked) / COUNT(*), 2) as block_rate
FROM rate_limit_logs
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY endpoint
ORDER BY block_rate DESC
```

#### Widget Traffic by Referrer

```sql
SELECT
  referrer_domain,
  COUNT(*) as requests,
  COUNT(*) FILTER (WHERE blocked) as blocked,
  MAX(timestamp) as last_seen
FROM rate_limit_logs
WHERE endpoint LIKE '/widgets/%'
  AND timestamp > NOW() - INTERVAL '24 hours'
GROUP BY referrer_domain
ORDER BY requests DESC
LIMIT 50
```

### Automatic Responses

```python
# Auto-block abusive IPs
async def auto_block_ip(ip: str, reason: str):
    """Add IP to block list for 24 hours."""
    await redis.setex(
        f"blocked_ip:{ip}",
        86400,  # 24 hours
        json.dumps({"reason": reason, "blocked_at": datetime.utcnow().isoformat()})
    )

    # Log for security review
    logger.warning(f"Auto-blocked IP {ip}: {reason}")

    # Notify security team
    await send_alert(
        channel="security",
        message=f"IP auto-blocked: {ip}\nReason: {reason}"
    )

# Middleware checks block list before rate limiting
async def check_blocked(request: Request):
    ip = get_client_ip(request)
    if await redis.exists(f"blocked_ip:{ip}"):
        raise HTTPException(403, "Access denied")
```

### Legitimate Traffic Handling

```python
# Detect widget going viral
async def check_widget_viral(widget_id: str, referrer: str):
    """
    Detect legitimate viral traffic and auto-adjust limits.

    Indicators of legitimate traffic:
    - Valid, consistent referrer domain
    - Organic growth pattern (not instant spike)
    - Geographic distribution matches referrer audience
    """
    key = f"widget_traffic:{widget_id}:{referrer}"

    # Track request pattern
    await redis.hincrby(key, "count", 1)
    await redis.expire(key, 3600)

    count = int(await redis.hget(key, "count") or 0)

    # If traffic is high but from valid referrer, increase limits
    if count > 100 and await is_valid_referrer(referrer):
        elevated_key = f"widget_elevated:{widget_id}"
        await redis.setex(elevated_key, 3600, "true")

        logger.info(
            f"Elevated widget limits for {widget_id}",
            extra={"referrer": referrer, "count": count}
        )

def get_widget_limit(widget_id: str) -> tuple[int, int]:
    """Get rate limit for widget, considering elevated status."""
    if redis.exists(f"widget_elevated:{widget_id}"):
        return (1000, 60)  # Elevated: 1000/min
    return (300, 60)       # Normal: 300/min
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests (rate limited) |
| 500 | Server Error |

## Error Codes

| Code | Description |
|------|-------------|
| `invalid_request` | Missing or invalid parameters |
| `authentication_error` | Invalid session or API key |
| `authorization_error` | Insufficient permissions |
| `not_found` | Resource doesn't exist |
| `rate_limit_exceeded` | Too many requests |
| `payment_error` | Payment processing failed |

---

**Related:**
- [Backend Overview](./overview.md)
- [Services](./services.md)
- [Stripe Integration](../stripe/overview.md)
