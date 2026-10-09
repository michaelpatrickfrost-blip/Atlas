# Studio additional requirements

9 October 2026 — Michael's follow-ups during Phase 1:

> one thing thats important I think is admin for atlas should have all of this and the console stored in their own login area
>
> the set up should be all done there, then the studio where everything is is just for customers
>
> all the admin stuff need to sit on a seprate part of the site maybe its own url - then they can create user names for the businesses and login to the business that way, it needs to be a proepr ERP set up, also for a business they need there own URL for the business on the site, wher ethere login lives so they dont login to someone elses account can this all be done alongwith this

Execution scope: Atlas staff setup in `/atlas/studio`, independent staff-only
sign-in at `/19811171adminlogin`, customer Studio at `/studio`, business sign-in addresses
at `/business/<existing-company-slug>/login`. The path form works on the existing
site without requiring new DNS/certificates. Do not imply separate hosted subdomains.
Customer credentials must resolve membership in the URL's business, server-side;
no arbitrary active-membership selection for multi-company users. Staff setup uses
validated target companies and audited staff identity, not customer impersonation.
Existing canonical identities, passwords, permissions and profile restrictions stay.

Michael explicitly answered “Allow Atlas administrators to create business users”.
Independent OWNER/ADMIN platform grants receive `atlas.business_users.create`;
EMPLOYEE and customer role grants cannot provision users. Atlas staff creation
remains Michael-only. This supersedes the earlier all-user Michael-only policy. Company addresses are shown in Atlas Admin.
This workstream accompanies Phase 1 security/setup; it does not authorise building
later Studio engines ahead of their gates.
