-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('PROSPECT', 'ACTIVE', 'ON_HOLD', 'INACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "ContactPreferredMethod" AS ENUM ('EMAIL', 'PHONE', 'MOBILE');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ContactRole" AS ENUM ('PRIMARY', 'SALES', 'ACCOUNTS_PAYABLE', 'PURCHASING', 'OPERATIONS', 'DELIVERY', 'TECHNICAL', 'EXECUTIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "CommunicationPurpose" AS ENUM ('ORDERS', 'INVOICES', 'STATEMENTS', 'CREDIT_CONTROL', 'DELIVERY');

-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('REGISTERED', 'BILLING', 'DELIVERY', 'SITE', 'SERVICE', 'OFFICE', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentTermType" AS ENUM ('DUE_ON_RECEIPT', 'NET', 'END_OF_MONTH', 'CUSTOM');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'DIRECT_DEBIT', 'CARD', 'CASH', 'CHEQUE', 'ACCOUNT', 'OTHER');

-- CreateEnum
CREATE TYPE "TaxValidationStatus" AS ENUM ('NOT_VERIFIED', 'MANUALLY_VERIFIED', 'VERIFIED_BY_SERVICE', 'FAILED');

-- CreateEnum
CREATE TYPE "BankAccountPurpose" AS ENUM ('DIRECT_DEBIT', 'REFUND', 'REMITTANCE', 'OTHER');

-- CreateEnum
CREATE TYPE "BankVerificationStatus" AS ENUM ('NOT_VERIFIED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "DirectDebitScheme" AS ENUM ('BACS', 'SEPA_CORE', 'SEPA_B2B');

-- CreateEnum
CREATE TYPE "DirectDebitStatus" AS ENUM ('PENDING', 'ACTIVE', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "DocumentVisibility" AS ENUM ('ALL', 'RESTRICTED');

-- DropForeignKey
ALTER TABLE "contact_methods" DROP CONSTRAINT "contact_methods_partyId_fkey";

-- AlterTable
ALTER TABLE "addresses" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "contactId" TEXT,
ADD COLUMN     "deliveryInstructions" TEXT,
ADD COLUMN     "isDefaultBilling" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDefaultDelivery" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "label" TEXT,
ADD COLUMN     "locationName" TEXT,
ADD COLUMN     "telephone" TEXT,
ADD COLUMN     "type" "AddressType" NOT NULL DEFAULT 'OTHER';

-- AlterTable
ALTER TABLE "parties" ADD COLUMN     "accountManagerUserId" TEXT,
ADD COLUMN     "countryOfRegistration" TEXT,
ADD COLUMN     "customerCode" TEXT NOT NULL,
ADD COLUMN     "customerGroup" TEXT,
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "parentPartyId" TEXT,
ADD COLUMN     "preferredCurrency" TEXT NOT NULL DEFAULT 'GBP',
ADD COLUMN     "preferredLanguage" TEXT,
ADD COLUMN     "registrationNumber" TEXT,
ADD COLUMN     "relationshipStartDate" TIMESTAMP(3),
ADD COLUMN     "status" "CustomerStatus" NOT NULL DEFAULT 'PROSPECT',
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "territory" TEXT,
ADD COLUMN     "tradingName" TEXT,
ADD COLUMN     "website" TEXT;

-- DropTable
DROP TABLE "contact_methods";

-- DropEnum
DROP TYPE "ContactMethodKind";

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "title" TEXT,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "surname" TEXT NOT NULL,
    "preferredName" TEXT,
    "jobTitle" TEXT,
    "department" TEXT,
    "email" TEXT,
    "alternativeEmail" TEXT,
    "phone" TEXT,
    "mobile" TEXT,
    "preferredContactMethod" "ContactPreferredMethod",
    "language" TEXT,
    "notes" TEXT,
    "status" "ContactStatus" NOT NULL DEFAULT 'ACTIVE',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "roles" "ContactRole"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communication_destinations" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "purpose" "CommunicationPurpose" NOT NULL,
    "contactId" TEXT,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_destinations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_commercial_settings" (
    "partyId" TEXT NOT NULL,
    "secondaryAccountManagerUserId" TEXT,
    "customerSegment" TEXT,
    "priceList" TEXT,
    "discountGroup" TEXT,
    "pricingAgreementReference" TEXT,
    "customerPoRequired" BOOLEAN NOT NULL DEFAULT false,
    "poFormatRules" TEXT,
    "orderReferenceRequired" BOOLEAN NOT NULL DEFAULT false,
    "partialShipmentAllowed" BOOLEAN NOT NULL DEFAULT true,
    "backordersAllowed" BOOLEAN NOT NULL DEFAULT true,
    "defaultDeliveryAddressId" TEXT,
    "deliveryMethod" TEXT,
    "shippingTerms" TEXT,
    "preferredWarehouse" TEXT,
    "shippingAccountReference" TEXT,
    "quoteTemplate" TEXT,
    "orderConfirmationPreference" TEXT,
    "invoiceDeliveryPreference" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_commercial_settings_pkey" PRIMARY KEY ("partyId")
);

-- CreateTable
CREATE TABLE "payment_terms" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "days" INTEGER,
    "type" "PaymentTermType" NOT NULL DEFAULT 'NET',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_credit_profiles" (
    "partyId" TEXT NOT NULL,
    "creditLimitAmount" INTEGER NOT NULL DEFAULT 0,
    "creditLimitCurrency" TEXT NOT NULL DEFAULT 'GBP',
    "onHold" BOOLEAN NOT NULL DEFAULT false,
    "holdReason" TEXT,
    "holdDate" TIMESTAMP(3),
    "holdSetByUserId" TEXT,
    "reviewDate" TIMESTAMP(3),
    "riskRating" TEXT,
    "insuranceLimitAmount" INTEGER,
    "collectionsStatus" TEXT,
    "statementFrequency" TEXT,
    "reminderPolicy" TEXT,
    "paymentTermId" TEXT,
    "paymentMethod" "PaymentMethod",
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_credit_profiles_pkey" PRIMARY KEY ("partyId")
);

-- CreateTable
CREATE TABLE "tax_registrations" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "registrationType" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "normalizedNumber" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "validationStatus" "TaxValidationStatus" NOT NULL DEFAULT 'NOT_VERIFIED',
    "validationDate" TIMESTAMP(3),
    "validationSource" TEXT,
    "verifiedLegalName" TEXT,
    "verifiedAddress" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "bankName" TEXT,
    "label" TEXT,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "sortCode" TEXT,
    "accountNumber" TEXT,
    "iban" TEXT,
    "bic" TEXT,
    "purpose" "BankAccountPurpose" NOT NULL DEFAULT 'OTHER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "verifiedStatus" "BankVerificationStatus" NOT NULL DEFAULT 'NOT_VERIFIED',
    "verifiedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direct_debit_mandates" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "bankAccountId" TEXT NOT NULL,
    "scheme" "DirectDebitScheme" NOT NULL,
    "mandateReference" TEXT NOT NULL,
    "status" "DirectDebitStatus" NOT NULL DEFAULT 'PENDING',
    "agreedDate" TIMESTAMP(3),
    "effectiveDate" TIMESTAMP(3),
    "firstCollectionDate" TIMESTAMP(3),
    "lastCollectionDate" TIMESTAMP(3),
    "cancellationDate" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "direct_debit_mandates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "organisationId" TEXT NOT NULL,
    "partyId" TEXT,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "description" TEXT,
    "uploadedByUserId" TEXT,
    "visibility" "DocumentVisibility" NOT NULL DEFAULT 'ALL',
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "restricted" BOOLEAN NOT NULL DEFAULT false,
    "authorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contacts_partyId_idx" ON "contacts"("partyId");

-- CreateIndex
CREATE INDEX "communication_destinations_partyId_purpose_idx" ON "communication_destinations"("partyId", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "payment_terms_organisationId_key_key" ON "payment_terms"("organisationId", "key");

-- CreateIndex
CREATE INDEX "tax_registrations_partyId_idx" ON "tax_registrations"("partyId");

-- CreateIndex
CREATE INDEX "tax_registrations_normalizedNumber_idx" ON "tax_registrations"("normalizedNumber");

-- CreateIndex
CREATE INDEX "bank_accounts_partyId_idx" ON "bank_accounts"("partyId");

-- CreateIndex
CREATE UNIQUE INDEX "direct_debit_mandates_partyId_mandateReference_key" ON "direct_debit_mandates"("partyId", "mandateReference");

-- CreateIndex
CREATE INDEX "documents_partyId_idx" ON "documents"("partyId");

-- CreateIndex
CREATE INDEX "notes_partyId_idx" ON "notes"("partyId");

-- CreateIndex
CREATE INDEX "addresses_partyId_idx" ON "addresses"("partyId");

-- CreateIndex
CREATE INDEX "parties_organisationId_status_idx" ON "parties"("organisationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "parties_organisationId_customerCode_key" ON "parties"("organisationId", "customerCode");

-- AddForeignKey
ALTER TABLE "parties" ADD CONSTRAINT "parties_parentPartyId_fkey" FOREIGN KEY ("parentPartyId") REFERENCES "parties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_destinations" ADD CONSTRAINT "communication_destinations_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communication_destinations" ADD CONSTRAINT "communication_destinations_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_commercial_settings" ADD CONSTRAINT "customer_commercial_settings_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_credit_profiles" ADD CONSTRAINT "customer_credit_profiles_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_credit_profiles" ADD CONSTRAINT "customer_credit_profiles_paymentTermId_fkey" FOREIGN KEY ("paymentTermId") REFERENCES "payment_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tax_registrations" ADD CONSTRAINT "tax_registrations_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_debit_mandates" ADD CONSTRAINT "direct_debit_mandates_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_debit_mandates" ADD CONSTRAINT "direct_debit_mandates_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "bank_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

