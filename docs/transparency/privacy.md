---
sidebar_position: 5
---

# Transparency & Privacy
*How Amply Handles Sensitive Transactions*

At Amply, we aim for radical financial transparency: every cent in, every cent out, fully accounted for.

But we also live in the real world, where some payments—if exposed in full detail—would harm people, relationships, or legitimate organizational needs.

The challenge is simple to state and hard to solve:

> **How can we expose all money to the light, without exposing all people to it?**

This document explains how Amply approaches that tension.

## The Core Promise: No Hidden Money

First, a clear baseline:

**Every cent that touches Amply must be on the ledger.**

No off-book payments. No "shadow categories."

This means:
- All income (donations, grants, sales, CSR budgets, etc.) is recorded
- All outgoing payments (to organizations, vendors, staff, individuals) are recorded
- Ledger totals reconcile with external systems (Stripe, banks, accounting)

Even when details are sensitive, the money itself never disappears. It always lives inside the verifiable ledger.

## What Actually Is Sensitive?

Some financial flows are not just "private because we're shy"—they're sensitive because revealing them can hurt real people.

### HR-Related Payments
- Salaries and bonuses
- Personal loans and salary advances to employees
- Reimbursements with sensitive context (e.g., therapy, relocation due to abuse)
- Severance and settlement payments
- Payments connected to disciplinary procedures or investigations

### Legal & Dispute Costs
- Lawyer fees for ongoing disputes
- Out-of-court settlements and agreements
- Costs linked to whistleblower or internal investigations

### Security & Safety
- Payments to shelters, safe houses, or protection services
- Support for activists, journalists, or at-risk individuals and communities
- Security infrastructure against threats

### Strategic & Competitive Spending
- Early-stage R&D and prototypes
- Discreet partnership talks, M&A, or market research
- Sensitive campaign or advocacy strategy work

### Sensitive Donors & Beneficiaries
- Donors requesting anonymity
- Direct transfers to individuals (micro-grants, hardship funds)
- Payments tied to health, mental health, disability, or other protected characteristics

### Operational Details
- Rent, utilities, everyday operations
- Vendor contracts where prices could weaken negotiation leverage if fully public

**None of these justify hiding money off the ledger.**

**They do justify protecting identities and context.**

## Hiding Faces, Not Money: Visibility Levels

Amply separates financial accounting from human-level detail using visibility levels for each transaction.

| Level | What It Means |
|-------|---------------|
| **Public (Full)** | Full detail is public: amount, date, category, counterparty |
| **Public (Aggregated)** | Transaction appears only in aggregated form (e.g., "Legal costs: €30,000 this year") |
| **Delayed Public** | Full details become public after a set delay (e.g., 12–24 months) |
| **Internal Only** | Full detail visible only to authorized internal roles (board, auditors), not the general public |

From a public perspective:
- **Fully visible flows**: Donations, project expenses, grants to partner organizations
- **Aggregated but acknowledged flows**: HR, legal, sensitive categories
- **Time-delayed flows**: Certain strategic or legal items that become transparent after risk has passed

**Crucially**: Even `internal_only` transactions remain on the ledger and inside the cryptographic guarantees. They are not invisible to the system—only to the general audience.

## Aggregation Instead of Disappearance

For sensitive categories, Amply favors aggregation over omission.

**Example: "Staff Welfare & Loans"**

*Public sees:*
> "Staff welfare & loans: €12,500 this year (7 internal transactions, details anonymized)"

*Internally, the ledger contains:*
- 7 full transactions
- Each with date, exact amount, staff account ID (pseudonymous)
- Normal double-entry structure

**Result:**
- The category total is exact and publicly visible
- The underlying transactions are fully present in the ledger
- Individuals are not exposed to co-workers, press, or the general public

**We hide the faces, not the money.**

## Cryptographic Proofs: Trust the Math, Not Our Word

To avoid "just trust Amply," we anchor all flows—sensitive and non-sensitive—in a tamper-evident ledger.

### Hash-Chained Ledger Entries

