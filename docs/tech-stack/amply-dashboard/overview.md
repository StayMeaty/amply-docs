---
sidebar_position: 1
---

# Amply Dashboard
*Organisation Management Interface*

The Amply Dashboard is a React-based single-page application for organisations, businesses, and administrators to manage their accounts.

## Overview

| Aspect | Details |
|--------|---------|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Tailwind CSS |
| State | TanStack Query + Zustand |
| Routing | React Router v6 |
| URL | `amply-impact.org/dashboard` |

## Design Philosophy

The dashboard follows Stripe's design patterns:
- Clean, professional aesthetic
- Dense information display
- Keyboard-first navigation
- Responsive but desktop-optimised

## Project Structure

```
amply-dashboard/
├── src/
│   ├── api/                    # API client layer
│   │   ├── client.ts           # Axios instance
│   │   ├── donations.ts        # Donation endpoints
│   │   ├── organisations.ts    # Organisation endpoints
│   │   └── hooks/              # TanStack Query hooks
│   │       ├── useDonations.ts
│   │       └── useOrganisation.ts
│   ├── components/
│   │   ├── ui/                 # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── DataTable.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── ...
│   │   ├── layout/             # Layout components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── PageContainer.tsx
│   │   └── features/           # Feature components
│   │       ├── donations/
│   │       ├── campaigns/
│   │       ├── funds/
│   │       └── settings/
│   ├── pages/
│   │   ├── Dashboard.tsx       # Overview
│   │   ├── Donations.tsx       # Donation list
│   │   ├── DonationDetail.tsx  # Single donation
│   │   ├── Campaigns.tsx       # Campaign management
│   │   ├── Funds.tsx           # Fund allocation
│   │   ├── Payouts.tsx         # Payout history
│   │   ├── Settings.tsx        # Organisation settings
│   │   └── ApiKeys.tsx         # API key management
│   ├── stores/
│   │   ├── auth.ts             # Authentication state
│   │   └── ui.ts               # UI state (modals, etc.)
│   ├── hooks/                  # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── usePermissions.ts
│   │   └── useDebounce.ts
│   ├── utils/
│   │   ├── format.ts           # Formatting utilities
│   │   ├── currency.ts         # Currency helpers
│   │   └── date.ts             # Date utilities
│   ├── types/
│   │   ├── api.ts              # API response types
│   │   ├── models.ts           # Domain models
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── sentry.ts               # Sentry initialisation
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Key Features

### Dashboard Overview

```tsx
// pages/Dashboard.tsx
import { useOrganisationStats } from '@/api/hooks/useOrganisation';
import { StatCard, DonationChart, RecentDonations } from '@/components/features/dashboard';

export function Dashboard() {
  const { data: stats, isLoading } = useOrganisationStats();

  return (
    <PageContainer title="Dashboard">
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Received"
          value={formatCurrency(stats.totalReceived)}
          change={stats.monthlyChange}
        />
        <StatCard
          title="This Month"
          value={formatCurrency(stats.monthlyReceived)}
        />
        <StatCard
          title="Donors"
          value={stats.totalDonors}
        />
        <StatCard
          title="Avg. Donation"
          value={formatCurrency(stats.averageDonation)}
        />
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <DonationChart data={stats.chartData} />
        </div>
        <div>
          <RecentDonations donations={stats.recentDonations} />
        </div>
      </div>
    </PageContainer>
  );
}
```

### Donation List

```tsx
// pages/Donations.tsx
import { useDonations } from '@/api/hooks/useDonations';
import { DataTable, Pagination, SearchInput, Filters } from '@/components/ui';

