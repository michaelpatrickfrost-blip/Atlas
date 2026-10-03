# Atlas linked data and isolated test hosting

Updated 3 October 2026.

## Decision

Atlas modules share one Atlas PostgreSQL database and canonical identities. Atlas can potentially share Blocwrite's physical host for testing, but must have a separate runtime, database, credentials, files, backups and deployment process. Host capacity and live configuration have not yet been inspected; no remote deployment or configuration change has been performed.

## Linked data contract

- Organisation is the tenant boundary. Every business query and relation assignment is checked against the authenticated organisation.
- Party is the shared customer/group/branch/contact identity. CRM, Sales, Projects, Service and Finance reference it rather than copying customer records.
- Product is the shared catalogue identity. Pricing, order lines, inventory, purchasing and production reference it.
- Pricelists are business-wide records assigned to customer accounts; customer contract, selected/default list and standard price follow a defined precedence.
- Preserve document origin: opportunity → quotation → order → reservation → shipment/return → invoice/credit → payment/allocation. Project, warehouse, product and Party identifiers stay attached throughout.
- Versioned price, tax and address snapshots preserve what was agreed on a document. Updating a customer address or product price must not silently rewrite historical documents.
- Customer pages aggregate related module records under permissions; dashboards calculate from source records with explicit definitions, currency, tenant and period filters.
- Use atomic transactions for a document and its lines. Add a transactional outbox, idempotent consumers, retries and reconciliation before relying on cross-module event processing for fulfilment/accounting. The current in-process bus does not provide durable delivery.
- Tenant ownership checks must include both sides of every relationship. Add database constraints where practical plus cross-tenant relation tests.

Current foundations already reference shared Party/Product records. Reservations, deliveries, ledger posting and payment reconciliation are still planned; the entire chain is not complete.

## What was found locally

Blocwrite deployment scripts target a remote server and `/opt/Blocwrite`, with a PM2 application named `blocwrite`. The local ecosystem configuration specifies port 3000, four instances and an 800 MB per-process restart threshold. These are configuration values, not a live capacity reading or hard memory limits. Its local Prisma datasource uses SQLite. Atlas uses PostgreSQL. Blocwrite deployment scripts include destructive destination synchronisation and service restarts, so they must never be reused to deploy Atlas.

## Atlas test boundary (original proposal; implemented arrangement below)

| Concern | Atlas test arrangement |
| --- | --- |
| Application | Separate `/opt/atlas-test` directory and dedicated unprivileged service identity |
| Runtime | Dedicated isolated service/container; no Blocwrite process restart or shared app configuration |
| Database | Dedicated PostgreSQL instance/volume preferred; database `atlas_test` with its own runtime and migration credentials |
| Network | Private database network; no publicly exposed database port |
| Access | Private SSH forwarding for current testing; dedicated HTTPS hostname before public distribution |
| Files | Separate private upload volume, logs and backup destination |
| Limits | Explicit CPU/memory limits, bounded database connections, log rotation and disk monitoring; budgets follow live capacity inspection |
| Deployment | Build away from the production host where possible; Atlas-only releases, migrations and rollback |
| Data | Synthetic/demo records initially; no Blocwrite database copy or real customer bank/HR data |
| Recovery | Independent database/file backups and tested restore into an isolated destination |

Containers reduce interference but share the host kernel, CPU, memory, disk and network. A separate VPS offers a stronger failure boundary if keeping Blocwrite unaffected is the priority. A shared machine cannot provide a zero-impact guarantee.

## Hosting checkpoints

- [x] Inspect local Blocwrite deployment and database configuration without modifying it.
- [x] Define shared Atlas entity links and an isolated test-host design.
- [x] Read-only live inventory: host RAM/CPU/disk, workloads, ports, proxy, container support and existing backups.
- [x] Decide shared host versus dedicated VPS based on headroom and acceptable failure boundary.
- [x] Prepare Atlas-only deployment files, least-privilege credentials, resource budgets and rollback procedure.
- [x] Use the user-approved private SSH test target.
- [x] Provision isolated PostgreSQL and application runtime, apply Atlas-only migrations and transfer existing Atlas test records.
- [x] Verify private authenticated access, health checks, backup/restore and unchanged Blocwrite processes.
- [ ] Verify public HTTPS and complete tenant-isolation/security review before production.

## References

- [Docker resource constraints](https://docs.docker.com/engine/containers/resource_constraints): resource limits must be explicitly configured.
- [PostgreSQL database roles](https://www.postgresql.org/docs/current/database-roles.html): credentials and privileges control database access.

## Implemented private test deployment — 3 October 2026

Atlas now runs under `atlas-test` on the existing host, with its own PostgreSQL instance on loopback 5543, private application on loopback 3100, protected credentials, independent storage and bounded systemd resources. Blocwrite processes and proxy configuration were not changed. The native Mac client connects through a dedicated forwarding-only SSH account to local port 13100. No public Atlas database or application port was opened. HTTPS/public distribution remains a future checkpoint.

Releases build in `/opt/atlas-test/releases/<release>` before the `current` symlink is switched; only the Atlas application restarts. Migrations use a separate operator credential. Runtime cannot grant platform administration or update/delete audit entries. Atlas owner access is bootstrapped by the operator script, not a tenant role. The demo account has owner-console access in this test environment; replace with the real owner account before production.

Daily backups use independent private storage. A restore into a newly created temporary database matched all 53 table counts and 125 records, then removed only the temporary drill database. The drill requires the schema version corresponding to its snapshot. After each schema migration, keep the associated release/migration history with its backup; a row export alone is not a complete disaster recovery package.

Mac distribution is currently locally compiled/ad-hoc signed, not notarised. The thin client stores no database credentials; server updates add modules without rebuilding it. See `desktop/macos/` and `scripts/build-mac-client.sh`.
