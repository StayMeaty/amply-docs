---
sidebar_position: 1
---

# Amply Widgets
*Embeddable Donation Components*

Amply Widgets provide ready-to-use donation components that can be embedded on any website.

## Overview

| Aspect | Details |
|--------|---------|
| Framework | Preact (lightweight React) |
| Bundler | Rollup |
| Styling | CSS-in-JS (isolated) |
| Size | ~15KB gzipped |
| URL | `widgets.amply-impact.org` |

## Widget Types

| Widget | Purpose | Size |
|--------|---------|------|
| `DonationButton` | Simple donate button | ~5KB |
| `DonationForm` | Full donation form | ~12KB |
| `ImpactCounter` | Live donation counter | ~3KB |
| `CampaignProgress` | Campaign progress bar | ~4KB |
| `DonorWall` | Recent donors display | ~6KB |

## Installation

### Script Tag (Recommended)

```html
<!-- Add before </body> -->
<script src="https://widgets.amply-impact.org/v1/amply.js" async></script>
```

### NPM Package

```bash
npm install @amply/widgets
```

## Usage

### Donation Button

```html
<div
  data-amply-widget="donation-button"
  data-organisation="org_abc123"
  data-amount="25"
  data-currency="EUR"
>
</div>
```

With customisation:

```html
<div
  data-amply-widget="donation-button"
  data-organisation="org_abc123"
  data-amounts="10,25,50,100"
  data-currency="EUR"
  data-button-text="Support Our Work"
  data-button-color="#1a73e8"
  data-fund="fund_general"
  data-campaign="camp_winter2025"
>
</div>
```

### Donation Form

```html
<div
  data-amply-widget="donation-form"
  data-organisation="org_abc123"
  data-currency="EUR"
  data-show-recurring="true"
  data-show-funds="true"
  data-default-amount="50"
>
</div>
```

### Impact Counter

```html
<div
  data-amply-widget="impact-counter"
  data-organisation="org_abc123"
  data-metric="total"
  data-format="currency"
  data-animate="true"
>
</div>
```

### Campaign Progress

```html
<div
  data-amply-widget="campaign-progress"
  data-campaign="camp_abc123"
  data-show-goal="true"
  data-show-donors="true"
  data-show-time-left="true"
>
</div>
```

### Donor Wall

```html
<div
  data-amply-widget="donor-wall"
  data-organisation="org_abc123"
  data-limit="10"
  data-show-amounts="true"
  data-show-messages="true"
>
</div>
```

## JavaScript API

### Programmatic Initialisation

```javascript
// Wait for widget library to load
window.AmplyWidgets.ready(function(Amply) {

  // Create donation form
  const form = Amply.createWidget('donation-form', {
    organisationId: 'org_abc123',
    currency: 'EUR',
    amounts: [10, 25, 50, 100],
    showRecurring: true,
    onSuccess: function(donation) {
      console.log('Donation complete:', donation.id);
      showThankYouMessage();
    },
    onError: function(error) {
      console.error('Donation failed:', error);
    }
  });

  // Mount to container
  form.mount('#donation-container');

  // Later: unmount
  form.unmount();
});
```

### Events

```javascript
Amply.on('donation.initiated', function(data) {
  analytics.track('Donation Started', {
    amount: data.amount,
    currency: data.currency
  });
});

Amply.on('donation.completed', function(donation) {
  analytics.track('Donation Completed', {
    donationId: donation.id,
    amount: donation.amount
  });
});

Amply.on('donation.failed', function(error) {
  analytics.track('Donation Failed', {
    error: error.message
  });
});
```

## Widget Configuration

### Global Configuration

```javascript
window.AmplyConfig = {
  organisationId: 'org_abc123',
  locale: 'de',
  currency: 'EUR',
  theme: {
    primaryColor: '#1a73e8',
    fontFamily: 'Inter, sans-serif',
    borderRadius: '8px'
  }
};
```

### Theming

```javascript
Amply.setTheme({
  // Colors
  primaryColor: '#1a73e8',
  primaryColorHover: '#1557b0',
  successColor: '#34a853',
  errorColor: '#ea4335',

  // Typography
  fontFamily: 'Inter, -apple-system, sans-serif',
  fontSize: '14px',

  // Layout
  borderRadius: '8px',
  inputHeight: '44px',
  buttonHeight: '48px',

  // Shadows
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
});
```

### Localisation

```javascript
Amply.setLocale('de', {
  donate: 'Spenden',
  amount: 'Betrag',
  monthly: 'Monatlich',
  oneTime: 'Einmalig',
  email: 'E-Mail',
  processing: 'Wird verarbeitet...',
  thankYou: 'Vielen Dank für Ihre Spende!',
  error: 'Ein Fehler ist aufgetreten',
});
```

