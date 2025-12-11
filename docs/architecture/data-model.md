---
sidebar_position: 4
---

# Data Model
*How Amply Structures Information*

This document describes Amply's core data model, including organizations, funds, projects, and transactions.

## Core Entities

### Organizations

Organizations are the primary entities receiving donations:

```
Organization
├── id: string (org_xxx)
├── name: string
├── legal_name: string
├── type: enum (nonprofit, charity, foundation, fiscally_sponsored)
├── status: enum (pending, verified, suspended)
├── country: string
├── tax_id: string (encrypted)
├── stripe_account_id: string
├── verification_level: enum (standard, enhanced, comprehensive)
├── created_at: timestamp
├── updated_at: timestamp
│
├── profile
│   ├── description: text
│   ├── mission: text
│   ├── logo_url: string
│   ├── website: string
│   └── sdgs: array[1-17]
│
├── settings
│   ├── payout_schedule: enum
│   ├── default_visibility: enum
│   ├── accepts_fundraisers: boolean
│   └── ...
│
└── relationships
    ├── team_members: [User]
    ├── funds: [Fund]
    └── campaigns: [Campaign]
```

### Funds

Funds are designated pools of money within organizations:

```
Fund
├── id: string (fund_xxx)
├── organization_id: string
├── name: string
├── type: enum (general, project, restricted, emergency)
├── status: enum (active, closed)
├── balance: integer (cents)
├── currency: string
├── created_at: timestamp
│
├── restrictions
│   ├── purpose: text
│   ├── geographic: string[]
│   └── time_bound: date_range
│
└── relationships
    ├── projects: [Project]
    └── transactions: [Transaction]
```

### Projects

Projects are specific initiatives funded by donations:

```
Project
├── id: string (proj_xxx)
├── organization_id: string
├── fund_id: string
├── name: string
├── description: text
├── status: enum (planning, active, completed, cancelled)
├── budget: integer
├── spent: integer
├── sdgs: array[1-17]
├── start_date: date
├── end_date: date
│
├── impact_metrics
│   ├── metric_definitions: [MetricDef]
│   └── measurements: [Measurement]
│
└── relationships
    ├── allocations: [Allocation]
    └── updates: [Update]
```

## Transaction Types

### Incoming Transactions

Money coming into an organization:

```
IncomingTransaction
├── id: string (txn_xxx)
├── organization_id: string
├── type: enum
│   ├── donation
│   ├── grant
│   ├── transfer_in
│   ├── refund_received
│   └── interest
├── amount: integer (cents)
├── currency: string
├── status: enum (pending, completed, failed, refunded)
├── timestamp: timestamp
├── visibility: enum
│
├── source
│   ├── donor_id: string (if applicable)
│   ├── business_id: string (if applicable)
│   ├── campaign_id: string (if applicable)
│   └── external_ref: string
│
├── allocation
│   ├── fund_id: string
│   └── project_id: string (optional)
│
├── chain
│   ├── prev_hash: string
│   └── entry_hash: string
│
└── metadata
    ├── payment_method: string
    ├── stripe_payment_id: string
    └── ...
```

### Outgoing Transactions

Money spent by an organization:

```
OutgoingTransaction
├── id: string (txn_xxx)
├── organization_id: string
├── type: enum
│   ├── expense
│   ├── grant_out
│   ├── transfer_out
│   ├── refund_issued
│   └── fee
├── amount: integer (cents)
├── currency: string
├── status: enum
├── timestamp: timestamp
├── visibility: enum
│
├── categorization
│   ├── category: enum (operations, programs, fundraising, admin, ...)
│   ├── subcategory: string
│   └── sdgs: array[1-17]
│
├── source_fund
│   ├── fund_id: string
│   └── project_id: string (optional)
│
├── recipient
│   ├── type: enum (vendor, individual, organization, internal)
│   ├── name: string (may be aggregated)
│   └── external_id: string (if applicable)
│
├── chain
│   ├── prev_hash: string
│   └── entry_hash: string
│
└── metadata
    ├── description: string
    ├── invoice_ref: string
    └── ...
```

## User Entities

### Users

Individuals with accounts on Amply:

```
User
├── id: string (usr_xxx)
├── email: string
├── name: string
├── password_hash: string
├── status: enum (active, suspended)
├── created_at: timestamp
├── updated_at: timestamp
│
├── security
│   ├── security_stamp: string         # Random token, rotated on password/security changes
│   ├── password_changed_at: timestamp
│   └── failed_login_attempts: integer
│
├── security_settings
│   ├── ip_binding: enum (none, country, subnet, strict)
│   ├── session_timeout_days: integer  # Default 7
│   ├── require_2fa: boolean
│   └── notify_new_device: boolean     # Default true
│
├── verification
│   ├── email_verified: boolean
│   ├── identity_verified: boolean
│   └── verification_date: timestamp
│
└── relationships
    ├── donor_profile: DonorProfile
    ├── organization_memberships: [OrgMembership]
    ├── business_roles: [BusinessRole]
    └── fundraiser_campaigns: [Campaign]
```

