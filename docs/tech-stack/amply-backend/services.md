---
sidebar_position: 2
---

# Services
*Business Logic Layer*

Services contain the business logic, called by API routes.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    API Layer                         │
│              (FastAPI Routes + Deps)                 │
└─────────────────────────┬───────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────┐
│                  Service Layer                       │
│                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  Ledger  │ │ Donations│ │  Stripe  │            │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘            │
│       │            │            │                   │
│  ┌────┴─────┐ ┌────┴─────┐                         │
│  │   Auth   │ │   Orgs   │                         │
│  └──────────┘ └──────────┘                         │
└─────────────────────────┬───────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────┐
│                  Database Layer                      │
│              (SQLAlchemy Models)                     │
└─────────────────────────────────────────────────────┘
```

---

## Ledger Service

**Location**: `src/amply/services/ledger.py`

**Purpose**: Tamper-evident financial record keeping with hash chain integrity.

### Hash Chain

```python
# lib/crypto.py
import hashlib
import json
from datetime import datetime

def canonical_json(obj: dict) -> str:
    """Produce canonical JSON string for hashing."""
    return json.dumps(obj, sort_keys=True, separators=(',', ':'), ensure_ascii=False)

def compute_entry_hash(
    entry_id: str,
    timestamp: datetime,
    organisation_id: str,
    entry_type: str,
    amount: int,
    currency: str,
    metadata: dict,
    prev_entry_hash: str | None,
) -> str:
    """Compute SHA-256 hash for a ledger entry."""
    timestamp_str = timestamp.strftime('%Y-%m-%dT%H:%M:%SZ')

    parts = [
        entry_id,
        timestamp_str,
        organisation_id,
        entry_type,
        str(amount),
        currency.upper(),
        canonical_json(metadata),
        prev_entry_hash if prev_entry_hash else 'null',
    ]

    input_string = '|'.join(parts)
    hash_hex = hashlib.sha256(input_string.encode('utf-8')).hexdigest()

    return f'sha256:{hash_hex}'
```

### Create Entry

```python
# services/ledger.py
async def create_entry(
    db: AsyncSession,
    organisation_id: str,
    entry_type: str,
    amount: int,
    currency: str,
    metadata: dict,
) -> LedgerEntry:
    """Create ledger entry with hash chain integrity."""
    # Advisory lock per-organisation to prevent race conditions
    # Uses parameterized query to prevent SQL injection
    await db.execute(
        text("SELECT pg_advisory_xact_lock(hashtext(:org_id))"),
        {"org_id": organisation_id}
    )

    # Get previous entry
    prev = await get_latest_entry(db, organisation_id)
    prev_hash = prev.entry_hash if prev else None

    entry_id = generate_id("led")
    timestamp = datetime.utcnow()

    # Compute hash
    entry_hash = compute_entry_hash(
        entry_id=entry_id,
        timestamp=timestamp,
        organisation_id=organisation_id,
        entry_type=entry_type,
        amount=amount,
        currency=currency,
        metadata=metadata,
        prev_entry_hash=prev_hash,
    )

    entry = LedgerEntry(
        id=entry_id,
        organisation_id=organisation_id,
        type=entry_type,
        amount=amount,
        currency=currency,
        metadata=metadata,
        prev_entry_hash=prev_hash,
        entry_hash=entry_hash,
        created_at=timestamp,
    )
    db.add(entry)
    return entry
