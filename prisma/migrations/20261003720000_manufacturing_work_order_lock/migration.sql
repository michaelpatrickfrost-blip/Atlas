-- §54: schedule lock. A planner can lock a work order's resource/time assignment
-- so the scheduler refuses to move it, even when a planner-level user tries.

-- AlterTable
ALTER TABLE "manufacturing_work_orders" ADD COLUMN "locked" BOOLEAN NOT NULL DEFAULT false;
