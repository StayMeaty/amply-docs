---
sidebar_position: 2
---

# Widgets
*Embeddable Donation Components*

Amply widgets let you add donation functionality to any website with a simple code snippet.

## Available Widgets

### Donation Button

Simple button that opens Amply checkout:

```html
<amply-button
  organization="org_123"
  text="Donate Now">
</amply-button>
```

**Features:**
- Customizable text and styling
- Opens Amply checkout overlay
- Mobile-responsive
- Preset or custom amounts

### Donation Form

Inline form for donations on your page:

```html
<amply-form
  organization="org_123"
  amounts="10,25,50,100"
  recurring="true">
</amply-form>
```

**Features:**
- Embedded directly on page
- Amount selection
- Recurring options
- Custom styling

### Progress Bar

Show campaign or goal progress:

```html
<amply-progress
  campaign="camp_456"
  show-amount="true"
  show-donors="true">
</amply-progress>
```

**Features:**
- Real-time updates
- Goal and raised amount
- Donor count
- Customizable appearance

### Donor Wall

Display recent supporters:

```html
<amply-donors
  organization="org_123"
  count="10"
  show-amounts="true">
</amply-donors>
```

**Features:**
- Recent donors (with consent)
- Amount display optional
- Auto-refresh
- Privacy-respecting

### Campaign Card

Complete campaign display:

```html
<amply-campaign
  campaign="camp_456">
</amply-campaign>
```

**Features:**
- Campaign title and description
- Progress toward goal
- Donate button
- Share options

## Installation

### Script Include

Add the Amply widget script to your page:

```html
<script src="https://widgets.amply-impact.org/v1/amply.js"></script>
```

Place before closing `</body>` tag for best performance.

### Widget Placement

Add widget elements where you want them to appear:

```html
<div class="donation-section">
  <h2>Support Our Mission</h2>
  <amply-form organization="org_123"></amply-form>
</div>
```

### Initialization

Widgets initialize automatically. For manual control:

```javascript
// Wait for Amply to load
window.AmplyReady = function() {
  Amply.init({
    theme: 'light',
    locale: 'en'
  });
};
```

## Configuration

### Organization Widgets

Target a specific organization:

```html
<amply-button organization="org_123"></amply-button>
```

Find your organization ID in your Amply dashboard.

### Campaign Widgets

Target a specific campaign:

```html
<amply-progress campaign="camp_456"></amply-progress>
```

### SDG Category Widgets

Let donors choose from a category:

```html
<amply-form sdg="4"></amply-form>
```

SDG numbers 1-17 correspond to UN Sustainable Development Goals.

## Customization

### Styling

**CSS Classes:**
Widgets support standard CSS styling:

```css
amply-button {
  --amply-primary: #2563eb;
  --amply-radius: 8px;
}
```

**Custom Classes:**
Add your own classes:

```html
<amply-button class="my-donate-btn"></amply-button>
```

### Theming

**Built-in Themes:**
- `light` (default)
- `dark`
- `minimal`

```html
<amply-form theme="dark"></amply-form>
```

**CSS Variables:**
Full control over appearance:

```css
:root {
  --amply-primary: #2563eb;
  --amply-secondary: #64748b;
  --amply-success: #22c55e;
  --amply-background: #ffffff;
  --amply-text: #1e293b;
  --amply-border: #e2e8f0;
  --amply-radius: 8px;
  --amply-font: inherit;
}
```

### Amount Options

Preset donation amounts:

```html
<amply-form amounts="5,10,25,50,100,other"></amply-form>
```

- Comma-separated values
- Include `other` for custom amount
- Currency determined by organization

### Recurring Options

Enable recurring donations:

```html
<amply-form
  recurring="true"
  frequencies="monthly,quarterly,annual">
</amply-form>
```

## Events

Listen for widget events:

```javascript
document.querySelector('amply-form').addEventListener('amply:donated', (e) => {
  console.log('Donation completed:', e.detail);
  // Track conversion, show thank you, etc.
});
```

**Available Events:**

| Event | Triggered When |
|-------|---------------|
| `amply:loaded` | Widget initialized |
| `amply:opened` | Checkout opened |
| `amply:donated` | Donation completed |
| `amply:closed` | Checkout closed |
| `amply:error` | Error occurred |

**Event Details:**

```javascript
{
  amount: 50.00,
  currency: 'USD',
  organization: 'org_123',
  transactionId: 'txn_789',
  recurring: false
}
```

## Advanced Usage

### Multiple Widgets

Use multiple widgets on one page:

```html
<amply-form organization="org_123"></amply-form>
<amply-form organization="org_456"></amply-form>
```

Each operates independently.

### Dynamic Loading

Load widgets dynamically:

```javascript
const form = document.createElement('amply-form');
form.setAttribute('organization', 'org_123');
document.getElementById('donation-container').appendChild(form);
```

### Prefilled Values

Start with values selected:

```html
<amply-form
  organization="org_123"
  prefill-amount="100"
  prefill-frequency="monthly">
</amply-form>
```

### Tracking Parameters

Add tracking for analytics:

```html
<amply-button
  organization="org_123"
  source="homepage"
  campaign="spring-2025">
</amply-button>
```

Tracking data appears in your Amply dashboard.

## Responsive Design

Widgets are responsive by default:

- Adapt to container width
- Mobile-optimized checkout
- Touch-friendly controls
- Flexible layouts

**Container Control:**

```css
.donation-container {
  max-width: 400px;
  width: 100%;
}
```

## Accessibility

Widgets follow accessibility best practices:

- Keyboard navigation
- Screen reader support
- ARIA labels
- Focus management
- Color contrast compliance

## Performance

### Loading

- Asynchronous loading
- Minimal initial payload
- Lazy load checkout components
- CDN delivery

### Caching

- Browser caching enabled
- Version control for updates
- No unnecessary reloads

## Troubleshooting

### Widget Not Appearing

1. Check script is loaded
2. Verify organization/campaign ID
3. Check browser console for errors
4. Ensure container is visible

### Styling Issues

1. Check CSS specificity
2. Use CSS variables for theming
3. Inspect with browser dev tools
4. Test in incognito mode

### Event Issues

1. Verify event listener attached
2. Check event name spelling
3. Ensure widget has loaded
4. Check for JS errors

## Sandbox Testing

Test widgets without real transactions:

```html
<script src="https://widgets.amply-impact.org/v1/amply.js?sandbox=true"></script>
```

Sandbox mode:
- No real payments
- Test card numbers work
- Full functionality
- No money moves

---

**Related:**
- [Integrations Overview](./overview.md)
- [Plugins](./plugins.md)
- [API Documentation](../api/overview.md)
