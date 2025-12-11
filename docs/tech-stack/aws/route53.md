---
sidebar_position: 9
---

# Route 53
*DNS Management*

Amazon Route 53 manages DNS for amply-impact.org.

## Hosted Zone

```yaml
HostedZone:
  Name: amply-impact.org
  Type: Public
```

## DNS Records

### Root Domain

```yaml
# Root domain → CloudFront
- Name: amply-impact.org
  Type: A
  AliasTarget:
    DNSName: dxxxxx.cloudfront.net
    HostedZoneId: Z2FDTNDATAQYW2    # CloudFront hosted zone

- Name: amply-impact.org
  Type: AAAA
  AliasTarget:
    DNSName: dxxxxx.cloudfront.net
    HostedZoneId: Z2FDTNDATAQYW2
```

### WWW Subdomain

```yaml
# www → same as root
- Name: www.amply-impact.org
  Type: A
  AliasTarget:
    DNSName: dxxxxx.cloudfront.net
    HostedZoneId: Z2FDTNDATAQYW2
```

### API Subdomain

```yaml
# API → ALB
- Name: api.amply-impact.org
  Type: A
  AliasTarget:
    DNSName: amply-api-alb-xxxxx.eu-central-1.elb.amazonaws.com
    HostedZoneId: Z215JYRZR1TBD5   # ALB hosted zone (eu-central-1)
```

### Docs Subdomain

```yaml
# Docs → Netlify
- Name: docs.amply-impact.org
  Type: CNAME
  TTL: 300
  ResourceRecords:
    - amply-docs.netlify.app
```

### Widgets Subdomain

```yaml
# Widgets → CloudFront
- Name: widgets.amply-impact.org
  Type: A
  AliasTarget:
    DNSName: dyyyyy.cloudfront.net
    HostedZoneId: Z2FDTNDATAQYW2
```

### Email (SES)

```yaml
# MX records (if using SES for receiving)
- Name: amply-impact.org
  Type: MX
  TTL: 300
  ResourceRecords:
    - "10 inbound-smtp.eu-central-1.amazonaws.com"

# SPF
- Name: amply-impact.org
  Type: TXT
  TTL: 300
  ResourceRecords:
    - "v=spf1 include:amazonses.com ~all"

# DKIM
- Name: xxxxx._domainkey.amply-impact.org
  Type: CNAME
  TTL: 300
  ResourceRecords:
    - xxxxx.dkim.amazonses.com

# DMARC
- Name: _dmarc.amply-impact.org
  Type: TXT
  TTL: 300
  ResourceRecords:
    - "v=DMARC1; p=quarantine; rua=mailto:dmarc@amply-impact.org"
```

### Verification Records

```yaml
# Domain verification (if needed)
- Name: _amazonses.amply-impact.org
  Type: TXT
  TTL: 300
  ResourceRecords:
    - "verification-token-from-aws"

# Google/other verifications
- Name: amply-impact.org
  Type: TXT
  TTL: 300
  ResourceRecords:
    - "google-site-verification=xxxxx"
```

## Environment Subdomains

### Staging

```yaml
- Name: staging.amply-impact.org
  Type: A
  AliasTarget:
    DNSName: staging-cloudfront.cloudfront.net

- Name: api.staging.amply-impact.org
  Type: A
  AliasTarget:
    DNSName: staging-alb.eu-central-1.elb.amazonaws.com
```

### Sandbox

```yaml
- Name: sandbox.amply-impact.org
  Type: A
  AliasTarget:
    DNSName: sandbox-cloudfront.cloudfront.net

- Name: api.sandbox.amply-impact.org
  Type: A
  AliasTarget:
    DNSName: sandbox-alb.eu-central-1.elb.amazonaws.com
```

## Health Checks

```yaml
# API health check
HealthCheck:
  Name: amply-api-health
  Type: HTTPS
  FullyQualifiedDomainName: api.amply-impact.org
  Port: 443
  ResourcePath: /health
  RequestInterval: 30
  FailureThreshold: 3

  # CloudWatch alarm on failure
  AlarmIdentifier:
    Name: route53-api-unhealthy
    Region: us-east-1
```

## Traffic Policies

For future multi-region:

```yaml
# Geolocation routing
TrafficPolicy:
  Name: amply-geo-routing
  Document:
    AWSPolicyFormatVersion: "2015-10-01"
    RecordType: A
    Endpoints:
      eu-endpoint:
        Type: cloudfront-distribution
        Value: dxxxxx.cloudfront.net
      us-endpoint:
        Type: cloudfront-distribution
        Value: dyyyyy.cloudfront.net
    Rules:
      - GeolocationRule:
          Locations:
            - EU
          RuleReference: eu-endpoint
      - GeolocationRule:
          Locations:
            - NA
          RuleReference: us-endpoint
```

## Complete Record Summary

| Record | Type | Target |
|--------|------|--------|
| `amply-impact.org` | A | CloudFront |
| `www.amply-impact.org` | A | CloudFront |
| `api.amply-impact.org` | A | ALB |
| `docs.amply-impact.org` | CNAME | Netlify |
| `widgets.amply-impact.org` | A | CloudFront |
| `staging.amply-impact.org` | A | CloudFront (staging) |
| `api.staging.amply-impact.org` | A | ALB (staging) |
| `sandbox.amply-impact.org` | A | CloudFront (sandbox) |
| `api.sandbox.amply-impact.org` | A | ALB (sandbox) |

## Cost

- Hosted zone: $0.50/month
- Queries: $0.40 per million
- Health checks: $0.50/month each

Estimated: ~$2/month

---

**Related:**
- [AWS Overview](./overview.md)
- [CloudFront](./cloudfront.md)
- [SES](./ses.md)
