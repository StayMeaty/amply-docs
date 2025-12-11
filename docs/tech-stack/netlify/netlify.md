---
sidebar_position: 1
---

# Netlify
*Static Site Hosting*

Netlify hosts the Amply documentation site at docs.amply-impact.org.

## Why Netlify

| Feature | Benefit |
|---------|---------|
| Automatic deploys | Push to main → live in minutes |
| Preview deploys | Every PR gets a preview URL |
| Global CDN | Fast worldwide access |
| Free tier | Generous for documentation sites |
| Easy DNS | Simple CNAME setup |

## Site Configuration

### Repository

```
Repository: amply/amply-docs
Branch: main
Build command: npm run build
Publish directory: build
```

### netlify.toml

```toml
[build]
  command = "npm run build"
  publish = "build"

[build.environment]
  NODE_VERSION = "20"

# SPA routing for Docusaurus
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# Force HTTPS
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

## Domain Setup

### DNS Configuration

In Route 53 (see [Route 53](../aws/route53.md)):

```yaml
- Name: docs.amply-impact.org
  Type: CNAME
  TTL: 300
  ResourceRecords:
    - amply-docs.netlify.app
```

### Netlify Domain Settings

```
Custom domain: docs.amply-impact.org
SSL: Automatic (Let's Encrypt)
Force HTTPS: Enabled
```

## Deploy Settings

### Production Deploys

- **Branch**: main
- **Auto-publish**: Yes
- **Deploy notifications**: Slack channel

### Preview Deploys

- **Pull request previews**: Enabled
- **Deploy preview subdomain**: deploy-preview-{number}--amply-docs.netlify.app

### Build Settings

```yaml
Build command: npm run build
Publish directory: build
Functions directory: (none)
```

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NODE_VERSION` | Node.js version (20) |
| `DOCUSAURUS_URL` | Base URL for sitemap |

## Build Hooks

Webhook URL for triggering builds programmatically:

```bash
# Trigger rebuild (e.g., after content update)
curl -X POST -d {} https://api.netlify.com/build_hooks/XXXXXXXX
```

## Monitoring

### Deploy Notifications

Configure in Netlify UI:
- Deploy succeeded → Slack
- Deploy failed → Slack + Email

### Analytics

Netlify Analytics (optional):
- Page views
- Top pages
- Bandwidth usage

## Team Access

| Role | Permissions |
|------|-------------|
| Owner | Full access, billing |
| Developer | Deploy, settings |
| Viewer | View deploys only |

## Costs

| Tier | Price | Limits |
|------|-------|--------|
| Starter (Free) | $0/month | 100GB bandwidth, 300 build minutes |
| Pro | $19/month | 1TB bandwidth, 25,000 build minutes |

Documentation site fits well within free tier.

## Troubleshooting

### Build Failures

```bash
# Check build logs in Netlify UI
# Common issues:
# - Node version mismatch
# - Missing dependencies
# - Build command errors
```

### Cache Issues

```bash
# Clear cache and retry deploy
# In Netlify UI: Deploys → Trigger deploy → Clear cache and deploy site
```

---

**Related:**
- [Docusaurus](./docusaurus/overview.md)
- [Route 53](../aws/route53.md)
