---
sidebar_position: 4
---

# POS & Terminals
*Donation Collection at Physical Locations*

Enable charitable giving at your physical point of sale, on counter displays, or through standalone kiosks.

## POS Integrations

### Supported Systems

**Square**
- Native integration
- Checkout prompt
- Receipt line item
- Dashboard sync

**Toast**
- Restaurant focus
- Order-level donations
- Server prompts
- Reporting integration

**Clover**
- App installation
- Checkout modification
- Multiple locations
- Manager dashboard

**Lightspeed**
- Retail and restaurant
- Custom buttons
- Transaction linking
- Multi-store support

### How POS Integration Works

**During Checkout:**
1. Transaction reaches payment stage
2. Donation prompt appears (staff or customer screen)
3. Customer chooses to donate (or declines)
4. Donation added as line item
5. Combined payment processed
6. Donation routed to Amply automatically

**Money Flow:**
- Customer pays store (including donation)
- Store receives regular settlement
- Donation portion transferred to Amply
- Amply distributes to organization
- Fully tracked and transparent

### Setup Process

**Step 1: Install Integration**
- Find Amply in your POS app store
- Or contact Amply for direct integration

**Step 2: Connect Accounts**
- Link your Amply business account
- Authorize transaction access
- Configure organization selection

**Step 3: Configure Settings**
- Donation amounts or roundup
- Prompt timing
- Staff training mode
- Reporting preferences

**Step 4: Train Staff**
- How to present the ask
- Handling responses
- Answering questions
- Not pressuring customers

**Step 5: Go Live**
- Enable across locations
- Monitor initial transactions
- Gather feedback
- Optimize approach

## Counter Terminals

### Standalone Donation Kiosks

For locations without checkout integration:

**Hardware Options:**
- Tablet-based (iPad, Android)
- Purpose-built terminals
- Self-service kiosks
- Counter displays

**Features:**
- Customer-initiated
- Multiple payment options
- Real-time organization display
- Impact messaging

### QR Code Donations

Simple, hardware-light option:

**Setup:**
- Generate QR code from Amply
- Print and display
- Customer scans with phone
- Mobile-optimized checkout

**Use Cases:**
- Table tents
- Posters
- Counter stands
- Event signage

### Customer-Facing Displays

Screens customers interact with:

**Features:**
- Touch interface
- Amount selection
- Organization info
- Receipt option

**Placement:**
- Counter height
- Near checkout
- High-traffic areas
- Waiting areas

## Cashier API

### For Custom POS Systems

If your POS isn't listed, use the Cashier API:

**Endpoints:**
- `POST /donations/initiate` - Start donation
- `POST /donations/complete` - Finalize with payment
- `GET /donations/status` - Check transaction
- `GET /organizations/active` - Get enabled orgs

**Flow:**
1. Cashier initiates donation request
2. API returns amount options
3. Customer selects
4. Payment processed locally
5. Completion sent to Amply
6. Confirmation returned

### Integration Example

```javascript
// Initiate donation at checkout
const donation = await amply.donations.initiate({
  organizationId: 'org_123',
  locationId: 'loc_456',
  terminalId: 'term_789'
});

// Present options to customer
const selectedAmount = await presentToCustomer(donation.amountOptions);

// Complete after payment
await amply.donations.complete({
  donationId: donation.id,
  amount: selectedAmount,
  paymentReference: localPaymentId
});
```

### Offline Support

For unreliable connections:

**Queuing:**
- Donations saved locally
- Sync when connected
- Retry logic built in
- No lost transactions

**Confirmation:**
- Immediate local receipt
- Sync confirmation later
- Dashboard updates on sync

## Multi-Location Management

### Centralized Control

Manage all locations from one dashboard:

- Enable/disable by location
- Set location-specific causes
- Monitor performance
- Aggregate reporting

### Location-Level Settings

Configure per location:

- Organizations supported
- Donation amounts
- Prompt timing
- Staff permissions

### Reporting

**Location Comparison:**
- Donations per location
- Conversion rates
- Staff performance
- Time patterns

**Aggregate View:**
- Company-wide totals
- Trend analysis
- Goal tracking
- Impact summary

## Staff Training

### Best Practices

**The Ask:**
- Brief and natural
- Not pushy
- Provide context if asked
- Accept any response

**Example Scripts:**

*Simple:*
"Would you like to add a $1 donation for [cause] today?"

*With context:*
"We're supporting [organization] this month. Would you like to round up for them?"

*Soft ask:*
"There's an option to add a donation if you'd like."

### What to Know

Staff should understand:
- Where the money goes
- That it's optional
- Basic org info
- How to answer questions
- That Amply is transparent

### What to Avoid

- Pressuring customers
- Making them feel guilty
- Asking multiple times
- Judging responses
- Adding without consent

## Compliance

### Customer Disclosure

Customers should know:
- Donation is optional
- Recipient organization
- Donation is separate from purchase
- They can verify via Amply

### Receipt Requirements

Donations should appear on receipts:
- Separate line item
- Organization name
- Amount
- Optional: Amply reference

### Record Keeping

Maintain records of:
- All donation transactions
- Daily/weekly totals
- Payout receipts
- Staff training

→ [Compliance](../for-businesses/compliance.md)

## Troubleshooting

### Common Issues

**Donation Not Processing:**
1. Check network connection
2. Verify Amply account status
3. Test API connectivity
4. Review error logs

**Wrong Organization Showing:**
1. Check location settings
2. Verify organization selection
3. Refresh configuration
4. Clear local cache

**Sync Delays:**
1. Check offline queue
2. Verify network stability
3. Force manual sync
4. Contact support if persistent

### Support

- POS-specific documentation
- Integration guides
- Developer support
- Enterprise assistance

Email: developers@amply-impact.org

---

**Related:**
- [Integrations Overview](./overview.md)
- [Business Solutions](../for-businesses/solutions.md)
- [API Documentation](../api/overview.md)
