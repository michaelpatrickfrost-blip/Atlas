// Generated allowlist: public calls still enforce their own server capabilities.
import {toggleModuleAction as action0} from "@/app/(app)/apps/actions";
import {updateCompanyAccount as action1} from "@/app/(app)/atlas/actions";
import {saveCompanyEntitlements as action2} from "@/app/(app)/atlas/actions";
import {createCompanyAccount as action3} from "@/app/(app)/atlas/actions";
import {postMessage as action4} from "@/app/(app)/chat/actions";
import {saveDashboard as action5} from "@/app/(app)/crm/dashboards/actions";
import {updateValueFormAction as action6} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {updateCloseDateFormAction as action7} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {setNextActionFormAction as action8} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {setForecastCategoryFormAction as action9} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {winFormAction as action10} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {loseFormAction as action11} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addStakeholderFormAction as action12} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addMilestoneFormAction as action13} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {toggleMilestoneFormAction as action14} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {logOpportunityActivityFormAction as action15} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {qualifyFormAction as action16} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {disqualifyFormAction as action17} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {nurtureFormAction as action18} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {logProspectActivityFormAction as action19} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {convertProspectFormAction as action20} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {createContactFormAction as action21} from "@/app/(app)/customers/[partyId]/actions";
import {createAddressFormAction as action22} from "@/app/(app)/customers/[partyId]/actions";
import {createTaxRegistrationFormAction as action23} from "@/app/(app)/customers/[partyId]/actions";
import {markTaxVerifiedFormAction as action24} from "@/app/(app)/customers/[partyId]/actions";
import {createBankAccountFormAction as action25} from "@/app/(app)/customers/[partyId]/actions";
import {createDirectDebitFormAction as action26} from "@/app/(app)/customers/[partyId]/actions";
import {cancelDirectDebitFormAction as action27} from "@/app/(app)/customers/[partyId]/actions";
import {updateCreditLimitFormAction as action28} from "@/app/(app)/customers/[partyId]/actions";
import {toggleCreditHoldFormAction as action29} from "@/app/(app)/customers/[partyId]/actions";
import {createNoteFormAction as action30} from "@/app/(app)/customers/[partyId]/actions";
import {updateStatusFormAction as action31} from "@/app/(app)/customers/[partyId]/actions";
import {createKpi as action32} from "@/app/(app)/kpis/actions";
import {updateKpi as action33} from "@/app/(app)/kpis/actions";
import {logAbsence as action34} from "@/app/(app)/people/absence/actions";
import {createEmployee as action35} from "@/app/(app)/people/actions";
import {changeEmployeeStatus as action36} from "@/app/(app)/people/actions";
import {updateEmployeeProfile as action37} from "@/app/(app)/people/actions";
import {linkEmployeeToUser as action38} from "@/app/(app)/people/actions";
import {completeEmployeeTask as action39} from "@/app/(app)/people/actions";
import {addEmployeeTask as action40} from "@/app/(app)/people/actions";
import {scheduleAppraisal as action41} from "@/app/(app)/people/appraisals/actions";
import {completeAppraisal as action42} from "@/app/(app)/people/appraisals/actions";
import {scheduleOneToOne as action43} from "@/app/(app)/people/one-to-ones/actions";
import {completeOneToOne as action44} from "@/app/(app)/people/one-to-ones/actions";
import {createPayrollRun as action45} from "@/app/(app)/people/payroll/actions";
import {updatePayslipDeductions as action46} from "@/app/(app)/people/payroll/actions";
import {finalisePayrollRun as action47} from "@/app/(app)/people/payroll/actions";
import {markPayrollRunPaid as action48} from "@/app/(app)/people/payroll/actions";
import {createShift as action49} from "@/app/(app)/people/rotas/actions";
import {changeShiftStatus as action50} from "@/app/(app)/people/rotas/actions";
import {createPriceList as action51} from "@/app/(app)/pricing/actions";
import {savePriceEntry as action52} from "@/app/(app)/pricing/actions";
import {saveRule as action53} from "@/app/(app)/pricing/actions";
import {setRuleActive as action54} from "@/app/(app)/pricing/actions";
import {updatePriceBasis as action55} from "@/app/(app)/pricing/actions";
import {saveProduct as action56} from "@/app/(app)/products/actions";
import {saveProfile as action57} from "@/app/(app)/profile/actions";
import {createProject as action58} from "@/app/(app)/projects/actions";
import {changeProjectStatus as action59} from "@/app/(app)/projects/actions";
import {createTask as action60} from "@/app/(app)/projects/actions";
import {changeTaskStatus as action61} from "@/app/(app)/projects/actions";
import {createMeeting as action62} from "@/app/(app)/projects/actions";
import {createOrderForm as action63} from "@/app/(app)/sales/orders/actions";
import {addLineForm as action64} from "@/app/(app)/sales/orders/actions";
import {removeLineForm as action65} from "@/app/(app)/sales/orders/actions";
import {confirmOrderForm as action66} from "@/app/(app)/sales/orders/actions";
import {updateOrderForm as action67} from "@/app/(app)/sales/orders/actions";
import {chooseOrderAddresses as action68} from "@/app/(app)/sales/orders/actions";
import {addHoldForm as action69} from "@/app/(app)/sales/orders/actions";
import {releaseHoldForm as action70} from "@/app/(app)/sales/orders/actions";
import {approveOrderForm as action71} from "@/app/(app)/sales/orders/actions";
import {cancelOrderForm as action72} from "@/app/(app)/sales/orders/actions";
import {scheduleOrderDelivery as action73} from "@/app/(app)/sales/orders/actions";
import {rejectOrderApproval as action74} from "@/app/(app)/sales/orders/actions";
import {createQuote as action75} from "@/app/(app)/sales/quotes/actions";
import {saveCreationPolicy as action76} from "@/app/(app)/sales/settings/actions";
import {saveRole as action77} from "@/app/(app)/settings/actions";
import {saveMemberRoles as action78} from "@/app/(app)/settings/actions";
import {createUser as action79} from "@/app/(app)/settings/actions";
import {importCsv as action80} from "@/app/(app)/settings/imports/actions";
import {createWarehouse as action81} from "@/app/(app)/stock/actions";
import {adjustStock as action82} from "@/app/(app)/stock/actions";
import {signup as action83} from "@/app/(auth)/signup/actions";
import {loginAction as action84} from "@/core/auth/actions";
import {logoutAction as action85} from "@/core/auth/actions";
import {checkForDuplicatesAction as action86} from "@/core/customers/actions";
import {createCustomerAction as action87} from "@/core/customers/actions";
import {createCustomer as action88} from "@/core/customers/commands";
import {updateCustomerStatus as action89} from "@/core/customers/commands";
import {createContact as action90} from "@/core/customers/commands";
import {createAddress as action91} from "@/core/customers/commands";
import {updateCommercialSettings as action92} from "@/core/customers/commands";
import {updateCreditLimit as action93} from "@/core/customers/commands";
import {setCreditHold as action94} from "@/core/customers/commands";
import {setPaymentTerm as action95} from "@/core/customers/commands";
import {createTaxRegistration as action96} from "@/core/customers/commands";
import {markTaxRegistrationManuallyVerified as action97} from "@/core/customers/commands";
import {createBankAccount as action98} from "@/core/customers/commands";
import {revealBankAccount as action99} from "@/core/customers/commands";
import {createDirectDebitMandate as action100} from "@/core/customers/commands";
import {cancelDirectDebitMandate as action101} from "@/core/customers/commands";
import {createNote as action102} from "@/core/customers/commands";
import {saveOrderingPreferences as action103} from "@/core/customers/commercial-actions";
import {setCustomerParent as action104} from "@/core/customers/hierarchy-actions";
import {saveCustomerTradingLink as action105} from "@/core/customers/trading-actions";
import {archiveCustomerTradingLink as action106} from "@/core/customers/trading-actions";
import {logActivity as action107} from "@/modules/crm/services/activities";
import {completeActivity as action108} from "@/modules/crm/services/activities";
import {createOpportunity as action109} from "@/modules/crm/services/opportunities";
import {moveOpportunityStage as action110} from "@/modules/crm/services/opportunities";
import {updateOpportunityValue as action111} from "@/modules/crm/services/opportunities";
import {updateOpportunityCloseDate as action112} from "@/modules/crm/services/opportunities";
import {setOpportunityForecastCategory as action113} from "@/modules/crm/services/opportunities";
import {setOpportunityNextAction as action114} from "@/modules/crm/services/opportunities";
import {winOpportunity as action115} from "@/modules/crm/services/opportunities";
import {loseOpportunity as action116} from "@/modules/crm/services/opportunities";
import {addStakeholder as action117} from "@/modules/crm/services/opportunities";
import {addMilestone as action118} from "@/modules/crm/services/opportunities";
import {toggleMilestone as action119} from "@/modules/crm/services/opportunities";
import {checkProspectDuplicatesAction as action120} from "@/modules/crm/services/prospects";
import {createProspect as action121} from "@/modules/crm/services/prospects";
import {assignProspect as action122} from "@/modules/crm/services/prospects";
import {setProspectLifecycleStage as action123} from "@/modules/crm/services/prospects";
import {convertProspect as action124} from "@/modules/crm/services/prospects";
import {createSalesCatalogueProduct as action125} from "@/modules/sales/services/catalogue-actions";
import {sendQuote as action126} from "@/modules/sales/services/commands";
import {changeQuoteStatus as action127} from "@/modules/sales/services/commands";
import {duplicateDocument as action128} from "@/modules/sales/services/commands";
import {saveQuoteTemplate as action129} from "@/modules/sales/services/commands";
import {createOrderFromQuote as action130} from "@/modules/sales/services/commands";
import {saveDocument as action131} from "@/modules/sales/services/documents";
import {createDraftOrder as action132} from "@/modules/sales/services/orders";
import {addOrderLine as action133} from "@/modules/sales/services/orders";
import {removeOrderLine as action134} from "@/modules/sales/services/orders";
import {updateDraftOrderFields as action135} from "@/modules/sales/services/orders";
import {confirmOrder as action136} from "@/modules/sales/services/orders";
import {decideApproval as action137} from "@/modules/sales/services/orders";
import {amendLineQuantity as action138} from "@/modules/sales/services/orders";
import {overrideLinePrice as action139} from "@/modules/sales/services/orders";
import {amendRequestedDate as action140} from "@/modules/sales/services/orders";
import {cancelOrder as action141} from "@/modules/sales/services/orders";
import {cancelLineRemaining as action142} from "@/modules/sales/services/orders";
import {addHold as action143} from "@/modules/sales/services/orders";
import {releaseHold as action144} from "@/modules/sales/services/orders";
import {saveSalesView as action145} from "@/modules/sales/services/saved-views";
import {archiveSalesView as action146} from "@/modules/sales/services/saved-views";
export const DATA_ACTIONS:Record<string,(...args:never[])=>Promise<unknown>>={
"src/app/(app)/apps/actions:toggleModuleAction":action0 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/actions:updateCompanyAccount":action1 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/actions:saveCompanyEntitlements":action2 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/actions:createCompanyAccount":action3 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:postMessage":action4 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/dashboards/actions:saveDashboard":action5 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:updateValueFormAction":action6 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:updateCloseDateFormAction":action7 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:setNextActionFormAction":action8 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:setForecastCategoryFormAction":action9 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:winFormAction":action10 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:loseFormAction":action11 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:addStakeholderFormAction":action12 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:addMilestoneFormAction":action13 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:toggleMilestoneFormAction":action14 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:logOpportunityActivityFormAction":action15 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:qualifyFormAction":action16 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:disqualifyFormAction":action17 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:nurtureFormAction":action18 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:logProspectActivityFormAction":action19 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:convertProspectFormAction":action20 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createContactFormAction":action21 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createAddressFormAction":action22 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createTaxRegistrationFormAction":action23 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:markTaxVerifiedFormAction":action24 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createBankAccountFormAction":action25 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createDirectDebitFormAction":action26 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:cancelDirectDebitFormAction":action27 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateCreditLimitFormAction":action28 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:toggleCreditHoldFormAction":action29 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createNoteFormAction":action30 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateStatusFormAction":action31 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:createKpi":action32 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:updateKpi":action33 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:logAbsence":action34 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:createEmployee":action35 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:changeEmployeeStatus":action36 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeProfile":action37 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:linkEmployeeToUser":action38 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:completeEmployeeTask":action39 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeTask":action40 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:scheduleAppraisal":action41 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:completeAppraisal":action42 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:scheduleOneToOne":action43 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:completeOneToOne":action44 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/payroll/actions:createPayrollRun":action45 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/payroll/actions:updatePayslipDeductions":action46 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/payroll/actions:finalisePayrollRun":action47 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/payroll/actions:markPayrollRunPaid":action48 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:createShift":action49 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:changeShiftStatus":action50 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:createPriceList":action51 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:savePriceEntry":action52 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveRule":action53 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:setRuleActive":action54 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:updatePriceBasis":action55 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProduct":action56 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/actions:saveProfile":action57 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProject":action58 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeProjectStatus":action59 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTask":action60 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeTaskStatus":action61 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMeeting":action62 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:createOrderForm":action63 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addLineForm":action64 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:removeLineForm":action65 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:confirmOrderForm":action66 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:updateOrderForm":action67 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:chooseOrderAddresses":action68 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addHoldForm":action69 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:releaseHoldForm":action70 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:approveOrderForm":action71 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:cancelOrderForm":action72 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:scheduleOrderDelivery":action73 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:rejectOrderApproval":action74 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:createQuote":action75 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/settings/actions:saveCreationPolicy":action76 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveRole":action77 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveMemberRoles":action78 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:createUser":action79 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/imports/actions:importCsv":action80 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createWarehouse":action81 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:adjustStock":action82 as (...args:never[])=>Promise<unknown>,
"src/app/(auth)/signup/actions:signup":action83 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:loginAction":action84 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:logoutAction":action85 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:checkForDuplicatesAction":action86 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:createCustomerAction":action87 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createCustomer":action88 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerStatus":action89 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createContact":action90 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createAddress":action91 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCommercialSettings":action92 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCreditLimit":action93 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setCreditHold":action94 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setPaymentTerm":action95 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createTaxRegistration":action96 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:markTaxRegistrationManuallyVerified":action97 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createBankAccount":action98 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:revealBankAccount":action99 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createDirectDebitMandate":action100 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:cancelDirectDebitMandate":action101 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createNote":action102 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commercial-actions:saveOrderingPreferences":action103 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setCustomerParent":action104 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:saveCustomerTradingLink":action105 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:archiveCustomerTradingLink":action106 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:logActivity":action107 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:completeActivity":action108 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:createOpportunity":action109 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:moveOpportunityStage":action110 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityValue":action111 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityCloseDate":action112 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityForecastCategory":action113 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityNextAction":action114 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:winOpportunity":action115 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:loseOpportunity":action116 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addStakeholder":action117 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addMilestone":action118 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:toggleMilestone":action119 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:checkProspectDuplicatesAction":action120 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createProspect":action121 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:assignProspect":action122 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:setProspectLifecycleStage":action123 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:convertProspect":action124 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/catalogue-actions:createSalesCatalogueProduct":action125 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:sendQuote":action126 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:changeQuoteStatus":action127 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:duplicateDocument":action128 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:saveQuoteTemplate":action129 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:createOrderFromQuote":action130 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/documents:saveDocument":action131 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:createDraftOrder":action132 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addOrderLine":action133 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:removeOrderLine":action134 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:updateDraftOrderFields":action135 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:confirmOrder":action136 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:decideApproval":action137 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendLineQuantity":action138 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:overrideLinePrice":action139 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendRequestedDate":action140 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelOrder":action141 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelLineRemaining":action142 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addHold":action143 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:releaseHold":action144 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:saveSalesView":action145 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:archiveSalesView":action146 as (...args:never[])=>Promise<unknown>
};
