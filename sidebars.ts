import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Sustainable Development Goals',
      link: {
        type: 'doc',
        id: 'sdgs/overview',
      },
      collapsed: true,
      items: [
        'sdgs/overview',
      ],
    },
    {
      type: 'category',
      label: 'Transparency',
      link: {
        type: 'doc',
        id: 'transparency/philosophy',
      },
      collapsed: true,
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
      label: 'Effectiveness',
      link: {
        type: 'doc',
        id: 'effectiveness/philosophy',
      },
      collapsed: true,
      items: [
        'effectiveness/philosophy',
        'effectiveness/sdg-framework',
        'effectiveness/measuring-impact',
      ],
    },
    {
      type: 'category',
      label: 'Trust & Safety',
      link: {
        type: 'doc',
        id: 'trust-and-safety/overview',
      },
      collapsed: true,
      items: [
        'trust-and-safety/overview',
      ],
    },
    {
      type: 'category',
      label: 'About Amply',
      link: {
        type: 'doc',
        id: 'about-amply/overview',
      },
      collapsed: true,
      items: [
        'about-amply/overview',
        'about-amply/our-finances',
        'about-amply/ethics',
      ],
    },
    {
      type: 'category',
      label: 'For Organizations',
      link: {
        type: 'doc',
        id: 'for-organizations/overview',
      },
      collapsed: true,
      items: [
        'for-organizations/overview',
        'for-organizations/getting-started',
        'for-organizations/requirements',
        'for-organizations/platform-tools',
        'for-organizations/reporting',
      ],
    },
    {
      type: 'category',
      label: 'For Businesses',
      link: {
        type: 'doc',
        id: 'for-businesses/overview',
      },
      collapsed: true,
      items: [
        'for-businesses/overview',
        'for-businesses/corporate-giving',
        'for-businesses/customer-collections',
        'for-businesses/solutions',
        'for-businesses/getting-started',
        'for-businesses/compliance',
      ],
    },
    {
      type: 'category',
      label: 'For Donors',
      link: {
        type: 'doc',
        id: 'for-donors/overview',
      },
      collapsed: true,
      items: [
        'for-donors/overview',
        'for-donors/getting-started',
        'for-donors/finding-causes',
        'for-donors/tracking-impact',
        'for-donors/tax-benefits',
      ],
    },
    {
      type: 'category',
      label: 'For Fundraisers',
      link: {
        type: 'doc',
        id: 'for-fundraisers/overview',
      },
      collapsed: true,
      items: [
        'for-fundraisers/overview',
        'for-fundraisers/getting-started',
        'for-fundraisers/moral-circles',
        'for-fundraisers/guidelines',
      ],
    },
    {
      type: 'category',
      label: 'Integrations',
      link: {
        type: 'doc',
        id: 'integrations/overview',
      },
      collapsed: true,
      items: [
        'integrations/overview',
        'integrations/widgets',
        'integrations/plugins',
        'integrations/pos-terminals',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      link: {
        type: 'doc',
        id: 'architecture/overview',
      },
      collapsed: true,
      items: [
        'architecture/overview',
        'architecture/ledger',
        'architecture/stripe-flows',
        'architecture/data-model',
      ],
    },
    {
      type: 'category',
      label: 'API Reference',
      link: {
        type: 'doc',
        id: 'api/overview',
      },
      collapsed: true,
      items: [
        'api/overview',
      ],
    },
  ],
};

export default sidebars;
