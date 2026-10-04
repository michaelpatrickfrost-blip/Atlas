import type { Session } from "@/core/auth/session";
import { assertCapability } from "@/core/permissions/check";
import { db } from "@/core/db/client";
import { STARTER_CATEGORIES, categoryClass, categoryParentOk, cleanCategoryCode } from "@/core/products/categories";
import { assertProductLinks, cleanPackUnit, packContainsLoops, type ProductLinkDraft } from "@/core/products/links";
import { measuresFromInput } from "@/core/products/physical";

const kinds = ["PRODUCT", "SERVICE", "CHARGE"] as const;
const taxes = ["STANDARD", "ZERO_RATED", "EXEMPT"] as const;
const tracking = ["NONE", "LOT", "SERIAL"] as const;

export async function saveProductDetails(session: Session, productId: string, input: {
  code: string;
  name: string;
  description: string;
  categoryCode: string;
  itemClass: string;
  unit: string;
  price: number;
  currency: string;
  taxCategory: string;
  kind: string;
  barcode: string;
  trackingMode: string;
  active: boolean;
}) {
  assertCapability(session, "core.products.manage");
  const code = input.code.trim();
  const name = input.name.trim();
  const unitOfMeasure = input.unit.trim();
  const baseCurrency = input.currency.trim().toUpperCase();
  const basePriceAmount = Math.round(Number(input.price) * 100);
  const categoryCode = input.categoryCode.trim().slice(0, 60) || null;
  const itemClass = categoryClass(input.itemClass);
  const barcode = input.barcode.trim().slice(0, 80) || null;
  const description = input.description.trim().slice(0, 2000) || null;
  if (!code || code.length > 60 || !name || name.length > 200 || !unitOfMeasure || unitOfMeasure.length > 30) throw new Error("Enter a SKU, name and unit.");
  if (!Number.isSafeInteger(basePriceAmount) || basePriceAmount < 0 || basePriceAmount > 2147483647) throw new Error("Enter a valid standard price.");
  if (!/^[A-Z]{3}$/.test(baseCurrency)) throw new Error("Currency is a three-letter code.");
  if (!kinds.includes(input.kind as typeof kinds[number])) throw new Error("Choose a product, service or charge.");
  if (!taxes.includes(input.taxCategory as typeof taxes[number])) throw new Error("Choose a tax category.");
  if (!tracking.includes(input.trackingMode as typeof tracking[number])) throw new Error("Choose how stock is tracked.");
  const product = await db.product.findFirst({ where: { id: productId, organisationId: session.organisationId } });
  if (!product) throw new Error("Choose a product in this company.");
  if (categoryCode) {
    const category = await db.productCategory.findFirst({ where: { organisationId: session.organisationId, code: categoryCode } });
    if (!category) throw new Error("Choose a category from the catalogue.");
  }
  const codeTaken = await db.product.findFirst({ where: { organisationId: session.organisationId, code, NOT: { id: product.id } }, select: { id: true } });
  if (codeTaken) throw new Error("Another product already uses that SKU.");
  if (barcode) {
    const barcodeTaken = await db.product.findFirst({ where: { organisationId: session.organisationId, barcode, NOT: { id: product.id } }, select: { id: true } });
    if (barcodeTaken) throw new Error("Another product already uses that barcode.");
  }
  const data = {
    code,
    name,
    description,
    categoryCode,
    itemClass,
    unitOfMeasure,
    basePriceAmount,
    baseCurrency,
    taxCategory: input.taxCategory,
    kind: input.kind as typeof kinds[number],
    barcode,
    trackingMode: input.trackingMode,
    active: input.active,
  };
  await db.$transaction(async (tx) => {
    await tx.product.update({ where: { id: product.id }, data });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "product.updated", entityType: "Product", entityId: product.id, before: { code: product.code, name: product.name, categoryCode: product.categoryCode, itemClass: product.itemClass, basePriceAmount: product.basePriceAmount }, after: data } });
  });
}

