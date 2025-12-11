---
sidebar_position: 3
---

# Plugins
*One-Click Installation for Major Platforms*

Amply offers plugins for popular e-commerce and website platforms, making integration as simple as installing an app.

## Available Plugins

### Shopify

**Installation:**
1. Find "Amply Donations" in Shopify App Store
2. Click Install
3. Connect your Amply account
4. Configure settings

**Features:**
- Checkout donation prompts
- Cart-level donations
- Product-linked giving
- Automatic order sync
- Dashboard integration

**Donation Options:**
- Add flat amount at checkout
- Roundup to nearest dollar
- Percentage of order
- Customer choice of cause

### WooCommerce

**Installation:**
1. Download from WordPress plugin directory or Amply
2. Upload and activate in WordPress
3. Connect Amply account
4. Configure in WooCommerce settings

**Features:**
- Cart and checkout integration
- Product-specific donations
- Order status sync
- WordPress dashboard widget
- Shortcode support

**Shortcodes:**

```
[amply_donate organization="org_123"]
[amply_progress campaign="camp_456"]
[amply_donors count="10"]
```

### WordPress (Non-WooCommerce)

**Installation:**
1. Download Amply for WordPress
2. Upload and activate
3. Connect account
4. Add widgets or shortcodes

**Features:**
- Gutenberg blocks
- Widget areas
- Shortcode support
- Page builder compatibility

**Gutenberg Blocks:**
- Amply Donation Form
- Amply Donation Button
- Amply Progress Bar
- Amply Campaign

### Squarespace

**Installation:**
1. Add custom code block
2. Paste Amply embed code
3. Configure via Amply dashboard

**Features:**
- Code injection support
- Custom positioning
- Style matching
- Campaign pages

### BigCommerce

**Installation:**
1. Install from BigCommerce Apps
2. Connect Amply account
3. Configure checkout integration

**Features:**
- Checkout donations
- Cart integration
- Order tracking
- Customer attribution

### Wix

**Installation:**
1. Add Wix App from Amply
2. Connect account
3. Place widgets in editor

**Features:**
- Drag-and-drop placement
- Template integration
- Mobile responsive
- Editor preview

## Configuration

### Connecting Your Account

All plugins require connecting to your Amply account:

1. Install the plugin
2. Click "Connect to Amply"
3. Authorize the connection
4. Select organization(s)

### Selecting Organizations

Choose what customers can support:

**Single Organization:**
- All donations to one org
- Simplest setup
- Clear customer messaging

**Multiple Organizations:**
- Customer chooses
- Dropdown or featured options
- More engagement

**SDG Categories:**
- Donate to cause areas
- Amply allocates to organizations
- Broadest appeal

### Donation Settings

Configure how donations work:

**Amount Options:**
- Preset amounts (e.g., $1, $3, $5)
- Custom amount entry
- Roundup option
- Percentage of order

**Default Selection:**
- Pre-selected vs. opt-in
- Default amount (if any)
- Recurring option display

**Placement:**
- Cart page
- Checkout page
- Post-purchase
- Product pages

### Appearance

Match your store's look:

**Styling:**
- Color matching
- Font inheritance
- Button styles
- Layout options

**Messaging:**
- Custom headlines
- Call-to-action text
- Thank you messages
- Impact statements

## Platform-Specific Features

### Shopify

**Cart Integration:**
```liquid
{% render 'amply-cart-donation' %}
```

**Theme Customizer:**
- Enable/disable from theme settings
- Position in checkout flow
- Style overrides

**Checkout Extensions:**
- Native checkout integration
- No redirect required
- Seamless experience

### WooCommerce

**Hooks:**
```php
// Custom placement
add_action('woocommerce_before_checkout_form', 'amply_display_donation_form');
```

**Filters:**
```php
// Modify default amounts
add_filter('amply_donation_amounts', function($amounts) {
    return [5, 10, 20, 50];
});
```

**Order Meta:**
Donation data saved with orders:
- `_amply_donation_amount`
- `_amply_donation_organization`
- `_amply_transaction_id`

### WordPress

**Block Editor:**
Add blocks directly in post/page editor:
- Full customization
- Live preview
- Responsive options

**Classic Widgets:**
Add to widget areas:
- Sidebar
- Footer
- Custom widget areas

## Reporting

### Dashboard Access

View donation data:
- Total collected
- Donation count
- Organization breakdown
- Time period analysis

### Order Integration

See donations in order details:
- Donation amount
- Organization selected
- Transaction ID
- Verification link

### Export

Export donation data:
- CSV for spreadsheets
- Order-level detail
- Customer attribution
- Date range filtering

## Troubleshooting

### Plugin Not Working

**Check:**
1. Plugin is activated
2. Amply account connected
3. Organization selected
4. No JavaScript errors

**Common Issues:**
- Theme conflicts
- Caching issues
- SSL/HTTPS problems
- API connection errors

### Checkout Issues

**Verify:**
1. Checkout page loads correctly
2. Donation option appears
3. Payment processes
4. Confirmation shows donation

**Solutions:**
- Clear caches
- Check for plugin conflicts
- Verify Amply dashboard settings
- Test in incognito mode

### Styling Problems

**Try:**
1. Check custom CSS conflicts
2. Use plugin styling options
3. Inspect elements for overrides
4. Contact support with screenshots

## Updates

### Staying Current

- Enable automatic updates
- Check changelog for new features
- Test after major updates
- Keep platform up to date

### Breaking Changes

Major updates:
- Announced in advance
- Documentation updated
- Migration guides provided
- Support available

## Support

### Documentation

- Plugin-specific guides
- FAQ sections
- Video tutorials
- Code examples

### Help Channels

- Plugin support forums
- Amply help center
- Email: developers@amply-impact.org
- Platform-specific communities

---

**Related:**
- [Integrations Overview](./overview.md)
- [Widgets](./widgets.md)
- [POS & Terminals](./pos-terminals.md)
