---
sidebar_position: 4
---

# Business Solutions
*Integrations for Every Business Model*

Amply provides ready-to-use solutions for adding charitable giving to your business operations. This document covers available integrations and implementation approaches.

## E-commerce Integrations

### Checkout Donations

Add donation options to online checkout:

**Shopify**
- App installation from Shopify App Store
- Automatic checkout integration
- Dashboard for tracking collections
- Works with Shopify Payments

**WooCommerce**
- WordPress plugin
- Cart and checkout integration
- Configurable donation prompts
- WooCommerce dashboard integration

**Custom Platforms**
- JavaScript SDK for any checkout
- REST API for backend integration
- Webhook notifications
- Flexible UI components

### Post-Purchase

Capture donations after checkout:

- Order confirmation page widget
- Post-purchase email campaigns
- Receipt-embedded donation links
- Subscription order follow-ups

## Point of Sale (POS)

### Integrated POS

Native integration with major systems:

- Square
- Toast
- Clover
- Lightspeed

Features:
- Cashier prompt at checkout
- Customer-facing display option
- End-of-day reporting
- Staff performance tracking

### Counter Screens

Dedicated donation displays:

- Tablet-based donation kiosks
- Customer-facing screens
- QR code displays
- Offline-capable operation

### Cashier API

For custom POS integration:

- Simple REST endpoints
- Real-time transaction confirmation
- Offline queue with sync
- Multi-terminal support

## Social Products

### "Social Beer" Model

Products where profits go to charity:

**How It Works:**
1. Define a product with charitable allocation
2. Set the margin that goes to charity
3. Track sales and automatic donations
4. Report impact to customers

**Examples:**
- Restaurant menu items
- Retail products
- Subscription boxes
- Event tickets

### Percentage-of-Sale

A portion of every sale to charity:

**Configuration:**
- Percentage of revenue
- Percentage of profit
- Fixed amount per transaction
- Tiered by product category

**Tracking:**
- Real-time donation accumulation
- Daily/weekly/monthly disbursement
- Public verification of totals
- Campaign-specific tracking

## Roundup Programs

### Transaction Roundup

Round purchases to the nearest dollar:

**Implementation:**
- Card-linked programs
- POS integration
- App-based roundup
- Bank integration (where available)

**Customer Experience:**
- Opt-in at signup or checkout
- View roundup donations in account
- Choose supported causes
- Pause or stop anytime

### Order Roundup

E-commerce specific:

- Round order total
- Add roundup as line item
- Customer controls at checkout
- Per-order or account-level setting

## Employee Giving

### Payroll Integration

Deduct donations from paychecks:

**Supported Systems:**
- Major payroll providers (ADP, Gusto, Paylocity)
- API for custom integration
- Manual upload for others

**Features:**
- Pre-tax options (where applicable)
- Employee self-service portal
- Employer matching integration
- Annual giving summaries

### Workplace Campaigns

Run giving campaigns for employees:

- Campaign creation tools
- Goal tracking
- Team leaderboards
- Corporate matching activation

## Matching Gift Integration

### Employee Match

Match donations made by employees:

- Employee submits donation for match
- Verification through Amply ledger
- Automatic or approved matching
- Combined tax documentation

### Customer Match

Match customer donations:

- Real-time matching at checkout
- Capped matching ("up to $50,000")
- Progress tracking
- Public matching totals

### Campaign Match

Match donations to specific campaigns:

- Define matching period
- Set matching ratio
- Cap total matching amount
- Automatic disbursement

## API Integration

### REST API

Full programmatic access:

- Create donations
- Query collection totals
- Manage cause selection
- Access reporting data

→ [API documentation](../api/overview.md)

### Webhooks

Real-time notifications:

- Donation received
- Payout processed
- Threshold reached
- Matching triggered

### SDKs

Pre-built libraries:

- JavaScript/TypeScript
- Python
- PHP
- Ruby
- Java

## Implementation Approaches

### Quick Start (10 Minutes)

For standard platforms with existing plugins:
1. Install app/plugin from your platform's marketplace
2. Connect your Amply account
3. Select causes
4. Go live

**That's it.** Most businesses are collecting donations within 10 minutes of starting.

### Standard Integration (Hours to Days)

For custom checkout flows:
1. Integrate JavaScript SDK
2. Configure backend API
3. Test in sandbox
4. Deploy to production

### Enterprise Integration (1-2 Weeks)

For complex requirements:
1. Discovery and planning
2. Custom API integration
3. Multi-system connection
4. Testing and validation
5. Phased rollout

## Support and Resources

### Documentation

- API reference
- Integration guides
- Code examples
- Best practices

### Sandbox Environment

- Test transactions
- Mock payment processing
- Development accounts
- No production impact

### Integration Support

- Technical documentation
- Developer support
- Implementation assistance
- Enterprise partnerships

---

**Related:**
- [Getting Started](./getting-started.md)
- [Customer Collections](./customer-collections.md)
- [Integrations Overview](../integrations/overview.md)
- [API Documentation](../api/overview.md)
