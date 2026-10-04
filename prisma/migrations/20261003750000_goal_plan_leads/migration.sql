-- Existing plans stay visible to the owner, the person, and their line manager.
UPDATE "hr_performance_plans" AS plan
SET
  "personName" = CASE WHEN plan."personName" = '' THEN trim(both ' ' FROM employee."firstName" || ' ' || employee."lastName") ELSE plan."personName" END,
  "leadUserIds" = COALESCE((
    SELECT ARRAY(SELECT DISTINCT uid FROM unnest(ARRAY[plan."ownerUserId", employee."userId", manager."userId"]) AS uid WHERE uid IS NOT NULL AND uid <> '')
  ), ARRAY[plan."ownerUserId"]::text[])
FROM "hr_employees" AS employee
LEFT JOIN "hr_employees" AS manager ON manager."id" = employee."managerId"
WHERE plan."employeeId" = employee."id"
  AND cardinality(plan."leadUserIds") = 0;
