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
import {toggleModuleAction as action33} from "@/app/(app)/apps/actions";
import {postMessage as action34} from "@/app/(app)/chat/actions";
import {searchChatPeople as action35} from "@/app/(app)/chat/actions";
import {openChat as action36} from "@/app/(app)/chat/actions";
import {openDirectChat as action37} from "@/app/(app)/chat/actions";
import {searchChatRecords as action38} from "@/app/(app)/chat/actions";
import {sendChat as action39} from "@/app/(app)/chat/actions";
import {chatSnapshot as action40} from "@/app/(app)/chat/actions";
import {createDealContract as action41} from "@/app/(app)/crm/contracts/actions";
import {updateValueFormAction as action42} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {updateCloseDateFormAction as action43} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {setNextActionFormAction as action44} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {setForecastCategoryFormAction as action45} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {winFormAction as action46} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {loseFormAction as action47} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addStakeholderFormAction as action48} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addMilestoneFormAction as action49} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {toggleMilestoneFormAction as action50} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {logOpportunityActivityFormAction as action51} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addDealAction as action52} from "@/app/(app)/crm/pipeline/actions";
import {qualifyFormAction as action53} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {disqualifyFormAction as action54} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {nurtureFormAction as action55} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {logProspectActivityFormAction as action56} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {assignProspectFormAction as action57} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {assignProspectTaskFormAction as action58} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {convertProspectFormAction as action59} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {pinReportToDashboard as action60} from "@/app/(app)/crm/reports/actions";
import {createContactFormAction as action61} from "@/app/(app)/customers/[partyId]/actions";
import {updateContactFormAction as action62} from "@/app/(app)/customers/[partyId]/actions";
import {deleteContactFormAction as action63} from "@/app/(app)/customers/[partyId]/actions";
import {createAddressFormAction as action64} from "@/app/(app)/customers/[partyId]/actions";
import {createTaxRegistrationFormAction as action65} from "@/app/(app)/customers/[partyId]/actions";
import {markTaxVerifiedFormAction as action66} from "@/app/(app)/customers/[partyId]/actions";
import {createBankAccountFormAction as action67} from "@/app/(app)/customers/[partyId]/actions";
import {createDirectDebitFormAction as action68} from "@/app/(app)/customers/[partyId]/actions";
import {cancelDirectDebitFormAction as action69} from "@/app/(app)/customers/[partyId]/actions";
import {updateCreditLimitFormAction as action70} from "@/app/(app)/customers/[partyId]/actions";
import {toggleCreditHoldFormAction as action71} from "@/app/(app)/customers/[partyId]/actions";
import {createNoteFormAction as action72} from "@/app/(app)/customers/[partyId]/actions";
import {updateStatusFormAction as action73} from "@/app/(app)/customers/[partyId]/actions";
import {archiveCustomerFormAction as action74} from "@/app/(app)/customers/[partyId]/actions";
import {unarchiveCustomerFormAction as action75} from "@/app/(app)/customers/[partyId]/actions";
import {deleteCustomerFormAction as action76} from "@/app/(app)/customers/[partyId]/actions";
import {createKpi as action77} from "@/app/(app)/kpis/actions";
import {saveGoal as action78} from "@/app/(app)/kpis/actions";
import {updateKpi as action79} from "@/app/(app)/kpis/actions";
import {recordProgress as action80} from "@/app/(app)/kpis/actions";
import {closeGoal as action81} from "@/app/(app)/kpis/actions";
import {addPlanGoal as action82} from "@/app/(app)/kpis/actions";
import {closePlan as action83} from "@/app/(app)/kpis/actions";
import {commentOnPlan as action84} from "@/app/(app)/kpis/actions";
import {connectGoal as action85} from "@/app/(app)/kpis/actions";
import {getScorecards as action86} from "@/app/(app)/kpis/scorecards/actions";
import {saveScorecard as action87} from "@/app/(app)/kpis/scorecards/actions";
import {removeScorecard as action88} from "@/app/(app)/kpis/scorecards/actions";
import {syncDemandAction as action89} from "@/app/(app)/logistics/actions";
import {restoreDeliveryAction as action90} from "@/app/(app)/logistics/actions";
import {releaseAction as action91} from "@/app/(app)/logistics/actions";
import {allocateAction as action92} from "@/app/(app)/logistics/actions";
import {directShipAction as action93} from "@/app/(app)/logistics/actions";
import {groupAction as action94} from "@/app/(app)/logistics/actions";
import {scanAction as action95} from "@/app/(app)/logistics/actions";
import {lotAction as action96} from "@/app/(app)/logistics/actions";
import {serialAction as action97} from "@/app/(app)/logistics/actions";
import {shortAction as action98} from "@/app/(app)/logistics/actions";
import {completeWorkAction as action99} from "@/app/(app)/logistics/actions";
import {claimAction as action100} from "@/app/(app)/logistics/actions";
import {shipFromPickAction as action101} from "@/app/(app)/logistics/actions";
import {packageAction as action102} from "@/app/(app)/logistics/actions";
import {weightAction as action103} from "@/app/(app)/logistics/actions";
import {stageAction as action104} from "@/app/(app)/logistics/actions";
import {labelAction as action105} from "@/app/(app)/logistics/actions";
import {dispatchAction as action106} from "@/app/(app)/logistics/actions";
import {trackingAction as action107} from "@/app/(app)/logistics/actions";
import {deliverAction as action108} from "@/app/(app)/logistics/actions";
import {loadCreateAction as action109} from "@/app/(app)/logistics/actions";
import {loadScanAction as action110} from "@/app/(app)/logistics/actions";
import {departAction as action111} from "@/app/(app)/logistics/actions";
import {expectAction as action112} from "@/app/(app)/logistics/actions";
import {receiveLineAction as action113} from "@/app/(app)/logistics/actions";
import {putAwayAction as action114} from "@/app/(app)/logistics/actions";
import {completeReceiptAction as action115} from "@/app/(app)/logistics/actions";
import {transferAction as action116} from "@/app/(app)/logistics/actions";
import {transferReceiveAction as action117} from "@/app/(app)/logistics/actions";
import {returnRequestAction as action118} from "@/app/(app)/logistics/actions";
import {authoriseReturnAction as action119} from "@/app/(app)/logistics/actions";
import {receiveReturnAction as action120} from "@/app/(app)/logistics/actions";
import {inspectAction as action121} from "@/app/(app)/logistics/actions";
import {closeReturnAction as action122} from "@/app/(app)/logistics/actions";
import {assignEquipmentAction as action123} from "@/app/(app)/logistics/actions";
import {packUnitAction as action124} from "@/app/(app)/logistics/actions";
import {saveHandlingTypeAction as action125} from "@/app/(app)/logistics/actions";
import {retireHandlingTypeAction as action126} from "@/app/(app)/logistics/actions";
import {removeHandlingTypeAction as action127} from "@/app/(app)/logistics/actions";
import {policyAction as action128} from "@/app/(app)/logistics/actions";
import {runMrpAction as action129} from "@/app/(app)/manufacturing/planning/actions";
import {firmPlannedOrderAction as action130} from "@/app/(app)/manufacturing/planning/actions";
import {dismissPlannedOrderAction as action131} from "@/app/(app)/manufacturing/planning/actions";
import {setForecastAction as action132} from "@/app/(app)/manufacturing/planning/forecast/actions";
import {deleteForecastAction as action133} from "@/app/(app)/manufacturing/planning/forecast/actions";
import {runMrpForm as action134} from "@/app/(app)/manufacturing/planning/form-actions";
import {firmPlannedOrderForm as action135} from "@/app/(app)/manufacturing/planning/form-actions";
import {dismissPlannedOrderForm as action136} from "@/app/(app)/manufacturing/planning/form-actions";
import {raiseProductionOrderAction as action137} from "@/app/(app)/manufacturing/produce/actions";
import {previewMoveAction as action138} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {commitMoveAction as action139} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {toggleLockAction as action140} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {saveShiftAction as action141} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {deleteShiftAction as action142} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {startAction as action143} from "@/app/(app)/manufacturing/shop-floor/actions";
import {pauseAction as action144} from "@/app/(app)/manufacturing/shop-floor/actions";
import {completeAction as action145} from "@/app/(app)/manufacturing/shop-floor/actions";
import {loadNotices as action146} from "@/app/(app)/notices/actions";
import {clearNotice as action147} from "@/app/(app)/notices/actions";
import {clearNotices as action148} from "@/app/(app)/notices/actions";
import {getPayrollPreparation as action149} from "@/app/(app)/payroll/actions";
import {createPayrollRun as action150} from "@/app/(app)/payroll/actions";
import {updatePayslipDeductions as action151} from "@/app/(app)/payroll/actions";
import {finalisePayrollRun as action152} from "@/app/(app)/payroll/actions";
import {refreshPayrollRun as action153} from "@/app/(app)/payroll/actions";
import {savePeriodAdjustment as action154} from "@/app/(app)/payroll/actions";
import {markPayrollRunPaid as action155} from "@/app/(app)/payroll/actions";
import {savePayrollSettings as action156} from "@/app/(app)/payroll/actions";
import {issueP45 as action157} from "@/app/(app)/payroll/actions";
import {issueP60 as action158} from "@/app/(app)/payroll/actions";
import {getPayEmployees as action159} from "@/app/(app)/payroll/employees/actions";
import {savePayEmployee as action160} from "@/app/(app)/payroll/employees/actions";
import {logAbsence as action161} from "@/app/(app)/people/absence/actions";
import {requestLeave as action162} from "@/app/(app)/people/absence/actions";
import {cancelOwnLeave as action163} from "@/app/(app)/people/absence/actions";
import {approveLeaveRequest as action164} from "@/app/(app)/people/absence/actions";
import {setLeaveAllowance as action165} from "@/app/(app)/people/absence/actions";
import {rejectLeaveRequest as action166} from "@/app/(app)/people/absence/actions";
import {createEmployee as action167} from "@/app/(app)/people/actions";
import {changeEmployeeStatus as action168} from "@/app/(app)/people/actions";
import {updateEmployeeProfile as action169} from "@/app/(app)/people/actions";
import {updateOwnEmployeeDetails as action170} from "@/app/(app)/people/actions";
import {addEmployeeDocument as action171} from "@/app/(app)/people/actions";
import {linkEmployeeToUser as action172} from "@/app/(app)/people/actions";
import {completeEmployeeTask as action173} from "@/app/(app)/people/actions";
import {addEmployeeTask as action174} from "@/app/(app)/people/actions";
import {updateEmployeeContact as action175} from "@/app/(app)/people/actions";
import {updateEmployeeTask as action176} from "@/app/(app)/people/actions";
import {scheduleAppraisal as action177} from "@/app/(app)/people/appraisals/actions";
import {completeAppraisal as action178} from "@/app/(app)/people/appraisals/actions";
import {getConductDesk as action179} from "@/app/(app)/people/conduct/actions";
import {getMyConduct as action180} from "@/app/(app)/people/conduct/actions";
import {getPlan as action181} from "@/app/(app)/people/conduct/actions";
import {getCase as action182} from "@/app/(app)/people/conduct/actions";
import {conductChoices as action183} from "@/app/(app)/people/conduct/actions";
import {savePlan as action184} from "@/app/(app)/people/conduct/actions";
import {addPlanReview as action185} from "@/app/(app)/people/conduct/actions";
import {commentOnPlan as action186} from "@/app/(app)/people/conduct/actions";
import {saveCase as action187} from "@/app/(app)/people/conduct/actions";
import {respondToCase as action188} from "@/app/(app)/people/conduct/actions";
import {addCaseEvent as action189} from "@/app/(app)/people/conduct/actions";
import {submitExpenseClaim as action190} from "@/app/(app)/people/expenses/actions";
import {approveExpenseClaim as action191} from "@/app/(app)/people/expenses/actions";
import {rejectExpenseClaim as action192} from "@/app/(app)/people/expenses/actions";
import {scheduleOneToOne as action193} from "@/app/(app)/people/one-to-ones/actions";
import {completeOneToOne as action194} from "@/app/(app)/people/one-to-ones/actions";
import {saveVacancy as action195} from "@/app/(app)/people/platform-actions";
import {saveApplication as action196} from "@/app/(app)/people/platform-actions";
import {saveTraining as action197} from "@/app/(app)/people/platform-actions";
import {saveHRDocument as action198} from "@/app/(app)/people/platform-actions";
import {listPolicies as action199} from "@/app/(app)/people/policies/actions";
import {publishPolicy as action200} from "@/app/(app)/people/policies/actions";
import {archivePolicy as action201} from "@/app/(app)/people/policies/actions";
import {openPolicy as action202} from "@/app/(app)/people/policies/actions";
import {createShift as action203} from "@/app/(app)/people/rotas/actions";
import {changeShiftStatus as action204} from "@/app/(app)/people/rotas/actions";
import {getMyHR as action205} from "@/app/(app)/people/self-service";
import {getMyTeam as action206} from "@/app/(app)/people/self-service";
import {getTeamEmployee as action207} from "@/app/(app)/people/self-service";
import {addPrivateNote as action208} from "@/app/(app)/people/self-service";
import {updateWorkingPattern as action209} from "@/app/(app)/people/self-service";
import {updateHrSettings as action210} from "@/app/(app)/people/settings/actions";
import {createAppraisalTemplate as action211} from "@/app/(app)/people/settings/actions";
import {toggleAppraisalTemplateActive as action212} from "@/app/(app)/people/settings/actions";
import {createOneToOneTemplate as action213} from "@/app/(app)/people/settings/actions";
import {toggleOneToOneTemplateActive as action214} from "@/app/(app)/people/settings/actions";
import {getTimesheetContext as action215} from "@/app/(app)/people/timesheets/actions";
import {saveTimesheet as action216} from "@/app/(app)/people/timesheets/actions";
import {reviewTimesheet as action217} from "@/app/(app)/people/timesheets/actions";
import {createPriceList as action218} from "@/app/(app)/pricing/actions";
import {savePriceEntry as action219} from "@/app/(app)/pricing/actions";
import {saveRule as action220} from "@/app/(app)/pricing/actions";
import {setRuleActive as action221} from "@/app/(app)/pricing/actions";
import {updatePriceBasis as action222} from "@/app/(app)/pricing/actions";
import {renamePriceList as action223} from "@/app/(app)/pricing/actions";
import {assignPriceListCustomers as action224} from "@/app/(app)/pricing/actions";
import {checkSalesPrice as action225} from "@/app/(app)/pricing/actions";
import {assignPriceList as action226} from "@/app/(app)/pricing/actions";
import {previewPriceCsv as action227} from "@/app/(app)/pricing/actions";
import {applyPriceCsv as action228} from "@/app/(app)/pricing/actions";
import {saveAgreement as action229} from "@/app/(app)/pricing/actions";
import {saveAgreementPrice as action230} from "@/app/(app)/pricing/actions";
import {removeAgreementPrice as action231} from "@/app/(app)/pricing/actions";
import {previewAgreementCsv as action232} from "@/app/(app)/pricing/actions";
import {applyAgreementCsv as action233} from "@/app/(app)/pricing/actions";
import {saveProduct as action234} from "@/app/(app)/products/actions";
import {saveProductRecord as action235} from "@/app/(app)/products/actions";
import {saveCategory as action236} from "@/app/(app)/products/actions";
import {retireCategory as action237} from "@/app/(app)/products/actions";
import {addStandardCategories as action238} from "@/app/(app)/products/actions";
import {savePack as action239} from "@/app/(app)/products/actions";
import {saveLinks as action240} from "@/app/(app)/products/actions";
import {saveMeasures as action241} from "@/app/(app)/products/actions";
import {saveProfile as action242} from "@/app/(app)/profile/actions";
import {loadAssignedWork as action243} from "@/app/(app)/profile/work";
import {createProject as action244} from "@/app/(app)/projects/actions";
import {changeProjectStatus as action245} from "@/app/(app)/projects/actions";
import {editProject as action246} from "@/app/(app)/projects/actions";
import {setProjectMember as action247} from "@/app/(app)/projects/actions";
import {archiveProject as action248} from "@/app/(app)/projects/actions";
import {createTask as action249} from "@/app/(app)/projects/actions";
import {changeTaskStatus as action250} from "@/app/(app)/projects/actions";
import {editTask as action251} from "@/app/(app)/projects/actions";
import {checklistItem as action252} from "@/app/(app)/projects/actions";
import {addDependency as action253} from "@/app/(app)/projects/actions";
import {createMeeting as action254} from "@/app/(app)/projects/actions";
import {createDocument as action255} from "@/app/(app)/projects/actions";
import {editDocument as action256} from "@/app/(app)/projects/actions";
import {addComment as action257} from "@/app/(app)/projects/actions";
import {createMilestone as action258} from "@/app/(app)/projects/actions";
import {publishUpdate as action259} from "@/app/(app)/projects/actions";
import {createDecision as action260} from "@/app/(app)/projects/actions";
import {decide as action261} from "@/app/(app)/projects/actions";
import {createRisk as action262} from "@/app/(app)/projects/actions";
import {closeRisk as action263} from "@/app/(app)/projects/actions";
import {requestApproval as action264} from "@/app/(app)/projects/actions";
import {respondApproval as action265} from "@/app/(app)/projects/actions";
import {submitRequest as action266} from "@/app/(app)/projects/actions";
import {triageRequest as action267} from "@/app/(app)/projects/actions";
import {logTime as action268} from "@/app/(app)/projects/actions";
import {planToday as action269} from "@/app/(app)/projects/actions";
import {updateInbox as action270} from "@/app/(app)/projects/actions";
import {saveView as action271} from "@/app/(app)/projects/actions";
import {createPortfolio as action272} from "@/app/(app)/projects/actions";
import {createBaseline as action273} from "@/app/(app)/projects/actions";
import {setBudget as action274} from "@/app/(app)/projects/actions";
import {linkWork as action275} from "@/app/(app)/projects/actions";
import {getProjectActivity as action276} from "@/app/(app)/projects/actions";
import {createAutomation as action277} from "@/app/(app)/projects/actions";
import {toggleAutomation as action278} from "@/app/(app)/projects/actions";
import {saveProjectTemplate as action279} from "@/app/(app)/projects/actions";
import {useProjectTemplate as action280} from "@/app/(app)/projects/actions";
import {startTimer as action281} from "@/app/(app)/projects/actions";
import {stopTimer as action282} from "@/app/(app)/projects/actions";
import {projectPreference as action283} from "@/app/(app)/projects/actions";
import {uploadProjectFile as action284} from "@/app/(app)/projects/actions";
import {readProjectFile as action285} from "@/app/(app)/projects/actions";
import {createProperty as action286} from "@/app/(app)/projects/actions";
import {setProperty as action287} from "@/app/(app)/projects/actions";
import {restoreDocument as action288} from "@/app/(app)/projects/actions";
import {createTaskFromDocument as action289} from "@/app/(app)/projects/actions";
import {discardTimer as action290} from "@/app/(app)/projects/actions";
import {completeMilestone as action291} from "@/app/(app)/projects/actions";
import {resolveComment as action292} from "@/app/(app)/projects/actions";
import {getProjectWorkload as action293} from "@/app/(app)/projects/actions";
import {rescheduleTask as action294} from "@/app/(app)/projects/actions";
import {newContractAction as action295} from "@/app/(app)/sales/contracts/actions";
import {resendContractAction as action296} from "@/app/(app)/sales/contracts/actions";
import {deleteContractAction as action297} from "@/app/(app)/sales/contracts/actions";
import {createOrderForm as action298} from "@/app/(app)/sales/orders/actions";
import {addLineForm as action299} from "@/app/(app)/sales/orders/actions";
import {removeLineForm as action300} from "@/app/(app)/sales/orders/actions";
import {confirmOrderForm as action301} from "@/app/(app)/sales/orders/actions";
import {updateOrderForm as action302} from "@/app/(app)/sales/orders/actions";
import {chooseOrderAddresses as action303} from "@/app/(app)/sales/orders/actions";
import {addHoldForm as action304} from "@/app/(app)/sales/orders/actions";
import {releaseHoldForm as action305} from "@/app/(app)/sales/orders/actions";
import {approveOrderForm as action306} from "@/app/(app)/sales/orders/actions";
import {cancelOrderForm as action307} from "@/app/(app)/sales/orders/actions";
import {saveOrderHashtagsForm as action308} from "@/app/(app)/sales/orders/actions";
import {restoreCancelledOrderForm as action309} from "@/app/(app)/sales/orders/actions";
import {returnOrderToQuoteForm as action310} from "@/app/(app)/sales/orders/actions";
import {scheduleOrderDelivery as action311} from "@/app/(app)/sales/orders/actions";
import {rejectOrderApproval as action312} from "@/app/(app)/sales/orders/actions";
import {deleteOrderForm as action313} from "@/app/(app)/sales/orders/actions";
import {createQuote as action314} from "@/app/(app)/sales/quotes/actions";
import {deleteQuoteForm as action315} from "@/app/(app)/sales/quotes/actions";
import {saveCreationPolicy as action316} from "@/app/(app)/sales/settings/actions";
import {saveSiteAction as action317} from "@/app/(app)/sales/sites/actions";
import {setDocumentSiteAction as action318} from "@/app/(app)/sales/sites/actions";
import {getSchedule as action319} from "@/app/(app)/scheduling/actions";
import {createBulkShifts as action320} from "@/app/(app)/scheduling/actions";
import {setScheduledShift as action321} from "@/app/(app)/scheduling/actions";
import {completeShiftTask as action322} from "@/app/(app)/scheduling/actions";
import {editScheduledShift as action323} from "@/app/(app)/scheduling/actions";
import {publishWeekShifts as action324} from "@/app/(app)/scheduling/actions";
import {saveHoursBudget as action325} from "@/app/(app)/scheduling/actions";
import {getTeamPlan as action326} from "@/app/(app)/scheduling/actions";
import {getPersonSchedule as action327} from "@/app/(app)/scheduling/actions";
import {saveWorkType as action328} from "@/app/(app)/scheduling/actions";
import {archiveWorkType as action329} from "@/app/(app)/scheduling/actions";
import {saveDemand as action330} from "@/app/(app)/scheduling/actions";
import {saveBusyRule as action331} from "@/app/(app)/scheduling/actions";
import {removeBusyRule as action332} from "@/app/(app)/scheduling/actions";
import {fillTeamMonth as action333} from "@/app/(app)/scheduling/actions";
import {replanCover as action334} from "@/app/(app)/scheduling/actions";
import {publishMonth as action335} from "@/app/(app)/scheduling/actions";
import {saveShift as action336} from "@/app/(app)/scheduling/actions";
import {getWorkforce as action337} from "@/app/(app)/scheduling/workforce/actions";
import {placeBreak as action338} from "@/app/(app)/scheduling/workforce/actions";
import {saveActivity as action339} from "@/app/(app)/scheduling/workforce/actions";
import {removeActivity as action340} from "@/app/(app)/scheduling/workforce/actions";
import {saveInterval as action341} from "@/app/(app)/scheduling/workforce/actions";
import {removeInterval as action342} from "@/app/(app)/scheduling/workforce/actions";
import {createOpening as action343} from "@/app/(app)/scheduling/workforce/actions";
import {requestOpening as action344} from "@/app/(app)/scheduling/workforce/actions";
import {decideOpening as action345} from "@/app/(app)/scheduling/workforce/actions";
import {cancelOpening as action346} from "@/app/(app)/scheduling/workforce/actions";
import {saveAvailability as action347} from "@/app/(app)/scheduling/workforce/actions";
import {removeAvailability as action348} from "@/app/(app)/scheduling/workforce/actions";
import {saveRole as action349} from "@/app/(app)/settings/actions";
import {saveMemberRoles as action350} from "@/app/(app)/settings/actions";
import {createUser as action351} from "@/app/(app)/settings/actions";
import {saveCompanyAccess as action352} from "@/app/(app)/settings/actions";
import {saveCompanyProfile as action353} from "@/app/(app)/settings/actions";
import {saveManagerPolicy as action354} from "@/app/(app)/settings/actions";
import {saveWorkspaceDetails as action355} from "@/app/(app)/settings/actions";
import {saveCompanyBrand as action356} from "@/app/(app)/settings/actions";
import {importCsv as action357} from "@/app/(app)/settings/imports/actions";
import {saveEmailAccount as action358} from "@/app/(app)/settings/it/actions";
import {verifyEmailAccount as action359} from "@/app/(app)/settings/it/actions";
import {sendTestEmail as action360} from "@/app/(app)/settings/it/actions";
import {makeDefaultAccount as action361} from "@/app/(app)/settings/it/actions";
import {setAccountActive as action362} from "@/app/(app)/settings/it/actions";
import {deleteEmailAccount as action363} from "@/app/(app)/settings/it/actions";
import {saveSocialAccount as action364} from "@/app/(app)/settings/it/actions";
import {deleteSocialAccount as action365} from "@/app/(app)/settings/it/actions";
import {checkSocialAccount as action366} from "@/app/(app)/settings/it/actions";
import {saveEmailTemplate as action367} from "@/app/(app)/settings/it/actions";
import {deleteEmailTemplate as action368} from "@/app/(app)/settings/it/actions";
import {checkInboxNow as action369} from "@/app/(app)/settings/it/actions";
import {saveDispatchDelivery as action370} from "@/app/(app)/settings/logistics/actions";
import {saveUserAccess as action371} from "@/app/(app)/settings/user-actions";
import {setUserStatus as action372} from "@/app/(app)/settings/user-actions";
import {revokeUserSessions as action373} from "@/app/(app)/settings/user-actions";
import {issuePasswordRecovery as action374} from "@/app/(app)/settings/user-actions";
import {createManagedUser as action375} from "@/app/(app)/settings/user-actions";
import {linkEmployeeProfile as action376} from "@/app/(app)/settings/user-actions";
import {createRole as action377} from "@/app/(app)/settings/user-actions";
import {saveManagementGroup as action378} from "@/app/(app)/settings/user-actions";
import {createWarehouse as action379} from "@/app/(app)/stock/actions";
import {adjustStock as action380} from "@/app/(app)/stock/actions";
import {savePlanningAction as action381} from "@/app/(app)/stock/actions";
import {makeFromForecastAction as action382} from "@/app/(app)/stock/actions";
import {transferStock as action383} from "@/app/(app)/stock/actions";
import {createSiteAction as action384} from "@/app/(app)/stock/actions";
import {createPlaceAction as action385} from "@/app/(app)/stock/actions";
import {assignSiteAction as action386} from "@/app/(app)/stock/actions";
import {addLocationAction as action387} from "@/app/(app)/stock/actions";
import {ensureLocationsAction as action388} from "@/app/(app)/stock/actions";
import {retireLocationAction as action389} from "@/app/(app)/stock/actions";
import {putOnLocationAction as action390} from "@/app/(app)/stock/actions";
import {moveLocatedAction as action391} from "@/app/(app)/stock/actions";
import {receiveMoveAction as action392} from "@/app/(app)/stock/actions";
import {create as action393} from "@/app/(app)/studio/actions";
import {save as action394} from "@/app/(app)/studio/actions";
import {validate as action395} from "@/app/(app)/studio/actions";
import {publish as action396} from "@/app/(app)/studio/actions";
import {activate as action397} from "@/app/(app)/studio/actions";
import {getCapacity as action398} from "@/app/(app)/teams/[teamId]/capacity/actions";
import {saveAllocation as action399} from "@/app/(app)/teams/[teamId]/capacity/actions";
import {updateWorkStatus as action400} from "@/app/(app)/teams/[teamId]/capacity/actions";
import {saveTemplate as action401} from "@/app/(app)/templates/actions";
import {archiveTemplate as action402} from "@/app/(app)/templates/actions";
import {generateTemplateDocument as action403} from "@/app/(app)/templates/actions";
import {delegateApprovals as action404} from "@/core/approvals/actions";
import {loginAction as action405} from "@/core/auth/actions";
import {logoutAction as action406} from "@/core/auth/actions";
import {logoutAdminAction as action407} from "@/core/auth/actions";
import {completePasswordRecovery as action408} from "@/core/auth/security-actions";
import {changeOwnPassword as action409} from "@/core/auth/security-actions";
import {signOutOtherSessions as action410} from "@/core/auth/security-actions";
import {createContract as action411} from "@/core/contracts/actions";
import {sendContract as action412} from "@/core/contracts/actions";
import {shareContractLink as action413} from "@/core/contracts/actions";
import {updateDraftContract as action414} from "@/core/contracts/actions";
import {revokeContract as action415} from "@/core/contracts/actions";
import {deleteContract as action416} from "@/core/contracts/actions";
import {signContract as action417} from "@/core/contracts/actions";
import {returnSignedContract as action418} from "@/core/contracts/actions";
import {reviewContractReturn as action419} from "@/core/contracts/actions";
import {declineContract as action420} from "@/core/contracts/actions";
import {loadPublicContract as action421} from "@/core/contracts/actions";
import {loadPublicContractFile as action422} from "@/core/contracts/actions";
import {checkForDuplicatesAction as action423} from "@/core/customers/actions";
import {createCustomerAction as action424} from "@/core/customers/actions";
import {createCustomer as action425} from "@/core/customers/commands";
import {updateCustomerStatus as action426} from "@/core/customers/commands";
import {archiveCustomer as action427} from "@/core/customers/commands";
import {unarchiveCustomer as action428} from "@/core/customers/commands";
import {deleteCustomer as action429} from "@/core/customers/commands";
import {createContact as action430} from "@/core/customers/commands";
import {updateContact as action431} from "@/core/customers/commands";
import {deleteContact as action432} from "@/core/customers/commands";
import {createAddress as action433} from "@/core/customers/commands";
import {updateCommercialSettings as action434} from "@/core/customers/commands";
import {updateCreditLimit as action435} from "@/core/customers/commands";
import {setCreditHold as action436} from "@/core/customers/commands";
import {setPaymentTerm as action437} from "@/core/customers/commands";
import {createTaxRegistration as action438} from "@/core/customers/commands";
import {markTaxRegistrationManuallyVerified as action439} from "@/core/customers/commands";
import {createBankAccount as action440} from "@/core/customers/commands";
import {revealBankAccount as action441} from "@/core/customers/commands";
import {createDirectDebitMandate as action442} from "@/core/customers/commands";
import {cancelDirectDebitMandate as action443} from "@/core/customers/commands";
import {createNote as action444} from "@/core/customers/commands";
import {saveCustomerHashtags as action445} from "@/core/customers/commands";
import {updateCustomerDetails as action446} from "@/core/customers/commands";
import {updateAddress as action447} from "@/core/customers/commands";
import {archiveAddress as action448} from "@/core/customers/commands";
import {saveOrderingPreferences as action449} from "@/core/customers/commercial-actions";
import {setCustomerParent as action450} from "@/core/customers/hierarchy-actions";
import {placeCustomer as action451} from "@/core/customers/hierarchy-actions";
import {moveCustomer as action452} from "@/core/customers/hierarchy-actions";
import {setContactReportsTo as action453} from "@/core/customers/hierarchy-actions";
import {saveCustomerTradingLink as action454} from "@/core/customers/trading-actions";
import {setInvoiceAccount as action455} from "@/core/customers/trading-actions";
import {archiveCustomerTradingLink as action456} from "@/core/customers/trading-actions";
import {requestSalesInvoice as action457} from "@/core/finance/actions";
import {createWork as action458} from "@/core/service-work/actions";
import {updateWork as action459} from "@/core/service-work/actions";
import {commentWork as action460} from "@/core/service-work/actions";
import {watchWork as action461} from "@/core/service-work/actions";
import {mergeWork as action462} from "@/core/service-work/actions";
import {requestWorkApproval as action463} from "@/core/service-work/actions";
import {decideWorkApproval as action464} from "@/core/service-work/actions";
import {saveDeskQueue as action465} from "@/core/service-work/actions";
import {changeDeskMember as action466} from "@/core/service-work/actions";
import {attachServiceFile as action467} from "@/core/service-work/file-actions";
import {saveKnowledge as action468} from "@/core/service-work/knowledge";
import {createWorkTeam as action469} from "@/core/teams/actions";
import {loadAuditBoard as action470} from "@/modules/audit/services/actions";
import {exportAuditReport as action471} from "@/modules/audit/services/actions";
import {loadEcho as action472} from "@/modules/audit/services/actions";
import {postEchoNote as action473} from "@/modules/audit/services/actions";
import {loadEchoInbox as action474} from "@/modules/audit/services/actions";
import {loadAuditAccess as action475} from "@/modules/audit/services/actions";
import {saveAuditOwnActivity as action476} from "@/modules/audit/services/actions";
import {saveAuditAreas as action477} from "@/modules/audit/services/actions";
import {saveAutomation as action478} from "@/modules/automations/services/actions";
import {setAutomationEnabled as action479} from "@/modules/automations/services/actions";
import {deleteAutomation as action480} from "@/modules/automations/services/actions";
import {testOnPastEvent as action481} from "@/modules/automations/services/actions";
import {runNow as action482} from "@/modules/automations/services/actions";
import {logActivity as action483} from "@/modules/crm/services/activities";
import {completeActivity as action484} from "@/modules/crm/services/activities";
import {acceptMarketingHandoff as action485} from "@/modules/crm/services/marketing-handoff";
import {createOpportunity as action486} from "@/modules/crm/services/opportunities";
import {moveOpportunityStage as action487} from "@/modules/crm/services/opportunities";
import {updateOpportunityValue as action488} from "@/modules/crm/services/opportunities";
import {updateOpportunityCloseDate as action489} from "@/modules/crm/services/opportunities";
import {setOpportunityForecastCategory as action490} from "@/modules/crm/services/opportunities";
import {setOpportunityNextAction as action491} from "@/modules/crm/services/opportunities";
import {winOpportunity as action492} from "@/modules/crm/services/opportunities";
import {loseOpportunity as action493} from "@/modules/crm/services/opportunities";
import {addStakeholder as action494} from "@/modules/crm/services/opportunities";
import {addMilestone as action495} from "@/modules/crm/services/opportunities";
import {toggleMilestone as action496} from "@/modules/crm/services/opportunities";
import {checkProspectDuplicatesAction as action497} from "@/modules/crm/services/prospects";
import {createProspect as action498} from "@/modules/crm/services/prospects";
import {assignProspect as action499} from "@/modules/crm/services/prospects";
import {setProspectLifecycleStage as action500} from "@/modules/crm/services/prospects";
import {convertProspect as action501} from "@/modules/crm/services/prospects";
import {createIndustry as action502} from "@/modules/crm/services/prospects";
import {saveProspectGrouping as action503} from "@/modules/crm/services/prospects";
import {createSalesProject as action504} from "@/modules/crm/services/sales-projects-commands";
import {createSalesProjectFormAction as action505} from "@/modules/crm/services/sales-projects-commands";
import {saveSalesProjectAction as action506} from "@/modules/crm/services/sales-projects-commands";
import {saveNextActionAction as action507} from "@/modules/crm/services/sales-projects-commands";
import {addProjectOrganisationAction as action508} from "@/modules/crm/services/sales-projects-commands";
import {removeProjectOrganisationAction as action509} from "@/modules/crm/services/sales-projects-commands";
import {makePrimaryOrganisationAction as action510} from "@/modules/crm/services/sales-projects-commands";
import {addProjectStakeholderAction as action511} from "@/modules/crm/services/sales-projects-commands";
import {removeProjectStakeholderAction as action512} from "@/modules/crm/services/sales-projects-commands";
import {setDocumentSalesProjectAction as action513} from "@/modules/crm/services/sales-projects-commands";
import {deleteSalesProjectAction as action514} from "@/modules/crm/services/sales-projects-commands";
import {saveSurvey as action515} from "@/modules/csat/services/actions";
import {createSurveyFromTemplate as action516} from "@/modules/csat/services/actions";
import {setSurveyActive as action517} from "@/modules/csat/services/actions";
import {deleteSurvey as action518} from "@/modules/csat/services/actions";
import {recordCsatScore as action519} from "@/modules/csat/services/actions";
import {recordCsatComment as action520} from "@/modules/csat/services/actions";
import {saveEngineeringRevision as action521} from "@/modules/engineering/services/commands";
import {transitionEngineeringRevision as action522} from "@/modules/engineering/services/commands";
import {uploadEngineeringDrawing as action523} from "@/modules/engineering/services/commands";
import {saveFieldJob as action524} from "@/modules/fieldservice/services/commands";
import {updateFieldJob as action525} from "@/modules/fieldservice/services/commands";
import {addFieldJobNote as action526} from "@/modules/fieldservice/services/commands";
import {importFinanceStatement as action527} from "@/modules/finance/services/banking";
import {reconcileFinanceStatement as action528} from "@/modules/finance/services/banking";
import {financeReconciliationForm as action529} from "@/modules/finance/services/banking";
import {getFinanceReconciliation as action530} from "@/modules/finance/services/banking";
import {importFinanceStatementForm as action531} from "@/modules/finance/services/banking";
import {getFinanceCollections as action532} from "@/modules/finance/services/collections";
import {recordFinanceCollection as action533} from "@/modules/finance/services/collections";
import {setupFinance as action534} from "@/modules/finance/services/commands";
import {createFinanceDocument as action535} from "@/modules/finance/services/commands";
import {submitFinanceDocument as action536} from "@/modules/finance/services/commands";
import {saveApprovalPolicy as action537} from "@/modules/finance/services/commands";
import {decideFinanceApproval as action538} from "@/modules/finance/services/commands";
import {createPurchaseOrder as action539} from "@/modules/finance/services/commands";
import {raiseServiceCredit as action540} from "@/modules/finance/services/commands";
import {postFinanceDocument as action541} from "@/modules/finance/services/commands";
import {recordGoodsReceipt as action542} from "@/modules/finance/services/commands";
import {onboardSupplier as action543} from "@/modules/finance/services/commands";
import {approveSupplier as action544} from "@/modules/finance/services/commands";
import {requestSupplierBankChange as action545} from "@/modules/finance/services/commands";
import {verifySupplierBank as action546} from "@/modules/finance/services/commands";
import {createFinanceBank as action547} from "@/modules/finance/services/commands";
import {importBankTransactions as action548} from "@/modules/finance/services/commands";
import {allocateBankTransaction as action549} from "@/modules/finance/services/commands";
import {createPaymentRun as action550} from "@/modules/finance/services/commands";
import {approvePaymentRun as action551} from "@/modules/finance/services/commands";
import {createManualJournal as action552} from "@/modules/finance/services/commands";
import {approveManualJournal as action553} from "@/modules/finance/services/commands";
import {reverseJournal as action554} from "@/modules/finance/services/commands";
import {setFinancePeriodState as action555} from "@/modules/finance/services/commands";
import {saveFinanceBudget as action556} from "@/modules/finance/services/commands";
import {saveFinanceAsset as action557} from "@/modules/finance/services/commands";
import {postAssetDepreciation as action558} from "@/modules/finance/services/commands";
import {completeCloseTask as action559} from "@/modules/finance/services/commands";
import {saveFinanceContract as action560} from "@/modules/finance/services/commands";
import {saveFinanceScenario as action561} from "@/modules/finance/services/commands";
import {receiptForm as action562} from "@/modules/finance/services/commands";
import {journalForm as action563} from "@/modules/finance/services/commands";
import {statementForm as action564} from "@/modules/finance/services/commands";
import {allocationForm as action565} from "@/modules/finance/services/commands";
import {paymentRunForm as action566} from "@/modules/finance/services/commands";
import {policyForm as action567} from "@/modules/finance/services/commands";
import {scenarioForm as action568} from "@/modules/finance/services/commands";
import {uploadFinanceAttachment as action569} from "@/modules/finance/services/commands";
import {generateSalesInvoice as action570} from "@/modules/finance/services/commands";
import {generateInvoiceAdjustment as action571} from "@/modules/finance/services/commands";
import {voidFinanceDraft as action572} from "@/modules/finance/services/commands";
import {getFinanceConfiguration as action573} from "@/modules/finance/services/configuration";
import {saveFinanceEntityDetails as action574} from "@/modules/finance/services/configuration";
import {saveFinanceAccount as action575} from "@/modules/finance/services/configuration";
import {saveFinanceDimension as action576} from "@/modules/finance/services/configuration";
import {createFinancePeriod as action577} from "@/modules/finance/services/configuration";
import {setFinancePeriodExceptions as action578} from "@/modules/finance/services/configuration";
import {requestFinancePeriodReopen as action579} from "@/modules/finance/services/configuration";
import {decideFinancePeriodReopen as action580} from "@/modules/finance/services/configuration";
import {getFinanceHome as action581} from "@/modules/finance/services/queries";
import {listFinanceDocuments as action582} from "@/modules/finance/services/queries";
import {getFinanceDocument as action583} from "@/modules/finance/services/queries";
import {getFinanceWorkspace as action584} from "@/modules/finance/services/queries";
import {financeChoices as action585} from "@/modules/finance/services/queries";
import {getBudgetPositions as action586} from "@/modules/finance/services/queries";
import {getInvoiceCashForecast as action587} from "@/modules/finance/services/queries";
import {getFinancialReport as action588} from "@/modules/finance/services/queries";
import {getFinanceCustomerContribution as action589} from "@/modules/finance/services/queries";
import {searchFinance as action590} from "@/modules/finance/services/queries";
import {getFinanceAttachment as action591} from "@/modules/finance/services/queries";
import {getSalesFinanceProjection as action592} from "@/modules/finance/services/queries";
import {getReceivingWarehouses as action593} from "@/modules/finance/services/queries";
import {getFinanceLedger as action594} from "@/modules/finance/services/reporting";
import {getFinanceJournalDetail as action595} from "@/modules/finance/services/reporting";
import {getFinanceSubledgerReconciliation as action596} from "@/modules/finance/services/reporting";
import {saveVehicle as action597} from "@/modules/fleet/services/commands";
import {addFleetLog as action598} from "@/modules/fleet/services/commands";
import {saveEquipment as action599} from "@/modules/maintenance/services/commands";
import {createMaintenanceWork as action600} from "@/modules/maintenance/services/commands";
import {updateMaintenanceWork as action601} from "@/modules/maintenance/services/commands";
import {recordMaintenancePart as action602} from "@/modules/maintenance/services/commands";
import {createProductionOrder as action603} from "@/modules/manufacturing/services/commands";
import {markOrderReady as action604} from "@/modules/manufacturing/services/commands";
import {releaseOrder as action605} from "@/modules/manufacturing/services/commands";
import {closeOrder as action606} from "@/modules/manufacturing/services/commands";
import {startWorkOrder as action607} from "@/modules/manufacturing/services/commands";
import {pauseWorkOrder as action608} from "@/modules/manufacturing/services/commands";
import {completeWorkOrder as action609} from "@/modules/manufacturing/services/commands";
import {listForecasts as action610} from "@/modules/manufacturing/services/forecast";
import {setForecast as action611} from "@/modules/manufacturing/services/forecast";
import {deleteForecast as action612} from "@/modules/manufacturing/services/forecast";
import {runMrp as action613} from "@/modules/manufacturing/services/mrp";
import {firmSuggestion as action614} from "@/modules/manufacturing/services/mrp";
import {dismissSuggestion as action615} from "@/modules/manufacturing/services/mrp";
import {latestPlan as action616} from "@/modules/manufacturing/services/mrp";
import {loadPlant as action617} from "@/modules/manufacturing/services/plant";
import {saveWorkCentre as action618} from "@/modules/manufacturing/services/plant";
import {saveMachine as action619} from "@/modules/manufacturing/services/plant";
import {retirePlantRecord as action620} from "@/modules/manufacturing/services/plant";
import {schedulePreview as action621} from "@/modules/manufacturing/services/scheduler";
import {rescheduleWorkOrder as action622} from "@/modules/manufacturing/services/scheduler";
import {setWorkOrderLock as action623} from "@/modules/manufacturing/services/scheduler";
import {listShifts as action624} from "@/modules/manufacturing/services/shifts";
import {saveShift as action625} from "@/modules/manufacturing/services/shifts";
import {deleteShift as action626} from "@/modules/manufacturing/services/shifts";
import {createCampaignAction as action627} from "@/modules/marketing/services/campaign-actions 2";
import {saveCampaignBriefAction as action628} from "@/modules/marketing/services/campaign-actions 2";
import {saveBudgetLineAction as action629} from "@/modules/marketing/services/campaign-actions 2";
import {deleteBudgetLineAction as action630} from "@/modules/marketing/services/campaign-actions 2";
import {saveActivityAction as action631} from "@/modules/marketing/services/campaign-actions 2";
import {setActivityStatusAction as action632} from "@/modules/marketing/services/campaign-actions 2";
import {deleteActivityAction as action633} from "@/modules/marketing/services/campaign-actions 2";
import {addPaidSpendAction as action634} from "@/modules/marketing/services/campaign-actions 2";
import {deletePaidSpendAction as action635} from "@/modules/marketing/services/campaign-actions 2";
import {createCampaignAction as action636} from "@/modules/marketing/services/campaign-actions";
import {saveCampaignBriefAction as action637} from "@/modules/marketing/services/campaign-actions";
import {saveBudgetLineAction as action638} from "@/modules/marketing/services/campaign-actions";
import {deleteBudgetLineAction as action639} from "@/modules/marketing/services/campaign-actions";
import {saveActivityAction as action640} from "@/modules/marketing/services/campaign-actions";
import {setActivityStatusAction as action641} from "@/modules/marketing/services/campaign-actions";
import {deleteActivityAction as action642} from "@/modules/marketing/services/campaign-actions";
import {addPaidSpendAction as action643} from "@/modules/marketing/services/campaign-actions";
import {deletePaidSpendAction as action644} from "@/modules/marketing/services/campaign-actions";
import {createCampaign as action645} from "@/modules/marketing/services/commands";
import {updateCampaign as action646} from "@/modules/marketing/services/commands";
import {createProfile as action647} from "@/modules/marketing/services/commands";
import {recordPermission as action648} from "@/modules/marketing/services/commands";
import {suppressProfile as action649} from "@/modules/marketing/services/commands";
import {createAudience as action650} from "@/modules/marketing/services/commands";
import {previewAudience as action651} from "@/modules/marketing/services/commands";
import {createContent as action652} from "@/modules/marketing/services/commands";
import {approveContent as action653} from "@/modules/marketing/services/commands";
import {createMessage as action654} from "@/modules/marketing/services/commands";
import {lockSend as action655} from "@/modules/marketing/services/commands";
import {cancelSend as action656} from "@/modules/marketing/services/commands";
import {ingestEvent as action657} from "@/modules/marketing/services/commands";
import {createJourney as action658} from "@/modules/marketing/services/commands";
import {publishJourney as action659} from "@/modules/marketing/services/commands";
import {reviseJourney as action660} from "@/modules/marketing/services/commands";
import {createProgram as action661} from "@/modules/marketing/services/commands";
import {createExperiment as action662} from "@/modules/marketing/services/commands";
import {leadFeedback as action663} from "@/modules/marketing/services/commands";
import {processJourneySteps as action664} from "@/modules/marketing/services/commands";
import {saveMarketingPlan as action665} from "@/modules/marketing/services/commands";
import {addPlanActivity as action666} from "@/modules/marketing/services/commands";
import {updatePlanActivity as action667} from "@/modules/marketing/services/commands";
import {addBudgetLine as action668} from "@/modules/marketing/services/commands";
import {submitBudgetToFinance as action669} from "@/modules/marketing/services/commands";
import {createJourneyMap as action670} from "@/modules/marketing/services/commands";
import {addJourneyStage as action671} from "@/modules/marketing/services/commands";
import {addJourneyTouch as action672} from "@/modules/marketing/services/commands";
import {saveSocialPost as action673} from "@/modules/marketing/services/social-actions";
import {deleteSocialPost as action674} from "@/modules/marketing/services/social-actions";
import {retrySocialPost as action675} from "@/modules/marketing/services/social-actions";
import {disconnectMicrosoftCalendar as action676} from "@/modules/meetings/services/calendar-actions";
import {chooseMicrosoftCalendar as action677} from "@/modules/meetings/services/calendar-actions";
import {sendMicrosoftMeeting as action678} from "@/modules/meetings/services/calendar-actions";
import {importMicrosoftMeetings as action679} from "@/modules/meetings/services/calendar-actions";
import {saveMeeting as action680} from "@/modules/meetings/services/commands";
import {meetingStatus as action681} from "@/modules/meetings/services/commands";
import {addMeetingEntry as action682} from "@/modules/meetings/services/commands";
import {completeMeetingAction as action683} from "@/modules/meetings/services/commands";
import {getApprovedExpenseSource as action684} from "@/modules/people/services/finance-expenses";
import {getPlanBuilder as action685} from "@/modules/plan/services/builder";
import {savePlanInput as action686} from "@/modules/plan/services/builder";
import {setPlanInputIncluded as action687} from "@/modules/plan/services/builder";
import {applyPlanInputs as action688} from "@/modules/plan/services/builder";
import {savePlanGrid as action689} from "@/modules/plan/services/builder";
import {removePlanMeasure as action690} from "@/modules/plan/services/builder";
import {createPlan as action691} from "@/modules/plan/services/commands";
import {saveCell as action692} from "@/modules/plan/services/commands";
import {addMeasure as action693} from "@/modules/plan/services/commands";
import {addAssumption as action694} from "@/modules/plan/services/commands";
import {addDriver as action695} from "@/modules/plan/services/commands";
import {addLink as action696} from "@/modules/plan/services/commands";
import {createScenario as action697} from "@/modules/plan/services/commands";
import {promoteScenario as action698} from "@/modules/plan/services/commands";
import {submitPlan as action699} from "@/modules/plan/services/commands";
import {approvePlan as action700} from "@/modules/plan/services/commands";
import {lockPlan as action701} from "@/modules/plan/services/commands";
import {addGoal as action702} from "@/modules/plan/services/commands";
import {addInitiative as action703} from "@/modules/plan/services/commands";
import {createProjectForInitiative as action704} from "@/modules/plan/services/commands";
import {addAction as action705} from "@/modules/plan/services/commands";
import {completeAction as action706} from "@/modules/plan/services/commands";
import {addRisk as action707} from "@/modules/plan/services/commands";
import {addDependency as action708} from "@/modules/plan/services/commands";
import {addDecision as action709} from "@/modules/plan/services/commands";
import {addComment as action710} from "@/modules/plan/services/commands";
import {addUpdate as action711} from "@/modules/plan/services/commands";
import {completeReview as action712} from "@/modules/plan/services/commands";
import {addReview as action713} from "@/modules/plan/services/commands";
import {distributeTargets as action714} from "@/modules/plan/services/commands";
import {importGrid as action715} from "@/modules/plan/services/commands";
import {sharePlan as action716} from "@/modules/plan/services/commands";
import {unsharePlan as action717} from "@/modules/plan/services/commands";
import {setPlanAudience as action718} from "@/modules/plan/services/commands";
import {addNote as action719} from "@/modules/plan/services/commands";
import {saveGoalProgress as action720} from "@/modules/plan/services/commands";
import {savePlanBrief as action721} from "@/modules/plan/services/commands";
import {listProductionPlans as action722} from "@/modules/planning/services/plans";
import {getPlanOptions as action723} from "@/modules/planning/services/plans";
import {getProductionPlan as action724} from "@/modules/planning/services/plans";
import {createProductionPlan as action725} from "@/modules/planning/services/plans";
import {addProductionPlanLine as action726} from "@/modules/planning/services/plans";
import {getAssignedPlanningWork as action727} from "@/modules/planning/services/plans";
import {getPlanningCoverage as action728} from "@/modules/planning/services/queries";
import {saveProductRecipe as action729} from "@/modules/products/services/make";
import {createSpecification as action730} from "@/modules/quality/services/commands";
import {setSpecificationStatus as action731} from "@/modules/quality/services/commands";
import {createControlPoint as action732} from "@/modules/quality/services/commands";
import {executeInspection as action733} from "@/modules/quality/services/commands";
import {releaseHold as action734} from "@/modules/quality/services/commands";
import {reportNcr as action735} from "@/modules/quality/services/commands";
import {updateNcrInvestigation as action736} from "@/modules/quality/services/commands";
import {addNcrAction as action737} from "@/modules/quality/services/commands";
import {updateNcrAction as action738} from "@/modules/quality/services/commands";
import {closeNcr as action739} from "@/modules/quality/services/commands";
import {reportNcr as action740} from "@/modules/quality/services/ncr-actions";
import {updateNcrInvestigation as action741} from "@/modules/quality/services/ncr-actions";
import {addNcrAction as action742} from "@/modules/quality/services/ncr-actions";
import {updateNcrAction as action743} from "@/modules/quality/services/ncr-actions";
import {closeNcr as action744} from "@/modules/quality/services/ncr-actions";
import {reopenNcr as action745} from "@/modules/quality/services/ncr-actions";
import {saveNcrAction as action746} from "@/modules/quality/services/ncr-actions";
import {saveSubstance as action747} from "@/modules/safety/services/assurance";
import {addSafetyDataSheet as action748} from "@/modules/safety/services/assurance";
import {saveCoshhAssessment as action749} from "@/modules/safety/services/assurance";
import {approveSubstance as action750} from "@/modules/safety/services/assurance";
import {saveCompetence as action751} from "@/modules/safety/services/assurance";
import {saveSafetyDocument as action752} from "@/modules/safety/services/assurance";
import {acknowledgeDocument as action753} from "@/modules/safety/services/assurance";
import {saveAudit as action754} from "@/modules/safety/services/assurance";
import {addAuditFinding as action755} from "@/modules/safety/services/assurance";
import {approveAudit as action756} from "@/modules/safety/services/assurance";
import {saveChange as action757} from "@/modules/safety/services/assurance";
import {advanceChange as action758} from "@/modules/safety/services/assurance";
import {linkSafetyRecord as action759} from "@/modules/safety/services/assurance";
import {saveSafetyProfile as action760} from "@/modules/safety/services/commands";
import {saveRiskMatrix as action761} from "@/modules/safety/services/commands";
import {createRisk as action762} from "@/modules/safety/services/commands";
import {addControl as action763} from "@/modules/safety/services/commands";
import {rateAssessment as action764} from "@/modules/safety/services/commands";
import {approveAssessment as action765} from "@/modules/safety/services/commands";
import {reviseAssessment as action766} from "@/modules/safety/services/commands";
import {requestRiskReview as action767} from "@/modules/safety/services/commands";
import {reportIncident as action768} from "@/modules/safety/services/commands";
import {saveImmediateControl as action769} from "@/modules/safety/services/commands";
import {openInvestigation as action770} from "@/modules/safety/services/commands";
import {addCause as action771} from "@/modules/safety/services/commands";
import {saveRootCause as action772} from "@/modules/safety/services/commands";
import {reviewRiddor as action773} from "@/modules/safety/services/commands";
import {createSafetyAction as action774} from "@/modules/safety/services/commands";
import {advanceAction as action775} from "@/modules/safety/services/commands";
import {verifyAction as action776} from "@/modules/safety/services/commands";
import {saveWorkplaceRecord as action777} from "@/modules/safety/services/commands";
import {createPermit as action778} from "@/modules/safety/services/control";
import {advancePermit as action779} from "@/modules/safety/services/control";
import {extendPermit as action780} from "@/modules/safety/services/control";
import {createIsolation as action781} from "@/modules/safety/services/control";
import {applyIsolationLock as action782} from "@/modules/safety/services/control";
import {verifyIsolation as action783} from "@/modules/safety/services/control";
import {clearIsolation as action784} from "@/modules/safety/services/control";
import {removeIsolationLock as action785} from "@/modules/safety/services/control";
import {placeSafetyHold as action786} from "@/modules/safety/services/control";
import {updateReturnToService as action787} from "@/modules/safety/services/control";
import {releaseSafetyHold as action788} from "@/modules/safety/services/control";
import {overrideSafetyHold as action789} from "@/modules/safety/services/control";
import {saveStatutoryCheck as action790} from "@/modules/safety/services/control";
import {completeInspection as action791} from "@/modules/safety/services/control";
import {createInspection as action792} from "@/modules/safety/services/control";
import {createSalesAddress as action793} from "@/modules/sales/services/address-actions";
import {createSalesCatalogueProduct as action794} from "@/modules/sales/services/catalogue-actions";
import {sendQuote as action795} from "@/modules/sales/services/commands";
import {changeQuoteStatus as action796} from "@/modules/sales/services/commands";
import {deleteQuote as action797} from "@/modules/sales/services/commands";
import {duplicateDocument as action798} from "@/modules/sales/services/commands";
import {saveQuoteTemplate as action799} from "@/modules/sales/services/commands";
import {createOrderFromQuote as action800} from "@/modules/sales/services/commands";
import {linkCommercialProject as action801} from "@/modules/sales/services/commercial";
import {openCallOffOrder as action802} from "@/modules/sales/services/commercial";
import {raiseCallOff as action803} from "@/modules/sales/services/commercial";
import {invoiceCallOffDelivery as action804} from "@/modules/sales/services/commercial";
import {deliverAndInvoiceCallOff as action805} from "@/modules/sales/services/commercial";
import {importSalescsv as action806} from "@/modules/sales/services/csv-import";
import {addDeliveryAddress as action807} from "@/modules/sales/services/delivery-address";
import {addInstaller as action808} from "@/modules/sales/services/delivery-address";
import {pricePartyId as action809} from "@/modules/sales/services/delivery-address";
import {linkOrderedFor as action810} from "@/modules/sales/services/delivery-address";
import {saveDocument as action811} from "@/modules/sales/services/documents";
import {saveInvoiceTemplate as action812} from "@/modules/sales/services/invoice-template-actions";
import {retireInvoiceTemplate as action813} from "@/modules/sales/services/invoice-template-actions";
import {attachCustomerInvoiceTemplate as action814} from "@/modules/sales/services/invoice-template-actions";
import {detachCustomerInvoiceTemplate as action815} from "@/modules/sales/services/invoice-template-actions";
import {createDraftOrder as action816} from "@/modules/sales/services/orders";
import {addOrderLine as action817} from "@/modules/sales/services/orders";
import {removeOrderLine as action818} from "@/modules/sales/services/orders";
import {updateDraftOrderFields as action819} from "@/modules/sales/services/orders";
import {confirmOrder as action820} from "@/modules/sales/services/orders";
import {decideApproval as action821} from "@/modules/sales/services/orders";
import {amendLineQuantity as action822} from "@/modules/sales/services/orders";
import {overrideLinePrice as action823} from "@/modules/sales/services/orders";
import {amendRequestedDate as action824} from "@/modules/sales/services/orders";
import {cancelOrder as action825} from "@/modules/sales/services/orders";
import {deleteOrder as action826} from "@/modules/sales/services/orders";
import {cancelLineRemaining as action827} from "@/modules/sales/services/orders";
import {addHold as action828} from "@/modules/sales/services/orders";
import {releaseHold as action829} from "@/modules/sales/services/orders";
import {redeemServiceRecovery as action830} from "@/modules/sales/services/recovery";
import {restoreCancelledOrder as action831} from "@/modules/sales/services/rewind";
import {returnOrderToQuote as action832} from "@/modules/sales/services/rewind";
import {saveOrderHashtags as action833} from "@/modules/sales/services/rewind";
import {saveSalesView as action834} from "@/modules/sales/services/saved-views";
import {archiveSalesView as action835} from "@/modules/sales/services/saved-views";
import {createCase as action836} from "@/modules/service/services/commands";
import {updateCase as action837} from "@/modules/service/services/commands";
import {assignCase as action838} from "@/modules/service/services/commands";
import {transitionCase as action839} from "@/modules/service/services/commands";
import {addCaseEntry as action840} from "@/modules/service/services/commands";
import {createDepartmentTicket as action841} from "@/modules/service/services/commands";
import {updateDepartmentTicket as action842} from "@/modules/service/services/commands";
import {createQueue as action843} from "@/modules/service/services/commands";
import {addQueueMember as action844} from "@/modules/service/services/commands";
import {linkCaseRecord as action845} from "@/modules/service/services/commands";
import {creditChoices as action846} from "@/modules/service/services/commands";
import {askFinanceForCredit as action847} from "@/modules/service/services/commands";
import {getCaseOwners as action848} from "@/modules/service/services/commands";
import {getDepartmentWork as action849} from "@/modules/service/services/commands";
import {savePurchaseContext as action850} from "@/modules/service/services/commands";
import {saveInvestigation as action851} from "@/modules/service/services/commands";
import {logCaseCall as action852} from "@/modules/service/services/commands";
import {createCaseRemedy as action853} from "@/modules/service/services/commands";
import {mergeCases as action854} from "@/modules/service/services/commands";
import {sendCaseEmail as action855} from "@/modules/service/services/communication";
import {invalidateCaseCsat as action856} from "@/modules/service/services/communication";
import {casePurchaseContext as action857} from "@/modules/service/services/context";
import {proposeRecovery as action858} from "@/modules/service/services/recovery";
import {decideRecovery as action859} from "@/modules/service/services/recovery";
import {saveServiceApprovalRoute as action860} from "@/modules/service/services/recovery";
import {getSopWorkspace as action861} from "@/modules/sop/services/workspace";
import {createSopCycle as action862} from "@/modules/sop/services/workspace";
import {configureSopCycle as action863} from "@/modules/sop/services/workspace";
import {generateSopForecast as action864} from "@/modules/sop/services/workspace";
import {approveSopVersion as action865} from "@/modules/sop/services/workspace";
import {updateSopWorkflow as action866} from "@/modules/sop/services/workspace";
import {publishSopVersion as action867} from "@/modules/sop/services/workspace";
import {createSopScenario as action868} from "@/modules/sop/services/workspace";
import {promoteSopScenario as action869} from "@/modules/sop/services/workspace";
import {overrideSopDemand as action870} from "@/modules/sop/services/workspace";
import {getLiveSopService as action871} from "@/modules/sop/services/workspace";
import {getSopComparison as action872} from "@/modules/sop/services/workspace";
import {getSopAccuracy as action873} from "@/modules/sop/services/workspace";
import {readAvailability as action874} from "@/modules/stock/services/availability";
import {readOrderChain as action875} from "@/modules/stock/services/availability";
import {inventoryExportRows as action876} from "@/modules/stock/services/export";
import {createTeam as action877} from "@/modules/teams/services/commands";
import {renameTeam as action878} from "@/modules/teams/services/commands";
import {addMember as action879} from "@/modules/teams/services/commands";
import {removeMember as action880} from "@/modules/teams/services/commands";
import {saveTask as action881} from "@/modules/teams/services/commands";
import {setTaskStatus as action882} from "@/modules/teams/services/commands";
import {removeTask as action883} from "@/modules/teams/services/commands";
import {saveCover as action884} from "@/modules/teams/services/commands";
import {removeCover as action885} from "@/modules/teams/services/commands";
import {saveHandover as action886} from "@/modules/teams/services/commands";
import {savePlace as action887} from "@/modules/teams/services/commands";
import {saveMoment as action888} from "@/modules/teams/services/commands";
import {removeMoment as action889} from "@/modules/teams/services/commands";
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
"src/app/(app)/apps/actions:toggleModuleAction":action33 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:postMessage":action34 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:searchChatPeople":action35 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:openChat":action36 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:openDirectChat":action37 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:searchChatRecords":action38 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:sendChat":action39 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:chatSnapshot":action40 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/contracts/actions:createDealContract":action41 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:updateValueFormAction":action42 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:updateCloseDateFormAction":action43 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:setNextActionFormAction":action44 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:setForecastCategoryFormAction":action45 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:winFormAction":action46 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:loseFormAction":action47 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:addStakeholderFormAction":action48 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:addMilestoneFormAction":action49 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:toggleMilestoneFormAction":action50 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:logOpportunityActivityFormAction":action51 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/pipeline/actions:addDealAction":action52 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:qualifyFormAction":action53 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:disqualifyFormAction":action54 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:nurtureFormAction":action55 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:logProspectActivityFormAction":action56 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:assignProspectFormAction":action57 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:assignProspectTaskFormAction":action58 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:convertProspectFormAction":action59 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/reports/actions:pinReportToDashboard":action60 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createContactFormAction":action61 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateContactFormAction":action62 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:deleteContactFormAction":action63 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createAddressFormAction":action64 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createTaxRegistrationFormAction":action65 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:markTaxVerifiedFormAction":action66 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createBankAccountFormAction":action67 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createDirectDebitFormAction":action68 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:cancelDirectDebitFormAction":action69 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateCreditLimitFormAction":action70 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:toggleCreditHoldFormAction":action71 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createNoteFormAction":action72 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateStatusFormAction":action73 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:archiveCustomerFormAction":action74 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:unarchiveCustomerFormAction":action75 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:deleteCustomerFormAction":action76 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:createKpi":action77 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:saveGoal":action78 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:updateKpi":action79 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:recordProgress":action80 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:closeGoal":action81 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:addPlanGoal":action82 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:closePlan":action83 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:commentOnPlan":action84 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:connectGoal":action85 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/scorecards/actions:getScorecards":action86 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/scorecards/actions:saveScorecard":action87 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/scorecards/actions:removeScorecard":action88 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:syncDemandAction":action89 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:restoreDeliveryAction":action90 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:releaseAction":action91 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:allocateAction":action92 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:directShipAction":action93 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:groupAction":action94 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:scanAction":action95 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:lotAction":action96 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:serialAction":action97 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shortAction":action98 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeWorkAction":action99 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:claimAction":action100 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shipFromPickAction":action101 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packageAction":action102 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:weightAction":action103 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:stageAction":action104 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:labelAction":action105 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:dispatchAction":action106 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:trackingAction":action107 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:deliverAction":action108 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadCreateAction":action109 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadScanAction":action110 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:departAction":action111 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:expectAction":action112 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveLineAction":action113 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:putAwayAction":action114 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeReceiptAction":action115 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferAction":action116 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferReceiveAction":action117 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:returnRequestAction":action118 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:authoriseReturnAction":action119 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveReturnAction":action120 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:inspectAction":action121 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:closeReturnAction":action122 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:assignEquipmentAction":action123 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packUnitAction":action124 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:saveHandlingTypeAction":action125 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:retireHandlingTypeAction":action126 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:removeHandlingTypeAction":action127 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:policyAction":action128 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:runMrpAction":action129 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:firmPlannedOrderAction":action130 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:dismissPlannedOrderAction":action131 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/forecast/actions:setForecastAction":action132 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/forecast/actions:deleteForecastAction":action133 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:runMrpForm":action134 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:firmPlannedOrderForm":action135 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:dismissPlannedOrderForm":action136 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/produce/actions:raiseProductionOrderAction":action137 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:previewMoveAction":action138 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:commitMoveAction":action139 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:toggleLockAction":action140 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:saveShiftAction":action141 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:deleteShiftAction":action142 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:startAction":action143 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:pauseAction":action144 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:completeAction":action145 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:loadNotices":action146 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotice":action147 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotices":action148 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:getPayrollPreparation":action149 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:createPayrollRun":action150 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:updatePayslipDeductions":action151 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:finalisePayrollRun":action152 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:refreshPayrollRun":action153 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:savePeriodAdjustment":action154 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:markPayrollRunPaid":action155 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:savePayrollSettings":action156 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP45":action157 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP60":action158 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/employees/actions:getPayEmployees":action159 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/employees/actions:savePayEmployee":action160 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:logAbsence":action161 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:requestLeave":action162 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:cancelOwnLeave":action163 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:approveLeaveRequest":action164 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:setLeaveAllowance":action165 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:rejectLeaveRequest":action166 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:createEmployee":action167 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:changeEmployeeStatus":action168 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeProfile":action169 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateOwnEmployeeDetails":action170 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeDocument":action171 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:linkEmployeeToUser":action172 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:completeEmployeeTask":action173 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeTask":action174 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeContact":action175 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeTask":action176 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:scheduleAppraisal":action177 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:completeAppraisal":action178 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getConductDesk":action179 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getMyConduct":action180 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getPlan":action181 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getCase":action182 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:conductChoices":action183 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:savePlan":action184 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addPlanReview":action185 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:commentOnPlan":action186 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:saveCase":action187 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:respondToCase":action188 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addCaseEvent":action189 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:submitExpenseClaim":action190 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:approveExpenseClaim":action191 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:rejectExpenseClaim":action192 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:scheduleOneToOne":action193 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:completeOneToOne":action194 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/platform-actions:saveVacancy":action195 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/platform-actions:saveApplication":action196 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/platform-actions:saveTraining":action197 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/platform-actions:saveHRDocument":action198 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:listPolicies":action199 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:publishPolicy":action200 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:archivePolicy":action201 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:openPolicy":action202 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:createShift":action203 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:changeShiftStatus":action204 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyHR":action205 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyTeam":action206 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getTeamEmployee":action207 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:addPrivateNote":action208 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:updateWorkingPattern":action209 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:updateHrSettings":action210 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createAppraisalTemplate":action211 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleAppraisalTemplateActive":action212 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createOneToOneTemplate":action213 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleOneToOneTemplateActive":action214 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:getTimesheetContext":action215 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:saveTimesheet":action216 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:reviewTimesheet":action217 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:createPriceList":action218 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:savePriceEntry":action219 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveRule":action220 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:setRuleActive":action221 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:updatePriceBasis":action222 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:renamePriceList":action223 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:assignPriceListCustomers":action224 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:checkSalesPrice":action225 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:assignPriceList":action226 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewPriceCsv":action227 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyPriceCsv":action228 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreement":action229 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreementPrice":action230 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:removeAgreementPrice":action231 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewAgreementCsv":action232 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyAgreementCsv":action233 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProduct":action234 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProductRecord":action235 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveCategory":action236 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:retireCategory":action237 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:addStandardCategories":action238 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:savePack":action239 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveLinks":action240 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveMeasures":action241 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/actions:saveProfile":action242 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/work:loadAssignedWork":action243 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProject":action244 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeProjectStatus":action245 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editProject":action246 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProjectMember":action247 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:archiveProject":action248 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTask":action249 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeTaskStatus":action250 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editTask":action251 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:checklistItem":action252 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addDependency":action253 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMeeting":action254 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDocument":action255 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editDocument":action256 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addComment":action257 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMilestone":action258 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:publishUpdate":action259 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDecision":action260 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:decide":action261 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createRisk":action262 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:closeRisk":action263 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:requestApproval":action264 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:respondApproval":action265 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:submitRequest":action266 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:triageRequest":action267 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:logTime":action268 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:planToday":action269 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:updateInbox":action270 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveView":action271 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createPortfolio":action272 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createBaseline":action273 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setBudget":action274 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:linkWork":action275 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectActivity":action276 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createAutomation":action277 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:toggleAutomation":action278 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveProjectTemplate":action279 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:useProjectTemplate":action280 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:startTimer":action281 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:stopTimer":action282 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:projectPreference":action283 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:uploadProjectFile":action284 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:readProjectFile":action285 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProperty":action286 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProperty":action287 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:restoreDocument":action288 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTaskFromDocument":action289 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:discardTimer":action290 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:completeMilestone":action291 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:resolveComment":action292 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectWorkload":action293 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:rescheduleTask":action294 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:newContractAction":action295 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:resendContractAction":action296 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:deleteContractAction":action297 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:createOrderForm":action298 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addLineForm":action299 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:removeLineForm":action300 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:confirmOrderForm":action301 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:updateOrderForm":action302 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:chooseOrderAddresses":action303 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addHoldForm":action304 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:releaseHoldForm":action305 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:approveOrderForm":action306 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:cancelOrderForm":action307 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:saveOrderHashtagsForm":action308 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:restoreCancelledOrderForm":action309 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:returnOrderToQuoteForm":action310 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:scheduleOrderDelivery":action311 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:rejectOrderApproval":action312 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:deleteOrderForm":action313 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:createQuote":action314 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:deleteQuoteForm":action315 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/settings/actions:saveCreationPolicy":action316 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/sites/actions:saveSiteAction":action317 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/sites/actions:setDocumentSiteAction":action318 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getSchedule":action319 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:createBulkShifts":action320 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:setScheduledShift":action321 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:completeShiftTask":action322 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:editScheduledShift":action323 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishWeekShifts":action324 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveHoursBudget":action325 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getTeamPlan":action326 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getPersonSchedule":action327 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveWorkType":action328 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:archiveWorkType":action329 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveDemand":action330 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveBusyRule":action331 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:removeBusyRule":action332 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:fillTeamMonth":action333 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:replanCover":action334 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishMonth":action335 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveShift":action336 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:getWorkforce":action337 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:placeBreak":action338 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:saveActivity":action339 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:removeActivity":action340 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:saveInterval":action341 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:removeInterval":action342 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:createOpening":action343 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:requestOpening":action344 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:decideOpening":action345 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:cancelOpening":action346 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:saveAvailability":action347 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/workforce/actions:removeAvailability":action348 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveRole":action349 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveMemberRoles":action350 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:createUser":action351 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyAccess":action352 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyProfile":action353 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveManagerPolicy":action354 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveWorkspaceDetails":action355 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyBrand":action356 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/imports/actions:importCsv":action357 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveEmailAccount":action358 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:verifyEmailAccount":action359 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:sendTestEmail":action360 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:makeDefaultAccount":action361 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:setAccountActive":action362 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteEmailAccount":action363 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveSocialAccount":action364 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteSocialAccount":action365 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:checkSocialAccount":action366 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveEmailTemplate":action367 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteEmailTemplate":action368 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:checkInboxNow":action369 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/logistics/actions:saveDispatchDelivery":action370 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveUserAccess":action371 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:setUserStatus":action372 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:revokeUserSessions":action373 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:issuePasswordRecovery":action374 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createManagedUser":action375 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:linkEmployeeProfile":action376 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createRole":action377 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveManagementGroup":action378 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createWarehouse":action379 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:adjustStock":action380 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:savePlanningAction":action381 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:makeFromForecastAction":action382 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:transferStock":action383 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createSiteAction":action384 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createPlaceAction":action385 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:assignSiteAction":action386 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:addLocationAction":action387 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:ensureLocationsAction":action388 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:retireLocationAction":action389 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:putOnLocationAction":action390 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:moveLocatedAction":action391 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:receiveMoveAction":action392 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/studio/actions:create":action393 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/studio/actions:save":action394 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/studio/actions:validate":action395 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/studio/actions:publish":action396 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/studio/actions:activate":action397 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/teams/[teamId]/capacity/actions:getCapacity":action398 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/teams/[teamId]/capacity/actions:saveAllocation":action399 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/teams/[teamId]/capacity/actions:updateWorkStatus":action400 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/templates/actions:saveTemplate":action401 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/templates/actions:archiveTemplate":action402 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/templates/actions:generateTemplateDocument":action403 as (...args:never[])=>Promise<unknown>,
"src/core/approvals/actions:delegateApprovals":action404 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:loginAction":action405 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:logoutAction":action406 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:logoutAdminAction":action407 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:completePasswordRecovery":action408 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:changeOwnPassword":action409 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:signOutOtherSessions":action410 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:createContract":action411 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:sendContract":action412 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:shareContractLink":action413 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:updateDraftContract":action414 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:revokeContract":action415 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:deleteContract":action416 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:signContract":action417 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:returnSignedContract":action418 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:reviewContractReturn":action419 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:declineContract":action420 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:loadPublicContract":action421 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:loadPublicContractFile":action422 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:checkForDuplicatesAction":action423 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:createCustomerAction":action424 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createCustomer":action425 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerStatus":action426 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:archiveCustomer":action427 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:unarchiveCustomer":action428 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteCustomer":action429 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createContact":action430 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateContact":action431 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteContact":action432 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createAddress":action433 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCommercialSettings":action434 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCreditLimit":action435 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setCreditHold":action436 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setPaymentTerm":action437 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createTaxRegistration":action438 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:markTaxRegistrationManuallyVerified":action439 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createBankAccount":action440 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:revealBankAccount":action441 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createDirectDebitMandate":action442 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:cancelDirectDebitMandate":action443 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createNote":action444 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:saveCustomerHashtags":action445 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerDetails":action446 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateAddress":action447 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:archiveAddress":action448 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commercial-actions:saveOrderingPreferences":action449 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setCustomerParent":action450 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:placeCustomer":action451 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:moveCustomer":action452 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setContactReportsTo":action453 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:saveCustomerTradingLink":action454 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:setInvoiceAccount":action455 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:archiveCustomerTradingLink":action456 as (...args:never[])=>Promise<unknown>,
"src/core/finance/actions:requestSalesInvoice":action457 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:createWork":action458 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:updateWork":action459 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:commentWork":action460 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:watchWork":action461 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:mergeWork":action462 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:requestWorkApproval":action463 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:decideWorkApproval":action464 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:saveDeskQueue":action465 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:changeDeskMember":action466 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/file-actions:attachServiceFile":action467 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/knowledge:saveKnowledge":action468 as (...args:never[])=>Promise<unknown>,
"src/core/teams/actions:createWorkTeam":action469 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditBoard":action470 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:exportAuditReport":action471 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEcho":action472 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:postEchoNote":action473 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEchoInbox":action474 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditAccess":action475 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditOwnActivity":action476 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditAreas":action477 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:saveAutomation":action478 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:setAutomationEnabled":action479 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:deleteAutomation":action480 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:testOnPastEvent":action481 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:runNow":action482 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:logActivity":action483 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:completeActivity":action484 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/marketing-handoff:acceptMarketingHandoff":action485 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:createOpportunity":action486 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:moveOpportunityStage":action487 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityValue":action488 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityCloseDate":action489 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityForecastCategory":action490 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityNextAction":action491 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:winOpportunity":action492 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:loseOpportunity":action493 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addStakeholder":action494 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addMilestone":action495 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:toggleMilestone":action496 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:checkProspectDuplicatesAction":action497 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createProspect":action498 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:assignProspect":action499 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:setProspectLifecycleStage":action500 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:convertProspect":action501 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createIndustry":action502 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:saveProspectGrouping":action503 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProject":action504 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProjectFormAction":action505 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:saveSalesProjectAction":action506 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:saveNextActionAction":action507 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addProjectOrganisationAction":action508 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:removeProjectOrganisationAction":action509 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:makePrimaryOrganisationAction":action510 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addProjectStakeholderAction":action511 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:removeProjectStakeholderAction":action512 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:setDocumentSalesProjectAction":action513 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:deleteSalesProjectAction":action514 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:saveSurvey":action515 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:createSurveyFromTemplate":action516 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:setSurveyActive":action517 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:deleteSurvey":action518 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatScore":action519 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatComment":action520 as (...args:never[])=>Promise<unknown>,
"src/modules/engineering/services/commands:saveEngineeringRevision":action521 as (...args:never[])=>Promise<unknown>,
"src/modules/engineering/services/commands:transitionEngineeringRevision":action522 as (...args:never[])=>Promise<unknown>,
"src/modules/engineering/services/commands:uploadEngineeringDrawing":action523 as (...args:never[])=>Promise<unknown>,
"src/modules/fieldservice/services/commands:saveFieldJob":action524 as (...args:never[])=>Promise<unknown>,
"src/modules/fieldservice/services/commands:updateFieldJob":action525 as (...args:never[])=>Promise<unknown>,
"src/modules/fieldservice/services/commands:addFieldJobNote":action526 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:importFinanceStatement":action527 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:reconcileFinanceStatement":action528 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:financeReconciliationForm":action529 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:getFinanceReconciliation":action530 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:importFinanceStatementForm":action531 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/collections:getFinanceCollections":action532 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/collections:recordFinanceCollection":action533 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setupFinance":action534 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceDocument":action535 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:submitFinanceDocument":action536 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveApprovalPolicy":action537 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:decideFinanceApproval":action538 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPurchaseOrder":action539 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:raiseServiceCredit":action540 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postFinanceDocument":action541 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:recordGoodsReceipt":action542 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:onboardSupplier":action543 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveSupplier":action544 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:requestSupplierBankChange":action545 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:verifySupplierBank":action546 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceBank":action547 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:importBankTransactions":action548 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocateBankTransaction":action549 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPaymentRun":action550 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approvePaymentRun":action551 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createManualJournal":action552 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveManualJournal":action553 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:reverseJournal":action554 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setFinancePeriodState":action555 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceBudget":action556 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceAsset":action557 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postAssetDepreciation":action558 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:completeCloseTask":action559 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceContract":action560 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceScenario":action561 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:receiptForm":action562 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:journalForm":action563 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:statementForm":action564 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocationForm":action565 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:paymentRunForm":action566 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:policyForm":action567 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:scenarioForm":action568 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:uploadFinanceAttachment":action569 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateSalesInvoice":action570 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateInvoiceAdjustment":action571 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:voidFinanceDraft":action572 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:getFinanceConfiguration":action573 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:saveFinanceEntityDetails":action574 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:saveFinanceAccount":action575 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:saveFinanceDimension":action576 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:createFinancePeriod":action577 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:setFinancePeriodExceptions":action578 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:requestFinancePeriodReopen":action579 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:decideFinancePeriodReopen":action580 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceHome":action581 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:listFinanceDocuments":action582 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceDocument":action583 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceWorkspace":action584 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:financeChoices":action585 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getBudgetPositions":action586 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getInvoiceCashForecast":action587 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinancialReport":action588 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceCustomerContribution":action589 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:searchFinance":action590 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceAttachment":action591 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getSalesFinanceProjection":action592 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getReceivingWarehouses":action593 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/reporting:getFinanceLedger":action594 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/reporting:getFinanceJournalDetail":action595 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/reporting:getFinanceSubledgerReconciliation":action596 as (...args:never[])=>Promise<unknown>,
"src/modules/fleet/services/commands:saveVehicle":action597 as (...args:never[])=>Promise<unknown>,
"src/modules/fleet/services/commands:addFleetLog":action598 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:saveEquipment":action599 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:createMaintenanceWork":action600 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:updateMaintenanceWork":action601 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:recordMaintenancePart":action602 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:createProductionOrder":action603 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:markOrderReady":action604 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:releaseOrder":action605 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:closeOrder":action606 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:startWorkOrder":action607 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:pauseWorkOrder":action608 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:completeWorkOrder":action609 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:listForecasts":action610 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:setForecast":action611 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:deleteForecast":action612 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:runMrp":action613 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:firmSuggestion":action614 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:dismissSuggestion":action615 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:latestPlan":action616 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:loadPlant":action617 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveWorkCentre":action618 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveMachine":action619 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:retirePlantRecord":action620 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:schedulePreview":action621 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:rescheduleWorkOrder":action622 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:setWorkOrderLock":action623 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:listShifts":action624 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:saveShift":action625 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:deleteShift":action626 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:createCampaignAction":action627 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveCampaignBriefAction":action628 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveBudgetLineAction":action629 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deleteBudgetLineAction":action630 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveActivityAction":action631 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:setActivityStatusAction":action632 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deleteActivityAction":action633 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:addPaidSpendAction":action634 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deletePaidSpendAction":action635 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:createCampaignAction":action636 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveCampaignBriefAction":action637 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveBudgetLineAction":action638 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deleteBudgetLineAction":action639 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveActivityAction":action640 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:setActivityStatusAction":action641 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deleteActivityAction":action642 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:addPaidSpendAction":action643 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deletePaidSpendAction":action644 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createCampaign":action645 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updateCampaign":action646 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProfile":action647 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:recordPermission":action648 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:suppressProfile":action649 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createAudience":action650 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:previewAudience":action651 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createContent":action652 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:approveContent":action653 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createMessage":action654 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:lockSend":action655 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:cancelSend":action656 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:ingestEvent":action657 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourney":action658 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:publishJourney":action659 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:reviseJourney":action660 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProgram":action661 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createExperiment":action662 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:leadFeedback":action663 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:processJourneySteps":action664 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:saveMarketingPlan":action665 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addPlanActivity":action666 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updatePlanActivity":action667 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addBudgetLine":action668 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:submitBudgetToFinance":action669 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourneyMap":action670 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyStage":action671 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyTouch":action672 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:saveSocialPost":action673 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:deleteSocialPost":action674 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:retrySocialPost":action675 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:disconnectMicrosoftCalendar":action676 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:chooseMicrosoftCalendar":action677 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:sendMicrosoftMeeting":action678 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:importMicrosoftMeetings":action679 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:saveMeeting":action680 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:meetingStatus":action681 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:addMeetingEntry":action682 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:completeMeetingAction":action683 as (...args:never[])=>Promise<unknown>,
"src/modules/people/services/finance-expenses:getApprovedExpenseSource":action684 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:getPlanBuilder":action685 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:savePlanInput":action686 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:setPlanInputIncluded":action687 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:applyPlanInputs":action688 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:savePlanGrid":action689 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:removePlanMeasure":action690 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createPlan":action691 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveCell":action692 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addMeasure":action693 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAssumption":action694 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDriver":action695 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addLink":action696 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createScenario":action697 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:promoteScenario":action698 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:submitPlan":action699 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:approvePlan":action700 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:lockPlan":action701 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addGoal":action702 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addInitiative":action703 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createProjectForInitiative":action704 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAction":action705 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeAction":action706 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addRisk":action707 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDependency":action708 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDecision":action709 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addComment":action710 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addUpdate":action711 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeReview":action712 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addReview":action713 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:distributeTargets":action714 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:importGrid":action715 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:sharePlan":action716 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:unsharePlan":action717 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:setPlanAudience":action718 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addNote":action719 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveGoalProgress":action720 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:savePlanBrief":action721 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:listProductionPlans":action722 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getPlanOptions":action723 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getProductionPlan":action724 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:createProductionPlan":action725 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:addProductionPlanLine":action726 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getAssignedPlanningWork":action727 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/queries:getPlanningCoverage":action728 as (...args:never[])=>Promise<unknown>,
"src/modules/products/services/make:saveProductRecipe":action729 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createSpecification":action730 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:setSpecificationStatus":action731 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createControlPoint":action732 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:executeInspection":action733 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:releaseHold":action734 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:reportNcr":action735 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrInvestigation":action736 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:addNcrAction":action737 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrAction":action738 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:closeNcr":action739 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:reportNcr":action740 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:updateNcrInvestigation":action741 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:addNcrAction":action742 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:updateNcrAction":action743 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:closeNcr":action744 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:reopenNcr":action745 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:saveNcrAction":action746 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSubstance":action747 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addSafetyDataSheet":action748 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCoshhAssessment":action749 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveSubstance":action750 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCompetence":action751 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSafetyDocument":action752 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:acknowledgeDocument":action753 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveAudit":action754 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addAuditFinding":action755 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveAudit":action756 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveChange":action757 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:advanceChange":action758 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:linkSafetyRecord":action759 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveSafetyProfile":action760 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRiskMatrix":action761 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createRisk":action762 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addControl":action763 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:rateAssessment":action764 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:approveAssessment":action765 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviseAssessment":action766 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:requestRiskReview":action767 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reportIncident":action768 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveImmediateControl":action769 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:openInvestigation":action770 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addCause":action771 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRootCause":action772 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviewRiddor":action773 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createSafetyAction":action774 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:advanceAction":action775 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:verifyAction":action776 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveWorkplaceRecord":action777 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createPermit":action778 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:advancePermit":action779 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:extendPermit":action780 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createIsolation":action781 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:applyIsolationLock":action782 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:verifyIsolation":action783 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:clearIsolation":action784 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:removeIsolationLock":action785 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:placeSafetyHold":action786 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:updateReturnToService":action787 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:releaseSafetyHold":action788 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:overrideSafetyHold":action789 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:saveStatutoryCheck":action790 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:completeInspection":action791 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createInspection":action792 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/address-actions:createSalesAddress":action793 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/catalogue-actions:createSalesCatalogueProduct":action794 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:sendQuote":action795 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:changeQuoteStatus":action796 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:deleteQuote":action797 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:duplicateDocument":action798 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:saveQuoteTemplate":action799 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:createOrderFromQuote":action800 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:linkCommercialProject":action801 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:openCallOffOrder":action802 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:raiseCallOff":action803 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:invoiceCallOffDelivery":action804 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:deliverAndInvoiceCallOff":action805 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/csv-import:importSalescsv":action806 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:addDeliveryAddress":action807 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:addInstaller":action808 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:pricePartyId":action809 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:linkOrderedFor":action810 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/documents:saveDocument":action811 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:saveInvoiceTemplate":action812 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:retireInvoiceTemplate":action813 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:attachCustomerInvoiceTemplate":action814 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:detachCustomerInvoiceTemplate":action815 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:createDraftOrder":action816 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addOrderLine":action817 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:removeOrderLine":action818 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:updateDraftOrderFields":action819 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:confirmOrder":action820 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:decideApproval":action821 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendLineQuantity":action822 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:overrideLinePrice":action823 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendRequestedDate":action824 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelOrder":action825 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:deleteOrder":action826 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelLineRemaining":action827 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addHold":action828 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:releaseHold":action829 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/recovery:redeemServiceRecovery":action830 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:restoreCancelledOrder":action831 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:returnOrderToQuote":action832 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:saveOrderHashtags":action833 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:saveSalesView":action834 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:archiveSalesView":action835 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createCase":action836 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateCase":action837 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:assignCase":action838 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:transitionCase":action839 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addCaseEntry":action840 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createDepartmentTicket":action841 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateDepartmentTicket":action842 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createQueue":action843 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addQueueMember":action844 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:linkCaseRecord":action845 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:creditChoices":action846 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:askFinanceForCredit":action847 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getCaseOwners":action848 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getDepartmentWork":action849 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:savePurchaseContext":action850 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:saveInvestigation":action851 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:logCaseCall":action852 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createCaseRemedy":action853 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:mergeCases":action854 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/communication:sendCaseEmail":action855 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/communication:invalidateCaseCsat":action856 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/context:casePurchaseContext":action857 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/recovery:proposeRecovery":action858 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/recovery:decideRecovery":action859 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/recovery:saveServiceApprovalRoute":action860 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getSopWorkspace":action861 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:createSopCycle":action862 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:configureSopCycle":action863 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:generateSopForecast":action864 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:approveSopVersion":action865 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:updateSopWorkflow":action866 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:publishSopVersion":action867 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:createSopScenario":action868 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:promoteSopScenario":action869 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:overrideSopDemand":action870 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getLiveSopService":action871 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getSopComparison":action872 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getSopAccuracy":action873 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readAvailability":action874 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readOrderChain":action875 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/export:inventoryExportRows":action876 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:createTeam":action877 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:renameTeam":action878 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:addMember":action879 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMember":action880 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveTask":action881 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:setTaskStatus":action882 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeTask":action883 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveCover":action884 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeCover":action885 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveHandover":action886 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:savePlace":action887 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveMoment":action888 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMoment":action889 as (...args:never[])=>Promise<unknown>
});
