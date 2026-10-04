import { Prisma } from "@/generated/prisma/client";
import { db } from "@/core/db/client";
import { ONBOARDING_TASK_TEMPLATE } from "@/modules/people/domain/task-templates";
import { cycleLabel, nextAppraisalDate, nextOneToOneDate } from "@/modules/people/domain/scheduling";
import { taskDeadline } from "@/modules/people/domain/workflows";
import { setupTemplate } from "./catalogue";
import { customerImportIssue, duplicateKeyIssue, missingColumns, parentLoopIssue, rowIssue } from "./validate";

type Tx = Prisma.TransactionClient;
type Row = Record<string, string>;

export type SetupImportInput = {
  organisationId: string;
  actorUserId: string;
  entity: string;
  rows: Row[];
  applying: boolean;
  fileName: string;
  priceListId?: string;
  /** Blank customer status. Company imports keep PROSPECT; owner setup uses ACTIVE. */
  customerStatusDefault?: "PROSPECT" | "ACTIVE";
};

const KINDS = ["PRODUCT", "SERVICE", "CHARGE"];
const TAX = ["STANDARD", "ZERO_RATED", "EXEMPT"];
const EMPLOYMENT = ["FULL_TIME", "PART_TIME", "FIXED_TERM", "CONTRACTOR", "APPRENTICE"];

function fail(issue: string | null): asserts issue is null {
  if (issue) throw new Error(issue);
}

function flag(value: string, index: number, label: string) {
  const normalised = value.trim().toLowerCase();
  if (["yes", "true", "1", "y"].includes(normalised)) return true;
  if (["no", "false", "0", "n"].includes(normalised)) return false;
  throw new Error(rowIssue(index, `${label} must be yes or no.`));
}

function optionalFlag(value: string | undefined, index: number, label: string) {
  return value ? flag(value, index, label) : undefined;
}

function money(value: string, index: number, label: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) throw new Error(rowIssue(index, `${label} must be a positive amount with up to 2 decimal places.`));
  const minor = Math.round(Number(value) * 100);
  if (minor > 2147483647) throw new Error(rowIssue(index, `${label} is too large.`));
  return minor;
}

function priceDiscount(value: string | undefined, index: number) {
  const text = (value ?? "").trim();
  if (!text) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(text) || Number(text) > 100) throw new Error(rowIssue(index, "discount must be from 0 to 100, with up to 2 decimal places."));
  return Number(text);
}

function day(value: string, index: number, label: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime())) throw new Error(rowIssue(index, `${label} must be a date in YYYY-MM-DD form.`));
  return new Date(`${value}T00:00:00.000Z`);
}

function currency(value: string | undefined, index: number) {
  const code = value || "GBP";
  if (!/^[A-Z]{3}$/.test(code)) throw new Error(rowIssue(index, "currency must be a 3-letter code such as GBP."));
  return code;
}

function checkShape(input: SetupImportInput) {
  const template = setupTemplate(input.entity);
  if (!template) throw new Error("Choose a supported import.");
  const required = input.entity === "prices" && input.priceListId ? ["productCode", "minimumQuantity", "unitPrice"] : template.required;
  fail(missingColumns(input.rows, required));
  if (input.entity === "customers") return;
  if (input.entity === "contacts") fail(duplicateKeyIssue(input.rows, (row) => `${row.customerCode}|${(row.email || `${row.firstName}|${row.surname}`).toLowerCase()}`));
  if (input.entity === "customer-commercial") fail(duplicateKeyIssue(input.rows, (row) => row.customerCode));
  if (input.entity === "products") fail(duplicateKeyIssue(input.rows, (row) => row.code));
  if (input.entity === "price-lists") fail(duplicateKeyIssue(input.rows, (row) => row.key.toUpperCase()));
  if (input.entity === "prices") fail(duplicateKeyIssue(input.rows, (row) => `${input.priceListId || row.priceListKey}|${row.productCode}|${row.minimumQuantity}`));
  if (input.entity === "warehouses") fail(duplicateKeyIssue(input.rows, (row) => row.code.toUpperCase()));
  if (input.entity === "locations") fail(duplicateKeyIssue(input.rows, (row) => `${row.warehouseCode.toUpperCase()}|${row.code}`));
  if (input.entity === "employees") fail(duplicateKeyIssue(input.rows, (row) => row.employeeNumber));
}