```

### Verify Chain

```python
async def verify_chain(
    db: AsyncSession,
    organisation_id: str,
) -> ChainVerificationResult:
    """Verify hash chain integrity for an organisation."""
    entries = await get_all_entries(db, organisation_id)

    for i, entry in enumerate(entries):
        # Verify entry's own hash
        expected_hash = compute_entry_hash(
            entry_id=entry.id,
            timestamp=entry.created_at,
            organisation_id=entry.organisation_id,
            entry_type=entry.type,
            amount=entry.amount,
            currency=entry.currency,
            metadata=entry.metadata,
            prev_entry_hash=entry.prev_entry_hash,
        )

        if entry.entry_hash != expected_hash:
            return ChainVerificationResult(
                valid=False,
                broken_at=entry.id,
                error="hash_mismatch",
            )

        # Verify link to previous
        if i > 0:
            prev_entry = entries[i - 1]
            if entry.prev_entry_hash != prev_entry.entry_hash:
                return ChainVerificationResult(
                    valid=False,
                    broken_at=entry.id,
                    error="chain_link_broken",
                )

    return ChainVerificationResult(valid=True, entry_count=len(entries))
```

### Entry Types

```python
class EntryType(str, Enum):
    DONATION_RECEIVED = "donation_received"
    EXPENSE = "expense"
    TRANSFER_IN = "transfer_in"
    TRANSFER_OUT = "transfer_out"
    REFUND_ISSUED = "refund_issued"
    FEE = "fee"
```

---

## Donations Service

**Location**: `src/amply/services/donations.py`

**Purpose**: Donation lifecycle from payment to ledger.

### Create Donation

```python
async def create_donation(
    db: AsyncSession,
    data: DonationCreate,
) -> DonationResult:
    """Create a new donation (pending payment)."""
    organisation = await get_organisation(db, data.organisation_id)
    if not organisation.stripe_account_id:
        raise ValueError("Organisation not connected to Stripe")

    donation_id = generate_id("don")

    # Create PaymentIntent on connected account
    payment_intent = await stripe_service.create_payment_intent(
        amount=data.amount,
        currency=data.currency,
        stripe_account_id=organisation.stripe_account_id,
        metadata={"donation_id": donation_id},
    )

    donation = Donation(
        id=donation_id,
        organisation_id=data.organisation_id,
        fund_id=data.fund_id,
        amount=data.amount,
        currency=data.currency,
        donor_email=data.donor_email,
        donor_name=data.donor_name,
        stripe_payment_intent_id=payment_intent.id,
        status="pending",
    )
    db.add(donation)
    await db.commit()

    return DonationResult(
        id=donation.id,
        client_secret=payment_intent.client_secret,
        status="pending",
    )
```

### Complete Donation

```python
async def complete_donation(
    db: AsyncSession,
    payment_intent_id: str,
) -> Donation:
    """Complete donation after successful Stripe payment."""
    donation = await get_donation_by_payment_intent(db, payment_intent_id)
    if not donation:
        raise ValueError("Donation not found")

    if donation.status == "completed":
        return donation  # Idempotent

    async with db.begin():
        # Create ledger entry with Stripe reference for third-party verification
        entry = await ledger_service.create_entry(
            db,
            organisation_id=donation.organisation_id,
            entry_type="donation_received",
            amount=donation.amount,
            currency=donation.currency,
            metadata={
                "donation_id": donation.id,
                "stripe_payment_intent_id": donation.stripe_payment_intent_id,  # Third-party anchor
                "donor_name": donation.donor_name,
            },
        )

        # Update donation
        donation.status = "completed"
        donation.ledger_entry_id = entry.id
        donation.completed_at = datetime.utcnow()

    return donation
```

### Donation Flow

```
1. POST /donations
   └── Create Donation (pending)
   └── Create Stripe PaymentIntent
   └── Return client_secret

2. Frontend: stripe.confirmPayment()
   └── Stripe processes card

3. POST /webhooks/stripe (payment_intent.succeeded)
   └── complete_donation()
   └── Create ledger entry
   └── Update donation status

4. Donor sees confirmation
   └── Transaction visible in public ledger
```

---

## Stripe Service

**Location**: `src/amply/services/stripe.py`

**Purpose**: Stripe Connect integration for payments.

### Create Payment Intent

```python
async def create_payment_intent(
    amount: int,
    currency: str,
    stripe_account_id: str,
    metadata: dict,
) -> stripe.PaymentIntent:
    """Create PaymentIntent on connected account (direct charge)."""
    return stripe.PaymentIntent.create(
        amount=amount,
        currency=currency.lower(),
        stripe_account=stripe_account_id,  # Direct charge
        metadata=metadata,
        automatic_payment_methods={"enabled": True},
    )
