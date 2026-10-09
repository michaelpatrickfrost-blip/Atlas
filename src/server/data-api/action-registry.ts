// Generated allowlist: public calls still enforce their own server capabilities.
import {withAdminActionAliases} from "./action-aliases";
import {updateCompanyAccount as action0} from "@/app/(admin)/atlas/actions";
import {saveCompanyEntitlements as action1} from "@/app/(admin)/atlas/actions";
import {createCompanyAccount as action2} from "@/app/(admin)/atlas/actions";
import {deleteTestCompany as action3} from "@/app/(admin)/atlas/actions";
import {openCompanyWorkspace as action4} from "@/app/(admin)/atlas/admin-actions";
import {saveAtlasUserProfile as action5} from "@/app/(admin)/atlas/admin-actions";
import {saveAtlasUserAccess as action6} from "@/app/(admin)/atlas/admin-actions";
import {revokeAtlasUserSessions as action7} from "@/app/(admin)/atlas/admin-actions";
import {issueAtlasUserRecovery as action8} from "@/app/(admin)/atlas/admin-actions";
import {createAtlasStaff as action9} from "@/app/(admin)/atlas/admin-actions";
import {updateAtlasStaff as action10} from "@/app/(admin)/atlas/admin-actions";
import {saveAtlasStaffProfile as action11} from "@/app/(admin)/atlas/admin-actions";
import {issueAtlasStaffRecovery as action12} from "@/app/(admin)/atlas/admin-actions";
import {archiveAtlasCompany as action13} from "@/app/(admin)/atlas/admin-actions";
import {saveAtlasCompanyProfile as action14} from "@/app/(admin)/atlas/admin-actions";
import {saveAtlasCompanyBrand as action15} from "@/app/(admin)/atlas/admin-actions";
import {deleteSelectedTestCompanies as action16} from "@/app/(admin)/atlas/cleanup/actions";
import {retryCompanyFileCleanup as action17} from "@/app/(admin)/atlas/cleanup/actions";
import {attachConnection as action18} from "@/app/(admin)/atlas/connections/actions";
import {requestGuardianSweep as action19} from "@/app/(admin)/atlas/guardian/actions";
import {updateGuardianIssue as action20} from "@/app/(admin)/atlas/guardian/actions";
import {importCompanySetup as action21} from "@/app/(admin)/atlas/setup-actions";
import {createCompanyUser as action22} from "@/app/(admin)/atlas/setup-actions";
import {setCompanyUserStatus as action23} from "@/app/(admin)/atlas/setup-actions";
import {loadEmailRecord as action24} from "@/app/(app)/_shared/record-email-actions";
import {sendRecordEmailAction as action25} from "@/app/(app)/_shared/record-email-actions";
import {sendRecordContractAction as action26} from "@/app/(app)/_shared/record-email-actions";
import {sendQuoteForApprovalAction as action27} from "@/app/(app)/_shared/record-email-actions";
import {loadLiveMetrics as action28} from "@/app/(app)/analytics/actions";
import {loadMetricSlice as action29} from "@/app/(app)/analytics/actions";
import {saveAnalyticsDashboard as action30} from "@/app/(app)/analytics/actions";
import {deleteAnalyticsDashboard as action31} from "@/app/(app)/analytics/actions";
import {loadLiveGoalMarkers as action32} from "@/app/(app)/analytics/actions";
import {loadDashboardData as action33} from "@/app/(app)/analytics/actions";
import {loadDashboardSnapshot as action34} from "@/app/(app)/analytics/actions";
import {toggleModuleAction as action35} from "@/app/(app)/apps/actions";
import {postMessage as action36} from "@/app/(app)/chat/actions";
import {searchChatPeople as action37} from "@/app/(app)/chat/actions";
import {openChat as action38} from "@/app/(app)/chat/actions";
import {openDirectChat as action39} from "@/app/(app)/chat/actions";
import {searchChatRecords as action40} from "@/app/(app)/chat/actions";
import {sendChat as action41} from "@/app/(app)/chat/actions";
import {chatSnapshot as action42} from "@/app/(app)/chat/actions";
import {createDealContract as action43} from "@/app/(app)/crm/contracts/actions";
import {updateValueFormAction as action44} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {updateCloseDateFormAction as action45} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {setNextActionFormAction as action46} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {setForecastCategoryFormAction as action47} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {winFormAction as action48} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {loseFormAction as action49} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addStakeholderFormAction as action50} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addMilestoneFormAction as action51} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {toggleMilestoneFormAction as action52} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {logOpportunityActivityFormAction as action53} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addDealAction as action54} from "@/app/(app)/crm/pipeline/actions";
import {qualifyFormAction as action55} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {disqualifyFormAction as action56} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {nurtureFormAction as action57} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {logProspectActivityFormAction as action58} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {assignProspectFormAction as action59} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {assignProspectTaskFormAction as action60} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {convertProspectFormAction as action61} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {pinReportToDashboard as action62} from "@/app/(app)/crm/reports/actions";
import {createContactFormAction as action63} from "@/app/(app)/customers/[partyId]/actions";
import {updateContactFormAction as action64} from "@/app/(app)/customers/[partyId]/actions";
import {deleteContactFormAction as action65} from "@/app/(app)/customers/[partyId]/actions";
import {createAddressFormAction as action66} from "@/app/(app)/customers/[partyId]/actions";
import {createTaxRegistrationFormAction as action67} from "@/app/(app)/customers/[partyId]/actions";
import {markTaxVerifiedFormAction as action68} from "@/app/(app)/customers/[partyId]/actions";
import {createBankAccountFormAction as action69} from "@/app/(app)/customers/[partyId]/actions";
import {createDirectDebitFormAction as action70} from "@/app/(app)/customers/[partyId]/actions";
import {cancelDirectDebitFormAction as action71} from "@/app/(app)/customers/[partyId]/actions";
import {updateCreditLimitFormAction as action72} from "@/app/(app)/customers/[partyId]/actions";
import {toggleCreditHoldFormAction as action73} from "@/app/(app)/customers/[partyId]/actions";
import {createNoteFormAction as action74} from "@/app/(app)/customers/[partyId]/actions";
import {updateStatusFormAction as action75} from "@/app/(app)/customers/[partyId]/actions";
import {archiveCustomerFormAction as action76} from "@/app/(app)/customers/[partyId]/actions";
import {unarchiveCustomerFormAction as action77} from "@/app/(app)/customers/[partyId]/actions";
import {deleteCustomerFormAction as action78} from "@/app/(app)/customers/[partyId]/actions";
import {createKpi as action79} from "@/app/(app)/kpis/actions";
import {saveGoal as action80} from "@/app/(app)/kpis/actions";
import {updateKpi as action81} from "@/app/(app)/kpis/actions";
import {recordProgress as action82} from "@/app/(app)/kpis/actions";
import {closeGoal as action83} from "@/app/(app)/kpis/actions";
import {addPlanGoal as action84} from "@/app/(app)/kpis/actions";
import {closePlan as action85} from "@/app/(app)/kpis/actions";
import {commentOnPlan as action86} from "@/app/(app)/kpis/actions";
import {connectGoal as action87} from "@/app/(app)/kpis/actions";
import {syncDemandAction as action88} from "@/app/(app)/logistics/actions";
import {restoreDeliveryAction as action89} from "@/app/(app)/logistics/actions";
import {releaseAction as action90} from "@/app/(app)/logistics/actions";
import {allocateAction as action91} from "@/app/(app)/logistics/actions";
import {directShipAction as action92} from "@/app/(app)/logistics/actions";
import {groupAction as action93} from "@/app/(app)/logistics/actions";
import {scanAction as action94} from "@/app/(app)/logistics/actions";
import {lotAction as action95} from "@/app/(app)/logistics/actions";
import {serialAction as action96} from "@/app/(app)/logistics/actions";
import {shortAction as action97} from "@/app/(app)/logistics/actions";
import {completeWorkAction as action98} from "@/app/(app)/logistics/actions";
import {claimAction as action99} from "@/app/(app)/logistics/actions";
import {shipFromPickAction as action100} from "@/app/(app)/logistics/actions";
import {packageAction as action101} from "@/app/(app)/logistics/actions";
import {weightAction as action102} from "@/app/(app)/logistics/actions";
import {stageAction as action103} from "@/app/(app)/logistics/actions";
import {labelAction as action104} from "@/app/(app)/logistics/actions";
import {dispatchAction as action105} from "@/app/(app)/logistics/actions";
import {trackingAction as action106} from "@/app/(app)/logistics/actions";
import {deliverAction as action107} from "@/app/(app)/logistics/actions";
import {loadCreateAction as action108} from "@/app/(app)/logistics/actions";
import {loadScanAction as action109} from "@/app/(app)/logistics/actions";
import {departAction as action110} from "@/app/(app)/logistics/actions";
import {expectAction as action111} from "@/app/(app)/logistics/actions";
import {receiveLineAction as action112} from "@/app/(app)/logistics/actions";
import {putAwayAction as action113} from "@/app/(app)/logistics/actions";
import {completeReceiptAction as action114} from "@/app/(app)/logistics/actions";
import {transferAction as action115} from "@/app/(app)/logistics/actions";
import {transferReceiveAction as action116} from "@/app/(app)/logistics/actions";
import {returnRequestAction as action117} from "@/app/(app)/logistics/actions";
import {authoriseReturnAction as action118} from "@/app/(app)/logistics/actions";
import {receiveReturnAction as action119} from "@/app/(app)/logistics/actions";
import {inspectAction as action120} from "@/app/(app)/logistics/actions";
import {closeReturnAction as action121} from "@/app/(app)/logistics/actions";
import {assignEquipmentAction as action122} from "@/app/(app)/logistics/actions";
import {packUnitAction as action123} from "@/app/(app)/logistics/actions";
import {saveHandlingTypeAction as action124} from "@/app/(app)/logistics/actions";
import {retireHandlingTypeAction as action125} from "@/app/(app)/logistics/actions";
import {removeHandlingTypeAction as action126} from "@/app/(app)/logistics/actions";
import {policyAction as action127} from "@/app/(app)/logistics/actions";
import {runMrpAction as action128} from "@/app/(app)/manufacturing/planning/actions";
import {firmPlannedOrderAction as action129} from "@/app/(app)/manufacturing/planning/actions";
import {dismissPlannedOrderAction as action130} from "@/app/(app)/manufacturing/planning/actions";
import {setForecastAction as action131} from "@/app/(app)/manufacturing/planning/forecast/actions";
import {deleteForecastAction as action132} from "@/app/(app)/manufacturing/planning/forecast/actions";
import {runMrpForm as action133} from "@/app/(app)/manufacturing/planning/form-actions";
import {firmPlannedOrderForm as action134} from "@/app/(app)/manufacturing/planning/form-actions";
import {dismissPlannedOrderForm as action135} from "@/app/(app)/manufacturing/planning/form-actions";
import {raiseProductionOrderAction as action136} from "@/app/(app)/manufacturing/produce/actions";
import {previewMoveAction as action137} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {commitMoveAction as action138} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {toggleLockAction as action139} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {saveShiftAction as action140} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {deleteShiftAction as action141} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {startAction as action142} from "@/app/(app)/manufacturing/shop-floor/actions";
import {pauseAction as action143} from "@/app/(app)/manufacturing/shop-floor/actions";
import {completeAction as action144} from "@/app/(app)/manufacturing/shop-floor/actions";
import {loadNotices as action145} from "@/app/(app)/notices/actions";
import {clearNotice as action146} from "@/app/(app)/notices/actions";
import {clearNotices as action147} from "@/app/(app)/notices/actions";
import {createPayrollRun as action148} from "@/app/(app)/payroll/actions";
import {updatePayslipDeductions as action149} from "@/app/(app)/payroll/actions";
import {finalisePayrollRun as action150} from "@/app/(app)/payroll/actions";
import {markPayrollRunPaid as action151} from "@/app/(app)/payroll/actions";
import {savePayrollSettings as action152} from "@/app/(app)/payroll/actions";
import {issueP45 as action153} from "@/app/(app)/payroll/actions";
import {issueP60 as action154} from "@/app/(app)/payroll/actions";
import {logAbsence as action155} from "@/app/(app)/people/absence/actions";
import {requestLeave as action156} from "@/app/(app)/people/absence/actions";
import {cancelOwnLeave as action157} from "@/app/(app)/people/absence/actions";
import {approveLeaveRequest as action158} from "@/app/(app)/people/absence/actions";
import {setLeaveAllowance as action159} from "@/app/(app)/people/absence/actions";
import {rejectLeaveRequest as action160} from "@/app/(app)/people/absence/actions";
import {createEmployee as action161} from "@/app/(app)/people/actions";
import {changeEmployeeStatus as action162} from "@/app/(app)/people/actions";
import {updateEmployeeProfile as action163} from "@/app/(app)/people/actions";
import {updateOwnEmployeeDetails as action164} from "@/app/(app)/people/actions";
import {addEmployeeDocument as action165} from "@/app/(app)/people/actions";
import {linkEmployeeToUser as action166} from "@/app/(app)/people/actions";
import {completeEmployeeTask as action167} from "@/app/(app)/people/actions";
import {addEmployeeTask as action168} from "@/app/(app)/people/actions";
import {updateEmployeeContact as action169} from "@/app/(app)/people/actions";
import {updateEmployeeTask as action170} from "@/app/(app)/people/actions";
import {scheduleAppraisal as action171} from "@/app/(app)/people/appraisals/actions";
import {completeAppraisal as action172} from "@/app/(app)/people/appraisals/actions";
import {getConductDesk as action173} from "@/app/(app)/people/conduct/actions";
import {getMyConduct as action174} from "@/app/(app)/people/conduct/actions";
import {getPlan as action175} from "@/app/(app)/people/conduct/actions";
import {getCase as action176} from "@/app/(app)/people/conduct/actions";
import {conductChoices as action177} from "@/app/(app)/people/conduct/actions";
import {savePlan as action178} from "@/app/(app)/people/conduct/actions";
import {addPlanReview as action179} from "@/app/(app)/people/conduct/actions";
import {commentOnPlan as action180} from "@/app/(app)/people/conduct/actions";
import {saveCase as action181} from "@/app/(app)/people/conduct/actions";
import {respondToCase as action182} from "@/app/(app)/people/conduct/actions";
import {addCaseEvent as action183} from "@/app/(app)/people/conduct/actions";
import {submitExpenseClaim as action184} from "@/app/(app)/people/expenses/actions";
import {approveExpenseClaim as action185} from "@/app/(app)/people/expenses/actions";
import {rejectExpenseClaim as action186} from "@/app/(app)/people/expenses/actions";
import {scheduleOneToOne as action187} from "@/app/(app)/people/one-to-ones/actions";
import {completeOneToOne as action188} from "@/app/(app)/people/one-to-ones/actions";
import {saveVacancy as action189} from "@/app/(app)/people/platform-actions";
import {saveApplication as action190} from "@/app/(app)/people/platform-actions";
import {saveTraining as action191} from "@/app/(app)/people/platform-actions";
import {saveHRDocument as action192} from "@/app/(app)/people/platform-actions";
import {listPolicies as action193} from "@/app/(app)/people/policies/actions";
import {publishPolicy as action194} from "@/app/(app)/people/policies/actions";
import {archivePolicy as action195} from "@/app/(app)/people/policies/actions";
import {openPolicy as action196} from "@/app/(app)/people/policies/actions";
import {createShift as action197} from "@/app/(app)/people/rotas/actions";
import {changeShiftStatus as action198} from "@/app/(app)/people/rotas/actions";
import {getMyHR as action199} from "@/app/(app)/people/self-service";
import {getMyTeam as action200} from "@/app/(app)/people/self-service";
import {getTeamEmployee as action201} from "@/app/(app)/people/self-service";
import {addPrivateNote as action202} from "@/app/(app)/people/self-service";
import {updateWorkingPattern as action203} from "@/app/(app)/people/self-service";
import {updateHrSettings as action204} from "@/app/(app)/people/settings/actions";
import {createAppraisalTemplate as action205} from "@/app/(app)/people/settings/actions";
import {toggleAppraisalTemplateActive as action206} from "@/app/(app)/people/settings/actions";
import {createOneToOneTemplate as action207} from "@/app/(app)/people/settings/actions";
import {toggleOneToOneTemplateActive as action208} from "@/app/(app)/people/settings/actions";
import {getTimesheetContext as action209} from "@/app/(app)/people/timesheets/actions";
import {saveTimesheet as action210} from "@/app/(app)/people/timesheets/actions";
import {reviewTimesheet as action211} from "@/app/(app)/people/timesheets/actions";
import {createPriceList as action212} from "@/app/(app)/pricing/actions";
import {savePriceEntry as action213} from "@/app/(app)/pricing/actions";
import {saveRule as action214} from "@/app/(app)/pricing/actions";
import {setRuleActive as action215} from "@/app/(app)/pricing/actions";
import {updatePriceBasis as action216} from "@/app/(app)/pricing/actions";
import {renamePriceList as action217} from "@/app/(app)/pricing/actions";
import {assignPriceListCustomers as action218} from "@/app/(app)/pricing/actions";
import {checkSalesPrice as action219} from "@/app/(app)/pricing/actions";
import {assignPriceList as action220} from "@/app/(app)/pricing/actions";
import {previewPriceCsv as action221} from "@/app/(app)/pricing/actions";
import {applyPriceCsv as action222} from "@/app/(app)/pricing/actions";
import {saveAgreement as action223} from "@/app/(app)/pricing/actions";
import {saveAgreementPrice as action224} from "@/app/(app)/pricing/actions";
import {removeAgreementPrice as action225} from "@/app/(app)/pricing/actions";
import {previewAgreementCsv as action226} from "@/app/(app)/pricing/actions";
import {applyAgreementCsv as action227} from "@/app/(app)/pricing/actions";
import {saveProduct as action228} from "@/app/(app)/products/actions";
import {saveProductRecord as action229} from "@/app/(app)/products/actions";
import {saveCategory as action230} from "@/app/(app)/products/actions";
import {retireCategory as action231} from "@/app/(app)/products/actions";
import {addStandardCategories as action232} from "@/app/(app)/products/actions";
import {savePack as action233} from "@/app/(app)/products/actions";
import {saveLinks as action234} from "@/app/(app)/products/actions";
import {saveMeasures as action235} from "@/app/(app)/products/actions";
import {saveProfile as action236} from "@/app/(app)/profile/actions";
import {loadAssignedWork as action237} from "@/app/(app)/profile/work";
import {createProject as action238} from "@/app/(app)/projects/actions";
import {changeProjectStatus as action239} from "@/app/(app)/projects/actions";
import {editProject as action240} from "@/app/(app)/projects/actions";
import {setProjectMember as action241} from "@/app/(app)/projects/actions";
import {archiveProject as action242} from "@/app/(app)/projects/actions";
import {createTask as action243} from "@/app/(app)/projects/actions";
import {changeTaskStatus as action244} from "@/app/(app)/projects/actions";
import {editTask as action245} from "@/app/(app)/projects/actions";
import {checklistItem as action246} from "@/app/(app)/projects/actions";
import {addDependency as action247} from "@/app/(app)/projects/actions";
import {createMeeting as action248} from "@/app/(app)/projects/actions";
import {createDocument as action249} from "@/app/(app)/projects/actions";
import {editDocument as action250} from "@/app/(app)/projects/actions";
import {addComment as action251} from "@/app/(app)/projects/actions";
import {createMilestone as action252} from "@/app/(app)/projects/actions";
import {publishUpdate as action253} from "@/app/(app)/projects/actions";
import {createDecision as action254} from "@/app/(app)/projects/actions";
import {decide as action255} from "@/app/(app)/projects/actions";
import {createRisk as action256} from "@/app/(app)/projects/actions";
import {closeRisk as action257} from "@/app/(app)/projects/actions";
import {requestApproval as action258} from "@/app/(app)/projects/actions";
import {respondApproval as action259} from "@/app/(app)/projects/actions";
import {submitRequest as action260} from "@/app/(app)/projects/actions";
import {triageRequest as action261} from "@/app/(app)/projects/actions";
import {logTime as action262} from "@/app/(app)/projects/actions";
import {planToday as action263} from "@/app/(app)/projects/actions";
import {updateInbox as action264} from "@/app/(app)/projects/actions";
import {saveView as action265} from "@/app/(app)/projects/actions";
import {createPortfolio as action266} from "@/app/(app)/projects/actions";
import {createBaseline as action267} from "@/app/(app)/projects/actions";
import {setBudget as action268} from "@/app/(app)/projects/actions";
import {linkWork as action269} from "@/app/(app)/projects/actions";
import {getProjectActivity as action270} from "@/app/(app)/projects/actions";
import {createAutomation as action271} from "@/app/(app)/projects/actions";
import {toggleAutomation as action272} from "@/app/(app)/projects/actions";
import {saveProjectTemplate as action273} from "@/app/(app)/projects/actions";
import {useProjectTemplate as action274} from "@/app/(app)/projects/actions";
import {startTimer as action275} from "@/app/(app)/projects/actions";
import {stopTimer as action276} from "@/app/(app)/projects/actions";
import {projectPreference as action277} from "@/app/(app)/projects/actions";
import {uploadProjectFile as action278} from "@/app/(app)/projects/actions";
import {readProjectFile as action279} from "@/app/(app)/projects/actions";
import {createProperty as action280} from "@/app/(app)/projects/actions";
import {setProperty as action281} from "@/app/(app)/projects/actions";
import {restoreDocument as action282} from "@/app/(app)/projects/actions";
import {createTaskFromDocument as action283} from "@/app/(app)/projects/actions";
import {discardTimer as action284} from "@/app/(app)/projects/actions";
import {completeMilestone as action285} from "@/app/(app)/projects/actions";
import {resolveComment as action286} from "@/app/(app)/projects/actions";
import {getProjectWorkload as action287} from "@/app/(app)/projects/actions";
import {rescheduleTask as action288} from "@/app/(app)/projects/actions";
import {newContractAction as action289} from "@/app/(app)/sales/contracts/actions";
import {resendContractAction as action290} from "@/app/(app)/sales/contracts/actions";
import {deleteContractAction as action291} from "@/app/(app)/sales/contracts/actions";
import {createOrderForm as action292} from "@/app/(app)/sales/orders/actions";
import {addLineForm as action293} from "@/app/(app)/sales/orders/actions";
import {removeLineForm as action294} from "@/app/(app)/sales/orders/actions";
import {confirmOrderForm as action295} from "@/app/(app)/sales/orders/actions";
import {updateOrderForm as action296} from "@/app/(app)/sales/orders/actions";
import {chooseOrderAddresses as action297} from "@/app/(app)/sales/orders/actions";
import {addHoldForm as action298} from "@/app/(app)/sales/orders/actions";
import {releaseHoldForm as action299} from "@/app/(app)/sales/orders/actions";
import {approveOrderForm as action300} from "@/app/(app)/sales/orders/actions";
import {cancelOrderForm as action301} from "@/app/(app)/sales/orders/actions";
import {saveOrderHashtagsForm as action302} from "@/app/(app)/sales/orders/actions";
import {restoreCancelledOrderForm as action303} from "@/app/(app)/sales/orders/actions";
import {returnOrderToQuoteForm as action304} from "@/app/(app)/sales/orders/actions";
import {scheduleOrderDelivery as action305} from "@/app/(app)/sales/orders/actions";
import {rejectOrderApproval as action306} from "@/app/(app)/sales/orders/actions";
import {deleteOrderForm as action307} from "@/app/(app)/sales/orders/actions";
import {createQuote as action308} from "@/app/(app)/sales/quotes/actions";
import {deleteQuoteForm as action309} from "@/app/(app)/sales/quotes/actions";
import {saveCreationPolicy as action310} from "@/app/(app)/sales/settings/actions";
import {saveSiteAction as action311} from "@/app/(app)/sales/sites/actions";
import {setDocumentSiteAction as action312} from "@/app/(app)/sales/sites/actions";
import {getSchedule as action313} from "@/app/(app)/scheduling/actions";
import {createBulkShifts as action314} from "@/app/(app)/scheduling/actions";
import {setScheduledShift as action315} from "@/app/(app)/scheduling/actions";
import {completeShiftTask as action316} from "@/app/(app)/scheduling/actions";
import {editScheduledShift as action317} from "@/app/(app)/scheduling/actions";
import {publishWeekShifts as action318} from "@/app/(app)/scheduling/actions";
import {saveHoursBudget as action319} from "@/app/(app)/scheduling/actions";
import {getTeamPlan as action320} from "@/app/(app)/scheduling/actions";
import {getPersonSchedule as action321} from "@/app/(app)/scheduling/actions";
import {saveWorkType as action322} from "@/app/(app)/scheduling/actions";
import {archiveWorkType as action323} from "@/app/(app)/scheduling/actions";
import {saveDemand as action324} from "@/app/(app)/scheduling/actions";
import {saveBusyRule as action325} from "@/app/(app)/scheduling/actions";
import {removeBusyRule as action326} from "@/app/(app)/scheduling/actions";
import {fillTeamMonth as action327} from "@/app/(app)/scheduling/actions";
import {replanCover as action328} from "@/app/(app)/scheduling/actions";
import {publishMonth as action329} from "@/app/(app)/scheduling/actions";
import {saveShift as action330} from "@/app/(app)/scheduling/actions";
import {saveRole as action331} from "@/app/(app)/settings/actions";
import {saveMemberRoles as action332} from "@/app/(app)/settings/actions";
import {createUser as action333} from "@/app/(app)/settings/actions";
import {saveCompanyAccess as action334} from "@/app/(app)/settings/actions";
import {saveCompanyProfile as action335} from "@/app/(app)/settings/actions";
import {saveManagerPolicy as action336} from "@/app/(app)/settings/actions";
import {saveWorkspaceDetails as action337} from "@/app/(app)/settings/actions";
import {saveCompanyBrand as action338} from "@/app/(app)/settings/actions";
import {importCsv as action339} from "@/app/(app)/settings/imports/actions";
import {saveEmailAccount as action340} from "@/app/(app)/settings/it/actions";
import {verifyEmailAccount as action341} from "@/app/(app)/settings/it/actions";
import {sendTestEmail as action342} from "@/app/(app)/settings/it/actions";
import {makeDefaultAccount as action343} from "@/app/(app)/settings/it/actions";
import {setAccountActive as action344} from "@/app/(app)/settings/it/actions";
import {deleteEmailAccount as action345} from "@/app/(app)/settings/it/actions";
import {saveSocialAccount as action346} from "@/app/(app)/settings/it/actions";
import {deleteSocialAccount as action347} from "@/app/(app)/settings/it/actions";
import {checkSocialAccount as action348} from "@/app/(app)/settings/it/actions";
import {saveEmailTemplate as action349} from "@/app/(app)/settings/it/actions";
import {deleteEmailTemplate as action350} from "@/app/(app)/settings/it/actions";
import {checkInboxNow as action351} from "@/app/(app)/settings/it/actions";
import {saveDispatchDelivery as action352} from "@/app/(app)/settings/logistics/actions";
import {saveUserAccess as action353} from "@/app/(app)/settings/user-actions";
import {setUserStatus as action354} from "@/app/(app)/settings/user-actions";
import {revokeUserSessions as action355} from "@/app/(app)/settings/user-actions";
import {issuePasswordRecovery as action356} from "@/app/(app)/settings/user-actions";
import {createManagedUser as action357} from "@/app/(app)/settings/user-actions";
import {linkEmployeeProfile as action358} from "@/app/(app)/settings/user-actions";
import {createRole as action359} from "@/app/(app)/settings/user-actions";
import {saveManagementGroup as action360} from "@/app/(app)/settings/user-actions";
import {createWarehouse as action361} from "@/app/(app)/stock/actions";
import {adjustStock as action362} from "@/app/(app)/stock/actions";
import {savePlanningAction as action363} from "@/app/(app)/stock/actions";
import {makeFromForecastAction as action364} from "@/app/(app)/stock/actions";
import {transferStock as action365} from "@/app/(app)/stock/actions";
import {createSiteAction as action366} from "@/app/(app)/stock/actions";
import {createPlaceAction as action367} from "@/app/(app)/stock/actions";
import {assignSiteAction as action368} from "@/app/(app)/stock/actions";
import {addLocationAction as action369} from "@/app/(app)/stock/actions";
import {ensureLocationsAction as action370} from "@/app/(app)/stock/actions";
import {retireLocationAction as action371} from "@/app/(app)/stock/actions";
import {putOnLocationAction as action372} from "@/app/(app)/stock/actions";
import {moveLocatedAction as action373} from "@/app/(app)/stock/actions";
import {receiveMoveAction as action374} from "@/app/(app)/stock/actions";
import {create as action375} from "@/app/(app)/studio/actions";
import {save as action376} from "@/app/(app)/studio/actions";
import {validate as action377} from "@/app/(app)/studio/actions";
import {publish as action378} from "@/app/(app)/studio/actions";
import {activate as action379} from "@/app/(app)/studio/actions";
import {saveTemplate as action380} from "@/app/(app)/templates/actions";
import {archiveTemplate as action381} from "@/app/(app)/templates/actions";
import {generateTemplateDocument as action382} from "@/app/(app)/templates/actions";
import {delegateApprovals as action383} from "@/core/approvals/actions";
import {loginAction as action384} from "@/core/auth/actions";
import {logoutAction as action385} from "@/core/auth/actions";
import {logoutAdminAction as action386} from "@/core/auth/actions";
import {completePasswordRecovery as action387} from "@/core/auth/security-actions";
import {changeOwnPassword as action388} from "@/core/auth/security-actions";
import {signOutOtherSessions as action389} from "@/core/auth/security-actions";
import {createContract as action390} from "@/core/contracts/actions";
import {sendContract as action391} from "@/core/contracts/actions";
import {shareContractLink as action392} from "@/core/contracts/actions";
import {updateDraftContract as action393} from "@/core/contracts/actions";
import {revokeContract as action394} from "@/core/contracts/actions";
import {deleteContract as action395} from "@/core/contracts/actions";
import {signContract as action396} from "@/core/contracts/actions";
import {returnSignedContract as action397} from "@/core/contracts/actions";
import {reviewContractReturn as action398} from "@/core/contracts/actions";
import {declineContract as action399} from "@/core/contracts/actions";
import {loadPublicContract as action400} from "@/core/contracts/actions";
import {loadPublicContractFile as action401} from "@/core/contracts/actions";
import {checkForDuplicatesAction as action402} from "@/core/customers/actions";
import {createCustomerAction as action403} from "@/core/customers/actions";
import {createCustomer as action404} from "@/core/customers/commands";
import {updateCustomerStatus as action405} from "@/core/customers/commands";
import {archiveCustomer as action406} from "@/core/customers/commands";
import {unarchiveCustomer as action407} from "@/core/customers/commands";
import {deleteCustomer as action408} from "@/core/customers/commands";
import {createContact as action409} from "@/core/customers/commands";
import {updateContact as action410} from "@/core/customers/commands";
import {deleteContact as action411} from "@/core/customers/commands";
import {createAddress as action412} from "@/core/customers/commands";
import {updateCommercialSettings as action413} from "@/core/customers/commands";
import {updateCreditLimit as action414} from "@/core/customers/commands";
import {setCreditHold as action415} from "@/core/customers/commands";
import {setPaymentTerm as action416} from "@/core/customers/commands";
import {createTaxRegistration as action417} from "@/core/customers/commands";
import {markTaxRegistrationManuallyVerified as action418} from "@/core/customers/commands";
import {createBankAccount as action419} from "@/core/customers/commands";
import {revealBankAccount as action420} from "@/core/customers/commands";
import {createDirectDebitMandate as action421} from "@/core/customers/commands";
import {cancelDirectDebitMandate as action422} from "@/core/customers/commands";
import {createNote as action423} from "@/core/customers/commands";
import {saveCustomerHashtags as action424} from "@/core/customers/commands";
import {updateCustomerDetails as action425} from "@/core/customers/commands";
import {updateAddress as action426} from "@/core/customers/commands";
import {archiveAddress as action427} from "@/core/customers/commands";
import {saveOrderingPreferences as action428} from "@/core/customers/commercial-actions";
import {setCustomerParent as action429} from "@/core/customers/hierarchy-actions";
import {placeCustomer as action430} from "@/core/customers/hierarchy-actions";
import {moveCustomer as action431} from "@/core/customers/hierarchy-actions";
import {setContactReportsTo as action432} from "@/core/customers/hierarchy-actions";
import {saveCustomerTradingLink as action433} from "@/core/customers/trading-actions";
import {setInvoiceAccount as action434} from "@/core/customers/trading-actions";
import {archiveCustomerTradingLink as action435} from "@/core/customers/trading-actions";
import {requestSalesInvoice as action436} from "@/core/finance/actions";
import {createWork as action437} from "@/core/service-work/actions";
import {updateWork as action438} from "@/core/service-work/actions";
import {commentWork as action439} from "@/core/service-work/actions";
import {watchWork as action440} from "@/core/service-work/actions";
import {mergeWork as action441} from "@/core/service-work/actions";
import {requestWorkApproval as action442} from "@/core/service-work/actions";
import {decideWorkApproval as action443} from "@/core/service-work/actions";
import {saveDeskQueue as action444} from "@/core/service-work/actions";
import {changeDeskMember as action445} from "@/core/service-work/actions";
import {attachServiceFile as action446} from "@/core/service-work/file-actions";
import {saveKnowledge as action447} from "@/core/service-work/knowledge";
import {createWorkTeam as action448} from "@/core/teams/actions";
import {loadAuditBoard as action449} from "@/modules/audit/services/actions";
import {exportAuditReport as action450} from "@/modules/audit/services/actions";
import {loadEcho as action451} from "@/modules/audit/services/actions";
import {postEchoNote as action452} from "@/modules/audit/services/actions";
import {loadEchoInbox as action453} from "@/modules/audit/services/actions";
import {loadAuditAccess as action454} from "@/modules/audit/services/actions";
import {saveAuditOwnActivity as action455} from "@/modules/audit/services/actions";
import {saveAuditAreas as action456} from "@/modules/audit/services/actions";
import {saveAutomation as action457} from "@/modules/automations/services/actions";
import {setAutomationEnabled as action458} from "@/modules/automations/services/actions";
import {deleteAutomation as action459} from "@/modules/automations/services/actions";
import {testOnPastEvent as action460} from "@/modules/automations/services/actions";
import {runNow as action461} from "@/modules/automations/services/actions";
import {logActivity as action462} from "@/modules/crm/services/activities";
import {completeActivity as action463} from "@/modules/crm/services/activities";
import {saveAppointment as action464} from "@/modules/crm/services/appointments";
import {finishAppointment as action465} from "@/modules/crm/services/appointments";
import {saveAppointmentForm as action466} from "@/modules/crm/services/appointments";
import {finishAppointmentForm as action467} from "@/modules/crm/services/appointments";
import {acceptMarketingHandoff as action468} from "@/modules/crm/services/marketing-handoff";
import {createOpportunity as action469} from "@/modules/crm/services/opportunities";
import {moveOpportunityStage as action470} from "@/modules/crm/services/opportunities";
import {updateOpportunityValue as action471} from "@/modules/crm/services/opportunities";
import {updateOpportunityCloseDate as action472} from "@/modules/crm/services/opportunities";
import {setOpportunityForecastCategory as action473} from "@/modules/crm/services/opportunities";
import {setOpportunityNextAction as action474} from "@/modules/crm/services/opportunities";
import {winOpportunity as action475} from "@/modules/crm/services/opportunities";
import {loseOpportunity as action476} from "@/modules/crm/services/opportunities";
import {addStakeholder as action477} from "@/modules/crm/services/opportunities";
import {addMilestone as action478} from "@/modules/crm/services/opportunities";
import {toggleMilestone as action479} from "@/modules/crm/services/opportunities";
import {checkProspectDuplicatesAction as action480} from "@/modules/crm/services/prospects";
import {createProspect as action481} from "@/modules/crm/services/prospects";
import {assignProspect as action482} from "@/modules/crm/services/prospects";
import {setProspectLifecycleStage as action483} from "@/modules/crm/services/prospects";
import {convertProspect as action484} from "@/modules/crm/services/prospects";
import {createIndustry as action485} from "@/modules/crm/services/prospects";
import {saveProspectGrouping as action486} from "@/modules/crm/services/prospects";
import {createSalesProject as action487} from "@/modules/crm/services/sales-projects-commands";
import {createSalesProjectFormAction as action488} from "@/modules/crm/services/sales-projects-commands";
import {saveSalesProjectAction as action489} from "@/modules/crm/services/sales-projects-commands";
import {saveNextActionAction as action490} from "@/modules/crm/services/sales-projects-commands";
import {addProjectOrganisationAction as action491} from "@/modules/crm/services/sales-projects-commands";
import {removeProjectOrganisationAction as action492} from "@/modules/crm/services/sales-projects-commands";
import {makePrimaryOrganisationAction as action493} from "@/modules/crm/services/sales-projects-commands";
import {addProjectStakeholderAction as action494} from "@/modules/crm/services/sales-projects-commands";
import {removeProjectStakeholderAction as action495} from "@/modules/crm/services/sales-projects-commands";
import {setDocumentSalesProjectAction as action496} from "@/modules/crm/services/sales-projects-commands";
import {deleteSalesProjectAction as action497} from "@/modules/crm/services/sales-projects-commands";
import {saveSurvey as action498} from "@/modules/csat/services/actions";
import {createSurveyFromTemplate as action499} from "@/modules/csat/services/actions";
import {setSurveyActive as action500} from "@/modules/csat/services/actions";
import {deleteSurvey as action501} from "@/modules/csat/services/actions";
import {recordCsatScore as action502} from "@/modules/csat/services/actions";
import {recordCsatComment as action503} from "@/modules/csat/services/actions";
import {saveEngineeringRevision as action504} from "@/modules/engineering/services/commands";
import {transitionEngineeringRevision as action505} from "@/modules/engineering/services/commands";
import {uploadEngineeringDrawing as action506} from "@/modules/engineering/services/commands";
import {saveFieldJob as action507} from "@/modules/fieldservice/services/commands";
import {updateFieldJob as action508} from "@/modules/fieldservice/services/commands";
import {addFieldJobNote as action509} from "@/modules/fieldservice/services/commands";
import {importFinanceStatement as action510} from "@/modules/finance/services/banking";
import {reconcileFinanceStatement as action511} from "@/modules/finance/services/banking";
import {financeReconciliationForm as action512} from "@/modules/finance/services/banking";
import {getFinanceReconciliation as action513} from "@/modules/finance/services/banking";
import {importFinanceStatementForm as action514} from "@/modules/finance/services/banking";
import {getFinanceCollections as action515} from "@/modules/finance/services/collections";
import {recordFinanceCollection as action516} from "@/modules/finance/services/collections";
import {setupFinance as action517} from "@/modules/finance/services/commands";
import {createFinanceDocument as action518} from "@/modules/finance/services/commands";
import {submitFinanceDocument as action519} from "@/modules/finance/services/commands";
import {saveApprovalPolicy as action520} from "@/modules/finance/services/commands";
import {decideFinanceApproval as action521} from "@/modules/finance/services/commands";
import {createPurchaseOrder as action522} from "@/modules/finance/services/commands";
import {raiseServiceCredit as action523} from "@/modules/finance/services/commands";
import {postFinanceDocument as action524} from "@/modules/finance/services/commands";
import {recordGoodsReceipt as action525} from "@/modules/finance/services/commands";
import {onboardSupplier as action526} from "@/modules/finance/services/commands";
import {approveSupplier as action527} from "@/modules/finance/services/commands";
import {requestSupplierBankChange as action528} from "@/modules/finance/services/commands";
import {verifySupplierBank as action529} from "@/modules/finance/services/commands";
import {createFinanceBank as action530} from "@/modules/finance/services/commands";
import {importBankTransactions as action531} from "@/modules/finance/services/commands";
import {allocateBankTransaction as action532} from "@/modules/finance/services/commands";
import {createPaymentRun as action533} from "@/modules/finance/services/commands";
import {approvePaymentRun as action534} from "@/modules/finance/services/commands";
import {createManualJournal as action535} from "@/modules/finance/services/commands";
import {approveManualJournal as action536} from "@/modules/finance/services/commands";
import {reverseJournal as action537} from "@/modules/finance/services/commands";
import {setFinancePeriodState as action538} from "@/modules/finance/services/commands";
import {saveFinanceBudget as action539} from "@/modules/finance/services/commands";
import {saveFinanceAsset as action540} from "@/modules/finance/services/commands";
import {postAssetDepreciation as action541} from "@/modules/finance/services/commands";
import {completeCloseTask as action542} from "@/modules/finance/services/commands";
import {saveFinanceContract as action543} from "@/modules/finance/services/commands";
import {saveFinanceScenario as action544} from "@/modules/finance/services/commands";
import {receiptForm as action545} from "@/modules/finance/services/commands";
import {journalForm as action546} from "@/modules/finance/services/commands";
import {statementForm as action547} from "@/modules/finance/services/commands";
import {allocationForm as action548} from "@/modules/finance/services/commands";
import {paymentRunForm as action549} from "@/modules/finance/services/commands";
import {policyForm as action550} from "@/modules/finance/services/commands";
import {scenarioForm as action551} from "@/modules/finance/services/commands";
import {uploadFinanceAttachment as action552} from "@/modules/finance/services/commands";
import {generateSalesInvoice as action553} from "@/modules/finance/services/commands";
import {generateInvoiceAdjustment as action554} from "@/modules/finance/services/commands";
import {voidFinanceDraft as action555} from "@/modules/finance/services/commands";
import {getFinanceConfiguration as action556} from "@/modules/finance/services/configuration";
import {saveFinanceEntityDetails as action557} from "@/modules/finance/services/configuration";
import {saveFinanceAccount as action558} from "@/modules/finance/services/configuration";
import {saveFinanceDimension as action559} from "@/modules/finance/services/configuration";
import {createFinancePeriod as action560} from "@/modules/finance/services/configuration";
import {setFinancePeriodExceptions as action561} from "@/modules/finance/services/configuration";
import {requestFinancePeriodReopen as action562} from "@/modules/finance/services/configuration";
import {decideFinancePeriodReopen as action563} from "@/modules/finance/services/configuration";
import {getFinanceHome as action564} from "@/modules/finance/services/queries";
import {listFinanceDocuments as action565} from "@/modules/finance/services/queries";
import {getFinanceDocument as action566} from "@/modules/finance/services/queries";
import {getFinanceWorkspace as action567} from "@/modules/finance/services/queries";
import {financeChoices as action568} from "@/modules/finance/services/queries";
import {getBudgetPositions as action569} from "@/modules/finance/services/queries";
import {getInvoiceCashForecast as action570} from "@/modules/finance/services/queries";
import {getFinancialReport as action571} from "@/modules/finance/services/queries";
import {getFinanceCustomerContribution as action572} from "@/modules/finance/services/queries";
import {searchFinance as action573} from "@/modules/finance/services/queries";
import {getFinanceAttachment as action574} from "@/modules/finance/services/queries";
import {getSalesFinanceProjection as action575} from "@/modules/finance/services/queries";
import {getReceivingWarehouses as action576} from "@/modules/finance/services/queries";
import {getFinanceLedger as action577} from "@/modules/finance/services/reporting";
import {getFinanceJournalDetail as action578} from "@/modules/finance/services/reporting";
import {getFinanceSubledgerReconciliation as action579} from "@/modules/finance/services/reporting";
import {saveFinanceDraft as action580} from "@/modules/finance/services/save-draft";
import {saveVehicle as action581} from "@/modules/fleet/services/commands";
import {addFleetLog as action582} from "@/modules/fleet/services/commands";
import {saveEquipment as action583} from "@/modules/maintenance/services/commands";
import {createMaintenanceWork as action584} from "@/modules/maintenance/services/commands";
import {updateMaintenanceWork as action585} from "@/modules/maintenance/services/commands";
import {recordMaintenancePart as action586} from "@/modules/maintenance/services/commands";
import {createProductionOrder as action587} from "@/modules/manufacturing/services/commands";
import {markOrderReady as action588} from "@/modules/manufacturing/services/commands";
import {releaseOrder as action589} from "@/modules/manufacturing/services/commands";
import {closeOrder as action590} from "@/modules/manufacturing/services/commands";
import {startWorkOrder as action591} from "@/modules/manufacturing/services/commands";
import {pauseWorkOrder as action592} from "@/modules/manufacturing/services/commands";
import {completeWorkOrder as action593} from "@/modules/manufacturing/services/commands";
import {listForecasts as action594} from "@/modules/manufacturing/services/forecast";
import {setForecast as action595} from "@/modules/manufacturing/services/forecast";
import {deleteForecast as action596} from "@/modules/manufacturing/services/forecast";
import {runMrp as action597} from "@/modules/manufacturing/services/mrp";
import {firmSuggestion as action598} from "@/modules/manufacturing/services/mrp";
import {dismissSuggestion as action599} from "@/modules/manufacturing/services/mrp";
import {latestPlan as action600} from "@/modules/manufacturing/services/mrp";
import {loadPlant as action601} from "@/modules/manufacturing/services/plant";
import {saveWorkCentre as action602} from "@/modules/manufacturing/services/plant";
import {saveMachine as action603} from "@/modules/manufacturing/services/plant";
import {retirePlantRecord as action604} from "@/modules/manufacturing/services/plant";
import {schedulePreview as action605} from "@/modules/manufacturing/services/scheduler";
import {rescheduleWorkOrder as action606} from "@/modules/manufacturing/services/scheduler";
import {setWorkOrderLock as action607} from "@/modules/manufacturing/services/scheduler";
import {listShifts as action608} from "@/modules/manufacturing/services/shifts";
import {saveShift as action609} from "@/modules/manufacturing/services/shifts";
import {deleteShift as action610} from "@/modules/manufacturing/services/shifts";
import {createCampaignAction as action611} from "@/modules/marketing/services/campaign-actions 2";
import {saveCampaignBriefAction as action612} from "@/modules/marketing/services/campaign-actions 2";
import {saveBudgetLineAction as action613} from "@/modules/marketing/services/campaign-actions 2";
import {deleteBudgetLineAction as action614} from "@/modules/marketing/services/campaign-actions 2";
import {saveActivityAction as action615} from "@/modules/marketing/services/campaign-actions 2";
import {setActivityStatusAction as action616} from "@/modules/marketing/services/campaign-actions 2";
import {deleteActivityAction as action617} from "@/modules/marketing/services/campaign-actions 2";
import {addPaidSpendAction as action618} from "@/modules/marketing/services/campaign-actions 2";
import {deletePaidSpendAction as action619} from "@/modules/marketing/services/campaign-actions 2";
import {createCampaignAction as action620} from "@/modules/marketing/services/campaign-actions";
import {saveCampaignBriefAction as action621} from "@/modules/marketing/services/campaign-actions";
import {saveBudgetLineAction as action622} from "@/modules/marketing/services/campaign-actions";
import {deleteBudgetLineAction as action623} from "@/modules/marketing/services/campaign-actions";
import {saveActivityAction as action624} from "@/modules/marketing/services/campaign-actions";
import {setActivityStatusAction as action625} from "@/modules/marketing/services/campaign-actions";
import {deleteActivityAction as action626} from "@/modules/marketing/services/campaign-actions";
import {addPaidSpendAction as action627} from "@/modules/marketing/services/campaign-actions";
import {deletePaidSpendAction as action628} from "@/modules/marketing/services/campaign-actions";
import {createCampaign as action629} from "@/modules/marketing/services/commands";
import {updateCampaign as action630} from "@/modules/marketing/services/commands";
import {createProfile as action631} from "@/modules/marketing/services/commands";
import {recordPermission as action632} from "@/modules/marketing/services/commands";
import {suppressProfile as action633} from "@/modules/marketing/services/commands";
import {createAudience as action634} from "@/modules/marketing/services/commands";
import {previewAudience as action635} from "@/modules/marketing/services/commands";
import {createContent as action636} from "@/modules/marketing/services/commands";
import {approveContent as action637} from "@/modules/marketing/services/commands";
import {createMessage as action638} from "@/modules/marketing/services/commands";
import {lockSend as action639} from "@/modules/marketing/services/commands";
import {cancelSend as action640} from "@/modules/marketing/services/commands";
import {ingestEvent as action641} from "@/modules/marketing/services/commands";
import {createJourney as action642} from "@/modules/marketing/services/commands";
import {publishJourney as action643} from "@/modules/marketing/services/commands";
import {reviseJourney as action644} from "@/modules/marketing/services/commands";
import {createProgram as action645} from "@/modules/marketing/services/commands";
import {createExperiment as action646} from "@/modules/marketing/services/commands";
import {leadFeedback as action647} from "@/modules/marketing/services/commands";
import {processJourneySteps as action648} from "@/modules/marketing/services/commands";
import {saveMarketingPlan as action649} from "@/modules/marketing/services/commands";
import {addPlanActivity as action650} from "@/modules/marketing/services/commands";
import {updatePlanActivity as action651} from "@/modules/marketing/services/commands";
import {addBudgetLine as action652} from "@/modules/marketing/services/commands";
import {submitBudgetToFinance as action653} from "@/modules/marketing/services/commands";
import {createJourneyMap as action654} from "@/modules/marketing/services/commands";
import {addJourneyStage as action655} from "@/modules/marketing/services/commands";
import {addJourneyTouch as action656} from "@/modules/marketing/services/commands";
import {editJourneyStage as action657} from "@/modules/marketing/services/journey-workspace";
import {moveJourneyStage as action658} from "@/modules/marketing/services/journey-workspace";
import {editJourneyTouch as action659} from "@/modules/marketing/services/journey-workspace";
import {saveJourneyPath as action660} from "@/modules/marketing/services/journey-workspace";
import {editJourneyStageForm as action661} from "@/modules/marketing/services/journey-workspace";
import {moveJourneyStageForm as action662} from "@/modules/marketing/services/journey-workspace";
import {editJourneyTouchForm as action663} from "@/modules/marketing/services/journey-workspace";
import {saveJourneyPathForm as action664} from "@/modules/marketing/services/journey-workspace";
import {saveSocialPost as action665} from "@/modules/marketing/services/social-actions";
import {deleteSocialPost as action666} from "@/modules/marketing/services/social-actions";
import {retrySocialPost as action667} from "@/modules/marketing/services/social-actions";
import {disconnectMicrosoftCalendar as action668} from "@/modules/meetings/services/calendar-actions";
import {chooseMicrosoftCalendar as action669} from "@/modules/meetings/services/calendar-actions";
import {sendMicrosoftMeeting as action670} from "@/modules/meetings/services/calendar-actions";
import {importMicrosoftMeetings as action671} from "@/modules/meetings/services/calendar-actions";
import {saveMeeting as action672} from "@/modules/meetings/services/commands";
import {meetingStatus as action673} from "@/modules/meetings/services/commands";
import {addMeetingEntry as action674} from "@/modules/meetings/services/commands";
import {completeMeetingAction as action675} from "@/modules/meetings/services/commands";
import {getApprovedExpenseSource as action676} from "@/modules/people/services/finance-expenses";
import {getPlanBuilder as action677} from "@/modules/plan/services/builder";
import {savePlanInput as action678} from "@/modules/plan/services/builder";
import {setPlanInputIncluded as action679} from "@/modules/plan/services/builder";
import {applyPlanInputs as action680} from "@/modules/plan/services/builder";
import {savePlanGrid as action681} from "@/modules/plan/services/builder";
import {removePlanMeasure as action682} from "@/modules/plan/services/builder";
import {createPlan as action683} from "@/modules/plan/services/commands";
import {saveCell as action684} from "@/modules/plan/services/commands";
import {addMeasure as action685} from "@/modules/plan/services/commands";
import {addAssumption as action686} from "@/modules/plan/services/commands";
import {addDriver as action687} from "@/modules/plan/services/commands";
import {addLink as action688} from "@/modules/plan/services/commands";
import {createScenario as action689} from "@/modules/plan/services/commands";
import {promoteScenario as action690} from "@/modules/plan/services/commands";
import {submitPlan as action691} from "@/modules/plan/services/commands";
import {approvePlan as action692} from "@/modules/plan/services/commands";
import {lockPlan as action693} from "@/modules/plan/services/commands";
import {addGoal as action694} from "@/modules/plan/services/commands";
import {addInitiative as action695} from "@/modules/plan/services/commands";
import {createProjectForInitiative as action696} from "@/modules/plan/services/commands";
import {addAction as action697} from "@/modules/plan/services/commands";
import {completeAction as action698} from "@/modules/plan/services/commands";
import {addRisk as action699} from "@/modules/plan/services/commands";
import {addDependency as action700} from "@/modules/plan/services/commands";
import {addDecision as action701} from "@/modules/plan/services/commands";
import {addComment as action702} from "@/modules/plan/services/commands";
import {addUpdate as action703} from "@/modules/plan/services/commands";
import {completeReview as action704} from "@/modules/plan/services/commands";
import {addReview as action705} from "@/modules/plan/services/commands";
import {distributeTargets as action706} from "@/modules/plan/services/commands";
import {importGrid as action707} from "@/modules/plan/services/commands";
import {sharePlan as action708} from "@/modules/plan/services/commands";
import {unsharePlan as action709} from "@/modules/plan/services/commands";
import {setPlanAudience as action710} from "@/modules/plan/services/commands";
import {addNote as action711} from "@/modules/plan/services/commands";
import {saveGoalProgress as action712} from "@/modules/plan/services/commands";
import {savePlanBrief as action713} from "@/modules/plan/services/commands";
import {listProductionPlans as action714} from "@/modules/planning/services/plans";
import {getPlanOptions as action715} from "@/modules/planning/services/plans";
import {getProductionPlan as action716} from "@/modules/planning/services/plans";
import {createProductionPlan as action717} from "@/modules/planning/services/plans";
import {addProductionPlanLine as action718} from "@/modules/planning/services/plans";
import {getAssignedPlanningWork as action719} from "@/modules/planning/services/plans";
import {getPlanningCoverage as action720} from "@/modules/planning/services/queries";
import {saveProductRecipe as action721} from "@/modules/products/services/make";
import {createSpecification as action722} from "@/modules/quality/services/commands";
import {setSpecificationStatus as action723} from "@/modules/quality/services/commands";
import {createControlPoint as action724} from "@/modules/quality/services/commands";
import {executeInspection as action725} from "@/modules/quality/services/commands";
import {releaseHold as action726} from "@/modules/quality/services/commands";
import {reportNcr as action727} from "@/modules/quality/services/commands";
import {updateNcrInvestigation as action728} from "@/modules/quality/services/commands";
import {addNcrAction as action729} from "@/modules/quality/services/commands";
import {updateNcrAction as action730} from "@/modules/quality/services/commands";
import {closeNcr as action731} from "@/modules/quality/services/commands";
import {reportNcr as action732} from "@/modules/quality/services/ncr-actions";
import {updateNcrInvestigation as action733} from "@/modules/quality/services/ncr-actions";
import {addNcrAction as action734} from "@/modules/quality/services/ncr-actions";
import {updateNcrAction as action735} from "@/modules/quality/services/ncr-actions";
import {closeNcr as action736} from "@/modules/quality/services/ncr-actions";
import {reopenNcr as action737} from "@/modules/quality/services/ncr-actions";
import {saveNcrAction as action738} from "@/modules/quality/services/ncr-actions";
import {saveSubstance as action739} from "@/modules/safety/services/assurance";
import {addSafetyDataSheet as action740} from "@/modules/safety/services/assurance";
import {saveCoshhAssessment as action741} from "@/modules/safety/services/assurance";
import {approveSubstance as action742} from "@/modules/safety/services/assurance";
import {saveCompetence as action743} from "@/modules/safety/services/assurance";
import {saveSafetyDocument as action744} from "@/modules/safety/services/assurance";
import {acknowledgeDocument as action745} from "@/modules/safety/services/assurance";
import {saveAudit as action746} from "@/modules/safety/services/assurance";
import {addAuditFinding as action747} from "@/modules/safety/services/assurance";
import {approveAudit as action748} from "@/modules/safety/services/assurance";
import {saveChange as action749} from "@/modules/safety/services/assurance";
import {advanceChange as action750} from "@/modules/safety/services/assurance";
import {linkSafetyRecord as action751} from "@/modules/safety/services/assurance";
import {saveSafetyProfile as action752} from "@/modules/safety/services/commands";
import {saveRiskMatrix as action753} from "@/modules/safety/services/commands";
import {createRisk as action754} from "@/modules/safety/services/commands";
import {addControl as action755} from "@/modules/safety/services/commands";
import {rateAssessment as action756} from "@/modules/safety/services/commands";
import {approveAssessment as action757} from "@/modules/safety/services/commands";
import {reviseAssessment as action758} from "@/modules/safety/services/commands";
import {requestRiskReview as action759} from "@/modules/safety/services/commands";
import {reportIncident as action760} from "@/modules/safety/services/commands";
import {saveImmediateControl as action761} from "@/modules/safety/services/commands";
import {openInvestigation as action762} from "@/modules/safety/services/commands";
import {addCause as action763} from "@/modules/safety/services/commands";
import {saveRootCause as action764} from "@/modules/safety/services/commands";
import {reviewRiddor as action765} from "@/modules/safety/services/commands";
import {createSafetyAction as action766} from "@/modules/safety/services/commands";
import {advanceAction as action767} from "@/modules/safety/services/commands";
import {verifyAction as action768} from "@/modules/safety/services/commands";
import {saveWorkplaceRecord as action769} from "@/modules/safety/services/commands";
import {createPermit as action770} from "@/modules/safety/services/control";
import {advancePermit as action771} from "@/modules/safety/services/control";
import {extendPermit as action772} from "@/modules/safety/services/control";
import {createIsolation as action773} from "@/modules/safety/services/control";
import {applyIsolationLock as action774} from "@/modules/safety/services/control";
import {verifyIsolation as action775} from "@/modules/safety/services/control";
import {clearIsolation as action776} from "@/modules/safety/services/control";
import {removeIsolationLock as action777} from "@/modules/safety/services/control";
import {placeSafetyHold as action778} from "@/modules/safety/services/control";
import {updateReturnToService as action779} from "@/modules/safety/services/control";
import {releaseSafetyHold as action780} from "@/modules/safety/services/control";
import {overrideSafetyHold as action781} from "@/modules/safety/services/control";
import {saveStatutoryCheck as action782} from "@/modules/safety/services/control";
import {completeInspection as action783} from "@/modules/safety/services/control";
import {createInspection as action784} from "@/modules/safety/services/control";
import {createSalesAddress as action785} from "@/modules/sales/services/address-actions";
import {createSalesCatalogueProduct as action786} from "@/modules/sales/services/catalogue-actions";
import {sendQuote as action787} from "@/modules/sales/services/commands";
import {changeQuoteStatus as action788} from "@/modules/sales/services/commands";
import {deleteQuote as action789} from "@/modules/sales/services/commands";
import {duplicateDocument as action790} from "@/modules/sales/services/commands";
import {saveQuoteTemplate as action791} from "@/modules/sales/services/commands";
import {createOrderFromQuote as action792} from "@/modules/sales/services/commands";
import {linkCommercialProject as action793} from "@/modules/sales/services/commercial";
import {openCallOffOrder as action794} from "@/modules/sales/services/commercial";
import {raiseCallOff as action795} from "@/modules/sales/services/commercial";
import {invoiceCallOffDelivery as action796} from "@/modules/sales/services/commercial";
import {deliverAndInvoiceCallOff as action797} from "@/modules/sales/services/commercial";
import {importSalescsv as action798} from "@/modules/sales/services/csv-import";
import {addDeliveryAddress as action799} from "@/modules/sales/services/delivery-address";
import {addInstaller as action800} from "@/modules/sales/services/delivery-address";
import {pricePartyId as action801} from "@/modules/sales/services/delivery-address";
import {linkOrderedFor as action802} from "@/modules/sales/services/delivery-address";
import {saveDocument as action803} from "@/modules/sales/services/documents";
import {saveInvoiceTemplate as action804} from "@/modules/sales/services/invoice-template-actions";
import {retireInvoiceTemplate as action805} from "@/modules/sales/services/invoice-template-actions";
import {attachCustomerInvoiceTemplate as action806} from "@/modules/sales/services/invoice-template-actions";
import {detachCustomerInvoiceTemplate as action807} from "@/modules/sales/services/invoice-template-actions";
import {createDraftOrder as action808} from "@/modules/sales/services/orders";
import {addOrderLine as action809} from "@/modules/sales/services/orders";
import {removeOrderLine as action810} from "@/modules/sales/services/orders";
import {updateDraftOrderFields as action811} from "@/modules/sales/services/orders";
import {confirmOrder as action812} from "@/modules/sales/services/orders";
import {decideApproval as action813} from "@/modules/sales/services/orders";
import {amendLineQuantity as action814} from "@/modules/sales/services/orders";
import {overrideLinePrice as action815} from "@/modules/sales/services/orders";
import {amendRequestedDate as action816} from "@/modules/sales/services/orders";
import {cancelOrder as action817} from "@/modules/sales/services/orders";
import {deleteOrder as action818} from "@/modules/sales/services/orders";
import {cancelLineRemaining as action819} from "@/modules/sales/services/orders";
import {addHold as action820} from "@/modules/sales/services/orders";
import {releaseHold as action821} from "@/modules/sales/services/orders";
import {redeemServiceRecovery as action822} from "@/modules/sales/services/recovery";
import {restoreCancelledOrder as action823} from "@/modules/sales/services/rewind";
import {returnOrderToQuote as action824} from "@/modules/sales/services/rewind";
import {saveOrderHashtags as action825} from "@/modules/sales/services/rewind";
import {saveSalesView as action826} from "@/modules/sales/services/saved-views";
import {archiveSalesView as action827} from "@/modules/sales/services/saved-views";
import {createCase as action828} from "@/modules/service/services/commands";
import {updateCase as action829} from "@/modules/service/services/commands";
import {assignCase as action830} from "@/modules/service/services/commands";
import {transitionCase as action831} from "@/modules/service/services/commands";
import {addCaseEntry as action832} from "@/modules/service/services/commands";
import {createDepartmentTicket as action833} from "@/modules/service/services/commands";
import {updateDepartmentTicket as action834} from "@/modules/service/services/commands";
import {createQueue as action835} from "@/modules/service/services/commands";
import {addQueueMember as action836} from "@/modules/service/services/commands";
import {linkCaseRecord as action837} from "@/modules/service/services/commands";
import {creditChoices as action838} from "@/modules/service/services/commands";
import {askFinanceForCredit as action839} from "@/modules/service/services/commands";
import {getCaseOwners as action840} from "@/modules/service/services/commands";
import {getDepartmentWork as action841} from "@/modules/service/services/commands";
import {savePurchaseContext as action842} from "@/modules/service/services/commands";
import {saveInvestigation as action843} from "@/modules/service/services/commands";
import {logCaseCall as action844} from "@/modules/service/services/commands";
import {createCaseRemedy as action845} from "@/modules/service/services/commands";
import {mergeCases as action846} from "@/modules/service/services/commands";
import {sendCaseEmail as action847} from "@/modules/service/services/communication";
import {invalidateCaseCsat as action848} from "@/modules/service/services/communication";
import {casePurchaseContext as action849} from "@/modules/service/services/context";
import {proposeRecovery as action850} from "@/modules/service/services/recovery";
import {decideRecovery as action851} from "@/modules/service/services/recovery";
import {saveServiceApprovalRoute as action852} from "@/modules/service/services/recovery";
import {getSopWorkspace as action853} from "@/modules/sop/services/workspace";
import {createSopCycle as action854} from "@/modules/sop/services/workspace";
import {configureSopCycle as action855} from "@/modules/sop/services/workspace";
import {generateSopForecast as action856} from "@/modules/sop/services/workspace";
import {approveSopVersion as action857} from "@/modules/sop/services/workspace";
import {updateSopWorkflow as action858} from "@/modules/sop/services/workspace";
import {publishSopVersion as action859} from "@/modules/sop/services/workspace";
import {createSopScenario as action860} from "@/modules/sop/services/workspace";
import {promoteSopScenario as action861} from "@/modules/sop/services/workspace";
import {overrideSopDemand as action862} from "@/modules/sop/services/workspace";
import {getLiveSopService as action863} from "@/modules/sop/services/workspace";
import {getSopComparison as action864} from "@/modules/sop/services/workspace";
import {getSopAccuracy as action865} from "@/modules/sop/services/workspace";
import {readAvailability as action866} from "@/modules/stock/services/availability";
import {readOrderChain as action867} from "@/modules/stock/services/availability";
import {inventoryExportRows as action868} from "@/modules/stock/services/export";
import {createTeam as action869} from "@/modules/teams/services/commands";
import {renameTeam as action870} from "@/modules/teams/services/commands";
import {addMember as action871} from "@/modules/teams/services/commands";
import {removeMember as action872} from "@/modules/teams/services/commands";
import {saveTask as action873} from "@/modules/teams/services/commands";
import {setTaskStatus as action874} from "@/modules/teams/services/commands";
import {removeTask as action875} from "@/modules/teams/services/commands";
import {saveCover as action876} from "@/modules/teams/services/commands";
import {removeCover as action877} from "@/modules/teams/services/commands";
import {saveHandover as action878} from "@/modules/teams/services/commands";
import {savePlace as action879} from "@/modules/teams/services/commands";
import {saveMoment as action880} from "@/modules/teams/services/commands";
import {removeMoment as action881} from "@/modules/teams/services/commands";
export const DATA_ACTIONS:Record<string,(...args:never[])=>Promise<unknown>>=withAdminActionAliases({
"src/app/(admin)/atlas/actions:updateCompanyAccount":action0 as (...args:never[])=>Promise<unknown>,
"src/app/(admin)/atlas/actions:saveCompanyEntitlements":action1 as (...args:never[])=>Promise<unknown>,
"src/app/(admin)/atlas/actions:createCompanyAccount":action2 as (...args:never[])=>Promise<unknown>,
"src/app/(admin)/atlas/actions:deleteTestCompany":action3 as (...args:never[])=>Promise<unknown>,
"src/app/(admin)/atlas/admin-actions:openCompanyWorkspace":action4 as (...args:never[])=>Promise<unknown>,
"src/app/(admin)/atlas/admin-actions:saveAtlasUserProfile":action5 as (...args:never[])=>Promise<unknown>,
"src/app/(admin)/atlas/admin-actions:saveAtlasUserAccess":action6 as (...args:never[])=>Promise<unknown>,
"src/app/(admin)/atlas/admin-actions:revokeAtlasUserSessions":action7 as (...args:never[])=>Promise<unknown>,
"src/app/(admin)/atlas/admin-actions:issueAtlasUserRecovery":action8 as (...args:never[])=>Promise<unknown>,
"src/app/(admin)/atlas/admin-actions:createAtlasStaff":action9 as (...args:never[])=>Promise<unknown>,
"src/app/(admin)/atlas/admin-actions:updateAtlasStaff":action10 as (...args:never[])=>Promise<unknown>,
"src/app/(admin)/atlas/admin-actions:saveAtlasStaffProfile":action11 as (...args:never[])=>Promise<unknown>,
"src/app/(admin)/atlas/admin-actions:issueAtlasStaffRecovery":action12 as (...args:never[])=>Promise<unknown>,
"src/app/(admin)/atlas/admin-actions:archiveAtlasCompany":action13 as (...args:never[])=>Promise<unknown>,
"src/app/(admin)/atlas/admin-actions:saveAtlasCompanyProfile":action14 as (...args:never[])=>Promise<unknown>,
"src/app/(admin)/atlas/admin-actions:saveAtlasCompanyBrand":action15 as (...args:never[])=>Promise<unknown>,
"src/app/(admin)/atlas/cleanup/actions:deleteSelectedTestCompanies":action16 as (...args:never[])=>Promise<unknown>,
"src/app/(admin)/atlas/cleanup/actions:retryCompanyFileCleanup":action17 as (...args:never[])=>Promise<unknown>,
"src/app/(admin)/atlas/connections/actions:attachConnection":action18 as (...args:never[])=>Promise<unknown>,
"src/app/(admin)/atlas/guardian/actions:requestGuardianSweep":action19 as (...args:never[])=>Promise<unknown>,
"src/app/(admin)/atlas/guardian/actions:updateGuardianIssue":action20 as (...args:never[])=>Promise<unknown>,
"src/app/(admin)/atlas/setup-actions:importCompanySetup":action21 as (...args:never[])=>Promise<unknown>,
"src/app/(admin)/atlas/setup-actions:createCompanyUser":action22 as (...args:never[])=>Promise<unknown>,
"src/app/(admin)/atlas/setup-actions:setCompanyUserStatus":action23 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/_shared/record-email-actions:loadEmailRecord":action24 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/_shared/record-email-actions:sendRecordEmailAction":action25 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/_shared/record-email-actions:sendRecordContractAction":action26 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/_shared/record-email-actions:sendQuoteForApprovalAction":action27 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:loadLiveMetrics":action28 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:loadMetricSlice":action29 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:saveAnalyticsDashboard":action30 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:deleteAnalyticsDashboard":action31 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:loadLiveGoalMarkers":action32 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:loadDashboardData":action33 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:loadDashboardSnapshot":action34 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/apps/actions:toggleModuleAction":action35 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:postMessage":action36 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:searchChatPeople":action37 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:openChat":action38 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:openDirectChat":action39 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:searchChatRecords":action40 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:sendChat":action41 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:chatSnapshot":action42 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/contracts/actions:createDealContract":action43 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:updateValueFormAction":action44 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:updateCloseDateFormAction":action45 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:setNextActionFormAction":action46 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:setForecastCategoryFormAction":action47 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:winFormAction":action48 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:loseFormAction":action49 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:addStakeholderFormAction":action50 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:addMilestoneFormAction":action51 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:toggleMilestoneFormAction":action52 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:logOpportunityActivityFormAction":action53 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/pipeline/actions:addDealAction":action54 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:qualifyFormAction":action55 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:disqualifyFormAction":action56 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:nurtureFormAction":action57 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:logProspectActivityFormAction":action58 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:assignProspectFormAction":action59 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:assignProspectTaskFormAction":action60 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:convertProspectFormAction":action61 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/reports/actions:pinReportToDashboard":action62 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createContactFormAction":action63 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateContactFormAction":action64 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:deleteContactFormAction":action65 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createAddressFormAction":action66 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createTaxRegistrationFormAction":action67 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:markTaxVerifiedFormAction":action68 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createBankAccountFormAction":action69 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createDirectDebitFormAction":action70 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:cancelDirectDebitFormAction":action71 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateCreditLimitFormAction":action72 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:toggleCreditHoldFormAction":action73 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createNoteFormAction":action74 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateStatusFormAction":action75 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:archiveCustomerFormAction":action76 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:unarchiveCustomerFormAction":action77 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:deleteCustomerFormAction":action78 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:createKpi":action79 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:saveGoal":action80 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:updateKpi":action81 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:recordProgress":action82 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:closeGoal":action83 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:addPlanGoal":action84 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:closePlan":action85 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:commentOnPlan":action86 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:connectGoal":action87 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:syncDemandAction":action88 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:restoreDeliveryAction":action89 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:releaseAction":action90 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:allocateAction":action91 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:directShipAction":action92 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:groupAction":action93 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:scanAction":action94 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:lotAction":action95 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:serialAction":action96 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shortAction":action97 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeWorkAction":action98 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:claimAction":action99 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shipFromPickAction":action100 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packageAction":action101 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:weightAction":action102 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:stageAction":action103 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:labelAction":action104 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:dispatchAction":action105 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:trackingAction":action106 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:deliverAction":action107 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadCreateAction":action108 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadScanAction":action109 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:departAction":action110 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:expectAction":action111 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveLineAction":action112 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:putAwayAction":action113 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeReceiptAction":action114 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferAction":action115 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferReceiveAction":action116 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:returnRequestAction":action117 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:authoriseReturnAction":action118 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveReturnAction":action119 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:inspectAction":action120 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:closeReturnAction":action121 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:assignEquipmentAction":action122 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packUnitAction":action123 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:saveHandlingTypeAction":action124 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:retireHandlingTypeAction":action125 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:removeHandlingTypeAction":action126 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:policyAction":action127 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:runMrpAction":action128 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:firmPlannedOrderAction":action129 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:dismissPlannedOrderAction":action130 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/forecast/actions:setForecastAction":action131 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/forecast/actions:deleteForecastAction":action132 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:runMrpForm":action133 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:firmPlannedOrderForm":action134 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:dismissPlannedOrderForm":action135 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/produce/actions:raiseProductionOrderAction":action136 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:previewMoveAction":action137 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:commitMoveAction":action138 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:toggleLockAction":action139 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:saveShiftAction":action140 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:deleteShiftAction":action141 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:startAction":action142 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:pauseAction":action143 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:completeAction":action144 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:loadNotices":action145 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotice":action146 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotices":action147 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:createPayrollRun":action148 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:updatePayslipDeductions":action149 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:finalisePayrollRun":action150 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:markPayrollRunPaid":action151 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:savePayrollSettings":action152 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP45":action153 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP60":action154 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:logAbsence":action155 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:requestLeave":action156 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:cancelOwnLeave":action157 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:approveLeaveRequest":action158 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:setLeaveAllowance":action159 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:rejectLeaveRequest":action160 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:createEmployee":action161 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:changeEmployeeStatus":action162 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeProfile":action163 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateOwnEmployeeDetails":action164 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeDocument":action165 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:linkEmployeeToUser":action166 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:completeEmployeeTask":action167 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeTask":action168 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeContact":action169 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeTask":action170 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:scheduleAppraisal":action171 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:completeAppraisal":action172 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getConductDesk":action173 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getMyConduct":action174 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getPlan":action175 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getCase":action176 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:conductChoices":action177 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:savePlan":action178 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addPlanReview":action179 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:commentOnPlan":action180 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:saveCase":action181 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:respondToCase":action182 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addCaseEvent":action183 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:submitExpenseClaim":action184 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:approveExpenseClaim":action185 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:rejectExpenseClaim":action186 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:scheduleOneToOne":action187 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:completeOneToOne":action188 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/platform-actions:saveVacancy":action189 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/platform-actions:saveApplication":action190 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/platform-actions:saveTraining":action191 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/platform-actions:saveHRDocument":action192 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:listPolicies":action193 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:publishPolicy":action194 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:archivePolicy":action195 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:openPolicy":action196 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:createShift":action197 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:changeShiftStatus":action198 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyHR":action199 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyTeam":action200 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getTeamEmployee":action201 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:addPrivateNote":action202 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:updateWorkingPattern":action203 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:updateHrSettings":action204 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createAppraisalTemplate":action205 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleAppraisalTemplateActive":action206 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createOneToOneTemplate":action207 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleOneToOneTemplateActive":action208 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:getTimesheetContext":action209 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:saveTimesheet":action210 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:reviewTimesheet":action211 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:createPriceList":action212 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:savePriceEntry":action213 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveRule":action214 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:setRuleActive":action215 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:updatePriceBasis":action216 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:renamePriceList":action217 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:assignPriceListCustomers":action218 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:checkSalesPrice":action219 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:assignPriceList":action220 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewPriceCsv":action221 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyPriceCsv":action222 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreement":action223 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreementPrice":action224 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:removeAgreementPrice":action225 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewAgreementCsv":action226 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyAgreementCsv":action227 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProduct":action228 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProductRecord":action229 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveCategory":action230 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:retireCategory":action231 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:addStandardCategories":action232 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:savePack":action233 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveLinks":action234 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveMeasures":action235 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/actions:saveProfile":action236 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/work:loadAssignedWork":action237 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProject":action238 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeProjectStatus":action239 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editProject":action240 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProjectMember":action241 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:archiveProject":action242 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTask":action243 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeTaskStatus":action244 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editTask":action245 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:checklistItem":action246 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addDependency":action247 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMeeting":action248 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDocument":action249 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editDocument":action250 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addComment":action251 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMilestone":action252 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:publishUpdate":action253 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDecision":action254 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:decide":action255 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createRisk":action256 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:closeRisk":action257 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:requestApproval":action258 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:respondApproval":action259 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:submitRequest":action260 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:triageRequest":action261 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:logTime":action262 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:planToday":action263 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:updateInbox":action264 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveView":action265 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createPortfolio":action266 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createBaseline":action267 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setBudget":action268 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:linkWork":action269 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectActivity":action270 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createAutomation":action271 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:toggleAutomation":action272 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveProjectTemplate":action273 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:useProjectTemplate":action274 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:startTimer":action275 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:stopTimer":action276 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:projectPreference":action277 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:uploadProjectFile":action278 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:readProjectFile":action279 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProperty":action280 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProperty":action281 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:restoreDocument":action282 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTaskFromDocument":action283 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:discardTimer":action284 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:completeMilestone":action285 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:resolveComment":action286 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectWorkload":action287 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:rescheduleTask":action288 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:newContractAction":action289 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:resendContractAction":action290 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:deleteContractAction":action291 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:createOrderForm":action292 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addLineForm":action293 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:removeLineForm":action294 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:confirmOrderForm":action295 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:updateOrderForm":action296 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:chooseOrderAddresses":action297 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addHoldForm":action298 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:releaseHoldForm":action299 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:approveOrderForm":action300 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:cancelOrderForm":action301 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:saveOrderHashtagsForm":action302 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:restoreCancelledOrderForm":action303 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:returnOrderToQuoteForm":action304 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:scheduleOrderDelivery":action305 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:rejectOrderApproval":action306 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:deleteOrderForm":action307 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:createQuote":action308 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:deleteQuoteForm":action309 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/settings/actions:saveCreationPolicy":action310 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/sites/actions:saveSiteAction":action311 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/sites/actions:setDocumentSiteAction":action312 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getSchedule":action313 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:createBulkShifts":action314 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:setScheduledShift":action315 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:completeShiftTask":action316 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:editScheduledShift":action317 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishWeekShifts":action318 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveHoursBudget":action319 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getTeamPlan":action320 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getPersonSchedule":action321 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveWorkType":action322 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:archiveWorkType":action323 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveDemand":action324 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveBusyRule":action325 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:removeBusyRule":action326 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:fillTeamMonth":action327 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:replanCover":action328 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishMonth":action329 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveShift":action330 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveRole":action331 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveMemberRoles":action332 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:createUser":action333 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyAccess":action334 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyProfile":action335 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveManagerPolicy":action336 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveWorkspaceDetails":action337 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyBrand":action338 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/imports/actions:importCsv":action339 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveEmailAccount":action340 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:verifyEmailAccount":action341 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:sendTestEmail":action342 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:makeDefaultAccount":action343 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:setAccountActive":action344 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteEmailAccount":action345 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveSocialAccount":action346 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteSocialAccount":action347 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:checkSocialAccount":action348 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveEmailTemplate":action349 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteEmailTemplate":action350 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:checkInboxNow":action351 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/logistics/actions:saveDispatchDelivery":action352 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveUserAccess":action353 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:setUserStatus":action354 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:revokeUserSessions":action355 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:issuePasswordRecovery":action356 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createManagedUser":action357 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:linkEmployeeProfile":action358 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createRole":action359 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveManagementGroup":action360 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createWarehouse":action361 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:adjustStock":action362 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:savePlanningAction":action363 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:makeFromForecastAction":action364 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:transferStock":action365 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createSiteAction":action366 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createPlaceAction":action367 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:assignSiteAction":action368 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:addLocationAction":action369 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:ensureLocationsAction":action370 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:retireLocationAction":action371 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:putOnLocationAction":action372 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:moveLocatedAction":action373 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:receiveMoveAction":action374 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/studio/actions:create":action375 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/studio/actions:save":action376 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/studio/actions:validate":action377 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/studio/actions:publish":action378 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/studio/actions:activate":action379 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/templates/actions:saveTemplate":action380 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/templates/actions:archiveTemplate":action381 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/templates/actions:generateTemplateDocument":action382 as (...args:never[])=>Promise<unknown>,
"src/core/approvals/actions:delegateApprovals":action383 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:loginAction":action384 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:logoutAction":action385 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:logoutAdminAction":action386 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:completePasswordRecovery":action387 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:changeOwnPassword":action388 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:signOutOtherSessions":action389 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:createContract":action390 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:sendContract":action391 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:shareContractLink":action392 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:updateDraftContract":action393 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:revokeContract":action394 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:deleteContract":action395 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:signContract":action396 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:returnSignedContract":action397 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:reviewContractReturn":action398 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:declineContract":action399 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:loadPublicContract":action400 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:loadPublicContractFile":action401 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:checkForDuplicatesAction":action402 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:createCustomerAction":action403 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createCustomer":action404 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerStatus":action405 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:archiveCustomer":action406 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:unarchiveCustomer":action407 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteCustomer":action408 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createContact":action409 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateContact":action410 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteContact":action411 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createAddress":action412 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCommercialSettings":action413 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCreditLimit":action414 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setCreditHold":action415 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setPaymentTerm":action416 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createTaxRegistration":action417 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:markTaxRegistrationManuallyVerified":action418 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createBankAccount":action419 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:revealBankAccount":action420 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createDirectDebitMandate":action421 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:cancelDirectDebitMandate":action422 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createNote":action423 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:saveCustomerHashtags":action424 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerDetails":action425 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateAddress":action426 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:archiveAddress":action427 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commercial-actions:saveOrderingPreferences":action428 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setCustomerParent":action429 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:placeCustomer":action430 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:moveCustomer":action431 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setContactReportsTo":action432 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:saveCustomerTradingLink":action433 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:setInvoiceAccount":action434 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:archiveCustomerTradingLink":action435 as (...args:never[])=>Promise<unknown>,
"src/core/finance/actions:requestSalesInvoice":action436 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:createWork":action437 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:updateWork":action438 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:commentWork":action439 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:watchWork":action440 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:mergeWork":action441 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:requestWorkApproval":action442 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:decideWorkApproval":action443 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:saveDeskQueue":action444 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:changeDeskMember":action445 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/file-actions:attachServiceFile":action446 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/knowledge:saveKnowledge":action447 as (...args:never[])=>Promise<unknown>,
"src/core/teams/actions:createWorkTeam":action448 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditBoard":action449 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:exportAuditReport":action450 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEcho":action451 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:postEchoNote":action452 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEchoInbox":action453 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditAccess":action454 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditOwnActivity":action455 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditAreas":action456 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:saveAutomation":action457 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:setAutomationEnabled":action458 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:deleteAutomation":action459 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:testOnPastEvent":action460 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:runNow":action461 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:logActivity":action462 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:completeActivity":action463 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/appointments:saveAppointment":action464 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/appointments:finishAppointment":action465 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/appointments:saveAppointmentForm":action466 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/appointments:finishAppointmentForm":action467 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/marketing-handoff:acceptMarketingHandoff":action468 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:createOpportunity":action469 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:moveOpportunityStage":action470 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityValue":action471 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityCloseDate":action472 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityForecastCategory":action473 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityNextAction":action474 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:winOpportunity":action475 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:loseOpportunity":action476 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addStakeholder":action477 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addMilestone":action478 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:toggleMilestone":action479 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:checkProspectDuplicatesAction":action480 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createProspect":action481 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:assignProspect":action482 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:setProspectLifecycleStage":action483 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:convertProspect":action484 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createIndustry":action485 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:saveProspectGrouping":action486 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProject":action487 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProjectFormAction":action488 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:saveSalesProjectAction":action489 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:saveNextActionAction":action490 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addProjectOrganisationAction":action491 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:removeProjectOrganisationAction":action492 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:makePrimaryOrganisationAction":action493 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addProjectStakeholderAction":action494 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:removeProjectStakeholderAction":action495 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:setDocumentSalesProjectAction":action496 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:deleteSalesProjectAction":action497 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:saveSurvey":action498 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:createSurveyFromTemplate":action499 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:setSurveyActive":action500 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:deleteSurvey":action501 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatScore":action502 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatComment":action503 as (...args:never[])=>Promise<unknown>,
"src/modules/engineering/services/commands:saveEngineeringRevision":action504 as (...args:never[])=>Promise<unknown>,
"src/modules/engineering/services/commands:transitionEngineeringRevision":action505 as (...args:never[])=>Promise<unknown>,
"src/modules/engineering/services/commands:uploadEngineeringDrawing":action506 as (...args:never[])=>Promise<unknown>,
"src/modules/fieldservice/services/commands:saveFieldJob":action507 as (...args:never[])=>Promise<unknown>,
"src/modules/fieldservice/services/commands:updateFieldJob":action508 as (...args:never[])=>Promise<unknown>,
"src/modules/fieldservice/services/commands:addFieldJobNote":action509 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:importFinanceStatement":action510 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:reconcileFinanceStatement":action511 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:financeReconciliationForm":action512 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:getFinanceReconciliation":action513 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:importFinanceStatementForm":action514 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/collections:getFinanceCollections":action515 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/collections:recordFinanceCollection":action516 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setupFinance":action517 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceDocument":action518 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:submitFinanceDocument":action519 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveApprovalPolicy":action520 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:decideFinanceApproval":action521 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPurchaseOrder":action522 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:raiseServiceCredit":action523 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postFinanceDocument":action524 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:recordGoodsReceipt":action525 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:onboardSupplier":action526 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveSupplier":action527 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:requestSupplierBankChange":action528 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:verifySupplierBank":action529 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceBank":action530 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:importBankTransactions":action531 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocateBankTransaction":action532 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPaymentRun":action533 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approvePaymentRun":action534 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createManualJournal":action535 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveManualJournal":action536 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:reverseJournal":action537 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setFinancePeriodState":action538 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceBudget":action539 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceAsset":action540 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postAssetDepreciation":action541 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:completeCloseTask":action542 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceContract":action543 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceScenario":action544 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:receiptForm":action545 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:journalForm":action546 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:statementForm":action547 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocationForm":action548 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:paymentRunForm":action549 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:policyForm":action550 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:scenarioForm":action551 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:uploadFinanceAttachment":action552 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateSalesInvoice":action553 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateInvoiceAdjustment":action554 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:voidFinanceDraft":action555 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:getFinanceConfiguration":action556 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:saveFinanceEntityDetails":action557 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:saveFinanceAccount":action558 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:saveFinanceDimension":action559 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:createFinancePeriod":action560 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:setFinancePeriodExceptions":action561 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:requestFinancePeriodReopen":action562 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:decideFinancePeriodReopen":action563 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceHome":action564 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:listFinanceDocuments":action565 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceDocument":action566 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceWorkspace":action567 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:financeChoices":action568 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getBudgetPositions":action569 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getInvoiceCashForecast":action570 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinancialReport":action571 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceCustomerContribution":action572 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:searchFinance":action573 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceAttachment":action574 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getSalesFinanceProjection":action575 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getReceivingWarehouses":action576 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/reporting:getFinanceLedger":action577 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/reporting:getFinanceJournalDetail":action578 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/reporting:getFinanceSubledgerReconciliation":action579 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/save-draft:saveFinanceDraft":action580 as (...args:never[])=>Promise<unknown>,
"src/modules/fleet/services/commands:saveVehicle":action581 as (...args:never[])=>Promise<unknown>,
"src/modules/fleet/services/commands:addFleetLog":action582 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:saveEquipment":action583 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:createMaintenanceWork":action584 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:updateMaintenanceWork":action585 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:recordMaintenancePart":action586 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:createProductionOrder":action587 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:markOrderReady":action588 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:releaseOrder":action589 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:closeOrder":action590 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:startWorkOrder":action591 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:pauseWorkOrder":action592 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:completeWorkOrder":action593 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:listForecasts":action594 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:setForecast":action595 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:deleteForecast":action596 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:runMrp":action597 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:firmSuggestion":action598 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:dismissSuggestion":action599 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:latestPlan":action600 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:loadPlant":action601 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveWorkCentre":action602 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveMachine":action603 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:retirePlantRecord":action604 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:schedulePreview":action605 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:rescheduleWorkOrder":action606 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:setWorkOrderLock":action607 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:listShifts":action608 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:saveShift":action609 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:deleteShift":action610 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:createCampaignAction":action611 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveCampaignBriefAction":action612 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveBudgetLineAction":action613 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deleteBudgetLineAction":action614 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveActivityAction":action615 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:setActivityStatusAction":action616 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deleteActivityAction":action617 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:addPaidSpendAction":action618 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deletePaidSpendAction":action619 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:createCampaignAction":action620 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveCampaignBriefAction":action621 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveBudgetLineAction":action622 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deleteBudgetLineAction":action623 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveActivityAction":action624 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:setActivityStatusAction":action625 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deleteActivityAction":action626 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:addPaidSpendAction":action627 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deletePaidSpendAction":action628 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createCampaign":action629 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updateCampaign":action630 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProfile":action631 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:recordPermission":action632 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:suppressProfile":action633 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createAudience":action634 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:previewAudience":action635 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createContent":action636 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:approveContent":action637 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createMessage":action638 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:lockSend":action639 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:cancelSend":action640 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:ingestEvent":action641 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourney":action642 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:publishJourney":action643 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:reviseJourney":action644 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProgram":action645 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createExperiment":action646 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:leadFeedback":action647 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:processJourneySteps":action648 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:saveMarketingPlan":action649 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addPlanActivity":action650 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updatePlanActivity":action651 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addBudgetLine":action652 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:submitBudgetToFinance":action653 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourneyMap":action654 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyStage":action655 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyTouch":action656 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:editJourneyStage":action657 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:moveJourneyStage":action658 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:editJourneyTouch":action659 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:saveJourneyPath":action660 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:editJourneyStageForm":action661 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:moveJourneyStageForm":action662 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:editJourneyTouchForm":action663 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:saveJourneyPathForm":action664 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:saveSocialPost":action665 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:deleteSocialPost":action666 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:retrySocialPost":action667 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:disconnectMicrosoftCalendar":action668 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:chooseMicrosoftCalendar":action669 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:sendMicrosoftMeeting":action670 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:importMicrosoftMeetings":action671 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:saveMeeting":action672 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:meetingStatus":action673 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:addMeetingEntry":action674 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:completeMeetingAction":action675 as (...args:never[])=>Promise<unknown>,
"src/modules/people/services/finance-expenses:getApprovedExpenseSource":action676 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:getPlanBuilder":action677 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:savePlanInput":action678 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:setPlanInputIncluded":action679 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:applyPlanInputs":action680 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:savePlanGrid":action681 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:removePlanMeasure":action682 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createPlan":action683 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveCell":action684 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addMeasure":action685 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAssumption":action686 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDriver":action687 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addLink":action688 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createScenario":action689 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:promoteScenario":action690 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:submitPlan":action691 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:approvePlan":action692 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:lockPlan":action693 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addGoal":action694 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addInitiative":action695 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createProjectForInitiative":action696 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAction":action697 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeAction":action698 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addRisk":action699 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDependency":action700 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDecision":action701 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addComment":action702 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addUpdate":action703 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeReview":action704 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addReview":action705 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:distributeTargets":action706 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:importGrid":action707 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:sharePlan":action708 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:unsharePlan":action709 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:setPlanAudience":action710 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addNote":action711 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveGoalProgress":action712 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:savePlanBrief":action713 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:listProductionPlans":action714 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getPlanOptions":action715 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getProductionPlan":action716 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:createProductionPlan":action717 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:addProductionPlanLine":action718 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getAssignedPlanningWork":action719 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/queries:getPlanningCoverage":action720 as (...args:never[])=>Promise<unknown>,
"src/modules/products/services/make:saveProductRecipe":action721 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createSpecification":action722 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:setSpecificationStatus":action723 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createControlPoint":action724 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:executeInspection":action725 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:releaseHold":action726 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:reportNcr":action727 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrInvestigation":action728 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:addNcrAction":action729 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrAction":action730 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:closeNcr":action731 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:reportNcr":action732 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:updateNcrInvestigation":action733 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:addNcrAction":action734 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:updateNcrAction":action735 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:closeNcr":action736 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:reopenNcr":action737 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:saveNcrAction":action738 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSubstance":action739 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addSafetyDataSheet":action740 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCoshhAssessment":action741 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveSubstance":action742 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCompetence":action743 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSafetyDocument":action744 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:acknowledgeDocument":action745 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveAudit":action746 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addAuditFinding":action747 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveAudit":action748 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveChange":action749 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:advanceChange":action750 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:linkSafetyRecord":action751 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveSafetyProfile":action752 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRiskMatrix":action753 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createRisk":action754 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addControl":action755 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:rateAssessment":action756 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:approveAssessment":action757 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviseAssessment":action758 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:requestRiskReview":action759 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reportIncident":action760 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveImmediateControl":action761 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:openInvestigation":action762 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addCause":action763 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRootCause":action764 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviewRiddor":action765 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createSafetyAction":action766 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:advanceAction":action767 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:verifyAction":action768 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveWorkplaceRecord":action769 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createPermit":action770 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:advancePermit":action771 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:extendPermit":action772 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createIsolation":action773 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:applyIsolationLock":action774 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:verifyIsolation":action775 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:clearIsolation":action776 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:removeIsolationLock":action777 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:placeSafetyHold":action778 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:updateReturnToService":action779 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:releaseSafetyHold":action780 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:overrideSafetyHold":action781 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:saveStatutoryCheck":action782 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:completeInspection":action783 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createInspection":action784 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/address-actions:createSalesAddress":action785 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/catalogue-actions:createSalesCatalogueProduct":action786 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:sendQuote":action787 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:changeQuoteStatus":action788 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:deleteQuote":action789 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:duplicateDocument":action790 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:saveQuoteTemplate":action791 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:createOrderFromQuote":action792 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:linkCommercialProject":action793 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:openCallOffOrder":action794 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:raiseCallOff":action795 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:invoiceCallOffDelivery":action796 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:deliverAndInvoiceCallOff":action797 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/csv-import:importSalescsv":action798 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:addDeliveryAddress":action799 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:addInstaller":action800 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:pricePartyId":action801 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:linkOrderedFor":action802 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/documents:saveDocument":action803 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:saveInvoiceTemplate":action804 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:retireInvoiceTemplate":action805 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:attachCustomerInvoiceTemplate":action806 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:detachCustomerInvoiceTemplate":action807 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:createDraftOrder":action808 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addOrderLine":action809 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:removeOrderLine":action810 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:updateDraftOrderFields":action811 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:confirmOrder":action812 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:decideApproval":action813 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendLineQuantity":action814 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:overrideLinePrice":action815 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendRequestedDate":action816 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelOrder":action817 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:deleteOrder":action818 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelLineRemaining":action819 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addHold":action820 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:releaseHold":action821 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/recovery:redeemServiceRecovery":action822 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:restoreCancelledOrder":action823 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:returnOrderToQuote":action824 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:saveOrderHashtags":action825 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:saveSalesView":action826 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:archiveSalesView":action827 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createCase":action828 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateCase":action829 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:assignCase":action830 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:transitionCase":action831 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addCaseEntry":action832 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createDepartmentTicket":action833 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateDepartmentTicket":action834 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createQueue":action835 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addQueueMember":action836 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:linkCaseRecord":action837 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:creditChoices":action838 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:askFinanceForCredit":action839 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getCaseOwners":action840 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getDepartmentWork":action841 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:savePurchaseContext":action842 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:saveInvestigation":action843 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:logCaseCall":action844 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createCaseRemedy":action845 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:mergeCases":action846 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/communication:sendCaseEmail":action847 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/communication:invalidateCaseCsat":action848 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/context:casePurchaseContext":action849 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/recovery:proposeRecovery":action850 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/recovery:decideRecovery":action851 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/recovery:saveServiceApprovalRoute":action852 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getSopWorkspace":action853 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:createSopCycle":action854 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:configureSopCycle":action855 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:generateSopForecast":action856 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:approveSopVersion":action857 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:updateSopWorkflow":action858 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:publishSopVersion":action859 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:createSopScenario":action860 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:promoteSopScenario":action861 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:overrideSopDemand":action862 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getLiveSopService":action863 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getSopComparison":action864 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getSopAccuracy":action865 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readAvailability":action866 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readOrderChain":action867 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/export:inventoryExportRows":action868 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:createTeam":action869 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:renameTeam":action870 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:addMember":action871 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMember":action872 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveTask":action873 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:setTaskStatus":action874 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeTask":action875 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveCover":action876 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeCover":action877 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveHandover":action878 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:savePlace":action879 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveMoment":action880 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMoment":action881 as (...args:never[])=>Promise<unknown>
});
