---
sidebar_position: 1
---

# CI/CD
*Continuous Integration and Deployment*

GitHub Actions automates testing, building, and deploying all Amply components.

## Overview

| Component | Workflow | Deploy Target |
|-----------|----------|---------------|
| Backend | `backend.yml` | ECS Fargate |
| Dashboard | `dashboard.yml` | S3 + CloudFront |
| Public Website | `public-website.yml` | S3 + CloudFront |
| Widgets | `widgets.yml` | S3 + CloudFront |
| Docs | `docs.yml` | Netlify (auto) |
| Verification CLI | `verify.yml` | PyPI |

## Backend Pipeline

### Workflow File

```yaml
# .github/workflows/backend.yml
name: Backend CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'backend/**'
      - '.github/workflows/backend.yml'
  pull_request:
    branches: [main]
    paths:
      - 'backend/**'

env:
  AWS_REGION: eu-central-1
  ECR_REPOSITORY: amply-api
  ECS_CLUSTER: amply-prod
  ECS_SERVICE: amply-api

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: amply_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'

      - name: Install dependencies
        working-directory: backend
        run: |
          pip install -r requirements.txt
          pip install -r requirements-dev.txt

      - name: Run linting
        working-directory: backend
        run: |
          ruff check .
          ruff format --check .

      - name: Run type checking
        working-directory: backend
        run: mypy src/amply --strict

      - name: Run tests
        working-directory: backend
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/amply_test
          TESTING: "true"
        run: |
          pytest tests/ \
            --cov=src/amply \
            --cov-report=xml \
            --cov-fail-under=100

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: backend/coverage.xml
          fail_ci_if_error: true

  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: 'backend'
          severity: 'CRITICAL,HIGH'
          exit-code: '1'

      - name: Run Bandit security linter
        working-directory: backend
        run: |
          pip install bandit
          bandit -r src/amply -ll

  build:
    name: Build & Push
    needs: [test, security]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest

    outputs:
      image: ${{ steps.build.outputs.image }}

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push image
        id: build
        working-directory: backend
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build \
            --build-arg VERSION=${{ github.sha }} \
            -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG \
            -t $ECR_REGISTRY/$ECR_REPOSITORY:latest \
            .

          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

  deploy:
    name: Deploy to ECS
    needs: build
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Download task definition
        run: |
          aws ecs describe-task-definition \
            --task-definition amply-api \
            --query taskDefinition > task-definition.json

      - name: Update task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: task-definition.json
          container-name: api
          image: ${{ needs.build.outputs.image }}

      - name: Deploy to ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true

      - name: Notify Sentry of release
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: amply
          SENTRY_PROJECT: amply-backend
        run: |
          curl -sL https://sentry.io/get-cli/ | bash
          sentry-cli releases new "amply-backend@${{ github.sha }}"
          sentry-cli releases set-commits "amply-backend@${{ github.sha }}" --auto
          sentry-cli releases finalize "amply-backend@${{ github.sha }}"
```

## Frontend Pipeline (Dashboard)

```yaml
# .github/workflows/dashboard.yml
name: Dashboard CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'dashboard/**'
      - '.github/workflows/dashboard.yml'
  pull_request:
    branches: [main]
    paths:
      - 'dashboard/**'

env:
  AWS_REGION: eu-central-1
  S3_BUCKET: amply-frontend-prod
  CLOUDFRONT_DISTRIBUTION: EXXXXX

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: dashboard/package-lock.json

      - name: Install dependencies
        working-directory: dashboard
        run: npm ci

      - name: Run linting
        working-directory: dashboard
        run: npm run lint

      - name: Run type checking
        working-directory: dashboard
        run: npm run typecheck

      - name: Run tests
        working-directory: dashboard
        run: npm run test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: dashboard/coverage/lcov.info

  build:
    name: Build
    needs: test
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: dashboard/package-lock.json

      - name: Install dependencies
        working-directory: dashboard
        run: npm ci

      - name: Build
        working-directory: dashboard
        env:
          VITE_API_URL: https://api.amply-impact.org/v1
          VITE_SENTRY_DSN: ${{ secrets.SENTRY_DSN_DASHBOARD }}
          VITE_STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_PUBLISHABLE_KEY }}
        run: npm run build

      - name: Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: dashboard-build
          path: dashboard/dist

  deploy:
    name: Deploy to S3
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: dashboard-build
          path: dist

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Upload source maps to Sentry
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
        run: |
          npx @sentry/cli releases files "amply-dashboard@${{ github.sha }}" \
            upload-sourcemaps dist --url-prefix '~/dashboard/'

      - name: Deploy to S3
        run: |
          # Sync static assets with long cache
          aws s3 sync dist/ s3://${{ env.S3_BUCKET }}/dashboard/ \
            --exclude "*.html" \
            --exclude "*.json" \
            --cache-control "public, max-age=31536000, immutable"

          # Sync HTML and JSON with no cache
          aws s3 sync dist/ s3://${{ env.S3_BUCKET }}/dashboard/ \
            --exclude "*" \
            --include "*.html" \
            --include "*.json" \
            --cache-control "public, max-age=0, must-revalidate"

      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ env.CLOUDFRONT_DISTRIBUTION }} \
            --paths "/dashboard/index.html" "/dashboard/config.js"
```