export function Donations() {
  const [filters, setFilters] = useState<DonationFilters>({});
  const [page, setPage] = useState(1);

  const { data, isLoading } = useDonations({ ...filters, page });

  const columns = [
    { key: 'id', header: 'ID', render: (d) => <DonationLink id={d.id} /> },
    { key: 'donor', header: 'Donor', render: (d) => d.donor?.name || 'Anonymous' },
    { key: 'amount', header: 'Amount', render: (d) => formatCurrency(d.amount, d.currency) },
    { key: 'fund', header: 'Fund', render: (d) => d.fund?.name },
    { key: 'status', header: 'Status', render: (d) => <StatusBadge status={d.status} /> },
    { key: 'date', header: 'Date', render: (d) => formatDate(d.createdAt) },
  ];

  return (
    <PageContainer title="Donations">
      <div className="flex justify-between mb-4">
        <SearchInput
          placeholder="Search donations..."
          onSearch={(q) => setFilters({ ...filters, search: q })}
        />
        <Filters
          value={filters}
          onChange={setFilters}
          options={['status', 'fund', 'dateRange']}
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.donations}
        loading={isLoading}
        onRowClick={(d) => navigate(`/donations/${d.id}`)}
      />

      <Pagination
        currentPage={page}
        totalPages={data?.totalPages}
        onChange={setPage}
      />
    </PageContainer>
  );
}
```

### Campaign Management

```tsx
// pages/Campaigns.tsx
export function Campaigns() {
  const { data: campaigns } = useCampaigns();
  const createCampaign = useCreateCampaign();

  return (
    <PageContainer
      title="Campaigns"
      action={
        <Button onClick={() => openModal('createCampaign')}>
          Create Campaign
        </Button>
      }
    >
      <div className="grid grid-cols-3 gap-4">
        {campaigns?.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            onClick={() => navigate(`/campaigns/${campaign.id}`)}
          />
        ))}
      </div>

      <CreateCampaignModal
        onSubmit={(data) => createCampaign.mutate(data)}
      />
    </PageContainer>
  );
}
```

## API Client Layer

### Base Client

```typescript
// api/client.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### Query Hooks

```typescript
// api/hooks/useDonations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client';

export function useDonations(params: DonationParams) {
  return useQuery({
    queryKey: ['donations', params],
    queryFn: async () => {
      const { data } = await apiClient.get('/v1/donations', { params });
      return data;
    },
  });
}

export function useDonation(id: string) {
  return useQuery({
    queryKey: ['donations', id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/v1/donations/${id}`);
      return data;
    },
  });
}

export function useRefundDonation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data } = await apiClient.post(`/v1/donations/${id}/refund`, { reason });
      return data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['donations'] });
      queryClient.invalidateQueries({ queryKey: ['donations', id] });
    },
  });
}
```

## State Management

### Auth Store

```typescript
// stores/auth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  user: User | null;
  organisation: Organisation | null;
  login: (token: string, user: User, org: Organisation) => void;
  logout: () => void;
  switchOrganisation: (org: Organisation) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      organisation: null,

      login: (token, user, organisation) =>
        set({ token, user, organisation }),

      logout: () =>
        set({ token: null, user: null, organisation: null }),

      switchOrganisation: (organisation) =>
        set({ organisation }),
    }),
    {
      name: 'amply-auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
```

## Routing

```tsx
// App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export function App() {
  return (
    <BrowserRouter basename="/dashboard">
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="donations" element={<Donations />} />
            <Route path="donations/:id" element={<DonationDetail />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="campaigns/:id" element={<CampaignDetail />} />
            <Route path="funds" element={<Funds />} />
            <Route path="payouts" element={<Payouts />} />
            <Route path="settings" element={<Settings />} />
            <Route path="api-keys" element={<ApiKeys />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

## UI Components

### DataTable

```tsx
// components/ui/DataTable.tsx
interface Column<T> {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (key: string) => void;
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  loading,
  onRowClick,
  sortBy,
  sortDir,
  onSort,
}: DataTableProps<T>) {
  if (loading) {
    return <TableSkeleton columns={columns.length} rows={10} />;
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="border-b">
          {columns.map((col) => (
            <th
              key={col.key}
              className="text-left py-3 px-4 text-sm font-medium text-gray-500"
              onClick={() => col.sortable && onSort?.(col.key)}
            >
              {col.header}
              {col.sortable && sortBy === col.key && (
                <SortIcon direction={sortDir} />
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((item) => (
          <tr
            key={item.id}
            className="border-b hover:bg-gray-50 cursor-pointer"
            onClick={() => onRowClick?.(item)}
          >
            {columns.map((col) => (
              <td key={col.key} className="py-3 px-4">
                {col.render(item)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Environment Variables

```env
# .env
VITE_API_URL=https://api.amply-impact.org/v1
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
```

## Build Configuration

### Vite Config

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/dashboard/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
});
```

## Deployment

Build output is uploaded to S3 and served via CloudFront at `/dashboard/*`.

```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://amply-frontend-prod/dashboard/ --delete

# Invalidate CloudFront
aws cloudfront create-invalidation \
  --distribution-id EXXXXX \
  --paths "/dashboard/*"
```

---

**Related:**
- [Backend API](./amply-backend/api.md)
- [CloudFront](./aws/cloudfront.md)
- [Sentry](./sentry.md)