## Project Structure

```
amply-widgets/
├── src/
│   ├── widgets/
│   │   ├── DonationButton/
│   │   │   ├── index.tsx
│   │   │   ├── styles.ts
│   │   │   └── types.ts
│   │   ├── DonationForm/
│   │   │   ├── index.tsx
│   │   │   ├── AmountSelector.tsx
│   │   │   ├── PaymentForm.tsx
│   │   │   ├── RecurringToggle.tsx
│   │   │   └── styles.ts
│   │   ├── ImpactCounter/
│   │   ├── CampaignProgress/
│   │   └── DonorWall/
│   ├── core/
│   │   ├── api.ts              # API client
│   │   ├── stripe.ts           # Stripe integration
│   │   ├── events.ts           # Event emitter
│   │   ├── theme.ts            # Theme system
│   │   └── i18n.ts             # Localisation
│   ├── utils/
│   │   ├── currency.ts
│   │   └── dom.ts
│   ├── types/
│   ├── index.ts                # Entry point
│   └── auto-init.ts            # Auto-discover widgets
├── dist/
│   ├── amply.js                # UMD bundle
│   ├── amply.esm.js            # ESM bundle
│   └── amply.css               # Extracted styles
├── rollup.config.js
├── tsconfig.json
└── package.json
```

## Core Implementation

### Widget Base

```tsx
// src/core/Widget.tsx
import { h, render, Component } from 'preact';

export abstract class Widget<P, S> extends Component<P, S> {
  protected api: AmplyAPI;
  protected stripe: StripeInstance;
  protected theme: Theme;

  constructor(props: P) {
    super(props);
    this.api = new AmplyAPI();
    this.stripe = initStripe();
    this.theme = getTheme();
  }

  static mount(container: string | HTMLElement, props: any) {
    const el = typeof container === 'string'
      ? document.querySelector(container)
      : container;

    if (!el) throw new Error('Container not found');

    render(h(this, props), el);
  }
}
```

### Donation Form Widget

```tsx
// src/widgets/DonationForm/index.tsx
import { h, Component } from 'preact';
import { AmountSelector } from './AmountSelector';
import { PaymentForm } from './PaymentForm';
import { RecurringToggle } from './RecurringToggle';
import { styled } from '../../core/styled';

interface Props {
  organisationId: string;
  currency: string;
  amounts?: number[];
  showRecurring?: boolean;
  showFunds?: boolean;
  defaultAmount?: number;
  onSuccess?: (donation: Donation) => void;
  onError?: (error: Error) => void;
}

interface State {
  amount: number | null;
  customAmount: string;
  isRecurring: boolean;
  selectedFund: string | null;
  step: 'amount' | 'payment' | 'complete';
  loading: boolean;
  error: string | null;
}

export class DonationForm extends Component<Props, State> {
  state: State = {
    amount: this.props.defaultAmount || null,
    customAmount: '',
    isRecurring: false,
    selectedFund: null,
    step: 'amount',
    loading: false,
    error: null,
  };

  handleAmountSelect = (amount: number) => {
    this.setState({ amount, customAmount: '' });
  };

  handleCustomAmount = (value: string) => {
    const parsed = parseFloat(value);
    this.setState({
      customAmount: value,
      amount: isNaN(parsed) ? null : parsed,
    });
  };

  handleRecurringToggle = (isRecurring: boolean) => {
    this.setState({ isRecurring });
  };

  handleContinue = () => {
    if (this.state.amount && this.state.amount > 0) {
      this.setState({ step: 'payment' });
    }
  };

  handlePaymentComplete = async (paymentMethod: string) => {
    this.setState({ loading: true, error: null });

    try {
      const donation = await this.api.createDonation({
        organisationId: this.props.organisationId,
        amount: this.state.amount,
        currency: this.props.currency,
        isRecurring: this.state.isRecurring,
        fundId: this.state.selectedFund,
        paymentMethodId: paymentMethod,
      });

      this.setState({ step: 'complete' });
      this.props.onSuccess?.(donation);
      emit('donation.completed', donation);

    } catch (error) {
      this.setState({ error: error.message, loading: false });
      this.props.onError?.(error);
      emit('donation.failed', error);
    }
  };

  render() {
    const { step, amount, isRecurring, loading, error } = this.state;
    const { currency, amounts, showRecurring } = this.props;

    return (
      <Container>
        {step === 'amount' && (
          <>
            <AmountSelector
              amounts={amounts || [10, 25, 50, 100]}
              selected={amount}
              currency={currency}
              onSelect={this.handleAmountSelect}
              onCustom={this.handleCustomAmount}
              customValue={this.state.customAmount}
            />

            {showRecurring && (
              <RecurringToggle
                value={isRecurring}
                onChange={this.handleRecurringToggle}
              />
            )}

            <Button
              onClick={this.handleContinue}
              disabled={!amount || amount <= 0}
            >
              Continue
            </Button>
          </>
        )}

        {step === 'payment' && (
          <PaymentForm
            amount={amount}
            currency={currency}
            isRecurring={isRecurring}
            onComplete={this.handlePaymentComplete}
            onBack={() => this.setState({ step: 'amount' })}
            loading={loading}
            error={error}
          />
        )}

        {step === 'complete' && (
          <ThankYou amount={amount} currency={currency} />
        )}
      </Container>
    );
  }
}
```

