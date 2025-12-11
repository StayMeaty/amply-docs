---
sidebar_position: 1
---

# Amply Public Website
*Public-Facing Transparency Interface*

The Amply Public Website provides public access to donation data, organisation profiles, and verification tools.

## Overview

| Aspect | Details |
|--------|---------|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| Rendering | Client-side SPA |
| URL | `amply-impact.org/public/*` |

## URL Structure

```
amply-impact.org/
├── /                              # Marketing/landing (separate app)
├── /public/                       # Public transparency portal
│   ├── /organisations             # Browse organisations
│   ├── /organisation/:slug        # Organisation profile
│   ├── /organisation/:slug/donations  # Organisation's donations
│   ├── /donation/:id              # Single donation detail
│   ├── /campaign/:id              # Campaign page
│   ├── /verify                    # Verification tools
│   ├── /verify/:donationId        # Verify specific donation
│   ├── /ledger                    # Public ledger explorer
│   ├── /checkpoints               # Checkpoint browser
│   └── /stats                     # Platform-wide statistics
└── /dashboard/*                   # Dashboard (separate app)
```

## Project Structure

```
amply-public-website/
├── src/
│   ├── api/
│   │   ├── client.ts              # Public API client (no auth)
│   │   └── hooks/
│   │       ├── useOrganisation.ts
│   │       ├── useDonations.ts
│   │       ├── useLedger.ts
│   │       └── useVerification.ts
│   ├── components/
│   │   ├── ui/                    # Shared UI components
│   │   ├── layout/
│   │   │   ├── PublicHeader.tsx
│   │   │   ├── PublicFooter.tsx
│   │   │   └── PageLayout.tsx
│   │   └── features/
│   │       ├── organisations/
│   │       ├── donations/
│   │       ├── verification/
│   │       └── ledger/
│   ├── pages/
│   │   ├── Home.tsx               # Public portal home
│   │   ├── Organisations.tsx      # Organisation directory
│   │   ├── OrganisationProfile.tsx
│   │   ├── OrganisationDonations.tsx
│   │   ├── DonationDetail.tsx
│   │   ├── Campaign.tsx
│   │   ├── Verify.tsx
│   │   ├── VerifyDonation.tsx
│   │   ├── LedgerExplorer.tsx
│   │   ├── Checkpoints.tsx
│   │   └── Stats.tsx
│   ├── utils/
│   │   ├── format.ts
│   │   └── verification.ts        # Client-side hash verification
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
├── public/
├── index.html
├── vite.config.ts
└── package.json
```

## Key Pages

### Organisation Profile

```tsx
// pages/OrganisationProfile.tsx
import { useParams } from 'react-router-dom';
import { useOrganisation } from '@/api/hooks/useOrganisation';

export function OrganisationProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { data: org, isLoading } = useOrganisation(slug);

  if (isLoading) return <OrganisationSkeleton />;
  if (!org) return <NotFound />;

  return (
    <PageLayout>
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto py-8 px-4">
          <div className="flex items-center gap-6">
            <img
              src={org.logoUrl}
              alt={org.name}
              className="w-20 h-20 rounded-lg"
            />
            <div>
              <h1 className="text-3xl font-bold">{org.name}</h1>
              <div className="flex items-center gap-4 mt-2">
                <VerificationBadge level={org.verificationLevel} />
                <SDGTags sdgs={org.sdgs} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Received"
            value={formatCurrency(org.stats.totalReceived)}
          />
          <StatCard
            label="Donations"
            value={org.stats.totalDonations.toLocaleString()}
          />
          <StatCard
            label="Donors"
            value={org.stats.uniqueDonors.toLocaleString()}
          />
          <StatCard
            label="Member Since"
            value={formatDate(org.createdAt)}
          />
        </div>

        {/* Description */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">About</h2>
          <p className="text-gray-700">{org.description}</p>
        </section>

        {/* Active Campaigns */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Active Campaigns</h2>
          <div className="grid grid-cols-3 gap-4">
            {org.campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        </section>

        {/* Recent Donations */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Recent Donations</h2>
            <Link
              to={`/public/organisation/${slug}/donations`}
              className="text-blue-600 hover:underline"
            >
              View all →
            </Link>
          </div>
          <DonationList donations={org.recentDonations} />
        </section>
      </div>
    </PageLayout>
  );
}
```

### Donation Detail

