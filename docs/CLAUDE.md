# Amply Documentation

## Overview
Public documentation for Amply - an ultra-transparent donation platform where every cent is traceable. This documentation serves donors, organizations, businesses, developers, and the public as part of Amply's commitment to full transparency.

## Writing Principles
- **Reference, don't repeat**: When a concept is explained in one document, other documents should link to it rather than duplicate the explanation
- **Single source of truth**: Each concept has ONE canonical document that defines it
- **Cross-link liberally**: Help readers navigate by linking related concepts

## Document Structure
Every document follows this headline pattern:

```markdown
# Primary Headline
*Subtitle that adds context*

First paragraph of content...
```

**Rules:**
- **Primary headline**: Short, scannable, works in sidebar/navigation
- **Subtitle**: One line, adds human context, slightly warmer tone
- **Skip subtitle** for self-explanatory pages (intro, simple references)
- **Subtitle must add value** - not just restate the headline

**Examples:**
| Headline | Subtitle |
|----------|----------|
| Why Transparency Matters | *The Foundation of Everything We Do* |
| Verifying Amply's Data | *How Anyone Can Check the Math* |
| Why Effectiveness Matters | *Caring Isn't the Same as Helping* |

## Key Facts
- **Platform**: Docusaurus with English (default) and German locales
- **Sidebar**: Must be manually maintained in `/amply-docs/sidebars.ts`
- **Audience**: Donors (individuals), Organizations (nonprofits), Businesses (dual-role), Fundraisers, Developers, Public
- **Core principle**: Ultra-transparency - all docs publicly available
- **Classification**: UN SDGs (17 Sustainable Development Goals) used to categorize all causes
- **Effectiveness focus**: GiveWell-style impact evaluation approach
- **Platform vs. Recommendations (IMPORTANT)**: Amply is an OPEN PLATFORM but an EFFECTIVENESS ADVOCATE. Any verified nonprofit can use Amply's tools to collect donations—no gatekeeping based on impact metrics. However, when guiding donors, Amply researches, rates, and recommends organizations that maximize net-impact per dollar. Platform access is neutral; recommendations are effectiveness-guided. Donors always choose freely, but Amply helps them find where money goes furthest.
- **Key term**: "Ultra-pragmatic" - Amply's approach is realistic, efficient, accessible, not idealistic
- **Fee model (CRITICAL)**: Amply takes ZERO platform fees. Amply sustains itself through donations, like any other nonprofit. Only unavoidable third-party fees (e.g., Stripe payment processing) are passed through. This is a central differentiator.
- **Fee details**: Donors choose to cover fees (default/recommended) or have fees deducted. Bank transfers (SEPA/ACH) often fee-free. No payout fees—what's shown is what orgs receive. Canonical source: `transparency/pricing.md`
- **Privacy principle**: "Hide faces, not money." All transactions on ledger (including sensitive ones), but visibility levels control public detail. Sensitive data (HR, legal, security) can be aggregated or internal-only while still in hash chain. Canonical source: `transparency/privacy.md`
- **Typography**: Lexend (Google Font). Headlines: Thin/ExtraLight; Body: Regular; Wordmark "Amply": Black 900. Canonical source: `brand/typography.md`
- **Brand colors**: Primary: Amply Teal `#05668D`. Secondary: Amply Coral `#F98152`. Dark: `#044a66`. Light: `#e8f4f8`. Canonical source: `brand/overview.md`

## Tone & Voice
- **Slightly inspiring but professional**: Not preachy, not saintly
- **Ultra-pragmatic**: Realistic, efficient, accessible - solutions that work in the real world
- **Present tense**: Write as if Amply is fully operational
- **Direct and clear**: Lead with value, not fluff
- **Not salesy**: Don't oversell; let the transparency speak for itself
- **Beliefs, not facts**: When stating outcomes or effects, use "We believe..." rather than presenting assumptions as facts

## Positioning & Language
- **Positioning statement**: "Guided by ideals. Grounded in reality." (NOT a slogan - no slogan yet)
- **Alternative formulation**: "Idealistic in purpose. Pragmatic in execution." (for use in docs)
- **Identity**: Tech nonprofit (not "platform company")