async function importCustomers(tx: Tx, input: SetupImportInput) {
  const existing = await tx.party.findMany({ where: { organisationId: input.organisationId }, select: { id: true, customerCode: true } });
  const byCode = new Map(existing.map((customer) => [customer.customerCode, customer.id]));
  fail(customerImportIssue(input.rows, new Set(byCode.keys())));
  if (!input.applying) return;
  for (const row of input.rows) {
    const created = await tx.party.create({
      data: {
        organisationId: input.organisationId,
        kind: "COMPANY",
        name: row.name,
        tradingName: row.tradingName || null,
        customerCode: row.customerCode,
        hierarchyRole: row.hierarchyRole || "CUSTOMER",
        customerGroup: row.customerGroup || null,
        status: (row.status || input.customerStatusDefault || "PROSPECT") as "ACTIVE",
        preferredCurrency: row.currency || "GBP",
        industry: row.industry || null,
        website: row.website || null,
        tags: [],
        addresses: {
          create: [
            ...(row.billingLine1 ? [{ type: "BILLING" as const, line1: row.billingLine1, city: row.billingCity || null, postcode: row.billingPostcode || null, country: row.country || null, isDefaultBilling: true }] : []),
            ...(row.deliveryLine1 ? [{ type: "DELIVERY" as const, line1: row.deliveryLine1, city: row.deliveryCity || null, postcode: row.deliveryPostcode || null, country: row.country || null, isDefaultDelivery: true }] : []),
          ],
        },
      },
    });
    byCode.set(row.customerCode, created.id);
  }
  for (const row of input.rows) {
    if (row.parentCustomerCode) await tx.party.update({ where: { id: byCode.get(row.customerCode)! }, data: { parentPartyId: byCode.get(row.parentCustomerCode)! } });
  }
}

async function importContacts(tx: Tx, input: SetupImportInput) {
  const primaryFor = new Map<string, number>();
  for (const [index, row] of input.rows.entries()) {
    if (!row.firstName || !row.surname || row.firstName.length > 100 || row.surname.length > 100) throw new Error(rowIssue(index, "enter a first and last name."));
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) throw new Error(rowIssue(index, "enter a valid email or leave it blank."));
    if (row.isPrimary && flag(row.isPrimary, index, "Primary contact")) {
      if (primaryFor.has(row.customerCode)) throw new Error(rowIssue(index, `customer ${row.customerCode} has more than one primary contact.`));
      primaryFor.set(row.customerCode, index);
    }
  }
  const parties = await tx.party.findMany({ where: { organisationId: input.organisationId, customerCode: { in: input.rows.map((row) => row.customerCode) } }, select: { id: true, customerCode: true } });
  const byCode = new Map(parties.map((party) => [party.customerCode, party.id]));
  for (const [index, row] of input.rows.entries()) if (!byCode.has(row.customerCode)) throw new Error(rowIssue(index, `customer ${row.customerCode} was not found. Import customers first.`));
  if (!input.applying) return;
  for (const [index, row] of input.rows.entries()) {
    const partyId = byCode.get(row.customerCode)!;
    const isPrimary = row.isPrimary ? flag(row.isPrimary, index, "Primary contact") : false;
    const existing = await tx.contact.findFirst({ where: { partyId, ...(row.email ? { email: { equals: row.email, mode: "insensitive" } } : { firstName: row.firstName, surname: row.surname }) } });
    const data = { firstName: row.firstName, surname: row.surname, jobTitle: row.jobTitle || null, department: row.department || null, email: row.email || null, phone: row.phone || null, mobile: row.mobile || null, isPrimary };
    const saved = existing ? await tx.contact.update({ where: { id: existing.id }, data }) : await tx.contact.create({ data: { partyId, ...data } });
    if (isPrimary) await tx.contact.updateMany({ where: { partyId, id: { not: saved.id } }, data: { isPrimary: false } });
  }
}

