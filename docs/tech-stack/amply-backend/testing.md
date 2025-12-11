---
sidebar_position: 5
---

# Testing Guide
*Pytest Testing Strategy*

Target: **100% code coverage**

## Test Structure

```
tests/
├── conftest.py              # Shared fixtures
├── factories.py             # Test data factories
│
├── unit/                    # Unit tests (mocked dependencies)
│   ├── modules/
│   │   ├── test_ledger.py
│   │   ├── test_payments.py
│   │   ├── test_donations.py
│   │   ├── test_organisations.py
│   │   ├── test_users.py
│   │   ├── test_campaigns.py
│   │   ├── test_businesses.py
│   │   └── test_webhooks.py
│   ├── api/
│   │   ├── test_donations_api.py
│   │   ├── test_organisations_api.py
│   │   └── ...
│   └── lib/
│       ├── test_crypto.py
│       └── test_email.py
│
├── integration/             # Integration tests (real database)
│   ├── test_donation_flow.py
│   ├── test_ledger_integrity.py
│   ├── test_stripe_integration.py
│   └── test_webhook_dispatch.py
│
└── e2e/                     # End-to-end tests
    ├── test_full_donation.py
    ├── test_organisation_onboarding.py
    └── test_recurring_donations.py
```

## Configuration

```python
# conftest.py
import pytest
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from amply.db.base import Base
from amply.config import settings

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    import asyncio
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session")
async def engine():
    """Create test database engine."""
    engine = create_async_engine(
        settings.test_database_url,
        echo=False
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest.fixture
async def db(engine):
    """Create database session for each test."""
    async with AsyncSession(engine) as session:
        yield session
        await session.rollback()

@pytest.fixture
def client(db):
    """Create test client with database session."""
    from fastapi.testclient import TestClient
    from amply.main import app
    from amply.dependencies import get_db

    app.dependency_overrides[get_db] = lambda: db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
```

## Test Factories

```python
# factories.py
import factory
from factory.alchemy import SQLAlchemyModelFactory
from amply.db.models import Organisation, User, Fund, LedgerEntry

class OrganisationFactory(SQLAlchemyModelFactory):
    class Meta:
        model = Organisation
        sqlalchemy_session_persistence = "commit"

    id = factory.Sequence(lambda n: f"org_{n:06d}")
    name = factory.Faker('company')
    legal_name = factory.LazyAttribute(lambda o: f"{o.name} Inc.")
    type = "nonprofit"
    status = "verified"
    country = "DE"
    verification_level = "standard"

class UserFactory(SQLAlchemyModelFactory):
    class Meta:
        model = User

    id = factory.Sequence(lambda n: f"usr_{n:06d}")
    email = factory.Faker('email')
    name = factory.Faker('name')
    status = "active"
    email_verified = True

class FundFactory(SQLAlchemyModelFactory):
    class Meta:
        model = Fund

    id = factory.Sequence(lambda n: f"fund_{n:06d}")
    organisation_id = factory.LazyAttribute(lambda o: OrganisationFactory().id)
    name = "General Fund"
    type = "general"
    status = "active"
    balance = 0
    currency = "EUR"

class LedgerEntryFactory(SQLAlchemyModelFactory):
    class Meta:
        model = LedgerEntry

    id = factory.Sequence(lambda n: f"led_{n:06d}")
    organisation_id = factory.LazyAttribute(lambda o: OrganisationFactory().id)
    type = "donation_received"
    amount = 5000
    currency = "EUR"
    visibility = "public_full"
    metadata = {}
```

## Unit Tests

### Ledger Tests

```python
# tests/unit/modules/test_ledger.py
import pytest
from amply.modules.ledger.hash_chain import compute_entry_hash, verify_entry_hash

class TestHashChain:
    def test_compute_hash_deterministic(self):
        """Same input produces same hash."""
        data = {
            'entry_id': 'led_001',
            'timestamp': '2025-01-15T14:30:00Z',
            'organisation_id': 'org_xyz',
            'type': 'donation_received',
            'amount': 5000,
            'currency': 'EUR',
            'visibility': 'public_full',
            'metadata': {},
            'prev_entry_hash': None
        }
        hash1 = compute_entry_hash(**data)
        hash2 = compute_entry_hash(**data)
        assert hash1 == hash2

    def test_compute_hash_includes_prev_hash(self):
        """Hash changes when prev_entry_hash changes."""
        data = {
            'entry_id': 'led_002',
            'timestamp': '2025-01-15T14:30:00Z',
            'organisation_id': 'org_xyz',
            'type': 'donation_received',
            'amount': 5000,
            'currency': 'EUR',
            'visibility': 'public_full',
            'metadata': {}
        }
        hash1 = compute_entry_hash(**data, prev_entry_hash=None)
        hash2 = compute_entry_hash(**data, prev_entry_hash='sha256:abc123')
        assert hash1 != hash2

    def test_hash_format(self):
        """Hash is SHA-256 in expected format."""
        data = {...}
        result = compute_entry_hash(**data)
        assert result.startswith('sha256:')
        assert len(result) == len('sha256:') + 64  # SHA-256 = 64 hex chars

class TestLedgerService:
    @pytest.mark.asyncio
    async def test_create_entry_links_to_previous(self, db, organisation):
        """New entry references previous entry's hash."""
        service = LedgerService()

        entry1 = await service.create_entry(
            db, organisation.id, 'donation_received', 5000, 'EUR', 'public_full', {}
        )
        entry2 = await service.create_entry(
            db, organisation.id, 'donation_received', 3000, 'EUR', 'public_full', {}
        )

        assert entry2.prev_entry_hash == entry1.entry_hash

    @pytest.mark.asyncio
    async def test_verify_chain_detects_tampering(self, db, organisation):
        """Chain verification fails if entry is tampered."""
        service = LedgerService()

        # Create entries
        await service.create_entry(db, organisation.id, ...)
        await service.create_entry(db, organisation.id, ...)
        await service.create_entry(db, organisation.id, ...)

        # Tamper with middle entry (simulate attack)
        entry = await db.get(LedgerEntry, 'led_002')
        entry.amount = 9999999
        await db.commit()

        # Verify chain
        result = await service.verify_chain(db, organisation.id)
        assert result.valid is False
        assert 'led_002' in result.broken_at
```

