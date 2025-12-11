---
sidebar_position: 1
---

# Verification CLI
*Independent Ledger Verification*

`amply-verify` is an open-source CLI for independently verifying Amply's ledger integrity.

## Purpose

Proves the core thesis: anyone can verify the cryptographic integrity of the ledger.

The CLI allows:
- Download ledger data from any organisation
- Verify hash chain integrity locally
- Compare against published checkpoints
- Confirm no post-recording tampering occurred

**What this proves:** Internal consistency—the data hasn't been modified after it was recorded.

**What provides external proof:** The banking system's multi-party record keeping. Each donation creates records at multiple independent institutions (donor's bank, card network, Stripe, organisation's bank). Amply controls only its own ledger. Donors verify against their bank statements—records Amply cannot fabricate or alter.

→ [The Trust Model](../../transparency/verification.md#the-trust-model)

## Installation

```bash
# From PyPI
pip install amply-verify

# From source
git clone https://github.com/amply/amply-verify.git
cd amply-verify
pip install -e .
```

## Quick Start

```bash
# Download an organisation's ledger
amply-verify download --org org_xyz789 --output ledger.json

# Verify the hash chain
amply-verify chain ledger.json

# Compare against published checkpoint
amply-verify checkpoint ledger.json
```

## Project Structure

```
amply-verify/
├── src/amply_verify/
│   ├── __init__.py
│   ├── cli.py              # Click CLI
│   ├── crypto.py           # Hash functions (identical to backend)
│   ├── download.py         # Fetch ledger from API
│   └── verify.py           # Chain verification logic
├── tests/
│   ├── test_crypto.py
│   ├── test_verify.py
│   └── fixtures/
│       ├── valid_ledger.json
│       └── tampered_ledger.json
├── pyproject.toml
└── README.md
```

## Commands

### Download Ledger

```bash
amply-verify download --org org_xyz789 --output ledger.json
```

**Output format**:
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
      "metadata": {},
      "prev_entry_hash": null,
      "entry_hash": "sha256:..."
    }
  ]
}
```

### Verify Chain

```bash
amply-verify chain ledger.json
```

**Success output**:
```
Verifying hash chain...
  Entries checked: 1234
  First entry: led_000001 (2025-01-01T00:00:00Z)
  Last entry:  led_001234 (2025-01-15T11:30:00Z)

✓ Hash chain is valid
  All 1234 entries verified
  No tampering detected
```

**Failure output** (if tampering detected):
```
Verifying hash chain...
  Entries checked: 456

✗ Hash chain BROKEN at entry led_000457
  Expected prev_entry_hash: sha256:abc123...
  Found prev_entry_hash:    sha256:def456...

  This indicates tampering or data corruption.
```

### Verify Against Checkpoint

```bash
amply-verify checkpoint ledger.json --checkpoint chk_2025-01-15
```

**Output**:
```
Fetching checkpoint chk_2025-01-15...
  Source: https://amply-public-data.s3.amazonaws.com/checkpoints/chk_2025-01-15.json

Comparing ledger to checkpoint...
  Checkpoint cumulative hash: sha256:abc123...
  Computed cumulative hash:   sha256:abc123...

✓ Ledger matches checkpoint
  Entry count: 1234 ✓
  Cumulative hash: match ✓
```

## Core Implementation

### Hash Computation

The same algorithm as the backend (must be identical for verification to work):

```python
# crypto.py
import hashlib
import json
from datetime import datetime

def canonical_json(obj: dict) -> str:
    """Produce canonical JSON string for hashing."""
    return json.dumps(obj, sort_keys=True, separators=(',', ':'), ensure_ascii=False)

def compute_entry_hash(
    entry_id: str,
    timestamp: datetime,
    organisation_id: str,
    entry_type: str,
    amount: int,
    currency: str,
    metadata: dict,
    prev_entry_hash: str | None,
) -> str:
    """Compute SHA-256 hash for a ledger entry."""
    timestamp_str = timestamp.strftime('%Y-%m-%dT%H:%M:%SZ')

    parts = [
        entry_id,
        timestamp_str,
        organisation_id,
        entry_type,
        str(amount),
        currency.upper(),
        canonical_json(metadata),
        prev_entry_hash if prev_entry_hash else 'null',
    ]

    input_string = '|'.join(parts)
    hash_hex = hashlib.sha256(input_string.encode('utf-8')).hexdigest()

    return f'sha256:{hash_hex}'
```

### Chain Verification

```python
# verify.py
def verify_chain(entries: list[dict]) -> VerificationResult:
    """Verify hash chain integrity."""
    for i, entry in enumerate(entries):
        # Recompute entry hash
        expected_hash = compute_entry_hash(
            entry_id=entry['id'],
            timestamp=parse_timestamp(entry['timestamp']),
            organisation_id=entry['organisation_id'],
            entry_type=entry['type'],
            amount=entry['amount'],
            currency=entry['currency'],
            metadata=entry['metadata'],
            prev_entry_hash=entry['prev_entry_hash'],
        )

        # Verify hash matches
        if entry['entry_hash'] != expected_hash:
            return VerificationResult(
                valid=False,
                broken_at=entry['id'],
                error='hash_mismatch',
            )

        # Verify link to previous entry
        if i > 0:
            prev_entry = entries[i - 1]
            if entry['prev_entry_hash'] != prev_entry['entry_hash']:
                return VerificationResult(
                    valid=False,
                    broken_at=entry['id'],
                    error='chain_link_broken',
                )

    return VerificationResult(valid=True, entry_count=len(entries))
```

## Programmatic Usage

```python
from amply_verify import download_ledger, verify_chain, verify_checkpoint

# Download and verify
ledger = download_ledger('org_xyz789')
result = verify_chain(ledger['entries'])

if result.valid:
    print(f"Chain valid: {result.entry_count} entries")
else:
    print(f"Chain broken at: {result.broken_at}")

# Verify against checkpoint
checkpoint_result = verify_checkpoint(ledger, 'chk_2025-01-15')
print(f"Checkpoint match: {checkpoint_result.valid}")
```

## Testing

```bash
# Run tests
pytest

# Test with fixtures
pytest tests/test_verify.py -v
```

### Test Fixtures

```python
# tests/test_verify.py
def test_valid_chain(valid_ledger_fixture):
    """Valid chain should pass verification."""
    result = verify_chain(valid_ledger_fixture['entries'])
    assert result.valid is True

def test_detect_tampered_amount(tampered_ledger_fixture):
    """Tampered amounts should be detected."""
    result = verify_chain(tampered_ledger_fixture['entries'])
    assert result.valid is False
    assert result.error == 'hash_mismatch'

def test_detect_broken_link(broken_chain_fixture):
    """Missing or wrong prev_entry_hash should be detected."""
    result = verify_chain(broken_chain_fixture['entries'])
    assert result.valid is False
    assert result.error == 'chain_link_broken'
```

## Thesis Proven

When a user can:
1. Give €50 to an organisation
2. See the transaction on the public ledger
3. Download the ledger export
4. Run `amply-verify chain ledger.json`
5. See "✓ Hash chain is valid"
6. Verify the Stripe payment ID matches their bank statement

Then transparency is proven through both cryptographic consistency *and* multi-party banking records.

**What the hash chain proves:** The data hasn't been altered after recording.

**What the banking system proves:** The original recording was accurate. Amply can't fabricate donations without creating fake records at your bank, the card network, Stripe, and the organisation's bank—all institutions Amply doesn't control.

---

**Related:**
- [Backend Services](../amply-backend/services.md)
- [API Reference](../amply-backend/api.md)
