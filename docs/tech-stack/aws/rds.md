---
sidebar_position: 3
---

# RDS PostgreSQL
*Primary Database*

Amazon RDS hosts the PostgreSQL database containing all Amply data including the tamper-evident ledger.

## Configuration

### Production Instance

```yaml
Engine: PostgreSQL 15
InstanceClass: db.t3.small     # Start small, scale up
AllocatedStorage: 100          # GB, gp3
MaxAllocatedStorage: 500       # Auto-scaling enabled
MultiAZ: true                  # High availability
StorageEncrypted: true

DatabaseName: amply
MasterUsername: amply_admin
Port: 5432

BackupRetentionPeriod: 7       # Days
PreferredBackupWindow: "03:00-04:00"
PreferredMaintenanceWindow: "sun:04:00-sun:05:00"

EnablePerformanceInsights: true
PerformanceInsightsRetentionPeriod: 7

EnableCloudwatchLogsExports:
  - postgresql
  - upgrade

DeletionProtection: true
```

### Parameter Group

```yaml
ParameterGroupFamily: postgres15

Parameters:
  # Connection
  max_connections: 200

  # Logging
  log_statement: ddl
  log_min_duration_statement: 1000    # Log queries > 1s

  # Performance
  shared_buffers: "{DBInstanceClassMemory/4}"
  effective_cache_size: "{DBInstanceClassMemory*3/4}"
  work_mem: 16384                      # 16MB

  # Write-ahead log
  wal_buffers: 16384
  checkpoint_completion_target: 0.9

  # Locale (for proper sorting)
  lc_collate: en_US.UTF-8
  lc_ctype: en_US.UTF-8
```

## Schema

### Core Tables

See [Data Model](../../architecture/data-model.md) for full schema.

Key tables:
- `organisations`
- `funds`
- `projects`
- `ledger_entries` (append-only)
- `transactions`
- `users`
- `campaigns`
- `businesses`
- `checkpoints`

### Ledger Table (Critical)

```sql
CREATE TABLE ledger_entries (
    id              VARCHAR(20) PRIMARY KEY,
    organisation_id VARCHAR(20) NOT NULL REFERENCES organisations(id),
    type            VARCHAR(50) NOT NULL,
    amount          BIGINT NOT NULL,
    currency        VARCHAR(3) NOT NULL,
    visibility      VARCHAR(30) NOT NULL,
    metadata        JSONB NOT NULL DEFAULT '{}',
    prev_entry_hash VARCHAR(71),
    entry_hash      VARCHAR(71) NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_hash CHECK (entry_hash ~ '^sha256:[a-f0-9]{64}$')
);

-- CRITICAL: Prevent modification
CREATE OR REPLACE FUNCTION prevent_ledger_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Ledger entries cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ledger_no_update
    BEFORE UPDATE ON ledger_entries
    FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();

CREATE TRIGGER ledger_no_delete
    BEFORE DELETE ON ledger_entries
    FOR EACH ROW EXECUTE FUNCTION prevent_ledger_modification();

-- CRITICAL: Validate hash chain on INSERT (defense-in-depth)
CREATE OR REPLACE FUNCTION validate_chain_on_insert()
RETURNS TRIGGER AS $$
DECLARE
    actual_prev_hash TEXT;
BEGIN
    -- Get the actual latest entry for this organisation
    SELECT entry_hash INTO actual_prev_hash
    FROM ledger_entries
    WHERE organisation_id = NEW.organisation_id
    ORDER BY created_at DESC, id DESC
    LIMIT 1;

    -- First entry for org: prev_entry_hash should be NULL
    -- Subsequent entries: prev_entry_hash should match actual previous
    IF actual_prev_hash IS NULL THEN
        IF NEW.prev_entry_hash IS NOT NULL THEN
            RAISE EXCEPTION 'First entry for organisation must have NULL prev_entry_hash';
        END IF;
    ELSE
        IF NEW.prev_entry_hash IS DISTINCT FROM actual_prev_hash THEN
            RAISE EXCEPTION 'prev_entry_hash mismatch. Expected: %, Got: %',
                actual_prev_hash, NEW.prev_entry_hash;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ledger_validate_chain
    BEFORE INSERT ON ledger_entries
    FOR EACH ROW EXECUTE FUNCTION validate_chain_on_insert();
```

### Row-Level Security

```sql
-- Enable RLS
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their organisation's data
CREATE POLICY org_isolation ON ledger_entries
    FOR ALL
    USING (organisation_id = current_setting('app.current_org_id')::text);

-- Application sets context before queries
SET app.current_org_id = 'org_xyz789';
```

## Migrations

Using Alembic:

