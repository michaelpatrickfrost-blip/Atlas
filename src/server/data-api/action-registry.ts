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
import {qualifyFormAction as action28} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {disqualifyFormAction as action29} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {nurtureFormAction as action30} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {logProspectActivityFormAction as action31} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {assignProspectFormAction as action32} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {assignProspectTaskFormAction as action33} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {convertProspectFormAction as action34} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {pinReportToDashboard as action35} from "@/app/(app)/crm/reports/actions";
import {createContactFormAction as action36} from "@/app/(app)/customers/[partyId]/actions";
import {updateContactFormAction as action37} from "@/app/(app)/customers/[partyId]/actions";
import {deleteContactFormAction as action38} from "@/app/(app)/customers/[partyId]/actions";
import {createAddressFormAction as action39} from "@/app/(app)/customers/[partyId]/actions";
import {createTaxRegistrationFormAction as action40} from "@/app/(app)/customers/[partyId]/actions";
import {markTaxVerifiedFormAction as action41} from "@/app/(app)/customers/[partyId]/actions";
import {createBankAccountFormAction as action42} from "@/app/(app)/customers/[partyId]/actions";
import {createDirectDebitFormAction as action43} from "@/app/(app)/customers/[partyId]/actions";
import {cancelDirectDebitFormAction as action44} from "@/app/(app)/customers/[partyId]/actions";
import {updateCreditLimitFormAction as action45} from "@/app/(app)/customers/[partyId]/actions";
import {toggleCreditHoldFormAction as action46} from "@/app/(app)/customers/[partyId]/actions";
import {createNoteFormAction as action47} from "@/app/(app)/customers/[partyId]/actions";
import {updateStatusFormAction as action48} from "@/app/(app)/customers/[partyId]/actions";
import {createKpi as action49} from "@/app/(app)/kpis/actions";
import {saveGoal as action50} from "@/app/(app)/kpis/actions";
import {updateKpi as action51} from "@/app/(app)/kpis/actions";
import {recordProgress as action52} from "@/app/(app)/kpis/actions";
import {closeGoal as action53} from "@/app/(app)/kpis/actions";
import {addPlanGoal as action54} from "@/app/(app)/kpis/actions";
import {closePlan as action55} from "@/app/(app)/kpis/actions";
import {commentOnPlan as action56} from "@/app/(app)/kpis/actions";
import {syncDemandAction as action57} from "@/app/(app)/logistics/actions";
import {restoreDeliveryAction as action58} from "@/app/(app)/logistics/actions";
import {releaseAction as action59} from "@/app/(app)/logistics/actions";
import {allocateAction as action60} from "@/app/(app)/logistics/actions";
import {directShipAction as action61} from "@/app/(app)/logistics/actions";
import {groupAction as action62} from "@/app/(app)/logistics/actions";
import {scanAction as action63} from "@/app/(app)/logistics/actions";
import {lotAction as action64} from "@/app/(app)/logistics/actions";
import {serialAction as action65} from "@/app/(app)/logistics/actions";
import {shortAction as action66} from "@/app/(app)/logistics/actions";
import {completeWorkAction as action67} from "@/app/(app)/logistics/actions";
import {claimAction as action68} from "@/app/(app)/logistics/actions";
import {shipFromPickAction as action69} from "@/app/(app)/logistics/actions";
import {packageAction as action70} from "@/app/(app)/logistics/actions";
import {weightAction as action71} from "@/app/(app)/logistics/actions";
import {stageAction as action72} from "@/app/(app)/logistics/actions";
import {labelAction as action73} from "@/app/(app)/logistics/actions";
import {dispatchAction as action74} from "@/app/(app)/logistics/actions";
import {trackingAction as action75} from "@/app/(app)/logistics/actions";
import {deliverAction as action76} from "@/app/(app)/logistics/actions";
import {loadCreateAction as action77} from "@/app/(app)/logistics/actions";
import {loadScanAction as action78} from "@/app/(app)/logistics/actions";
import {departAction as action79} from "@/app/(app)/logistics/actions";
import {expectAction as action80} from "@/app/(app)/logistics/actions";
import {receiveLineAction as action81} from "@/app/(app)/logistics/actions";
import {putAwayAction as action82} from "@/app/(app)/logistics/actions";
import {completeReceiptAction as action83} from "@/app/(app)/logistics/actions";
import {transferAction as action84} from "@/app/(app)/logistics/actions";
import {transferReceiveAction as action85} from "@/app/(app)/logistics/actions";
import {returnRequestAction as action86} from "@/app/(app)/logistics/actions";
import {authoriseReturnAction as action87} from "@/app/(app)/logistics/actions";
import {receiveReturnAction as action88} from "@/app/(app)/logistics/actions";
import {inspectAction as action89} from "@/app/(app)/logistics/actions";
import {closeReturnAction as action90} from "@/app/(app)/logistics/actions";
import {assignEquipmentAction as action91} from "@/app/(app)/logistics/actions";
import {packUnitAction as action92} from "@/app/(app)/logistics/actions";
import {saveHandlingTypeAction as action93} from "@/app/(app)/logistics/actions";
import {retireHandlingTypeAction as action94} from "@/app/(app)/logistics/actions";
import {removeHandlingTypeAction as action95} from "@/app/(app)/logistics/actions";
import {policyAction as action96} from "@/app/(app)/logistics/actions";
import {runMrpAction as action97} from "@/app/(app)/manufacturing/plan/actions";
import {firmSuggestionAction as action98} from "@/app/(app)/manufacturing/plan/actions";
import {dismissSuggestionAction as action99} from "@/app/(app)/manufacturing/plan/actions";
import {setForecastAction as action100} from "@/app/(app)/manufacturing/plan/actions";
import {deleteForecastAction as action101} from "@/app/(app)/manufacturing/plan/actions";
import {previewMoveAction as action102} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {commitMoveAction as action103} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {toggleLockAction as action104} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {saveShiftAction as action105} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {deleteShiftAction as action106} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {startAction as action107} from "@/app/(app)/manufacturing/shop-floor/actions";
import {pauseAction as action108} from "@/app/(app)/manufacturing/shop-floor/actions";
import {completeAction as action109} from "@/app/(app)/manufacturing/shop-floor/actions";
import {loadNotices as action110} from "@/app/(app)/notices/actions";
import {clearNotice as action111} from "@/app/(app)/notices/actions";
import {clearNotices as action112} from "@/app/(app)/notices/actions";
import {createPayrollRun as action113} from "@/app/(app)/payroll/actions";
import {updatePayslipDeductions as action114} from "@/app/(app)/payroll/actions";
import {finalisePayrollRun as action115} from "@/app/(app)/payroll/actions";
import {markPayrollRunPaid as action116} from "@/app/(app)/payroll/actions";
import {savePayrollSettings as action117} from "@/app/(app)/payroll/actions";
import {issueP45 as action118} from "@/app/(app)/payroll/actions";
import {issueP60 as action119} from "@/app/(app)/payroll/actions";
import {logAbsence as action120} from "@/app/(app)/people/absence/actions";
import {requestLeave as action121} from "@/app/(app)/people/absence/actions";
import {cancelOwnLeave as action122} from "@/app/(app)/people/absence/actions";
import {approveLeaveRequest as action123} from "@/app/(app)/people/absence/actions";
import {setLeaveAllowance as action124} from "@/app/(app)/people/absence/actions";
import {rejectLeaveRequest as action125} from "@/app/(app)/people/absence/actions";
import {createEmployee as action126} from "@/app/(app)/people/actions";
import {changeEmployeeStatus as action127} from "@/app/(app)/people/actions";
import {updateEmployeeProfile as action128} from "@/app/(app)/people/actions";
import {updateOwnEmployeeDetails as action129} from "@/app/(app)/people/actions";
import {addEmployeeDocument as action130} from "@/app/(app)/people/actions";
import {linkEmployeeToUser as action131} from "@/app/(app)/people/actions";
import {completeEmployeeTask as action132} from "@/app/(app)/people/actions";
import {addEmployeeTask as action133} from "@/app/(app)/people/actions";
import {updateEmployeeContact as action134} from "@/app/(app)/people/actions";
import {updateEmployeeTask as action135} from "@/app/(app)/people/actions";
import {scheduleAppraisal as action136} from "@/app/(app)/people/appraisals/actions";
import {completeAppraisal as action137} from "@/app/(app)/people/appraisals/actions";
import {getConductDesk as action138} from "@/app/(app)/people/conduct/actions";
import {getMyConduct as action139} from "@/app/(app)/people/conduct/actions";
import {getPlan as action140} from "@/app/(app)/people/conduct/actions";
import {getCase as action141} from "@/app/(app)/people/conduct/actions";
import {conductChoices as action142} from "@/app/(app)/people/conduct/actions";
import {savePlan as action143} from "@/app/(app)/people/conduct/actions";
import {addPlanReview as action144} from "@/app/(app)/people/conduct/actions";
import {commentOnPlan as action145} from "@/app/(app)/people/conduct/actions";
import {saveCase as action146} from "@/app/(app)/people/conduct/actions";
import {respondToCase as action147} from "@/app/(app)/people/conduct/actions";
import {addCaseEvent as action148} from "@/app/(app)/people/conduct/actions";
import {submitExpenseClaim as action149} from "@/app/(app)/people/expenses/actions";
import {approveExpenseClaim as action150} from "@/app/(app)/people/expenses/actions";
import {rejectExpenseClaim as action151} from "@/app/(app)/people/expenses/actions";
import {scheduleOneToOne as action152} from "@/app/(app)/people/one-to-ones/actions";
import {completeOneToOne as action153} from "@/app/(app)/people/one-to-ones/actions";
import {listPolicies as action154} from "@/app/(app)/people/policies/actions";
import {publishPolicy as action155} from "@/app/(app)/people/policies/actions";
import {archivePolicy as action156} from "@/app/(app)/people/policies/actions";
import {openPolicy as action157} from "@/app/(app)/people/policies/actions";
import {createShift as action158} from "@/app/(app)/people/rotas/actions";
import {changeShiftStatus as action159} from "@/app/(app)/people/rotas/actions";
import {getMyHR as action160} from "@/app/(app)/people/self-service";
import {getMyTeam as action161} from "@/app/(app)/people/self-service";
import {getTeamEmployee as action162} from "@/app/(app)/people/self-service";
import {addPrivateNote as action163} from "@/app/(app)/people/self-service";
import {updateWorkingPattern as action164} from "@/app/(app)/people/self-service";
import {updateHrSettings as action165} from "@/app/(app)/people/settings/actions";
import {createAppraisalTemplate as action166} from "@/app/(app)/people/settings/actions";
import {toggleAppraisalTemplateActive as action167} from "@/app/(app)/people/settings/actions";
import {createOneToOneTemplate as action168} from "@/app/(app)/people/settings/actions";
import {toggleOneToOneTemplateActive as action169} from "@/app/(app)/people/settings/actions";
import {getTimesheetContext as action170} from "@/app/(app)/people/timesheets/actions";
import {saveTimesheet as action171} from "@/app/(app)/people/timesheets/actions";
import {reviewTimesheet as action172} from "@/app/(app)/people/timesheets/actions";
import {createPriceList as action173} from "@/app/(app)/pricing/actions";
import {savePriceEntry as action174} from "@/app/(app)/pricing/actions";
import {saveRule as action175} from "@/app/(app)/pricing/actions";
import {setRuleActive as action176} from "@/app/(app)/pricing/actions";
import {updatePriceBasis as action177} from "@/app/(app)/pricing/actions";
import {assignPriceList as action178} from "@/app/(app)/pricing/actions";
import {previewPriceCsv as action179} from "@/app/(app)/pricing/actions";
import {applyPriceCsv as action180} from "@/app/(app)/pricing/actions";
import {saveAgreement as action181} from "@/app/(app)/pricing/actions";
import {saveAgreementPrice as action182} from "@/app/(app)/pricing/actions";
import {removeAgreementPrice as action183} from "@/app/(app)/pricing/actions";
import {previewAgreementCsv as action184} from "@/app/(app)/pricing/actions";
import {applyAgreementCsv as action185} from "@/app/(app)/pricing/actions";
import {saveProduct as action186} from "@/app/(app)/products/actions";
import {saveProductRecord as action187} from "@/app/(app)/products/actions";
import {saveCategory as action188} from "@/app/(app)/products/actions";
import {retireCategory as action189} from "@/app/(app)/products/actions";
import {addStandardCategories as action190} from "@/app/(app)/products/actions";
import {savePack as action191} from "@/app/(app)/products/actions";
import {saveLinks as action192} from "@/app/(app)/products/actions";
import {saveMeasures as action193} from "@/app/(app)/products/actions";
import {saveProfile as action194} from "@/app/(app)/profile/actions";
import {loadAssignedWork as action195} from "@/app/(app)/profile/work";
import {createProject as action196} from "@/app/(app)/projects/actions";
import {changeProjectStatus as action197} from "@/app/(app)/projects/actions";
import {editProject as action198} from "@/app/(app)/projects/actions";
import {setProjectMember as action199} from "@/app/(app)/projects/actions";
import {archiveProject as action200} from "@/app/(app)/projects/actions";
import {createTask as action201} from "@/app/(app)/projects/actions";
import {changeTaskStatus as action202} from "@/app/(app)/projects/actions";
import {editTask as action203} from "@/app/(app)/projects/actions";
import {checklistItem as action204} from "@/app/(app)/projects/actions";
import {addDependency as action205} from "@/app/(app)/projects/actions";
import {createMeeting as action206} from "@/app/(app)/projects/actions";
import {createDocument as action207} from "@/app/(app)/projects/actions";
import {editDocument as action208} from "@/app/(app)/projects/actions";
import {addComment as action209} from "@/app/(app)/projects/actions";
import {createMilestone as action210} from "@/app/(app)/projects/actions";
import {publishUpdate as action211} from "@/app/(app)/projects/actions";
import {createDecision as action212} from "@/app/(app)/projects/actions";
import {decide as action213} from "@/app/(app)/projects/actions";
import {createRisk as action214} from "@/app/(app)/projects/actions";
import {closeRisk as action215} from "@/app/(app)/projects/actions";
import {requestApproval as action216} from "@/app/(app)/projects/actions";
import {respondApproval as action217} from "@/app/(app)/projects/actions";
import {submitRequest as action218} from "@/app/(app)/projects/actions";
import {triageRequest as action219} from "@/app/(app)/projects/actions";
import {logTime as action220} from "@/app/(app)/projects/actions";
import {planToday as action221} from "@/app/(app)/projects/actions";
import {updateInbox as action222} from "@/app/(app)/projects/actions";
import {saveView as action223} from "@/app/(app)/projects/actions";
import {createPortfolio as action224} from "@/app/(app)/projects/actions";
import {createBaseline as action225} from "@/app/(app)/projects/actions";
import {setBudget as action226} from "@/app/(app)/projects/actions";
import {linkWork as action227} from "@/app/(app)/projects/actions";
import {getProjectActivity as action228} from "@/app/(app)/projects/actions";
import {createAutomation as action229} from "@/app/(app)/projects/actions";
import {toggleAutomation as action230} from "@/app/(app)/projects/actions";
import {saveProjectTemplate as action231} from "@/app/(app)/projects/actions";
import {useProjectTemplate as action232} from "@/app/(app)/projects/actions";
import {startTimer as action233} from "@/app/(app)/projects/actions";
import {stopTimer as action234} from "@/app/(app)/projects/actions";
import {projectPreference as action235} from "@/app/(app)/projects/actions";
import {uploadProjectFile as action236} from "@/app/(app)/projects/actions";
import {readProjectFile as action237} from "@/app/(app)/projects/actions";
import {createProperty as action238} from "@/app/(app)/projects/actions";
import {setProperty as action239} from "@/app/(app)/projects/actions";
import {restoreDocument as action240} from "@/app/(app)/projects/actions";
import {createTaskFromDocument as action241} from "@/app/(app)/projects/actions";
import {discardTimer as action242} from "@/app/(app)/projects/actions";
import {completeMilestone as action243} from "@/app/(app)/projects/actions";
import {resolveComment as action244} from "@/app/(app)/projects/actions";
import {getProjectWorkload as action245} from "@/app/(app)/projects/actions";
import {createOrderForm as action246} from "@/app/(app)/sales/orders/actions";
import {addLineForm as action247} from "@/app/(app)/sales/orders/actions";
import {removeLineForm as action248} from "@/app/(app)/sales/orders/actions";
import {confirmOrderForm as action249} from "@/app/(app)/sales/orders/actions";
import {updateOrderForm as action250} from "@/app/(app)/sales/orders/actions";
import {chooseOrderAddresses as action251} from "@/app/(app)/sales/orders/actions";
import {addHoldForm as action252} from "@/app/(app)/sales/orders/actions";
import {releaseHoldForm as action253} from "@/app/(app)/sales/orders/actions";
import {approveOrderForm as action254} from "@/app/(app)/sales/orders/actions";
import {cancelOrderForm as action255} from "@/app/(app)/sales/orders/actions";
import {saveOrderHashtagsForm as action256} from "@/app/(app)/sales/orders/actions";
import {restoreCancelledOrderForm as action257} from "@/app/(app)/sales/orders/actions";
import {returnOrderToQuoteForm as action258} from "@/app/(app)/sales/orders/actions";
import {scheduleOrderDelivery as action259} from "@/app/(app)/sales/orders/actions";
import {rejectOrderApproval as action260} from "@/app/(app)/sales/orders/actions";
import {createQuote as action261} from "@/app/(app)/sales/quotes/actions";
import {saveCreationPolicy as action262} from "@/app/(app)/sales/settings/actions";
import {getSchedule as action263} from "@/app/(app)/scheduling/actions";
import {createBulkShifts as action264} from "@/app/(app)/scheduling/actions";
import {setScheduledShift as action265} from "@/app/(app)/scheduling/actions";
import {completeShiftTask as action266} from "@/app/(app)/scheduling/actions";
import {editScheduledShift as action267} from "@/app/(app)/scheduling/actions";
import {publishWeekShifts as action268} from "@/app/(app)/scheduling/actions";
import {saveHoursBudget as action269} from "@/app/(app)/scheduling/actions";
import {getTeamPlan as action270} from "@/app/(app)/scheduling/actions";
import {getPersonSchedule as action271} from "@/app/(app)/scheduling/actions";
import {saveWorkType as action272} from "@/app/(app)/scheduling/actions";
import {archiveWorkType as action273} from "@/app/(app)/scheduling/actions";
import {saveDemand as action274} from "@/app/(app)/scheduling/actions";
import {saveBusyRule as action275} from "@/app/(app)/scheduling/actions";
import {removeBusyRule as action276} from "@/app/(app)/scheduling/actions";
import {fillTeamMonth as action277} from "@/app/(app)/scheduling/actions";
import {replanCover as action278} from "@/app/(app)/scheduling/actions";
import {publishMonth as action279} from "@/app/(app)/scheduling/actions";
import {saveShift as action280} from "@/app/(app)/scheduling/actions";
import {saveRole as action281} from "@/app/(app)/settings/actions";
import {saveMemberRoles as action282} from "@/app/(app)/settings/actions";
import {createUser as action283} from "@/app/(app)/settings/actions";
import {saveCompanyAccess as action284} from "@/app/(app)/settings/actions";
import {saveCompanyProfile as action285} from "@/app/(app)/settings/actions";
import {saveManagerPolicy as action286} from "@/app/(app)/settings/actions";
import {saveWorkspaceDetails as action287} from "@/app/(app)/settings/actions";
import {saveCompanyBrand as action288} from "@/app/(app)/settings/actions";
import {importCsv as action289} from "@/app/(app)/settings/imports/actions";
import {saveDispatchDelivery as action290} from "@/app/(app)/settings/logistics/actions";
import {saveUserAccess as action291} from "@/app/(app)/settings/user-actions";
import {setUserStatus as action292} from "@/app/(app)/settings/user-actions";
import {revokeUserSessions as action293} from "@/app/(app)/settings/user-actions";
import {issuePasswordRecovery as action294} from "@/app/(app)/settings/user-actions";
import {createManagedUser as action295} from "@/app/(app)/settings/user-actions";
import {linkEmployeeProfile as action296} from "@/app/(app)/settings/user-actions";
import {createRole as action297} from "@/app/(app)/settings/user-actions";
import {saveManagementGroup as action298} from "@/app/(app)/settings/user-actions";
import {createWarehouse as action299} from "@/app/(app)/stock/actions";
import {adjustStock as action300} from "@/app/(app)/stock/actions";
import {transferStock as action301} from "@/app/(app)/stock/actions";
import {createSiteAction as action302} from "@/app/(app)/stock/actions";
import {createPlaceAction as action303} from "@/app/(app)/stock/actions";
import {assignSiteAction as action304} from "@/app/(app)/stock/actions";
import {addLocationAction as action305} from "@/app/(app)/stock/actions";
import {ensureLocationsAction as action306} from "@/app/(app)/stock/actions";
import {retireLocationAction as action307} from "@/app/(app)/stock/actions";
import {putOnLocationAction as action308} from "@/app/(app)/stock/actions";
import {moveLocatedAction as action309} from "@/app/(app)/stock/actions";
import {receiveMoveAction as action310} from "@/app/(app)/stock/actions";
import {signup as action311} from "@/app/(auth)/signup/actions";
import {delegateApprovals as action312} from "@/core/approvals/actions";
import {loginAction as action313} from "@/core/auth/actions";
import {logoutAction as action314} from "@/core/auth/actions";
import {completePasswordRecovery as action315} from "@/core/auth/security-actions";
import {changeOwnPassword as action316} from "@/core/auth/security-actions";
import {signOutOtherSessions as action317} from "@/core/auth/security-actions";
import {checkForDuplicatesAction as action318} from "@/core/customers/actions";
import {createCustomerAction as action319} from "@/core/customers/actions";
import {createCustomer as action320} from "@/core/customers/commands";
import {updateCustomerStatus as action321} from "@/core/customers/commands";
import {createContact as action322} from "@/core/customers/commands";
import {updateContact as action323} from "@/core/customers/commands";
import {deleteContact as action324} from "@/core/customers/commands";
import {createAddress as action325} from "@/core/customers/commands";
import {updateCommercialSettings as action326} from "@/core/customers/commands";
import {updateCreditLimit as action327} from "@/core/customers/commands";
import {setCreditHold as action328} from "@/core/customers/commands";
import {setPaymentTerm as action329} from "@/core/customers/commands";
import {createTaxRegistration as action330} from "@/core/customers/commands";
import {markTaxRegistrationManuallyVerified as action331} from "@/core/customers/commands";
import {createBankAccount as action332} from "@/core/customers/commands";
import {revealBankAccount as action333} from "@/core/customers/commands";
import {createDirectDebitMandate as action334} from "@/core/customers/commands";
import {cancelDirectDebitMandate as action335} from "@/core/customers/commands";
import {createNote as action336} from "@/core/customers/commands";
import {saveCustomerHashtags as action337} from "@/core/customers/commands";
import {saveOrderingPreferences as action338} from "@/core/customers/commercial-actions";
import {setCustomerParent as action339} from "@/core/customers/hierarchy-actions";
import {placeCustomer as action340} from "@/core/customers/hierarchy-actions";
import {moveCustomer as action341} from "@/core/customers/hierarchy-actions";
import {setContactReportsTo as action342} from "@/core/customers/hierarchy-actions";
import {saveCustomerTradingLink as action343} from "@/core/customers/trading-actions";
import {setInvoiceAccount as action344} from "@/core/customers/trading-actions";
import {archiveCustomerTradingLink as action345} from "@/core/customers/trading-actions";
import {requestSalesInvoice as action346} from "@/core/finance/actions";
import {createWorkTeam as action347} from "@/core/teams/actions";
import {loadAuditBoard as action348} from "@/modules/audit/services/actions";
import {exportAuditReport as action349} from "@/modules/audit/services/actions";
import {loadEcho as action350} from "@/modules/audit/services/actions";
import {postEchoNote as action351} from "@/modules/audit/services/actions";
import {loadEchoInbox as action352} from "@/modules/audit/services/actions";
import {loadAuditAccess as action353} from "@/modules/audit/services/actions";
import {saveAuditOwnActivity as action354} from "@/modules/audit/services/actions";
import {saveAuditAreas as action355} from "@/modules/audit/services/actions";
import {logActivity as action356} from "@/modules/crm/services/activities";
import {completeActivity as action357} from "@/modules/crm/services/activities";
import {acceptMarketingHandoff as action358} from "@/modules/crm/services/marketing-handoff";
import {createOpportunity as action359} from "@/modules/crm/services/opportunities";
import {moveOpportunityStage as action360} from "@/modules/crm/services/opportunities";
import {updateOpportunityValue as action361} from "@/modules/crm/services/opportunities";
import {updateOpportunityCloseDate as action362} from "@/modules/crm/services/opportunities";
import {setOpportunityForecastCategory as action363} from "@/modules/crm/services/opportunities";
import {setOpportunityNextAction as action364} from "@/modules/crm/services/opportunities";
import {winOpportunity as action365} from "@/modules/crm/services/opportunities";
import {loseOpportunity as action366} from "@/modules/crm/services/opportunities";
import {addStakeholder as action367} from "@/modules/crm/services/opportunities";
import {addMilestone as action368} from "@/modules/crm/services/opportunities";
import {toggleMilestone as action369} from "@/modules/crm/services/opportunities";
import {checkProspectDuplicatesAction as action370} from "@/modules/crm/services/prospects";
import {createProspect as action371} from "@/modules/crm/services/prospects";
import {assignProspect as action372} from "@/modules/crm/services/prospects";
import {setProspectLifecycleStage as action373} from "@/modules/crm/services/prospects";
import {convertProspect as action374} from "@/modules/crm/services/prospects";
import {createIndustry as action375} from "@/modules/crm/services/prospects";
import {saveProspectGrouping as action376} from "@/modules/crm/services/prospects";
import {setupFinance as action377} from "@/modules/finance/services/commands";
import {createFinanceDocument as action378} from "@/modules/finance/services/commands";
import {submitFinanceDocument as action379} from "@/modules/finance/services/commands";
import {saveApprovalPolicy as action380} from "@/modules/finance/services/commands";
import {decideFinanceApproval as action381} from "@/modules/finance/services/commands";
import {createPurchaseOrder as action382} from "@/modules/finance/services/commands";
import {raiseServiceCredit as action383} from "@/modules/finance/services/commands";
import {postFinanceDocument as action384} from "@/modules/finance/services/commands";
import {recordGoodsReceipt as action385} from "@/modules/finance/services/commands";
import {onboardSupplier as action386} from "@/modules/finance/services/commands";
import {approveSupplier as action387} from "@/modules/finance/services/commands";
import {requestSupplierBankChange as action388} from "@/modules/finance/services/commands";
import {verifySupplierBank as action389} from "@/modules/finance/services/commands";
import {createFinanceBank as action390} from "@/modules/finance/services/commands";
import {importBankTransactions as action391} from "@/modules/finance/services/commands";
import {allocateBankTransaction as action392} from "@/modules/finance/services/commands";
import {createPaymentRun as action393} from "@/modules/finance/services/commands";
import {approvePaymentRun as action394} from "@/modules/finance/services/commands";
import {createManualJournal as action395} from "@/modules/finance/services/commands";
import {approveManualJournal as action396} from "@/modules/finance/services/commands";
import {reverseJournal as action397} from "@/modules/finance/services/commands";
import {setFinancePeriodState as action398} from "@/modules/finance/services/commands";
import {saveFinanceBudget as action399} from "@/modules/finance/services/commands";
import {saveFinanceAsset as action400} from "@/modules/finance/services/commands";
import {postAssetDepreciation as action401} from "@/modules/finance/services/commands";
import {completeCloseTask as action402} from "@/modules/finance/services/commands";
import {saveFinanceContract as action403} from "@/modules/finance/services/commands";
import {saveFinanceScenario as action404} from "@/modules/finance/services/commands";
import {receiptForm as action405} from "@/modules/finance/services/commands";
import {journalForm as action406} from "@/modules/finance/services/commands";
import {statementForm as action407} from "@/modules/finance/services/commands";
import {allocationForm as action408} from "@/modules/finance/services/commands";
import {paymentRunForm as action409} from "@/modules/finance/services/commands";
import {policyForm as action410} from "@/modules/finance/services/commands";
import {scenarioForm as action411} from "@/modules/finance/services/commands";
import {uploadFinanceAttachment as action412} from "@/modules/finance/services/commands";
import {generateSalesInvoice as action413} from "@/modules/finance/services/commands";
import {generateInvoiceAdjustment as action414} from "@/modules/finance/services/commands";
import {voidFinanceDraft as action415} from "@/modules/finance/services/commands";
import {getFinanceHome as action416} from "@/modules/finance/services/queries";
import {listFinanceDocuments as action417} from "@/modules/finance/services/queries";
import {getFinanceDocument as action418} from "@/modules/finance/services/queries";
import {getFinanceWorkspace as action419} from "@/modules/finance/services/queries";
import {financeChoices as action420} from "@/modules/finance/services/queries";
import {getBudgetPositions as action421} from "@/modules/finance/services/queries";
import {getInvoiceCashForecast as action422} from "@/modules/finance/services/queries";
import {getFinancialReport as action423} from "@/modules/finance/services/queries";
import {getFinanceCustomerContribution as action424} from "@/modules/finance/services/queries";
import {searchFinance as action425} from "@/modules/finance/services/queries";
import {getFinanceAttachment as action426} from "@/modules/finance/services/queries";
import {getSalesFinanceProjection as action427} from "@/modules/finance/services/queries";
import {getReceivingWarehouses as action428} from "@/modules/finance/services/queries";
import {createProductionOrder as action429} from "@/modules/manufacturing/services/commands";
import {markOrderReady as action430} from "@/modules/manufacturing/services/commands";
import {releaseOrder as action431} from "@/modules/manufacturing/services/commands";
import {closeOrder as action432} from "@/modules/manufacturing/services/commands";
import {startWorkOrder as action433} from "@/modules/manufacturing/services/commands";
import {pauseWorkOrder as action434} from "@/modules/manufacturing/services/commands";
import {completeWorkOrder as action435} from "@/modules/manufacturing/services/commands";
import {listForecasts as action436} from "@/modules/manufacturing/services/forecast";
import {setForecast as action437} from "@/modules/manufacturing/services/forecast";
import {deleteForecast as action438} from "@/modules/manufacturing/services/forecast";
import {runMrp as action439} from "@/modules/manufacturing/services/mrp";
import {firmSuggestion as action440} from "@/modules/manufacturing/services/mrp";
import {dismissSuggestion as action441} from "@/modules/manufacturing/services/mrp";
import {latestPlan as action442} from "@/modules/manufacturing/services/mrp";
import {loadPlant as action443} from "@/modules/manufacturing/services/plant";
import {saveWorkCentre as action444} from "@/modules/manufacturing/services/plant";
import {saveMachine as action445} from "@/modules/manufacturing/services/plant";
import {retirePlantRecord as action446} from "@/modules/manufacturing/services/plant";
import {schedulePreview as action447} from "@/modules/manufacturing/services/scheduler";
import {rescheduleWorkOrder as action448} from "@/modules/manufacturing/services/scheduler";
import {setWorkOrderLock as action449} from "@/modules/manufacturing/services/scheduler";
import {listShifts as action450} from "@/modules/manufacturing/services/shifts";
import {saveShift as action451} from "@/modules/manufacturing/services/shifts";
import {deleteShift as action452} from "@/modules/manufacturing/services/shifts";
import {createCampaign as action453} from "@/modules/marketing/services/commands";
import {updateCampaign as action454} from "@/modules/marketing/services/commands";
import {createProfile as action455} from "@/modules/marketing/services/commands";
import {recordPermission as action456} from "@/modules/marketing/services/commands";
import {suppressProfile as action457} from "@/modules/marketing/services/commands";
import {createAudience as action458} from "@/modules/marketing/services/commands";
import {previewAudience as action459} from "@/modules/marketing/services/commands";
import {createContent as action460} from "@/modules/marketing/services/commands";
import {approveContent as action461} from "@/modules/marketing/services/commands";
import {createMessage as action462} from "@/modules/marketing/services/commands";
import {lockSend as action463} from "@/modules/marketing/services/commands";
import {cancelSend as action464} from "@/modules/marketing/services/commands";
import {ingestEvent as action465} from "@/modules/marketing/services/commands";
import {createJourney as action466} from "@/modules/marketing/services/commands";
import {publishJourney as action467} from "@/modules/marketing/services/commands";
import {reviseJourney as action468} from "@/modules/marketing/services/commands";
import {createProgram as action469} from "@/modules/marketing/services/commands";
import {createExperiment as action470} from "@/modules/marketing/services/commands";
import {leadFeedback as action471} from "@/modules/marketing/services/commands";
import {processJourneySteps as action472} from "@/modules/marketing/services/commands";
import {saveMarketingPlan as action473} from "@/modules/marketing/services/commands";
import {addPlanActivity as action474} from "@/modules/marketing/services/commands";
import {updatePlanActivity as action475} from "@/modules/marketing/services/commands";
import {addBudgetLine as action476} from "@/modules/marketing/services/commands";
import {submitBudgetToFinance as action477} from "@/modules/marketing/services/commands";
import {createJourneyMap as action478} from "@/modules/marketing/services/commands";
import {addJourneyStage as action479} from "@/modules/marketing/services/commands";
import {addJourneyTouch as action480} from "@/modules/marketing/services/commands";
import {getApprovedExpenseSource as action481} from "@/modules/people/services/finance-expenses";
import {createPlan as action482} from "@/modules/plan/services/commands";
import {saveCell as action483} from "@/modules/plan/services/commands";
import {addMeasure as action484} from "@/modules/plan/services/commands";
import {addAssumption as action485} from "@/modules/plan/services/commands";
import {addDriver as action486} from "@/modules/plan/services/commands";
import {addLink as action487} from "@/modules/plan/services/commands";
import {createScenario as action488} from "@/modules/plan/services/commands";
import {promoteScenario as action489} from "@/modules/plan/services/commands";
import {submitPlan as action490} from "@/modules/plan/services/commands";
import {approvePlan as action491} from "@/modules/plan/services/commands";
import {lockPlan as action492} from "@/modules/plan/services/commands";
import {addGoal as action493} from "@/modules/plan/services/commands";
import {addInitiative as action494} from "@/modules/plan/services/commands";
import {createProjectForInitiative as action495} from "@/modules/plan/services/commands";
import {addAction as action496} from "@/modules/plan/services/commands";
import {completeAction as action497} from "@/modules/plan/services/commands";
import {addRisk as action498} from "@/modules/plan/services/commands";
import {addDependency as action499} from "@/modules/plan/services/commands";
import {addDecision as action500} from "@/modules/plan/services/commands";
import {addComment as action501} from "@/modules/plan/services/commands";
import {addUpdate as action502} from "@/modules/plan/services/commands";
import {completeReview as action503} from "@/modules/plan/services/commands";
import {addReview as action504} from "@/modules/plan/services/commands";
import {distributeTargets as action505} from "@/modules/plan/services/commands";
import {importGrid as action506} from "@/modules/plan/services/commands";
import {sharePlan as action507} from "@/modules/plan/services/commands";
import {unsharePlan as action508} from "@/modules/plan/services/commands";
import {setPlanAudience as action509} from "@/modules/plan/services/commands";
import {addNote as action510} from "@/modules/plan/services/commands";
import {saveGoalProgress as action511} from "@/modules/plan/services/commands";
import {savePlanBrief as action512} from "@/modules/plan/services/commands";
import {listProductionPlans as action513} from "@/modules/planning/services/plans";
import {getPlanOptions as action514} from "@/modules/planning/services/plans";
import {getProductionPlan as action515} from "@/modules/planning/services/plans";
import {createProductionPlan as action516} from "@/modules/planning/services/plans";
import {addProductionPlanLine as action517} from "@/modules/planning/services/plans";
import {getAssignedPlanningWork as action518} from "@/modules/planning/services/plans";
import {getPlanningCoverage as action519} from "@/modules/planning/services/queries";
import {saveProductRecipe as action520} from "@/modules/products/services/make";
import {createSpecification as action521} from "@/modules/quality/services/commands";
import {setSpecificationStatus as action522} from "@/modules/quality/services/commands";
import {createControlPoint as action523} from "@/modules/quality/services/commands";
import {executeInspection as action524} from "@/modules/quality/services/commands";
import {releaseHold as action525} from "@/modules/quality/services/commands";
import {reportNcr as action526} from "@/modules/quality/services/commands";
import {updateNcrInvestigation as action527} from "@/modules/quality/services/commands";
import {addNcrAction as action528} from "@/modules/quality/services/commands";
import {updateNcrAction as action529} from "@/modules/quality/services/commands";
import {closeNcr as action530} from "@/modules/quality/services/commands";
import {saveSubstance as action531} from "@/modules/safety/services/assurance";
import {addSafetyDataSheet as action532} from "@/modules/safety/services/assurance";
import {saveCoshhAssessment as action533} from "@/modules/safety/services/assurance";
import {approveSubstance as action534} from "@/modules/safety/services/assurance";
import {saveCompetence as action535} from "@/modules/safety/services/assurance";
import {saveSafetyDocument as action536} from "@/modules/safety/services/assurance";
import {acknowledgeDocument as action537} from "@/modules/safety/services/assurance";
import {saveAudit as action538} from "@/modules/safety/services/assurance";
import {addAuditFinding as action539} from "@/modules/safety/services/assurance";
import {approveAudit as action540} from "@/modules/safety/services/assurance";
import {saveChange as action541} from "@/modules/safety/services/assurance";
import {advanceChange as action542} from "@/modules/safety/services/assurance";
import {linkSafetyRecord as action543} from "@/modules/safety/services/assurance";
import {saveSafetyProfile as action544} from "@/modules/safety/services/commands";
import {saveRiskMatrix as action545} from "@/modules/safety/services/commands";
import {createRisk as action546} from "@/modules/safety/services/commands";
import {addControl as action547} from "@/modules/safety/services/commands";
import {rateAssessment as action548} from "@/modules/safety/services/commands";
import {approveAssessment as action549} from "@/modules/safety/services/commands";
import {reviseAssessment as action550} from "@/modules/safety/services/commands";
import {requestRiskReview as action551} from "@/modules/safety/services/commands";
import {reportIncident as action552} from "@/modules/safety/services/commands";
import {saveImmediateControl as action553} from "@/modules/safety/services/commands";
import {openInvestigation as action554} from "@/modules/safety/services/commands";
import {addCause as action555} from "@/modules/safety/services/commands";
import {saveRootCause as action556} from "@/modules/safety/services/commands";
import {reviewRiddor as action557} from "@/modules/safety/services/commands";
import {createSafetyAction as action558} from "@/modules/safety/services/commands";
import {advanceAction as action559} from "@/modules/safety/services/commands";
import {verifyAction as action560} from "@/modules/safety/services/commands";
import {saveWorkplaceRecord as action561} from "@/modules/safety/services/commands";
import {createPermit as action562} from "@/modules/safety/services/control";
import {advancePermit as action563} from "@/modules/safety/services/control";
import {extendPermit as action564} from "@/modules/safety/services/control";
import {createIsolation as action565} from "@/modules/safety/services/control";
import {applyIsolationLock as action566} from "@/modules/safety/services/control";
import {verifyIsolation as action567} from "@/modules/safety/services/control";
import {clearIsolation as action568} from "@/modules/safety/services/control";
import {removeIsolationLock as action569} from "@/modules/safety/services/control";
import {placeSafetyHold as action570} from "@/modules/safety/services/control";
import {updateReturnToService as action571} from "@/modules/safety/services/control";
import {releaseSafetyHold as action572} from "@/modules/safety/services/control";
import {overrideSafetyHold as action573} from "@/modules/safety/services/control";
import {saveStatutoryCheck as action574} from "@/modules/safety/services/control";
import {completeInspection as action575} from "@/modules/safety/services/control";
import {createInspection as action576} from "@/modules/safety/services/control";
import {createSalesAddress as action577} from "@/modules/sales/services/address-actions";
import {createSalesCatalogueProduct as action578} from "@/modules/sales/services/catalogue-actions";
import {sendQuote as action579} from "@/modules/sales/services/commands";
import {changeQuoteStatus as action580} from "@/modules/sales/services/commands";
import {duplicateDocument as action581} from "@/modules/sales/services/commands";
import {saveQuoteTemplate as action582} from "@/modules/sales/services/commands";
import {createOrderFromQuote as action583} from "@/modules/sales/services/commands";
import {linkCommercialProject as action584} from "@/modules/sales/services/commercial";
import {openCallOffOrder as action585} from "@/modules/sales/services/commercial";
import {raiseCallOff as action586} from "@/modules/sales/services/commercial";
import {invoiceCallOffDelivery as action587} from "@/modules/sales/services/commercial";
import {deliverAndInvoiceCallOff as action588} from "@/modules/sales/services/commercial";
import {saveDocument as action589} from "@/modules/sales/services/documents";
import {saveInvoiceTemplate as action590} from "@/modules/sales/services/invoice-template-actions";
import {retireInvoiceTemplate as action591} from "@/modules/sales/services/invoice-template-actions";
import {attachCustomerInvoiceTemplate as action592} from "@/modules/sales/services/invoice-template-actions";
import {detachCustomerInvoiceTemplate as action593} from "@/modules/sales/services/invoice-template-actions";
import {createDraftOrder as action594} from "@/modules/sales/services/orders";
import {addOrderLine as action595} from "@/modules/sales/services/orders";
import {removeOrderLine as action596} from "@/modules/sales/services/orders";
import {updateDraftOrderFields as action597} from "@/modules/sales/services/orders";
import {confirmOrder as action598} from "@/modules/sales/services/orders";
import {decideApproval as action599} from "@/modules/sales/services/orders";
import {amendLineQuantity as action600} from "@/modules/sales/services/orders";
import {overrideLinePrice as action601} from "@/modules/sales/services/orders";
import {amendRequestedDate as action602} from "@/modules/sales/services/orders";
import {cancelOrder as action603} from "@/modules/sales/services/orders";
import {cancelLineRemaining as action604} from "@/modules/sales/services/orders";
import {addHold as action605} from "@/modules/sales/services/orders";
import {releaseHold as action606} from "@/modules/sales/services/orders";
import {restoreCancelledOrder as action607} from "@/modules/sales/services/rewind";
import {returnOrderToQuote as action608} from "@/modules/sales/services/rewind";
import {saveOrderHashtags as action609} from "@/modules/sales/services/rewind";
import {saveSalesView as action610} from "@/modules/sales/services/saved-views";
import {archiveSalesView as action611} from "@/modules/sales/services/saved-views";
import {createCase as action612} from "@/modules/service/services/commands";
import {updateCase as action613} from "@/modules/service/services/commands";
import {assignCase as action614} from "@/modules/service/services/commands";
import {transitionCase as action615} from "@/modules/service/services/commands";
import {addCaseEntry as action616} from "@/modules/service/services/commands";
import {createDepartmentTicket as action617} from "@/modules/service/services/commands";
import {updateDepartmentTicket as action618} from "@/modules/service/services/commands";
import {createQueue as action619} from "@/modules/service/services/commands";
import {addQueueMember as action620} from "@/modules/service/services/commands";
import {linkCaseRecord as action621} from "@/modules/service/services/commands";
import {creditChoices as action622} from "@/modules/service/services/commands";
import {askFinanceForCredit as action623} from "@/modules/service/services/commands";
import {getCaseOwners as action624} from "@/modules/service/services/commands";
import {getDepartmentWork as action625} from "@/modules/service/services/commands";
import {readAvailability as action626} from "@/modules/stock/services/availability";
import {readOrderChain as action627} from "@/modules/stock/services/availability";
import {inventoryExportRows as action628} from "@/modules/stock/services/export";
import {createTeam as action629} from "@/modules/teams/services/commands";
import {renameTeam as action630} from "@/modules/teams/services/commands";
import {addMember as action631} from "@/modules/teams/services/commands";
import {removeMember as action632} from "@/modules/teams/services/commands";
import {saveTask as action633} from "@/modules/teams/services/commands";
import {setTaskStatus as action634} from "@/modules/teams/services/commands";
import {removeTask as action635} from "@/modules/teams/services/commands";
import {saveCover as action636} from "@/modules/teams/services/commands";
import {removeCover as action637} from "@/modules/teams/services/commands";
import {saveHandover as action638} from "@/modules/teams/services/commands";
import {savePlace as action639} from "@/modules/teams/services/commands";
import {saveMoment as action640} from "@/modules/teams/services/commands";
import {removeMoment as action641} from "@/modules/teams/services/commands";
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
"src/app/(app)/crm/prospect/[prospectId]/actions:qualifyFormAction":action28 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:disqualifyFormAction":action29 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:nurtureFormAction":action30 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:logProspectActivityFormAction":action31 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:assignProspectFormAction":action32 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:assignProspectTaskFormAction":action33 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:convertProspectFormAction":action34 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/reports/actions:pinReportToDashboard":action35 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createContactFormAction":action36 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateContactFormAction":action37 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:deleteContactFormAction":action38 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createAddressFormAction":action39 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createTaxRegistrationFormAction":action40 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:markTaxVerifiedFormAction":action41 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createBankAccountFormAction":action42 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createDirectDebitFormAction":action43 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:cancelDirectDebitFormAction":action44 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateCreditLimitFormAction":action45 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:toggleCreditHoldFormAction":action46 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createNoteFormAction":action47 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateStatusFormAction":action48 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:createKpi":action49 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:saveGoal":action50 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:updateKpi":action51 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:recordProgress":action52 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:closeGoal":action53 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:addPlanGoal":action54 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:closePlan":action55 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:commentOnPlan":action56 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:syncDemandAction":action57 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:restoreDeliveryAction":action58 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:releaseAction":action59 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:allocateAction":action60 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:directShipAction":action61 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:groupAction":action62 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:scanAction":action63 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:lotAction":action64 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:serialAction":action65 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shortAction":action66 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeWorkAction":action67 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:claimAction":action68 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shipFromPickAction":action69 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packageAction":action70 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:weightAction":action71 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:stageAction":action72 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:labelAction":action73 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:dispatchAction":action74 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:trackingAction":action75 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:deliverAction":action76 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadCreateAction":action77 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadScanAction":action78 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:departAction":action79 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:expectAction":action80 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveLineAction":action81 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:putAwayAction":action82 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeReceiptAction":action83 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferAction":action84 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferReceiveAction":action85 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:returnRequestAction":action86 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:authoriseReturnAction":action87 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveReturnAction":action88 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:inspectAction":action89 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:closeReturnAction":action90 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:assignEquipmentAction":action91 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packUnitAction":action92 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:saveHandlingTypeAction":action93 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:retireHandlingTypeAction":action94 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:removeHandlingTypeAction":action95 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:policyAction":action96 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:runMrpAction":action97 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:firmSuggestionAction":action98 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:dismissSuggestionAction":action99 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:setForecastAction":action100 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:deleteForecastAction":action101 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:previewMoveAction":action102 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:commitMoveAction":action103 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:toggleLockAction":action104 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:saveShiftAction":action105 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:deleteShiftAction":action106 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:startAction":action107 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:pauseAction":action108 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:completeAction":action109 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:loadNotices":action110 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotice":action111 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotices":action112 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:createPayrollRun":action113 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:updatePayslipDeductions":action114 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:finalisePayrollRun":action115 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:markPayrollRunPaid":action116 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:savePayrollSettings":action117 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP45":action118 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP60":action119 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:logAbsence":action120 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:requestLeave":action121 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:cancelOwnLeave":action122 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:approveLeaveRequest":action123 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:setLeaveAllowance":action124 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:rejectLeaveRequest":action125 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:createEmployee":action126 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:changeEmployeeStatus":action127 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeProfile":action128 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateOwnEmployeeDetails":action129 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeDocument":action130 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:linkEmployeeToUser":action131 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:completeEmployeeTask":action132 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeTask":action133 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeContact":action134 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeTask":action135 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:scheduleAppraisal":action136 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:completeAppraisal":action137 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getConductDesk":action138 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getMyConduct":action139 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getPlan":action140 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getCase":action141 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:conductChoices":action142 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:savePlan":action143 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addPlanReview":action144 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:commentOnPlan":action145 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:saveCase":action146 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:respondToCase":action147 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addCaseEvent":action148 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:submitExpenseClaim":action149 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:approveExpenseClaim":action150 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:rejectExpenseClaim":action151 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:scheduleOneToOne":action152 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:completeOneToOne":action153 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:listPolicies":action154 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:publishPolicy":action155 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:archivePolicy":action156 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:openPolicy":action157 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:createShift":action158 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:changeShiftStatus":action159 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyHR":action160 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyTeam":action161 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getTeamEmployee":action162 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:addPrivateNote":action163 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:updateWorkingPattern":action164 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:updateHrSettings":action165 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createAppraisalTemplate":action166 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleAppraisalTemplateActive":action167 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createOneToOneTemplate":action168 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleOneToOneTemplateActive":action169 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:getTimesheetContext":action170 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:saveTimesheet":action171 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:reviewTimesheet":action172 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:createPriceList":action173 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:savePriceEntry":action174 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveRule":action175 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:setRuleActive":action176 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:updatePriceBasis":action177 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:assignPriceList":action178 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewPriceCsv":action179 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyPriceCsv":action180 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreement":action181 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreementPrice":action182 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:removeAgreementPrice":action183 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewAgreementCsv":action184 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyAgreementCsv":action185 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProduct":action186 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProductRecord":action187 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveCategory":action188 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:retireCategory":action189 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:addStandardCategories":action190 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:savePack":action191 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveLinks":action192 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveMeasures":action193 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/actions:saveProfile":action194 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/work:loadAssignedWork":action195 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProject":action196 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeProjectStatus":action197 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editProject":action198 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProjectMember":action199 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:archiveProject":action200 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTask":action201 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeTaskStatus":action202 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editTask":action203 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:checklistItem":action204 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addDependency":action205 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMeeting":action206 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDocument":action207 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editDocument":action208 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addComment":action209 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMilestone":action210 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:publishUpdate":action211 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDecision":action212 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:decide":action213 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createRisk":action214 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:closeRisk":action215 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:requestApproval":action216 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:respondApproval":action217 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:submitRequest":action218 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:triageRequest":action219 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:logTime":action220 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:planToday":action221 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:updateInbox":action222 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveView":action223 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createPortfolio":action224 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createBaseline":action225 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setBudget":action226 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:linkWork":action227 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectActivity":action228 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createAutomation":action229 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:toggleAutomation":action230 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveProjectTemplate":action231 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:useProjectTemplate":action232 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:startTimer":action233 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:stopTimer":action234 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:projectPreference":action235 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:uploadProjectFile":action236 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:readProjectFile":action237 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProperty":action238 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProperty":action239 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:restoreDocument":action240 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTaskFromDocument":action241 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:discardTimer":action242 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:completeMilestone":action243 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:resolveComment":action244 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectWorkload":action245 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:createOrderForm":action246 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addLineForm":action247 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:removeLineForm":action248 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:confirmOrderForm":action249 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:updateOrderForm":action250 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:chooseOrderAddresses":action251 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addHoldForm":action252 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:releaseHoldForm":action253 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:approveOrderForm":action254 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:cancelOrderForm":action255 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:saveOrderHashtagsForm":action256 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:restoreCancelledOrderForm":action257 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:returnOrderToQuoteForm":action258 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:scheduleOrderDelivery":action259 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:rejectOrderApproval":action260 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:createQuote":action261 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/settings/actions:saveCreationPolicy":action262 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getSchedule":action263 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:createBulkShifts":action264 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:setScheduledShift":action265 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:completeShiftTask":action266 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:editScheduledShift":action267 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishWeekShifts":action268 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveHoursBudget":action269 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getTeamPlan":action270 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getPersonSchedule":action271 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveWorkType":action272 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:archiveWorkType":action273 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveDemand":action274 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveBusyRule":action275 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:removeBusyRule":action276 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:fillTeamMonth":action277 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:replanCover":action278 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishMonth":action279 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveShift":action280 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveRole":action281 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveMemberRoles":action282 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:createUser":action283 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyAccess":action284 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyProfile":action285 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveManagerPolicy":action286 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveWorkspaceDetails":action287 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyBrand":action288 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/imports/actions:importCsv":action289 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/logistics/actions:saveDispatchDelivery":action290 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveUserAccess":action291 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:setUserStatus":action292 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:revokeUserSessions":action293 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:issuePasswordRecovery":action294 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createManagedUser":action295 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:linkEmployeeProfile":action296 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createRole":action297 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveManagementGroup":action298 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createWarehouse":action299 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:adjustStock":action300 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:transferStock":action301 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createSiteAction":action302 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createPlaceAction":action303 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:assignSiteAction":action304 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:addLocationAction":action305 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:ensureLocationsAction":action306 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:retireLocationAction":action307 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:putOnLocationAction":action308 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:moveLocatedAction":action309 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:receiveMoveAction":action310 as (...args:never[])=>Promise<unknown>,
"src/app/(auth)/signup/actions:signup":action311 as (...args:never[])=>Promise<unknown>,
"src/core/approvals/actions:delegateApprovals":action312 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:loginAction":action313 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:logoutAction":action314 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:completePasswordRecovery":action315 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:changeOwnPassword":action316 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:signOutOtherSessions":action317 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:checkForDuplicatesAction":action318 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:createCustomerAction":action319 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createCustomer":action320 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerStatus":action321 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createContact":action322 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateContact":action323 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteContact":action324 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createAddress":action325 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCommercialSettings":action326 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCreditLimit":action327 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setCreditHold":action328 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setPaymentTerm":action329 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createTaxRegistration":action330 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:markTaxRegistrationManuallyVerified":action331 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createBankAccount":action332 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:revealBankAccount":action333 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createDirectDebitMandate":action334 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:cancelDirectDebitMandate":action335 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createNote":action336 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:saveCustomerHashtags":action337 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commercial-actions:saveOrderingPreferences":action338 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setCustomerParent":action339 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:placeCustomer":action340 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:moveCustomer":action341 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setContactReportsTo":action342 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:saveCustomerTradingLink":action343 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:setInvoiceAccount":action344 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:archiveCustomerTradingLink":action345 as (...args:never[])=>Promise<unknown>,
"src/core/finance/actions:requestSalesInvoice":action346 as (...args:never[])=>Promise<unknown>,
"src/core/teams/actions:createWorkTeam":action347 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditBoard":action348 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:exportAuditReport":action349 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEcho":action350 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:postEchoNote":action351 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEchoInbox":action352 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditAccess":action353 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditOwnActivity":action354 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditAreas":action355 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:logActivity":action356 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:completeActivity":action357 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/marketing-handoff:acceptMarketingHandoff":action358 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:createOpportunity":action359 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:moveOpportunityStage":action360 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityValue":action361 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityCloseDate":action362 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityForecastCategory":action363 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityNextAction":action364 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:winOpportunity":action365 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:loseOpportunity":action366 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addStakeholder":action367 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addMilestone":action368 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:toggleMilestone":action369 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:checkProspectDuplicatesAction":action370 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createProspect":action371 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:assignProspect":action372 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:setProspectLifecycleStage":action373 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:convertProspect":action374 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createIndustry":action375 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:saveProspectGrouping":action376 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setupFinance":action377 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceDocument":action378 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:submitFinanceDocument":action379 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveApprovalPolicy":action380 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:decideFinanceApproval":action381 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPurchaseOrder":action382 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:raiseServiceCredit":action383 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postFinanceDocument":action384 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:recordGoodsReceipt":action385 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:onboardSupplier":action386 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveSupplier":action387 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:requestSupplierBankChange":action388 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:verifySupplierBank":action389 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceBank":action390 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:importBankTransactions":action391 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocateBankTransaction":action392 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPaymentRun":action393 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approvePaymentRun":action394 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createManualJournal":action395 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveManualJournal":action396 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:reverseJournal":action397 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setFinancePeriodState":action398 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceBudget":action399 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceAsset":action400 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postAssetDepreciation":action401 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:completeCloseTask":action402 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceContract":action403 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceScenario":action404 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:receiptForm":action405 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:journalForm":action406 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:statementForm":action407 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocationForm":action408 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:paymentRunForm":action409 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:policyForm":action410 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:scenarioForm":action411 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:uploadFinanceAttachment":action412 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateSalesInvoice":action413 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateInvoiceAdjustment":action414 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:voidFinanceDraft":action415 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceHome":action416 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:listFinanceDocuments":action417 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceDocument":action418 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceWorkspace":action419 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:financeChoices":action420 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getBudgetPositions":action421 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getInvoiceCashForecast":action422 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinancialReport":action423 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceCustomerContribution":action424 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:searchFinance":action425 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceAttachment":action426 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getSalesFinanceProjection":action427 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getReceivingWarehouses":action428 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:createProductionOrder":action429 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:markOrderReady":action430 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:releaseOrder":action431 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:closeOrder":action432 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:startWorkOrder":action433 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:pauseWorkOrder":action434 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:completeWorkOrder":action435 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:listForecasts":action436 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:setForecast":action437 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:deleteForecast":action438 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:runMrp":action439 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:firmSuggestion":action440 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:dismissSuggestion":action441 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:latestPlan":action442 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:loadPlant":action443 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveWorkCentre":action444 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveMachine":action445 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:retirePlantRecord":action446 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:schedulePreview":action447 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:rescheduleWorkOrder":action448 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:setWorkOrderLock":action449 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:listShifts":action450 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:saveShift":action451 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:deleteShift":action452 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createCampaign":action453 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updateCampaign":action454 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProfile":action455 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:recordPermission":action456 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:suppressProfile":action457 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createAudience":action458 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:previewAudience":action459 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createContent":action460 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:approveContent":action461 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createMessage":action462 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:lockSend":action463 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:cancelSend":action464 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:ingestEvent":action465 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourney":action466 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:publishJourney":action467 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:reviseJourney":action468 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProgram":action469 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createExperiment":action470 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:leadFeedback":action471 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:processJourneySteps":action472 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:saveMarketingPlan":action473 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addPlanActivity":action474 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updatePlanActivity":action475 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addBudgetLine":action476 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:submitBudgetToFinance":action477 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourneyMap":action478 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyStage":action479 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyTouch":action480 as (...args:never[])=>Promise<unknown>,
"src/modules/people/services/finance-expenses:getApprovedExpenseSource":action481 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createPlan":action482 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveCell":action483 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addMeasure":action484 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAssumption":action485 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDriver":action486 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addLink":action487 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createScenario":action488 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:promoteScenario":action489 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:submitPlan":action490 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:approvePlan":action491 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:lockPlan":action492 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addGoal":action493 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addInitiative":action494 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createProjectForInitiative":action495 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAction":action496 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeAction":action497 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addRisk":action498 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDependency":action499 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDecision":action500 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addComment":action501 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addUpdate":action502 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeReview":action503 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addReview":action504 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:distributeTargets":action505 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:importGrid":action506 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:sharePlan":action507 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:unsharePlan":action508 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:setPlanAudience":action509 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addNote":action510 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveGoalProgress":action511 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:savePlanBrief":action512 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:listProductionPlans":action513 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getPlanOptions":action514 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getProductionPlan":action515 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:createProductionPlan":action516 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:addProductionPlanLine":action517 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getAssignedPlanningWork":action518 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/queries:getPlanningCoverage":action519 as (...args:never[])=>Promise<unknown>,
"src/modules/products/services/make:saveProductRecipe":action520 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createSpecification":action521 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:setSpecificationStatus":action522 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createControlPoint":action523 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:executeInspection":action524 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:releaseHold":action525 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:reportNcr":action526 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrInvestigation":action527 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:addNcrAction":action528 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrAction":action529 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:closeNcr":action530 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSubstance":action531 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addSafetyDataSheet":action532 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCoshhAssessment":action533 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveSubstance":action534 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCompetence":action535 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSafetyDocument":action536 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:acknowledgeDocument":action537 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveAudit":action538 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addAuditFinding":action539 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveAudit":action540 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveChange":action541 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:advanceChange":action542 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:linkSafetyRecord":action543 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveSafetyProfile":action544 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRiskMatrix":action545 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createRisk":action546 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addControl":action547 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:rateAssessment":action548 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:approveAssessment":action549 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviseAssessment":action550 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:requestRiskReview":action551 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reportIncident":action552 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveImmediateControl":action553 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:openInvestigation":action554 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addCause":action555 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRootCause":action556 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviewRiddor":action557 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createSafetyAction":action558 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:advanceAction":action559 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:verifyAction":action560 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveWorkplaceRecord":action561 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createPermit":action562 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:advancePermit":action563 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:extendPermit":action564 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createIsolation":action565 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:applyIsolationLock":action566 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:verifyIsolation":action567 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:clearIsolation":action568 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:removeIsolationLock":action569 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:placeSafetyHold":action570 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:updateReturnToService":action571 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:releaseSafetyHold":action572 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:overrideSafetyHold":action573 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:saveStatutoryCheck":action574 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:completeInspection":action575 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createInspection":action576 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/address-actions:createSalesAddress":action577 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/catalogue-actions:createSalesCatalogueProduct":action578 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:sendQuote":action579 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:changeQuoteStatus":action580 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:duplicateDocument":action581 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:saveQuoteTemplate":action582 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:createOrderFromQuote":action583 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:linkCommercialProject":action584 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:openCallOffOrder":action585 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:raiseCallOff":action586 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:invoiceCallOffDelivery":action587 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:deliverAndInvoiceCallOff":action588 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/documents:saveDocument":action589 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:saveInvoiceTemplate":action590 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:retireInvoiceTemplate":action591 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:attachCustomerInvoiceTemplate":action592 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:detachCustomerInvoiceTemplate":action593 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:createDraftOrder":action594 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addOrderLine":action595 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:removeOrderLine":action596 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:updateDraftOrderFields":action597 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:confirmOrder":action598 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:decideApproval":action599 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendLineQuantity":action600 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:overrideLinePrice":action601 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendRequestedDate":action602 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelOrder":action603 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelLineRemaining":action604 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addHold":action605 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:releaseHold":action606 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:restoreCancelledOrder":action607 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:returnOrderToQuote":action608 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:saveOrderHashtags":action609 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:saveSalesView":action610 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:archiveSalesView":action611 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createCase":action612 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateCase":action613 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:assignCase":action614 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:transitionCase":action615 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addCaseEntry":action616 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createDepartmentTicket":action617 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateDepartmentTicket":action618 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createQueue":action619 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addQueueMember":action620 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:linkCaseRecord":action621 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:creditChoices":action622 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:askFinanceForCredit":action623 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getCaseOwners":action624 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getDepartmentWork":action625 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readAvailability":action626 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readOrderChain":action627 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/export:inventoryExportRows":action628 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:createTeam":action629 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:renameTeam":action630 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:addMember":action631 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMember":action632 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveTask":action633 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:setTaskStatus":action634 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeTask":action635 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveCover":action636 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeCover":action637 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveHandover":action638 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:savePlace":action639 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveMoment":action640 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMoment":action641 as (...args:never[])=>Promise<unknown>
};
