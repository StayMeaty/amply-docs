---
sidebar_position: 1
---

# Docusaurus
*Documentation Framework*

Docusaurus powers the Amply documentation site with Markdown-based content and React components.

## Why Docusaurus

| Feature | Benefit |
|---------|---------|
| Markdown-first | Easy content authoring |
| Versioning | Document multiple API versions |
| i18n built-in | English + German support |
| Search | Algolia integration |
| MDX support | React components in docs |
| Active community | Facebook-backed, well-maintained |

## Project Structure

```
amply-docs/
├── docs/                    # Documentation files
│   ├── intro.md
│   ├── transparency/
│   ├── for-donors/
│   ├── for-organisations/
│   ├── tech-stack/         # This documentation
│   └── api/
├── i18n/
│   └── de/                  # German translations
│       └── docusaurus-plugin-content-docs/
│           └── current/
├── src/
│   ├── components/          # React components
│   ├── css/                 # Custom styles
│   └── pages/               # Custom pages
├── static/
│   └── img/                 # Images
├── docusaurus.config.js     # Main configuration
├── sidebars.ts              # Sidebar structure
└── package.json
```

## Configuration

### docusaurus.config.js

```javascript
module.exports = {
  title: 'Amply Documentation',
  tagline: 'Ultra-transparent charitable giving',
  url: 'https://docs.amply-impact.org',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',

  organizationName: 'amply',
  projectName: 'amply-docs',

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'de'],
    localeConfigs: {
      en: { label: 'English' },
      de: { label: 'Deutsch' },
    },
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.ts'),
          editUrl: 'https://github.com/amply/amply-docs/edit/main/',
          routeBasePath: '/',  // Docs at root
        },
        blog: false,           // No blog
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'Amply',
      logo: {
        alt: 'Amply Logo',
        src: 'img/logo.svg',
      },
      items: [
        { to: '/transparency/philosophy', label: 'Transparency', position: 'left' },
        { to: '/for-donors/overview', label: 'For Donors', position: 'left' },
        { to: '/for-organisations/overview', label: 'For Organisations', position: 'left' },
        { to: '/api/overview', label: 'API', position: 'left' },
        {
          type: 'localeDropdown',
          position: 'right',
        },
        {
          href: 'https://github.com/amply/amply-docs',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            { label: 'Getting Started', to: '/intro' },
            { label: 'API Reference', to: '/api/overview' },
          ],
        },
        {
          title: 'Community',
          items: [
            { label: 'GitHub', href: 'https://github.com/amply' },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Amply.`,
    },
    prism: {
      theme: require('prism-react-renderer/themes/github'),
      darkTheme: require('prism-react-renderer/themes/dracula'),
      additionalLanguages: ['python', 'bash', 'json', 'yaml'],
    },
    algolia: {
      appId: 'YOUR_APP_ID',
      apiKey: 'YOUR_SEARCH_API_KEY',
      indexName: 'amply-docs',
      contextualSearch: true,
    },
  },
};
```

### sidebars.ts

```typescript
const sidebars = {
  docs: [
    'intro',
    {
      type: 'category',
      label: 'Transparency',
      items: [
        'transparency/philosophy',
        'transparency/how-it-works',
        'transparency/verification',
        'transparency/pricing',
        'transparency/privacy',
      ],
    },
    {
      type: 'category',
      label: 'For Donors',
      items: [
        'for-donors/overview',
        'for-donors/getting-started',
        'for-donors/finding-causes',
        'for-donors/tracking-impact',
        'for-donors/tax-benefits',
      ],
    },
    // ... additional categories
    {
      type: 'category',
      label: 'Tech Stack',
      items: [
        'tech-stack/overview',
        {
          type: 'category',
          label: 'Backend',
          items: [
            'tech-stack/amply-backend/overview',
            'tech-stack/amply-backend/api',
            'tech-stack/amply-backend/services',
            'tech-stack/amply-backend/jobs',
            'tech-stack/amply-backend/testing',
          ],
        },
        // ... additional tech categories
      ],
    },
  ],
};

export default sidebars;
```

## Content Authoring

### Frontmatter

```markdown
---
sidebar_position: 1
sidebar_label: 'Custom Label'
title: 'Page Title'
description: 'SEO description'
keywords: [amply, transparency, donations]
---

# Heading

Content here...
```

### Admonitions

```markdown
:::note
This is a note.
:::

:::tip
Helpful tip here.
:::

:::warning
Important warning.
:::

:::danger
Critical information.
:::
```

### Code Blocks

````markdown
```python title="example.py"
def hello():
    print("Hello, Amply!")
```
````

### Tabs

```jsx
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';

<Tabs>
  <TabItem value="python" label="Python">
    ```python
    import amply
    ```
  </TabItem>
  <TabItem value="js" label="JavaScript">
    ```javascript
    import { Amply } from '@amply/sdk';
    ```
  </TabItem>
</Tabs>
```

## Internationalisation

### Translating Content

```bash
# Generate translation files
npm run write-translations -- --locale de

# Structure
i18n/de/docusaurus-plugin-content-docs/current/
└── intro.md  # Translated version
```

### Translation Workflow

1. Write content in English (default)
2. Run `npm run write-translations`
3. Translate files in `i18n/de/`
4. Build with `npm run build`

## Custom Components

### React Components in MDX

```jsx
// src/components/DonationExample.jsx
import React from 'react';

export default function DonationExample({ amount, currency }) {
  return (
    <div className="donation-example">
      <strong>{currency} {amount}</strong>
    </div>
  );
}
```

Usage in MDX:

```mdx
import DonationExample from '@site/src/components/DonationExample';

<DonationExample amount={100} currency="EUR" />
```

## Development

### Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run start

# Start with German locale
npm run start -- --locale de
```

### Building

```bash
# Production build
npm run build

# Serve built site locally
npm run serve
```

### Linting

```bash
# Check for broken links
npm run build  # Throws on broken links

# Clear cache
npm run clear
```

## Search Setup

### Algolia DocSearch

1. Apply at https://docsearch.algolia.com/
2. Receive credentials
3. Configure in `docusaurus.config.js`

### Local Search (Alternative)

```bash
npm install @easyops-cn/docusaurus-search-local
```

## Versioning (Future)

```bash
# Create version snapshot
npm run docusaurus docs:version 1.0

# Structure
versioned_docs/
└── version-1.0/
versioned_sidebars/
└── version-1.0-sidebars.json
versions.json
```

---

**Related:**
- [Netlify](../netlify.md)
- [API Documentation](../../api/overview.md)
