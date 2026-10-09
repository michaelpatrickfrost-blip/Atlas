/**
 * Test company for Michael to explore end-to-end.
 *
 * Creates one Test company (isTest:true) and fills it with a connected story:
 * customers, products, opening stock, confirmed sales orders, and deliveries
 * taken all the way through pick → dispatch → delivered.
 *
 * It drives the real Logistics and Stock services (the same functions the UI
 * uses), and mirrors what Sales confirmation records, so every row the screens
 * read is a record the app would itself have produced.
 *
 * Plant is deliberately left empty — Michael adds work centres, machines and
 * a recipe in the UI next.
 *
 * Re-run safe: an existing company with the same slug is wiped and rebuilt.
 *
 * Run on the central server (the live database lives there):
 *   cd /opt/atlas && node_modules/.bin/tsx scripts/seed-michael-test-company.ts
 */
import bcrypt from "bcryptjs";
import { db } from "@/core/db/client";
import { wipeCompany } from "@/core/admin/wipe-company";
import { sessionForUser } from "@/core/auth/session";
import { STANDARD_ROLES } from "@/core/permissions/capabilities";
import { getImplementedModules, getModule } from "@/core/modules/registry";
import { syncAdminCapabilities } from "@/core/permissions/role-sync";
import { handoffSalesOrder } from "@/core/logistics/handoff";
import { stockProvider } from "@/modules/stock/services/provider";
import { allocateRequirement, releaseRequirement } from "@/modules/logistics/services/demand";
import { claimTask, scanTask, completeTask } from "@/modules/logistics/services/work";
import { createShipment, dispatchShipment, confirmDelivery } from "@/modules/logistics/services/shipping";
import { commercialLineNet, settleSale } from "@/modules/sales/domain/uk-sale";

const SLUG = "michael-test-works";
const COMPANY_NAME = "Michael Test Works Ltd";
const COMPANY_EMAIL = "michael.demo@atlassystem.online";
const COMPANY_PASSWORD = "AtlasDemo-2026-test";
const STAFF_EMAIL = "kickablur@icloud.com";

/** Apps the company needs. Manufacturing depends on stock + products + sales. */
const MODULES = ["products", "sales", "stock", "logistics", "manufacturing"];

const day = 86_400_000;
const onward = (days: number) => new Date(Date.now() + days * day);
const UK = { country: "United Kingdom" } as const;
const addressFor = (city: string, postcode: string) => ({ line1: "Units 4–6 Ridings Industrial Park", line2: "Bruntcliffe Way", city, region: "West Yorkshire", postcode, ...UK });

