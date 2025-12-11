---
sidebar_position: 7
---

# SES
*Transactional Email*

Amazon Simple Email Service (SES) sends transactional emails.

## Email Types

| Type | Example | Priority |
|------|---------|----------|
| **Receipts** | Donation confirmation | High |
| **Notifications** | Campaign updates | Medium |
| **Account** | Password reset, verification | High |
| **Reports** | Weekly transparency reports | Low |

## Configuration

### Domain Verification

```
Domain: amply-impact.org
DKIM: Enabled
SPF: Configured
DMARC: Configured
```

DNS records:
```
# DKIM
selector1._domainkey.amply-impact.org CNAME selector1.dkim.amazonses.com
selector2._domainkey.amply-impact.org CNAME selector2.dkim.amazonses.com
selector3._domainkey.amply-impact.org CNAME selector3.dkim.amazonses.com

# SPF (add to existing)
amply-impact.org TXT "v=spf1 include:amazonses.com ~all"

# DMARC
_dmarc.amply-impact.org TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@amply-impact.org"
```

### Sending Identity

```yaml
IdentityType: DOMAIN
Identity: amply-impact.org
ConfigurationSetName: amply-emails
```

### Configuration Set

```yaml
ConfigurationSetName: amply-emails

EventDestinations:
  # Track bounces and complaints
  - EventDestinationName: feedback
    Enabled: true
    MatchingEventTypes:
      - BOUNCE
      - COMPLAINT
    CloudWatchDestination:
      DimensionConfigurations:
        - DimensionName: EmailType
          DimensionValueSource: MESSAGE_TAG
```

## Email Templates

### Donation Receipt

```json
{
  "TemplateName": "donation-receipt",
  "SubjectPart": "Thank you for your donation to {{organisation_name}}",
  "HtmlPart": "<!DOCTYPE html>...",
  "TextPart": "Thank you for your donation..."
}
```

### Password Reset

```json
{
  "TemplateName": "password-reset",
  "SubjectPart": "Reset your Amply password",
  "HtmlPart": "...",
  "TextPart": "..."
}
```

## Implementation

### Email Service

```python
# lib/email.py
import boto3
from jinja2 import Environment, PackageLoader

ses = boto3.client('ses', region_name='eu-central-1')
jinja = Environment(loader=PackageLoader('amply', 'templates/email'))

class EmailService:
    FROM_ADDRESS = "Amply <noreply@amply-impact.org>"

    async def send_email(
        self,
        to: str,
        template: str,
        context: dict,
        tags: dict | None = None
    ) -> str:
        """Send templated email."""
        # Render templates
        html_template = jinja.get_template(f"{template}.html")
        text_template = jinja.get_template(f"{template}.txt")

        html_body = html_template.render(**context)
        text_body = text_template.render(**context)

        # Get subject from template or context
        subject = context.get('subject', self._get_subject(template, context))

        response = ses.send_email(
            Source=self.FROM_ADDRESS,
            Destination={'ToAddresses': [to]},
            Message={
                'Subject': {'Data': subject},
                'Body': {
                    'Html': {'Data': html_body},
                    'Text': {'Data': text_body}
                }
            },
            ConfigurationSetName='amply-emails',
            Tags=[
                {'Name': 'EmailType', 'Value': template},
                *[{'Name': k, 'Value': v} for k, v in (tags or {}).items()]
            ]
        )

        return response['MessageId']

    async def send_donation_receipt(
        self,
        to: str,
        donation: Donation,
        organisation: Organisation
    ) -> str:
        """Send donation receipt."""
        return await self.send_email(
            to=to,
            template='donation-receipt',
            context={
                'donor_name': donation.donor_name,
                'amount': format_currency(donation.amount, donation.currency),
                'organisation_name': organisation.name,
                'donation_id': donation.id,
                'date': donation.created_at.strftime('%Y-%m-%d'),
                'verify_url': f"https://amply-impact.org/public/verify/{donation.id}"
            },
            tags={'donation_id': donation.id}
        )
```