```

### Handle Webhook

```python
async def handle_webhook(
    payload: bytes,
    signature: str,
) -> None:
    """Handle incoming Stripe webhook.

    Security: Verifies Stripe-Signature header to ensure authenticity.
    Idempotency: complete_donation() checks status before processing.
    """
    # CRITICAL: Verify webhook signature to prevent spoofing
    try:
        event = stripe.Webhook.construct_event(
            payload,
            signature,
            settings.stripe_webhook_secret,
        )
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event.type == "payment_intent.succeeded":
        payment_intent = event.data.object
        # Idempotent: returns existing donation if already completed
        await donations_service.complete_donation(
            db, payment_intent.id
        )

    elif event.type == "payment_intent.payment_failed":
        payment_intent = event.data.object
        await donations_service.fail_donation(
            db, payment_intent.id, payment_intent.last_payment_error
        )
```

### Organisation Onboarding

```python
def get_connect_url(organisation_id: str, user_id: str) -> str:
    """Generate Stripe Connect OAuth URL."""
    state = generate_state_token(organisation_id, user_id)

    return f"https://connect.stripe.com/oauth/authorize?" + urlencode({
        "response_type": "code",
        "client_id": settings.stripe_client_id,
        "scope": "read_write",
        "redirect_uri": f"{settings.api_url}/stripe/callback",
        "state": state,
    })

async def complete_connect(code: str, state: str) -> Organisation:
    """Complete Stripe Connect OAuth flow."""
    organisation_id, user_id = verify_state_token(state)

    response = stripe.OAuth.token(grant_type="authorization_code", code=code)
    stripe_account_id = response["stripe_user_id"]

    organisation = await update_organisation(
        organisation_id,
        stripe_account_id=stripe_account_id,
        stripe_connected_at=datetime.utcnow(),
    )

    return organisation
```

---

## Auth Service

**Location**: `src/amply/services/auth.py`

**Purpose**: User authentication and secure session management.

### Session Security Model

Sessions are protected by multiple security layers:

| Layer | Purpose | Mechanism |
|-------|---------|-----------|
| Security stamps | Invalidate on password change | Stamp comparison |
| IP binding | Detect location anomalies | Configurable strictness |
| User-agent tracking | Identify devices | Fingerprint logging |
| Session revocation | User/admin control | Delete or rotate stamp |

### Login (with Security Features)

```python
async def login(
    db: AsyncSession,
    email: str,
    password: str,
    request: Request,
) -> Session:
    """Authenticate user and create secure session."""
    user = await get_user_by_email(db, email)
    if not user or not verify_password(password, user.password_hash):
        await log_security_event(None, "login_failed", {"email": email})
        raise AuthenticationError("Invalid credentials")

    # Parse client information
    client_info = parse_client_info(request)

    # Determine IP binding from user preferences
    ip_binding = user.security_settings.get("ip_binding", "country")

    # Create session with security context
    session_id = generate_id("ses")
    session_data = {
        "user_id": user.id,
        "security_stamp": user.security_stamp,  # Copy current stamp
        "ip_binding": ip_binding,
        "created_at": datetime.utcnow().isoformat(),
        "last_activity": datetime.utcnow().isoformat(),
        "expires_at": (datetime.utcnow() + timedelta(days=7)).isoformat(),
        "client": {
            "ip_address": client_info.ip_address,
            "ip_country": client_info.ip_country,
            "ip_city": client_info.ip_city,
            "user_agent": client_info.user_agent,
            "browser_family": client_info.browser_family,
            "os_family": client_info.os_family,
            "device_type": client_info.device_type,
            "fingerprint": client_info.fingerprint,
        },
    }

    # Store in Redis with TTL
    await redis.setex(
        f"session:{session_id}",
        86400 * 7,  # 7 days
        json.dumps(session_data)
    )

    # Add to user's session index
    await redis.sadd(f"user_sessions:{user.id}", session_id)

    # Check for new device notification
    if await is_new_device(user.id, client_info.fingerprint):
        await send_new_device_notification(user, client_info)

    await log_security_event(user.id, "session_created", {"device": client_info.fingerprint})

    return Session(id=session_id, **session_data)