### Payment Tests

```python
# tests/unit/modules/test_payments.py
import pytest
from unittest.mock import patch, MagicMock

class TestPaymentService:
    @pytest.mark.asyncio
    @patch('amply.modules.payments.stripe_connect.stripe')
    async def test_create_payment_intent(self, mock_stripe, db, organisation):
        """PaymentIntent created on connected account."""
        mock_stripe.PaymentIntent.create.return_value = MagicMock(
            id='pi_test123',
            client_secret='pi_test123_secret_xxx'
        )

        service = PaymentService()
        result = await service.create_payment_intent(
            organisation_id=organisation.id,
            amount=5000,
            currency='EUR'
        )

        mock_stripe.PaymentIntent.create.assert_called_once()
        call_kwargs = mock_stripe.PaymentIntent.create.call_args.kwargs
        assert call_kwargs['amount'] == 5000
        assert call_kwargs['currency'] == 'eur'
        assert call_kwargs['transfer_data']['destination'] == organisation.stripe_account_id

    @pytest.mark.asyncio
    async def test_process_successful_payment_creates_ledger_entry(
        self, db, organisation, payment_intent
    ):
        """Successful payment creates ledger entry."""
        service = PaymentService()

        result = await service.process_successful_payment(
            db, payment_intent.id
        )

        # Check ledger entry created
        entry = await db.query(LedgerEntry).filter_by(
            transaction_id=result.id
        ).first()
        assert entry is not None
        assert entry.amount == payment_intent.amount
        assert entry.type == 'donation_received'
```

## Integration Tests

```python
# tests/integration/test_donation_flow.py
import pytest
from httpx import AsyncClient

class TestDonationFlow:
    @pytest.mark.asyncio
    async def test_full_donation_flow(self, client, organisation, fund):
        """Test complete donation flow from API to ledger."""
        # 1. Create donation
        response = await client.post('/v1/donations', json={
            'organisation_id': organisation.id,
            'fund_id': fund.id,
            'amount': 5000,
            'currency': 'EUR',
            'donor': {
                'email': 'test@example.com',
                'name': 'Test Donor'
            }
        })
        assert response.status_code == 201
        donation = response.json()['data']
        assert donation['status'] == 'pending'

        # 2. Simulate Stripe webhook (payment success)
        await simulate_stripe_webhook('payment_intent.succeeded', {
            'id': donation['stripe_payment_id'],
            'amount': 5000,
            'currency': 'eur'
        })

        # 3. Verify donation completed
        response = await client.get(f'/v1/donations/{donation["id"]}')
        assert response.json()['data']['status'] == 'completed'

        # 4. Verify ledger entry created
        response = await client.get(
            f'/v1/organisations/{organisation.id}/ledger'
        )
        entries = response.json()['data']
        assert len(entries) == 1
        assert entries[0]['amount'] == 5000
        assert entries[0]['type'] == 'donation_received'

        # 5. Verify fund balance updated
        response = await client.get(f'/v1/funds/{fund.id}')
        assert response.json()['data']['balance'] == 5000

class TestLedgerIntegrity:
    @pytest.mark.asyncio
    async def test_concurrent_entries_maintain_chain(self, db, organisation):
        """Concurrent ledger entries maintain hash chain integrity."""
        import asyncio

        async def create_entry(n):
            await ledger_service.create_entry(
                db, organisation.id, 'donation_received',
                1000 * n, 'EUR', 'public_full', {'n': n}
            )

        # Create 10 entries concurrently
        await asyncio.gather(*[create_entry(i) for i in range(10)])

        # Verify chain integrity
        result = await ledger_service.verify_chain(db, organisation.id)
        assert result.valid is True
        assert result.entry_count == 10
```

## Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=amply --cov-report=html --cov-fail-under=100

# Run specific test file
pytest tests/unit/modules/test_ledger.py

# Run specific test
pytest tests/unit/modules/test_ledger.py::TestHashChain::test_compute_hash_deterministic

# Run with verbose output
pytest -v

# Run only integration tests
pytest tests/integration/

# Run in parallel
pytest -n auto
```

## CI Configuration

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: amply_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install dependencies
        run: pip install -e ".[dev]"

      - name: Run tests
        env:
          DATABASE_URL: postgresql+asyncpg://test:test@localhost:5432/amply_test
          REDIS_URL: redis://localhost:6379
        run: pytest --cov=amply --cov-report=xml --cov-fail-under=100

      - name: Upload coverage
        uses: codecov/codecov-action@v4
```

## Coverage Requirements

**Minimum**: 100% line coverage

**Exclusions** (in `pyproject.toml`):
```toml
[tool.coverage.run]
omit = [
    "*/migrations/*",
    "*/__init__.py",
]

[tool.coverage.report]
exclude_lines = [
    "pragma: no cover",
    "if TYPE_CHECKING:",
    "raise NotImplementedError",
]
```

---

**Related:**
- [Backend Overview](./overview.md)
- [CI/CD](../ci-cd/overview.md)
