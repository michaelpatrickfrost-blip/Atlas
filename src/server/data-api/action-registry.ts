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
import {getScorecards as action88} from "@/app/(app)/kpis/scorecards/actions";
import {saveScorecard as action89} from "@/app/(app)/kpis/scorecards/actions";
import {removeScorecard as action90} from "@/app/(app)/kpis/scorecards/actions";
import {syncDemandAction as action91} from "@/app/(app)/logistics/actions";
import {restoreDeliveryAction as action92} from "@/app/(app)/logistics/actions";
import {releaseAction as action93} from "@/app/(app)/logistics/actions";
import {allocateAction as action94} from "@/app/(app)/logistics/actions";
import {directShipAction as action95} from "@/app/(app)/logistics/actions";
import {groupAction as action96} from "@/app/(app)/logistics/actions";
import {scanAction as action97} from "@/app/(app)/logistics/actions";
import {lotAction as action98} from "@/app/(app)/logistics/actions";
import {serialAction as action99} from "@/app/(app)/logistics/actions";
import {shortAction as action100} from "@/app/(app)/logistics/actions";
import {completeWorkAction as action101} from "@/app/(app)/logistics/actions";
import {claimAction as action102} from "@/app/(app)/logistics/actions";
import {shipFromPickAction as action103} from "@/app/(app)/logistics/actions";
import {packageAction as action104} from "@/app/(app)/logistics/actions";
import {weightAction as action105} from "@/app/(app)/logistics/actions";
import {stageAction as action106} from "@/app/(app)/logistics/actions";
import {labelAction as action107} from "@/app/(app)/logistics/actions";
import {dispatchAction as action108} from "@/app/(app)/logistics/actions";
import {trackingAction as action109} from "@/app/(app)/logistics/actions";
import {deliverAction as action110} from "@/app/(app)/logistics/actions";
import {loadCreateAction as action111} from "@/app/(app)/logistics/actions";
import {loadScanAction as action112} from "@/app/(app)/logistics/actions";
import {departAction as action113} from "@/app/(app)/logistics/actions";
import {expectAction as action114} from "@/app/(app)/logistics/actions";
import {receiveLineAction as action115} from "@/app/(app)/logistics/actions";
import {putAwayAction as action116} from "@/app/(app)/logistics/actions";
import {completeReceiptAction as action117} from "@/app/(app)/logistics/actions";
import {transferAction as action118} from "@/app/(app)/logistics/actions";
import {transferReceiveAction as action119} from "@/app/(app)/logistics/actions";
import {returnRequestAction as action120} from "@/app/(app)/logistics/actions";
import {authoriseReturnAction as action121} from "@/app/(app)/logistics/actions";
import {receiveReturnAction as action122} from "@/app/(app)/logistics/actions";
import {inspectAction as action123} from "@/app/(app)/logistics/actions";
import {closeReturnAction as action124} from "@/app/(app)/logistics/actions";
import {assignEquipmentAction as action125} from "@/app/(app)/logistics/actions";
import {packUnitAction as action126} from "@/app/(app)/logistics/actions";
import {saveHandlingTypeAction as action127} from "@/app/(app)/logistics/actions";
import {retireHandlingTypeAction as action128} from "@/app/(app)/logistics/actions";
import {removeHandlingTypeAction as action129} from "@/app/(app)/logistics/actions";
import {policyAction as action130} from "@/app/(app)/logistics/actions";
import {runMrpAction as action131} from "@/app/(app)/manufacturing/planning/actions";
import {firmPlannedOrderAction as action132} from "@/app/(app)/manufacturing/planning/actions";
import {dismissPlannedOrderAction as action133} from "@/app/(app)/manufacturing/planning/actions";
import {setForecastAction as action134} from "@/app/(app)/manufacturing/planning/forecast/actions";
import {deleteForecastAction as action135} from "@/app/(app)/manufacturing/planning/forecast/actions";
import {runMrpForm as action136} from "@/app/(app)/manufacturing/planning/form-actions";
import {firmPlannedOrderForm as action137} from "@/app/(app)/manufacturing/planning/form-actions";
import {dismissPlannedOrderForm as action138} from "@/app/(app)/manufacturing/planning/form-actions";
import {raiseProductionOrderAction as action139} from "@/app/(app)/manufacturing/produce/actions";
import {previewMoveAction as action140} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {commitMoveAction as action141} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {toggleLockAction as action142} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {saveShiftAction as action143} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {deleteShiftAction as action144} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {startAction as action145} from "@/app/(app)/manufacturing/shop-floor/actions";
import {pauseAction as action146} from "@/app/(app)/manufacturing/shop-floor/actions";
import {completeAction as action147} from "@/app/(app)/manufacturing/shop-floor/actions";
import {loadNotices as action148} from "@/app/(app)/notices/actions";
import {clearNotice as action149} from "@/app/(app)/notices/actions";
import {clearNotices as action150} from "@/app/(app)/notices/actions";
import {getPayrollPreparation as action151} from "@/app/(app)/payroll/actions";
import {createPayrollRun as action152} from "@/app/(app)/payroll/actions";
import {updatePayslipDeductions as action153} from "@/app/(app)/payroll/actions";
import {finalisePayrollRun as action154} from "@/app/(app)/payroll/actions";
import {refreshPayrollRun as action155} from "@/app/(app)/payroll/actions";
import {savePeriodAdjustment as action156} from "@/app/(app)/payroll/actions";
import {markPayrollRunPaid as action157} from "@/app/(app)/payroll/actions";
import {savePayrollSettings as action158} from "@/app/(app)/payroll/actions";
import {issueP45 as action159} from "@/app/(app)/payroll/actions";
import {issueP60 as action160} from "@/app/(app)/payroll/actions";
import {getPayEmployees as action161} from "@/app/(app)/payroll/employees/actions";
import {savePayEmployee as action162} from "@/app/(app)/payroll/employees/actions";
import {logAbsence as action163} from "@/app/(app)/people/absence/actions";
import {requestLeave as action164} from "@/app/(app)/people/absence/actions";
import {cancelOwnLeave as action165} from "@/app/(app)/people/absence/actions";
import {approveLeaveRequest as action166} from "@/app/(app)/people/absence/actions";
import {setLeaveAllowance as action167} from "@/app/(app)/people/absence/actions";
import {rejectLeaveRequest as action168} from "@/app/(app)/people/absence/actions";
import {createEmployee as action169} from "@/app/(app)/people/actions";
import {changeEmployeeStatus as action170} from "@/app/(app)/people/actions";
import {updateEmployeeProfile as action171} from "@/app/(app)/people/actions";
import {updateOwnEmployeeDetails as action172} from "@/app/(app)/people/actions";
import {addEmployeeDocument as action173} from "@/app/(app)/people/actions";
import {linkEmployeeToUser as action174} from "@/app/(app)/people/actions";
import {completeEmployeeTask as action175} from "@/app/(app)/people/actions";
import {addEmployeeTask as action176} from "@/app/(app)/people/actions";
import {updateEmployeeContact as action177} from "@/app/(app)/people/actions";
import {updateEmployeeTask as action178} from "@/app/(app)/people/actions";
import {scheduleAppraisal as action179} from "@/app/(app)/people/appraisals/actions";
import {completeAppraisal as action180} from "@/app/(app)/people/appraisals/actions";
import {getConductDesk as action181} from "@/app/(app)/people/conduct/actions";
import {getMyConduct as action182} from "@/app/(app)/people/conduct/actions";
import {getPlan as action183} from "@/app/(app)/people/conduct/actions";
import {getCase as action184} from "@/app/(app)/people/conduct/actions";
import {conductChoices as action185} from "@/app/(app)/people/conduct/actions";
import {savePlan as action186} from "@/app/(app)/people/conduct/actions";
import {addPlanReview as action187} from "@/app/(app)/people/conduct/actions";
import {commentOnPlan as action188} from "@/app/(app)/people/conduct/actions";
import {saveCase as action189} from "@/app/(app)/people/conduct/actions";
import {respondToCase as action190} from "@/app/(app)/people/conduct/actions";
import {addCaseEvent as action191} from "@/app/(app)/people/conduct/actions";
import {submitExpenseClaim as action192} from "@/app/(app)/people/expenses/actions";
import {approveExpenseClaim as action193} from "@/app/(app)/people/expenses/actions";
import {rejectExpenseClaim as action194} from "@/app/(app)/people/expenses/actions";
import {scheduleOneToOne as action195} from "@/app/(app)/people/one-to-ones/actions";
import {completeOneToOne as action196} from "@/app/(app)/people/one-to-ones/actions";
import {saveVacancy as action197} from "@/app/(app)/people/platform-actions";
import {saveApplication as action198} from "@/app/(app)/people/platform-actions";
import {saveTraining as action199} from "@/app/(app)/people/platform-actions";
import {saveHRDocument as action200} from "@/app/(app)/people/platform-actions";
import {listPolicies as action201} from "@/app/(app)/people/policies/actions";
import {publishPolicy as action202} from "@/app/(app)/people/policies/actions";
import {archivePolicy as action203} from "@/app/(app)/people/policies/actions";
import {openPolicy as action204} from "@/app/(app)/people/policies/actions";
import {createShift as action205} from "@/app/(app)/people/rotas/actions";
import {changeShiftStatus as action206} from "@/app/(app)/people/rotas/actions";
import {getMyHR as action207} from "@/app/(app)/people/self-service";
import {getMyTeam as action208} from "@/app/(app)/people/self-service";
import {getTeamEmployee as action209} from "@/app/(app)/people/self-service";
import {addPrivateNote as action210} from "@/app/(app)/people/self-service";
import {updateWorkingPattern as action211} from "@/app/(app)/people/self-service";
import {updateHrSettings as action212} from "@/app/(app)/people/settings/actions";
import {createAppraisalTemplate as action213} from "@/app/(app)/people/settings/actions";
import {toggleAppraisalTemplateActive as action214} from "@/app/(app)/people/settings/actions";
import {createOneToOneTemplate as action215} from "@/app/(app)/people/settings/actions";
import {toggleOneToOneTemplateActive as action216} from "@/app/(app)/people/settings/actions";
import {getTimesheetContext as action217} from "@/app/(app)/people/timesheets/actions";
import {saveTimesheet as action218} from "@/app/(app)/people/timesheets/actions";
import {reviewTimesheet as action219} from "@/app/(app)/people/timesheets/actions";
import {createPriceList as action220} from "@/app/(app)/pricing/actions";
import {savePriceEntry as action221} from "@/app/(app)/pricing/actions";
import {saveRule as action222} from "@/app/(app)/pricing/actions";
import {setRuleActive as action223} from "@/app/(app)/pricing/actions";
import {updatePriceBasis as action224} from "@/app/(app)/pricing/actions";
import {renamePriceList as action225} from "@/app/(app)/pricing/actions";
import {assignPriceListCustomers as action226} from "@/app/(app)/pricing/actions";
import {checkSalesPrice as action227} from "@/app/(app)/pricing/actions";
import {assignPriceList as action228} from "@/app/(app)/pricing/actions";
import {previewPriceCsv as action229} from "@/app/(app)/pricing/actions";
import {applyPriceCsv as action230} from "@/app/(app)/pricing/actions";
import {saveAgreement as action231} from "@/app/(app)/pricing/actions";
import {saveAgreementPrice as action232} from "@/app/(app)/pricing/actions";
import {removeAgreementPrice as action233} from "@/app/(app)/pricing/actions";
import {previewAgreementCsv as action234} from "@/app/(app)/pricing/actions";
import {applyAgreementCsv as action235} from "@/app/(app)/pricing/actions";
import {saveProduct as action236} from "@/app/(app)/products/actions";
import {saveProductRecord as action237} from "@/app/(app)/products/actions";
import {saveCategory as action238} from "@/app/(app)/products/actions";
import {retireCategory as action239} from "@/app/(app)/products/actions";
import {addStandardCategories as action240} from "@/app/(app)/products/actions";
import {savePack as action241} from "@/app/(app)/products/actions";
import {saveLinks as action242} from "@/app/(app)/products/actions";
import {saveMeasures as action243} from "@/app/(app)/products/actions";
import {saveProfile as action244} from "@/app/(app)/profile/actions";
import {loadAssignedWork as action245} from "@/app/(app)/profile/work";
import {createProject as action246} from "@/app/(app)/projects/actions";
import {changeProjectStatus as action247} from "@/app/(app)/projects/actions";
import {editProject as action248} from "@/app/(app)/projects/actions";
import {setProjectMember as action249} from "@/app/(app)/projects/actions";
import {archiveProject as action250} from "@/app/(app)/projects/actions";
import {createTask as action251} from "@/app/(app)/projects/actions";
import {changeTaskStatus as action252} from "@/app/(app)/projects/actions";
import {editTask as action253} from "@/app/(app)/projects/actions";
import {checklistItem as action254} from "@/app/(app)/projects/actions";
import {addDependency as action255} from "@/app/(app)/projects/actions";
import {createMeeting as action256} from "@/app/(app)/projects/actions";
import {createDocument as action257} from "@/app/(app)/projects/actions";
import {editDocument as action258} from "@/app/(app)/projects/actions";
import {addComment as action259} from "@/app/(app)/projects/actions";
import {createMilestone as action260} from "@/app/(app)/projects/actions";
import {publishUpdate as action261} from "@/app/(app)/projects/actions";
import {createDecision as action262} from "@/app/(app)/projects/actions";
import {decide as action263} from "@/app/(app)/projects/actions";
import {createRisk as action264} from "@/app/(app)/projects/actions";
import {closeRisk as action265} from "@/app/(app)/projects/actions";
import {requestApproval as action266} from "@/app/(app)/projects/actions";
import {respondApproval as action267} from "@/app/(app)/projects/actions";
import {submitRequest as action268} from "@/app/(app)/projects/actions";
import {triageRequest as action269} from "@/app/(app)/projects/actions";
import {logTime as action270} from "@/app/(app)/projects/actions";
import {planToday as action271} from "@/app/(app)/projects/actions";
import {updateInbox as action272} from "@/app/(app)/projects/actions";
import {saveView as action273} from "@/app/(app)/projects/actions";
import {createPortfolio as action274} from "@/app/(app)/projects/actions";
import {createBaseline as action275} from "@/app/(app)/projects/actions";
import {setBudget as action276} from "@/app/(app)/projects/actions";
import {linkWork as action277} from "@/app/(app)/projects/actions";
import {getProjectActivity as action278} from "@/app/(app)/projects/actions";
import {createAutomation as action279} from "@/app/(app)/projects/actions";
import {toggleAutomation as action280} from "@/app/(app)/projects/actions";
import {saveProjectTemplate as action281} from "@/app/(app)/projects/actions";
import {useProjectTemplate as action282} from "@/app/(app)/projects/actions";
import {startTimer as action283} from "@/app/(app)/projects/actions";
import {stopTimer as action284} from "@/app/(app)/projects/actions";
import {projectPreference as action285} from "@/app/(app)/projects/actions";
import {uploadProjectFile as action286} from "@/app/(app)/projects/actions";
import {readProjectFile as action287} from "@/app/(app)/projects/actions";
import {createProperty as action288} from "@/app/(app)/projects/actions";
import {setProperty as action289} from "@/app/(app)/projects/actions";
import {restoreDocument as action290} from "@/app/(app)/projects/actions";
import {createTaskFromDocument as action291} from "@/app/(app)/projects/actions";
import {discardTimer as action292} from "@/app/(app)/projects/actions";
import {completeMilestone as action293} from "@/app/(app)/projects/actions";
import {resolveComment as action294} from "@/app/(app)/projects/actions";
import {getProjectWorkload as action295} from "@/app/(app)/projects/actions";
import {rescheduleTask as action296} from "@/app/(app)/projects/actions";
import {newContractAction as action297} from "@/app/(app)/sales/contracts/actions";
import {resendContractAction as action298} from "@/app/(app)/sales/contracts/actions";
import {deleteContractAction as action299} from "@/app/(app)/sales/contracts/actions";
import {createOrderForm as action300} from "@/app/(app)/sales/orders/actions";
import {addLineForm as action301} from "@/app/(app)/sales/orders/actions";
import {removeLineForm as action302} from "@/app/(app)/sales/orders/actions";
import {confirmOrderForm as action303} from "@/app/(app)/sales/orders/actions";
import {updateOrderForm as action304} from "@/app/(app)/sales/orders/actions";
import {chooseOrderAddresses as action305} from "@/app/(app)/sales/orders/actions";
import {addHoldForm as action306} from "@/app/(app)/sales/orders/actions";
import {releaseHoldForm as action307} from "@/app/(app)/sales/orders/actions";
import {approveOrderForm as action308} from "@/app/(app)/sales/orders/actions";
import {cancelOrderForm as action309} from "@/app/(app)/sales/orders/actions";
import {saveOrderHashtagsForm as action310} from "@/app/(app)/sales/orders/actions";
import {restoreCancelledOrderForm as action311} from "@/app/(app)/sales/orders/actions";
import {returnOrderToQuoteForm as action312} from "@/app/(app)/sales/orders/actions";
import {scheduleOrderDelivery as action313} from "@/app/(app)/sales/orders/actions";
import {rejectOrderApproval as action314} from "@/app/(app)/sales/orders/actions";
import {deleteOrderForm as action315} from "@/app/(app)/sales/orders/actions";
import {createQuote as action316} from "@/app/(app)/sales/quotes/actions";
import {deleteQuoteForm as action317} from "@/app/(app)/sales/quotes/actions";
import {saveCreationPolicy as action318} from "@/app/(app)/sales/settings/actions";
import {saveSiteAction as action319} from "@/app/(app)/sales/sites/actions";
import {setDocumentSiteAction as action320} from "@/app/(app)/sales/sites/actions";
import {getSchedule as action321} from "@/app/(app)/scheduling/actions";
import {createBulkShifts as action322} from "@/app/(app)/scheduling/actions";
import {setScheduledShift as action323} from "@/app/(app)/scheduling/actions";
import {completeShiftTask as action324} from "@/app/(app)/scheduling/actions";
import {editScheduledShift as action325} from "@/app/(app)/scheduling/actions";
import {publishWeekShifts as action326} from "@/app/(app)/scheduling/actions";
import {saveHoursBudget as action327} from "@/app/(app)/scheduling/actions";
import {getTeamPlan as action328} from "@/app/(app)/scheduling/actions";
import {getPersonSchedule as action329} from "@/app/(app)/scheduling/actions";
import {saveWorkType as action330} from "@/app/(app)/scheduling/actions";
import {archiveWorkType as action331} from "@/app/(app)/scheduling/actions";
import {saveDemand as action332} from "@/app/(app)/scheduling/actions";
import {saveBusyRule as action333} from "@/app/(app)/scheduling/actions";
import {removeBusyRule as action334} from "@/app/(app)/scheduling/actions";
import {fillTeamMonth as action335} from "@/app/(app)/scheduling/actions";
import {replanCover as action336} from "@/app/(app)/scheduling/actions";
import {publishMonth as action337} from "@/app/(app)/scheduling/actions";
import {saveShift as action338} from "@/app/(app)/scheduling/actions";
import {getWorkforce as action339} from "@/app/(app)/scheduling/workforce/actions";
import {placeBreak as action340} from "@/app/(app)/scheduling/workforce/actions";
import {saveActivity as action341} from "@/app/(app)/scheduling/workforce/actions";
import {removeActivity as action342} from "@/app/(app)/scheduling/workforce/actions";
import {saveInterval as action343} from "@/app/(app)/scheduling/workforce/actions";
import {removeInterval as action344} from "@/app/(app)/scheduling/workforce/actions";
import {createOpening as action345} from "@/app/(app)/scheduling/workforce/actions";
import {requestOpening as action346} from "@/app/(app)/scheduling/workforce/actions";
import {decideOpening as action347} from "@/app/(app)/scheduling/workforce/actions";
import {cancelOpening as action348} from "@/app/(app)/scheduling/workforce/actions";
import {saveAvailability as action349} from "@/app/(app)/scheduling/workforce/actions";
import {removeAvailability as action350} from "@/app/(app)/scheduling/workforce/actions";
import {saveRole as action351} from "@/app/(app)/settings/actions";
import {saveMemberRoles as action352} from "@/app/(app)/settings/actions";
import {createUser as action353} from "@/app/(app)/settings/actions";
import {saveCompanyAccess as action354} from "@/app/(app)/settings/actions";
import {saveCompanyProfile as action355} from "@/app/(app)/settings/actions";
import {saveManagerPolicy as action356} from "@/app/(app)/settings/actions";
import {saveWorkspaceDetails as action357} from "@/app/(app)/settings/actions";
import {saveCompanyBrand as action358} from "@/app/(app)/settings/actions";
import {importCsv as action359} from "@/app/(app)/settings/imports/actions";
import {saveEmailAccount as action360} from "@/app/(app)/settings/it/actions";
import {verifyEmailAccount as action361} from "@/app/(app)/settings/it/actions";
import {sendTestEmail as action362} from "@/app/(app)/settings/it/actions";
import {makeDefaultAccount as action363} from "@/app/(app)/settings/it/actions";
import {setAccountActive as action364} from "@/app/(app)/settings/it/actions";
import {deleteEmailAccount as action365} from "@/app/(app)/settings/it/actions";
import {saveSocialAccount as action366} from "@/app/(app)/settings/it/actions";
import {deleteSocialAccount as action367} from "@/app/(app)/settings/it/actions";
import {checkSocialAccount as action368} from "@/app/(app)/settings/it/actions";
import {saveEmailTemplate as action369} from "@/app/(app)/settings/it/actions";
import {deleteEmailTemplate as action370} from "@/app/(app)/settings/it/actions";
import {checkInboxNow as action371} from "@/app/(app)/settings/it/actions";
import {saveDispatchDelivery as action372} from "@/app/(app)/settings/logistics/actions";
import {saveUserAccess as action373} from "@/app/(app)/settings/user-actions";
import {setUserStatus as action374} from "@/app/(app)/settings/user-actions";
import {revokeUserSessions as action375} from "@/app/(app)/settings/user-actions";
import {issuePasswordRecovery as action376} from "@/app/(app)/settings/user-actions";
import {createManagedUser as action377} from "@/app/(app)/settings/user-actions";
import {linkEmployeeProfile as action378} from "@/app/(app)/settings/user-actions";
import {createRole as action379} from "@/app/(app)/settings/user-actions";
import {saveManagementGroup as action380} from "@/app/(app)/settings/user-actions";
import {createWarehouse as action381} from "@/app/(app)/stock/actions";
import {adjustStock as action382} from "@/app/(app)/stock/actions";
import {savePlanningAction as action383} from "@/app/(app)/stock/actions";
import {makeFromForecastAction as action384} from "@/app/(app)/stock/actions";
import {transferStock as action385} from "@/app/(app)/stock/actions";
import {createSiteAction as action386} from "@/app/(app)/stock/actions";
import {createPlaceAction as action387} from "@/app/(app)/stock/actions";
import {assignSiteAction as action388} from "@/app/(app)/stock/actions";
import {addLocationAction as action389} from "@/app/(app)/stock/actions";
import {ensureLocationsAction as action390} from "@/app/(app)/stock/actions";
import {retireLocationAction as action391} from "@/app/(app)/stock/actions";
import {putOnLocationAction as action392} from "@/app/(app)/stock/actions";
import {moveLocatedAction as action393} from "@/app/(app)/stock/actions";
import {receiveMoveAction as action394} from "@/app/(app)/stock/actions";
import {create as action395} from "@/app/(app)/studio/actions";
import {save as action396} from "@/app/(app)/studio/actions";
import {validate as action397} from "@/app/(app)/studio/actions";
import {publish as action398} from "@/app/(app)/studio/actions";
import {activate as action399} from "@/app/(app)/studio/actions";
import {getCapacity as action400} from "@/app/(app)/teams/[teamId]/capacity/actions";
import {saveAllocation as action401} from "@/app/(app)/teams/[teamId]/capacity/actions";
import {updateWorkStatus as action402} from "@/app/(app)/teams/[teamId]/capacity/actions";
import {saveTemplate as action403} from "@/app/(app)/templates/actions";
import {archiveTemplate as action404} from "@/app/(app)/templates/actions";
import {generateTemplateDocument as action405} from "@/app/(app)/templates/actions";
import {delegateApprovals as action406} from "@/core/approvals/actions";
import {loginAction as action407} from "@/core/auth/actions";
import {logoutAction as action408} from "@/core/auth/actions";
import {logoutAdminAction as action409} from "@/core/auth/actions";
import {completePasswordRecovery as action410} from "@/core/auth/security-actions";
import {changeOwnPassword as action411} from "@/core/auth/security-actions";
import {signOutOtherSessions as action412} from "@/core/auth/security-actions";
import {createContract as action413} from "@/core/contracts/actions";
import {sendContract as action414} from "@/core/contracts/actions";
import {shareContractLink as action415} from "@/core/contracts/actions";
import {updateDraftContract as action416} from "@/core/contracts/actions";
import {revokeContract as action417} from "@/core/contracts/actions";
import {deleteContract as action418} from "@/core/contracts/actions";
import {signContract as action419} from "@/core/contracts/actions";
import {returnSignedContract as action420} from "@/core/contracts/actions";
import {reviewContractReturn as action421} from "@/core/contracts/actions";
import {declineContract as action422} from "@/core/contracts/actions";
import {loadPublicContract as action423} from "@/core/contracts/actions";
import {loadPublicContractFile as action424} from "@/core/contracts/actions";
import {checkForDuplicatesAction as action425} from "@/core/customers/actions";
import {createCustomerAction as action426} from "@/core/customers/actions";
import {createCustomer as action427} from "@/core/customers/commands";
import {updateCustomerStatus as action428} from "@/core/customers/commands";
import {archiveCustomer as action429} from "@/core/customers/commands";
import {unarchiveCustomer as action430} from "@/core/customers/commands";
import {deleteCustomer as action431} from "@/core/customers/commands";
import {createContact as action432} from "@/core/customers/commands";
import {updateContact as action433} from "@/core/customers/commands";
import {deleteContact as action434} from "@/core/customers/commands";
import {createAddress as action435} from "@/core/customers/commands";
import {updateCommercialSettings as action436} from "@/core/customers/commands";
import {updateCreditLimit as action437} from "@/core/customers/commands";
import {setCreditHold as action438} from "@/core/customers/commands";
import {setPaymentTerm as action439} from "@/core/customers/commands";
import {createTaxRegistration as action440} from "@/core/customers/commands";
import {markTaxRegistrationManuallyVerified as action441} from "@/core/customers/commands";
import {createBankAccount as action442} from "@/core/customers/commands";
import {revealBankAccount as action443} from "@/core/customers/commands";
import {createDirectDebitMandate as action444} from "@/core/customers/commands";
import {cancelDirectDebitMandate as action445} from "@/core/customers/commands";
import {createNote as action446} from "@/core/customers/commands";
import {saveCustomerHashtags as action447} from "@/core/customers/commands";
import {updateCustomerDetails as action448} from "@/core/customers/commands";
import {updateAddress as action449} from "@/core/customers/commands";
import {archiveAddress as action450} from "@/core/customers/commands";
import {saveOrderingPreferences as action451} from "@/core/customers/commercial-actions";
import {setCustomerParent as action452} from "@/core/customers/hierarchy-actions";
import {placeCustomer as action453} from "@/core/customers/hierarchy-actions";
import {moveCustomer as action454} from "@/core/customers/hierarchy-actions";
import {setContactReportsTo as action455} from "@/core/customers/hierarchy-actions";
import {saveCustomerTradingLink as action456} from "@/core/customers/trading-actions";
import {setInvoiceAccount as action457} from "@/core/customers/trading-actions";
import {archiveCustomerTradingLink as action458} from "@/core/customers/trading-actions";
import {requestSalesInvoice as action459} from "@/core/finance/actions";
import {createWork as action460} from "@/core/service-work/actions";
import {updateWork as action461} from "@/core/service-work/actions";
import {commentWork as action462} from "@/core/service-work/actions";
import {watchWork as action463} from "@/core/service-work/actions";
import {mergeWork as action464} from "@/core/service-work/actions";
import {requestWorkApproval as action465} from "@/core/service-work/actions";
import {decideWorkApproval as action466} from "@/core/service-work/actions";
import {saveDeskQueue as action467} from "@/core/service-work/actions";
import {changeDeskMember as action468} from "@/core/service-work/actions";
import {attachServiceFile as action469} from "@/core/service-work/file-actions";
import {saveKnowledge as action470} from "@/core/service-work/knowledge";
import {createWorkTeam as action471} from "@/core/teams/actions";
import {loadAuditBoard as action472} from "@/modules/audit/services/actions";
import {exportAuditReport as action473} from "@/modules/audit/services/actions";
import {loadEcho as action474} from "@/modules/audit/services/actions";
import {postEchoNote as action475} from "@/modules/audit/services/actions";
import {loadEchoInbox as action476} from "@/modules/audit/services/actions";
import {loadAuditAccess as action477} from "@/modules/audit/services/actions";
import {saveAuditOwnActivity as action478} from "@/modules/audit/services/actions";
import {saveAuditAreas as action479} from "@/modules/audit/services/actions";
import {saveAutomation as action480} from "@/modules/automations/services/actions";
import {setAutomationEnabled as action481} from "@/modules/automations/services/actions";
import {deleteAutomation as action482} from "@/modules/automations/services/actions";
import {testOnPastEvent as action483} from "@/modules/automations/services/actions";
import {runNow as action484} from "@/modules/automations/services/actions";
import {logActivity as action485} from "@/modules/crm/services/activities";
import {completeActivity as action486} from "@/modules/crm/services/activities";
import {saveAppointment as action487} from "@/modules/crm/services/appointments";
import {finishAppointment as action488} from "@/modules/crm/services/appointments";
import {saveAppointmentForm as action489} from "@/modules/crm/services/appointments";
import {finishAppointmentForm as action490} from "@/modules/crm/services/appointments";
import {acceptMarketingHandoff as action491} from "@/modules/crm/services/marketing-handoff";
import {createOpportunity as action492} from "@/modules/crm/services/opportunities";
import {moveOpportunityStage as action493} from "@/modules/crm/services/opportunities";
import {updateOpportunityValue as action494} from "@/modules/crm/services/opportunities";
import {updateOpportunityCloseDate as action495} from "@/modules/crm/services/opportunities";
import {setOpportunityForecastCategory as action496} from "@/modules/crm/services/opportunities";
import {setOpportunityNextAction as action497} from "@/modules/crm/services/opportunities";
import {winOpportunity as action498} from "@/modules/crm/services/opportunities";
import {loseOpportunity as action499} from "@/modules/crm/services/opportunities";
import {addStakeholder as action500} from "@/modules/crm/services/opportunities";
import {addMilestone as action501} from "@/modules/crm/services/opportunities";
import {toggleMilestone as action502} from "@/modules/crm/services/opportunities";
import {checkProspectDuplicatesAction as action503} from "@/modules/crm/services/prospects";
import {createProspect as action504} from "@/modules/crm/services/prospects";
import {assignProspect as action505} from "@/modules/crm/services/prospects";
import {setProspectLifecycleStage as action506} from "@/modules/crm/services/prospects";
import {convertProspect as action507} from "@/modules/crm/services/prospects";
import {createIndustry as action508} from "@/modules/crm/services/prospects";
import {saveProspectGrouping as action509} from "@/modules/crm/services/prospects";
import {createSalesProject as action510} from "@/modules/crm/services/sales-projects-commands";
import {createSalesProjectFormAction as action511} from "@/modules/crm/services/sales-projects-commands";
import {saveSalesProjectAction as action512} from "@/modules/crm/services/sales-projects-commands";
import {saveNextActionAction as action513} from "@/modules/crm/services/sales-projects-commands";
import {addProjectOrganisationAction as action514} from "@/modules/crm/services/sales-projects-commands";
import {removeProjectOrganisationAction as action515} from "@/modules/crm/services/sales-projects-commands";
import {makePrimaryOrganisationAction as action516} from "@/modules/crm/services/sales-projects-commands";
import {addProjectStakeholderAction as action517} from "@/modules/crm/services/sales-projects-commands";
import {removeProjectStakeholderAction as action518} from "@/modules/crm/services/sales-projects-commands";
import {setDocumentSalesProjectAction as action519} from "@/modules/crm/services/sales-projects-commands";
import {deleteSalesProjectAction as action520} from "@/modules/crm/services/sales-projects-commands";
import {saveSurvey as action521} from "@/modules/csat/services/actions";
import {createSurveyFromTemplate as action522} from "@/modules/csat/services/actions";
import {setSurveyActive as action523} from "@/modules/csat/services/actions";
import {deleteSurvey as action524} from "@/modules/csat/services/actions";
import {recordCsatScore as action525} from "@/modules/csat/services/actions";
import {recordCsatComment as action526} from "@/modules/csat/services/actions";
import {saveEngineeringRevision as action527} from "@/modules/engineering/services/commands";
import {transitionEngineeringRevision as action528} from "@/modules/engineering/services/commands";
import {uploadEngineeringDrawing as action529} from "@/modules/engineering/services/commands";
import {saveFieldJob as action530} from "@/modules/fieldservice/services/commands";
import {updateFieldJob as action531} from "@/modules/fieldservice/services/commands";
import {addFieldJobNote as action532} from "@/modules/fieldservice/services/commands";
import {importFinanceStatement as action533} from "@/modules/finance/services/banking";
import {reconcileFinanceStatement as action534} from "@/modules/finance/services/banking";
import {financeReconciliationForm as action535} from "@/modules/finance/services/banking";
import {getFinanceReconciliation as action536} from "@/modules/finance/services/banking";
import {importFinanceStatementForm as action537} from "@/modules/finance/services/banking";
import {getFinanceCollections as action538} from "@/modules/finance/services/collections";
import {recordFinanceCollection as action539} from "@/modules/finance/services/collections";
import {setupFinance as action540} from "@/modules/finance/services/commands";
import {createFinanceDocument as action541} from "@/modules/finance/services/commands";
import {submitFinanceDocument as action542} from "@/modules/finance/services/commands";
import {saveApprovalPolicy as action543} from "@/modules/finance/services/commands";
import {decideFinanceApproval as action544} from "@/modules/finance/services/commands";
import {createPurchaseOrder as action545} from "@/modules/finance/services/commands";
import {raiseServiceCredit as action546} from "@/modules/finance/services/commands";
import {postFinanceDocument as action547} from "@/modules/finance/services/commands";
import {recordGoodsReceipt as action548} from "@/modules/finance/services/commands";
import {onboardSupplier as action549} from "@/modules/finance/services/commands";
import {approveSupplier as action550} from "@/modules/finance/services/commands";
import {requestSupplierBankChange as action551} from "@/modules/finance/services/commands";
import {verifySupplierBank as action552} from "@/modules/finance/services/commands";
import {createFinanceBank as action553} from "@/modules/finance/services/commands";
import {importBankTransactions as action554} from "@/modules/finance/services/commands";
import {allocateBankTransaction as action555} from "@/modules/finance/services/commands";
import {createPaymentRun as action556} from "@/modules/finance/services/commands";
import {approvePaymentRun as action557} from "@/modules/finance/services/commands";
import {createManualJournal as action558} from "@/modules/finance/services/commands";
import {approveManualJournal as action559} from "@/modules/finance/services/commands";
import {reverseJournal as action560} from "@/modules/finance/services/commands";
import {setFinancePeriodState as action561} from "@/modules/finance/services/commands";
import {saveFinanceBudget as action562} from "@/modules/finance/services/commands";
import {saveFinanceAsset as action563} from "@/modules/finance/services/commands";
import {postAssetDepreciation as action564} from "@/modules/finance/services/commands";
import {completeCloseTask as action565} from "@/modules/finance/services/commands";
import {saveFinanceContract as action566} from "@/modules/finance/services/commands";
import {saveFinanceScenario as action567} from "@/modules/finance/services/commands";
import {receiptForm as action568} from "@/modules/finance/services/commands";
import {journalForm as action569} from "@/modules/finance/services/commands";
import {statementForm as action570} from "@/modules/finance/services/commands";
import {allocationForm as action571} from "@/modules/finance/services/commands";
import {paymentRunForm as action572} from "@/modules/finance/services/commands";
import {policyForm as action573} from "@/modules/finance/services/commands";
import {scenarioForm as action574} from "@/modules/finance/services/commands";
import {uploadFinanceAttachment as action575} from "@/modules/finance/services/commands";
import {generateSalesInvoice as action576} from "@/modules/finance/services/commands";
import {generateInvoiceAdjustment as action577} from "@/modules/finance/services/commands";
import {voidFinanceDraft as action578} from "@/modules/finance/services/commands";
import {getFinanceConfiguration as action579} from "@/modules/finance/services/configuration";
import {saveFinanceEntityDetails as action580} from "@/modules/finance/services/configuration";
import {saveFinanceAccount as action581} from "@/modules/finance/services/configuration";
import {saveFinanceDimension as action582} from "@/modules/finance/services/configuration";
import {createFinancePeriod as action583} from "@/modules/finance/services/configuration";
import {setFinancePeriodExceptions as action584} from "@/modules/finance/services/configuration";
import {requestFinancePeriodReopen as action585} from "@/modules/finance/services/configuration";
import {decideFinancePeriodReopen as action586} from "@/modules/finance/services/configuration";
import {getFinanceHome as action587} from "@/modules/finance/services/queries";
import {listFinanceDocuments as action588} from "@/modules/finance/services/queries";
import {getFinanceDocument as action589} from "@/modules/finance/services/queries";
import {getFinanceWorkspace as action590} from "@/modules/finance/services/queries";
import {financeChoices as action591} from "@/modules/finance/services/queries";
import {getBudgetPositions as action592} from "@/modules/finance/services/queries";
import {getInvoiceCashForecast as action593} from "@/modules/finance/services/queries";
import {getFinancialReport as action594} from "@/modules/finance/services/queries";
import {getFinanceCustomerContribution as action595} from "@/modules/finance/services/queries";
import {searchFinance as action596} from "@/modules/finance/services/queries";
import {getFinanceAttachment as action597} from "@/modules/finance/services/queries";
import {getSalesFinanceProjection as action598} from "@/modules/finance/services/queries";
import {getReceivingWarehouses as action599} from "@/modules/finance/services/queries";
import {getFinanceLedger as action600} from "@/modules/finance/services/reporting";
import {getFinanceJournalDetail as action601} from "@/modules/finance/services/reporting";
import {getFinanceSubledgerReconciliation as action602} from "@/modules/finance/services/reporting";
import {saveFinanceDraft as action603} from "@/modules/finance/services/save-draft";
import {saveVehicle as action604} from "@/modules/fleet/services/commands";
import {addFleetLog as action605} from "@/modules/fleet/services/commands";
import {saveEquipment as action606} from "@/modules/maintenance/services/commands";
import {createMaintenanceWork as action607} from "@/modules/maintenance/services/commands";
import {updateMaintenanceWork as action608} from "@/modules/maintenance/services/commands";
import {recordMaintenancePart as action609} from "@/modules/maintenance/services/commands";
import {createProductionOrder as action610} from "@/modules/manufacturing/services/commands";
import {markOrderReady as action611} from "@/modules/manufacturing/services/commands";
import {releaseOrder as action612} from "@/modules/manufacturing/services/commands";
import {closeOrder as action613} from "@/modules/manufacturing/services/commands";
import {startWorkOrder as action614} from "@/modules/manufacturing/services/commands";
import {pauseWorkOrder as action615} from "@/modules/manufacturing/services/commands";
import {completeWorkOrder as action616} from "@/modules/manufacturing/services/commands";
import {listForecasts as action617} from "@/modules/manufacturing/services/forecast";
import {setForecast as action618} from "@/modules/manufacturing/services/forecast";
import {deleteForecast as action619} from "@/modules/manufacturing/services/forecast";
import {runMrp as action620} from "@/modules/manufacturing/services/mrp";
import {firmSuggestion as action621} from "@/modules/manufacturing/services/mrp";
import {dismissSuggestion as action622} from "@/modules/manufacturing/services/mrp";
import {latestPlan as action623} from "@/modules/manufacturing/services/mrp";
import {loadPlant as action624} from "@/modules/manufacturing/services/plant";
import {saveWorkCentre as action625} from "@/modules/manufacturing/services/plant";
import {saveMachine as action626} from "@/modules/manufacturing/services/plant";
import {retirePlantRecord as action627} from "@/modules/manufacturing/services/plant";
import {schedulePreview as action628} from "@/modules/manufacturing/services/scheduler";
import {rescheduleWorkOrder as action629} from "@/modules/manufacturing/services/scheduler";
import {setWorkOrderLock as action630} from "@/modules/manufacturing/services/scheduler";
import {listShifts as action631} from "@/modules/manufacturing/services/shifts";
import {saveShift as action632} from "@/modules/manufacturing/services/shifts";
import {deleteShift as action633} from "@/modules/manufacturing/services/shifts";
import {createCampaignAction as action634} from "@/modules/marketing/services/campaign-actions 2";
import {saveCampaignBriefAction as action635} from "@/modules/marketing/services/campaign-actions 2";
import {saveBudgetLineAction as action636} from "@/modules/marketing/services/campaign-actions 2";
import {deleteBudgetLineAction as action637} from "@/modules/marketing/services/campaign-actions 2";
import {saveActivityAction as action638} from "@/modules/marketing/services/campaign-actions 2";
import {setActivityStatusAction as action639} from "@/modules/marketing/services/campaign-actions 2";
import {deleteActivityAction as action640} from "@/modules/marketing/services/campaign-actions 2";
import {addPaidSpendAction as action641} from "@/modules/marketing/services/campaign-actions 2";
import {deletePaidSpendAction as action642} from "@/modules/marketing/services/campaign-actions 2";
import {createCampaignAction as action643} from "@/modules/marketing/services/campaign-actions";
import {saveCampaignBriefAction as action644} from "@/modules/marketing/services/campaign-actions";
import {saveBudgetLineAction as action645} from "@/modules/marketing/services/campaign-actions";
import {deleteBudgetLineAction as action646} from "@/modules/marketing/services/campaign-actions";
import {saveActivityAction as action647} from "@/modules/marketing/services/campaign-actions";
import {setActivityStatusAction as action648} from "@/modules/marketing/services/campaign-actions";
import {deleteActivityAction as action649} from "@/modules/marketing/services/campaign-actions";
import {addPaidSpendAction as action650} from "@/modules/marketing/services/campaign-actions";
import {deletePaidSpendAction as action651} from "@/modules/marketing/services/campaign-actions";
import {createCampaign as action652} from "@/modules/marketing/services/commands";
import {updateCampaign as action653} from "@/modules/marketing/services/commands";
import {createProfile as action654} from "@/modules/marketing/services/commands";
import {recordPermission as action655} from "@/modules/marketing/services/commands";
import {suppressProfile as action656} from "@/modules/marketing/services/commands";
import {createAudience as action657} from "@/modules/marketing/services/commands";
import {previewAudience as action658} from "@/modules/marketing/services/commands";
import {createContent as action659} from "@/modules/marketing/services/commands";
import {approveContent as action660} from "@/modules/marketing/services/commands";
import {createMessage as action661} from "@/modules/marketing/services/commands";
import {lockSend as action662} from "@/modules/marketing/services/commands";
import {cancelSend as action663} from "@/modules/marketing/services/commands";
import {ingestEvent as action664} from "@/modules/marketing/services/commands";
import {createJourney as action665} from "@/modules/marketing/services/commands";
import {publishJourney as action666} from "@/modules/marketing/services/commands";
import {reviseJourney as action667} from "@/modules/marketing/services/commands";
import {createProgram as action668} from "@/modules/marketing/services/commands";
import {createExperiment as action669} from "@/modules/marketing/services/commands";
import {leadFeedback as action670} from "@/modules/marketing/services/commands";
import {processJourneySteps as action671} from "@/modules/marketing/services/commands";
import {saveMarketingPlan as action672} from "@/modules/marketing/services/commands";
import {addPlanActivity as action673} from "@/modules/marketing/services/commands";
import {updatePlanActivity as action674} from "@/modules/marketing/services/commands";
import {addBudgetLine as action675} from "@/modules/marketing/services/commands";
import {submitBudgetToFinance as action676} from "@/modules/marketing/services/commands";
import {createJourneyMap as action677} from "@/modules/marketing/services/commands";
import {addJourneyStage as action678} from "@/modules/marketing/services/commands";
import {addJourneyTouch as action679} from "@/modules/marketing/services/commands";
import {editJourneyStage as action680} from "@/modules/marketing/services/journey-workspace";
import {moveJourneyStage as action681} from "@/modules/marketing/services/journey-workspace";
import {editJourneyTouch as action682} from "@/modules/marketing/services/journey-workspace";
import {saveJourneyPath as action683} from "@/modules/marketing/services/journey-workspace";
import {editJourneyStageForm as action684} from "@/modules/marketing/services/journey-workspace";
import {moveJourneyStageForm as action685} from "@/modules/marketing/services/journey-workspace";
import {editJourneyTouchForm as action686} from "@/modules/marketing/services/journey-workspace";
import {saveJourneyPathForm as action687} from "@/modules/marketing/services/journey-workspace";
import {saveSocialPost as action688} from "@/modules/marketing/services/social-actions";
import {deleteSocialPost as action689} from "@/modules/marketing/services/social-actions";
import {retrySocialPost as action690} from "@/modules/marketing/services/social-actions";
import {disconnectMicrosoftCalendar as action691} from "@/modules/meetings/services/calendar-actions";
import {chooseMicrosoftCalendar as action692} from "@/modules/meetings/services/calendar-actions";
import {sendMicrosoftMeeting as action693} from "@/modules/meetings/services/calendar-actions";
import {importMicrosoftMeetings as action694} from "@/modules/meetings/services/calendar-actions";
import {saveMeeting as action695} from "@/modules/meetings/services/commands";
import {meetingStatus as action696} from "@/modules/meetings/services/commands";
import {addMeetingEntry as action697} from "@/modules/meetings/services/commands";
import {completeMeetingAction as action698} from "@/modules/meetings/services/commands";
import {getApprovedExpenseSource as action699} from "@/modules/people/services/finance-expenses";
import {getPlanBuilder as action700} from "@/modules/plan/services/builder";
import {savePlanInput as action701} from "@/modules/plan/services/builder";
import {setPlanInputIncluded as action702} from "@/modules/plan/services/builder";
import {applyPlanInputs as action703} from "@/modules/plan/services/builder";
import {savePlanGrid as action704} from "@/modules/plan/services/builder";
import {removePlanMeasure as action705} from "@/modules/plan/services/builder";
import {createPlan as action706} from "@/modules/plan/services/commands";
import {saveCell as action707} from "@/modules/plan/services/commands";
import {addMeasure as action708} from "@/modules/plan/services/commands";
import {addAssumption as action709} from "@/modules/plan/services/commands";
import {addDriver as action710} from "@/modules/plan/services/commands";
import {addLink as action711} from "@/modules/plan/services/commands";
import {createScenario as action712} from "@/modules/plan/services/commands";
import {promoteScenario as action713} from "@/modules/plan/services/commands";
import {submitPlan as action714} from "@/modules/plan/services/commands";
import {approvePlan as action715} from "@/modules/plan/services/commands";
import {lockPlan as action716} from "@/modules/plan/services/commands";
import {addGoal as action717} from "@/modules/plan/services/commands";
import {addInitiative as action718} from "@/modules/plan/services/commands";
import {createProjectForInitiative as action719} from "@/modules/plan/services/commands";
import {addAction as action720} from "@/modules/plan/services/commands";
import {completeAction as action721} from "@/modules/plan/services/commands";
import {addRisk as action722} from "@/modules/plan/services/commands";
import {addDependency as action723} from "@/modules/plan/services/commands";
import {addDecision as action724} from "@/modules/plan/services/commands";
import {addComment as action725} from "@/modules/plan/services/commands";
import {addUpdate as action726} from "@/modules/plan/services/commands";
import {completeReview as action727} from "@/modules/plan/services/commands";
import {addReview as action728} from "@/modules/plan/services/commands";
import {distributeTargets as action729} from "@/modules/plan/services/commands";
import {importGrid as action730} from "@/modules/plan/services/commands";
import {sharePlan as action731} from "@/modules/plan/services/commands";
import {unsharePlan as action732} from "@/modules/plan/services/commands";
import {setPlanAudience as action733} from "@/modules/plan/services/commands";
import {addNote as action734} from "@/modules/plan/services/commands";
import {saveGoalProgress as action735} from "@/modules/plan/services/commands";
import {savePlanBrief as action736} from "@/modules/plan/services/commands";
import {listProductionPlans as action737} from "@/modules/planning/services/plans";
import {getPlanOptions as action738} from "@/modules/planning/services/plans";
import {getProductionPlan as action739} from "@/modules/planning/services/plans";
import {createProductionPlan as action740} from "@/modules/planning/services/plans";
import {addProductionPlanLine as action741} from "@/modules/planning/services/plans";
import {getAssignedPlanningWork as action742} from "@/modules/planning/services/plans";
import {getPlanningCoverage as action743} from "@/modules/planning/services/queries";
import {saveProductRecipe as action744} from "@/modules/products/services/make";
import {createSpecification as action745} from "@/modules/quality/services/commands";
import {setSpecificationStatus as action746} from "@/modules/quality/services/commands";
import {createControlPoint as action747} from "@/modules/quality/services/commands";
import {executeInspection as action748} from "@/modules/quality/services/commands";
import {releaseHold as action749} from "@/modules/quality/services/commands";
import {reportNcr as action750} from "@/modules/quality/services/commands";
import {updateNcrInvestigation as action751} from "@/modules/quality/services/commands";
import {addNcrAction as action752} from "@/modules/quality/services/commands";
import {updateNcrAction as action753} from "@/modules/quality/services/commands";
import {closeNcr as action754} from "@/modules/quality/services/commands";
import {reportNcr as action755} from "@/modules/quality/services/ncr-actions";
import {updateNcrInvestigation as action756} from "@/modules/quality/services/ncr-actions";
import {addNcrAction as action757} from "@/modules/quality/services/ncr-actions";
import {updateNcrAction as action758} from "@/modules/quality/services/ncr-actions";
import {closeNcr as action759} from "@/modules/quality/services/ncr-actions";
import {reopenNcr as action760} from "@/modules/quality/services/ncr-actions";
import {saveNcrAction as action761} from "@/modules/quality/services/ncr-actions";
import {saveSubstance as action762} from "@/modules/safety/services/assurance";
import {addSafetyDataSheet as action763} from "@/modules/safety/services/assurance";
import {saveCoshhAssessment as action764} from "@/modules/safety/services/assurance";
import {approveSubstance as action765} from "@/modules/safety/services/assurance";
import {saveCompetence as action766} from "@/modules/safety/services/assurance";
import {saveSafetyDocument as action767} from "@/modules/safety/services/assurance";
import {acknowledgeDocument as action768} from "@/modules/safety/services/assurance";
import {saveAudit as action769} from "@/modules/safety/services/assurance";
import {addAuditFinding as action770} from "@/modules/safety/services/assurance";
import {approveAudit as action771} from "@/modules/safety/services/assurance";
import {saveChange as action772} from "@/modules/safety/services/assurance";
import {advanceChange as action773} from "@/modules/safety/services/assurance";
import {linkSafetyRecord as action774} from "@/modules/safety/services/assurance";
import {saveSafetyProfile as action775} from "@/modules/safety/services/commands";
import {saveRiskMatrix as action776} from "@/modules/safety/services/commands";
import {createRisk as action777} from "@/modules/safety/services/commands";
import {addControl as action778} from "@/modules/safety/services/commands";
import {rateAssessment as action779} from "@/modules/safety/services/commands";
import {approveAssessment as action780} from "@/modules/safety/services/commands";
import {reviseAssessment as action781} from "@/modules/safety/services/commands";
import {requestRiskReview as action782} from "@/modules/safety/services/commands";
import {reportIncident as action783} from "@/modules/safety/services/commands";
import {saveImmediateControl as action784} from "@/modules/safety/services/commands";
import {openInvestigation as action785} from "@/modules/safety/services/commands";
import {addCause as action786} from "@/modules/safety/services/commands";
import {saveRootCause as action787} from "@/modules/safety/services/commands";
import {reviewRiddor as action788} from "@/modules/safety/services/commands";
import {createSafetyAction as action789} from "@/modules/safety/services/commands";
import {advanceAction as action790} from "@/modules/safety/services/commands";
import {verifyAction as action791} from "@/modules/safety/services/commands";
import {saveWorkplaceRecord as action792} from "@/modules/safety/services/commands";
import {createPermit as action793} from "@/modules/safety/services/control";
import {advancePermit as action794} from "@/modules/safety/services/control";
import {extendPermit as action795} from "@/modules/safety/services/control";
import {createIsolation as action796} from "@/modules/safety/services/control";
import {applyIsolationLock as action797} from "@/modules/safety/services/control";
import {verifyIsolation as action798} from "@/modules/safety/services/control";
import {clearIsolation as action799} from "@/modules/safety/services/control";
import {removeIsolationLock as action800} from "@/modules/safety/services/control";
import {placeSafetyHold as action801} from "@/modules/safety/services/control";
import {updateReturnToService as action802} from "@/modules/safety/services/control";
import {releaseSafetyHold as action803} from "@/modules/safety/services/control";
import {overrideSafetyHold as action804} from "@/modules/safety/services/control";
import {saveStatutoryCheck as action805} from "@/modules/safety/services/control";
import {completeInspection as action806} from "@/modules/safety/services/control";
import {createInspection as action807} from "@/modules/safety/services/control";
import {createSalesAddress as action808} from "@/modules/sales/services/address-actions";
import {createSalesCatalogueProduct as action809} from "@/modules/sales/services/catalogue-actions";
import {sendQuote as action810} from "@/modules/sales/services/commands";
import {changeQuoteStatus as action811} from "@/modules/sales/services/commands";
import {deleteQuote as action812} from "@/modules/sales/services/commands";
import {duplicateDocument as action813} from "@/modules/sales/services/commands";
import {saveQuoteTemplate as action814} from "@/modules/sales/services/commands";
import {createOrderFromQuote as action815} from "@/modules/sales/services/commands";
import {linkCommercialProject as action816} from "@/modules/sales/services/commercial";
import {openCallOffOrder as action817} from "@/modules/sales/services/commercial";
import {raiseCallOff as action818} from "@/modules/sales/services/commercial";
import {invoiceCallOffDelivery as action819} from "@/modules/sales/services/commercial";
import {deliverAndInvoiceCallOff as action820} from "@/modules/sales/services/commercial";
import {importSalescsv as action821} from "@/modules/sales/services/csv-import";
import {addDeliveryAddress as action822} from "@/modules/sales/services/delivery-address";
import {addInstaller as action823} from "@/modules/sales/services/delivery-address";
import {pricePartyId as action824} from "@/modules/sales/services/delivery-address";
import {linkOrderedFor as action825} from "@/modules/sales/services/delivery-address";
import {saveDocument as action826} from "@/modules/sales/services/documents";
import {saveInvoiceTemplate as action827} from "@/modules/sales/services/invoice-template-actions";
import {retireInvoiceTemplate as action828} from "@/modules/sales/services/invoice-template-actions";
import {attachCustomerInvoiceTemplate as action829} from "@/modules/sales/services/invoice-template-actions";
import {detachCustomerInvoiceTemplate as action830} from "@/modules/sales/services/invoice-template-actions";
import {createDraftOrder as action831} from "@/modules/sales/services/orders";
import {addOrderLine as action832} from "@/modules/sales/services/orders";
import {removeOrderLine as action833} from "@/modules/sales/services/orders";
import {updateDraftOrderFields as action834} from "@/modules/sales/services/orders";
import {confirmOrder as action835} from "@/modules/sales/services/orders";
import {decideApproval as action836} from "@/modules/sales/services/orders";
import {amendLineQuantity as action837} from "@/modules/sales/services/orders";
import {overrideLinePrice as action838} from "@/modules/sales/services/orders";
import {amendRequestedDate as action839} from "@/modules/sales/services/orders";
import {cancelOrder as action840} from "@/modules/sales/services/orders";
import {deleteOrder as action841} from "@/modules/sales/services/orders";
import {cancelLineRemaining as action842} from "@/modules/sales/services/orders";
import {addHold as action843} from "@/modules/sales/services/orders";
import {releaseHold as action844} from "@/modules/sales/services/orders";
import {redeemServiceRecovery as action845} from "@/modules/sales/services/recovery";
import {restoreCancelledOrder as action846} from "@/modules/sales/services/rewind";
import {returnOrderToQuote as action847} from "@/modules/sales/services/rewind";
import {saveOrderHashtags as action848} from "@/modules/sales/services/rewind";
import {saveSalesView as action849} from "@/modules/sales/services/saved-views";
import {archiveSalesView as action850} from "@/modules/sales/services/saved-views";
import {createCase as action851} from "@/modules/service/services/commands";
import {updateCase as action852} from "@/modules/service/services/commands";
import {assignCase as action853} from "@/modules/service/services/commands";
import {transitionCase as action854} from "@/modules/service/services/commands";
import {addCaseEntry as action855} from "@/modules/service/services/commands";
import {createDepartmentTicket as action856} from "@/modules/service/services/commands";
import {updateDepartmentTicket as action857} from "@/modules/service/services/commands";
import {createQueue as action858} from "@/modules/service/services/commands";
import {addQueueMember as action859} from "@/modules/service/services/commands";
import {linkCaseRecord as action860} from "@/modules/service/services/commands";
import {creditChoices as action861} from "@/modules/service/services/commands";
import {askFinanceForCredit as action862} from "@/modules/service/services/commands";
import {getCaseOwners as action863} from "@/modules/service/services/commands";
import {getDepartmentWork as action864} from "@/modules/service/services/commands";
import {savePurchaseContext as action865} from "@/modules/service/services/commands";
import {saveInvestigation as action866} from "@/modules/service/services/commands";
import {logCaseCall as action867} from "@/modules/service/services/commands";
import {createCaseRemedy as action868} from "@/modules/service/services/commands";
import {mergeCases as action869} from "@/modules/service/services/commands";
import {sendCaseEmail as action870} from "@/modules/service/services/communication";
import {invalidateCaseCsat as action871} from "@/modules/service/services/communication";
import {casePurchaseContext as action872} from "@/modules/service/services/context";
import {proposeRecovery as action873} from "@/modules/service/services/recovery";
import {decideRecovery as action874} from "@/modules/service/services/recovery";
import {saveServiceApprovalRoute as action875} from "@/modules/service/services/recovery";
import {getSopWorkspace as action876} from "@/modules/sop/services/workspace";
import {createSopCycle as action877} from "@/modules/sop/services/workspace";
import {configureSopCycle as action878} from "@/modules/sop/services/workspace";
import {generateSopForecast as action879} from "@/modules/sop/services/workspace";
import {approveSopVersion as action880} from "@/modules/sop/services/workspace";
import {updateSopWorkflow as action881} from "@/modules/sop/services/workspace";
import {publishSopVersion as action882} from "@/modules/sop/services/workspace";
import {createSopScenario as action883} from "@/modules/sop/services/workspace";
import {promoteSopScenario as action884} from "@/modules/sop/services/workspace";
import {overrideSopDemand as action885} from "@/modules/sop/services/workspace";
import {getLiveSopService as action886} from "@/modules/sop/services/workspace";
import {getSopComparison as action887} from "@/modules/sop/services/workspace";
import {getSopAccuracy as action888} from "@/modules/sop/services/workspace";
import {readAvailability as action889} from "@/modules/stock/services/availability";
import {readOrderChain as action890} from "@/modules/stock/services/availability";
import {inventoryExportRows as action891} from "@/modules/stock/services/export";
import {createTeam as action892} from "@/modules/teams/services/commands";
import {renameTeam as action893} from "@/modules/teams/services/commands";
import {addMember as action894} from "@/modules/teams/services/commands";
import {removeMember as action895} from "@/modules/teams/services/commands";
import {saveTask as action896} from "@/modules/teams/services/commands";
import {setTaskStatus as action897} from "@/modules/teams/services/commands";
import {removeTask as action898} from "@/modules/teams/services/commands";
import {saveCover as action899} from "@/modules/teams/services/commands";
import {removeCover as action900} from "@/modules/teams/services/commands";
import {saveHandover as action901} from "@/modules/teams/services/commands";
import {savePlace as action902} from "@/modules/teams/services/commands";
import {saveMoment as action903} from "@/modules/teams/services/commands";
import {removeMoment as action904} from "@/modules/teams/services/commands";
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
"src/app/(app)/kpis/scorecards/actions:getScorecards":action88 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/scorecards/actions:saveScorecard":action89 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/scorecards/actions:removeScorecard":action90 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:syncDemandAction":action91 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:restoreDeliveryAction":action92 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:releaseAction":action93 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:allocateAction":action94 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:directShipAction":action95 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:groupAction":action96 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:scanAction":action97 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:lotAction":action98 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:serialAction":action99 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shortAction":action100 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeWorkAction":action101 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:claimAction":action102 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shipFromPickAction":action103 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packageAction":action104 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:weightAction":action105 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:stageAction":action106 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:labelAction":action107 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:dispatchAction":action108 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:trackingAction":action109 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:deliverAction":action110 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadCreateAction":action111 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadScanAction":action112 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:departAction":action113 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:expectAction":action114 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveLineAction":action115 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:putAwayAction":action116 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeReceiptAction":action117 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferAction":action118 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferReceiveAction":action119 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:returnRequestAction":action120 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:authoriseReturnAction":action121 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveReturnAction":action122 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:inspectAction":action123 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:closeReturnAction":action124 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:assignEquipmentAction":action125 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packUnitAction":action126 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:saveHandlingTypeAction":action127 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:retireHandlingTypeAction":action128 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:removeHandlingTypeAction":action129 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:policyAction":action130 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:runMrpAction":action131 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:firmPlannedOrderAction":action132 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:dismissPlannedOrderAction":action133 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/forecast/actions:setForecastAction":action134 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/forecast/actions:deleteForecastAction":action135 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:runMrpForm":action136 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:firmPlannedOrderForm":action137 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:dismissPlannedOrderForm":action138 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/produce/actions:raiseProductionOrderAction":action139 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:previewMoveAction":action140 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:commitMoveAction":action141 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:toggleLockAction":action142 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:saveShiftAction":action143 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:deleteShiftAction":action144 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:startAction":action145 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:pauseAction":action146 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:completeAction":action147 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:loadNotices":action148 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotice":action149 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotices":action150 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:getPayrollPreparation":action151 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:createPayrollRun":action152 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:updatePayslipDeductions":action153 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:finalisePayrollRun":action154 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:refreshPayrollRun":action155 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:savePeriodAdjustment":action156 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:markPayrollRunPaid":action157 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:savePayrollSettings":action158 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP45":action159 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP60":action160 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/employees/actions:getPayEmployees":action161 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/employees/actions:savePayEmployee":action162 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:logAbsence":action163 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:requestLeave":action164 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:cancelOwnLeave":action165 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:approveLeaveRequest":action166 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:setLeaveAllowance":action167 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:rejectLeaveRequest":action168 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:createEmployee":action169 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:changeEmployeeStatus":action170 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeProfile":action171 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateOwnEmployeeDetails":action172 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeDocument":action173 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:linkEmployeeToUser":action174 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:completeEmployeeTask":action175 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeTask":action176 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeContact":action177 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeTask":action178 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:scheduleAppraisal":action179 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:completeAppraisal":action180 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getConductDesk":action181 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getMyConduct":action182 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getPlan":action183 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getCase":action184 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:conductChoices":action185 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:savePlan":action186 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addPlanReview":action187 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:commentOnPlan":action188 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:saveCase":action189 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:respondToCase":action190 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addCaseEvent":action191 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:submitExpenseClaim":action192 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:approveExpenseClaim":action193 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:rejectExpenseClaim":action194 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:scheduleOneToOne":action195 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:completeOneToOne":action196 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/platform-actions:saveVacancy":action197 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/platform-actions:saveApplication":action198 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/platform-actions:saveTraining":action199 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/platform-actions:saveHRDocument":action200 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:listPolicies":action201 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:publishPolicy":action202 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:archivePolicy":action203 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:openPolicy":action204 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:createShift":action205 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:changeShiftStatus":action206 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyHR":action207 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyTeam":action208 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getTeamEmployee":action209 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:addPrivateNote":action210 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:updateWorkingPattern":action211 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:updateHrSettings":action212 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createAppraisalTemplate":action213 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleAppraisalTemplateActive":action214 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createOneToOneTemplate":action215 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleOneToOneTemplateActive":action216 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:getTimesheetContext":action217 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:saveTimesheet":action218 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:reviewTimesheet":action219 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:createPriceList":action220 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:savePriceEntry":action221 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveRule":action222 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:setRuleActive":action223 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:updatePriceBasis":action224 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:renamePriceList":action225 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:assignPriceListCustomers":action226 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:checkSalesPrice":action227 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:assignPriceList":action228 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewPriceCsv":action229 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyPriceCsv":action230 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreement":action231 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreementPrice":action232 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:removeAgreementPrice":action233 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewAgreementCsv":action234 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyAgreementCsv":action235 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProduct":action236 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProductRecord":action237 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveCategory":action238 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:retireCategory":action239 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:addStandardCategories":action240 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:savePack":action241 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveLinks":action242 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveMeasures":action243 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/actions:saveProfile":action244 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/work:loadAssignedWork":action245 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProject":action246 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeProjectStatus":action247 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editProject":action248 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProjectMember":action249 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:archiveProject":action250 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTask":action251 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeTaskStatus":action252 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editTask":action253 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:checklistItem":action254 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addDependency":action255 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMeeting":action256 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDocument":action257 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editDocument":action258 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addComment":action259 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMilestone":action260 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:publishUpdate":action261 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDecision":action262 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:decide":action263 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createRisk":action264 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:closeRisk":action265 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:requestApproval":action266 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:respondApproval":action267 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:submitRequest":action268 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:triageRequest":action269 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:logTime":action270 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:planToday":action271 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:updateInbox":action272 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveView":action273 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createPortfolio":action274 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createBaseline":action275 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setBudget":action276 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:linkWork":action277 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectActivity":action278 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createAutomation":action279 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:toggleAutomation":action280 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveProjectTemplate":action281 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:useProjectTemplate":action282 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:startTimer":action283 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:stopTimer":action284 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:projectPreference":action285 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:uploadProjectFile":action286 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:readProjectFile":action287 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProperty":action288 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProperty":action289 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:restoreDocument":action290 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTaskFromDocument":action291 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:discardTimer":action292 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:completeMilestone":action293 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:resolveComment":action294 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectWorkload":action295 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:rescheduleTask":action296 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:newContractAction":action297 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:resendContractAction":action298 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:deleteContractAction":action299 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:createOrderForm":action300 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addLineForm":action301 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:removeLineForm":action302 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:confirmOrderForm":action303 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:updateOrderForm":action304 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:chooseOrderAddresses":action305 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addHoldForm":action306 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:releaseHoldForm":action307 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:approveOrderForm":action308 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:cancelOrderForm":action309 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:saveOrderHashtagsForm":action310 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:restoreCancelledOrderForm":action311 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:returnOrderToQuoteForm":action312 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:scheduleOrderDelivery":action313 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:rejectOrderApproval":action314 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:deleteOrderForm":action315 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:createQuote":action316 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:deleteQuoteForm":action317 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/settings/actions:saveCreationPolicy":action318 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/sites/actions:saveSiteAction":action319 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/sites/actions:setDocumentSiteAction":action320 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getSchedule":action321 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:createBulkShifts":action322 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:setScheduledShift":action323 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:completeShiftTask":action324 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:editScheduledShift":action325 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishWeekShifts":action326 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveHoursBudget":action327 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getTeamPlan":action328 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getPersonSchedule":action329 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveWorkType":action330 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:archiveWorkType":action331 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveDemand":action332 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveBusyRule":action333 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:removeBusyRule":action334 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:fillTeamMonth":action335 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:replanCover":action336 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishMonth":action337 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveShift":action338 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:getWorkforce":action339 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:placeBreak":action340 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:saveActivity":action341 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:removeActivity":action342 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:saveInterval":action343 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:removeInterval":action344 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:createOpening":action345 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:requestOpening":action346 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:decideOpening":action347 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:cancelOpening":action348 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:saveAvailability":action349 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:removeAvailability":action350 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveRole":action351 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveMemberRoles":action352 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:createUser":action353 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyAccess":action354 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyProfile":action355 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveManagerPolicy":action356 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveWorkspaceDetails":action357 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyBrand":action358 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/imports/actions:importCsv":action359 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveEmailAccount":action360 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:verifyEmailAccount":action361 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:sendTestEmail":action362 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:makeDefaultAccount":action363 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:setAccountActive":action364 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteEmailAccount":action365 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveSocialAccount":action366 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteSocialAccount":action367 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:checkSocialAccount":action368 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveEmailTemplate":action369 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteEmailTemplate":action370 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:checkInboxNow":action371 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/logistics/actions:saveDispatchDelivery":action372 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveUserAccess":action373 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:setUserStatus":action374 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:revokeUserSessions":action375 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:issuePasswordRecovery":action376 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createManagedUser":action377 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:linkEmployeeProfile":action378 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createRole":action379 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveManagementGroup":action380 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createWarehouse":action381 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:adjustStock":action382 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:savePlanningAction":action383 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:makeFromForecastAction":action384 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:transferStock":action385 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createSiteAction":action386 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createPlaceAction":action387 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:assignSiteAction":action388 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:addLocationAction":action389 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:ensureLocationsAction":action390 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:retireLocationAction":action391 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:putOnLocationAction":action392 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:moveLocatedAction":action393 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:receiveMoveAction":action394 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/studio/actions:create":action395 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/studio/actions:save":action396 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/studio/actions:validate":action397 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/studio/actions:publish":action398 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/studio/actions:activate":action399 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/teams/[teamId]/capacity/actions:getCapacity":action400 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/teams/[teamId]/capacity/actions:saveAllocation":action401 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/teams/[teamId]/capacity/actions:updateWorkStatus":action402 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/templates/actions:saveTemplate":action403 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/templates/actions:archiveTemplate":action404 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/templates/actions:generateTemplateDocument":action405 as (...args:never[])=>Promise<unknown>,
"src/core/approvals/actions:delegateApprovals":action406 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:loginAction":action407 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:logoutAction":action408 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:logoutAdminAction":action409 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:completePasswordRecovery":action410 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:changeOwnPassword":action411 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:signOutOtherSessions":action412 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:createContract":action413 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:sendContract":action414 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:shareContractLink":action415 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:updateDraftContract":action416 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:revokeContract":action417 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:deleteContract":action418 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:signContract":action419 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:returnSignedContract":action420 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:reviewContractReturn":action421 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:declineContract":action422 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:loadPublicContract":action423 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:loadPublicContractFile":action424 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:checkForDuplicatesAction":action425 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:createCustomerAction":action426 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createCustomer":action427 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerStatus":action428 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:archiveCustomer":action429 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:unarchiveCustomer":action430 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteCustomer":action431 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createContact":action432 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateContact":action433 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteContact":action434 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createAddress":action435 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCommercialSettings":action436 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCreditLimit":action437 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setCreditHold":action438 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setPaymentTerm":action439 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createTaxRegistration":action440 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:markTaxRegistrationManuallyVerified":action441 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createBankAccount":action442 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:revealBankAccount":action443 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createDirectDebitMandate":action444 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:cancelDirectDebitMandate":action445 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createNote":action446 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:saveCustomerHashtags":action447 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerDetails":action448 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateAddress":action449 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:archiveAddress":action450 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commercial-actions:saveOrderingPreferences":action451 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setCustomerParent":action452 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:placeCustomer":action453 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:moveCustomer":action454 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setContactReportsTo":action455 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:saveCustomerTradingLink":action456 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:setInvoiceAccount":action457 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:archiveCustomerTradingLink":action458 as (...args:never[])=>Promise<unknown>,
"src/core/finance/actions:requestSalesInvoice":action459 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:createWork":action460 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:updateWork":action461 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:commentWork":action462 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:watchWork":action463 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:mergeWork":action464 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:requestWorkApproval":action465 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:decideWorkApproval":action466 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:saveDeskQueue":action467 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:changeDeskMember":action468 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/file-actions:attachServiceFile":action469 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/knowledge:saveKnowledge":action470 as (...args:never[])=>Promise<unknown>,
"src/core/teams/actions:createWorkTeam":action471 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditBoard":action472 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:exportAuditReport":action473 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEcho":action474 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:postEchoNote":action475 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEchoInbox":action476 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditAccess":action477 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditOwnActivity":action478 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditAreas":action479 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:saveAutomation":action480 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:setAutomationEnabled":action481 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:deleteAutomation":action482 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:testOnPastEvent":action483 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:runNow":action484 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:logActivity":action485 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:completeActivity":action486 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/appointments:saveAppointment":action487 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/appointments:finishAppointment":action488 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/appointments:saveAppointmentForm":action489 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/appointments:finishAppointmentForm":action490 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/marketing-handoff:acceptMarketingHandoff":action491 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:createOpportunity":action492 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:moveOpportunityStage":action493 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityValue":action494 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityCloseDate":action495 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityForecastCategory":action496 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityNextAction":action497 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:winOpportunity":action498 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:loseOpportunity":action499 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addStakeholder":action500 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addMilestone":action501 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:toggleMilestone":action502 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:checkProspectDuplicatesAction":action503 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createProspect":action504 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:assignProspect":action505 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:setProspectLifecycleStage":action506 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:convertProspect":action507 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createIndustry":action508 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:saveProspectGrouping":action509 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProject":action510 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProjectFormAction":action511 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:saveSalesProjectAction":action512 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:saveNextActionAction":action513 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addProjectOrganisationAction":action514 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:removeProjectOrganisationAction":action515 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:makePrimaryOrganisationAction":action516 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addProjectStakeholderAction":action517 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:removeProjectStakeholderAction":action518 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:setDocumentSalesProjectAction":action519 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:deleteSalesProjectAction":action520 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:saveSurvey":action521 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:createSurveyFromTemplate":action522 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:setSurveyActive":action523 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:deleteSurvey":action524 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatScore":action525 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatComment":action526 as (...args:never[])=>Promise<unknown>,
"src/modules/engineering/services/commands:saveEngineeringRevision":action527 as (...args:never[])=>Promise<unknown>,
"src/modules/engineering/services/commands:transitionEngineeringRevision":action528 as (...args:never[])=>Promise<unknown>,
"src/modules/engineering/services/commands:uploadEngineeringDrawing":action529 as (...args:never[])=>Promise<unknown>,
"src/modules/fieldservice/services/commands:saveFieldJob":action530 as (...args:never[])=>Promise<unknown>,
"src/modules/fieldservice/services/commands:updateFieldJob":action531 as (...args:never[])=>Promise<unknown>,
"src/modules/fieldservice/services/commands:addFieldJobNote":action532 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:importFinanceStatement":action533 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:reconcileFinanceStatement":action534 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:financeReconciliationForm":action535 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:getFinanceReconciliation":action536 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:importFinanceStatementForm":action537 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/collections:getFinanceCollections":action538 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/collections:recordFinanceCollection":action539 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setupFinance":action540 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceDocument":action541 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:submitFinanceDocument":action542 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveApprovalPolicy":action543 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:decideFinanceApproval":action544 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPurchaseOrder":action545 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:raiseServiceCredit":action546 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postFinanceDocument":action547 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:recordGoodsReceipt":action548 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:onboardSupplier":action549 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveSupplier":action550 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:requestSupplierBankChange":action551 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:verifySupplierBank":action552 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceBank":action553 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:importBankTransactions":action554 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocateBankTransaction":action555 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPaymentRun":action556 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approvePaymentRun":action557 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createManualJournal":action558 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveManualJournal":action559 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:reverseJournal":action560 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setFinancePeriodState":action561 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceBudget":action562 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceAsset":action563 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postAssetDepreciation":action564 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:completeCloseTask":action565 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceContract":action566 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceScenario":action567 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:receiptForm":action568 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:journalForm":action569 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:statementForm":action570 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocationForm":action571 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:paymentRunForm":action572 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:policyForm":action573 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:scenarioForm":action574 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:uploadFinanceAttachment":action575 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateSalesInvoice":action576 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateInvoiceAdjustment":action577 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:voidFinanceDraft":action578 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:getFinanceConfiguration":action579 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:saveFinanceEntityDetails":action580 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:saveFinanceAccount":action581 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:saveFinanceDimension":action582 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:createFinancePeriod":action583 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:setFinancePeriodExceptions":action584 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:requestFinancePeriodReopen":action585 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:decideFinancePeriodReopen":action586 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceHome":action587 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:listFinanceDocuments":action588 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceDocument":action589 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceWorkspace":action590 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:financeChoices":action591 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getBudgetPositions":action592 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getInvoiceCashForecast":action593 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinancialReport":action594 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceCustomerContribution":action595 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:searchFinance":action596 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceAttachment":action597 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getSalesFinanceProjection":action598 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getReceivingWarehouses":action599 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/reporting:getFinanceLedger":action600 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/reporting:getFinanceJournalDetail":action601 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/reporting:getFinanceSubledgerReconciliation":action602 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/save-draft:saveFinanceDraft":action603 as (...args:never[])=>Promise<unknown>,
"src/modules/fleet/services/commands:saveVehicle":action604 as (...args:never[])=>Promise<unknown>,
"src/modules/fleet/services/commands:addFleetLog":action605 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:saveEquipment":action606 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:createMaintenanceWork":action607 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:updateMaintenanceWork":action608 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:recordMaintenancePart":action609 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:createProductionOrder":action610 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:markOrderReady":action611 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:releaseOrder":action612 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:closeOrder":action613 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:startWorkOrder":action614 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:pauseWorkOrder":action615 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:completeWorkOrder":action616 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:listForecasts":action617 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:setForecast":action618 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:deleteForecast":action619 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:runMrp":action620 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:firmSuggestion":action621 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:dismissSuggestion":action622 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:latestPlan":action623 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:loadPlant":action624 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveWorkCentre":action625 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveMachine":action626 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:retirePlantRecord":action627 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:schedulePreview":action628 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:rescheduleWorkOrder":action629 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:setWorkOrderLock":action630 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:listShifts":action631 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:saveShift":action632 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:deleteShift":action633 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:createCampaignAction":action634 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveCampaignBriefAction":action635 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveBudgetLineAction":action636 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deleteBudgetLineAction":action637 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveActivityAction":action638 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:setActivityStatusAction":action639 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deleteActivityAction":action640 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:addPaidSpendAction":action641 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deletePaidSpendAction":action642 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:createCampaignAction":action643 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveCampaignBriefAction":action644 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveBudgetLineAction":action645 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deleteBudgetLineAction":action646 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveActivityAction":action647 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:setActivityStatusAction":action648 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deleteActivityAction":action649 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:addPaidSpendAction":action650 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deletePaidSpendAction":action651 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createCampaign":action652 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updateCampaign":action653 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProfile":action654 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:recordPermission":action655 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:suppressProfile":action656 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createAudience":action657 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:previewAudience":action658 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createContent":action659 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:approveContent":action660 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createMessage":action661 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:lockSend":action662 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:cancelSend":action663 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:ingestEvent":action664 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourney":action665 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:publishJourney":action666 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:reviseJourney":action667 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProgram":action668 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createExperiment":action669 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:leadFeedback":action670 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:processJourneySteps":action671 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:saveMarketingPlan":action672 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addPlanActivity":action673 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updatePlanActivity":action674 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addBudgetLine":action675 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:submitBudgetToFinance":action676 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourneyMap":action677 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyStage":action678 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyTouch":action679 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:editJourneyStage":action680 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:moveJourneyStage":action681 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:editJourneyTouch":action682 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:saveJourneyPath":action683 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:editJourneyStageForm":action684 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:moveJourneyStageForm":action685 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:editJourneyTouchForm":action686 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/journey-workspace:saveJourneyPathForm":action687 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:saveSocialPost":action688 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:deleteSocialPost":action689 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:retrySocialPost":action690 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:disconnectMicrosoftCalendar":action691 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:chooseMicrosoftCalendar":action692 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:sendMicrosoftMeeting":action693 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:importMicrosoftMeetings":action694 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:saveMeeting":action695 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:meetingStatus":action696 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:addMeetingEntry":action697 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:completeMeetingAction":action698 as (...args:never[])=>Promise<unknown>,
"src/modules/people/services/finance-expenses:getApprovedExpenseSource":action699 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:getPlanBuilder":action700 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:savePlanInput":action701 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:setPlanInputIncluded":action702 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:applyPlanInputs":action703 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:savePlanGrid":action704 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:removePlanMeasure":action705 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createPlan":action706 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveCell":action707 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addMeasure":action708 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAssumption":action709 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDriver":action710 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addLink":action711 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createScenario":action712 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:promoteScenario":action713 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:submitPlan":action714 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:approvePlan":action715 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:lockPlan":action716 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addGoal":action717 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addInitiative":action718 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createProjectForInitiative":action719 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAction":action720 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeAction":action721 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addRisk":action722 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDependency":action723 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDecision":action724 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addComment":action725 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addUpdate":action726 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeReview":action727 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addReview":action728 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:distributeTargets":action729 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:importGrid":action730 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:sharePlan":action731 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:unsharePlan":action732 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:setPlanAudience":action733 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addNote":action734 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveGoalProgress":action735 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:savePlanBrief":action736 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:listProductionPlans":action737 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getPlanOptions":action738 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getProductionPlan":action739 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:createProductionPlan":action740 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:addProductionPlanLine":action741 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getAssignedPlanningWork":action742 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/queries:getPlanningCoverage":action743 as (...args:never[])=>Promise<unknown>,
"src/modules/products/services/make:saveProductRecipe":action744 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createSpecification":action745 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:setSpecificationStatus":action746 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createControlPoint":action747 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:executeInspection":action748 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:releaseHold":action749 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:reportNcr":action750 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrInvestigation":action751 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:addNcrAction":action752 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrAction":action753 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:closeNcr":action754 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:reportNcr":action755 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:updateNcrInvestigation":action756 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:addNcrAction":action757 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:updateNcrAction":action758 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:closeNcr":action759 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:reopenNcr":action760 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:saveNcrAction":action761 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSubstance":action762 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addSafetyDataSheet":action763 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCoshhAssessment":action764 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveSubstance":action765 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCompetence":action766 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSafetyDocument":action767 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:acknowledgeDocument":action768 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveAudit":action769 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addAuditFinding":action770 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveAudit":action771 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveChange":action772 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:advanceChange":action773 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:linkSafetyRecord":action774 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveSafetyProfile":action775 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRiskMatrix":action776 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createRisk":action777 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addControl":action778 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:rateAssessment":action779 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:approveAssessment":action780 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviseAssessment":action781 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:requestRiskReview":action782 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reportIncident":action783 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveImmediateControl":action784 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:openInvestigation":action785 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addCause":action786 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRootCause":action787 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviewRiddor":action788 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createSafetyAction":action789 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:advanceAction":action790 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:verifyAction":action791 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveWorkplaceRecord":action792 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createPermit":action793 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:advancePermit":action794 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:extendPermit":action795 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createIsolation":action796 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:applyIsolationLock":action797 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:verifyIsolation":action798 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:clearIsolation":action799 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:removeIsolationLock":action800 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:placeSafetyHold":action801 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:updateReturnToService":action802 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:releaseSafetyHold":action803 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:overrideSafetyHold":action804 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:saveStatutoryCheck":action805 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:completeInspection":action806 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createInspection":action807 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/address-actions:createSalesAddress":action808 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/catalogue-actions:createSalesCatalogueProduct":action809 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:sendQuote":action810 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:changeQuoteStatus":action811 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:deleteQuote":action812 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:duplicateDocument":action813 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:saveQuoteTemplate":action814 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:createOrderFromQuote":action815 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:linkCommercialProject":action816 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:openCallOffOrder":action817 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:raiseCallOff":action818 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:invoiceCallOffDelivery":action819 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:deliverAndInvoiceCallOff":action820 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/csv-import:importSalescsv":action821 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:addDeliveryAddress":action822 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:addInstaller":action823 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:pricePartyId":action824 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:linkOrderedFor":action825 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/documents:saveDocument":action826 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:saveInvoiceTemplate":action827 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:retireInvoiceTemplate":action828 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:attachCustomerInvoiceTemplate":action829 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:detachCustomerInvoiceTemplate":action830 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:createDraftOrder":action831 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addOrderLine":action832 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:removeOrderLine":action833 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:updateDraftOrderFields":action834 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:confirmOrder":action835 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:decideApproval":action836 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendLineQuantity":action837 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:overrideLinePrice":action838 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendRequestedDate":action839 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelOrder":action840 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:deleteOrder":action841 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelLineRemaining":action842 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addHold":action843 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:releaseHold":action844 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/recovery:redeemServiceRecovery":action845 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:restoreCancelledOrder":action846 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:returnOrderToQuote":action847 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:saveOrderHashtags":action848 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:saveSalesView":action849 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:archiveSalesView":action850 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createCase":action851 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateCase":action852 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:assignCase":action853 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:transitionCase":action854 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addCaseEntry":action855 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createDepartmentTicket":action856 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateDepartmentTicket":action857 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createQueue":action858 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addQueueMember":action859 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:linkCaseRecord":action860 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:creditChoices":action861 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:askFinanceForCredit":action862 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getCaseOwners":action863 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getDepartmentWork":action864 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:savePurchaseContext":action865 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:saveInvestigation":action866 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:logCaseCall":action867 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createCaseRemedy":action868 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:mergeCases":action869 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/communication:sendCaseEmail":action870 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/communication:invalidateCaseCsat":action871 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/context:casePurchaseContext":action872 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/recovery:proposeRecovery":action873 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/recovery:decideRecovery":action874 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/recovery:saveServiceApprovalRoute":action875 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getSopWorkspace":action876 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:createSopCycle":action877 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:configureSopCycle":action878 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:generateSopForecast":action879 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:approveSopVersion":action880 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:updateSopWorkflow":action881 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:publishSopVersion":action882 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:createSopScenario":action883 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:promoteSopScenario":action884 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:overrideSopDemand":action885 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getLiveSopService":action886 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getSopComparison":action887 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getSopAccuracy":action888 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readAvailability":action889 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readOrderChain":action890 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/export:inventoryExportRows":action891 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:createTeam":action892 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:renameTeam":action893 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:addMember":action894 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMember":action895 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveTask":action896 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:setTaskStatus":action897 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeTask":action898 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveCover":action899 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeCover":action900 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveHandover":action901 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:savePlace":action902 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveMoment":action903 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMoment":action904 as (...args:never[])=>Promise<unknown>
});
