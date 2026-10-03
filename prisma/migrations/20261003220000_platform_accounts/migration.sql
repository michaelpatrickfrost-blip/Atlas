ALTER TABLE organisations ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE', ADD COLUMN "subscriptionStatus" TEXT NOT NULL DEFAULT 'TRIAL', ADD COLUMN "trialEndsAt" TIMESTAMP(3), ADD COLUMN "planName" TEXT NOT NULL DEFAULT 'All apps trial';
ALTER TABLE organisations ADD CONSTRAINT organisation_status CHECK (status IN ('ACTIVE','SUSPENDED'));
ALTER TABLE organisations ADD CONSTRAINT subscription_status CHECK ("subscriptionStatus" IN ('TRIAL','ACTIVE','PAST_DUE','CANCELLED'));
ALTER TABLE memberships ADD COLUMN active BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE module_states ADD COLUMN entitled BOOLEAN NOT NULL DEFAULT false;
UPDATE module_states SET entitled=true;
CREATE TABLE platform_administrators ("userId" TEXT PRIMARY KEY, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT platform_administrators_userId_fkey FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE);