async function importCommercial(tx: Tx, input: SetupImportInput) {
  const parties = await tx.party.findMany({ where: { organisationId: input.organisationId, customerCode: { in: input.rows.map((row) => row.customerCode) } }, select: { id: true, customerCode: true } });
  const lists = await tx.priceList.findMany({ where: { organisationId: input.organisationId }, select: { id: true, key: true } });
  const byCode = new Map(parties.map((party) => [party.customerCode, party.id]));
  const byList = new Map(lists.map((list) => [list.key.toUpperCase(), list.id]));
  for (const [index, row] of input.rows.entries()) {
    if (!byCode.has(row.customerCode)) throw new Error(rowIssue(index, `customer ${row.customerCode} was not found. Import customers first.`));
    if (row.priceListKey && !byList.has(row.priceListKey.toUpperCase())) throw new Error(rowIssue(index, `price list ${row.priceListKey} was not found. Import price lists first.`));
    optionalFlag(row.customerPoRequired, index, "Purchase order required");
    optionalFlag(row.orderReferenceRequired, index, "Order reference required");
    optionalFlag(row.partialShipmentAllowed, index, "Partial shipment");
    optionalFlag(row.backordersAllowed, index, "Back orders");
    if ((row.deliveryMethod || "").length > 80 || (row.shippingTerms || "").length > 80) throw new Error(rowIssue(index, "delivery method and shipping terms must be 80 characters or fewer."));
  }
  if (!input.applying) return;
  for (const [index, row] of input.rows.entries()) {
    const partyId = byCode.get(row.customerCode)!;
    const provided = {
      ...(row.priceListKey ? { priceList: byList.get(row.priceListKey.toUpperCase())! } : {}),
      ...(row.customerPoRequired ? { customerPoRequired: flag(row.customerPoRequired, index, "Purchase order required") } : {}),
      ...(row.orderReferenceRequired ? { orderReferenceRequired: flag(row.orderReferenceRequired, index, "Order reference required") } : {}),
      ...(row.partialShipmentAllowed ? { partialShipmentAllowed: flag(row.partialShipmentAllowed, index, "Partial shipment") } : {}),
      ...(row.backordersAllowed ? { backordersAllowed: flag(row.backordersAllowed, index, "Back orders") } : {}),
      ...(row.deliveryMethod ? { deliveryMethod: row.deliveryMethod } : {}),
      ...(row.shippingTerms ? { shippingTerms: row.shippingTerms } : {}),
    };
    await tx.customerCommercialSettings.upsert({ where: { partyId }, create: { partyId, ...provided }, update: provided });
  }
}

async function importProducts(tx: Tx, input: SetupImportInput) {
  for (const [index, row] of input.rows.entries()) {
    if (!row.name || row.name.length > 200 || row.code.length > 64) throw new Error(rowIssue(index, "enter a product code and name."));
    if (!KINDS.includes(row.kind)) throw new Error(rowIssue(index, "kind must be PRODUCT, SERVICE or CHARGE."));
    if (!TAX.includes(row.taxCategory)) throw new Error(rowIssue(index, "tax category must be STANDARD, ZERO_RATED or EXEMPT."));
    currency(row.currency, index);
    money(row.price, index, "Price");
    if ((row.unit || "each").length > 30) throw new Error(rowIssue(index, "unit must be 30 characters or fewer."));
  }
  if (!input.applying) return;
  for (const [index, row] of input.rows.entries()) {
    const data = { name: row.name, kind: row.kind as "PRODUCT", unitOfMeasure: row.unit || "each", basePriceAmount: money(row.price, index, "Price"), baseCurrency: currency(row.currency, index), taxCategory: row.taxCategory };
    await tx.product.upsert({ where: { organisationId_code: { organisationId: input.organisationId, code: row.code } }, create: { organisationId: input.organisationId, code: row.code, ...data }, update: data });
  }
}

async function importPriceLists(tx: Tx, input: SetupImportInput) {
  for (const [index, row] of input.rows.entries()) {
    const key = row.key.toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9-]{0,30}$/.test(key)) throw new Error(rowIssue(index, "price list key must use letters, numbers and hyphens, up to 31 characters."));
    if (!row.name || row.name.length > 120) throw new Error(rowIssue(index, "enter a price list name."));
    currency(row.currency, index);
  }
  if (!input.applying) return;
  for (const [index, row] of input.rows.entries()) {
    const key = row.key.toUpperCase();
    const nextCurrency = currency(row.currency, index);
    const existing = await tx.priceList.findUnique({ where: { organisationId_key: { organisationId: input.organisationId, key } }, include: { _count: { select: { entries: true } } } });
    if (existing && existing.currency !== nextCurrency && existing._count.entries > 0) throw new Error(rowIssue(index, `price list ${key} already has prices. Create a new list to change its currency.`));
    if (existing) await tx.priceList.update({ where: { id: existing.id }, data: { name: row.name, currency: nextCurrency, baseCurrency: nextCurrency } });
    else await tx.priceList.create({ data: { organisationId: input.organisationId, key, name: row.name, currency: nextCurrency, baseCurrency: nextCurrency } });
  }
}

