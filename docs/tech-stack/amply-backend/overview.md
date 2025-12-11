---
sidebar_position: 1
---

# Backend Overview
*Python Monolith for Transparent Donations*

The Amply backend is a Python monolith built with FastAPI, providing the REST API and all business logic.

## Core Thesis

> Transparency builds trust. Trust increases giving.

The backend must demonstrate:
1. Donor gives money → Organisation receives it (0% platform fees)
2. Every transaction is publicly visible and verifiable
3. Cryptographic integrity ensures no tampering

## Technology Stack

| Component | Technology |
|-----------|------------|
| Language | Python 3.12+ |
| Framework | FastAPI |
| ORM | SQLAlchemy 2.0 |
| Migrations | Alembic |
| Database | PostgreSQL 15+ |
| Testing | Pytest (100% coverage) |
| Type Checking | mypy |
| Linting | ruff |

## Project Structure

```
amply-backend/
├── src/amply/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app
│   ├── config.py               # Settings
│   ├── deps.py                 # Dependencies (get_db, get_user)
│   │
│   ├── api/v1/                 # API routes
│   │   ├── __init__.py
│   │   ├── router.py           # Combines all routers
│   │   ├── auth.py             # Login/session
│   │   ├── donations.py        # Create donation
│   │   ├── organisations.py    # Organisation CRUD
│   │   ├── public.py           # Public ledger access
│   │   └── webhooks.py         # Stripe webhooks
│   │
│   ├── services/               # Business logic
│   │   ├── __init__.py
│   │   ├── auth.py             # Authentication
│   │   ├── donations.py        # Donation lifecycle
│   │   ├── ledger.py           # Hash chain
│   │   ├── organisations.py    # Organisation management
│   │   └── stripe.py           # Stripe Connect
│   │
│   ├── models/                 # SQLAlchemy models
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── organisation.py
│   │   ├── fund.py
│   │   ├── donation.py
│   │   ├── ledger_entry.py
│   │   └── user.py
│   │
│   ├── schemas/                # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── donation.py
│   │   ├── organisation.py
│   │   └── user.py
│   │
│   └── lib/                    # Utilities
│       ├── __init__.py
│       ├── crypto.py           # Hash functions
│       └── ids.py              # ID generation
│
├── migrations/                 # Alembic
│   ├── env.py
│   └── versions/
│
├── tests/
│   ├── conftest.py
│   ├── test_donations.py
│   ├── test_ledger.py
│   └── test_organisations.py
│
├── pyproject.toml
├── Dockerfile
└── .env.example
```

## Service Responsibilities

### Ledger Service

**Purpose**: Tamper-evident financial record keeping.

**Key operations**:
- Create ledger entries with hash chain
- Compute and verify hashes
- Public ledger export

```python
# services/ledger.py
from amply.lib.crypto import compute_entry_hash

async def create_entry(
    db: AsyncSession,
    organisation_id: str,
    entry_type: str,
    amount: int,
    currency: str,
    metadata: dict,
) -> LedgerEntry:
    """Create ledger entry with hash chain integrity."""
    async with db.begin():
        # Get previous entry
        prev = await get_latest_entry(db, organisation_id)
        prev_hash = prev.entry_hash if prev else None

        # Compute hash
        entry_hash = compute_entry_hash(
            entry_id=generate_id("led"),
            timestamp=datetime.utcnow(),
            organisation_id=organisation_id,
            entry_type=entry_type,
            amount=amount,
            currency=currency,
            metadata=metadata,
            prev_entry_hash=prev_hash,
        )

        entry = LedgerEntry(
            organisation_id=organisation_id,
            type=entry_type,
            amount=amount,
            currency=currency,
            metadata=metadata,
            prev_entry_hash=prev_hash,
            entry_hash=entry_hash,
        )
        db.add(entry)
        return entry
```

### Donations Service

**Purpose**: Donation lifecycle from payment to ledger.

**Flow**:
```
1. Donor submits → Create PaymentIntent
2. Stripe confirms → Webhook received
3. Donation completed → Ledger entry created
```

```python
# services/donations.py
async def complete_donation(
    db: AsyncSession,
    payment_intent_id: str,
) -> Donation:
    """Complete donation after successful payment."""
    async with db.begin():
        donation = await get_donation_by_payment_intent(db, payment_intent_id)

        # Create ledger entry
        entry = await ledger.create_entry(
            db,
            organisation_id=donation.organisation_id,
            entry_type="donation_received",
            amount=donation.amount,
            currency=donation.currency,
            metadata={"donation_id": donation.id},
        )

        # Update donation status
        donation.status = "completed"
        donation.ledger_entry_id = entry.id
        donation.completed_at = datetime.utcnow()

        return donation
```

### Stripe Service

**Purpose**: Stripe Connect integration.

**Key operations**:
- Organisation onboarding (OAuth)
- PaymentIntent creation (direct charges)
- Webhook handling

See [Stripe Integration](../stripe/overview.md) for details.