## Amply's Four Pillars
1. **Organization Platform**: White-label donation sites, money collection, tracing, donor management, public stats
2. **OOTB Toolset**: Ready-to-use widgets, plugins, APIs, POS integration for easy money collection
3. **Business & Individual Solutions**: CSR donations, checkout giving, personal fundraising - all Amply-regulated for fraud prevention
4. **Effectiveness Focus**: GiveWell-style impact evaluation, guide donations to highest-impact causes

## Money Flow Roles
Understanding who does what on Amply:

| Role | Who | Action |
|------|-----|--------|
| **Donors** | Individuals, Businesses (CSR) | Give their own money |
| **Collectors** | Fundraisers (individuals), Businesses (checkout, POS) | Gather money from others |
| **Recipients** | Organizations (nonprofits) | Receive and use donations |

**Key insight**: Businesses have a DUAL ROLE - they can be both donors (giving company money) AND collectors (gathering customer donations). This dual capability is a key feature and selling point. The `for-businesses/` section addresses both roles in one place.

## Structure
```
docs/
├── CLAUDE.md                       # This file
├── intro.md                        # Vision, mission, 4 pillars, SDGs intro
│
├── sdgs/                           # UN Sustainable Development Goals
│   └── overview.md                 # The 17 goals, why Amply uses them
│
├── transparency/                   # Core differentiator
│   ├── philosophy.md               # Why transparency matters
│   ├── how-it-works.md             # Ledger, traceability, public data
│   ├── verification.md             # How anyone can verify
│   ├── pricing.md                  # Fee structure (canonical source for fees)
│   └── privacy.md                  # Transparency & privacy balance (canonical)
│
├── effectiveness/                  # Impact-focused giving
│   ├── philosophy.md               # Why effectiveness matters
│   ├── sdg-framework.md            # How SDGs are applied (→ sdgs/)
│   └── measuring-impact.md         # How Amply evaluates impact
│
├── trust-and-safety/               # Fraud prevention & trust
│   └── overview.md                 # THE reference doc for trust/fraud prevention
│
├── about-amply/                    # Amply-the-organization
│   ├── overview.md                 # Who is Amply
│   ├── our-finances.md             # Amply's own financial transparency
│   ├── ethics.md                   # Ethical stance, technology choices
│   └── legal.md                    # Corporate structure, platform vs. charity role
│
├── brand/                          # Visual identity & design system
│   ├── overview.md                 # Brand principles, element overview
│   └── typography.md               # Lexend typeface, weights, usage
│
├── for-organizations/              # Nonprofits RECEIVING donations
│   ├── overview.md                 # What Amply offers
│   ├── getting-started.md          # Onboarding, verification
│   ├── requirements.md             # Eligibility (→ trust-and-safety/)
│   ├── platform-tools.md           # Dashboard, white-label, donor CRM
│   └── reporting.md                # Stats, transparency reports
│
├── for-businesses/                 # Businesses: DUAL ROLE (give AND collect)
│   ├── overview.md                 # "Give, collect, or both" - why Amply for business
│   ├── corporate-giving.md         # Business as DONOR: CSR, matching gifts
│   ├── customer-collections.md     # Business as COLLECTOR: checkout, social products
│   ├── solutions.md                # Specific integrations (POS, "social beer", % of sales)
│   ├── getting-started.md          # Setup process
│   └── compliance.md               # Reporting, tax documentation
│
├── for-donors/                     # INDIVIDUAL donors (people giving their own money)
│   ├── overview.md                 # For individuals; businesses see for-businesses/
│   ├── getting-started.md          # How to donate
│   ├── finding-causes.md           # SDG browsing, effectiveness ratings (→ sdgs/)
│   ├── tracking-impact.md          # Follow your donation
│   └── tax-benefits.md             # Tax deductions
│
├── for-fundraisers/                # INDIVIDUALS collecting money for causes
│   ├── overview.md                 # Personal fundraising on Amply
│   ├── getting-started.md          # Starting a campaign
│   ├── moral-circles.md            # Influencer community giving
│   └── guidelines.md               # Rules (→ trust-and-safety/)
│
├── integrations/                   # OOTB Toolset (technical)
│   ├── overview.md                 # Available integration options
│   ├── widgets.md                  # HTML/JS embeddable widgets
│   ├── plugins.md                  # WordPress, Shopify, etc.
│   └── pos-terminals.md            # Point-of-sale, counter screens, cashier API
│
├── architecture/                   # Technical deep-dives
│   ├── overview.md                 # System architecture
│   ├── ledger.md                   # Tamper-evident design
│   ├── stripe-flows.md             # Payment routing
│   └── data-model.md               # Multi-tenant, funds, projects
│
├── api/                            # Developer reference
│   └── overview.md                 # API intro (expandable)
│
├── help/                           # Troubleshooting & support
│   └── common-issues.md            # FAQ-style common problems (grows organically)
│
└── tech-stack/                     # Internal developer documentation
    ├── overview.md                 # Master tech stack reference + architecture diagram
    ├── sentry.md                   # Error tracking configuration
    ├── amply-backend/              # Python FastAPI backend
    │   ├── overview.md             # Backend architecture
    │   ├── api.md                  # API structure
    │   ├── services.md             # Service layer
    │   ├── jobs.md                 # Background jobs
    │   └── testing.md              # Testing approach
    ├── amply-dashboard/            # React dashboard
    │   └── overview.md             # Dashboard architecture
    ├── amply-public-website/       # React public site
    │   └── overview.md             # Public site architecture
    ├── amply-verify/               # Open-source verification CLI
    │   └── overview.md             # CLI architecture
    ├── aws/                        # AWS infrastructure
    │   ├── overview.md             # AWS setup overview
    │   ├── ecs.md                  # ECS Fargate (backend compute)
    │   ├── rds.md                  # PostgreSQL database
    │   ├── elasticache.md          # Redis caching
    │   ├── s3.md                   # Object storage
    │   ├── sqs.md                  # Message queue
    │   ├── ses.md                  # Transactional email
    │   ├── cloudfront.md           # CDN
    │   ├── route53.md              # DNS
    │   └── secrets-manager.md      # Credentials management
    ├── ci-cd/                      # GitHub Actions pipelines
    │   └── overview.md             # CI/CD configuration
    ├── netlify/                    # Static hosting
    │   ├── netlify.md              # Netlify configuration
    │   └── docusaurus/             # Docs site setup
    │       └── overview.md
    ├── sdks/                       # Client libraries
    │   └── overview.md             # SDK architecture
    ├── stripe/                     # Payment integration
    │   └── overview.md             # Stripe Connect setup
    └── widgets/                    # Embeddable widgets
        └── overview.md             # Widget architecture
```