async function importPrices(tx: Tx, input: SetupImportInput) {
  const list = input.priceListId ? await tx.priceList.findFirst({ where: { id: input.priceListId, organisationId: input.organisationId } }) : null;
  if (input.priceListId && !list) throw new Error("Choose a price list in this company.");
  const lists = await tx.priceList.findMany({ where: { organisationId: input.organisationId, ...(input.priceListId ? { id: input.priceListId } : { key: { in: input.rows.map((row) => (row.priceListKey || "").toUpperCase()) } }) } });
  const products = await tx.product.findMany({ where: { organisationId: input.organisationId, code: { in: input.rows.map((row) => row.productCode) } }, select: { id: true, code: true } });
  const byList = new Map(lists.map((item) => [item.key.toUpperCase(), item]));
  const byProduct = new Map(products.map((product) => [product.code, product.id]));
  for (const [index, row] of input.rows.entries()) {
    const chosen = input.priceListId ? list : byList.get((row.priceListKey || "").toUpperCase());
    if (!chosen) throw new Error(rowIssue(index, `price list ${row.priceListKey || ""} was not found. Import price lists first.`));
    if (!byProduct.has(row.productCode)) throw new Error(rowIssue(index, `product ${row.productCode} was not found. Import products first.`));
    if (!/^\d+$/.test(row.minimumQuantity) || Number(row.minimumQuantity) < 1 || Number(row.minimumQuantity) > 1000000) throw new Error(rowIssue(index, "minimum quantity must be a whole number from 1."));
    money(row.unitPrice, index, "Unit price");
    priceDiscount(row.discount, index);
    const from = row.validFrom ? day(row.validFrom, index, "Valid from") : null;
    const to = row.validTo ? day(row.validTo, index, "Valid to") : null;
    if (from && to && from > to) throw new Error(rowIssue(index, "the start date is after the end date."));
  }
  if (!input.applying) return;
  for (const [index, row] of input.rows.entries()) {
    const chosen = (input.priceListId ? list : byList.get((row.priceListKey || "").toUpperCase()))!;
    const productId = byProduct.get(row.productCode)!;
    const minimumQuantity = Number(row.minimumQuantity);
    const unitPriceAmount = money(row.unitPrice, index, "Unit price");
    const discount = priceDiscount(row.discount, index);
    const validFrom = row.validFrom ? day(row.validFrom, index, "Valid from") : null;
    const validTo = row.validTo ? day(row.validTo, index, "Valid to") : null;
    await tx.priceListEntry.upsert({
      where: { priceListId_productId_minimumQuantity: { priceListId: chosen.id, productId, minimumQuantity } },
      create: { priceListId: chosen.id, productId, minimumQuantity, unitPriceAmount, percentage: discount ?? 0, validFrom, validTo },
      update: { unitPriceAmount, validFrom, validTo, scope: "PRODUCT", method: "FIXED", categoryCode: null, adjustmentAmount: 0, active: true, ...(discount == null ? {} : { percentage: discount }) },
    });
  }
}

async function importWarehouses(tx: Tx, input: SetupImportInput) {
  for (const [index, row] of input.rows.entries()) {
    if (!/^[A-Z0-9][A-Z0-9-]{0,30}$/.test(row.code.toUpperCase())) throw new Error(rowIssue(index, "warehouse code must use letters, numbers and hyphens."));
    if (!row.name || row.name.length > 120) throw new Error(rowIssue(index, "enter a warehouse name."));
  }
  if (!input.applying) return;
  for (const row of input.rows) {
    const code = row.code.toUpperCase();
    await tx.warehouse.upsert({ where: { organisationId_code: { organisationId: input.organisationId, code } }, create: { organisationId: input.organisationId, code, name: row.name }, update: { name: row.name } });
  }
}

