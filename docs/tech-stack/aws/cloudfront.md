---
sidebar_position: 8
---

# CloudFront
*Content Delivery Network*

Amazon CloudFront serves static assets and provides edge caching.

## Distributions

| Distribution | Purpose | Origin |
|--------------|---------|--------|
| `amply-frontend` | React app | S3: amply-frontend-prod |
| `amply-widgets` | Widget bundle | S3: amply-widgets-prod |
| `amply-api` | API caching (optional) | ALB: api.amply-impact.org |

## Frontend Distribution

### Configuration

```yaml
DistributionConfig:
  Aliases:
    - amply-impact.org
    - www.amply-impact.org

  Origins:
    - Id: s3-frontend
      DomainName: amply-frontend-prod.s3.eu-central-1.amazonaws.com
      S3OriginConfig:
        OriginAccessIdentity: origin-access-identity/cloudfront/XXXXX

  DefaultCacheBehavior:
    TargetOriginId: s3-frontend
    ViewerProtocolPolicy: redirect-to-https
    AllowedMethods: [GET, HEAD, OPTIONS]
    CachedMethods: [GET, HEAD]
    Compress: true

    CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6  # CachingOptimized
    OriginRequestPolicyId: 88a5eaf4-2fd4-4709-b370-b4c650ea3fcf  # CORS-S3Origin

  CacheBehaviors:
    # API proxy (if needed)
    - PathPattern: /api/*
      TargetOriginId: api-origin
      ViewerProtocolPolicy: https-only
      AllowedMethods: [GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE]
      CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad  # CachingDisabled

  CustomErrorResponses:
    # SPA routing - serve index.html for all 404s
    - ErrorCode: 404
      ResponseCode: 200
      ResponsePagePath: /index.html
      ErrorCachingMinTTL: 300

    - ErrorCode: 403
      ResponseCode: 200
      ResponsePagePath: /index.html
      ErrorCachingMinTTL: 300

  DefaultRootObject: index.html
  PriceClass: PriceClass_100          # US, Canada, Europe
  HttpVersion: http2and3
  IPV6Enabled: true

  ViewerCertificate:
    AcmCertificateArn: arn:aws:acm:us-east-1:xxxx:certificate/xxxx
    SslSupportMethod: sni-only
    MinimumProtocolVersion: TLSv1.2_2021

  Logging:
    Enabled: true
    Bucket: amply-logs.s3.amazonaws.com
    Prefix: cloudfront/frontend/
```

### Cache Policy

```yaml
# Static assets - long cache
CachePolicy:
  Name: amply-static-assets
  DefaultTTL: 86400           # 1 day
  MaxTTL: 31536000            # 1 year
  MinTTL: 86400
  ParametersInCacheKeyAndForwardedToOrigin:
    EnableAcceptEncodingGzip: true
    EnableAcceptEncodingBrotli: true

# HTML - short cache
CachePolicy:
  Name: amply-html
  DefaultTTL: 0
  MaxTTL: 0
  MinTTL: 0
```

## Widget Distribution

```yaml
DistributionConfig:
  Aliases:
    - widgets.amply-impact.org

  Origins:
    - Id: s3-widgets
      DomainName: amply-widgets-prod.s3.eu-central-1.amazonaws.com
      S3OriginConfig:
        OriginAccessIdentity: origin-access-identity/cloudfront/YYYYY

  DefaultCacheBehavior:
    TargetOriginId: s3-widgets
    ViewerProtocolPolicy: redirect-to-https
    Compress: true

    # Long cache for versioned files
    CachePolicyId: 658327ea-f89d-4fab-a63d-7e88639e58f6

    ResponseHeadersPolicy:
      # CORS for embedding
      CorsConfig:
        AccessControlAllowOrigins:
          Items: ["*"]
        AccessControlAllowHeaders:
          Items: ["*"]
        AccessControlAllowMethods:
          Items: [GET, HEAD]
        AccessControlMaxAgeSec: 86400
        OriginOverride: false
```

Widget URL structure:
```
https://widgets.amply-impact.org/v1/amply.js       # Latest v1
https://widgets.amply-impact.org/v1.2.3/amply.js   # Specific version
```

## Cache Invalidation

### After Deployment

```bash
# Invalidate index.html and config
aws cloudfront create-invalidation \
  --distribution-id EXXXXX \
  --paths "/index.html" "/config.js" "/manifest.json"
```

### Full Invalidation

```bash
# Use sparingly - costs $0.005 per path
aws cloudfront create-invalidation \
  --distribution-id EXXXXX \
  --paths "/*"
```

### Programmatic

```python
import boto3

cloudfront = boto3.client('cloudfront')

def invalidate_paths(distribution_id: str, paths: list[str]):
    """Invalidate CloudFront cache."""
    response = cloudfront.create_invalidation(
        DistributionId=distribution_id,
        InvalidationBatch={
            'Paths': {
                'Quantity': len(paths),
                'Items': paths
            },
            'CallerReference': str(time.time())
        }
    )
    return response['Invalidation']['Id']
```

## Security Headers

Response Headers Policy:

```yaml
ResponseHeadersPolicy:
  Name: amply-security-headers

  SecurityHeadersConfig:
    ContentSecurityPolicy:
      ContentSecurityPolicy: "default-src 'self'; script-src 'self' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.amply-impact.org https://api.stripe.com"
      Override: true

    ContentTypeOptions:
      Override: true           # X-Content-Type-Options: nosniff

    FrameOptions:
      FrameOption: DENY        # X-Frame-Options: DENY
      Override: true

    StrictTransportSecurity:
      AccessControlMaxAgeSec: 31536000
      IncludeSubdomains: true
      Override: true

    XSSProtection:
      ModeBlock: true
      Protection: true
      Override: true
```

## Monitoring

### Metrics

- Requests
- BytesDownloaded
- 4xxErrorRate
- 5xxErrorRate
- CacheHitRate

### Alarms

```yaml
- AlarmName: cloudfront-amply-high-error-rate
  MetricName: 5xxErrorRate
  Namespace: AWS/CloudFront
  Threshold: 1
  EvaluationPeriods: 3
```

### Access Logs

Logs stored in S3:
```
s3://amply-logs/cloudfront/frontend/
s3://amply-logs/cloudfront/widgets/
```

Log format includes:
- Date/time
- Edge location
- Response code
- Bytes transferred
- Cache hit/miss
- Response time

## Cost Estimation

| Traffic | Monthly Cost |
|---------|--------------|
| 100 GB | ~$10 |
| 1 TB | ~$90 |
| 10 TB | ~$800 |

Plus:
- Requests: $0.0075-0.012 per 10,000
- Invalidations: $0.005 per path (first 1,000/month free)

---

**Related:**
- [AWS Overview](./overview.md)
- [S3](./s3.md)
- [Route 53](./route53.md)
