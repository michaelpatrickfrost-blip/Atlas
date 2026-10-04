/**
 * Capability strings follow `<module>.<entity>.<action>`. Core capabilities use
 * the `core` module namespace. Capabilities are declared by module manifests
 * (see src/core/modules/registry.ts) and granted to roles — never checked by
 * hardcoded role name in application code. See docs/PERMISSIONS.md.
 */

export const CORE_CAPABILITIES = {
  approvalsDelegate: "core.approvals.delegate",
  productsRead: "core.products.read",
  productsManage: "core.products.manage",
  pricingRead: "core.pricing.read",
  pricingManage: "core.pricing.manage",
  modulesManage: "core.modules.manage",
  usersManage: "core.users.manage",
  auditRead: "core.audit.read",
  chatRead: "core.chat.read",
  chatWrite: "core.chat.write",
  rolesManage: "core.roles.manage",
} as const;

/** Team audit is narrower than company-wide `core.audit.read`. Echo is the
 *  record conversation: notes and mentions on customers, orders and sales. */
export const AUDIT_CAPABILITIES = {
  teamRead: "audit.team.read",
} as const;

export const ECHO_CAPABILITIES = {
  read: "echo.read",
  write: "echo.write",
} as const;

/** Customer Master — the canonical customer identity, owned by Core (every
 *  module depends on it; it is not an installable module). See
 *  docs/CUSTOMER_MASTER.md. Sensitive sections (credit, tax, bank) have their
 *  own read/manage capabilities so a salesperson's role need not grant them. */
export const CUSTOMER_CAPABILITIES = {
  read: "customers.read",
  create: "customers.create",
  edit: "customers.edit",
  archive: "customers.archive",

  contactsManage: "customers.contacts.manage",
  addressesManage: "customers.addresses.manage",

  commercialRead: "customers.commercial.read",
  commercialManage: "customers.commercial.manage",

  creditRead: "customers.credit.read",
  creditManage: "customers.credit.manage",

  taxRead: "customers.tax.read",
  taxManage: "customers.tax.manage",

  bankRead: "customers.bank.read",
  bankReveal: "customers.bank.reveal",
  bankManage: "customers.bank.manage",

  documentsRead: "customers.documents.read",
  documentsManage: "customers.documents.manage",

  restrictedNotesRead: "customers.restricted_notes.read",
  restrictedNotesManage: "customers.restricted_notes.manage",
} as const;

export const SALES_CAPABILITIES = {
  prospectRead: "sales.prospect.read",
  prospectCreate: "sales.prospect.create",
  prospectManage: "sales.prospect.manage",
  prospectAssign: "sales.prospect.assign",

  opportunityRead: "sales.opportunity.read",
  opportunityCreate: "sales.opportunity.create",
  opportunityManage: "sales.opportunity.manage",
  opportunityClose: "sales.opportunity.close",

  pipelineManage: "sales.pipeline.manage",

  activityManage: "sales.activity.manage",

  forecastRead: "sales.forecast.read",
  forecastManage: "sales.forecast.manage",

  reportRead: "sales.report.read",

  quoteRead: "sales.quote.read",
  quoteCreate: "sales.quote.create",
  quoteApprove: "sales.quote.approve",

  orderRead: "sales.order.read",
  orderCreate: "sales.order.create",
  orderEditDraft: "sales.order.edit_draft",
  orderConfirm: "sales.order.confirm",
  orderAmend: "sales.order.amend",
  orderCancel: "sales.order.cancel",
  orderPriceOverride: "sales.order.price_override",
  orderHoldRead: "sales.order.hold.read",
  orderHoldManage: "sales.order.hold.manage",
  orderApprovalRequest: "sales.order.approval.request",
  orderApprovalApprove: "sales.order.approval.approve",

  siteRead: "sales.site.read",
  siteManage: "sales.site.manage",
} as const;

/** HR (People) module. Pay, health, conduct and company policies are separate
 *  grants so a person can book holidays and read policies without seeing payroll
 *  or someone else's disciplinary record. */