### Auto-Initialisation

```typescript
// src/auto-init.ts
import { DonationButton } from './widgets/DonationButton';
import { DonationForm } from './widgets/DonationForm';
import { ImpactCounter } from './widgets/ImpactCounter';
import { CampaignProgress } from './widgets/CampaignProgress';
import { DonorWall } from './widgets/DonorWall';

const WIDGETS = {
  'donation-button': DonationButton,
  'donation-form': DonationForm,
  'impact-counter': ImpactCounter,
  'campaign-progress': CampaignProgress,
  'donor-wall': DonorWall,
};

function initWidgets() {
  const elements = document.querySelectorAll('[data-amply-widget]');

  elements.forEach((el) => {
    const widgetType = el.getAttribute('data-amply-widget');
    const Widget = WIDGETS[widgetType];

    if (!Widget) {
      console.warn(`Unknown Amply widget: ${widgetType}`);
      return;
    }

    // Extract props from data attributes
    const props = extractDataAttributes(el);

    // Render widget
    Widget.mount(el, props);
  });
}

function extractDataAttributes(el: Element): Record<string, any> {
  const props: Record<string, any> = {};

  Array.from(el.attributes).forEach((attr) => {
    if (attr.name.startsWith('data-') && attr.name !== 'data-amply-widget') {
      const key = attr.name
        .replace('data-', '')
        .replace(/-([a-z])/g, (_, c) => c.toUpperCase());

      props[key] = parseAttributeValue(attr.value);
    }
  });

  return props;
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWidgets);
} else {
  initWidgets();
}
```

## Stripe Integration

```typescript
// src/core/stripe.ts
import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

export function getStripe(connectedAccountId?: string): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(
      window.AmplyConfig?.stripePublishableKey || STRIPE_KEY,
      connectedAccountId ? { stripeAccount: connectedAccountId } : undefined
    );
  }
  return stripePromise;
}

export async function createPaymentIntent(
  organisationId: string,
  amount: number,
  currency: string,
  options: PaymentOptions
): Promise<{ clientSecret: string; stripeAccountId: string }> {
  const response = await fetch(`${API_URL}/v1/widgets/payment-intents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      organisation_id: organisationId,
      amount,
      currency,
      ...options,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create payment intent');
  }

  return response.json();
}
```

## Build Configuration

### Rollup Config

```javascript
// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import alias from '@rollup/plugin-alias';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/amply.js',
      format: 'umd',
      name: 'AmplyWidgets',
      sourcemap: true,
    },
    {
      file: 'dist/amply.esm.js',
      format: 'esm',
      sourcemap: true,
    },
  ],
  plugins: [
    alias({
      entries: [
        { find: 'react', replacement: 'preact/compat' },
        { find: 'react-dom', replacement: 'preact/compat' },
      ],
    }),
    resolve(),
    commonjs(),
    typescript(),
    terser(),
  ],
  external: [],
};
```

## Versioning

```
https://widgets.amply-impact.org/v1/amply.js        # Latest v1.x.x
https://widgets.amply-impact.org/v1.2/amply.js      # Latest v1.2.x
https://widgets.amply-impact.org/v1.2.3/amply.js    # Specific version
```

## Security

### CORS

Widgets can be embedded on any domain. API requests include:

```
Origin: https://partner-site.com
```

Widget API endpoints validate the organisation allows embedding.

### Content Security Policy

Host sites need to allow:

```
script-src: widgets.amply-impact.org js.stripe.com
frame-src: js.stripe.com
connect-src: api.amply-impact.org
```

---

**Related:**
- [Integrations Overview](../integrations/overview.md)
- [Stripe](./stripe/overview.md)
- [CloudFront](./aws/cloudfront.md)