## Documentation Map
| Document | Location | Purpose | Status |
|----------|----------|---------|--------|
| Introduction | `intro.md` | Landing page, vision, pillars, audience guide | Draft |
| SDGs Overview | `sdgs/overview.md` | UN SDGs explanation, how Amply uses them | Draft |
| Transparency Philosophy | `transparency/philosophy.md` | Why transparency matters | Draft |
| How Transparency Works | `transparency/how-it-works.md` | Ledger, public data, technical foundation | Draft |
| Verification Guide | `transparency/verification.md` | How to independently verify Amply's data | Draft |
| Pricing and Fees | `transparency/pricing.md` | Fee structure, Stripe costs, fee transparency | Draft |
| Effectiveness Philosophy | `effectiveness/philosophy.md` | Why effectiveness matters, GiveWell inspiration | Draft |
| SDG Framework | `effectiveness/sdg-framework.md` | How SDGs frame effectiveness measurement | Draft |
| Measuring Impact | `effectiveness/measuring-impact.md` | Impact metrics, verification levels, reporting | Draft |
| Trust and Safety | `trust-and-safety/overview.md` | Fraud prevention, verification, monitoring (canonical) | Draft |
| Transparency & Privacy | `transparency/privacy.md` | Visibility levels, sensitive data handling (canonical) | Draft |
| About Amply | `about-amply/overview.md` | Who is Amply, the organization behind the platform | Draft |
| Our Finances | `about-amply/our-finances.md` | Amply's own financial transparency | Draft |
| Our Ethics | `about-amply/ethics.md` | Ethical stance, technology choices, difficult questions | Draft |
| Legal Information | `about-amply/legal.md` | Corporate structure, platform vs. charity role | Draft |
| Brand Overview | `brand/overview.md` | Brand principles, visual identity elements | Draft |
| Typography | `brand/typography.md` | Lexend typeface, weights, wordmark | Draft |
| For Organizations | `for-organizations/overview.md` | What Amply offers nonprofits | Draft |
| Getting Started (Orgs) | `for-organizations/getting-started.md` | Onboarding, verification process | Draft |
| Requirements | `for-organizations/requirements.md` | Eligibility, verification tiers | Draft |
| Platform Tools | `for-organizations/platform-tools.md` | Dashboard, widgets, donor management | Draft |
| Reporting | `for-organizations/reporting.md` | Transparency reports, impact reports | Draft |
| For Businesses | `for-businesses/overview.md` | Give, collect, or both | Draft |
| Corporate Giving | `for-businesses/corporate-giving.md` | Business as donor: CSR, matching | Draft |
| Customer Collections | `for-businesses/customer-collections.md` | Business as collector: checkout, social products | Draft |
| Business Solutions | `for-businesses/solutions.md` | Integrations for e-commerce, POS, etc. | Draft |
| Getting Started (Biz) | `for-businesses/getting-started.md` | Setup process | Draft |
| Compliance | `for-businesses/compliance.md` | Regulatory requirements, tax | Draft |
| For Donors | `for-donors/overview.md` | Individual donors | Draft |
| Getting Started (Donors) | `for-donors/getting-started.md` | How to donate | Draft |
| Finding Causes | `for-donors/finding-causes.md` | SDG browsing, effectiveness | Draft |
| Tracking Impact | `for-donors/tracking-impact.md` | Follow your donation | Draft |
| Tax Benefits | `for-donors/tax-benefits.md` | Tax deductions | Draft |
| For Fundraisers | `for-fundraisers/overview.md` | Personal fundraising | Draft |
| Getting Started (FR) | `for-fundraisers/getting-started.md` | Starting a campaign | Draft |
| Moral Circles | `for-fundraisers/moral-circles.md` | Community giving | Draft |
| Fundraiser Guidelines | `for-fundraisers/guidelines.md` | Rules for fundraising | Draft |
| Integrations | `integrations/overview.md` | Available integration options | Draft |
| Widgets | `integrations/widgets.md` | Embeddable donation components | Draft |
| Plugins | `integrations/plugins.md` | WordPress, Shopify, etc. | Draft |
| POS & Terminals | `integrations/pos-terminals.md` | Point-of-sale, kiosks | Draft |
| Architecture | `architecture/overview.md` | System architecture | Draft |
| Ledger Architecture | `architecture/ledger.md` | Tamper-evident design | Draft |
| Payment Flows | `architecture/stripe-flows.md` | Stripe Connect routing | Draft |
| Data Model | `architecture/data-model.md` | Multi-tenant structure | Draft |
| API Documentation | `api/overview.md` | API reference and SDKs | Draft |
| Common Issues | `help/common-issues.md` | Troubleshooting FAQ (grows organically) | Draft |
| Tech Stack Overview | `tech-stack/overview.md` | Master tech reference + architecture diagram | Draft |
| Sentry | `tech-stack/sentry.md` | Error tracking configuration | Draft |
| Backend Overview | `tech-stack/amply-backend/overview.md` | Python FastAPI backend architecture | Draft |
| Backend API | `tech-stack/amply-backend/api.md` | API structure and endpoints | Draft |
| Backend Services | `tech-stack/amply-backend/services.md` | Service layer architecture | Draft |
| Backend Jobs | `tech-stack/amply-backend/jobs.md` | Background job processing | Draft |
| Backend Testing | `tech-stack/amply-backend/testing.md` | Testing approach | Draft |
| Dashboard | `tech-stack/amply-dashboard/overview.md` | React dashboard architecture | Draft |
| Public Website | `tech-stack/amply-public-website/overview.md` | React public site architecture | Draft |
| Verify CLI | `tech-stack/amply-verify/overview.md` | Open-source verification CLI | Draft |
| AWS Overview | `tech-stack/aws/overview.md` | AWS infrastructure setup | Draft |
| AWS ECS | `tech-stack/aws/ecs.md` | ECS Fargate backend compute | Draft |
| AWS RDS | `tech-stack/aws/rds.md` | PostgreSQL database | Draft |
| AWS ElastiCache | `tech-stack/aws/elasticache.md` | Redis caching | Draft |
| AWS S3 | `tech-stack/aws/s3.md` | Object storage | Draft |
| AWS SQS | `tech-stack/aws/sqs.md` | Message queue | Draft |
| AWS SES | `tech-stack/aws/ses.md` | Transactional email | Draft |
| AWS CloudFront | `tech-stack/aws/cloudfront.md` | CDN configuration | Draft |
| AWS Route 53 | `tech-stack/aws/route53.md` | DNS management | Draft |
| AWS Secrets Manager | `tech-stack/aws/secrets-manager.md` | Credentials management | Draft |
| CI/CD | `tech-stack/ci-cd/overview.md` | GitHub Actions pipelines | Draft |
| Netlify | `tech-stack/netlify/netlify.md` | Static hosting configuration | Draft |
| Docusaurus | `tech-stack/netlify/docusaurus/overview.md` | Docs site setup | Draft |
| SDKs | `tech-stack/sdks/overview.md` | Client library architecture | Draft |
| Stripe Integration | `tech-stack/stripe/overview.md` | Stripe Connect setup | Draft |
| Widgets | `tech-stack/widgets/overview.md` | Embeddable widget architecture | Draft |

