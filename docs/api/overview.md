---
sidebar_position: 1
---

# API Overview

The Amply API enables developers to integrate with the Amply platform programmatically.

## Introduction

The Amply API provides RESTful endpoints for:

- Retrieving organization information
- Processing donations
- Accessing impact data
- Managing donor accounts
- Webhook integrations

## Getting Started

### Authentication

All API requests require authentication using API keys:

```
Authorization: Bearer YOUR_API_KEY
```

API keys can be generated from your organization dashboard.

### Base URL

```
https://api.amply-impact.org/v1
```

### Rate Limits

- Standard: 100 requests per minute
- Enterprise: Custom limits available

## Quick Example

```bash
curl -X GET "https://api.amply-impact.org/v1/organizations" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

## Available Endpoints

### Organizations

- `GET /organizations` - List organizations
- `GET /organizations/{id}` - Get organization details
- `GET /organizations/{id}/campaigns` - List campaigns

### Donations

- `POST /donations` - Create a donation
- `GET /donations/{id}` - Get donation status

### Impact

- `GET /organizations/{id}/impact` - Get impact metrics

## SDKs

Official SDKs are available for:

- JavaScript/TypeScript
- Python
- PHP

## Support

For API support, contact our developer team or visit the API reference documentation.

## Changelog

Stay updated on API changes through our changelog and versioning policy.