Every ledger entry (including sensitive ones) contains:
- `prev_entry_hash` – the hash of the previous entry
- `entry_hash` – a hash over `prev_entry_hash` plus a canonical representation of the entry content

This creates a hash chain: change any past entry → all following hashes break.

### Public Checkpoints

At regular intervals:
- Amply computes a root hash/checkpoint over the current ledger state
- These checkpoints are published to Amply's website and cloud storage

Anyone can:
1. Download public ledger exports
2. Run an open-source verifier
3. Recompute the hash chain
4. Compare with published checkpoints

If they match, it proves:
- No entries have been silently altered or removed *after recording*
- Sensitive transactions are cryptographically accounted for, even if only aggregated in public view

**For independent proof beyond Amply's systems:** Every donation includes a Stripe payment reference. This connects to records outside Amply's control—donors can verify against their bank statements, and auditors can verify all Stripe IDs exist.

→ [How verification works](./verification.md#the-trust-model)

## Independent Audits

Amply supports and actively encourages independent audits:

- Organizations can authorize external auditors to access their full ledger (including sensitive transactions)
- Auditors compare ledger totals with external systems (Stripe, bank, accounting)
- Auditors verify that the full ledger matches Amply's published checkpoints

Auditors can then publicly state:

> "We have examined 100% of this organization's transactions, including those not fully visible to the public. They match both external statements and Amply's cryptographic commitments."

Public trust rests on **math** (hash chain integrity), **independent payment records** (Stripe), and **third-party auditors**, not on Amply's good intentions alone.

## Guardrails Against Abusing "Sensitive"

We take seriously the risk that organizations might try to hide misuse under "sensitive."

### Transparency Metrics

Amply exposes transparency metrics per organization:

| Visibility Level | Example |
|------------------|---------|
| Full detail (public) | 78% of total spend |
| Aggregated (public) | 15% (HR, legal, security) |
| Internal only | 7% (HR/legal sensitive items) |

On each public profile, you see something like:

> **78%** fully detailed · **15%** aggregated · **7%** internal-only

### Certification Standards

Amply defines transparency standards:
- Certain categories may be internal-only, but must appear at least in aggregated form
- Organizations exceeding thresholds of internal-only spending may lose certification badges
- High internal-only percentages are visible and raise questions

This makes it obvious when an organization relies too heavily on opacity.

## Role-Based Views

Transparency isn't only about "public vs. hidden"—it's also about who inside the organization sees what.

Amply supports different internal views:

| Role | Access Level |
|------|--------------|
| **Board / Auditors** | Full ledger, including all sensitive items |
| **Staff / Members** | Limited internal view (e.g., aggregated HR costs) |
| **Public** | Filtered view: no personal data, no ongoing legal strategy, no safety risks |

This respects privacy and legal obligations without reintroducing off-book money.

## What Amply Honestly Promises

With this design, Amply can make the following statements with integrity:

**Every cent is on the ledger.**
No payment disappears; all inflows and outflows are recorded and balanced.

**The ledger is mathematically tamper-evident.**
Hash chains and public checkpoints ensure that silent edits *after recording* are detectable.

**Donations are anchored to independent records.**
Every donation includes a Stripe payment reference—a source of truth outside Amply's control.

**Sensitive flows are counted, even when anonymized.**
HR, legal, and safety-related expenses appear in category totals and cryptographic proofs.

**Transparency is quantified, not vague.**
Each organization's mix of full/aggregated/internal spending is visible as part of their transparency profile.

**People come before voyeurism.**
We protect staff, beneficiaries, and vulnerable individuals from exposure, without compromising the integrity of the financial record.

---

**In short:**

We don't promise that you can see every private detail of every payment.

**We promise that no money can quietly slip through the cracks.**

---

**Related:**
- [Why Transparency Matters](./philosophy.md)
- [How Transparency Works](./how-it-works.md)
- [Verifying Amply's Data](./verification.md)
- [Trust and Safety](../trust-and-safety/overview.md)