export const HR_CAPABILITIES = {
  teamManage: "people.team.manage",
  employeeRead: "people.employee.read",
  employeeManage: "people.employee.manage",

  onboardingManage: "people.onboarding.manage",
  offboardingManage: "people.offboarding.manage",

  appraisalRead: "people.appraisal.read",
  appraisalManage: "people.appraisal.manage",

  oneToOneRead: "people.one_to_one.read",
  oneToOneManage: "people.one_to_one.manage",

  absenceRead: "people.absence.read",
  absenceManage: "people.absence.manage",
  holidaySelf: "people.holiday.self",

  rotaRead: "people.rota.read",
  rotaManage: "people.rota.manage",

  expenseRead: "people.expense.read",
  expenseApprove: "people.expense.approve",

  policyRead: "people.policy.read",
  policyManage: "people.policy.manage",
  conductRead: "people.conduct.read",
  conductManage: "people.conduct.manage",
} as const;

/** Payroll module. A real UK statutory engine (PAYE, NI, pension, SSP/SMP) — not
 *  RTI/HMRC submission. `employeeManage` is separate from HR's own employee.manage
 *  because sensitive pay/tax/bank fields should not open just because a role can
 *  edit job title or department. `payslipSelf` lets a person read their own
 *  payslips/P45/P60 on their profile, without any run-level capability. */
export const PAYROLL_CAPABILITIES = {
  runRead: "payroll.run.read",
  runManage: "payroll.run.manage",
  employeeManage: "payroll.employee.manage",
  settingsManage: "payroll.settings.manage",
  payslipSelf: "payroll.payslip.self",
} as const;

/** Standard roles seeded for every new organisation. Orgs may edit/add roles later. */
export const SCHEDULING_CAPABILITIES = { read: "scheduling.read", manage: "scheduling.manage" } as const;

/** Team planner. Reading a team shows shared holidays and tasks. Managing a team
 *  adds people, assigns work, names cover and puts moments on the calendar. */
export const TEAMS_CAPABILITIES = { read: "teams.read", manage: "teams.manage" } as const;

export const SERVICE_CAPABILITIES = {
  caseRead: "service.case.read", caseCreate: "service.case.create",
  caseUpdate: "service.case.update", caseAssign: "service.case.assign",
  caseResolve: "service.case.resolve", caseClose: "service.case.close",
  restrictedRead: "service.case.restricted", note: "service.case.note",
  communication: "service.case.communication", ticketRead: "service.ticket.read",
  ticketCreate: "service.ticket.create", ticketUpdate: "service.ticket.update",
  queueManage: "service.queue.manage",
  caseApprove: "service.case.approve",
} as const;

export const LOGISTICS_CAPABILITIES = {
  fulfilmentRead: "logistics.fulfilment.read",
  fulfilmentRelease: "logistics.fulfilment.release",
  pickRead: "logistics.pick.read",
  pickExecute: "logistics.pick.execute",
  pickOverride: "logistics.pick.override",
  packExecute: "logistics.pack.execute",
  shipmentRead: "logistics.shipment.read",
  shipmentCreate: "logistics.shipment.create",
  shipmentDispatch: "logistics.shipment.dispatch",
  shipmentCancel: "logistics.shipment.cancel",
  receiptExecute: "logistics.receipt.execute",
  receiptOverride: "logistics.receipt.override",
  returnRead: "logistics.return.read",
  returnAuthorise: "logistics.return.authorise",
  returnInspect: "logistics.return.inspect",
  returnResolve: "logistics.return.resolve",
  dispatchManage: "logistics.dispatch.manage",
  routeManage: "logistics.route.manage",
  exceptionResolve: "logistics.exception.resolve",
  reportRead: "logistics.report.read",
  costRead: "logistics.cost.read",
  policyManage: "logistics.policy.manage",
} as const;

export const MARKETING_CAPABILITIES = {
 campaignRead:'marketing.campaign.read',campaignCreate:'marketing.campaign.create',campaignManage:'marketing.campaign.manage',campaignPublish:'marketing.campaign.publish',
 audienceRead:'marketing.audience.read',audienceCreate:'marketing.audience.create',profileRead:'marketing.profile.read',profileManage:'marketing.profile.manage',
 consentView:'marketing.consent.view',consentManage:'marketing.consent.manage',contentRead:'marketing.content.read',contentCreate:'marketing.content.create',contentApprove:'marketing.content.approve',
 journeyRead:'marketing.journey.read',journeyManage:'marketing.journey.manage',journeyPublish:'marketing.journey.publish',emailRead:'marketing.email.read',emailCreate:'marketing.email.create',emailApprove:'marketing.email.approve',emailSend:'marketing.email.send',
 leadRead:'marketing.lead.read',leadManage:'marketing.lead.manage',eventIngest:'marketing.event.ingest',experimentManage:'marketing.experiment.manage',reportRead:'marketing.report.read',budgetManage:'marketing.budget.manage',programRead:'marketing.program.read',programManage:'marketing.program.manage',admin:'marketing.admin.manage',
} as const;

