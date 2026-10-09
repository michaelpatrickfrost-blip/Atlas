// Generated allowlist: public calls still enforce their own server capabilities.
import {loadEmailRecord as action0} from "@/app/(app)/_shared/record-email-actions";
import {sendRecordEmailAction as action1} from "@/app/(app)/_shared/record-email-actions";
import {sendRecordContractAction as action2} from "@/app/(app)/_shared/record-email-actions";
import {sendQuoteForApprovalAction as action3} from "@/app/(app)/_shared/record-email-actions";
import {loadLiveMetrics as action4} from "@/app/(app)/analytics/actions";
import {loadMetricSlice as action5} from "@/app/(app)/analytics/actions";
import {saveAnalyticsDashboard as action6} from "@/app/(app)/analytics/actions";
import {deleteAnalyticsDashboard as action7} from "@/app/(app)/analytics/actions";
import {loadLiveGoalMarkers as action8} from "@/app/(app)/analytics/actions";
import {toggleModuleAction as action9} from "@/app/(app)/apps/actions";
import {updateCompanyAccount as action10} from "@/app/(app)/atlas/actions";
import {saveCompanyEntitlements as action11} from "@/app/(app)/atlas/actions";
import {createCompanyAccount as action12} from "@/app/(app)/atlas/actions";
import {deleteTestCompany as action13} from "@/app/(app)/atlas/actions";
import {openCompanyWorkspace as action14} from "@/app/(app)/atlas/admin-actions";
import {saveAtlasUserProfile as action15} from "@/app/(app)/atlas/admin-actions";
import {saveAtlasUserAccess as action16} from "@/app/(app)/atlas/admin-actions";
import {revokeAtlasUserSessions as action17} from "@/app/(app)/atlas/admin-actions";
import {issueAtlasUserRecovery as action18} from "@/app/(app)/atlas/admin-actions";
import {createAtlasStaff as action19} from "@/app/(app)/atlas/admin-actions";
import {updateAtlasStaff as action20} from "@/app/(app)/atlas/admin-actions";
import {saveAtlasStaffProfile as action21} from "@/app/(app)/atlas/admin-actions";
import {issueAtlasStaffRecovery as action22} from "@/app/(app)/atlas/admin-actions";
import {archiveAtlasCompany as action23} from "@/app/(app)/atlas/admin-actions";
import {saveAtlasCompanyProfile as action24} from "@/app/(app)/atlas/admin-actions";
import {saveAtlasCompanyBrand as action25} from "@/app/(app)/atlas/admin-actions";
import {deleteSelectedTestCompanies as action26} from "@/app/(app)/atlas/cleanup/actions";
import {retryCompanyFileCleanup as action27} from "@/app/(app)/atlas/cleanup/actions";
import {attachConnection as action28} from "@/app/(app)/atlas/connections/actions";
import {requestGuardianSweep as action29} from "@/app/(app)/atlas/guardian/actions";
import {updateGuardianIssue as action30} from "@/app/(app)/atlas/guardian/actions";
import {importCompanySetup as action31} from "@/app/(app)/atlas/setup-actions";
import {createCompanyUser as action32} from "@/app/(app)/atlas/setup-actions";
import {setCompanyUserStatus as action33} from "@/app/(app)/atlas/setup-actions";
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
import {syncDemandAction as action86} from "@/app/(app)/logistics/actions";
import {restoreDeliveryAction as action87} from "@/app/(app)/logistics/actions";
import {releaseAction as action88} from "@/app/(app)/logistics/actions";
import {allocateAction as action89} from "@/app/(app)/logistics/actions";
import {directShipAction as action90} from "@/app/(app)/logistics/actions";
import {groupAction as action91} from "@/app/(app)/logistics/actions";
import {scanAction as action92} from "@/app/(app)/logistics/actions";
import {lotAction as action93} from "@/app/(app)/logistics/actions";
import {serialAction as action94} from "@/app/(app)/logistics/actions";
import {shortAction as action95} from "@/app/(app)/logistics/actions";
import {completeWorkAction as action96} from "@/app/(app)/logistics/actions";
import {claimAction as action97} from "@/app/(app)/logistics/actions";
import {shipFromPickAction as action98} from "@/app/(app)/logistics/actions";
import {packageAction as action99} from "@/app/(app)/logistics/actions";
import {weightAction as action100} from "@/app/(app)/logistics/actions";
import {stageAction as action101} from "@/app/(app)/logistics/actions";
import {labelAction as action102} from "@/app/(app)/logistics/actions";
import {dispatchAction as action103} from "@/app/(app)/logistics/actions";
import {trackingAction as action104} from "@/app/(app)/logistics/actions";
import {deliverAction as action105} from "@/app/(app)/logistics/actions";
import {loadCreateAction as action106} from "@/app/(app)/logistics/actions";
import {loadScanAction as action107} from "@/app/(app)/logistics/actions";
import {departAction as action108} from "@/app/(app)/logistics/actions";
import {expectAction as action109} from "@/app/(app)/logistics/actions";
import {receiveLineAction as action110} from "@/app/(app)/logistics/actions";
import {putAwayAction as action111} from "@/app/(app)/logistics/actions";
import {completeReceiptAction as action112} from "@/app/(app)/logistics/actions";
import {transferAction as action113} from "@/app/(app)/logistics/actions";
import {transferReceiveAction as action114} from "@/app/(app)/logistics/actions";
import {returnRequestAction as action115} from "@/app/(app)/logistics/actions";
import {authoriseReturnAction as action116} from "@/app/(app)/logistics/actions";
import {receiveReturnAction as action117} from "@/app/(app)/logistics/actions";
import {inspectAction as action118} from "@/app/(app)/logistics/actions";
import {closeReturnAction as action119} from "@/app/(app)/logistics/actions";
import {assignEquipmentAction as action120} from "@/app/(app)/logistics/actions";
import {packUnitAction as action121} from "@/app/(app)/logistics/actions";
import {saveHandlingTypeAction as action122} from "@/app/(app)/logistics/actions";
import {retireHandlingTypeAction as action123} from "@/app/(app)/logistics/actions";
import {removeHandlingTypeAction as action124} from "@/app/(app)/logistics/actions";
import {policyAction as action125} from "@/app/(app)/logistics/actions";
import {runMrpAction as action126} from "@/app/(app)/manufacturing/planning/actions";
import {firmPlannedOrderAction as action127} from "@/app/(app)/manufacturing/planning/actions";
import {dismissPlannedOrderAction as action128} from "@/app/(app)/manufacturing/planning/actions";
import {setForecastAction as action129} from "@/app/(app)/manufacturing/planning/forecast/actions";
import {deleteForecastAction as action130} from "@/app/(app)/manufacturing/planning/forecast/actions";
import {runMrpForm as action131} from "@/app/(app)/manufacturing/planning/form-actions";
import {firmPlannedOrderForm as action132} from "@/app/(app)/manufacturing/planning/form-actions";
import {dismissPlannedOrderForm as action133} from "@/app/(app)/manufacturing/planning/form-actions";
import {raiseProductionOrderAction as action134} from "@/app/(app)/manufacturing/produce/actions";
import {previewMoveAction as action135} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {commitMoveAction as action136} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {toggleLockAction as action137} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {saveShiftAction as action138} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {deleteShiftAction as action139} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {startAction as action140} from "@/app/(app)/manufacturing/shop-floor/actions";
import {pauseAction as action141} from "@/app/(app)/manufacturing/shop-floor/actions";
import {completeAction as action142} from "@/app/(app)/manufacturing/shop-floor/actions";
import {loadNotices as action143} from "@/app/(app)/notices/actions";
import {clearNotice as action144} from "@/app/(app)/notices/actions";
import {clearNotices as action145} from "@/app/(app)/notices/actions";
import {createPayrollRun as action146} from "@/app/(app)/payroll/actions";
import {updatePayslipDeductions as action147} from "@/app/(app)/payroll/actions";
import {finalisePayrollRun as action148} from "@/app/(app)/payroll/actions";
import {markPayrollRunPaid as action149} from "@/app/(app)/payroll/actions";
import {savePayrollSettings as action150} from "@/app/(app)/payroll/actions";
import {issueP45 as action151} from "@/app/(app)/payroll/actions";
import {issueP60 as action152} from "@/app/(app)/payroll/actions";
import {logAbsence as action153} from "@/app/(app)/people/absence/actions";
import {requestLeave as action154} from "@/app/(app)/people/absence/actions";
import {cancelOwnLeave as action155} from "@/app/(app)/people/absence/actions";
import {approveLeaveRequest as action156} from "@/app/(app)/people/absence/actions";
import {setLeaveAllowance as action157} from "@/app/(app)/people/absence/actions";
import {rejectLeaveRequest as action158} from "@/app/(app)/people/absence/actions";
import {createEmployee as action159} from "@/app/(app)/people/actions";
import {changeEmployeeStatus as action160} from "@/app/(app)/people/actions";
import {updateEmployeeProfile as action161} from "@/app/(app)/people/actions";
import {updateOwnEmployeeDetails as action162} from "@/app/(app)/people/actions";
import {addEmployeeDocument as action163} from "@/app/(app)/people/actions";
import {linkEmployeeToUser as action164} from "@/app/(app)/people/actions";
import {completeEmployeeTask as action165} from "@/app/(app)/people/actions";
import {addEmployeeTask as action166} from "@/app/(app)/people/actions";
import {updateEmployeeContact as action167} from "@/app/(app)/people/actions";
import {updateEmployeeTask as action168} from "@/app/(app)/people/actions";
import {scheduleAppraisal as action169} from "@/app/(app)/people/appraisals/actions";
import {completeAppraisal as action170} from "@/app/(app)/people/appraisals/actions";
import {getConductDesk as action171} from "@/app/(app)/people/conduct/actions";
import {getMyConduct as action172} from "@/app/(app)/people/conduct/actions";
import {getPlan as action173} from "@/app/(app)/people/conduct/actions";
import {getCase as action174} from "@/app/(app)/people/conduct/actions";
import {conductChoices as action175} from "@/app/(app)/people/conduct/actions";
import {savePlan as action176} from "@/app/(app)/people/conduct/actions";
import {addPlanReview as action177} from "@/app/(app)/people/conduct/actions";
import {commentOnPlan as action178} from "@/app/(app)/people/conduct/actions";
import {saveCase as action179} from "@/app/(app)/people/conduct/actions";
import {respondToCase as action180} from "@/app/(app)/people/conduct/actions";
import {addCaseEvent as action181} from "@/app/(app)/people/conduct/actions";
import {submitExpenseClaim as action182} from "@/app/(app)/people/expenses/actions";
import {approveExpenseClaim as action183} from "@/app/(app)/people/expenses/actions";
import {rejectExpenseClaim as action184} from "@/app/(app)/people/expenses/actions";
import {scheduleOneToOne as action185} from "@/app/(app)/people/one-to-ones/actions";
import {completeOneToOne as action186} from "@/app/(app)/people/one-to-ones/actions";
import {saveVacancy as action187} from "@/app/(app)/people/platform-actions";
import {saveApplication as action188} from "@/app/(app)/people/platform-actions";
import {saveTraining as action189} from "@/app/(app)/people/platform-actions";
import {saveHRDocument as action190} from "@/app/(app)/people/platform-actions";
import {listPolicies as action191} from "@/app/(app)/people/policies/actions";
import {publishPolicy as action192} from "@/app/(app)/people/policies/actions";
import {archivePolicy as action193} from "@/app/(app)/people/policies/actions";
import {openPolicy as action194} from "@/app/(app)/people/policies/actions";
import {createShift as action195} from "@/app/(app)/people/rotas/actions";
import {changeShiftStatus as action196} from "@/app/(app)/people/rotas/actions";
import {getMyHR as action197} from "@/app/(app)/people/self-service";
import {getMyTeam as action198} from "@/app/(app)/people/self-service";
import {getTeamEmployee as action199} from "@/app/(app)/people/self-service";
import {addPrivateNote as action200} from "@/app/(app)/people/self-service";
import {updateWorkingPattern as action201} from "@/app/(app)/people/self-service";
import {updateHrSettings as action202} from "@/app/(app)/people/settings/actions";
import {createAppraisalTemplate as action203} from "@/app/(app)/people/settings/actions";
import {toggleAppraisalTemplateActive as action204} from "@/app/(app)/people/settings/actions";
import {createOneToOneTemplate as action205} from "@/app/(app)/people/settings/actions";
import {toggleOneToOneTemplateActive as action206} from "@/app/(app)/people/settings/actions";
import {getTimesheetContext as action207} from "@/app/(app)/people/timesheets/actions";
import {saveTimesheet as action208} from "@/app/(app)/people/timesheets/actions";
import {reviewTimesheet as action209} from "@/app/(app)/people/timesheets/actions";
import {createPriceList as action210} from "@/app/(app)/pricing/actions";
import {savePriceEntry as action211} from "@/app/(app)/pricing/actions";
import {saveRule as action212} from "@/app/(app)/pricing/actions";
import {setRuleActive as action213} from "@/app/(app)/pricing/actions";
import {updatePriceBasis as action214} from "@/app/(app)/pricing/actions";
import {renamePriceList as action215} from "@/app/(app)/pricing/actions";
import {assignPriceListCustomers as action216} from "@/app/(app)/pricing/actions";
import {checkSalesPrice as action217} from "@/app/(app)/pricing/actions";
import {assignPriceList as action218} from "@/app/(app)/pricing/actions";
import {previewPriceCsv as action219} from "@/app/(app)/pricing/actions";
import {applyPriceCsv as action220} from "@/app/(app)/pricing/actions";
import {saveAgreement as action221} from "@/app/(app)/pricing/actions";
import {saveAgreementPrice as action222} from "@/app/(app)/pricing/actions";
import {removeAgreementPrice as action223} from "@/app/(app)/pricing/actions";
import {previewAgreementCsv as action224} from "@/app/(app)/pricing/actions";
import {applyAgreementCsv as action225} from "@/app/(app)/pricing/actions";
import {saveProduct as action226} from "@/app/(app)/products/actions";
import {saveProductRecord as action227} from "@/app/(app)/products/actions";
import {saveCategory as action228} from "@/app/(app)/products/actions";
import {retireCategory as action229} from "@/app/(app)/products/actions";
import {addStandardCategories as action230} from "@/app/(app)/products/actions";
import {savePack as action231} from "@/app/(app)/products/actions";
import {saveLinks as action232} from "@/app/(app)/products/actions";
import {saveMeasures as action233} from "@/app/(app)/products/actions";
import {saveProfile as action234} from "@/app/(app)/profile/actions";
import {loadAssignedWork as action235} from "@/app/(app)/profile/work";
import {createProject as action236} from "@/app/(app)/projects/actions";
import {changeProjectStatus as action237} from "@/app/(app)/projects/actions";
import {editProject as action238} from "@/app/(app)/projects/actions";
import {setProjectMember as action239} from "@/app/(app)/projects/actions";
import {archiveProject as action240} from "@/app/(app)/projects/actions";
import {createTask as action241} from "@/app/(app)/projects/actions";
import {changeTaskStatus as action242} from "@/app/(app)/projects/actions";
import {editTask as action243} from "@/app/(app)/projects/actions";
import {checklistItem as action244} from "@/app/(app)/projects/actions";
import {addDependency as action245} from "@/app/(app)/projects/actions";
import {createMeeting as action246} from "@/app/(app)/projects/actions";
import {createDocument as action247} from "@/app/(app)/projects/actions";
import {editDocument as action248} from "@/app/(app)/projects/actions";
import {addComment as action249} from "@/app/(app)/projects/actions";
import {createMilestone as action250} from "@/app/(app)/projects/actions";
import {publishUpdate as action251} from "@/app/(app)/projects/actions";
import {createDecision as action252} from "@/app/(app)/projects/actions";
import {decide as action253} from "@/app/(app)/projects/actions";
import {createRisk as action254} from "@/app/(app)/projects/actions";
import {closeRisk as action255} from "@/app/(app)/projects/actions";
import {requestApproval as action256} from "@/app/(app)/projects/actions";
import {respondApproval as action257} from "@/app/(app)/projects/actions";
import {submitRequest as action258} from "@/app/(app)/projects/actions";
import {triageRequest as action259} from "@/app/(app)/projects/actions";
import {logTime as action260} from "@/app/(app)/projects/actions";
import {planToday as action261} from "@/app/(app)/projects/actions";
import {updateInbox as action262} from "@/app/(app)/projects/actions";
import {saveView as action263} from "@/app/(app)/projects/actions";
import {createPortfolio as action264} from "@/app/(app)/projects/actions";
import {createBaseline as action265} from "@/app/(app)/projects/actions";
import {setBudget as action266} from "@/app/(app)/projects/actions";
import {linkWork as action267} from "@/app/(app)/projects/actions";
import {getProjectActivity as action268} from "@/app/(app)/projects/actions";
import {createAutomation as action269} from "@/app/(app)/projects/actions";
import {toggleAutomation as action270} from "@/app/(app)/projects/actions";
import {saveProjectTemplate as action271} from "@/app/(app)/projects/actions";
import {useProjectTemplate as action272} from "@/app/(app)/projects/actions";
import {startTimer as action273} from "@/app/(app)/projects/actions";
import {stopTimer as action274} from "@/app/(app)/projects/actions";
import {projectPreference as action275} from "@/app/(app)/projects/actions";
import {uploadProjectFile as action276} from "@/app/(app)/projects/actions";
import {readProjectFile as action277} from "@/app/(app)/projects/actions";
import {createProperty as action278} from "@/app/(app)/projects/actions";
import {setProperty as action279} from "@/app/(app)/projects/actions";
import {restoreDocument as action280} from "@/app/(app)/projects/actions";
import {createTaskFromDocument as action281} from "@/app/(app)/projects/actions";
import {discardTimer as action282} from "@/app/(app)/projects/actions";
import {completeMilestone as action283} from "@/app/(app)/projects/actions";
import {resolveComment as action284} from "@/app/(app)/projects/actions";
import {getProjectWorkload as action285} from "@/app/(app)/projects/actions";
import {rescheduleTask as action286} from "@/app/(app)/projects/actions";
import {newContractAction as action287} from "@/app/(app)/sales/contracts/actions";
import {resendContractAction as action288} from "@/app/(app)/sales/contracts/actions";
import {deleteContractAction as action289} from "@/app/(app)/sales/contracts/actions";
import {createOrderForm as action290} from "@/app/(app)/sales/orders/actions";
import {addLineForm as action291} from "@/app/(app)/sales/orders/actions";
import {removeLineForm as action292} from "@/app/(app)/sales/orders/actions";
import {confirmOrderForm as action293} from "@/app/(app)/sales/orders/actions";
import {updateOrderForm as action294} from "@/app/(app)/sales/orders/actions";
import {chooseOrderAddresses as action295} from "@/app/(app)/sales/orders/actions";
import {addHoldForm as action296} from "@/app/(app)/sales/orders/actions";
import {releaseHoldForm as action297} from "@/app/(app)/sales/orders/actions";
import {approveOrderForm as action298} from "@/app/(app)/sales/orders/actions";
import {cancelOrderForm as action299} from "@/app/(app)/sales/orders/actions";
import {saveOrderHashtagsForm as action300} from "@/app/(app)/sales/orders/actions";
import {restoreCancelledOrderForm as action301} from "@/app/(app)/sales/orders/actions";
import {returnOrderToQuoteForm as action302} from "@/app/(app)/sales/orders/actions";
import {scheduleOrderDelivery as action303} from "@/app/(app)/sales/orders/actions";
import {rejectOrderApproval as action304} from "@/app/(app)/sales/orders/actions";
import {deleteOrderForm as action305} from "@/app/(app)/sales/orders/actions";
import {createQuote as action306} from "@/app/(app)/sales/quotes/actions";
import {deleteQuoteForm as action307} from "@/app/(app)/sales/quotes/actions";
import {saveCreationPolicy as action308} from "@/app/(app)/sales/settings/actions";
import {saveSiteAction as action309} from "@/app/(app)/sales/sites/actions";
import {setDocumentSiteAction as action310} from "@/app/(app)/sales/sites/actions";
import {getSchedule as action311} from "@/app/(app)/scheduling/actions";
import {createBulkShifts as action312} from "@/app/(app)/scheduling/actions";
import {setScheduledShift as action313} from "@/app/(app)/scheduling/actions";
import {completeShiftTask as action314} from "@/app/(app)/scheduling/actions";
import {editScheduledShift as action315} from "@/app/(app)/scheduling/actions";
import {publishWeekShifts as action316} from "@/app/(app)/scheduling/actions";
import {saveHoursBudget as action317} from "@/app/(app)/scheduling/actions";
import {getTeamPlan as action318} from "@/app/(app)/scheduling/actions";
import {getPersonSchedule as action319} from "@/app/(app)/scheduling/actions";
import {saveWorkType as action320} from "@/app/(app)/scheduling/actions";
import {archiveWorkType as action321} from "@/app/(app)/scheduling/actions";
import {saveDemand as action322} from "@/app/(app)/scheduling/actions";
import {saveBusyRule as action323} from "@/app/(app)/scheduling/actions";
import {removeBusyRule as action324} from "@/app/(app)/scheduling/actions";
import {fillTeamMonth as action325} from "@/app/(app)/scheduling/actions";
import {replanCover as action326} from "@/app/(app)/scheduling/actions";
import {publishMonth as action327} from "@/app/(app)/scheduling/actions";
import {saveShift as action328} from "@/app/(app)/scheduling/actions";
import {saveRole as action329} from "@/app/(app)/settings/actions";
import {saveMemberRoles as action330} from "@/app/(app)/settings/actions";
import {createUser as action331} from "@/app/(app)/settings/actions";
import {saveCompanyAccess as action332} from "@/app/(app)/settings/actions";
import {saveCompanyProfile as action333} from "@/app/(app)/settings/actions";
import {saveManagerPolicy as action334} from "@/app/(app)/settings/actions";
import {saveWorkspaceDetails as action335} from "@/app/(app)/settings/actions";
import {saveCompanyBrand as action336} from "@/app/(app)/settings/actions";
import {importCsv as action337} from "@/app/(app)/settings/imports/actions";
import {saveEmailAccount as action338} from "@/app/(app)/settings/it/actions";
import {verifyEmailAccount as action339} from "@/app/(app)/settings/it/actions";
import {sendTestEmail as action340} from "@/app/(app)/settings/it/actions";
import {makeDefaultAccount as action341} from "@/app/(app)/settings/it/actions";
import {setAccountActive as action342} from "@/app/(app)/settings/it/actions";
import {deleteEmailAccount as action343} from "@/app/(app)/settings/it/actions";
import {saveSocialAccount as action344} from "@/app/(app)/settings/it/actions";
import {deleteSocialAccount as action345} from "@/app/(app)/settings/it/actions";
import {checkSocialAccount as action346} from "@/app/(app)/settings/it/actions";
import {saveEmailTemplate as action347} from "@/app/(app)/settings/it/actions";
import {deleteEmailTemplate as action348} from "@/app/(app)/settings/it/actions";
import {checkInboxNow as action349} from "@/app/(app)/settings/it/actions";
import {saveDispatchDelivery as action350} from "@/app/(app)/settings/logistics/actions";
import {saveUserAccess as action351} from "@/app/(app)/settings/user-actions";
import {setUserStatus as action352} from "@/app/(app)/settings/user-actions";
import {revokeUserSessions as action353} from "@/app/(app)/settings/user-actions";
import {issuePasswordRecovery as action354} from "@/app/(app)/settings/user-actions";
import {createManagedUser as action355} from "@/app/(app)/settings/user-actions";
import {linkEmployeeProfile as action356} from "@/app/(app)/settings/user-actions";
import {createRole as action357} from "@/app/(app)/settings/user-actions";
import {saveManagementGroup as action358} from "@/app/(app)/settings/user-actions";
import {createWarehouse as action359} from "@/app/(app)/stock/actions";
import {adjustStock as action360} from "@/app/(app)/stock/actions";
import {savePlanningAction as action361} from "@/app/(app)/stock/actions";
import {makeFromForecastAction as action362} from "@/app/(app)/stock/actions";
import {transferStock as action363} from "@/app/(app)/stock/actions";
import {createSiteAction as action364} from "@/app/(app)/stock/actions";
import {createPlaceAction as action365} from "@/app/(app)/stock/actions";
import {assignSiteAction as action366} from "@/app/(app)/stock/actions";
import {addLocationAction as action367} from "@/app/(app)/stock/actions";
import {ensureLocationsAction as action368} from "@/app/(app)/stock/actions";
import {retireLocationAction as action369} from "@/app/(app)/stock/actions";
import {putOnLocationAction as action370} from "@/app/(app)/stock/actions";
import {moveLocatedAction as action371} from "@/app/(app)/stock/actions";
import {receiveMoveAction as action372} from "@/app/(app)/stock/actions";
import {saveTemplate as action373} from "@/app/(app)/templates/actions";
import {archiveTemplate as action374} from "@/app/(app)/templates/actions";
import {generateTemplateDocument as action375} from "@/app/(app)/templates/actions";
import {delegateApprovals as action376} from "@/core/approvals/actions";
import {loginAction as action377} from "@/core/auth/actions";
import {logoutAction as action378} from "@/core/auth/actions";
import {completePasswordRecovery as action379} from "@/core/auth/security-actions";
import {changeOwnPassword as action380} from "@/core/auth/security-actions";
import {signOutOtherSessions as action381} from "@/core/auth/security-actions";
import {createContract as action382} from "@/core/contracts/actions";
import {sendContract as action383} from "@/core/contracts/actions";
import {shareContractLink as action384} from "@/core/contracts/actions";
import {updateDraftContract as action385} from "@/core/contracts/actions";
import {revokeContract as action386} from "@/core/contracts/actions";
import {deleteContract as action387} from "@/core/contracts/actions";
import {signContract as action388} from "@/core/contracts/actions";
import {returnSignedContract as action389} from "@/core/contracts/actions";
import {reviewContractReturn as action390} from "@/core/contracts/actions";
import {declineContract as action391} from "@/core/contracts/actions";
import {loadPublicContract as action392} from "@/core/contracts/actions";
import {loadPublicContractFile as action393} from "@/core/contracts/actions";
import {checkForDuplicatesAction as action394} from "@/core/customers/actions";
import {createCustomerAction as action395} from "@/core/customers/actions";
import {createCustomer as action396} from "@/core/customers/commands";
import {updateCustomerStatus as action397} from "@/core/customers/commands";
import {archiveCustomer as action398} from "@/core/customers/commands";
import {unarchiveCustomer as action399} from "@/core/customers/commands";
import {deleteCustomer as action400} from "@/core/customers/commands";
import {createContact as action401} from "@/core/customers/commands";
import {updateContact as action402} from "@/core/customers/commands";
import {deleteContact as action403} from "@/core/customers/commands";
import {createAddress as action404} from "@/core/customers/commands";
import {updateCommercialSettings as action405} from "@/core/customers/commands";
import {updateCreditLimit as action406} from "@/core/customers/commands";
import {setCreditHold as action407} from "@/core/customers/commands";
import {setPaymentTerm as action408} from "@/core/customers/commands";
import {createTaxRegistration as action409} from "@/core/customers/commands";
import {markTaxRegistrationManuallyVerified as action410} from "@/core/customers/commands";
import {createBankAccount as action411} from "@/core/customers/commands";
import {revealBankAccount as action412} from "@/core/customers/commands";
import {createDirectDebitMandate as action413} from "@/core/customers/commands";
import {cancelDirectDebitMandate as action414} from "@/core/customers/commands";
import {createNote as action415} from "@/core/customers/commands";
import {saveCustomerHashtags as action416} from "@/core/customers/commands";
import {updateCustomerDetails as action417} from "@/core/customers/commands";
import {updateAddress as action418} from "@/core/customers/commands";
import {archiveAddress as action419} from "@/core/customers/commands";
import {saveOrderingPreferences as action420} from "@/core/customers/commercial-actions";
import {setCustomerParent as action421} from "@/core/customers/hierarchy-actions";
import {placeCustomer as action422} from "@/core/customers/hierarchy-actions";
import {moveCustomer as action423} from "@/core/customers/hierarchy-actions";
import {setContactReportsTo as action424} from "@/core/customers/hierarchy-actions";
import {saveCustomerTradingLink as action425} from "@/core/customers/trading-actions";
import {setInvoiceAccount as action426} from "@/core/customers/trading-actions";
import {archiveCustomerTradingLink as action427} from "@/core/customers/trading-actions";
import {requestSalesInvoice as action428} from "@/core/finance/actions";
import {createWork as action429} from "@/core/service-work/actions";
import {updateWork as action430} from "@/core/service-work/actions";
import {commentWork as action431} from "@/core/service-work/actions";
import {watchWork as action432} from "@/core/service-work/actions";
import {mergeWork as action433} from "@/core/service-work/actions";
import {requestWorkApproval as action434} from "@/core/service-work/actions";
import {decideWorkApproval as action435} from "@/core/service-work/actions";
import {saveDeskQueue as action436} from "@/core/service-work/actions";
import {changeDeskMember as action437} from "@/core/service-work/actions";
import {attachServiceFile as action438} from "@/core/service-work/file-actions";
import {saveKnowledge as action439} from "@/core/service-work/knowledge";
import {createWorkTeam as action440} from "@/core/teams/actions";
import {loadAuditBoard as action441} from "@/modules/audit/services/actions";
import {exportAuditReport as action442} from "@/modules/audit/services/actions";
import {loadEcho as action443} from "@/modules/audit/services/actions";
import {postEchoNote as action444} from "@/modules/audit/services/actions";
import {loadEchoInbox as action445} from "@/modules/audit/services/actions";
import {loadAuditAccess as action446} from "@/modules/audit/services/actions";
import {saveAuditOwnActivity as action447} from "@/modules/audit/services/actions";
import {saveAuditAreas as action448} from "@/modules/audit/services/actions";
import {saveAutomation as action449} from "@/modules/automations/services/actions";
import {setAutomationEnabled as action450} from "@/modules/automations/services/actions";
import {deleteAutomation as action451} from "@/modules/automations/services/actions";
import {testOnPastEvent as action452} from "@/modules/automations/services/actions";
import {runNow as action453} from "@/modules/automations/services/actions";
import {logActivity as action454} from "@/modules/crm/services/activities";
import {completeActivity as action455} from "@/modules/crm/services/activities";
import {acceptMarketingHandoff as action456} from "@/modules/crm/services/marketing-handoff";
import {createOpportunity as action457} from "@/modules/crm/services/opportunities";
import {moveOpportunityStage as action458} from "@/modules/crm/services/opportunities";
import {updateOpportunityValue as action459} from "@/modules/crm/services/opportunities";
import {updateOpportunityCloseDate as action460} from "@/modules/crm/services/opportunities";
import {setOpportunityForecastCategory as action461} from "@/modules/crm/services/opportunities";
import {setOpportunityNextAction as action462} from "@/modules/crm/services/opportunities";
import {winOpportunity as action463} from "@/modules/crm/services/opportunities";
import {loseOpportunity as action464} from "@/modules/crm/services/opportunities";
import {addStakeholder as action465} from "@/modules/crm/services/opportunities";
import {addMilestone as action466} from "@/modules/crm/services/opportunities";
import {toggleMilestone as action467} from "@/modules/crm/services/opportunities";
import {checkProspectDuplicatesAction as action468} from "@/modules/crm/services/prospects";
import {createProspect as action469} from "@/modules/crm/services/prospects";
import {assignProspect as action470} from "@/modules/crm/services/prospects";
import {setProspectLifecycleStage as action471} from "@/modules/crm/services/prospects";
import {convertProspect as action472} from "@/modules/crm/services/prospects";
import {createIndustry as action473} from "@/modules/crm/services/prospects";
import {saveProspectGrouping as action474} from "@/modules/crm/services/prospects";
import {createSalesProject as action475} from "@/modules/crm/services/sales-projects-commands";
import {createSalesProjectFormAction as action476} from "@/modules/crm/services/sales-projects-commands";
import {saveSalesProjectAction as action477} from "@/modules/crm/services/sales-projects-commands";
import {saveNextActionAction as action478} from "@/modules/crm/services/sales-projects-commands";
import {addProjectOrganisationAction as action479} from "@/modules/crm/services/sales-projects-commands";
import {removeProjectOrganisationAction as action480} from "@/modules/crm/services/sales-projects-commands";
import {makePrimaryOrganisationAction as action481} from "@/modules/crm/services/sales-projects-commands";
import {addProjectStakeholderAction as action482} from "@/modules/crm/services/sales-projects-commands";
import {removeProjectStakeholderAction as action483} from "@/modules/crm/services/sales-projects-commands";
import {setDocumentSalesProjectAction as action484} from "@/modules/crm/services/sales-projects-commands";
import {deleteSalesProjectAction as action485} from "@/modules/crm/services/sales-projects-commands";
import {saveSurvey as action486} from "@/modules/csat/services/actions";
import {createSurveyFromTemplate as action487} from "@/modules/csat/services/actions";
import {setSurveyActive as action488} from "@/modules/csat/services/actions";
import {deleteSurvey as action489} from "@/modules/csat/services/actions";
import {recordCsatScore as action490} from "@/modules/csat/services/actions";
import {recordCsatComment as action491} from "@/modules/csat/services/actions";
import {saveEngineeringRevision as action492} from "@/modules/engineering/services/commands";
import {transitionEngineeringRevision as action493} from "@/modules/engineering/services/commands";
import {uploadEngineeringDrawing as action494} from "@/modules/engineering/services/commands";
import {saveFieldJob as action495} from "@/modules/fieldservice/services/commands";
import {updateFieldJob as action496} from "@/modules/fieldservice/services/commands";
import {addFieldJobNote as action497} from "@/modules/fieldservice/services/commands";
import {importFinanceStatement as action498} from "@/modules/finance/services/banking";
import {reconcileFinanceStatement as action499} from "@/modules/finance/services/banking";
import {financeReconciliationForm as action500} from "@/modules/finance/services/banking";
import {getFinanceReconciliation as action501} from "@/modules/finance/services/banking";
import {importFinanceStatementForm as action502} from "@/modules/finance/services/banking";
import {getFinanceCollections as action503} from "@/modules/finance/services/collections";
import {recordFinanceCollection as action504} from "@/modules/finance/services/collections";
import {setupFinance as action505} from "@/modules/finance/services/commands";
import {createFinanceDocument as action506} from "@/modules/finance/services/commands";
import {submitFinanceDocument as action507} from "@/modules/finance/services/commands";
import {saveApprovalPolicy as action508} from "@/modules/finance/services/commands";
import {decideFinanceApproval as action509} from "@/modules/finance/services/commands";
import {createPurchaseOrder as action510} from "@/modules/finance/services/commands";
import {raiseServiceCredit as action511} from "@/modules/finance/services/commands";
import {postFinanceDocument as action512} from "@/modules/finance/services/commands";
import {recordGoodsReceipt as action513} from "@/modules/finance/services/commands";
import {onboardSupplier as action514} from "@/modules/finance/services/commands";
import {approveSupplier as action515} from "@/modules/finance/services/commands";
import {requestSupplierBankChange as action516} from "@/modules/finance/services/commands";
import {verifySupplierBank as action517} from "@/modules/finance/services/commands";
import {createFinanceBank as action518} from "@/modules/finance/services/commands";
import {importBankTransactions as action519} from "@/modules/finance/services/commands";
import {allocateBankTransaction as action520} from "@/modules/finance/services/commands";
import {createPaymentRun as action521} from "@/modules/finance/services/commands";
import {approvePaymentRun as action522} from "@/modules/finance/services/commands";
import {createManualJournal as action523} from "@/modules/finance/services/commands";
import {approveManualJournal as action524} from "@/modules/finance/services/commands";
import {reverseJournal as action525} from "@/modules/finance/services/commands";
import {setFinancePeriodState as action526} from "@/modules/finance/services/commands";
import {saveFinanceBudget as action527} from "@/modules/finance/services/commands";
import {saveFinanceAsset as action528} from "@/modules/finance/services/commands";
import {postAssetDepreciation as action529} from "@/modules/finance/services/commands";
import {completeCloseTask as action530} from "@/modules/finance/services/commands";
import {saveFinanceContract as action531} from "@/modules/finance/services/commands";
import {saveFinanceScenario as action532} from "@/modules/finance/services/commands";
import {receiptForm as action533} from "@/modules/finance/services/commands";
import {journalForm as action534} from "@/modules/finance/services/commands";
import {statementForm as action535} from "@/modules/finance/services/commands";
import {allocationForm as action536} from "@/modules/finance/services/commands";
import {paymentRunForm as action537} from "@/modules/finance/services/commands";
import {policyForm as action538} from "@/modules/finance/services/commands";
import {scenarioForm as action539} from "@/modules/finance/services/commands";
import {uploadFinanceAttachment as action540} from "@/modules/finance/services/commands";
import {generateSalesInvoice as action541} from "@/modules/finance/services/commands";
import {generateInvoiceAdjustment as action542} from "@/modules/finance/services/commands";
import {voidFinanceDraft as action543} from "@/modules/finance/services/commands";
import {getFinanceConfiguration as action544} from "@/modules/finance/services/configuration";
import {saveFinanceEntityDetails as action545} from "@/modules/finance/services/configuration";
import {saveFinanceAccount as action546} from "@/modules/finance/services/configuration";
import {saveFinanceDimension as action547} from "@/modules/finance/services/configuration";
import {createFinancePeriod as action548} from "@/modules/finance/services/configuration";
import {setFinancePeriodExceptions as action549} from "@/modules/finance/services/configuration";
import {requestFinancePeriodReopen as action550} from "@/modules/finance/services/configuration";
import {decideFinancePeriodReopen as action551} from "@/modules/finance/services/configuration";
import {getFinanceHome as action552} from "@/modules/finance/services/queries";
import {listFinanceDocuments as action553} from "@/modules/finance/services/queries";
import {getFinanceDocument as action554} from "@/modules/finance/services/queries";
import {getFinanceWorkspace as action555} from "@/modules/finance/services/queries";
import {financeChoices as action556} from "@/modules/finance/services/queries";
import {getBudgetPositions as action557} from "@/modules/finance/services/queries";
import {getInvoiceCashForecast as action558} from "@/modules/finance/services/queries";
import {getFinancialReport as action559} from "@/modules/finance/services/queries";
import {getFinanceCustomerContribution as action560} from "@/modules/finance/services/queries";
import {searchFinance as action561} from "@/modules/finance/services/queries";
import {getFinanceAttachment as action562} from "@/modules/finance/services/queries";
import {getSalesFinanceProjection as action563} from "@/modules/finance/services/queries";
import {getReceivingWarehouses as action564} from "@/modules/finance/services/queries";
import {getFinanceLedger as action565} from "@/modules/finance/services/reporting";
import {getFinanceJournalDetail as action566} from "@/modules/finance/services/reporting";
import {getFinanceSubledgerReconciliation as action567} from "@/modules/finance/services/reporting";
import {saveVehicle as action568} from "@/modules/fleet/services/commands";
import {addFleetLog as action569} from "@/modules/fleet/services/commands";
import {saveEquipment as action570} from "@/modules/maintenance/services/commands";
import {createMaintenanceWork as action571} from "@/modules/maintenance/services/commands";
import {updateMaintenanceWork as action572} from "@/modules/maintenance/services/commands";
import {recordMaintenancePart as action573} from "@/modules/maintenance/services/commands";
import {createProductionOrder as action574} from "@/modules/manufacturing/services/commands";
import {markOrderReady as action575} from "@/modules/manufacturing/services/commands";
import {releaseOrder as action576} from "@/modules/manufacturing/services/commands";
import {closeOrder as action577} from "@/modules/manufacturing/services/commands";
import {startWorkOrder as action578} from "@/modules/manufacturing/services/commands";
import {pauseWorkOrder as action579} from "@/modules/manufacturing/services/commands";
import {completeWorkOrder as action580} from "@/modules/manufacturing/services/commands";
import {listForecasts as action581} from "@/modules/manufacturing/services/forecast";
import {setForecast as action582} from "@/modules/manufacturing/services/forecast";
import {deleteForecast as action583} from "@/modules/manufacturing/services/forecast";
import {runMrp as action584} from "@/modules/manufacturing/services/mrp";
import {firmSuggestion as action585} from "@/modules/manufacturing/services/mrp";
import {dismissSuggestion as action586} from "@/modules/manufacturing/services/mrp";
import {latestPlan as action587} from "@/modules/manufacturing/services/mrp";
import {loadPlant as action588} from "@/modules/manufacturing/services/plant";
import {saveWorkCentre as action589} from "@/modules/manufacturing/services/plant";
import {saveMachine as action590} from "@/modules/manufacturing/services/plant";
import {retirePlantRecord as action591} from "@/modules/manufacturing/services/plant";
import {schedulePreview as action592} from "@/modules/manufacturing/services/scheduler";
import {rescheduleWorkOrder as action593} from "@/modules/manufacturing/services/scheduler";
import {setWorkOrderLock as action594} from "@/modules/manufacturing/services/scheduler";
import {listShifts as action595} from "@/modules/manufacturing/services/shifts";
import {saveShift as action596} from "@/modules/manufacturing/services/shifts";
import {deleteShift as action597} from "@/modules/manufacturing/services/shifts";
import {createCampaignAction as action598} from "@/modules/marketing/services/campaign-actions 2";
import {saveCampaignBriefAction as action599} from "@/modules/marketing/services/campaign-actions 2";
import {saveBudgetLineAction as action600} from "@/modules/marketing/services/campaign-actions 2";
import {deleteBudgetLineAction as action601} from "@/modules/marketing/services/campaign-actions 2";
import {saveActivityAction as action602} from "@/modules/marketing/services/campaign-actions 2";
import {setActivityStatusAction as action603} from "@/modules/marketing/services/campaign-actions 2";
import {deleteActivityAction as action604} from "@/modules/marketing/services/campaign-actions 2";
import {addPaidSpendAction as action605} from "@/modules/marketing/services/campaign-actions 2";
import {deletePaidSpendAction as action606} from "@/modules/marketing/services/campaign-actions 2";
import {createCampaignAction as action607} from "@/modules/marketing/services/campaign-actions";
import {saveCampaignBriefAction as action608} from "@/modules/marketing/services/campaign-actions";
import {saveBudgetLineAction as action609} from "@/modules/marketing/services/campaign-actions";
import {deleteBudgetLineAction as action610} from "@/modules/marketing/services/campaign-actions";
import {saveActivityAction as action611} from "@/modules/marketing/services/campaign-actions";
import {setActivityStatusAction as action612} from "@/modules/marketing/services/campaign-actions";
import {deleteActivityAction as action613} from "@/modules/marketing/services/campaign-actions";
import {addPaidSpendAction as action614} from "@/modules/marketing/services/campaign-actions";
import {deletePaidSpendAction as action615} from "@/modules/marketing/services/campaign-actions";
import {createCampaign as action616} from "@/modules/marketing/services/commands";
import {updateCampaign as action617} from "@/modules/marketing/services/commands";
import {createProfile as action618} from "@/modules/marketing/services/commands";
import {recordPermission as action619} from "@/modules/marketing/services/commands";
import {suppressProfile as action620} from "@/modules/marketing/services/commands";
import {createAudience as action621} from "@/modules/marketing/services/commands";
import {previewAudience as action622} from "@/modules/marketing/services/commands";
import {createContent as action623} from "@/modules/marketing/services/commands";
import {approveContent as action624} from "@/modules/marketing/services/commands";
import {createMessage as action625} from "@/modules/marketing/services/commands";
import {lockSend as action626} from "@/modules/marketing/services/commands";
import {cancelSend as action627} from "@/modules/marketing/services/commands";
import {ingestEvent as action628} from "@/modules/marketing/services/commands";
import {createJourney as action629} from "@/modules/marketing/services/commands";
import {publishJourney as action630} from "@/modules/marketing/services/commands";
import {reviseJourney as action631} from "@/modules/marketing/services/commands";
import {createProgram as action632} from "@/modules/marketing/services/commands";
import {createExperiment as action633} from "@/modules/marketing/services/commands";
import {leadFeedback as action634} from "@/modules/marketing/services/commands";
import {processJourneySteps as action635} from "@/modules/marketing/services/commands";
import {saveMarketingPlan as action636} from "@/modules/marketing/services/commands";
import {addPlanActivity as action637} from "@/modules/marketing/services/commands";
import {updatePlanActivity as action638} from "@/modules/marketing/services/commands";
import {addBudgetLine as action639} from "@/modules/marketing/services/commands";
import {submitBudgetToFinance as action640} from "@/modules/marketing/services/commands";
import {createJourneyMap as action641} from "@/modules/marketing/services/commands";
import {addJourneyStage as action642} from "@/modules/marketing/services/commands";
import {addJourneyTouch as action643} from "@/modules/marketing/services/commands";
import {saveSocialPost as action644} from "@/modules/marketing/services/social-actions";
import {deleteSocialPost as action645} from "@/modules/marketing/services/social-actions";
import {retrySocialPost as action646} from "@/modules/marketing/services/social-actions";
import {disconnectMicrosoftCalendar as action647} from "@/modules/meetings/services/calendar-actions";
import {chooseMicrosoftCalendar as action648} from "@/modules/meetings/services/calendar-actions";
import {sendMicrosoftMeeting as action649} from "@/modules/meetings/services/calendar-actions";
import {importMicrosoftMeetings as action650} from "@/modules/meetings/services/calendar-actions";
import {saveMeeting as action651} from "@/modules/meetings/services/commands";
import {meetingStatus as action652} from "@/modules/meetings/services/commands";
import {addMeetingEntry as action653} from "@/modules/meetings/services/commands";
import {completeMeetingAction as action654} from "@/modules/meetings/services/commands";
import {getApprovedExpenseSource as action655} from "@/modules/people/services/finance-expenses";
import {getPlanBuilder as action656} from "@/modules/plan/services/builder";
import {savePlanInput as action657} from "@/modules/plan/services/builder";
import {setPlanInputIncluded as action658} from "@/modules/plan/services/builder";
import {applyPlanInputs as action659} from "@/modules/plan/services/builder";
import {savePlanGrid as action660} from "@/modules/plan/services/builder";
import {removePlanMeasure as action661} from "@/modules/plan/services/builder";
import {createPlan as action662} from "@/modules/plan/services/commands";
import {saveCell as action663} from "@/modules/plan/services/commands";
import {addMeasure as action664} from "@/modules/plan/services/commands";
import {addAssumption as action665} from "@/modules/plan/services/commands";
import {addDriver as action666} from "@/modules/plan/services/commands";
import {addLink as action667} from "@/modules/plan/services/commands";
import {createScenario as action668} from "@/modules/plan/services/commands";
import {promoteScenario as action669} from "@/modules/plan/services/commands";
import {submitPlan as action670} from "@/modules/plan/services/commands";
import {approvePlan as action671} from "@/modules/plan/services/commands";
import {lockPlan as action672} from "@/modules/plan/services/commands";
import {addGoal as action673} from "@/modules/plan/services/commands";
import {addInitiative as action674} from "@/modules/plan/services/commands";
import {createProjectForInitiative as action675} from "@/modules/plan/services/commands";
import {addAction as action676} from "@/modules/plan/services/commands";
import {completeAction as action677} from "@/modules/plan/services/commands";
import {addRisk as action678} from "@/modules/plan/services/commands";
import {addDependency as action679} from "@/modules/plan/services/commands";
import {addDecision as action680} from "@/modules/plan/services/commands";
import {addComment as action681} from "@/modules/plan/services/commands";
import {addUpdate as action682} from "@/modules/plan/services/commands";
import {completeReview as action683} from "@/modules/plan/services/commands";
import {addReview as action684} from "@/modules/plan/services/commands";
import {distributeTargets as action685} from "@/modules/plan/services/commands";
import {importGrid as action686} from "@/modules/plan/services/commands";
import {sharePlan as action687} from "@/modules/plan/services/commands";
import {unsharePlan as action688} from "@/modules/plan/services/commands";
import {setPlanAudience as action689} from "@/modules/plan/services/commands";
import {addNote as action690} from "@/modules/plan/services/commands";
import {saveGoalProgress as action691} from "@/modules/plan/services/commands";
import {savePlanBrief as action692} from "@/modules/plan/services/commands";
import {listProductionPlans as action693} from "@/modules/planning/services/plans";
import {getPlanOptions as action694} from "@/modules/planning/services/plans";
import {getProductionPlan as action695} from "@/modules/planning/services/plans";
import {createProductionPlan as action696} from "@/modules/planning/services/plans";
import {addProductionPlanLine as action697} from "@/modules/planning/services/plans";
import {getAssignedPlanningWork as action698} from "@/modules/planning/services/plans";
import {getPlanningCoverage as action699} from "@/modules/planning/services/queries";
import {saveProductRecipe as action700} from "@/modules/products/services/make";
import {createSpecification as action701} from "@/modules/quality/services/commands";
import {setSpecificationStatus as action702} from "@/modules/quality/services/commands";
import {createControlPoint as action703} from "@/modules/quality/services/commands";
import {executeInspection as action704} from "@/modules/quality/services/commands";
import {releaseHold as action705} from "@/modules/quality/services/commands";
import {reportNcr as action706} from "@/modules/quality/services/commands";
import {updateNcrInvestigation as action707} from "@/modules/quality/services/commands";
import {addNcrAction as action708} from "@/modules/quality/services/commands";
import {updateNcrAction as action709} from "@/modules/quality/services/commands";
import {closeNcr as action710} from "@/modules/quality/services/commands";
import {reportNcr as action711} from "@/modules/quality/services/ncr-actions";
import {updateNcrInvestigation as action712} from "@/modules/quality/services/ncr-actions";
import {addNcrAction as action713} from "@/modules/quality/services/ncr-actions";
import {updateNcrAction as action714} from "@/modules/quality/services/ncr-actions";
import {closeNcr as action715} from "@/modules/quality/services/ncr-actions";
import {reopenNcr as action716} from "@/modules/quality/services/ncr-actions";
import {saveNcrAction as action717} from "@/modules/quality/services/ncr-actions";
import {saveSubstance as action718} from "@/modules/safety/services/assurance";
import {addSafetyDataSheet as action719} from "@/modules/safety/services/assurance";
import {saveCoshhAssessment as action720} from "@/modules/safety/services/assurance";
import {approveSubstance as action721} from "@/modules/safety/services/assurance";
import {saveCompetence as action722} from "@/modules/safety/services/assurance";
import {saveSafetyDocument as action723} from "@/modules/safety/services/assurance";
import {acknowledgeDocument as action724} from "@/modules/safety/services/assurance";
import {saveAudit as action725} from "@/modules/safety/services/assurance";
import {addAuditFinding as action726} from "@/modules/safety/services/assurance";
import {approveAudit as action727} from "@/modules/safety/services/assurance";
import {saveChange as action728} from "@/modules/safety/services/assurance";
import {advanceChange as action729} from "@/modules/safety/services/assurance";
import {linkSafetyRecord as action730} from "@/modules/safety/services/assurance";
import {saveSafetyProfile as action731} from "@/modules/safety/services/commands";
import {saveRiskMatrix as action732} from "@/modules/safety/services/commands";
import {createRisk as action733} from "@/modules/safety/services/commands";
import {addControl as action734} from "@/modules/safety/services/commands";
import {rateAssessment as action735} from "@/modules/safety/services/commands";
import {approveAssessment as action736} from "@/modules/safety/services/commands";
import {reviseAssessment as action737} from "@/modules/safety/services/commands";
import {requestRiskReview as action738} from "@/modules/safety/services/commands";
import {reportIncident as action739} from "@/modules/safety/services/commands";
import {saveImmediateControl as action740} from "@/modules/safety/services/commands";
import {openInvestigation as action741} from "@/modules/safety/services/commands";
import {addCause as action742} from "@/modules/safety/services/commands";
import {saveRootCause as action743} from "@/modules/safety/services/commands";
import {reviewRiddor as action744} from "@/modules/safety/services/commands";
import {createSafetyAction as action745} from "@/modules/safety/services/commands";
import {advanceAction as action746} from "@/modules/safety/services/commands";
import {verifyAction as action747} from "@/modules/safety/services/commands";
import {saveWorkplaceRecord as action748} from "@/modules/safety/services/commands";
import {createPermit as action749} from "@/modules/safety/services/control";
import {advancePermit as action750} from "@/modules/safety/services/control";
import {extendPermit as action751} from "@/modules/safety/services/control";
import {createIsolation as action752} from "@/modules/safety/services/control";
import {applyIsolationLock as action753} from "@/modules/safety/services/control";
import {verifyIsolation as action754} from "@/modules/safety/services/control";
import {clearIsolation as action755} from "@/modules/safety/services/control";
import {removeIsolationLock as action756} from "@/modules/safety/services/control";
import {placeSafetyHold as action757} from "@/modules/safety/services/control";
import {updateReturnToService as action758} from "@/modules/safety/services/control";
import {releaseSafetyHold as action759} from "@/modules/safety/services/control";
import {overrideSafetyHold as action760} from "@/modules/safety/services/control";
import {saveStatutoryCheck as action761} from "@/modules/safety/services/control";
import {completeInspection as action762} from "@/modules/safety/services/control";
import {createInspection as action763} from "@/modules/safety/services/control";
import {createSalesAddress as action764} from "@/modules/sales/services/address-actions";
import {createSalesCatalogueProduct as action765} from "@/modules/sales/services/catalogue-actions";
import {sendQuote as action766} from "@/modules/sales/services/commands";
import {changeQuoteStatus as action767} from "@/modules/sales/services/commands";
import {deleteQuote as action768} from "@/modules/sales/services/commands";
import {duplicateDocument as action769} from "@/modules/sales/services/commands";
import {saveQuoteTemplate as action770} from "@/modules/sales/services/commands";
import {createOrderFromQuote as action771} from "@/modules/sales/services/commands";
import {linkCommercialProject as action772} from "@/modules/sales/services/commercial";
import {openCallOffOrder as action773} from "@/modules/sales/services/commercial";
import {raiseCallOff as action774} from "@/modules/sales/services/commercial";
import {invoiceCallOffDelivery as action775} from "@/modules/sales/services/commercial";
import {deliverAndInvoiceCallOff as action776} from "@/modules/sales/services/commercial";
import {importSalescsv as action777} from "@/modules/sales/services/csv-import";
import {addDeliveryAddress as action778} from "@/modules/sales/services/delivery-address";
import {addInstaller as action779} from "@/modules/sales/services/delivery-address";
import {pricePartyId as action780} from "@/modules/sales/services/delivery-address";
import {linkOrderedFor as action781} from "@/modules/sales/services/delivery-address";
import {saveDocument as action782} from "@/modules/sales/services/documents";
import {saveInvoiceTemplate as action783} from "@/modules/sales/services/invoice-template-actions";
import {retireInvoiceTemplate as action784} from "@/modules/sales/services/invoice-template-actions";
import {attachCustomerInvoiceTemplate as action785} from "@/modules/sales/services/invoice-template-actions";
import {detachCustomerInvoiceTemplate as action786} from "@/modules/sales/services/invoice-template-actions";
import {createDraftOrder as action787} from "@/modules/sales/services/orders";
import {addOrderLine as action788} from "@/modules/sales/services/orders";
import {removeOrderLine as action789} from "@/modules/sales/services/orders";
import {updateDraftOrderFields as action790} from "@/modules/sales/services/orders";
import {confirmOrder as action791} from "@/modules/sales/services/orders";
import {decideApproval as action792} from "@/modules/sales/services/orders";
import {amendLineQuantity as action793} from "@/modules/sales/services/orders";
import {overrideLinePrice as action794} from "@/modules/sales/services/orders";
import {amendRequestedDate as action795} from "@/modules/sales/services/orders";
import {cancelOrder as action796} from "@/modules/sales/services/orders";
import {deleteOrder as action797} from "@/modules/sales/services/orders";
import {cancelLineRemaining as action798} from "@/modules/sales/services/orders";
import {addHold as action799} from "@/modules/sales/services/orders";
import {releaseHold as action800} from "@/modules/sales/services/orders";
import {redeemServiceRecovery as action801} from "@/modules/sales/services/recovery";
import {restoreCancelledOrder as action802} from "@/modules/sales/services/rewind";
import {returnOrderToQuote as action803} from "@/modules/sales/services/rewind";
import {saveOrderHashtags as action804} from "@/modules/sales/services/rewind";
import {saveSalesView as action805} from "@/modules/sales/services/saved-views";
import {archiveSalesView as action806} from "@/modules/sales/services/saved-views";
import {createCase as action807} from "@/modules/service/services/commands";
import {updateCase as action808} from "@/modules/service/services/commands";
import {assignCase as action809} from "@/modules/service/services/commands";
import {transitionCase as action810} from "@/modules/service/services/commands";
import {addCaseEntry as action811} from "@/modules/service/services/commands";
import {createDepartmentTicket as action812} from "@/modules/service/services/commands";
import {updateDepartmentTicket as action813} from "@/modules/service/services/commands";
import {createQueue as action814} from "@/modules/service/services/commands";
import {addQueueMember as action815} from "@/modules/service/services/commands";
import {linkCaseRecord as action816} from "@/modules/service/services/commands";
import {creditChoices as action817} from "@/modules/service/services/commands";
import {askFinanceForCredit as action818} from "@/modules/service/services/commands";
import {getCaseOwners as action819} from "@/modules/service/services/commands";
import {getDepartmentWork as action820} from "@/modules/service/services/commands";
import {savePurchaseContext as action821} from "@/modules/service/services/commands";
import {saveInvestigation as action822} from "@/modules/service/services/commands";
import {logCaseCall as action823} from "@/modules/service/services/commands";
import {createCaseRemedy as action824} from "@/modules/service/services/commands";
import {mergeCases as action825} from "@/modules/service/services/commands";
import {sendCaseEmail as action826} from "@/modules/service/services/communication";
import {invalidateCaseCsat as action827} from "@/modules/service/services/communication";
import {casePurchaseContext as action828} from "@/modules/service/services/context";
import {proposeRecovery as action829} from "@/modules/service/services/recovery";
import {decideRecovery as action830} from "@/modules/service/services/recovery";
import {saveServiceApprovalRoute as action831} from "@/modules/service/services/recovery";
import {getSopWorkspace as action832} from "@/modules/sop/services/workspace";
import {createSopCycle as action833} from "@/modules/sop/services/workspace";
import {configureSopCycle as action834} from "@/modules/sop/services/workspace";
import {generateSopForecast as action835} from "@/modules/sop/services/workspace";
import {approveSopVersion as action836} from "@/modules/sop/services/workspace";
import {updateSopWorkflow as action837} from "@/modules/sop/services/workspace";
import {publishSopVersion as action838} from "@/modules/sop/services/workspace";
import {createSopScenario as action839} from "@/modules/sop/services/workspace";
import {promoteSopScenario as action840} from "@/modules/sop/services/workspace";
import {overrideSopDemand as action841} from "@/modules/sop/services/workspace";
import {getLiveSopService as action842} from "@/modules/sop/services/workspace";
import {getSopComparison as action843} from "@/modules/sop/services/workspace";
import {getSopAccuracy as action844} from "@/modules/sop/services/workspace";
import {readAvailability as action845} from "@/modules/stock/services/availability";
import {readOrderChain as action846} from "@/modules/stock/services/availability";
import {inventoryExportRows as action847} from "@/modules/stock/services/export";
import {createTeam as action848} from "@/modules/teams/services/commands";
import {renameTeam as action849} from "@/modules/teams/services/commands";
import {addMember as action850} from "@/modules/teams/services/commands";
import {removeMember as action851} from "@/modules/teams/services/commands";
import {saveTask as action852} from "@/modules/teams/services/commands";
import {setTaskStatus as action853} from "@/modules/teams/services/commands";
import {removeTask as action854} from "@/modules/teams/services/commands";
import {saveCover as action855} from "@/modules/teams/services/commands";
import {removeCover as action856} from "@/modules/teams/services/commands";
import {saveHandover as action857} from "@/modules/teams/services/commands";
import {savePlace as action858} from "@/modules/teams/services/commands";
import {saveMoment as action859} from "@/modules/teams/services/commands";
import {removeMoment as action860} from "@/modules/teams/services/commands";
export const DATA_ACTIONS:Record<string,(...args:never[])=>Promise<unknown>>={
"src/app/(app)/_shared/record-email-actions:loadEmailRecord":action0 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/_shared/record-email-actions:sendRecordEmailAction":action1 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/_shared/record-email-actions:sendRecordContractAction":action2 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/_shared/record-email-actions:sendQuoteForApprovalAction":action3 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:loadLiveMetrics":action4 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:loadMetricSlice":action5 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:saveAnalyticsDashboard":action6 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:deleteAnalyticsDashboard":action7 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:loadLiveGoalMarkers":action8 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/apps/actions:toggleModuleAction":action9 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/actions:updateCompanyAccount":action10 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/actions:saveCompanyEntitlements":action11 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/actions:createCompanyAccount":action12 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/actions:deleteTestCompany":action13 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/admin-actions:openCompanyWorkspace":action14 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/admin-actions:saveAtlasUserProfile":action15 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/admin-actions:saveAtlasUserAccess":action16 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/admin-actions:revokeAtlasUserSessions":action17 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/admin-actions:issueAtlasUserRecovery":action18 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/admin-actions:createAtlasStaff":action19 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/admin-actions:updateAtlasStaff":action20 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/admin-actions:saveAtlasStaffProfile":action21 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/admin-actions:issueAtlasStaffRecovery":action22 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/admin-actions:archiveAtlasCompany":action23 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/admin-actions:saveAtlasCompanyProfile":action24 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/admin-actions:saveAtlasCompanyBrand":action25 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/cleanup/actions:deleteSelectedTestCompanies":action26 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/cleanup/actions:retryCompanyFileCleanup":action27 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/connections/actions:attachConnection":action28 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/guardian/actions:requestGuardianSweep":action29 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/guardian/actions:updateGuardianIssue":action30 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/setup-actions:importCompanySetup":action31 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/setup-actions:createCompanyUser":action32 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/setup-actions:setCompanyUserStatus":action33 as (...args:never[])=>Promise<unknown>,
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
"src/app/(app)/logistics/actions:syncDemandAction":action86 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:restoreDeliveryAction":action87 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:releaseAction":action88 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:allocateAction":action89 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:directShipAction":action90 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:groupAction":action91 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:scanAction":action92 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:lotAction":action93 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:serialAction":action94 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shortAction":action95 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeWorkAction":action96 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:claimAction":action97 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shipFromPickAction":action98 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packageAction":action99 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:weightAction":action100 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:stageAction":action101 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:labelAction":action102 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:dispatchAction":action103 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:trackingAction":action104 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:deliverAction":action105 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadCreateAction":action106 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadScanAction":action107 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:departAction":action108 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:expectAction":action109 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveLineAction":action110 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:putAwayAction":action111 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeReceiptAction":action112 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferAction":action113 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferReceiveAction":action114 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:returnRequestAction":action115 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:authoriseReturnAction":action116 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveReturnAction":action117 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:inspectAction":action118 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:closeReturnAction":action119 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:assignEquipmentAction":action120 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packUnitAction":action121 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:saveHandlingTypeAction":action122 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:retireHandlingTypeAction":action123 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:removeHandlingTypeAction":action124 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:policyAction":action125 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:runMrpAction":action126 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:firmPlannedOrderAction":action127 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:dismissPlannedOrderAction":action128 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/forecast/actions:setForecastAction":action129 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/forecast/actions:deleteForecastAction":action130 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:runMrpForm":action131 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:firmPlannedOrderForm":action132 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:dismissPlannedOrderForm":action133 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/produce/actions:raiseProductionOrderAction":action134 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:previewMoveAction":action135 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:commitMoveAction":action136 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:toggleLockAction":action137 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:saveShiftAction":action138 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:deleteShiftAction":action139 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:startAction":action140 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:pauseAction":action141 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:completeAction":action142 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:loadNotices":action143 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotice":action144 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotices":action145 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:createPayrollRun":action146 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:updatePayslipDeductions":action147 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:finalisePayrollRun":action148 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:markPayrollRunPaid":action149 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:savePayrollSettings":action150 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP45":action151 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP60":action152 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:logAbsence":action153 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:requestLeave":action154 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:cancelOwnLeave":action155 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:approveLeaveRequest":action156 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:setLeaveAllowance":action157 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:rejectLeaveRequest":action158 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:createEmployee":action159 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:changeEmployeeStatus":action160 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeProfile":action161 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateOwnEmployeeDetails":action162 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeDocument":action163 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:linkEmployeeToUser":action164 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:completeEmployeeTask":action165 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeTask":action166 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeContact":action167 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeTask":action168 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:scheduleAppraisal":action169 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:completeAppraisal":action170 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getConductDesk":action171 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getMyConduct":action172 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getPlan":action173 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getCase":action174 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:conductChoices":action175 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:savePlan":action176 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addPlanReview":action177 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:commentOnPlan":action178 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:saveCase":action179 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:respondToCase":action180 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addCaseEvent":action181 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:submitExpenseClaim":action182 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:approveExpenseClaim":action183 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:rejectExpenseClaim":action184 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:scheduleOneToOne":action185 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:completeOneToOne":action186 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/platform-actions:saveVacancy":action187 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/platform-actions:saveApplication":action188 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/platform-actions:saveTraining":action189 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/platform-actions:saveHRDocument":action190 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:listPolicies":action191 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:publishPolicy":action192 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:archivePolicy":action193 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:openPolicy":action194 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:createShift":action195 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:changeShiftStatus":action196 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyHR":action197 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyTeam":action198 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getTeamEmployee":action199 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:addPrivateNote":action200 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:updateWorkingPattern":action201 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:updateHrSettings":action202 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createAppraisalTemplate":action203 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleAppraisalTemplateActive":action204 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createOneToOneTemplate":action205 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleOneToOneTemplateActive":action206 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:getTimesheetContext":action207 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:saveTimesheet":action208 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:reviewTimesheet":action209 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:createPriceList":action210 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:savePriceEntry":action211 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveRule":action212 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:setRuleActive":action213 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:updatePriceBasis":action214 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:renamePriceList":action215 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:assignPriceListCustomers":action216 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:checkSalesPrice":action217 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:assignPriceList":action218 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewPriceCsv":action219 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyPriceCsv":action220 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreement":action221 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreementPrice":action222 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:removeAgreementPrice":action223 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewAgreementCsv":action224 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyAgreementCsv":action225 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProduct":action226 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProductRecord":action227 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveCategory":action228 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:retireCategory":action229 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:addStandardCategories":action230 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:savePack":action231 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveLinks":action232 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveMeasures":action233 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/actions:saveProfile":action234 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/work:loadAssignedWork":action235 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProject":action236 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeProjectStatus":action237 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editProject":action238 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProjectMember":action239 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:archiveProject":action240 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTask":action241 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeTaskStatus":action242 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editTask":action243 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:checklistItem":action244 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addDependency":action245 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMeeting":action246 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDocument":action247 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editDocument":action248 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addComment":action249 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMilestone":action250 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:publishUpdate":action251 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDecision":action252 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:decide":action253 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createRisk":action254 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:closeRisk":action255 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:requestApproval":action256 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:respondApproval":action257 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:submitRequest":action258 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:triageRequest":action259 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:logTime":action260 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:planToday":action261 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:updateInbox":action262 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveView":action263 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createPortfolio":action264 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createBaseline":action265 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setBudget":action266 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:linkWork":action267 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectActivity":action268 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createAutomation":action269 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:toggleAutomation":action270 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveProjectTemplate":action271 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:useProjectTemplate":action272 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:startTimer":action273 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:stopTimer":action274 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:projectPreference":action275 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:uploadProjectFile":action276 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:readProjectFile":action277 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProperty":action278 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProperty":action279 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:restoreDocument":action280 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTaskFromDocument":action281 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:discardTimer":action282 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:completeMilestone":action283 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:resolveComment":action284 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectWorkload":action285 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:rescheduleTask":action286 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:newContractAction":action287 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:resendContractAction":action288 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:deleteContractAction":action289 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:createOrderForm":action290 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addLineForm":action291 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:removeLineForm":action292 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:confirmOrderForm":action293 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:updateOrderForm":action294 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:chooseOrderAddresses":action295 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addHoldForm":action296 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:releaseHoldForm":action297 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:approveOrderForm":action298 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:cancelOrderForm":action299 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:saveOrderHashtagsForm":action300 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:restoreCancelledOrderForm":action301 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:returnOrderToQuoteForm":action302 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:scheduleOrderDelivery":action303 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:rejectOrderApproval":action304 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:deleteOrderForm":action305 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:createQuote":action306 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:deleteQuoteForm":action307 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/settings/actions:saveCreationPolicy":action308 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/sites/actions:saveSiteAction":action309 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/sites/actions:setDocumentSiteAction":action310 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getSchedule":action311 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:createBulkShifts":action312 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:setScheduledShift":action313 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:completeShiftTask":action314 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:editScheduledShift":action315 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishWeekShifts":action316 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveHoursBudget":action317 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getTeamPlan":action318 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getPersonSchedule":action319 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveWorkType":action320 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:archiveWorkType":action321 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveDemand":action322 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveBusyRule":action323 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:removeBusyRule":action324 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:fillTeamMonth":action325 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:replanCover":action326 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishMonth":action327 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveShift":action328 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveRole":action329 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveMemberRoles":action330 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:createUser":action331 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyAccess":action332 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyProfile":action333 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveManagerPolicy":action334 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveWorkspaceDetails":action335 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyBrand":action336 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/imports/actions:importCsv":action337 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveEmailAccount":action338 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:verifyEmailAccount":action339 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:sendTestEmail":action340 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:makeDefaultAccount":action341 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:setAccountActive":action342 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteEmailAccount":action343 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveSocialAccount":action344 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteSocialAccount":action345 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:checkSocialAccount":action346 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveEmailTemplate":action347 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteEmailTemplate":action348 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:checkInboxNow":action349 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/logistics/actions:saveDispatchDelivery":action350 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveUserAccess":action351 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:setUserStatus":action352 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:revokeUserSessions":action353 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:issuePasswordRecovery":action354 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createManagedUser":action355 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:linkEmployeeProfile":action356 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createRole":action357 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveManagementGroup":action358 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createWarehouse":action359 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:adjustStock":action360 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:savePlanningAction":action361 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:makeFromForecastAction":action362 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:transferStock":action363 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createSiteAction":action364 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createPlaceAction":action365 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:assignSiteAction":action366 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:addLocationAction":action367 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:ensureLocationsAction":action368 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:retireLocationAction":action369 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:putOnLocationAction":action370 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:moveLocatedAction":action371 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:receiveMoveAction":action372 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/templates/actions:saveTemplate":action373 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/templates/actions:archiveTemplate":action374 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/templates/actions:generateTemplateDocument":action375 as (...args:never[])=>Promise<unknown>,
"src/core/approvals/actions:delegateApprovals":action376 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:loginAction":action377 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:logoutAction":action378 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:completePasswordRecovery":action379 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:changeOwnPassword":action380 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:signOutOtherSessions":action381 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:createContract":action382 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:sendContract":action383 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:shareContractLink":action384 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:updateDraftContract":action385 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:revokeContract":action386 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:deleteContract":action387 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:signContract":action388 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:returnSignedContract":action389 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:reviewContractReturn":action390 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:declineContract":action391 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:loadPublicContract":action392 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:loadPublicContractFile":action393 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:checkForDuplicatesAction":action394 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:createCustomerAction":action395 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createCustomer":action396 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerStatus":action397 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:archiveCustomer":action398 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:unarchiveCustomer":action399 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteCustomer":action400 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createContact":action401 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateContact":action402 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteContact":action403 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createAddress":action404 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCommercialSettings":action405 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCreditLimit":action406 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setCreditHold":action407 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setPaymentTerm":action408 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createTaxRegistration":action409 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:markTaxRegistrationManuallyVerified":action410 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createBankAccount":action411 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:revealBankAccount":action412 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createDirectDebitMandate":action413 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:cancelDirectDebitMandate":action414 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createNote":action415 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:saveCustomerHashtags":action416 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerDetails":action417 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateAddress":action418 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:archiveAddress":action419 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commercial-actions:saveOrderingPreferences":action420 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setCustomerParent":action421 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:placeCustomer":action422 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:moveCustomer":action423 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setContactReportsTo":action424 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:saveCustomerTradingLink":action425 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:setInvoiceAccount":action426 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:archiveCustomerTradingLink":action427 as (...args:never[])=>Promise<unknown>,
"src/core/finance/actions:requestSalesInvoice":action428 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:createWork":action429 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:updateWork":action430 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:commentWork":action431 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:watchWork":action432 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:mergeWork":action433 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:requestWorkApproval":action434 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:decideWorkApproval":action435 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:saveDeskQueue":action436 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:changeDeskMember":action437 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/file-actions:attachServiceFile":action438 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/knowledge:saveKnowledge":action439 as (...args:never[])=>Promise<unknown>,
"src/core/teams/actions:createWorkTeam":action440 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditBoard":action441 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:exportAuditReport":action442 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEcho":action443 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:postEchoNote":action444 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEchoInbox":action445 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditAccess":action446 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditOwnActivity":action447 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditAreas":action448 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:saveAutomation":action449 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:setAutomationEnabled":action450 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:deleteAutomation":action451 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:testOnPastEvent":action452 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:runNow":action453 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:logActivity":action454 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:completeActivity":action455 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/marketing-handoff:acceptMarketingHandoff":action456 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:createOpportunity":action457 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:moveOpportunityStage":action458 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityValue":action459 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityCloseDate":action460 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityForecastCategory":action461 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityNextAction":action462 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:winOpportunity":action463 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:loseOpportunity":action464 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addStakeholder":action465 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addMilestone":action466 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:toggleMilestone":action467 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:checkProspectDuplicatesAction":action468 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createProspect":action469 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:assignProspect":action470 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:setProspectLifecycleStage":action471 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:convertProspect":action472 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createIndustry":action473 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:saveProspectGrouping":action474 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProject":action475 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProjectFormAction":action476 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:saveSalesProjectAction":action477 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:saveNextActionAction":action478 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addProjectOrganisationAction":action479 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:removeProjectOrganisationAction":action480 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:makePrimaryOrganisationAction":action481 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addProjectStakeholderAction":action482 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:removeProjectStakeholderAction":action483 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:setDocumentSalesProjectAction":action484 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:deleteSalesProjectAction":action485 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:saveSurvey":action486 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:createSurveyFromTemplate":action487 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:setSurveyActive":action488 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:deleteSurvey":action489 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatScore":action490 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatComment":action491 as (...args:never[])=>Promise<unknown>,
"src/modules/engineering/services/commands:saveEngineeringRevision":action492 as (...args:never[])=>Promise<unknown>,
"src/modules/engineering/services/commands:transitionEngineeringRevision":action493 as (...args:never[])=>Promise<unknown>,
"src/modules/engineering/services/commands:uploadEngineeringDrawing":action494 as (...args:never[])=>Promise<unknown>,
"src/modules/fieldservice/services/commands:saveFieldJob":action495 as (...args:never[])=>Promise<unknown>,
"src/modules/fieldservice/services/commands:updateFieldJob":action496 as (...args:never[])=>Promise<unknown>,
"src/modules/fieldservice/services/commands:addFieldJobNote":action497 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:importFinanceStatement":action498 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:reconcileFinanceStatement":action499 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:financeReconciliationForm":action500 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:getFinanceReconciliation":action501 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:importFinanceStatementForm":action502 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/collections:getFinanceCollections":action503 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/collections:recordFinanceCollection":action504 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setupFinance":action505 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceDocument":action506 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:submitFinanceDocument":action507 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveApprovalPolicy":action508 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:decideFinanceApproval":action509 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPurchaseOrder":action510 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:raiseServiceCredit":action511 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postFinanceDocument":action512 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:recordGoodsReceipt":action513 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:onboardSupplier":action514 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveSupplier":action515 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:requestSupplierBankChange":action516 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:verifySupplierBank":action517 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceBank":action518 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:importBankTransactions":action519 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocateBankTransaction":action520 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPaymentRun":action521 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approvePaymentRun":action522 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createManualJournal":action523 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveManualJournal":action524 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:reverseJournal":action525 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setFinancePeriodState":action526 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceBudget":action527 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceAsset":action528 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postAssetDepreciation":action529 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:completeCloseTask":action530 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceContract":action531 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceScenario":action532 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:receiptForm":action533 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:journalForm":action534 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:statementForm":action535 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocationForm":action536 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:paymentRunForm":action537 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:policyForm":action538 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:scenarioForm":action539 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:uploadFinanceAttachment":action540 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateSalesInvoice":action541 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateInvoiceAdjustment":action542 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:voidFinanceDraft":action543 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:getFinanceConfiguration":action544 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:saveFinanceEntityDetails":action545 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:saveFinanceAccount":action546 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:saveFinanceDimension":action547 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:createFinancePeriod":action548 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:setFinancePeriodExceptions":action549 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:requestFinancePeriodReopen":action550 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:decideFinancePeriodReopen":action551 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceHome":action552 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:listFinanceDocuments":action553 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceDocument":action554 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceWorkspace":action555 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:financeChoices":action556 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getBudgetPositions":action557 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getInvoiceCashForecast":action558 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinancialReport":action559 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceCustomerContribution":action560 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:searchFinance":action561 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceAttachment":action562 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getSalesFinanceProjection":action563 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getReceivingWarehouses":action564 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/reporting:getFinanceLedger":action565 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/reporting:getFinanceJournalDetail":action566 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/reporting:getFinanceSubledgerReconciliation":action567 as (...args:never[])=>Promise<unknown>,
"src/modules/fleet/services/commands:saveVehicle":action568 as (...args:never[])=>Promise<unknown>,
"src/modules/fleet/services/commands:addFleetLog":action569 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:saveEquipment":action570 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:createMaintenanceWork":action571 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:updateMaintenanceWork":action572 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:recordMaintenancePart":action573 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:createProductionOrder":action574 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:markOrderReady":action575 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:releaseOrder":action576 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:closeOrder":action577 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:startWorkOrder":action578 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:pauseWorkOrder":action579 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:completeWorkOrder":action580 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:listForecasts":action581 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:setForecast":action582 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:deleteForecast":action583 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:runMrp":action584 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:firmSuggestion":action585 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:dismissSuggestion":action586 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:latestPlan":action587 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:loadPlant":action588 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveWorkCentre":action589 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveMachine":action590 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:retirePlantRecord":action591 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:schedulePreview":action592 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:rescheduleWorkOrder":action593 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:setWorkOrderLock":action594 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:listShifts":action595 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:saveShift":action596 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:deleteShift":action597 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:createCampaignAction":action598 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveCampaignBriefAction":action599 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveBudgetLineAction":action600 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deleteBudgetLineAction":action601 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveActivityAction":action602 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:setActivityStatusAction":action603 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deleteActivityAction":action604 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:addPaidSpendAction":action605 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deletePaidSpendAction":action606 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:createCampaignAction":action607 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveCampaignBriefAction":action608 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveBudgetLineAction":action609 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deleteBudgetLineAction":action610 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveActivityAction":action611 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:setActivityStatusAction":action612 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deleteActivityAction":action613 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:addPaidSpendAction":action614 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deletePaidSpendAction":action615 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createCampaign":action616 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updateCampaign":action617 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProfile":action618 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:recordPermission":action619 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:suppressProfile":action620 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createAudience":action621 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:previewAudience":action622 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createContent":action623 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:approveContent":action624 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createMessage":action625 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:lockSend":action626 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:cancelSend":action627 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:ingestEvent":action628 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourney":action629 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:publishJourney":action630 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:reviseJourney":action631 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProgram":action632 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createExperiment":action633 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:leadFeedback":action634 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:processJourneySteps":action635 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:saveMarketingPlan":action636 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addPlanActivity":action637 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updatePlanActivity":action638 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addBudgetLine":action639 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:submitBudgetToFinance":action640 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourneyMap":action641 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyStage":action642 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyTouch":action643 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:saveSocialPost":action644 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:deleteSocialPost":action645 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:retrySocialPost":action646 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:disconnectMicrosoftCalendar":action647 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:chooseMicrosoftCalendar":action648 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:sendMicrosoftMeeting":action649 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:importMicrosoftMeetings":action650 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:saveMeeting":action651 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:meetingStatus":action652 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:addMeetingEntry":action653 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:completeMeetingAction":action654 as (...args:never[])=>Promise<unknown>,
"src/modules/people/services/finance-expenses:getApprovedExpenseSource":action655 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:getPlanBuilder":action656 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:savePlanInput":action657 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:setPlanInputIncluded":action658 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:applyPlanInputs":action659 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:savePlanGrid":action660 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:removePlanMeasure":action661 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createPlan":action662 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveCell":action663 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addMeasure":action664 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAssumption":action665 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDriver":action666 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addLink":action667 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createScenario":action668 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:promoteScenario":action669 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:submitPlan":action670 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:approvePlan":action671 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:lockPlan":action672 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addGoal":action673 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addInitiative":action674 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createProjectForInitiative":action675 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAction":action676 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeAction":action677 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addRisk":action678 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDependency":action679 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDecision":action680 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addComment":action681 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addUpdate":action682 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeReview":action683 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addReview":action684 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:distributeTargets":action685 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:importGrid":action686 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:sharePlan":action687 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:unsharePlan":action688 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:setPlanAudience":action689 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addNote":action690 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveGoalProgress":action691 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:savePlanBrief":action692 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:listProductionPlans":action693 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getPlanOptions":action694 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getProductionPlan":action695 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:createProductionPlan":action696 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:addProductionPlanLine":action697 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getAssignedPlanningWork":action698 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/queries:getPlanningCoverage":action699 as (...args:never[])=>Promise<unknown>,
"src/modules/products/services/make:saveProductRecipe":action700 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createSpecification":action701 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:setSpecificationStatus":action702 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createControlPoint":action703 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:executeInspection":action704 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:releaseHold":action705 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:reportNcr":action706 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrInvestigation":action707 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:addNcrAction":action708 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrAction":action709 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:closeNcr":action710 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:reportNcr":action711 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:updateNcrInvestigation":action712 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:addNcrAction":action713 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:updateNcrAction":action714 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:closeNcr":action715 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:reopenNcr":action716 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/ncr-actions:saveNcrAction":action717 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSubstance":action718 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addSafetyDataSheet":action719 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCoshhAssessment":action720 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveSubstance":action721 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCompetence":action722 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSafetyDocument":action723 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:acknowledgeDocument":action724 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveAudit":action725 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addAuditFinding":action726 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveAudit":action727 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveChange":action728 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:advanceChange":action729 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:linkSafetyRecord":action730 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveSafetyProfile":action731 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRiskMatrix":action732 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createRisk":action733 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addControl":action734 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:rateAssessment":action735 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:approveAssessment":action736 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviseAssessment":action737 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:requestRiskReview":action738 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reportIncident":action739 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveImmediateControl":action740 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:openInvestigation":action741 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addCause":action742 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRootCause":action743 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviewRiddor":action744 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createSafetyAction":action745 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:advanceAction":action746 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:verifyAction":action747 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveWorkplaceRecord":action748 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createPermit":action749 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:advancePermit":action750 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:extendPermit":action751 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createIsolation":action752 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:applyIsolationLock":action753 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:verifyIsolation":action754 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:clearIsolation":action755 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:removeIsolationLock":action756 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:placeSafetyHold":action757 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:updateReturnToService":action758 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:releaseSafetyHold":action759 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:overrideSafetyHold":action760 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:saveStatutoryCheck":action761 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:completeInspection":action762 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createInspection":action763 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/address-actions:createSalesAddress":action764 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/catalogue-actions:createSalesCatalogueProduct":action765 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:sendQuote":action766 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:changeQuoteStatus":action767 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:deleteQuote":action768 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:duplicateDocument":action769 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:saveQuoteTemplate":action770 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:createOrderFromQuote":action771 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:linkCommercialProject":action772 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:openCallOffOrder":action773 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:raiseCallOff":action774 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:invoiceCallOffDelivery":action775 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:deliverAndInvoiceCallOff":action776 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/csv-import:importSalescsv":action777 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:addDeliveryAddress":action778 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:addInstaller":action779 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:pricePartyId":action780 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:linkOrderedFor":action781 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/documents:saveDocument":action782 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:saveInvoiceTemplate":action783 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:retireInvoiceTemplate":action784 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:attachCustomerInvoiceTemplate":action785 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:detachCustomerInvoiceTemplate":action786 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:createDraftOrder":action787 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addOrderLine":action788 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:removeOrderLine":action789 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:updateDraftOrderFields":action790 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:confirmOrder":action791 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:decideApproval":action792 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendLineQuantity":action793 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:overrideLinePrice":action794 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendRequestedDate":action795 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelOrder":action796 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:deleteOrder":action797 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelLineRemaining":action798 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addHold":action799 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:releaseHold":action800 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/recovery:redeemServiceRecovery":action801 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:restoreCancelledOrder":action802 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:returnOrderToQuote":action803 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:saveOrderHashtags":action804 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:saveSalesView":action805 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:archiveSalesView":action806 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createCase":action807 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateCase":action808 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:assignCase":action809 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:transitionCase":action810 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addCaseEntry":action811 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createDepartmentTicket":action812 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateDepartmentTicket":action813 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createQueue":action814 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addQueueMember":action815 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:linkCaseRecord":action816 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:creditChoices":action817 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:askFinanceForCredit":action818 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getCaseOwners":action819 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getDepartmentWork":action820 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:savePurchaseContext":action821 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:saveInvestigation":action822 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:logCaseCall":action823 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createCaseRemedy":action824 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:mergeCases":action825 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/communication:sendCaseEmail":action826 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/communication:invalidateCaseCsat":action827 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/context:casePurchaseContext":action828 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/recovery:proposeRecovery":action829 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/recovery:decideRecovery":action830 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/recovery:saveServiceApprovalRoute":action831 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getSopWorkspace":action832 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:createSopCycle":action833 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:configureSopCycle":action834 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:generateSopForecast":action835 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:approveSopVersion":action836 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:updateSopWorkflow":action837 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:publishSopVersion":action838 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:createSopScenario":action839 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:promoteSopScenario":action840 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:overrideSopDemand":action841 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getLiveSopService":action842 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getSopComparison":action843 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getSopAccuracy":action844 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readAvailability":action845 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readOrderChain":action846 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/export:inventoryExportRows":action847 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:createTeam":action848 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:renameTeam":action849 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:addMember":action850 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMember":action851 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveTask":action852 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:setTaskStatus":action853 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeTask":action854 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveCover":action855 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeCover":action856 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveHandover":action857 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:savePlace":action858 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveMoment":action859 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMoment":action860 as (...args:never[])=>Promise<unknown>
};