## Cross-References (Planned)
| Source | References | Reason |
|--------|------------|--------|
| `for-organizations/requirements.md` | `trust-and-safety/overview.md` | Verification requirements |
| `for-fundraisers/guidelines.md` | `trust-and-safety/overview.md` | Fraud prevention rules |
| `for-donors/finding-causes.md` | `sdgs/overview.md` | SDG browsing |
| `for-donors/overview.md` | `for-businesses/` | Redirect business users |
| `effectiveness/sdg-framework.md` | `sdgs/overview.md` | SDG application |
| `intro.md` | `sdgs/overview.md` | Foundational concept |
| `for-businesses/solutions.md` | `integrations/` | Technical implementation details |

## Business Integration Ideas
*Captured for `for-businesses/` and `integrations/` sections:*
- Checkout donations (ask customer to donate at payment)
- Percentage-of-sale donations ("X% of this purchase goes to...")
- Social products ("Social Beer" - all profit to charity)
- POS/cashier system API integration
- Counter screens for donation prompts
- Employee giving programs
- Corporate matching gifts
- Regular new integration ideas for everyday donation opportunities

## Session Log

### 2025-12-07
**Status**: Structure refined
- Doc-mode activated on empty /docs directory
- CLAUDE.md created as context foundation
- Structure approved with user:
  - Renamed "Companies" to "Businesses"
  - Added `sdgs/` as top-level section
  - Added `trust-and-safety/` as reference doc for fraud prevention
  - Added `about-amply/` for organizational transparency