```

### Session Validation (Complete Pipeline)

```python
async def validate_session(
    session_id: str,
    request: Request,
) -> User | None:
    """
    Complete session validation with security checks.

    Checks: expiration, security stamp, IP binding, user-agent.
    """
    # 1. Fetch session
    session = await get_session(session_id)
    if not session:
        return None

    # 2. Check expiration
    if datetime.fromisoformat(session["expires_at"]) < datetime.utcnow():
        await delete_session(session_id, session["user_id"])
        return None

    # 3. Security stamp validation (critical)
    user = await get_user(session["user_id"])
    if not user:
        await delete_session(session_id, session["user_id"])
        return None

    current_stamp = await get_user_security_stamp(user.id)
    if session["security_stamp"] != current_stamp:
        # Password changed or "logout everywhere" triggered
        await delete_session(session_id, user.id)
        await log_security_event(user.id, "session_invalidated_stamp", session_id)
        return None

    # 4. IP binding validation
    current_ip = get_client_ip(request)
    if not validate_ip_binding(session, current_ip):
        await log_security_event(user.id, "ip_binding_violation", {
            "session_id": session_id,
            "original_ip": session["client"]["ip_address"],
            "current_ip": current_ip,
        })
        raise IPBindingViolation("Session IP mismatch")

    # 5. User-agent anomaly detection (soft check)
    current_ua = parse_client_info(request)
    if current_ua.fingerprint != session["client"]["fingerprint"]:
        await log_security_event(user.id, "ua_change_detected", {
            "session_id": session_id,
            "original": session["client"]["fingerprint"],
            "current": current_ua.fingerprint,
        })
        # Log but don't block - could be browser update

    # 6. Update last activity
    await update_session_activity(session_id)

    return user
```

### Security Stamp Management

```python
def generate_security_stamp() -> str:
    """Generate random security stamp."""
    return secrets.token_urlsafe(32)

async def rotate_security_stamp(
    db: AsyncSession,
    user_id: str,
    reason: str,
):
    """
    Rotate user's security stamp, invalidating ALL sessions.

    Called on: password change, email change, "logout everywhere",
               2FA changes, admin action.
    """
    new_stamp = generate_security_stamp()

    await db.execute(
        update(User)
        .where(User.id == user_id)
        .values(security_stamp=new_stamp)
    )
    await db.commit()

    # Invalidate cached stamp
    await redis.delete(f"user_stamp:{user_id}")

    await log_security_event(user_id, "security_stamp_rotated", {"reason": reason})

async def get_user_security_stamp(user_id: str) -> str:
    """Get user's security stamp (cached for performance)."""
    cache_key = f"user_stamp:{user_id}"

    # Try cache first
    cached = await redis.get(cache_key)
    if cached:
        return cached

    # Fetch from database
    user = await get_user(user_id)
    stamp = user.security_stamp

    # Cache for 5 minutes
    await redis.setex(cache_key, 300, stamp)

    return stamp
```

### IP Binding Validation

```python
def validate_ip_binding(session: dict, current_ip: str) -> bool:
    """Validate request IP against session's binding policy."""
    binding = session.get("ip_binding", "country")
    original_ip = session["client"]["ip_address"]

    if binding == "none":
        return True

    if binding == "strict":
        return current_ip == original_ip

    if binding == "subnet":
        # Same /24 network
        return get_subnet(current_ip, 24) == get_subnet(original_ip, 24)

    if binding == "country":
        original_country = session["client"]["ip_country"]
        current_country = get_country_from_ip(current_ip)
        return current_country == original_country

    return True  # Unknown binding type, allow
