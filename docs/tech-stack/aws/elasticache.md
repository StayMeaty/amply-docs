---
sidebar_position: 6
---

# ElastiCache Redis
*Caching and Session Storage*

Amazon ElastiCache provides Redis for caching, sessions, and rate limiting.

## Configuration

### Cluster

```yaml
CacheClusterId: amply-redis-prod
Engine: redis
EngineVersion: 7.0
CacheNodeType: cache.t3.micro      # Start small
NumCacheNodes: 1                    # Single node (upgrade to cluster for HA)

# Network
CacheSubnetGroupName: amply-redis-subnet
SecurityGroupIds:
  - sg-redis

# Encryption
AtRestEncryptionEnabled: true
TransitEncryptionEnabled: true

# Maintenance
PreferredMaintenanceWindow: sun:05:00-sun:06:00
SnapshotRetentionLimit: 7
SnapshotWindow: 04:00-05:00

# Parameters
CacheParameterGroupName: amply-redis-params
```

### Parameter Group

```yaml
CacheParameterGroupFamily: redis7

Parameters:
  # Memory management
  maxmemory-policy: volatile-lru    # Evict keys with TTL first

  # Connections
  timeout: 300                       # Close idle connections

  # Persistence (for session recovery)
  appendonly: yes
  appendfsync: everysec
```

## Use Cases

### 1. Session Storage

User sessions with security context:

```python
import redis.asyncio as redis
from fastapi import Request
import json

redis_client = redis.from_url(settings.redis_url)

SESSION_PREFIX = "session:"
USER_SESSIONS_PREFIX = "user_sessions:"  # Index of sessions per user
SESSION_TTL = 86400 * 7  # 7 days

async def create_session(
    user_id: str,
    security_stamp: str,
    client_info: dict,
    ip_binding: str = "country"
) -> str:
    """
    Create new session with security context.

    Session data includes:
    - security_stamp: Copied from user, used for validation
    - client info: IP, user-agent, fingerprint for tracking
    - ip_binding: Level of IP validation (none/country/subnet/strict)
    """
    session_id = generate_id("ses")  # ses_xxx format
    session_data = {
        "user_id": user_id,
        "security_stamp": security_stamp,
        "ip_binding": ip_binding,
        "created_at": datetime.utcnow().isoformat(),
        "last_activity": datetime.utcnow().isoformat(),
        "expires_at": (datetime.utcnow() + timedelta(days=7)).isoformat(),
        "client": client_info,  # ip_address, ip_country, user_agent, fingerprint
    }

    # Store session data
    await redis_client.setex(
        f"{SESSION_PREFIX}{session_id}",
        SESSION_TTL,
        json.dumps(session_data)
    )

    # Add to user's session index (for "active sessions" listing)
    await redis_client.sadd(f"{USER_SESSIONS_PREFIX}{user_id}", session_id)

    return session_id

async def get_session(session_id: str) -> dict | None:
    """Get session data for validation."""
    data = await redis_client.get(f"{SESSION_PREFIX}{session_id}")
    if data:
        return json.loads(data)
    return None

async def update_session_activity(session_id: str):
    """Update last activity timestamp."""
    data = await redis_client.get(f"{SESSION_PREFIX}{session_id}")
    if data:
        session = json.loads(data)
        session["last_activity"] = datetime.utcnow().isoformat()
        ttl = await redis_client.ttl(f"{SESSION_PREFIX}{session_id}")
        await redis_client.setex(
            f"{SESSION_PREFIX}{session_id}",
            ttl,
            json.dumps(session)
        )

async def delete_session(session_id: str, user_id: str):
    """Delete session (logout)."""
    await redis_client.delete(f"{SESSION_PREFIX}{session_id}")
    await redis_client.srem(f"{USER_SESSIONS_PREFIX}{user_id}", session_id)

async def get_user_sessions(user_id: str) -> list[dict]:
    """Get all active sessions for user (for "Active Sessions" UI)."""
    session_ids = await redis_client.smembers(f"{USER_SESSIONS_PREFIX}{user_id}")
    sessions = []
    for sid in session_ids:
        data = await redis_client.get(f"{SESSION_PREFIX}{sid}")
        if data:
            session = json.loads(data)
            session["session_id"] = sid
            sessions.append(session)
        else:
            # Clean up stale index entry
            await redis_client.srem(f"{USER_SESSIONS_PREFIX}{user_id}", sid)
    return sessions

async def delete_all_user_sessions(user_id: str):
    """Delete all sessions for user (logout everywhere)."""
    session_ids = await redis_client.smembers(f"{USER_SESSIONS_PREFIX}{user_id}")
    if session_ids:
        await redis_client.delete(
            *[f"{SESSION_PREFIX}{sid}" for sid in session_ids]
        )
        await redis_client.delete(f"{USER_SESSIONS_PREFIX}{user_id}")
```