- Added writing principle: reference over redundancy
- Refined `for-businesses/` structure to reflect dual role (giving AND collecting)
- Added "Money Flow Roles" section documenting donor/collector/recipient model
- Captured business integration ideas (checkout, social products, POS, etc.)
- Added `for-donors/overview.md` to structure (was missing)

**Next Actions**: Review intro.md draft, then proceed to sdgs/overview.md

**Update**: Created intro.md draft
- Established tone: slightly inspiring, professional, ultra-pragmatic
- Present tense as if operational
- Four pillars with links
- Audience routing table
- Core principles summary
- Added "Tone & Voice" section to CLAUDE.md

### 2025-01-11
**Status**: Tech-stack documentation integrated
- Added `tech-stack/` section to Structure (26 files covering internal developer docs)
- Added all tech-stack documents to Documentation Map
- Sections now documented:
  - `amply-backend/` - Python FastAPI backend (5 files)
  - `amply-dashboard/` - React dashboard
  - `amply-public-website/` - React public site
  - `amply-verify/` - Open-source verification CLI
  - `aws/` - AWS infrastructure (10 files)
  - `ci-cd/` - GitHub Actions pipelines
  - `netlify/` - Static hosting + Docusaurus
  - `sdks/` - Client libraries
  - `stripe/` - Payment integration
  - `widgets/` - Embeddable widgets
- Note: tech-stack/ is internal developer documentation, not in public sidebar