### Donors

Donor-specific profile:

```
DonorProfile
├── user_id: string
├── default_visibility: enum
├── communication_preferences: object
│
├── giving_history
│   ├── total_given: integer
│   ├── donations_count: integer
│   ├── organizations_supported: integer
│   └── recurring_donations: [RecurringDonation]
│
└── saved
    ├── favorite_orgs: [string]
    ├── payment_methods: [PaymentMethod]
    └── giving_goals: [GivingGoal]
```

## Campaign Entities

### Campaigns

Fundraising campaigns:

```
Campaign
├── id: string (camp_xxx)
├── organization_id: string
├── fundraiser_id: string (if personal)
├── name: string
├── description: text
├── type: enum (organizational, personal, team, event)
├── status: enum (draft, active, completed, cancelled)
├── goal: integer
├── raised: integer
├── donor_count: integer
├── start_date: timestamp
├── end_date: timestamp
│
├── settings
│   ├── amounts: [integer]
│   ├── allow_recurring: boolean
│   ├── visibility: enum
│   └── fundraiser_enabled: boolean
│
└── relationships
    ├── donations: [Transaction]
    ├── fundraisers: [FundraiserLink]
    └── updates: [CampaignUpdate]
```

## Business Entities

### Businesses

Companies using Amply:

```
Business
├── id: string (biz_xxx)
├── name: string
├── legal_name: string
├── type: enum (corporation, llc, partnership, sole_prop)
├── status: enum (pending, verified, suspended)
├── country: string
├── tax_id: string (encrypted)
│
├── capabilities
│   ├── corporate_giving: boolean
│   ├── customer_collections: boolean
│   └── employee_giving: boolean
│
├── integrations
│   ├── pos_type: string
│   ├── ecommerce_platform: string
│   └── api_keys: [APIKey]
│
└── relationships
    ├── team_members: [User]
    ├── supported_orgs: [Organization]
    └── donations_made: [Transaction]
    └── donations_collected: [Transaction]
```

## Relational Structure

### Entity Relationships

```
Organization ──┬── Funds ──┬── Projects
               │           └── Transactions
               ├── Campaigns ── Donations
               └── Team Members

Business ──┬── Corporate Donations ──▶ Organizations
           └── Customer Collections ──▶ Organizations

Donor ──┬── Donations ──▶ Organizations
        └── Campaigns (as fundraiser)

Fundraiser ── Campaign ──▶ Organization
                 └── Donations from others
```

### Multi-Tenancy

Data isolation by organization:

```
Query context always includes organization_id
├── All transactions scoped
├── All funds/projects scoped
├── Cross-org only for explicit transfers
└── Global views require elevated access
```

## Ledger Integration

### Transaction → Ledger Entry

Every transaction creates a ledger entry:

```
Transaction created
       │
       ▼
Ledger entry generated
       │
       ▼
Hash calculated (including prev_hash)
       │
       ▼
Entry stored
       │
       ▼
Materialized views updated
```

### Denormalization

For performance, key data is denormalized:

**Aggregates:**
- Fund balances
- Campaign totals
- Organization metrics
- Donor totals

**Audit Trail:**
- All changes logged
- Original values preserved
- Aggregates reconcilable to entries

## Multi-Currency Handling

### Currency Strategy

Amply supports multiple currencies with per-fund isolation:

**Principles:**
- Each fund has a single currency (no mixing within a fund)
- Donations are recorded in the currency received
- No automatic currency conversion
- Amounts always stored in smallest unit (cents/pence)

**Supported Currencies:**
- EUR (Euro) - Primary for EU organizations
- GBP (British Pound)
- USD (US Dollar)
- CHF (Swiss Franc)

### Multi-Currency Organizations

Organizations may have multiple funds in different currencies:

```
Organization (German nonprofit)
├── Fund: "General - EUR" (currency: EUR)
├── Fund: "UK Operations" (currency: GBP)
└── Fund: "US Donors" (currency: USD)
```

Each fund maintains its own ledger chain and balance in its currency.

### Reporting

- Totals shown per-currency (no aggregation across currencies)
- Exchange rate data not stored (not Amply's function)
- Organizations responsible for their own FX conversions
- Ledger remains a record of actual transactions

## Data Lifecycle

### Retention

- Ledger entries: Permanent
- Transaction data: Permanent (legal requirements)
- User data: Retained while active + regulatory period
- Logs: 90 days operational, 7 years audit

### Deletion

GDPR/privacy deletions:
- User PII can be anonymized
- Donations remain (amounts, timestamps)
- Attribution removed
- Ledger integrity maintained

### Archival

Historical data:
- Moved to cold storage after 2 years
- Still accessible for verification
- Checkpoints remain active
- Audit capability preserved

---

**Related:**
- [Architecture Overview](./overview.md)
- [Ledger Architecture](./ledger.md)
- [How Transparency Works](../transparency/how-it-works.md)
