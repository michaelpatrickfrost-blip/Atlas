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
import {taskChatAttachments as action42} from "@/app/(app)/chat/actions";
import {chatSnapshot as action43} from "@/app/(app)/chat/actions";
import {createDealContract as action44} from "@/app/(app)/crm/contracts/actions";
import {updateValueFormAction as action45} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {updateCloseDateFormAction as action46} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {setNextActionFormAction as action47} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {setForecastCategoryFormAction as action48} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {winFormAction as action49} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {loseFormAction as action50} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addStakeholderFormAction as action51} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addMilestoneFormAction as action52} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {toggleMilestoneFormAction as action53} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {logOpportunityActivityFormAction as action54} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addDealAction as action55} from "@/app/(app)/crm/pipeline/actions";
import {qualifyFormAction as action56} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {disqualifyFormAction as action57} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {nurtureFormAction as action58} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {logProspectActivityFormAction as action59} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {assignProspectFormAction as action60} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {assignProspectTaskFormAction as action61} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {convertProspectFormAction as action62} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {pinReportToDashboard as action63} from "@/app/(app)/crm/reports/actions";
import {createContactFormAction as action64} from "@/app/(app)/customers/[partyId]/actions";
import {updateContactFormAction as action65} from "@/app/(app)/customers/[partyId]/actions";
import {deleteContactFormAction as action66} from "@/app/(app)/customers/[partyId]/actions";
import {createAddressFormAction as action67} from "@/app/(app)/customers/[partyId]/actions";
import {createTaxRegistrationFormAction as action68} from "@/app/(app)/customers/[partyId]/actions";
import {markTaxVerifiedFormAction as action69} from "@/app/(app)/customers/[partyId]/actions";
import {createBankAccountFormAction as action70} from "@/app/(app)/customers/[partyId]/actions";
import {createDirectDebitFormAction as action71} from "@/app/(app)/customers/[partyId]/actions";
import {cancelDirectDebitFormAction as action72} from "@/app/(app)/customers/[partyId]/actions";
import {updateCreditLimitFormAction as action73} from "@/app/(app)/customers/[partyId]/actions";
import {toggleCreditHoldFormAction as action74} from "@/app/(app)/customers/[partyId]/actions";
import {createNoteFormAction as action75} from "@/app/(app)/customers/[partyId]/actions";
import {updateStatusFormAction as action76} from "@/app/(app)/customers/[partyId]/actions";
import {archiveCustomerFormAction as action77} from "@/app/(app)/customers/[partyId]/actions";
import {unarchiveCustomerFormAction as action78} from "@/app/(app)/customers/[partyId]/actions";
import {deleteCustomerFormAction as action79} from "@/app/(app)/customers/[partyId]/actions";
import {createKpi as action80} from "@/app/(app)/kpis/actions";
import {saveGoal as action81} from "@/app/(app)/kpis/actions";
import {updateKpi as action82} from "@/app/(app)/kpis/actions";
import {recordProgress as action83} from "@/app/(app)/kpis/actions";
import {closeGoal as action84} from "@/app/(app)/kpis/actions";
import {addPlanGoal as action85} from "@/app/(app)/kpis/actions";
import {closePlan as action86} from "@/app/(app)/kpis/actions";
import {commentOnPlan as action87} from "@/app/(app)/kpis/actions";
import {connectGoal as action88} from "@/app/(app)/kpis/actions";
import {getScorecards as action89} from "@/app/(app)/kpis/scorecards/actions";
import {saveScorecard as action90} from "@/app/(app)/kpis/scorecards/actions";
import {removeScorecard as action91} from "@/app/(app)/kpis/scorecards/actions";
import {syncDemandAction as action92} from "@/app/(app)/logistics/actions";
import {restoreDeliveryAction as action93} from "@/app/(app)/logistics/actions";
import {releaseAction as action94} from "@/app/(app)/logistics/actions";
import {allocateAction as action95} from "@/app/(app)/logistics/actions";
import {directShipAction as action96} from "@/app/(app)/logistics/actions";
import {groupAction as action97} from "@/app/(app)/logistics/actions";
import {scanAction as action98} from "@/app/(app)/logistics/actions";
import {lotAction as action99} from "@/app/(app)/logistics/actions";
import {serialAction as action100} from "@/app/(app)/logistics/actions";
import {shortAction as action101} from "@/app/(app)/logistics/actions";
import {completeWorkAction as action102} from "@/app/(app)/logistics/actions";
import {claimAction as action103} from "@/app/(app)/logistics/actions";
import {shipFromPickAction as action104} from "@/app/(app)/logistics/actions";
import {packageAction as action105} from "@/app/(app)/logistics/actions";
import {weightAction as action106} from "@/app/(app)/logistics/actions";
import {stageAction as action107} from "@/app/(app)/logistics/actions";
import {labelAction as action108} from "@/app/(app)/logistics/actions";
import {dispatchAction as action109} from "@/app/(app)/logistics/actions";
import {trackingAction as action110} from "@/app/(app)/logistics/actions";
import {deliverAction as action111} from "@/app/(app)/logistics/actions";
import {loadCreateAction as action112} from "@/app/(app)/logistics/actions";
import {loadScanAction as action113} from "@/app/(app)/logistics/actions";
import {departAction as action114} from "@/app/(app)/logistics/actions";
import {expectAction as action115} from "@/app/(app)/logistics/actions";
import {receiveLineAction as action116} from "@/app/(app)/logistics/actions";
import {putAwayAction as action117} from "@/app/(app)/logistics/actions";
import {completeReceiptAction as action118} from "@/app/(app)/logistics/actions";
import {transferAction as action119} from "@/app/(app)/logistics/actions";
import {transferReceiveAction as action120} from "@/app/(app)/logistics/actions";
import {returnRequestAction as action121} from "@/app/(app)/logistics/actions";
import {authoriseReturnAction as action122} from "@/app/(app)/logistics/actions";
import {receiveReturnAction as action123} from "@/app/(app)/logistics/actions";
import {inspectAction as action124} from "@/app/(app)/logistics/actions";
import {closeReturnAction as action125} from "@/app/(app)/logistics/actions";
import {assignEquipmentAction as action126} from "@/app/(app)/logistics/actions";
import {packUnitAction as action127} from "@/app/(app)/logistics/actions";
import {saveHandlingTypeAction as action128} from "@/app/(app)/logistics/actions";
import {retireHandlingTypeAction as action129} from "@/app/(app)/logistics/actions";
import {removeHandlingTypeAction as action130} from "@/app/(app)/logistics/actions";
import {policyAction as action131} from "@/app/(app)/logistics/actions";
import {runMrpAction as action132} from "@/app/(app)/manufacturing/planning/actions";
import {firmPlannedOrderAction as action133} from "@/app/(app)/manufacturing/planning/actions";
import {dismissPlannedOrderAction as action134} from "@/app/(app)/manufacturing/planning/actions";
import {setForecastAction as action135} from "@/app/(app)/manufacturing/planning/forecast/actions";
import {deleteForecastAction as action136} from "@/app/(app)/manufacturing/planning/forecast/actions";
import {runMrpForm as action137} from "@/app/(app)/manufacturing/planning/form-actions";
import {firmPlannedOrderForm as action138} from "@/app/(app)/manufacturing/planning/form-actions";
import {dismissPlannedOrderForm as action139} from "@/app/(app)/manufacturing/planning/form-actions";
import {raiseProductionOrderAction as action140} from "@/app/(app)/manufacturing/produce/actions";
import {previewMoveAction as action141} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {commitMoveAction as action142} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {toggleLockAction as action143} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {saveShiftAction as action144} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {deleteShiftAction as action145} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {startAction as action146} from "@/app/(app)/manufacturing/shop-floor/actions";
import {pauseAction as action147} from "@/app/(app)/manufacturing/shop-floor/actions";
import {completeAction as action148} from "@/app/(app)/manufacturing/shop-floor/actions";
import {loadNotices as action149} from "@/app/(app)/notices/actions";
import {clearNotice as action150} from "@/app/(app)/notices/actions";
import {clearNotices as action151} from "@/app/(app)/notices/actions";
import {getPayrollPreparation as action152} from "@/app/(app)/payroll/actions";
import {createPayrollRun as action153} from "@/app/(app)/payroll/actions";
import {updatePayslipDeductions as action154} from "@/app/(app)/payroll/actions";
import {finalisePayrollRun as action155} from "@/app/(app)/payroll/actions";
import {refreshPayrollRun as action156} from "@/app/(app)/payroll/actions";
import {savePeriodAdjustment as action157} from "@/app/(app)/payroll/actions";
import {markPayrollRunPaid as action158} from "@/app/(app)/payroll/actions";
import {savePayrollSettings as action159} from "@/app/(app)/payroll/actions";
import {issueP45 as action160} from "@/app/(app)/payroll/actions";
import {issueP60 as action161} from "@/app/(app)/payroll/actions";
import {getPayEmployees as action162} from "@/app/(app)/payroll/employees/actions";
import {savePayEmployee as action163} from "@/app/(app)/payroll/employees/actions";
import {logAbsence as action164} from "@/app/(app)/people/absence/actions";
import {requestLeave as action165} from "@/app/(app)/people/absence/actions";
import {cancelOwnLeave as action166} from "@/app/(app)/people/absence/actions";
import {approveLeaveRequest as action167} from "@/app/(app)/people/absence/actions";
import {setLeaveAllowance as action168} from "@/app/(app)/people/absence/actions";
import {rejectLeaveRequest as action169} from "@/app/(app)/people/absence/actions";
import {createEmployee as action170} from "@/app/(app)/people/actions";
import {changeEmployeeStatus as action171} from "@/app/(app)/people/actions";
import {updateEmployeeProfile as action172} from "@/app/(app)/people/actions";
import {updateOwnEmployeeDetails as action173} from "@/app/(app)/people/actions";
import {addEmployeeDocument as action174} from "@/app/(app)/people/actions";
import {linkEmployeeToUser as action175} from "@/app/(app)/people/actions";
import {completeEmployeeTask as action176} from "@/app/(app)/people/actions";
import {addEmployeeTask as action177} from "@/app/(app)/people/actions";
import {updateEmployeeContact as action178} from "@/app/(app)/people/actions";
import {updateEmployeeTask as action179} from "@/app/(app)/people/actions";
import {scheduleAppraisal as action180} from "@/app/(app)/people/appraisals/actions";
import {completeAppraisal as action181} from "@/app/(app)/people/appraisals/actions";
import {getConductDesk as action182} from "@/app/(app)/people/conduct/actions";
import {getMyConduct as action183} from "@/app/(app)/people/conduct/actions";
import {getPlan as action184} from "@/app/(app)/people/conduct/actions";
import {getCase as action185} from "@/app/(app)/people/conduct/actions";
import {conductChoices as action186} from "@/app/(app)/people/conduct/actions";
import {savePlan as action187} from "@/app/(app)/people/conduct/actions";
import {addPlanReview as action188} from "@/app/(app)/people/conduct/actions";
import {commentOnPlan as action189} from "@/app/(app)/people/conduct/actions";
import {saveCase as action190} from "@/app/(app)/people/conduct/actions";
import {respondToCase as action191} from "@/app/(app)/people/conduct/actions";
import {addCaseEvent as action192} from "@/app/(app)/people/conduct/actions";
import {submitExpenseClaim as action193} from "@/app/(app)/people/expenses/actions";
import {approveExpenseClaim as action194} from "@/app/(app)/people/expenses/actions";
import {rejectExpenseClaim as action195} from "@/app/(app)/people/expenses/actions";
import {scheduleOneToOne as action196} from "@/app/(app)/people/one-to-ones/actions";
import {completeOneToOne as action197} from "@/app/(app)/people/one-to-ones/actions";
import {saveVacancy as action198} from "@/app/(app)/people/platform-actions";
import {saveApplication as action199} from "@/app/(app)/people/platform-actions";
import {saveTraining as action200} from "@/app/(app)/people/platform-actions";
import {saveHRDocument as action201} from "@/app/(app)/people/platform-actions";
import {listPolicies as action202} from "@/app/(app)/people/policies/actions";
import {publishPolicy as action203} from "@/app/(app)/people/policies/actions";
import {archivePolicy as action204} from "@/app/(app)/people/policies/actions";
import {openPolicy as action205} from "@/app/(app)/people/policies/actions";
import {createShift as action206} from "@/app/(app)/people/rotas/actions";
import {changeShiftStatus as action207} from "@/app/(app)/people/rotas/actions";
import {getMyHR as action208} from "@/app/(app)/people/self-service";
import {getMyTeam as action209} from "@/app/(app)/people/self-service";
import {getTeamEmployee as action210} from "@/app/(app)/people/self-service";
import {addPrivateNote as action211} from "@/app/(app)/people/self-service";
import {updateWorkingPattern as action212} from "@/app/(app)/people/self-service";
import {updateHrSettings as action213} from "@/app/(app)/people/settings/actions";
import {createAppraisalTemplate as action214} from "@/app/(app)/people/settings/actions";
import {toggleAppraisalTemplateActive as action215} from "@/app/(app)/people/settings/actions";
import {createOneToOneTemplate as action216} from "@/app/(app)/people/settings/actions";
import {toggleOneToOneTemplateActive as action217} from "@/app/(app)/people/settings/actions";
import {getTimesheetContext as action218} from "@/app/(app)/people/timesheets/actions";
import {saveTimesheet as action219} from "@/app/(app)/people/timesheets/actions";
import {reviewTimesheet as action220} from "@/app/(app)/people/timesheets/actions";
import {createPriceList as action221} from "@/app/(app)/pricing/actions";
import {savePriceEntry as action222} from "@/app/(app)/pricing/actions";
import {saveRule as action223} from "@/app/(app)/pricing/actions";
import {setRuleActive as action224} from "@/app/(app)/pricing/actions";
import {updatePriceBasis as action225} from "@/app/(app)/pricing/actions";
import {renamePriceList as action226} from "@/app/(app)/pricing/actions";
import {assignPriceListCustomers as action227} from "@/app/(app)/pricing/actions";
import {checkSalesPrice as action228} from "@/app/(app)/pricing/actions";
import {assignPriceList as action229} from "@/app/(app)/pricing/actions";
import {previewPriceCsv as action230} from "@/app/(app)/pricing/actions";
import {applyPriceCsv as action231} from "@/app/(app)/pricing/actions";
import {saveAgreement as action232} from "@/app/(app)/pricing/actions";
import {saveAgreementPrice as action233} from "@/app/(app)/pricing/actions";
import {removeAgreementPrice as action234} from "@/app/(app)/pricing/actions";
import {previewAgreementCsv as action235} from "@/app/(app)/pricing/actions";
import {applyAgreementCsv as action236} from "@/app/(app)/pricing/actions";
import {saveProduct as action237} from "@/app/(app)/products/actions";
import {saveProductRecord as action238} from "@/app/(app)/products/actions";
import {saveCategory as action239} from "@/app/(app)/products/actions";
import {retireCategory as action240} from "@/app/(app)/products/actions";
import {addStandardCategories as action241} from "@/app/(app)/products/actions";
import {savePack as action242} from "@/app/(app)/products/actions";
import {saveLinks as action243} from "@/app/(app)/products/actions";
import {saveMeasures as action244} from "@/app/(app)/products/actions";
import {saveProfile as action245} from "@/app/(app)/profile/actions";
import {loadMyTasks as action246} from "@/app/(app)/profile/task-actions";
import {loadMyTask as action247} from "@/app/(app)/profile/task-actions";
import {updateMyTaskStatus as action248} from "@/app/(app)/profile/task-actions";
import {loadMyTaskCount as action249} from "@/app/(app)/profile/task-actions";
import {loadAssignedWork as action250} from "@/app/(app)/profile/work";
import {createProject as action251} from "@/app/(app)/projects/actions";
import {changeProjectStatus as action252} from "@/app/(app)/projects/actions";
import {editProject as action253} from "@/app/(app)/projects/actions";
import {setProjectMember as action254} from "@/app/(app)/projects/actions";
import {archiveProject as action255} from "@/app/(app)/projects/actions";
import {createTask as action256} from "@/app/(app)/projects/actions";
import {changeTaskStatus as action257} from "@/app/(app)/projects/actions";
import {changeAssignedTaskStatus as action258} from "@/app/(app)/projects/actions";
import {editTask as action259} from "@/app/(app)/projects/actions";
import {checklistItem as action260} from "@/app/(app)/projects/actions";
import {addDependency as action261} from "@/app/(app)/projects/actions";
import {createMeeting as action262} from "@/app/(app)/projects/actions";
import {createDocument as action263} from "@/app/(app)/projects/actions";
import {editDocument as action264} from "@/app/(app)/projects/actions";
import {addComment as action265} from "@/app/(app)/projects/actions";
import {createMilestone as action266} from "@/app/(app)/projects/actions";
import {publishUpdate as action267} from "@/app/(app)/projects/actions";
import {createDecision as action268} from "@/app/(app)/projects/actions";
import {decide as action269} from "@/app/(app)/projects/actions";
import {createRisk as action270} from "@/app/(app)/projects/actions";
import {closeRisk as action271} from "@/app/(app)/projects/actions";
import {requestApproval as action272} from "@/app/(app)/projects/actions";
import {respondApproval as action273} from "@/app/(app)/projects/actions";
import {submitRequest as action274} from "@/app/(app)/projects/actions";
import {triageRequest as action275} from "@/app/(app)/projects/actions";
import {logTime as action276} from "@/app/(app)/projects/actions";
import {planToday as action277} from "@/app/(app)/projects/actions";
import {updateInbox as action278} from "@/app/(app)/projects/actions";
import {saveView as action279} from "@/app/(app)/projects/actions";
import {createPortfolio as action280} from "@/app/(app)/projects/actions";
import {createBaseline as action281} from "@/app/(app)/projects/actions";
import {setBudget as action282} from "@/app/(app)/projects/actions";
import {linkWork as action283} from "@/app/(app)/projects/actions";
import {getProjectActivity as action284} from "@/app/(app)/projects/actions";
import {createAutomation as action285} from "@/app/(app)/projects/actions";
import {toggleAutomation as action286} from "@/app/(app)/projects/actions";
import {saveProjectTemplate as action287} from "@/app/(app)/projects/actions";
import {useProjectTemplate as action288} from "@/app/(app)/projects/actions";
import {startTimer as action289} from "@/app/(app)/projects/actions";
import {stopTimer as action290} from "@/app/(app)/projects/actions";
import {projectPreference as action291} from "@/app/(app)/projects/actions";
import {uploadProjectFile as action292} from "@/app/(app)/projects/actions";
import {readProjectFile as action293} from "@/app/(app)/projects/actions";
import {createProperty as action294} from "@/app/(app)/projects/actions";
import {setProperty as action295} from "@/app/(app)/projects/actions";
import {restoreDocument as action296} from "@/app/(app)/projects/actions";
import {createTaskFromDocument as action297} from "@/app/(app)/projects/actions";
import {discardTimer as action298} from "@/app/(app)/projects/actions";
import {completeMilestone as action299} from "@/app/(app)/projects/actions";
import {resolveComment as action300} from "@/app/(app)/projects/actions";
import {getProjectWorkload as action301} from "@/app/(app)/projects/actions";
import {rescheduleTask as action302} from "@/app/(app)/projects/actions";
import {newContractAction as action303} from "@/app/(app)/sales/contracts/actions";
import {resendContractAction as action304} from "@/app/(app)/sales/contracts/actions";
import {deleteContractAction as action305} from "@/app/(app)/sales/contracts/actions";
import {createOrderForm as action306} from "@/app/(app)/sales/orders/actions";
import {addLineForm as action307} from "@/app/(app)/sales/orders/actions";
import {removeLineForm as action308} from "@/app/(app)/sales/orders/actions";
import {confirmOrderForm as action309} from "@/app/(app)/sales/orders/actions";
import {updateOrderForm as action310} from "@/app/(app)/sales/orders/actions";
import {chooseOrderAddresses as action311} from "@/app/(app)/sales/orders/actions";
import {addHoldForm as action312} from "@/app/(app)/sales/orders/actions";
import {releaseHoldForm as action313} from "@/app/(app)/sales/orders/actions";
import {approveOrderForm as action314} from "@/app/(app)/sales/orders/actions";
import {cancelOrderForm as action315} from "@/app/(app)/sales/orders/actions";
import {saveOrderHashtagsForm as action316} from "@/app/(app)/sales/orders/actions";
import {restoreCancelledOrderForm as action317} from "@/app/(app)/sales/orders/actions";
import {returnOrderToQuoteForm as action318} from "@/app/(app)/sales/orders/actions";
import {scheduleOrderDelivery as action319} from "@/app/(app)/sales/orders/actions";
import {rejectOrderApproval as action320} from "@/app/(app)/sales/orders/actions";
import {deleteOrderForm as action321} from "@/app/(app)/sales/orders/actions";
import {createQuote as action322} from "@/app/(app)/sales/quotes/actions";
import {deleteQuoteForm as action323} from "@/app/(app)/sales/quotes/actions";
import {saveCreationPolicy as action324} from "@/app/(app)/sales/settings/actions";
import {saveSiteAction as action325} from "@/app/(app)/sales/sites/actions";
import {setDocumentSiteAction as action326} from "@/app/(app)/sales/sites/actions";
import {getSchedule as action327} from "@/app/(app)/scheduling/actions";
import {createBulkShifts as action328} from "@/app/(app)/scheduling/actions";
import {setScheduledShift as action329} from "@/app/(app)/scheduling/actions";
import {completeShiftTask as action330} from "@/app/(app)/scheduling/actions";
import {editScheduledShift as action331} from "@/app/(app)/scheduling/actions";
import {publishWeekShifts as action332} from "@/app/(app)/scheduling/actions";
import {saveHoursBudget as action333} from "@/app/(app)/scheduling/actions";
import {getTeamPlan as action334} from "@/app/(app)/scheduling/actions";
import {getPersonSchedule as action335} from "@/app/(app)/scheduling/actions";
import {saveWorkType as action336} from "@/app/(app)/scheduling/actions";
import {archiveWorkType as action337} from "@/app/(app)/scheduling/actions";
import {saveDemand as action338} from "@/app/(app)/scheduling/actions";
import {saveBusyRule as action339} from "@/app/(app)/scheduling/actions";
import {removeBusyRule as action340} from "@/app/(app)/scheduling/actions";
import {fillTeamMonth as action341} from "@/app/(app)/scheduling/actions";
import {replanCover as action342} from "@/app/(app)/scheduling/actions";
import {publishMonth as action343} from "@/app/(app)/scheduling/actions";
import {saveShift as action344} from "@/app/(app)/scheduling/actions";
import {getWorkforce as action345} from "@/app/(app)/scheduling/workforce/actions";
import {placeBreak as action346} from "@/app/(app)/scheduling/workforce/actions";
import {saveActivity as action347} from "@/app/(app)/scheduling/workforce/actions";
import {removeActivity as action348} from "@/app/(app)/scheduling/workforce/actions";
import {saveInterval as action349} from "@/app/(app)/scheduling/workforce/actions";
import {removeInterval as action350} from "@/app/(app)/scheduling/workforce/actions";
import {createOpening as action351} from "@/app/(app)/scheduling/workforce/actions";
import {requestOpening as action352} from "@/app/(app)/scheduling/workforce/actions";
import {decideOpening as action353} from "@/app/(app)/scheduling/workforce/actions";
import {cancelOpening as action354} from "@/app/(app)/scheduling/workforce/actions";
import {saveAvailability as action355} from "@/app/(app)/scheduling/workforce/actions";
import {removeAvailability as action356} from "@/app/(app)/scheduling/workforce/actions";
import {saveRole as action357} from "@/app/(app)/settings/actions";
import {saveMemberRoles as action358} from "@/app/(app)/settings/actions";
import {createUser as action359} from "@/app/(app)/settings/actions";
import {saveCompanyAccess as action360} from "@/app/(app)/settings/actions";
import {saveCompanyProfile as action361} from "@/app/(app)/settings/actions";
import {saveManagerPolicy as action362} from "@/app/(app)/settings/actions";
import {saveWorkspaceDetails as action363} from "@/app/(app)/settings/actions";
import {saveCompanyBrand as action364} from "@/app/(app)/settings/actions";
import {importCsv as action365} from "@/app/(app)/settings/imports/actions";
import {saveEmailAccount as action366} from "@/app/(app)/settings/it/actions";
import {verifyEmailAccount as action367} from "@/app/(app)/settings/it/actions";
import {sendTestEmail as action368} from "@/app/(app)/settings/it/actions";
import {makeDefaultAccount as action369} from "@/app/(app)/settings/it/actions";
import {setAccountActive as action370} from "@/app/(app)/settings/it/actions";
import {deleteEmailAccount as action371} from "@/app/(app)/settings/it/actions";
import {saveSocialAccount as action372} from "@/app/(app)/settings/it/actions";
import {deleteSocialAccount as action373} from "@/app/(app)/settings/it/actions";
import {checkSocialAccount as action374} from "@/app/(app)/settings/it/actions";
import {saveEmailTemplate as action375} from "@/app/(app)/settings/it/actions";
import {deleteEmailTemplate as action376} from "@/app/(app)/settings/it/actions";
import {checkInboxNow as action377} from "@/app/(app)/settings/it/actions";
import {saveDispatchDelivery as action378} from "@/app/(app)/settings/logistics/actions";
import {saveUserAccess as action379} from "@/app/(app)/settings/user-actions";
import {setUserStatus as action380} from "@/app/(app)/settings/user-actions";
import {revokeUserSessions as action381} from "@/app/(app)/settings/user-actions";
import {issuePasswordRecovery as action382} from "@/app/(app)/settings/user-actions";
import {createManagedUser as action383} from "@/app/(app)/settings/user-actions";
import {linkEmployeeProfile as action384} from "@/app/(app)/settings/user-actions";
import {createRole as action385} from "@/app/(app)/settings/user-actions";
import {saveManagementGroup as action386} from "@/app/(app)/settings/user-actions";
import {createWarehouse as action387} from "@/app/(app)/stock/actions";
import {adjustStock as action388} from "@/app/(app)/stock/actions";
import {savePlanningAction as action389} from "@/app/(app)/stock/actions";
import {makeFromForecastAction as action390} from "@/app/(app)/stock/actions";
import {transferStock as action391} from "@/app/(app)/stock/actions";
import {createSiteAction as action392} from "@/app/(app)/stock/actions";
import {createPlaceAction as action393} from "@/app/(app)/stock/actions";
import {assignSiteAction as action394} from "@/app/(app)/stock/actions";
import {addLocationAction as action395} from "@/app/(app)/stock/actions";
import {ensureLocationsAction as action396} from "@/app/(app)/stock/actions";
import {retireLocationAction as action397} from "@/app/(app)/stock/actions";
import {putOnLocationAction as action398} from "@/app/(app)/stock/actions";
import {moveLocatedAction as action399} from "@/app/(app)/stock/actions";
import {receiveMoveAction as action400} from "@/app/(app)/stock/actions";
import {collectBatch as action401} from "@/app/(app)/stock/handoffs/actions";
import {create as action402} from "@/app/(app)/studio/actions";
import {save as action403} from "@/app/(app)/studio/actions";
import {validate as action404} from "@/app/(app)/studio/actions";
import {publish as action405} from "@/app/(app)/studio/actions";
import {activate as action406} from "@/app/(app)/studio/actions";
import {getCapacity as action407} from "@/app/(app)/teams/[teamId]/capacity/actions";
import {saveAllocation as action408} from "@/app/(app)/teams/[teamId]/capacity/actions";
import {updateWorkStatus as action409} from "@/app/(app)/teams/[teamId]/capacity/actions";
import {saveTemplate as action410} from "@/app/(app)/templates/actions";
import {archiveTemplate as action411} from "@/app/(app)/templates/actions";
import {generateTemplateDocument as action412} from "@/app/(app)/templates/actions";
import {delegateApprovals as action413} from "@/core/approvals/actions";
import {loginAction as action414} from "@/core/auth/actions";
import {logoutAction as action415} from "@/core/auth/actions";
import {logoutAdminAction as action416} from "@/core/auth/actions";
import {completePasswordRecovery as action417} from "@/core/auth/security-actions";
import {changeOwnPassword as action418} from "@/core/auth/security-actions";
import {signOutOtherSessions as action419} from "@/core/auth/security-actions";
import {createContract as action420} from "@/core/contracts/actions";
import {sendContract as action421} from "@/core/contracts/actions";
import {shareContractLink as action422} from "@/core/contracts/actions";
import {updateDraftContract as action423} from "@/core/contracts/actions";
import {revokeContract as action424} from "@/core/contracts/actions";
import {deleteContract as action425} from "@/core/contracts/actions";
import {signContract as action426} from "@/core/contracts/actions";
import {returnSignedContract as action427} from "@/core/contracts/actions";
import {reviewContractReturn as action428} from "@/core/contracts/actions";
import {declineContract as action429} from "@/core/contracts/actions";
import {loadPublicContract as action430} from "@/core/contracts/actions";
import {loadPublicContractFile as action431} from "@/core/contracts/actions";
import {checkForDuplicatesAction as action432} from "@/core/customers/actions";
import {createCustomerAction as action433} from "@/core/customers/actions";
import {createCustomer as action434} from "@/core/customers/commands";
import {updateCustomerStatus as action435} from "@/core/customers/commands";
import {archiveCustomer as action436} from "@/core/customers/commands";
import {unarchiveCustomer as action437} from "@/core/customers/commands";
import {deleteCustomer as action438} from "@/core/customers/commands";
import {createContact as action439} from "@/core/customers/commands";
import {updateContact as action440} from "@/core/customers/commands";
import {deleteContact as action441} from "@/core/customers/commands";
import {createAddress as action442} from "@/core/customers/commands";
import {updateCommercialSettings as action443} from "@/core/customers/commands";
import {updateCreditLimit as action444} from "@/core/customers/commands";
import {setCreditHold as action445} from "@/core/customers/commands";
import {setPaymentTerm as action446} from "@/core/customers/commands";
import {createTaxRegistration as action447} from "@/core/customers/commands";
import {markTaxRegistrationManuallyVerified as action448} from "@/core/customers/commands";
import {createBankAccount as action449} from "@/core/customers/commands";
import {revealBankAccount as action450} from "@/core/customers/commands";
import {createDirectDebitMandate as action451} from "@/core/customers/commands";
import {cancelDirectDebitMandate as action452} from "@/core/customers/commands";
import {createNote as action453} from "@/core/customers/commands";
import {saveCustomerHashtags as action454} from "@/core/customers/commands";
import {updateCustomerDetails as action455} from "@/core/customers/commands";
import {updateAddress as action456} from "@/core/customers/commands";
import {archiveAddress as action457} from "@/core/customers/commands";
import {saveOrderingPreferences as action458} from "@/core/customers/commercial-actions";
import {setCustomerParent as action459} from "@/core/customers/hierarchy-actions";
import {placeCustomer as action460} from "@/core/customers/hierarchy-actions";
import {moveCustomer as action461} from "@/core/customers/hierarchy-actions";
import {setContactReportsTo as action462} from "@/core/customers/hierarchy-actions";
import {saveCustomerTradingLink as action463} from "@/core/customers/trading-actions";
import {setInvoiceAccount as action464} from "@/core/customers/trading-actions";
import {archiveCustomerTradingLink as action465} from "@/core/customers/trading-actions";
import {requestSalesInvoice as action466} from "@/core/finance/actions";
import {createWork as action467} from "@/core/service-work/actions";
import {updateWork as action468} from "@/core/service-work/actions";
import {commentWork as action469} from "@/core/service-work/actions";
import {watchWork as action470} from "@/core/service-work/actions";
import {mergeWork as action471} from "@/core/service-work/actions";
import {requestWorkApproval as action472} from "@/core/service-work/actions";
import {decideWorkApproval as action473} from "@/core/service-work/actions";
import {saveDeskQueue as action474} from "@/core/service-work/actions";
import {changeDeskMember as action475} from "@/core/service-work/actions";
import {attachServiceFile as action476} from "@/core/service-work/file-actions";
import {saveKnowledge as action477} from "@/core/service-work/knowledge";
import {createWorkTeam as action478} from "@/core/teams/actions";
import {loadAuditBoard as action479} from "@/modules/audit/services/actions";
import {exportAuditReport as action480} from "@/modules/audit/services/actions";
import {loadEcho as action481} from "@/modules/audit/services/actions";
import {postEchoNote as action482} from "@/modules/audit/services/actions";
import {loadEchoInbox as action483} from "@/modules/audit/services/actions";
import {loadAuditAccess as action484} from "@/modules/audit/services/actions";
import {saveAuditOwnActivity as action485} from "@/modules/audit/services/actions";
import {saveAuditAreas as action486} from "@/modules/audit/services/actions";
import {saveAutomation as action487} from "@/modules/automations/services/actions";
import {setAutomationEnabled as action488} from "@/modules/automations/services/actions";
import {deleteAutomation as action489} from "@/modules/automations/services/actions";
import {testOnPastEvent as action490} from "@/modules/automations/services/actions";
import {runNow as action491} from "@/modules/automations/services/actions";
import {logActivity as action492} from "@/modules/crm/services/activities";
import {completeActivity as action493} from "@/modules/crm/services/activities";
import {saveAppointment as action494} from "@/modules/crm/services/appointments";
import {finishAppointment as action495} from "@/modules/crm/services/appointments";
import {saveAppointmentForm as action496} from "@/modules/crm/services/appointments";
import {finishAppointmentForm as action497} from "@/modules/crm/services/appointments";
import {acceptMarketingHandoff as action498} from "@/modules/crm/services/marketing-handoff";
import {createOpportunity as action499} from "@/modules/crm/services/opportunities";
import {moveOpportunityStage as action500} from "@/modules/crm/services/opportunities";
import {updateOpportunityValue as action501} from "@/modules/crm/services/opportunities";
import {updateOpportunityCloseDate as action502} from "@/modules/crm/services/opportunities";
import {setOpportunityForecastCategory as action503} from "@/modules/crm/services/opportunities";
import {setOpportunityNextAction as action504} from "@/modules/crm/services/opportunities";
import {winOpportunity as action505} from "@/modules/crm/services/opportunities";
import {loseOpportunity as action506} from "@/modules/crm/services/opportunities";
import {addStakeholder as action507} from "@/modules/crm/services/opportunities";
import {addMilestone as action508} from "@/modules/crm/services/opportunities";
import {toggleMilestone as action509} from "@/modules/crm/services/opportunities";
import {checkProspectDuplicatesAction as action510} from "@/modules/crm/services/prospects";
import {createProspect as action511} from "@/modules/crm/services/prospects";
import {assignProspect as action512} from "@/modules/crm/services/prospects";
import {setProspectLifecycleStage as action513} from "@/modules/crm/services/prospects";
import {convertProspect as action514} from "@/modules/crm/services/prospects";
import {createIndustry as action515} from "@/modules/crm/services/prospects";
import {saveProspectGrouping as action516} from "@/modules/crm/services/prospects";
import {createSalesProject as action517} from "@/modules/crm/services/sales-projects-commands";
import {createSalesProjectFormAction as action518} from "@/modules/crm/services/sales-projects-commands";
import {saveSalesProjectAction as action519} from "@/modules/crm/services/sales-projects-commands";
import {saveNextActionAction as action520} from "@/modules/crm/services/sales-projects-commands";
import {addProjectOrganisationAction as action521} from "@/modules/crm/services/sales-projects-commands";
import {removeProjectOrganisationAction as action522} from "@/modules/crm/services/sales-projects-commands";
import {makePrimaryOrganisationAction as action523} from "@/modules/crm/services/sales-projects-commands";
import {addProjectStakeholderAction as action524} from "@/modules/crm/services/sales-projects-commands";
import {removeProjectStakeholderAction as action525} from "@/modules/crm/services/sales-projects-commands";
import {setDocumentSalesProjectAction as action526} from "@/modules/crm/services/sales-projects-commands";
import {deleteSalesProjectAction as action527} from "@/modules/crm/services/sales-projects-commands";
import {saveSurvey as action528} from "@/modules/csat/services/actions";
import {createSurveyFromTemplate as action529} from "@/modules/csat/services/actions";
import {setSurveyActive as action530} from "@/modules/csat/services/actions";
import {deleteSurvey as action531} from "@/modules/csat/services/actions";
import {recordCsatScore as action532} from "@/modules/csat/services/actions";
import {recordCsatComment as action533} from "@/modules/csat/services/actions";
import {saveEngineeringRevision as action534} from "@/modules/engineering/services/commands";
import {transitionEngineeringRevision as action535} from "@/modules/engineering/services/commands";
import {uploadEngineeringDrawing as action536} from "@/modules/engineering/services/commands";
import {saveFieldJob as action537} from "@/modules/fieldservice/services/commands";
import {updateFieldJob as action538} from "@/modules/fieldservice/services/commands";
import {addFieldJobNote as action539} from "@/modules/fieldservice/services/commands";
import {importFinanceStatement as action540} from "@/modules/finance/services/banking";
import {reconcileFinanceStatement as action541} from "@/modules/finance/services/banking";
import {financeReconciliationForm as action542} from "@/modules/finance/services/banking";
import {getFinanceReconciliation as action543} from "@/modules/finance/services/banking";
import {importFinanceStatementForm as action544} from "@/modules/finance/services/banking";
import {getFinanceCollections as action545} from "@/modules/finance/services/collections";
import {recordFinanceCollection as action546} from "@/modules/finance/services/collections";
import {setupFinance as action547} from "@/modules/finance/services/commands";
import {createFinanceDocument as action548} from "@/modules/finance/services/commands";
import {submitFinanceDocument as action549} from "@/modules/finance/services/commands";
import {saveApprovalPolicy as action550} from "@/modules/finance/services/commands";
import {decideFinanceApproval as action551} from "@/modules/finance/services/commands";
import {createPurchaseOrder as action552} from "@/modules/finance/services/commands";
import {raiseServiceCredit as action553} from "@/modules/finance/services/commands";
import {postFinanceDocument as action554} from "@/modules/finance/services/commands";
import {recordGoodsReceipt as action555} from "@/modules/finance/services/commands";
import {onboardSupplier as action556} from "@/modules/finance/services/commands";
import {approveSupplier as action557} from "@/modules/finance/services/commands";
import {requestSupplierBankChange as action558} from "@/modules/finance/services/commands";
import {verifySupplierBank as action559} from "@/modules/finance/services/commands";
import {createFinanceBank as action560} from "@/modules/finance/services/commands";
import {importBankTransactions as action561} from "@/modules/finance/services/commands";
import {allocateBankTransaction as action562} from "@/modules/finance/services/commands";
import {createPaymentRun as action563} from "@/modules/finance/services/commands";
import {approvePaymentRun as action564} from "@/modules/finance/services/commands";
import {createManualJournal as action565} from "@/modules/finance/services/commands";
import {approveManualJournal as action566} from "@/modules/finance/services/commands";
import {reverseJournal as action567} from "@/modules/finance/services/commands";
import {setFinancePeriodState as action568} from "@/modules/finance/services/commands";
import {saveFinanceBudget as action569} from "@/modules/finance/services/commands";
import {saveFinanceAsset as action570} from "@/modules/finance/services/commands";
import {postAssetDepreciation as action571} from "@/modules/finance/services/commands";
import {completeCloseTask as action572} from "@/modules/finance/services/commands";
import {saveFinanceContract as action573} from "@/modules/finance/services/commands";
import {saveFinanceScenario as action574} from "@/modules/finance/services/commands";
import {receiptForm as action575} from "@/modules/finance/services/commands";
import {journalForm as action576} from "@/modules/finance/services/commands";
import {statementForm as action577} from "@/modules/finance/services/commands";
import {allocationForm as action578} from "@/modules/finance/services/commands";
import {paymentRunForm as action579} from "@/modules/finance/services/commands";
import {policyForm as action580} from "@/modules/finance/services/commands";
import {scenarioForm as action581} from "@/modules/finance/services/commands";
import {uploadFinanceAttachment as action582} from "@/modules/finance/services/commands";
import {generateSalesInvoice as action583} from "@/modules/finance/services/commands";
import {generateInvoiceAdjustment as action584} from "@/modules/finance/services/commands";
import {voidFinanceDraft as action585} from "@/modules/finance/services/commands";
import {getFinanceConfiguration as action586} from "@/modules/finance/services/configuration";
import {saveFinanceEntityDetails as action587} from "@/modules/finance/services/configuration";
import {saveFinanceAccount as action588} from "@/modules/finance/services/configuration";
import {saveFinanceDimension as action589} from "@/modules/finance/services/configuration";
import {createFinancePeriod as action590} from "@/modules/finance/services/configuration";
import {setFinancePeriodExceptions as action591} from "@/modules/finance/services/configuration";
import {requestFinancePeriodReopen as action592} from "@/modules/finance/services/configuration";
import {decideFinancePeriodReopen as action593} from "@/modules/finance/services/configuration";
import {getFinanceHome as action594} from "@/modules/finance/services/queries";
import {listFinanceDocuments as action595} from "@/modules/finance/services/queries";
import {getFinanceDocument as action596} from "@/modules/finance/services/queries";
import {getFinanceWorkspace as action597} from "@/modules/finance/services/queries";
import {financeChoices as action598} from "@/modules/finance/services/queries";
import {getBudgetPositions as action599} from "@/modules/finance/services/queries";
import {getInvoiceCashForecast as action600} from "@/modules/finance/services/queries";
import {getFinancialReport as action601} from "@/modules/finance/services/queries";
import {getFinanceCustomerContribution as action602} from "@/modules/finance/services/queries";
import {searchFinance as action603} from "@/modules/finance/services/queries";
import {getFinanceAttachment as action604} from "@/modules/finance/services/queries";
import {getSalesFinanceProjection as action605} from "@/modules/finance/services/queries";
import {getReceivingWarehouses as action606} from "@/modules/finance/services/queries";
import {getFinanceLedger as action607} from "@/modules/finance/services/reporting";
import {getFinanceJournalDetail as action608} from "@/modules/finance/services/reporting";
import {getFinanceSubledgerReconciliation as action609} from "@/modules/finance/services/reporting";
import {saveFinanceDraft as action610} from "@/modules/finance/services/save-draft";
import {saveVehicle as action611} from "@/modules/fleet/services/commands";
import {addFleetLog as action612} from "@/modules/fleet/services/commands";
import {saveEquipment as action613} from "@/modules/maintenance/services/commands";
import {createMaintenanceWork as action614} from "@/modules/maintenance/services/commands";
import {updateMaintenanceWork as action615} from "@/modules/maintenance/services/commands";
import {recordMaintenancePart as action616} from "@/modules/maintenance/services/commands";
import {createProductionOrder as action617} from "@/modules/manufacturing/services/commands";
import {markOrderReady as action618} from "@/modules/manufacturing/services/commands";
import {releaseOrder as action619} from "@/modules/manufacturing/services/commands";
import {closeOrder as action620} from "@/modules/manufacturing/services/commands";
import {startWorkOrder as action621} from "@/modules/manufacturing/services/commands";
import {pauseWorkOrder as action622} from "@/modules/manufacturing/services/commands";
import {completeWorkOrder as action623} from "@/modules/manufacturing/services/commands";
import {listForecasts as action624} from "@/modules/manufacturing/services/forecast";
import {setForecast as action625} from "@/modules/manufacturing/services/forecast";
import {deleteForecast as action626} from "@/modules/manufacturing/services/forecast";
import {runMrp as action627} from "@/modules/manufacturing/services/mrp";
import {firmSuggestion as action628} from "@/modules/manufacturing/services/mrp";
import {dismissSuggestion as action629} from "@/modules/manufacturing/services/mrp";
import {latestPlan as action630} from "@/modules/manufacturing/services/mrp";
import {loadPlant as action631} from "@/modules/manufacturing/services/plant";
import {saveWorkCentre as action632} from "@/modules/manufacturing/services/plant";
import {saveMachine as action633} from "@/modules/manufacturing/services/plant";
import {retirePlantRecord as action634} from "@/modules/manufacturing/services/plant";
import {schedulePreview as action635} from "@/modules/manufacturing/services/scheduler";
import {rescheduleWorkOrder as action636} from "@/modules/manufacturing/services/scheduler";
import {setWorkOrderLock as action637} from "@/modules/manufacturing/services/scheduler";
import {listShifts as action638} from "@/modules/manufacturing/services/shifts";
import {saveShift as action639} from "@/modules/manufacturing/services/shifts";
import {deleteShift as action640} from "@/modules/manufacturing/services/shifts";
import {createCampaignAction as action641} from "@/modules/marketing/services/campaign-actions 2";
import {saveCampaignBriefAction as action642} from "@/modules/marketing/services/campaign-actions 2";
import {saveBudgetLineAction as action643} from "@/modules/marketing/services/campaign-actions 2";
import {deleteBudgetLineAction as action644} from "@/modules/marketing/services/campaign-actions 2";
import {saveActivityAction as action645} from "@/modules/marketing/services/campaign-actions 2";
import {setActivityStatusAction as action646} from "@/modules/marketing/services/campaign-actions 2";
import {deleteActivityAction as action647} from "@/modules/marketing/services/campaign-actions 2";
import {addPaidSpendAction as action648} from "@/modules/marketing/services/campaign-actions 2";
import {deletePaidSpendAction as action649} from "@/modules/marketing/services/campaign-actions 2";
import {createCampaignAction as action650} from "@/modules/marketing/services/campaign-actions";
import {saveCampaignBriefAction as action651} from "@/modules/marketing/services/campaign-actions";
import {saveBudgetLineAction as action652} from "@/modules/marketing/services/campaign-actions";
import {deleteBudgetLineAction as action653} from "@/modules/marketing/services/campaign-actions";
import {saveActivityAction as action654} from "@/modules/marketing/services/campaign-actions";
import {setActivityStatusAction as action655} from "@/modules/marketing/services/campaign-actions";
import {deleteActivityAction as action656} from "@/modules/marketing/services/campaign-actions";
import {addPaidSpendAction as action657} from "@/modules/marketing/services/campaign-actions";
import {deletePaidSpendAction as action658} from "@/modules/marketing/services/campaign-actions";
import {createCampaign as action659} from "@/modules/marketing/services/commands";
import {updateCampaign as action660} from "@/modules/marketing/services/commands";
import {createProfile as action661} from "@/modules/marketing/services/commands";
import {recordPermission as action662} from "@/modules/marketing/services/commands";
import {suppressProfile as action663} from "@/modules/marketing/services/commands";
import {createAudience as action664} from "@/modules/marketing/services/commands";
import {previewAudience as action665} from "@/modules/marketing/services/commands";
import {createContent as action666} from "@/modules/marketing/services/commands";
import {approveContent as action667} from "@/modules/marketing/services/commands";
import {createMessage as action668} from "@/modules/marketing/services/commands";
import {lockSend as action669} from "@/modules/marketing/services/commands";
import {cancelSend as action670} from "@/modules/marketing/services/commands";
import {ingestEvent as action671} from "@/modules/marketing/services/commands";
import {createJourney as action672} from "@/modules/marketing/services/commands";
import {publishJourney as action673} from "@/modules/marketing/services/commands";
import {reviseJourney as action674} from "@/modules/marketing/services/commands";
import {createProgram as action675} from "@/modules/marketing/services/commands";
import {createExperiment as action676} from "@/modules/marketing/services/commands";
import {leadFeedback as action677} from "@/modules/marketing/services/commands";
import {processJourneySteps as action678} from "@/modules/marketing/services/commands";
import {saveMarketingPlan as action679} from "@/modules/marketing/services/commands";
import {addPlanActivity as action680} from "@/modules/marketing/services/commands";
import {updatePlanActivity as action681} from "@/modules/marketing/services/commands";
import {addBudgetLine as action682} from "@/modules/marketing/services/commands";
import {submitBudgetToFinance as action683} from "@/modules/marketing/services/commands";
import {createJourneyMap as action684} from "@/modules/marketing/services/commands";
import {addJourneyStage as action685} from "@/modules/marketing/services/commands";
import {addJourneyTouch as action686} from "@/modules/marketing/services/commands";
import {editJourneyStage as action687} from "@/modules/marketing/services/journey-workspace";
import {moveJourneyStage as action688} from "@/modules/marketing/services/journey-workspace";
import {editJourneyTouch as action689} from "@/modules/marketing/services/journey-workspace";
import {saveJourneyPath as action690} from "@/modules/marketing/services/journey-workspace";
import {editJourneyStageForm as action691} from "@/modules/marketing/services/journey-workspace";
import {moveJourneyStageForm as action692} from "@/modules/marketing/services/journey-workspace";
import {editJourneyTouchForm as action693} from "@/modules/marketing/services/journey-workspace";
import {saveJourneyPathForm as action694} from "@/modules/marketing/services/journey-workspace";
import {saveSocialPost as action695} from "@/modules/marketing/services/social-actions";
import {deleteSocialPost as action696} from "@/modules/marketing/services/social-actions";
import {retrySocialPost as action697} from "@/modules/marketing/services/social-actions";
import {disconnectMicrosoftCalendar as action698} from "@/modules/meetings/services/calendar-actions";
import {chooseMicrosoftCalendar as action699} from "@/modules/meetings/services/calendar-actions";
import {sendMicrosoftMeeting as action700} from "@/modules/meetings/services/calendar-actions";
import {importMicrosoftMeetings as action701} from "@/modules/meetings/services/calendar-actions";
import {saveMeeting as action702} from "@/modules/meetings/services/commands";
import {meetingStatus as action703} from "@/modules/meetings/services/commands";
import {addMeetingEntry as action704} from "@/modules/meetings/services/commands";
import {completeMeetingAction as action705} from "@/modules/meetings/services/commands";
import {getApprovedExpenseSource as action706} from "@/modules/people/services/finance-expenses";
import {getPlanBuilder as action707} from "@/modules/plan/services/builder";
import {savePlanInput as action708} from "@/modules/plan/services/builder";
import {setPlanInputIncluded as action709} from "@/modules/plan/services/builder";
import {applyPlanInputs as action710} from "@/modules/plan/services/builder";
import {savePlanGrid as action711} from "@/modules/plan/services/builder";
import {removePlanMeasure as action712} from "@/modules/plan/services/builder";
import {createPlan as action713} from "@/modules/plan/services/commands";
import {saveCell as action714} from "@/modules/plan/services/commands";
import {addMeasure as action715} from "@/modules/plan/services/commands";
import {addAssumption as action716} from "@/modules/plan/services/commands";
import {addDriver as action717} from "@/modules/plan/services/commands";
import {addLink as action718} from "@/modules/plan/services/commands";
import {createScenario as action719} from "@/modules/plan/services/commands";
import {promoteScenario as action720} from "@/modules/plan/services/commands";
import {submitPlan as action721} from "@/modules/plan/services/commands";
import {approvePlan as action722} from "@/modules/plan/services/commands";
import {lockPlan as action723} from "@/modules/plan/services/commands";
import {addGoal as action724} from "@/modules/plan/services/commands";
import {addInitiative as action725} from "@/modules/plan/services/commands";
import {createProjectForInitiative as action726} from "@/modules/plan/services/commands";
import {addAction as action727} from "@/modules/plan/services/commands";
import {completeAction as action728} from "@/modules/plan/services/commands";
import {addRisk as action729} from "@/modules/plan/services/commands";
import {addDependency as action730} from "@/modules/plan/services/commands";
import {addDecision as action731} from "@/modules/plan/services/commands";
import {addComment as action732} from "@/modules/plan/services/commands";
import {addUpdate as action733} from "@/modules/plan/services/commands";
import {completeReview as action734} from "@/modules/plan/services/commands";
import {addReview as action735} from "@/modules/plan/services/commands";
import {distributeTargets as action736} from "@/modules/plan/services/commands";
import {importGrid as action737} from "@/modules/plan/services/commands";
import {sharePlan as action738} from "@/modules/plan/services/commands";
import {unsharePlan as action739} from "@/modules/plan/services/commands";
import {setPlanAudience as action740} from "@/modules/plan/services/commands";
import {addNote as action741} from "@/modules/plan/services/commands";
import {saveGoalProgress as action742} from "@/modules/plan/services/commands";
import {savePlanBrief as action743} from "@/modules/plan/services/commands";
import {listProductionPlans as action744} from "@/modules/planning/services/plans";
import {getPlanOptions as action745} from "@/modules/planning/services/plans";
import {getProductionPlan as action746} from "@/modules/planning/services/plans";
import {createProductionPlan as action747} from "@/modules/planning/services/plans";
import {addProductionPlanLine as action748} from "@/modules/planning/services/plans";
import {getAssignedPlanningWork as action749} from "@/modules/planning/services/plans";
import {getPlanningCoverage as action750} from "@/modules/planning/services/queries";
import {saveProductRecipe as action751} from "@/modules/products/services/make";
import {createSpecification as action752} from "@/modules/quality/services/commands";
import {setSpecificationStatus as action753} from "@/modules/quality/services/commands";
import {createControlPoint as action754} from "@/modules/quality/services/commands";
import {executeInspection as action755} from "@/modules/quality/services/commands";
import {releaseHold as action756} from "@/modules/quality/services/commands";
import {reportNcr as action757} from "@/modules/quality/services/commands";
import {updateNcrInvestigation as action758} from "@/modules/quality/services/commands";
import {addNcrAction as action759} from "@/modules/quality/services/commands";
import {updateNcrAction as action760} from "@/modules/quality/services/commands";
import {closeNcr as action761} from "@/modules/quality/services/commands";
import {reportNcr as action762} from "@/modules/quality/services/ncr-actions";
import {updateNcrInvestigation as action763} from "@/modules/quality/services/ncr-actions";
import {addNcrAction as action764} from "@/modules/quality/services/ncr-actions";
import {updateNcrAction as action765} from "@/modules/quality/services/ncr-actions";
import {closeNcr as action766} from "@/modules/quality/services/ncr-actions";
import {reopenNcr as action767} from "@/modules/quality/services/ncr-actions";
import {saveNcrAction as action768} from "@/modules/quality/services/ncr-actions";
import {saveSubstance as action769} from "@/modules/safety/services/assurance";
import {addSafetyDataSheet as action770} from "@/modules/safety/services/assurance";
import {saveCoshhAssessment as action771} from "@/modules/safety/services/assurance";
import {approveSubstance as action772} from "@/modules/safety/services/assurance";
import {saveCompetence as action773} from "@/modules/safety/services/assurance";
import {saveSafetyDocument as action774} from "@/modules/safety/services/assurance";
import {acknowledgeDocument as action775} from "@/modules/safety/services/assurance";
import {saveAudit as action776} from "@/modules/safety/services/assurance";
import {addAuditFinding as action777} from "@/modules/safety/services/assurance";
import {approveAudit as action778} from "@/modules/safety/services/assurance";
import {saveChange as action779} from "@/modules/safety/services/assurance";
import {advanceChange as action780} from "@/modules/safety/services/assurance";
import {linkSafetyRecord as action781} from "@/modules/safety/services/assurance";
import {saveSafetyProfile as action782} from "@/modules/safety/services/commands";
import {saveRiskMatrix as action783} from "@/modules/safety/services/commands";
import {createRisk as action784} from "@/modules/safety/services/commands";
import {addControl as action785} from "@/modules/safety/services/commands";
import {rateAssessment as action786} from "@/modules/safety/services/commands";
import {approveAssessment as action787} from "@/modules/safety/services/commands";
import {reviseAssessment as action788} from "@/modules/safety/services/commands";
import {requestRiskReview as action789} from "@/modules/safety/services/commands";
import {reportIncident as action790} from "@/modules/safety/services/commands";
import {saveImmediateControl as action791} from "@/modules/safety/services/commands";
import {openInvestigation as action792} from "@/modules/safety/services/commands";
import {addCause as action793} from "@/modules/safety/services/commands";
import {saveRootCause as action794} from "@/modules/safety/services/commands";
import {reviewRiddor as action795} from "@/modules/safety/services/commands";
import {createSafetyAction as action796} from "@/modules/safety/services/commands";
import {advanceAction as action797} from "@/modules/safety/services/commands";
import {verifyAction as action798} from "@/modules/safety/services/commands";
import {saveWorkplaceRecord as action799} from "@/modules/safety/services/commands";
import {createPermit as action800} from "@/modules/safety/services/control";
import {advancePermit as action801} from "@/modules/safety/services/control";
import {extendPermit as action802} from "@/modules/safety/services/control";
import {createIsolation as action803} from "@/modules/safety/services/control";
import {applyIsolationLock as action804} from "@/modules/safety/services/control";
import {verifyIsolation as action805} from "@/modules/safety/services/control";
import {clearIsolation as action806} from "@/modules/safety/services/control";
import {removeIsolationLock as action807} from "@/modules/safety/services/control";
import {placeSafetyHold as action808} from "@/modules/safety/services/control";
import {updateReturnToService as action809} from "@/modules/safety/services/control";
import {releaseSafetyHold as action810} from "@/modules/safety/services/control";
import {overrideSafetyHold as action811} from "@/modules/safety/services/control";
import {saveStatutoryCheck as action812} from "@/modules/safety/services/control";
import {completeInspection as action813} from "@/modules/safety/services/control";
import {createInspection as action814} from "@/modules/safety/services/control";
import {createSalesAddress as action815} from "@/modules/sales/services/address-actions";
import {createSalesCatalogueProduct as action816} from "@/modules/sales/services/catalogue-actions";
import {sendQuote as action817} from "@/modules/sales/services/commands";
import {changeQuoteStatus as action818} from "@/modules/sales/services/commands";
import {deleteQuote as action819} from "@/modules/sales/services/commands";
import {duplicateDocument as action820} from "@/modules/sales/services/commands";
import {saveQuoteTemplate as action821} from "@/modules/sales/services/commands";
import {createOrderFromQuote as action822} from "@/modules/sales/services/commands";
import {linkCommercialProject as action823} from "@/modules/sales/services/commercial";
import {openCallOffOrder as action824} from "@/modules/sales/services/commercial";
import {raiseCallOff as action825} from "@/modules/sales/services/commercial";
import {invoiceCallOffDelivery as action826} from "@/modules/sales/services/commercial";
import {deliverAndInvoiceCallOff as action827} from "@/modules/sales/services/commercial";
import {importSalescsv as action828} from "@/modules/sales/services/csv-import";
import {addDeliveryAddress as action829} from "@/modules/sales/services/delivery-address";
import {addInstaller as action830} from "@/modules/sales/services/delivery-address";
import {pricePartyId as action831} from "@/modules/sales/services/delivery-address";
import {linkOrderedFor as action832} from "@/modules/sales/services/delivery-address";
import {saveDocument as action833} from "@/modules/sales/services/documents";
import {saveInvoiceTemplate as action834} from "@/modules/sales/services/invoice-template-actions";
import {retireInvoiceTemplate as action835} from "@/modules/sales/services/invoice-template-actions";
import {attachCustomerInvoiceTemplate as action836} from "@/modules/sales/services/invoice-template-actions";
import {detachCustomerInvoiceTemplate as action837} from "@/modules/sales/services/invoice-template-actions";
import {createDraftOrder as action838} from "@/modules/sales/services/orders";
import {addOrderLine as action839} from "@/modules/sales/services/orders";
import {removeOrderLine as action840} from "@/modules/sales/services/orders";
import {updateDraftOrderFields as action841} from "@/modules/sales/services/orders";
import {confirmOrder as action842} from "@/modules/sales/services/orders";
import {decideApproval as action843} from "@/modules/sales/services/orders";
import {amendLineQuantity as action844} from "@/modules/sales/services/orders";
import {overrideLinePrice as action845} from "@/modules/sales/services/orders";
import {amendRequestedDate as action846} from "@/modules/sales/services/orders";
import {cancelOrder as action847} from "@/modules/sales/services/orders";
import {deleteOrder as action848} from "@/modules/sales/services/orders";
import {cancelLineRemaining as action849} from "@/modules/sales/services/orders";
import {addHold as action850} from "@/modules/sales/services/orders";
import {releaseHold as action851} from "@/modules/sales/services/orders";
import {redeemServiceRecovery as action852} from "@/modules/sales/services/recovery";
import {restoreCancelledOrder as action853} from "@/modules/sales/services/rewind";
import {returnOrderToQuote as action854} from "@/modules/sales/services/rewind";
import {saveOrderHashtags as action855} from "@/modules/sales/services/rewind";
import {saveSalesView as action856} from "@/modules/sales/services/saved-views";
import {archiveSalesView as action857} from "@/modules/sales/services/saved-views";
import {createCase as action858} from "@/modules/service/services/commands";
import {updateCase as action859} from "@/modules/service/services/commands";
import {assignCase as action860} from "@/modules/service/services/commands";
import {transitionCase as action861} from "@/modules/service/services/commands";
import {addCaseEntry as action862} from "@/modules/service/services/commands";
import {createDepartmentTicket as action863} from "@/modules/service/services/commands";
import {updateDepartmentTicket as action864} from "@/modules/service/services/commands";
import {createQueue as action865} from "@/modules/service/services/commands";
import {addQueueMember as action866} from "@/modules/service/services/commands";
import {linkCaseRecord as action867} from "@/modules/service/services/commands";
import {creditChoices as action868} from "@/modules/service/services/commands";
import {askFinanceForCredit as action869} from "@/modules/service/services/commands";
import {getCaseOwners as action870} from "@/modules/service/services/commands";
import {getDepartmentWork as action871} from "@/modules/service/services/commands";
import {savePurchaseContext as action872} from "@/modules/service/services/commands";
import {saveInvestigation as action873} from "@/modules/service/services/commands";
import {logCaseCall as action874} from "@/modules/service/services/commands";
import {createCaseRemedy as action875} from "@/modules/service/services/commands";
import {mergeCases as action876} from "@/modules/service/services/commands";
import {sendCaseEmail as action877} from "@/modules/service/services/communication";
import {invalidateCaseCsat as action878} from "@/modules/service/services/communication";
import {casePurchaseContext as action879} from "@/modules/service/services/context";
import {proposeRecovery as action880} from "@/modules/service/services/recovery";
import {decideRecovery as action881} from "@/modules/service/services/recovery";
import {saveServiceApprovalRoute as action882} from "@/modules/service/services/recovery";
import {getSopWorkspace as action883} from "@/modules/sop/services/workspace";
import {createSopCycle as action884} from "@/modules/sop/services/workspace";
import {configureSopCycle as action885} from "@/modules/sop/services/workspace";
import {generateSopForecast as action886} from "@/modules/sop/services/workspace";
import {approveSopVersion as action887} from "@/modules/sop/services/workspace";
import {updateSopWorkflow as action888} from "@/modules/sop/services/workspace";
import {publishSopVersion as action889} from "@/modules/sop/services/workspace";
import {createSopScenario as action890} from "@/modules/sop/services/workspace";
import {promoteSopScenario as action891} from "@/modules/sop/services/workspace";
import {overrideSopDemand as action892} from "@/modules/sop/services/workspace";
import {getLiveSopService as action893} from "@/modules/sop/services/workspace";
import {getSopComparison as action894} from "@/modules/sop/services/workspace";
import {getSopAccuracy as action895} from "@/modules/sop/services/workspace";
import {readAvailability as action896} from "@/modules/stock/services/availability";
import {readOrderChain as action897} from "@/modules/stock/services/availability";
import {inventoryExportRows as action898} from "@/modules/stock/services/export";
import {createTeam as action899} from "@/modules/teams/services/commands";
import {renameTeam as action900} from "@/modules/teams/services/commands";
import {addMember as action901} from "@/modules/teams/services/commands";
import {removeMember as action902} from "@/modules/teams/services/commands";
import {saveTask as action903} from "@/modules/teams/services/commands";
import {setTaskStatus as action904} from "@/modules/teams/services/commands";
import {removeTask as action905} from "@/modules/teams/services/commands";
import {saveCover as action906} from "@/modules/teams/services/commands";
import {removeCover as action907} from "@/modules/teams/services/commands";
import {saveHandover as action908} from "@/modules/teams/services/commands";
import {savePlace as action909} from "@/modules/teams/services/commands";
import {saveMoment as action910} from "@/modules/teams/services/commands";
import {removeMoment as action911} from "@/modules/teams/services/commands";
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
"src/app/(app)/chat/actions:taskChatAttachments":action42 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:chatSnapshot":action43 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/contracts/actions:createDealContract":action44 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:updateValueFormAction":action45 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:updateCloseDateFormAction":action46 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:setNextActionFormAction":action47 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:setForecastCategoryFormAction":action48 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:winFormAction":action49 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:loseFormAction":action50 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:addStakeholderFormAction":action51 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:addMilestoneFormAction":action52 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:toggleMilestoneFormAction":action53 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:logOpportunityActivityFormAction":action54 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/pipeline/actions:addDealAction":action55 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:qualifyFormAction":action56 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:disqualifyFormAction":action57 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:nurtureFormAction":action58 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:logProspectActivityFormAction":action59 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:assignProspectFormAction":action60 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:assignProspectTaskFormAction":action61 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:convertProspectFormAction":action62 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/reports/actions:pinReportToDashboard":action63 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createContactFormAction":action64 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateContactFormAction":action65 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:deleteContactFormAction":action66 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createAddressFormAction":action67 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createTaxRegistrationFormAction":action68 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:markTaxVerifiedFormAction":action69 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createBankAccountFormAction":action70 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createDirectDebitFormAction":action71 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:cancelDirectDebitFormAction":action72 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateCreditLimitFormAction":action73 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:toggleCreditHoldFormAction":action74 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createNoteFormAction":action75 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateStatusFormAction":action76 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:archiveCustomerFormAction":action77 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:unarchiveCustomerFormAction":action78 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:deleteCustomerFormAction":action79 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:createKpi":action80 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:saveGoal":action81 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:updateKpi":action82 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:recordProgress":action83 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:closeGoal":action84 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:addPlanGoal":action85 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:closePlan":action86 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:commentOnPlan":action87 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:connectGoal":action88 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/scorecards/actions:getScorecards":action89 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/scorecards/actions:saveScorecard":action90 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/scorecards/actions:removeScorecard":action91 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:syncDemandAction":action92 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:restoreDeliveryAction":action93 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:releaseAction":action94 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:allocateAction":action95 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:directShipAction":action96 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:groupAction":action97 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:scanAction":action98 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:lotAction":action99 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:serialAction":action100 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shortAction":action101 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeWorkAction":action102 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:claimAction":action103 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shipFromPickAction":action104 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packageAction":action105 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:weightAction":action106 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:stageAction":action107 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:labelAction":action108 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:dispatchAction":action109 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:trackingAction":action110 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:deliverAction":action111 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadCreateAction":action112 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadScanAction":action113 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:departAction":action114 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:expectAction":action115 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveLineAction":action116 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:putAwayAction":action117 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeReceiptAction":action118 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferAction":action119 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferReceiveAction":action120 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:returnRequestAction":action121 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:authoriseReturnAction":action122 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveReturnAction":action123 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:inspectAction":action124 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:closeReturnAction":action125 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:assignEquipmentAction":action126 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packUnitAction":action127 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:saveHandlingTypeAction":action128 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:retireHandlingTypeAction":action129 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:removeHandlingTypeAction":action130 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:policyAction":action131 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:runMrpAction":action132 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:firmPlannedOrderAction":action133 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:dismissPlannedOrderAction":action134 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/forecast/actions:setForecastAction":action135 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/forecast/actions:deleteForecastAction":action136 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:runMrpForm":action137 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:firmPlannedOrderForm":action138 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:dismissPlannedOrderForm":action139 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/produce/actions:raiseProductionOrderAction":action140 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:previewMoveAction":action141 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:commitMoveAction":action142 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:toggleLockAction":action143 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:saveShiftAction":action144 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:deleteShiftAction":action145 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:startAction":action146 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:pauseAction":action147 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:completeAction":action148 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:loadNotices":action149 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotice":action150 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotices":action151 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:getPayrollPreparation":action152 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:createPayrollRun":action153 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:updatePayslipDeductions":action154 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:finalisePayrollRun":action155 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:refreshPayrollRun":action156 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:savePeriodAdjustment":action157 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:markPayrollRunPaid":action158 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:savePayrollSettings":action159 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP45":action160 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP60":action161 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/employees/actions:getPayEmployees":action162 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/employees/actions:savePayEmployee":action163 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:logAbsence":action164 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:requestLeave":action165 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:cancelOwnLeave":action166 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:approveLeaveRequest":action167 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:setLeaveAllowance":action168 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:rejectLeaveRequest":action169 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:createEmployee":action170 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:changeEmployeeStatus":action171 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeProfile":action172 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateOwnEmployeeDetails":action173 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeDocument":action174 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:linkEmployeeToUser":action175 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:completeEmployeeTask":action176 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeTask":action177 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeContact":action178 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeTask":action179 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:scheduleAppraisal":action180 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:completeAppraisal":action181 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getConductDesk":action182 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getMyConduct":action183 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getPlan":action184 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getCase":action185 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:conductChoices":action186 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:savePlan":action187 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addPlanReview":action188 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:commentOnPlan":action189 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:saveCase":action190 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:respondToCase":action191 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addCaseEvent":action192 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:submitExpenseClaim":action193 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:approveExpenseClaim":action194 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:rejectExpenseClaim":action195 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:scheduleOneToOne":action196 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:completeOneToOne":action197 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/platform-actions:saveVacancy":action198 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/platform-actions:saveApplication":action199 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/platform-actions:saveTraining":action200 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/platform-actions:saveHRDocument":action201 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:listPolicies":action202 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:publishPolicy":action203 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:archivePolicy":action204 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:openPolicy":action205 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:createShift":action206 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:changeShiftStatus":action207 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyHR":action208 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyTeam":action209 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getTeamEmployee":action210 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:addPrivateNote":action211 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:updateWorkingPattern":action212 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:updateHrSettings":action213 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createAppraisalTemplate":action214 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleAppraisalTemplateActive":action215 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createOneToOneTemplate":action216 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleOneToOneTemplateActive":action217 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:getTimesheetContext":action218 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:saveTimesheet":action219 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:reviewTimesheet":action220 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:createPriceList":action221 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:savePriceEntry":action222 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveRule":action223 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:setRuleActive":action224 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:updatePriceBasis":action225 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:renamePriceList":action226 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:assignPriceListCustomers":action227 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:checkSalesPrice":action228 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:assignPriceList":action229 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewPriceCsv":action230 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyPriceCsv":action231 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreement":action232 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreementPrice":action233 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:removeAgreementPrice":action234 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewAgreementCsv":action235 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyAgreementCsv":action236 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProduct":action237 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProductRecord":action238 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveCategory":action239 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:retireCategory":action240 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:addStandardCategories":action241 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:savePack":action242 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveLinks":action243 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveMeasures":action244 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/actions:saveProfile":action245 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/task-actions:loadMyTasks":action246 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/task-actions:loadMyTask":action247 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/task-actions:updateMyTaskStatus":action248 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/task-actions:loadMyTaskCount":action249 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/work:loadAssignedWork":action250 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProject":action251 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeProjectStatus":action252 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editProject":action253 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProjectMember":action254 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:archiveProject":action255 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTask":action256 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeTaskStatus":action257 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeAssignedTaskStatus":action258 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editTask":action259 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:checklistItem":action260 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addDependency":action261 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMeeting":action262 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDocument":action263 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editDocument":action264 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addComment":action265 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMilestone":action266 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:publishUpdate":action267 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDecision":action268 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:decide":action269 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createRisk":action270 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:closeRisk":action271 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:requestApproval":action272 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:respondApproval":action273 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:submitRequest":action274 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:triageRequest":action275 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:logTime":action276 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:planToday":action277 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:updateInbox":action278 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveView":action279 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createPortfolio":action280 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createBaseline":action281 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setBudget":action282 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:linkWork":action283 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectActivity":action284 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createAutomation":action285 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:toggleAutomation":action286 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveProjectTemplate":action287 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:useProjectTemplate":action288 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:startTimer":action289 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:stopTimer":action290 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:projectPreference":action291 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:uploadProjectFile":action292 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:readProjectFile":action293 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProperty":action294 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProperty":action295 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:restoreDocument":action296 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTaskFromDocument":action297 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:discardTimer":action298 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:completeMilestone":action299 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:resolveComment":action300 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectWorkload":action301 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:rescheduleTask":action302 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:newContractAction":action303 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:resendContractAction":action304 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:deleteContractAction":action305 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:createOrderForm":action306 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addLineForm":action307 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:removeLineForm":action308 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:confirmOrderForm":action309 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:updateOrderForm":action310 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:chooseOrderAddresses":action311 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addHoldForm":action312 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:releaseHoldForm":action313 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:approveOrderForm":action314 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:cancelOrderForm":action315 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:saveOrderHashtagsForm":action316 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:restoreCancelledOrderForm":action317 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:returnOrderToQuoteForm":action318 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:scheduleOrderDelivery":action319 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:rejectOrderApproval":action320 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:deleteOrderForm":action321 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:createQuote":action322 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:deleteQuoteForm":action323 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/settings/actions:saveCreationPolicy":action324 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/sites/actions:saveSiteAction":action325 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/sites/actions:setDocumentSiteAction":action326 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getSchedule":action327 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:createBulkShifts":action328 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:setScheduledShift":action329 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:completeShiftTask":action330 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:editScheduledShift":action331 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishWeekShifts":action332 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveHoursBudget":action333 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getTeamPlan":action334 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getPersonSchedule":action335 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveWorkType":action336 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:archiveWorkType":action337 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveDemand":action338 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveBusyRule":action339 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:removeBusyRule":action340 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:fillTeamMonth":action341 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:replanCover":action342 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishMonth":action343 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveShift":action344 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:getWorkforce":action345 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:placeBreak":action346 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:saveActivity":action347 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:removeActivity":action348 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:saveInterval":action349 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:removeInterval":action350 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:createOpening":action351 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:requestOpening":action352 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:decideOpening":action353 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:cancelOpening":action354 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:saveAvailability":action355 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:removeAvailability":action356 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveRole":action357 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveMemberRoles":action358 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:createUser":action359 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyAccess":action360 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyProfile":action361 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveManagerPolicy":action362 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveWorkspaceDetails":action363 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyBrand":action364 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/imports/actions:importCsv":action365 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveEmailAccount":action366 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:verifyEmailAccount":action367 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:sendTestEmail":action368 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:makeDefaultAccount":action369 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:setAccountActive":action370 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteEmailAccount":action371 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveSocialAccount":action372 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteSocialAccount":action373 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:checkSocialAccount":action374 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveEmailTemplate":action375 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteEmailTemplate":action376 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:checkInboxNow":action377 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/logistics/actions:saveDispatchDelivery":action378 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveUserAccess":action379 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:setUserStatus":action380 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:revokeUserSessions":action381 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:issuePasswordRecovery":action382 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createManagedUser":action383 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:linkEmployeeProfile":action384 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createRole":action385 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveManagementGroup":action386 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createWarehouse":action387 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:adjustStock":action388 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:savePlanningAction":action389 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:makeFromForecastAction":action390 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:transferStock":action391 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createSiteAction":action392 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createPlaceAction":action393 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:assignSiteAction":action394 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:addLocationAction":action395 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:ensureLocationsAction":action396 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:retireLocationAction":action397 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:putOnLocationAction":action398 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:moveLocatedAction":action399 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:receiveMoveAction":action400 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/handoffs/actions:collectBatch":action401 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/studio/actions:create":action402 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/studio/actions:save":action403 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/studio/actions:validate":action404 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/studio/actions:publish":action405 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/studio/actions:activate":action406 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/teams/[teamId]/capacity/actions:getCapacity":action407 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/teams/[teamId]/capacity/actions:saveAllocation":action408 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/teams/[teamId]/capacity/actions:updateWorkStatus":action409 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/templates/actions:saveTemplate":action410 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/templates/actions:archiveTemplate":action411 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/templates/actions:generateTemplateDocument":action412 as (...args:never[])=>Promise<unknown>,
"src/core/approvals/actions:delegateApprovals":action413 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:loginAction":action414 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:logoutAction":action415 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:logoutAdminAction":action416 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:completePasswordRecovery":action417 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:changeOwnPassword":action418 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:signOutOtherSessions":action419 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:createContract":action420 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:sendContract":action421 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:shareContractLink":action422 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:updateDraftContract":action423 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:revokeContract":action424 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:deleteContract":action425 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:signContract":action426 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:returnSignedContract":action427 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:reviewContractReturn":action428 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:declineContract":action429 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:loadPublicContract":action430 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:loadPublicContractFile":action431 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:checkForDuplicatesAction":action432 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:createCustomerAction":action433 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createCustomer":action434 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerStatus":action435 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:archiveCustomer":action436 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:unarchiveCustomer":action437 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteCustomer":action438 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createContact":action439 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateContact":action440 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteContact":action441 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createAddress":action442 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCommercialSettings":action443 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCreditLimit":action444 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setCreditHold":action445 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setPaymentTerm":action446 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createTaxRegistration":action447 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:markTaxRegistrationManuallyVerified":action448 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createBankAccount":action449 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:revealBankAccount":action450 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createDirectDebitMandate":action451 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:cancelDirectDebitMandate":action452 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createNote":action453 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:saveCustomerHashtags":action454 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerDetails":action455 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateAddress":action456 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:archiveAddress":action457 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commercial-actions:saveOrderingPreferences":action458 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setCustomerParent":action459 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:placeCustomer":action460 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:moveCustomer":action461 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setContactReportsTo":action462 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:saveCustomerTradingLink":action463 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:setInvoiceAccount":action464 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:archiveCustomerTradingLink":action465 as (...args:never[])=>Promise<unknown>,
"src/core/finance/actions:requestSalesInvoice":action466 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:createWork":action467 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:updateWork":action468 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:commentWork":action469 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:watchWork":action470 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:mergeWork":action471 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:requestWorkApproval":action472 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:decideWorkApproval":action473 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:saveDeskQueue":action474 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:changeDeskMember":action475 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/file-actions:attachServiceFile":action476 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/knowledge:saveKnowledge":action477 as (...args:never[])=>Promise<unknown>,
"src/core/teams/actions:createWorkTeam":action478 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditBoard":action479 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:exportAuditReport":action480 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEcho":action481 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:postEchoNote":action482 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEchoInbox":action483 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditAccess":action484 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditOwnActivity":action485 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditAreas":action486 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:saveAutomation":action487 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:setAutomationEnabled":action488 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:deleteAutomation":action489 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:testOnPastEvent":action490 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:runNow":action491 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:logActivity":action492 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:completeActivity":action493 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/appointments:saveAppointment":action494 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/appointments:finishAppointment":action495 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/appointments:saveAppointmentForm":action496 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/appointments:finishAppointmentForm":action497 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/marketing-handoff:acceptMarketingHandoff":action498 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:createOpportunity":action499 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:moveOpportunityStage":action500 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityValue":action501 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityCloseDate":action502 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityForecastCategory":action503 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityNextAction":action504 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:winOpportunity":action505 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:loseOpportunity":action506 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addStakeholder":action507 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addMilestone":action508 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:toggleMilestone":action509 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:checkProspectDuplicatesAction":action510 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createProspect":action511 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:assignProspect":action512 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:setProspectLifecycleStage":action513 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:convertProspect":action514 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createIndustry":action515 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:saveProspectGrouping":action516 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProject":action517 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProjectFormAction":action518 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:saveSalesProjectAction":action519 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:saveNextActionAction":action520 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addProjectOrganisationAction":action521 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:removeProjectOrganisationAction":action522 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:makePrimaryOrganisationAction":action523 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addProjectStakeholderAction":action524 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:removeProjectStakeholderAction":action525 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:setDocumentSalesProjectAction":action526 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:deleteSalesProjectAction":action527 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:saveSurvey":action528 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:createSurveyFromTemplate":action529 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:setSurveyActive":action530 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:deleteSurvey":action531 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatScore":action532 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatComment":action533 as (...args:never[])=>Promise<unknown>,
"src/modules/engineering/services/commands:saveEngineeringRevision":action534 as (...args:never[])=>Promise<unknown>,
"src/modules/engineering/services/commands:transitionEngineeringRevision":action535 as (...args:never[])=>Promise<unknown>,
"src/modules/engineering/services/commands:uploadEngineeringDrawing":action536 as (...args:never[])=>Promise<unknown>,
"src/modules/fieldservice/services/commands:saveFieldJob":action537 as (...args:never[])=>Promise<unknown>,
"src/modules/fieldservice/services/commands:updateFieldJob":action538 as (...args:never[])=>Promise<unknown>,
"src/modules/fieldservice/services/commands:addFieldJobNote":action539 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:importFinanceStatement":action540 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:reconcileFinanceStatement":action541 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:financeReconciliationForm":action542 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:getFinanceReconciliation":action543 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:importFinanceStatementForm":action544 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/collections:getFinanceCollections":action545 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/collections:recordFinanceCollection":action546 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setupFinance":action547 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceDocument":action548 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:submitFinanceDocument":action549 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveApprovalPolicy":action550 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:decideFinanceApproval":action551 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPurchaseOrder":action552 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:raiseServiceCredit":action553 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postFinanceDocument":action554 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:recordGoodsReceipt":action555 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:onboardSupplier":action556 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveSupplier":action557 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:requestSupplierBankChange":action558 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:verifySupplierBank":action559 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceBank":action560 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:importBankTransactions":action561 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocateBankTransaction":action562 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPaymentRun":action563 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approvePaymentRun":action564 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createManualJournal":action565 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveManualJournal":action566 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:reverseJournal":action567 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setFinancePeriodState":action568 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceBudget":action569 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceAsset":action570 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postAssetDepreciation":action571 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:completeCloseTask":action572 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceContract":action573 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceScenario":action574 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:receiptForm":action575 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:journalForm":action576 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:statementForm":action577 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocationForm":action578 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:paymentRunForm":action579 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:policyForm":action580 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:scenarioForm":action581 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:uploadFinanceAttachment":action582 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateSalesInvoice":action583 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateInvoiceAdjustment":action584 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:voidFinanceDraft":action585 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:getFinanceConfiguration":action586 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:saveFinanceEntityDetails":action587 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:saveFinanceAccount":action588 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:saveFinanceDimension":action589 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:createFinancePeriod":action590 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:setFinancePeriodExceptions":action591 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:requestFinancePeriodReopen":action592 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:decideFinancePeriodReopen":action593 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceHome":action594 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:listFinanceDocuments":action595 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceDocument":action596 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceWorkspace":action597 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:financeChoices":action598 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getBudgetPositions":action599 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getInvoiceCashForecast":action600 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinancialReport":action601 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceCustomerContribution":action602 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:searchFinance":action603 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceAttachment":action604 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getSalesFinanceProjection":action605 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getReceivingWarehouses":action606 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/reporting:getFinanceLedger":action607 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/reporting:getFinanceJournalDetail":action608 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/reporting:getFinanceSubledgerReconciliation":action609 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/save-draft:saveFinanceDraft":action610 as (...args:never[])=>Promise<unknown>,
"src/modules/fleet/services/commands:saveVehicle":action611 as (...args:never[])=>Promise<unknown>,
"src/modules/fleet/services/commands:addFleetLog":action612 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:saveEquipment":action613 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:createMaintenanceWork":action614 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:updateMaintenanceWork":action615 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:recordMaintenancePart":action616 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:createProductionOrder":action617 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:markOrderReady":action618 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:releaseOrder":action619 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:closeOrder":action620 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:startWorkOrder":action621 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:pauseWorkOrder":action622 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:completeWorkOrder":action623 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:listForecasts":action624 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:setForecast":action625 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:deleteForecast":action626 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:runMrp":action627 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:firmSuggestion":action628 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:dismissSuggestion":action629 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:latestPlan":action630 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:loadPlant":action631 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveWorkCentre":action632 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveMachine":action633 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:retirePlantRecord":action634 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:schedulePreview":action635 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:rescheduleWorkOrder":action636 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:setWorkOrderLock":action637 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:listShifts":action638 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:saveShift":action639 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:deleteShift":action640 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:createCampaignAction":action641 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveCampaignBriefAction":action642 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveBudgetLineAction":action643 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deleteBudgetLineAction":action644 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveActivityAction":action645 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:setActivityStatusAction":action646 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deleteActivityAction":action647 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:addPaidSpendAction":action648 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deletePaidSpendAction":action649 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:createCampaignAction":action650 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveCampaignBriefAction":action651 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveBudgetLineAction":action652 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deleteBudgetLineAction":action653 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveActivityAction":action654 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:setActivityStatusAction":action655 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deleteActivityAction":action656 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:addPaidSpendAction":action657 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deletePaidSpendAction":action658 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createCampaign":action659 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updateCampaign":action660 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProfile":action661 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:recordPermission":action662 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:suppressProfile":action663 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createAudience":action664 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:previewAudience":action665 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createContent":action666 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:approveContent":action667 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createMessage":action668 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:lockSend":action669 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:cancelSend":action670 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:ingestEvent":action671 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourney":action672 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:publishJourney":action673 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:reviseJourney":action674 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProgram":action675 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createExperiment":action676 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:leadFeedback":action677 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:processJourneySteps":action678 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:saveMarketingPlan":action679 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addPlanActivity":action680 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updatePlanActivity":action681 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addBudgetLine":action682 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:submitBudgetToFinance":action683 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourneyMap":action684 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyStage":action685 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyTouch":action686 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:editJourneyStage":action687 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:moveJourneyStage":action688 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:editJourneyTouch":action689 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:saveJourneyPath":action690 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:editJourneyStageForm":action691 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:moveJourneyStageForm":action692 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:editJourneyTouchForm":action693 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:saveJourneyPathForm":action694 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:saveSocialPost":action695 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:deleteSocialPost":action696 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:retrySocialPost":action697 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:disconnectMicrosoftCalendar":action698 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:chooseMicrosoftCalendar":action699 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:sendMicrosoftMeeting":action700 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:importMicrosoftMeetings":action701 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:saveMeeting":action702 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:meetingStatus":action703 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:addMeetingEntry":action704 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:completeMeetingAction":action705 as (...args:never[])=>Promise<unknown>,
"src/modules/people/services/finance-expenses:getApprovedExpenseSource":action706 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:getPlanBuilder":action707 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:savePlanInput":action708 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:setPlanInputIncluded":action709 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:applyPlanInputs":action710 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:savePlanGrid":action711 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:removePlanMeasure":action712 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createPlan":action713 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveCell":action714 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addMeasure":action715 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAssumption":action716 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDriver":action717 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addLink":action718 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createScenario":action719 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:promoteScenario":action720 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:submitPlan":action721 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:approvePlan":action722 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:lockPlan":action723 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addGoal":action724 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addInitiative":action725 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createProjectForInitiative":action726 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAction":action727 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeAction":action728 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addRisk":action729 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDependency":action730 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDecision":action731 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addComment":action732 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addUpdate":action733 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeReview":action734 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addReview":action735 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:distributeTargets":action736 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:importGrid":action737 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:sharePlan":action738 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:unsharePlan":action739 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:setPlanAudience":action740 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addNote":action741 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveGoalProgress":action742 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:savePlanBrief":action743 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:listProductionPlans":action744 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getPlanOptions":action745 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getProductionPlan":action746 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:createProductionPlan":action747 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:addProductionPlanLine":action748 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getAssignedPlanningWork":action749 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/queries:getPlanningCoverage":action750 as (...args:never[])=>Promise<unknown>,
"src/modules/products/services/make:saveProductRecipe":action751 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createSpecification":action752 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:setSpecificationStatus":action753 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createControlPoint":action754 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:executeInspection":action755 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:releaseHold":action756 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:reportNcr":action757 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrInvestigation":action758 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:addNcrAction":action759 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrAction":action760 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:closeNcr":action761 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:reportNcr":action762 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:updateNcrInvestigation":action763 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:addNcrAction":action764 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:updateNcrAction":action765 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:closeNcr":action766 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:reopenNcr":action767 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:saveNcrAction":action768 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSubstance":action769 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addSafetyDataSheet":action770 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCoshhAssessment":action771 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveSubstance":action772 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCompetence":action773 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSafetyDocument":action774 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:acknowledgeDocument":action775 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveAudit":action776 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addAuditFinding":action777 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveAudit":action778 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveChange":action779 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:advanceChange":action780 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:linkSafetyRecord":action781 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveSafetyProfile":action782 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRiskMatrix":action783 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createRisk":action784 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addControl":action785 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:rateAssessment":action786 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:approveAssessment":action787 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviseAssessment":action788 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:requestRiskReview":action789 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reportIncident":action790 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveImmediateControl":action791 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:openInvestigation":action792 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addCause":action793 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRootCause":action794 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviewRiddor":action795 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createSafetyAction":action796 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:advanceAction":action797 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:verifyAction":action798 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveWorkplaceRecord":action799 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createPermit":action800 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:advancePermit":action801 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:extendPermit":action802 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createIsolation":action803 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:applyIsolationLock":action804 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:verifyIsolation":action805 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:clearIsolation":action806 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:removeIsolationLock":action807 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:placeSafetyHold":action808 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:updateReturnToService":action809 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:releaseSafetyHold":action810 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:overrideSafetyHold":action811 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:saveStatutoryCheck":action812 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:completeInspection":action813 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createInspection":action814 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/address-actions:createSalesAddress":action815 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/catalogue-actions:createSalesCatalogueProduct":action816 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:sendQuote":action817 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:changeQuoteStatus":action818 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:deleteQuote":action819 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:duplicateDocument":action820 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:saveQuoteTemplate":action821 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:createOrderFromQuote":action822 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:linkCommercialProject":action823 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:openCallOffOrder":action824 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:raiseCallOff":action825 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:invoiceCallOffDelivery":action826 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:deliverAndInvoiceCallOff":action827 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/csv-import:importSalescsv":action828 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:addDeliveryAddress":action829 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:addInstaller":action830 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:pricePartyId":action831 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:linkOrderedFor":action832 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/documents:saveDocument":action833 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:saveInvoiceTemplate":action834 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:retireInvoiceTemplate":action835 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:attachCustomerInvoiceTemplate":action836 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:detachCustomerInvoiceTemplate":action837 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:createDraftOrder":action838 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addOrderLine":action839 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:removeOrderLine":action840 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:updateDraftOrderFields":action841 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:confirmOrder":action842 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:decideApproval":action843 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendLineQuantity":action844 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:overrideLinePrice":action845 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendRequestedDate":action846 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelOrder":action847 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:deleteOrder":action848 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelLineRemaining":action849 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addHold":action850 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:releaseHold":action851 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/recovery:redeemServiceRecovery":action852 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:restoreCancelledOrder":action853 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:returnOrderToQuote":action854 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:saveOrderHashtags":action855 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:saveSalesView":action856 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:archiveSalesView":action857 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createCase":action858 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateCase":action859 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:assignCase":action860 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:transitionCase":action861 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addCaseEntry":action862 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createDepartmentTicket":action863 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateDepartmentTicket":action864 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createQueue":action865 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addQueueMember":action866 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:linkCaseRecord":action867 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:creditChoices":action868 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:askFinanceForCredit":action869 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getCaseOwners":action870 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getDepartmentWork":action871 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:savePurchaseContext":action872 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:saveInvestigation":action873 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:logCaseCall":action874 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createCaseRemedy":action875 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:mergeCases":action876 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/communication:sendCaseEmail":action877 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/communication:invalidateCaseCsat":action878 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/context:casePurchaseContext":action879 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/recovery:proposeRecovery":action880 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/recovery:decideRecovery":action881 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/recovery:saveServiceApprovalRoute":action882 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getSopWorkspace":action883 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:createSopCycle":action884 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:configureSopCycle":action885 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:generateSopForecast":action886 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:approveSopVersion":action887 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:updateSopWorkflow":action888 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:publishSopVersion":action889 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:createSopScenario":action890 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:promoteSopScenario":action891 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:overrideSopDemand":action892 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getLiveSopService":action893 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getSopComparison":action894 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getSopAccuracy":action895 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readAvailability":action896 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readOrderChain":action897 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/export:inventoryExportRows":action898 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:createTeam":action899 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:renameTeam":action900 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:addMember":action901 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMember":action902 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveTask":action903 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:setTaskStatus":action904 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeTask":action905 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveCover":action906 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeCover":action907 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveHandover":action908 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:savePlace":action909 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveMoment":action910 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMoment":action911 as (...args:never[])=>Promise<unknown>
});