### 2. Rate Limiting

API rate limiting:

```python
RATE_LIMIT_PREFIX = "rate:"

async def check_rate_limit(
    key: str,
    limit: int,
    window: int = 60
) -> tuple[bool, int]:
    """
    Check if request is within rate limit.

    Returns: (allowed, remaining)
    """
    redis_key = f"{RATE_LIMIT_PREFIX}{key}"

    # Increment counter
    current = await redis_client.incr(redis_key)

    # Set expiry on first request
    if current == 1:
        await redis_client.expire(redis_key, window)

    remaining = max(0, limit - current)
    allowed = current <= limit

    return allowed, remaining

# Usage in middleware
async def rate_limit_middleware(request: Request, call_next):
    api_key = get_api_key(request)
    allowed, remaining = await check_rate_limit(
        f"api:{api_key}",
        limit=300,
        window=60
    )

    if not allowed:
        raise HTTPException(429, "Rate limit exceeded")

    response = await call_next(request)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    return response
```

### 3. Caching

Cache expensive queries:

```python
CACHE_PREFIX = "cache:"

async def cached(
    key: str,
    ttl: int = 300
):
    """Cache decorator."""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            cache_key = f"{CACHE_PREFIX}{key}"

            # Try cache first
            cached_value = await redis_client.get(cache_key)
            if cached_value:
                return json.loads(cached_value)

            # Compute and cache
            result = await func(*args, **kwargs)
            await redis_client.setex(
                cache_key,
                ttl,
                json.dumps(result)
            )
            return result
        return wrapper
    return decorator

# Usage
@cached("org:stats:{org_id}", ttl=300)
async def get_organisation_stats(org_id: str) -> dict:
    """Get organisation statistics (cached for 5 min)."""
    # Expensive database query
    return await compute_stats(org_id)
```

### 4. Celery Result Backend

Store task results:

```python
# In Celery config
app.conf.update(
    result_backend=settings.redis_url,
    result_expires=3600,  # 1 hour
)
```

## Connection Management

```python
# lib/redis.py
import redis.asyncio as redis
from contextlib import asynccontextmanager

pool = redis.ConnectionPool.from_url(
    settings.redis_url,
    max_connections=20,
    decode_responses=True
)

@asynccontextmanager
async def get_redis():
    """Get Redis connection from pool."""
    client = redis.Redis(connection_pool=pool)
    try:
        yield client
    finally:
        await client.close()

# Usage
async with get_redis() as r:
    await r.set("key", "value")
```

## Security

### Network

- Private subnet only
- Security group allows only ECS tasks

### Encryption

- At-rest encryption enabled
- In-transit encryption (TLS) enabled

### Authentication

Redis AUTH with token:

```python
redis_url = "rediss://:auth_token@redis-host:6379/0"
```

Token stored in Secrets Manager.

## Monitoring

### CloudWatch Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|-----------------|
| CPUUtilization | CPU usage | > 80% |
| FreeableMemory | Available memory | < 100 MB |
| CurrConnections | Active connections | > 100 |
| Evictions | Keys evicted | > 100/min |
| CacheHitRate | Cache hit ratio | < 90% |

### Alarms

```yaml
- AlarmName: redis-amply-high-cpu
  MetricName: CPUUtilization
  Threshold: 80
  EvaluationPeriods: 3

- AlarmName: redis-amply-low-memory
  MetricName: FreeableMemory
  Threshold: 100000000    # 100 MB
  ComparisonOperator: LessThanThreshold

- AlarmName: redis-amply-high-evictions
  MetricName: Evictions
  Threshold: 100
  Period: 60
```

## Failover

### Single Node (Current)

- Automatic recovery on failure
- Brief downtime during recovery
- Session data may be lost

### Cluster Mode (Future)

For high availability:

```yaml
ReplicationGroupDescription: amply-redis-cluster
NumNodeGroups: 1
ReplicasPerNodeGroup: 1           # 1 primary + 1 replica
AutomaticFailoverEnabled: true
```

Benefits:
- Automatic failover
- No data loss
- Higher availability

## Cost

| Configuration | Monthly Cost |
|---------------|--------------|
| cache.t3.micro (1 node) | ~$13 |
| cache.t3.small (1 node) | ~$25 |
| cache.t3.micro (1+1 replica) | ~$26 |

---

**Related:**
- [AWS Overview](./overview.md)
- [Backend Overview](../amply-backend/overview.md)
- [ECS](./ecs.md)
