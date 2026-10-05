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
import {saveDispatchDelivery as action317} from "@/app/(app)/settings/logistics/actions";
import {saveUserAccess as action318} from "@/app/(app)/settings/user-actions";
import {setUserStatus as action319} from "@/app/(app)/settings/user-actions";
import {revokeUserSessions as action320} from "@/app/(app)/settings/user-actions";
import {issuePasswordRecovery as action321} from "@/app/(app)/settings/user-actions";
import {createManagedUser as action322} from "@/app/(app)/settings/user-actions";
import {linkEmployeeProfile as action323} from "@/app/(app)/settings/user-actions";
import {createRole as action324} from "@/app/(app)/settings/user-actions";
import {saveManagementGroup as action325} from "@/app/(app)/settings/user-actions";
import {createWarehouse as action326} from "@/app/(app)/stock/actions";
import {adjustStock as action327} from "@/app/(app)/stock/actions";
import {savePlanningAction as action328} from "@/app/(app)/stock/actions";
import {makeFromForecastAction as action329} from "@/app/(app)/stock/actions";
import {transferStock as action330} from "@/app/(app)/stock/actions";
import {createSiteAction as action331} from "@/app/(app)/stock/actions";
import {createPlaceAction as action332} from "@/app/(app)/stock/actions";
import {assignSiteAction as action333} from "@/app/(app)/stock/actions";
import {addLocationAction as action334} from "@/app/(app)/stock/actions";
import {ensureLocationsAction as action335} from "@/app/(app)/stock/actions";
import {retireLocationAction as action336} from "@/app/(app)/stock/actions";
import {putOnLocationAction as action337} from "@/app/(app)/stock/actions";
import {moveLocatedAction as action338} from "@/app/(app)/stock/actions";
import {receiveMoveAction as action339} from "@/app/(app)/stock/actions";
import {delegateApprovals as action340} from "@/core/approvals/actions";
import {loginAction as action341} from "@/core/auth/actions";
import {logoutAction as action342} from "@/core/auth/actions";
import {completePasswordRecovery as action343} from "@/core/auth/security-actions";
import {changeOwnPassword as action344} from "@/core/auth/security-actions";
import {signOutOtherSessions as action345} from "@/core/auth/security-actions";
import {createContract as action346} from "@/core/contracts/actions";
import {sendContract as action347} from "@/core/contracts/actions";
import {signContract as action348} from "@/core/contracts/actions";
import {declineContract as action349} from "@/core/contracts/actions";
import {loadPublicContract as action350} from "@/core/contracts/actions";
import {checkForDuplicatesAction as action351} from "@/core/customers/actions";
import {createCustomerAction as action352} from "@/core/customers/actions";
import {createCustomer as action353} from "@/core/customers/commands";
import {updateCustomerStatus as action354} from "@/core/customers/commands";
import {deleteCustomer as action355} from "@/core/customers/commands";
import {createContact as action356} from "@/core/customers/commands";
import {updateContact as action357} from "@/core/customers/commands";
import {deleteContact as action358} from "@/core/customers/commands";
import {createAddress as action359} from "@/core/customers/commands";
import {updateCommercialSettings as action360} from "@/core/customers/commands";
import {updateCreditLimit as action361} from "@/core/customers/commands";
import {setCreditHold as action362} from "@/core/customers/commands";
import {setPaymentTerm as action363} from "@/core/customers/commands";
import {createTaxRegistration as action364} from "@/core/customers/commands";
import {markTaxRegistrationManuallyVerified as action365} from "@/core/customers/commands";
import {createBankAccount as action366} from "@/core/customers/commands";
import {revealBankAccount as action367} from "@/core/customers/commands";
import {createDirectDebitMandate as action368} from "@/core/customers/commands";
import {cancelDirectDebitMandate as action369} from "@/core/customers/commands";
import {createNote as action370} from "@/core/customers/commands";
import {saveCustomerHashtags as action371} from "@/core/customers/commands";
import {updateCustomerDetails as action372} from "@/core/customers/commands";
import {updateAddress as action373} from "@/core/customers/commands";
import {archiveAddress as action374} from "@/core/customers/commands";
import {saveOrderingPreferences as action375} from "@/core/customers/commercial-actions";
import {setCustomerParent as action376} from "@/core/customers/hierarchy-actions";
import {placeCustomer as action377} from "@/core/customers/hierarchy-actions";
import {moveCustomer as action378} from "@/core/customers/hierarchy-actions";
import {setContactReportsTo as action379} from "@/core/customers/hierarchy-actions";
import {saveCustomerTradingLink as action380} from "@/core/customers/trading-actions";
import {setInvoiceAccount as action381} from "@/core/customers/trading-actions";
import {archiveCustomerTradingLink as action382} from "@/core/customers/trading-actions";
import {requestSalesInvoice as action383} from "@/core/finance/actions";
import {createWorkTeam as action384} from "@/core/teams/actions";
import {loadAuditBoard as action385} from "@/modules/audit/services/actions";
import {exportAuditReport as action386} from "@/modules/audit/services/actions";
import {loadEcho as action387} from "@/modules/audit/services/actions";
import {postEchoNote as action388} from "@/modules/audit/services/actions";
import {loadEchoInbox as action389} from "@/modules/audit/services/actions";
import {loadAuditAccess as action390} from "@/modules/audit/services/actions";
import {saveAuditOwnActivity as action391} from "@/modules/audit/services/actions";
import {saveAuditAreas as action392} from "@/modules/audit/services/actions";
import {saveAutomation as action393} from "@/modules/automations/services/actions";
import {setAutomationEnabled as action394} from "@/modules/automations/services/actions";
import {deleteAutomation as action395} from "@/modules/automations/services/actions";
import {testOnPastEvent as action396} from "@/modules/automations/services/actions";
import {runNow as action397} from "@/modules/automations/services/actions";
import {logActivity as action398} from "@/modules/crm/services/activities";
import {completeActivity as action399} from "@/modules/crm/services/activities";
import {acceptMarketingHandoff as action400} from "@/modules/crm/services/marketing-handoff";
import {createOpportunity as action401} from "@/modules/crm/services/opportunities";
import {moveOpportunityStage as action402} from "@/modules/crm/services/opportunities";
import {updateOpportunityValue as action403} from "@/modules/crm/services/opportunities";
import {updateOpportunityCloseDate as action404} from "@/modules/crm/services/opportunities";
import {setOpportunityForecastCategory as action405} from "@/modules/crm/services/opportunities";
import {setOpportunityNextAction as action406} from "@/modules/crm/services/opportunities";
import {winOpportunity as action407} from "@/modules/crm/services/opportunities";
import {loseOpportunity as action408} from "@/modules/crm/services/opportunities";
import {addStakeholder as action409} from "@/modules/crm/services/opportunities";
import {addMilestone as action410} from "@/modules/crm/services/opportunities";
import {toggleMilestone as action411} from "@/modules/crm/services/opportunities";
import {checkProspectDuplicatesAction as action412} from "@/modules/crm/services/prospects";
import {createProspect as action413} from "@/modules/crm/services/prospects";
import {assignProspect as action414} from "@/modules/crm/services/prospects";
import {setProspectLifecycleStage as action415} from "@/modules/crm/services/prospects";
import {convertProspect as action416} from "@/modules/crm/services/prospects";
import {createIndustry as action417} from "@/modules/crm/services/prospects";
import {saveProspectGrouping as action418} from "@/modules/crm/services/prospects";
import {createSalesProject as action419} from "@/modules/crm/services/sales-projects-commands";
import {createSalesProjectFormAction as action420} from "@/modules/crm/services/sales-projects-commands";
import {saveSalesProjectAction as action421} from "@/modules/crm/services/sales-projects-commands";
import {saveNextActionAction as action422} from "@/modules/crm/services/sales-projects-commands";
import {addProjectOrganisationAction as action423} from "@/modules/crm/services/sales-projects-commands";
import {removeProjectOrganisationAction as action424} from "@/modules/crm/services/sales-projects-commands";
import {makePrimaryOrganisationAction as action425} from "@/modules/crm/services/sales-projects-commands";
import {addProjectStakeholderAction as action426} from "@/modules/crm/services/sales-projects-commands";
import {removeProjectStakeholderAction as action427} from "@/modules/crm/services/sales-projects-commands";
import {setDocumentSalesProjectAction as action428} from "@/modules/crm/services/sales-projects-commands";
import {deleteSalesProjectAction as action429} from "@/modules/crm/services/sales-projects-commands";
import {saveSurvey as action430} from "@/modules/csat/services/actions";
import {createSurveyFromTemplate as action431} from "@/modules/csat/services/actions";
import {setSurveyActive as action432} from "@/modules/csat/services/actions";
import {deleteSurvey as action433} from "@/modules/csat/services/actions";
import {recordCsatScore as action434} from "@/modules/csat/services/actions";
import {recordCsatComment as action435} from "@/modules/csat/services/actions";
import {setupFinance as action436} from "@/modules/finance/services/commands";
import {createFinanceDocument as action437} from "@/modules/finance/services/commands";
import {submitFinanceDocument as action438} from "@/modules/finance/services/commands";
import {saveApprovalPolicy as action439} from "@/modules/finance/services/commands";
import {decideFinanceApproval as action440} from "@/modules/finance/services/commands";
import {createPurchaseOrder as action441} from "@/modules/finance/services/commands";
import {raiseServiceCredit as action442} from "@/modules/finance/services/commands";
import {postFinanceDocument as action443} from "@/modules/finance/services/commands";
import {recordGoodsReceipt as action444} from "@/modules/finance/services/commands";
import {onboardSupplier as action445} from "@/modules/finance/services/commands";
import {approveSupplier as action446} from "@/modules/finance/services/commands";
import {requestSupplierBankChange as action447} from "@/modules/finance/services/commands";
import {verifySupplierBank as action448} from "@/modules/finance/services/commands";
import {createFinanceBank as action449} from "@/modules/finance/services/commands";
import {importBankTransactions as action450} from "@/modules/finance/services/commands";
import {allocateBankTransaction as action451} from "@/modules/finance/services/commands";
import {createPaymentRun as action452} from "@/modules/finance/services/commands";
import {approvePaymentRun as action453} from "@/modules/finance/services/commands";
import {createManualJournal as action454} from "@/modules/finance/services/commands";
import {approveManualJournal as action455} from "@/modules/finance/services/commands";
import {reverseJournal as action456} from "@/modules/finance/services/commands";
import {setFinancePeriodState as action457} from "@/modules/finance/services/commands";
import {saveFinanceBudget as action458} from "@/modules/finance/services/commands";
import {saveFinanceAsset as action459} from "@/modules/finance/services/commands";
import {postAssetDepreciation as action460} from "@/modules/finance/services/commands";
import {completeCloseTask as action461} from "@/modules/finance/services/commands";
import {saveFinanceContract as action462} from "@/modules/finance/services/commands";
import {saveFinanceScenario as action463} from "@/modules/finance/services/commands";
import {receiptForm as action464} from "@/modules/finance/services/commands";
import {journalForm as action465} from "@/modules/finance/services/commands";
import {statementForm as action466} from "@/modules/finance/services/commands";
import {allocationForm as action467} from "@/modules/finance/services/commands";
import {paymentRunForm as action468} from "@/modules/finance/services/commands";
import {policyForm as action469} from "@/modules/finance/services/commands";
import {scenarioForm as action470} from "@/modules/finance/services/commands";
import {uploadFinanceAttachment as action471} from "@/modules/finance/services/commands";
import {generateSalesInvoice as action472} from "@/modules/finance/services/commands";
import {generateInvoiceAdjustment as action473} from "@/modules/finance/services/commands";
import {voidFinanceDraft as action474} from "@/modules/finance/services/commands";
import {getFinanceHome as action475} from "@/modules/finance/services/queries";
import {listFinanceDocuments as action476} from "@/modules/finance/services/queries";
import {getFinanceDocument as action477} from "@/modules/finance/services/queries";
import {getFinanceWorkspace as action478} from "@/modules/finance/services/queries";
import {financeChoices as action479} from "@/modules/finance/services/queries";
import {getBudgetPositions as action480} from "@/modules/finance/services/queries";
import {getInvoiceCashForecast as action481} from "@/modules/finance/services/queries";
import {getFinancialReport as action482} from "@/modules/finance/services/queries";
import {getFinanceCustomerContribution as action483} from "@/modules/finance/services/queries";
import {searchFinance as action484} from "@/modules/finance/services/queries";
import {getFinanceAttachment as action485} from "@/modules/finance/services/queries";
import {getSalesFinanceProjection as action486} from "@/modules/finance/services/queries";
import {getReceivingWarehouses as action487} from "@/modules/finance/services/queries";
import {createProductionOrder as action488} from "@/modules/manufacturing/services/commands";
import {markOrderReady as action489} from "@/modules/manufacturing/services/commands";
import {releaseOrder as action490} from "@/modules/manufacturing/services/commands";
import {closeOrder as action491} from "@/modules/manufacturing/services/commands";
import {startWorkOrder as action492} from "@/modules/manufacturing/services/commands";
import {pauseWorkOrder as action493} from "@/modules/manufacturing/services/commands";
import {completeWorkOrder as action494} from "@/modules/manufacturing/services/commands";
import {listForecasts as action495} from "@/modules/manufacturing/services/forecast";
import {setForecast as action496} from "@/modules/manufacturing/services/forecast";
import {deleteForecast as action497} from "@/modules/manufacturing/services/forecast";
import {runMrp as action498} from "@/modules/manufacturing/services/mrp";
import {firmSuggestion as action499} from "@/modules/manufacturing/services/mrp";
import {dismissSuggestion as action500} from "@/modules/manufacturing/services/mrp";
import {latestPlan as action501} from "@/modules/manufacturing/services/mrp";
import {loadPlant as action502} from "@/modules/manufacturing/services/plant";
import {saveWorkCentre as action503} from "@/modules/manufacturing/services/plant";
import {saveMachine as action504} from "@/modules/manufacturing/services/plant";
import {retirePlantRecord as action505} from "@/modules/manufacturing/services/plant";
import {schedulePreview as action506} from "@/modules/manufacturing/services/scheduler";
import {rescheduleWorkOrder as action507} from "@/modules/manufacturing/services/scheduler";
import {setWorkOrderLock as action508} from "@/modules/manufacturing/services/scheduler";
import {listShifts as action509} from "@/modules/manufacturing/services/shifts";
import {saveShift as action510} from "@/modules/manufacturing/services/shifts";
import {deleteShift as action511} from "@/modules/manufacturing/services/shifts";
import {createCampaign as action512} from "@/modules/marketing/services/commands";
import {updateCampaign as action513} from "@/modules/marketing/services/commands";
import {createProfile as action514} from "@/modules/marketing/services/commands";
import {recordPermission as action515} from "@/modules/marketing/services/commands";
import {suppressProfile as action516} from "@/modules/marketing/services/commands";
import {createAudience as action517} from "@/modules/marketing/services/commands";
import {previewAudience as action518} from "@/modules/marketing/services/commands";
import {createContent as action519} from "@/modules/marketing/services/commands";
import {approveContent as action520} from "@/modules/marketing/services/commands";
import {createMessage as action521} from "@/modules/marketing/services/commands";
import {lockSend as action522} from "@/modules/marketing/services/commands";
import {cancelSend as action523} from "@/modules/marketing/services/commands";
import {ingestEvent as action524} from "@/modules/marketing/services/commands";
import {createJourney as action525} from "@/modules/marketing/services/commands";
import {publishJourney as action526} from "@/modules/marketing/services/commands";
import {reviseJourney as action527} from "@/modules/marketing/services/commands";
import {createProgram as action528} from "@/modules/marketing/services/commands";
import {createExperiment as action529} from "@/modules/marketing/services/commands";
import {leadFeedback as action530} from "@/modules/marketing/services/commands";
import {processJourneySteps as action531} from "@/modules/marketing/services/commands";
import {saveMarketingPlan as action532} from "@/modules/marketing/services/commands";
import {addPlanActivity as action533} from "@/modules/marketing/services/commands";
import {updatePlanActivity as action534} from "@/modules/marketing/services/commands";
import {addBudgetLine as action535} from "@/modules/marketing/services/commands";
import {submitBudgetToFinance as action536} from "@/modules/marketing/services/commands";
import {createJourneyMap as action537} from "@/modules/marketing/services/commands";
import {addJourneyStage as action538} from "@/modules/marketing/services/commands";
import {addJourneyTouch as action539} from "@/modules/marketing/services/commands";
import {getApprovedExpenseSource as action540} from "@/modules/people/services/finance-expenses";
import {createPlan as action541} from "@/modules/plan/services/commands";
import {saveCell as action542} from "@/modules/plan/services/commands";
import {addMeasure as action543} from "@/modules/plan/services/commands";
import {addAssumption as action544} from "@/modules/plan/services/commands";
import {addDriver as action545} from "@/modules/plan/services/commands";
import {addLink as action546} from "@/modules/plan/services/commands";
import {createScenario as action547} from "@/modules/plan/services/commands";
import {promoteScenario as action548} from "@/modules/plan/services/commands";
import {submitPlan as action549} from "@/modules/plan/services/commands";
import {approvePlan as action550} from "@/modules/plan/services/commands";
import {lockPlan as action551} from "@/modules/plan/services/commands";
import {addGoal as action552} from "@/modules/plan/services/commands";
import {addInitiative as action553} from "@/modules/plan/services/commands";
import {createProjectForInitiative as action554} from "@/modules/plan/services/commands";
import {addAction as action555} from "@/modules/plan/services/commands";
import {completeAction as action556} from "@/modules/plan/services/commands";
import {addRisk as action557} from "@/modules/plan/services/commands";
import {addDependency as action558} from "@/modules/plan/services/commands";
import {addDecision as action559} from "@/modules/plan/services/commands";
import {addComment as action560} from "@/modules/plan/services/commands";
import {addUpdate as action561} from "@/modules/plan/services/commands";
import {completeReview as action562} from "@/modules/plan/services/commands";
import {addReview as action563} from "@/modules/plan/services/commands";
import {distributeTargets as action564} from "@/modules/plan/services/commands";
import {importGrid as action565} from "@/modules/plan/services/commands";
import {sharePlan as action566} from "@/modules/plan/services/commands";
import {unsharePlan as action567} from "@/modules/plan/services/commands";
import {setPlanAudience as action568} from "@/modules/plan/services/commands";
import {addNote as action569} from "@/modules/plan/services/commands";
import {saveGoalProgress as action570} from "@/modules/plan/services/commands";
import {savePlanBrief as action571} from "@/modules/plan/services/commands";
import {listProductionPlans as action572} from "@/modules/planning/services/plans";
import {getPlanOptions as action573} from "@/modules/planning/services/plans";
import {getProductionPlan as action574} from "@/modules/planning/services/plans";
import {createProductionPlan as action575} from "@/modules/planning/services/plans";
import {addProductionPlanLine as action576} from "@/modules/planning/services/plans";
import {getAssignedPlanningWork as action577} from "@/modules/planning/services/plans";
import {getPlanningCoverage as action578} from "@/modules/planning/services/queries";
import {saveProductRecipe as action579} from "@/modules/products/services/make";
import {createSpecification as action580} from "@/modules/quality/services/commands";
import {setSpecificationStatus as action581} from "@/modules/quality/services/commands";
import {createControlPoint as action582} from "@/modules/quality/services/commands";
import {executeInspection as action583} from "@/modules/quality/services/commands";
import {releaseHold as action584} from "@/modules/quality/services/commands";
import {reportNcr as action585} from "@/modules/quality/services/commands";
import {updateNcrInvestigation as action586} from "@/modules/quality/services/commands";
import {addNcrAction as action587} from "@/modules/quality/services/commands";
import {updateNcrAction as action588} from "@/modules/quality/services/commands";
import {closeNcr as action589} from "@/modules/quality/services/commands";
import {saveSubstance as action590} from "@/modules/safety/services/assurance";
import {addSafetyDataSheet as action591} from "@/modules/safety/services/assurance";
import {saveCoshhAssessment as action592} from "@/modules/safety/services/assurance";
import {approveSubstance as action593} from "@/modules/safety/services/assurance";
import {saveCompetence as action594} from "@/modules/safety/services/assurance";
import {saveSafetyDocument as action595} from "@/modules/safety/services/assurance";
import {acknowledgeDocument as action596} from "@/modules/safety/services/assurance";
import {saveAudit as action597} from "@/modules/safety/services/assurance";
import {addAuditFinding as action598} from "@/modules/safety/services/assurance";
import {approveAudit as action599} from "@/modules/safety/services/assurance";
import {saveChange as action600} from "@/modules/safety/services/assurance";
import {advanceChange as action601} from "@/modules/safety/services/assurance";
import {linkSafetyRecord as action602} from "@/modules/safety/services/assurance";
import {saveSafetyProfile as action603} from "@/modules/safety/services/commands";
import {saveRiskMatrix as action604} from "@/modules/safety/services/commands";
import {createRisk as action605} from "@/modules/safety/services/commands";
import {addControl as action606} from "@/modules/safety/services/commands";
import {rateAssessment as action607} from "@/modules/safety/services/commands";
import {approveAssessment as action608} from "@/modules/safety/services/commands";
import {reviseAssessment as action609} from "@/modules/safety/services/commands";
import {requestRiskReview as action610} from "@/modules/safety/services/commands";
import {reportIncident as action611} from "@/modules/safety/services/commands";
import {saveImmediateControl as action612} from "@/modules/safety/services/commands";
import {openInvestigation as action613} from "@/modules/safety/services/commands";
import {addCause as action614} from "@/modules/safety/services/commands";
import {saveRootCause as action615} from "@/modules/safety/services/commands";
import {reviewRiddor as action616} from "@/modules/safety/services/commands";
import {createSafetyAction as action617} from "@/modules/safety/services/commands";
import {advanceAction as action618} from "@/modules/safety/services/commands";
import {verifyAction as action619} from "@/modules/safety/services/commands";
import {saveWorkplaceRecord as action620} from "@/modules/safety/services/commands";
import {createPermit as action621} from "@/modules/safety/services/control";
import {advancePermit as action622} from "@/modules/safety/services/control";
import {extendPermit as action623} from "@/modules/safety/services/control";
import {createIsolation as action624} from "@/modules/safety/services/control";
import {applyIsolationLock as action625} from "@/modules/safety/services/control";
import {verifyIsolation as action626} from "@/modules/safety/services/control";
import {clearIsolation as action627} from "@/modules/safety/services/control";
import {removeIsolationLock as action628} from "@/modules/safety/services/control";
import {placeSafetyHold as action629} from "@/modules/safety/services/control";
import {updateReturnToService as action630} from "@/modules/safety/services/control";
import {releaseSafetyHold as action631} from "@/modules/safety/services/control";
import {overrideSafetyHold as action632} from "@/modules/safety/services/control";
import {saveStatutoryCheck as action633} from "@/modules/safety/services/control";
import {completeInspection as action634} from "@/modules/safety/services/control";
import {createInspection as action635} from "@/modules/safety/services/control";
import {createSalesAddress as action636} from "@/modules/sales/services/address-actions";
import {createSalesCatalogueProduct as action637} from "@/modules/sales/services/catalogue-actions";
import {sendQuote as action638} from "@/modules/sales/services/commands";
import {changeQuoteStatus as action639} from "@/modules/sales/services/commands";
import {deleteQuote as action640} from "@/modules/sales/services/commands";
import {duplicateDocument as action641} from "@/modules/sales/services/commands";
import {saveQuoteTemplate as action642} from "@/modules/sales/services/commands";
import {createOrderFromQuote as action643} from "@/modules/sales/services/commands";
import {linkCommercialProject as action644} from "@/modules/sales/services/commercial";
import {openCallOffOrder as action645} from "@/modules/sales/services/commercial";
import {raiseCallOff as action646} from "@/modules/sales/services/commercial";
import {invoiceCallOffDelivery as action647} from "@/modules/sales/services/commercial";
import {deliverAndInvoiceCallOff as action648} from "@/modules/sales/services/commercial";
import {importSalescsv as action649} from "@/modules/sales/services/csv-import";
import {addDeliveryAddress as action650} from "@/modules/sales/services/delivery-address";
import {addInstaller as action651} from "@/modules/sales/services/delivery-address";
import {linkOrderedFor as action652} from "@/modules/sales/services/delivery-address";
import {saveDocument as action653} from "@/modules/sales/services/documents";
import {saveInvoiceTemplate as action654} from "@/modules/sales/services/invoice-template-actions";
import {retireInvoiceTemplate as action655} from "@/modules/sales/services/invoice-template-actions";
import {attachCustomerInvoiceTemplate as action656} from "@/modules/sales/services/invoice-template-actions";
import {detachCustomerInvoiceTemplate as action657} from "@/modules/sales/services/invoice-template-actions";
import {createDraftOrder as action658} from "@/modules/sales/services/orders";
import {addOrderLine as action659} from "@/modules/sales/services/orders";
import {removeOrderLine as action660} from "@/modules/sales/services/orders";
import {updateDraftOrderFields as action661} from "@/modules/sales/services/orders";
import {confirmOrder as action662} from "@/modules/sales/services/orders";
import {decideApproval as action663} from "@/modules/sales/services/orders";
import {amendLineQuantity as action664} from "@/modules/sales/services/orders";
import {overrideLinePrice as action665} from "@/modules/sales/services/orders";
import {amendRequestedDate as action666} from "@/modules/sales/services/orders";
import {cancelOrder as action667} from "@/modules/sales/services/orders";
import {deleteOrder as action668} from "@/modules/sales/services/orders";
import {cancelLineRemaining as action669} from "@/modules/sales/services/orders";
import {addHold as action670} from "@/modules/sales/services/orders";
import {releaseHold as action671} from "@/modules/sales/services/orders";
import {restoreCancelledOrder as action672} from "@/modules/sales/services/rewind";
import {returnOrderToQuote as action673} from "@/modules/sales/services/rewind";
import {saveOrderHashtags as action674} from "@/modules/sales/services/rewind";
import {saveSalesView as action675} from "@/modules/sales/services/saved-views";
import {archiveSalesView as action676} from "@/modules/sales/services/saved-views";
import {createCase as action677} from "@/modules/service/services/commands";
import {updateCase as action678} from "@/modules/service/services/commands";
import {assignCase as action679} from "@/modules/service/services/commands";
import {transitionCase as action680} from "@/modules/service/services/commands";
import {addCaseEntry as action681} from "@/modules/service/services/commands";
import {createDepartmentTicket as action682} from "@/modules/service/services/commands";
import {updateDepartmentTicket as action683} from "@/modules/service/services/commands";
import {createQueue as action684} from "@/modules/service/services/commands";
import {addQueueMember as action685} from "@/modules/service/services/commands";
import {linkCaseRecord as action686} from "@/modules/service/services/commands";
import {creditChoices as action687} from "@/modules/service/services/commands";
import {askFinanceForCredit as action688} from "@/modules/service/services/commands";
import {getCaseOwners as action689} from "@/modules/service/services/commands";
import {getDepartmentWork as action690} from "@/modules/service/services/commands";
import {readAvailability as action691} from "@/modules/stock/services/availability";
import {readOrderChain as action692} from "@/modules/stock/services/availability";
import {inventoryExportRows as action693} from "@/modules/stock/services/export";
import {createTeam as action694} from "@/modules/teams/services/commands";
import {renameTeam as action695} from "@/modules/teams/services/commands";
import {addMember as action696} from "@/modules/teams/services/commands";
import {removeMember as action697} from "@/modules/teams/services/commands";
import {saveTask as action698} from "@/modules/teams/services/commands";
import {setTaskStatus as action699} from "@/modules/teams/services/commands";
import {removeTask as action700} from "@/modules/teams/services/commands";
import {saveCover as action701} from "@/modules/teams/services/commands";
import {removeCover as action702} from "@/modules/teams/services/commands";
import {saveHandover as action703} from "@/modules/teams/services/commands";
import {savePlace as action704} from "@/modules/teams/services/commands";
import {saveMoment as action705} from "@/modules/teams/services/commands";
import {removeMoment as action706} from "@/modules/teams/services/commands";
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
"src/app/(app)/settings/logistics/actions:saveDispatchDelivery":action317 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveUserAccess":action318 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:setUserStatus":action319 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:revokeUserSessions":action320 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:issuePasswordRecovery":action321 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createManagedUser":action322 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:linkEmployeeProfile":action323 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createRole":action324 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveManagementGroup":action325 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createWarehouse":action326 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:adjustStock":action327 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:savePlanningAction":action328 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:makeFromForecastAction":action329 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:transferStock":action330 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createSiteAction":action331 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createPlaceAction":action332 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:assignSiteAction":action333 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:addLocationAction":action334 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:ensureLocationsAction":action335 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:retireLocationAction":action336 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:putOnLocationAction":action337 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:moveLocatedAction":action338 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:receiveMoveAction":action339 as (...args:never[])=>Promise<unknown>,
"src/core/approvals/actions:delegateApprovals":action340 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:loginAction":action341 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:logoutAction":action342 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:completePasswordRecovery":action343 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:changeOwnPassword":action344 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:signOutOtherSessions":action345 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:createContract":action346 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:sendContract":action347 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:signContract":action348 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:declineContract":action349 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:loadPublicContract":action350 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:checkForDuplicatesAction":action351 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:createCustomerAction":action352 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createCustomer":action353 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerStatus":action354 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteCustomer":action355 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createContact":action356 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateContact":action357 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteContact":action358 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createAddress":action359 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCommercialSettings":action360 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCreditLimit":action361 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setCreditHold":action362 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setPaymentTerm":action363 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createTaxRegistration":action364 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:markTaxRegistrationManuallyVerified":action365 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createBankAccount":action366 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:revealBankAccount":action367 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createDirectDebitMandate":action368 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:cancelDirectDebitMandate":action369 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createNote":action370 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:saveCustomerHashtags":action371 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerDetails":action372 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateAddress":action373 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:archiveAddress":action374 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commercial-actions:saveOrderingPreferences":action375 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setCustomerParent":action376 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:placeCustomer":action377 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:moveCustomer":action378 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setContactReportsTo":action379 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:saveCustomerTradingLink":action380 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:setInvoiceAccount":action381 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:archiveCustomerTradingLink":action382 as (...args:never[])=>Promise<unknown>,
"src/core/finance/actions:requestSalesInvoice":action383 as (...args:never[])=>Promise<unknown>,
"src/core/teams/actions:createWorkTeam":action384 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditBoard":action385 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:exportAuditReport":action386 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEcho":action387 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:postEchoNote":action388 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEchoInbox":action389 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditAccess":action390 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditOwnActivity":action391 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditAreas":action392 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:saveAutomation":action393 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:setAutomationEnabled":action394 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:deleteAutomation":action395 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:testOnPastEvent":action396 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:runNow":action397 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:logActivity":action398 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:completeActivity":action399 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/marketing-handoff:acceptMarketingHandoff":action400 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:createOpportunity":action401 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:moveOpportunityStage":action402 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityValue":action403 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityCloseDate":action404 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityForecastCategory":action405 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityNextAction":action406 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:winOpportunity":action407 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:loseOpportunity":action408 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addStakeholder":action409 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addMilestone":action410 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:toggleMilestone":action411 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:checkProspectDuplicatesAction":action412 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createProspect":action413 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:assignProspect":action414 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:setProspectLifecycleStage":action415 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:convertProspect":action416 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createIndustry":action417 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:saveProspectGrouping":action418 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProject":action419 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProjectFormAction":action420 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:saveSalesProjectAction":action421 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:saveNextActionAction":action422 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addProjectOrganisationAction":action423 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:removeProjectOrganisationAction":action424 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:makePrimaryOrganisationAction":action425 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addProjectStakeholderAction":action426 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:removeProjectStakeholderAction":action427 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:setDocumentSalesProjectAction":action428 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:deleteSalesProjectAction":action429 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:saveSurvey":action430 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:createSurveyFromTemplate":action431 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:setSurveyActive":action432 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:deleteSurvey":action433 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatScore":action434 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatComment":action435 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setupFinance":action436 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceDocument":action437 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:submitFinanceDocument":action438 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveApprovalPolicy":action439 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:decideFinanceApproval":action440 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPurchaseOrder":action441 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:raiseServiceCredit":action442 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postFinanceDocument":action443 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:recordGoodsReceipt":action444 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:onboardSupplier":action445 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveSupplier":action446 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:requestSupplierBankChange":action447 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:verifySupplierBank":action448 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceBank":action449 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:importBankTransactions":action450 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocateBankTransaction":action451 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPaymentRun":action452 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approvePaymentRun":action453 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createManualJournal":action454 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveManualJournal":action455 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:reverseJournal":action456 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setFinancePeriodState":action457 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceBudget":action458 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceAsset":action459 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postAssetDepreciation":action460 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:completeCloseTask":action461 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceContract":action462 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceScenario":action463 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:receiptForm":action464 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:journalForm":action465 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:statementForm":action466 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocationForm":action467 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:paymentRunForm":action468 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:policyForm":action469 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:scenarioForm":action470 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:uploadFinanceAttachment":action471 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateSalesInvoice":action472 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateInvoiceAdjustment":action473 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:voidFinanceDraft":action474 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceHome":action475 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:listFinanceDocuments":action476 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceDocument":action477 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceWorkspace":action478 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:financeChoices":action479 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getBudgetPositions":action480 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getInvoiceCashForecast":action481 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinancialReport":action482 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceCustomerContribution":action483 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:searchFinance":action484 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceAttachment":action485 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getSalesFinanceProjection":action486 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getReceivingWarehouses":action487 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:createProductionOrder":action488 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:markOrderReady":action489 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:releaseOrder":action490 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:closeOrder":action491 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:startWorkOrder":action492 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:pauseWorkOrder":action493 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:completeWorkOrder":action494 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:listForecasts":action495 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:setForecast":action496 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:deleteForecast":action497 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:runMrp":action498 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:firmSuggestion":action499 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:dismissSuggestion":action500 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:latestPlan":action501 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:loadPlant":action502 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveWorkCentre":action503 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveMachine":action504 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:retirePlantRecord":action505 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:schedulePreview":action506 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:rescheduleWorkOrder":action507 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:setWorkOrderLock":action508 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:listShifts":action509 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:saveShift":action510 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:deleteShift":action511 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createCampaign":action512 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updateCampaign":action513 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProfile":action514 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:recordPermission":action515 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:suppressProfile":action516 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createAudience":action517 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:previewAudience":action518 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createContent":action519 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:approveContent":action520 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createMessage":action521 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:lockSend":action522 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:cancelSend":action523 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:ingestEvent":action524 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourney":action525 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:publishJourney":action526 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:reviseJourney":action527 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProgram":action528 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createExperiment":action529 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:leadFeedback":action530 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:processJourneySteps":action531 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:saveMarketingPlan":action532 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addPlanActivity":action533 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updatePlanActivity":action534 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addBudgetLine":action535 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:submitBudgetToFinance":action536 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourneyMap":action537 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyStage":action538 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyTouch":action539 as (...args:never[])=>Promise<unknown>,
"src/modules/people/services/finance-expenses:getApprovedExpenseSource":action540 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createPlan":action541 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveCell":action542 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addMeasure":action543 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAssumption":action544 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDriver":action545 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addLink":action546 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createScenario":action547 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:promoteScenario":action548 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:submitPlan":action549 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:approvePlan":action550 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:lockPlan":action551 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addGoal":action552 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addInitiative":action553 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createProjectForInitiative":action554 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAction":action555 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeAction":action556 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addRisk":action557 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDependency":action558 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDecision":action559 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addComment":action560 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addUpdate":action561 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeReview":action562 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addReview":action563 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:distributeTargets":action564 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:importGrid":action565 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:sharePlan":action566 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:unsharePlan":action567 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:setPlanAudience":action568 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addNote":action569 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveGoalProgress":action570 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:savePlanBrief":action571 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:listProductionPlans":action572 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getPlanOptions":action573 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getProductionPlan":action574 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:createProductionPlan":action575 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:addProductionPlanLine":action576 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getAssignedPlanningWork":action577 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/queries:getPlanningCoverage":action578 as (...args:never[])=>Promise<unknown>,
"src/modules/products/services/make:saveProductRecipe":action579 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createSpecification":action580 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:setSpecificationStatus":action581 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createControlPoint":action582 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:executeInspection":action583 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:releaseHold":action584 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:reportNcr":action585 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrInvestigation":action586 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:addNcrAction":action587 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrAction":action588 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:closeNcr":action589 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSubstance":action590 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addSafetyDataSheet":action591 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCoshhAssessment":action592 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveSubstance":action593 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCompetence":action594 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSafetyDocument":action595 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:acknowledgeDocument":action596 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveAudit":action597 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addAuditFinding":action598 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveAudit":action599 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveChange":action600 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:advanceChange":action601 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:linkSafetyRecord":action602 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveSafetyProfile":action603 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRiskMatrix":action604 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createRisk":action605 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addControl":action606 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:rateAssessment":action607 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:approveAssessment":action608 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviseAssessment":action609 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:requestRiskReview":action610 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reportIncident":action611 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveImmediateControl":action612 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:openInvestigation":action613 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addCause":action614 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRootCause":action615 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviewRiddor":action616 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createSafetyAction":action617 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:advanceAction":action618 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:verifyAction":action619 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveWorkplaceRecord":action620 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createPermit":action621 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:advancePermit":action622 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:extendPermit":action623 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createIsolation":action624 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:applyIsolationLock":action625 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:verifyIsolation":action626 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:clearIsolation":action627 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:removeIsolationLock":action628 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:placeSafetyHold":action629 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:updateReturnToService":action630 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:releaseSafetyHold":action631 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:overrideSafetyHold":action632 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:saveStatutoryCheck":action633 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:completeInspection":action634 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createInspection":action635 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/address-actions:createSalesAddress":action636 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/catalogue-actions:createSalesCatalogueProduct":action637 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:sendQuote":action638 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:changeQuoteStatus":action639 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:deleteQuote":action640 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:duplicateDocument":action641 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:saveQuoteTemplate":action642 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:createOrderFromQuote":action643 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:linkCommercialProject":action644 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:openCallOffOrder":action645 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:raiseCallOff":action646 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:invoiceCallOffDelivery":action647 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:deliverAndInvoiceCallOff":action648 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/csv-import:importSalescsv":action649 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:addDeliveryAddress":action650 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:addInstaller":action651 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:linkOrderedFor":action652 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/documents:saveDocument":action653 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:saveInvoiceTemplate":action654 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:retireInvoiceTemplate":action655 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:attachCustomerInvoiceTemplate":action656 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:detachCustomerInvoiceTemplate":action657 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:createDraftOrder":action658 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addOrderLine":action659 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:removeOrderLine":action660 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:updateDraftOrderFields":action661 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:confirmOrder":action662 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:decideApproval":action663 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendLineQuantity":action664 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:overrideLinePrice":action665 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendRequestedDate":action666 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelOrder":action667 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:deleteOrder":action668 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelLineRemaining":action669 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addHold":action670 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:releaseHold":action671 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:restoreCancelledOrder":action672 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:returnOrderToQuote":action673 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:saveOrderHashtags":action674 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:saveSalesView":action675 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:archiveSalesView":action676 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createCase":action677 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateCase":action678 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:assignCase":action679 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:transitionCase":action680 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addCaseEntry":action681 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createDepartmentTicket":action682 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateDepartmentTicket":action683 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createQueue":action684 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addQueueMember":action685 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:linkCaseRecord":action686 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:creditChoices":action687 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:askFinanceForCredit":action688 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getCaseOwners":action689 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getDepartmentWork":action690 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readAvailability":action691 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readOrderChain":action692 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/export:inventoryExportRows":action693 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:createTeam":action694 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:renameTeam":action695 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:addMember":action696 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMember":action697 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveTask":action698 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:setTaskStatus":action699 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeTask":action700 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveCover":action701 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeCover":action702 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveHandover":action703 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:savePlace":action704 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveMoment":action705 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMoment":action706 as (...args:never[])=>Promise<unknown>
};