export async function saveProductCategory(session: Session, input: {
  id?: string;
  code: string;
  name: string;
  description: string;
  itemClass: string;
  parentId: string;
}) {
  assertCapability(session, "core.products.manage");
  const code = cleanCategoryCode(input.code);
  const name = input.name.trim().slice(0, 120);
  const description = input.description.trim().slice(0, 500);
  const itemClass = categoryClass(input.itemClass);
  const parentId = input.parentId.trim() || null;
  if (!name) throw new Error("Enter a category name.");
  const rows = await db.productCategory.findMany({ where: { organisationId: session.organisationId }, select: { id: true, parentId: true, code: true } });
  const existing = input.id ? rows.find((row) => row.id === input.id) : rows.find((row) => row.code === code);
  if (input.id && !existing) throw new Error("That category is not in this company.");
  if (!categoryParentOk(rows, existing?.id ?? null, parentId)) throw new Error("A category cannot sit inside itself.");
  if (parentId) {
    const parent = await db.productCategory.findFirst({ where: { id: parentId, organisationId: session.organisationId } });
    if (!parent) throw new Error("Choose a parent category in this company.");
  }
  const duplicate = await db.productCategory.findFirst({ where: { organisationId: session.organisationId, code, ...(existing ? { NOT: { id: existing.id } } : {}) }, select: { id: true } });
  if (duplicate) throw new Error("That category code is already used.");
  await db.$transaction(async (tx) => {
    const saved = existing
      ? await tx.productCategory.update({ where: { id: existing.id }, data: { code, name, description, itemClass, parentId, active: true } })
      : await tx.productCategory.create({ data: { organisationId: session.organisationId, code, name, description, itemClass, parentId, position: rows.length } });
    if (existing && existing.code !== code) {
      await tx.product.updateMany({ where: { organisationId: session.organisationId, categoryCode: existing.code }, data: { categoryCode: code } });
      await tx.priceListEntry.updateMany({ where: { categoryCode: existing.code, priceList: { organisationId: session.organisationId } }, data: { categoryCode: code } });
    }
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: existing ? "product.category.updated" : "product.category.created", entityType: "ProductCategory", entityId: saved.id, after: { code, name, itemClass } } });
  });
}

export async function retireProductCategory(session: Session, categoryId: string) {
  assertCapability(session, "core.products.manage");
  const category = await db.productCategory.findFirst({ where: { id: categoryId, organisationId: session.organisationId } });
  if (!category) throw new Error("That category is not in this company.");
  await db.productCategory.update({ where: { id: category.id }, data: { active: false } });
}

export async function saveProductPack(session: Session, productId: string, input: { packUnit: string; unitsPerPack: string; packsPerLayer: string; layersPerPallet: string; itemsPerPallet?: string }) {
  assertCapability(session, "core.products.manage");
  const product = await db.product.findFirst({ where: { id: productId, organisationId: session.organisationId } });
  if (!product) throw new Error("Choose a product in this company.");
  if (product.kind !== "PRODUCT") throw new Error("Services and charges are not packed as goods.");
  const packUnit = cleanPackUnit(input.packUnit);
  const measures = measuresFromInput({ unitsPerPack: input.unitsPerPack, packsPerLayer: input.packsPerLayer, layersPerPallet: input.layersPerPallet, itemsPerPallet: input.itemsPerPallet });
  await db.product.update({ where: { id: product.id }, data: { packUnit, unitsPerPack: measures.unitsPerPack, packsPerLayer: measures.packsPerLayer, layersPerPallet: measures.layersPerPallet } });
}

export async function saveProductLinks(session: Session, productId: string, links: ProductLinkDraft[]) {
  assertCapability(session, "core.products.manage");
  const product = await db.product.findFirst({ where: { id: productId, organisationId: session.organisationId } });
  if (!product) throw new Error("Choose a product in this company.");
  const drafts = links.slice(0, 40).map((link) => ({ relatedProductId: String(link.relatedProductId ?? ""), kind: link.kind, quantity: Number(link.quantity), notes: String(link.notes ?? "").trim().slice(0, 240) }));
  assertProductLinks(product.id, drafts);
  const ids = [...new Set(drafts.map((link) => link.relatedProductId))];
  const found = ids.length ? await db.product.findMany({ where: { organisationId: session.organisationId, id: { in: ids } }, select: { id: true } }) : [];
  if (found.length !== ids.length) throw new Error("Choose products from this company.");
  const existing = await db.productLink.findMany({ where: { organisationId: session.organisationId, kind: "CONTAINS" }, select: { productId: true, relatedProductId: true } });
  const children = drafts.filter((link) => link.kind === "CONTAINS").map((link) => link.relatedProductId);
  if (packContainsLoops(product.id, children, existing)) throw new Error("A pack cannot contain itself through another pack.");
  await db.$transaction(async (tx) => {
    await tx.productLink.deleteMany({ where: { organisationId: session.organisationId, productId: product.id } });
    if (drafts.length) await tx.productLink.createMany({ data: drafts.map((link) => ({ organisationId: session.organisationId, productId: product.id, relatedProductId: link.relatedProductId, kind: link.kind, quantity: link.quantity, notes: link.notes ?? "" })) });
    await tx.auditEntry.create({ data: { organisationId: session.organisationId, actorUserId: session.userId, action: "product.links", entityType: "Product", entityId: product.id, after: { packUnit: product.packUnit, links: drafts } } });
  });
}

export async function addStarterCategories(session: Session) {
  assertCapability(session, "core.products.manage");
  const existing = await db.productCategory.findMany({ where: { organisationId: session.organisationId }, select: { code: true } });
  const have = new Set(existing.map((row) => row.code));
  const missing = STARTER_CATEGORIES.filter((row) => !have.has(row.code));
  if (!missing.length) return 0;
  await db.productCategory.createMany({ data: missing.map((row, index) => ({ organisationId: session.organisationId, ...row, position: existing.length + index })) });
  return missing.length;
}