// §151-152 of docs/modules/MANUFACTURING_SOURCE_REQUIREMENTS.md.
export const SAFETY_CAPABILITIES = {
  todayRead: "safety.today.read",
  riskRead: "safety.risk.read",
  riskCreate: "safety.risk.create",
  riskApprove: "safety.risk.approve",
  incidentReport: "safety.incident.report",
  incidentRead: "safety.incident.read",
  incidentInvestigate: "safety.incident.investigate",
  sensitiveIncidentRead: "safety.sensitive_incident.read",
  riddorReview: "safety.riddor.review",
  riddorManage: "safety.riddor.manage",
  coshhRead: "safety.coshh.read",
  coshhManage: "safety.coshh.manage",
  permitRequest: "safety.permit.request",
  permitIssue: "safety.permit.issue",
  permitAuthorise: "safety.permit.authorise",
  permitClose: "safety.permit.close",
  isolationApply: "safety.isolation.apply",
  isolationVerify: "safety.isolation.verify",
  isolationRemove: "safety.isolation.remove",
  auditExecute: "safety.audit.execute",
  auditManage: "safety.audit.manage",
  inspectionExecute: "safety.inspection.execute",
  inspectionManage: "safety.inspection.manage",
  actionRead: "safety.action.read",
  actionManage: "safety.action.manage",
  actionVerify: "safety.action.verify",
  holdManage: "safety.hold.manage",
  equipmentRead: "safety.equipment.read",
  statutoryManage: "safety.statutory.manage",
  competenceRead: "safety.competence.read",
  competenceManage: "safety.competence.manage",
  healthSurveillanceRead: "safety.health_surveillance.read",
  documentRead: "safety.document.read",
  documentManage: "safety.document.manage",
  reportRead: "safety.report.read",
  profileManage: "safety.profile.manage",
  changeManage: "safety.change.manage",
} as const;

export const PLAN_CAPABILITIES = {
  read: "plan.read",
  create: "plan.create",
  edit: "plan.edit",
  submit: "plan.submit",
  review: "plan.review",
  approve: "plan.approve",
  lock: "plan.lock",
  scenarioCreate: "plan.scenario.create",
  scenarioShare: "plan.scenario.share",
  metricManage: "plan.metric.manage",
  modelManage: "plan.model.manage",
  sensitiveRead: "plan.sensitive.read",
} as const;

export const QUALITY_CAPABILITIES = {
  today: "quality.today.read",
  specRead: "quality.spec.read", specManage: "quality.spec.manage",
  controlPointRead: "quality.control_point.read", controlPointManage: "quality.control_point.manage",
  checkExecute: "quality.check.execute",
  holdRead: "quality.hold.read", holdAdd: "quality.hold.add", holdRelease: "quality.hold.release",
  ncrRead: "quality.ncr.read", ncrReport: "quality.ncr.report", ncrManage: "quality.ncr.manage", ncrClose: "quality.ncr.close",
  reportRead: "quality.report.read",
} as const;

export const MANUFACTURING_CAPABILITIES = {
  planRead: "manufacturing.plan.read", planManage: "manufacturing.plan.manage", planFirm: "manufacturing.plan.firm",
  scheduleRead: "manufacturing.schedule.read", scheduleManage: "manufacturing.schedule.manage", scheduleLock: "manufacturing.schedule.lock",
  orderRead: "manufacturing.order.read", orderCreate: "manufacturing.order.create", orderRelease: "manufacturing.order.release",
  orderAmend: "manufacturing.order.amend", orderClose: "manufacturing.order.close",
  workOrderRead: "manufacturing.work_order.read", workOrderExecute: "manufacturing.work_order.execute", workOrderOverride: "manufacturing.work_order.override",
  materialIssue: "manufacturing.material.issue", materialOverride: "manufacturing.material.override",
  scrapReport: "manufacturing.scrap.report", scrapApprove: "manufacturing.scrap.approve",
  costRead: "manufacturing.cost.read",
  bomRead: "manufacturing.bom.read", bomManage: "manufacturing.bom.manage",
  routingManage: "manufacturing.routing.manage", resourceManage: "manufacturing.resource.manage",
} as const;

