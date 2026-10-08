import {rescheduleTask as projectsRescheduleTask} from '@/app/(app)/projects/actions';
// Generated allowlist: public calls still enforce their own server capabilities.
import {loadEmailRecord as action0} from "@/app/(app)/_shared/record-email-actions";
import {sendRecordEmailAction as action1} from "@/app/(app)/_shared/record-email-actions";
import {sendRecordContractAction as action2} from "@/app/(app)/_shared/record-email-actions";
import {sendQuoteForApprovalAction as action3} from "@/app/(app)/_shared/record-email-actions";
import {loadLiveMetrics as action4} from "@/app/(app)/analytics/actions";
import {loadMetricSlice as action5} from "@/app/(app)/analytics/actions";
import {saveAnalyticsDashboard as action6} from "@/app/(app)/analytics/actions";
import {deleteAnalyticsDashboard as action7} from "@/app/(app)/analytics/actions";
import {toggleModuleAction as action8} from "@/app/(app)/apps/actions";
import {updateCompanyAccount as action9} from "@/app/(app)/atlas/actions";
import {saveCompanyEntitlements as action10} from "@/app/(app)/atlas/actions";
import {createCompanyAccount as action11} from "@/app/(app)/atlas/actions";
import {deleteTestCompany as action12} from "@/app/(app)/atlas/actions";
import {openCompanyWorkspace as action13} from "@/app/(app)/atlas/admin-actions";
import {saveAtlasUserProfile as action14} from "@/app/(app)/atlas/admin-actions";
import {saveAtlasUserAccess as action15} from "@/app/(app)/atlas/admin-actions";
import {revokeAtlasUserSessions as action16} from "@/app/(app)/atlas/admin-actions";
import {issueAtlasUserRecovery as action17} from "@/app/(app)/atlas/admin-actions";
import {createAtlasStaff as action18} from "@/app/(app)/atlas/admin-actions";
import {updateAtlasStaff as action19} from "@/app/(app)/atlas/admin-actions";
import {saveAtlasStaffProfile as action20} from "@/app/(app)/atlas/admin-actions";
import {issueAtlasStaffRecovery as action21} from "@/app/(app)/atlas/admin-actions";
import {archiveAtlasCompany as action22} from "@/app/(app)/atlas/admin-actions";
import {saveAtlasCompanyProfile as action23} from "@/app/(app)/atlas/admin-actions";
import {saveAtlasCompanyBrand as action24} from "@/app/(app)/atlas/admin-actions";
import {requestGuardianSweep as action25} from "@/app/(app)/atlas/guardian/actions";
import {updateGuardianIssue as action26} from "@/app/(app)/atlas/guardian/actions";
import {importCompanySetup as action27} from "@/app/(app)/atlas/setup-actions";
import {createCompanyUser as action28} from "@/app/(app)/atlas/setup-actions";
import {setCompanyUserStatus as action29} from "@/app/(app)/atlas/setup-actions";
import {postMessage as action30} from "@/app/(app)/chat/actions";
import {searchChatPeople as action31} from "@/app/(app)/chat/actions";
import {openChat as action32} from "@/app/(app)/chat/actions";
import {openDirectChat as action33} from "@/app/(app)/chat/actions";
import {searchChatRecords as action34} from "@/app/(app)/chat/actions";
import {sendChat as action35} from "@/app/(app)/chat/actions";
import {chatSnapshot as action36} from "@/app/(app)/chat/actions";
import {createDealContract as action37} from "@/app/(app)/crm/contracts/actions";
import {updateValueFormAction as action38} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {updateCloseDateFormAction as action39} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {setNextActionFormAction as action40} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {setForecastCategoryFormAction as action41} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {winFormAction as action42} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {loseFormAction as action43} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addStakeholderFormAction as action44} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addMilestoneFormAction as action45} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {toggleMilestoneFormAction as action46} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {logOpportunityActivityFormAction as action47} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addDealAction as action48} from "@/app/(app)/crm/pipeline/actions";
import {qualifyFormAction as action49} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {disqualifyFormAction as action50} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {nurtureFormAction as action51} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {logProspectActivityFormAction as action52} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {assignProspectFormAction as action53} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {assignProspectTaskFormAction as action54} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {convertProspectFormAction as action55} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {pinReportToDashboard as action56} from "@/app/(app)/crm/reports/actions";
import {createContactFormAction as action57} from "@/app/(app)/customers/[partyId]/actions";
import {updateContactFormAction as action58} from "@/app/(app)/customers/[partyId]/actions";
import {deleteContactFormAction as action59} from "@/app/(app)/customers/[partyId]/actions";
import {createAddressFormAction as action60} from "@/app/(app)/customers/[partyId]/actions";
import {createTaxRegistrationFormAction as action61} from "@/app/(app)/customers/[partyId]/actions";
import {markTaxVerifiedFormAction as action62} from "@/app/(app)/customers/[partyId]/actions";
import {createBankAccountFormAction as action63} from "@/app/(app)/customers/[partyId]/actions";
import {createDirectDebitFormAction as action64} from "@/app/(app)/customers/[partyId]/actions";
import {cancelDirectDebitFormAction as action65} from "@/app/(app)/customers/[partyId]/actions";
import {updateCreditLimitFormAction as action66} from "@/app/(app)/customers/[partyId]/actions";
import {toggleCreditHoldFormAction as action67} from "@/app/(app)/customers/[partyId]/actions";
import {createNoteFormAction as action68} from "@/app/(app)/customers/[partyId]/actions";
import {updateStatusFormAction as action69} from "@/app/(app)/customers/[partyId]/actions";
import {archiveCustomerFormAction as action70} from "@/app/(app)/customers/[partyId]/actions";
import {unarchiveCustomerFormAction as action71} from "@/app/(app)/customers/[partyId]/actions";
import {deleteCustomerFormAction as action72} from "@/app/(app)/customers/[partyId]/actions";
import {createKpi as action73} from "@/app/(app)/kpis/actions";
import {saveGoal as action74} from "@/app/(app)/kpis/actions";
import {updateKpi as action75} from "@/app/(app)/kpis/actions";
import {recordProgress as action76} from "@/app/(app)/kpis/actions";
import {closeGoal as action77} from "@/app/(app)/kpis/actions";
import {addPlanGoal as action78} from "@/app/(app)/kpis/actions";
import {closePlan as action79} from "@/app/(app)/kpis/actions";
import {commentOnPlan as action80} from "@/app/(app)/kpis/actions";
import {syncDemandAction as action81} from "@/app/(app)/logistics/actions";
import {restoreDeliveryAction as action82} from "@/app/(app)/logistics/actions";
import {releaseAction as action83} from "@/app/(app)/logistics/actions";
import {allocateAction as action84} from "@/app/(app)/logistics/actions";
import {directShipAction as action85} from "@/app/(app)/logistics/actions";
import {groupAction as action86} from "@/app/(app)/logistics/actions";
import {scanAction as action87} from "@/app/(app)/logistics/actions";
import {lotAction as action88} from "@/app/(app)/logistics/actions";
import {serialAction as action89} from "@/app/(app)/logistics/actions";
import {shortAction as action90} from "@/app/(app)/logistics/actions";
import {completeWorkAction as action91} from "@/app/(app)/logistics/actions";
import {claimAction as action92} from "@/app/(app)/logistics/actions";
import {shipFromPickAction as action93} from "@/app/(app)/logistics/actions";
import {packageAction as action94} from "@/app/(app)/logistics/actions";
import {weightAction as action95} from "@/app/(app)/logistics/actions";
import {stageAction as action96} from "@/app/(app)/logistics/actions";
import {labelAction as action97} from "@/app/(app)/logistics/actions";
import {dispatchAction as action98} from "@/app/(app)/logistics/actions";
import {trackingAction as action99} from "@/app/(app)/logistics/actions";
import {deliverAction as action100} from "@/app/(app)/logistics/actions";
import {loadCreateAction as action101} from "@/app/(app)/logistics/actions";
import {loadScanAction as action102} from "@/app/(app)/logistics/actions";
import {departAction as action103} from "@/app/(app)/logistics/actions";
import {expectAction as action104} from "@/app/(app)/logistics/actions";
import {receiveLineAction as action105} from "@/app/(app)/logistics/actions";
import {putAwayAction as action106} from "@/app/(app)/logistics/actions";
import {completeReceiptAction as action107} from "@/app/(app)/logistics/actions";
import {transferAction as action108} from "@/app/(app)/logistics/actions";
import {transferReceiveAction as action109} from "@/app/(app)/logistics/actions";
import {returnRequestAction as action110} from "@/app/(app)/logistics/actions";
import {authoriseReturnAction as action111} from "@/app/(app)/logistics/actions";
import {receiveReturnAction as action112} from "@/app/(app)/logistics/actions";
import {inspectAction as action113} from "@/app/(app)/logistics/actions";
import {closeReturnAction as action114} from "@/app/(app)/logistics/actions";
import {assignEquipmentAction as action115} from "@/app/(app)/logistics/actions";
import {packUnitAction as action116} from "@/app/(app)/logistics/actions";
import {saveHandlingTypeAction as action117} from "@/app/(app)/logistics/actions";
import {retireHandlingTypeAction as action118} from "@/app/(app)/logistics/actions";
import {removeHandlingTypeAction as action119} from "@/app/(app)/logistics/actions";
import {policyAction as action120} from "@/app/(app)/logistics/actions";
import {runMrpAction as action121} from "@/app/(app)/manufacturing/plan/actions";
import {firmSuggestionAction as action122} from "@/app/(app)/manufacturing/plan/actions";
import {dismissSuggestionAction as action123} from "@/app/(app)/manufacturing/plan/actions";
import {setForecastAction as action124} from "@/app/(app)/manufacturing/plan/actions";
import {deleteForecastAction as action125} from "@/app/(app)/manufacturing/plan/actions";
import {runMrpAction as action126} from "@/app/(app)/manufacturing/planning/actions";
import {firmPlannedOrderAction as action127} from "@/app/(app)/manufacturing/planning/actions";
import {dismissPlannedOrderAction as action128} from "@/app/(app)/manufacturing/planning/actions";
import {runMrpForm as action129} from "@/app/(app)/manufacturing/planning/form-actions";
import {firmPlannedOrderForm as action130} from "@/app/(app)/manufacturing/planning/form-actions";
import {dismissPlannedOrderForm as action131} from "@/app/(app)/manufacturing/planning/form-actions";
import {raiseProductionOrderAction as action132} from "@/app/(app)/manufacturing/produce/actions";
import {previewMoveAction as action133} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {commitMoveAction as action134} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {toggleLockAction as action135} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {saveShiftAction as action136} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {deleteShiftAction as action137} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {startAction as action138} from "@/app/(app)/manufacturing/shop-floor/actions";
import {pauseAction as action139} from "@/app/(app)/manufacturing/shop-floor/actions";
import {completeAction as action140} from "@/app/(app)/manufacturing/shop-floor/actions";
import {loadNotices as action141} from "@/app/(app)/notices/actions";
import {clearNotice as action142} from "@/app/(app)/notices/actions";
import {clearNotices as action143} from "@/app/(app)/notices/actions";
import {createPayrollRun as action144} from "@/app/(app)/payroll/actions";
import {updatePayslipDeductions as action145} from "@/app/(app)/payroll/actions";
import {finalisePayrollRun as action146} from "@/app/(app)/payroll/actions";
import {markPayrollRunPaid as action147} from "@/app/(app)/payroll/actions";
import {savePayrollSettings as action148} from "@/app/(app)/payroll/actions";
import {issueP45 as action149} from "@/app/(app)/payroll/actions";
import {issueP60 as action150} from "@/app/(app)/payroll/actions";
import {logAbsence as action151} from "@/app/(app)/people/absence/actions";
import {requestLeave as action152} from "@/app/(app)/people/absence/actions";
import {cancelOwnLeave as action153} from "@/app/(app)/people/absence/actions";
import {approveLeaveRequest as action154} from "@/app/(app)/people/absence/actions";
import {setLeaveAllowance as action155} from "@/app/(app)/people/absence/actions";
import {rejectLeaveRequest as action156} from "@/app/(app)/people/absence/actions";
import {createEmployee as action157} from "@/app/(app)/people/actions";
import {changeEmployeeStatus as action158} from "@/app/(app)/people/actions";
import {updateEmployeeProfile as action159} from "@/app/(app)/people/actions";
import {updateOwnEmployeeDetails as action160} from "@/app/(app)/people/actions";
import {addEmployeeDocument as action161} from "@/app/(app)/people/actions";
import {linkEmployeeToUser as action162} from "@/app/(app)/people/actions";
import {completeEmployeeTask as action163} from "@/app/(app)/people/actions";
import {addEmployeeTask as action164} from "@/app/(app)/people/actions";
import {updateEmployeeContact as action165} from "@/app/(app)/people/actions";
import {updateEmployeeTask as action166} from "@/app/(app)/people/actions";
import {scheduleAppraisal as action167} from "@/app/(app)/people/appraisals/actions";
import {completeAppraisal as action168} from "@/app/(app)/people/appraisals/actions";
import {getConductDesk as action169} from "@/app/(app)/people/conduct/actions";
import {getMyConduct as action170} from "@/app/(app)/people/conduct/actions";
import {getPlan as action171} from "@/app/(app)/people/conduct/actions";
import {getCase as action172} from "@/app/(app)/people/conduct/actions";
import {conductChoices as action173} from "@/app/(app)/people/conduct/actions";
import {savePlan as action174} from "@/app/(app)/people/conduct/actions";
import {addPlanReview as action175} from "@/app/(app)/people/conduct/actions";
import {commentOnPlan as action176} from "@/app/(app)/people/conduct/actions";
import {saveCase as action177} from "@/app/(app)/people/conduct/actions";
import {respondToCase as action178} from "@/app/(app)/people/conduct/actions";
import {addCaseEvent as action179} from "@/app/(app)/people/conduct/actions";
import {submitExpenseClaim as action180} from "@/app/(app)/people/expenses/actions";
import {approveExpenseClaim as action181} from "@/app/(app)/people/expenses/actions";
import {rejectExpenseClaim as action182} from "@/app/(app)/people/expenses/actions";
import {scheduleOneToOne as action183} from "@/app/(app)/people/one-to-ones/actions";
import {completeOneToOne as action184} from "@/app/(app)/people/one-to-ones/actions";
import {listPolicies as action185} from "@/app/(app)/people/policies/actions";
import {publishPolicy as action186} from "@/app/(app)/people/policies/actions";
import {archivePolicy as action187} from "@/app/(app)/people/policies/actions";
import {openPolicy as action188} from "@/app/(app)/people/policies/actions";
import {createShift as action189} from "@/app/(app)/people/rotas/actions";
import {changeShiftStatus as action190} from "@/app/(app)/people/rotas/actions";
import {getMyHR as action191} from "@/app/(app)/people/self-service";
import {getMyTeam as action192} from "@/app/(app)/people/self-service";
import {getTeamEmployee as action193} from "@/app/(app)/people/self-service";
import {addPrivateNote as action194} from "@/app/(app)/people/self-service";
import {updateWorkingPattern as action195} from "@/app/(app)/people/self-service";
import {updateHrSettings as action196} from "@/app/(app)/people/settings/actions";
import {createAppraisalTemplate as action197} from "@/app/(app)/people/settings/actions";
import {toggleAppraisalTemplateActive as action198} from "@/app/(app)/people/settings/actions";
import {createOneToOneTemplate as action199} from "@/app/(app)/people/settings/actions";
import {toggleOneToOneTemplateActive as action200} from "@/app/(app)/people/settings/actions";
import {getTimesheetContext as action201} from "@/app/(app)/people/timesheets/actions";
import {saveTimesheet as action202} from "@/app/(app)/people/timesheets/actions";
import {reviewTimesheet as action203} from "@/app/(app)/people/timesheets/actions";
import {createPriceList as action204} from "@/app/(app)/pricing/actions";
import {savePriceEntry as action205} from "@/app/(app)/pricing/actions";
import {saveRule as action206} from "@/app/(app)/pricing/actions";
import {setRuleActive as action207} from "@/app/(app)/pricing/actions";
import {updatePriceBasis as action208} from "@/app/(app)/pricing/actions";
import {renamePriceList as action209} from "@/app/(app)/pricing/actions";
import {assignPriceListCustomers as action210} from "@/app/(app)/pricing/actions";
import {checkSalesPrice as action211} from "@/app/(app)/pricing/actions";
import {assignPriceList as action212} from "@/app/(app)/pricing/actions";
import {previewPriceCsv as action213} from "@/app/(app)/pricing/actions";
import {applyPriceCsv as action214} from "@/app/(app)/pricing/actions";
import {saveAgreement as action215} from "@/app/(app)/pricing/actions";
import {saveAgreementPrice as action216} from "@/app/(app)/pricing/actions";
import {removeAgreementPrice as action217} from "@/app/(app)/pricing/actions";
import {previewAgreementCsv as action218} from "@/app/(app)/pricing/actions";
import {applyAgreementCsv as action219} from "@/app/(app)/pricing/actions";
import {saveProduct as action220} from "@/app/(app)/products/actions";
import {saveProductRecord as action221} from "@/app/(app)/products/actions";
import {saveCategory as action222} from "@/app/(app)/products/actions";
import {retireCategory as action223} from "@/app/(app)/products/actions";
import {addStandardCategories as action224} from "@/app/(app)/products/actions";
import {savePack as action225} from "@/app/(app)/products/actions";
import {saveLinks as action226} from "@/app/(app)/products/actions";
import {saveMeasures as action227} from "@/app/(app)/products/actions";
import {saveProfile as action228} from "@/app/(app)/profile/actions";
import {loadAssignedWork as action229} from "@/app/(app)/profile/work";
import {createProject as action230} from "@/app/(app)/projects/actions";
import {changeProjectStatus as action231} from "@/app/(app)/projects/actions";
import {editProject as action232} from "@/app/(app)/projects/actions";
import {setProjectMember as action233} from "@/app/(app)/projects/actions";
import {archiveProject as action234} from "@/app/(app)/projects/actions";
import {createTask as action235} from "@/app/(app)/projects/actions";
import {changeTaskStatus as action236} from "@/app/(app)/projects/actions";
import {editTask as action237} from "@/app/(app)/projects/actions";
import {checklistItem as action238} from "@/app/(app)/projects/actions";
import {addDependency as action239} from "@/app/(app)/projects/actions";
import {createMeeting as action240} from "@/app/(app)/projects/actions";
import {createDocument as action241} from "@/app/(app)/projects/actions";
import {editDocument as action242} from "@/app/(app)/projects/actions";
import {addComment as action243} from "@/app/(app)/projects/actions";
import {createMilestone as action244} from "@/app/(app)/projects/actions";
import {publishUpdate as action245} from "@/app/(app)/projects/actions";
import {createDecision as action246} from "@/app/(app)/projects/actions";
import {decide as action247} from "@/app/(app)/projects/actions";
import {createRisk as action248} from "@/app/(app)/projects/actions";
import {closeRisk as action249} from "@/app/(app)/projects/actions";
import {requestApproval as action250} from "@/app/(app)/projects/actions";
import {respondApproval as action251} from "@/app/(app)/projects/actions";
import {submitRequest as action252} from "@/app/(app)/projects/actions";
import {triageRequest as action253} from "@/app/(app)/projects/actions";
import {logTime as action254} from "@/app/(app)/projects/actions";
import {planToday as action255} from "@/app/(app)/projects/actions";
import {updateInbox as action256} from "@/app/(app)/projects/actions";
import {saveView as action257} from "@/app/(app)/projects/actions";
import {createPortfolio as action258} from "@/app/(app)/projects/actions";
import {createBaseline as action259} from "@/app/(app)/projects/actions";
import {setBudget as action260} from "@/app/(app)/projects/actions";
import {linkWork as action261} from "@/app/(app)/projects/actions";
import {getProjectActivity as action262} from "@/app/(app)/projects/actions";
import {createAutomation as action263} from "@/app/(app)/projects/actions";
import {toggleAutomation as action264} from "@/app/(app)/projects/actions";
import {saveProjectTemplate as action265} from "@/app/(app)/projects/actions";
import {useProjectTemplate as action266} from "@/app/(app)/projects/actions";
import {startTimer as action267} from "@/app/(app)/projects/actions";
import {stopTimer as action268} from "@/app/(app)/projects/actions";
import {projectPreference as action269} from "@/app/(app)/projects/actions";
import {uploadProjectFile as action270} from "@/app/(app)/projects/actions";
import {readProjectFile as action271} from "@/app/(app)/projects/actions";
import {createProperty as action272} from "@/app/(app)/projects/actions";
import {setProperty as action273} from "@/app/(app)/projects/actions";
import {restoreDocument as action274} from "@/app/(app)/projects/actions";
import {createTaskFromDocument as action275} from "@/app/(app)/projects/actions";
import {discardTimer as action276} from "@/app/(app)/projects/actions";
import {completeMilestone as action277} from "@/app/(app)/projects/actions";
import {resolveComment as action278} from "@/app/(app)/projects/actions";
import {getProjectWorkload as action279} from "@/app/(app)/projects/actions";
import {newContractAction as action280} from "@/app/(app)/sales/contracts/actions";
import {resendContractAction as action281} from "@/app/(app)/sales/contracts/actions";
import {deleteContractAction as action282} from "@/app/(app)/sales/contracts/actions";
import {createOrderForm as action283} from "@/app/(app)/sales/orders/actions";
import {addLineForm as action284} from "@/app/(app)/sales/orders/actions";
import {removeLineForm as action285} from "@/app/(app)/sales/orders/actions";
import {confirmOrderForm as action286} from "@/app/(app)/sales/orders/actions";
import {updateOrderForm as action287} from "@/app/(app)/sales/orders/actions";
import {chooseOrderAddresses as action288} from "@/app/(app)/sales/orders/actions";
import {addHoldForm as action289} from "@/app/(app)/sales/orders/actions";
import {releaseHoldForm as action290} from "@/app/(app)/sales/orders/actions";
import {approveOrderForm as action291} from "@/app/(app)/sales/orders/actions";
import {cancelOrderForm as action292} from "@/app/(app)/sales/orders/actions";
import {saveOrderHashtagsForm as action293} from "@/app/(app)/sales/orders/actions";
import {restoreCancelledOrderForm as action294} from "@/app/(app)/sales/orders/actions";
import {returnOrderToQuoteForm as action295} from "@/app/(app)/sales/orders/actions";
import {scheduleOrderDelivery as action296} from "@/app/(app)/sales/orders/actions";
import {rejectOrderApproval as action297} from "@/app/(app)/sales/orders/actions";
import {deleteOrderForm as action298} from "@/app/(app)/sales/orders/actions";
import {createQuote as action299} from "@/app/(app)/sales/quotes/actions";
import {deleteQuoteForm as action300} from "@/app/(app)/sales/quotes/actions";
import {saveCreationPolicy as action301} from "@/app/(app)/sales/settings/actions";
import {saveSiteAction as action302} from "@/app/(app)/sales/sites/actions";
import {setDocumentSiteAction as action303} from "@/app/(app)/sales/sites/actions";
import {getSchedule as action304} from "@/app/(app)/scheduling/actions";
import {createBulkShifts as action305} from "@/app/(app)/scheduling/actions";
import {setScheduledShift as action306} from "@/app/(app)/scheduling/actions";
import {completeShiftTask as action307} from "@/app/(app)/scheduling/actions";
import {editScheduledShift as action308} from "@/app/(app)/scheduling/actions";
import {publishWeekShifts as action309} from "@/app/(app)/scheduling/actions";
import {saveHoursBudget as action310} from "@/app/(app)/scheduling/actions";
import {getTeamPlan as action311} from "@/app/(app)/scheduling/actions";
import {getPersonSchedule as action312} from "@/app/(app)/scheduling/actions";
import {saveWorkType as action313} from "@/app/(app)/scheduling/actions";
import {archiveWorkType as action314} from "@/app/(app)/scheduling/actions";
import {saveDemand as action315} from "@/app/(app)/scheduling/actions";
import {saveBusyRule as action316} from "@/app/(app)/scheduling/actions";
import {removeBusyRule as action317} from "@/app/(app)/scheduling/actions";
import {fillTeamMonth as action318} from "@/app/(app)/scheduling/actions";
import {replanCover as action319} from "@/app/(app)/scheduling/actions";
import {publishMonth as action320} from "@/app/(app)/scheduling/actions";
import {saveShift as action321} from "@/app/(app)/scheduling/actions";
import {saveRole as action322} from "@/app/(app)/settings/actions";
import {saveMemberRoles as action323} from "@/app/(app)/settings/actions";
import {createUser as action324} from "@/app/(app)/settings/actions";
import {saveCompanyAccess as action325} from "@/app/(app)/settings/actions";
import {saveCompanyProfile as action326} from "@/app/(app)/settings/actions";
import {saveManagerPolicy as action327} from "@/app/(app)/settings/actions";
import {saveWorkspaceDetails as action328} from "@/app/(app)/settings/actions";
import {saveCompanyBrand as action329} from "@/app/(app)/settings/actions";
import {importCsv as action330} from "@/app/(app)/settings/imports/actions";
import {saveEmailAccount as action331} from "@/app/(app)/settings/it/actions";
import {verifyEmailAccount as action332} from "@/app/(app)/settings/it/actions";
import {sendTestEmail as action333} from "@/app/(app)/settings/it/actions";
import {makeDefaultAccount as action334} from "@/app/(app)/settings/it/actions";
import {setAccountActive as action335} from "@/app/(app)/settings/it/actions";
import {deleteEmailAccount as action336} from "@/app/(app)/settings/it/actions";
import {saveSocialAccount as action337} from "@/app/(app)/settings/it/actions";
import {deleteSocialAccount as action338} from "@/app/(app)/settings/it/actions";
import {checkSocialAccount as action339} from "@/app/(app)/settings/it/actions";
import {saveEmailTemplate as action340} from "@/app/(app)/settings/it/actions";
import {deleteEmailTemplate as action341} from "@/app/(app)/settings/it/actions";
import {checkInboxNow as action342} from "@/app/(app)/settings/it/actions";
import {saveDispatchDelivery as action343} from "@/app/(app)/settings/logistics/actions";
import {saveUserAccess as action344} from "@/app/(app)/settings/user-actions";
import {setUserStatus as action345} from "@/app/(app)/settings/user-actions";
import {revokeUserSessions as action346} from "@/app/(app)/settings/user-actions";
import {issuePasswordRecovery as action347} from "@/app/(app)/settings/user-actions";
import {createManagedUser as action348} from "@/app/(app)/settings/user-actions";
import {linkEmployeeProfile as action349} from "@/app/(app)/settings/user-actions";
import {createRole as action350} from "@/app/(app)/settings/user-actions";
import {saveManagementGroup as action351} from "@/app/(app)/settings/user-actions";
import {createWarehouse as action352} from "@/app/(app)/stock/actions";
import {adjustStock as action353} from "@/app/(app)/stock/actions";
import {savePlanningAction as action354} from "@/app/(app)/stock/actions";
import {makeFromForecastAction as action355} from "@/app/(app)/stock/actions";
import {transferStock as action356} from "@/app/(app)/stock/actions";
import {createSiteAction as action357} from "@/app/(app)/stock/actions";
import {createPlaceAction as action358} from "@/app/(app)/stock/actions";
import {assignSiteAction as action359} from "@/app/(app)/stock/actions";
import {addLocationAction as action360} from "@/app/(app)/stock/actions";
import {ensureLocationsAction as action361} from "@/app/(app)/stock/actions";
import {retireLocationAction as action362} from "@/app/(app)/stock/actions";
import {putOnLocationAction as action363} from "@/app/(app)/stock/actions";
import {moveLocatedAction as action364} from "@/app/(app)/stock/actions";
import {receiveMoveAction as action365} from "@/app/(app)/stock/actions";
import {saveTemplate as action366} from "@/app/(app)/templates/actions";
import {archiveTemplate as action367} from "@/app/(app)/templates/actions";
import {generateTemplateDocument as action368} from "@/app/(app)/templates/actions";
import {delegateApprovals as action369} from "@/core/approvals/actions";
import {loginAction as action370} from "@/core/auth/actions";
import {logoutAction as action371} from "@/core/auth/actions";
import {completePasswordRecovery as action372} from "@/core/auth/security-actions";
import {changeOwnPassword as action373} from "@/core/auth/security-actions";
import {signOutOtherSessions as action374} from "@/core/auth/security-actions";
import {createContract as action375} from "@/core/contracts/actions";
import {sendContract as action376} from "@/core/contracts/actions";
import {shareContractLink as action377} from "@/core/contracts/actions";
import {updateDraftContract as action378} from "@/core/contracts/actions";
import {revokeContract as action379} from "@/core/contracts/actions";
import {deleteContract as action380} from "@/core/contracts/actions";
import {signContract as action381} from "@/core/contracts/actions";
import {returnSignedContract as action382} from "@/core/contracts/actions";
import {reviewContractReturn as action383} from "@/core/contracts/actions";
import {declineContract as action384} from "@/core/contracts/actions";
import {loadPublicContract as action385} from "@/core/contracts/actions";
import {loadPublicContractFile as action386} from "@/core/contracts/actions";
import {checkForDuplicatesAction as action387} from "@/core/customers/actions";
import {createCustomerAction as action388} from "@/core/customers/actions";
import {createCustomer as action389} from "@/core/customers/commands";
import {updateCustomerStatus as action390} from "@/core/customers/commands";
import {archiveCustomer as action391} from "@/core/customers/commands";
import {unarchiveCustomer as action392} from "@/core/customers/commands";
import {deleteCustomer as action393} from "@/core/customers/commands";
import {createContact as action394} from "@/core/customers/commands";
import {updateContact as action395} from "@/core/customers/commands";
import {deleteContact as action396} from "@/core/customers/commands";
import {createAddress as action397} from "@/core/customers/commands";
import {updateCommercialSettings as action398} from "@/core/customers/commands";
import {updateCreditLimit as action399} from "@/core/customers/commands";
import {setCreditHold as action400} from "@/core/customers/commands";
import {setPaymentTerm as action401} from "@/core/customers/commands";
import {createTaxRegistration as action402} from "@/core/customers/commands";
import {markTaxRegistrationManuallyVerified as action403} from "@/core/customers/commands";
import {createBankAccount as action404} from "@/core/customers/commands";
import {revealBankAccount as action405} from "@/core/customers/commands";
import {createDirectDebitMandate as action406} from "@/core/customers/commands";
import {cancelDirectDebitMandate as action407} from "@/core/customers/commands";
import {createNote as action408} from "@/core/customers/commands";
import {saveCustomerHashtags as action409} from "@/core/customers/commands";
import {updateCustomerDetails as action410} from "@/core/customers/commands";
import {updateAddress as action411} from "@/core/customers/commands";
import {archiveAddress as action412} from "@/core/customers/commands";
import {saveOrderingPreferences as action413} from "@/core/customers/commercial-actions";
import {setCustomerParent as action414} from "@/core/customers/hierarchy-actions";
import {placeCustomer as action415} from "@/core/customers/hierarchy-actions";
import {moveCustomer as action416} from "@/core/customers/hierarchy-actions";
import {setContactReportsTo as action417} from "@/core/customers/hierarchy-actions";
import {saveCustomerTradingLink as action418} from "@/core/customers/trading-actions";
import {setInvoiceAccount as action419} from "@/core/customers/trading-actions";
import {archiveCustomerTradingLink as action420} from "@/core/customers/trading-actions";
import {requestSalesInvoice as action421} from "@/core/finance/actions";
import {createWork as action422} from "@/core/service-work/actions";
import {updateWork as action423} from "@/core/service-work/actions";
import {commentWork as action424} from "@/core/service-work/actions";
import {watchWork as action425} from "@/core/service-work/actions";
import {mergeWork as action426} from "@/core/service-work/actions";
import {requestWorkApproval as action427} from "@/core/service-work/actions";
import {decideWorkApproval as action428} from "@/core/service-work/actions";
import {saveDeskQueue as action429} from "@/core/service-work/actions";
import {changeDeskMember as action430} from "@/core/service-work/actions";
import {attachServiceFile as action431} from "@/core/service-work/file-actions";
import {saveKnowledge as action432} from "@/core/service-work/knowledge";
import {createWorkTeam as action433} from "@/core/teams/actions";
import {loadAuditBoard as action434} from "@/modules/audit/services/actions";
import {exportAuditReport as action435} from "@/modules/audit/services/actions";
import {loadEcho as action436} from "@/modules/audit/services/actions";
import {postEchoNote as action437} from "@/modules/audit/services/actions";
import {loadEchoInbox as action438} from "@/modules/audit/services/actions";
import {loadAuditAccess as action439} from "@/modules/audit/services/actions";
import {saveAuditOwnActivity as action440} from "@/modules/audit/services/actions";
import {saveAuditAreas as action441} from "@/modules/audit/services/actions";
import {saveAutomation as action442} from "@/modules/automations/services/actions";
import {setAutomationEnabled as action443} from "@/modules/automations/services/actions";
import {deleteAutomation as action444} from "@/modules/automations/services/actions";
import {testOnPastEvent as action445} from "@/modules/automations/services/actions";
import {runNow as action446} from "@/modules/automations/services/actions";
import {logActivity as action447} from "@/modules/crm/services/activities";
import {completeActivity as action448} from "@/modules/crm/services/activities";
import {acceptMarketingHandoff as action449} from "@/modules/crm/services/marketing-handoff";
import {createOpportunity as action450} from "@/modules/crm/services/opportunities";
import {moveOpportunityStage as action451} from "@/modules/crm/services/opportunities";
import {updateOpportunityValue as action452} from "@/modules/crm/services/opportunities";
import {updateOpportunityCloseDate as action453} from "@/modules/crm/services/opportunities";
import {setOpportunityForecastCategory as action454} from "@/modules/crm/services/opportunities";
import {setOpportunityNextAction as action455} from "@/modules/crm/services/opportunities";
import {winOpportunity as action456} from "@/modules/crm/services/opportunities";
import {loseOpportunity as action457} from "@/modules/crm/services/opportunities";
import {addStakeholder as action458} from "@/modules/crm/services/opportunities";
import {addMilestone as action459} from "@/modules/crm/services/opportunities";
import {toggleMilestone as action460} from "@/modules/crm/services/opportunities";
import {checkProspectDuplicatesAction as action461} from "@/modules/crm/services/prospects";
import {createProspect as action462} from "@/modules/crm/services/prospects";
import {assignProspect as action463} from "@/modules/crm/services/prospects";
import {setProspectLifecycleStage as action464} from "@/modules/crm/services/prospects";
import {convertProspect as action465} from "@/modules/crm/services/prospects";
import {createIndustry as action466} from "@/modules/crm/services/prospects";
import {saveProspectGrouping as action467} from "@/modules/crm/services/prospects";
import {createSalesProject as action468} from "@/modules/crm/services/sales-projects-commands";
import {createSalesProjectFormAction as action469} from "@/modules/crm/services/sales-projects-commands";
import {saveSalesProjectAction as action470} from "@/modules/crm/services/sales-projects-commands";
import {saveNextActionAction as action471} from "@/modules/crm/services/sales-projects-commands";
import {addProjectOrganisationAction as action472} from "@/modules/crm/services/sales-projects-commands";
import {removeProjectOrganisationAction as action473} from "@/modules/crm/services/sales-projects-commands";
import {makePrimaryOrganisationAction as action474} from "@/modules/crm/services/sales-projects-commands";
import {addProjectStakeholderAction as action475} from "@/modules/crm/services/sales-projects-commands";
import {removeProjectStakeholderAction as action476} from "@/modules/crm/services/sales-projects-commands";
import {setDocumentSalesProjectAction as action477} from "@/modules/crm/services/sales-projects-commands";
import {deleteSalesProjectAction as action478} from "@/modules/crm/services/sales-projects-commands";
import {saveSurvey as action479} from "@/modules/csat/services/actions";
import {createSurveyFromTemplate as action480} from "@/modules/csat/services/actions";
import {setSurveyActive as action481} from "@/modules/csat/services/actions";
import {deleteSurvey as action482} from "@/modules/csat/services/actions";
import {recordCsatScore as action483} from "@/modules/csat/services/actions";
import {recordCsatComment as action484} from "@/modules/csat/services/actions";
import {importFinanceStatement as action485} from "@/modules/finance/services/banking";
import {reconcileFinanceStatement as action486} from "@/modules/finance/services/banking";
import {financeReconciliationForm as action487} from "@/modules/finance/services/banking";
import {getFinanceReconciliation as action488} from "@/modules/finance/services/banking";
import {importFinanceStatementForm as action489} from "@/modules/finance/services/banking";
import {getFinanceCollections as action490} from "@/modules/finance/services/collections";
import {recordFinanceCollection as action491} from "@/modules/finance/services/collections";
import {setupFinance as action492} from "@/modules/finance/services/commands";
import {createFinanceDocument as action493} from "@/modules/finance/services/commands";
import {submitFinanceDocument as action494} from "@/modules/finance/services/commands";
import {saveApprovalPolicy as action495} from "@/modules/finance/services/commands";
import {decideFinanceApproval as action496} from "@/modules/finance/services/commands";
import {createPurchaseOrder as action497} from "@/modules/finance/services/commands";
import {raiseServiceCredit as action498} from "@/modules/finance/services/commands";
import {postFinanceDocument as action499} from "@/modules/finance/services/commands";
import {recordGoodsReceipt as action500} from "@/modules/finance/services/commands";
import {onboardSupplier as action501} from "@/modules/finance/services/commands";
import {approveSupplier as action502} from "@/modules/finance/services/commands";
import {requestSupplierBankChange as action503} from "@/modules/finance/services/commands";
import {verifySupplierBank as action504} from "@/modules/finance/services/commands";
import {createFinanceBank as action505} from "@/modules/finance/services/commands";
import {importBankTransactions as action506} from "@/modules/finance/services/commands";
import {allocateBankTransaction as action507} from "@/modules/finance/services/commands";
import {createPaymentRun as action508} from "@/modules/finance/services/commands";
import {approvePaymentRun as action509} from "@/modules/finance/services/commands";
import {createManualJournal as action510} from "@/modules/finance/services/commands";
import {approveManualJournal as action511} from "@/modules/finance/services/commands";
import {reverseJournal as action512} from "@/modules/finance/services/commands";
import {setFinancePeriodState as action513} from "@/modules/finance/services/commands";
import {saveFinanceBudget as action514} from "@/modules/finance/services/commands";
import {saveFinanceAsset as action515} from "@/modules/finance/services/commands";
import {postAssetDepreciation as action516} from "@/modules/finance/services/commands";
import {completeCloseTask as action517} from "@/modules/finance/services/commands";
import {saveFinanceContract as action518} from "@/modules/finance/services/commands";
import {saveFinanceScenario as action519} from "@/modules/finance/services/commands";
import {receiptForm as action520} from "@/modules/finance/services/commands";
import {journalForm as action521} from "@/modules/finance/services/commands";
import {statementForm as action522} from "@/modules/finance/services/commands";
import {allocationForm as action523} from "@/modules/finance/services/commands";
import {paymentRunForm as action524} from "@/modules/finance/services/commands";
import {policyForm as action525} from "@/modules/finance/services/commands";
import {scenarioForm as action526} from "@/modules/finance/services/commands";
import {uploadFinanceAttachment as action527} from "@/modules/finance/services/commands";
import {generateSalesInvoice as action528} from "@/modules/finance/services/commands";
import {generateInvoiceAdjustment as action529} from "@/modules/finance/services/commands";
import {voidFinanceDraft as action530} from "@/modules/finance/services/commands";
import {getFinanceConfiguration as action531} from "@/modules/finance/services/configuration";
import {saveFinanceEntityDetails as action532} from "@/modules/finance/services/configuration";
import {saveFinanceAccount as action533} from "@/modules/finance/services/configuration";
import {saveFinanceDimension as action534} from "@/modules/finance/services/configuration";
import {createFinancePeriod as action535} from "@/modules/finance/services/configuration";
import {setFinancePeriodExceptions as action536} from "@/modules/finance/services/configuration";
import {requestFinancePeriodReopen as action537} from "@/modules/finance/services/configuration";
import {decideFinancePeriodReopen as action538} from "@/modules/finance/services/configuration";
import {getFinanceHome as action539} from "@/modules/finance/services/queries";
import {listFinanceDocuments as action540} from "@/modules/finance/services/queries";
import {getFinanceDocument as action541} from "@/modules/finance/services/queries";
import {getFinanceWorkspace as action542} from "@/modules/finance/services/queries";
import {financeChoices as action543} from "@/modules/finance/services/queries";
import {getBudgetPositions as action544} from "@/modules/finance/services/queries";
import {getInvoiceCashForecast as action545} from "@/modules/finance/services/queries";
import {getFinancialReport as action546} from "@/modules/finance/services/queries";
import {getFinanceCustomerContribution as action547} from "@/modules/finance/services/queries";
import {searchFinance as action548} from "@/modules/finance/services/queries";
import {getFinanceAttachment as action549} from "@/modules/finance/services/queries";
import {getSalesFinanceProjection as action550} from "@/modules/finance/services/queries";
import {getReceivingWarehouses as action551} from "@/modules/finance/services/queries";
import {getFinanceLedger as action552} from "@/modules/finance/services/reporting";
import {getFinanceJournalDetail as action553} from "@/modules/finance/services/reporting";
import {getFinanceSubledgerReconciliation as action554} from "@/modules/finance/services/reporting";
import {createProductionOrder as action555} from "@/modules/manufacturing/services/commands";
import {markOrderReady as action556} from "@/modules/manufacturing/services/commands";
import {releaseOrder as action557} from "@/modules/manufacturing/services/commands";
import {closeOrder as action558} from "@/modules/manufacturing/services/commands";
import {startWorkOrder as action559} from "@/modules/manufacturing/services/commands";
import {pauseWorkOrder as action560} from "@/modules/manufacturing/services/commands";
import {completeWorkOrder as action561} from "@/modules/manufacturing/services/commands";
import {listForecasts as action562} from "@/modules/manufacturing/services/forecast";
import {setForecast as action563} from "@/modules/manufacturing/services/forecast";
import {deleteForecast as action564} from "@/modules/manufacturing/services/forecast";
import {runMrp as action565} from "@/modules/manufacturing/services/mrp";
import {firmSuggestion as action566} from "@/modules/manufacturing/services/mrp";
import {dismissSuggestion as action567} from "@/modules/manufacturing/services/mrp";
import {latestPlan as action568} from "@/modules/manufacturing/services/mrp";
import {loadPlant as action569} from "@/modules/manufacturing/services/plant";
import {saveWorkCentre as action570} from "@/modules/manufacturing/services/plant";
import {saveMachine as action571} from "@/modules/manufacturing/services/plant";
import {retirePlantRecord as action572} from "@/modules/manufacturing/services/plant";
import {schedulePreview as action573} from "@/modules/manufacturing/services/scheduler";
import {rescheduleWorkOrder as action574} from "@/modules/manufacturing/services/scheduler";
import {setWorkOrderLock as action575} from "@/modules/manufacturing/services/scheduler";
import {listShifts as action576} from "@/modules/manufacturing/services/shifts";
import {saveShift as action577} from "@/modules/manufacturing/services/shifts";
import {deleteShift as action578} from "@/modules/manufacturing/services/shifts";
import {createCampaignAction as action579} from "@/modules/marketing/services/campaign-actions 2";
import {saveCampaignBriefAction as action580} from "@/modules/marketing/services/campaign-actions 2";
import {saveBudgetLineAction as action581} from "@/modules/marketing/services/campaign-actions 2";
import {deleteBudgetLineAction as action582} from "@/modules/marketing/services/campaign-actions 2";
import {saveActivityAction as action583} from "@/modules/marketing/services/campaign-actions 2";
import {setActivityStatusAction as action584} from "@/modules/marketing/services/campaign-actions 2";
import {deleteActivityAction as action585} from "@/modules/marketing/services/campaign-actions 2";
import {addPaidSpendAction as action586} from "@/modules/marketing/services/campaign-actions 2";
import {deletePaidSpendAction as action587} from "@/modules/marketing/services/campaign-actions 2";
import {createCampaignAction as action588} from "@/modules/marketing/services/campaign-actions";
import {saveCampaignBriefAction as action589} from "@/modules/marketing/services/campaign-actions";
import {saveBudgetLineAction as action590} from "@/modules/marketing/services/campaign-actions";
import {deleteBudgetLineAction as action591} from "@/modules/marketing/services/campaign-actions";
import {saveActivityAction as action592} from "@/modules/marketing/services/campaign-actions";
import {setActivityStatusAction as action593} from "@/modules/marketing/services/campaign-actions";
import {deleteActivityAction as action594} from "@/modules/marketing/services/campaign-actions";
import {addPaidSpendAction as action595} from "@/modules/marketing/services/campaign-actions";
import {deletePaidSpendAction as action596} from "@/modules/marketing/services/campaign-actions";
import {createCampaign as action597} from "@/modules/marketing/services/commands";
import {updateCampaign as action598} from "@/modules/marketing/services/commands";
import {createProfile as action599} from "@/modules/marketing/services/commands";
import {recordPermission as action600} from "@/modules/marketing/services/commands";
import {suppressProfile as action601} from "@/modules/marketing/services/commands";
import {createAudience as action602} from "@/modules/marketing/services/commands";
import {previewAudience as action603} from "@/modules/marketing/services/commands";
import {createContent as action604} from "@/modules/marketing/services/commands";
import {approveContent as action605} from "@/modules/marketing/services/commands";
import {createMessage as action606} from "@/modules/marketing/services/commands";
import {lockSend as action607} from "@/modules/marketing/services/commands";
import {cancelSend as action608} from "@/modules/marketing/services/commands";
import {ingestEvent as action609} from "@/modules/marketing/services/commands";
import {createJourney as action610} from "@/modules/marketing/services/commands";
import {publishJourney as action611} from "@/modules/marketing/services/commands";
import {reviseJourney as action612} from "@/modules/marketing/services/commands";
import {createProgram as action613} from "@/modules/marketing/services/commands";
import {createExperiment as action614} from "@/modules/marketing/services/commands";
import {leadFeedback as action615} from "@/modules/marketing/services/commands";
import {processJourneySteps as action616} from "@/modules/marketing/services/commands";
import {saveMarketingPlan as action617} from "@/modules/marketing/services/commands";
import {addPlanActivity as action618} from "@/modules/marketing/services/commands";
import {updatePlanActivity as action619} from "@/modules/marketing/services/commands";
import {addBudgetLine as action620} from "@/modules/marketing/services/commands";
import {submitBudgetToFinance as action621} from "@/modules/marketing/services/commands";
import {createJourneyMap as action622} from "@/modules/marketing/services/commands";
import {addJourneyStage as action623} from "@/modules/marketing/services/commands";
import {addJourneyTouch as action624} from "@/modules/marketing/services/commands";
import {saveSocialPost as action625} from "@/modules/marketing/services/social-actions";
import {deleteSocialPost as action626} from "@/modules/marketing/services/social-actions";
import {retrySocialPost as action627} from "@/modules/marketing/services/social-actions";
import {getApprovedExpenseSource as action628} from "@/modules/people/services/finance-expenses";
import {getPlanBuilder as action629} from "@/modules/plan/services/builder";
import {savePlanInput as action630} from "@/modules/plan/services/builder";
import {setPlanInputIncluded as action631} from "@/modules/plan/services/builder";
import {applyPlanInputs as action632} from "@/modules/plan/services/builder";
import {savePlanGrid as action633} from "@/modules/plan/services/builder";
import {removePlanMeasure as action634} from "@/modules/plan/services/builder";
import {createPlan as action635} from "@/modules/plan/services/commands";
import {saveCell as action636} from "@/modules/plan/services/commands";
import {addMeasure as action637} from "@/modules/plan/services/commands";
import {addAssumption as action638} from "@/modules/plan/services/commands";
import {addDriver as action639} from "@/modules/plan/services/commands";
import {addLink as action640} from "@/modules/plan/services/commands";
import {createScenario as action641} from "@/modules/plan/services/commands";
import {promoteScenario as action642} from "@/modules/plan/services/commands";
import {submitPlan as action643} from "@/modules/plan/services/commands";
import {approvePlan as action644} from "@/modules/plan/services/commands";
import {lockPlan as action645} from "@/modules/plan/services/commands";
import {addGoal as action646} from "@/modules/plan/services/commands";
import {addInitiative as action647} from "@/modules/plan/services/commands";
import {createProjectForInitiative as action648} from "@/modules/plan/services/commands";
import {addAction as action649} from "@/modules/plan/services/commands";
import {completeAction as action650} from "@/modules/plan/services/commands";
import {addRisk as action651} from "@/modules/plan/services/commands";
import {addDependency as action652} from "@/modules/plan/services/commands";
import {addDecision as action653} from "@/modules/plan/services/commands";
import {addComment as action654} from "@/modules/plan/services/commands";
import {addUpdate as action655} from "@/modules/plan/services/commands";
import {completeReview as action656} from "@/modules/plan/services/commands";
import {addReview as action657} from "@/modules/plan/services/commands";
import {distributeTargets as action658} from "@/modules/plan/services/commands";
import {importGrid as action659} from "@/modules/plan/services/commands";
import {sharePlan as action660} from "@/modules/plan/services/commands";
import {unsharePlan as action661} from "@/modules/plan/services/commands";
import {setPlanAudience as action662} from "@/modules/plan/services/commands";
import {addNote as action663} from "@/modules/plan/services/commands";
import {saveGoalProgress as action664} from "@/modules/plan/services/commands";
import {savePlanBrief as action665} from "@/modules/plan/services/commands";
import {listProductionPlans as action666} from "@/modules/planning/services/plans";
import {getPlanOptions as action667} from "@/modules/planning/services/plans";
import {getProductionPlan as action668} from "@/modules/planning/services/plans";
import {createProductionPlan as action669} from "@/modules/planning/services/plans";
import {addProductionPlanLine as action670} from "@/modules/planning/services/plans";
import {getAssignedPlanningWork as action671} from "@/modules/planning/services/plans";
import {getPlanningCoverage as action672} from "@/modules/planning/services/queries";
import {saveProductRecipe as action673} from "@/modules/products/services/make";
import {createSpecification as action674} from "@/modules/quality/services/commands";
import {setSpecificationStatus as action675} from "@/modules/quality/services/commands";
import {createControlPoint as action676} from "@/modules/quality/services/commands";
import {executeInspection as action677} from "@/modules/quality/services/commands";
import {releaseHold as action678} from "@/modules/quality/services/commands";
import {reportNcr as action679} from "@/modules/quality/services/commands";
import {updateNcrInvestigation as action680} from "@/modules/quality/services/commands";
import {addNcrAction as action681} from "@/modules/quality/services/commands";
import {updateNcrAction as action682} from "@/modules/quality/services/commands";
import {closeNcr as action683} from "@/modules/quality/services/commands";
import {saveSubstance as action684} from "@/modules/safety/services/assurance";
import {addSafetyDataSheet as action685} from "@/modules/safety/services/assurance";
import {saveCoshhAssessment as action686} from "@/modules/safety/services/assurance";
import {approveSubstance as action687} from "@/modules/safety/services/assurance";
import {saveCompetence as action688} from "@/modules/safety/services/assurance";
import {saveSafetyDocument as action689} from "@/modules/safety/services/assurance";
import {acknowledgeDocument as action690} from "@/modules/safety/services/assurance";
import {saveAudit as action691} from "@/modules/safety/services/assurance";
import {addAuditFinding as action692} from "@/modules/safety/services/assurance";
import {approveAudit as action693} from "@/modules/safety/services/assurance";
import {saveChange as action694} from "@/modules/safety/services/assurance";
import {advanceChange as action695} from "@/modules/safety/services/assurance";
import {linkSafetyRecord as action696} from "@/modules/safety/services/assurance";
import {saveSafetyProfile as action697} from "@/modules/safety/services/commands";
import {saveRiskMatrix as action698} from "@/modules/safety/services/commands";
import {createRisk as action699} from "@/modules/safety/services/commands";
import {addControl as action700} from "@/modules/safety/services/commands";
import {rateAssessment as action701} from "@/modules/safety/services/commands";
import {approveAssessment as action702} from "@/modules/safety/services/commands";
import {reviseAssessment as action703} from "@/modules/safety/services/commands";
import {requestRiskReview as action704} from "@/modules/safety/services/commands";
import {reportIncident as action705} from "@/modules/safety/services/commands";
import {saveImmediateControl as action706} from "@/modules/safety/services/commands";
import {openInvestigation as action707} from "@/modules/safety/services/commands";
import {addCause as action708} from "@/modules/safety/services/commands";
import {saveRootCause as action709} from "@/modules/safety/services/commands";
import {reviewRiddor as action710} from "@/modules/safety/services/commands";
import {createSafetyAction as action711} from "@/modules/safety/services/commands";
import {advanceAction as action712} from "@/modules/safety/services/commands";
import {verifyAction as action713} from "@/modules/safety/services/commands";
import {saveWorkplaceRecord as action714} from "@/modules/safety/services/commands";
import {createPermit as action715} from "@/modules/safety/services/control";
import {advancePermit as action716} from "@/modules/safety/services/control";
import {extendPermit as action717} from "@/modules/safety/services/control";
import {createIsolation as action718} from "@/modules/safety/services/control";
import {applyIsolationLock as action719} from "@/modules/safety/services/control";
import {verifyIsolation as action720} from "@/modules/safety/services/control";
import {clearIsolation as action721} from "@/modules/safety/services/control";
import {removeIsolationLock as action722} from "@/modules/safety/services/control";
import {placeSafetyHold as action723} from "@/modules/safety/services/control";
import {updateReturnToService as action724} from "@/modules/safety/services/control";
import {releaseSafetyHold as action725} from "@/modules/safety/services/control";
import {overrideSafetyHold as action726} from "@/modules/safety/services/control";
import {saveStatutoryCheck as action727} from "@/modules/safety/services/control";
import {completeInspection as action728} from "@/modules/safety/services/control";
import {createInspection as action729} from "@/modules/safety/services/control";
import {createSalesAddress as action730} from "@/modules/sales/services/address-actions";
import {createSalesCatalogueProduct as action731} from "@/modules/sales/services/catalogue-actions";
import {sendQuote as action732} from "@/modules/sales/services/commands";
import {changeQuoteStatus as action733} from "@/modules/sales/services/commands";
import {deleteQuote as action734} from "@/modules/sales/services/commands";
import {duplicateDocument as action735} from "@/modules/sales/services/commands";
import {saveQuoteTemplate as action736} from "@/modules/sales/services/commands";
import {createOrderFromQuote as action737} from "@/modules/sales/services/commands";
import {linkCommercialProject as action738} from "@/modules/sales/services/commercial";
import {openCallOffOrder as action739} from "@/modules/sales/services/commercial";
import {raiseCallOff as action740} from "@/modules/sales/services/commercial";
import {invoiceCallOffDelivery as action741} from "@/modules/sales/services/commercial";
import {deliverAndInvoiceCallOff as action742} from "@/modules/sales/services/commercial";
import {importSalescsv as action743} from "@/modules/sales/services/csv-import";
import {addDeliveryAddress as action744} from "@/modules/sales/services/delivery-address";
import {addInstaller as action745} from "@/modules/sales/services/delivery-address";
import {pricePartyId as action746} from "@/modules/sales/services/delivery-address";
import {linkOrderedFor as action747} from "@/modules/sales/services/delivery-address";
import {saveDocument as action748} from "@/modules/sales/services/documents";
import {saveInvoiceTemplate as action749} from "@/modules/sales/services/invoice-template-actions";
import {retireInvoiceTemplate as action750} from "@/modules/sales/services/invoice-template-actions";
import {attachCustomerInvoiceTemplate as action751} from "@/modules/sales/services/invoice-template-actions";
import {detachCustomerInvoiceTemplate as action752} from "@/modules/sales/services/invoice-template-actions";
import {createDraftOrder as action753} from "@/modules/sales/services/orders";
import {addOrderLine as action754} from "@/modules/sales/services/orders";
import {removeOrderLine as action755} from "@/modules/sales/services/orders";
import {updateDraftOrderFields as action756} from "@/modules/sales/services/orders";
import {confirmOrder as action757} from "@/modules/sales/services/orders";
import {decideApproval as action758} from "@/modules/sales/services/orders";
import {amendLineQuantity as action759} from "@/modules/sales/services/orders";
import {overrideLinePrice as action760} from "@/modules/sales/services/orders";
import {amendRequestedDate as action761} from "@/modules/sales/services/orders";
import {cancelOrder as action762} from "@/modules/sales/services/orders";
import {deleteOrder as action763} from "@/modules/sales/services/orders";
import {cancelLineRemaining as action764} from "@/modules/sales/services/orders";
import {addHold as action765} from "@/modules/sales/services/orders";
import {releaseHold as action766} from "@/modules/sales/services/orders";
import {redeemServiceRecovery as action767} from "@/modules/sales/services/recovery";
import {restoreCancelledOrder as action768} from "@/modules/sales/services/rewind";
import {returnOrderToQuote as action769} from "@/modules/sales/services/rewind";
import {saveOrderHashtags as action770} from "@/modules/sales/services/rewind";
import {saveSalesView as action771} from "@/modules/sales/services/saved-views";
import {archiveSalesView as action772} from "@/modules/sales/services/saved-views";
import {createCase as action773} from "@/modules/service/services/commands";
import {updateCase as action774} from "@/modules/service/services/commands";
import {assignCase as action775} from "@/modules/service/services/commands";
import {transitionCase as action776} from "@/modules/service/services/commands";
import {addCaseEntry as action777} from "@/modules/service/services/commands";
import {createDepartmentTicket as action778} from "@/modules/service/services/commands";
import {updateDepartmentTicket as action779} from "@/modules/service/services/commands";
import {createQueue as action780} from "@/modules/service/services/commands";
import {addQueueMember as action781} from "@/modules/service/services/commands";
import {linkCaseRecord as action782} from "@/modules/service/services/commands";
import {creditChoices as action783} from "@/modules/service/services/commands";
import {askFinanceForCredit as action784} from "@/modules/service/services/commands";
import {getCaseOwners as action785} from "@/modules/service/services/commands";
import {getDepartmentWork as action786} from "@/modules/service/services/commands";
import {savePurchaseContext as action787} from "@/modules/service/services/commands";
import {saveInvestigation as action788} from "@/modules/service/services/commands";
import {logCaseCall as action789} from "@/modules/service/services/commands";
import {createCaseRemedy as action790} from "@/modules/service/services/commands";
import {mergeCases as action791} from "@/modules/service/services/commands";
import {sendCaseEmail as action792} from "@/modules/service/services/communication";
import {invalidateCaseCsat as action793} from "@/modules/service/services/communication";
import {casePurchaseContext as action794} from "@/modules/service/services/context";
import {proposeRecovery as action795} from "@/modules/service/services/recovery";
import {decideRecovery as action796} from "@/modules/service/services/recovery";
import {saveServiceApprovalRoute as action797} from "@/modules/service/services/recovery";
import {getSopWorkspace as action798} from "@/modules/sop/services/workspace";
import {createSopCycle as action799} from "@/modules/sop/services/workspace";
import {configureSopCycle as action800} from "@/modules/sop/services/workspace";
import {generateSopForecast as action801} from "@/modules/sop/services/workspace";
import {approveSopVersion as action802} from "@/modules/sop/services/workspace";
import {updateSopWorkflow as action803} from "@/modules/sop/services/workspace";
import {publishSopVersion as action804} from "@/modules/sop/services/workspace";
import {createSopScenario as action805} from "@/modules/sop/services/workspace";
import {promoteSopScenario as action806} from "@/modules/sop/services/workspace";
import {overrideSopDemand as action807} from "@/modules/sop/services/workspace";
import {getLiveSopService as action808} from "@/modules/sop/services/workspace";
import {getSopComparison as action809} from "@/modules/sop/services/workspace";
import {getSopAccuracy as action810} from "@/modules/sop/services/workspace";
import {readAvailability as action811} from "@/modules/stock/services/availability";
import {readOrderChain as action812} from "@/modules/stock/services/availability";
import {inventoryExportRows as action813} from "@/modules/stock/services/export";
import {createTeam as action814} from "@/modules/teams/services/commands";
import {renameTeam as action815} from "@/modules/teams/services/commands";
import {addMember as action816} from "@/modules/teams/services/commands";
import {removeMember as action817} from "@/modules/teams/services/commands";
import {saveTask as action818} from "@/modules/teams/services/commands";
import {setTaskStatus as action819} from "@/modules/teams/services/commands";
import {removeTask as action820} from "@/modules/teams/services/commands";
import {saveCover as action821} from "@/modules/teams/services/commands";
import {removeCover as action822} from "@/modules/teams/services/commands";
import {saveHandover as action823} from "@/modules/teams/services/commands";
import {savePlace as action824} from "@/modules/teams/services/commands";
import {saveMoment as action825} from "@/modules/teams/services/commands";
import {removeMoment as action826} from "@/modules/teams/services/commands";
import {saveVacancy as hrPlatform0} from "@/app/(app)/people/platform-actions";
import {saveApplication as hrPlatform1} from "@/app/(app)/people/platform-actions";
import {saveTraining as hrPlatform2} from "@/app/(app)/people/platform-actions";
import {saveHRDocument as hrPlatform3} from "@/app/(app)/people/platform-actions";
import {saveEngineeringRevision as action827} from "@/modules/engineering/services/commands";
import {transitionEngineeringRevision as action828} from "@/modules/engineering/services/commands";
import {uploadEngineeringDrawing as action829} from "@/modules/engineering/services/commands";
import {saveFieldJob as action830} from "@/modules/fieldservice/services/commands";
import {updateFieldJob as action831} from "@/modules/fieldservice/services/commands";
import {addFieldJobNote as action832} from "@/modules/fieldservice/services/commands";
import {saveVehicle as action833} from "@/modules/fleet/services/commands";
import {addFleetLog as action834} from "@/modules/fleet/services/commands";
import {saveEquipment as action835} from "@/modules/maintenance/services/commands";
import {createMaintenanceWork as action836} from "@/modules/maintenance/services/commands";
import {updateMaintenanceWork as action837} from "@/modules/maintenance/services/commands";
import {recordMaintenancePart as action838} from "@/modules/maintenance/services/commands";
import {disconnectMicrosoftCalendar as action839} from "@/modules/meetings/services/calendar-actions";
import {chooseMicrosoftCalendar as action840} from "@/modules/meetings/services/calendar-actions";
import {sendMicrosoftMeeting as action841} from "@/modules/meetings/services/calendar-actions";
import {importMicrosoftMeetings as action842} from "@/modules/meetings/services/calendar-actions";
import {saveMeeting as action843} from "@/modules/meetings/services/commands";
import {meetingStatus as action844} from "@/modules/meetings/services/commands";
import {addMeetingEntry as action845} from "@/modules/meetings/services/commands";
import {completeMeetingAction as action846} from "@/modules/meetings/services/commands";
export const DATA_ACTIONS:Record<string,(...args:never[])=>Promise<unknown>>={
"src/app/(app)/people/platform-actions:saveVacancy":hrPlatform0 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/platform-actions:saveApplication":hrPlatform1 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/platform-actions:saveTraining":hrPlatform2 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/platform-actions:saveHRDocument":hrPlatform3 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/_shared/record-email-actions:loadEmailRecord":action0 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/_shared/record-email-actions:sendRecordEmailAction":action1 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/_shared/record-email-actions:sendRecordContractAction":action2 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/_shared/record-email-actions:sendQuoteForApprovalAction":action3 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:loadLiveMetrics":action4 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:loadMetricSlice":action5 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:saveAnalyticsDashboard":action6 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:deleteAnalyticsDashboard":action7 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/apps/actions:toggleModuleAction":action8 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/actions:updateCompanyAccount":action9 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/actions:saveCompanyEntitlements":action10 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/actions:createCompanyAccount":action11 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/actions:deleteTestCompany":action12 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/admin-actions:openCompanyWorkspace":action13 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/admin-actions:saveAtlasUserProfile":action14 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/admin-actions:saveAtlasUserAccess":action15 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/admin-actions:revokeAtlasUserSessions":action16 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/admin-actions:issueAtlasUserRecovery":action17 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/admin-actions:createAtlasStaff":action18 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/admin-actions:updateAtlasStaff":action19 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/admin-actions:saveAtlasStaffProfile":action20 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/admin-actions:issueAtlasStaffRecovery":action21 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/admin-actions:archiveAtlasCompany":action22 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/admin-actions:saveAtlasCompanyProfile":action23 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/admin-actions:saveAtlasCompanyBrand":action24 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/guardian/actions:requestGuardianSweep":action25 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/guardian/actions:updateGuardianIssue":action26 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/setup-actions:importCompanySetup":action27 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/setup-actions:createCompanyUser":action28 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/setup-actions:setCompanyUserStatus":action29 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:postMessage":action30 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:searchChatPeople":action31 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:openChat":action32 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:openDirectChat":action33 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:searchChatRecords":action34 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:sendChat":action35 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:chatSnapshot":action36 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/contracts/actions:createDealContract":action37 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:updateValueFormAction":action38 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:updateCloseDateFormAction":action39 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:setNextActionFormAction":action40 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:setForecastCategoryFormAction":action41 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:winFormAction":action42 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:loseFormAction":action43 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:addStakeholderFormAction":action44 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:addMilestoneFormAction":action45 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:toggleMilestoneFormAction":action46 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:logOpportunityActivityFormAction":action47 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/pipeline/actions:addDealAction":action48 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:qualifyFormAction":action49 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:disqualifyFormAction":action50 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:nurtureFormAction":action51 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:logProspectActivityFormAction":action52 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:assignProspectFormAction":action53 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:assignProspectTaskFormAction":action54 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:convertProspectFormAction":action55 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/reports/actions:pinReportToDashboard":action56 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createContactFormAction":action57 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateContactFormAction":action58 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:deleteContactFormAction":action59 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createAddressFormAction":action60 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createTaxRegistrationFormAction":action61 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:markTaxVerifiedFormAction":action62 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createBankAccountFormAction":action63 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createDirectDebitFormAction":action64 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:cancelDirectDebitFormAction":action65 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateCreditLimitFormAction":action66 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:toggleCreditHoldFormAction":action67 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createNoteFormAction":action68 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateStatusFormAction":action69 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:archiveCustomerFormAction":action70 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:unarchiveCustomerFormAction":action71 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:deleteCustomerFormAction":action72 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:createKpi":action73 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:saveGoal":action74 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:updateKpi":action75 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:recordProgress":action76 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:closeGoal":action77 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:addPlanGoal":action78 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:closePlan":action79 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:commentOnPlan":action80 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:syncDemandAction":action81 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:restoreDeliveryAction":action82 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:releaseAction":action83 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:allocateAction":action84 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:directShipAction":action85 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:groupAction":action86 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:scanAction":action87 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:lotAction":action88 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:serialAction":action89 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shortAction":action90 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeWorkAction":action91 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:claimAction":action92 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shipFromPickAction":action93 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packageAction":action94 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:weightAction":action95 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:stageAction":action96 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:labelAction":action97 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:dispatchAction":action98 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:trackingAction":action99 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:deliverAction":action100 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadCreateAction":action101 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadScanAction":action102 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:departAction":action103 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:expectAction":action104 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveLineAction":action105 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:putAwayAction":action106 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeReceiptAction":action107 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferAction":action108 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferReceiveAction":action109 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:returnRequestAction":action110 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:authoriseReturnAction":action111 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveReturnAction":action112 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:inspectAction":action113 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:closeReturnAction":action114 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:assignEquipmentAction":action115 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packUnitAction":action116 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:saveHandlingTypeAction":action117 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:retireHandlingTypeAction":action118 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:removeHandlingTypeAction":action119 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:policyAction":action120 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:runMrpAction":action121 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:firmSuggestionAction":action122 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:dismissSuggestionAction":action123 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:setForecastAction":action124 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:deleteForecastAction":action125 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:runMrpAction":action126 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:firmPlannedOrderAction":action127 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:dismissPlannedOrderAction":action128 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:runMrpForm":action129 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:firmPlannedOrderForm":action130 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:dismissPlannedOrderForm":action131 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/produce/actions:raiseProductionOrderAction":action132 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:previewMoveAction":action133 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:commitMoveAction":action134 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:toggleLockAction":action135 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:saveShiftAction":action136 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:deleteShiftAction":action137 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:startAction":action138 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:pauseAction":action139 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:completeAction":action140 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:loadNotices":action141 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotice":action142 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotices":action143 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:createPayrollRun":action144 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:updatePayslipDeductions":action145 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:finalisePayrollRun":action146 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:markPayrollRunPaid":action147 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:savePayrollSettings":action148 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP45":action149 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP60":action150 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:logAbsence":action151 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:requestLeave":action152 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:cancelOwnLeave":action153 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:approveLeaveRequest":action154 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:setLeaveAllowance":action155 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:rejectLeaveRequest":action156 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:createEmployee":action157 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:changeEmployeeStatus":action158 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeProfile":action159 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateOwnEmployeeDetails":action160 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeDocument":action161 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:linkEmployeeToUser":action162 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:completeEmployeeTask":action163 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeTask":action164 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeContact":action165 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeTask":action166 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:scheduleAppraisal":action167 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:completeAppraisal":action168 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getConductDesk":action169 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getMyConduct":action170 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getPlan":action171 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getCase":action172 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:conductChoices":action173 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:savePlan":action174 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addPlanReview":action175 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:commentOnPlan":action176 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:saveCase":action177 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:respondToCase":action178 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addCaseEvent":action179 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:submitExpenseClaim":action180 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:approveExpenseClaim":action181 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:rejectExpenseClaim":action182 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:scheduleOneToOne":action183 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:completeOneToOne":action184 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:listPolicies":action185 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:publishPolicy":action186 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:archivePolicy":action187 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:openPolicy":action188 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:createShift":action189 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:changeShiftStatus":action190 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyHR":action191 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyTeam":action192 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getTeamEmployee":action193 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:addPrivateNote":action194 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:updateWorkingPattern":action195 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:updateHrSettings":action196 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createAppraisalTemplate":action197 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleAppraisalTemplateActive":action198 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createOneToOneTemplate":action199 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleOneToOneTemplateActive":action200 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:getTimesheetContext":action201 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:saveTimesheet":action202 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:reviewTimesheet":action203 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:createPriceList":action204 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:savePriceEntry":action205 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveRule":action206 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:setRuleActive":action207 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:updatePriceBasis":action208 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:renamePriceList":action209 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:assignPriceListCustomers":action210 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:checkSalesPrice":action211 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:assignPriceList":action212 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewPriceCsv":action213 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyPriceCsv":action214 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreement":action215 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreementPrice":action216 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:removeAgreementPrice":action217 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewAgreementCsv":action218 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyAgreementCsv":action219 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProduct":action220 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProductRecord":action221 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveCategory":action222 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:retireCategory":action223 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:addStandardCategories":action224 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:savePack":action225 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveLinks":action226 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveMeasures":action227 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/actions:saveProfile":action228 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/work:loadAssignedWork":action229 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProject":action230 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeProjectStatus":action231 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editProject":action232 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProjectMember":action233 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:archiveProject":action234 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTask":action235 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeTaskStatus":action236 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:rescheduleTask":projectsRescheduleTask as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editTask":action237 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:checklistItem":action238 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addDependency":action239 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMeeting":action240 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDocument":action241 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editDocument":action242 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addComment":action243 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMilestone":action244 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:publishUpdate":action245 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDecision":action246 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:decide":action247 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createRisk":action248 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:closeRisk":action249 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:requestApproval":action250 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:respondApproval":action251 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:submitRequest":action252 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:triageRequest":action253 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:logTime":action254 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:planToday":action255 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:updateInbox":action256 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveView":action257 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createPortfolio":action258 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createBaseline":action259 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setBudget":action260 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:linkWork":action261 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectActivity":action262 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createAutomation":action263 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:toggleAutomation":action264 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveProjectTemplate":action265 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:useProjectTemplate":action266 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:startTimer":action267 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:stopTimer":action268 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:projectPreference":action269 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:uploadProjectFile":action270 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:readProjectFile":action271 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProperty":action272 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProperty":action273 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:restoreDocument":action274 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTaskFromDocument":action275 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:discardTimer":action276 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:completeMilestone":action277 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:resolveComment":action278 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectWorkload":action279 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:newContractAction":action280 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:resendContractAction":action281 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:deleteContractAction":action282 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:createOrderForm":action283 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addLineForm":action284 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:removeLineForm":action285 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:confirmOrderForm":action286 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:updateOrderForm":action287 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:chooseOrderAddresses":action288 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addHoldForm":action289 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:releaseHoldForm":action290 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:approveOrderForm":action291 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:cancelOrderForm":action292 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:saveOrderHashtagsForm":action293 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:restoreCancelledOrderForm":action294 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:returnOrderToQuoteForm":action295 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:scheduleOrderDelivery":action296 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:rejectOrderApproval":action297 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:deleteOrderForm":action298 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:createQuote":action299 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:deleteQuoteForm":action300 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/settings/actions:saveCreationPolicy":action301 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/sites/actions:saveSiteAction":action302 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/sites/actions:setDocumentSiteAction":action303 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getSchedule":action304 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:createBulkShifts":action305 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:setScheduledShift":action306 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:completeShiftTask":action307 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:editScheduledShift":action308 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishWeekShifts":action309 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveHoursBudget":action310 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getTeamPlan":action311 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getPersonSchedule":action312 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveWorkType":action313 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:archiveWorkType":action314 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveDemand":action315 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveBusyRule":action316 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:removeBusyRule":action317 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:fillTeamMonth":action318 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:replanCover":action319 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishMonth":action320 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveShift":action321 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveRole":action322 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveMemberRoles":action323 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:createUser":action324 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyAccess":action325 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyProfile":action326 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveManagerPolicy":action327 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveWorkspaceDetails":action328 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyBrand":action329 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/imports/actions:importCsv":action330 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveEmailAccount":action331 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:verifyEmailAccount":action332 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:sendTestEmail":action333 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:makeDefaultAccount":action334 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:setAccountActive":action335 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteEmailAccount":action336 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveSocialAccount":action337 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteSocialAccount":action338 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:checkSocialAccount":action339 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveEmailTemplate":action340 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteEmailTemplate":action341 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:checkInboxNow":action342 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/logistics/actions:saveDispatchDelivery":action343 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveUserAccess":action344 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:setUserStatus":action345 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:revokeUserSessions":action346 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:issuePasswordRecovery":action347 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createManagedUser":action348 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:linkEmployeeProfile":action349 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createRole":action350 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveManagementGroup":action351 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createWarehouse":action352 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:adjustStock":action353 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:savePlanningAction":action354 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:makeFromForecastAction":action355 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:transferStock":action356 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createSiteAction":action357 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createPlaceAction":action358 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:assignSiteAction":action359 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:addLocationAction":action360 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:ensureLocationsAction":action361 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:retireLocationAction":action362 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:putOnLocationAction":action363 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:moveLocatedAction":action364 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:receiveMoveAction":action365 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/templates/actions:saveTemplate":action366 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/templates/actions:archiveTemplate":action367 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/templates/actions:generateTemplateDocument":action368 as (...args:never[])=>Promise<unknown>,
"src/core/approvals/actions:delegateApprovals":action369 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:loginAction":action370 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:logoutAction":action371 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:completePasswordRecovery":action372 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:changeOwnPassword":action373 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:signOutOtherSessions":action374 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:createContract":action375 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:sendContract":action376 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:shareContractLink":action377 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:updateDraftContract":action378 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:revokeContract":action379 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:deleteContract":action380 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:signContract":action381 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:returnSignedContract":action382 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:reviewContractReturn":action383 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:declineContract":action384 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:loadPublicContract":action385 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:loadPublicContractFile":action386 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:checkForDuplicatesAction":action387 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:createCustomerAction":action388 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createCustomer":action389 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerStatus":action390 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:archiveCustomer":action391 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:unarchiveCustomer":action392 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteCustomer":action393 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createContact":action394 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateContact":action395 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteContact":action396 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createAddress":action397 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCommercialSettings":action398 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCreditLimit":action399 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setCreditHold":action400 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setPaymentTerm":action401 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createTaxRegistration":action402 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:markTaxRegistrationManuallyVerified":action403 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createBankAccount":action404 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:revealBankAccount":action405 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createDirectDebitMandate":action406 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:cancelDirectDebitMandate":action407 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createNote":action408 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:saveCustomerHashtags":action409 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerDetails":action410 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateAddress":action411 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:archiveAddress":action412 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commercial-actions:saveOrderingPreferences":action413 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setCustomerParent":action414 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:placeCustomer":action415 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:moveCustomer":action416 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setContactReportsTo":action417 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:saveCustomerTradingLink":action418 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:setInvoiceAccount":action419 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:archiveCustomerTradingLink":action420 as (...args:never[])=>Promise<unknown>,
"src/core/finance/actions:requestSalesInvoice":action421 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:createWork":action422 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:updateWork":action423 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:commentWork":action424 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:watchWork":action425 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:mergeWork":action426 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:requestWorkApproval":action427 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:decideWorkApproval":action428 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:saveDeskQueue":action429 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/actions:changeDeskMember":action430 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/file-actions:attachServiceFile":action431 as (...args:never[])=>Promise<unknown>,
"src/core/service-work/knowledge:saveKnowledge":action432 as (...args:never[])=>Promise<unknown>,
"src/core/teams/actions:createWorkTeam":action433 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditBoard":action434 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:exportAuditReport":action435 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEcho":action436 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:postEchoNote":action437 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEchoInbox":action438 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditAccess":action439 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditOwnActivity":action440 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditAreas":action441 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:saveAutomation":action442 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:setAutomationEnabled":action443 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:deleteAutomation":action444 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:testOnPastEvent":action445 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:runNow":action446 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:logActivity":action447 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:completeActivity":action448 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/marketing-handoff:acceptMarketingHandoff":action449 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:createOpportunity":action450 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:moveOpportunityStage":action451 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityValue":action452 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityCloseDate":action453 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityForecastCategory":action454 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityNextAction":action455 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:winOpportunity":action456 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:loseOpportunity":action457 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addStakeholder":action458 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addMilestone":action459 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:toggleMilestone":action460 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:checkProspectDuplicatesAction":action461 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createProspect":action462 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:assignProspect":action463 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:setProspectLifecycleStage":action464 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:convertProspect":action465 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createIndustry":action466 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:saveProspectGrouping":action467 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProject":action468 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProjectFormAction":action469 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:saveSalesProjectAction":action470 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:saveNextActionAction":action471 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addProjectOrganisationAction":action472 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:removeProjectOrganisationAction":action473 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:makePrimaryOrganisationAction":action474 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addProjectStakeholderAction":action475 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:removeProjectStakeholderAction":action476 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:setDocumentSalesProjectAction":action477 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:deleteSalesProjectAction":action478 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:saveSurvey":action479 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:createSurveyFromTemplate":action480 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:setSurveyActive":action481 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:deleteSurvey":action482 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatScore":action483 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatComment":action484 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:importFinanceStatement":action485 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:reconcileFinanceStatement":action486 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:financeReconciliationForm":action487 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:getFinanceReconciliation":action488 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/banking:importFinanceStatementForm":action489 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/collections:getFinanceCollections":action490 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/collections:recordFinanceCollection":action491 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setupFinance":action492 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceDocument":action493 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:submitFinanceDocument":action494 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveApprovalPolicy":action495 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:decideFinanceApproval":action496 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPurchaseOrder":action497 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:raiseServiceCredit":action498 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postFinanceDocument":action499 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:recordGoodsReceipt":action500 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:onboardSupplier":action501 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveSupplier":action502 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:requestSupplierBankChange":action503 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:verifySupplierBank":action504 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceBank":action505 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:importBankTransactions":action506 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocateBankTransaction":action507 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPaymentRun":action508 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approvePaymentRun":action509 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createManualJournal":action510 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveManualJournal":action511 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:reverseJournal":action512 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setFinancePeriodState":action513 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceBudget":action514 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceAsset":action515 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postAssetDepreciation":action516 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:completeCloseTask":action517 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceContract":action518 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceScenario":action519 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:receiptForm":action520 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:journalForm":action521 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:statementForm":action522 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocationForm":action523 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:paymentRunForm":action524 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:policyForm":action525 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:scenarioForm":action526 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:uploadFinanceAttachment":action527 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateSalesInvoice":action528 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateInvoiceAdjustment":action529 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:voidFinanceDraft":action530 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:getFinanceConfiguration":action531 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:saveFinanceEntityDetails":action532 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:saveFinanceAccount":action533 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:saveFinanceDimension":action534 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:createFinancePeriod":action535 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:setFinancePeriodExceptions":action536 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:requestFinancePeriodReopen":action537 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/configuration:decideFinancePeriodReopen":action538 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceHome":action539 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:listFinanceDocuments":action540 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceDocument":action541 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceWorkspace":action542 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:financeChoices":action543 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getBudgetPositions":action544 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getInvoiceCashForecast":action545 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinancialReport":action546 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceCustomerContribution":action547 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:searchFinance":action548 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceAttachment":action549 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getSalesFinanceProjection":action550 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getReceivingWarehouses":action551 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/reporting:getFinanceLedger":action552 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/reporting:getFinanceJournalDetail":action553 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/reporting:getFinanceSubledgerReconciliation":action554 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:createProductionOrder":action555 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:markOrderReady":action556 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:releaseOrder":action557 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:closeOrder":action558 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:startWorkOrder":action559 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:pauseWorkOrder":action560 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:completeWorkOrder":action561 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:listForecasts":action562 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:setForecast":action563 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:deleteForecast":action564 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:runMrp":action565 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:firmSuggestion":action566 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:dismissSuggestion":action567 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:latestPlan":action568 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:loadPlant":action569 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveWorkCentre":action570 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveMachine":action571 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:retirePlantRecord":action572 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:schedulePreview":action573 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:rescheduleWorkOrder":action574 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:setWorkOrderLock":action575 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:listShifts":action576 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:saveShift":action577 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:deleteShift":action578 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:createCampaignAction":action579 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveCampaignBriefAction":action580 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveBudgetLineAction":action581 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deleteBudgetLineAction":action582 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveActivityAction":action583 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:setActivityStatusAction":action584 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deleteActivityAction":action585 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:addPaidSpendAction":action586 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deletePaidSpendAction":action587 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:createCampaignAction":action588 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveCampaignBriefAction":action589 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveBudgetLineAction":action590 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deleteBudgetLineAction":action591 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveActivityAction":action592 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:setActivityStatusAction":action593 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deleteActivityAction":action594 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:addPaidSpendAction":action595 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deletePaidSpendAction":action596 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createCampaign":action597 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updateCampaign":action598 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProfile":action599 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:recordPermission":action600 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:suppressProfile":action601 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createAudience":action602 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:previewAudience":action603 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createContent":action604 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:approveContent":action605 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createMessage":action606 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:lockSend":action607 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:cancelSend":action608 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:ingestEvent":action609 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourney":action610 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:publishJourney":action611 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:reviseJourney":action612 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProgram":action613 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createExperiment":action614 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:leadFeedback":action615 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:processJourneySteps":action616 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:saveMarketingPlan":action617 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addPlanActivity":action618 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updatePlanActivity":action619 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addBudgetLine":action620 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:submitBudgetToFinance":action621 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourneyMap":action622 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyStage":action623 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyTouch":action624 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:saveSocialPost":action625 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:deleteSocialPost":action626 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:retrySocialPost":action627 as (...args:never[])=>Promise<unknown>,
"src/modules/people/services/finance-expenses:getApprovedExpenseSource":action628 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:getPlanBuilder":action629 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:savePlanInput":action630 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:setPlanInputIncluded":action631 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:applyPlanInputs":action632 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:savePlanGrid":action633 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/builder:removePlanMeasure":action634 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createPlan":action635 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveCell":action636 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addMeasure":action637 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAssumption":action638 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDriver":action639 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addLink":action640 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createScenario":action641 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:promoteScenario":action642 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:submitPlan":action643 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:approvePlan":action644 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:lockPlan":action645 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addGoal":action646 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addInitiative":action647 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createProjectForInitiative":action648 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAction":action649 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeAction":action650 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addRisk":action651 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDependency":action652 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDecision":action653 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addComment":action654 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addUpdate":action655 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeReview":action656 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addReview":action657 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:distributeTargets":action658 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:importGrid":action659 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:sharePlan":action660 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:unsharePlan":action661 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:setPlanAudience":action662 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addNote":action663 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveGoalProgress":action664 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:savePlanBrief":action665 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:listProductionPlans":action666 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getPlanOptions":action667 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getProductionPlan":action668 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:createProductionPlan":action669 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:addProductionPlanLine":action670 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getAssignedPlanningWork":action671 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/queries:getPlanningCoverage":action672 as (...args:never[])=>Promise<unknown>,
"src/modules/products/services/make:saveProductRecipe":action673 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createSpecification":action674 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:setSpecificationStatus":action675 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createControlPoint":action676 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:executeInspection":action677 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:releaseHold":action678 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:reportNcr":action679 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrInvestigation":action680 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:addNcrAction":action681 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrAction":action682 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:closeNcr":action683 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSubstance":action684 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addSafetyDataSheet":action685 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCoshhAssessment":action686 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveSubstance":action687 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCompetence":action688 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSafetyDocument":action689 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:acknowledgeDocument":action690 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveAudit":action691 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addAuditFinding":action692 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveAudit":action693 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveChange":action694 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:advanceChange":action695 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:linkSafetyRecord":action696 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveSafetyProfile":action697 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRiskMatrix":action698 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createRisk":action699 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addControl":action700 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:rateAssessment":action701 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:approveAssessment":action702 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviseAssessment":action703 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:requestRiskReview":action704 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reportIncident":action705 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveImmediateControl":action706 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:openInvestigation":action707 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addCause":action708 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRootCause":action709 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviewRiddor":action710 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createSafetyAction":action711 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:advanceAction":action712 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:verifyAction":action713 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveWorkplaceRecord":action714 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createPermit":action715 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:advancePermit":action716 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:extendPermit":action717 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createIsolation":action718 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:applyIsolationLock":action719 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:verifyIsolation":action720 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:clearIsolation":action721 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:removeIsolationLock":action722 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:placeSafetyHold":action723 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:updateReturnToService":action724 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:releaseSafetyHold":action725 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:overrideSafetyHold":action726 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:saveStatutoryCheck":action727 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:completeInspection":action728 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createInspection":action729 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/address-actions:createSalesAddress":action730 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/catalogue-actions:createSalesCatalogueProduct":action731 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:sendQuote":action732 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:changeQuoteStatus":action733 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:deleteQuote":action734 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:duplicateDocument":action735 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:saveQuoteTemplate":action736 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:createOrderFromQuote":action737 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:linkCommercialProject":action738 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:openCallOffOrder":action739 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:raiseCallOff":action740 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:invoiceCallOffDelivery":action741 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:deliverAndInvoiceCallOff":action742 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/csv-import:importSalescsv":action743 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:addDeliveryAddress":action744 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:addInstaller":action745 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:pricePartyId":action746 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:linkOrderedFor":action747 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/documents:saveDocument":action748 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:saveInvoiceTemplate":action749 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:retireInvoiceTemplate":action750 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:attachCustomerInvoiceTemplate":action751 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:detachCustomerInvoiceTemplate":action752 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:createDraftOrder":action753 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addOrderLine":action754 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:removeOrderLine":action755 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:updateDraftOrderFields":action756 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:confirmOrder":action757 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:decideApproval":action758 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendLineQuantity":action759 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:overrideLinePrice":action760 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendRequestedDate":action761 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelOrder":action762 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:deleteOrder":action763 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelLineRemaining":action764 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addHold":action765 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:releaseHold":action766 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/recovery:redeemServiceRecovery":action767 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:restoreCancelledOrder":action768 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:returnOrderToQuote":action769 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:saveOrderHashtags":action770 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:saveSalesView":action771 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:archiveSalesView":action772 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createCase":action773 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateCase":action774 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:assignCase":action775 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:transitionCase":action776 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addCaseEntry":action777 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createDepartmentTicket":action778 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateDepartmentTicket":action779 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createQueue":action780 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addQueueMember":action781 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:linkCaseRecord":action782 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:creditChoices":action783 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:askFinanceForCredit":action784 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getCaseOwners":action785 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getDepartmentWork":action786 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:savePurchaseContext":action787 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:saveInvestigation":action788 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:logCaseCall":action789 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createCaseRemedy":action790 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:mergeCases":action791 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/communication:sendCaseEmail":action792 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/communication:invalidateCaseCsat":action793 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/context:casePurchaseContext":action794 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/recovery:proposeRecovery":action795 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/recovery:decideRecovery":action796 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/recovery:saveServiceApprovalRoute":action797 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getSopWorkspace":action798 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:createSopCycle":action799 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:configureSopCycle":action800 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:generateSopForecast":action801 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:approveSopVersion":action802 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:updateSopWorkflow":action803 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:publishSopVersion":action804 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:createSopScenario":action805 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:promoteSopScenario":action806 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:overrideSopDemand":action807 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getLiveSopService":action808 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getSopComparison":action809 as (...args:never[])=>Promise<unknown>,
"src/modules/sop/services/workspace:getSopAccuracy":action810 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readAvailability":action811 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readOrderChain":action812 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/export:inventoryExportRows":action813 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:createTeam":action814 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:renameTeam":action815 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:addMember":action816 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMember":action817 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveTask":action818 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:setTaskStatus":action819 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeTask":action820 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveCover":action821 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeCover":action822 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveHandover":action823 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:savePlace":action824 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveMoment":action825 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMoment":action826 as (...args:never[])=>Promise<unknown>,
"src/modules/engineering/services/commands:saveEngineeringRevision":action827 as (...args:never[])=>Promise<unknown>,
"src/modules/engineering/services/commands:transitionEngineeringRevision":action828 as (...args:never[])=>Promise<unknown>,
"src/modules/engineering/services/commands:uploadEngineeringDrawing":action829 as (...args:never[])=>Promise<unknown>,
"src/modules/fieldservice/services/commands:saveFieldJob":action830 as (...args:never[])=>Promise<unknown>,
"src/modules/fieldservice/services/commands:updateFieldJob":action831 as (...args:never[])=>Promise<unknown>,
"src/modules/fieldservice/services/commands:addFieldJobNote":action832 as (...args:never[])=>Promise<unknown>,
"src/modules/fleet/services/commands:saveVehicle":action833 as (...args:never[])=>Promise<unknown>,
"src/modules/fleet/services/commands:addFleetLog":action834 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:saveEquipment":action835 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:createMaintenanceWork":action836 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:updateMaintenanceWork":action837 as (...args:never[])=>Promise<unknown>,
"src/modules/maintenance/services/commands:recordMaintenancePart":action838 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:disconnectMicrosoftCalendar":action839 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:chooseMicrosoftCalendar":action840 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:sendMicrosoftMeeting":action841 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/calendar-actions:importMicrosoftMeetings":action842 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:saveMeeting":action843 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:meetingStatus":action844 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:addMeetingEntry":action845 as (...args:never[])=>Promise<unknown>,
"src/modules/meetings/services/commands:completeMeetingAction":action846 as (...args:never[])=>Promise<unknown>
};