async function importLocations(tx: Tx, input: SetupImportInput) {
  const warehouses = await tx.warehouse.findMany({ where: { organisationId: input.organisationId, code: { in: [...new Set(input.rows.map((row) => row.warehouseCode.toUpperCase()))] } }, select: { id: true, code: true } });
  const byWarehouse = new Map(warehouses.map((warehouse) => [warehouse.code, warehouse.id]));
  for (const [index, row] of input.rows.entries()) {
    if (!byWarehouse.has(row.warehouseCode.toUpperCase())) throw new Error(rowIssue(index, `warehouse ${row.warehouseCode} was not found. Import warehouses first.`));
    if (!row.code || row.code.length > 40 || !row.name || row.name.length > 120) throw new Error(rowIssue(index, "enter a location code and name."));
  }
  const existing = await tx.stockLocation.findMany({ where: { organisationId: input.organisationId, warehouseId: { in: [...byWarehouse.values()] } }, select: { code: true, warehouseId: true } });
  const existingKeys = new Set(existing.map((location) => `${location.warehouseId}|${location.code}`));
  for (const warehouseId of new Set(input.rows.map((row) => byWarehouse.get(row.warehouseCode.toUpperCase())!))) {
    const scoped = input.rows.filter((row) => byWarehouse.get(row.warehouseCode.toUpperCase()) === warehouseId);
    const known = new Set([...existingKeys].filter((key) => key.startsWith(`${warehouseId}|`)).map((key) => key.slice(warehouseId.length + 1)));
    fail(parentLoopIssue(scoped.map((row) => ({ code: row.code, parent: row.parentLocationCode ?? "" })), known, new Map(scoped.map((row) => [row.code, input.rows.indexOf(row)]))));
  }
  if (!input.applying) return;
  for (const row of input.rows) {
    const warehouseId = byWarehouse.get(row.warehouseCode.toUpperCase())!;
    await tx.stockLocation.upsert({ where: { warehouseId_code: { warehouseId, code: row.code } }, create: { organisationId: input.organisationId, warehouseId, code: row.code, name: row.name }, update: { name: row.name } });
  }
  const saved = await tx.stockLocation.findMany({ where: { organisationId: input.organisationId, warehouseId: { in: [...byWarehouse.values()] } }, select: { id: true, warehouseId: true, code: true } });
  const byKey = new Map(saved.map((location) => [`${location.warehouseId}|${location.code}`, location.id]));
  for (const [index, row] of input.rows.entries()) {
    if (!row.parentLocationCode) continue;
    const warehouseId = byWarehouse.get(row.warehouseCode.toUpperCase())!;
    const parentId = byKey.get(`${warehouseId}|${row.parentLocationCode}`);
    if (!parentId) throw new Error(rowIssue(index, `parent location ${row.parentLocationCode} is missing.`));
    await tx.stockLocation.update({ where: { id: byKey.get(`${warehouseId}|${row.code}`)! }, data: { parentId } });
  }
}

