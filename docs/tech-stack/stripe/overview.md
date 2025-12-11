---
sidebar_position: 1
---

# Stripe Integration
*Payment Processing*

Amply uses Stripe Connect to process donations and route funds to organisations.

## Overview

| Feature | Implementation |
|---------|----------------|
| Account type | Stripe Connect (Standard) |
| Charge type | Direct charges |
| Platform fees | None (0%) |
| Payout schedule | Automatic (organisation controlled) |
| Currencies | EUR, GBP, USD, CHF + more |

## Stripe Connect Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐
│    Donor     │────▶│    Amply     │────▶│   Organisation's     │
│              │     │  (Platform)  │     │   Stripe Account     │
└──────────────┘     └──────────────┘     └──────────────────────┘
                           │
                    Direct Charge
                    (funds go directly
                     to connected account)
```

### Why Direct Charges

- Funds go directly to organisation's Stripe account
- Organisation appears on donor's bank statement
- Simpler accounting for organisations
- No platform intermediary for refunds
- Organisation controls their own payouts

## Account Types

### Platform Account (Amply)

```yaml
Account: acct_amply_platform
Purpose: API access, Connect management
Collects: Nothing (0% platform fee)
```

### Connected Accounts (Organisations)

```yaml
Type: Standard
Onboarding: Stripe-hosted OAuth
Capabilities:
  - card_payments
  - transfers
```

## Onboarding Flow

### 1. Organisation Initiates Connection

```python
# Backend: Generate OAuth link
@router.get("/organisations/{org_id}/stripe/connect")
async def initiate_stripe_connect(
    org_id: str,
    current_user: User = Depends(get_current_user),
):
    """Generate Stripe Connect OAuth URL."""
    organisation = await get_organisation(org_id)

    # Create OAuth link
    oauth_link = f"https://connect.stripe.com/oauth/authorize?" + urlencode({
        "response_type": "code",
        "client_id": settings.stripe_client_id,
        "scope": "read_write",
        "redirect_uri": f"{settings.app_url}/organisations/{org_id}/stripe/callback",
        "state": generate_state_token(org_id, current_user.id),
        "stripe_user[email]": organisation.email,
        "stripe_user[business_name]": organisation.name,
        "stripe_user[country]": organisation.country,
    })

    return {"url": oauth_link}
```

### 2. OAuth Callback

```python
@router.get("/organisations/{org_id}/stripe/callback")
async def stripe_oauth_callback(
    org_id: str,
    code: str,
    state: str,
):
    """Handle Stripe Connect OAuth callback."""
    # Verify state token
    verify_state_token(state, org_id)

    # Exchange code for account ID
    response = stripe.OAuth.token(
        grant_type="authorization_code",
        code=code,
    )

    stripe_account_id = response["stripe_user_id"]

    # Store connected account
    await update_organisation(
        org_id,
        stripe_account_id=stripe_account_id,
        stripe_connected_at=datetime.utcnow(),
    )

    return RedirectResponse(
        url=f"{settings.dashboard_url}/settings/payments?connected=true"
    )
```

### 3. Account Status Check

```python
async def get_stripe_account_status(stripe_account_id: str) -> dict:
    """Check connected account status."""
    account = stripe.Account.retrieve(stripe_account_id)

    return {
        "id": account.id,
        "charges_enabled": account.charges_enabled,
        "payouts_enabled": account.payouts_enabled,
        "details_submitted": account.details_submitted,
        "requirements": account.requirements,
    }
```

## Processing Donations

### Create Payment Intent

```python
async def create_donation_payment(
    amount: Decimal,
    currency: str,
    organisation: Organisation,
    donor: Donor | None,
    metadata: dict,
) -> stripe.PaymentIntent:
    """Create payment intent for donation."""

    # Calculate amounts
    amount_cents = int(amount * 100)

    # Fee handling (if donor covers fees)
    if metadata.get("cover_fees"):
        stripe_fee = calculate_stripe_fee(amount, currency)
        amount_cents = int((amount + stripe_fee) * 100)

    payment_intent = stripe.PaymentIntent.create(
        amount=amount_cents,
        currency=currency.lower(),

        # Direct charge to connected account
        stripe_account=organisation.stripe_account_id,

        # Metadata for tracking
        metadata={
            "donation_id": metadata["donation_id"],
            "organisation_id": organisation.id,
            "donor_id": donor.id if donor else None,
            "fund_id": metadata.get("fund_id"),
            "campaign_id": metadata.get("campaign_id"),
            "cover_fees": metadata.get("cover_fees", False),
        },

        # Receipt
        receipt_email=donor.email if donor else None,

        # Statement descriptor
        statement_descriptor_suffix=truncate(organisation.name, 22),

        # Payment method options
        payment_method_types=["card", "sepa_debit", "bancontact", "ideal"],

        # Automatic payment methods
        automatic_payment_methods={
            "enabled": True,
            "allow_redirects": "always",
        },
    )

    return payment_intent
```

### Confirm Payment (Frontend)

```typescript
// Dashboard: Confirm payment with Stripe Elements
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';

