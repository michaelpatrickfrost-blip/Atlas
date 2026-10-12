import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const original = readFileSync('prisma/migrations/20261011070000_studio_record_type_assignments/migration.sql', 'utf8');
const repair = readFileSync('prisma/migrations/20261012020000_studio_assignment_guard_precedence/migration.sql', 'utf8');
const ungrouped = "(p->'entity'-ARRAY['id','version','schemaHash','contractHash'])";
const grouped = "((p->'entity')-ARRAY['id','version','schemaHash','contractHash'])";

function assignmentInsertFunction(sql: string): string {
  const declaration = /CREATE (?:OR REPLACE )?FUNCTION atlas_studio_assignment_insert_guard\(\)/.exec(sql);
  if (!declaration) throw new Error('Assignment guard is missing');
  const end = sql.indexOf('END $$;', declaration.index);
  if (end < 0) throw new Error('Assignment guard is incomplete');
  return sql.slice(declaration.index, end + 'END $$;'.length);
}

describe('additive assignment entity extraction repair', () => {
  it('preserves the entire original guard, changing only declaration and extraction grouping', () => {
    const source = assignmentInsertFunction(original);
    expect(source.split(ungrouped)).toHaveLength(2);
    const expected = source.replace('CREATE FUNCTION', 'CREATE OR REPLACE FUNCTION').replace(ungrouped, grouped);
    expect(assignmentInsertFunction(repair)).toBe(expected);
    // Exact body comparison preserves owner/tenant/native revision, immutable
    // profile pins, head CAS and canonical provenance/request checksum checks.
  });

  it('replaces only the function and leaves applied history and trigger wiring intact', () => {
    expect(original).toContain(ungrouped);
    expect(original).toContain('CREATE TRIGGER studio_assignment_insert BEFORE INSERT');
    expect(repair.trim().slice(repair.indexOf('CREATE OR REPLACE FUNCTION')))
      .toBe(assignmentInsertFunction(repair));
    expect(repair).not.toMatch(/CREATE TRIGGER|DROP|ALTER TABLE|INSERT INTO|DELETE FROM|TRUNCATE|^\s*UPDATE\s/m);
  });
});
