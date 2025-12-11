---
sidebar_position: 3
---

# Verifying Amply's Data
*How Anyone Can Check the Math*

Amply's transparency is only meaningful if you can verify it yourself. This guide explains how anyone—donors, researchers, journalists, or curious observers—can independently verify that Amply's data is accurate and untampered.

## Why Verify?

You shouldn't have to trust us. That's the point.

Amply publishes all the data and tools needed for independent verification. If we ever manipulated data, altered transactions, or misrepresented finances, anyone could detect it.

**Note on sensitive data**: Some transactions have restricted visibility (HR, legal, security-related). But these transactions are still included in the cryptographic hash chain. They're counted in the math even when details aren't public. Authorized auditors can verify the complete ledger including sensitive items.

→ [How we handle transparency and privacy](./privacy.md)

## The Trust Model

Amply's verification isn't just cryptographic—it's anchored to the banking system's multi-party record keeping.

### Why Multi-Party Records Matter

A single database can be manipulated by whoever controls it. The banking system solves this through distributed record keeping—every transaction creates independent records at multiple institutions that don't share a database.

When you donate €50 through Amply, records are created at:

| Institution | Their Record | Amply's Control |
|-------------|--------------|-----------------|
| **Your bank** | "€50 charged to card" | None |
| **Card network** (Visa/Mastercard) | Transaction routed | None |
| **Stripe** | "Payment pi_abc123 = €50" | None |
| **Organisation's bank** | "€50 received from Stripe" | None |
| **Amply's ledger** | "€50 donation, pi_abc123" | Full |

Amply controls exactly one of these records. The others exist in systems Amply cannot access, modify, or fabricate.

### The Verification Triangle

```
        Your Bank Records                  Amply's Ledger
              │                                 │
              ▼                                 ▼
     "€50 charged to card"            "€50 received, pi_abc123"
              │                                 │
              └────────┬────────────────────────┘
                       │
                       ▼
                Banking System
        (Card Network → Stripe → Org Bank)
              Independent records
```

Every donation in Amply's ledger includes a Stripe payment reference. This creates multiple independent verification points:

| Party | What They Can Verify |
|-------|---------------------|
| **Donor** | Bank statement matches ledger entry |
| **Organisation** | Stripe payouts match ledger records |
| **Auditor** | All Stripe IDs exist and match amounts |

### What This Proves

| Claim | Verifiable? | How |
|-------|-------------|-----|
| "This donation happened" | ✓ Yes | Stripe payment ID verifiable |
| "Amount is correct" | ✓ Yes | Cross-check with bank/Stripe |
| "No post-recording tampering" | ✓ Yes | Hash chain integrity |
| "All donations recorded" | ✓ Partially | Donors can report missing entries |
| "No invented donations" | ✓ Yes | Fake Stripe IDs would fail verification |

### Why Amply Cannot Fabricate Transactions

Amply controls the ledger, but **the banking system controls the payment records**. To fabricate a donation, Amply would need to:

1. Create a fake charge on someone's bank statement (impossible)
2. Create a fake Stripe payment intent (impossible—requires actual card charge)
3. Create fake records at the card network (impossible)
4. Or use an invalid Stripe ID (detectable by any auditor with Stripe access)

The banking system's integrity doesn't come from any single technology—it comes from **multiple independent institutions keeping their own records**. Visa, your bank, Stripe, and the recipient's bank don't share a database. They reconcile with each other, but none can unilaterally alter the others' records.

This means: **Donors are the distributed verification network.** Each donor can verify their own transaction against their bank records. If there's a discrepancy, they have independent proof that exists entirely outside Amply's control.

## Verification Methods

### Quick Check: Transaction Lookup

The simplest verification: look up a specific transaction.

1. Go to Amply's public transaction explorer
2. Enter a transaction ID, donation reference, or organization name
3. View the full transaction details, including timestamps and hash references

This confirms a transaction exists and shows its place in the ledger chain.

### Standard Check: Checkpoint Comparison

Verify that the current ledger matches published checkpoints.

1. Note the latest published checkpoint hash (available on Amply's transparency page)
2. Use Amply's verification tool or API to compute the current ledger hash
3. Compare the two values

If they match, the ledger hasn't been tampered with since the checkpoint was published.

### Full Audit: Independent Recomputation

For complete verification, recompute the entire hash chain yourself.

**What you'll need:**
- A ledger export (available for download)
- Amply's open-source verification tool (or your own implementation)
- Computing resources (scales with ledger size)

**Process:**

1. **Download the ledger export**
   ```
   Download from: https://amply-impact.org/data/exports/
   Format: JSON or CSV
   Includes: All transactions, hashes, timestamps
   ```

2. **Run the verification tool**
   ```bash
   amply-verify --input ledger-export.json --checkpoint latest
   ```

3. **Review the output**
   - ✓ Chain integrity: All hashes link correctly
   - ✓ Checkpoint match: Computed hash matches published checkpoint
   - ✓ No gaps: Sequential entries with no missing IDs

4. **Compare against published checkpoints**
   - Historical checkpoints are published and archived
   - Match your computed hashes against each checkpoint date

### Continuous Monitoring

For organizations or researchers who want ongoing verification:

- **API webhooks**: Get notified of new transactions in real-time
- **Scheduled verification**: Run daily/weekly checks automatically
- **Alert on discrepancy**: Immediate notification if any check fails

## What to Look For

When verifying, these are the key integrity indicators:

| Check | What It Confirms |
|-------|------------------|
| Hash chain continuity | No entries have been modified after creation |
| Checkpoint match | Current state matches independently published record |
| Entry completeness | No gaps or missing transaction IDs |
| Balance consistency | Sum of entries equals reported balances |
| Timestamp ordering | Entries are chronologically sequential |
| Fee transparency | Only third-party fees deducted ([Amply takes no platform fees](./pricing.md)) |

## If You Find a Discrepancy

We don't expect you to find one—but if you do:

1. **Document it**: Record the specific entries, hashes, and expected vs. actual values
2. **Report it**: Contact Amply's integrity team at integrity@amply-impact.org
3. **Publish it**: You're free to publish your findings publicly

We take integrity seriously. Any verified discrepancy will be investigated, explained, and addressed publicly.

## Open Source Tools

All verification tools are open source:

- **amply-verify**: Command-line verification tool
- **amply-audit**: Full audit suite with reporting
- **API client libraries**: Python, JavaScript, Go

Repository: `github.com/amply/verification-tools`

## For Developers

Technical documentation for building your own verification:

- [Ledger Architecture](../architecture/ledger.md)
- [API Reference](../api/overview.md)
- Hash algorithm specification: SHA-256
- Entry serialization format: Canonical JSON

---

**Questions?** See [About Amply](../about-amply/overview.md) or contact us directly.