### Celery Tasks

```python
# jobs/email.py
from amply.lib.email import EmailService

email_service = EmailService()

@app.task(bind=True, max_retries=3)
def send_email(
    self,
    to: str,
    template: str,
    context: dict
) -> str:
    """Send email via SES."""
    try:
        return email_service.send_email(to, template, context)
    except Exception as e:
        raise self.retry(exc=e, countdown=60 * (self.request.retries + 1))

@app.task
def send_donation_receipt(donation_id: str):
    """Send donation receipt email."""
    donation = get_donation(donation_id)
    organisation = get_organisation(donation.organisation_id)
    donor = get_donor(donation.donor_id)

    if donor and donor.email:
        email_service.send_donation_receipt(
            to=donor.email,
            donation=donation,
            organisation=organisation
        )
```

## Templates

### Template Structure

```
src/amply/templates/email/
├── base.html                    # Base HTML template
├── base.txt                     # Base text template
├── donation-receipt.html
├── donation-receipt.txt
├── password-reset.html
├── password-reset.txt
├── campaign-update.html
├── campaign-update.txt
├── recurring-reminder.html
└── recurring-reminder.txt
```

### Base Template

```html
<!-- base.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: #000; color: #fff; padding: 20px; }
    .content { padding: 20px; }
    .footer { padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://amply-impact.org/logo.png" alt="Amply" height="30">
    </div>
    <div class="content">
      {% block content %}{% endblock %}
    </div>
    <div class="footer">
      {% block footer %}
      <p>Amply - Ultra-transparent charitable giving</p>
      <p><a href="https://amply-impact.org">amply-impact.org</a></p>
      {% endblock %}
    </div>
  </div>
</body>
</html>
```

## Bounce/Complaint Handling

### SNS Notification

```yaml
# SNS topic for SES feedback
TopicName: amply-ses-feedback

Subscription:
  Protocol: https
  Endpoint: https://api.amply-impact.org/v1/webhooks/ses-feedback
```

### Webhook Handler

```python
@router.post("/webhooks/ses-feedback")
async def ses_feedback_webhook(request: Request):
    """Handle SES bounce/complaint notifications."""
    body = await request.json()

    message_type = body.get('Type')

    if message_type == 'SubscriptionConfirmation':
        # Confirm SNS subscription
        requests.get(body['SubscribeURL'])
        return {"status": "confirmed"}

    if message_type == 'Notification':
        message = json.loads(body['Message'])
        notification_type = message.get('notificationType')

        if notification_type == 'Bounce':
            await handle_bounce(message['bounce'])
        elif notification_type == 'Complaint':
            await handle_complaint(message['complaint'])

    return {"status": "ok"}

async def handle_bounce(bounce: dict):
    """Handle bounced email."""
    for recipient in bounce.get('bouncedRecipients', []):
        email = recipient['emailAddress']
        # Mark email as invalid
        await mark_email_bounced(email)

async def handle_complaint(complaint: dict):
    """Handle spam complaint."""
    for recipient in complaint.get('complainedRecipients', []):
        email = recipient['emailAddress']
        # Unsubscribe user
        await unsubscribe_email(email)
```

## Monitoring

### Metrics

- Send rate
- Bounce rate
- Complaint rate
- Delivery rate

### Alarms

```yaml
- AlarmName: ses-high-bounce-rate
  MetricName: Reputation.BounceRate
  Threshold: 0.05    # 5%

- AlarmName: ses-high-complaint-rate
  MetricName: Reputation.ComplaintRate
  Threshold: 0.001   # 0.1%
```

## Cost

- First 62,000 emails/month: Free (from EC2/Lambda)
- After: $0.10 per 1,000 emails

Estimated: ~$5/month at typical volume

---

**Related:**
- [AWS Overview](./overview.md)
- [Background Jobs](../amply-backend/jobs.md)