async function importEmployees(tx: Tx, input: SetupImportInput) {
  for (const [index, row] of input.rows.entries()) {
    if (!row.firstName || !row.lastName || row.firstName.length > 100 || row.lastName.length > 100) throw new Error(rowIssue(index, "enter a first and last name."));
    if (row.employeeNumber.length > 30) throw new Error(rowIssue(index, "employee number must be 30 characters or fewer."));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email) || row.email.length > 200) throw new Error(rowIssue(index, "enter an email address."));
    if (!row.jobTitle || row.jobTitle.length > 150) throw new Error(rowIssue(index, "enter a job title."));
    if ((row.department || "").length > 100) throw new Error(rowIssue(index, "department must be 100 characters or fewer."));
    if (row.employmentType && !EMPLOYMENT.includes(row.employmentType)) throw new Error(rowIssue(index, "employment type must be FULL_TIME, PART_TIME, FIXED_TERM, CONTRACTOR or APPRENTICE."));
    day(row.startDate, index, "Start date");
    if (row.annualSalary) money(row.annualSalary, index, "Annual salary");
    if (row.annualSalary && Number(row.annualSalary) > 20000000) throw new Error(rowIssue(index, "annual salary is too large."));
    currency(row.currency, index);
    if ((row.phone || "").length > 50) throw new Error(rowIssue(index, "phone must be 50 characters or fewer."));
  }
  const existing = await tx.employee.findMany({ where: { organisationId: input.organisationId }, select: { id: true, employeeNumber: true } });
  const known = new Set(existing.map((employee) => employee.employeeNumber));
  fail(parentLoopIssue(input.rows.map((row) => ({ code: row.employeeNumber, parent: row.managerEmployeeNumber ?? "" })), known, new Map(input.rows.map((row, index) => [row.employeeNumber, index]))));
  if (!input.applying) return;
  const org = await tx.organisation.findUniqueOrThrow({ where: { id: input.organisationId }, select: { hrAppraisalCadenceMonths: true, hrOneToOneCadenceWeeks: true } });
  for (const [index, row] of input.rows.entries()) {
    const data = {
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      jobTitle: row.jobTitle,
      department: row.department || null,
      employmentType: (row.employmentType || "FULL_TIME") as "FULL_TIME",
      ...(row.phone ? { phone: row.phone } : {}),
      currency: currency(row.currency, index),
      ...(row.annualSalary ? { annualSalaryMinorUnits: money(row.annualSalary, index, "Annual salary") } : {}),
    };
    const current = existing.find((employee) => employee.employeeNumber === row.employeeNumber);
    if (current) await tx.employee.update({ where: { id: current.id }, data });
    else {
      const employee = await tx.employee.create({ data: { organisationId: input.organisationId, employeeNumber: row.employeeNumber, startDate: day(row.startDate, index, "Start date"), status: "ONBOARDING", phone: row.phone || null, ...data } });
      await tx.employeeTask.createMany({ data: ONBOARDING_TASK_TEMPLATE.map((task) => ({ organisationId: input.organisationId, employeeId: employee.id, phase: "ONBOARDING" as const, title: task.title, category: task.category, dueDate: taskDeadline(day(row.startDate, index, "Start date"), task.category, "ONBOARDING", task.title), assignedToUserId: input.actorUserId })) });
      const firstAppraisalAt = nextAppraisalDate(day(row.startDate, index, "Start date"), null, org.hrAppraisalCadenceMonths);
      await tx.appraisal.create({ data: { organisationId: input.organisationId, employeeId: employee.id, reviewerUserId: input.actorUserId, cycle: cycleLabel(firstAppraisalAt), scheduledAt: firstAppraisalAt } });
      await tx.oneToOne.create({ data: { organisationId: input.organisationId, employeeId: employee.id, managerUserId: input.actorUserId, scheduledAt: nextOneToOneDate(new Date(), null, org.hrOneToOneCadenceWeeks) } });
      await tx.employeeHistoryEvent.create({ data: { organisationId: input.organisationId, employeeId: employee.id, type: "CREATED", description: `Joined as ${row.jobTitle}${row.department ? ` in ${row.department}` : ""}.` } });
    }
  }
  const saved = await tx.employee.findMany({ where: { organisationId: input.organisationId, employeeNumber: { in: input.rows.flatMap((row) => [row.employeeNumber, row.managerEmployeeNumber].filter(Boolean)) } }, select: { id: true, employeeNumber: true } });
  const byNumber = new Map(saved.map((employee) => [employee.employeeNumber, employee.id]));
  for (const row of input.rows) {
    if (!row.managerEmployeeNumber) continue;
    await tx.employee.update({ where: { id: byNumber.get(row.employeeNumber)! }, data: { managerId: byNumber.get(row.managerEmployeeNumber)! } });
  }
}

export async function runSetupImport(input: SetupImportInput) {
  checkShape(input);
  await db.$transaction(async (tx) => {
    if (input.entity === "customers") await importCustomers(tx, input);
    else if (input.entity === "contacts") await importContacts(tx, input);
    else if (input.entity === "customer-commercial") await importCommercial(tx, input);
    else if (input.entity === "products") await importProducts(tx, input);
    else if (input.entity === "price-lists") await importPriceLists(tx, input);
    else if (input.entity === "prices") await importPrices(tx, input);
    else if (input.entity === "warehouses") await importWarehouses(tx, input);
    else if (input.entity === "locations") await importLocations(tx, input);
    else if (input.entity === "employees") await importEmployees(tx, input);
    else throw new Error("Choose a supported import.");
    if (input.applying) await tx.auditEntry.create({ data: { organisationId: input.organisationId, actorUserId: input.actorUserId, action: `import.${input.entity}`, entityType: "Import", entityId: crypto.randomUUID(), after: { rows: input.rows.length, fileName: input.fileName.slice(0, 120) } } });
  }, { isolationLevel: "Serializable", timeout: 60_000 });
  return { preview: input.rows.slice(0, 10) };
}