```python
# migrations/env.py
from alembic import context
from sqlalchemy import engine_from_config
from amply.db.base import Base

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=Base.metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()
```

**Migration workflow**:
```bash
# Create migration
alembic revision --autogenerate -m "Add campaign table"

# Review generated migration
# Apply to staging first
alembic upgrade head

# Apply to production
alembic upgrade head
```

## Connection Management

### Connection Pooling

Application uses SQLAlchemy async with connection pooling:

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

engine = create_async_engine(
    settings.database_url,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,        # Check connection health
    pool_recycle=3600,         # Recycle connections hourly
)

async_session = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)
```

### Connection String

```
postgresql+asyncpg://user:password@host:5432/amply?sslmode=require
```

Stored in AWS Secrets Manager.

## Backup & Recovery

### Automated Backups

- Daily snapshots at 03:00 UTC
- 7-day retention
- Point-in-time recovery enabled (5-minute granularity)

### Manual Snapshots

```bash
# Create snapshot before major changes
aws rds create-db-snapshot \
  --db-instance-identifier amply-prod \
  --db-snapshot-identifier amply-prod-pre-migration-2025-01-15
```

### Disaster Recovery

**RTO**: 4 hours
**RPO**: 5 minutes (point-in-time recovery)

Recovery procedure:
1. Restore from snapshot or point-in-time
2. Update DNS/connection strings
3. Verify data integrity
4. Resume application

## Read Replicas

For scaling read-heavy workloads:

```yaml
# Read replica configuration
SourceDBInstanceIdentifier: amply-prod
DBInstanceClass: db.t3.small
MultiAZ: false                 # Replica doesn't need multi-AZ

# Application uses read replica for:
# - Public ledger queries
# - Reporting
# - Analytics
```

Connection routing in application:

```python
# Write to primary
primary_engine = create_async_engine(settings.database_url)

# Read from replica (for read-heavy operations)
replica_engine = create_async_engine(settings.database_replica_url)

async def get_ledger_entries(org_id: str):
    # Use replica for read-only queries
    async with AsyncSession(replica_engine) as session:
        return await session.execute(
            select(LedgerEntry).where(...)
        )
```

## Monitoring

### CloudWatch Metrics

- CPUUtilization
- FreeableMemory
- DatabaseConnections
- ReadIOPS / WriteIOPS
- ReadLatency / WriteLatency
- FreeStorageSpace

### Alarms

```yaml
# High CPU
- AlarmName: rds-amply-high-cpu
  MetricName: CPUUtilization
  Threshold: 80
  Period: 300
  EvaluationPeriods: 3

# Low storage
- AlarmName: rds-amply-low-storage
  MetricName: FreeStorageSpace
  Threshold: 10737418240    # 10 GB
  ComparisonOperator: LessThanThreshold

# High connections
- AlarmName: rds-amply-high-connections
  MetricName: DatabaseConnections
  Threshold: 180            # 90% of max
```

### Performance Insights

Enabled for query analysis:
- Top SQL queries by load
- Wait events
- Database load

### Slow Query Log

```sql
-- Queries logged to CloudWatch
-- log_min_duration_statement = 1000 (1 second)
```

## Security

### Encryption

- **At rest**: AWS KMS (default key or CMK)
- **In transit**: SSL/TLS required

```python
# Connection string enforces SSL
database_url = "postgresql://...?sslmode=require"
```

### Network Security

- Private subnet only (no public access)
- Security group allows only ECS tasks
- No public IP

### Credentials

- Master password in Secrets Manager
- Application user with limited privileges
- Separate read-only user for replicas

```sql
-- Application user (limited privileges)
CREATE USER amply_app WITH PASSWORD '...';
GRANT CONNECT ON DATABASE amply TO amply_app;
GRANT USAGE ON SCHEMA public TO amply_app;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA public TO amply_app;
GRANT UPDATE ON transactions, users, organisations, ... TO amply_app;
-- Note: No UPDATE on ledger_entries (enforced by trigger anyway)

-- Read-only user
CREATE USER amply_readonly WITH PASSWORD '...';
GRANT CONNECT ON DATABASE amply TO amply_readonly;
GRANT USAGE ON SCHEMA public TO amply_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO amply_readonly;
```

## Maintenance

### Updates

- Minor version updates: Automatic
- Major version updates: Manual (with testing)

### Vacuuming

PostgreSQL auto-vacuum handles routine maintenance. Monitor for:
- Dead tuples
- Table bloat
- Index bloat

---

**Related:**
- [AWS Overview](./overview.md)
- [Backend Services](../amply-backend/services.md)
- [Verification CLI](../amply-verify/overview.md)