```tsx
// pages/DonationDetail.tsx
export function DonationDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: donation, isLoading } = useDonation(id);

  if (isLoading) return <DonationSkeleton />;
  if (!donation) return <NotFound />;

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Donation Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">
                {formatCurrency(donation.amount, donation.currency)}
              </h1>
              <p className="text-gray-600 mt-1">
                to {donation.organisation.name}
              </p>
            </div>
            <StatusBadge status={donation.status} />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <DetailRow label="Donation ID" value={donation.id} copyable />
            <DetailRow label="Date" value={formatDateTime(donation.createdAt)} />
            <DetailRow label="Fund" value={donation.fund?.name || 'General'} />
            <DetailRow
              label="Donor"
              value={donation.visibility === 'public_full'
                ? donation.donor?.name
                : 'Anonymous'
              }
            />
          </div>
        </div>

        {/* Ledger Entry */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Ledger Entry</h2>
          <LedgerEntryCard entry={donation.ledgerEntry} />
        </div>

        {/* Verification */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Verify This Donation</h2>
          <VerificationPanel donationId={donation.id} />
        </div>
      </div>
    </PageLayout>
  );
}
```

### Verification Page

```tsx
// pages/Verify.tsx
import { useState } from 'react';
import { verifyDonation, verifyHash } from '@/utils/verification';

export function Verify() {
  const [donationId, setDonationId] = useState('');
  const [result, setResult] = useState<VerificationResult | null>(null);

  const handleVerify = async () => {
    const verificationResult = await verifyDonation(donationId);
    setResult(verificationResult);
  };

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-4">Verify a Donation</h1>
        <p className="text-gray-600 mb-8">
          Enter a donation ID to verify its authenticity and view its
          position in the Amply ledger.
        </p>

        {/* Input */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <label className="block text-sm font-medium mb-2">
            Donation ID
          </label>
          <div className="flex gap-4">
            <input
              type="text"
              value={donationId}
              onChange={(e) => setDonationId(e.target.value)}
              placeholder="don_abc123..."
              className="flex-1 border rounded px-4 py-2"
            />
            <button
              onClick={handleVerify}
              className="bg-black text-white px-6 py-2 rounded"
            >
              Verify
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <VerificationResult result={result} />
        )}

        {/* How It Works */}
        <div className="bg-gray-50 rounded-lg p-6 mt-8">
          <h2 className="text-lg font-semibold mb-4">How Verification Works</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>We retrieve the donation's ledger entry</li>
            <li>We verify the hash chain by checking previous entry hashes</li>
            <li>We verify the entry is included in a signed checkpoint</li>
            <li>You can independently verify using our open-source CLI tool</li>
          </ol>
          <a
            href="/docs/transparency/verification"
            className="text-blue-600 hover:underline mt-4 inline-block"
          >
            Learn more about verification →
          </a>
        </div>
      </div>
    </PageLayout>
  );
}
```

### Ledger Explorer

```tsx
// pages/LedgerExplorer.tsx
export function LedgerExplorer() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useLedgerEntries({ page });

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-4">Public Ledger</h1>
        <p className="text-gray-600 mb-8">
          Every donation on Amply is recorded in our append-only,
          tamper-evident ledger. Browse entries below.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <StatCard label="Total Entries" value={data?.totalEntries} />
          <StatCard label="Latest Checkpoint" value={data?.latestCheckpoint} />
          <StatCard label="Chain Verified" value="✓" />
        </div>

        {/* Entry List */}
        <div className="bg-white rounded-lg shadow">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Sequence</th>
                <th className="text-left p-4">Type</th>
                <th className="text-left p-4">Amount</th>
                <th className="text-left p-4">Organisation</th>
                <th className="text-left p-4">Hash</th>
                <th className="text-left p-4">Time</th>
              </tr>
            </thead>
            <tbody>
              {data?.entries.map((entry) => (
                <tr key={entry.sequence} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-mono">{entry.sequence}</td>
                  <td className="p-4">
                    <TypeBadge type={entry.entryType} />
                  </td>
                  <td className="p-4">
                    {formatCurrency(entry.amount, entry.currency)}
                  </td>
                  <td className="p-4">{entry.organisation?.name}</td>
                  <td className="p-4 font-mono text-xs">
                    {truncateHash(entry.hash)}
                    <CopyButton value={entry.hash} />
                  </td>
                  <td className="p-4 text-gray-600">
                    {formatRelativeTime(entry.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={data?.totalPages}
          onChange={setPage}
        />
      </div>
    </PageLayout>
  );
}
```

### Platform Statistics