export const STANDARD_ROLES: Array<{ key: string; name: string; capabilities: string[] }> = [
  {
    key: "admin",
    name: "Administrator",
    capabilities: [
      ...Object.values(CORE_CAPABILITIES),
      ...Object.values(AUDIT_CAPABILITIES),
      ...Object.values(ECHO_CAPABILITIES),
      "planning.demand.read", "planning.plan.manage", "planning.team.manage",
      "analytics.dashboard.read", "analytics.dashboard.manage",
      "projects.read", "projects.manage", "stock.read", "stock.manage", "kpis.read", "kpis.manage",
      ...Object.values(CUSTOMER_CAPABILITIES),
      ...Object.values(SALES_CAPABILITIES),
      ...Object.values(HR_CAPABILITIES),
      ...Object.values(PAYROLL_CAPABILITIES),
      ...Object.values(SCHEDULING_CAPABILITIES),
      ...Object.values(TEAMS_CAPABILITIES),
      ...Object.values(SERVICE_CAPABILITIES),
      "finance.overview.read",
      "finance.receivables.read",
      "finance.configure",
      "finance.approval.decide",
      ...Object.values(MARKETING_CAPABILITIES),
      ...Object.values(LOGISTICS_CAPABILITIES),
      ...Object.values(MANUFACTURING_CAPABILITIES),
      ...Object.values(SAFETY_CAPABILITIES),
      ...Object.values(PLAN_CAPABILITIES),
      ...Object.values(QUALITY_CAPABILITIES),
    ],
  },
  {
    key: "quality_inspector",
    name: "Quality Inspector",
    capabilities: [
      QUALITY_CAPABILITIES.today, QUALITY_CAPABILITIES.specRead, QUALITY_CAPABILITIES.controlPointRead,
      QUALITY_CAPABILITIES.checkExecute, QUALITY_CAPABILITIES.holdRead, QUALITY_CAPABILITIES.holdAdd,
      QUALITY_CAPABILITIES.ncrRead, QUALITY_CAPABILITIES.ncrReport, QUALITY_CAPABILITIES.reportRead,
      AUDIT_CAPABILITIES.teamRead, ECHO_CAPABILITIES.read, ECHO_CAPABILITIES.write,
    ],
  },
  {
    key: "quality_manager",
    name: "Quality Manager",
    capabilities: [
      ...Object.values(QUALITY_CAPABILITIES),
      AUDIT_CAPABILITIES.teamRead, ECHO_CAPABILITIES.read, ECHO_CAPABILITIES.write,
      "stock.read",
    ],
  },
  {
    key: "manufacturing_planner",
    name: "Manufacturing Planner",
    capabilities: [
      "analytics.dashboard.read", "analytics.dashboard.manage",
      "core.chat.read", "core.chat.write",
      AUDIT_CAPABILITIES.teamRead, ECHO_CAPABILITIES.read, ECHO_CAPABILITIES.write,
      ...Object.values(MANUFACTURING_CAPABILITIES),
      PLAN_CAPABILITIES.read,
      PLAN_CAPABILITIES.create,
      PLAN_CAPABILITIES.edit,
      PLAN_CAPABILITIES.submit,
      PLAN_CAPABILITIES.scenarioCreate,
    ],
  },
  {
    key: "shop_floor_operator",
    name: "Shop Floor Operator",
    capabilities: [
      MANUFACTURING_CAPABILITIES.workOrderRead,
      MANUFACTURING_CAPABILITIES.workOrderExecute,
      MANUFACTURING_CAPABILITIES.materialIssue,
      MANUFACTURING_CAPABILITIES.scrapReport,
    ],
  },
  { key: "warehouse_manager", name: "Warehouse Manager", capabilities: [...Object.values(LOGISTICS_CAPABILITIES), AUDIT_CAPABILITIES.teamRead, ECHO_CAPABILITIES.read, ECHO_CAPABILITIES.write] },
  { key: "warehouse_picker", name: "Picker", capabilities: [LOGISTICS_CAPABILITIES.fulfilmentRead, LOGISTICS_CAPABILITIES.pickRead, LOGISTICS_CAPABILITIES.pickExecute] },
  { key: "warehouse_packer", name: "Packer", capabilities: [LOGISTICS_CAPABILITIES.fulfilmentRead, LOGISTICS_CAPABILITIES.packExecute, LOGISTICS_CAPABILITIES.shipmentRead] },
  { key: "warehouse_receiver", name: "Receiver", capabilities: [LOGISTICS_CAPABILITIES.fulfilmentRead, LOGISTICS_CAPABILITIES.receiptExecute, LOGISTICS_CAPABILITIES.returnRead] },
  { key: "dispatcher", name: "Dispatcher", capabilities: [LOGISTICS_CAPABILITIES.fulfilmentRead, LOGISTICS_CAPABILITIES.shipmentRead, LOGISTICS_CAPABILITIES.shipmentCreate, LOGISTICS_CAPABILITIES.shipmentDispatch, LOGISTICS_CAPABILITIES.dispatchManage, LOGISTICS_CAPABILITIES.routeManage] },
  { key: "returns_clerk", name: "Returns", capabilities: [LOGISTICS_CAPABILITIES.fulfilmentRead, LOGISTICS_CAPABILITIES.returnRead, LOGISTICS_CAPABILITIES.returnInspect, LOGISTICS_CAPABILITIES.receiptExecute] },
  { key: "marketing_manager", name: "Marketing Manager", capabilities: [...Object.values(MARKETING_CAPABILITIES).filter(c=>c!=="marketing.admin.manage"), AUDIT_CAPABILITIES.teamRead, ECHO_CAPABILITIES.read, ECHO_CAPABILITIES.write] },
  { key: "marketing_viewer", name: "Marketing Viewer", capabilities: Object.values(MARKETING_CAPABILITIES).filter(c=>c.endsWith(".read")) },
  { key: "service_manager", name: "Customer Service Manager", capabilities: [...Object.values(SERVICE_CAPABILITIES), "customers.read", "analytics.dashboard.read", "analytics.dashboard.manage", AUDIT_CAPABILITIES.teamRead, ECHO_CAPABILITIES.read, ECHO_CAPABILITIES.write] },
  { key: "service_agent", name: "Customer Service Agent", capabilities: [...Object.values(SERVICE_CAPABILITIES).filter(c => !["service.case.restricted", "service.queue.manage", "service.case.approve"].includes(c)), "customers.read", ECHO_CAPABILITIES.read, ECHO_CAPABILITIES.write] },
  { key: "department_responder", name: "Department Responder", capabilities: [SERVICE_CAPABILITIES.ticketRead, SERVICE_CAPABILITIES.ticketUpdate] },
  { key: "team_manager", name: "Team Manager", capabilities: [HR_CAPABILITIES.teamManage, HR_CAPABILITIES.holidaySelf, HR_CAPABILITIES.policyRead, HR_CAPABILITIES.conductRead, HR_CAPABILITIES.conductManage, PAYROLL_CAPABILITIES.payslipSelf, SCHEDULING_CAPABILITIES.read, SCHEDULING_CAPABILITIES.manage, TEAMS_CAPABILITIES.read, TEAMS_CAPABILITIES.manage, "core.chat.read", "core.chat.write", AUDIT_CAPABILITIES.teamRead, ECHO_CAPABILITIES.read, ECHO_CAPABILITIES.write] },
  { key: "staff", name: "Staff", capabilities: [HR_CAPABILITIES.holidaySelf, HR_CAPABILITIES.policyRead, PAYROLL_CAPABILITIES.payslipSelf, SCHEDULING_CAPABILITIES.read, TEAMS_CAPABILITIES.read, "core.chat.read", "core.chat.write"] },
  {
    key: "hr_manager",
    name: "HR Manager",
    capabilities: [
      "analytics.dashboard.read", "analytics.dashboard.manage",
      "core.chat.read", "core.chat.write",
      AUDIT_CAPABILITIES.teamRead, ECHO_CAPABILITIES.read, ECHO_CAPABILITIES.write,
      ...Object.values(HR_CAPABILITIES),
      ...Object.values(PAYROLL_CAPABILITIES),
      ...Object.values(SCHEDULING_CAPABILITIES),
      ...Object.values(TEAMS_CAPABILITIES),
    ],
  },
  {
    key: "sales_user",
    name: "Sales User",
    capabilities: [
      "analytics.dashboard.read", "analytics.dashboard.manage",
      "core.chat.read", "core.chat.write",
      ECHO_CAPABILITIES.read, ECHO_CAPABILITIES.write,
      CUSTOMER_CAPABILITIES.read,
      CUSTOMER_CAPABILITIES.create,
      CUSTOMER_CAPABILITIES.edit,
      CUSTOMER_CAPABILITIES.contactsManage,
      CUSTOMER_CAPABILITIES.addressesManage,
      CUSTOMER_CAPABILITIES.commercialRead,
      CUSTOMER_CAPABILITIES.creditRead,
      SALES_CAPABILITIES.prospectRead,
      SALES_CAPABILITIES.prospectCreate,
      SALES_CAPABILITIES.prospectManage,
      SALES_CAPABILITIES.opportunityRead,
      SALES_CAPABILITIES.opportunityCreate,
      SALES_CAPABILITIES.opportunityManage,
      SALES_CAPABILITIES.opportunityClose,
      SALES_CAPABILITIES.activityManage,
      SALES_CAPABILITIES.forecastRead,
      SALES_CAPABILITIES.reportRead,
      SALES_CAPABILITIES.quoteRead,
      SALES_CAPABILITIES.quoteCreate,
      SALES_CAPABILITIES.orderRead,
      SALES_CAPABILITIES.orderCreate,
      SALES_CAPABILITIES.orderEditDraft,
      SALES_CAPABILITIES.orderConfirm,
      SALES_CAPABILITIES.orderAmend,
      SALES_CAPABILITIES.orderHoldRead,
      SALES_CAPABILITIES.orderApprovalRequest,
      SALES_CAPABILITIES.siteRead,
      SALES_CAPABILITIES.siteManage,
    ],
  },
  {
    key: "sales_manager",
    name: "Sales Manager",
    capabilities: [
      "analytics.dashboard.read", "analytics.dashboard.manage",
      "core.chat.read", "core.chat.write",
      AUDIT_CAPABILITIES.teamRead, ECHO_CAPABILITIES.read, ECHO_CAPABILITIES.write,
      CUSTOMER_CAPABILITIES.read,
      CUSTOMER_CAPABILITIES.create,
      CUSTOMER_CAPABILITIES.edit,
      CUSTOMER_CAPABILITIES.archive,
      CUSTOMER_CAPABILITIES.contactsManage,
      CUSTOMER_CAPABILITIES.addressesManage,
      CUSTOMER_CAPABILITIES.commercialRead,
      CUSTOMER_CAPABILITIES.commercialManage,
      CUSTOMER_CAPABILITIES.creditRead,
      SALES_CAPABILITIES.prospectRead,
      SALES_CAPABILITIES.prospectCreate,
      SALES_CAPABILITIES.prospectManage,
      SALES_CAPABILITIES.prospectAssign,
      SALES_CAPABILITIES.opportunityRead,
      SALES_CAPABILITIES.opportunityCreate,
      SALES_CAPABILITIES.opportunityManage,
      SALES_CAPABILITIES.opportunityClose,
      SALES_CAPABILITIES.pipelineManage,
      SALES_CAPABILITIES.activityManage,
      SALES_CAPABILITIES.forecastRead,
      SALES_CAPABILITIES.forecastManage,
      SALES_CAPABILITIES.reportRead,
      SALES_CAPABILITIES.quoteRead,
      SALES_CAPABILITIES.quoteCreate,
      SALES_CAPABILITIES.quoteApprove,
      SALES_CAPABILITIES.orderRead,
      SALES_CAPABILITIES.orderCreate,
      SALES_CAPABILITIES.orderEditDraft,
      SALES_CAPABILITIES.orderConfirm,
      SALES_CAPABILITIES.orderAmend,
      SALES_CAPABILITIES.orderCancel,
      SALES_CAPABILITIES.orderPriceOverride,
      SALES_CAPABILITIES.orderHoldRead,
      SALES_CAPABILITIES.orderHoldManage,
      SALES_CAPABILITIES.orderApprovalRequest,
      SALES_CAPABILITIES.orderApprovalApprove,
      SALES_CAPABILITIES.siteRead,
      SALES_CAPABILITIES.siteManage,
      PLAN_CAPABILITIES.read,
      PLAN_CAPABILITIES.create,
      PLAN_CAPABILITIES.edit,
      PLAN_CAPABILITIES.submit,
      PLAN_CAPABILITIES.scenarioCreate,
    ],
  },
  { key: "safety_manager", name: "Safety Manager", capabilities: [...Object.values(SAFETY_CAPABILITIES), "people.employee.read", "people.rota.read", AUDIT_CAPABILITIES.teamRead, ECHO_CAPABILITIES.read, ECHO_CAPABILITIES.write] },
  { key: "safety_representative", name: "Safety Representative", capabilities: [SAFETY_CAPABILITIES.todayRead, SAFETY_CAPABILITIES.riskRead, SAFETY_CAPABILITIES.incidentReport, SAFETY_CAPABILITIES.incidentRead, SAFETY_CAPABILITIES.incidentInvestigate, SAFETY_CAPABILITIES.inspectionExecute, SAFETY_CAPABILITIES.actionRead, SAFETY_CAPABILITIES.actionManage, SAFETY_CAPABILITIES.equipmentRead, SAFETY_CAPABILITIES.documentRead, SAFETY_CAPABILITIES.reportRead] },
  { key: "frontline", name: "Employee", capabilities: [HR_CAPABILITIES.holidaySelf, HR_CAPABILITIES.policyRead, PAYROLL_CAPABILITIES.payslipSelf, TEAMS_CAPABILITIES.read, SAFETY_CAPABILITIES.todayRead, SAFETY_CAPABILITIES.incidentReport, SAFETY_CAPABILITIES.inspectionExecute, SAFETY_CAPABILITIES.permitRequest, SAFETY_CAPABILITIES.documentRead, SAFETY_CAPABILITIES.riskRead] },
  { key: "payroll_manager", name: "Payroll Manager", capabilities: [...Object.values(PAYROLL_CAPABILITIES), HR_CAPABILITIES.employeeRead, HR_CAPABILITIES.absenceRead, HR_CAPABILITIES.rotaRead, "analytics.dashboard.read", "core.chat.read", "core.chat.write", AUDIT_CAPABILITIES.teamRead] },
  { key: "permit_issuer", name: "Permit Issuer", capabilities: [SAFETY_CAPABILITIES.todayRead, SAFETY_CAPABILITIES.permitRequest, SAFETY_CAPABILITIES.permitIssue, SAFETY_CAPABILITIES.isolationApply, SAFETY_CAPABILITIES.riskRead] },
  { key: "permit_authoriser", name: "Permit Authoriser", capabilities: [SAFETY_CAPABILITIES.todayRead, SAFETY_CAPABILITIES.permitAuthorise, SAFETY_CAPABILITIES.permitClose, SAFETY_CAPABILITIES.isolationVerify, SAFETY_CAPABILITIES.isolationRemove, SAFETY_CAPABILITIES.riskRead] },
  { key: "auditor", name: "Auditor", capabilities: [SAFETY_CAPABILITIES.todayRead, SAFETY_CAPABILITIES.auditExecute, SAFETY_CAPABILITIES.auditManage, SAFETY_CAPABILITIES.inspectionExecute, SAFETY_CAPABILITIES.actionRead, SAFETY_CAPABILITIES.reportRead, SAFETY_CAPABILITIES.documentRead] },
  {
    key: "finance_manager",
    name: "Finance Manager",
    capabilities: [
      "analytics.dashboard.read", "analytics.dashboard.manage",
      "core.chat.read", "core.chat.write",
      AUDIT_CAPABILITIES.teamRead, ECHO_CAPABILITIES.read, ECHO_CAPABILITIES.write,
      CUSTOMER_CAPABILITIES.read,
      CUSTOMER_CAPABILITIES.commercialRead,
      CUSTOMER_CAPABILITIES.creditRead,
      CUSTOMER_CAPABILITIES.creditManage,
      CUSTOMER_CAPABILITIES.taxRead,
      CUSTOMER_CAPABILITIES.taxManage,
      CUSTOMER_CAPABILITIES.bankRead,
      CUSTOMER_CAPABILITIES.bankReveal,
      CUSTOMER_CAPABILITIES.bankManage,
      CUSTOMER_CAPABILITIES.documentsRead,
      CUSTOMER_CAPABILITIES.documentsManage,
      PLAN_CAPABILITIES.read,
      PLAN_CAPABILITIES.review,
      PLAN_CAPABILITIES.sensitiveRead,
      "finance.overview.read",
      "finance.receivables.read",
      "finance.configure",
      "finance.approval.decide",
    ],
  },
];