```

### Session Revocation

```python
async def logout(session_id: str, user_id: str):
    """Log out current session."""
    await delete_session(session_id, user_id)
    await log_security_event(user_id, "session_revoked", session_id)

async def logout_everywhere(user_id: str, reason: str = "user_requested"):
    """Invalidate ALL user sessions by rotating security stamp."""
    await rotate_security_stamp(user_id, reason)
    # All sessions now invalid on next validation attempt

async def revoke_specific_session(user_id: str, target_session_id: str):
    """Revoke a specific session from 'Active Sessions' list."""
    session = await get_session(target_session_id)

    if not session or session["user_id"] != user_id:
        raise PermissionError("Cannot revoke this session")

    await delete_session(target_session_id, user_id)
    await log_security_event(user_id, "session_revoked", target_session_id)

async def delete_session(session_id: str, user_id: str):
    """Delete session from Redis."""
    await redis.delete(f"session:{session_id}")
    await redis.srem(f"user_sessions:{user_id}", session_id)
```

### Active Sessions List

```python
async def get_active_sessions(user_id: str, current_session_id: str) -> list[dict]:
    """Get all active sessions for user display."""
    session_ids = await redis.smembers(f"user_sessions:{user_id}")

    sessions = []
    for session_id in session_ids:
        session = await get_session(session_id)
        if session:
            sessions.append({
                "id": session_id,
                "device": f"{session['client']['browser_family']} on {session['client']['os_family']}",
                "device_type": session["client"]["device_type"],
                "location": session["client"].get("ip_city", session["client"]["ip_country"]),
                "ip_address": mask_ip(session["client"]["ip_address"]),
                "last_active": session["last_activity"],
                "created_at": session["created_at"],
                "is_current": session_id == current_session_id,
            })

    # Sort by last activity, current session first
    sessions.sort(key=lambda s: (not s["is_current"], s["last_active"]), reverse=True)

    return sessions
```

### Password Change (Triggers Stamp Rotation)

```python
async def change_password(
    db: AsyncSession,
    user_id: str,
    current_password: str,
    new_password: str,
    current_session_id: str,
):
    """Change password and invalidate all other sessions."""
    user = await get_user(user_id)

    if not verify_password(current_password, user.password_hash):
        raise AuthenticationError("Current password incorrect")

    # Update password
    new_hash = hash_password(new_password)
    await db.execute(
        update(User)
        .where(User.id == user_id)
        .values(password_hash=new_hash)
    )

    # Rotate security stamp (invalidates ALL sessions)
    await rotate_security_stamp(db, user_id, "password_changed")

    # Re-create current session with new stamp (keep user logged in)
    # ... session recreation logic ...

    await log_security_event(user_id, "password_changed", None)
```

---

## Organisations Service

**Location**: `src/amply/services/organisations.py`

**Purpose**: Organisation management.

### Create Organisation

```python
async def create_organisation(
    db: AsyncSession,
    data: OrganisationCreate,
    owner_user_id: str,
) -> Organisation:
    """Create new organisation with default fund."""
    org_id = generate_id("org")

    organisation = Organisation(
        id=org_id,
        name=data.name,
        legal_name=data.legal_name,
        country=data.country,
        status="pending",
    )
    db.add(organisation)

    # Create default fund
    fund = Fund(
        id=generate_id("fund"),
        organisation_id=org_id,
        name="General Fund",
        type="general",
    )
    db.add(fund)

    # Add owner
    membership = OrganisationMembership(
        user_id=owner_user_id,
        organisation_id=org_id,
        role="owner",
    )
    db.add(membership)

    await db.commit()
    return organisation
```

---

**Related:**
- [Backend Overview](./overview.md)
- [API Reference](./api.md)
- [Stripe Integration](../stripe/overview.md)
