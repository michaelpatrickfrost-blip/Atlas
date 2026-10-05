// Generated allowlist: public calls still enforce their own server capabilities.
import {loadEmailRecord as action0} from "@/app/(app)/_shared/record-email-actions";
import {sendRecordEmailAction as action1} from "@/app/(app)/_shared/record-email-actions";
import {sendRecordContractAction as action2} from "@/app/(app)/_shared/record-email-actions";
import {loadLiveMetrics as action3} from "@/app/(app)/analytics/actions";
import {loadMetricSlice as action4} from "@/app/(app)/analytics/actions";
import {saveAnalyticsDashboard as action5} from "@/app/(app)/analytics/actions";
import {deleteAnalyticsDashboard as action6} from "@/app/(app)/analytics/actions";
import {toggleModuleAction as action7} from "@/app/(app)/apps/actions";
import {updateCompanyAccount as action8} from "@/app/(app)/atlas/actions";
import {saveCompanyEntitlements as action9} from "@/app/(app)/atlas/actions";
import {createCompanyAccount as action10} from "@/app/(app)/atlas/actions";
import {deleteTestCompany as action11} from "@/app/(app)/atlas/actions";
import {importCompanySetup as action12} from "@/app/(app)/atlas/setup-actions";
import {createCompanyUser as action13} from "@/app/(app)/atlas/setup-actions";
import {setCompanyUserStatus as action14} from "@/app/(app)/atlas/setup-actions";
import {postMessage as action15} from "@/app/(app)/chat/actions";
import {searchChatPeople as action16} from "@/app/(app)/chat/actions";
import {openChat as action17} from "@/app/(app)/chat/actions";
import {openDirectChat as action18} from "@/app/(app)/chat/actions";
import {searchChatRecords as action19} from "@/app/(app)/chat/actions";
import {sendChat as action20} from "@/app/(app)/chat/actions";
import {chatSnapshot as action21} from "@/app/(app)/chat/actions";
import {updateValueFormAction as action22} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {updateCloseDateFormAction as action23} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {setNextActionFormAction as action24} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {setForecastCategoryFormAction as action25} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {winFormAction as action26} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {loseFormAction as action27} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addStakeholderFormAction as action28} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addMilestoneFormAction as action29} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {toggleMilestoneFormAction as action30} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {logOpportunityActivityFormAction as action31} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addDealAction as action32} from "@/app/(app)/crm/pipeline/actions";
import {qualifyFormAction as action33} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {disqualifyFormAction as action34} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {nurtureFormAction as action35} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {logProspectActivityFormAction as action36} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {assignProspectFormAction as action37} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {assignProspectTaskFormAction as action38} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {convertProspectFormAction as action39} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {pinReportToDashboard as action40} from "@/app/(app)/crm/reports/actions";
import {createContactFormAction as action41} from "@/app/(app)/customers/[partyId]/actions";
import {updateContactFormAction as action42} from "@/app/(app)/customers/[partyId]/actions";
import {deleteContactFormAction as action43} from "@/app/(app)/customers/[partyId]/actions";
import {createAddressFormAction as action44} from "@/app/(app)/customers/[partyId]/actions";
import {createTaxRegistrationFormAction as action45} from "@/app/(app)/customers/[partyId]/actions";
import {markTaxVerifiedFormAction as action46} from "@/app/(app)/customers/[partyId]/actions";
import {createBankAccountFormAction as action47} from "@/app/(app)/customers/[partyId]/actions";
import {createDirectDebitFormAction as action48} from "@/app/(app)/customers/[partyId]/actions";
import {cancelDirectDebitFormAction as action49} from "@/app/(app)/customers/[partyId]/actions";
import {updateCreditLimitFormAction as action50} from "@/app/(app)/customers/[partyId]/actions";
import {toggleCreditHoldFormAction as action51} from "@/app/(app)/customers/[partyId]/actions";
import {createNoteFormAction as action52} from "@/app/(app)/customers/[partyId]/actions";
import {updateStatusFormAction as action53} from "@/app/(app)/customers/[partyId]/actions";
import {deleteCustomerFormAction as action54} from "@/app/(app)/customers/[partyId]/actions";
import {createKpi as action55} from "@/app/(app)/kpis/actions";
import {saveGoal as action56} from "@/app/(app)/kpis/actions";
import {updateKpi as action57} from "@/app/(app)/kpis/actions";
import {recordProgress as action58} from "@/app/(app)/kpis/actions";
import {closeGoal as action59} from "@/app/(app)/kpis/actions";
import {addPlanGoal as action60} from "@/app/(app)/kpis/actions";
import {closePlan as action61} from "@/app/(app)/kpis/actions";
import {commentOnPlan as action62} from "@/app/(app)/kpis/actions";
import {syncDemandAction as action63} from "@/app/(app)/logistics/actions";
import {restoreDeliveryAction as action64} from "@/app/(app)/logistics/actions";
import {releaseAction as action65} from "@/app/(app)/logistics/actions";
import {allocateAction as action66} from "@/app/(app)/logistics/actions";
import {directShipAction as action67} from "@/app/(app)/logistics/actions";
import {groupAction as action68} from "@/app/(app)/logistics/actions";
import {scanAction as action69} from "@/app/(app)/logistics/actions";
import {lotAction as action70} from "@/app/(app)/logistics/actions";
import {serialAction as action71} from "@/app/(app)/logistics/actions";
import {shortAction as action72} from "@/app/(app)/logistics/actions";
import {completeWorkAction as action73} from "@/app/(app)/logistics/actions";
import {claimAction as action74} from "@/app/(app)/logistics/actions";
import {shipFromPickAction as action75} from "@/app/(app)/logistics/actions";
import {packageAction as action76} from "@/app/(app)/logistics/actions";
import {weightAction as action77} from "@/app/(app)/logistics/actions";
import {stageAction as action78} from "@/app/(app)/logistics/actions";
import {labelAction as action79} from "@/app/(app)/logistics/actions";
import {dispatchAction as action80} from "@/app/(app)/logistics/actions";
import {trackingAction as action81} from "@/app/(app)/logistics/actions";
import {deliverAction as action82} from "@/app/(app)/logistics/actions";
import {loadCreateAction as action83} from "@/app/(app)/logistics/actions";
import {loadScanAction as action84} from "@/app/(app)/logistics/actions";
import {departAction as action85} from "@/app/(app)/logistics/actions";
import {expectAction as action86} from "@/app/(app)/logistics/actions";
import {receiveLineAction as action87} from "@/app/(app)/logistics/actions";
import {putAwayAction as action88} from "@/app/(app)/logistics/actions";
import {completeReceiptAction as action89} from "@/app/(app)/logistics/actions";
import {transferAction as action90} from "@/app/(app)/logistics/actions";
import {transferReceiveAction as action91} from "@/app/(app)/logistics/actions";
import {returnRequestAction as action92} from "@/app/(app)/logistics/actions";
import {authoriseReturnAction as action93} from "@/app/(app)/logistics/actions";
import {receiveReturnAction as action94} from "@/app/(app)/logistics/actions";
import {inspectAction as action95} from "@/app/(app)/logistics/actions";
import {closeReturnAction as action96} from "@/app/(app)/logistics/actions";
import {assignEquipmentAction as action97} from "@/app/(app)/logistics/actions";
import {packUnitAction as action98} from "@/app/(app)/logistics/actions";
import {saveHandlingTypeAction as action99} from "@/app/(app)/logistics/actions";
import {retireHandlingTypeAction as action100} from "@/app/(app)/logistics/actions";
import {removeHandlingTypeAction as action101} from "@/app/(app)/logistics/actions";
import {policyAction as action102} from "@/app/(app)/logistics/actions";
import {runMrpAction as action103} from "@/app/(app)/manufacturing/plan/actions";
import {firmSuggestionAction as action104} from "@/app/(app)/manufacturing/plan/actions";
import {dismissSuggestionAction as action105} from "@/app/(app)/manufacturing/plan/actions";
import {setForecastAction as action106} from "@/app/(app)/manufacturing/plan/actions";
import {deleteForecastAction as action107} from "@/app/(app)/manufacturing/plan/actions";
import {runMrpAction as action108} from "@/app/(app)/manufacturing/planning/actions";
import {firmPlannedOrderAction as action109} from "@/app/(app)/manufacturing/planning/actions";
import {dismissPlannedOrderAction as action110} from "@/app/(app)/manufacturing/planning/actions";
import {runMrpForm as action111} from "@/app/(app)/manufacturing/planning/form-actions";
import {firmPlannedOrderForm as action112} from "@/app/(app)/manufacturing/planning/form-actions";
import {dismissPlannedOrderForm as action113} from "@/app/(app)/manufacturing/planning/form-actions";
import {previewMoveAction as action114} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {commitMoveAction as action115} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {toggleLockAction as action116} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {saveShiftAction as action117} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {deleteShiftAction as action118} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {startAction as action119} from "@/app/(app)/manufacturing/shop-floor/actions";
import {pauseAction as action120} from "@/app/(app)/manufacturing/shop-floor/actions";
import {completeAction as action121} from "@/app/(app)/manufacturing/shop-floor/actions";
import {loadNotices as action122} from "@/app/(app)/notices/actions";
import {clearNotice as action123} from "@/app/(app)/notices/actions";
import {clearNotices as action124} from "@/app/(app)/notices/actions";
import {createPayrollRun as action125} from "@/app/(app)/payroll/actions";
import {updatePayslipDeductions as action126} from "@/app/(app)/payroll/actions";
import {finalisePayrollRun as action127} from "@/app/(app)/payroll/actions";
import {markPayrollRunPaid as action128} from "@/app/(app)/payroll/actions";
import {savePayrollSettings as action129} from "@/app/(app)/payroll/actions";
import {issueP45 as action130} from "@/app/(app)/payroll/actions";
import {issueP60 as action131} from "@/app/(app)/payroll/actions";
import {logAbsence as action132} from "@/app/(app)/people/absence/actions";
import {requestLeave as action133} from "@/app/(app)/people/absence/actions";
import {cancelOwnLeave as action134} from "@/app/(app)/people/absence/actions";
import {approveLeaveRequest as action135} from "@/app/(app)/people/absence/actions";
import {setLeaveAllowance as action136} from "@/app/(app)/people/absence/actions";
import {rejectLeaveRequest as action137} from "@/app/(app)/people/absence/actions";
import {createEmployee as action138} from "@/app/(app)/people/actions";
import {changeEmployeeStatus as action139} from "@/app/(app)/people/actions";
import {updateEmployeeProfile as action140} from "@/app/(app)/people/actions";
import {updateOwnEmployeeDetails as action141} from "@/app/(app)/people/actions";
import {addEmployeeDocument as action142} from "@/app/(app)/people/actions";
import {linkEmployeeToUser as action143} from "@/app/(app)/people/actions";
import {completeEmployeeTask as action144} from "@/app/(app)/people/actions";
import {addEmployeeTask as action145} from "@/app/(app)/people/actions";
import {updateEmployeeContact as action146} from "@/app/(app)/people/actions";
import {updateEmployeeTask as action147} from "@/app/(app)/people/actions";
import {scheduleAppraisal as action148} from "@/app/(app)/people/appraisals/actions";
import {completeAppraisal as action149} from "@/app/(app)/people/appraisals/actions";
import {getConductDesk as action150} from "@/app/(app)/people/conduct/actions";
import {getMyConduct as action151} from "@/app/(app)/people/conduct/actions";
import {getPlan as action152} from "@/app/(app)/people/conduct/actions";
import {getCase as action153} from "@/app/(app)/people/conduct/actions";
import {conductChoices as action154} from "@/app/(app)/people/conduct/actions";
import {savePlan as action155} from "@/app/(app)/people/conduct/actions";
import {addPlanReview as action156} from "@/app/(app)/people/conduct/actions";
import {commentOnPlan as action157} from "@/app/(app)/people/conduct/actions";
import {saveCase as action158} from "@/app/(app)/people/conduct/actions";
import {respondToCase as action159} from "@/app/(app)/people/conduct/actions";
import {addCaseEvent as action160} from "@/app/(app)/people/conduct/actions";
import {submitExpenseClaim as action161} from "@/app/(app)/people/expenses/actions";
import {approveExpenseClaim as action162} from "@/app/(app)/people/expenses/actions";
import {rejectExpenseClaim as action163} from "@/app/(app)/people/expenses/actions";
import {scheduleOneToOne as action164} from "@/app/(app)/people/one-to-ones/actions";
import {completeOneToOne as action165} from "@/app/(app)/people/one-to-ones/actions";
import {listPolicies as action166} from "@/app/(app)/people/policies/actions";
import {publishPolicy as action167} from "@/app/(app)/people/policies/actions";
import {archivePolicy as action168} from "@/app/(app)/people/policies/actions";
import {openPolicy as action169} from "@/app/(app)/people/policies/actions";
import {createShift as action170} from "@/app/(app)/people/rotas/actions";
import {changeShiftStatus as action171} from "@/app/(app)/people/rotas/actions";
import {getMyHR as action172} from "@/app/(app)/people/self-service";
import {getMyTeam as action173} from "@/app/(app)/people/self-service";
import {getTeamEmployee as action174} from "@/app/(app)/people/self-service";
import {addPrivateNote as action175} from "@/app/(app)/people/self-service";
import {updateWorkingPattern as action176} from "@/app/(app)/people/self-service";
import {updateHrSettings as action177} from "@/app/(app)/people/settings/actions";
import {createAppraisalTemplate as action178} from "@/app/(app)/people/settings/actions";
import {toggleAppraisalTemplateActive as action179} from "@/app/(app)/people/settings/actions";
import {createOneToOneTemplate as action180} from "@/app/(app)/people/settings/actions";
import {toggleOneToOneTemplateActive as action181} from "@/app/(app)/people/settings/actions";
import {getTimesheetContext as action182} from "@/app/(app)/people/timesheets/actions";
import {saveTimesheet as action183} from "@/app/(app)/people/timesheets/actions";
import {reviewTimesheet as action184} from "@/app/(app)/people/timesheets/actions";
import {createPriceList as action185} from "@/app/(app)/pricing/actions";
import {savePriceEntry as action186} from "@/app/(app)/pricing/actions";
import {saveRule as action187} from "@/app/(app)/pricing/actions";
import {setRuleActive as action188} from "@/app/(app)/pricing/actions";
import {updatePriceBasis as action189} from "@/app/(app)/pricing/actions";
import {assignPriceList as action190} from "@/app/(app)/pricing/actions";
import {previewPriceCsv as action191} from "@/app/(app)/pricing/actions";
import {applyPriceCsv as action192} from "@/app/(app)/pricing/actions";
import {saveAgreement as action193} from "@/app/(app)/pricing/actions";
import {saveAgreementPrice as action194} from "@/app/(app)/pricing/actions";
import {removeAgreementPrice as action195} from "@/app/(app)/pricing/actions";
import {previewAgreementCsv as action196} from "@/app/(app)/pricing/actions";
import {applyAgreementCsv as action197} from "@/app/(app)/pricing/actions";
import {saveProduct as action198} from "@/app/(app)/products/actions";
import {saveProductRecord as action199} from "@/app/(app)/products/actions";
import {saveCategory as action200} from "@/app/(app)/products/actions";
import {retireCategory as action201} from "@/app/(app)/products/actions";
import {addStandardCategories as action202} from "@/app/(app)/products/actions";
import {savePack as action203} from "@/app/(app)/products/actions";
import {saveLinks as action204} from "@/app/(app)/products/actions";
import {saveMeasures as action205} from "@/app/(app)/products/actions";
import {saveProfile as action206} from "@/app/(app)/profile/actions";
import {loadAssignedWork as action207} from "@/app/(app)/profile/work";
import {createProject as action208} from "@/app/(app)/projects/actions";
import {changeProjectStatus as action209} from "@/app/(app)/projects/actions";
import {editProject as action210} from "@/app/(app)/projects/actions";
import {setProjectMember as action211} from "@/app/(app)/projects/actions";
import {archiveProject as action212} from "@/app/(app)/projects/actions";
import {createTask as action213} from "@/app/(app)/projects/actions";
import {changeTaskStatus as action214} from "@/app/(app)/projects/actions";
import {editTask as action215} from "@/app/(app)/projects/actions";
import {checklistItem as action216} from "@/app/(app)/projects/actions";
import {addDependency as action217} from "@/app/(app)/projects/actions";
import {createMeeting as action218} from "@/app/(app)/projects/actions";
import {createDocument as action219} from "@/app/(app)/projects/actions";
import {editDocument as action220} from "@/app/(app)/projects/actions";
import {addComment as action221} from "@/app/(app)/projects/actions";
import {createMilestone as action222} from "@/app/(app)/projects/actions";
import {publishUpdate as action223} from "@/app/(app)/projects/actions";
import {createDecision as action224} from "@/app/(app)/projects/actions";
import {decide as action225} from "@/app/(app)/projects/actions";
import {createRisk as action226} from "@/app/(app)/projects/actions";
import {closeRisk as action227} from "@/app/(app)/projects/actions";
import {requestApproval as action228} from "@/app/(app)/projects/actions";
import {respondApproval as action229} from "@/app/(app)/projects/actions";
import {submitRequest as action230} from "@/app/(app)/projects/actions";
import {triageRequest as action231} from "@/app/(app)/projects/actions";
import {logTime as action232} from "@/app/(app)/projects/actions";
import {planToday as action233} from "@/app/(app)/projects/actions";
import {updateInbox as action234} from "@/app/(app)/projects/actions";
import {saveView as action235} from "@/app/(app)/projects/actions";
import {createPortfolio as action236} from "@/app/(app)/projects/actions";
import {createBaseline as action237} from "@/app/(app)/projects/actions";
import {setBudget as action238} from "@/app/(app)/projects/actions";
import {linkWork as action239} from "@/app/(app)/projects/actions";
import {getProjectActivity as action240} from "@/app/(app)/projects/actions";
import {createAutomation as action241} from "@/app/(app)/projects/actions";
import {toggleAutomation as action242} from "@/app/(app)/projects/actions";
import {saveProjectTemplate as action243} from "@/app/(app)/projects/actions";
import {useProjectTemplate as action244} from "@/app/(app)/projects/actions";
import {startTimer as action245} from "@/app/(app)/projects/actions";
import {stopTimer as action246} from "@/app/(app)/projects/actions";
import {projectPreference as action247} from "@/app/(app)/projects/actions";
import {uploadProjectFile as action248} from "@/app/(app)/projects/actions";
import {readProjectFile as action249} from "@/app/(app)/projects/actions";
import {createProperty as action250} from "@/app/(app)/projects/actions";
import {setProperty as action251} from "@/app/(app)/projects/actions";
import {restoreDocument as action252} from "@/app/(app)/projects/actions";
import {createTaskFromDocument as action253} from "@/app/(app)/projects/actions";
import {discardTimer as action254} from "@/app/(app)/projects/actions";
import {completeMilestone as action255} from "@/app/(app)/projects/actions";
import {resolveComment as action256} from "@/app/(app)/projects/actions";
import {getProjectWorkload as action257} from "@/app/(app)/projects/actions";
import {createOrderForm as action258} from "@/app/(app)/sales/orders/actions";
import {addLineForm as action259} from "@/app/(app)/sales/orders/actions";
import {removeLineForm as action260} from "@/app/(app)/sales/orders/actions";
import {confirmOrderForm as action261} from "@/app/(app)/sales/orders/actions";
import {updateOrderForm as action262} from "@/app/(app)/sales/orders/actions";
import {chooseOrderAddresses as action263} from "@/app/(app)/sales/orders/actions";
import {addHoldForm as action264} from "@/app/(app)/sales/orders/actions";
import {releaseHoldForm as action265} from "@/app/(app)/sales/orders/actions";
import {approveOrderForm as action266} from "@/app/(app)/sales/orders/actions";
import {cancelOrderForm as action267} from "@/app/(app)/sales/orders/actions";
import {saveOrderHashtagsForm as action268} from "@/app/(app)/sales/orders/actions";
import {restoreCancelledOrderForm as action269} from "@/app/(app)/sales/orders/actions";
import {returnOrderToQuoteForm as action270} from "@/app/(app)/sales/orders/actions";
import {scheduleOrderDelivery as action271} from "@/app/(app)/sales/orders/actions";
import {rejectOrderApproval as action272} from "@/app/(app)/sales/orders/actions";
import {deleteOrderForm as action273} from "@/app/(app)/sales/orders/actions";
import {createQuote as action274} from "@/app/(app)/sales/quotes/actions";
import {deleteQuoteForm as action275} from "@/app/(app)/sales/quotes/actions";
import {saveCreationPolicy as action276} from "@/app/(app)/sales/settings/actions";
import {saveSiteAction as action277} from "@/app/(app)/sales/sites/actions";
import {setDocumentSiteAction as action278} from "@/app/(app)/sales/sites/actions";
import {getSchedule as action279} from "@/app/(app)/scheduling/actions";
import {createBulkShifts as action280} from "@/app/(app)/scheduling/actions";
import {setScheduledShift as action281} from "@/app/(app)/scheduling/actions";
import {completeShiftTask as action282} from "@/app/(app)/scheduling/actions";
import {editScheduledShift as action283} from "@/app/(app)/scheduling/actions";
import {publishWeekShifts as action284} from "@/app/(app)/scheduling/actions";
import {saveHoursBudget as action285} from "@/app/(app)/scheduling/actions";
import {getTeamPlan as action286} from "@/app/(app)/scheduling/actions";
import {getPersonSchedule as action287} from "@/app/(app)/scheduling/actions";
import {saveWorkType as action288} from "@/app/(app)/scheduling/actions";
import {archiveWorkType as action289} from "@/app/(app)/scheduling/actions";
import {saveDemand as action290} from "@/app/(app)/scheduling/actions";
import {saveBusyRule as action291} from "@/app/(app)/scheduling/actions";
import {removeBusyRule as action292} from "@/app/(app)/scheduling/actions";
import {fillTeamMonth as action293} from "@/app/(app)/scheduling/actions";
import {replanCover as action294} from "@/app/(app)/scheduling/actions";
import {publishMonth as action295} from "@/app/(app)/scheduling/actions";
import {saveShift as action296} from "@/app/(app)/scheduling/actions";
import {saveRole as action297} from "@/app/(app)/settings/actions";
import {saveMemberRoles as action298} from "@/app/(app)/settings/actions";
import {createUser as action299} from "@/app/(app)/settings/actions";
import {saveCompanyAccess as action300} from "@/app/(app)/settings/actions";
import {saveCompanyProfile as action301} from "@/app/(app)/settings/actions";
import {saveManagerPolicy as action302} from "@/app/(app)/settings/actions";
import {saveWorkspaceDetails as action303} from "@/app/(app)/settings/actions";
import {saveCompanyBrand as action304} from "@/app/(app)/settings/actions";
import {importCsv as action305} from "@/app/(app)/settings/imports/actions";
import {saveEmailAccount as action306} from "@/app/(app)/settings/it/actions";
import {verifyEmailAccount as action307} from "@/app/(app)/settings/it/actions";
import {sendTestEmail as action308} from "@/app/(app)/settings/it/actions";
import {makeDefaultAccount as action309} from "@/app/(app)/settings/it/actions";
import {setAccountActive as action310} from "@/app/(app)/settings/it/actions";
import {deleteEmailAccount as action311} from "@/app/(app)/settings/it/actions";
import {saveSocialAccount as action312} from "@/app/(app)/settings/it/actions";
import {deleteSocialAccount as action313} from "@/app/(app)/settings/it/actions";
import {checkSocialAccount as action314} from "@/app/(app)/settings/it/actions";
import {saveEmailTemplate as action315} from "@/app/(app)/settings/it/actions";
import {deleteEmailTemplate as action316} from "@/app/(app)/settings/it/actions";
import {checkInboxNow as action317} from "@/app/(app)/settings/it/actions";
import {saveDispatchDelivery as action318} from "@/app/(app)/settings/logistics/actions";
import {saveUserAccess as action319} from "@/app/(app)/settings/user-actions";
import {setUserStatus as action320} from "@/app/(app)/settings/user-actions";
import {revokeUserSessions as action321} from "@/app/(app)/settings/user-actions";
import {issuePasswordRecovery as action322} from "@/app/(app)/settings/user-actions";
import {createManagedUser as action323} from "@/app/(app)/settings/user-actions";
import {linkEmployeeProfile as action324} from "@/app/(app)/settings/user-actions";
import {createRole as action325} from "@/app/(app)/settings/user-actions";
import {saveManagementGroup as action326} from "@/app/(app)/settings/user-actions";
import {createWarehouse as action327} from "@/app/(app)/stock/actions";
import {adjustStock as action328} from "@/app/(app)/stock/actions";
import {savePlanningAction as action329} from "@/app/(app)/stock/actions";
import {makeFromForecastAction as action330} from "@/app/(app)/stock/actions";
import {transferStock as action331} from "@/app/(app)/stock/actions";
import {createSiteAction as action332} from "@/app/(app)/stock/actions";
import {createPlaceAction as action333} from "@/app/(app)/stock/actions";
import {assignSiteAction as action334} from "@/app/(app)/stock/actions";
import {addLocationAction as action335} from "@/app/(app)/stock/actions";
import {ensureLocationsAction as action336} from "@/app/(app)/stock/actions";
import {retireLocationAction as action337} from "@/app/(app)/stock/actions";
import {putOnLocationAction as action338} from "@/app/(app)/stock/actions";
import {moveLocatedAction as action339} from "@/app/(app)/stock/actions";
import {receiveMoveAction as action340} from "@/app/(app)/stock/actions";
import {delegateApprovals as action341} from "@/core/approvals/actions";
import {loginAction as action342} from "@/core/auth/actions";
import {logoutAction as action343} from "@/core/auth/actions";
import {completePasswordRecovery as action344} from "@/core/auth/security-actions";
import {changeOwnPassword as action345} from "@/core/auth/security-actions";
import {signOutOtherSessions as action346} from "@/core/auth/security-actions";
import {createContract as action347} from "@/core/contracts/actions";
import {sendContract as action348} from "@/core/contracts/actions";
import {signContract as action349} from "@/core/contracts/actions";
import {declineContract as action350} from "@/core/contracts/actions";
import {loadPublicContract as action351} from "@/core/contracts/actions";
import {checkForDuplicatesAction as action352} from "@/core/customers/actions";
import {createCustomerAction as action353} from "@/core/customers/actions";
import {createCustomer as action354} from "@/core/customers/commands";
import {updateCustomerStatus as action355} from "@/core/customers/commands";
import {deleteCustomer as action356} from "@/core/customers/commands";
import {createContact as action357} from "@/core/customers/commands";
import {updateContact as action358} from "@/core/customers/commands";
import {deleteContact as action359} from "@/core/customers/commands";
import {createAddress as action360} from "@/core/customers/commands";
import {updateCommercialSettings as action361} from "@/core/customers/commands";
import {updateCreditLimit as action362} from "@/core/customers/commands";
import {setCreditHold as action363} from "@/core/customers/commands";
import {setPaymentTerm as action364} from "@/core/customers/commands";
import {createTaxRegistration as action365} from "@/core/customers/commands";
import {markTaxRegistrationManuallyVerified as action366} from "@/core/customers/commands";
import {createBankAccount as action367} from "@/core/customers/commands";
import {revealBankAccount as action368} from "@/core/customers/commands";
import {createDirectDebitMandate as action369} from "@/core/customers/commands";
import {cancelDirectDebitMandate as action370} from "@/core/customers/commands";
import {createNote as action371} from "@/core/customers/commands";
import {saveCustomerHashtags as action372} from "@/core/customers/commands";
import {updateCustomerDetails as action373} from "@/core/customers/commands";
import {updateAddress as action374} from "@/core/customers/commands";
import {archiveAddress as action375} from "@/core/customers/commands";
import {saveOrderingPreferences as action376} from "@/core/customers/commercial-actions";
import {setCustomerParent as action377} from "@/core/customers/hierarchy-actions";
import {placeCustomer as action378} from "@/core/customers/hierarchy-actions";
import {moveCustomer as action379} from "@/core/customers/hierarchy-actions";
import {setContactReportsTo as action380} from "@/core/customers/hierarchy-actions";
import {saveCustomerTradingLink as action381} from "@/core/customers/trading-actions";
import {setInvoiceAccount as action382} from "@/core/customers/trading-actions";
import {archiveCustomerTradingLink as action383} from "@/core/customers/trading-actions";
import {requestSalesInvoice as action384} from "@/core/finance/actions";
import {createWorkTeam as action385} from "@/core/teams/actions";
import {loadAuditBoard as action386} from "@/modules/audit/services/actions";
import {exportAuditReport as action387} from "@/modules/audit/services/actions";
import {loadEcho as action388} from "@/modules/audit/services/actions";
import {postEchoNote as action389} from "@/modules/audit/services/actions";
import {loadEchoInbox as action390} from "@/modules/audit/services/actions";
import {loadAuditAccess as action391} from "@/modules/audit/services/actions";
import {saveAuditOwnActivity as action392} from "@/modules/audit/services/actions";
import {saveAuditAreas as action393} from "@/modules/audit/services/actions";
import {saveAutomation as action394} from "@/modules/automations/services/actions";
import {setAutomationEnabled as action395} from "@/modules/automations/services/actions";
import {deleteAutomation as action396} from "@/modules/automations/services/actions";
import {testOnPastEvent as action397} from "@/modules/automations/services/actions";
import {runNow as action398} from "@/modules/automations/services/actions";
import {logActivity as action399} from "@/modules/crm/services/activities";
import {completeActivity as action400} from "@/modules/crm/services/activities";
import {acceptMarketingHandoff as action401} from "@/modules/crm/services/marketing-handoff";
import {createOpportunity as action402} from "@/modules/crm/services/opportunities";
import {moveOpportunityStage as action403} from "@/modules/crm/services/opportunities";
import {updateOpportunityValue as action404} from "@/modules/crm/services/opportunities";
import {updateOpportunityCloseDate as action405} from "@/modules/crm/services/opportunities";
import {setOpportunityForecastCategory as action406} from "@/modules/crm/services/opportunities";
import {setOpportunityNextAction as action407} from "@/modules/crm/services/opportunities";
import {winOpportunity as action408} from "@/modules/crm/services/opportunities";
import {loseOpportunity as action409} from "@/modules/crm/services/opportunities";
import {addStakeholder as action410} from "@/modules/crm/services/opportunities";
import {addMilestone as action411} from "@/modules/crm/services/opportunities";
import {toggleMilestone as action412} from "@/modules/crm/services/opportunities";
import {checkProspectDuplicatesAction as action413} from "@/modules/crm/services/prospects";
import {createProspect as action414} from "@/modules/crm/services/prospects";
import {assignProspect as action415} from "@/modules/crm/services/prospects";
import {setProspectLifecycleStage as action416} from "@/modules/crm/services/prospects";
import {convertProspect as action417} from "@/modules/crm/services/prospects";
import {createIndustry as action418} from "@/modules/crm/services/prospects";
import {saveProspectGrouping as action419} from "@/modules/crm/services/prospects";
import {createSalesProject as action420} from "@/modules/crm/services/sales-projects-commands";
import {createSalesProjectFormAction as action421} from "@/modules/crm/services/sales-projects-commands";
import {saveSalesProjectAction as action422} from "@/modules/crm/services/sales-projects-commands";
import {saveNextActionAction as action423} from "@/modules/crm/services/sales-projects-commands";
import {addProjectOrganisationAction as action424} from "@/modules/crm/services/sales-projects-commands";
import {removeProjectOrganisationAction as action425} from "@/modules/crm/services/sales-projects-commands";
import {makePrimaryOrganisationAction as action426} from "@/modules/crm/services/sales-projects-commands";
import {addProjectStakeholderAction as action427} from "@/modules/crm/services/sales-projects-commands";
import {removeProjectStakeholderAction as action428} from "@/modules/crm/services/sales-projects-commands";
import {setDocumentSalesProjectAction as action429} from "@/modules/crm/services/sales-projects-commands";
import {deleteSalesProjectAction as action430} from "@/modules/crm/services/sales-projects-commands";
import {saveSurvey as action431} from "@/modules/csat/services/actions";
import {createSurveyFromTemplate as action432} from "@/modules/csat/services/actions";
import {setSurveyActive as action433} from "@/modules/csat/services/actions";
import {deleteSurvey as action434} from "@/modules/csat/services/actions";
import {recordCsatScore as action435} from "@/modules/csat/services/actions";
import {recordCsatComment as action436} from "@/modules/csat/services/actions";
import {setupFinance as action437} from "@/modules/finance/services/commands";
import {createFinanceDocument as action438} from "@/modules/finance/services/commands";
import {submitFinanceDocument as action439} from "@/modules/finance/services/commands";
import {saveApprovalPolicy as action440} from "@/modules/finance/services/commands";
import {decideFinanceApproval as action441} from "@/modules/finance/services/commands";
import {createPurchaseOrder as action442} from "@/modules/finance/services/commands";
import {raiseServiceCredit as action443} from "@/modules/finance/services/commands";
import {postFinanceDocument as action444} from "@/modules/finance/services/commands";
import {recordGoodsReceipt as action445} from "@/modules/finance/services/commands";
import {onboardSupplier as action446} from "@/modules/finance/services/commands";
import {approveSupplier as action447} from "@/modules/finance/services/commands";
import {requestSupplierBankChange as action448} from "@/modules/finance/services/commands";
import {verifySupplierBank as action449} from "@/modules/finance/services/commands";
import {createFinanceBank as action450} from "@/modules/finance/services/commands";
import {importBankTransactions as action451} from "@/modules/finance/services/commands";
import {allocateBankTransaction as action452} from "@/modules/finance/services/commands";
import {createPaymentRun as action453} from "@/modules/finance/services/commands";
import {approvePaymentRun as action454} from "@/modules/finance/services/commands";
import {createManualJournal as action455} from "@/modules/finance/services/commands";
import {approveManualJournal as action456} from "@/modules/finance/services/commands";
import {reverseJournal as action457} from "@/modules/finance/services/commands";
import {setFinancePeriodState as action458} from "@/modules/finance/services/commands";
import {saveFinanceBudget as action459} from "@/modules/finance/services/commands";
import {saveFinanceAsset as action460} from "@/modules/finance/services/commands";
import {postAssetDepreciation as action461} from "@/modules/finance/services/commands";
import {completeCloseTask as action462} from "@/modules/finance/services/commands";
import {saveFinanceContract as action463} from "@/modules/finance/services/commands";
import {saveFinanceScenario as action464} from "@/modules/finance/services/commands";
import {receiptForm as action465} from "@/modules/finance/services/commands";
import {journalForm as action466} from "@/modules/finance/services/commands";
import {statementForm as action467} from "@/modules/finance/services/commands";
import {allocationForm as action468} from "@/modules/finance/services/commands";
import {paymentRunForm as action469} from "@/modules/finance/services/commands";
import {policyForm as action470} from "@/modules/finance/services/commands";
import {scenarioForm as action471} from "@/modules/finance/services/commands";
import {uploadFinanceAttachment as action472} from "@/modules/finance/services/commands";
import {generateSalesInvoice as action473} from "@/modules/finance/services/commands";
import {generateInvoiceAdjustment as action474} from "@/modules/finance/services/commands";
import {voidFinanceDraft as action475} from "@/modules/finance/services/commands";
import {getFinanceHome as action476} from "@/modules/finance/services/queries";
import {listFinanceDocuments as action477} from "@/modules/finance/services/queries";
import {getFinanceDocument as action478} from "@/modules/finance/services/queries";
import {getFinanceWorkspace as action479} from "@/modules/finance/services/queries";
import {financeChoices as action480} from "@/modules/finance/services/queries";
import {getBudgetPositions as action481} from "@/modules/finance/services/queries";
import {getInvoiceCashForecast as action482} from "@/modules/finance/services/queries";
import {getFinancialReport as action483} from "@/modules/finance/services/queries";
import {getFinanceCustomerContribution as action484} from "@/modules/finance/services/queries";
import {searchFinance as action485} from "@/modules/finance/services/queries";
import {getFinanceAttachment as action486} from "@/modules/finance/services/queries";
import {getSalesFinanceProjection as action487} from "@/modules/finance/services/queries";
import {getReceivingWarehouses as action488} from "@/modules/finance/services/queries";
import {createProductionOrder as action489} from "@/modules/manufacturing/services/commands";
import {markOrderReady as action490} from "@/modules/manufacturing/services/commands";
import {releaseOrder as action491} from "@/modules/manufacturing/services/commands";
import {closeOrder as action492} from "@/modules/manufacturing/services/commands";
import {startWorkOrder as action493} from "@/modules/manufacturing/services/commands";
import {pauseWorkOrder as action494} from "@/modules/manufacturing/services/commands";
import {completeWorkOrder as action495} from "@/modules/manufacturing/services/commands";
import {listForecasts as action496} from "@/modules/manufacturing/services/forecast";
import {setForecast as action497} from "@/modules/manufacturing/services/forecast";
import {deleteForecast as action498} from "@/modules/manufacturing/services/forecast";
import {runMrp as action499} from "@/modules/manufacturing/services/mrp";
import {firmSuggestion as action500} from "@/modules/manufacturing/services/mrp";
import {dismissSuggestion as action501} from "@/modules/manufacturing/services/mrp";
import {latestPlan as action502} from "@/modules/manufacturing/services/mrp";
import {loadPlant as action503} from "@/modules/manufacturing/services/plant";
import {saveWorkCentre as action504} from "@/modules/manufacturing/services/plant";
import {saveMachine as action505} from "@/modules/manufacturing/services/plant";
import {retirePlantRecord as action506} from "@/modules/manufacturing/services/plant";
import {schedulePreview as action507} from "@/modules/manufacturing/services/scheduler";
import {rescheduleWorkOrder as action508} from "@/modules/manufacturing/services/scheduler";
import {setWorkOrderLock as action509} from "@/modules/manufacturing/services/scheduler";
import {listShifts as action510} from "@/modules/manufacturing/services/shifts";
import {saveShift as action511} from "@/modules/manufacturing/services/shifts";
import {deleteShift as action512} from "@/modules/manufacturing/services/shifts";
import {createCampaign as action513} from "@/modules/marketing/services/commands";
import {updateCampaign as action514} from "@/modules/marketing/services/commands";
import {createProfile as action515} from "@/modules/marketing/services/commands";
import {recordPermission as action516} from "@/modules/marketing/services/commands";
import {suppressProfile as action517} from "@/modules/marketing/services/commands";
import {createAudience as action518} from "@/modules/marketing/services/commands";
import {previewAudience as action519} from "@/modules/marketing/services/commands";
import {createContent as action520} from "@/modules/marketing/services/commands";
import {approveContent as action521} from "@/modules/marketing/services/commands";
import {createMessage as action522} from "@/modules/marketing/services/commands";
import {lockSend as action523} from "@/modules/marketing/services/commands";
import {cancelSend as action524} from "@/modules/marketing/services/commands";
import {ingestEvent as action525} from "@/modules/marketing/services/commands";
import {createJourney as action526} from "@/modules/marketing/services/commands";
import {publishJourney as action527} from "@/modules/marketing/services/commands";
import {reviseJourney as action528} from "@/modules/marketing/services/commands";
import {createProgram as action529} from "@/modules/marketing/services/commands";
import {createExperiment as action530} from "@/modules/marketing/services/commands";
import {leadFeedback as action531} from "@/modules/marketing/services/commands";
import {processJourneySteps as action532} from "@/modules/marketing/services/commands";
import {saveMarketingPlan as action533} from "@/modules/marketing/services/commands";
import {addPlanActivity as action534} from "@/modules/marketing/services/commands";
import {updatePlanActivity as action535} from "@/modules/marketing/services/commands";
import {addBudgetLine as action536} from "@/modules/marketing/services/commands";
import {submitBudgetToFinance as action537} from "@/modules/marketing/services/commands";
import {createJourneyMap as action538} from "@/modules/marketing/services/commands";
import {addJourneyStage as action539} from "@/modules/marketing/services/commands";
import {addJourneyTouch as action540} from "@/modules/marketing/services/commands";
import {saveSocialPost as action541} from "@/modules/marketing/services/social-actions";
import {deleteSocialPost as action542} from "@/modules/marketing/services/social-actions";
import {retrySocialPost as action543} from "@/modules/marketing/services/social-actions";
import {getApprovedExpenseSource as action544} from "@/modules/people/services/finance-expenses";
import {createPlan as action545} from "@/modules/plan/services/commands";
import {saveCell as action546} from "@/modules/plan/services/commands";
import {addMeasure as action547} from "@/modules/plan/services/commands";
import {addAssumption as action548} from "@/modules/plan/services/commands";
import {addDriver as action549} from "@/modules/plan/services/commands";
import {addLink as action550} from "@/modules/plan/services/commands";
import {createScenario as action551} from "@/modules/plan/services/commands";
import {promoteScenario as action552} from "@/modules/plan/services/commands";
import {submitPlan as action553} from "@/modules/plan/services/commands";
import {approvePlan as action554} from "@/modules/plan/services/commands";
import {lockPlan as action555} from "@/modules/plan/services/commands";
import {addGoal as action556} from "@/modules/plan/services/commands";
import {addInitiative as action557} from "@/modules/plan/services/commands";
import {createProjectForInitiative as action558} from "@/modules/plan/services/commands";
import {addAction as action559} from "@/modules/plan/services/commands";
import {completeAction as action560} from "@/modules/plan/services/commands";
import {addRisk as action561} from "@/modules/plan/services/commands";
import {addDependency as action562} from "@/modules/plan/services/commands";
import {addDecision as action563} from "@/modules/plan/services/commands";
import {addComment as action564} from "@/modules/plan/services/commands";
import {addUpdate as action565} from "@/modules/plan/services/commands";
import {completeReview as action566} from "@/modules/plan/services/commands";
import {addReview as action567} from "@/modules/plan/services/commands";
import {distributeTargets as action568} from "@/modules/plan/services/commands";
import {importGrid as action569} from "@/modules/plan/services/commands";
import {sharePlan as action570} from "@/modules/plan/services/commands";
import {unsharePlan as action571} from "@/modules/plan/services/commands";
import {setPlanAudience as action572} from "@/modules/plan/services/commands";
import {addNote as action573} from "@/modules/plan/services/commands";
import {saveGoalProgress as action574} from "@/modules/plan/services/commands";
import {savePlanBrief as action575} from "@/modules/plan/services/commands";
import {listProductionPlans as action576} from "@/modules/planning/services/plans";
import {getPlanOptions as action577} from "@/modules/planning/services/plans";
import {getProductionPlan as action578} from "@/modules/planning/services/plans";
import {createProductionPlan as action579} from "@/modules/planning/services/plans";
import {addProductionPlanLine as action580} from "@/modules/planning/services/plans";
import {getAssignedPlanningWork as action581} from "@/modules/planning/services/plans";
import {getPlanningCoverage as action582} from "@/modules/planning/services/queries";
import {saveProductRecipe as action583} from "@/modules/products/services/make";
import {createSpecification as action584} from "@/modules/quality/services/commands";
import {setSpecificationStatus as action585} from "@/modules/quality/services/commands";
import {createControlPoint as action586} from "@/modules/quality/services/commands";
import {executeInspection as action587} from "@/modules/quality/services/commands";
import {releaseHold as action588} from "@/modules/quality/services/commands";
import {reportNcr as action589} from "@/modules/quality/services/commands";
import {updateNcrInvestigation as action590} from "@/modules/quality/services/commands";
import {addNcrAction as action591} from "@/modules/quality/services/commands";
import {updateNcrAction as action592} from "@/modules/quality/services/commands";
import {closeNcr as action593} from "@/modules/quality/services/commands";
import {saveSubstance as action594} from "@/modules/safety/services/assurance";
import {addSafetyDataSheet as action595} from "@/modules/safety/services/assurance";
import {saveCoshhAssessment as action596} from "@/modules/safety/services/assurance";
import {approveSubstance as action597} from "@/modules/safety/services/assurance";
import {saveCompetence as action598} from "@/modules/safety/services/assurance";
import {saveSafetyDocument as action599} from "@/modules/safety/services/assurance";
import {acknowledgeDocument as action600} from "@/modules/safety/services/assurance";
import {saveAudit as action601} from "@/modules/safety/services/assurance";
import {addAuditFinding as action602} from "@/modules/safety/services/assurance";
import {approveAudit as action603} from "@/modules/safety/services/assurance";
import {saveChange as action604} from "@/modules/safety/services/assurance";
import {advanceChange as action605} from "@/modules/safety/services/assurance";
import {linkSafetyRecord as action606} from "@/modules/safety/services/assurance";
import {saveSafetyProfile as action607} from "@/modules/safety/services/commands";
import {saveRiskMatrix as action608} from "@/modules/safety/services/commands";
import {createRisk as action609} from "@/modules/safety/services/commands";
import {addControl as action610} from "@/modules/safety/services/commands";
import {rateAssessment as action611} from "@/modules/safety/services/commands";
import {approveAssessment as action612} from "@/modules/safety/services/commands";
import {reviseAssessment as action613} from "@/modules/safety/services/commands";
import {requestRiskReview as action614} from "@/modules/safety/services/commands";
import {reportIncident as action615} from "@/modules/safety/services/commands";
import {saveImmediateControl as action616} from "@/modules/safety/services/commands";
import {openInvestigation as action617} from "@/modules/safety/services/commands";
import {addCause as action618} from "@/modules/safety/services/commands";
import {saveRootCause as action619} from "@/modules/safety/services/commands";
import {reviewRiddor as action620} from "@/modules/safety/services/commands";
import {createSafetyAction as action621} from "@/modules/safety/services/commands";
import {advanceAction as action622} from "@/modules/safety/services/commands";
import {verifyAction as action623} from "@/modules/safety/services/commands";
import {saveWorkplaceRecord as action624} from "@/modules/safety/services/commands";
import {createPermit as action625} from "@/modules/safety/services/control";
import {advancePermit as action626} from "@/modules/safety/services/control";
import {extendPermit as action627} from "@/modules/safety/services/control";
import {createIsolation as action628} from "@/modules/safety/services/control";
import {applyIsolationLock as action629} from "@/modules/safety/services/control";
import {verifyIsolation as action630} from "@/modules/safety/services/control";
import {clearIsolation as action631} from "@/modules/safety/services/control";
import {removeIsolationLock as action632} from "@/modules/safety/services/control";
import {placeSafetyHold as action633} from "@/modules/safety/services/control";
import {updateReturnToService as action634} from "@/modules/safety/services/control";
import {releaseSafetyHold as action635} from "@/modules/safety/services/control";
import {overrideSafetyHold as action636} from "@/modules/safety/services/control";
import {saveStatutoryCheck as action637} from "@/modules/safety/services/control";
import {completeInspection as action638} from "@/modules/safety/services/control";
import {createInspection as action639} from "@/modules/safety/services/control";
import {createSalesAddress as action640} from "@/modules/sales/services/address-actions";
import {createSalesCatalogueProduct as action641} from "@/modules/sales/services/catalogue-actions";
import {sendQuote as action642} from "@/modules/sales/services/commands";
import {changeQuoteStatus as action643} from "@/modules/sales/services/commands";
import {deleteQuote as action644} from "@/modules/sales/services/commands";
import {duplicateDocument as action645} from "@/modules/sales/services/commands";
import {saveQuoteTemplate as action646} from "@/modules/sales/services/commands";
import {createOrderFromQuote as action647} from "@/modules/sales/services/commands";
import {linkCommercialProject as action648} from "@/modules/sales/services/commercial";
import {openCallOffOrder as action649} from "@/modules/sales/services/commercial";
import {raiseCallOff as action650} from "@/modules/sales/services/commercial";
import {invoiceCallOffDelivery as action651} from "@/modules/sales/services/commercial";
import {deliverAndInvoiceCallOff as action652} from "@/modules/sales/services/commercial";
import {importSalescsv as action653} from "@/modules/sales/services/csv-import";
import {addDeliveryAddress as action654} from "@/modules/sales/services/delivery-address";
import {addInstaller as action655} from "@/modules/sales/services/delivery-address";
import {linkOrderedFor as action656} from "@/modules/sales/services/delivery-address";
import {saveDocument as action657} from "@/modules/sales/services/documents";
import {saveInvoiceTemplate as action658} from "@/modules/sales/services/invoice-template-actions";
import {retireInvoiceTemplate as action659} from "@/modules/sales/services/invoice-template-actions";
import {attachCustomerInvoiceTemplate as action660} from "@/modules/sales/services/invoice-template-actions";
import {detachCustomerInvoiceTemplate as action661} from "@/modules/sales/services/invoice-template-actions";
import {createDraftOrder as action662} from "@/modules/sales/services/orders";
import {addOrderLine as action663} from "@/modules/sales/services/orders";
import {removeOrderLine as action664} from "@/modules/sales/services/orders";
import {updateDraftOrderFields as action665} from "@/modules/sales/services/orders";
import {confirmOrder as action666} from "@/modules/sales/services/orders";
import {decideApproval as action667} from "@/modules/sales/services/orders";
import {amendLineQuantity as action668} from "@/modules/sales/services/orders";
import {overrideLinePrice as action669} from "@/modules/sales/services/orders";
import {amendRequestedDate as action670} from "@/modules/sales/services/orders";
import {cancelOrder as action671} from "@/modules/sales/services/orders";
import {deleteOrder as action672} from "@/modules/sales/services/orders";
import {cancelLineRemaining as action673} from "@/modules/sales/services/orders";
import {addHold as action674} from "@/modules/sales/services/orders";
import {releaseHold as action675} from "@/modules/sales/services/orders";
import {restoreCancelledOrder as action676} from "@/modules/sales/services/rewind";
import {returnOrderToQuote as action677} from "@/modules/sales/services/rewind";
import {saveOrderHashtags as action678} from "@/modules/sales/services/rewind";
import {saveSalesView as action679} from "@/modules/sales/services/saved-views";
import {archiveSalesView as action680} from "@/modules/sales/services/saved-views";
import {createCase as action681} from "@/modules/service/services/commands";
import {updateCase as action682} from "@/modules/service/services/commands";
import {assignCase as action683} from "@/modules/service/services/commands";
import {transitionCase as action684} from "@/modules/service/services/commands";
import {addCaseEntry as action685} from "@/modules/service/services/commands";
import {createDepartmentTicket as action686} from "@/modules/service/services/commands";
import {updateDepartmentTicket as action687} from "@/modules/service/services/commands";
import {createQueue as action688} from "@/modules/service/services/commands";
import {addQueueMember as action689} from "@/modules/service/services/commands";
import {linkCaseRecord as action690} from "@/modules/service/services/commands";
import {creditChoices as action691} from "@/modules/service/services/commands";
import {askFinanceForCredit as action692} from "@/modules/service/services/commands";
import {getCaseOwners as action693} from "@/modules/service/services/commands";
import {getDepartmentWork as action694} from "@/modules/service/services/commands";
import {readAvailability as action695} from "@/modules/stock/services/availability";
import {readOrderChain as action696} from "@/modules/stock/services/availability";
import {inventoryExportRows as action697} from "@/modules/stock/services/export";
import {createTeam as action698} from "@/modules/teams/services/commands";
import {renameTeam as action699} from "@/modules/teams/services/commands";
import {addMember as action700} from "@/modules/teams/services/commands";
import {removeMember as action701} from "@/modules/teams/services/commands";
import {saveTask as action702} from "@/modules/teams/services/commands";
import {setTaskStatus as action703} from "@/modules/teams/services/commands";
import {removeTask as action704} from "@/modules/teams/services/commands";
import {saveCover as action705} from "@/modules/teams/services/commands";
import {removeCover as action706} from "@/modules/teams/services/commands";
import {saveHandover as action707} from "@/modules/teams/services/commands";
import {savePlace as action708} from "@/modules/teams/services/commands";
import {saveMoment as action709} from "@/modules/teams/services/commands";
import {removeMoment as action710} from "@/modules/teams/services/commands";
export const DATA_ACTIONS:Record<string,(...args:never[])=>Promise<unknown>>={
"src/app/(app)/_shared/record-email-actions:loadEmailRecord":action0 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/_shared/record-email-actions:sendRecordEmailAction":action1 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/_shared/record-email-actions:sendRecordContractAction":action2 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:loadLiveMetrics":action3 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:loadMetricSlice":action4 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:saveAnalyticsDashboard":action5 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:deleteAnalyticsDashboard":action6 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/apps/actions:toggleModuleAction":action7 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/actions:updateCompanyAccount":action8 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/actions:saveCompanyEntitlements":action9 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/actions:createCompanyAccount":action10 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/actions:deleteTestCompany":action11 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/setup-actions:importCompanySetup":action12 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/setup-actions:createCompanyUser":action13 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/setup-actions:setCompanyUserStatus":action14 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:postMessage":action15 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:searchChatPeople":action16 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:openChat":action17 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:openDirectChat":action18 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:searchChatRecords":action19 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:sendChat":action20 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:chatSnapshot":action21 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:updateValueFormAction":action22 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:updateCloseDateFormAction":action23 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:setNextActionFormAction":action24 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:setForecastCategoryFormAction":action25 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:winFormAction":action26 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:loseFormAction":action27 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:addStakeholderFormAction":action28 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:addMilestoneFormAction":action29 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:toggleMilestoneFormAction":action30 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:logOpportunityActivityFormAction":action31 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/pipeline/actions:addDealAction":action32 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:qualifyFormAction":action33 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:disqualifyFormAction":action34 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:nurtureFormAction":action35 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:logProspectActivityFormAction":action36 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:assignProspectFormAction":action37 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:assignProspectTaskFormAction":action38 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:convertProspectFormAction":action39 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/reports/actions:pinReportToDashboard":action40 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createContactFormAction":action41 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateContactFormAction":action42 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:deleteContactFormAction":action43 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createAddressFormAction":action44 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createTaxRegistrationFormAction":action45 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:markTaxVerifiedFormAction":action46 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createBankAccountFormAction":action47 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createDirectDebitFormAction":action48 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:cancelDirectDebitFormAction":action49 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateCreditLimitFormAction":action50 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:toggleCreditHoldFormAction":action51 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createNoteFormAction":action52 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateStatusFormAction":action53 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:deleteCustomerFormAction":action54 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:createKpi":action55 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:saveGoal":action56 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:updateKpi":action57 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:recordProgress":action58 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:closeGoal":action59 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:addPlanGoal":action60 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:closePlan":action61 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:commentOnPlan":action62 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:syncDemandAction":action63 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:restoreDeliveryAction":action64 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:releaseAction":action65 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:allocateAction":action66 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:directShipAction":action67 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:groupAction":action68 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:scanAction":action69 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:lotAction":action70 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:serialAction":action71 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shortAction":action72 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeWorkAction":action73 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:claimAction":action74 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shipFromPickAction":action75 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packageAction":action76 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:weightAction":action77 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:stageAction":action78 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:labelAction":action79 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:dispatchAction":action80 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:trackingAction":action81 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:deliverAction":action82 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadCreateAction":action83 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadScanAction":action84 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:departAction":action85 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:expectAction":action86 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveLineAction":action87 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:putAwayAction":action88 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeReceiptAction":action89 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferAction":action90 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferReceiveAction":action91 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:returnRequestAction":action92 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:authoriseReturnAction":action93 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveReturnAction":action94 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:inspectAction":action95 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:closeReturnAction":action96 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:assignEquipmentAction":action97 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packUnitAction":action98 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:saveHandlingTypeAction":action99 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:retireHandlingTypeAction":action100 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:removeHandlingTypeAction":action101 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:policyAction":action102 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:runMrpAction":action103 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:firmSuggestionAction":action104 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:dismissSuggestionAction":action105 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:setForecastAction":action106 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:deleteForecastAction":action107 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:runMrpAction":action108 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:firmPlannedOrderAction":action109 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:dismissPlannedOrderAction":action110 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:runMrpForm":action111 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:firmPlannedOrderForm":action112 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:dismissPlannedOrderForm":action113 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:previewMoveAction":action114 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:commitMoveAction":action115 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:toggleLockAction":action116 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:saveShiftAction":action117 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:deleteShiftAction":action118 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:startAction":action119 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:pauseAction":action120 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:completeAction":action121 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:loadNotices":action122 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotice":action123 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotices":action124 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:createPayrollRun":action125 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:updatePayslipDeductions":action126 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:finalisePayrollRun":action127 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:markPayrollRunPaid":action128 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:savePayrollSettings":action129 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP45":action130 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP60":action131 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:logAbsence":action132 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:requestLeave":action133 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:cancelOwnLeave":action134 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:approveLeaveRequest":action135 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:setLeaveAllowance":action136 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:rejectLeaveRequest":action137 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:createEmployee":action138 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:changeEmployeeStatus":action139 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeProfile":action140 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateOwnEmployeeDetails":action141 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeDocument":action142 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:linkEmployeeToUser":action143 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:completeEmployeeTask":action144 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeTask":action145 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeContact":action146 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeTask":action147 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:scheduleAppraisal":action148 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:completeAppraisal":action149 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getConductDesk":action150 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getMyConduct":action151 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getPlan":action152 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getCase":action153 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:conductChoices":action154 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:savePlan":action155 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addPlanReview":action156 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:commentOnPlan":action157 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:saveCase":action158 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:respondToCase":action159 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addCaseEvent":action160 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:submitExpenseClaim":action161 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:approveExpenseClaim":action162 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:rejectExpenseClaim":action163 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:scheduleOneToOne":action164 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:completeOneToOne":action165 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:listPolicies":action166 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:publishPolicy":action167 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:archivePolicy":action168 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:openPolicy":action169 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:createShift":action170 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:changeShiftStatus":action171 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyHR":action172 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyTeam":action173 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getTeamEmployee":action174 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:addPrivateNote":action175 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:updateWorkingPattern":action176 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:updateHrSettings":action177 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createAppraisalTemplate":action178 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleAppraisalTemplateActive":action179 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createOneToOneTemplate":action180 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleOneToOneTemplateActive":action181 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:getTimesheetContext":action182 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:saveTimesheet":action183 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:reviewTimesheet":action184 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:createPriceList":action185 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:savePriceEntry":action186 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveRule":action187 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:setRuleActive":action188 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:updatePriceBasis":action189 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:assignPriceList":action190 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewPriceCsv":action191 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyPriceCsv":action192 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreement":action193 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreementPrice":action194 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:removeAgreementPrice":action195 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewAgreementCsv":action196 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyAgreementCsv":action197 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProduct":action198 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProductRecord":action199 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveCategory":action200 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:retireCategory":action201 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:addStandardCategories":action202 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:savePack":action203 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveLinks":action204 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveMeasures":action205 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/actions:saveProfile":action206 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/work:loadAssignedWork":action207 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProject":action208 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeProjectStatus":action209 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editProject":action210 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProjectMember":action211 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:archiveProject":action212 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTask":action213 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeTaskStatus":action214 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editTask":action215 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:checklistItem":action216 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addDependency":action217 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMeeting":action218 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDocument":action219 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editDocument":action220 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addComment":action221 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMilestone":action222 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:publishUpdate":action223 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDecision":action224 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:decide":action225 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createRisk":action226 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:closeRisk":action227 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:requestApproval":action228 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:respondApproval":action229 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:submitRequest":action230 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:triageRequest":action231 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:logTime":action232 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:planToday":action233 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:updateInbox":action234 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveView":action235 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createPortfolio":action236 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createBaseline":action237 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setBudget":action238 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:linkWork":action239 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectActivity":action240 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createAutomation":action241 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:toggleAutomation":action242 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveProjectTemplate":action243 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:useProjectTemplate":action244 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:startTimer":action245 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:stopTimer":action246 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:projectPreference":action247 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:uploadProjectFile":action248 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:readProjectFile":action249 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProperty":action250 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProperty":action251 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:restoreDocument":action252 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTaskFromDocument":action253 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:discardTimer":action254 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:completeMilestone":action255 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:resolveComment":action256 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectWorkload":action257 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:createOrderForm":action258 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addLineForm":action259 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:removeLineForm":action260 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:confirmOrderForm":action261 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:updateOrderForm":action262 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:chooseOrderAddresses":action263 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addHoldForm":action264 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:releaseHoldForm":action265 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:approveOrderForm":action266 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:cancelOrderForm":action267 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:saveOrderHashtagsForm":action268 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:restoreCancelledOrderForm":action269 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:returnOrderToQuoteForm":action270 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:scheduleOrderDelivery":action271 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:rejectOrderApproval":action272 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:deleteOrderForm":action273 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:createQuote":action274 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:deleteQuoteForm":action275 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/settings/actions:saveCreationPolicy":action276 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/sites/actions:saveSiteAction":action277 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/sites/actions:setDocumentSiteAction":action278 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getSchedule":action279 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:createBulkShifts":action280 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:setScheduledShift":action281 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:completeShiftTask":action282 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:editScheduledShift":action283 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishWeekShifts":action284 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveHoursBudget":action285 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getTeamPlan":action286 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getPersonSchedule":action287 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveWorkType":action288 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:archiveWorkType":action289 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveDemand":action290 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveBusyRule":action291 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:removeBusyRule":action292 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:fillTeamMonth":action293 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:replanCover":action294 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishMonth":action295 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveShift":action296 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveRole":action297 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveMemberRoles":action298 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:createUser":action299 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyAccess":action300 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyProfile":action301 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveManagerPolicy":action302 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveWorkspaceDetails":action303 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyBrand":action304 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/imports/actions:importCsv":action305 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveEmailAccount":action306 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:verifyEmailAccount":action307 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:sendTestEmail":action308 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:makeDefaultAccount":action309 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:setAccountActive":action310 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteEmailAccount":action311 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveSocialAccount":action312 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteSocialAccount":action313 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:checkSocialAccount":action314 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveEmailTemplate":action315 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteEmailTemplate":action316 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:checkInboxNow":action317 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/logistics/actions:saveDispatchDelivery":action318 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveUserAccess":action319 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:setUserStatus":action320 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:revokeUserSessions":action321 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:issuePasswordRecovery":action322 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createManagedUser":action323 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:linkEmployeeProfile":action324 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createRole":action325 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveManagementGroup":action326 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createWarehouse":action327 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:adjustStock":action328 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:savePlanningAction":action329 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:makeFromForecastAction":action330 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:transferStock":action331 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createSiteAction":action332 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createPlaceAction":action333 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:assignSiteAction":action334 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:addLocationAction":action335 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:ensureLocationsAction":action336 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:retireLocationAction":action337 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:putOnLocationAction":action338 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:moveLocatedAction":action339 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:receiveMoveAction":action340 as (...args:never[])=>Promise<unknown>,
"src/core/approvals/actions:delegateApprovals":action341 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:loginAction":action342 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:logoutAction":action343 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:completePasswordRecovery":action344 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:changeOwnPassword":action345 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:signOutOtherSessions":action346 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:createContract":action347 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:sendContract":action348 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:signContract":action349 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:declineContract":action350 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:loadPublicContract":action351 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:checkForDuplicatesAction":action352 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:createCustomerAction":action353 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createCustomer":action354 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerStatus":action355 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteCustomer":action356 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createContact":action357 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateContact":action358 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteContact":action359 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createAddress":action360 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCommercialSettings":action361 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCreditLimit":action362 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setCreditHold":action363 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setPaymentTerm":action364 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createTaxRegistration":action365 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:markTaxRegistrationManuallyVerified":action366 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createBankAccount":action367 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:revealBankAccount":action368 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createDirectDebitMandate":action369 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:cancelDirectDebitMandate":action370 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createNote":action371 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:saveCustomerHashtags":action372 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerDetails":action373 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateAddress":action374 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:archiveAddress":action375 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commercial-actions:saveOrderingPreferences":action376 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setCustomerParent":action377 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:placeCustomer":action378 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:moveCustomer":action379 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setContactReportsTo":action380 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:saveCustomerTradingLink":action381 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:setInvoiceAccount":action382 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:archiveCustomerTradingLink":action383 as (...args:never[])=>Promise<unknown>,
"src/core/finance/actions:requestSalesInvoice":action384 as (...args:never[])=>Promise<unknown>,
"src/core/teams/actions:createWorkTeam":action385 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditBoard":action386 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:exportAuditReport":action387 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEcho":action388 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:postEchoNote":action389 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEchoInbox":action390 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditAccess":action391 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditOwnActivity":action392 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditAreas":action393 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:saveAutomation":action394 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:setAutomationEnabled":action395 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:deleteAutomation":action396 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:testOnPastEvent":action397 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:runNow":action398 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:logActivity":action399 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:completeActivity":action400 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/marketing-handoff:acceptMarketingHandoff":action401 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:createOpportunity":action402 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:moveOpportunityStage":action403 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityValue":action404 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityCloseDate":action405 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityForecastCategory":action406 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityNextAction":action407 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:winOpportunity":action408 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:loseOpportunity":action409 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addStakeholder":action410 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addMilestone":action411 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:toggleMilestone":action412 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:checkProspectDuplicatesAction":action413 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createProspect":action414 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:assignProspect":action415 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:setProspectLifecycleStage":action416 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:convertProspect":action417 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createIndustry":action418 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:saveProspectGrouping":action419 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProject":action420 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProjectFormAction":action421 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:saveSalesProjectAction":action422 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:saveNextActionAction":action423 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addProjectOrganisationAction":action424 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:removeProjectOrganisationAction":action425 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:makePrimaryOrganisationAction":action426 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addProjectStakeholderAction":action427 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:removeProjectStakeholderAction":action428 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:setDocumentSalesProjectAction":action429 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:deleteSalesProjectAction":action430 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:saveSurvey":action431 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:createSurveyFromTemplate":action432 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:setSurveyActive":action433 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:deleteSurvey":action434 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatScore":action435 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatComment":action436 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setupFinance":action437 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceDocument":action438 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:submitFinanceDocument":action439 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveApprovalPolicy":action440 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:decideFinanceApproval":action441 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPurchaseOrder":action442 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:raiseServiceCredit":action443 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postFinanceDocument":action444 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:recordGoodsReceipt":action445 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:onboardSupplier":action446 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveSupplier":action447 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:requestSupplierBankChange":action448 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:verifySupplierBank":action449 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceBank":action450 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:importBankTransactions":action451 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocateBankTransaction":action452 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPaymentRun":action453 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approvePaymentRun":action454 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createManualJournal":action455 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveManualJournal":action456 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:reverseJournal":action457 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setFinancePeriodState":action458 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceBudget":action459 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceAsset":action460 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postAssetDepreciation":action461 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:completeCloseTask":action462 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceContract":action463 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceScenario":action464 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:receiptForm":action465 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:journalForm":action466 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:statementForm":action467 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocationForm":action468 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:paymentRunForm":action469 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:policyForm":action470 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:scenarioForm":action471 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:uploadFinanceAttachment":action472 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateSalesInvoice":action473 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateInvoiceAdjustment":action474 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:voidFinanceDraft":action475 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceHome":action476 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:listFinanceDocuments":action477 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceDocument":action478 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceWorkspace":action479 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:financeChoices":action480 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getBudgetPositions":action481 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getInvoiceCashForecast":action482 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinancialReport":action483 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceCustomerContribution":action484 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:searchFinance":action485 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceAttachment":action486 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getSalesFinanceProjection":action487 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getReceivingWarehouses":action488 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:createProductionOrder":action489 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:markOrderReady":action490 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:releaseOrder":action491 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:closeOrder":action492 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:startWorkOrder":action493 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:pauseWorkOrder":action494 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:completeWorkOrder":action495 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:listForecasts":action496 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:setForecast":action497 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:deleteForecast":action498 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:runMrp":action499 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:firmSuggestion":action500 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:dismissSuggestion":action501 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:latestPlan":action502 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:loadPlant":action503 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveWorkCentre":action504 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveMachine":action505 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:retirePlantRecord":action506 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:schedulePreview":action507 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:rescheduleWorkOrder":action508 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:setWorkOrderLock":action509 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:listShifts":action510 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:saveShift":action511 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:deleteShift":action512 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createCampaign":action513 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updateCampaign":action514 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProfile":action515 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:recordPermission":action516 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:suppressProfile":action517 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createAudience":action518 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:previewAudience":action519 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createContent":action520 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:approveContent":action521 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createMessage":action522 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:lockSend":action523 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:cancelSend":action524 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:ingestEvent":action525 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourney":action526 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:publishJourney":action527 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:reviseJourney":action528 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProgram":action529 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createExperiment":action530 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:leadFeedback":action531 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:processJourneySteps":action532 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:saveMarketingPlan":action533 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addPlanActivity":action534 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updatePlanActivity":action535 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addBudgetLine":action536 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:submitBudgetToFinance":action537 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourneyMap":action538 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyStage":action539 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyTouch":action540 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:saveSocialPost":action541 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:deleteSocialPost":action542 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:retrySocialPost":action543 as (...args:never[])=>Promise<unknown>,
"src/modules/people/services/finance-expenses:getApprovedExpenseSource":action544 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createPlan":action545 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveCell":action546 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addMeasure":action547 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAssumption":action548 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDriver":action549 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addLink":action550 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createScenario":action551 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:promoteScenario":action552 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:submitPlan":action553 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:approvePlan":action554 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:lockPlan":action555 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addGoal":action556 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addInitiative":action557 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createProjectForInitiative":action558 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAction":action559 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeAction":action560 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addRisk":action561 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDependency":action562 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDecision":action563 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addComment":action564 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addUpdate":action565 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeReview":action566 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addReview":action567 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:distributeTargets":action568 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:importGrid":action569 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:sharePlan":action570 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:unsharePlan":action571 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:setPlanAudience":action572 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addNote":action573 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveGoalProgress":action574 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:savePlanBrief":action575 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:listProductionPlans":action576 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getPlanOptions":action577 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getProductionPlan":action578 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:createProductionPlan":action579 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:addProductionPlanLine":action580 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getAssignedPlanningWork":action581 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/queries:getPlanningCoverage":action582 as (...args:never[])=>Promise<unknown>,
"src/modules/products/services/make:saveProductRecipe":action583 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createSpecification":action584 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:setSpecificationStatus":action585 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createControlPoint":action586 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:executeInspection":action587 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:releaseHold":action588 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:reportNcr":action589 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrInvestigation":action590 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:addNcrAction":action591 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrAction":action592 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:closeNcr":action593 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSubstance":action594 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addSafetyDataSheet":action595 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCoshhAssessment":action596 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveSubstance":action597 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCompetence":action598 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSafetyDocument":action599 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:acknowledgeDocument":action600 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveAudit":action601 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addAuditFinding":action602 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveAudit":action603 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveChange":action604 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:advanceChange":action605 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:linkSafetyRecord":action606 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveSafetyProfile":action607 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRiskMatrix":action608 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createRisk":action609 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addControl":action610 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:rateAssessment":action611 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:approveAssessment":action612 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviseAssessment":action613 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:requestRiskReview":action614 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reportIncident":action615 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveImmediateControl":action616 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:openInvestigation":action617 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addCause":action618 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRootCause":action619 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviewRiddor":action620 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createSafetyAction":action621 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:advanceAction":action622 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:verifyAction":action623 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveWorkplaceRecord":action624 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createPermit":action625 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:advancePermit":action626 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:extendPermit":action627 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createIsolation":action628 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:applyIsolationLock":action629 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:verifyIsolation":action630 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:clearIsolation":action631 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:removeIsolationLock":action632 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:placeSafetyHold":action633 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:updateReturnToService":action634 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:releaseSafetyHold":action635 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:overrideSafetyHold":action636 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:saveStatutoryCheck":action637 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:completeInspection":action638 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createInspection":action639 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/address-actions:createSalesAddress":action640 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/catalogue-actions:createSalesCatalogueProduct":action641 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:sendQuote":action642 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:changeQuoteStatus":action643 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:deleteQuote":action644 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:duplicateDocument":action645 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:saveQuoteTemplate":action646 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:createOrderFromQuote":action647 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:linkCommercialProject":action648 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:openCallOffOrder":action649 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:raiseCallOff":action650 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:invoiceCallOffDelivery":action651 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:deliverAndInvoiceCallOff":action652 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/csv-import:importSalescsv":action653 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:addDeliveryAddress":action654 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:addInstaller":action655 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:linkOrderedFor":action656 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/documents:saveDocument":action657 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:saveInvoiceTemplate":action658 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:retireInvoiceTemplate":action659 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:attachCustomerInvoiceTemplate":action660 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:detachCustomerInvoiceTemplate":action661 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:createDraftOrder":action662 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addOrderLine":action663 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:removeOrderLine":action664 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:updateDraftOrderFields":action665 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:confirmOrder":action666 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:decideApproval":action667 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendLineQuantity":action668 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:overrideLinePrice":action669 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendRequestedDate":action670 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelOrder":action671 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:deleteOrder":action672 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelLineRemaining":action673 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addHold":action674 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:releaseHold":action675 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:restoreCancelledOrder":action676 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:returnOrderToQuote":action677 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:saveOrderHashtags":action678 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:saveSalesView":action679 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:archiveSalesView":action680 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createCase":action681 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateCase":action682 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:assignCase":action683 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:transitionCase":action684 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addCaseEntry":action685 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createDepartmentTicket":action686 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateDepartmentTicket":action687 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createQueue":action688 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addQueueMember":action689 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:linkCaseRecord":action690 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:creditChoices":action691 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:askFinanceForCredit":action692 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getCaseOwners":action693 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getDepartmentWork":action694 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readAvailability":action695 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readOrderChain":action696 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/export:inventoryExportRows":action697 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:createTeam":action698 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:renameTeam":action699 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:addMember":action700 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMember":action701 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveTask":action702 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:setTaskStatus":action703 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeTask":action704 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveCover":action705 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeCover":action706 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveHandover":action707 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:savePlace":action708 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveMoment":action709 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMoment":action710 as (...args:never[])=>Promise<unknown>
};
