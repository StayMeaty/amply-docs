import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'For Donors',
      link: {
        type: 'generated-index',
        description: 'Learn how to make an impact through donations.',
      },
      collapsed: false,
      items: [
        'donors/how-to-donate',
        'donors/impact-tracking',
        'donors/tax-benefits',
      ],
    },
    {
      type: 'category',
      label: 'For Organizations',
      link: {
        type: 'generated-index',
        description: 'Information for non-profit organizations using Amply.',
      },
      collapsed: false,
      items: [
        'organizations/getting-started',
        'organizations/requirements',
        'organizations/reporting',
      ],
    },
    {
      type: 'category',
      label: 'Platform Guide',
      link: {
        type: 'generated-index',
        description: 'Learn how to use the Amply platform.',
      },
      items: [
        'platform/overview',
        'platform/features',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      link: {
        type: 'generated-index',
        description: 'Technical documentation for developers.',
      },
      items: [
        'api/overview',
      ],
    },
  ],
};

export default sidebars;