## Widgets Pipeline

```yaml
# .github/workflows/widgets.yml
name: Widgets CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'widgets/**'
  pull_request:
    branches: [main]
    paths:
      - 'widgets/**'

env:
  S3_BUCKET: amply-widgets-prod
  CLOUDFRONT_DISTRIBUTION: EYYYYY

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: widgets/package-lock.json

      - name: Install dependencies
        working-directory: widgets
        run: npm ci

      - name: Run tests
        working-directory: widgets
        run: npm test

  build:
    name: Build
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: widgets/package-lock.json

      - name: Install dependencies
        working-directory: widgets
        run: npm ci

      - name: Build
        working-directory: widgets
        run: npm run build

      - name: Check bundle size
        working-directory: widgets
        run: |
          SIZE=$(stat -f%z dist/amply.js 2>/dev/null || stat -c%s dist/amply.js)
          GZIP_SIZE=$(gzip -c dist/amply.js | wc -c)
          echo "Bundle size: $SIZE bytes"
          echo "Gzipped: $GZIP_SIZE bytes"
          if [ $GZIP_SIZE -gt 20000 ]; then
            echo "Bundle too large! Max 20KB gzipped."
            exit 1
          fi

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: widgets-build
          path: widgets/dist

  deploy:
    name: Deploy
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Download artifact
        uses: actions/download-artifact@v4
        with:
          name: widgets-build
          path: dist

      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-central-1

      - name: Get version
        id: version
        run: echo "version=$(cat dist/version.txt)" >> $GITHUB_OUTPUT

      - name: Deploy versioned
        run: |
          VERSION=${{ steps.version.outputs.version }}
          MAJOR=$(echo $VERSION | cut -d. -f1)

          # Deploy to specific version
          aws s3 sync dist/ s3://${{ env.S3_BUCKET }}/v$VERSION/ \
            --cache-control "public, max-age=31536000, immutable"

          # Update latest for major version
          aws s3 sync dist/ s3://${{ env.S3_BUCKET }}/v$MAJOR/ \
            --cache-control "public, max-age=3600"

      - name: Invalidate CloudFront
        run: |
          aws cloudfront create-invalidation \
            --distribution-id ${{ env.CLOUDFRONT_DISTRIBUTION }} \
            --paths "/v1/*"
```

## Database Migrations

```yaml
# .github/workflows/migrations.yml
name: Database Migrations

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - staging
          - production
      action:
        description: 'Migration action'
        required: true
        type: choice
        options:
          - upgrade
          - downgrade
          - status

jobs:
  migrate:
    name: Run Migration
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: eu-central-1

      - name: Get database URL
        id: secrets
        run: |
          DB_URL=$(aws secretsmanager get-secret-value \
            --secret-id amply/${{ github.event.inputs.environment }}/database-url \
            --query SecretString --output text)
          echo "::add-mask::$DB_URL"
          echo "database_url=$DB_URL" >> $GITHUB_OUTPUT

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Install Alembic
        run: pip install alembic psycopg2-binary

      - name: Run migration
        working-directory: backend
        env:
          DATABASE_URL: ${{ steps.secrets.outputs.database_url }}
        run: |
          case "${{ github.event.inputs.action }}" in
            upgrade)
              alembic upgrade head
              ;;
            downgrade)
              alembic downgrade -1
              ;;
            status)
              alembic current
              alembic history
              ;;
          esac
```

## Secrets Management

| Secret | Used By |
|--------|---------|
| `AWS_ACCESS_KEY_ID` | All AWS operations |
| `AWS_SECRET_ACCESS_KEY` | All AWS operations |
| `SENTRY_AUTH_TOKEN` | Release tracking |
| `SENTRY_DSN_*` | Per-project DSNs |
| `STRIPE_PUBLISHABLE_KEY` | Frontend builds |
| `CODECOV_TOKEN` | Coverage uploads |

## Environment Protection

```yaml
# Repository settings
environments:
  production:
    protection_rules:
      - required_reviewers: 1
      - wait_timer: 5  # minutes
    deployment_branches:
      - main

  staging:
    deployment_branches:
      - main
      - develop
```

---

**Related:**
- [Backend Overview](../amply-backend/overview.md)
- [ECS](../aws/ecs.md)
- [CloudFront](../aws/cloudfront.md)
