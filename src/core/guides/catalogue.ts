/** Plain-language working instructions. No business data or private platform tools. */
export type GuideStep = {
  title: string;
  detail: string;
  href?: string;
  capability?: string;
  moduleId?: string;
};
export type Guide = {
  id: string;
  title: string;
  summary: string;
  area: string;
  moduleId?: string;
  capability?: string;
  before: string[];
  steps: GuideStep[];
  outcome: string;
  troubleshoot: Array<{ question: string; answer: string }>;
  terms?: Array<{ word: string; meaning: string }>;
};
const step = (
  title: string,
  detail: string,
  href?: string,
  capability?: string,
  moduleId?: string,
): GuideStep => ({ title, detail, href, capability, moduleId });
const issue = (question: string, answer: string) => ({ question, answer });
export const GUIDES: Guide[] = [
  {
    id: "production-handoff",
    title: "Collect a finished batch and book it into the yard",
    summary:
      "Production holding keeps the batch traceable until Warehouse collects the actual quantity and books the destination.",
    area: "Operations",
    moduleId: "stock",
    capability: "stock.read",
    before: [
      "Production has completed the final operation and recorded the actual good output.",
      "An active destination storage location in the yard or warehouse.",
      "Warehouse stock-management permission to confirm a collection.",
    ],
    steps: [
      step(
        "Production records its output",
        "Complete the final production operation with the actual good and scrap quantities. Good output enters Production holding as a blocked stock position with the production-order batch reference. Materials, output and operation completion save together.",
        "/manufacturing/produce",
        "manufacturing.order.read",
        "manufacturing",
      ),
      step(
        "Find the waiting batch",
        "Open Production handoff. Search by batch reference or product. Produced, Collected and To collect show how much is still physically waiting.",
        "/stock/handoffs",
        "stock.read",
        "stock",
      ),
      step(
        "Check what you physically collect",
        "Confirm the product, batch and actual collected quantity. A partial collection leaves the rest in holding. Do not book goods that have not arrived at the destination.",
      ),
      step(
        "Book into the destination",
        "Choose Collect & book into yard, enter the quantity, choose the destination storage location and add a collection reference. The booking moves those units from blocked production holding into available stock at the destination.",
        "/stock/handoffs",
        "stock.manage",
        "stock",
      ),
      step(
        "Check the result",
        "The remaining quantity updates and the collection appears in history. Follow Stock or Movements to see the booking. Keep the production-order link for traceability.",
        "/stock/movements",
        "stock.read",
        "stock",
      ),
    ],
    outcome:
      "Collected units are available at the destination with their lot identity intact. Uncollected units stay blocked in production holding. Collection history records quantity, destination, reference and actor.",
    troubleshoot: [
      issue(
        "There is no destination to choose",
        "An Inventory administrator needs to create an active storage, bulk or pick-face location in the destination yard or warehouse. Production holding, quarantine, scrap and shipping locations cannot be collection destinations.",
      ),
      issue(
        "Someone else changed the batch",
        "Refresh and check the remaining quantity before submitting a new collection. A stale form cannot take the same units twice.",
      ),
      issue(
        "A completed old order has no holding batch",
        "Only new completions use this handoff. Earlier completed orders keep their original booking and are not staged again.",
      ),
      issue(
        "The batch is physically incomplete or damaged",
        "Collect only the accepted quantity. Keep the remainder in holding and use your authorised quality-issue process to record and resolve the problem.",
      ),
    ],
    terms: [
      {
        word: "Production holding",
        meaning:
          "Finished stock waiting for the Warehouse handoff. It counts as physically on hand but is blocked from availability.",
      },
      {
        word: "Collection",
        meaning:
          "One actual movement of part or all of a batch into a destination yard or warehouse.",
      },
    ],
  },

  {
    id: "getting-started",
    title: "Find your way around Atlas",
    summary:
      "Your first ten minutes: find work, open an app, save confidently and get help.",
    area: "Start here",
    before: [
      "Sign in with the account supplied by Atlas.",
      "Check the company name before entering work.",
    ],
    steps: [
      step(
        "Start with your work",
        "Home shows the apps available to you. My tasks brings together assigned work; open a task to see its source and required action.",
        "/home",
      ),
      step(
        "Open the right workspace",
        "Use Apps to switch workspaces, or search by record name, reference or screen. Within an app, use its own labelled navigation. Your profile controls which work you can see.",
      ),
      step(
        "Understand the record",
        "Read its status and linked records before changing it. A draft, an approval and a posted document are separate stages; saving a draft does not approve it.",
      ),
      step(
        "Save and check the result",
        "Required fields are labelled. Submit once, wait for feedback, then check the saved record. If someone changed it while you were editing, keep your notes and refresh before trying again.",
      ),
      step(
        "Use a guide beside your task",
        "Guides explain preparation, steps, outcomes and common blockers. Open a task link in a second tab when you want to keep the instructions visible.",
        "/guides",
      ),
    ],
    outcome:
      "You can find your work, understand its status and follow the next action without learning the whole system.",
    troubleshoot: [
      issue(
        "An app or button is missing",
        "Access depends on your company’s available apps and your profile. Ask your company administrator for the specific task you need, rather than a different login.",
      ),
      issue(
        "Atlas was updated while I was editing",
        "Copy unsaved text, reload the page and re-enter it. A failed submission is never a reason to keep clicking Save.",
      ),
      issue(
        "I cannot find a record in search",
        "Open the source app and narrow its register. Search is a shortcut, and does not include every record type or override private-record access.",
      ),
    ],
  },
  {
    id: "procurement",
    title: "Buy materials and receive them correctly",
    summary:
      "Follow a purchase from supplier and approval through receipt, invoice and payment.",
    area: "Operations",
    moduleId: "finance",
    capability: "finance.purchase.read",
    before: [
      "A configured legal entity, accounting period and currency.",
      "The canonical supplier, product quantities, agreed prices, tax treatment and required date.",
      "A buyer and independent approver with the appropriate Finance permissions.",
    ],
    steps: [
      step(
        "Review the need",
        "Start with a material proposal or a known requirement. An MRP Buy proposal is a suggestion until a buyer checks quantity, supplier, price and delivery date.",
        "/manufacturing/planning/planned-orders",
        "manufacturing.plan.read",
        "manufacturing",
      ),
      step(
        "Check the supplier",
        "Use the existing supplier account. Onboarding and bank verification are separate controlled steps; a purchase draft does not verify bank details.",
        "/finance/suppliers",
        "finance.payables.read",
        "finance",
      ),
      step(
        "Create the purchase draft",
        "Choose Purchase order, the legal entity and supplier. Enter real prices, product quantities and the date you need the material. A Manufacturing proposal can prefill the product and quantity; review every assumption.",
        "/finance/documents/new?kind=PO",
        "finance.purchase.manage",
        "finance",
      ),
      step(
        "Request approval",
        "Open the saved document and submit it for approval. Respond to requests for information. The requester cannot independently approve their own commitment.",
      ),
      step(
        "Receive against the approved order",
        "Open the purchase order and record the quantity actually accepted for each line. Choose the real destination when booking stock. Partial receipts leave the remainder open; record rejected quantities accurately.",
        "/finance/purchases?kind=PO",
        "finance.purchase.read",
        "finance",
      ),
      step(
        "Match the supplier invoice",
        "Create the invoice from its source order and accepted receipts. Check the supplier invoice number, price and quantity. Resolve matching or budget exceptions before posting.",
        "/finance/payables",
        "finance.payables.read",
        "finance",
      ),
      step(
        "Review the obligation",
        "Finance posting, payment approval and settlement are separate. Use Supply spend to distinguish posted invoices, uninvoiced commitments, receipts and current payables.",
        "/manufacturing/spend",
        "finance.report.read",
        "finance",
      ),
    ],
    outcome:
      "The purchase, accepted receipt and supplier invoice remain linked. Stock and Finance change only through their authorised booking and posting actions.",
    troubleshoot: [
      issue(
        "The purchase draft has a zero price",
        "Material proposals supply quantity and timing, not an agreed supplier price. Enter the agreed price before requesting approval.",
      ),
      issue(
        "The invoice will not match",
        "Compare it with the order and accepted receipt. An invoice cannot exceed accepted or ordered quantities without resolving the source discrepancy.",
      ),
      issue(
        "Goods arrived but stock is missing",
        "Check the posted receipt’s destination and stock-booking outcome. A saved draft or an unposted receipt is not available stock.",
      ),
      issue(
        "The purchase is still a commitment",
        "Commitments and supplier invoices measure different stages. Open the source documents to see the remaining uninvoiced quantity/value.",
      ),
    ],
    terms: [
      {
        word: "Purchase order (PO)",
        meaning: "An approved commitment to buy from a supplier.",
      },
      {
        word: "Goods receipt",
        meaning:
          "Evidence of the quantity received and accepted against a purchase.",
      },
      {
        word: "Three-way match",
        meaning: "Compare the order, accepted receipt and supplier invoice.",
      },
    ],
  },
  {
    id: "maintenance",
    title: "Report a breakdown and complete the repair",
    summary:
      "Choose one asset, assign the work, track downtime and record a useful service history.",
    area: "Operations",
    moduleId: "maintenance",
    before: [
      "A registered equipment item, or an accessible Fleet vehicle.",
      "A clear description, priority and technician; record a due date when the work is time-sensitive.",
    ],
    steps: [
      step(
        "Register the asset once",
        "Give equipment a recognisable code, name, location and criticality. Record its serial, manufacturer and next service date where known. Retire an asset when it leaves service.",
        "/maintenance?view=equipment",
      ),
      step(
        "Report the work",
        "Create a work order against exactly one asset. Choose Breakdown, Preventive, Inspection or Repair. Describe what happened, the symptoms and any immediate precautions.",
        "/maintenance",
      ),
      step(
        "Assign and prioritise",
        "Choose a technician and due date. Mark the asset as currently down only when downtime should start now. Use urgent/high priority for work that needs prompt attention.",
      ),
      step(
        "Start or wait for parts",
        "Open the work order, move it to In progress when work starts, and record updated findings. Use Waiting parts when blocked; resume work before completion.",
      ),
      step(
        "Record parts and labour",
        "Record the canonical spare product, actual quantity, purpose and stock-issue reference. Parts recorded in Maintenance do not deduct stock; use Inventory’s authorised stock operation for the physical issue.",
        "/stock",
        "stock.manage",
        "stock",
      ),
      step(
        "Complete with a resolution",
        "Explain the repair, service or inspection outcome and record actual labour. Enter the next service date when appropriate. Completion closes recorded downtime; it does not change the asset’s safety/operating condition automatically.",
      ),
    ],
    outcome:
      "The asset has a linked, dated work history with technician, findings, resolution, labour, spare parts and downtime.",
    troubleshoot: [
      issue(
        "I cannot complete the job",
        "Start it first. If it is waiting for parts, resume it. Completion needs a resolution explaining what was done.",
      ),
      issue(
        "A service date is overdue",
        "Create and assign preventive work. Service dates are reminders; Atlas does not automatically create service orders.",
      ),
      issue(
        "Recording a spare did not reduce stock",
        "The spare-parts register records maintenance evidence. Book its physical issue through Inventory and retain the movement reference.",
      ),
      issue(
        "A completed job needs a correction",
        "Closed work is protected. Create follow-up work for the asset rather than rewriting the completed history.",
      ),
    ],
    terms: [
      {
        word: "Criticality",
        meaning: "How much the business is affected if the asset fails.",
      },
      {
        word: "Downtime",
        meaning: "Time from the reported stoppage until the work closes.",
      },
    ],
  },
  {
    id: "quality",
    title: "Contain a quality issue and prove the fix worked",
    summary:
      "Inspect, hold affected stock, investigate and verify corrective actions before closing.",
    area: "Operations",
    moduleId: "quality",
    before: [
      "The product, failed requirement, affected quantity and batch/reference.",
      "An owner, target date and clear immediate containment.",
    ],
    steps: [
      step(
        "Record the inspection honestly",
        "Use the released specification/control point. Enter a measurement or explicit pass/fail for every characteristic. Nothing defaults to pass.",
        "/quality/checks",
        "quality.check.execute",
        "quality",
      ),
      step(
        "Contain the affected product",
        "Review the quality hold and physical quarantine. Record the affected quantity, location and reason. A hold record should be checked against the actual stock position.",
        "/quality/holds",
        "quality.hold.read",
        "quality",
      ),
      step(
        "Report the issue",
        "Describe the requirement that failed and what you did to contain it. Assign an owner and target date. Add site, process, product, lot/reference, evidence and impact where useful.",
        "/quality/ncr/new",
        "quality.ncr.report",
        "quality",
      ),
      step(
        "Investigate the cause",
        "Explain why the failure happened, rather than restating the symptom. Use root-cause and five-whys detail for complex issues. Major and critical issues need a confirmed root cause.",
      ),
      step(
        "Assign a measurable corrective action",
        "Give each action an owner, due date, effectiveness criterion and review date. “Train staff” alone is too vague; define the change and how you will check that it worked.",
        "/quality/actions",
        "quality.ncr.read",
        "quality",
      ),
      step(
        "Verify, then close",
        "Mark work Done after carrying it out, then record substantive effectiveness evidence. Every action must be Verified before the issue closes. An ineffective action must be reopened and improved. Closing the issue does not release held stock.",
      ),
    ],
    outcome:
      "The issue retains containment, investigation, owned actions and effectiveness evidence. Hold release remains a separate authorised decision.",
    troubleshoot: [
      issue(
        "The issue cannot close",
        "Check that all actions are verified and that closure evidence is recorded. Major/critical issues also require a root cause and a verified corrective action.",
      ),
      issue(
        "The fix did not work",
        "Record Ineffective, reopen the action and add follow-up work. Do not mark it Verified simply to clear the queue.",
      ),
      issue(
        "The issue is closed but stock remains held",
        "Review the separate quality hold. Issue closure and permission to use/release stock are separate decisions.",
      ),
    ],
    terms: [
      {
        word: "NCR",
        meaning: "A nonconformance record: a requirement was not met.",
      },
      {
        word: "Containment",
        meaning:
          "Immediate steps to stop the problem affecting more work or customers.",
      },
      {
        word: "Effectiveness",
        meaning:
          "Evidence that the change prevented or reduced the actual failure.",
      },
    ],
  },
  {
    id: "sop",
    title: "Run S&OP without getting lost",
    summary:
      "Prepare one forecast, review the gaps, decide what changes and release one agreed plan.",
    area: "Business",
    moduleId: "sop",
    before: [
      "A planning lead and department reviewers.",
      "Canonical products and accessible sales history; connected department plans where needed.",
      "The planning month, horizon and reporting currency.",
    ],
    steps: [
      step(
        "Create one planning round",
        "Name the cycle clearly, choose its first month and horizon. It starts private. Use Setup to choose demand history, products and connected plans.",
        "/sop?view=setup",
      ),
      step(
        "Generate a working forecast",
        "Generate reads the current authorised inputs and saves a new version. Old versions remain. Start on the monthly brief; focus on the months where a decision is needed.",
      ),
      step(
        "Review demand, supply and money",
        "Check expected demand separately from confirmed orders. Supply shows stock cover and demand at risk; it does not certify machine or labour feasibility. Revenue targets and cost assumptions must have explicit sources.",
        "/sop?view=reviews",
      ),
      step(
        "Decide how to close the gaps",
        "Compare a scenario when you need to test a change. Give risks and actions a named owner, due date and reason. Promoting a scenario creates a fresh consensus draft and fresh reviews.",
        "/sop?view=decisions",
      ),
      step(
        "Record the seven reviews",
        "Each reviewer records evidence against the exact selected version. Opening the page is not a review. Changed inputs require a refreshed forecast; older approvals cannot approve new numbers.",
        "/sop?view=reviews",
      ),
      step(
        "Approve, then release",
        "Approve the agreed consensus only after its reviews. Release sends monthly total demand to Manufacturing. MRP consumes firm orders once, so do not separately add the same orders to the forecast.",
        "/sop?view=reviews",
      ),
      step(
        "Monitor real execution",
        "Use Orders & Service for current commitments and delivery evidence. Revisit the next planning round when assumptions change; keep the published version as history.",
        "/sop?view=service",
      ),
    ],
    outcome:
      "Sales, Operations and Finance work from one explicit approved version, with owned decisions and a traceable release into Manufacturing.",
    troubleshoot: [
      issue(
        "The numbers changed but my reviews were approved",
        "Reviews belong to one version. Generate a fresh forecast from changed inputs, then review that version.",
      ),
      issue(
        "Supply is unavailable",
        "Check the source app permissions and data. Missing inputs remain unavailable; a zero would imply evidence that does not exist.",
      ),
      issue(
        "I cannot release",
        "Select a current consensus version, complete its exact-version reviews and approval, then release. A scenario cannot be published directly.",
      ),
      issue(
        "There is too much analysis",
        "Stay on Start here and the monthly brief first. Open product detail, model history or a scenario only to answer a specific decision.",
      ),
    ],
    terms: [
      {
        word: "Consensus",
        meaning:
          "The agreed demand forecast before restricting it to what can be supplied.",
      },
      {
        word: "Demand at risk",
        meaning:
          "Expected demand not covered by the selected stock and dated supply.",
      },
      {
        word: "Scenario",
        meaning: "A saved what-if option, separate from the agreed plan.",
      },
      {
        word: "Cycle",
        meaning: "One planning round; versions are its saved forecasts.",
      },
    ],
  },
  {
    id: "customers",
    title: "Keep one reliable customer record",
    summary:
      "Customer identity, contacts, sites and linked commercial history belong together.",
    area: "Customers",
    capability: "customers.read",
    before: [
      "Search for the company or person before creating another record.",
    ],
    steps: [
      step(
        "Find or create the customer",
        "Use the canonical customer record and check its code and status.",
        "/customers",
      ),
      step(
        "Add people and places",
        "Record the real contact and site or delivery address; keep group/branch relationships accurate.",
      ),
      step(
        "Use the connected tabs",
        "Commercial, Finance and Activity show the source records you can access. Open the source app for its own decision or edit.",
      ),
      step(
        "Review before archiving",
        "Check open business work before using archive/delete controls. An archived customer is different from removing its historic transactions.",
      ),
    ],
    outcome:
      "Sales, service, finance and visits share the same customer identity.",
    troubleshoot: [
      issue(
        "A tab is empty",
        "The source app must be enabled and your profile must allow its records. An empty section does not prove there is no history.",
      ),
    ],
  },
  {
    id: "sales",
    title: "Turn a quotation into delivered business",
    summary:
      "Choose the customer, build the sale and follow fulfilment and invoicing.",
    area: "Customers",
    moduleId: "sales",
    before: [
      "The canonical customer, products, quantities and agreed delivery requirements.",
    ],
    steps: [
      step(
        "Prepare the quotation",
        "Select the customer and site, add products, check availability and review price, tax and discounts.",
        "/sales",
      ),
      step(
        "Agree and confirm",
        "Check the customer’s reference and promised date. Approval, confirmation and release have their own actions.",
      ),
      step(
        "Follow fulfilment",
        "Open linked Logistics work to see allocation, picking, dispatch and actual delivery. Partial deliveries retain the remaining quantity.",
      ),
      step(
        "Check Finance",
        "Delivery can create a linked draft invoice; Finance still reviews and posts it. Open source documents rather than entering the same sale again.",
      ),
    ],
    outcome: "Customer, quotation, order, shipment and invoice stay connected.",
    troubleshoot: [
      issue(
        "The order cannot release",
        "Review shortages, required details and held/approval status. Correct the source blocker before trying release again.",
      ),
    ],
  },
  {
    id: "crm",
    title: "Manage a deal and its next conversation",
    summary:
      "Keep opportunities, appointments, agreements and customer context in one place.",
    area: "Customers",
    moduleId: "crm",
    before: ["The customer/prospect and a real next step."],
    steps: [
      step(
        "Find the customer context",
        "Check group and branch relationships, recent activity and existing deals.",
        "/crm",
      ),
      step(
        "Keep the opportunity realistic",
        "Record stage, expected value, probability and expected close date. Update the reason when assumptions change.",
      ),
      step(
        "Schedule and record the conversation",
        "Use appointments for booked work. Reschedule or cancel explicitly; record the actual outcome after the meeting.",
      ),
      step(
        "Prepare the agreement",
        "Use the deal’s contract/approval flow and a reusable template. A shared contract has its own customer response history.",
      ),
    ],
    outcome:
      "The pipeline reflects evidence, and the next customer action is visible.",
    troubleshoot: [
      issue(
        "I cannot see another representative’s deal",
        "Representative and private-record restrictions still apply within a company. Ask the owner or authorised manager to share the correct work.",
      ),
    ],
  },
  {
    id: "manufacturing",
    title: "Plan, make and hand over finished production",
    summary:
      "Move from demand and materials to scheduled work, completion and Warehouse handoff.",
    area: "Operations",
    moduleId: "manufacturing",
    before: [
      "A make product, usable recipe/routing, materials and an appropriate production location.",
    ],
    steps: [
      step(
        "Review the console",
        "Start with demand, shortages and work requiring attention.",
        "/manufacturing",
      ),
      step(
        "Run and review material planning",
        "Check the saved run’s Buy/Make proposals and required dates. Firm only the proposals you intend to execute.",
        "/manufacturing/planning/planned-orders",
        "manufacturing.plan.read",
        "manufacturing",
      ),
      step(
        "Schedule the work",
        "Use the plant and shift information to schedule real work. Review capacity conflicts rather than assuming a forecast proves feasibility.",
        "/manufacturing/schedule",
        "manufacturing.schedule.read",
        "manufacturing",
      ),
      step(
        "Execute and record production",
        "Open the production order and its work orders. Record the actual result and complete through the controlled action.",
        "/manufacturing/produce",
        "manufacturing.order.read",
        "manufacturing",
      ),
      step(
        "Hand over the batch",
        "Use the production handoff queue when output is in staging. Warehouse checks the actual quantity and books its move to the destination yard or warehouse.",
        "/stock/handoffs",
        "stock.read",
        "stock",
      ),
      step(
        "Use detailed working instructions",
        "The Manufacturing how-to library explains recipes, MRP, shortages, scheduling and production in more depth.",
        "/manufacturing/help",
      ),
    ],
    outcome:
      "Production output and physical stock movement remain traceable to the order.",
    troubleshoot: [
      issue(
        "Completion is blocked by materials",
        "Check the required materials and their available stock. Correct the stock or production source; repeated completion attempts do not create material.",
      ),
    ],
  },
  {
    id: "stock",
    title: "Know where stock is and move it safely",
    summary:
      "Check stock by product and place, then book the physical movement.",
    area: "Operations",
    moduleId: "stock",
    before: ["The product, actual quantity, source and destination."],
    steps: [
      step(
        "Check the position",
        "Read on-hand quantity, holds and availability separately. Physical stock and available-to-use stock are different.",
        "/stock",
      ),
      step(
        "Use real places",
        "Create/select the yard, warehouse and bin/location that match the physical operation.",
        "/stock/warehouses",
      ),
      step(
        "Collect production batches",
        "Open Production handoff, select a batch and record the collected quantity and destination.",
        "/stock/handoffs",
      ),
      step(
        "Book controlled movements",
        "Use the authorised transfer/issue action and record a useful reference. Check the resulting movement history.",
        "/stock/movements",
      ),
      step(
        "Investigate differences",
        "Record the physical count and reason using controlled adjustments. Do not hide a discrepancy by making an unrelated receipt.",
      ),
    ],
    outcome:
      "The stock ledger agrees with a traceable physical location and movement history.",
    troubleshoot: [
      issue(
        "On hand is higher than available",
        "Check quality holds, reservations and demand. Do not remove a hold solely to make availability look better.",
      ),
    ],
  },
  {
    id: "products",
    title: "Set up a usable product",
    summary:
      "One catalogue identity connects selling, buying, stock and production.",
    area: "Operations",
    moduleId: "products",
    before: ["A unique product code, name and unit of measure."],
    steps: [
      step(
        "Check for an existing code",
        "Use the shared catalogue before adding a duplicate.",
        "/products",
      ),
      step(
        "Set the operating details",
        "Choose class and make/buy behaviour, lead time, stockability and sales eligibility deliberately.",
      ),
      step(
        "Prepare manufacturing detail",
        "For make products, review recipe, components and routing before creating production work.",
      ),
      step(
        "Keep price and units consistent",
        "Check the base currency and unit. Review customer price agreements in Sales rather than creating another product code.",
      ),
    ],
    outcome: "Every app uses the same product and unit.",
    troubleshoot: [
      issue(
        "The item cannot be sold or purchased",
        "Check its eligibility and make/buy settings. Product class alone does not decide all operating permissions.",
      ),
    ],
  },
  {
    id: "planning",
    title: "Review product demand and stock cover",
    summary:
      "Use Production Planning to understand shortages and future production intentions.",
    area: "Operations",
    moduleId: "planning",
    before: ["Product demand and dated supply that you can access."],
    steps: [
      step(
        "Read the workbench",
        "Compare expected demand with stock and dated supply.",
        "/planning",
      ),
      step(
        "Inspect the product",
        "Open the product plan to understand dates and quantities before changing assumptions.",
      ),
      step(
        "Save production intentions",
        "Keep planned quantities and dates explicit. A saved production plan is not an executable production order.",
      ),
      step(
        "Take the source action",
        "Use Manufacturing for executable work and Procurement for approved purchases.",
      ),
    ],
    outcome: "Planned demand and supply stay distinct from real execution.",
    troubleshoot: [
      issue(
        "A plan does not appear as completed stock",
        "Plans represent intentions. Stock changes through real production completion or receipt.",
      ),
    ],
  },
  {
    id: "logistics",
    title: "Pick, dispatch and confirm delivery",
    summary:
      "Follow released sales work through physical fulfilment with accurate evidence.",
    area: "Operations",
    moduleId: "logistics",
    before: ["Released work, available stock and correct delivery address."],
    steps: [
      step(
        "Review work to fulfil",
        "Check exceptions and the source Sales order.",
        "/logistics",
      ),
      step(
        "Allocate and pick",
        "Choose eligible stock and record actual picked quantities. Handle shortages before packing.",
      ),
      step(
        "Pack and dispatch",
        "Record handling units, shipment details and tracking/reference where applicable. A dispatch is not a delivery.",
      ),
      step(
        "Confirm the actual delivery",
        "Record delivery evidence and review remaining quantities. Check the linked Finance draft for delivered work.",
      ),
    ],
    outcome:
      "Order fulfilment, stock and financial source documents remain connected.",
    troubleshoot: [
      issue(
        "The order is not in the queue",
        "Check its confirmation/release state and existing fulfilment work. Also check your warehouse permissions.",
      ),
    ],
  },
  {
    id: "finance",
    title: "Understand the money and the records behind it",
    summary:
      "Work with drafts, independent approval, posting and settlement in the correct order.",
    area: "Business",
    moduleId: "finance",
    before: [
      "Configured books, an open period and the relevant source document.",
    ],
    steps: [
      step(
        "Choose the legal entity",
        "Check its currency and period before entering a document.",
        "/finance",
      ),
      step(
        "Follow the source",
        "Open the source sale, purchase or receipt. Credits and corrections should retain their reason and original relationship.",
      ),
      step(
        "Create and approve the draft",
        "Review line values, account, tax and required evidence. Request independent approval where required.",
      ),
      step(
        "Post and settle deliberately",
        "Posting changes the ledger; payment/receipt allocation changes settlement. Saving a draft does neither.",
      ),
      step(
        "Use detailed Finance help",
        "Finance help covers purchasing, matching, banking, ledger controls and closing.",
        "/finance/help",
      ),
    ],
    outcome: "Figures can be explained from their authorised source records.",
    troubleshoot: [
      issue(
        "Posting is blocked",
        "Check approval, accounting period, matching, tax/account configuration and source state before retrying.",
      ),
    ],
  },
  {
    id: "plan",
    title: "Build a department plan people can follow",
    summary:
      "Set targets, add reasoned inputs and share the plan deliberately.",
    area: "Business",
    moduleId: "plan",
    before: ["A department, date range and measures."],
    steps: [
      step(
        "Create a private plan",
        "Choose a recognisable name, department and dates.",
        "/plan",
      ),
      step(
        "Add reasoned inputs",
        "Choose accessible source records or explicit assumptions. Record quantity/value, timing, probability and the reason.",
      ),
      step(
        "Build and review the forecast",
        "Check the affected monthly totals, targets and source inputs. A forecast replacement is not an extra copy of real orders.",
      ),
      step(
        "Share and track work",
        "Share with the intended audience and assign follow-up work. View-only shares cannot edit; locked periods remain protected.",
      ),
    ],
    outcome:
      "The plan has traceable assumptions, targets and an intentional audience.",
    troubleshoot: [
      issue(
        "S&OP cannot read my plan",
        "Check that it is shared with the planning lead, selected in the cycle and still accessible through its source permissions.",
      ),
    ],
  },
  {
    id: "projects",
    title: "Make a project’s next action visible",
    summary:
      "Organise milestones, tasks, meetings and linked commercial records.",
    area: "Business",
    moduleId: "projects",
    before: ["A clear outcome, owner and dates."],
    steps: [
      step(
        "Create the project context",
        "Describe what will be delivered and link the real customer or commercial work where relevant.",
        "/projects",
      ),
      step(
        "Break delivery into tasks",
        "Give each task an owner, due date and useful description. Use milestones for checkpoints.",
      ),
      step(
        "Review dependencies and progress",
        "Use the project timeline/Gantt where available. Resolve blocked work before marking broad progress.",
      ),
      step(
        "Keep decisions with the project",
        "Link meetings, documents and source quotations/orders so the team can find the evidence.",
      ),
    ],
    outcome: "The team can see who does what next and why.",
    troubleshoot: [
      issue(
        "A project link is unavailable",
        "Project ownership, sharing and source permissions still apply; a cross-app link does not widen access.",
      ),
    ],
  },
  {
    id: "people",
    title: "Keep people records and HR work clear",
    summary:
      "Employee records, time off, onboarding, documents and development.",
    area: "People",
    moduleId: "people",
    before: ["The employee identity and the correct HR access."],
    steps: [
      step(
        "Use your own workspace",
        "My HR and My work hold your own information, requests and assigned work.",
        "/people",
      ),
      step(
        "Keep employee details current",
        "Authorised HR staff use the directory for employment, contact and lifecycle details.",
      ),
      step(
        "Follow requests to a decision",
        "Submit time off, timesheets or expenses with the required dates and reason. Check approval feedback and conflicts.",
      ),
      step(
        "Track lifecycle and learning",
        "Use onboarding/offboarding, documents and training to assign specific work and retain evidence.",
      ),
    ],
    outcome:
      "Personal requests and protected HR administration remain clear and separate.",
    troubleshoot: [
      issue(
        "I cannot change another employee",
        "Self-service and HR management are different permissions. Use your own request flow or ask the HR owner.",
      ),
    ],
  },
  {
    id: "scheduling",
    title: "Build a rota and understand coverage",
    summary: "Publish clear shifts and address gaps without hiding conflicts.",
    area: "People",
    moduleId: "scheduling",
    before: ["The team, date range and coverage needs."],
    steps: [
      step(
        "Check the existing rota",
        "Employees see their published shifts; planners see the available planning controls.",
        "/scheduling",
      ),
      step(
        "Review coverage",
        "Check open shifts, team requirements and absence before assigning work.",
      ),
      step(
        "Assign realistic shifts",
        "Review conflicts, hours and dates; do not treat a saved draft as a communicated rota.",
      ),
      step(
        "Publish and check",
        "Use the explicit publishing action and confirm the employee’s view.",
      ),
    ],
    outcome: "People know their published work and managers see coverage gaps.",
    troubleshoot: [
      issue(
        "My colleague can plan but I can only view",
        "The same app serves personal rota viewing and authorised workforce planning. Your access decides which controls appear.",
      ),
    ],
  },
  {
    id: "payroll",
    title: "Prepare and review a UK payroll run",
    summary:
      "Check employee setup and approved inputs before calculating and approving pay.",
    area: "People",
    moduleId: "payroll",
    before: [
      "Correct pay/tax setup, period, approved attendance and payroll permissions.",
    ],
    steps: [
      step(
        "Check employee pay setup",
        "Review effective pay, tax and deduction settings; do not guess missing values.",
        "/payroll",
      ),
      step(
        "Prepare the period inputs",
        "Check approved time, leave, sickness and adjustments. Resolve conflicts before calculation.",
      ),
      step(
        "Calculate and inspect",
        "Review employee breakdowns and totals. Record changes through the intended adjustment flow.",
      ),
      step(
        "Approve and retain evidence",
        "Follow the run’s protected states. External bank transfer and statutory submission require their own configured, verified process.",
      ),
    ],
    outcome:
      "A reviewed payroll calculation with retained evidence; calculation alone is not a bank or HMRC submission.",
    troubleshoot: [
      issue(
        "The run has missing setup",
        "Correct the specific employee’s effective pay/tax configuration, then recalculate through the controlled run flow.",
      ),
    ],
  },
  {
    id: "teams",
    title: "Plan team capacity",
    summary:
      "See people, availability and assigned work before making promises.",
    area: "People",
    moduleId: "teams",
    before: ["The team, period and real workload."],
    steps: [
      step("Open the team", "Choose the team and planning period.", "/teams"),
      step(
        "Check availability",
        "Review holidays, working patterns and recorded capacity.",
      ),
      step(
        "Compare commitments",
        "Inspect assigned work and dates; a capacity picture depends on its current sources.",
      ),
      step(
        "Resolve the gap",
        "Move or reassign the owning task/shift and record the reason.",
      ),
    ],
    outcome:
      "Capacity decisions are based on visible commitments and availability.",
    troubleshoot: [
      issue(
        "A change is not reflected",
        "Check the source task/absence/shift and the chosen period before making a second entry.",
      ),
    ],
  },
  {
    id: "kpis",
    title: "Turn a goal into a useful scorecard",
    summary: "Choose a measurable outcome, real source and review action.",
    area: "People",
    moduleId: "kpis",
    before: ["A target, owner, period and measure."],
    steps: [
      step(
        "Define the goal",
        "Name the business outcome and choose its measure and target.",
        "/kpis",
      ),
      step(
        "Connect the source",
        "Use an authorised source measure where available. Keep units and currency consistent.",
      ),
      step(
        "Review progress",
        "Read the contributing records and period before interpreting a result.",
      ),
      step(
        "Act on the gap",
        "Assign a concrete follow-up rather than changing the target to match the result.",
      ),
    ],
    outcome: "A goal that can be understood and acted on.",
    troubleshoot: [
      issue(
        "The result is unavailable",
        "Check source app access, date range and the selected measure. Unavailable evidence should remain unavailable.",
      ),
    ],
  },
  {
    id: "marketing",
    title: "Plan a campaign and customer journey",
    summary:
      "Connect purpose, audience, activities, approvals and delivery evidence.",
    area: "Customers",
    moduleId: "marketing",
    before: ["A campaign objective and appropriate audience/consent."],
    steps: [
      step(
        "Define the campaign",
        "Choose a clear outcome, owner, dates and budget assumptions.",
        "/marketing",
      ),
      step(
        "Map the journey",
        "Arrange touchpoints and branches around the customer experience, not just a list of messages.",
      ),
      step(
        "Review publication and approval",
        "Check versions, content, audience and connected Finance approvals.",
      ),
      step(
        "Check actual delivery",
        "Publishing a journey or automation does not prove email, social or advertising delivery. Verify the configured provider’s result.",
      ),
    ],
    outcome:
      "A clear campaign with traceable activities and honest delivery status.",
    troubleshoot: [
      issue(
        "Published work has no external delivery",
        "Check provider configuration, audience eligibility and delivery activity. Atlas publication and provider sending are separate.",
      ),
    ],
  },
  {
    id: "meetings",
    title: "Run a meeting with decisions and follow-up",
    summary:
      "Set an agenda, capture the decision and give each action an owner.",
    area: "Business",
    moduleId: "meetings",
    before: ["Attendees, start/end time, timezone and purpose."],
    steps: [
      step(
        "Schedule deliberately",
        "Choose the audience, time and optional project. Private meetings stay with the organiser and attendees.",
        "/meetings",
      ),
      step(
        "Prepare the agenda",
        "State the decisions needed and link the relevant work.",
      ),
      step(
        "Record outcomes",
        "Add notes, decisions and actions; actions need owners and due dates.",
      ),
      step(
        "Follow up",
        "Complete actions with retained history. Microsoft invitations require configured consent and an explicit send; an Outlook draft is not a sent invitation.",
      ),
    ],
    outcome: "A meeting produces visible decisions and owned follow-up.",
    troubleshoot: [
      issue(
        "An Outlook invitation was not sent",
        "Check Microsoft configuration/consent and the explicit invitation action. Saving the Atlas meeting does not send it automatically.",
      ),
    ],
  },
  {
    id: "engineering",
    title: "Release a controlled design revision",
    summary:
      "Prepare evidence, obtain independent approval and explicitly release.",
    area: "Operations",
    moduleId: "engineering",
    before: [
      "The canonical product, change reason and technical specification.",
    ],
    steps: [
      step(
        "Create the draft revision",
        "Link the product and describe the change.",
        "/engineering",
      ),
      step(
        "Attach drawing evidence",
        "Add supported private drawing files while the revision is draft.",
      ),
      step(
        "Obtain independent review",
        "The author/last editor cannot approve their own design.",
      ),
      step(
        "Release explicitly",
        "Release freezes the revision and supersedes the prior released design. Review BOM/routing separately; release does not automatically replace them.",
      ),
    ],
    outcome: "A retained approved revision with protected released content.",
    troubleshoot: [
      issue(
        "I cannot approve my design",
        "Use an independent authorised reviewer. This separation protects the release decision.",
      ),
    ],
  },
  {
    id: "fleet",
    title: "Keep a vehicle ready for work",
    summary: "Track inspections, odometer, service work and legal due dates.",
    area: "Operations",
    moduleId: "fleet",
    before: ["Registration, vehicle identity and responsible driver."],
    steps: [
      step(
        "Register the vehicle",
        "Keep registration, VIN, driver and due dates accurate.",
        "/fleet",
      ),
      step(
        "Record the actual check",
        "Append inspection, fuel, service, repair or trip evidence with date and odometer.",
      ),
      step(
        "Act on unsafe findings",
        "An unsafe inspection takes the vehicle off road. Record and assign the repair in Maintenance.",
      ),
      step(
        "Return it deliberately",
        "Authorised staff explicitly update its operating status after reviewing the repair and safety evidence.",
      ),
    ],
    outcome: "The vehicle’s availability and history are visible.",
    troubleshoot: [
      issue(
        "The odometer is rejected",
        "It cannot go backwards. Check units and the last recorded reading.",
      ),
    ],
  },
  {
    id: "fieldservice",
    title: "Schedule a visit and finish the job sheet",
    summary:
      "Give the engineer the right customer, place, time and instructions.",
    area: "Operations",
    moduleId: "fieldservice",
    before: ["Customer/site, engineer, window, timezone and contact."],
    steps: [
      step(
        "Schedule the visit",
        "Select the canonical customer and engineer; review booking conflicts.",
        "/fieldservice",
      ),
      step(
        "Prepare the job",
        "Record access instructions, site contact and the actual work required.",
      ),
      step(
        "Record progress",
        "Use travel, on-site and waiting states as the visit progresses.",
      ),
      step(
        "Complete with an outcome",
        "Record findings, result and actual labour. Invoicing, customer messages and stock issue remain separate authorised work.",
      ),
    ],
    outcome:
      "A clear engineer job sheet and retained customer service history.",
    troubleshoot: [
      issue(
        "The visit cannot be booked",
        "Check the engineer’s existing appointments and the start/end/timezone. Overlapping work is rejected.",
      ),
    ],
  },
  {
    id: "safety",
    title: "Record a safety issue and follow the action",
    summary: "Capture the facts, immediate response and accountable follow-up.",
    area: "Operations",
    moduleId: "safety",
    before: ["The actual event/risk, place, time and immediate precautions."],
    steps: [
      step(
        "Choose the correct record",
        "Use the appropriate incident, risk or workplace record.",
        "/safety",
      ),
      step(
        "Record factual detail",
        "Capture what happened and the immediate response; keep sensitive information within its protected audience.",
      ),
      step(
        "Assign follow-up",
        "Give corrective work an owner, due date and evidence requirement.",
      ),
      step(
        "Review completion",
        "Check the action’s result and retained history before closing the work.",
      ),
    ],
    outcome: "Safety work has visible responsibility and evidence.",
    troubleshoot: [
      issue(
        "Sensitive details are unavailable",
        "Sensitive-record permission is independent from ordinary safety access. Ask the authorised owner.",
      ),
    ],
  },
  {
    id: "service",
    title: "Resolve a customer case across departments",
    summary:
      "Keep the case owner while Finance, Logistics or Quality investigates.",
    area: "Customers",
    moduleId: "service",
    before: ["The canonical customer, source sale and clear reported problem."],
    steps: [
      step(
        "Create the case",
        "Record the type, impact, evidence and correct queue.",
        "/service",
      ),
      step(
        "Link the source",
        "Select the real order, delivery or invoice where relevant; check what actually happened.",
      ),
      step(
        "Request departmental work",
        "Create a linked Query/operation with a clear outcome. The original case retains its owner.",
      ),
      step(
        "Review the response",
        "Check the department’s evidence. A Finance credit still requires Finance approval/posting.",
      ),
      step(
        "Resolve with the customer",
        "Record the case outcome and confirm required departmental work is complete.",
      ),
    ],
    outcome:
      "The customer case remains coherent while departments own their decisions.",
    troubleshoot: [
      issue(
        "A department completed but the case is open",
        "Department completion records its response; the case owner still reviews and resolves the customer case.",
      ),
    ],
  },
  {
    id: "tickets",
    title: "Request and complete internal service work",
    summary:
      "Use the service catalogue, queue, ownership and outcome correctly.",
    area: "Business",
    moduleId: "tickets",
    before: ["A clear request, correct queue and evidence."],
    steps: [
      step(
        "Choose the service",
        "Start from the service catalogue or create the appropriate ticket.",
        "/tickets",
      ),
      step(
        "Describe the needed outcome",
        "State the impact and attach/reference useful evidence.",
      ),
      step(
        "Assign and progress",
        "The queue controls its audience. Record responses and move through the permitted states.",
      ),
      step(
        "Complete with evidence",
        "Record the real outcome. Linked customer Queries keep their original parent owner.",
      ),
    ],
    outcome: "Internal work has a traceable request, owner and resolution.",
    troubleshoot: [
      issue(
        "A ticket is hidden",
        "Private queues require queue membership in addition to ordinary ticket permission.",
      ),
    ],
  },
  {
    id: "templates",
    title: "Create a reusable business document",
    summary:
      "Build a template, use authorised fields and review the generated document.",
    area: "Business",
    moduleId: "templates",
    before: ["The document’s purpose and owning source app."],
    steps: [
      step(
        "Choose the template",
        "Start from the library or create a reusable layout.",
        "/templates",
      ),
      step(
        "Use real source fields",
        "Choose supported fields from authorised source records; avoid copying sensitive data into free text.",
      ),
      step(
        "Preview the result",
        "Check the content and company branding with the chosen record.",
      ),
      step(
        "Use the source workflow",
        "CRM owns contract approvals/sharing and the customer’s response. The template is reusable structure, not an approval by itself.",
      ),
    ],
    outcome: "A consistent document grounded in its source records.",
    troubleshoot: [
      issue(
        "A field cannot be selected",
        "Check the source module, record access and supported field catalogue.",
      ),
    ],
  },
  {
    id: "reports",
    title: "Find the records behind a report",
    summary:
      "Choose a dataset, apply filters and export the view deliberately.",
    area: "Business",
    moduleId: "reports",
    before: ["The source, date range and question you need to answer."],
    steps: [
      step(
        "Choose an authorised dataset",
        "Reports exposes source-owned records permitted for your profile.",
        "/reports",
      ),
      step(
        "Apply the filters",
        "Check dates, fields and columns; pending filter changes must be applied before export.",
      ),
      step(
        "Inspect source records",
        "Use the record links to understand the figures rather than editing report cells.",
      ),
      step(
        "Download when needed",
        "The explicit Excel download saves your chosen view; the central source remains authoritative.",
      ),
    ],
    outcome: "An explainable view/export with the same source permissions.",
    troubleshoot: [
      issue(
        "Export is disabled",
        "Apply pending filters and check source access. Narrow an oversized dataset.",
      ),
    ],
  },
  {
    id: "analytics",
    title: "Make a dashboard useful",
    summary:
      "Choose a few authorised measures and arrange them around decisions.",
    area: "Business",
    moduleId: "analytics",
    before: ["A specific business question and period."],
    steps: [
      step(
        "Create or copy your board",
        "Use a clear personal board name.",
        "/analytics",
      ),
      step(
        "Add meaningful widgets",
        "Choose a source measure or record view and its filters.",
      ),
      step(
        "Arrange the canvas",
        "Use editing controls for size, order and appearance; keep important exceptions visible.",
      ),
      step(
        "Read the source",
        "Check units, currency and dates. A visual is a view of underlying records, not another business ledger.",
      ),
    ],
    outcome: "A personal dashboard that supports a real decision.",
    troubleshoot: [
      issue(
        "A figure is unavailable",
        "Check the authorised source and its filter/currency requirements. Do not substitute an invented zero.",
      ),
    ],
  },
  {
    id: "automations",
    title: "Understand an automation before publishing",
    summary:
      "Review trigger, audience, conditions and activity before relying on it.",
    area: "Business",
    moduleId: "automations",
    before: ["A specific trigger, intended action and authorised audience."],
    steps: [
      step(
        "Review the rule",
        "Check its trigger and conditions with a concrete example.",
        "/automations",
      ),
      step(
        "Check its action",
        "Confirm the supported action and required provider/source configuration.",
      ),
      step(
        "Publish deliberately",
        "Review the intended recipients and version; publication alone does not prove external delivery.",
      ),
      step(
        "Inspect activity",
        "Use activity to see recorded processing and failures.",
        "/automations/activity",
      ),
    ],
    outcome: "The team knows when the rule acts and how to verify it.",
    troubleshoot: [
      issue(
        "Nothing was delivered",
        "Check the trigger, eligibility, processing and external provider result in that order.",
      ),
    ],
  },
  {
    id: "csat",
    title: "Review customer satisfaction evidence",
    summary: "Use survey results alongside the case and customer context.",
    area: "Customers",
    moduleId: "csat",
    before: ["The intended survey and reporting period."],
    steps: [
      step(
        "Open the results",
        "Review available responses, dates and sample size.",
        "/csat",
      ),
      step(
        "Inspect the customer context",
        "Use linked service work where available.",
      ),
      step(
        "Follow up on poor outcomes",
        "Assign a specific improvement through the owning service/team workflow.",
      ),
      step(
        "Review survey setup",
        "Authorised managers check the questions and delivery configuration before relying on future results.",
      ),
    ],
    outcome: "Customer feedback leads to visible follow-up.",
    troubleshoot: [
      issue(
        "There are no responses",
        "Check delivery and the intended audience; a configured survey is not evidence of a completed response.",
      ),
    ],
  },
  {
    id: "audit",
    title: "Trace a change without guessing",
    summary: "Find who changed a record and open the relevant source.",
    area: "Business",
    moduleId: "audit",
    before: ["A record/reference, approximate time and the relevant access."],
    steps: [
      step(
        "Narrow the activity",
        "Filter to the period, source or record you need.",
        "/audit",
      ),
      step(
        "Read the actor and action",
        "Distinguish operational activity from protected audit evidence.",
      ),
      step(
        "Open the source",
        "Review the current record and its linked history with native permissions.",
      ),
      step(
        "Use the right correction",
        "Correct through the owning app’s authorised workflow, retaining the original evidence.",
      ),
    ],
    outcome: "A traceable explanation for the change.",
    troubleshoot: [
      issue(
        "I can only see my own activity",
        "Own, team and wider audit scopes are independent permissions.",
      ),
    ],
  },
  {
    id: "studio",
    title: "Understand Business setup safely",
    summary:
      "Review definitions and versions without confusing setup with business transactions.",
    area: "Business",
    moduleId: "studio",
    before: ["The intended business definition and authorised setup access."],
    steps: [
      step(
        "Open Business setup",
        "Review the definitions available to your company.",
        "/studio",
      ),
      step(
        "Inspect the definition",
        "Read its type, source, version and dependency details.",
      ),
      step(
        "Follow the available controlled actions",
        "Draft, publication and activation are separate. Some advanced field changes require a reviewed migration; the library is not a full visual workflow builder.",
      ),
      step(
        "Check the owning workflow",
        "Business records retain their native permissions and controls; setup does not bypass them.",
      ),
    ],
    outcome:
      "Configuration changes are understood in terms of their actual supported scope.",
    troubleshoot: [
      issue(
        "An advanced editing control is absent",
        "Use the implemented definition controls and ask the setup owner about the specific requirement. A catalogue entry does not imply every builder feature exists.",
      ),
    ],
  },
];

export function guideForPath(path: string): string {
  if (
    path.startsWith("/finance/purchases") ||
    path.startsWith("/finance/suppliers")
  )
    return "procurement";
  if (path.startsWith("/stock/handoffs")) return "production-handoff";
  const first = path.split("/")[1];
  return GUIDES.some((guide) => guide.id === first) ? first : "getting-started";
}

export function visibleGuides(
  capabilities: ReadonlySet<string>,
  accessibleModuleIds: ReadonlySet<string>,
) {
  return GUIDES.filter(
    (guide) =>
      (!guide.moduleId || accessibleModuleIds.has(guide.moduleId)) &&
      (!guide.capability || capabilities.has(guide.capability)),
  );
}

export function canFollowStep(
  step: GuideStep,
  capabilities: ReadonlySet<string>,
  accessibleModuleIds: ReadonlySet<string>,
) {
  return (
    !!step.href &&
    (!step.capability || capabilities.has(step.capability)) &&
    (!step.moduleId || accessibleModuleIds.has(step.moduleId))
  );
}
