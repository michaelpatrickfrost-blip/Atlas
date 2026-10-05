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
import {importCompanySetup as action13} from "@/app/(app)/atlas/setup-actions";
import {createCompanyUser as action14} from "@/app/(app)/atlas/setup-actions";
import {setCompanyUserStatus as action15} from "@/app/(app)/atlas/setup-actions";
import {postMessage as action16} from "@/app/(app)/chat/actions";
import {searchChatPeople as action17} from "@/app/(app)/chat/actions";
import {openChat as action18} from "@/app/(app)/chat/actions";
import {openDirectChat as action19} from "@/app/(app)/chat/actions";
import {searchChatRecords as action20} from "@/app/(app)/chat/actions";
import {sendChat as action21} from "@/app/(app)/chat/actions";
import {chatSnapshot as action22} from "@/app/(app)/chat/actions";
import {updateValueFormAction as action23} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {updateCloseDateFormAction as action24} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {setNextActionFormAction as action25} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {setForecastCategoryFormAction as action26} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {winFormAction as action27} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {loseFormAction as action28} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addStakeholderFormAction as action29} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addMilestoneFormAction as action30} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {toggleMilestoneFormAction as action31} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {logOpportunityActivityFormAction as action32} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addDealAction as action33} from "@/app/(app)/crm/pipeline/actions";
import {qualifyFormAction as action34} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {disqualifyFormAction as action35} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {nurtureFormAction as action36} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {logProspectActivityFormAction as action37} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {assignProspectFormAction as action38} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {assignProspectTaskFormAction as action39} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {convertProspectFormAction as action40} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {pinReportToDashboard as action41} from "@/app/(app)/crm/reports/actions";
import {createContactFormAction as action42} from "@/app/(app)/customers/[partyId]/actions";
import {updateContactFormAction as action43} from "@/app/(app)/customers/[partyId]/actions";
import {deleteContactFormAction as action44} from "@/app/(app)/customers/[partyId]/actions";
import {createAddressFormAction as action45} from "@/app/(app)/customers/[partyId]/actions";
import {createTaxRegistrationFormAction as action46} from "@/app/(app)/customers/[partyId]/actions";
import {markTaxVerifiedFormAction as action47} from "@/app/(app)/customers/[partyId]/actions";
import {createBankAccountFormAction as action48} from "@/app/(app)/customers/[partyId]/actions";
import {createDirectDebitFormAction as action49} from "@/app/(app)/customers/[partyId]/actions";
import {cancelDirectDebitFormAction as action50} from "@/app/(app)/customers/[partyId]/actions";
import {updateCreditLimitFormAction as action51} from "@/app/(app)/customers/[partyId]/actions";
import {toggleCreditHoldFormAction as action52} from "@/app/(app)/customers/[partyId]/actions";
import {createNoteFormAction as action53} from "@/app/(app)/customers/[partyId]/actions";
import {updateStatusFormAction as action54} from "@/app/(app)/customers/[partyId]/actions";
import {deleteCustomerFormAction as action55} from "@/app/(app)/customers/[partyId]/actions";
import {createKpi as action56} from "@/app/(app)/kpis/actions";
import {saveGoal as action57} from "@/app/(app)/kpis/actions";
import {updateKpi as action58} from "@/app/(app)/kpis/actions";
import {recordProgress as action59} from "@/app/(app)/kpis/actions";
import {closeGoal as action60} from "@/app/(app)/kpis/actions";
import {addPlanGoal as action61} from "@/app/(app)/kpis/actions";
import {closePlan as action62} from "@/app/(app)/kpis/actions";
import {commentOnPlan as action63} from "@/app/(app)/kpis/actions";
import {syncDemandAction as action64} from "@/app/(app)/logistics/actions";
import {restoreDeliveryAction as action65} from "@/app/(app)/logistics/actions";
import {releaseAction as action66} from "@/app/(app)/logistics/actions";
import {allocateAction as action67} from "@/app/(app)/logistics/actions";
import {directShipAction as action68} from "@/app/(app)/logistics/actions";
import {groupAction as action69} from "@/app/(app)/logistics/actions";
import {scanAction as action70} from "@/app/(app)/logistics/actions";
import {lotAction as action71} from "@/app/(app)/logistics/actions";
import {serialAction as action72} from "@/app/(app)/logistics/actions";
import {shortAction as action73} from "@/app/(app)/logistics/actions";
import {completeWorkAction as action74} from "@/app/(app)/logistics/actions";
import {claimAction as action75} from "@/app/(app)/logistics/actions";
import {shipFromPickAction as action76} from "@/app/(app)/logistics/actions";
import {packageAction as action77} from "@/app/(app)/logistics/actions";
import {weightAction as action78} from "@/app/(app)/logistics/actions";
import {stageAction as action79} from "@/app/(app)/logistics/actions";
import {labelAction as action80} from "@/app/(app)/logistics/actions";
import {dispatchAction as action81} from "@/app/(app)/logistics/actions";
import {trackingAction as action82} from "@/app/(app)/logistics/actions";
import {deliverAction as action83} from "@/app/(app)/logistics/actions";
import {loadCreateAction as action84} from "@/app/(app)/logistics/actions";
import {loadScanAction as action85} from "@/app/(app)/logistics/actions";
import {departAction as action86} from "@/app/(app)/logistics/actions";
import {expectAction as action87} from "@/app/(app)/logistics/actions";
import {receiveLineAction as action88} from "@/app/(app)/logistics/actions";
import {putAwayAction as action89} from "@/app/(app)/logistics/actions";
import {completeReceiptAction as action90} from "@/app/(app)/logistics/actions";
import {transferAction as action91} from "@/app/(app)/logistics/actions";
import {transferReceiveAction as action92} from "@/app/(app)/logistics/actions";
import {returnRequestAction as action93} from "@/app/(app)/logistics/actions";
import {authoriseReturnAction as action94} from "@/app/(app)/logistics/actions";
import {receiveReturnAction as action95} from "@/app/(app)/logistics/actions";
import {inspectAction as action96} from "@/app/(app)/logistics/actions";
import {closeReturnAction as action97} from "@/app/(app)/logistics/actions";
import {assignEquipmentAction as action98} from "@/app/(app)/logistics/actions";
import {packUnitAction as action99} from "@/app/(app)/logistics/actions";
import {saveHandlingTypeAction as action100} from "@/app/(app)/logistics/actions";
import {retireHandlingTypeAction as action101} from "@/app/(app)/logistics/actions";
import {removeHandlingTypeAction as action102} from "@/app/(app)/logistics/actions";
import {policyAction as action103} from "@/app/(app)/logistics/actions";
import {runMrpAction as action104} from "@/app/(app)/manufacturing/plan/actions";
import {firmSuggestionAction as action105} from "@/app/(app)/manufacturing/plan/actions";
import {dismissSuggestionAction as action106} from "@/app/(app)/manufacturing/plan/actions";
import {setForecastAction as action107} from "@/app/(app)/manufacturing/plan/actions";
import {deleteForecastAction as action108} from "@/app/(app)/manufacturing/plan/actions";
import {runMrpAction as action109} from "@/app/(app)/manufacturing/planning/actions";
import {firmPlannedOrderAction as action110} from "@/app/(app)/manufacturing/planning/actions";
import {dismissPlannedOrderAction as action111} from "@/app/(app)/manufacturing/planning/actions";
import {runMrpForm as action112} from "@/app/(app)/manufacturing/planning/form-actions";
import {firmPlannedOrderForm as action113} from "@/app/(app)/manufacturing/planning/form-actions";
import {dismissPlannedOrderForm as action114} from "@/app/(app)/manufacturing/planning/form-actions";
import {previewMoveAction as action115} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {commitMoveAction as action116} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {toggleLockAction as action117} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {saveShiftAction as action118} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {deleteShiftAction as action119} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {startAction as action120} from "@/app/(app)/manufacturing/shop-floor/actions";
import {pauseAction as action121} from "@/app/(app)/manufacturing/shop-floor/actions";
import {completeAction as action122} from "@/app/(app)/manufacturing/shop-floor/actions";
import {loadNotices as action123} from "@/app/(app)/notices/actions";
import {clearNotice as action124} from "@/app/(app)/notices/actions";
import {clearNotices as action125} from "@/app/(app)/notices/actions";
import {createPayrollRun as action126} from "@/app/(app)/payroll/actions";
import {updatePayslipDeductions as action127} from "@/app/(app)/payroll/actions";
import {finalisePayrollRun as action128} from "@/app/(app)/payroll/actions";
import {markPayrollRunPaid as action129} from "@/app/(app)/payroll/actions";
import {savePayrollSettings as action130} from "@/app/(app)/payroll/actions";
import {issueP45 as action131} from "@/app/(app)/payroll/actions";
import {issueP60 as action132} from "@/app/(app)/payroll/actions";
import {logAbsence as action133} from "@/app/(app)/people/absence/actions";
import {requestLeave as action134} from "@/app/(app)/people/absence/actions";
import {cancelOwnLeave as action135} from "@/app/(app)/people/absence/actions";
import {approveLeaveRequest as action136} from "@/app/(app)/people/absence/actions";
import {setLeaveAllowance as action137} from "@/app/(app)/people/absence/actions";
import {rejectLeaveRequest as action138} from "@/app/(app)/people/absence/actions";
import {createEmployee as action139} from "@/app/(app)/people/actions";
import {changeEmployeeStatus as action140} from "@/app/(app)/people/actions";
import {updateEmployeeProfile as action141} from "@/app/(app)/people/actions";
import {updateOwnEmployeeDetails as action142} from "@/app/(app)/people/actions";
import {addEmployeeDocument as action143} from "@/app/(app)/people/actions";
import {linkEmployeeToUser as action144} from "@/app/(app)/people/actions";
import {completeEmployeeTask as action145} from "@/app/(app)/people/actions";
import {addEmployeeTask as action146} from "@/app/(app)/people/actions";
import {updateEmployeeContact as action147} from "@/app/(app)/people/actions";
import {updateEmployeeTask as action148} from "@/app/(app)/people/actions";
import {scheduleAppraisal as action149} from "@/app/(app)/people/appraisals/actions";
import {completeAppraisal as action150} from "@/app/(app)/people/appraisals/actions";
import {getConductDesk as action151} from "@/app/(app)/people/conduct/actions";
import {getMyConduct as action152} from "@/app/(app)/people/conduct/actions";
import {getPlan as action153} from "@/app/(app)/people/conduct/actions";
import {getCase as action154} from "@/app/(app)/people/conduct/actions";
import {conductChoices as action155} from "@/app/(app)/people/conduct/actions";
import {savePlan as action156} from "@/app/(app)/people/conduct/actions";
import {addPlanReview as action157} from "@/app/(app)/people/conduct/actions";
import {commentOnPlan as action158} from "@/app/(app)/people/conduct/actions";
import {saveCase as action159} from "@/app/(app)/people/conduct/actions";
import {respondToCase as action160} from "@/app/(app)/people/conduct/actions";
import {addCaseEvent as action161} from "@/app/(app)/people/conduct/actions";
import {submitExpenseClaim as action162} from "@/app/(app)/people/expenses/actions";
import {approveExpenseClaim as action163} from "@/app/(app)/people/expenses/actions";
import {rejectExpenseClaim as action164} from "@/app/(app)/people/expenses/actions";
import {scheduleOneToOne as action165} from "@/app/(app)/people/one-to-ones/actions";
import {completeOneToOne as action166} from "@/app/(app)/people/one-to-ones/actions";
import {listPolicies as action167} from "@/app/(app)/people/policies/actions";
import {publishPolicy as action168} from "@/app/(app)/people/policies/actions";
import {archivePolicy as action169} from "@/app/(app)/people/policies/actions";
import {openPolicy as action170} from "@/app/(app)/people/policies/actions";
import {createShift as action171} from "@/app/(app)/people/rotas/actions";
import {changeShiftStatus as action172} from "@/app/(app)/people/rotas/actions";
import {getMyHR as action173} from "@/app/(app)/people/self-service";
import {getMyTeam as action174} from "@/app/(app)/people/self-service";
import {getTeamEmployee as action175} from "@/app/(app)/people/self-service";
import {addPrivateNote as action176} from "@/app/(app)/people/self-service";
import {updateWorkingPattern as action177} from "@/app/(app)/people/self-service";
import {updateHrSettings as action178} from "@/app/(app)/people/settings/actions";
import {createAppraisalTemplate as action179} from "@/app/(app)/people/settings/actions";
import {toggleAppraisalTemplateActive as action180} from "@/app/(app)/people/settings/actions";
import {createOneToOneTemplate as action181} from "@/app/(app)/people/settings/actions";
import {toggleOneToOneTemplateActive as action182} from "@/app/(app)/people/settings/actions";
import {getTimesheetContext as action183} from "@/app/(app)/people/timesheets/actions";
import {saveTimesheet as action184} from "@/app/(app)/people/timesheets/actions";
import {reviewTimesheet as action185} from "@/app/(app)/people/timesheets/actions";
import {createPriceList as action186} from "@/app/(app)/pricing/actions";
import {savePriceEntry as action187} from "@/app/(app)/pricing/actions";
import {saveRule as action188} from "@/app/(app)/pricing/actions";
import {setRuleActive as action189} from "@/app/(app)/pricing/actions";
import {updatePriceBasis as action190} from "@/app/(app)/pricing/actions";
import {assignPriceList as action191} from "@/app/(app)/pricing/actions";
import {previewPriceCsv as action192} from "@/app/(app)/pricing/actions";
import {applyPriceCsv as action193} from "@/app/(app)/pricing/actions";
import {saveAgreement as action194} from "@/app/(app)/pricing/actions";
import {saveAgreementPrice as action195} from "@/app/(app)/pricing/actions";
import {removeAgreementPrice as action196} from "@/app/(app)/pricing/actions";
import {previewAgreementCsv as action197} from "@/app/(app)/pricing/actions";
import {applyAgreementCsv as action198} from "@/app/(app)/pricing/actions";
import {saveProduct as action199} from "@/app/(app)/products/actions";
import {saveProductRecord as action200} from "@/app/(app)/products/actions";
import {saveCategory as action201} from "@/app/(app)/products/actions";
import {retireCategory as action202} from "@/app/(app)/products/actions";
import {addStandardCategories as action203} from "@/app/(app)/products/actions";
import {savePack as action204} from "@/app/(app)/products/actions";
import {saveLinks as action205} from "@/app/(app)/products/actions";
import {saveMeasures as action206} from "@/app/(app)/products/actions";
import {saveProfile as action207} from "@/app/(app)/profile/actions";
import {loadAssignedWork as action208} from "@/app/(app)/profile/work";
import {createProject as action209} from "@/app/(app)/projects/actions";
import {changeProjectStatus as action210} from "@/app/(app)/projects/actions";
import {editProject as action211} from "@/app/(app)/projects/actions";
import {setProjectMember as action212} from "@/app/(app)/projects/actions";
import {archiveProject as action213} from "@/app/(app)/projects/actions";
import {createTask as action214} from "@/app/(app)/projects/actions";
import {changeTaskStatus as action215} from "@/app/(app)/projects/actions";
import {editTask as action216} from "@/app/(app)/projects/actions";
import {checklistItem as action217} from "@/app/(app)/projects/actions";
import {addDependency as action218} from "@/app/(app)/projects/actions";
import {createMeeting as action219} from "@/app/(app)/projects/actions";
import {createDocument as action220} from "@/app/(app)/projects/actions";
import {editDocument as action221} from "@/app/(app)/projects/actions";
import {addComment as action222} from "@/app/(app)/projects/actions";
import {createMilestone as action223} from "@/app/(app)/projects/actions";
import {publishUpdate as action224} from "@/app/(app)/projects/actions";
import {createDecision as action225} from "@/app/(app)/projects/actions";
import {decide as action226} from "@/app/(app)/projects/actions";
import {createRisk as action227} from "@/app/(app)/projects/actions";
import {closeRisk as action228} from "@/app/(app)/projects/actions";
import {requestApproval as action229} from "@/app/(app)/projects/actions";
import {respondApproval as action230} from "@/app/(app)/projects/actions";
import {submitRequest as action231} from "@/app/(app)/projects/actions";
import {triageRequest as action232} from "@/app/(app)/projects/actions";
import {logTime as action233} from "@/app/(app)/projects/actions";
import {planToday as action234} from "@/app/(app)/projects/actions";
import {updateInbox as action235} from "@/app/(app)/projects/actions";
import {saveView as action236} from "@/app/(app)/projects/actions";
import {createPortfolio as action237} from "@/app/(app)/projects/actions";
import {createBaseline as action238} from "@/app/(app)/projects/actions";
import {setBudget as action239} from "@/app/(app)/projects/actions";
import {linkWork as action240} from "@/app/(app)/projects/actions";
import {getProjectActivity as action241} from "@/app/(app)/projects/actions";
import {createAutomation as action242} from "@/app/(app)/projects/actions";
import {toggleAutomation as action243} from "@/app/(app)/projects/actions";
import {saveProjectTemplate as action244} from "@/app/(app)/projects/actions";
import {useProjectTemplate as action245} from "@/app/(app)/projects/actions";
import {startTimer as action246} from "@/app/(app)/projects/actions";
import {stopTimer as action247} from "@/app/(app)/projects/actions";
import {projectPreference as action248} from "@/app/(app)/projects/actions";
import {uploadProjectFile as action249} from "@/app/(app)/projects/actions";
import {readProjectFile as action250} from "@/app/(app)/projects/actions";
import {createProperty as action251} from "@/app/(app)/projects/actions";
import {setProperty as action252} from "@/app/(app)/projects/actions";
import {restoreDocument as action253} from "@/app/(app)/projects/actions";
import {createTaskFromDocument as action254} from "@/app/(app)/projects/actions";
import {discardTimer as action255} from "@/app/(app)/projects/actions";
import {completeMilestone as action256} from "@/app/(app)/projects/actions";
import {resolveComment as action257} from "@/app/(app)/projects/actions";
import {getProjectWorkload as action258} from "@/app/(app)/projects/actions";
import {newContractAction as action259} from "@/app/(app)/sales/contracts/actions";
import {resendContractAction as action260} from "@/app/(app)/sales/contracts/actions";
import {deleteContractAction as action261} from "@/app/(app)/sales/contracts/actions";
import {createOrderForm as action262} from "@/app/(app)/sales/orders/actions";
import {addLineForm as action263} from "@/app/(app)/sales/orders/actions";
import {removeLineForm as action264} from "@/app/(app)/sales/orders/actions";
import {confirmOrderForm as action265} from "@/app/(app)/sales/orders/actions";
import {updateOrderForm as action266} from "@/app/(app)/sales/orders/actions";
import {chooseOrderAddresses as action267} from "@/app/(app)/sales/orders/actions";
import {addHoldForm as action268} from "@/app/(app)/sales/orders/actions";
import {releaseHoldForm as action269} from "@/app/(app)/sales/orders/actions";
import {approveOrderForm as action270} from "@/app/(app)/sales/orders/actions";
import {cancelOrderForm as action271} from "@/app/(app)/sales/orders/actions";
import {saveOrderHashtagsForm as action272} from "@/app/(app)/sales/orders/actions";
import {restoreCancelledOrderForm as action273} from "@/app/(app)/sales/orders/actions";
import {returnOrderToQuoteForm as action274} from "@/app/(app)/sales/orders/actions";
import {scheduleOrderDelivery as action275} from "@/app/(app)/sales/orders/actions";
import {rejectOrderApproval as action276} from "@/app/(app)/sales/orders/actions";
import {deleteOrderForm as action277} from "@/app/(app)/sales/orders/actions";
import {createQuote as action278} from "@/app/(app)/sales/quotes/actions";
import {deleteQuoteForm as action279} from "@/app/(app)/sales/quotes/actions";
import {saveCreationPolicy as action280} from "@/app/(app)/sales/settings/actions";
import {saveSiteAction as action281} from "@/app/(app)/sales/sites/actions";
import {setDocumentSiteAction as action282} from "@/app/(app)/sales/sites/actions";
import {getSchedule as action283} from "@/app/(app)/scheduling/actions";
import {createBulkShifts as action284} from "@/app/(app)/scheduling/actions";
import {setScheduledShift as action285} from "@/app/(app)/scheduling/actions";
import {completeShiftTask as action286} from "@/app/(app)/scheduling/actions";
import {editScheduledShift as action287} from "@/app/(app)/scheduling/actions";
import {publishWeekShifts as action288} from "@/app/(app)/scheduling/actions";
import {saveHoursBudget as action289} from "@/app/(app)/scheduling/actions";
import {getTeamPlan as action290} from "@/app/(app)/scheduling/actions";
import {getPersonSchedule as action291} from "@/app/(app)/scheduling/actions";
import {saveWorkType as action292} from "@/app/(app)/scheduling/actions";
import {archiveWorkType as action293} from "@/app/(app)/scheduling/actions";
import {saveDemand as action294} from "@/app/(app)/scheduling/actions";
import {saveBusyRule as action295} from "@/app/(app)/scheduling/actions";
import {removeBusyRule as action296} from "@/app/(app)/scheduling/actions";
import {fillTeamMonth as action297} from "@/app/(app)/scheduling/actions";
import {replanCover as action298} from "@/app/(app)/scheduling/actions";
import {publishMonth as action299} from "@/app/(app)/scheduling/actions";
import {saveShift as action300} from "@/app/(app)/scheduling/actions";
import {saveRole as action301} from "@/app/(app)/settings/actions";
import {saveMemberRoles as action302} from "@/app/(app)/settings/actions";
import {createUser as action303} from "@/app/(app)/settings/actions";
import {saveCompanyAccess as action304} from "@/app/(app)/settings/actions";
import {saveCompanyProfile as action305} from "@/app/(app)/settings/actions";
import {saveManagerPolicy as action306} from "@/app/(app)/settings/actions";
import {saveWorkspaceDetails as action307} from "@/app/(app)/settings/actions";
import {saveCompanyBrand as action308} from "@/app/(app)/settings/actions";
import {importCsv as action309} from "@/app/(app)/settings/imports/actions";
import {saveEmailAccount as action310} from "@/app/(app)/settings/it/actions";
import {verifyEmailAccount as action311} from "@/app/(app)/settings/it/actions";
import {sendTestEmail as action312} from "@/app/(app)/settings/it/actions";
import {makeDefaultAccount as action313} from "@/app/(app)/settings/it/actions";
import {setAccountActive as action314} from "@/app/(app)/settings/it/actions";
import {deleteEmailAccount as action315} from "@/app/(app)/settings/it/actions";
import {saveSocialAccount as action316} from "@/app/(app)/settings/it/actions";
import {deleteSocialAccount as action317} from "@/app/(app)/settings/it/actions";
import {checkSocialAccount as action318} from "@/app/(app)/settings/it/actions";
import {saveEmailTemplate as action319} from "@/app/(app)/settings/it/actions";
import {deleteEmailTemplate as action320} from "@/app/(app)/settings/it/actions";
import {checkInboxNow as action321} from "@/app/(app)/settings/it/actions";
import {saveDispatchDelivery as action322} from "@/app/(app)/settings/logistics/actions";
import {saveUserAccess as action323} from "@/app/(app)/settings/user-actions";
import {setUserStatus as action324} from "@/app/(app)/settings/user-actions";
import {revokeUserSessions as action325} from "@/app/(app)/settings/user-actions";
import {issuePasswordRecovery as action326} from "@/app/(app)/settings/user-actions";
import {createManagedUser as action327} from "@/app/(app)/settings/user-actions";
import {linkEmployeeProfile as action328} from "@/app/(app)/settings/user-actions";
import {createRole as action329} from "@/app/(app)/settings/user-actions";
import {saveManagementGroup as action330} from "@/app/(app)/settings/user-actions";
import {createWarehouse as action331} from "@/app/(app)/stock/actions";
import {adjustStock as action332} from "@/app/(app)/stock/actions";
import {savePlanningAction as action333} from "@/app/(app)/stock/actions";
import {makeFromForecastAction as action334} from "@/app/(app)/stock/actions";
import {transferStock as action335} from "@/app/(app)/stock/actions";
import {createSiteAction as action336} from "@/app/(app)/stock/actions";
import {createPlaceAction as action337} from "@/app/(app)/stock/actions";
import {assignSiteAction as action338} from "@/app/(app)/stock/actions";
import {addLocationAction as action339} from "@/app/(app)/stock/actions";
import {ensureLocationsAction as action340} from "@/app/(app)/stock/actions";
import {retireLocationAction as action341} from "@/app/(app)/stock/actions";
import {putOnLocationAction as action342} from "@/app/(app)/stock/actions";
import {moveLocatedAction as action343} from "@/app/(app)/stock/actions";
import {receiveMoveAction as action344} from "@/app/(app)/stock/actions";
import {delegateApprovals as action345} from "@/core/approvals/actions";
import {loginAction as action346} from "@/core/auth/actions";
import {logoutAction as action347} from "@/core/auth/actions";
import {completePasswordRecovery as action348} from "@/core/auth/security-actions";
import {changeOwnPassword as action349} from "@/core/auth/security-actions";
import {signOutOtherSessions as action350} from "@/core/auth/security-actions";
import {createContract as action351} from "@/core/contracts/actions";
import {sendContract as action352} from "@/core/contracts/actions";
import {shareContractLink as action353} from "@/core/contracts/actions";
import {deleteContract as action354} from "@/core/contracts/actions";
import {signContract as action355} from "@/core/contracts/actions";
import {declineContract as action356} from "@/core/contracts/actions";
import {loadPublicContract as action357} from "@/core/contracts/actions";
import {loadPublicContractFile as action358} from "@/core/contracts/actions";
import {checkForDuplicatesAction as action359} from "@/core/customers/actions";
import {createCustomerAction as action360} from "@/core/customers/actions";
import {createCustomer as action361} from "@/core/customers/commands";
import {updateCustomerStatus as action362} from "@/core/customers/commands";
import {deleteCustomer as action363} from "@/core/customers/commands";
import {createContact as action364} from "@/core/customers/commands";
import {updateContact as action365} from "@/core/customers/commands";
import {deleteContact as action366} from "@/core/customers/commands";
import {createAddress as action367} from "@/core/customers/commands";
import {updateCommercialSettings as action368} from "@/core/customers/commands";
import {updateCreditLimit as action369} from "@/core/customers/commands";
import {setCreditHold as action370} from "@/core/customers/commands";
import {setPaymentTerm as action371} from "@/core/customers/commands";
import {createTaxRegistration as action372} from "@/core/customers/commands";
import {markTaxRegistrationManuallyVerified as action373} from "@/core/customers/commands";
import {createBankAccount as action374} from "@/core/customers/commands";
import {revealBankAccount as action375} from "@/core/customers/commands";
import {createDirectDebitMandate as action376} from "@/core/customers/commands";
import {cancelDirectDebitMandate as action377} from "@/core/customers/commands";
import {createNote as action378} from "@/core/customers/commands";
import {saveCustomerHashtags as action379} from "@/core/customers/commands";
import {updateCustomerDetails as action380} from "@/core/customers/commands";
import {updateAddress as action381} from "@/core/customers/commands";
import {archiveAddress as action382} from "@/core/customers/commands";
import {saveOrderingPreferences as action383} from "@/core/customers/commercial-actions";
import {setCustomerParent as action384} from "@/core/customers/hierarchy-actions";
import {placeCustomer as action385} from "@/core/customers/hierarchy-actions";
import {moveCustomer as action386} from "@/core/customers/hierarchy-actions";
import {setContactReportsTo as action387} from "@/core/customers/hierarchy-actions";
import {saveCustomerTradingLink as action388} from "@/core/customers/trading-actions";
import {setInvoiceAccount as action389} from "@/core/customers/trading-actions";
import {archiveCustomerTradingLink as action390} from "@/core/customers/trading-actions";
import {requestSalesInvoice as action391} from "@/core/finance/actions";
import {createWorkTeam as action392} from "@/core/teams/actions";
import {loadAuditBoard as action393} from "@/modules/audit/services/actions";
import {exportAuditReport as action394} from "@/modules/audit/services/actions";
import {loadEcho as action395} from "@/modules/audit/services/actions";
import {postEchoNote as action396} from "@/modules/audit/services/actions";
import {loadEchoInbox as action397} from "@/modules/audit/services/actions";
import {loadAuditAccess as action398} from "@/modules/audit/services/actions";
import {saveAuditOwnActivity as action399} from "@/modules/audit/services/actions";
import {saveAuditAreas as action400} from "@/modules/audit/services/actions";
import {saveAutomation as action401} from "@/modules/automations/services/actions";
import {setAutomationEnabled as action402} from "@/modules/automations/services/actions";
import {deleteAutomation as action403} from "@/modules/automations/services/actions";
import {testOnPastEvent as action404} from "@/modules/automations/services/actions";
import {runNow as action405} from "@/modules/automations/services/actions";
import {logActivity as action406} from "@/modules/crm/services/activities";
import {completeActivity as action407} from "@/modules/crm/services/activities";
import {acceptMarketingHandoff as action408} from "@/modules/crm/services/marketing-handoff";
import {createOpportunity as action409} from "@/modules/crm/services/opportunities";
import {moveOpportunityStage as action410} from "@/modules/crm/services/opportunities";
import {updateOpportunityValue as action411} from "@/modules/crm/services/opportunities";
import {updateOpportunityCloseDate as action412} from "@/modules/crm/services/opportunities";
import {setOpportunityForecastCategory as action413} from "@/modules/crm/services/opportunities";
import {setOpportunityNextAction as action414} from "@/modules/crm/services/opportunities";
import {winOpportunity as action415} from "@/modules/crm/services/opportunities";
import {loseOpportunity as action416} from "@/modules/crm/services/opportunities";
import {addStakeholder as action417} from "@/modules/crm/services/opportunities";
import {addMilestone as action418} from "@/modules/crm/services/opportunities";
import {toggleMilestone as action419} from "@/modules/crm/services/opportunities";
import {checkProspectDuplicatesAction as action420} from "@/modules/crm/services/prospects";
import {createProspect as action421} from "@/modules/crm/services/prospects";
import {assignProspect as action422} from "@/modules/crm/services/prospects";
import {setProspectLifecycleStage as action423} from "@/modules/crm/services/prospects";
import {convertProspect as action424} from "@/modules/crm/services/prospects";
import {createIndustry as action425} from "@/modules/crm/services/prospects";
import {saveProspectGrouping as action426} from "@/modules/crm/services/prospects";
import {createSalesProject as action427} from "@/modules/crm/services/sales-projects-commands";
import {createSalesProjectFormAction as action428} from "@/modules/crm/services/sales-projects-commands";
import {saveSalesProjectAction as action429} from "@/modules/crm/services/sales-projects-commands";
import {saveNextActionAction as action430} from "@/modules/crm/services/sales-projects-commands";
import {addProjectOrganisationAction as action431} from "@/modules/crm/services/sales-projects-commands";
import {removeProjectOrganisationAction as action432} from "@/modules/crm/services/sales-projects-commands";
import {makePrimaryOrganisationAction as action433} from "@/modules/crm/services/sales-projects-commands";
import {addProjectStakeholderAction as action434} from "@/modules/crm/services/sales-projects-commands";
import {removeProjectStakeholderAction as action435} from "@/modules/crm/services/sales-projects-commands";
import {setDocumentSalesProjectAction as action436} from "@/modules/crm/services/sales-projects-commands";
import {deleteSalesProjectAction as action437} from "@/modules/crm/services/sales-projects-commands";
import {saveSurvey as action438} from "@/modules/csat/services/actions";
import {createSurveyFromTemplate as action439} from "@/modules/csat/services/actions";
import {setSurveyActive as action440} from "@/modules/csat/services/actions";
import {deleteSurvey as action441} from "@/modules/csat/services/actions";
import {recordCsatScore as action442} from "@/modules/csat/services/actions";
import {recordCsatComment as action443} from "@/modules/csat/services/actions";
import {setupFinance as action444} from "@/modules/finance/services/commands";
import {createFinanceDocument as action445} from "@/modules/finance/services/commands";
import {submitFinanceDocument as action446} from "@/modules/finance/services/commands";
import {saveApprovalPolicy as action447} from "@/modules/finance/services/commands";
import {decideFinanceApproval as action448} from "@/modules/finance/services/commands";
import {createPurchaseOrder as action449} from "@/modules/finance/services/commands";
import {raiseServiceCredit as action450} from "@/modules/finance/services/commands";
import {postFinanceDocument as action451} from "@/modules/finance/services/commands";
import {recordGoodsReceipt as action452} from "@/modules/finance/services/commands";
import {onboardSupplier as action453} from "@/modules/finance/services/commands";
import {approveSupplier as action454} from "@/modules/finance/services/commands";
import {requestSupplierBankChange as action455} from "@/modules/finance/services/commands";
import {verifySupplierBank as action456} from "@/modules/finance/services/commands";
import {createFinanceBank as action457} from "@/modules/finance/services/commands";
import {importBankTransactions as action458} from "@/modules/finance/services/commands";
import {allocateBankTransaction as action459} from "@/modules/finance/services/commands";
import {createPaymentRun as action460} from "@/modules/finance/services/commands";
import {approvePaymentRun as action461} from "@/modules/finance/services/commands";
import {createManualJournal as action462} from "@/modules/finance/services/commands";
import {approveManualJournal as action463} from "@/modules/finance/services/commands";
import {reverseJournal as action464} from "@/modules/finance/services/commands";
import {setFinancePeriodState as action465} from "@/modules/finance/services/commands";
import {saveFinanceBudget as action466} from "@/modules/finance/services/commands";
import {saveFinanceAsset as action467} from "@/modules/finance/services/commands";
import {postAssetDepreciation as action468} from "@/modules/finance/services/commands";
import {completeCloseTask as action469} from "@/modules/finance/services/commands";
import {saveFinanceContract as action470} from "@/modules/finance/services/commands";
import {saveFinanceScenario as action471} from "@/modules/finance/services/commands";
import {receiptForm as action472} from "@/modules/finance/services/commands";
import {journalForm as action473} from "@/modules/finance/services/commands";
import {statementForm as action474} from "@/modules/finance/services/commands";
import {allocationForm as action475} from "@/modules/finance/services/commands";
import {paymentRunForm as action476} from "@/modules/finance/services/commands";
import {policyForm as action477} from "@/modules/finance/services/commands";
import {scenarioForm as action478} from "@/modules/finance/services/commands";
import {uploadFinanceAttachment as action479} from "@/modules/finance/services/commands";
import {generateSalesInvoice as action480} from "@/modules/finance/services/commands";
import {generateInvoiceAdjustment as action481} from "@/modules/finance/services/commands";
import {voidFinanceDraft as action482} from "@/modules/finance/services/commands";
import {getFinanceHome as action483} from "@/modules/finance/services/queries";
import {listFinanceDocuments as action484} from "@/modules/finance/services/queries";
import {getFinanceDocument as action485} from "@/modules/finance/services/queries";
import {getFinanceWorkspace as action486} from "@/modules/finance/services/queries";
import {financeChoices as action487} from "@/modules/finance/services/queries";
import {getBudgetPositions as action488} from "@/modules/finance/services/queries";
import {getInvoiceCashForecast as action489} from "@/modules/finance/services/queries";
import {getFinancialReport as action490} from "@/modules/finance/services/queries";
import {getFinanceCustomerContribution as action491} from "@/modules/finance/services/queries";
import {searchFinance as action492} from "@/modules/finance/services/queries";
import {getFinanceAttachment as action493} from "@/modules/finance/services/queries";
import {getSalesFinanceProjection as action494} from "@/modules/finance/services/queries";
import {getReceivingWarehouses as action495} from "@/modules/finance/services/queries";
import {createProductionOrder as action496} from "@/modules/manufacturing/services/commands";
import {markOrderReady as action497} from "@/modules/manufacturing/services/commands";
import {releaseOrder as action498} from "@/modules/manufacturing/services/commands";
import {closeOrder as action499} from "@/modules/manufacturing/services/commands";
import {startWorkOrder as action500} from "@/modules/manufacturing/services/commands";
import {pauseWorkOrder as action501} from "@/modules/manufacturing/services/commands";
import {completeWorkOrder as action502} from "@/modules/manufacturing/services/commands";
import {listForecasts as action503} from "@/modules/manufacturing/services/forecast";
import {setForecast as action504} from "@/modules/manufacturing/services/forecast";
import {deleteForecast as action505} from "@/modules/manufacturing/services/forecast";
import {runMrp as action506} from "@/modules/manufacturing/services/mrp";
import {firmSuggestion as action507} from "@/modules/manufacturing/services/mrp";
import {dismissSuggestion as action508} from "@/modules/manufacturing/services/mrp";
import {latestPlan as action509} from "@/modules/manufacturing/services/mrp";
import {loadPlant as action510} from "@/modules/manufacturing/services/plant";
import {saveWorkCentre as action511} from "@/modules/manufacturing/services/plant";
import {saveMachine as action512} from "@/modules/manufacturing/services/plant";
import {retirePlantRecord as action513} from "@/modules/manufacturing/services/plant";
import {schedulePreview as action514} from "@/modules/manufacturing/services/scheduler";
import {rescheduleWorkOrder as action515} from "@/modules/manufacturing/services/scheduler";
import {setWorkOrderLock as action516} from "@/modules/manufacturing/services/scheduler";
import {listShifts as action517} from "@/modules/manufacturing/services/shifts";
import {saveShift as action518} from "@/modules/manufacturing/services/shifts";
import {deleteShift as action519} from "@/modules/manufacturing/services/shifts";
import {createCampaign as action520} from "@/modules/marketing/services/commands";
import {updateCampaign as action521} from "@/modules/marketing/services/commands";
import {createProfile as action522} from "@/modules/marketing/services/commands";
import {recordPermission as action523} from "@/modules/marketing/services/commands";
import {suppressProfile as action524} from "@/modules/marketing/services/commands";
import {createAudience as action525} from "@/modules/marketing/services/commands";
import {previewAudience as action526} from "@/modules/marketing/services/commands";
import {createContent as action527} from "@/modules/marketing/services/commands";
import {approveContent as action528} from "@/modules/marketing/services/commands";
import {createMessage as action529} from "@/modules/marketing/services/commands";
import {lockSend as action530} from "@/modules/marketing/services/commands";
import {cancelSend as action531} from "@/modules/marketing/services/commands";
import {ingestEvent as action532} from "@/modules/marketing/services/commands";
import {createJourney as action533} from "@/modules/marketing/services/commands";
import {publishJourney as action534} from "@/modules/marketing/services/commands";
import {reviseJourney as action535} from "@/modules/marketing/services/commands";
import {createProgram as action536} from "@/modules/marketing/services/commands";
import {createExperiment as action537} from "@/modules/marketing/services/commands";
import {leadFeedback as action538} from "@/modules/marketing/services/commands";
import {processJourneySteps as action539} from "@/modules/marketing/services/commands";
import {saveMarketingPlan as action540} from "@/modules/marketing/services/commands";
import {addPlanActivity as action541} from "@/modules/marketing/services/commands";
import {updatePlanActivity as action542} from "@/modules/marketing/services/commands";
import {addBudgetLine as action543} from "@/modules/marketing/services/commands";
import {submitBudgetToFinance as action544} from "@/modules/marketing/services/commands";
import {createJourneyMap as action545} from "@/modules/marketing/services/commands";
import {addJourneyStage as action546} from "@/modules/marketing/services/commands";
import {addJourneyTouch as action547} from "@/modules/marketing/services/commands";
import {saveSocialPost as action548} from "@/modules/marketing/services/social-actions";
import {deleteSocialPost as action549} from "@/modules/marketing/services/social-actions";
import {retrySocialPost as action550} from "@/modules/marketing/services/social-actions";
import {getApprovedExpenseSource as action551} from "@/modules/people/services/finance-expenses";
import {createPlan as action552} from "@/modules/plan/services/commands";
import {saveCell as action553} from "@/modules/plan/services/commands";
import {addMeasure as action554} from "@/modules/plan/services/commands";
import {addAssumption as action555} from "@/modules/plan/services/commands";
import {addDriver as action556} from "@/modules/plan/services/commands";
import {addLink as action557} from "@/modules/plan/services/commands";
import {createScenario as action558} from "@/modules/plan/services/commands";
import {promoteScenario as action559} from "@/modules/plan/services/commands";
import {submitPlan as action560} from "@/modules/plan/services/commands";
import {approvePlan as action561} from "@/modules/plan/services/commands";
import {lockPlan as action562} from "@/modules/plan/services/commands";
import {addGoal as action563} from "@/modules/plan/services/commands";
import {addInitiative as action564} from "@/modules/plan/services/commands";
import {createProjectForInitiative as action565} from "@/modules/plan/services/commands";
import {addAction as action566} from "@/modules/plan/services/commands";
import {completeAction as action567} from "@/modules/plan/services/commands";
import {addRisk as action568} from "@/modules/plan/services/commands";
import {addDependency as action569} from "@/modules/plan/services/commands";
import {addDecision as action570} from "@/modules/plan/services/commands";
import {addComment as action571} from "@/modules/plan/services/commands";
import {addUpdate as action572} from "@/modules/plan/services/commands";
import {completeReview as action573} from "@/modules/plan/services/commands";
import {addReview as action574} from "@/modules/plan/services/commands";
import {distributeTargets as action575} from "@/modules/plan/services/commands";
import {importGrid as action576} from "@/modules/plan/services/commands";
import {sharePlan as action577} from "@/modules/plan/services/commands";
import {unsharePlan as action578} from "@/modules/plan/services/commands";
import {setPlanAudience as action579} from "@/modules/plan/services/commands";
import {addNote as action580} from "@/modules/plan/services/commands";
import {saveGoalProgress as action581} from "@/modules/plan/services/commands";
import {savePlanBrief as action582} from "@/modules/plan/services/commands";
import {listProductionPlans as action583} from "@/modules/planning/services/plans";
import {getPlanOptions as action584} from "@/modules/planning/services/plans";
import {getProductionPlan as action585} from "@/modules/planning/services/plans";
import {createProductionPlan as action586} from "@/modules/planning/services/plans";
import {addProductionPlanLine as action587} from "@/modules/planning/services/plans";
import {getAssignedPlanningWork as action588} from "@/modules/planning/services/plans";
import {getPlanningCoverage as action589} from "@/modules/planning/services/queries";
import {saveProductRecipe as action590} from "@/modules/products/services/make";
import {createSpecification as action591} from "@/modules/quality/services/commands";
import {setSpecificationStatus as action592} from "@/modules/quality/services/commands";
import {createControlPoint as action593} from "@/modules/quality/services/commands";
import {executeInspection as action594} from "@/modules/quality/services/commands";
import {releaseHold as action595} from "@/modules/quality/services/commands";
import {reportNcr as action596} from "@/modules/quality/services/commands";
import {updateNcrInvestigation as action597} from "@/modules/quality/services/commands";
import {addNcrAction as action598} from "@/modules/quality/services/commands";
import {updateNcrAction as action599} from "@/modules/quality/services/commands";
import {closeNcr as action600} from "@/modules/quality/services/commands";
import {saveSubstance as action601} from "@/modules/safety/services/assurance";
import {addSafetyDataSheet as action602} from "@/modules/safety/services/assurance";
import {saveCoshhAssessment as action603} from "@/modules/safety/services/assurance";
import {approveSubstance as action604} from "@/modules/safety/services/assurance";
import {saveCompetence as action605} from "@/modules/safety/services/assurance";
import {saveSafetyDocument as action606} from "@/modules/safety/services/assurance";
import {acknowledgeDocument as action607} from "@/modules/safety/services/assurance";
import {saveAudit as action608} from "@/modules/safety/services/assurance";
import {addAuditFinding as action609} from "@/modules/safety/services/assurance";
import {approveAudit as action610} from "@/modules/safety/services/assurance";
import {saveChange as action611} from "@/modules/safety/services/assurance";
import {advanceChange as action612} from "@/modules/safety/services/assurance";
import {linkSafetyRecord as action613} from "@/modules/safety/services/assurance";
import {saveSafetyProfile as action614} from "@/modules/safety/services/commands";
import {saveRiskMatrix as action615} from "@/modules/safety/services/commands";
import {createRisk as action616} from "@/modules/safety/services/commands";
import {addControl as action617} from "@/modules/safety/services/commands";
import {rateAssessment as action618} from "@/modules/safety/services/commands";
import {approveAssessment as action619} from "@/modules/safety/services/commands";
import {reviseAssessment as action620} from "@/modules/safety/services/commands";
import {requestRiskReview as action621} from "@/modules/safety/services/commands";
import {reportIncident as action622} from "@/modules/safety/services/commands";
import {saveImmediateControl as action623} from "@/modules/safety/services/commands";
import {openInvestigation as action624} from "@/modules/safety/services/commands";
import {addCause as action625} from "@/modules/safety/services/commands";
import {saveRootCause as action626} from "@/modules/safety/services/commands";
import {reviewRiddor as action627} from "@/modules/safety/services/commands";
import {createSafetyAction as action628} from "@/modules/safety/services/commands";
import {advanceAction as action629} from "@/modules/safety/services/commands";
import {verifyAction as action630} from "@/modules/safety/services/commands";
import {saveWorkplaceRecord as action631} from "@/modules/safety/services/commands";
import {createPermit as action632} from "@/modules/safety/services/control";
import {advancePermit as action633} from "@/modules/safety/services/control";
import {extendPermit as action634} from "@/modules/safety/services/control";
import {createIsolation as action635} from "@/modules/safety/services/control";
import {applyIsolationLock as action636} from "@/modules/safety/services/control";
import {verifyIsolation as action637} from "@/modules/safety/services/control";
import {clearIsolation as action638} from "@/modules/safety/services/control";
import {removeIsolationLock as action639} from "@/modules/safety/services/control";
import {placeSafetyHold as action640} from "@/modules/safety/services/control";
import {updateReturnToService as action641} from "@/modules/safety/services/control";
import {releaseSafetyHold as action642} from "@/modules/safety/services/control";
import {overrideSafetyHold as action643} from "@/modules/safety/services/control";
import {saveStatutoryCheck as action644} from "@/modules/safety/services/control";
import {completeInspection as action645} from "@/modules/safety/services/control";
import {createInspection as action646} from "@/modules/safety/services/control";
import {createSalesAddress as action647} from "@/modules/sales/services/address-actions";
import {createSalesCatalogueProduct as action648} from "@/modules/sales/services/catalogue-actions";
import {sendQuote as action649} from "@/modules/sales/services/commands";
import {changeQuoteStatus as action650} from "@/modules/sales/services/commands";
import {deleteQuote as action651} from "@/modules/sales/services/commands";
import {duplicateDocument as action652} from "@/modules/sales/services/commands";
import {saveQuoteTemplate as action653} from "@/modules/sales/services/commands";
import {createOrderFromQuote as action654} from "@/modules/sales/services/commands";
import {linkCommercialProject as action655} from "@/modules/sales/services/commercial";
import {openCallOffOrder as action656} from "@/modules/sales/services/commercial";
import {raiseCallOff as action657} from "@/modules/sales/services/commercial";
import {invoiceCallOffDelivery as action658} from "@/modules/sales/services/commercial";
import {deliverAndInvoiceCallOff as action659} from "@/modules/sales/services/commercial";
import {importSalescsv as action660} from "@/modules/sales/services/csv-import";
import {addDeliveryAddress as action661} from "@/modules/sales/services/delivery-address";
import {addInstaller as action662} from "@/modules/sales/services/delivery-address";
import {pricePartyId as action663} from "@/modules/sales/services/delivery-address";
import {linkOrderedFor as action664} from "@/modules/sales/services/delivery-address";
import {saveDocument as action665} from "@/modules/sales/services/documents";
import {saveInvoiceTemplate as action666} from "@/modules/sales/services/invoice-template-actions";
import {retireInvoiceTemplate as action667} from "@/modules/sales/services/invoice-template-actions";
import {attachCustomerInvoiceTemplate as action668} from "@/modules/sales/services/invoice-template-actions";
import {detachCustomerInvoiceTemplate as action669} from "@/modules/sales/services/invoice-template-actions";
import {createDraftOrder as action670} from "@/modules/sales/services/orders";
import {addOrderLine as action671} from "@/modules/sales/services/orders";
import {removeOrderLine as action672} from "@/modules/sales/services/orders";
import {updateDraftOrderFields as action673} from "@/modules/sales/services/orders";
import {confirmOrder as action674} from "@/modules/sales/services/orders";
import {decideApproval as action675} from "@/modules/sales/services/orders";
import {amendLineQuantity as action676} from "@/modules/sales/services/orders";
import {overrideLinePrice as action677} from "@/modules/sales/services/orders";
import {amendRequestedDate as action678} from "@/modules/sales/services/orders";
import {cancelOrder as action679} from "@/modules/sales/services/orders";
import {deleteOrder as action680} from "@/modules/sales/services/orders";
import {cancelLineRemaining as action681} from "@/modules/sales/services/orders";
import {addHold as action682} from "@/modules/sales/services/orders";
import {releaseHold as action683} from "@/modules/sales/services/orders";
import {restoreCancelledOrder as action684} from "@/modules/sales/services/rewind";
import {returnOrderToQuote as action685} from "@/modules/sales/services/rewind";
import {saveOrderHashtags as action686} from "@/modules/sales/services/rewind";
import {saveSalesView as action687} from "@/modules/sales/services/saved-views";
import {archiveSalesView as action688} from "@/modules/sales/services/saved-views";
import {createCase as action689} from "@/modules/service/services/commands";
import {updateCase as action690} from "@/modules/service/services/commands";
import {assignCase as action691} from "@/modules/service/services/commands";
import {transitionCase as action692} from "@/modules/service/services/commands";
import {addCaseEntry as action693} from "@/modules/service/services/commands";
import {createDepartmentTicket as action694} from "@/modules/service/services/commands";
import {updateDepartmentTicket as action695} from "@/modules/service/services/commands";
import {createQueue as action696} from "@/modules/service/services/commands";
import {addQueueMember as action697} from "@/modules/service/services/commands";
import {linkCaseRecord as action698} from "@/modules/service/services/commands";
import {creditChoices as action699} from "@/modules/service/services/commands";
import {askFinanceForCredit as action700} from "@/modules/service/services/commands";
import {getCaseOwners as action701} from "@/modules/service/services/commands";
import {getDepartmentWork as action702} from "@/modules/service/services/commands";
import {readAvailability as action703} from "@/modules/stock/services/availability";
import {readOrderChain as action704} from "@/modules/stock/services/availability";
import {inventoryExportRows as action705} from "@/modules/stock/services/export";
import {createTeam as action706} from "@/modules/teams/services/commands";
import {renameTeam as action707} from "@/modules/teams/services/commands";
import {addMember as action708} from "@/modules/teams/services/commands";
import {removeMember as action709} from "@/modules/teams/services/commands";
import {saveTask as action710} from "@/modules/teams/services/commands";
import {setTaskStatus as action711} from "@/modules/teams/services/commands";
import {removeTask as action712} from "@/modules/teams/services/commands";
import {saveCover as action713} from "@/modules/teams/services/commands";
import {removeCover as action714} from "@/modules/teams/services/commands";
import {saveHandover as action715} from "@/modules/teams/services/commands";
import {savePlace as action716} from "@/modules/teams/services/commands";
import {saveMoment as action717} from "@/modules/teams/services/commands";
import {removeMoment as action718} from "@/modules/teams/services/commands";
export const DATA_ACTIONS:Record<string,(...args:never[])=>Promise<unknown>>={
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
"src/app/(app)/atlas/setup-actions:importCompanySetup":action13 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/setup-actions:createCompanyUser":action14 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/setup-actions:setCompanyUserStatus":action15 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:postMessage":action16 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:searchChatPeople":action17 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:openChat":action18 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:openDirectChat":action19 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:searchChatRecords":action20 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:sendChat":action21 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:chatSnapshot":action22 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:updateValueFormAction":action23 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:updateCloseDateFormAction":action24 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:setNextActionFormAction":action25 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:setForecastCategoryFormAction":action26 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:winFormAction":action27 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:loseFormAction":action28 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:addStakeholderFormAction":action29 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:addMilestoneFormAction":action30 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:toggleMilestoneFormAction":action31 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:logOpportunityActivityFormAction":action32 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/pipeline/actions:addDealAction":action33 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:qualifyFormAction":action34 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:disqualifyFormAction":action35 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:nurtureFormAction":action36 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:logProspectActivityFormAction":action37 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:assignProspectFormAction":action38 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:assignProspectTaskFormAction":action39 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:convertProspectFormAction":action40 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/reports/actions:pinReportToDashboard":action41 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createContactFormAction":action42 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateContactFormAction":action43 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:deleteContactFormAction":action44 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createAddressFormAction":action45 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createTaxRegistrationFormAction":action46 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:markTaxVerifiedFormAction":action47 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createBankAccountFormAction":action48 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createDirectDebitFormAction":action49 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:cancelDirectDebitFormAction":action50 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateCreditLimitFormAction":action51 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:toggleCreditHoldFormAction":action52 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createNoteFormAction":action53 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateStatusFormAction":action54 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:deleteCustomerFormAction":action55 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:createKpi":action56 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:saveGoal":action57 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:updateKpi":action58 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:recordProgress":action59 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:closeGoal":action60 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:addPlanGoal":action61 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:closePlan":action62 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:commentOnPlan":action63 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:syncDemandAction":action64 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:restoreDeliveryAction":action65 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:releaseAction":action66 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:allocateAction":action67 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:directShipAction":action68 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:groupAction":action69 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:scanAction":action70 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:lotAction":action71 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:serialAction":action72 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shortAction":action73 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeWorkAction":action74 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:claimAction":action75 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shipFromPickAction":action76 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packageAction":action77 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:weightAction":action78 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:stageAction":action79 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:labelAction":action80 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:dispatchAction":action81 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:trackingAction":action82 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:deliverAction":action83 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadCreateAction":action84 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadScanAction":action85 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:departAction":action86 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:expectAction":action87 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveLineAction":action88 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:putAwayAction":action89 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeReceiptAction":action90 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferAction":action91 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferReceiveAction":action92 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:returnRequestAction":action93 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:authoriseReturnAction":action94 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveReturnAction":action95 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:inspectAction":action96 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:closeReturnAction":action97 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:assignEquipmentAction":action98 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packUnitAction":action99 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:saveHandlingTypeAction":action100 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:retireHandlingTypeAction":action101 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:removeHandlingTypeAction":action102 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:policyAction":action103 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:runMrpAction":action104 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:firmSuggestionAction":action105 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:dismissSuggestionAction":action106 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:setForecastAction":action107 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:deleteForecastAction":action108 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:runMrpAction":action109 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:firmPlannedOrderAction":action110 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:dismissPlannedOrderAction":action111 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:runMrpForm":action112 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:firmPlannedOrderForm":action113 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:dismissPlannedOrderForm":action114 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:previewMoveAction":action115 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:commitMoveAction":action116 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:toggleLockAction":action117 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:saveShiftAction":action118 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:deleteShiftAction":action119 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:startAction":action120 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:pauseAction":action121 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:completeAction":action122 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:loadNotices":action123 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotice":action124 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotices":action125 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:createPayrollRun":action126 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:updatePayslipDeductions":action127 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:finalisePayrollRun":action128 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:markPayrollRunPaid":action129 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:savePayrollSettings":action130 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP45":action131 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP60":action132 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:logAbsence":action133 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:requestLeave":action134 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:cancelOwnLeave":action135 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:approveLeaveRequest":action136 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:setLeaveAllowance":action137 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:rejectLeaveRequest":action138 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:createEmployee":action139 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:changeEmployeeStatus":action140 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeProfile":action141 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateOwnEmployeeDetails":action142 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeDocument":action143 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:linkEmployeeToUser":action144 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:completeEmployeeTask":action145 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeTask":action146 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeContact":action147 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeTask":action148 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:scheduleAppraisal":action149 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:completeAppraisal":action150 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getConductDesk":action151 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getMyConduct":action152 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getPlan":action153 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getCase":action154 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:conductChoices":action155 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:savePlan":action156 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addPlanReview":action157 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:commentOnPlan":action158 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:saveCase":action159 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:respondToCase":action160 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addCaseEvent":action161 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:submitExpenseClaim":action162 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:approveExpenseClaim":action163 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:rejectExpenseClaim":action164 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:scheduleOneToOne":action165 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:completeOneToOne":action166 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:listPolicies":action167 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:publishPolicy":action168 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:archivePolicy":action169 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:openPolicy":action170 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:createShift":action171 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:changeShiftStatus":action172 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyHR":action173 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyTeam":action174 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getTeamEmployee":action175 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:addPrivateNote":action176 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:updateWorkingPattern":action177 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:updateHrSettings":action178 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createAppraisalTemplate":action179 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleAppraisalTemplateActive":action180 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createOneToOneTemplate":action181 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleOneToOneTemplateActive":action182 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:getTimesheetContext":action183 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:saveTimesheet":action184 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:reviewTimesheet":action185 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:createPriceList":action186 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:savePriceEntry":action187 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveRule":action188 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:setRuleActive":action189 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:updatePriceBasis":action190 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:assignPriceList":action191 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewPriceCsv":action192 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyPriceCsv":action193 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreement":action194 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreementPrice":action195 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:removeAgreementPrice":action196 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewAgreementCsv":action197 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyAgreementCsv":action198 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProduct":action199 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProductRecord":action200 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveCategory":action201 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:retireCategory":action202 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:addStandardCategories":action203 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:savePack":action204 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveLinks":action205 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveMeasures":action206 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/actions:saveProfile":action207 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/work:loadAssignedWork":action208 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProject":action209 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeProjectStatus":action210 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editProject":action211 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProjectMember":action212 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:archiveProject":action213 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTask":action214 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeTaskStatus":action215 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editTask":action216 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:checklistItem":action217 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addDependency":action218 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMeeting":action219 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDocument":action220 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editDocument":action221 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addComment":action222 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMilestone":action223 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:publishUpdate":action224 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDecision":action225 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:decide":action226 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createRisk":action227 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:closeRisk":action228 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:requestApproval":action229 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:respondApproval":action230 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:submitRequest":action231 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:triageRequest":action232 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:logTime":action233 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:planToday":action234 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:updateInbox":action235 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveView":action236 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createPortfolio":action237 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createBaseline":action238 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setBudget":action239 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:linkWork":action240 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectActivity":action241 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createAutomation":action242 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:toggleAutomation":action243 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveProjectTemplate":action244 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:useProjectTemplate":action245 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:startTimer":action246 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:stopTimer":action247 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:projectPreference":action248 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:uploadProjectFile":action249 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:readProjectFile":action250 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProperty":action251 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProperty":action252 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:restoreDocument":action253 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTaskFromDocument":action254 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:discardTimer":action255 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:completeMilestone":action256 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:resolveComment":action257 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectWorkload":action258 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:newContractAction":action259 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:resendContractAction":action260 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:deleteContractAction":action261 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:createOrderForm":action262 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addLineForm":action263 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:removeLineForm":action264 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:confirmOrderForm":action265 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:updateOrderForm":action266 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:chooseOrderAddresses":action267 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addHoldForm":action268 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:releaseHoldForm":action269 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:approveOrderForm":action270 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:cancelOrderForm":action271 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:saveOrderHashtagsForm":action272 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:restoreCancelledOrderForm":action273 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:returnOrderToQuoteForm":action274 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:scheduleOrderDelivery":action275 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:rejectOrderApproval":action276 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:deleteOrderForm":action277 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:createQuote":action278 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:deleteQuoteForm":action279 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/settings/actions:saveCreationPolicy":action280 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/sites/actions:saveSiteAction":action281 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/sites/actions:setDocumentSiteAction":action282 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getSchedule":action283 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:createBulkShifts":action284 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:setScheduledShift":action285 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:completeShiftTask":action286 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:editScheduledShift":action287 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishWeekShifts":action288 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveHoursBudget":action289 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getTeamPlan":action290 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getPersonSchedule":action291 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveWorkType":action292 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:archiveWorkType":action293 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveDemand":action294 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveBusyRule":action295 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:removeBusyRule":action296 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:fillTeamMonth":action297 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:replanCover":action298 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishMonth":action299 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveShift":action300 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveRole":action301 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveMemberRoles":action302 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:createUser":action303 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyAccess":action304 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyProfile":action305 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveManagerPolicy":action306 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveWorkspaceDetails":action307 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyBrand":action308 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/imports/actions:importCsv":action309 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveEmailAccount":action310 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:verifyEmailAccount":action311 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:sendTestEmail":action312 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:makeDefaultAccount":action313 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:setAccountActive":action314 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteEmailAccount":action315 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveSocialAccount":action316 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteSocialAccount":action317 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:checkSocialAccount":action318 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveEmailTemplate":action319 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteEmailTemplate":action320 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:checkInboxNow":action321 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/logistics/actions:saveDispatchDelivery":action322 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveUserAccess":action323 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:setUserStatus":action324 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:revokeUserSessions":action325 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:issuePasswordRecovery":action326 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createManagedUser":action327 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:linkEmployeeProfile":action328 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createRole":action329 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveManagementGroup":action330 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createWarehouse":action331 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:adjustStock":action332 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:savePlanningAction":action333 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:makeFromForecastAction":action334 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:transferStock":action335 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createSiteAction":action336 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createPlaceAction":action337 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:assignSiteAction":action338 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:addLocationAction":action339 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:ensureLocationsAction":action340 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:retireLocationAction":action341 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:putOnLocationAction":action342 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:moveLocatedAction":action343 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:receiveMoveAction":action344 as (...args:never[])=>Promise<unknown>,
"src/core/approvals/actions:delegateApprovals":action345 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:loginAction":action346 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:logoutAction":action347 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:completePasswordRecovery":action348 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:changeOwnPassword":action349 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:signOutOtherSessions":action350 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:createContract":action351 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:sendContract":action352 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:shareContractLink":action353 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:deleteContract":action354 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:signContract":action355 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:declineContract":action356 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:loadPublicContract":action357 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:loadPublicContractFile":action358 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:checkForDuplicatesAction":action359 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:createCustomerAction":action360 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createCustomer":action361 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerStatus":action362 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteCustomer":action363 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createContact":action364 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateContact":action365 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteContact":action366 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createAddress":action367 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCommercialSettings":action368 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCreditLimit":action369 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setCreditHold":action370 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setPaymentTerm":action371 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createTaxRegistration":action372 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:markTaxRegistrationManuallyVerified":action373 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createBankAccount":action374 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:revealBankAccount":action375 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createDirectDebitMandate":action376 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:cancelDirectDebitMandate":action377 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createNote":action378 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:saveCustomerHashtags":action379 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerDetails":action380 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateAddress":action381 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:archiveAddress":action382 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commercial-actions:saveOrderingPreferences":action383 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setCustomerParent":action384 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:placeCustomer":action385 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:moveCustomer":action386 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setContactReportsTo":action387 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:saveCustomerTradingLink":action388 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:setInvoiceAccount":action389 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:archiveCustomerTradingLink":action390 as (...args:never[])=>Promise<unknown>,
"src/core/finance/actions:requestSalesInvoice":action391 as (...args:never[])=>Promise<unknown>,
"src/core/teams/actions:createWorkTeam":action392 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditBoard":action393 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:exportAuditReport":action394 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEcho":action395 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:postEchoNote":action396 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEchoInbox":action397 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditAccess":action398 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditOwnActivity":action399 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditAreas":action400 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:saveAutomation":action401 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:setAutomationEnabled":action402 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:deleteAutomation":action403 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:testOnPastEvent":action404 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:runNow":action405 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:logActivity":action406 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:completeActivity":action407 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/marketing-handoff:acceptMarketingHandoff":action408 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:createOpportunity":action409 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:moveOpportunityStage":action410 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityValue":action411 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityCloseDate":action412 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityForecastCategory":action413 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityNextAction":action414 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:winOpportunity":action415 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:loseOpportunity":action416 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addStakeholder":action417 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addMilestone":action418 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:toggleMilestone":action419 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:checkProspectDuplicatesAction":action420 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createProspect":action421 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:assignProspect":action422 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:setProspectLifecycleStage":action423 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:convertProspect":action424 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createIndustry":action425 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:saveProspectGrouping":action426 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProject":action427 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProjectFormAction":action428 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:saveSalesProjectAction":action429 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:saveNextActionAction":action430 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addProjectOrganisationAction":action431 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:removeProjectOrganisationAction":action432 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:makePrimaryOrganisationAction":action433 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addProjectStakeholderAction":action434 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:removeProjectStakeholderAction":action435 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:setDocumentSalesProjectAction":action436 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:deleteSalesProjectAction":action437 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:saveSurvey":action438 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:createSurveyFromTemplate":action439 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:setSurveyActive":action440 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:deleteSurvey":action441 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatScore":action442 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatComment":action443 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setupFinance":action444 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceDocument":action445 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:submitFinanceDocument":action446 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveApprovalPolicy":action447 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:decideFinanceApproval":action448 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPurchaseOrder":action449 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:raiseServiceCredit":action450 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postFinanceDocument":action451 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:recordGoodsReceipt":action452 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:onboardSupplier":action453 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveSupplier":action454 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:requestSupplierBankChange":action455 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:verifySupplierBank":action456 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceBank":action457 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:importBankTransactions":action458 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocateBankTransaction":action459 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPaymentRun":action460 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approvePaymentRun":action461 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createManualJournal":action462 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveManualJournal":action463 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:reverseJournal":action464 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setFinancePeriodState":action465 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceBudget":action466 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceAsset":action467 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postAssetDepreciation":action468 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:completeCloseTask":action469 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceContract":action470 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceScenario":action471 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:receiptForm":action472 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:journalForm":action473 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:statementForm":action474 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocationForm":action475 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:paymentRunForm":action476 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:policyForm":action477 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:scenarioForm":action478 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:uploadFinanceAttachment":action479 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateSalesInvoice":action480 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateInvoiceAdjustment":action481 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:voidFinanceDraft":action482 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceHome":action483 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:listFinanceDocuments":action484 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceDocument":action485 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceWorkspace":action486 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:financeChoices":action487 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getBudgetPositions":action488 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getInvoiceCashForecast":action489 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinancialReport":action490 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceCustomerContribution":action491 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:searchFinance":action492 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceAttachment":action493 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getSalesFinanceProjection":action494 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getReceivingWarehouses":action495 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:createProductionOrder":action496 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:markOrderReady":action497 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:releaseOrder":action498 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:closeOrder":action499 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:startWorkOrder":action500 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:pauseWorkOrder":action501 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:completeWorkOrder":action502 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:listForecasts":action503 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:setForecast":action504 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:deleteForecast":action505 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:runMrp":action506 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:firmSuggestion":action507 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:dismissSuggestion":action508 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:latestPlan":action509 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:loadPlant":action510 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveWorkCentre":action511 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveMachine":action512 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:retirePlantRecord":action513 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:schedulePreview":action514 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:rescheduleWorkOrder":action515 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:setWorkOrderLock":action516 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:listShifts":action517 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:saveShift":action518 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:deleteShift":action519 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createCampaign":action520 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updateCampaign":action521 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProfile":action522 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:recordPermission":action523 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:suppressProfile":action524 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createAudience":action525 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:previewAudience":action526 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createContent":action527 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:approveContent":action528 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createMessage":action529 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:lockSend":action530 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:cancelSend":action531 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:ingestEvent":action532 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourney":action533 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:publishJourney":action534 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:reviseJourney":action535 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProgram":action536 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createExperiment":action537 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:leadFeedback":action538 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:processJourneySteps":action539 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:saveMarketingPlan":action540 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addPlanActivity":action541 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updatePlanActivity":action542 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addBudgetLine":action543 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:submitBudgetToFinance":action544 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourneyMap":action545 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyStage":action546 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyTouch":action547 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:saveSocialPost":action548 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:deleteSocialPost":action549 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:retrySocialPost":action550 as (...args:never[])=>Promise<unknown>,
"src/modules/people/services/finance-expenses:getApprovedExpenseSource":action551 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createPlan":action552 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveCell":action553 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addMeasure":action554 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAssumption":action555 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDriver":action556 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addLink":action557 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createScenario":action558 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:promoteScenario":action559 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:submitPlan":action560 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:approvePlan":action561 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:lockPlan":action562 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addGoal":action563 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addInitiative":action564 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createProjectForInitiative":action565 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAction":action566 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeAction":action567 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addRisk":action568 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDependency":action569 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDecision":action570 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addComment":action571 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addUpdate":action572 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeReview":action573 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addReview":action574 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:distributeTargets":action575 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:importGrid":action576 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:sharePlan":action577 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:unsharePlan":action578 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:setPlanAudience":action579 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addNote":action580 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveGoalProgress":action581 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:savePlanBrief":action582 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:listProductionPlans":action583 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getPlanOptions":action584 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getProductionPlan":action585 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:createProductionPlan":action586 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:addProductionPlanLine":action587 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getAssignedPlanningWork":action588 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/queries:getPlanningCoverage":action589 as (...args:never[])=>Promise<unknown>,
"src/modules/products/services/make:saveProductRecipe":action590 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createSpecification":action591 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:setSpecificationStatus":action592 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createControlPoint":action593 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:executeInspection":action594 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:releaseHold":action595 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:reportNcr":action596 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrInvestigation":action597 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:addNcrAction":action598 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrAction":action599 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:closeNcr":action600 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSubstance":action601 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addSafetyDataSheet":action602 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCoshhAssessment":action603 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveSubstance":action604 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCompetence":action605 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSafetyDocument":action606 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:acknowledgeDocument":action607 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveAudit":action608 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addAuditFinding":action609 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveAudit":action610 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveChange":action611 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:advanceChange":action612 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:linkSafetyRecord":action613 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveSafetyProfile":action614 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRiskMatrix":action615 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createRisk":action616 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addControl":action617 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:rateAssessment":action618 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:approveAssessment":action619 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviseAssessment":action620 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:requestRiskReview":action621 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reportIncident":action622 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveImmediateControl":action623 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:openInvestigation":action624 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addCause":action625 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRootCause":action626 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviewRiddor":action627 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createSafetyAction":action628 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:advanceAction":action629 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:verifyAction":action630 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveWorkplaceRecord":action631 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createPermit":action632 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:advancePermit":action633 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:extendPermit":action634 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createIsolation":action635 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:applyIsolationLock":action636 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:verifyIsolation":action637 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:clearIsolation":action638 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:removeIsolationLock":action639 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:placeSafetyHold":action640 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:updateReturnToService":action641 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:releaseSafetyHold":action642 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:overrideSafetyHold":action643 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:saveStatutoryCheck":action644 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:completeInspection":action645 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createInspection":action646 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/address-actions:createSalesAddress":action647 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/catalogue-actions:createSalesCatalogueProduct":action648 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:sendQuote":action649 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:changeQuoteStatus":action650 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:deleteQuote":action651 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:duplicateDocument":action652 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:saveQuoteTemplate":action653 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:createOrderFromQuote":action654 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:linkCommercialProject":action655 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:openCallOffOrder":action656 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:raiseCallOff":action657 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:invoiceCallOffDelivery":action658 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:deliverAndInvoiceCallOff":action659 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/csv-import:importSalescsv":action660 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:addDeliveryAddress":action661 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:addInstaller":action662 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:pricePartyId":action663 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:linkOrderedFor":action664 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/documents:saveDocument":action665 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:saveInvoiceTemplate":action666 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:retireInvoiceTemplate":action667 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:attachCustomerInvoiceTemplate":action668 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:detachCustomerInvoiceTemplate":action669 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:createDraftOrder":action670 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addOrderLine":action671 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:removeOrderLine":action672 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:updateDraftOrderFields":action673 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:confirmOrder":action674 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:decideApproval":action675 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendLineQuantity":action676 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:overrideLinePrice":action677 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendRequestedDate":action678 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelOrder":action679 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:deleteOrder":action680 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelLineRemaining":action681 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addHold":action682 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:releaseHold":action683 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:restoreCancelledOrder":action684 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:returnOrderToQuote":action685 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:saveOrderHashtags":action686 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:saveSalesView":action687 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:archiveSalesView":action688 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createCase":action689 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateCase":action690 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:assignCase":action691 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:transitionCase":action692 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addCaseEntry":action693 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createDepartmentTicket":action694 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateDepartmentTicket":action695 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createQueue":action696 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addQueueMember":action697 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:linkCaseRecord":action698 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:creditChoices":action699 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:askFinanceForCredit":action700 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getCaseOwners":action701 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getDepartmentWork":action702 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readAvailability":action703 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readOrderChain":action704 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/export:inventoryExportRows":action705 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:createTeam":action706 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:renameTeam":action707 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:addMember":action708 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMember":action709 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveTask":action710 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:setTaskStatus":action711 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeTask":action712 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveCover":action713 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeCover":action714 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveHandover":action715 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:savePlace":action716 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveMoment":action717 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMoment":action718 as (...args:never[])=>Promise<unknown>
};