async function main() {
  const existing = await db.organisation.findUnique({ where: { slug: SLUG }, select: { id: true, isTest: true } });
  if (existing) {
    if (!existing.isTest) throw new Error(`Refusing to wipe ${SLUG}: it is not marked as a Test company.`);
    console.log(`Rebuilding ${SLUG} — removing the previous copy first.`);
    await wipeCompany(existing.id);
  }

  const org = await db.organisation.create({ data: { name: COMPANY_NAME, slug: SLUG, kind: "CUSTOMER", status: "ACTIVE", isTest: true } });
  const orgId = org.id;
  console.log(`Company created: ${org.name}  (${orgId})`);

  // ---- Apps: entitled + enabled. Atlas staff also see every app regardless.
  await db.moduleState.createMany({ data: MODULES.map((moduleId) => ({ organisationId: orgId, moduleId, entitled: true, enabled: true })) });
  console.log(`Apps enabled: ${MODULES.join(", ")}`);

  // ---- People. A dedicated company login for exploring, plus Michael's own Atlas
  // account as a member so he can also open it from Atlas Admin.
  const demoUser = await db.user.create({ data: { name: "Atlas Test Works (demo)", email: COMPANY_EMAIL, passwordHash: await bcrypt.hash(COMPANY_PASSWORD, 10) } });
  const demoMembership = await db.membership.create({ data: { organisationId: orgId, userId: demoUser.id } });
  const staffUser = await db.user.findUnique({ where: { email: STAFF_EMAIL }, select: { id: true, name: true } });
  const staffMembership = staffUser ? await db.membership.create({ data: { organisationId: orgId, userId: staffUser.id } }) : null;

  // ---- Roles: create the standard roles and make both members administrators,
  // exactly as company creation does.
  for (const roleDef of STANDARD_ROLES) {
    const role = await db.role.create({ data: { organisationId: orgId, key: roleDef.key, name: roleDef.name, capabilities: roleDef.capabilities } });
    if (roleDef.key === "admin") {
      await db.roleOnMembership.create({ data: { membershipId: demoMembership.id, roleId: role.id } });
      if (staffMembership) await db.roleOnMembership.create({ data: { membershipId: staffMembership.id, roleId: role.id } });
    }
  }
  await syncAdminCapabilities(orgId);

  const session = await sessionForUser(orgId, demoUser.id);
  if (!session) throw new Error("The demo user could not be signed in.");
  const actor = { organisationId: orgId, userId: demoUser.id };
  const prove = (label: string) => console.log(`  ✓ ${label}`);

  // ---- Logistics policy: a simple warehouse model, so a completed pick creates the
  // shipment. Reservations taken at confirmation; the order still needs releasing.
  await db.logisticsPolicy.create({ data: { organisationId: orgId, mode: "SIMPLE", reservationPolicy: "ON_CONFIRMATION", releaseMethod: "MANUAL", packVerification: "NONE" } });

  // ---- Inventory: two sites/warehouses. Stock locations are created on first receipt.
  const leeds = await db.site.create({ data: { organisationId: orgId, name: "Leeds Works", code: "LEEDS" } });
  const midlands = await db.site.create({ data: { organisationId: orgId, name: "Midlands Depot", code: "MID" } });
  const mainWarehouse = await db.warehouse.create({ data: { organisationId: orgId, siteId: leeds.id, name: "Main Warehouse", code: "MAIN" } });
  const depotWarehouse = await db.warehouse.create({ data: { organisationId: orgId, siteId: midlands.id, name: "Depot Store", code: "DEPOT" } });
  prove(`Sites and warehouses: ${leeds.code}/${midlands.code} · ${mainWarehouse.code}/${depotWarehouse.code}`);

  // ---- Customers: Customer Master records with a contact and a delivery address.
  const customerSeeds = [
    { name: "Ridgeline Fabrications Ltd", first: "Priya", last: "Raman", city: "Leeds", postcode: "LS27 0JG", industry: "Metal fabrication" },
    { name: "Northgate Electricals Ltd", first: "Tom", last: "Beckett", city: "Manchester", postcode: "M17 1WA", industry: "Electrical contracting" },
    { name: "Coastal Plant Hire Ltd", first: "Sara", last: "Okafor", city: "Hull", postcode: "HU9 1TA", industry: "Plant hire" },
  ];
  const customers: Array<{ id: string; name: string; address: ReturnType<typeof addressFor> }> = [];
  for (const [index, seed] of customerSeeds.entries()) {
    const address = addressFor(seed.city, seed.postcode);
    const party = await db.party.create({
      data: {
        organisationId: orgId,
        kind: "COMPANY",
        name: seed.name,
        customerCode: `C${String(index + 1).padStart(6, "0")}`,
        status: "ACTIVE",
        hierarchyRole: "CUSTOMER",
        customerGroup: "Trade",
        industry: seed.industry,
        countryOfRegistration: "United Kingdom",
        preferredCurrency: "GBP",
        relationshipStartDate: onward(-420),
        accountManagerUserId: demoUser.id,
        tags: ["trade"],
        contacts: { create: [{ firstName: seed.first, surname: seed.last, email: `${seed.first.toLowerCase()}.${seed.last.toLowerCase()}@${seed.name.split(" ")[0].toLowerCase()}.example`, phone: "0113 496 0000", jobTitle: "Buyer", isPrimary: true, roles: ["PRIMARY", "PURCHASING"] }] },
        addresses: { create: [{ type: "DELIVERY", label: "Goods in", ...address, deliveryInstructions: "Deliver to goods-in, 08:00–16:00, ask for the stores team.", isDefaultDelivery: true, isDefaultBilling: true }] },
      },
    });
    await db.customerCreditProfile.create({ data: { partyId: party.id, creditLimitAmount: 5_000_00, creditLimitCurrency: "GBP", reviewDate: onward(120) } });
    customers.push({ id: party.id, name: party.name, address });
  }
  prove(`Customers: ${customers.map((c) => c.name).join(", ")}`);

  // ---- Products: bought parts, a sub-assembly, finished conveyors, and a service.
  // reorder/safety levels are set so the two conveyor orders create genuine net
  // requirements: finished conveyors start at zero, and MOTOR-1K5 opening stock is
  // deliberately below what the plan consumes so MRP raises a real shortage.
  const productSeeds = [
    { code: "STL-SHEET", name: "3mm mild steel sheet", price: 4_200, uom: "sheet", kind: "PRODUCT" as const, safety: 40, lead: 5 },
    { code: "FAST-M8", name: "M8 bolt and washer set", price: 65, uom: "each", kind: "PRODUCT" as const, safety: 200, lead: 5 },
    { code: "POWDER-GRY", name: "Powder coat, graphite grey", price: 1_850, uom: "kg", kind: "PRODUCT" as const, safety: 20, lead: 7 },
    { code: "MOTOR-1K5", name: "1.5kW drive motor", price: 18_900, uom: "each", kind: "PRODUCT" as const, safety: 4, lead: 14 },
    { code: "BRACKET-01", name: "Fabricated mounting bracket", price: 2_150, uom: "each", kind: "PRODUCT" as const, safety: 20, lead: 3 },
    { code: "FRAME-02", name: "Welded conveyor frame", price: 24_500, uom: "each", kind: "PRODUCT" as const, safety: 4, lead: 4 },
    { code: "CONV-1500", name: "Conveyor 1500mm, standard", price: 96_000, uom: "each", kind: "PRODUCT" as const, safety: 2, lead: 5 },
    { code: "CONV-HEAVY", name: "Conveyor 1500mm, heavy duty", price: 134_500, uom: "each", kind: "PRODUCT" as const, safety: 2, lead: 6 },
    { code: "INSTALL-DAY", name: "Installation day (engineer)", price: 58_000, uom: "day", kind: "SERVICE" as const, safety: 0, lead: 0 },
  ];
  const products = new Map<string, string>();
  for (const seed of productSeeds) {
    const product = await db.product.create({
      data: {
        organisationId: orgId,
        code: seed.code,
        name: seed.name,
        kind: seed.kind,
        unitOfMeasure: seed.uom,
        basePriceAmount: seed.price,
        baseCurrency: "GBP",
        taxCategory: "STANDARD",
        active: true,
        safetyStockLevel: seed.safety,
        monthlyUsage: seed.kind === "PRODUCT" ? (seed.code === "MOTOR-1K5" ? 6 : seed.code.startsWith("CONV") ? 3 : 0) : 0,
        leadTimeDays: seed.lead,
      },
    });
    products.set(seed.code, product.id);
  }
  const productId = (code: string) => {
    const id = products.get(code);
    if (!id) throw new Error(`Missing seeded product ${code}`);
    return id;
  };
  prove(`Products: ${productSeeds.length} items (parts, a sub-assembly, two conveyors, a service)`);

  // ---- Opening stock for the bought parts. Finished conveyors are deliberately
  // left at zero, so their orders are genuine manufacturing demand.
  const openings: Array<[code: string, warehouseId: string, quantity: number]> = [
    ["STL-SHEET", mainWarehouse.id, 240], ["STL-SHEET", depotWarehouse.id, 40],
    ["FAST-M8", mainWarehouse.id, 800], ["POWDER-GRY", mainWarehouse.id, 320],
    ["MOTOR-1K5", mainWarehouse.id, 10], ["BRACKET-01", mainWarehouse.id, 60],
    ["FRAME-02", mainWarehouse.id, 12],
  ];
  for (const [code, warehouseId, quantity] of openings) {
    await stockProvider.receiveStock(actor, { requestKey: `seed-open:${code}:${warehouseId}`, productId: productId(code), warehouseId, quantity, reason: "Opening stock", reference: "Opening balance" });
  }
  prove(`Opening stock: ${openings.length} receipts into ${new Set(openings.map(([, w]) => w)).size} warehouses`);

  // ---- Plant and recipes. Three work centres with machines and hourly rates, and
  // full make recipes for the fabricated bracket, the welded frame and both
  // conveyors. The sub-assemblies are themselves made, so the finished conveyor's
  // BOM explodes two levels and MRP has real work to net.
  const centres = [
    { code: "CUT", name: "Cutting & forming", description: "Guillotine, press brake and laser profile cutting." },
    { code: "WELD", name: "Welding & fabrication", description: "MIG welding bays for frames and brackets." },
    { code: "PAINT", name: "Powder coating", description: "Pre-treatment, booth and curing oven." },
    { code: "ASSY", name: "Final assembly", description: "Conveyor build, drive fitting and test run." },
  ] as const;
  const centreIds = new Map<string, string>();
  for (const centre of centres) {
    const row = await db.manufacturingWorkCentre.create({ data: { organisationId: orgId, ...centre } });
    centreIds.set(centre.code, row.id);
    // One shift, Monday to Friday, 08:00–16:30 (510 minutes) with a two-person crew,
    // so the cockpit can show real capacity rather than a 40-hour placeholder.
    await db.manufacturingShift.create({ data: { organisationId: orgId, workCentreId: row.id, label: "Day shift", daysOfWeek: [1, 2, 3, 4, 5], startMinute: 480, endMinute: 990, crewCount: 2 } });
  }
  const machines = [
    { code: "CUT", name: "Laser cutter", rate: 20 },
    { code: "CUT", name: "Press brake", rate: 30 },
    { code: "WELD", name: "MIG bay 1", rate: 6 },
    { code: "WELD", name: "MIG bay 2", rate: 6 },
    { code: "PAINT", name: "Powder booth", rate: 40 },
    { code: "ASSY", name: "Assembly bay", rate: 2 },
  ] as const;
  const machineIds = new Map<string, string>();
  for (const machine of machines) {
    const centreId = centreIds.get(machine.code)!;
    const row = await db.manufacturingResource.create({ data: { organisationId: orgId, workCentreId: centreId, name: machine.name, type: "MACHINE", nominalUnitsPerHour: machine.rate } });
    machineIds.set(machine.name, row.id);
  }
  prove(`Plant: ${centres.length} work centres, ${machines.length} machines, day shifts 08:00–16:30`);

  // Rates are pence-per-hour: machine = the machine running cost, labour = the
  // operator on the step. machineIncludesLabour stays off, so the two are added
  // rather than double-counted.
  const recipes: Array<{ code: string; batch: number; lines: Array<[component: string, perUnit: number, scrap: number]>; operations: Array<{ name: string; centre: string; machine: string; setup: number; run: number; crew: number; machineRate: number; labourRate: number }> }> = [
    {
      code: "BRACKET-01", batch: 10,
      lines: [["STL-SHEET", 0.05, 3], ["FAST-M8", 4, 0]],
      operations: [
        { name: "Cut and drill", centre: "CUT", machine: "Laser cutter", setup: 15, run: 1.5, crew: 1, machineRate: 2_400, labourRate: 2_100 },
        { name: "Bend", centre: "CUT", machine: "Press brake", setup: 10, run: 0.5, crew: 1, machineRate: 1_800, labourRate: 2_100 },
      ],
    },
    {
      code: "FRAME-02", batch: 5,
      lines: [["STL-SHEET", 0.4, 4], ["BRACKET-01", 2, 0]],
      operations: [
        { name: "Cut sections", centre: "CUT", machine: "Laser cutter", setup: 20, run: 3, crew: 1, machineRate: 2_400, labourRate: 2_100 },
        { name: "Weld frame", centre: "WELD", machine: "MIG bay 1", setup: 25, run: 12, crew: 2, machineRate: 3_600, labourRate: 2_100 },
      ],
    },
    {
      code: "CONV-1500", batch: 1,
      lines: [["FRAME-02", 1, 0], ["STL-SHEET", 0.2, 2], ["MOTOR-1K5", 1, 0], ["FAST-M8", 24, 2], ["POWDER-GRY", 0.3, 5]],
      operations: [
        { name: "Coat frame", centre: "PAINT", machine: "Powder booth", setup: 20, run: 4, crew: 1, machineRate: 2_700, labourRate: 2_100 },
        { name: "Assemble drive", centre: "ASSY", machine: "Assembly bay", setup: 30, run: 24, crew: 2, machineRate: 1_500, labourRate: 2_100 },
        { name: "Test run", centre: "ASSY", machine: "Assembly bay", setup: 5, run: 8, crew: 1, machineRate: 0, labourRate: 2_100 },
      ],
    },
    {
      code: "CONV-HEAVY", batch: 1,
      lines: [["FRAME-02", 1, 0], ["STL-SHEET", 0.6, 2], ["MOTOR-1K5", 1, 0], ["FAST-M8", 40, 2], ["POWDER-GRY", 0.5, 5], ["BRACKET-01", 4, 0]],
      operations: [
        { name: "Reinforce and fit", centre: "WELD", machine: "MIG bay 2", setup: 45, run: 30, crew: 2, machineRate: 3_600, labourRate: 2_100 },
        { name: "Coat frame", centre: "PAINT", machine: "Powder booth", setup: 25, run: 6, crew: 1, machineRate: 2_700, labourRate: 2_100 },
        { name: "Assemble drive", centre: "ASSY", machine: "Assembly bay", setup: 40, run: 36, crew: 2, machineRate: 1_500, labourRate: 2_100 },
        { name: "Test run", centre: "ASSY", machine: "Assembly bay", setup: 5, run: 12, crew: 1, machineRate: 0, labourRate: 2_100 },
      ],
    },
  ];
  for (const recipe of recipes) {
    await db.productDefinition.create({
      data: {
        organisationId: orgId,
        productId: productId(recipe.code),
        version: 1,
        status: "ACTIVE",
        supply: "MAKE",
        batchQuantity: recipe.batch,
        yieldPercent: 100,
        createdByUserId: demoUser.id,
        lines: { create: recipe.lines.map(([component, perUnit, scrap], position) => ({ organisationId: orgId, componentProductId: productId(component), quantityPerUnit: perUnit, scrapPercent: scrap, position })) },
        operations: {
          create: recipe.operations.map((operation, position) => ({
            organisationId: orgId,
            name: operation.name,
            position,
            workCentre: operation.name,
            workCentreId: centreIds.get(operation.centre)!,
            resourceId: machineIds.get(operation.machine)!,
            setupMinutes: operation.setup,
            runMinutesPerUnit: operation.run,
            crewSize: operation.crew,
            machineMinorPerHour: operation.machineRate,
            labourMinorPerHour: operation.labourRate,
            overheadMinorPerHour: Math.round(operation.machineRate * 0.15),
          })),
        },
      },
    });
  }
  prove(`Recipes: ${recipes.map((r) => r.code).join(", ")} (components, routing, machine/labour rates)`);

  // ---- Sales orders. The Sales commands call requireSession(), which only exists
  // inside a web request, so the order records are written here the same way
  // confirmation writes them (lines, totals, revision, change event, audit), then
  // Logistics is asked to consume the confirmed order through its real handoff.
  const orderSeeds: Array<{ customer: number; lines: Array<{ code: string; quantity: number }>; po: string; deliveryDays: number; deliver?: boolean }> = [
    { customer: 0, lines: [{ code: "CONV-1500", quantity: 6 }, { code: "INSTALL-DAY", quantity: 2 }], po: "PO-RID-4471", deliveryDays: 10 },
    { customer: 1, lines: [{ code: "BRACKET-01", quantity: 40 }, { code: "FAST-M8", quantity: 500 }], po: "PO-NGE-9920", deliveryDays: 6, deliver: true },    { customer: 0, lines: [{ code: "CONV-HEAVY", quantity: 2 }], po: "PO-RID-4488", deliveryDays: 14 },
    { customer: 2, lines: [{ code: "FRAME-02", quantity: 8 }, { code: "MOTOR-1K5", quantity: 4 }], po: "PO-CPH-3312", deliveryDays: 9, deliver: true },
  ];
  const orders: Array<{ id: string; reference: string; customer: string; gross: number; delivered: boolean }> = [];
  for (const seed of orderSeeds) {
    const customer = customers[seed.customer];
    if (!customer) throw new Error("Order seed references a missing customer.");
    const requested = onward(seed.deliveryDays);
    const snapshot = { partyId: customer.id, label: "Goods in", ...customer.address, deliveryInstructions: "Deliver to goods-in, 08:00–16:00." };
    const lines = seed.lines.map((line) => {
      const price = productSeeds.find((seedProduct) => seedProduct.code === line.code);
      if (!price) throw new Error(`Order seed references a missing product ${line.code}`);
      const unit = price.price;
      return { line, unit, net: commercialLineNet(unit, line.quantity, 0) };
    });
    const settlement = settleSale(lines.map((row) => ({ net: row.net, taxCategory: "STANDARD" })), 0, "United Kingdom");
    const reference = `SO-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    const order = await db.salesOrder.create({
      data: {
        organisationId: orgId,
        partyId: customer.id,
        reference,
        ownerUserId: demoUser.id,
        commercialStatus: "CONFIRMED",
        confirmationDate: new Date(),
        orderType: "STANDARD",
        currency: "GBP",
        customerPoReference: seed.po,
        orderDate: onward(-3),
        requestedDeliveryDate: requested,
        promisedDeliveryDate: requested,
        invoiceAddressSnapshot: snapshot,
        deliveryAddressSnapshot: snapshot,
        deliveryInstructions: "Deliver to goods-in, 08:00–16:00.",
        allowPartialDelivery: true,
        netAmount: settlement.net,
        taxAmount: settlement.tax,
        grossAmount: settlement.gross,
        lines: {
          create: lines.map((row, index) => ({
            lineNumber: index + 1,
            type: "PRODUCT",
            productId: productId(row.line.code),
            descriptionSnapshot: productSeeds.find((p) => p.code === row.line.code)!.name,
            orderedQuantity: row.line.quantity,
            unitOfMeasure: productSeeds.find((p) => p.code === row.line.code)!.uom,
            unitPriceAmount: row.unit,
            discountPercent: 0,
            netAmount: settlement.lines[index]!.net,
            taxAmount: settlement.lines[index]!.tax,
            taxCategory: "STANDARD",
            priceSource: "Standard price",
            requestedDeliveryDate: requested,
            promisedDeliveryDate: requested,
            warehousePreference: "MAIN",
          })),
        },
      },
      include: { lines: true },
    });
    // The confirmation trail the UI shows: revision snapshot, status change, audit.
    await db.salesOrderRevision.create({ data: { orderId: order.id, revision: 1, snapshot: { reference, partyId: customer.id, grossAmount: settlement.gross, lines: order.lines.length }, reason: "Order confirmation", createdByUserId: demoUser.id } });
    await db.orderChangeEvent.create({ data: { orderId: order.id, type: "STATUS", fromValue: "DRAFT", toValue: "CONFIRMED", changedByUserId: demoUser.id } });
    await db.auditEntry.create({ data: { organisationId: orgId, actorUserId: demoUser.id, action: "order.confirmed", entityType: "SalesOrder", entityId: order.id, before: { status: "DRAFT" }, after: { status: "CONFIRMED", reference, grossAmount: settlement.gross, revision: 1 } } });
    await db.domainOutbox.create({ data: { organisationId: orgId, eventKey: `sales.order.confirmed:${order.id}:1`, eventName: "sales.order.confirmed", payload: { orderId: order.id, reference } } });
    // Real Logistics handoff: raises the warehouse demand exactly as confirmation does.
    await handoffSalesOrder({ kind: "confirmed", organisationId: orgId, orderId: order.id, eventKey: `sales.order.confirmed:${order.id}:1`, actorUserId: demoUser.id });
    orders.push({ id: order.id, reference, customer: customer.name, gross: settlement.gross, delivered: Boolean(seed.deliver) });
  }
  prove(`Sales orders confirmed: ${orders.map((o) => o.reference).join(", ")}`);

  // ---- Deliveries. Two orders have stock, so they go pick → dispatch → delivered.
  // Their stock decrease and their shipment history are produced by the real services.
  let delivered = 0;
  for (const order of orders.filter((row) => row.delivered)) {
    const requirement = await db.fulfilmentRequirement.findFirstOrThrow({ where: { organisationId: orgId, salesOrderId: order.id }, include: { lines: true } });
    await allocateRequirement(actor, requirement.id);
    const taskId = await releaseRequirement(actor, requirement.id);
    const task = await db.warehouseTask.findUniqueOrThrow({ where: { id: taskId }, include: { lines: true } });
    await claimTask(session, taskId);
    for (const line of task.lines) {
      await scanTask(session, taskId, line.id, line.locationCode ?? "STOCK", `seed-loc:${line.id}`);
      for (let scanned = 0; scanned < line.requiredQuantity; scanned++) {
        await scanTask(session, taskId, line.id, line.expectedBarcode || line.productCode, `seed-pick:${line.id}:${scanned}`);
      }
    }
    // Completing the pick creates the shipment under the SIMPLE policy.
    await completeTask(session, taskId);
    let shipment = await db.shipment.findFirst({ where: { organisationId: orgId, sources: { some: { requirementId: requirement.id } } } });
    if (!shipment) {
      const picked = await db.fulfilmentLine.findMany({ where: { organisationId: orgId, requirementId: requirement.id } });
      const shipmentId = await createShipment(session, requirement.id, picked.map((line) => ({ fulfilmentLineId: line.id, quantity: line.pickedQuantity - line.shippedQuantity })).filter((row) => row.quantity > 0));
      shipment = await db.shipment.findUniqueOrThrow({ where: { id: shipmentId } });
    }
    await dispatchShipment(session, shipment.id, `seed-dispatch:${shipment.id}`);
    await confirmDelivery(session, shipment.id, { outcome: "DELIVERED", receiver: "Stores team", note: "Signed for at goods-in." });
    delivered += 1;
  }
  prove(`Deliveries completed: ${delivered} (pick, shipment, stock issue and history all linked)`);

  // ---- What is left, so Michael knows exactly where to start.
  const openFulfilments = await db.fulfilmentRequirement.findMany({
    where: { organisationId: orgId, status: { notIn: ["DELIVERED", "CANCELLED"] } },
    include: { party: { select: { name: true } }, salesOrder: { select: { reference: true } }, lines: { select: { allocatedQuantity: true, orderedQuantity: true, allocationStatus: true } } },
    orderBy: { createdAt: "asc" },
  });
  const shipments = await db.shipment.findMany({ where: { organisationId: orgId }, select: { reference: true, status: true }, orderBy: { createdAt: "asc" } });
  const stock = await db.inventoryBalance.findMany({ where: { organisationId: orgId, quantity: { not: 0 } }, include: { product: { select: { code: true } }, warehouse: { select: { code: true } } }, orderBy: { product: { code: "asc" } } });

  console.log("\n================= TEST COMPANY READY =================");
  console.log(`Company   ${org.name}   (marked as a Test company)`);
  console.log(`Sign in   ${COMPANY_EMAIL}`);
  console.log(`Password  ${COMPANY_PASSWORD}`);
  console.log(`App       https://atlassystem.online`);
  if (staffUser) console.log(`Or, as ${staffUser.name}: /atlas → ${org.name} → Open company workspace`);
  console.log("\nInside:");
  console.log(`  ${customers.length} customers (contacts + delivery addresses, credit profiles)`);
  console.log(`  ${productSeeds.length} products (bought parts, a sub-assembly, two conveyors, a service)`);
  console.log(`  ${orders.length} confirmed sales orders: ${orders.map((o) => `${o.reference} £${(o.gross / 100).toFixed(2)}`).join(", ")}`);
  console.log(`  ${shipments.length} shipments: ${shipments.map((s) => `${s.reference} (${s.status})`).join(", ")}`);
  console.log(`  ${stock.length} stock balances, ${await db.inventoryMovement.count({ where: { organisationId: orgId } })} inventory movements`);
  console.log(`  Plant: ${centres.length} work centres, ${machines.length} machines with hourly rates`);
  console.log(`  Recipes: ${recipes.length} make definitions (BRACKET-01, FRAME-02, CONV-1500, CONV-HEAVY)`);
  console.log("\nWaiting for you in Logistics (open → release → pick):");
  for (const requirement of openFulfilments) {
    const short = requirement.lines.some((line) => line.allocatedQuantity < line.orderedQuantity);
    console.log(`  • ${requirement.reference} · ${requirement.party.name} · ${requirement.salesOrder.reference} · ${requirement.status}${short ? " · SHORT on stock" : ""}`);
  }
  console.log("\nManufacturing: plant and recipes are already seeded.");
  console.log("  Open Manufacturing → Production plan and press Run plan.");
  console.log("  The two conveyor orders plus motor stock already below safety stock");
  console.log("  are the demand the plan will explode, net and cost.");
  console.log("=====================================================\n");

  // Sanity: the apps must resolve for this company's own login.
  const navigable = getImplementedModules().filter((module) => MODULES.includes(module.id));
  const missing = navigable.filter((module) => !getModule(module.id));
  if (missing.length) throw new Error(`Seed finished but modules did not register: ${missing.map((m) => m.id).join(", ")}`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (error) => {
    console.error("SEED FAILED:", error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) console.error(error.stack.split("\n").slice(0, 8).join("\n"));
    await db.$disconnect();
    process.exitCode = 1;
  });
