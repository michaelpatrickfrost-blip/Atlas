# Customer Portal & Branded Experience

**Beautiful, branded customer-facing portal for documents, contracts, and collaboration.**

Customers don't see Atlas internals. They see a polished, branded site with their company colors/logo, where they can:
- View and sign contracts (one-click e-signature)
- Download invoices and documents
- Track orders
- Access shared files
- Collaborate on projects
- Share secure URLs with teams

No login required. Click link → sign/view immediately.

## Customer Portal

### What Customers See

**Portal Home**
- Welcome message with company branding
- Quick links: contracts to sign, recent invoices, open orders
- "Sign contract" button if agreements pending
- Recent activity feed

**Contracts Section**
- List of all contracts
- Status badges: PENDING_SIGNATURE | EXECUTED | EXPIRED | NEEDS_RENEWAL
- "Sign now" button for pending contracts
- View/download signed copies
- Renewal countdown and button
- Document preview (PDF thumbnail)

**Documents Section**
- Recent invoices (grouped by year)
- Quotes, proformas, delivery notes
- Download as PDF or CSV
- Email to self option
- Print option (PDF optimized)
- Search/filter by date, amount, status

**Orders Section** (if enabled)
- Order history
- Order status tracking
- Linked invoices/delivery notes
- Reorder quick links
- Track shipment (integrates with carrier tracking)

**File Sharing**
- Shared files/folders with customer
- Upload files for company review
- Version history
- Comments/notes on files
- Expiry dates (optional: link expires after N days)

**Messages/Support**
- Contact support directly
- Chat with account manager
- Submit questions
- Ticket tracking

### Branding

**Every portal is white-labeled:**

Per-template branding:
- Company logo (top left or center)
- Primary brand color (buttons, links, accents)
- Secondary color (backgrounds, borders)
- Company name in header
- Favicon
- Custom domain option: contracts.yourcompany.com
- Custom email address: contracts@yourcompany.com
- Footer with company details

Example portal config:
```json
{
  "portal": {
    "branding": {
      "company_name": "Northbridge Group",
      "logo_url": "https://cdn.atlas.io/logos/northbridge.png",
      "primary_color": "#0071e3",
      "secondary_color": "#f5f5f5",
      "font_family": "Inter, sans-serif",
      "favicon_url": "https://cdn.atlas.io/favicons/northbridge.ico",
      "custom_domain": "contracts.northbridge.com",
      "custom_email": "contracts@northbridge.com",
      "footer_text": "© 2026 Northbridge Group. All rights reserved.",
      "support_email": "support@northbridge.com",
      "support_phone": "+44 20 1234 5678"
    },
    "pages": {
      "show_company_info": true,
      "show_contact_support": true,
      "show_file_sharing": true,
      "show_order_tracking": false
    },
    "theme": "light" // or "dark" or "auto"
  }
}
```

## Contract Signing Experience

### No-Login Signing (Like Blocwrite)

1. **Customer receives email**
   - Professional branded email
   - "Sign agreement" button
   - Plain language: "John, please sign the MSA below. Takes 30 seconds."

2. **Click link → lands on beautiful signing page**
   - Company logo at top
   - Contract preview/summary
   - "Ready to sign?" prompt
   - Sign now button

3. **Sign without login**
   - No password required
   - No account creation
   - Just: Name field + signature (pad, type, or click)
   - Optional: email verification (send code, verify)
   - Optional: phone verification (SMS code)

4. **Post-signature**
   - "✓ Successfully signed" confirmation
   - Download signed copy
   - "View in portal" link
   - "Share with team" option

5. **Signed copy sent to customer**
   - Email with PDF attachment
   - Also available in portal

### UI/UX Details

**Signature Pad**
- Clean, minimal design
- Large writing area
- "Clear" button to redo
- Signature preview
- "Looks good?" confirmation
- Responsive: works on phone/tablet/desktop

**Multiple Signers (Sequential)**
- Signer 1: signs, gets completion email
- Email goes to Signer 2: "Ready? Sign here"
- Signer 2: signs, completion email
- Both get final signed copy

**Status & Reminders**
- "Pending your signature: John Smith (CEO)" - sent 2 days ago
- "Reminder: sign by Friday" - sent 1 day before deadline
- Auto-escalate if past deadline: email goes to manager

## Branded Document Delivery

### Invoice Email

Subject: Invoice #INV-2026-001234 from Northbridge Group
From: invoices@northbridge.com
Body (branded):
```
Hi [Customer Name],

Your invoice for £5,420.00 is ready.

[COMPANY LOGO]

Invoice #INV-2026-001234
Due: [DATE]
Amount: £5,420.00

[VIEW IN PORTAL] [DOWNLOAD PDF] [PAY NOW]

Questions? [CONTACT SUPPORT]

© 2026 Northbridge Group
```

### Contract Email

Subject: Action needed: Please sign the Master Service Agreement
From: contracts@northbridge.com
Body:
```
Hi [Customer Name],

We're excited to work with you! 

Please sign the attached agreement below. It takes about 30 seconds.

[COMPANY LOGO]

[SIGN NOW - No login needed]

Questions? [CONTACT US]

© 2026 Northbridge Group
```

## Shared Files & Collaboration

### File Sharing Interface

**Company to Customer:**
- Upload files (documents, specs, SOPs, templates)
- Set expiry (optional: link dies after N days)
- Add message/instructions
- Generate shareable link
- Send email with link
- Track: who downloaded, when, from where

**Customer to Company:**
- Upload attachments with support request
- Share POs, artwork, specs
- Version management

### Link Sharing Features

