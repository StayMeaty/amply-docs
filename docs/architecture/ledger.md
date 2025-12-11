---
sidebar_position: 2
---

# Ledger Architecture
*Tamper-Evident Financial Records*

The ledger is the foundation of Amply's transparency. Every transaction is recorded in a way that makes post-recording modification detectable. For donations, each entry also links to an independent Stripe payment record, providing external verification.

→ [The Trust Model](../transparency/verification.md#the-trust-model)

## Design Principles

### Immutability

Once recorded, entries cannot be modified:
- Append-only structure
- No updates or deletes
- Corrections via new entries
- Full history preserved

### Integrity

Tampering is mathematically detectable:
- Cryptographic hashing
- Chained entries
- Public checkpoints
- Independent verification

### Transparency

Public visibility with privacy controls:
- Default public
- Aggregation options
- Visibility levels
- Role-based access

## Ledger Structure

### Entry Format

Each ledger entry contains:

```
{
  "entry_id": "led_abc123",
  "timestamp": "2025-01-15T14:30:00Z",
  "organization_id": "org_xyz789",
  "type": "donation_received",
  "amount": 10000,          // cents
  "currency": "EUR",
  "metadata": {
    "donation_id": "don_456",
    "stripe_payment_intent_id": "pi_abc123...",  // Third-party anchor
    "donor_name": "Jane Donor"
  },
  "prev_entry_hash": "sha256:a1b2c3...",
  "entry_hash": "sha256:d4e5f6..."
}
```

**Note:** The `stripe_payment_intent_id` enables verification against Stripe's independent records.

### Hash Chain

Each entry links to the previous:

```
Entry 1          Entry 2          Entry 3
┌─────────┐      ┌─────────┐      ┌─────────┐
│ Data    │      │ Data    │      │ Data    │
│ prev: ─ │      │ prev: ──┼──────│ prev: ──┼─────►
│ hash: A │◄─────│ hash: B │◄─────│ hash: C │
└─────────┘      └─────────┘      └─────────┘
```

**Integrity Guarantee:**
If any entry is modified *after recording*, its hash changes, breaking the chain from that point forward. This makes post-recording tampering immediately detectable.

### Hash Calculation

Entry hash includes:
- All entry data fields
- Previous entry hash
- Timestamp
- Entry type and amount

```
entry_hash = SHA256(
  entry_id +
  timestamp +
  organization_id +
  type +
  amount +
  currency +
  sorted(metadata) +
  prev_entry_hash
)
```

**What this proves:** Internal consistency—the data hasn't changed since recording.

**What provides external proof:** The `stripe_payment_intent_id` in metadata links to independent Stripe records, enabling verification that the original recording was accurate.

### Hash Algorithm Versioning

Current algorithm: SHA-256

If algorithm replacement becomes necessary (e.g., SHA-256 weaknesses discovered):

1. **New entries** use new algorithm with version prefix (e.g., `sha512:...`)
2. **Old entries** remain unchanged (their hashes are historical facts)
3. **Verification tools** support multiple algorithms via prefix detection
4. **Checkpoints** document algorithm version for their calculation

The version prefix (`sha256:`, `sha512:`) in hash strings enables this transition without breaking backward compatibility.

### Timestamp Trust

**Trust assumption:** Amply's server provides entry timestamps.

**Implications:**
- Amply could theoretically backdate entries
- However, Stripe payment timestamps provide independent verification
- Donation entries include `stripe_payment_intent_id` with Stripe's timestamp
- Significant timestamp discrepancies would be detectable during audits

**Mitigation:** Checkpoints are published daily, creating a sequence of anchors that limits the window for manipulation.

## Visibility Levels

### Full Public (`public_full`)

Everything visible:
- Entry details
- Amounts
- Related entities
- Metadata

**Used for:**
- Standard donations
- Organization income
- Non-sensitive expenses

### Public Aggregated (`public_aggregated`)

Amount included in totals, details hidden:
- Entry exists on chain
- Amount in category totals
- Specific details not public
- Verifiable in aggregate

**Used for:**
- HR expenses (salaries)
- Individual contractor payments
- Competitive information

### Delayed Public (`delayed_public`)

Full visibility after time delay:
- Hidden for specified period
- Becomes fully public automatically
- Useful for strategic timing
- Audit trail maintained

**Used for:**
- Sensitive negotiations
- Security-related expenses
- Legal matters in progress

### Internal Only (`internal_only`)

Visible to authorized roles only:
- On the ledger (included in hash chain)
- Not publicly visible
- Auditor access possible
- Board-level visibility

**Used for:**
- Highly sensitive matters
- Active legal issues
- Security operations

→ [Transparency & Privacy](../transparency/privacy.md)

## Checkpoints

### Public Checkpoints

Periodic integrity anchors:

```
{
  "checkpoint_id": "chk_2025_01",
  "timestamp": "2025-01-31T23:59:59Z",
  "cumulative_hash": "sha256:xyz...",
  "entry_count": 158472,
  "total_volume": 2847293400,
  "organization_summaries": [...],
  "signature": "..."
}
```

### Checkpoint Publication

- Published to Amply's website and cloud storage (S3)
- Signed by Amply
- Independently verifiable
- Historical record maintained

**Honest limitation:** Amply controls the checkpoint storage. The true independent anchor is Stripe's payment records, which exist outside Amply's control.

### Verification Against Checkpoints

Anyone can:
1. Download ledger data
2. Recalculate hashes
3. Compare to published checkpoint
4. Confirm integrity

## Multi-Tenant Isolation

### Per-Organization Ledgers

Each organization has its own ledger:
- Isolated entry sequences
- Separate hash chains
- Independent verification
- Consolidated at platform level

### Global Ledger

Cross-organization entries:
- Inter-org transfers
- Platform-level events
- Aggregate statistics

### Cross-Ledger Verification

Transfers link ledgers:
```
Org A Ledger: "Transfer out to Org B, ref: txf_123"
Org B Ledger: "Transfer in from Org A, ref: txf_123"
```
Both entries linked, independently verifiable.

## Performance Considerations

### Write Path

Optimized for reliability:
- Synchronous hash calculation
- Write-ahead logging
- Immediate durability
- Async checkpoint updates

### Read Path

Optimized for speed:
- Materialized views for totals
- Cached aggregations
- Efficient range queries
- Pagination for large sets

### Scaling

Handles growth:
- Partitioned by organization
- Time-based sharding for archives
- Read replicas for queries
- Checkpoint parallelization

## Verification Tools

### Open Source Verifier

Available tools:
- Ledger download utility
- Hash chain verifier
- Checkpoint comparator
- Audit report generator

### Verification Process

```bash
# Download ledger data
amply-verify download --org org_xyz789 --output ledger.json

# Verify hash chain
amply-verify chain ledger.json

# Check against checkpoint
amply-verify checkpoint ledger.json --checkpoint chk_2025_01

# Generate audit report
amply-verify report ledger.json --output audit.pdf
```

### Third-Party Audits

Amply supports:
- Independent verification
- Auditor access
- Certification processes
- Public audit reports

## Corrections and Adjustments

### No Modifications

Entries are never modified. Corrections work via:

**Reversal Entries:**
```
Original:  donation_received, $100
Reversal:  donation_reversed, -$100
Correct:   donation_received, $150
```

**Adjustment Entries:**
```
Original:      expense, category: "marketing"
Adjustment:    expense_recategorized, old: "marketing", new: "operations"
```

### Correction Visibility

All corrections are:
- Visible in history
- Linked to original
- Explained in metadata
- Part of the chain

## Disaster Recovery

### Backup Strategy

- Continuous replication
- Point-in-time recovery
- Geographic distribution
- Regular restore testing

### Chain Recovery

If chain breaks:
- Detect break point
- Investigate cause
- Publish incident report
- Restore from verified state

### Transparency About Issues

Any integrity issues are:
- Detected automatically
- Investigated immediately
- Publicly disclosed
- Documented in reports

---

**Related:**
- [How Transparency Works](../transparency/how-it-works.md)
- [Verification Guide](../transparency/verification.md)
- [Architecture Overview](./overview.md)
