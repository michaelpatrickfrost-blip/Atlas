# Atlas White-Label Branding System

**Completed:** 4 October 2026  
**Status:** Code ready for deployment; awaiting central database schema migration

## Overview

Atlas defaults to Atlas branding everywhere. Each customer organisation can upload their own logo, set their brand colour, and configure company details that appear on all customer-facing documents (invoices, quotations, proformas, order acknowledgements).

The branding setup is the first step in company onboarding—customers personalise their identity immediately before importing business data.

## Architecture

### Storage
- **Logo**: Stored as data URL on `Organisation.logoDataUrl` (PNG/JPG for printing, WEBP/GIF for workspace only)
- **Brand colour**: Stored in `Organisation.companyProfile.accentColour` (validated hex, must not be near-white)
- **Company details**: All stored in `companyProfile` JSON (trading name, legal name, address, VAT, phone, email, payment details, terms)

### Display

**When customer has uploaded branding:**
- Logo shown in app sidebar, login page, document headers
- Brand colour used as accent on invoices, UI rules, document headers
- Company name and details printed on all customer documents

**When customer hasn't customised (default):**
- Atlas logo shown in sidebar and login
- Charcoal colour (#1d1d1f) used as accent
- Company name defaults to organisation name

## Components

### SetupBrand (src/app/(app)/atlas/setup-brand.tsx)
Interactive form for onboarding with:
- Logo upload (validates file type, size)
- Brand colour picker (blocks near-white)
- Company details (name, address, VAT, contact)
- Real-time invoice preview

### CompanyMark (src/components/shell/company-mark.tsx)
Renders organisation logo or monogram with brand colour (used in sidebar).

## Onboarding Flow

`/atlas/[organisationId]/setup` now has two steps:

**Step 1: Company Identity** ← NEW
- Upload logo
- Set brand colour
- Enter company details
- Preview invoice

**Step 2: Data Setup** (existing)
- Import customers, products, prices via CSV

## Key Features

✅ Logo upload (PNG, JPG, WEBP, GIF; max 350 KB)
✅ Brand colour picker with readability validation
✅ Company letterhead (address, VAT, registration)
✅ Payment details and terms
✅ Live invoice preview
✅ Full audit trail of changes
✅ Permission-gated (core.modules.manage)

## Technical

**Validation**
- Logo: base64 data URL, validated file type
- Colour: hex format, luminance ≤ 0.82 (ensures readability)
- Company profile: field length limits and format validation

**PDF Integration**
- Quotes, invoices, proformas use uploaded logo and colour
- Defaults apply if nothing is set

## Code Changes

- `src/app/(app)/atlas/setup-brand.tsx` — NEW component
- `src/app/(app)/atlas/[organisationId]/setup/page.tsx` — MODIFIED to include brand step
- Reuses existing `saveCompanyBrand` action and validation utilities

## Deployment Status

✅ Code compiles and lints  
✅ TypeScript types pass  
✅ Committed and ready  
⏳ Awaiting central database schema migration (SalesProject + CustomerTemplate tables)

Once database is updated, deploy with: `scripts/deploy-mac-client.sh white-label`

## What's Live

- ✅ Brand upload/storage
- ✅ Sidebar logo display
- ✅ Document branding (PDFs)
- ✅ Onboarding UI
- ⏳ Installed app (blocked by schema sync)

See `.ai/CURRENT_STATE.md` for deployment blockers and next steps.