**Per Blocwrite style:**
- Unique public URL (no login)
- Link preview: file name, size, date
- Password-protected option
- Download tracking
- IP logging
- Device tracking
- Expiry after N days or date
- Expiry after N downloads
- Disable option (link stops working)

Example share config:
```json
{
  "share_link": "contracts.northbridge.com/files/abc123def456",
  "file_name": "Order_Spec_Northbridge_2026.pdf",
  "created": "2026-10-04T10:30:00Z",
  "expires": "2026-11-04T10:30:00Z",
  "password": false,
  "download_limit": null,
  "downloads": [
    {
      "downloaded_at": "2026-10-04T10:35:00Z",
      "ip_address": "203.0.113.42",
      "user_agent": "Chrome 120 on MacOS"
    },
    {
      "downloaded_at": "2026-10-04T10:36:00Z",
      "ip_address": "203.0.113.42",
      "user_agent": "Safari 18 on iPhone"
    }
  ],
  "disabled": false
}
```

## Customer Portal Security

**Access control:**
- Customers can only see their own data
- No cross-customer visibility
- No ability to view other customers' invoices
- API token based (if using API)
- Session timeout (30 minutes of inactivity)
- No session export/sharing

**Data protection:**
- HTTPS only
- TLS 1.3
- Content Security Policy headers
- No sensitive data in URLs
- Encrypted download links
- Rate limiting on logins
- IP blocking on too many failures

## Portal Features Per Template

### Retail Portal (Minimal)
```json
{
  "code": "RETAIL_PORTAL",
  "portal": {
    "pages": {
      "show_company_info": false,
      "show_contracts": false,
      "show_invoices": true,
      "show_orders": true,
      "show_file_sharing": false,
      "show_messages": false
    },
    "branding": {
      "company_logo": true,
      "custom_domain": false,
      "theme": "light"
    }
  }
}
```

### B2B Wholesale Portal (Full)
```json
{
  "code": "B2B_PORTAL",
  "portal": {
    "pages": {
      "show_company_info": true,
      "show_contracts": true,
      "show_invoices": true,
      "show_orders": true,
      "show_file_sharing": true,
      "show_messages": true
    },
    "branding": {
      "company_logo": true,
      "custom_domain": true,
      "custom_email": true,
      "theme": "light"
    },
    "file_sharing": {
      "enabled": true,
      "customer_upload": true,
      "expiry_options": true
    },
    "messages": {
      "enabled": true,
      "support_chat": true,
      "account_manager_contact": true
    }
  }
}
```

### Enterprise Portal (Premium)
```json
{
  "code": "ENTERPRISE_PORTAL",
  "portal": {
    "pages": {
      "show_company_info": true,
      "show_contracts": true,
      "show_invoices": true,
      "show_orders": true,
      "show_file_sharing": true,
      "show_messages": true,
      "show_analytics": true,
      "show_api_tokens": true
    },
    "branding": {
      "company_logo": true,
      "custom_domain": true,
      "custom_email": true,
      "white_label": true,
      "theme": "light"
    },
    "features": {
      "sso_enabled": true,
      "api_access": true,
      "advanced_reporting": true,
      "bulk_actions": true
    }
  }
}
```

## Portal Analytics

**Customer can view:**
- Invoice payment status
- Order delivery status
- Contract expiry dates
- Account balance
- Recent activity

**Company can view:**
- Portal usage per customer
- Document downloads
- Link clicks
- Sign-up/sign-in rates
- Feature adoption
- Support tickets

## Customization Examples

### Example 1: Manufacturing Customer
- Portal shows: contracts, quality docs, certificates, orders, delivery tracking
- File sharing enabled: customer uploads CAD files, company uploads specs
- Custom domain: procure.manufacturingcorp.com
- Dark theme option

### Example 2: B2B Wholesale
- Portal shows: contracts, invoices, orders, payment terms, account balance
- Messaging: order updates, account manager contact
- Custom domain: accounts.wholesaledealer.com
- Advanced reporting on purchasing trends

### Example 3: Retail
- Portal minimal: just recent invoices and order history
- No contracts (optional ToS only)
- No file sharing
- Basic contact support

## API Access (For Integrations)

**Some customers want API access to pull invoices, orders, contracts programmatically.**

Per-template:
- `portal.api_enabled` (BOOLEAN) - allow API access
- `portal.api_read_only` (BOOLEAN) - customers can read but not modify
- `portal.api_rate_limit` (NUMBER) - requests per hour
- `portal.webhooks_enabled` (BOOLEAN) - we notify them of changes
- `portal.webhook_events` (ARRAY) - INVOICE_POSTED, ORDER_SHIPPED, CONTRACT_SIGNED, etc.

## Mobile App (Future)

Customer portal as native iOS/Android app:
- Download invoices
- Sign contracts
- Track orders
- Upload files
- Offline mode (PDFs cached)
- Push notifications (order shipped, invoice ready, contract reminder)

## What This Delivers

✅ **Zero-friction signing** - click link, sign, done (no login, no account creation)  
✅ **Beautiful branding** - customer's colors, logo, domain  
✅ **Secure sharing** - Blocwrite-style links with expiry, download tracking  
✅ **Self-service** - customers handle everything without calling support  
✅ **Mobile-first** - responsive design, works perfectly on phone  
✅ **Professional** - looks like a premium service, not a generic tool  
✅ **Low friction** - minimal steps, beautiful UX  
✅ **Audit trail** - every action logged and searchable  

**Customer experience:**
1. Receive email: "Sign this in 30 seconds"
2. Click link (no login)
3. Type name + draw signature
4. ✓ Done. Signed copy emailed.
5. Portal has all past docs, invoices, contracts in one place
6. Can share PDFs with their team via Blocwrite-style shareable link