**Update**: Comprehensive documentation gap analysis completed
- Read all 72+ documentation files to build complete understanding
- Identified 20 gaps/blind spots across critical, moderate, and strategic categories
- Key findings:
  - No failure/edge case documentation
  - No competitive context (why Amply vs alternatives)
  - SDG individual goal pages missing (only overview exists)
  - Legal entity/jurisdiction unclear
  - German locale configured but no content
  - Effectiveness vs. neutrality tension identified

**Resolution**: Platform vs. Recommendations positioning clarified
- Added "Platform vs. Recommendations (IMPORTANT)" to Key Facts
- Amply is an OPEN PLATFORM (any verified org can use tools)
- But an EFFECTIVENESS ADVOCATE (guides donors to high-impact orgs)
- Platform access: neutral; Recommendations: effectiveness-guided
- This resolves the philosophical tension in existing docs

**Identified gaps for future work**:
- Critical: Failure modes, legal clarity, sustainability explanation
- High: SDG goal pages, competitive context, German content decision
- Medium: Organization timelines, fundraiser limits, impact methodology
- Low: Regulator/auditor docs, Moral Circles depth

**Update**: Platform vs. charity distinction clarified in docs
- Key insight: Amply is infrastructure; orgs are the charities
- Tax deductibility depends on recipient org, not Amply
- Tax receipts issued by organizations, not Amply
- Amply's jurisdiction (Australia) is less critical for core use case

**Documentation updates**:
- `for-donors/tax-benefits.md`: Added "Who Provides Your Tax Receipt" section
  - Clarified orgs issue receipts, not Amply
  - Renamed "Documentation Amply Provides" to "What Amply Provides (Transaction Records)"
- `for-organizations/requirements.md`: Added "Your Tax Status" section
  - Orgs need their own tax-exempt status
  - Amply doesn't provide tax-exempt status
  - Table of required status by jurisdiction
- `about-amply/legal.md`: Created new page
  - Amply's role as platform vs. charity
  - Payment processing via Stripe Connect
  - Tax deductibility explanation
  - Placeholder for corporate registration details

**Update**: Tax receipt generation tool documented as roadmap feature
- Feature: Amply provides infrastructure for orgs to generate tax-deductible receipts
- Key principle: Org issues receipt (their name, ABN, DGR status); Amply is the tool
- Scope: Australia-first (DGR-compliant template), then expand to UK, Canada, Germany
- Documentation updated:
  - `for-organizations/platform-tools.md`: Expanded Communication Tools with receipt generation
  - `for-organizations/reporting.md`: Expanded Tax Documentation section
  - `for-donors/tax-benefits.md`: Added "How Organizations Generate Receipts" subsection

**Update**: Brand guidelines established
- Created `brand/` section for visual identity
- **Typography**: Lexend as primary typeface (Google Font, accessibility-focused)
  - Headlines: Thin 100 or ExtraLight 200 for clean, modern aesthetic
  - Body: Regular 400 for readable content
  - Wordmark: "Amply" in Black 900 (text logo, like Stripe)
- Rationale: Lexend designed to reduce visual stress, improve reading—aligns with transparency/accessibility values
- Documentation created:
  - `brand/overview.md`: Brand principles, element overview
  - `brand/typography.md`: Full typography guide with implementation examples

**Update**: Logo guidelines and brand colors established
- Primary color: Amply Teal `#05668D` (trust, clarity, calm - WCAG AA compliant)
- Color variants: Dark `#044a66`, Light `#e8f4f8`
- Logo = wordmark "Amply" in Lexend Black 900
- Created `static/brand/logo-guidelines.html`: Comprehensive visual guide
  - Wordmark versions (primary, reversed, dark mode, monochrome)
  - Clear space requirements (1× height of "A")
  - Minimum size (20px digital, 15pt print)
  - Color specifications (Hex, RGB, HSL, CMYK)
  - Background usage examples
  - Incorrect usage examples (don'ts)
  - Implementation code (CSS, HTML)

**Update**: Secondary brand color added
- Amply Coral `#F98152` as secondary/accent color
- Complementary to teal (opposite on color wheel)
- Usage: CTAs, buttons, highlights, icons, accents
- Note: Low contrast on white (2.5:1) — not for body text
- Updated: `static/brand/logo-guidelines.html`, `brand/overview.md`, `brand/typography.md`
