---
sidebar_position: 3
---

# Payment Flows
*How Money Moves Through Amply*

Amply uses Stripe Connect to handle payment processing. This document explains how donations flow from donors to organizations.

## Overview

### Why Stripe Connect?

Stripe Connect enables multi-party payments:
- **Donors** pay through Amply
- **Amply** orchestrates but doesn't hold funds
- **Organizations** receive payouts directly
- **Stripe** handles compliance and security

### Key Concepts

**Connected Accounts:**
Each organization has a Stripe Connected Account linked to Amply.

**Direct Charges:**
Donations go directly to organization accounts (not through Amply's account).

**Platform Fees:**
Amply takes no platform fee—only Stripe's processing fees apply.

## Donation Flow

### Standard Donation

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Donor   │────▶│  Amply   │────▶│  Stripe  │────▶│   Org    │
│          │     │ (routes) │     │(processes)│     │(receives)│
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │
     │ 1. Initiate    │ 2. Create      │ 3. Process    │ 4. Settle
     │    donation    │    payment     │    payment    │    funds
     │                │    intent      │                │
```

### Step by Step

**1. Donation Initiated**
```
POST /api/donations
{
  "amount": 5000,
  "currency": "USD",
  "organization_id": "org_xyz",
  "payment_method": "pm_card_..."
}
```

**2. Payment Intent Created**
Amply creates a Stripe PaymentIntent on the organization's connected account:
```
stripe.paymentIntents.create({
  amount: 5000,
  currency: 'usd',
  payment_method: 'pm_card_...',
  on_behalf_of: 'acct_org_xyz',
  transfer_data: {
    destination: 'acct_org_xyz'
  }
});
```

**3. Payment Processed**
Stripe processes the payment:
- Card authorized
- Funds captured
- Receipt generated

**4. Funds Settled**
Organization receives funds per their payout schedule:
- Daily, weekly, or monthly
- Direct to verified bank account
- Minus Stripe processing fees

## Fee Handling

### Processing Fees

Stripe charges per transaction:
- Cards: ~2.9% + $0.30 (varies by region)
- Bank transfers: Lower or no fees
- Currency conversion: Additional if applicable

### Fee Coverage Options

**Donor Covers Fees (Default):**
```
Donation: $50.00
Fees: ~$1.75
Donor pays: $51.75
Org receives: $50.00
```

**Fees Deducted:**
```
Donation: $50.00
Fees: ~$1.75
Donor pays: $50.00
Org receives: ~$48.25
```

→ [Pricing and Fees](../transparency/pricing.md)

## Account Types

### Organizations (Connected Accounts)

Each organization has a Stripe Connected Account:
- **Standard**: Organization owns relationship with Stripe
- **Verified**: Identity and banking verified
- **Payouts**: Direct to org's bank account

### Businesses (Collection)

Businesses collecting donations:
- Route customer donations to org accounts
- Never hold donated funds
- Separate from business payments

### Fundraisers

Personal fundraising:
- Donations route to organization account
- Fundraiser never receives funds
- Attribution tracked for reporting

## Multi-Party Scenarios

### Business Checkout Donations

Customer donates at business checkout:

```
┌────────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Customer  │───▶│ Business │───▶│  Amply   │───▶│   Org    │
│            │    │  (POS)   │    │(routing) │    │          │
└────────────┘    └──────────┘    └──────────┘    └──────────┘
                       │                              ▲
                       │                              │
                       └──────────────────────────────┘
                              Donation funds flow
                         (separate from business payment)
```

**Key Point:** Donation is a separate transaction from the purchase. Business facilitates but doesn't touch the funds.

### Corporate Matching

Company matches employee donations:

```
Employee Donation: $50 → Org
Company Match:     $50 → Org (separate transaction)
Total to Org:      $100
```

Both transactions tracked independently on ledger.

### Fundraiser Campaigns

Fundraiser collects from multiple donors:

```
Donor 1: $25  ─┐
Donor 2: $50  ─┼──▶ Campaign ──▶ Organization
Donor 3: $100 ─┘
```

Each donation is a separate transaction to the org.

## Payment Methods

### Cards

- Visa, Mastercard, American Express
- Global acceptance
- Standard Stripe fees

### Bank Transfers

**US (ACH):**
- Lower fees
- Longer processing (3-5 days)
- Higher limits

**Europe (SEPA):**
- Low/no fees for EUR
- 1-2 day settlement
- EUR only

### Digital Wallets

- Apple Pay
- Google Pay
- Link (Stripe)

### Recurring Payments

Subscription handling:
- Card-on-file storage
- Automatic retry logic
- Failed payment handling
- Cancellation processing

## Payout Process

### Organization Payouts

Funds reach organizations:

**Schedule Options:**
- Daily: Next business day
- Weekly: Every Monday
- Monthly: First of month

**Process:**
1. Donation processed
2. Funds settle in Stripe (2-3 days for cards)
3. Payout initiated per schedule
4. Bank transfer (1-2 days)

### Payout Visibility

Organizations see:
- Pending funds
- Upcoming payouts
- Payout history
- Per-donation detail

All visible on Amply dashboard and ledger.

## Error Handling

### Payment Failures

**Card Declined:**
- Donor notified
- Retry option provided
- No ledger entry created
- Organization not affected

**Insufficient Funds:**
- For bank transfers
- Retry after delay
- Donor communication

### Dispute/Chargeback

**Process:**
1. Dispute received
2. Organization notified
3. Evidence collected
4. Stripe handles resolution

**Impact:**
- Funds held during dispute
- Ledger shows pending status
- Resolution recorded

### Refunds

**When Applicable:**
- Donor error
- Duplicate charge
- Fraud investigation

**Process:**
- Initiated by org or Amply
- Funds returned to donor
- Ledger shows refund entry
- Chain integrity maintained

## Compliance

### PCI DSS

Amply never handles raw card data:
- Stripe.js for card capture
- Tokenized payment methods
- PCI SAQ-A eligible

### KYC/AML

Organizations verified:
- Identity verification
- Bank account verification
- Sanctions screening
- Ongoing monitoring

### Tax Documentation

- 1099 reporting (US, where applicable)
- VAT handling (EU)
- Cross-border considerations

## Webhooks

### Stripe Events

Amply receives Stripe webhooks:
- `payment_intent.succeeded`
- `payout.paid`
- `charge.dispute.created`
- `account.updated`

### Event Processing

```
Stripe Event ──▶ Amply Webhook Handler ──▶ Ledger Update
                        │
                        ▼
                  Notifications
                  (donor, org)
```

### Reliability

- Idempotent processing
- Retry handling
- Event logging
- Reconciliation checks

---

**Related:**
- [Architecture Overview](./overview.md)
- [Ledger Architecture](./ledger.md)
- [Pricing and Fees](../transparency/pricing.md)
