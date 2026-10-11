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
import {saveManagedUserDetails as action379} from "@/app/(app)/settings/user-actions";
import {setManagedUserPassword as action380} from "@/app/(app)/settings/user-actions";
import {saveUserAccess as action381} from "@/app/(app)/settings/user-actions";
import {setUserStatus as action382} from "@/app/(app)/settings/user-actions";
import {revokeUserSessions as action383} from "@/app/(app)/settings/user-actions";
import {issuePasswordRecovery as action384} from "@/app/(app)/settings/user-actions";
import {createManagedUser as action385} from "@/app/(app)/settings/user-actions";
import {linkEmployeeProfile as action386} from "@/app/(app)/settings/user-actions";
import {createRole as action387} from "@/app/(app)/settings/user-actions";
import {saveManagementGroup as action388} from "@/app/(app)/settings/user-actions";
import {createWarehouse as action389} from "@/app/(app)/stock/actions";
import {adjustStock as action390} from "@/app/(app)/stock/actions";
import {savePlanningAction as action391} from "@/app/(app)/stock/actions";
import {makeFromForecastAction as action392} from "@/app/(app)/stock/actions";
import {transferStock as action393} from "@/app/(app)/stock/actions";
import {createSiteAction as action394} from "@/app/(app)/stock/actions";
import {createPlaceAction as action395} from "@/app/(app)/stock/actions";
import {assignSiteAction as action396} from "@/app/(app)/stock/actions";
import {addLocationAction as action397} from "@/app/(app)/stock/actions";
import {ensureLocationsAction as action398} from "@/app/(app)/stock/actions";
import {retireLocationAction as action399} from "@/app/(app)/stock/actions";
import {putOnLocationAction as action400} from "@/app/(app)/stock/actions";
import {moveLocatedAction as action401} from "@/app/(app)/stock/actions";
import {receiveMoveAction as action402} from "@/app/(app)/stock/actions";
import {collectBatch as action403} from "@/app/(app)/stock/handoffs/actions";
import {create as action404} from "@/app/(app)/studio/actions";
import {save as action405} from "@/app/(app)/studio/actions";
import {validate as action406} from "@/app/(app)/studio/actions";
import {publish as action407} from "@/app/(app)/studio/actions";
import {activate as action408} from "@/app/(app)/studio/actions";
import {getCapacity as action409} from "@/app/(app)/teams/[teamId]/capacity/actions";
import {saveAllocation as action410} from "@/app/(app)/teams/[teamId]/capacity/actions";
import {updateWorkStatus as action411} from "@/app/(app)/teams/[teamId]/capacity/actions";
import {saveTemplate as action412} from "@/app/(app)/templates/actions";
import {archiveTemplate as action413} from "@/app/(app)/templates/actions";
import {generateTemplateDocument as action414} from "@/app/(app)/templates/actions";
import {delegateApprovals as action415} from "@/core/approvals/actions";
import {loginAction as action416} from "@/core/auth/actions";
import {logoutAction as action417} from "@/core/auth/actions";
import {logoutAdminAction as action418} from "@/core/auth/actions";
import {completePasswordRecovery as action419} from "@/core/auth/security-actions";
import {changeOwnPassword as action420} from "@/core/auth/security-actions";
import {signOutOtherSessions as action421} from "@/core/auth/security-actions";
import {createContract as action422} from "@/core/contracts/actions";
import {sendContract as action423} from "@/core/contracts/actions";
import {shareContractLink as action424} from "@/core/contracts/actions";
import {updateDraftContract as action425} from "@/core/contracts/actions";
import {revokeContract as action426} from "@/core/contracts/actions";
import {deleteContract as action427} from "@/core/contracts/actions";
import {signContract as action428} from "@/core/contracts/actions";
import {returnSignedContract as action429} from "@/core/contracts/actions";
import {reviewContractReturn as action430} from "@/core/contracts/actions";
import {declineContract as action431} from "@/core/contracts/actions";
import {loadPublicContract as action432} from "@/core/contracts/actions";
import {loadPublicContractFile as action433} from "@/core/contracts/actions";
import {checkForDuplicatesAction as action434} from "@/core/customers/actions";
import {createCustomerAction as action435} from "@/core/customers/actions";
import {createCustomer as action436} from "@/core/customers/commands";
import {updateCustomerStatus as action437} from "@/core/customers/commands";
import {archiveCustomer as action438} from "@/core/customers/commands";
import {unarchiveCustomer as action439} from "@/core/customers/commands";
import {deleteCustomer as action440} from "@/core/customers/commands";
import {createContact as action441} from "@/core/customers/commands";
import {updateContact as action442} from "@/core/customers/commands";
import {deleteContact as action443} from "@/core/customers/commands";
import {createAddress as action444} from "@/core/customers/commands";
import {updateCommercialSettings as action445} from "@/core/customers/commands";
import {updateCreditLimit as action446} from "@/core/customers/commands";
import {setCreditHold as action447} from "@/core/customers/commands";
import {setPaymentTerm as action448} from "@/core/customers/commands";
import {createTaxRegistration as action449} from "@/core/customers/commands";
import {markTaxRegistrationManuallyVerified as action450} from "@/core/customers/commands";
import {createBankAccount as action451} from "@/core/customers/commands";
import {revealBankAccount as action452} from "@/core/customers/commands";
import {createDirectDebitMandate as action453} from "@/core/customers/commands";
import {cancelDirectDebitMandate as action454} from "@/core/customers/commands";
import {createNote as action455} from "@/core/customers/commands";
import {saveCustomerHashtags as action456} from "@/core/customers/commands";
import {updateCustomerDetails as action457} from "@/core/customers/commands";
import {updateAddress as action458} from "@/core/customers/commands";
import {archiveAddress as action459} from "@/core/customers/commands";
import {saveOrderingPreferences as action460} from "@/core/customers/commercial-actions";
import {setCustomerParent as action461} from "@/core/customers/hierarchy-actions";
import {placeCustomer as action462} from "@/core/customers/hierarchy-actions";
import {moveCustomer as action463} from "@/core/customers/hierarchy-actions";
import {setContactReportsTo as action464} from "@/core/customers/hierarchy-actions";
import {saveCustomerTradingLink as action465} from "@/core/customers/trading-actions";
import {setInvoiceAccount as action466} from "@/core/customers/trading-actions";
import {archiveCustomerTradingLink as action467} from "@/core/customers/trading-actions";
import {requestSalesInvoice as action468} from "@/core/finance/actions";
import {createWork as action469} from "@/core/service-work/actions";
import {updateWork as action470} from "@/core/service-work/actions";
import {commentWork as action471} from "@/core/service-work/actions";
import {watchWork as action472} from "@/core/service-work/actions";
import {mergeWork as action473} from "@/core/service-work/actions";
import {requestWorkApproval as action474} from "@/core/service-work/actions";
import {decideWorkApproval as action475} from "@/core/service-work/actions";
import {saveDeskQueue as action476} from "@/core/service-work/actions";
import {changeDeskMember as action477} from "@/core/service-work/actions";
import {attachServiceFile as action478} from "@/core/service-work/file-actions";
import {saveKnowledge as action479} from "@/core/service-work/knowledge";
import {createWorkTeam as action480} from "@/core/teams/actions";
import {loadAuditBoard as action481} from "@/modules/audit/services/actions";
import {exportAuditReport as action482} from "@/modules/audit/services/actions";
import {loadEcho as action483} from "@/modules/audit/services/actions";
import {postEchoNote as action484} from "@/modules/audit/services/actions";
import {loadEchoInbox as action485} from "@/modules/audit/services/actions";
import {loadAuditAccess as action486} from "@/modules/audit/services/actions";
import {saveAuditOwnActivity as action487} from "@/modules/audit/services/actions";
import {saveAuditAreas as action488} from "@/modules/audit/services/actions";
import {saveAutomation as action489} from "@/modules/automations/services/actions";
import {setAutomationEnabled as action490} from "@/modules/automations/services/actions";
import {deleteAutomation as action491} from "@/modules/automations/services/actions";
import {testOnPastEvent as action492} from "@/modules/automations/services/actions";
import {runNow as action493} from "@/modules/automations/services/actions";
import {logActivity as action494} from "@/modules/crm/services/activities";
import {completeActivity as action495} from "@/modules/crm/services/activities";
import {saveAppointment as action496} from "@/modules/crm/services/appointments";
import {finishAppointment as action497} from "@/modules/crm/services/appointments";
import {saveAppointmentForm as action498} from "@/modules/crm/services/appointments";
import {finishAppointmentForm as action499} from "@/modules/crm/services/appointments";
import {acceptMarketingHandoff as action500} from "@/modules/crm/services/marketing-handoff";
import {createOpportunity as action501} from "@/modules/crm/services/opportunities";
import {moveOpportunityStage as action502} from "@/modules/crm/services/opportunities";
import {updateOpportunityValue as action503} from "@/modules/crm/services/opportunities";
import {updateOpportunityCloseDate as action504} from "@/modules/crm/services/opportunities";
import {setOpportunityForecastCategory as action505} from "@/modules/crm/services/opportunities";
import {setOpportunityNextAction as action506} from "@/modules/crm/services/opportunities";
import {winOpportunity as action507} from "@/modules/crm/services/opportunities";
import {loseOpportunity as action508} from "@/modules/crm/services/opportunities";
import {addStakeholder as action509} from "@/modules/crm/services/opportunities";
import {addMilestone as action510} from "@/modules/crm/services/opportunities";
import {toggleMilestone as action511} from "@/modules/crm/services/opportunities";
import {checkProspectDuplicatesAction as action512} from "@/modules/crm/services/prospects";
import {createProspect as action513} from "@/modules/crm/services/prospects";
import {assignProspect as action514} from "@/modules/crm/services/prospects";
import {setProspectLifecycleStage as action515} from "@/modules/crm/services/prospects";
import {convertProspect as action516} from "@/modules/crm/services/prospects";
import {createIndustry as action517} from "@/modules/crm/services/prospects";
import {saveProspectGrouping as action518} from "@/modules/crm/services/prospects";
import {createSalesProject as action519} from "@/modules/crm/services/sales-projects-commands";
import {createSalesProjectFormAction as action520} from "@/modules/crm/services/sales-projects-commands";
import {saveSalesProjectAction as action521} from "@/modules/crm/services/sales-projects-commands";
import {saveNextActionAction as action522} from "@/modules/crm/services/sales-projects-commands";
import {addProjectOrganisationAction as action523} from "@/modules/crm/services/sales-projects-commands";
import {removeProjectOrganisationAction as action524} from "@/modules/crm/services/sales-projects-commands";
import {makePrimaryOrganisationAction as action525} from "@/modules/crm/services/sales-projects-commands";
import {addProjectStakeholderAction as action526} from "@/modules/crm/services/sales-projects-commands";
import {removeProjectStakeholderAction as action527} from "@/modules/crm/services/sales-projects-commands";
import {setDocumentSalesProjectAction as action528} from "@/modules/crm/services/sales-projects-commands";
import {deleteSalesProjectAction as action529} from "@/modules/crm/services/sales-projects-commands";
import {saveSurvey as action530} from "@/modules/csat/services/actions";
import {createSurveyFromTemplate as action531} from "@/modules/csat/services/actions";
import {setSurveyActive as action532} from "@/modules/csat/services/actions";
import {deleteSurvey as action533} from "@/modules/csat/services/actions";
import {recordCsatScore as action534} from "@/modules/csat/services/actions";
import {recordCsatComment as action535} from "@/modules/csat/services/actions";
import {saveEngineeringRevision as action536} from "@/modules/engineering/services/commands";
import {transitionEngineeringRevision as action537} from "@/modules/engineering/services/commands";
import {uploadEngineeringDrawing as action538} from "@/modules/engineering/services/commands";
import {saveFieldJob as action539} from "@/modules/fieldservice/services/commands";
import {updateFieldJob as action540} from "@/modules/fieldservice/services/commands";
import {addFieldJobNote as action541} from "@/modules/fieldservice/services/commands";
import {importFinanceStatement as action542} from "@/modules/finance/services/banking";
import {reconcileFinanceStatement as action543} from "@/modules/finance/services/banking";
import {financeReconciliationForm as action544} from "@/modules/finance/services/banking";
import {getFinanceReconciliation as action545} from "@/modules/finance/services/banking";
import {importFinanceStatementForm as action546} from "@/modules/finance/services/banking";
import {getFinanceCollections as action547} from "@/modules/finance/services/collections";
import {recordFinanceCollection as action548} from "@/modules/finance/services/collections";
import {setupFinance as action549} from "@/modules/finance/services/commands";
import {createFinanceDocument as action550} from "@/modules/finance/services/commands";
import {submitFinanceDocument as action551} from "@/modules/finance/services/commands";
import {saveApprovalPolicy as action552} from "@/modules/finance/services/commands";
import {decideFinanceApproval as action553} from "@/modules/finance/services/commands";
import {createPurchaseOrder as action554} from "@/modules/finance/services/commands";
import {raiseServiceCredit as action555} from "@/modules/finance/services/commands";
import {postFinanceDocument as action556} from "@/modules/finance/services/commands";
import {recordGoodsReceipt as action557} from "@/modules/finance/services/commands";
import {onboardSupplier as action558} from "@/modules/finance/services/commands";
import {approveSupplier as action559} from "@/modules/finance/services/commands";
import {requestSupplierBankChange as action560} from "@/modules/finance/services/commands";
import {verifySupplierBank as action561} from "@/modules/finance/services/commands";
import {createFinanceBank as action562} from "@/modules/finance/services/commands";
import {importBankTransactions as action563} from "@/modules/finance/services/commands";
import {allocateBankTransaction as action564} from "@/modules/finance/services/commands";
import {createPaymentRun as action565} from "@/modules/finance/services/commands";
import {approvePaymentRun as action566} from "@/modules/finance/services/commands";
import {createManualJournal as action567} from "@/modules/finance/services/commands";
import {approveManualJournal as action568} from "@/modules/finance/services/commands";
import {reverseJournal as action569} from "@/modules/finance/services/commands";
import {setFinancePeriodState as action570} from "@/modules/finance/services/commands";
import {saveFinanceBudget as action571} from "@/modules/finance/services/commands";
import {saveFinanceAsset as action572} from "@/modules/finance/services/commands";
import {postAssetDepreciation as action573} from "@/modules/finance/services/commands";
import {completeCloseTask as action574} from "@/modules/finance/services/commands";
import {saveFinanceContract as action575} from "@/modules/finance/services/commands";
import {saveFinanceScenario as action576} from "@/modules/finance/services/commands";
import {receiptForm as action577} from "@/modules/finance/services/commands";
import {journalForm as action578} from "@/modules/finance/services/commands";
import {statementForm as action579} from "@/modules/finance/services/commands";
import {allocationForm as action580} from "@/modules/finance/services/commands";
import {paymentRunForm as action581} from "@/modules/finance/services/commands";
import {policyForm as action582} from "@/modules/finance/services/commands";
import {scenarioForm as action583} from "@/modules/finance/services/commands";
import {uploadFinanceAttachment as action584} from "@/modules/finance/services/commands";
import {generateSalesInvoice as action585} from "@/modules/finance/services/commands";
import {generateInvoiceAdjustment as action586} from "@/modules/finance/services/commands";
import {voidFinanceDraft as action587} from "@/modules/finance/services/commands";
import {getFinanceConfiguration as action588} from "@/modules/finance/services/configuration";
import {saveFinanceEntityDetails as action589} from "@/modules/finance/services/configuration";
import {saveFinanceAccount as action590} from "@/modules/finance/services/configuration";
import {saveFinanceDimension as action591} from "@/modules/finance/services/configuration";
import {createFinancePeriod as action592} from "@/modules/finance/services/configuration";
import {setFinancePeriodExceptions as action593} from "@/modules/finance/services/configuration";
import {requestFinancePeriodReopen as action594} from "@/modules/finance/services/configuration";
import {decideFinancePeriodReopen as action595} from "@/modules/finance/services/configuration";
import {saveManufacturingProfile as action596} from "@/modules/finance/services/manufacturing-settings";
import {reconcileOpeningStockValue as action597} from "@/modules/finance/services/manufacturing-settings";
import {recordProductionUsage as action598} from "@/modules/finance/services/manufacturing-settings";
import {recordMachineLoadUsage as action599} from "@/modules/finance/services/manufacturing-settings";
import {getFinanceHome as action600} from "@/modules/finance/services/queries";
import {listFinanceDocuments as action601} from "@/modules/finance/services/queries";
import {getFinanceDocument as action602} from "@/modules/finance/services/queries";
import {getFinanceWorkspace as action603} from "@/modules/finance/services/queries";
import {financeChoices as action604} from "@/modules/finance/services/queries";
import {getBudgetPositions as action605} from "@/modules/finance/services/queries";
import {getInvoiceCashForecast as action606} from "@/modules/finance/services/queries";
import {getFinancialReport as action607} from "@/modules/finance/services/queries";
import {getFinanceCustomerContribution as action608} from "@/modules/finance/services/queries";
import {searchFinance as action609} from "@/modules/finance/services/queries";
import {getFinanceAttachment as action610} from "@/modules/finance/services/queries";
import {getSalesFinanceProjection as action611} from "@/modules/finance/services/queries";
import {getReceivingWarehouses as action612} from "@/modules/finance/services/queries";
import {getFinanceLedger as action613} from "@/modules/finance/services/reporting";
import {getFinanceJournalDetail as action614} from "@/modules/finance/services/reporting";
import {getFinanceSubledgerReconciliation as action615} from "@/modules/finance/services/reporting";
import {saveFinanceDraft as action616} from "@/modules/finance/services/save-draft";
import {saveVehicle as action617} from "@/modules/fleet/services/commands";
import {addFleetLog as action618} from "@/modules/fleet/services/commands";
import {saveEquipment as action619} from "@/modules/maintenance/services/commands";
import {createMaintenanceWork as action620} from "@/modules/maintenance/services/commands";
import {updateMaintenanceWork as action621} from "@/modules/maintenance/services/commands";
import {recordMaintenancePart as action622} from "@/modules/maintenance/services/commands";
import {createProductionOrder as action623} from "@/modules/manufacturing/services/commands";
import {markOrderReady as action624} from "@/modules/manufacturing/services/commands";
import {releaseOrder as action625} from "@/modules/manufacturing/services/commands";
import {closeOrder as action626} from "@/modules/manufacturing/services/commands";
import {startWorkOrder as action627} from "@/modules/manufacturing/services/commands";
import {pauseWorkOrder as action628} from "@/modules/manufacturing/services/commands";
import {completeWorkOrder as action629} from "@/modules/manufacturing/services/commands";
import {previewDemandForecast as action630} from "@/modules/manufacturing/services/demand-forecast";
import {saveForecastProposal as action631} from "@/modules/manufacturing/services/demand-forecast";
import {listForecasts as action632} from "@/modules/manufacturing/services/forecast";
import {setForecast as action633} from "@/modules/manufacturing/services/forecast";
import {deleteForecast as action634} from "@/modules/manufacturing/services/forecast";
import {previewMachineLoad as action635} from "@/modules/manufacturing/services/machine-loads";
import {createMachineLoad as action636} from "@/modules/manufacturing/services/machine-loads";
import {startMachineLoad as action637} from "@/modules/manufacturing/services/machine-loads";
import {cancelMachineLoad as action638} from "@/modules/manufacturing/services/machine-loads";
import {issueProductionMaterial as action639} from "@/modules/manufacturing/services/materials";
import {runMrp as action640} from "@/modules/manufacturing/services/mrp";
import {firmSuggestion as action641} from "@/modules/manufacturing/services/mrp";
import {dismissSuggestion as action642} from "@/modules/manufacturing/services/mrp";
import {latestPlan as action643} from "@/modules/manufacturing/services/mrp";
import {loadPlant as action644} from "@/modules/manufacturing/services/plant";
import {saveWorkCentre as action645} from "@/modules/manufacturing/services/plant";
import {saveMachine as action646} from "@/modules/manufacturing/services/plant";
import {saveDowntime as action647} from "@/modules/manufacturing/services/plant";
import {cancelDowntime as action648} from "@/modules/manufacturing/services/plant";
import {retirePlantRecord as action649} from "@/modules/manufacturing/services/plant";
import {schedulePreview as action650} from "@/modules/manufacturing/services/scheduler";
import {rescheduleWorkOrder as action651} from "@/modules/manufacturing/services/scheduler";
import {setWorkOrderLock as action652} from "@/modules/manufacturing/services/scheduler";
import {listShifts as action653} from "@/modules/manufacturing/services/shifts";
import {saveShift as action654} from "@/modules/manufacturing/services/shifts";
import {deleteShift as action655} from "@/modules/manufacturing/services/shifts";
import {splitProductionOrder as action656} from "@/modules/manufacturing/services/splits";
import {createCampaignAction as action657} from "@/modules/marketing/services/campaign-actions 2";
import {saveCampaignBriefAction as action658} from "@/modules/marketing/services/campaign-actions 2";
import {saveBudgetLineAction as action659} from "@/modules/marketing/services/campaign-actions 2";
import {deleteBudgetLineAction as action660} from "@/modules/marketing/services/campaign-actions 2";
import {saveActivityAction as action661} from "@/modules/marketing/services/campaign-actions 2";
import {setActivityStatusAction as action662} from "@/modules/marketing/services/campaign-actions 2";
import {deleteActivityAction as action663} from "@/modules/marketing/services/campaign-actions 2";
import {addPaidSpendAction as action664} from "@/modules/marketing/services/campaign-actions 2";
import {deletePaidSpendAction as action665} from "@/modules/marketing/services/campaign-actions 2";
import {createCampaignAction as action666} from "@/modules/marketing/services/campaign-actions";
import {saveCampaignBriefAction as action667} from "@/modules/marketing/services/campaign-actions";
import {saveBudgetLineAction as action668} from "@/modules/marketing/services/campaign-actions";
import {deleteBudgetLineAction as action669} from "@/modules/marketing/services/campaign-actions";
import {saveActivityAction as action670} from "@/modules/marketing/services/campaign-actions";
import {setActivityStatusAction as action671} from "@/modules/marketing/services/campaign-actions";
import {deleteActivityAction as action672} from "@/modules/marketing/services/campaign-actions";
import {addPaidSpendAction as action673} from "@/modules/marketing/services/campaign-actions";
import {deletePaidSpendAction as action674} from "@/modules/marketing/services/campaign-actions";
import {createCampaign as action675} from "@/modules/marketing/services/commands";
import {updateCampaign as action676} from "@/modules/marketing/services/commands";
import {createProfile as action677} from "@/modules/marketing/services/commands";
import {recordPermission as action678} from "@/modules/marketing/services/commands";
import {suppressProfile as action679} from "@/modules/marketing/services/commands";
import {createAudience as action680} from "@/modules/marketing/services/commands";
import {previewAudience as action681} from "@/modules/marketing/services/commands";
import {createContent as action682} from "@/modules/marketing/services/commands";
import {approveContent as action683} from "@/modules/marketing/services/commands";
import {createMessage as action684} from "@/modules/marketing/services/commands";
import {lockSend as action685} from "@/modules/marketing/services/commands";
import {cancelSend as action686} from "@/modules/marketing/services/commands";
import {ingestEvent as action687} from "@/modules/marketing/services/commands";
import {createJourney as action688} from "@/modules/marketing/services/commands";
import {publishJourney as action689} from "@/modules/marketing/services/commands";
import {reviseJourney as action690} from "@/modules/marketing/services/commands";
import {createProgram as action691} from "@/modules/marketing/services/commands";
import {createExperiment as action692} from "@/modules/marketing/services/commands";
import {leadFeedback as action693} from "@/modules/marketing/services/commands";
import {processJourneySteps as action694} from "@/modules/marketing/services/commands";
import {saveMarketingPlan as action695} from "@/modules/marketing/services/commands";
import {addPlanActivity as action696} from "@/modules/marketing/services/commands";
import {updatePlanActivity as action697} from "@/modules/marketing/services/commands";
import {addBudgetLine as action698} from "@/modules/marketing/services/commands";
import {submitBudgetToFinance as action699} from "@/modules/marketing/services/commands";
import {createJourneyMap as action700} from "@/modules/marketing/services/commands";
import {addJourneyStage as action701} from "@/modules/marketing/services/commands";
import {addJourneyTouch as action702} from "@/modules/marketing/services/commands";
import {editJourneyStage as action703} from "@/modules/marketing/services/journey-workspace";
import {moveJourneyStage as action704} from "@/modules/marketing/services/journey-workspace";
import {editJourneyTouch as action705} from "@/modules/marketing/services/journey-workspace";
import {saveJourneyPath as action706} from "@/modules/marketing/services/journey-workspace";
import {editJourneyStageForm as action707} from "@/modules/marketing/services/journey-workspace";
import {moveJourneyStageForm as action708} from "@/modules/marketing/services/journey-workspace";
import {editJourneyTouchForm as action709} from "@/modules/marketing/services/journey-workspace";
import {saveJourneyPathForm as action710} from "@/modules/marketing/services/journey-workspace";
import {saveSocialPost as action711} from "@/modules/marketing/services/social-actions";
import {deleteSocialPost as action712} from "@/modules/marketing/services/social-actions";
import {retrySocialPost as action713} from "@/modules/marketing/services/social-actions";
import {disconnectMicrosoftCalendar as action714} from "@/modules/meetings/services/calendar-actions";
import {chooseMicrosoftCalendar as action715} from "@/modules/meetings/services/calendar-actions";
import {sendMicrosoftMeeting as action716} from "@/modules/meetings/services/calendar-actions";
import {importMicrosoftMeetings as action717} from "@/modules/meetings/services/calendar-actions";
import {saveMeeting as action718} from "@/modules/meetings/services/commands";
import {meetingStatus as action719} from "@/modules/meetings/services/commands";
import {addMeetingEntry as action720} from "@/modules/meetings/services/commands";
import {completeMeetingAction as action721} from "@/modules/meetings/services/commands";
import {getApprovedExpenseSource as action722} from "@/modules/people/services/finance-expenses";
import {getPlanBuilder as action723} from "@/modules/plan/services/builder";
import {savePlanInput as action724} from "@/modules/plan/services/builder";
import {setPlanInputIncluded as action725} from "@/modules/plan/services/builder";
import {applyPlanInputs as action726} from "@/modules/plan/services/builder";
import {savePlanGrid as action727} from "@/modules/plan/services/builder";
import {removePlanMeasure as action728} from "@/modules/plan/services/builder";
import {createPlan as action729} from "@/modules/plan/services/commands";
import {saveCell as action730} from "@/modules/plan/services/commands";
import {addMeasure as action731} from "@/modules/plan/services/commands";
import {addAssumption as action732} from "@/modules/plan/services/commands";
import {addDriver as action733} from "@/modules/plan/services/commands";
import {addLink as action734} from "@/modules/plan/services/commands";
import {createScenario as action735} from "@/modules/plan/services/commands";
import {promoteScenario as action736} from "@/modules/plan/services/commands";
import {submitPlan as action737} from "@/modules/plan/services/commands";
import {approvePlan as action738} from "@/modules/plan/services/commands";
import {lockPlan as action739} from "@/modules/plan/services/commands";
import {addGoal as action740} from "@/modules/plan/services/commands";
import {addInitiative as action741} from "@/modules/plan/services/commands";
import {createProjectForInitiative as action742} from "@/modules/plan/services/commands";
import {addAction as action743} from "@/modules/plan/services/commands";
import {completeAction as action744} from "@/modules/plan/services/commands";
import {addRisk as action745} from "@/modules/plan/services/commands";
import {addDependency as action746} from "@/modules/plan/services/commands";
import {addDecision as action747} from "@/modules/plan/services/commands";
import {addComment as action748} from "@/modules/plan/services/commands";
import {addUpdate as action749} from "@/modules/plan/services/commands";
import {completeReview as action750} from "@/modules/plan/services/commands";
import {addReview as action751} from "@/modules/plan/services/commands";
import {distributeTargets as action752} from "@/modules/plan/services/commands";
import {importGrid as action753} from "@/modules/plan/services/commands";
import {sharePlan as action754} from "@/modules/plan/services/commands";
import {unsharePlan as action755} from "@/modules/plan/services/commands";
import {setPlanAudience as action756} from "@/modules/plan/services/commands";
import {addNote as action757} from "@/modules/plan/services/commands";
import {saveGoalProgress as action758} from "@/modules/plan/services/commands";
import {savePlanBrief as action759} from "@/modules/plan/services/commands";
import {listProductionPlans as action760} from "@/modules/planning/services/plans";
import {getPlanOptions as action761} from "@/modules/planning/services/plans";
import {getProductionPlan as action762} from "@/modules/planning/services/plans";
import {createProductionPlan as action763} from "@/modules/planning/services/plans";
import {addProductionPlanLine as action764} from "@/modules/planning/services/plans";
import {getAssignedPlanningWork as action765} from "@/modules/planning/services/plans";
import {getPlanningCoverage as action766} from "@/modules/planning/services/queries";
import {saveProductRecipe as action767} from "@/modules/products/services/make";
import {createSpecification as action768} from "@/modules/quality/services/commands";
import {setSpecificationStatus as action769} from "@/modules/quality/services/commands";
import {createControlPoint as action770} from "@/modules/quality/services/commands";
import {executeInspection as action771} from "@/modules/quality/services/commands";
import {releaseHold as action772} from "@/modules/quality/services/commands";
import {reportNcr as action773} from "@/modules/quality/services/commands";
import {updateNcrInvestigation as action774} from "@/modules/quality/services/commands";
import {addNcrAction as action775} from "@/modules/quality/services/commands";
import {updateNcrAction as action776} from "@/modules/quality/services/commands";
import {closeNcr as action777} from "@/modules/quality/services/commands";
import {reportNcr as action778} from "@/modules/quality/services/ncr-actions";
import {updateNcrInvestigation as action779} from "@/modules/quality/services/ncr-actions";
import {addNcrAction as action780} from "@/modules/quality/services/ncr-actions";
import {updateNcrAction as action781} from "@/modules/quality/services/ncr-actions";
import {closeNcr as action782} from "@/modules/quality/services/ncr-actions";
import {reopenNcr as action783} from "@/modules/quality/services/ncr-actions";
import {saveNcrAction as action784} from "@/modules/quality/services/ncr-actions";
import {saveSubstance as action785} from "@/modules/safety/services/assurance";
import {addSafetyDataSheet as action786} from "@/modules/safety/services/assurance";
import {saveCoshhAssessment as action787} from "@/modules/safety/services/assurance";
import {approveSubstance as action788} from "@/modules/safety/services/assurance";
import {saveCompetence as action789} from "@/modules/safety/services/assurance";
import {saveSafetyDocument as action790} from "@/modules/safety/services/assurance";
import {acknowledgeDocument as action791} from "@/modules/safety/services/assurance";
import {saveAudit as action792} from "@/modules/safety/services/assurance";
import {addAuditFinding as action793} from "@/modules/safety/services/assurance";
import {approveAudit as action794} from "@/modules/safety/services/assurance";
import {saveChange as action795} from "@/modules/safety/services/assurance";
import {advanceChange as action796} from "@/modules/safety/services/assurance";
import {linkSafetyRecord as action797} from "@/modules/safety/services/assurance";
import {saveSafetyProfile as action798} from "@/modules/safety/services/commands";
import {saveRiskMatrix as action799} from "@/modules/safety/services/commands";
import {createRisk as action800} from "@/modules/safety/services/commands";
import {addControl as action801} from "@/modules/safety/services/commands";
import {rateAssessment as action802} from "@/modules/safety/services/commands";
import {approveAssessment as action803} from "@/modules/safety/services/commands";
import {reviseAssessment as action804} from "@/modules/safety/services/commands";
import {requestRiskReview as action805} from "@/modules/safety/services/commands";
import {reportIncident as action806} from "@/modules/safety/services/commands";
import {saveImmediateControl as action807} from "@/modules/safety/services/commands";
import {openInvestigation as action808} from "@/modules/safety/services/commands";
import {addCause as action809} from "@/modules/safety/services/commands";
import {saveRootCause as action810} from "@/modules/safety/services/commands";
import {reviewRiddor as action811} from "@/modules/safety/services/commands";
import {createSafetyAction as action812} from "@/modules/safety/services/commands";
import {advanceAction as action813} from "@/modules/safety/services/commands";
import {verifyAction as action814} from "@/modules/safety/services/commands";
import {saveWorkplaceRecord as action815} from "@/modules/safety/services/commands";
import {createPermit as action816} from "@/modules/safety/services/control";
import {advancePermit as action817} from "@/modules/safety/services/control";
import {extendPermit as action818} from "@/modules/safety/services/control";
import {createIsolation as action819} from "@/modules/safety/services/control";
import {applyIsolationLock as action820} from "@/modules/safety/services/control";
import {verifyIsolation as action821} from "@/modules/safety/services/control";
import {clearIsolation as action822} from "@/modules/safety/services/control";
import {removeIsolationLock as action823} from "@/modules/safety/services/control";
import {placeSafetyHold as action824} from "@/modules/safety/services/control";
import {updateReturnToService as action825} from "@/modules/safety/services/control";
import {releaseSafetyHold as action826} from "@/modules/safety/services/control";
import {overrideSafetyHold as action827} from "@/modules/safety/services/control";
import {saveStatutoryCheck as action828} from "@/modules/safety/services/control";
import {completeInspection as action829} from "@/modules/safety/services/control";
import {createInspection as action830} from "@/modules/safety/services/control";
import {createSalesAddress as action831} from "@/modules/sales/services/address-actions";
import {createSalesCatalogueProduct as action832} from "@/modules/sales/services/catalogue-actions";
import {sendQuote as action833} from "@/modules/sales/services/commands";
import {changeQuoteStatus as action834} from "@/modules/sales/services/commands";
import {deleteQuote as action835} from "@/modules/sales/services/commands";
import {duplicateDocument as action836} from "@/modules/sales/services/commands";
import {saveQuoteTemplate as action837} from "@/modules/sales/services/commands";
import {createOrderFromQuote as action838} from "@/modules/sales/services/commands";
import {linkCommercialProject as action839} from "@/modules/sales/services/commercial";
import {openCallOffOrder as action840} from "@/modules/sales/services/commercial";
import {raiseCallOff as action841} from "@/modules/sales/services/commercial";
import {invoiceCallOffDelivery as action842} from "@/modules/sales/services/commercial";
import {deliverAndInvoiceCallOff as action843} from "@/modules/sales/services/commercial";
import {importSalescsv as action844} from "@/modules/sales/services/csv-import";
import {addDeliveryAddress as action845} from "@/modules/sales/services/delivery-address";
import {addInstaller as action846} from "@/modules/sales/services/delivery-address";
import {pricePartyId as action847} from "@/modules/sales/services/delivery-address";
import {linkOrderedFor as action848} from "@/modules/sales/services/delivery-address";
import {saveDocument as action849} from "@/modules/sales/services/documents";
import {saveInvoiceTemplate as action850} from "@/modules/sales/services/invoice-template-actions";
import {retireInvoiceTemplate as action851} from "@/modules/sales/services/invoice-template-actions";
import {attachCustomerInvoiceTemplate as action852} from "@/modules/sales/services/invoice-template-actions";
import {detachCustomerInvoiceTemplate as action853} from "@/modules/sales/services/invoice-template-actions";
import {createDraftOrder as action854} from "@/modules/sales/services/orders";
import {addOrderLine as action855} from "@/modules/sales/services/orders";
import {removeOrderLine as action856} from "@/modules/sales/services/orders";
import {updateDraftOrderFields as action857} from "@/modules/sales/services/orders";
import {confirmOrder as action858} from "@/modules/sales/services/orders";
import {decideApproval as action859} from "@/modules/sales/services/orders";
import {amendLineQuantity as action860} from "@/modules/sales/services/orders";
import {overrideLinePrice as action861} from "@/modules/sales/services/orders";
import {amendRequestedDate as action862} from "@/modules/sales/services/orders";
import {cancelOrder as action863} from "@/modules/sales/services/orders";
import {deleteOrder as action864} from "@/modules/sales/services/orders";
import {cancelLineRemaining as action865} from "@/modules/sales/services/orders";
import {addHold as action866} from "@/modules/sales/services/orders";
import {releaseHold as action867} from "@/modules/sales/services/orders";
import {redeemServiceRecovery as action868} from "@/modules/sales/services/recovery";
import {restoreCancelledOrder as action869} from "@/modules/sales/services/rewind";
import {returnOrderToQuote as action870} from "@/modules/sales/services/rewind";
import {saveOrderHashtags as action871} from "@/modules/sales/services/rewind";
import {saveSalesView as action872} from "@/modules/sales/services/saved-views";
import {archiveSalesView as action873} from "@/modules/sales/services/saved-views";
import {createCase as action874} from "@/modules/service/services/commands";
import {updateCase as action875} from "@/modules/service/services/commands";
import {assignCase as action876} from "@/modules/service/services/commands";
import {transitionCase as action877} from "@/modules/service/services/commands";
import {addCaseEntry as action878} from "@/modules/service/services/commands";
import {createDepartmentTicket as action879} from "@/modules/service/services/commands";
import {updateDepartmentTicket as action880} from "@/modules/service/services/commands";
import {createQueue as action881} from "@/modules/service/services/commands";
import {addQueueMember as action882} from "@/modules/service/services/commands";
import {linkCaseRecord as action883} from "@/modules/service/services/commands";
import {creditChoices as action884} from "@/modules/service/services/commands";
import {askFinanceForCredit as action885} from "@/modules/service/services/commands";
import {getCaseOwners as action886} from "@/modules/service/services/commands";
import {getDepartmentWork as action887} from "@/modules/service/services/commands";
import {savePurchaseContext as action888} from "@/modules/service/services/commands";
import {saveInvestigation as action889} from "@/modules/service/services/commands";
import {logCaseCall as action890} from "@/modules/service/services/commands";
import {createCaseRemedy as action891} from "@/modules/service/services/commands";
import {mergeCases as action892} from "@/modules/service/services/commands";
import {sendCaseEmail as action893} from "@/modules/service/services/communication";
import {invalidateCaseCsat as action894} from "@/modules/service/services/communication";
import {casePurchaseContext as action895} from "@/modules/service/services/context";
import {proposeRecovery as action896} from "@/modules/service/services/recovery";
import {decideRecovery as action897} from "@/modules/service/services/recovery";
import {saveServiceApprovalRoute as action898} from "@/modules/service/services/recovery";
import {getSopWorkspace as action899} from "@/modules/sop/services/workspace";
import {createSopCycle as action900} from "@/modules/sop/services/workspace";
import {configureSopCycle as action901} from "@/modules/sop/services/workspace";
import {generateSopForecast as action902} from "@/modules/sop/services/workspace";
import {approveSopVersion as action903} from "@/modules/sop/services/workspace";
import {updateSopWorkflow as action904} from "@/modules/sop/services/workspace";
import {publishSopVersion as action905} from "@/modules/sop/services/workspace";
import {createSopScenario as action906} from "@/modules/sop/services/workspace";
import {promoteSopScenario as action907} from "@/modules/sop/services/workspace";
import {overrideSopDemand as action908} from "@/modules/sop/services/workspace";
import {getLiveSopService as action909} from "@/modules/sop/services/workspace";
import {getSopComparison as action910} from "@/modules/sop/services/workspace";
import {getSopAccuracy as action911} from "@/modules/sop/services/workspace";
import {readAvailability as action912} from "@/modules/stock/services/availability";
import {readOrderChain as action913} from "@/modules/stock/services/availability";
import {inventoryExportRows as action914} from "@/modules/stock/services/export";
import {createTeam as action915} from "@/modules/teams/services/commands";
import {renameTeam as action916} from "@/modules/teams/services/commands";
import {addMember as action917} from "@/modules/teams/services/commands";
import {removeMember as action918} from "@/modules/teams/services/commands";
import {saveTask as action919} from "@/modules/teams/services/commands";
import {setTaskStatus as action920} from "@/modules/teams/services/commands";
import {removeTask as action921} from "@/modules/teams/services/commands";
import {saveCover as action922} from "@/modules/teams/services/commands";
import {removeCover as action923} from "@/modules/teams/services/commands";
import {saveHandover as action924} from "@/modules/teams/services/commands";
import {savePlace as action925} from "@/modules/teams/services/commands";
import {saveMoment as action926} from "@/modules/teams/services/commands";
import {removeMoment as action927} from "@/modules/teams/services/commands";
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
"src/app/(app)/settings/user-actions:saveManagedUserDetails":action379 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:setManagedUserPassword":action380 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveUserAccess":action381 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:setUserStatus":action382 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:revokeUserSessions":action383 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:issuePasswordRecovery":action384 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createManagedUser":action385 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:linkEmployeeProfile":action386 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createRole":action387 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveManagementGroup":action388 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createWarehouse":action389 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:adjustStock":action390 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:savePlanningAction":action391 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:makeFromForecastAction":action392 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:transferStock":action393 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createSiteAction":action394 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createPlaceAction":action395 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:assignSiteAction":action396 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:addLocationAction":action397 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:ensureLocationsAction":action398 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:retireLocationAction":action399 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:putOnLocationAction":action400 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:moveLocatedAction":action401 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:receiveMoveAction":action402 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/handoffs/actions:collectBatch":action403 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/studio/actions:create":action404 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/studio/actions:save":action405 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/studio/actions:validate":action406 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/studio/actions:publish":action407 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/studio/actions:activate":action408 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/teams/[teamId]/capacity/actions:getCapacity":action409 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/teams/[teamId]/capacity/actions:saveAllocation":action410 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/teams/[teamId]/capacity/actions:updateWorkStatus":action411 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/templates/actions:saveTemplate":action412 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/templates/actions:archiveTemplate":action413 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/templates/actions:generateTemplateDocument":action414 as (...args:never[])=>Promise<unknown>,
"src/core/approvals/actions:delegateApprovals":action415 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:loginAction":action416 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:logoutAction":action417 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:logoutAdminAction":action418 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:completePasswordRecovery":action419 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:changeOwnPassword":action420 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:signOutOtherSessions":action421 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:createContract":action422 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:sendContract":action423 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:shareContractLink":action424 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:updateDraftContract":action425 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:revokeContract":action426 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:deleteContract":action427 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:signContract":action428 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:returnSignedContract":action429 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:reviewContractReturn":action430 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:declineContract":action431 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:loadPublicContract":action432 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:loadPublicContractFile":action433 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:checkForDuplicatesAction":action434 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:createCustomerAction":action435 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createCustomer":action436 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerStatus":action437 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:archiveCustomer":action438 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:unarchiveCustomer":action439 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteCustomer":action440 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createContact":action441 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateContact":action442 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteContact":action443 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createAddress":action444 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCommercialSettings":action445 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCreditLimit":action446 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setCreditHold":action447 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setPaymentTerm":action448 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createTaxRegistration":action449 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:markTaxRegistrationManuallyVerified":action450 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createBankAccount":action451 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:revealBankAccount":action452 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createDirectDebitMandate":action453 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:cancelDirectDebitMandate":action454 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createNote":action455 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:saveCustomerHashtags":action456 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerDetails":action457 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateAddress":action458 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:archiveAddress":action459 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commercial-actions:saveOrderingPreferences":action460 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setCustomerParent":action461 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:placeCustomer":action462 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:moveCustomer":action463 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setContactReportsTo":action464 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:saveCustomerTradingLink":action465 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:setInvoiceAccount":action466 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:archiveCustomerTradingLink":action467 as (...args:never[])=>Promise<unknown>,
"src/core/finance/actions:requestSalesInvoice":action468 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:createWork":action469 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:updateWork":action470 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:commentWork":action471 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:watchWork":action472 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:mergeWork":action473 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:requestWorkApproval":action474 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:decideWorkApproval":action475 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:saveDeskQueue":action476 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:changeDeskMember":action477 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/file-actions:attachServiceFile":action478 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/knowledge:saveKnowledge":action479 as (...args:never[])=>Promise<unknown>,
"src/core/teams/actions:createWorkTeam":action480 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditBoard":action481 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:exportAuditReport":action482 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEcho":action483 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:postEchoNote":action484 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEchoInbox":action485 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditAccess":action486 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditOwnActivity":action487 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditAreas":action488 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:saveAutomation":action489 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:setAutomationEnabled":action490 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:deleteAutomation":action491 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:testOnPastEvent":action492 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:runNow":action493 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:logActivity":action494 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:completeActivity":action495 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/appointments:saveAppointment":action496 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/appointments:finishAppointment":action497 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/appointments:saveAppointmentForm":action498 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/appointments:finishAppointmentForm":action499 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/marketing-handoff:acceptMarketingHandoff":action500 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:createOpportunity":action501 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:moveOpportunityStage":action502 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityValue":action503 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityCloseDate":action504 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityForecastCategory":action505 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityNextAction":action506 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:winOpportunity":action507 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:loseOpportunity":action508 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addStakeholder":action509 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addMilestone":action510 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:toggleMilestone":action511 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:checkProspectDuplicatesAction":action512 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createProspect":action513 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:assignProspect":action514 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:setProspectLifecycleStage":action515 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:convertProspect":action516 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createIndustry":action517 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:saveProspectGrouping":action518 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProject":action519 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProjectFormAction":action520 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:saveSalesProjectAction":action521 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:saveNextActionAction":action522 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addProjectOrganisationAction":action523 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:removeProjectOrganisationAction":action524 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:makePrimaryOrganisationAction":action525 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addProjectStakeholderAction":action526 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:removeProjectStakeholderAction":action527 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:setDocumentSalesProjectAction":action528 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:deleteSalesProjectAction":action529 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:saveSurvey":action530 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:createSurveyFromTemplate":action531 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:setSurveyActive":action532 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:deleteSurvey":action533 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatScore":action534 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatComment":action535 as (...args:never[])=>Promise<unknown>,
"src/modules/engineering/services/commands:saveEngineeringRevision":action536 as (...args:never[])=>Promise<unknown>,
"src/modules/engineering/services/commands:transitionEngineeringRevision":action537 as (...args:never[])=>Promise<unknown>,
"src/modules/engineering/services/commands:uploadEngineeringDrawing":action538 as (...args:never[])=>Promise<unknown>,
"src/modules/fieldservice/services/commands:saveFieldJob":action539 as (...args:never[])=>Promise<unknown>,
"src/modules/fieldservice/services/commands:updateFieldJob":action540 as (...args:never[])=>Promise<unknown>,
"src/modules/fieldservice/services/commands:addFieldJobNote":action541 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:importFinanceStatement":action542 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:reconcileFinanceStatement":action543 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:financeReconciliationForm":action544 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:getFinanceReconciliation":action545 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:importFinanceStatementForm":action546 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/collections:getFinanceCollections":action547 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/collections:recordFinanceCollection":action548 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setupFinance":action549 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceDocument":action550 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:submitFinanceDocument":action551 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveApprovalPolicy":action552 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:decideFinanceApproval":action553 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPurchaseOrder":action554 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:raiseServiceCredit":action555 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postFinanceDocument":action556 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:recordGoodsReceipt":action557 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:onboardSupplier":action558 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveSupplier":action559 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:requestSupplierBankChange":action560 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:verifySupplierBank":action561 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceBank":action562 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:importBankTransactions":action563 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocateBankTransaction":action564 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPaymentRun":action565 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approvePaymentRun":action566 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createManualJournal":action567 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveManualJournal":action568 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:reverseJournal":action569 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setFinancePeriodState":action570 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceBudget":action571 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceAsset":action572 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postAssetDepreciation":action573 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:completeCloseTask":action574 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceContract":action575 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceScenario":action576 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:receiptForm":action577 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:journalForm":action578 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:statementForm":action579 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocationForm":action580 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:paymentRunForm":action581 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:policyForm":action582 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:scenarioForm":action583 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:uploadFinanceAttachment":action584 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateSalesInvoice":action585 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateInvoiceAdjustment":action586 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:voidFinanceDraft":action587 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:getFinanceConfiguration":action588 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:saveFinanceEntityDetails":action589 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:saveFinanceAccount":action590 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:saveFinanceDimension":action591 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:createFinancePeriod":action592 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:setFinancePeriodExceptions":action593 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:requestFinancePeriodReopen":action594 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:decideFinancePeriodReopen":action595 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/manufacturing-settings:saveManufacturingProfile":action596 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/manufacturing-settings:reconcileOpeningStockValue":action597 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/manufacturing-settings:recordProductionUsage":action598 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/manufacturing-settings:recordMachineLoadUsage":action599 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceHome":action600 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:listFinanceDocuments":action601 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceDocument":action602 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceWorkspace":action603 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:financeChoices":action604 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getBudgetPositions":action605 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getInvoiceCashForecast":action606 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinancialReport":action607 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceCustomerContribution":action608 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:searchFinance":action609 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceAttachment":action610 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getSalesFinanceProjection":action611 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getReceivingWarehouses":action612 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/reporting:getFinanceLedger":action613 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/reporting:getFinanceJournalDetail":action614 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/reporting:getFinanceSubledgerReconciliation":action615 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/save-draft:saveFinanceDraft":action616 as (...args:never[])=>Promise<unknown>,
"src/modules/fleet/services/commands:saveVehicle":action617 as (...args:never[])=>Promise<unknown>,
"src/modules/fleet/services/commands:addFleetLog":action618 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:saveEquipment":action619 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:createMaintenanceWork":action620 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:updateMaintenanceWork":action621 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:recordMaintenancePart":action622 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:createProductionOrder":action623 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:markOrderReady":action624 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:releaseOrder":action625 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:closeOrder":action626 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:startWorkOrder":action627 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:pauseWorkOrder":action628 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:completeWorkOrder":action629 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/demand-forecast:previewDemandForecast":action630 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/demand-forecast:saveForecastProposal":action631 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:listForecasts":action632 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:setForecast":action633 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:deleteForecast":action634 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/machine-loads:previewMachineLoad":action635 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/machine-loads:createMachineLoad":action636 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/machine-loads:startMachineLoad":action637 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/machine-loads:cancelMachineLoad":action638 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/materials:issueProductionMaterial":action639 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:runMrp":action640 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:firmSuggestion":action641 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:dismissSuggestion":action642 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:latestPlan":action643 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:loadPlant":action644 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveWorkCentre":action645 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveMachine":action646 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveDowntime":action647 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:cancelDowntime":action648 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:retirePlantRecord":action649 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:schedulePreview":action650 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:rescheduleWorkOrder":action651 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:setWorkOrderLock":action652 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:listShifts":action653 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:saveShift":action654 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:deleteShift":action655 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/splits:splitProductionOrder":action656 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:createCampaignAction":action657 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveCampaignBriefAction":action658 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveBudgetLineAction":action659 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deleteBudgetLineAction":action660 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveActivityAction":action661 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:setActivityStatusAction":action662 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deleteActivityAction":action663 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:addPaidSpendAction":action664 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deletePaidSpendAction":action665 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:createCampaignAction":action666 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveCampaignBriefAction":action667 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveBudgetLineAction":action668 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deleteBudgetLineAction":action669 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveActivityAction":action670 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:setActivityStatusAction":action671 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deleteActivityAction":action672 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:addPaidSpendAction":action673 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deletePaidSpendAction":action674 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createCampaign":action675 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updateCampaign":action676 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProfile":action677 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:recordPermission":action678 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:suppressProfile":action679 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createAudience":action680 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:previewAudience":action681 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createContent":action682 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:approveContent":action683 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createMessage":action684 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:lockSend":action685 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:cancelSend":action686 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:ingestEvent":action687 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourney":action688 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:publishJourney":action689 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:reviseJourney":action690 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProgram":action691 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createExperiment":action692 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:leadFeedback":action693 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:processJourneySteps":action694 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:saveMarketingPlan":action695 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addPlanActivity":action696 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updatePlanActivity":action697 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addBudgetLine":action698 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:submitBudgetToFinance":action699 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourneyMap":action700 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyStage":action701 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyTouch":action702 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:editJourneyStage":action703 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:moveJourneyStage":action704 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:editJourneyTouch":action705 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:saveJourneyPath":action706 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:editJourneyStageForm":action707 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:moveJourneyStageForm":action708 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:editJourneyTouchForm":action709 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:saveJourneyPathForm":action710 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:saveSocialPost":action711 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:deleteSocialPost":action712 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:retrySocialPost":action713 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:disconnectMicrosoftCalendar":action714 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:chooseMicrosoftCalendar":action715 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:sendMicrosoftMeeting":action716 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:importMicrosoftMeetings":action717 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:saveMeeting":action718 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:meetingStatus":action719 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:addMeetingEntry":action720 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:completeMeetingAction":action721 as (...args:never[])=>Promise<unknown>,
"src/modules/people/services/finance-expenses:getApprovedExpenseSource":action722 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:getPlanBuilder":action723 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:savePlanInput":action724 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:setPlanInputIncluded":action725 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:applyPlanInputs":action726 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:savePlanGrid":action727 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:removePlanMeasure":action728 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createPlan":action729 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveCell":action730 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addMeasure":action731 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAssumption":action732 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDriver":action733 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addLink":action734 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createScenario":action735 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:promoteScenario":action736 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:submitPlan":action737 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:approvePlan":action738 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:lockPlan":action739 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addGoal":action740 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addInitiative":action741 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createProjectForInitiative":action742 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAction":action743 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeAction":action744 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addRisk":action745 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDependency":action746 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDecision":action747 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addComment":action748 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addUpdate":action749 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeReview":action750 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addReview":action751 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:distributeTargets":action752 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:importGrid":action753 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:sharePlan":action754 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:unsharePlan":action755 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:setPlanAudience":action756 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addNote":action757 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveGoalProgress":action758 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:savePlanBrief":action759 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:listProductionPlans":action760 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getPlanOptions":action761 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getProductionPlan":action762 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:createProductionPlan":action763 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:addProductionPlanLine":action764 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getAssignedPlanningWork":action765 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/queries:getPlanningCoverage":action766 as (...args:never[])=>Promise<unknown>,
"src/modules/products/services/make:saveProductRecipe":action767 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createSpecification":action768 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:setSpecificationStatus":action769 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createControlPoint":action770 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:executeInspection":action771 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:releaseHold":action772 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:reportNcr":action773 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrInvestigation":action774 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:addNcrAction":action775 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrAction":action776 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:closeNcr":action777 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:reportNcr":action778 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:updateNcrInvestigation":action779 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:addNcrAction":action780 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:updateNcrAction":action781 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:closeNcr":action782 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:reopenNcr":action783 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:saveNcrAction":action784 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSubstance":action785 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addSafetyDataSheet":action786 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCoshhAssessment":action787 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveSubstance":action788 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCompetence":action789 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSafetyDocument":action790 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:acknowledgeDocument":action791 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveAudit":action792 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addAuditFinding":action793 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveAudit":action794 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveChange":action795 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:advanceChange":action796 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:linkSafetyRecord":action797 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveSafetyProfile":action798 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRiskMatrix":action799 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createRisk":action800 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addControl":action801 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:rateAssessment":action802 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:approveAssessment":action803 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviseAssessment":action804 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:requestRiskReview":action805 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reportIncident":action806 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveImmediateControl":action807 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:openInvestigation":action808 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addCause":action809 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRootCause":action810 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviewRiddor":action811 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createSafetyAction":action812 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:advanceAction":action813 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:verifyAction":action814 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveWorkplaceRecord":action815 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createPermit":action816 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:advancePermit":action817 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:extendPermit":action818 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createIsolation":action819 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:applyIsolationLock":action820 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:verifyIsolation":action821 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:clearIsolation":action822 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:removeIsolationLock":action823 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:placeSafetyHold":action824 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:updateReturnToService":action825 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:releaseSafetyHold":action826 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:overrideSafetyHold":action827 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:saveStatutoryCheck":action828 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:completeInspection":action829 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createInspection":action830 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/address-actions:createSalesAddress":action831 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/catalogue-actions:createSalesCatalogueProduct":action832 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:sendQuote":action833 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:changeQuoteStatus":action834 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:deleteQuote":action835 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:duplicateDocument":action836 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:saveQuoteTemplate":action837 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:createOrderFromQuote":action838 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:linkCommercialProject":action839 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:openCallOffOrder":action840 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:raiseCallOff":action841 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:invoiceCallOffDelivery":action842 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:deliverAndInvoiceCallOff":action843 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/csv-import:importSalescsv":action844 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:addDeliveryAddress":action845 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:addInstaller":action846 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:pricePartyId":action847 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:linkOrderedFor":action848 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/documents:saveDocument":action849 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:saveInvoiceTemplate":action850 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:retireInvoiceTemplate":action851 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:attachCustomerInvoiceTemplate":action852 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:detachCustomerInvoiceTemplate":action853 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:createDraftOrder":action854 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addOrderLine":action855 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:removeOrderLine":action856 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:updateDraftOrderFields":action857 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:confirmOrder":action858 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:decideApproval":action859 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendLineQuantity":action860 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:overrideLinePrice":action861 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendRequestedDate":action862 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelOrder":action863 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:deleteOrder":action864 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelLineRemaining":action865 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addHold":action866 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:releaseHold":action867 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/recovery:redeemServiceRecovery":action868 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:restoreCancelledOrder":action869 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:returnOrderToQuote":action870 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:saveOrderHashtags":action871 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:saveSalesView":action872 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:archiveSalesView":action873 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createCase":action874 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateCase":action875 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:assignCase":action876 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:transitionCase":action877 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addCaseEntry":action878 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createDepartmentTicket":action879 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateDepartmentTicket":action880 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createQueue":action881 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addQueueMember":action882 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:linkCaseRecord":action883 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:creditChoices":action884 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:askFinanceForCredit":action885 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getCaseOwners":action886 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getDepartmentWork":action887 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:savePurchaseContext":action888 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:saveInvestigation":action889 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:logCaseCall":action890 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createCaseRemedy":action891 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:mergeCases":action892 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/communication:sendCaseEmail":action893 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/communication:invalidateCaseCsat":action894 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/context:casePurchaseContext":action895 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/recovery:proposeRecovery":action896 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/recovery:decideRecovery":action897 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/recovery:saveServiceApprovalRoute":action898 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getSopWorkspace":action899 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:createSopCycle":action900 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:configureSopCycle":action901 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:generateSopForecast":action902 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:approveSopVersion":action903 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:updateSopWorkflow":action904 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:publishSopVersion":action905 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:createSopScenario":action906 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:promoteSopScenario":action907 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:overrideSopDemand":action908 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getLiveSopService":action909 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getSopComparison":action910 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getSopAccuracy":action911 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readAvailability":action912 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readOrderChain":action913 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/export:inventoryExportRows":action914 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:createTeam":action915 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:renameTeam":action916 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:addMember":action917 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMember":action918 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveTask":action919 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:setTaskStatus":action920 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeTask":action921 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveCover":action922 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeCover":action923 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveHandover":action924 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:savePlace":action925 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveMoment":action926 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMoment":action927 as (...args:never[])=>Promise<unknown>
});
