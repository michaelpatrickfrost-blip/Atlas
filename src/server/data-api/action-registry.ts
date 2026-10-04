// Generated allowlist: public calls still enforce their own server capabilities.
import {loadLiveMetrics as action0} from "@/app/(app)/analytics/actions";
import {loadMetricSlice as action1} from "@/app/(app)/analytics/actions";
import {saveAnalyticsDashboard as action2} from "@/app/(app)/analytics/actions";
import {deleteAnalyticsDashboard as action3} from "@/app/(app)/analytics/actions";
import {toggleModuleAction as action4} from "@/app/(app)/apps/actions";
import {updateCompanyAccount as action5} from "@/app/(app)/atlas/actions";
import {saveCompanyEntitlements as action6} from "@/app/(app)/atlas/actions";
import {createCompanyAccount as action7} from "@/app/(app)/atlas/actions";
import {importCompanySetup as action8} from "@/app/(app)/atlas/setup-actions";
import {createCompanyUser as action9} from "@/app/(app)/atlas/setup-actions";
import {setCompanyUserStatus as action10} from "@/app/(app)/atlas/setup-actions";
import {postMessage as action11} from "@/app/(app)/chat/actions";
import {searchChatPeople as action12} from "@/app/(app)/chat/actions";
import {openChat as action13} from "@/app/(app)/chat/actions";
import {openDirectChat as action14} from "@/app/(app)/chat/actions";
import {searchChatRecords as action15} from "@/app/(app)/chat/actions";
import {sendChat as action16} from "@/app/(app)/chat/actions";
import {chatSnapshot as action17} from "@/app/(app)/chat/actions";
import {updateValueFormAction as action18} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {updateCloseDateFormAction as action19} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {setNextActionFormAction as action20} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {setForecastCategoryFormAction as action21} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {winFormAction as action22} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {loseFormAction as action23} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addStakeholderFormAction as action24} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addMilestoneFormAction as action25} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {toggleMilestoneFormAction as action26} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {logOpportunityActivityFormAction as action27} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {createSalesProjectAction as action28} from "@/app/(app)/crm/projects/new/actions";
import {qualifyFormAction as action29} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {disqualifyFormAction as action30} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {nurtureFormAction as action31} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {logProspectActivityFormAction as action32} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {assignProspectFormAction as action33} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {assignProspectTaskFormAction as action34} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {convertProspectFormAction as action35} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {pinReportToDashboard as action36} from "@/app/(app)/crm/reports/actions";
import {createContactFormAction as action37} from "@/app/(app)/customers/[partyId]/actions";
import {updateContactFormAction as action38} from "@/app/(app)/customers/[partyId]/actions";
import {deleteContactFormAction as action39} from "@/app/(app)/customers/[partyId]/actions";
import {createAddressFormAction as action40} from "@/app/(app)/customers/[partyId]/actions";
import {createTaxRegistrationFormAction as action41} from "@/app/(app)/customers/[partyId]/actions";
import {markTaxVerifiedFormAction as action42} from "@/app/(app)/customers/[partyId]/actions";
import {createBankAccountFormAction as action43} from "@/app/(app)/customers/[partyId]/actions";
import {createDirectDebitFormAction as action44} from "@/app/(app)/customers/[partyId]/actions";
import {cancelDirectDebitFormAction as action45} from "@/app/(app)/customers/[partyId]/actions";
import {updateCreditLimitFormAction as action46} from "@/app/(app)/customers/[partyId]/actions";
import {toggleCreditHoldFormAction as action47} from "@/app/(app)/customers/[partyId]/actions";
import {createNoteFormAction as action48} from "@/app/(app)/customers/[partyId]/actions";
import {updateStatusFormAction as action49} from "@/app/(app)/customers/[partyId]/actions";
import {deleteCustomerFormAction as action50} from "@/app/(app)/customers/[partyId]/actions";
import {createKpi as action51} from "@/app/(app)/kpis/actions";
import {saveGoal as action52} from "@/app/(app)/kpis/actions";
import {updateKpi as action53} from "@/app/(app)/kpis/actions";
import {recordProgress as action54} from "@/app/(app)/kpis/actions";
import {closeGoal as action55} from "@/app/(app)/kpis/actions";
import {addPlanGoal as action56} from "@/app/(app)/kpis/actions";
import {closePlan as action57} from "@/app/(app)/kpis/actions";
import {commentOnPlan as action58} from "@/app/(app)/kpis/actions";
import {syncDemandAction as action59} from "@/app/(app)/logistics/actions";
import {restoreDeliveryAction as action60} from "@/app/(app)/logistics/actions";
import {releaseAction as action61} from "@/app/(app)/logistics/actions";
import {allocateAction as action62} from "@/app/(app)/logistics/actions";
import {directShipAction as action63} from "@/app/(app)/logistics/actions";
import {groupAction as action64} from "@/app/(app)/logistics/actions";
import {scanAction as action65} from "@/app/(app)/logistics/actions";
import {lotAction as action66} from "@/app/(app)/logistics/actions";
import {serialAction as action67} from "@/app/(app)/logistics/actions";
import {shortAction as action68} from "@/app/(app)/logistics/actions";
import {completeWorkAction as action69} from "@/app/(app)/logistics/actions";
import {claimAction as action70} from "@/app/(app)/logistics/actions";
import {shipFromPickAction as action71} from "@/app/(app)/logistics/actions";
import {packageAction as action72} from "@/app/(app)/logistics/actions";
import {weightAction as action73} from "@/app/(app)/logistics/actions";
import {stageAction as action74} from "@/app/(app)/logistics/actions";
import {labelAction as action75} from "@/app/(app)/logistics/actions";
import {dispatchAction as action76} from "@/app/(app)/logistics/actions";
import {trackingAction as action77} from "@/app/(app)/logistics/actions";
import {deliverAction as action78} from "@/app/(app)/logistics/actions";
import {loadCreateAction as action79} from "@/app/(app)/logistics/actions";
import {loadScanAction as action80} from "@/app/(app)/logistics/actions";
import {departAction as action81} from "@/app/(app)/logistics/actions";
import {expectAction as action82} from "@/app/(app)/logistics/actions";
import {receiveLineAction as action83} from "@/app/(app)/logistics/actions";
import {putAwayAction as action84} from "@/app/(app)/logistics/actions";
import {completeReceiptAction as action85} from "@/app/(app)/logistics/actions";
import {transferAction as action86} from "@/app/(app)/logistics/actions";
import {transferReceiveAction as action87} from "@/app/(app)/logistics/actions";
import {returnRequestAction as action88} from "@/app/(app)/logistics/actions";
import {authoriseReturnAction as action89} from "@/app/(app)/logistics/actions";
import {receiveReturnAction as action90} from "@/app/(app)/logistics/actions";
import {inspectAction as action91} from "@/app/(app)/logistics/actions";
import {closeReturnAction as action92} from "@/app/(app)/logistics/actions";
import {assignEquipmentAction as action93} from "@/app/(app)/logistics/actions";
import {packUnitAction as action94} from "@/app/(app)/logistics/actions";
import {saveHandlingTypeAction as action95} from "@/app/(app)/logistics/actions";
import {retireHandlingTypeAction as action96} from "@/app/(app)/logistics/actions";
import {removeHandlingTypeAction as action97} from "@/app/(app)/logistics/actions";
import {policyAction as action98} from "@/app/(app)/logistics/actions";
import {loadNotices as action99} from "@/app/(app)/notices/actions";
import {clearNotice as action100} from "@/app/(app)/notices/actions";
import {clearNotices as action101} from "@/app/(app)/notices/actions";
import {createPayrollRun as action102} from "@/app/(app)/payroll/actions";
import {updatePayslipDeductions as action103} from "@/app/(app)/payroll/actions";
import {finalisePayrollRun as action104} from "@/app/(app)/payroll/actions";
import {markPayrollRunPaid as action105} from "@/app/(app)/payroll/actions";
import {savePayrollSettings as action106} from "@/app/(app)/payroll/actions";
import {issueP45 as action107} from "@/app/(app)/payroll/actions";
import {issueP60 as action108} from "@/app/(app)/payroll/actions";
import {logAbsence as action109} from "@/app/(app)/people/absence/actions";
import {requestLeave as action110} from "@/app/(app)/people/absence/actions";
import {cancelOwnLeave as action111} from "@/app/(app)/people/absence/actions";
import {approveLeaveRequest as action112} from "@/app/(app)/people/absence/actions";
import {setLeaveAllowance as action113} from "@/app/(app)/people/absence/actions";
import {rejectLeaveRequest as action114} from "@/app/(app)/people/absence/actions";
import {createEmployee as action115} from "@/app/(app)/people/actions";
import {changeEmployeeStatus as action116} from "@/app/(app)/people/actions";
import {updateEmployeeProfile as action117} from "@/app/(app)/people/actions";
import {updateOwnEmployeeDetails as action118} from "@/app/(app)/people/actions";
import {addEmployeeDocument as action119} from "@/app/(app)/people/actions";
import {linkEmployeeToUser as action120} from "@/app/(app)/people/actions";
import {completeEmployeeTask as action121} from "@/app/(app)/people/actions";
import {addEmployeeTask as action122} from "@/app/(app)/people/actions";
import {updateEmployeeContact as action123} from "@/app/(app)/people/actions";
import {updateEmployeeTask as action124} from "@/app/(app)/people/actions";
import {scheduleAppraisal as action125} from "@/app/(app)/people/appraisals/actions";
import {completeAppraisal as action126} from "@/app/(app)/people/appraisals/actions";
import {getConductDesk as action127} from "@/app/(app)/people/conduct/actions";
import {getMyConduct as action128} from "@/app/(app)/people/conduct/actions";
import {getPlan as action129} from "@/app/(app)/people/conduct/actions";
import {getCase as action130} from "@/app/(app)/people/conduct/actions";
import {conductChoices as action131} from "@/app/(app)/people/conduct/actions";
import {savePlan as action132} from "@/app/(app)/people/conduct/actions";
import {addPlanReview as action133} from "@/app/(app)/people/conduct/actions";
import {commentOnPlan as action134} from "@/app/(app)/people/conduct/actions";
import {saveCase as action135} from "@/app/(app)/people/conduct/actions";
import {respondToCase as action136} from "@/app/(app)/people/conduct/actions";
import {addCaseEvent as action137} from "@/app/(app)/people/conduct/actions";
import {submitExpenseClaim as action138} from "@/app/(app)/people/expenses/actions";
import {approveExpenseClaim as action139} from "@/app/(app)/people/expenses/actions";
import {rejectExpenseClaim as action140} from "@/app/(app)/people/expenses/actions";
import {scheduleOneToOne as action141} from "@/app/(app)/people/one-to-ones/actions";
import {completeOneToOne as action142} from "@/app/(app)/people/one-to-ones/actions";
import {listPolicies as action143} from "@/app/(app)/people/policies/actions";
import {publishPolicy as action144} from "@/app/(app)/people/policies/actions";
import {archivePolicy as action145} from "@/app/(app)/people/policies/actions";
import {openPolicy as action146} from "@/app/(app)/people/policies/actions";
import {createShift as action147} from "@/app/(app)/people/rotas/actions";
import {changeShiftStatus as action148} from "@/app/(app)/people/rotas/actions";
import {getMyHR as action149} from "@/app/(app)/people/self-service";
import {getMyTeam as action150} from "@/app/(app)/people/self-service";
import {getTeamEmployee as action151} from "@/app/(app)/people/self-service";
import {addPrivateNote as action152} from "@/app/(app)/people/self-service";
import {updateWorkingPattern as action153} from "@/app/(app)/people/self-service";
import {updateHrSettings as action154} from "@/app/(app)/people/settings/actions";
import {createAppraisalTemplate as action155} from "@/app/(app)/people/settings/actions";
import {toggleAppraisalTemplateActive as action156} from "@/app/(app)/people/settings/actions";
import {createOneToOneTemplate as action157} from "@/app/(app)/people/settings/actions";
import {toggleOneToOneTemplateActive as action158} from "@/app/(app)/people/settings/actions";
import {getTimesheetContext as action159} from "@/app/(app)/people/timesheets/actions";
import {saveTimesheet as action160} from "@/app/(app)/people/timesheets/actions";
import {reviewTimesheet as action161} from "@/app/(app)/people/timesheets/actions";
import {createPriceList as action162} from "@/app/(app)/pricing/actions";
import {savePriceEntry as action163} from "@/app/(app)/pricing/actions";
import {saveRule as action164} from "@/app/(app)/pricing/actions";
import {setRuleActive as action165} from "@/app/(app)/pricing/actions";
import {updatePriceBasis as action166} from "@/app/(app)/pricing/actions";
import {assignPriceList as action167} from "@/app/(app)/pricing/actions";
import {previewPriceCsv as action168} from "@/app/(app)/pricing/actions";
import {applyPriceCsv as action169} from "@/app/(app)/pricing/actions";
import {saveAgreement as action170} from "@/app/(app)/pricing/actions";
import {saveAgreementPrice as action171} from "@/app/(app)/pricing/actions";
import {removeAgreementPrice as action172} from "@/app/(app)/pricing/actions";
import {previewAgreementCsv as action173} from "@/app/(app)/pricing/actions";
import {applyAgreementCsv as action174} from "@/app/(app)/pricing/actions";
import {saveProduct as action175} from "@/app/(app)/products/actions";
import {saveProductRecord as action176} from "@/app/(app)/products/actions";
import {saveCategory as action177} from "@/app/(app)/products/actions";
import {retireCategory as action178} from "@/app/(app)/products/actions";
import {addStandardCategories as action179} from "@/app/(app)/products/actions";
import {savePack as action180} from "@/app/(app)/products/actions";
import {saveLinks as action181} from "@/app/(app)/products/actions";
import {saveMeasures as action182} from "@/app/(app)/products/actions";
import {saveProfile as action183} from "@/app/(app)/profile/actions";
import {loadAssignedWork as action184} from "@/app/(app)/profile/work";
import {createProject as action185} from "@/app/(app)/projects/actions";
import {changeProjectStatus as action186} from "@/app/(app)/projects/actions";
import {editProject as action187} from "@/app/(app)/projects/actions";
import {setProjectMember as action188} from "@/app/(app)/projects/actions";
import {archiveProject as action189} from "@/app/(app)/projects/actions";
import {createTask as action190} from "@/app/(app)/projects/actions";
import {changeTaskStatus as action191} from "@/app/(app)/projects/actions";
import {editTask as action192} from "@/app/(app)/projects/actions";
import {checklistItem as action193} from "@/app/(app)/projects/actions";
import {addDependency as action194} from "@/app/(app)/projects/actions";
import {createMeeting as action195} from "@/app/(app)/projects/actions";
import {createDocument as action196} from "@/app/(app)/projects/actions";
import {editDocument as action197} from "@/app/(app)/projects/actions";
import {addComment as action198} from "@/app/(app)/projects/actions";
import {createMilestone as action199} from "@/app/(app)/projects/actions";
import {publishUpdate as action200} from "@/app/(app)/projects/actions";
import {createDecision as action201} from "@/app/(app)/projects/actions";
import {decide as action202} from "@/app/(app)/projects/actions";
import {createRisk as action203} from "@/app/(app)/projects/actions";
import {closeRisk as action204} from "@/app/(app)/projects/actions";
import {requestApproval as action205} from "@/app/(app)/projects/actions";
import {respondApproval as action206} from "@/app/(app)/projects/actions";
import {submitRequest as action207} from "@/app/(app)/projects/actions";
import {triageRequest as action208} from "@/app/(app)/projects/actions";
import {logTime as action209} from "@/app/(app)/projects/actions";
import {planToday as action210} from "@/app/(app)/projects/actions";
import {updateInbox as action211} from "@/app/(app)/projects/actions";
import {saveView as action212} from "@/app/(app)/projects/actions";
import {createPortfolio as action213} from "@/app/(app)/projects/actions";
import {createBaseline as action214} from "@/app/(app)/projects/actions";
import {setBudget as action215} from "@/app/(app)/projects/actions";
import {linkWork as action216} from "@/app/(app)/projects/actions";
import {getProjectActivity as action217} from "@/app/(app)/projects/actions";
import {createAutomation as action218} from "@/app/(app)/projects/actions";
import {toggleAutomation as action219} from "@/app/(app)/projects/actions";
import {saveProjectTemplate as action220} from "@/app/(app)/projects/actions";
import {useProjectTemplate as action221} from "@/app/(app)/projects/actions";
import {startTimer as action222} from "@/app/(app)/projects/actions";
import {stopTimer as action223} from "@/app/(app)/projects/actions";
import {projectPreference as action224} from "@/app/(app)/projects/actions";
import {uploadProjectFile as action225} from "@/app/(app)/projects/actions";
import {readProjectFile as action226} from "@/app/(app)/projects/actions";
import {createProperty as action227} from "@/app/(app)/projects/actions";
import {setProperty as action228} from "@/app/(app)/projects/actions";
import {restoreDocument as action229} from "@/app/(app)/projects/actions";
import {createTaskFromDocument as action230} from "@/app/(app)/projects/actions";
import {discardTimer as action231} from "@/app/(app)/projects/actions";
import {completeMilestone as action232} from "@/app/(app)/projects/actions";
import {resolveComment as action233} from "@/app/(app)/projects/actions";
import {getProjectWorkload as action234} from "@/app/(app)/projects/actions";
import {createOrderForm as action235} from "@/app/(app)/sales/orders/actions";
import {addLineForm as action236} from "@/app/(app)/sales/orders/actions";
import {removeLineForm as action237} from "@/app/(app)/sales/orders/actions";
import {confirmOrderForm as action238} from "@/app/(app)/sales/orders/actions";
import {updateOrderForm as action239} from "@/app/(app)/sales/orders/actions";
import {chooseOrderAddresses as action240} from "@/app/(app)/sales/orders/actions";
import {addHoldForm as action241} from "@/app/(app)/sales/orders/actions";
import {releaseHoldForm as action242} from "@/app/(app)/sales/orders/actions";
import {approveOrderForm as action243} from "@/app/(app)/sales/orders/actions";
import {cancelOrderForm as action244} from "@/app/(app)/sales/orders/actions";
import {saveOrderHashtagsForm as action245} from "@/app/(app)/sales/orders/actions";
import {restoreCancelledOrderForm as action246} from "@/app/(app)/sales/orders/actions";
import {returnOrderToQuoteForm as action247} from "@/app/(app)/sales/orders/actions";
import {scheduleOrderDelivery as action248} from "@/app/(app)/sales/orders/actions";
import {rejectOrderApproval as action249} from "@/app/(app)/sales/orders/actions";
import {deleteOrderForm as action250} from "@/app/(app)/sales/orders/actions";
import {createQuote as action251} from "@/app/(app)/sales/quotes/actions";
import {deleteQuoteForm as action252} from "@/app/(app)/sales/quotes/actions";
import {saveCreationPolicy as action253} from "@/app/(app)/sales/settings/actions";
import {getSchedule as action254} from "@/app/(app)/scheduling/actions";
import {createBulkShifts as action255} from "@/app/(app)/scheduling/actions";
import {setScheduledShift as action256} from "@/app/(app)/scheduling/actions";
import {completeShiftTask as action257} from "@/app/(app)/scheduling/actions";
import {editScheduledShift as action258} from "@/app/(app)/scheduling/actions";
import {publishWeekShifts as action259} from "@/app/(app)/scheduling/actions";
import {saveHoursBudget as action260} from "@/app/(app)/scheduling/actions";
import {getTeamPlan as action261} from "@/app/(app)/scheduling/actions";
import {getPersonSchedule as action262} from "@/app/(app)/scheduling/actions";
import {saveWorkType as action263} from "@/app/(app)/scheduling/actions";
import {archiveWorkType as action264} from "@/app/(app)/scheduling/actions";
import {saveDemand as action265} from "@/app/(app)/scheduling/actions";
import {saveBusyRule as action266} from "@/app/(app)/scheduling/actions";
import {removeBusyRule as action267} from "@/app/(app)/scheduling/actions";
import {fillTeamMonth as action268} from "@/app/(app)/scheduling/actions";
import {replanCover as action269} from "@/app/(app)/scheduling/actions";
import {publishMonth as action270} from "@/app/(app)/scheduling/actions";
import {saveShift as action271} from "@/app/(app)/scheduling/actions";
import {saveRole as action272} from "@/app/(app)/settings/actions";
import {saveMemberRoles as action273} from "@/app/(app)/settings/actions";
import {createUser as action274} from "@/app/(app)/settings/actions";
import {saveCompanyAccess as action275} from "@/app/(app)/settings/actions";
import {saveCompanyProfile as action276} from "@/app/(app)/settings/actions";
import {saveManagerPolicy as action277} from "@/app/(app)/settings/actions";
import {saveWorkspaceDetails as action278} from "@/app/(app)/settings/actions";
import {saveCompanyBrand as action279} from "@/app/(app)/settings/actions";
import {importCsv as action280} from "@/app/(app)/settings/imports/actions";
import {saveDispatchDelivery as action281} from "@/app/(app)/settings/logistics/actions";
import {saveUserAccess as action282} from "@/app/(app)/settings/user-actions";
import {setUserStatus as action283} from "@/app/(app)/settings/user-actions";
import {revokeUserSessions as action284} from "@/app/(app)/settings/user-actions";
import {issuePasswordRecovery as action285} from "@/app/(app)/settings/user-actions";
import {createManagedUser as action286} from "@/app/(app)/settings/user-actions";
import {linkEmployeeProfile as action287} from "@/app/(app)/settings/user-actions";
import {createRole as action288} from "@/app/(app)/settings/user-actions";
import {saveManagementGroup as action289} from "@/app/(app)/settings/user-actions";
import {createWarehouse as action290} from "@/app/(app)/stock/actions";
import {adjustStock as action291} from "@/app/(app)/stock/actions";
import {transferStock as action292} from "@/app/(app)/stock/actions";
import {createSiteAction as action293} from "@/app/(app)/stock/actions";
import {createPlaceAction as action294} from "@/app/(app)/stock/actions";
import {assignSiteAction as action295} from "@/app/(app)/stock/actions";
import {addLocationAction as action296} from "@/app/(app)/stock/actions";
import {ensureLocationsAction as action297} from "@/app/(app)/stock/actions";
import {retireLocationAction as action298} from "@/app/(app)/stock/actions";
import {putOnLocationAction as action299} from "@/app/(app)/stock/actions";
import {moveLocatedAction as action300} from "@/app/(app)/stock/actions";
import {receiveMoveAction as action301} from "@/app/(app)/stock/actions";
import {delegateApprovals as action302} from "@/core/approvals/actions";
import {loginAction as action303} from "@/core/auth/actions";
import {logoutAction as action304} from "@/core/auth/actions";
import {completePasswordRecovery as action305} from "@/core/auth/security-actions";
import {changeOwnPassword as action306} from "@/core/auth/security-actions";
import {signOutOtherSessions as action307} from "@/core/auth/security-actions";
import {checkForDuplicatesAction as action308} from "@/core/customers/actions";
import {createCustomerAction as action309} from "@/core/customers/actions";
import {createCustomer as action310} from "@/core/customers/commands";
import {updateCustomerStatus as action311} from "@/core/customers/commands";
import {deleteCustomer as action312} from "@/core/customers/commands";
import {createContact as action313} from "@/core/customers/commands";
import {updateContact as action314} from "@/core/customers/commands";
import {deleteContact as action315} from "@/core/customers/commands";
import {createAddress as action316} from "@/core/customers/commands";
import {updateCommercialSettings as action317} from "@/core/customers/commands";
import {updateCreditLimit as action318} from "@/core/customers/commands";
import {setCreditHold as action319} from "@/core/customers/commands";
import {setPaymentTerm as action320} from "@/core/customers/commands";
import {createTaxRegistration as action321} from "@/core/customers/commands";
import {markTaxRegistrationManuallyVerified as action322} from "@/core/customers/commands";
import {createBankAccount as action323} from "@/core/customers/commands";
import {revealBankAccount as action324} from "@/core/customers/commands";
import {createDirectDebitMandate as action325} from "@/core/customers/commands";
import {cancelDirectDebitMandate as action326} from "@/core/customers/commands";
import {createNote as action327} from "@/core/customers/commands";
import {saveCustomerHashtags as action328} from "@/core/customers/commands";
import {saveOrderingPreferences as action329} from "@/core/customers/commercial-actions";
import {setCustomerParent as action330} from "@/core/customers/hierarchy-actions";
import {placeCustomer as action331} from "@/core/customers/hierarchy-actions";
import {moveCustomer as action332} from "@/core/customers/hierarchy-actions";
import {setContactReportsTo as action333} from "@/core/customers/hierarchy-actions";
import {saveCustomerTradingLink as action334} from "@/core/customers/trading-actions";
import {setInvoiceAccount as action335} from "@/core/customers/trading-actions";
import {archiveCustomerTradingLink as action336} from "@/core/customers/trading-actions";
import {requestSalesInvoice as action337} from "@/core/finance/actions";
import {createWorkTeam as action338} from "@/core/teams/actions";
import {loadAuditBoard as action339} from "@/modules/audit/services/actions";
import {exportAuditReport as action340} from "@/modules/audit/services/actions";
import {loadEcho as action341} from "@/modules/audit/services/actions";
import {postEchoNote as action342} from "@/modules/audit/services/actions";
import {loadEchoInbox as action343} from "@/modules/audit/services/actions";
import {loadAuditAccess as action344} from "@/modules/audit/services/actions";
import {saveAuditOwnActivity as action345} from "@/modules/audit/services/actions";
import {saveAuditAreas as action346} from "@/modules/audit/services/actions";
import {logActivity as action347} from "@/modules/crm/services/activities";
import {completeActivity as action348} from "@/modules/crm/services/activities";
import {acceptMarketingHandoff as action349} from "@/modules/crm/services/marketing-handoff";
import {createOpportunity as action350} from "@/modules/crm/services/opportunities";
import {moveOpportunityStage as action351} from "@/modules/crm/services/opportunities";
import {updateOpportunityValue as action352} from "@/modules/crm/services/opportunities";
import {updateOpportunityCloseDate as action353} from "@/modules/crm/services/opportunities";
import {setOpportunityForecastCategory as action354} from "@/modules/crm/services/opportunities";
import {setOpportunityNextAction as action355} from "@/modules/crm/services/opportunities";
import {winOpportunity as action356} from "@/modules/crm/services/opportunities";
import {loseOpportunity as action357} from "@/modules/crm/services/opportunities";
import {addStakeholder as action358} from "@/modules/crm/services/opportunities";
import {addMilestone as action359} from "@/modules/crm/services/opportunities";
import {toggleMilestone as action360} from "@/modules/crm/services/opportunities";
import {checkProspectDuplicatesAction as action361} from "@/modules/crm/services/prospects";
import {createProspect as action362} from "@/modules/crm/services/prospects";
import {assignProspect as action363} from "@/modules/crm/services/prospects";
import {setProspectLifecycleStage as action364} from "@/modules/crm/services/prospects";
import {convertProspect as action365} from "@/modules/crm/services/prospects";
import {createIndustry as action366} from "@/modules/crm/services/prospects";
import {saveProspectGrouping as action367} from "@/modules/crm/services/prospects";
import {createSalesProject as action368} from "@/modules/crm/services/sales-projects-commands";
import {updateSalesProject as action369} from "@/modules/crm/services/sales-projects-commands";
import {addOrganisationToProject as action370} from "@/modules/crm/services/sales-projects-commands";
import {addStakeholderToProject as action371} from "@/modules/crm/services/sales-projects-commands";
import {linkQuoteToProject as action372} from "@/modules/crm/services/sales-projects-commands";
import {linkOrderToProject as action373} from "@/modules/crm/services/sales-projects-commands";
import {deleteSalesProject as action374} from "@/modules/crm/services/sales-projects-commands";
import {setupFinance as action375} from "@/modules/finance/services/commands";
import {createFinanceDocument as action376} from "@/modules/finance/services/commands";
import {submitFinanceDocument as action377} from "@/modules/finance/services/commands";
import {saveApprovalPolicy as action378} from "@/modules/finance/services/commands";
import {decideFinanceApproval as action379} from "@/modules/finance/services/commands";
import {createPurchaseOrder as action380} from "@/modules/finance/services/commands";
import {raiseServiceCredit as action381} from "@/modules/finance/services/commands";
import {postFinanceDocument as action382} from "@/modules/finance/services/commands";
import {recordGoodsReceipt as action383} from "@/modules/finance/services/commands";
import {onboardSupplier as action384} from "@/modules/finance/services/commands";
import {approveSupplier as action385} from "@/modules/finance/services/commands";
import {requestSupplierBankChange as action386} from "@/modules/finance/services/commands";
import {verifySupplierBank as action387} from "@/modules/finance/services/commands";
import {createFinanceBank as action388} from "@/modules/finance/services/commands";
import {importBankTransactions as action389} from "@/modules/finance/services/commands";
import {allocateBankTransaction as action390} from "@/modules/finance/services/commands";
import {createPaymentRun as action391} from "@/modules/finance/services/commands";
import {approvePaymentRun as action392} from "@/modules/finance/services/commands";
import {createManualJournal as action393} from "@/modules/finance/services/commands";
import {approveManualJournal as action394} from "@/modules/finance/services/commands";
import {reverseJournal as action395} from "@/modules/finance/services/commands";
import {setFinancePeriodState as action396} from "@/modules/finance/services/commands";
import {saveFinanceBudget as action397} from "@/modules/finance/services/commands";
import {saveFinanceAsset as action398} from "@/modules/finance/services/commands";
import {postAssetDepreciation as action399} from "@/modules/finance/services/commands";
import {completeCloseTask as action400} from "@/modules/finance/services/commands";
import {saveFinanceContract as action401} from "@/modules/finance/services/commands";
import {saveFinanceScenario as action402} from "@/modules/finance/services/commands";
import {receiptForm as action403} from "@/modules/finance/services/commands";
import {journalForm as action404} from "@/modules/finance/services/commands";
import {statementForm as action405} from "@/modules/finance/services/commands";
import {allocationForm as action406} from "@/modules/finance/services/commands";
import {paymentRunForm as action407} from "@/modules/finance/services/commands";
import {policyForm as action408} from "@/modules/finance/services/commands";
import {scenarioForm as action409} from "@/modules/finance/services/commands";
import {uploadFinanceAttachment as action410} from "@/modules/finance/services/commands";
import {generateSalesInvoice as action411} from "@/modules/finance/services/commands";
import {generateInvoiceAdjustment as action412} from "@/modules/finance/services/commands";
import {voidFinanceDraft as action413} from "@/modules/finance/services/commands";
import {getFinanceHome as action414} from "@/modules/finance/services/queries";
import {listFinanceDocuments as action415} from "@/modules/finance/services/queries";
import {getFinanceDocument as action416} from "@/modules/finance/services/queries";
import {getFinanceWorkspace as action417} from "@/modules/finance/services/queries";
import {financeChoices as action418} from "@/modules/finance/services/queries";
import {getBudgetPositions as action419} from "@/modules/finance/services/queries";
import {getInvoiceCashForecast as action420} from "@/modules/finance/services/queries";
import {getFinancialReport as action421} from "@/modules/finance/services/queries";
import {getFinanceCustomerContribution as action422} from "@/modules/finance/services/queries";
import {searchFinance as action423} from "@/modules/finance/services/queries";
import {getFinanceAttachment as action424} from "@/modules/finance/services/queries";
import {getSalesFinanceProjection as action425} from "@/modules/finance/services/queries";
import {getReceivingWarehouses as action426} from "@/modules/finance/services/queries";
import {createCampaign as action427} from "@/modules/marketing/services/commands";
import {updateCampaign as action428} from "@/modules/marketing/services/commands";
import {createProfile as action429} from "@/modules/marketing/services/commands";
import {recordPermission as action430} from "@/modules/marketing/services/commands";
import {suppressProfile as action431} from "@/modules/marketing/services/commands";
import {createAudience as action432} from "@/modules/marketing/services/commands";
import {previewAudience as action433} from "@/modules/marketing/services/commands";
import {createContent as action434} from "@/modules/marketing/services/commands";
import {approveContent as action435} from "@/modules/marketing/services/commands";
import {createMessage as action436} from "@/modules/marketing/services/commands";
import {lockSend as action437} from "@/modules/marketing/services/commands";
import {cancelSend as action438} from "@/modules/marketing/services/commands";
import {ingestEvent as action439} from "@/modules/marketing/services/commands";
import {createJourney as action440} from "@/modules/marketing/services/commands";
import {publishJourney as action441} from "@/modules/marketing/services/commands";
import {reviseJourney as action442} from "@/modules/marketing/services/commands";
import {createProgram as action443} from "@/modules/marketing/services/commands";
import {createExperiment as action444} from "@/modules/marketing/services/commands";
import {leadFeedback as action445} from "@/modules/marketing/services/commands";
import {processJourneySteps as action446} from "@/modules/marketing/services/commands";
import {saveMarketingPlan as action447} from "@/modules/marketing/services/commands";
import {addPlanActivity as action448} from "@/modules/marketing/services/commands";
import {updatePlanActivity as action449} from "@/modules/marketing/services/commands";
import {addBudgetLine as action450} from "@/modules/marketing/services/commands";
import {submitBudgetToFinance as action451} from "@/modules/marketing/services/commands";
import {createJourneyMap as action452} from "@/modules/marketing/services/commands";
import {addJourneyStage as action453} from "@/modules/marketing/services/commands";
import {addJourneyTouch as action454} from "@/modules/marketing/services/commands";
import {getApprovedExpenseSource as action455} from "@/modules/people/services/finance-expenses";
import {createPlan as action456} from "@/modules/plan/services/commands";
import {saveCell as action457} from "@/modules/plan/services/commands";
import {addMeasure as action458} from "@/modules/plan/services/commands";
import {addAssumption as action459} from "@/modules/plan/services/commands";
import {addDriver as action460} from "@/modules/plan/services/commands";
import {addLink as action461} from "@/modules/plan/services/commands";
import {createScenario as action462} from "@/modules/plan/services/commands";
import {promoteScenario as action463} from "@/modules/plan/services/commands";
import {submitPlan as action464} from "@/modules/plan/services/commands";
import {approvePlan as action465} from "@/modules/plan/services/commands";
import {lockPlan as action466} from "@/modules/plan/services/commands";
import {addGoal as action467} from "@/modules/plan/services/commands";
import {addInitiative as action468} from "@/modules/plan/services/commands";
import {createProjectForInitiative as action469} from "@/modules/plan/services/commands";
import {addAction as action470} from "@/modules/plan/services/commands";
import {completeAction as action471} from "@/modules/plan/services/commands";
import {addRisk as action472} from "@/modules/plan/services/commands";
import {addDependency as action473} from "@/modules/plan/services/commands";
import {addDecision as action474} from "@/modules/plan/services/commands";
import {addComment as action475} from "@/modules/plan/services/commands";
import {addUpdate as action476} from "@/modules/plan/services/commands";
import {completeReview as action477} from "@/modules/plan/services/commands";
import {addReview as action478} from "@/modules/plan/services/commands";
import {distributeTargets as action479} from "@/modules/plan/services/commands";
import {importGrid as action480} from "@/modules/plan/services/commands";
import {sharePlan as action481} from "@/modules/plan/services/commands";
import {unsharePlan as action482} from "@/modules/plan/services/commands";
import {setPlanAudience as action483} from "@/modules/plan/services/commands";
import {addNote as action484} from "@/modules/plan/services/commands";
import {saveGoalProgress as action485} from "@/modules/plan/services/commands";
import {savePlanBrief as action486} from "@/modules/plan/services/commands";
import {listProductionPlans as action487} from "@/modules/planning/services/plans";
import {getPlanOptions as action488} from "@/modules/planning/services/plans";
import {getProductionPlan as action489} from "@/modules/planning/services/plans";
import {createProductionPlan as action490} from "@/modules/planning/services/plans";
import {addProductionPlanLine as action491} from "@/modules/planning/services/plans";
import {getAssignedPlanningWork as action492} from "@/modules/planning/services/plans";
import {getPlanningCoverage as action493} from "@/modules/planning/services/queries";
import {saveProductRecipe as action494} from "@/modules/products/services/make";
import {createSpecification as action495} from "@/modules/quality/services/commands";
import {setSpecificationStatus as action496} from "@/modules/quality/services/commands";
import {createControlPoint as action497} from "@/modules/quality/services/commands";
import {executeInspection as action498} from "@/modules/quality/services/commands";
import {releaseHold as action499} from "@/modules/quality/services/commands";
import {reportNcr as action500} from "@/modules/quality/services/commands";
import {updateNcrInvestigation as action501} from "@/modules/quality/services/commands";
import {addNcrAction as action502} from "@/modules/quality/services/commands";
import {updateNcrAction as action503} from "@/modules/quality/services/commands";
import {closeNcr as action504} from "@/modules/quality/services/commands";
import {saveSubstance as action505} from "@/modules/safety/services/assurance";
import {addSafetyDataSheet as action506} from "@/modules/safety/services/assurance";
import {saveCoshhAssessment as action507} from "@/modules/safety/services/assurance";
import {approveSubstance as action508} from "@/modules/safety/services/assurance";
import {saveCompetence as action509} from "@/modules/safety/services/assurance";
import {saveSafetyDocument as action510} from "@/modules/safety/services/assurance";
import {acknowledgeDocument as action511} from "@/modules/safety/services/assurance";
import {saveAudit as action512} from "@/modules/safety/services/assurance";
import {addAuditFinding as action513} from "@/modules/safety/services/assurance";
import {approveAudit as action514} from "@/modules/safety/services/assurance";
import {saveChange as action515} from "@/modules/safety/services/assurance";
import {advanceChange as action516} from "@/modules/safety/services/assurance";
import {linkSafetyRecord as action517} from "@/modules/safety/services/assurance";
import {saveSafetyProfile as action518} from "@/modules/safety/services/commands";
import {saveRiskMatrix as action519} from "@/modules/safety/services/commands";
import {createRisk as action520} from "@/modules/safety/services/commands";
import {addControl as action521} from "@/modules/safety/services/commands";
import {rateAssessment as action522} from "@/modules/safety/services/commands";
import {approveAssessment as action523} from "@/modules/safety/services/commands";
import {reviseAssessment as action524} from "@/modules/safety/services/commands";
import {requestRiskReview as action525} from "@/modules/safety/services/commands";
import {reportIncident as action526} from "@/modules/safety/services/commands";
import {saveImmediateControl as action527} from "@/modules/safety/services/commands";
import {openInvestigation as action528} from "@/modules/safety/services/commands";
import {addCause as action529} from "@/modules/safety/services/commands";
import {saveRootCause as action530} from "@/modules/safety/services/commands";
import {reviewRiddor as action531} from "@/modules/safety/services/commands";
import {createSafetyAction as action532} from "@/modules/safety/services/commands";
import {advanceAction as action533} from "@/modules/safety/services/commands";
import {verifyAction as action534} from "@/modules/safety/services/commands";
import {saveWorkplaceRecord as action535} from "@/modules/safety/services/commands";
import {createPermit as action536} from "@/modules/safety/services/control";
import {advancePermit as action537} from "@/modules/safety/services/control";
import {extendPermit as action538} from "@/modules/safety/services/control";
import {createIsolation as action539} from "@/modules/safety/services/control";
import {applyIsolationLock as action540} from "@/modules/safety/services/control";
import {verifyIsolation as action541} from "@/modules/safety/services/control";
import {clearIsolation as action542} from "@/modules/safety/services/control";
import {removeIsolationLock as action543} from "@/modules/safety/services/control";
import {placeSafetyHold as action544} from "@/modules/safety/services/control";
import {updateReturnToService as action545} from "@/modules/safety/services/control";
import {releaseSafetyHold as action546} from "@/modules/safety/services/control";
import {overrideSafetyHold as action547} from "@/modules/safety/services/control";
import {saveStatutoryCheck as action548} from "@/modules/safety/services/control";
import {completeInspection as action549} from "@/modules/safety/services/control";
import {createInspection as action550} from "@/modules/safety/services/control";
import {createSalesAddress as action551} from "@/modules/sales/services/address-actions";
import {createSalesCatalogueProduct as action552} from "@/modules/sales/services/catalogue-actions";
import {sendQuote as action553} from "@/modules/sales/services/commands";
import {changeQuoteStatus as action554} from "@/modules/sales/services/commands";
import {deleteQuote as action555} from "@/modules/sales/services/commands";
import {duplicateDocument as action556} from "@/modules/sales/services/commands";
import {saveQuoteTemplate as action557} from "@/modules/sales/services/commands";
import {createOrderFromQuote as action558} from "@/modules/sales/services/commands";
import {linkCommercialProject as action559} from "@/modules/sales/services/commercial";
import {openCallOffOrder as action560} from "@/modules/sales/services/commercial";
import {raiseCallOff as action561} from "@/modules/sales/services/commercial";
import {invoiceCallOffDelivery as action562} from "@/modules/sales/services/commercial";
import {deliverAndInvoiceCallOff as action563} from "@/modules/sales/services/commercial";
import {saveDocument as action564} from "@/modules/sales/services/documents";
import {saveInvoiceTemplate as action565} from "@/modules/sales/services/invoice-template-actions";
import {retireInvoiceTemplate as action566} from "@/modules/sales/services/invoice-template-actions";
import {attachCustomerInvoiceTemplate as action567} from "@/modules/sales/services/invoice-template-actions";
import {detachCustomerInvoiceTemplate as action568} from "@/modules/sales/services/invoice-template-actions";
import {createDraftOrder as action569} from "@/modules/sales/services/orders";
import {addOrderLine as action570} from "@/modules/sales/services/orders";
import {removeOrderLine as action571} from "@/modules/sales/services/orders";
import {updateDraftOrderFields as action572} from "@/modules/sales/services/orders";
import {confirmOrder as action573} from "@/modules/sales/services/orders";
import {decideApproval as action574} from "@/modules/sales/services/orders";
import {amendLineQuantity as action575} from "@/modules/sales/services/orders";
import {overrideLinePrice as action576} from "@/modules/sales/services/orders";
import {amendRequestedDate as action577} from "@/modules/sales/services/orders";
import {cancelOrder as action578} from "@/modules/sales/services/orders";
import {deleteOrder as action579} from "@/modules/sales/services/orders";
import {cancelLineRemaining as action580} from "@/modules/sales/services/orders";
import {addHold as action581} from "@/modules/sales/services/orders";
import {releaseHold as action582} from "@/modules/sales/services/orders";
import {restoreCancelledOrder as action583} from "@/modules/sales/services/rewind";
import {returnOrderToQuote as action584} from "@/modules/sales/services/rewind";
import {saveOrderHashtags as action585} from "@/modules/sales/services/rewind";
import {saveSalesView as action586} from "@/modules/sales/services/saved-views";
import {archiveSalesView as action587} from "@/modules/sales/services/saved-views";
import {createCase as action588} from "@/modules/service/services/commands";
import {updateCase as action589} from "@/modules/service/services/commands";
import {assignCase as action590} from "@/modules/service/services/commands";
import {transitionCase as action591} from "@/modules/service/services/commands";
import {addCaseEntry as action592} from "@/modules/service/services/commands";
import {createDepartmentTicket as action593} from "@/modules/service/services/commands";
import {updateDepartmentTicket as action594} from "@/modules/service/services/commands";
import {createQueue as action595} from "@/modules/service/services/commands";
import {addQueueMember as action596} from "@/modules/service/services/commands";
import {linkCaseRecord as action597} from "@/modules/service/services/commands";
import {creditChoices as action598} from "@/modules/service/services/commands";
import {askFinanceForCredit as action599} from "@/modules/service/services/commands";
import {getCaseOwners as action600} from "@/modules/service/services/commands";
import {getDepartmentWork as action601} from "@/modules/service/services/commands";
import {readAvailability as action602} from "@/modules/stock/services/availability";
import {readOrderChain as action603} from "@/modules/stock/services/availability";
import {inventoryExportRows as action604} from "@/modules/stock/services/export";
import {createTeam as action605} from "@/modules/teams/services/commands";
import {renameTeam as action606} from "@/modules/teams/services/commands";
import {addMember as action607} from "@/modules/teams/services/commands";
import {removeMember as action608} from "@/modules/teams/services/commands";
import {saveTask as action609} from "@/modules/teams/services/commands";
import {setTaskStatus as action610} from "@/modules/teams/services/commands";
import {removeTask as action611} from "@/modules/teams/services/commands";
import {saveCover as action612} from "@/modules/teams/services/commands";
import {removeCover as action613} from "@/modules/teams/services/commands";
import {saveHandover as action614} from "@/modules/teams/services/commands";
import {savePlace as action615} from "@/modules/teams/services/commands";
import {saveMoment as action616} from "@/modules/teams/services/commands";
import {removeMoment as action617} from "@/modules/teams/services/commands";
export const DATA_ACTIONS:Record<string,(...args:never[])=>Promise<unknown>>={
"src/app/(app)/analytics/actions:loadLiveMetrics":action0 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:loadMetricSlice":action1 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:saveAnalyticsDashboard":action2 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:deleteAnalyticsDashboard":action3 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/apps/actions:toggleModuleAction":action4 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/actions:updateCompanyAccount":action5 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/actions:saveCompanyEntitlements":action6 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/actions:createCompanyAccount":action7 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/setup-actions:importCompanySetup":action8 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/setup-actions:createCompanyUser":action9 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/setup-actions:setCompanyUserStatus":action10 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:postMessage":action11 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:searchChatPeople":action12 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:openChat":action13 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:openDirectChat":action14 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:searchChatRecords":action15 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:sendChat":action16 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:chatSnapshot":action17 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:updateValueFormAction":action18 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:updateCloseDateFormAction":action19 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:setNextActionFormAction":action20 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:setForecastCategoryFormAction":action21 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:winFormAction":action22 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:loseFormAction":action23 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:addStakeholderFormAction":action24 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:addMilestoneFormAction":action25 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:toggleMilestoneFormAction":action26 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:logOpportunityActivityFormAction":action27 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/projects/new/actions:createSalesProjectAction":action28 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:qualifyFormAction":action29 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:disqualifyFormAction":action30 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:nurtureFormAction":action31 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:logProspectActivityFormAction":action32 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:assignProspectFormAction":action33 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:assignProspectTaskFormAction":action34 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:convertProspectFormAction":action35 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/reports/actions:pinReportToDashboard":action36 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createContactFormAction":action37 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateContactFormAction":action38 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:deleteContactFormAction":action39 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createAddressFormAction":action40 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createTaxRegistrationFormAction":action41 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:markTaxVerifiedFormAction":action42 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createBankAccountFormAction":action43 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createDirectDebitFormAction":action44 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:cancelDirectDebitFormAction":action45 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateCreditLimitFormAction":action46 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:toggleCreditHoldFormAction":action47 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createNoteFormAction":action48 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateStatusFormAction":action49 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:deleteCustomerFormAction":action50 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:createKpi":action51 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:saveGoal":action52 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:updateKpi":action53 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:recordProgress":action54 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:closeGoal":action55 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:addPlanGoal":action56 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:closePlan":action57 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:commentOnPlan":action58 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:syncDemandAction":action59 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:restoreDeliveryAction":action60 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:releaseAction":action61 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:allocateAction":action62 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:directShipAction":action63 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:groupAction":action64 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:scanAction":action65 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:lotAction":action66 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:serialAction":action67 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shortAction":action68 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeWorkAction":action69 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:claimAction":action70 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shipFromPickAction":action71 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packageAction":action72 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:weightAction":action73 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:stageAction":action74 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:labelAction":action75 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:dispatchAction":action76 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:trackingAction":action77 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:deliverAction":action78 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadCreateAction":action79 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadScanAction":action80 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:departAction":action81 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:expectAction":action82 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveLineAction":action83 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:putAwayAction":action84 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeReceiptAction":action85 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferAction":action86 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferReceiveAction":action87 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:returnRequestAction":action88 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:authoriseReturnAction":action89 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveReturnAction":action90 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:inspectAction":action91 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:closeReturnAction":action92 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:assignEquipmentAction":action93 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packUnitAction":action94 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:saveHandlingTypeAction":action95 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:retireHandlingTypeAction":action96 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:removeHandlingTypeAction":action97 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:policyAction":action98 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:loadNotices":action99 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotice":action100 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotices":action101 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:createPayrollRun":action102 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:updatePayslipDeductions":action103 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:finalisePayrollRun":action104 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:markPayrollRunPaid":action105 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:savePayrollSettings":action106 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP45":action107 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP60":action108 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:logAbsence":action109 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:requestLeave":action110 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:cancelOwnLeave":action111 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:approveLeaveRequest":action112 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:setLeaveAllowance":action113 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:rejectLeaveRequest":action114 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:createEmployee":action115 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:changeEmployeeStatus":action116 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeProfile":action117 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateOwnEmployeeDetails":action118 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeDocument":action119 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:linkEmployeeToUser":action120 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:completeEmployeeTask":action121 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeTask":action122 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeContact":action123 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeTask":action124 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:scheduleAppraisal":action125 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:completeAppraisal":action126 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getConductDesk":action127 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getMyConduct":action128 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getPlan":action129 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getCase":action130 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:conductChoices":action131 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:savePlan":action132 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addPlanReview":action133 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:commentOnPlan":action134 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:saveCase":action135 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:respondToCase":action136 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addCaseEvent":action137 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:submitExpenseClaim":action138 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:approveExpenseClaim":action139 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:rejectExpenseClaim":action140 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:scheduleOneToOne":action141 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:completeOneToOne":action142 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:listPolicies":action143 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:publishPolicy":action144 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:archivePolicy":action145 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:openPolicy":action146 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:createShift":action147 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:changeShiftStatus":action148 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyHR":action149 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyTeam":action150 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getTeamEmployee":action151 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:addPrivateNote":action152 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:updateWorkingPattern":action153 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:updateHrSettings":action154 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createAppraisalTemplate":action155 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleAppraisalTemplateActive":action156 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createOneToOneTemplate":action157 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleOneToOneTemplateActive":action158 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:getTimesheetContext":action159 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:saveTimesheet":action160 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:reviewTimesheet":action161 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:createPriceList":action162 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:savePriceEntry":action163 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveRule":action164 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:setRuleActive":action165 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:updatePriceBasis":action166 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:assignPriceList":action167 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewPriceCsv":action168 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyPriceCsv":action169 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreement":action170 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreementPrice":action171 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:removeAgreementPrice":action172 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewAgreementCsv":action173 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyAgreementCsv":action174 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProduct":action175 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProductRecord":action176 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveCategory":action177 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:retireCategory":action178 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:addStandardCategories":action179 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:savePack":action180 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveLinks":action181 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveMeasures":action182 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/actions:saveProfile":action183 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/work:loadAssignedWork":action184 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProject":action185 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeProjectStatus":action186 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editProject":action187 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProjectMember":action188 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:archiveProject":action189 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTask":action190 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeTaskStatus":action191 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editTask":action192 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:checklistItem":action193 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addDependency":action194 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMeeting":action195 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDocument":action196 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editDocument":action197 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addComment":action198 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMilestone":action199 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:publishUpdate":action200 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDecision":action201 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:decide":action202 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createRisk":action203 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:closeRisk":action204 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:requestApproval":action205 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:respondApproval":action206 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:submitRequest":action207 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:triageRequest":action208 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:logTime":action209 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:planToday":action210 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:updateInbox":action211 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveView":action212 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createPortfolio":action213 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createBaseline":action214 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setBudget":action215 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:linkWork":action216 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectActivity":action217 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createAutomation":action218 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:toggleAutomation":action219 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveProjectTemplate":action220 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:useProjectTemplate":action221 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:startTimer":action222 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:stopTimer":action223 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:projectPreference":action224 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:uploadProjectFile":action225 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:readProjectFile":action226 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProperty":action227 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProperty":action228 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:restoreDocument":action229 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTaskFromDocument":action230 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:discardTimer":action231 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:completeMilestone":action232 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:resolveComment":action233 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectWorkload":action234 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:createOrderForm":action235 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addLineForm":action236 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:removeLineForm":action237 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:confirmOrderForm":action238 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:updateOrderForm":action239 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:chooseOrderAddresses":action240 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addHoldForm":action241 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:releaseHoldForm":action242 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:approveOrderForm":action243 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:cancelOrderForm":action244 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:saveOrderHashtagsForm":action245 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:restoreCancelledOrderForm":action246 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:returnOrderToQuoteForm":action247 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:scheduleOrderDelivery":action248 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:rejectOrderApproval":action249 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:deleteOrderForm":action250 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:createQuote":action251 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:deleteQuoteForm":action252 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/settings/actions:saveCreationPolicy":action253 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getSchedule":action254 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:createBulkShifts":action255 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:setScheduledShift":action256 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:completeShiftTask":action257 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:editScheduledShift":action258 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishWeekShifts":action259 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveHoursBudget":action260 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getTeamPlan":action261 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getPersonSchedule":action262 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveWorkType":action263 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:archiveWorkType":action264 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveDemand":action265 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveBusyRule":action266 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:removeBusyRule":action267 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:fillTeamMonth":action268 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:replanCover":action269 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishMonth":action270 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveShift":action271 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveRole":action272 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveMemberRoles":action273 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:createUser":action274 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyAccess":action275 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyProfile":action276 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveManagerPolicy":action277 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveWorkspaceDetails":action278 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyBrand":action279 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/imports/actions:importCsv":action280 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/logistics/actions:saveDispatchDelivery":action281 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveUserAccess":action282 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:setUserStatus":action283 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:revokeUserSessions":action284 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:issuePasswordRecovery":action285 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createManagedUser":action286 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:linkEmployeeProfile":action287 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createRole":action288 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveManagementGroup":action289 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createWarehouse":action290 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:adjustStock":action291 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:transferStock":action292 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createSiteAction":action293 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createPlaceAction":action294 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:assignSiteAction":action295 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:addLocationAction":action296 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:ensureLocationsAction":action297 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:retireLocationAction":action298 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:putOnLocationAction":action299 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:moveLocatedAction":action300 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:receiveMoveAction":action301 as (...args:never[])=>Promise<unknown>,
"src/core/approvals/actions:delegateApprovals":action302 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:loginAction":action303 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:logoutAction":action304 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:completePasswordRecovery":action305 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:changeOwnPassword":action306 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:signOutOtherSessions":action307 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:checkForDuplicatesAction":action308 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:createCustomerAction":action309 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createCustomer":action310 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerStatus":action311 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteCustomer":action312 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createContact":action313 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateContact":action314 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteContact":action315 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createAddress":action316 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCommercialSettings":action317 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCreditLimit":action318 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setCreditHold":action319 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setPaymentTerm":action320 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createTaxRegistration":action321 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:markTaxRegistrationManuallyVerified":action322 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createBankAccount":action323 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:revealBankAccount":action324 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createDirectDebitMandate":action325 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:cancelDirectDebitMandate":action326 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createNote":action327 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:saveCustomerHashtags":action328 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commercial-actions:saveOrderingPreferences":action329 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setCustomerParent":action330 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:placeCustomer":action331 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:moveCustomer":action332 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setContactReportsTo":action333 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:saveCustomerTradingLink":action334 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:setInvoiceAccount":action335 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:archiveCustomerTradingLink":action336 as (...args:never[])=>Promise<unknown>,
"src/core/finance/actions:requestSalesInvoice":action337 as (...args:never[])=>Promise<unknown>,
"src/core/teams/actions:createWorkTeam":action338 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditBoard":action339 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:exportAuditReport":action340 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEcho":action341 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:postEchoNote":action342 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEchoInbox":action343 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditAccess":action344 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditOwnActivity":action345 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditAreas":action346 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:logActivity":action347 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:completeActivity":action348 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/marketing-handoff:acceptMarketingHandoff":action349 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:createOpportunity":action350 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:moveOpportunityStage":action351 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityValue":action352 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityCloseDate":action353 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityForecastCategory":action354 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityNextAction":action355 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:winOpportunity":action356 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:loseOpportunity":action357 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addStakeholder":action358 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addMilestone":action359 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:toggleMilestone":action360 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:checkProspectDuplicatesAction":action361 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createProspect":action362 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:assignProspect":action363 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:setProspectLifecycleStage":action364 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:convertProspect":action365 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createIndustry":action366 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:saveProspectGrouping":action367 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProject":action368 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:updateSalesProject":action369 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addOrganisationToProject":action370 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addStakeholderToProject":action371 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:linkQuoteToProject":action372 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:linkOrderToProject":action373 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:deleteSalesProject":action374 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setupFinance":action375 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceDocument":action376 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:submitFinanceDocument":action377 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveApprovalPolicy":action378 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:decideFinanceApproval":action379 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPurchaseOrder":action380 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:raiseServiceCredit":action381 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postFinanceDocument":action382 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:recordGoodsReceipt":action383 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:onboardSupplier":action384 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveSupplier":action385 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:requestSupplierBankChange":action386 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:verifySupplierBank":action387 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceBank":action388 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:importBankTransactions":action389 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocateBankTransaction":action390 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPaymentRun":action391 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approvePaymentRun":action392 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createManualJournal":action393 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveManualJournal":action394 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:reverseJournal":action395 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setFinancePeriodState":action396 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceBudget":action397 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceAsset":action398 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postAssetDepreciation":action399 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:completeCloseTask":action400 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceContract":action401 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceScenario":action402 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:receiptForm":action403 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:journalForm":action404 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:statementForm":action405 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocationForm":action406 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:paymentRunForm":action407 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:policyForm":action408 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:scenarioForm":action409 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:uploadFinanceAttachment":action410 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateSalesInvoice":action411 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateInvoiceAdjustment":action412 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:voidFinanceDraft":action413 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceHome":action414 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:listFinanceDocuments":action415 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceDocument":action416 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceWorkspace":action417 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:financeChoices":action418 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getBudgetPositions":action419 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getInvoiceCashForecast":action420 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinancialReport":action421 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceCustomerContribution":action422 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:searchFinance":action423 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceAttachment":action424 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getSalesFinanceProjection":action425 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getReceivingWarehouses":action426 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createCampaign":action427 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updateCampaign":action428 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProfile":action429 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:recordPermission":action430 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:suppressProfile":action431 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createAudience":action432 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:previewAudience":action433 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createContent":action434 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:approveContent":action435 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createMessage":action436 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:lockSend":action437 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:cancelSend":action438 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:ingestEvent":action439 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourney":action440 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:publishJourney":action441 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:reviseJourney":action442 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProgram":action443 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createExperiment":action444 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:leadFeedback":action445 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:processJourneySteps":action446 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:saveMarketingPlan":action447 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addPlanActivity":action448 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updatePlanActivity":action449 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addBudgetLine":action450 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:submitBudgetToFinance":action451 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourneyMap":action452 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyStage":action453 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyTouch":action454 as (...args:never[])=>Promise<unknown>,
"src/modules/people/services/finance-expenses:getApprovedExpenseSource":action455 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createPlan":action456 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveCell":action457 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addMeasure":action458 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAssumption":action459 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDriver":action460 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addLink":action461 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createScenario":action462 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:promoteScenario":action463 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:submitPlan":action464 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:approvePlan":action465 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:lockPlan":action466 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addGoal":action467 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addInitiative":action468 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createProjectForInitiative":action469 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAction":action470 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeAction":action471 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addRisk":action472 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDependency":action473 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDecision":action474 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addComment":action475 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addUpdate":action476 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeReview":action477 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addReview":action478 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:distributeTargets":action479 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:importGrid":action480 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:sharePlan":action481 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:unsharePlan":action482 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:setPlanAudience":action483 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addNote":action484 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveGoalProgress":action485 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:savePlanBrief":action486 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:listProductionPlans":action487 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getPlanOptions":action488 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getProductionPlan":action489 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:createProductionPlan":action490 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:addProductionPlanLine":action491 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getAssignedPlanningWork":action492 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/queries:getPlanningCoverage":action493 as (...args:never[])=>Promise<unknown>,
"src/modules/products/services/make:saveProductRecipe":action494 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createSpecification":action495 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:setSpecificationStatus":action496 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createControlPoint":action497 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:executeInspection":action498 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:releaseHold":action499 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:reportNcr":action500 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrInvestigation":action501 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:addNcrAction":action502 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrAction":action503 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:closeNcr":action504 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSubstance":action505 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addSafetyDataSheet":action506 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCoshhAssessment":action507 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveSubstance":action508 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCompetence":action509 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSafetyDocument":action510 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:acknowledgeDocument":action511 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveAudit":action512 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addAuditFinding":action513 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveAudit":action514 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveChange":action515 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:advanceChange":action516 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:linkSafetyRecord":action517 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveSafetyProfile":action518 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRiskMatrix":action519 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createRisk":action520 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addControl":action521 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:rateAssessment":action522 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:approveAssessment":action523 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviseAssessment":action524 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:requestRiskReview":action525 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reportIncident":action526 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveImmediateControl":action527 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:openInvestigation":action528 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addCause":action529 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRootCause":action530 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviewRiddor":action531 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createSafetyAction":action532 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:advanceAction":action533 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:verifyAction":action534 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveWorkplaceRecord":action535 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createPermit":action536 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:advancePermit":action537 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:extendPermit":action538 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createIsolation":action539 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:applyIsolationLock":action540 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:verifyIsolation":action541 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:clearIsolation":action542 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:removeIsolationLock":action543 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:placeSafetyHold":action544 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:updateReturnToService":action545 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:releaseSafetyHold":action546 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:overrideSafetyHold":action547 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:saveStatutoryCheck":action548 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:completeInspection":action549 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createInspection":action550 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/address-actions:createSalesAddress":action551 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/catalogue-actions:createSalesCatalogueProduct":action552 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:sendQuote":action553 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:changeQuoteStatus":action554 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:deleteQuote":action555 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:duplicateDocument":action556 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:saveQuoteTemplate":action557 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:createOrderFromQuote":action558 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:linkCommercialProject":action559 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:openCallOffOrder":action560 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:raiseCallOff":action561 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:invoiceCallOffDelivery":action562 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:deliverAndInvoiceCallOff":action563 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/documents:saveDocument":action564 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:saveInvoiceTemplate":action565 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:retireInvoiceTemplate":action566 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:attachCustomerInvoiceTemplate":action567 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:detachCustomerInvoiceTemplate":action568 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:createDraftOrder":action569 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addOrderLine":action570 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:removeOrderLine":action571 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:updateDraftOrderFields":action572 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:confirmOrder":action573 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:decideApproval":action574 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendLineQuantity":action575 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:overrideLinePrice":action576 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendRequestedDate":action577 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelOrder":action578 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:deleteOrder":action579 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelLineRemaining":action580 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addHold":action581 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:releaseHold":action582 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:restoreCancelledOrder":action583 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:returnOrderToQuote":action584 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:saveOrderHashtags":action585 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:saveSalesView":action586 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:archiveSalesView":action587 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createCase":action588 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateCase":action589 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:assignCase":action590 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:transitionCase":action591 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addCaseEntry":action592 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createDepartmentTicket":action593 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateDepartmentTicket":action594 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createQueue":action595 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addQueueMember":action596 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:linkCaseRecord":action597 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:creditChoices":action598 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:askFinanceForCredit":action599 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getCaseOwners":action600 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getDepartmentWork":action601 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readAvailability":action602 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readOrderChain":action603 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/export:inventoryExportRows":action604 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:createTeam":action605 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:renameTeam":action606 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:addMember":action607 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMember":action608 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveTask":action609 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:setTaskStatus":action610 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeTask":action611 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveCover":action612 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeCover":action613 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveHandover":action614 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:savePlace":action615 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveMoment":action616 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMoment":action617 as (...args:never[])=>Promise<unknown>
};