## Database Integrity

### Append-Only Ledger

PostgreSQL triggers enforce immutability and chain integrity:

```sql
-- Prevent modifications
CREATE OR REPLACE FUNCTION prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Ledger entries cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ledger_no_update
    BEFORE UPDATE ON ledger_entries
    FOR EACH ROW
    EXECUTE FUNCTION prevent_ledger_modification();

CREATE TRIGGER ledger_no_delete
    BEFORE DELETE ON ledger_entries
    FOR EACH ROW
    EXECUTE FUNCTION prevent_ledger_modification();

-- Validate hash chain integrity on INSERT
CREATE OR REPLACE FUNCTION validate_ledger_chain()
RETURNS TRIGGER AS $$
DECLARE
    actual_prev_hash TEXT;
BEGIN
    -- Get the actual previous entry's hash
    SELECT entry_hash INTO actual_prev_hash
    FROM ledger_entries
    WHERE organisation_id = NEW.organisation_id
    ORDER BY created_at DESC, id DESC
    LIMIT 1;

    -- Validate prev_entry_hash matches actual previous entry
    IF actual_prev_hash IS NULL AND NEW.prev_entry_hash IS NOT NULL THEN
        RAISE EXCEPTION 'First entry must have null prev_entry_hash';
    ELSIF actual_prev_hash IS NOT NULL AND NEW.prev_entry_hash != actual_prev_hash THEN
        RAISE EXCEPTION 'prev_entry_hash does not match actual previous entry';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ledger_validate_chain
    BEFORE INSERT ON ledger_entries
    FOR EACH ROW
    EXECUTE FUNCTION validate_ledger_chain();

-- Validate hash format
ALTER TABLE ledger_entries ADD CONSTRAINT valid_hash
    CHECK (entry_hash ~ '^sha256:[a-f0-9]{64}$');
```

### Hash Chain

Each entry includes a hash of its data plus the previous entry's hash:

```
Entry 1          Entry 2          Entry 3
┌──────────┐     ┌──────────┐     ┌──────────┐
│ data     │     │ data     │     │ data     │
│ prev: -  │     │ prev: ───┼─────│ prev: ───┼─────▶
│ hash: A  │◀────│ hash: B  │◀────│ hash: C  │
└──────────┘     └──────────┘     └──────────┘
```

If anyone modifies Entry 1:
- Its hash changes (A → A')
- Entry 2's `prev_entry_hash` no longer matches
- Chain is broken, tampering detected

## API Design

### Base URLs

| Environment | URL |
|-------------|-----|
| Production | `https://api.amply-impact.org/v1` |
| Staging | `https://api.staging.amply-impact.org/v1` |

### Authentication

**Session auth** (dashboard):
```http
Cookie: session=xxx
```

**API keys** (integrators):
```http
Authorization: Bearer sk_live_xxx
```

### Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/public/organisations` | List organisations |
| `GET` | `/public/organisations/:id/ledger` | Public ledger |
| `GET` | `/public/organisations/:id/ledger/export` | Download JSON |
| `POST` | `/donations` | Create donation |
| `GET` | `/donations/:id` | Get donation |
| `POST` | `/webhooks/stripe` | Stripe webhook |

See [API Reference](./api.md) for complete documentation.

## Testing

**Target**: 100% code coverage

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=amply --cov-report=html --cov-fail-under=100

# Run specific test
pytest tests/test_ledger.py -v
```

### Critical Test Cases

**Hash chain integrity**:
```python
async def test_hash_chain_links_entries(db, organisation):
    """Each entry references previous entry's hash."""
    entry1 = await ledger.create_entry(db, organisation.id, ...)
    entry2 = await ledger.create_entry(db, organisation.id, ...)

    assert entry2.prev_entry_hash == entry1.entry_hash

async def test_tampering_detected(db, organisation):
    """Modified entries break the chain."""
    await ledger.create_entry(db, organisation.id, ...)
    entry2 = await ledger.create_entry(db, organisation.id, ...)

    # Tamper with amount (simulated)
    # Recompute hash shows mismatch
    assert verify_chain(db, organisation.id).valid is False
```

## Deployment

**Platform**: AWS ECS Fargate

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY pyproject.toml .
RUN pip install .
COPY src/ src/
CMD ["uvicorn", "amply.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Scaling**:
- Minimum 2 instances
- Auto-scale on CPU/memory
- Health checks on `/health`

See [AWS ECS](../aws/ecs.md) for deployment details.

## Configuration

```python
# config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    database_url: str

    # Stripe
    stripe_secret_key: str
    stripe_webhook_secret: str

    # AWS
    aws_region: str = "eu-central-1"
    s3_bucket: str

    # Environment
    environment: str = "development"
    debug: bool = False

    class Config:
        env_file = ".env"
```

---

**Related:**
- [API Reference](./api.md)
- [Services](./services.md)
- [Testing Guide](./testing.md)
- [Stripe Integration](../stripe/overview.md)
