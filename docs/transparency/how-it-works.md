---
sidebar_position: 2
---

# How Transparency Works
*Ledgers, Hashes, and Public Data*

This document explains the technical foundation that makes Amply's transparency possible. For the principles behind these choices, see [Why Transparency Matters](./philosophy.md).

## The Ledger

At the core of Amply is a tamper-evident ledger—a permanent, append-only record of every financial transaction on the platform.

### What Gets Recorded

Every transaction creates a ledger entry:
- Donations (amount, donor, recipient organization, timestamp)
- Fee deductions ([about prices and fees](./pricing.md))
- Fund allocations (which money pot received the funds)
- Disbursements (transfers to organizations)
- Amply's own income and expenses (Amply sustains itself through donations, tracked the same way)

### Append-Only Design

Entries can only be added, never modified or deleted. If a correction is needed, a new entry is created that references and adjusts the original. The history remains intact.

This means:
- No silent edits to past transactions
- Complete audit trail from day one
- Any change is itself recorded and visible

### Hash Chain Integrity

Each ledger entry includes a cryptographic hash of the previous entry. This creates a chain where altering any historical entry *after recording* would break the chain and be detectable.

```
Entry N:
  - Transaction data
  - Hash of Entry N-1
  - Hash of this entry (computed from data + previous hash)
```

Modifying Entry 5 would change its hash, which would invalidate Entry 6's reference, and so on. The entire chain after the modified entry would become invalid.

**What this proves:** The hash chain guarantees *internal consistency*—that the data hasn't been silently altered after it was recorded. It does not, by itself, prove that the original recording was accurate.

**What provides external proof:** Every donation entry includes a Stripe payment reference. But Stripe isn't the ultimate anchor—the banking system is.

When you donate, your transaction creates records at multiple independent institutions:
- Your bank (the charge on your statement)
- Your card network (Visa, Mastercard, etc.)
- Stripe (the payment processor)
- The organisation's bank (the incoming payout)

Amply controls only one database. The banking system creates distributed, multi-party records that Amply cannot fabricate or alter. Your bank statement is the ultimate proof—if Amply recorded a donation you didn't make, you'd have independent evidence.

→ [The Trust Model](./verification.md#the-trust-model)

## Public Data

### What's Public

- All transaction data (with privacy controls for donor identity)
- Organization financials and fund balances
- Fee structures and deductions
- Amply's own financial data
- Aggregate statistics and reports

### What's Protected

- Donor identity (unless donor chooses to be public)
- Sensitive organizational data (HR, legal, security)
- Personal information subject to privacy regulations

**Important**: Protected data is still on the ledger—it's just not publicly visible in full detail. Sensitive transactions appear in aggregated form or become public after a delay.

→ [Full details on transparency and privacy](./privacy.md)

### Visibility Levels

Each transaction has a visibility level that determines what the public sees:

| Level | Public View |
|-------|-------------|
| **Full** | Complete details visible |
| **Aggregated** | Included in category totals only |
| **Delayed** | Full details after time delay (12-24 months) |
| **Internal** | Visible to board/auditors only |

Even `internal` transactions are cryptographically included in the hash chain and checkpoints—they're not hidden from the math, just from public view.

### Access Methods

**Web Interface**: Browse transactions, organizations, and reports through the Amply website.

**API**: Programmatic access to public data for researchers, journalists, and developers.

**Data Exports**: Periodic public dumps of the complete ledger for independent verification.

## Verification

Transparency means nothing if you can't verify it. Amply provides multiple verification methods:

### Checkpoint Publishing

Amply periodically publishes cryptographic checkpoints—hashes of the complete ledger state at a point in time. These are published to:
- Amply's public website
- Cloud storage (S3)

**Honest limitation:** Amply currently controls both the ledger and the checkpoint storage. This means checkpoints help you verify that data hasn't changed *since the checkpoint was published*, but they don't provide independent attestation of accuracy. The true independent anchor is Stripe's payment records, which exist outside Amply's control.

### Independent Verification

Anyone can:
1. Download a ledger export
2. Recompute the hash chain from scratch
3. Compare their computed checkpoint against published checkpoints
4. Verify Stripe payment IDs against the amounts recorded

This proves internal consistency and, via Stripe references, connects to an external source of truth.

We provide open-source verification tools to make this process straightforward.

→ [Full verification guide](./verification.md)

### Third-Party Audits

In addition to public verification, Amply undergoes periodic third-party audits. Audit reports are published publicly.

## Real-Time vs. Batch

### Real-Time
- Transaction recording (immediate)
- Balance updates (immediate)
- Public API access (immediate)

### Batch (Periodic)
- Checkpoint publishing (daily)
- Full ledger exports (weekly)
- Aggregate reports (monthly)

## Technical Architecture

For developers and technical readers, detailed architecture documentation is available:

- [Architecture Overview](../architecture/overview.md)
- [Ledger Design](../architecture/ledger.md)
- [Data Model](../architecture/data-model.md)

---

**Next**: [Verifying Amply's Data](./verification.md) — step-by-step guide to independent verification.