function DonationForm({ clientSecret, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/donation/complete`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setError(error.message);
    } else if (paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit">Donate</button>
    </form>
  );
}
```

## Webhooks

### Webhook Security (CRITICAL)

**All Stripe webhooks MUST verify the signature.** Without verification, attackers can forge webhook events to:
- Mark fake donations as complete
- Trigger refunds that didn't happen
- Corrupt ledger state

**Required security measures:**
1. **Signature verification** - Always verify `Stripe-Signature` header
2. **Idempotency** - Track processed event IDs to prevent replay attacks
3. **HTTPS only** - Webhook endpoint must use HTTPS
4. **Secret rotation** - Rotate webhook secret periodically

### Webhook Endpoint

```python
@router.post("/webhooks/stripe")
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Handle Stripe webhooks with security verification."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    # SECURITY: Always verify signature
    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig_header,
            settings.stripe_webhook_secret,
        )
    except ValueError:
        logger.warning(f"Invalid webhook payload from {request.client.host}")
        raise HTTPException(400, "Invalid payload")
    except stripe.error.SignatureVerificationError:
        logger.warning(f"Invalid webhook signature from {request.client.host}")
        raise HTTPException(400, "Invalid signature")

    # SECURITY: Idempotency - check if already processed
    if await is_event_processed(db, event.id):
        return {"status": "already_processed"}

    # Handle event types
    handlers = {
        "payment_intent.succeeded": handle_payment_succeeded,
        "payment_intent.payment_failed": handle_payment_failed,
        "charge.refunded": handle_refund,
        "account.updated": handle_account_updated,
        "payout.paid": handle_payout,
    }

    handler = handlers.get(event.type)
    if handler:
        try:
            await handler(event.data.object, db)
            await mark_event_processed(db, event.id, event.type)
        except Exception as e:
            logger.error(f"Failed to process event {event.id}: {e}")
            raise

    return {"status": "ok"}
```

### Idempotency Table

```sql
-- Track processed webhook events to prevent replays
CREATE TABLE stripe_events_processed (
    event_id VARCHAR(255) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for cleanup job
CREATE INDEX idx_stripe_events_processed_at
    ON stripe_events_processed(processed_at);

-- Cleanup events older than 30 days (Stripe doesn't retry after 3 days)
-- Run periodically via scheduled job
DELETE FROM stripe_events_processed
WHERE processed_at < NOW() - INTERVAL '30 days';
```

### Idempotency Helpers

```python
async def is_event_processed(db: AsyncSession, event_id: str) -> bool:
    """Check if Stripe event was already processed."""
    result = await db.execute(
        select(StripeEventProcessed).where(
            StripeEventProcessed.event_id == event_id
        )
    )
    return result.scalar_one_or_none() is not None

async def mark_event_processed(
    db: AsyncSession,
    event_id: str,
    event_type: str
):
    """Mark Stripe event as processed."""
    event = StripeEventProcessed(
        event_id=event_id,
        event_type=event_type,
    )
    db.add(event)
    await db.commit()
```

### Payment Success Handler

```python
async def handle_payment_succeeded(payment_intent: dict):
    """Handle successful payment."""
    donation_id = payment_intent["metadata"]["donation_id"]

    async with db.transaction():
        # Update donation status
        donation = await update_donation(
            donation_id,
            status="completed",
            stripe_payment_intent_id=payment_intent["id"],
            completed_at=datetime.utcnow(),
        )

        # Create ledger entry
        await create_ledger_entry(
            entry_type="donation_received",
            organisation_id=donation.organisation_id,
            reference_type="donation",
            reference_id=donation.id,
            amount=donation.amount,
            currency=donation.currency,
            metadata={
                "donor_id": donation.donor_id,
                "fund_id": donation.fund_id,
            },
        )

        # Queue receipt email
        send_donation_receipt.delay(donation_id)
```

### Refund Handler

```python
async def handle_refund(charge: dict):
    """Handle refund event."""
    # Find original donation
    payment_intent_id = charge["payment_intent"]
    donation = await get_donation_by_payment_intent(payment_intent_id)

    if not donation:
        logger.warning(f"Donation not found for refund: {payment_intent_id}")
        return

    async with db.transaction():
        # Update donation
        await update_donation(
            donation.id,
            status="refunded",
            refunded_at=datetime.utcnow(),
        )

        # Create reversal ledger entry
        await create_ledger_entry(
            entry_type="donation_refunded",
            organisation_id=donation.organisation_id,
            reference_type="donation",
            reference_id=donation.id,
            amount=-donation.amount,  # Negative amount
            currency=donation.currency,
            metadata={
                "original_entry_id": donation.ledger_entry_id,
                "reason": charge.get("refund_reason"),
            },
        )
```

## Fee Calculation

```python
# Stripe fee structure (varies by region)
STRIPE_FEES = {
    "EUR": {"percentage": Decimal("0.015"), "fixed": Decimal("0.25")},  # 1.5% + €0.25
    "GBP": {"percentage": Decimal("0.015"), "fixed": Decimal("0.20")},  # 1.5% + £0.20
    "USD": {"percentage": Decimal("0.029"), "fixed": Decimal("0.30")},  # 2.9% + $0.30
    "CHF": {"percentage": Decimal("0.029"), "fixed": Decimal("0.30")},  # 2.9% + CHF0.30
}

def calculate_stripe_fee(amount: Decimal, currency: str) -> Decimal:
    """Calculate Stripe processing fee."""
    fee_config = STRIPE_FEES.get(currency, STRIPE_FEES["EUR"])

    fee = (amount * fee_config["percentage"]) + fee_config["fixed"]
    return fee.quantize(Decimal("0.01"))

def calculate_amount_with_fees(amount: Decimal, currency: str) -> Decimal:
    """Calculate total amount if donor covers fees."""
    fee = calculate_stripe_fee(amount, currency)
    return amount + fee
```

## Recurring Donations

### Create Subscription

```python
async def create_recurring_donation(
    amount: Decimal,
    currency: str,
    interval: str,  # "month" or "year"
    organisation: Organisation,
    donor: Donor,
    payment_method_id: str,
) -> stripe.Subscription:
    """Create recurring donation subscription."""

    # Ensure customer exists on connected account
    customer = await get_or_create_stripe_customer(
        donor,
        organisation.stripe_account_id,
    )

    # Attach payment method
    stripe.PaymentMethod.attach(
        payment_method_id,
        customer=customer.id,
        stripe_account=organisation.stripe_account_id,
    )

    # Set as default
    stripe.Customer.modify(
        customer.id,
        invoice_settings={"default_payment_method": payment_method_id},
        stripe_account=organisation.stripe_account_id,
    )

    # Create price (product already exists per org)
    price = stripe.Price.create(
        unit_amount=int(amount * 100),
        currency=currency.lower(),
        recurring={"interval": interval},
        product=organisation.stripe_donation_product_id,
        stripe_account=organisation.stripe_account_id,
    )

    # Create subscription
    subscription = stripe.Subscription.create(
        customer=customer.id,
        items=[{"price": price.id}],
        metadata={
            "recurring_donation_id": str(uuid.uuid4()),
            "organisation_id": organisation.id,
            "donor_id": donor.id,
        },
        stripe_account=organisation.stripe_account_id,
    )

    return subscription
```

## Payment Methods

### Supported Methods

| Method | Currencies | Regions |
|--------|------------|---------|
| Card | All | Global |
| SEPA Direct Debit | EUR | Eurozone |
| iDEAL | EUR | Netherlands |
| Bancontact | EUR | Belgium |
| SOFORT | EUR | DE, AT, BE, NL |
| Przelewy24 | PLN | Poland |

### Bank Transfer (Manual)

```python
# Create customer balance funding instructions
async def create_bank_transfer_instructions(
    amount: Decimal,
    currency: str,
    organisation: Organisation,
    donor: Donor,
) -> dict:
    """Generate bank transfer instructions."""

    customer = await get_or_create_stripe_customer(
        donor,
        organisation.stripe_account_id,
    )

    # Create funding instructions
    instructions = stripe.Customer.create_funding_instructions(
        customer.id,
        bank_transfer={
            "type": "eu_bank_transfer",
            "eu_bank_transfer": {"country": "DE"},
        },
        currency=currency.lower(),
        stripe_account=organisation.stripe_account_id,
    )

    return {
        "iban": instructions.bank_transfer.iban,
        "bic": instructions.bank_transfer.bic,
        "reference": instructions.bank_transfer.reference,
        "amount": amount,
        "currency": currency,
    }
```

## Testing

### Test Cards

| Scenario | Card Number |
|----------|-------------|
| Success | 4242 4242 4242 4242 |
| Decline | 4000 0000 0000 0002 |
| 3D Secure | 4000 0027 6000 3184 |
| Insufficient funds | 4000 0000 0000 9995 |

### Test IBAN

```
SEPA test IBAN: DE89370400440532013000
```

### Webhook Testing

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:8000/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger charge.refunded
```

## Reporting

### Transaction Reports

```python
async def get_stripe_transactions(
    organisation: Organisation,
    start_date: datetime,
    end_date: datetime,
) -> list[dict]:
    """Get Stripe transactions for reporting."""

    charges = stripe.Charge.list(
        created={
            "gte": int(start_date.timestamp()),
            "lte": int(end_date.timestamp()),
        },
        limit=100,
        stripe_account=organisation.stripe_account_id,
    )

    return [
        {
            "id": charge.id,
            "amount": Decimal(charge.amount) / 100,
            "currency": charge.currency.upper(),
            "fee": Decimal(charge.balance_transaction.fee) / 100,
            "net": Decimal(charge.balance_transaction.net) / 100,
            "created": datetime.fromtimestamp(charge.created),
            "status": charge.status,
        }
        for charge in charges.auto_paging_iter()
    ]
```

---

**Related:**
- [Backend Services](../amply-backend/services.md)
- [Payment Flows](../architecture/stripe-flows.md)
- [RDS PostgreSQL](../aws/rds.md)
- [Verification CLI](../amply-verify/overview.md)
- [Pricing](../transparency/pricing.md)
