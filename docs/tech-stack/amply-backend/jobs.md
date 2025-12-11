---
sidebar_position: 4
---

# Background Jobs
*Scheduled Tasks*

Minimal background processing for MVP.

## MVP Scope

For the initial release, background jobs are kept simple:

| Job | Schedule | Purpose |
|-----|----------|---------|
| Checkpoint generation | Daily 00:00 UTC | Compute and publish ledger checkpoint |

## Checkpoint Generation

The only critical scheduled job is daily checkpoint generation:

```python
# jobs/checkpoint.py
import boto3
from datetime import date
from amply.services.ledger import compute_cumulative_hash
from amply.config import settings

async def generate_daily_checkpoint(db: AsyncSession) -> Checkpoint:
    """Generate daily ledger checkpoint."""
    today = date.today()
    checkpoint_id = f"chk_{today.isoformat()}"

    # Compute cumulative hash over all entries
    cumulative_hash = await compute_cumulative_hash(db)

    # Get summary statistics
    stats = await get_ledger_stats(db)

    checkpoint = Checkpoint(
        id=checkpoint_id,
        checkpoint_date=today,
        cumulative_hash=cumulative_hash,
        entry_count=stats.entry_count,
        total_volume=stats.total_volume,
    )
    db.add(checkpoint)
    await db.commit()

    # Upload to S3
    s3 = boto3.client('s3')
    s3.put_object(
        Bucket=settings.s3_bucket,
        Key=f"checkpoints/{checkpoint_id}.json",
        Body=checkpoint.to_json(),
        ContentType="application/json",
    )

    return checkpoint
```

## Running Jobs

For MVP, use simple approaches:

### Option 1: Cron

```bash
# crontab
0 0 * * * /app/run_checkpoint.sh
```

### Option 2: AWS EventBridge

```yaml
# CloudFormation
CheckpointRule:
  Type: AWS::Events::Rule
  Properties:
    ScheduleExpression: "cron(0 0 * * ? *)"
    Targets:
      - Id: CheckpointLambda
        Arn: !GetAtt CheckpointFunction.Arn
```

### Option 3: APScheduler (In-Process)

```python
# main.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def start_scheduler():
    scheduler.add_job(
        generate_daily_checkpoint,
        trigger="cron",
        hour=0,
        minute=0,
    )
    scheduler.start()
```

## Future Expansion

When needed, add Celery + SQS for:

- Webhook dispatch and retries
- Email sending
- Report generation
- Recurring donation processing

For now, these operations run synchronously or are deferred.

---

**Related:**
- [Backend Overview](./overview.md)
- [AWS Infrastructure](../aws/overview.md)
