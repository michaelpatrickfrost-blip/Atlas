import {readFileSync} from 'node:fs';
import {expect,it} from 'vitest';
const sql=readFileSync('prisma/migrations/20261008190000_connected_operational_apps/migration.sql','utf8');
it('backfills mandatory new Meeting timestamps and applies the release atomically',()=>{expect(sql.trim().startsWith('BEGIN;')).toBe(true);expect(sql.trim().endsWith('COMMIT;')).toBe(true);expect(sql).toMatch(/"updatedAt" TIMESTAMP\(3\) NOT NULL DEFAULT CURRENT_TIMESTAMP/);expect(sql).toMatch(/"endsAt" TIMESTAMP\(3\),/);});
it('preserves existing Inventory foreign keys and authoritative business rows',()=>{expect(sql).not.toMatch(/DROP CONSTRAINT|DROP TABLE|DROP COLUMN|TRUNCATE|DELETE FROM/);expect(sql).not.toMatch(/ALTER TABLE "inventory_(balances|movements)"/);});
it('enforces one maintenance target, independent approval, immutable design and one released revision',()=>{expect(sql).toContain('maintenance_one_target');expect(sql).toContain('Engineering approval must be independent');expect(sql).toContain('Released engineering content is immutable');expect(sql).toContain('engineering_one_released_product');});
