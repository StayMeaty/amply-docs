---
sidebar_position: 3
---

# Sentry
*Error Tracking and Performance Monitoring*

Sentry provides real-time error tracking and performance monitoring for all Amply applications.

## Overview

| Component | Sentry Project |
|-----------|----------------|
| Backend API | `amply-backend` |
| Dashboard | `amply-dashboard` |
| Public Website | `amply-public` |
| Widgets | `amply-widgets` |

## Backend Integration

### Installation

```bash
pip install sentry-sdk[fastapi,celery,sqlalchemy]
```

### Configuration

```python
# src/amply/core/sentry.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from sentry_sdk.integrations.redis import RedisIntegration

def init_sentry(dsn: str, environment: str):
    """Initialise Sentry SDK."""
    sentry_sdk.init(
        dsn=dsn,
        environment=environment,
        traces_sample_rate=0.1,       # 10% of transactions
        profiles_sample_rate=0.1,     # 10% of profiled transactions

        integrations=[
            FastApiIntegration(transaction_style="endpoint"),
            CeleryIntegration(),
            SqlalchemyIntegration(),
            RedisIntegration(),
        ],

        # Don't send PII
        send_default_pii=False,

        # Filter sensitive data
        before_send=filter_sensitive_data,

        # Release tracking
        release=f"amply-backend@{settings.version}",
    )

def filter_sensitive_data(event, hint):
    """Remove sensitive data before sending to Sentry."""
    # Remove API keys from headers
    if 'request' in event and 'headers' in event['request']:
        headers = event['request']['headers']
        if 'X-Api-Key' in headers:
            headers['X-Api-Key'] = '[REDACTED]'
        if 'Authorization' in headers:
            headers['Authorization'] = '[REDACTED]'

    # Remove sensitive body data
    if 'request' in event and 'data' in event['request']:
        data = event['request'].get('data', {})
        if isinstance(data, dict):
            for key in ['password', 'card_number', 'cvv', 'secret']:
                if key in data:
                    data[key] = '[REDACTED]'

    return event
```

### FastAPI Integration

```python
# src/amply/main.py
from fastapi import FastAPI
from amply.core.sentry import init_sentry

app = FastAPI()

@app.on_event("startup")
async def startup():
    init_sentry(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
    )
```

### Custom Context

```python
import sentry_sdk

def process_donation(donation: Donation, user: User):
    """Process donation with Sentry context."""
    with sentry_sdk.push_scope() as scope:
        # Add context for debugging
        scope.set_tag("organisation_id", donation.organisation_id)
        scope.set_tag("donation_type", donation.type)
        scope.set_user({"id": user.id, "email": user.email})
        scope.set_context("donation", {
            "id": donation.id,
            "amount": str(donation.amount),
            "currency": donation.currency,
        })

        try:
            # Process donation
            result = _process_donation(donation)
            return result
        except Exception as e:
            sentry_sdk.capture_exception(e)
            raise
```

### Manual Error Capture

```python
import sentry_sdk

# Capture exception with context
try:
    risky_operation()
except Exception as e:
    sentry_sdk.capture_exception(e)
    # Handle gracefully

# Capture message
sentry_sdk.capture_message("Unusual activity detected", level="warning")

# Add breadcrumb
sentry_sdk.add_breadcrumb(
    category="payment",
    message="Initiated Stripe charge",
    level="info",
    data={"amount": amount, "currency": currency},
)
```

## Celery Integration

```python
# src/amply/jobs/config.py
from celery import Celery
import sentry_sdk
from sentry_sdk.integrations.celery import CeleryIntegration

# Sentry captures task failures automatically
app = Celery('amply')

@app.task(bind=True, max_retries=3)
def process_webhook(self, webhook_id: str):
    """Process webhook with automatic Sentry tracking."""
    try:
        # Task logic
        pass
    except Exception as e:
        # Sentry captures this automatically
        raise self.retry(exc=e, countdown=60)
```

## Frontend Integration

### Dashboard (React)

```typescript
// src/sentry.ts
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,

  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: [
        "localhost",
        "api.amply-impact.org",
      ],
    }),
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  beforeSend(event) {
    // Scrub sensitive data
    if (event.request?.data) {
      delete event.request.data.password;
      delete event.request.data.cardNumber;
    }
    return event;
  },

  release: `amply-dashboard@${__APP_VERSION__}`,
});
```

### Error Boundary