```tsx
// pages/Stats.tsx
export function Stats() {
  const { data: stats } = usePlatformStats();

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-8">Platform Statistics</h1>

        {/* Overview */}
        <div className="grid grid-cols-4 gap-4 mb-12">
          <StatCard
            label="Total Donated"
            value={formatCurrency(stats.totalDonated)}
            size="large"
          />
          <StatCard
            label="Organisations"
            value={stats.totalOrganisations}
          />
          <StatCard
            label="Donations"
            value={stats.totalDonations}
          />
          <StatCard
            label="Countries"
            value={stats.countriesReached}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-2 gap-8 mb-12">
          <ChartCard title="Donations Over Time">
            <DonationVolumeChart data={stats.donationsByMonth} />
          </ChartCard>
          <ChartCard title="By SDG Category">
            <SDGDistributionChart data={stats.bySDG} />
          </ChartCard>
        </div>

        {/* Top Organisations */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Top Organisations</h2>
          <OrganisationRankingTable organisations={stats.topOrganisations} />
        </section>
      </div>
    </PageLayout>
  );
}
```

## Client-Side Verification

```typescript
// utils/verification.ts
import { sha256 } from 'crypto-js';

export interface VerificationResult {
  valid: boolean;
  entry: LedgerEntry;
  hashValid: boolean;
  chainValid: boolean;
  checkpointValid: boolean;
  checkpoint?: Checkpoint;
  errors: string[];
}

export async function verifyDonation(donationId: string): Promise<VerificationResult> {
  // Fetch donation and related ledger data
  const response = await fetch(
    `${API_URL}/v1/public/donations/${donationId}/verify`
  );
  const data = await response.json();

  const errors: string[] = [];

  // Verify hash computation
  const computedHash = computeEntryHash(data.entry, data.previousHash);
  const hashValid = computedHash === data.entry.hash;
  if (!hashValid) {
    errors.push('Hash mismatch - entry may have been modified');
  }

  // Verify chain linkage
  const chainValid = data.previousEntry
    ? data.previousEntry.hash === data.entry.previous_hash
    : true;
  if (!chainValid) {
    errors.push('Chain linkage broken - previous hash mismatch');
  }

  // Verify checkpoint inclusion
  const checkpointValid = data.checkpoint
    ? verifyCheckpointInclusion(data.entry, data.checkpoint)
    : false;

  return {
    valid: hashValid && chainValid && checkpointValid,
    entry: data.entry,
    hashValid,
    chainValid,
    checkpointValid,
    checkpoint: data.checkpoint,
    errors,
  };
}

function computeEntryHash(entry: LedgerEntry, previousHash: string): string {
  const payload = JSON.stringify({
    previous_hash: previousHash,
    sequence: entry.sequence,
    entry_type: entry.entry_type,
    organisation_id: entry.organisation_id,
    reference_type: entry.reference_type,
    reference_id: entry.reference_id,
    amount: entry.amount,
    currency: entry.currency,
    metadata: entry.metadata,
    created_at: entry.created_at,
  });

  return sha256(payload).toString();
}
```

## API Client

```typescript
// api/client.ts
import axios from 'axios';

// Public API - no authentication required
export const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// All public endpoints
export const api = {
  organisations: {
    list: (params: ListParams) =>
      publicApi.get('/v1/public/organisations', { params }),
    get: (slug: string) =>
      publicApi.get(`/v1/public/organisations/${slug}`),
    donations: (slug: string, params: ListParams) =>
      publicApi.get(`/v1/public/organisations/${slug}/donations`, { params }),
  },
  donations: {
    get: (id: string) =>
      publicApi.get(`/v1/public/donations/${id}`),
    verify: (id: string) =>
      publicApi.get(`/v1/public/donations/${id}/verify`),
  },
  ledger: {
    entries: (params: ListParams) =>
      publicApi.get('/v1/public/ledger', { params }),
    checkpoints: () =>
      publicApi.get('/v1/public/checkpoints'),
    checkpoint: (id: string) =>
      publicApi.get(`/v1/public/checkpoints/${id}`),
  },
  stats: {
    platform: () =>
      publicApi.get('/v1/public/stats'),
  },
};
```

## SEO & Sharing

```tsx
// components/SEO.tsx
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  url: string;
  image?: string;
}

export function SEO({ title, description, url, image }: SEOProps) {
  const fullTitle = `${title} | Amply`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  );
}
```

## Build & Deployment

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/public/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
```

Deployment to S3/CloudFront:

```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://amply-frontend-prod/public/ --delete

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id EXXXXX \
  --paths "/public/*"
```

---

**Related:**
- [Backend API](../amply-backend/api.md)
- [Ledger Architecture](../../architecture/ledger.md)
- [Verification CLI](../amply-verify/overview.md)
- [CloudFront](../aws/cloudfront.md)