```tsx
// src/components/ErrorBoundary.tsx
import * as Sentry from "@sentry/react";

export const SentryErrorBoundary = Sentry.withErrorBoundary(
  ({ children }) => children,
  {
    fallback: ({ error, resetError }) => (
      <ErrorFallback error={error} onReset={resetError} />
    ),
    showDialog: true,
  }
);

// Usage in App.tsx
function App() {
  return (
    <SentryErrorBoundary>
      <Router>
        <Routes />
      </Router>
    </SentryErrorBoundary>
  );
}
```

### User Context

```typescript
// After successful login
import * as Sentry from "@sentry/react";

function onLoginSuccess(user: User) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    // Don't include PII like name
  });
}

function onLogout() {
  Sentry.setUser(null);
}
```

## Widget Integration

```typescript
// widgets/src/sentry.ts
import * as Sentry from "@sentry/browser";

Sentry.init({
  dsn: WIDGET_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Minimal sampling for widgets (high volume)
  tracesSampleRate: 0.01,  // 1%

  // Only capture errors
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ["api.amply-impact.org"],
    }),
  ],

  // Tag with host site
  beforeSend(event) {
    event.tags = {
      ...event.tags,
      host_origin: window.location.origin,
    };
    return event;
  },
});
```

## Performance Monitoring

### Custom Transactions

```python
import sentry_sdk

def generate_checkpoint():
    """Generate checkpoint with performance tracking."""
    with sentry_sdk.start_transaction(
        op="task",
        name="generate_checkpoint",
    ) as transaction:

        with transaction.start_child(op="db", description="fetch entries"):
            entries = fetch_entries_since_last_checkpoint()

        with transaction.start_child(op="compute", description="compute merkle root"):
            merkle_root = compute_merkle_root(entries)

        with transaction.start_child(op="sign", description="sign checkpoint"):
            signature = sign_checkpoint(merkle_root)

        with transaction.start_child(op="upload", description="upload to S3"):
            upload_checkpoint(checkpoint)
```

### Custom Spans

```typescript
// Frontend performance tracking
import * as Sentry from "@sentry/react";

async function loadDashboard() {
  const transaction = Sentry.startTransaction({
    name: "Load Dashboard",
    op: "navigation",
  });

  const fetchSpan = transaction.startChild({
    op: "http",
    description: "Fetch organisation data",
  });

  const data = await fetchOrganisationData();
  fetchSpan.finish();

  const renderSpan = transaction.startChild({
    op: "render",
    description: "Render dashboard",
  });

  renderDashboard(data);
  renderSpan.finish();

  transaction.finish();
}
```

## Alerts and Notifications

### Alert Rules

| Alert | Condition | Action |
|-------|-----------|--------|
| New error | First occurrence | Slack |
| High volume | > 100 errors/hour | Slack + Email |
| Critical error | Production + payment | PagerDuty |
| Performance regression | P95 > 2s | Slack |

### Slack Integration

```
Sentry → Project Settings → Integrations → Slack
Channel: #amply-alerts
```

### Issue Assignment

```
Auto-assign based on file path:
- src/amply/payments/* → payments-team
- src/amply/ledger/* → core-team
- widgets/* → frontend-team
```

## Environments

| Environment | DSN | Sample Rate |
|-------------|-----|-------------|
| Production | amply-backend (prod) | 10% |
| Staging | amply-backend (staging) | 100% |
| Development | Local only | N/A |

## Release Tracking

### Backend Releases

```bash
# In CI/CD
export SENTRY_AUTH_TOKEN=xxx
export SENTRY_ORG=amply
export SENTRY_PROJECT=amply-backend

# Create release
sentry-cli releases new "amply-backend@${VERSION}"

# Associate commits
sentry-cli releases set-commits "amply-backend@${VERSION}" --auto

# Finalise
sentry-cli releases finalize "amply-backend@${VERSION}"
```

### Source Maps

```bash
# Upload frontend source maps
sentry-cli releases files "amply-dashboard@${VERSION}" \
  upload-sourcemaps ./dist \
  --url-prefix '~/'
```

## Data Retention

| Data Type | Retention |
|-----------|-----------|
| Error events | 90 days |
| Transactions | 90 days |
| Attachments | 30 days |
| Session replays | 30 days |

## Cost

| Tier | Price | Errors/month |
|------|-------|--------------|
| Developer (Free) | $0 | 5,000 |
| Team | $26/month | 50,000 |
| Business | $80/month | 100,000 |

---

**Related:**
- [Backend Overview](./amply-backend/overview.md)
- [Dashboard](./amply-dashboard/overview.md)
- [AWS Overview](./aws/overview.md)
