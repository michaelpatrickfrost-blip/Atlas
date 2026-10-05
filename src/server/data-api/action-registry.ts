// Generated allowlist: public calls still enforce their own server capabilities.
import {loadLiveMetrics as action0} from "@/app/(app)/analytics/actions";
import {loadMetricSlice as action1} from "@/app/(app)/analytics/actions";
import {saveAnalyticsDashboard as action2} from "@/app/(app)/analytics/actions";
import {deleteAnalyticsDashboard as action3} from "@/app/(app)/analytics/actions";
import {toggleModuleAction as action4} from "@/app/(app)/apps/actions";
import {updateCompanyAccount as action5} from "@/app/(app)/atlas/actions";
import {saveCompanyEntitlements as action6} from "@/app/(app)/atlas/actions";
import {createCompanyAccount as action7} from "@/app/(app)/atlas/actions";
import {deleteTestCompany as action8} from "@/app/(app)/atlas/actions";
import {importCompanySetup as action9} from "@/app/(app)/atlas/setup-actions";
import {createCompanyUser as action10} from "@/app/(app)/atlas/setup-actions";
import {setCompanyUserStatus as action11} from "@/app/(app)/atlas/setup-actions";
import {postMessage as action12} from "@/app/(app)/chat/actions";
import {searchChatPeople as action13} from "@/app/(app)/chat/actions";
import {openChat as action14} from "@/app/(app)/chat/actions";
import {openDirectChat as action15} from "@/app/(app)/chat/actions";
import {searchChatRecords as action16} from "@/app/(app)/chat/actions";
import {sendChat as action17} from "@/app/(app)/chat/actions";
import {chatSnapshot as action18} from "@/app/(app)/chat/actions";
import {updateValueFormAction as action19} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {updateCloseDateFormAction as action20} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {setNextActionFormAction as action21} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {setForecastCategoryFormAction as action22} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {winFormAction as action23} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {loseFormAction as action24} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addStakeholderFormAction as action25} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addMilestoneFormAction as action26} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {toggleMilestoneFormAction as action27} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {logOpportunityActivityFormAction as action28} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {qualifyFormAction as action29} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {disqualifyFormAction as action30} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {nurtureFormAction as action31} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {logProspectActivityFormAction as action32} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {assignProspectFormAction as action33} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {assignProspectTaskFormAction as action34} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {convertProspectFormAction as action35} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {pinReportToDashboard as action36} from "@/app/(app)/crm/reports/actions";
import {createContactFormAction as action37} from "@/app/(app)/customers/[partyId]/actions";
import {updateContactFormAction as action38} from "@/app/(app)/customers/[partyId]/actions";
import {deleteContactFormAction as action39} from "@/app/(app)/customers/[partyId]/actions";
import {createAddressFormAction as action40} from "@/app/(app)/customers/[partyId]/actions";
import {createTaxRegistrationFormAction as action41} from "@/app/(app)/customers/[partyId]/actions";
import {markTaxVerifiedFormAction as action42} from "@/app/(app)/customers/[partyId]/actions";
import {createBankAccountFormAction as action43} from "@/app/(app)/customers/[partyId]/actions";
import {createDirectDebitFormAction as action44} from "@/app/(app)/customers/[partyId]/actions";
import {cancelDirectDebitFormAction as action45} from "@/app/(app)/customers/[partyId]/actions";
import {updateCreditLimitFormAction as action46} from "@/app/(app)/customers/[partyId]/actions";
import {toggleCreditHoldFormAction as action47} from "@/app/(app)/customers/[partyId]/actions";
import {createNoteFormAction as action48} from "@/app/(app)/customers/[partyId]/actions";
import {updateStatusFormAction as action49} from "@/app/(app)/customers/[partyId]/actions";
import {deleteCustomerFormAction as action50} from "@/app/(app)/customers/[partyId]/actions";
import {createKpi as action51} from "@/app/(app)/kpis/actions";
import {saveGoal as action52} from "@/app/(app)/kpis/actions";
import {updateKpi as action53} from "@/app/(app)/kpis/actions";
import {recordProgress as action54} from "@/app/(app)/kpis/actions";
import {closeGoal as action55} from "@/app/(app)/kpis/actions";
import {addPlanGoal as action56} from "@/app/(app)/kpis/actions";
import {closePlan as action57} from "@/app/(app)/kpis/actions";
import {commentOnPlan as action58} from "@/app/(app)/kpis/actions";
import {syncDemandAction as action59} from "@/app/(app)/logistics/actions";
import {restoreDeliveryAction as action60} from "@/app/(app)/logistics/actions";
import {releaseAction as action61} from "@/app/(app)/logistics/actions";
import {allocateAction as action62} from "@/app/(app)/logistics/actions";
import {directShipAction as action63} from "@/app/(app)/logistics/actions";
import {groupAction as action64} from "@/app/(app)/logistics/actions";
import {scanAction as action65} from "@/app/(app)/logistics/actions";
import {lotAction as action66} from "@/app/(app)/logistics/actions";
import {serialAction as action67} from "@/app/(app)/logistics/actions";
import {shortAction as action68} from "@/app/(app)/logistics/actions";
import {completeWorkAction as action69} from "@/app/(app)/logistics/actions";
import {claimAction as action70} from "@/app/(app)/logistics/actions";
import {shipFromPickAction as action71} from "@/app/(app)/logistics/actions";
import {packageAction as action72} from "@/app/(app)/logistics/actions";
import {weightAction as action73} from "@/app/(app)/logistics/actions";
import {stageAction as action74} from "@/app/(app)/logistics/actions";
import {labelAction as action75} from "@/app/(app)/logistics/actions";
import {dispatchAction as action76} from "@/app/(app)/logistics/actions";
import {trackingAction as action77} from "@/app/(app)/logistics/actions";
import {deliverAction as action78} from "@/app/(app)/logistics/actions";
import {loadCreateAction as action79} from "@/app/(app)/logistics/actions";
import {loadScanAction as action80} from "@/app/(app)/logistics/actions";
import {departAction as action81} from "@/app/(app)/logistics/actions";
import {expectAction as action82} from "@/app/(app)/logistics/actions";
import {receiveLineAction as action83} from "@/app/(app)/logistics/actions";
import {putAwayAction as action84} from "@/app/(app)/logistics/actions";
import {completeReceiptAction as action85} from "@/app/(app)/logistics/actions";
import {transferAction as action86} from "@/app/(app)/logistics/actions";
import {transferReceiveAction as action87} from "@/app/(app)/logistics/actions";
import {returnRequestAction as action88} from "@/app/(app)/logistics/actions";
import {authoriseReturnAction as action89} from "@/app/(app)/logistics/actions";
import {receiveReturnAction as action90} from "@/app/(app)/logistics/actions";
import {inspectAction as action91} from "@/app/(app)/logistics/actions";
import {closeReturnAction as action92} from "@/app/(app)/logistics/actions";
import {assignEquipmentAction as action93} from "@/app/(app)/logistics/actions";
import {packUnitAction as action94} from "@/app/(app)/logistics/actions";
import {saveHandlingTypeAction as action95} from "@/app/(app)/logistics/actions";
import {retireHandlingTypeAction as action96} from "@/app/(app)/logistics/actions";
import {removeHandlingTypeAction as action97} from "@/app/(app)/logistics/actions";
import {policyAction as action98} from "@/app/(app)/logistics/actions";
import {runMrpAction as action99} from "@/app/(app)/manufacturing/plan/actions";
import {firmSuggestionAction as action100} from "@/app/(app)/manufacturing/plan/actions";
import {dismissSuggestionAction as action101} from "@/app/(app)/manufacturing/plan/actions";
import {setForecastAction as action102} from "@/app/(app)/manufacturing/plan/actions";
import {deleteForecastAction as action103} from "@/app/(app)/manufacturing/plan/actions";
import {runMrpAction as action104} from "@/app/(app)/manufacturing/planning/actions";
import {firmPlannedOrderAction as action105} from "@/app/(app)/manufacturing/planning/actions";
import {dismissPlannedOrderAction as action106} from "@/app/(app)/manufacturing/planning/actions";
import {runMrpForm as action107} from "@/app/(app)/manufacturing/planning/form-actions";
import {firmPlannedOrderForm as action108} from "@/app/(app)/manufacturing/planning/form-actions";
import {dismissPlannedOrderForm as action109} from "@/app/(app)/manufacturing/planning/form-actions";
import {previewMoveAction as action110} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {commitMoveAction as action111} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {toggleLockAction as action112} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {saveShiftAction as action113} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {deleteShiftAction as action114} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {startAction as action115} from "@/app/(app)/manufacturing/shop-floor/actions";
import {pauseAction as action116} from "@/app/(app)/manufacturing/shop-floor/actions";
import {completeAction as action117} from "@/app/(app)/manufacturing/shop-floor/actions";
import {loadNotices as action118} from "@/app/(app)/notices/actions";
import {clearNotice as action119} from "@/app/(app)/notices/actions";
import {clearNotices as action120} from "@/app/(app)/notices/actions";
import {createPayrollRun as action121} from "@/app/(app)/payroll/actions";
import {updatePayslipDeductions as action122} from "@/app/(app)/payroll/actions";
import {finalisePayrollRun as action123} from "@/app/(app)/payroll/actions";
import {markPayrollRunPaid as action124} from "@/app/(app)/payroll/actions";
import {savePayrollSettings as action125} from "@/app/(app)/payroll/actions";
import {issueP45 as action126} from "@/app/(app)/payroll/actions";
import {issueP60 as action127} from "@/app/(app)/payroll/actions";
import {logAbsence as action128} from "@/app/(app)/people/absence/actions";
import {requestLeave as action129} from "@/app/(app)/people/absence/actions";
import {cancelOwnLeave as action130} from "@/app/(app)/people/absence/actions";
import {approveLeaveRequest as action131} from "@/app/(app)/people/absence/actions";
import {setLeaveAllowance as action132} from "@/app/(app)/people/absence/actions";
import {rejectLeaveRequest as action133} from "@/app/(app)/people/absence/actions";
import {createEmployee as action134} from "@/app/(app)/people/actions";
import {changeEmployeeStatus as action135} from "@/app/(app)/people/actions";
import {updateEmployeeProfile as action136} from "@/app/(app)/people/actions";
import {updateOwnEmployeeDetails as action137} from "@/app/(app)/people/actions";
import {addEmployeeDocument as action138} from "@/app/(app)/people/actions";
import {linkEmployeeToUser as action139} from "@/app/(app)/people/actions";
import {completeEmployeeTask as action140} from "@/app/(app)/people/actions";
import {addEmployeeTask as action141} from "@/app/(app)/people/actions";
import {updateEmployeeContact as action142} from "@/app/(app)/people/actions";
import {updateEmployeeTask as action143} from "@/app/(app)/people/actions";
import {scheduleAppraisal as action144} from "@/app/(app)/people/appraisals/actions";
import {completeAppraisal as action145} from "@/app/(app)/people/appraisals/actions";
import {getConductDesk as action146} from "@/app/(app)/people/conduct/actions";
import {getMyConduct as action147} from "@/app/(app)/people/conduct/actions";
import {getPlan as action148} from "@/app/(app)/people/conduct/actions";
import {getCase as action149} from "@/app/(app)/people/conduct/actions";
import {conductChoices as action150} from "@/app/(app)/people/conduct/actions";
import {savePlan as action151} from "@/app/(app)/people/conduct/actions";
import {addPlanReview as action152} from "@/app/(app)/people/conduct/actions";
import {commentOnPlan as action153} from "@/app/(app)/people/conduct/actions";
import {saveCase as action154} from "@/app/(app)/people/conduct/actions";
import {respondToCase as action155} from "@/app/(app)/people/conduct/actions";
import {addCaseEvent as action156} from "@/app/(app)/people/conduct/actions";
import {submitExpenseClaim as action157} from "@/app/(app)/people/expenses/actions";
import {approveExpenseClaim as action158} from "@/app/(app)/people/expenses/actions";
import {rejectExpenseClaim as action159} from "@/app/(app)/people/expenses/actions";
import {scheduleOneToOne as action160} from "@/app/(app)/people/one-to-ones/actions";
import {completeOneToOne as action161} from "@/app/(app)/people/one-to-ones/actions";
import {listPolicies as action162} from "@/app/(app)/people/policies/actions";
import {publishPolicy as action163} from "@/app/(app)/people/policies/actions";
import {archivePolicy as action164} from "@/app/(app)/people/policies/actions";
import {openPolicy as action165} from "@/app/(app)/people/policies/actions";
import {createShift as action166} from "@/app/(app)/people/rotas/actions";
import {changeShiftStatus as action167} from "@/app/(app)/people/rotas/actions";
import {getMyHR as action168} from "@/app/(app)/people/self-service";
import {getMyTeam as action169} from "@/app/(app)/people/self-service";
import {getTeamEmployee as action170} from "@/app/(app)/people/self-service";
import {addPrivateNote as action171} from "@/app/(app)/people/self-service";
import {updateWorkingPattern as action172} from "@/app/(app)/people/self-service";
import {updateHrSettings as action173} from "@/app/(app)/people/settings/actions";
import {createAppraisalTemplate as action174} from "@/app/(app)/people/settings/actions";
import {toggleAppraisalTemplateActive as action175} from "@/app/(app)/people/settings/actions";
import {createOneToOneTemplate as action176} from "@/app/(app)/people/settings/actions";
import {toggleOneToOneTemplateActive as action177} from "@/app/(app)/people/settings/actions";
import {getTimesheetContext as action178} from "@/app/(app)/people/timesheets/actions";
import {saveTimesheet as action179} from "@/app/(app)/people/timesheets/actions";
import {reviewTimesheet as action180} from "@/app/(app)/people/timesheets/actions";
import {createPriceList as action181} from "@/app/(app)/pricing/actions";
import {savePriceEntry as action182} from "@/app/(app)/pricing/actions";
import {saveRule as action183} from "@/app/(app)/pricing/actions";
import {setRuleActive as action184} from "@/app/(app)/pricing/actions";
import {updatePriceBasis as action185} from "@/app/(app)/pricing/actions";
import {assignPriceList as action186} from "@/app/(app)/pricing/actions";
import {previewPriceCsv as action187} from "@/app/(app)/pricing/actions";
import {applyPriceCsv as action188} from "@/app/(app)/pricing/actions";
import {saveAgreement as action189} from "@/app/(app)/pricing/actions";
import {saveAgreementPrice as action190} from "@/app/(app)/pricing/actions";
import {removeAgreementPrice as action191} from "@/app/(app)/pricing/actions";
import {previewAgreementCsv as action192} from "@/app/(app)/pricing/actions";
import {applyAgreementCsv as action193} from "@/app/(app)/pricing/actions";
import {saveProduct as action194} from "@/app/(app)/products/actions";
import {saveProductRecord as action195} from "@/app/(app)/products/actions";
import {saveCategory as action196} from "@/app/(app)/products/actions";
import {retireCategory as action197} from "@/app/(app)/products/actions";
import {addStandardCategories as action198} from "@/app/(app)/products/actions";
import {savePack as action199} from "@/app/(app)/products/actions";
import {saveLinks as action200} from "@/app/(app)/products/actions";
import {saveMeasures as action201} from "@/app/(app)/products/actions";
import {saveProfile as action202} from "@/app/(app)/profile/actions";
import {loadAssignedWork as action203} from "@/app/(app)/profile/work";
import {createProject as action204} from "@/app/(app)/projects/actions";
import {changeProjectStatus as action205} from "@/app/(app)/projects/actions";
import {editProject as action206} from "@/app/(app)/projects/actions";
import {setProjectMember as action207} from "@/app/(app)/projects/actions";
import {archiveProject as action208} from "@/app/(app)/projects/actions";
import {createTask as action209} from "@/app/(app)/projects/actions";
import {changeTaskStatus as action210} from "@/app/(app)/projects/actions";
import {editTask as action211} from "@/app/(app)/projects/actions";
import {checklistItem as action212} from "@/app/(app)/projects/actions";
import {addDependency as action213} from "@/app/(app)/projects/actions";
import {createMeeting as action214} from "@/app/(app)/projects/actions";
import {createDocument as action215} from "@/app/(app)/projects/actions";
import {editDocument as action216} from "@/app/(app)/projects/actions";
import {addComment as action217} from "@/app/(app)/projects/actions";
import {createMilestone as action218} from "@/app/(app)/projects/actions";
import {publishUpdate as action219} from "@/app/(app)/projects/actions";
import {createDecision as action220} from "@/app/(app)/projects/actions";
import {decide as action221} from "@/app/(app)/projects/actions";
import {createRisk as action222} from "@/app/(app)/projects/actions";
import {closeRisk as action223} from "@/app/(app)/projects/actions";
import {requestApproval as action224} from "@/app/(app)/projects/actions";
import {respondApproval as action225} from "@/app/(app)/projects/actions";
import {submitRequest as action226} from "@/app/(app)/projects/actions";
import {triageRequest as action227} from "@/app/(app)/projects/actions";
import {logTime as action228} from "@/app/(app)/projects/actions";
import {planToday as action229} from "@/app/(app)/projects/actions";
import {updateInbox as action230} from "@/app/(app)/projects/actions";
import {saveView as action231} from "@/app/(app)/projects/actions";
import {createPortfolio as action232} from "@/app/(app)/projects/actions";
import {createBaseline as action233} from "@/app/(app)/projects/actions";
import {setBudget as action234} from "@/app/(app)/projects/actions";
import {linkWork as action235} from "@/app/(app)/projects/actions";
import {getProjectActivity as action236} from "@/app/(app)/projects/actions";
import {createAutomation as action237} from "@/app/(app)/projects/actions";
import {toggleAutomation as action238} from "@/app/(app)/projects/actions";
import {saveProjectTemplate as action239} from "@/app/(app)/projects/actions";
import {useProjectTemplate as action240} from "@/app/(app)/projects/actions";
import {startTimer as action241} from "@/app/(app)/projects/actions";
import {stopTimer as action242} from "@/app/(app)/projects/actions";
import {projectPreference as action243} from "@/app/(app)/projects/actions";
import {uploadProjectFile as action244} from "@/app/(app)/projects/actions";
import {readProjectFile as action245} from "@/app/(app)/projects/actions";
import {createProperty as action246} from "@/app/(app)/projects/actions";
import {setProperty as action247} from "@/app/(app)/projects/actions";
import {restoreDocument as action248} from "@/app/(app)/projects/actions";
import {createTaskFromDocument as action249} from "@/app/(app)/projects/actions";
import {discardTimer as action250} from "@/app/(app)/projects/actions";
import {completeMilestone as action251} from "@/app/(app)/projects/actions";
import {resolveComment as action252} from "@/app/(app)/projects/actions";
import {getProjectWorkload as action253} from "@/app/(app)/projects/actions";
import {createOrderForm as action254} from "@/app/(app)/sales/orders/actions";
import {addLineForm as action255} from "@/app/(app)/sales/orders/actions";
import {removeLineForm as action256} from "@/app/(app)/sales/orders/actions";
import {confirmOrderForm as action257} from "@/app/(app)/sales/orders/actions";
import {updateOrderForm as action258} from "@/app/(app)/sales/orders/actions";
import {chooseOrderAddresses as action259} from "@/app/(app)/sales/orders/actions";
import {addHoldForm as action260} from "@/app/(app)/sales/orders/actions";
import {releaseHoldForm as action261} from "@/app/(app)/sales/orders/actions";
import {approveOrderForm as action262} from "@/app/(app)/sales/orders/actions";
import {cancelOrderForm as action263} from "@/app/(app)/sales/orders/actions";
import {saveOrderHashtagsForm as action264} from "@/app/(app)/sales/orders/actions";
import {restoreCancelledOrderForm as action265} from "@/app/(app)/sales/orders/actions";
import {returnOrderToQuoteForm as action266} from "@/app/(app)/sales/orders/actions";
import {scheduleOrderDelivery as action267} from "@/app/(app)/sales/orders/actions";
import {rejectOrderApproval as action268} from "@/app/(app)/sales/orders/actions";
import {deleteOrderForm as action269} from "@/app/(app)/sales/orders/actions";
import {createQuote as action270} from "@/app/(app)/sales/quotes/actions";
import {deleteQuoteForm as action271} from "@/app/(app)/sales/quotes/actions";
import {saveCreationPolicy as action272} from "@/app/(app)/sales/settings/actions";
import {getSchedule as action273} from "@/app/(app)/scheduling/actions";
import {createBulkShifts as action274} from "@/app/(app)/scheduling/actions";
import {setScheduledShift as action275} from "@/app/(app)/scheduling/actions";
import {completeShiftTask as action276} from "@/app/(app)/scheduling/actions";
import {editScheduledShift as action277} from "@/app/(app)/scheduling/actions";
import {publishWeekShifts as action278} from "@/app/(app)/scheduling/actions";
import {saveHoursBudget as action279} from "@/app/(app)/scheduling/actions";
import {getTeamPlan as action280} from "@/app/(app)/scheduling/actions";
import {getPersonSchedule as action281} from "@/app/(app)/scheduling/actions";
import {saveWorkType as action282} from "@/app/(app)/scheduling/actions";
import {archiveWorkType as action283} from "@/app/(app)/scheduling/actions";
import {saveDemand as action284} from "@/app/(app)/scheduling/actions";
import {saveBusyRule as action285} from "@/app/(app)/scheduling/actions";
import {removeBusyRule as action286} from "@/app/(app)/scheduling/actions";
import {fillTeamMonth as action287} from "@/app/(app)/scheduling/actions";
import {replanCover as action288} from "@/app/(app)/scheduling/actions";
import {publishMonth as action289} from "@/app/(app)/scheduling/actions";
import {saveShift as action290} from "@/app/(app)/scheduling/actions";
import {saveRole as action291} from "@/app/(app)/settings/actions";
import {saveMemberRoles as action292} from "@/app/(app)/settings/actions";
import {createUser as action293} from "@/app/(app)/settings/actions";
import {saveCompanyAccess as action294} from "@/app/(app)/settings/actions";
import {saveCompanyProfile as action295} from "@/app/(app)/settings/actions";
import {saveManagerPolicy as action296} from "@/app/(app)/settings/actions";
import {saveWorkspaceDetails as action297} from "@/app/(app)/settings/actions";
import {saveCompanyBrand as action298} from "@/app/(app)/settings/actions";
import {importCsv as action299} from "@/app/(app)/settings/imports/actions";
import {saveEmailAccount as action300} from "@/app/(app)/settings/it/actions";
import {verifyEmailAccount as action301} from "@/app/(app)/settings/it/actions";
import {sendTestEmail as action302} from "@/app/(app)/settings/it/actions";
import {makeDefaultAccount as action303} from "@/app/(app)/settings/it/actions";
import {setAccountActive as action304} from "@/app/(app)/settings/it/actions";
import {deleteEmailAccount as action305} from "@/app/(app)/settings/it/actions";
import {saveSocialAccount as action306} from "@/app/(app)/settings/it/actions";
import {deleteSocialAccount as action307} from "@/app/(app)/settings/it/actions";
import {checkSocialAccount as action308} from "@/app/(app)/settings/it/actions";
import {saveEmailTemplate as action309} from "@/app/(app)/settings/it/actions";
import {deleteEmailTemplate as action310} from "@/app/(app)/settings/it/actions";
import {saveDispatchDelivery as action311} from "@/app/(app)/settings/logistics/actions";
import {saveUserAccess as action312} from "@/app/(app)/settings/user-actions";
import {setUserStatus as action313} from "@/app/(app)/settings/user-actions";
import {revokeUserSessions as action314} from "@/app/(app)/settings/user-actions";
import {issuePasswordRecovery as action315} from "@/app/(app)/settings/user-actions";
import {createManagedUser as action316} from "@/app/(app)/settings/user-actions";
import {linkEmployeeProfile as action317} from "@/app/(app)/settings/user-actions";
import {createRole as action318} from "@/app/(app)/settings/user-actions";
import {saveManagementGroup as action319} from "@/app/(app)/settings/user-actions";
import {createWarehouse as action320} from "@/app/(app)/stock/actions";
import {adjustStock as action321} from "@/app/(app)/stock/actions";
import {savePlanningAction as action322} from "@/app/(app)/stock/actions";
import {makeFromForecastAction as action323} from "@/app/(app)/stock/actions";
import {transferStock as action324} from "@/app/(app)/stock/actions";
import {createSiteAction as action325} from "@/app/(app)/stock/actions";
import {createPlaceAction as action326} from "@/app/(app)/stock/actions";
import {assignSiteAction as action327} from "@/app/(app)/stock/actions";
import {addLocationAction as action328} from "@/app/(app)/stock/actions";
import {ensureLocationsAction as action329} from "@/app/(app)/stock/actions";
import {retireLocationAction as action330} from "@/app/(app)/stock/actions";
import {putOnLocationAction as action331} from "@/app/(app)/stock/actions";
import {moveLocatedAction as action332} from "@/app/(app)/stock/actions";
import {receiveMoveAction as action333} from "@/app/(app)/stock/actions";
import {delegateApprovals as action334} from "@/core/approvals/actions";
import {loginAction as action335} from "@/core/auth/actions";
import {logoutAction as action336} from "@/core/auth/actions";
import {completePasswordRecovery as action337} from "@/core/auth/security-actions";
import {changeOwnPassword as action338} from "@/core/auth/security-actions";
import {signOutOtherSessions as action339} from "@/core/auth/security-actions";
import {createContract as action340} from "@/core/contracts/actions";
import {sendContract as action341} from "@/core/contracts/actions";
import {signContract as action342} from "@/core/contracts/actions";
import {declineContract as action343} from "@/core/contracts/actions";
import {loadPublicContract as action344} from "@/core/contracts/actions";
import {checkForDuplicatesAction as action345} from "@/core/customers/actions";
import {createCustomerAction as action346} from "@/core/customers/actions";
import {createCustomer as action347} from "@/core/customers/commands";
import {updateCustomerStatus as action348} from "@/core/customers/commands";
import {deleteCustomer as action349} from "@/core/customers/commands";
import {createContact as action350} from "@/core/customers/commands";
import {updateContact as action351} from "@/core/customers/commands";
import {deleteContact as action352} from "@/core/customers/commands";
import {createAddress as action353} from "@/core/customers/commands";
import {updateCommercialSettings as action354} from "@/core/customers/commands";
import {updateCreditLimit as action355} from "@/core/customers/commands";
import {setCreditHold as action356} from "@/core/customers/commands";
import {setPaymentTerm as action357} from "@/core/customers/commands";
import {createTaxRegistration as action358} from "@/core/customers/commands";
import {markTaxRegistrationManuallyVerified as action359} from "@/core/customers/commands";
import {createBankAccount as action360} from "@/core/customers/commands";
import {revealBankAccount as action361} from "@/core/customers/commands";
import {createDirectDebitMandate as action362} from "@/core/customers/commands";
import {cancelDirectDebitMandate as action363} from "@/core/customers/commands";
import {createNote as action364} from "@/core/customers/commands";
import {saveCustomerHashtags as action365} from "@/core/customers/commands";
import {saveOrderingPreferences as action366} from "@/core/customers/commercial-actions";
import {setCustomerParent as action367} from "@/core/customers/hierarchy-actions";
import {placeCustomer as action368} from "@/core/customers/hierarchy-actions";
import {moveCustomer as action369} from "@/core/customers/hierarchy-actions";
import {setContactReportsTo as action370} from "@/core/customers/hierarchy-actions";
import {saveCustomerTradingLink as action371} from "@/core/customers/trading-actions";
import {setInvoiceAccount as action372} from "@/core/customers/trading-actions";
import {archiveCustomerTradingLink as action373} from "@/core/customers/trading-actions";
import {requestSalesInvoice as action374} from "@/core/finance/actions";
import {createWorkTeam as action375} from "@/core/teams/actions";
import {loadAuditBoard as action376} from "@/modules/audit/services/actions";
import {exportAuditReport as action377} from "@/modules/audit/services/actions";
import {loadEcho as action378} from "@/modules/audit/services/actions";
import {postEchoNote as action379} from "@/modules/audit/services/actions";
import {loadEchoInbox as action380} from "@/modules/audit/services/actions";
import {loadAuditAccess as action381} from "@/modules/audit/services/actions";
import {saveAuditOwnActivity as action382} from "@/modules/audit/services/actions";
import {saveAuditAreas as action383} from "@/modules/audit/services/actions";
import {saveAutomation as action384} from "@/modules/automations/services/actions";
import {setAutomationEnabled as action385} from "@/modules/automations/services/actions";
import {deleteAutomation as action386} from "@/modules/automations/services/actions";
import {testOnPastEvent as action387} from "@/modules/automations/services/actions";
import {runNow as action388} from "@/modules/automations/services/actions";
import {logActivity as action389} from "@/modules/crm/services/activities";
import {completeActivity as action390} from "@/modules/crm/services/activities";
import {acceptMarketingHandoff as action391} from "@/modules/crm/services/marketing-handoff";
import {createOpportunity as action392} from "@/modules/crm/services/opportunities";
import {moveOpportunityStage as action393} from "@/modules/crm/services/opportunities";
import {updateOpportunityValue as action394} from "@/modules/crm/services/opportunities";
import {updateOpportunityCloseDate as action395} from "@/modules/crm/services/opportunities";
import {setOpportunityForecastCategory as action396} from "@/modules/crm/services/opportunities";
import {setOpportunityNextAction as action397} from "@/modules/crm/services/opportunities";
import {winOpportunity as action398} from "@/modules/crm/services/opportunities";
import {loseOpportunity as action399} from "@/modules/crm/services/opportunities";
import {addStakeholder as action400} from "@/modules/crm/services/opportunities";
import {addMilestone as action401} from "@/modules/crm/services/opportunities";
import {toggleMilestone as action402} from "@/modules/crm/services/opportunities";
import {checkProspectDuplicatesAction as action403} from "@/modules/crm/services/prospects";
import {createProspect as action404} from "@/modules/crm/services/prospects";
import {assignProspect as action405} from "@/modules/crm/services/prospects";
import {setProspectLifecycleStage as action406} from "@/modules/crm/services/prospects";
import {convertProspect as action407} from "@/modules/crm/services/prospects";
import {createIndustry as action408} from "@/modules/crm/services/prospects";
import {saveProspectGrouping as action409} from "@/modules/crm/services/prospects";
import {createSalesProject as action410} from "@/modules/crm/services/sales-projects-commands";
import {createSalesProjectFormAction as action411} from "@/modules/crm/services/sales-projects-commands";
import {saveSalesProjectAction as action412} from "@/modules/crm/services/sales-projects-commands";
import {saveNextActionAction as action413} from "@/modules/crm/services/sales-projects-commands";
import {addProjectOrganisationAction as action414} from "@/modules/crm/services/sales-projects-commands";
import {removeProjectOrganisationAction as action415} from "@/modules/crm/services/sales-projects-commands";
import {makePrimaryOrganisationAction as action416} from "@/modules/crm/services/sales-projects-commands";
import {addProjectStakeholderAction as action417} from "@/modules/crm/services/sales-projects-commands";
import {removeProjectStakeholderAction as action418} from "@/modules/crm/services/sales-projects-commands";
import {setDocumentSalesProjectAction as action419} from "@/modules/crm/services/sales-projects-commands";
import {deleteSalesProjectAction as action420} from "@/modules/crm/services/sales-projects-commands";
import {saveSurvey as action421} from "@/modules/csat/services/actions";
import {setSurveyActive as action422} from "@/modules/csat/services/actions";
import {recordCsatScore as action423} from "@/modules/csat/services/actions";
import {recordCsatComment as action424} from "@/modules/csat/services/actions";
import {setupFinance as action425} from "@/modules/finance/services/commands";
import {createFinanceDocument as action426} from "@/modules/finance/services/commands";
import {submitFinanceDocument as action427} from "@/modules/finance/services/commands";
import {saveApprovalPolicy as action428} from "@/modules/finance/services/commands";
import {decideFinanceApproval as action429} from "@/modules/finance/services/commands";
import {createPurchaseOrder as action430} from "@/modules/finance/services/commands";
import {raiseServiceCredit as action431} from "@/modules/finance/services/commands";
import {postFinanceDocument as action432} from "@/modules/finance/services/commands";
import {recordGoodsReceipt as action433} from "@/modules/finance/services/commands";
import {onboardSupplier as action434} from "@/modules/finance/services/commands";
import {approveSupplier as action435} from "@/modules/finance/services/commands";
import {requestSupplierBankChange as action436} from "@/modules/finance/services/commands";
import {verifySupplierBank as action437} from "@/modules/finance/services/commands";
import {createFinanceBank as action438} from "@/modules/finance/services/commands";
import {importBankTransactions as action439} from "@/modules/finance/services/commands";
import {allocateBankTransaction as action440} from "@/modules/finance/services/commands";
import {createPaymentRun as action441} from "@/modules/finance/services/commands";
import {approvePaymentRun as action442} from "@/modules/finance/services/commands";
import {createManualJournal as action443} from "@/modules/finance/services/commands";
import {approveManualJournal as action444} from "@/modules/finance/services/commands";
import {reverseJournal as action445} from "@/modules/finance/services/commands";
import {setFinancePeriodState as action446} from "@/modules/finance/services/commands";
import {saveFinanceBudget as action447} from "@/modules/finance/services/commands";
import {saveFinanceAsset as action448} from "@/modules/finance/services/commands";
import {postAssetDepreciation as action449} from "@/modules/finance/services/commands";
import {completeCloseTask as action450} from "@/modules/finance/services/commands";
import {saveFinanceContract as action451} from "@/modules/finance/services/commands";
import {saveFinanceScenario as action452} from "@/modules/finance/services/commands";
import {receiptForm as action453} from "@/modules/finance/services/commands";
import {journalForm as action454} from "@/modules/finance/services/commands";
import {statementForm as action455} from "@/modules/finance/services/commands";
import {allocationForm as action456} from "@/modules/finance/services/commands";
import {paymentRunForm as action457} from "@/modules/finance/services/commands";
import {policyForm as action458} from "@/modules/finance/services/commands";
import {scenarioForm as action459} from "@/modules/finance/services/commands";
import {uploadFinanceAttachment as action460} from "@/modules/finance/services/commands";
import {generateSalesInvoice as action461} from "@/modules/finance/services/commands";
import {generateInvoiceAdjustment as action462} from "@/modules/finance/services/commands";
import {voidFinanceDraft as action463} from "@/modules/finance/services/commands";
import {getFinanceHome as action464} from "@/modules/finance/services/queries";
import {listFinanceDocuments as action465} from "@/modules/finance/services/queries";
import {getFinanceDocument as action466} from "@/modules/finance/services/queries";
import {getFinanceWorkspace as action467} from "@/modules/finance/services/queries";
import {financeChoices as action468} from "@/modules/finance/services/queries";
import {getBudgetPositions as action469} from "@/modules/finance/services/queries";
import {getInvoiceCashForecast as action470} from "@/modules/finance/services/queries";
import {getFinancialReport as action471} from "@/modules/finance/services/queries";
import {getFinanceCustomerContribution as action472} from "@/modules/finance/services/queries";
import {searchFinance as action473} from "@/modules/finance/services/queries";
import {getFinanceAttachment as action474} from "@/modules/finance/services/queries";
import {getSalesFinanceProjection as action475} from "@/modules/finance/services/queries";
import {getReceivingWarehouses as action476} from "@/modules/finance/services/queries";
import {createProductionOrder as action477} from "@/modules/manufacturing/services/commands";
import {markOrderReady as action478} from "@/modules/manufacturing/services/commands";
import {releaseOrder as action479} from "@/modules/manufacturing/services/commands";
import {closeOrder as action480} from "@/modules/manufacturing/services/commands";
import {startWorkOrder as action481} from "@/modules/manufacturing/services/commands";
import {pauseWorkOrder as action482} from "@/modules/manufacturing/services/commands";
import {completeWorkOrder as action483} from "@/modules/manufacturing/services/commands";
import {listForecasts as action484} from "@/modules/manufacturing/services/forecast";
import {setForecast as action485} from "@/modules/manufacturing/services/forecast";
import {deleteForecast as action486} from "@/modules/manufacturing/services/forecast";
import {runMrp as action487} from "@/modules/manufacturing/services/mrp";
import {firmSuggestion as action488} from "@/modules/manufacturing/services/mrp";
import {dismissSuggestion as action489} from "@/modules/manufacturing/services/mrp";
import {latestPlan as action490} from "@/modules/manufacturing/services/mrp";
import {loadPlant as action491} from "@/modules/manufacturing/services/plant";
import {saveWorkCentre as action492} from "@/modules/manufacturing/services/plant";
import {saveMachine as action493} from "@/modules/manufacturing/services/plant";
import {retirePlantRecord as action494} from "@/modules/manufacturing/services/plant";
import {schedulePreview as action495} from "@/modules/manufacturing/services/scheduler";
import {rescheduleWorkOrder as action496} from "@/modules/manufacturing/services/scheduler";
import {setWorkOrderLock as action497} from "@/modules/manufacturing/services/scheduler";
import {listShifts as action498} from "@/modules/manufacturing/services/shifts";
import {saveShift as action499} from "@/modules/manufacturing/services/shifts";
import {deleteShift as action500} from "@/modules/manufacturing/services/shifts";
import {createCampaign as action501} from "@/modules/marketing/services/commands";
import {updateCampaign as action502} from "@/modules/marketing/services/commands";
import {createProfile as action503} from "@/modules/marketing/services/commands";
import {recordPermission as action504} from "@/modules/marketing/services/commands";
import {suppressProfile as action505} from "@/modules/marketing/services/commands";
import {createAudience as action506} from "@/modules/marketing/services/commands";
import {previewAudience as action507} from "@/modules/marketing/services/commands";
import {createContent as action508} from "@/modules/marketing/services/commands";
import {approveContent as action509} from "@/modules/marketing/services/commands";
import {createMessage as action510} from "@/modules/marketing/services/commands";
import {lockSend as action511} from "@/modules/marketing/services/commands";
import {cancelSend as action512} from "@/modules/marketing/services/commands";
import {ingestEvent as action513} from "@/modules/marketing/services/commands";
import {createJourney as action514} from "@/modules/marketing/services/commands";
import {publishJourney as action515} from "@/modules/marketing/services/commands";
import {reviseJourney as action516} from "@/modules/marketing/services/commands";
import {createProgram as action517} from "@/modules/marketing/services/commands";
import {createExperiment as action518} from "@/modules/marketing/services/commands";
import {leadFeedback as action519} from "@/modules/marketing/services/commands";
import {processJourneySteps as action520} from "@/modules/marketing/services/commands";
import {saveMarketingPlan as action521} from "@/modules/marketing/services/commands";
import {addPlanActivity as action522} from "@/modules/marketing/services/commands";
import {updatePlanActivity as action523} from "@/modules/marketing/services/commands";
import {addBudgetLine as action524} from "@/modules/marketing/services/commands";
import {submitBudgetToFinance as action525} from "@/modules/marketing/services/commands";
import {createJourneyMap as action526} from "@/modules/marketing/services/commands";
import {addJourneyStage as action527} from "@/modules/marketing/services/commands";
import {addJourneyTouch as action528} from "@/modules/marketing/services/commands";
import {getApprovedExpenseSource as action529} from "@/modules/people/services/finance-expenses";
import {createPlan as action530} from "@/modules/plan/services/commands";
import {saveCell as action531} from "@/modules/plan/services/commands";
import {addMeasure as action532} from "@/modules/plan/services/commands";
import {addAssumption as action533} from "@/modules/plan/services/commands";
import {addDriver as action534} from "@/modules/plan/services/commands";
import {addLink as action535} from "@/modules/plan/services/commands";
import {createScenario as action536} from "@/modules/plan/services/commands";
import {promoteScenario as action537} from "@/modules/plan/services/commands";
import {submitPlan as action538} from "@/modules/plan/services/commands";
import {approvePlan as action539} from "@/modules/plan/services/commands";
import {lockPlan as action540} from "@/modules/plan/services/commands";
import {addGoal as action541} from "@/modules/plan/services/commands";
import {addInitiative as action542} from "@/modules/plan/services/commands";
import {createProjectForInitiative as action543} from "@/modules/plan/services/commands";
import {addAction as action544} from "@/modules/plan/services/commands";
import {completeAction as action545} from "@/modules/plan/services/commands";
import {addRisk as action546} from "@/modules/plan/services/commands";
import {addDependency as action547} from "@/modules/plan/services/commands";
import {addDecision as action548} from "@/modules/plan/services/commands";
import {addComment as action549} from "@/modules/plan/services/commands";
import {addUpdate as action550} from "@/modules/plan/services/commands";
import {completeReview as action551} from "@/modules/plan/services/commands";
import {addReview as action552} from "@/modules/plan/services/commands";
import {distributeTargets as action553} from "@/modules/plan/services/commands";
import {importGrid as action554} from "@/modules/plan/services/commands";
import {sharePlan as action555} from "@/modules/plan/services/commands";
import {unsharePlan as action556} from "@/modules/plan/services/commands";
import {setPlanAudience as action557} from "@/modules/plan/services/commands";
import {addNote as action558} from "@/modules/plan/services/commands";
import {saveGoalProgress as action559} from "@/modules/plan/services/commands";
import {savePlanBrief as action560} from "@/modules/plan/services/commands";
import {listProductionPlans as action561} from "@/modules/planning/services/plans";
import {getPlanOptions as action562} from "@/modules/planning/services/plans";
import {getProductionPlan as action563} from "@/modules/planning/services/plans";
import {createProductionPlan as action564} from "@/modules/planning/services/plans";
import {addProductionPlanLine as action565} from "@/modules/planning/services/plans";
import {getAssignedPlanningWork as action566} from "@/modules/planning/services/plans";
import {getPlanningCoverage as action567} from "@/modules/planning/services/queries";
import {saveProductRecipe as action568} from "@/modules/products/services/make";
import {createSpecification as action569} from "@/modules/quality/services/commands";
import {setSpecificationStatus as action570} from "@/modules/quality/services/commands";
import {createControlPoint as action571} from "@/modules/quality/services/commands";
import {executeInspection as action572} from "@/modules/quality/services/commands";
import {releaseHold as action573} from "@/modules/quality/services/commands";
import {reportNcr as action574} from "@/modules/quality/services/commands";
import {updateNcrInvestigation as action575} from "@/modules/quality/services/commands";
import {addNcrAction as action576} from "@/modules/quality/services/commands";
import {updateNcrAction as action577} from "@/modules/quality/services/commands";
import {closeNcr as action578} from "@/modules/quality/services/commands";
import {saveSubstance as action579} from "@/modules/safety/services/assurance";
import {addSafetyDataSheet as action580} from "@/modules/safety/services/assurance";
import {saveCoshhAssessment as action581} from "@/modules/safety/services/assurance";
import {approveSubstance as action582} from "@/modules/safety/services/assurance";
import {saveCompetence as action583} from "@/modules/safety/services/assurance";
import {saveSafetyDocument as action584} from "@/modules/safety/services/assurance";
import {acknowledgeDocument as action585} from "@/modules/safety/services/assurance";
import {saveAudit as action586} from "@/modules/safety/services/assurance";
import {addAuditFinding as action587} from "@/modules/safety/services/assurance";
import {approveAudit as action588} from "@/modules/safety/services/assurance";
import {saveChange as action589} from "@/modules/safety/services/assurance";
import {advanceChange as action590} from "@/modules/safety/services/assurance";
import {linkSafetyRecord as action591} from "@/modules/safety/services/assurance";
import {saveSafetyProfile as action592} from "@/modules/safety/services/commands";
import {saveRiskMatrix as action593} from "@/modules/safety/services/commands";
import {createRisk as action594} from "@/modules/safety/services/commands";
import {addControl as action595} from "@/modules/safety/services/commands";
import {rateAssessment as action596} from "@/modules/safety/services/commands";
import {approveAssessment as action597} from "@/modules/safety/services/commands";
import {reviseAssessment as action598} from "@/modules/safety/services/commands";
import {requestRiskReview as action599} from "@/modules/safety/services/commands";
import {reportIncident as action600} from "@/modules/safety/services/commands";
import {saveImmediateControl as action601} from "@/modules/safety/services/commands";
import {openInvestigation as action602} from "@/modules/safety/services/commands";
import {addCause as action603} from "@/modules/safety/services/commands";
import {saveRootCause as action604} from "@/modules/safety/services/commands";
import {reviewRiddor as action605} from "@/modules/safety/services/commands";
import {createSafetyAction as action606} from "@/modules/safety/services/commands";
import {advanceAction as action607} from "@/modules/safety/services/commands";
import {verifyAction as action608} from "@/modules/safety/services/commands";
import {saveWorkplaceRecord as action609} from "@/modules/safety/services/commands";
import {createPermit as action610} from "@/modules/safety/services/control";
import {advancePermit as action611} from "@/modules/safety/services/control";
import {extendPermit as action612} from "@/modules/safety/services/control";
import {createIsolation as action613} from "@/modules/safety/services/control";
import {applyIsolationLock as action614} from "@/modules/safety/services/control";
import {verifyIsolation as action615} from "@/modules/safety/services/control";
import {clearIsolation as action616} from "@/modules/safety/services/control";
import {removeIsolationLock as action617} from "@/modules/safety/services/control";
import {placeSafetyHold as action618} from "@/modules/safety/services/control";
import {updateReturnToService as action619} from "@/modules/safety/services/control";
import {releaseSafetyHold as action620} from "@/modules/safety/services/control";
import {overrideSafetyHold as action621} from "@/modules/safety/services/control";
import {saveStatutoryCheck as action622} from "@/modules/safety/services/control";
import {completeInspection as action623} from "@/modules/safety/services/control";
import {createInspection as action624} from "@/modules/safety/services/control";
import {createSalesAddress as action625} from "@/modules/sales/services/address-actions";
import {createSalesCatalogueProduct as action626} from "@/modules/sales/services/catalogue-actions";
import {sendQuote as action627} from "@/modules/sales/services/commands";
import {changeQuoteStatus as action628} from "@/modules/sales/services/commands";
import {deleteQuote as action629} from "@/modules/sales/services/commands";
import {duplicateDocument as action630} from "@/modules/sales/services/commands";
import {saveQuoteTemplate as action631} from "@/modules/sales/services/commands";
import {createOrderFromQuote as action632} from "@/modules/sales/services/commands";
import {linkCommercialProject as action633} from "@/modules/sales/services/commercial";
import {openCallOffOrder as action634} from "@/modules/sales/services/commercial";
import {raiseCallOff as action635} from "@/modules/sales/services/commercial";
import {invoiceCallOffDelivery as action636} from "@/modules/sales/services/commercial";
import {deliverAndInvoiceCallOff as action637} from "@/modules/sales/services/commercial";
import {importSalescsv as action638} from "@/modules/sales/services/csv-import";
import {saveDocument as action639} from "@/modules/sales/services/documents";
import {saveInvoiceTemplate as action640} from "@/modules/sales/services/invoice-template-actions";
import {retireInvoiceTemplate as action641} from "@/modules/sales/services/invoice-template-actions";
import {attachCustomerInvoiceTemplate as action642} from "@/modules/sales/services/invoice-template-actions";
import {detachCustomerInvoiceTemplate as action643} from "@/modules/sales/services/invoice-template-actions";
import {createDraftOrder as action644} from "@/modules/sales/services/orders";
import {addOrderLine as action645} from "@/modules/sales/services/orders";
import {removeOrderLine as action646} from "@/modules/sales/services/orders";
import {updateDraftOrderFields as action647} from "@/modules/sales/services/orders";
import {confirmOrder as action648} from "@/modules/sales/services/orders";
import {decideApproval as action649} from "@/modules/sales/services/orders";
import {amendLineQuantity as action650} from "@/modules/sales/services/orders";
import {overrideLinePrice as action651} from "@/modules/sales/services/orders";
import {amendRequestedDate as action652} from "@/modules/sales/services/orders";
import {cancelOrder as action653} from "@/modules/sales/services/orders";
import {deleteOrder as action654} from "@/modules/sales/services/orders";
import {cancelLineRemaining as action655} from "@/modules/sales/services/orders";
import {addHold as action656} from "@/modules/sales/services/orders";
import {releaseHold as action657} from "@/modules/sales/services/orders";
import {restoreCancelledOrder as action658} from "@/modules/sales/services/rewind";
import {returnOrderToQuote as action659} from "@/modules/sales/services/rewind";
import {saveOrderHashtags as action660} from "@/modules/sales/services/rewind";
import {saveSalesView as action661} from "@/modules/sales/services/saved-views";
import {archiveSalesView as action662} from "@/modules/sales/services/saved-views";
import {createCase as action663} from "@/modules/service/services/commands";
import {updateCase as action664} from "@/modules/service/services/commands";
import {assignCase as action665} from "@/modules/service/services/commands";
import {transitionCase as action666} from "@/modules/service/services/commands";
import {addCaseEntry as action667} from "@/modules/service/services/commands";
import {createDepartmentTicket as action668} from "@/modules/service/services/commands";
import {updateDepartmentTicket as action669} from "@/modules/service/services/commands";
import {createQueue as action670} from "@/modules/service/services/commands";
import {addQueueMember as action671} from "@/modules/service/services/commands";
import {linkCaseRecord as action672} from "@/modules/service/services/commands";
import {creditChoices as action673} from "@/modules/service/services/commands";
import {askFinanceForCredit as action674} from "@/modules/service/services/commands";
import {getCaseOwners as action675} from "@/modules/service/services/commands";
import {getDepartmentWork as action676} from "@/modules/service/services/commands";
import {readAvailability as action677} from "@/modules/stock/services/availability";
import {readOrderChain as action678} from "@/modules/stock/services/availability";
import {inventoryExportRows as action679} from "@/modules/stock/services/export";
import {createTeam as action680} from "@/modules/teams/services/commands";
import {renameTeam as action681} from "@/modules/teams/services/commands";
import {addMember as action682} from "@/modules/teams/services/commands";
import {removeMember as action683} from "@/modules/teams/services/commands";
import {saveTask as action684} from "@/modules/teams/services/commands";
import {setTaskStatus as action685} from "@/modules/teams/services/commands";
import {removeTask as action686} from "@/modules/teams/services/commands";
import {saveCover as action687} from "@/modules/teams/services/commands";
import {removeCover as action688} from "@/modules/teams/services/commands";
import {saveHandover as action689} from "@/modules/teams/services/commands";
import {savePlace as action690} from "@/modules/teams/services/commands";
import {saveMoment as action691} from "@/modules/teams/services/commands";
import {removeMoment as action692} from "@/modules/teams/services/commands";
export const DATA_ACTIONS:Record<string,(...args:never[])=>Promise<unknown>>={
"src/app/(app)/analytics/actions:loadLiveMetrics":action0 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:loadMetricSlice":action1 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:saveAnalyticsDashboard":action2 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:deleteAnalyticsDashboard":action3 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/apps/actions:toggleModuleAction":action4 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/actions:updateCompanyAccount":action5 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/actions:saveCompanyEntitlements":action6 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/actions:createCompanyAccount":action7 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/actions:deleteTestCompany":action8 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/setup-actions:importCompanySetup":action9 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/setup-actions:createCompanyUser":action10 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/setup-actions:setCompanyUserStatus":action11 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:postMessage":action12 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:searchChatPeople":action13 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:openChat":action14 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:openDirectChat":action15 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:searchChatRecords":action16 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:sendChat":action17 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:chatSnapshot":action18 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:updateValueFormAction":action19 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:updateCloseDateFormAction":action20 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:setNextActionFormAction":action21 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:setForecastCategoryFormAction":action22 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:winFormAction":action23 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:loseFormAction":action24 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:addStakeholderFormAction":action25 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:addMilestoneFormAction":action26 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:toggleMilestoneFormAction":action27 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:logOpportunityActivityFormAction":action28 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:qualifyFormAction":action29 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:disqualifyFormAction":action30 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:nurtureFormAction":action31 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:logProspectActivityFormAction":action32 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:assignProspectFormAction":action33 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:assignProspectTaskFormAction":action34 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:convertProspectFormAction":action35 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/reports/actions:pinReportToDashboard":action36 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createContactFormAction":action37 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateContactFormAction":action38 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:deleteContactFormAction":action39 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createAddressFormAction":action40 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createTaxRegistrationFormAction":action41 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:markTaxVerifiedFormAction":action42 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createBankAccountFormAction":action43 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createDirectDebitFormAction":action44 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:cancelDirectDebitFormAction":action45 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateCreditLimitFormAction":action46 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:toggleCreditHoldFormAction":action47 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createNoteFormAction":action48 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateStatusFormAction":action49 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:deleteCustomerFormAction":action50 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:createKpi":action51 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:saveGoal":action52 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:updateKpi":action53 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:recordProgress":action54 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:closeGoal":action55 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:addPlanGoal":action56 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:closePlan":action57 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:commentOnPlan":action58 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:syncDemandAction":action59 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:restoreDeliveryAction":action60 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:releaseAction":action61 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:allocateAction":action62 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:directShipAction":action63 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:groupAction":action64 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:scanAction":action65 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:lotAction":action66 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:serialAction":action67 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shortAction":action68 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeWorkAction":action69 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:claimAction":action70 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shipFromPickAction":action71 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packageAction":action72 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:weightAction":action73 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:stageAction":action74 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:labelAction":action75 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:dispatchAction":action76 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:trackingAction":action77 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:deliverAction":action78 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadCreateAction":action79 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadScanAction":action80 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:departAction":action81 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:expectAction":action82 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveLineAction":action83 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:putAwayAction":action84 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeReceiptAction":action85 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferAction":action86 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferReceiveAction":action87 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:returnRequestAction":action88 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:authoriseReturnAction":action89 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveReturnAction":action90 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:inspectAction":action91 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:closeReturnAction":action92 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:assignEquipmentAction":action93 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packUnitAction":action94 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:saveHandlingTypeAction":action95 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:retireHandlingTypeAction":action96 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:removeHandlingTypeAction":action97 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:policyAction":action98 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:runMrpAction":action99 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:firmSuggestionAction":action100 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:dismissSuggestionAction":action101 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:setForecastAction":action102 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:deleteForecastAction":action103 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:runMrpAction":action104 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:firmPlannedOrderAction":action105 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:dismissPlannedOrderAction":action106 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:runMrpForm":action107 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:firmPlannedOrderForm":action108 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:dismissPlannedOrderForm":action109 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:previewMoveAction":action110 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:commitMoveAction":action111 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:toggleLockAction":action112 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:saveShiftAction":action113 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:deleteShiftAction":action114 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:startAction":action115 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:pauseAction":action116 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:completeAction":action117 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:loadNotices":action118 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotice":action119 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotices":action120 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:createPayrollRun":action121 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:updatePayslipDeductions":action122 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:finalisePayrollRun":action123 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:markPayrollRunPaid":action124 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:savePayrollSettings":action125 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP45":action126 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP60":action127 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:logAbsence":action128 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:requestLeave":action129 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:cancelOwnLeave":action130 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:approveLeaveRequest":action131 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:setLeaveAllowance":action132 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:rejectLeaveRequest":action133 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:createEmployee":action134 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:changeEmployeeStatus":action135 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeProfile":action136 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateOwnEmployeeDetails":action137 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeDocument":action138 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:linkEmployeeToUser":action139 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:completeEmployeeTask":action140 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeTask":action141 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeContact":action142 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeTask":action143 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:scheduleAppraisal":action144 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:completeAppraisal":action145 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getConductDesk":action146 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getMyConduct":action147 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getPlan":action148 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getCase":action149 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:conductChoices":action150 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:savePlan":action151 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addPlanReview":action152 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:commentOnPlan":action153 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:saveCase":action154 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:respondToCase":action155 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addCaseEvent":action156 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:submitExpenseClaim":action157 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:approveExpenseClaim":action158 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:rejectExpenseClaim":action159 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:scheduleOneToOne":action160 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:completeOneToOne":action161 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:listPolicies":action162 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:publishPolicy":action163 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:archivePolicy":action164 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:openPolicy":action165 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:createShift":action166 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:changeShiftStatus":action167 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyHR":action168 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyTeam":action169 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getTeamEmployee":action170 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:addPrivateNote":action171 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:updateWorkingPattern":action172 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:updateHrSettings":action173 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createAppraisalTemplate":action174 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleAppraisalTemplateActive":action175 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createOneToOneTemplate":action176 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleOneToOneTemplateActive":action177 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:getTimesheetContext":action178 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:saveTimesheet":action179 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:reviewTimesheet":action180 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:createPriceList":action181 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:savePriceEntry":action182 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveRule":action183 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:setRuleActive":action184 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:updatePriceBasis":action185 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:assignPriceList":action186 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewPriceCsv":action187 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyPriceCsv":action188 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreement":action189 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreementPrice":action190 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:removeAgreementPrice":action191 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewAgreementCsv":action192 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyAgreementCsv":action193 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProduct":action194 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProductRecord":action195 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveCategory":action196 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:retireCategory":action197 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:addStandardCategories":action198 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:savePack":action199 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveLinks":action200 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveMeasures":action201 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/actions:saveProfile":action202 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/work:loadAssignedWork":action203 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProject":action204 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeProjectStatus":action205 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editProject":action206 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProjectMember":action207 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:archiveProject":action208 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTask":action209 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeTaskStatus":action210 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editTask":action211 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:checklistItem":action212 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addDependency":action213 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMeeting":action214 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDocument":action215 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editDocument":action216 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addComment":action217 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMilestone":action218 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:publishUpdate":action219 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDecision":action220 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:decide":action221 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createRisk":action222 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:closeRisk":action223 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:requestApproval":action224 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:respondApproval":action225 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:submitRequest":action226 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:triageRequest":action227 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:logTime":action228 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:planToday":action229 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:updateInbox":action230 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveView":action231 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createPortfolio":action232 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createBaseline":action233 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setBudget":action234 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:linkWork":action235 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectActivity":action236 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createAutomation":action237 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:toggleAutomation":action238 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveProjectTemplate":action239 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:useProjectTemplate":action240 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:startTimer":action241 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:stopTimer":action242 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:projectPreference":action243 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:uploadProjectFile":action244 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:readProjectFile":action245 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProperty":action246 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProperty":action247 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:restoreDocument":action248 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTaskFromDocument":action249 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:discardTimer":action250 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:completeMilestone":action251 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:resolveComment":action252 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectWorkload":action253 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:createOrderForm":action254 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addLineForm":action255 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:removeLineForm":action256 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:confirmOrderForm":action257 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:updateOrderForm":action258 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:chooseOrderAddresses":action259 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addHoldForm":action260 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:releaseHoldForm":action261 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:approveOrderForm":action262 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:cancelOrderForm":action263 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:saveOrderHashtagsForm":action264 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:restoreCancelledOrderForm":action265 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:returnOrderToQuoteForm":action266 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:scheduleOrderDelivery":action267 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:rejectOrderApproval":action268 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:deleteOrderForm":action269 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:createQuote":action270 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:deleteQuoteForm":action271 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/settings/actions:saveCreationPolicy":action272 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getSchedule":action273 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:createBulkShifts":action274 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:setScheduledShift":action275 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:completeShiftTask":action276 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:editScheduledShift":action277 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishWeekShifts":action278 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveHoursBudget":action279 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getTeamPlan":action280 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getPersonSchedule":action281 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveWorkType":action282 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:archiveWorkType":action283 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveDemand":action284 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveBusyRule":action285 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:removeBusyRule":action286 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:fillTeamMonth":action287 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:replanCover":action288 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishMonth":action289 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveShift":action290 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveRole":action291 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveMemberRoles":action292 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:createUser":action293 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyAccess":action294 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyProfile":action295 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveManagerPolicy":action296 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveWorkspaceDetails":action297 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyBrand":action298 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/imports/actions:importCsv":action299 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveEmailAccount":action300 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:verifyEmailAccount":action301 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:sendTestEmail":action302 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:makeDefaultAccount":action303 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:setAccountActive":action304 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteEmailAccount":action305 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveSocialAccount":action306 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteSocialAccount":action307 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:checkSocialAccount":action308 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveEmailTemplate":action309 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteEmailTemplate":action310 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/logistics/actions:saveDispatchDelivery":action311 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveUserAccess":action312 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:setUserStatus":action313 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:revokeUserSessions":action314 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:issuePasswordRecovery":action315 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createManagedUser":action316 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:linkEmployeeProfile":action317 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createRole":action318 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveManagementGroup":action319 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createWarehouse":action320 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:adjustStock":action321 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:savePlanningAction":action322 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:makeFromForecastAction":action323 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:transferStock":action324 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createSiteAction":action325 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createPlaceAction":action326 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:assignSiteAction":action327 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:addLocationAction":action328 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:ensureLocationsAction":action329 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:retireLocationAction":action330 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:putOnLocationAction":action331 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:moveLocatedAction":action332 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:receiveMoveAction":action333 as (...args:never[])=>Promise<unknown>,
"src/core/approvals/actions:delegateApprovals":action334 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:loginAction":action335 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:logoutAction":action336 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:completePasswordRecovery":action337 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:changeOwnPassword":action338 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:signOutOtherSessions":action339 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:createContract":action340 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:sendContract":action341 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:signContract":action342 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:declineContract":action343 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:loadPublicContract":action344 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:checkForDuplicatesAction":action345 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:createCustomerAction":action346 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createCustomer":action347 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerStatus":action348 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteCustomer":action349 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createContact":action350 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateContact":action351 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteContact":action352 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createAddress":action353 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCommercialSettings":action354 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCreditLimit":action355 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setCreditHold":action356 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setPaymentTerm":action357 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createTaxRegistration":action358 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:markTaxRegistrationManuallyVerified":action359 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createBankAccount":action360 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:revealBankAccount":action361 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createDirectDebitMandate":action362 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:cancelDirectDebitMandate":action363 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createNote":action364 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:saveCustomerHashtags":action365 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commercial-actions:saveOrderingPreferences":action366 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setCustomerParent":action367 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:placeCustomer":action368 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:moveCustomer":action369 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setContactReportsTo":action370 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:saveCustomerTradingLink":action371 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:setInvoiceAccount":action372 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:archiveCustomerTradingLink":action373 as (...args:never[])=>Promise<unknown>,
"src/core/finance/actions:requestSalesInvoice":action374 as (...args:never[])=>Promise<unknown>,
"src/core/teams/actions:createWorkTeam":action375 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditBoard":action376 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:exportAuditReport":action377 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEcho":action378 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:postEchoNote":action379 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEchoInbox":action380 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditAccess":action381 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditOwnActivity":action382 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditAreas":action383 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:saveAutomation":action384 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:setAutomationEnabled":action385 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:deleteAutomation":action386 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:testOnPastEvent":action387 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:runNow":action388 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:logActivity":action389 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:completeActivity":action390 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/marketing-handoff:acceptMarketingHandoff":action391 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:createOpportunity":action392 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:moveOpportunityStage":action393 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityValue":action394 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityCloseDate":action395 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityForecastCategory":action396 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityNextAction":action397 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:winOpportunity":action398 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:loseOpportunity":action399 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addStakeholder":action400 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addMilestone":action401 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:toggleMilestone":action402 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:checkProspectDuplicatesAction":action403 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createProspect":action404 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:assignProspect":action405 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:setProspectLifecycleStage":action406 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:convertProspect":action407 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createIndustry":action408 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:saveProspectGrouping":action409 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProject":action410 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProjectFormAction":action411 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:saveSalesProjectAction":action412 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:saveNextActionAction":action413 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addProjectOrganisationAction":action414 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:removeProjectOrganisationAction":action415 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:makePrimaryOrganisationAction":action416 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addProjectStakeholderAction":action417 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:removeProjectStakeholderAction":action418 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:setDocumentSalesProjectAction":action419 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:deleteSalesProjectAction":action420 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:saveSurvey":action421 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:setSurveyActive":action422 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatScore":action423 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatComment":action424 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setupFinance":action425 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceDocument":action426 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:submitFinanceDocument":action427 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveApprovalPolicy":action428 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:decideFinanceApproval":action429 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPurchaseOrder":action430 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:raiseServiceCredit":action431 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postFinanceDocument":action432 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:recordGoodsReceipt":action433 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:onboardSupplier":action434 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveSupplier":action435 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:requestSupplierBankChange":action436 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:verifySupplierBank":action437 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceBank":action438 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:importBankTransactions":action439 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocateBankTransaction":action440 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPaymentRun":action441 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approvePaymentRun":action442 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createManualJournal":action443 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveManualJournal":action444 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:reverseJournal":action445 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setFinancePeriodState":action446 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceBudget":action447 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceAsset":action448 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postAssetDepreciation":action449 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:completeCloseTask":action450 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceContract":action451 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceScenario":action452 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:receiptForm":action453 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:journalForm":action454 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:statementForm":action455 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocationForm":action456 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:paymentRunForm":action457 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:policyForm":action458 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:scenarioForm":action459 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:uploadFinanceAttachment":action460 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateSalesInvoice":action461 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateInvoiceAdjustment":action462 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:voidFinanceDraft":action463 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceHome":action464 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:listFinanceDocuments":action465 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceDocument":action466 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceWorkspace":action467 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:financeChoices":action468 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getBudgetPositions":action469 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getInvoiceCashForecast":action470 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinancialReport":action471 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceCustomerContribution":action472 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:searchFinance":action473 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceAttachment":action474 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getSalesFinanceProjection":action475 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getReceivingWarehouses":action476 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:createProductionOrder":action477 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:markOrderReady":action478 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:releaseOrder":action479 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:closeOrder":action480 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:startWorkOrder":action481 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:pauseWorkOrder":action482 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:completeWorkOrder":action483 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:listForecasts":action484 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:setForecast":action485 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:deleteForecast":action486 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:runMrp":action487 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:firmSuggestion":action488 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:dismissSuggestion":action489 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:latestPlan":action490 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:loadPlant":action491 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveWorkCentre":action492 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveMachine":action493 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:retirePlantRecord":action494 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:schedulePreview":action495 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:rescheduleWorkOrder":action496 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:setWorkOrderLock":action497 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:listShifts":action498 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:saveShift":action499 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:deleteShift":action500 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createCampaign":action501 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updateCampaign":action502 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProfile":action503 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:recordPermission":action504 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:suppressProfile":action505 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createAudience":action506 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:previewAudience":action507 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createContent":action508 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:approveContent":action509 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createMessage":action510 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:lockSend":action511 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:cancelSend":action512 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:ingestEvent":action513 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourney":action514 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:publishJourney":action515 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:reviseJourney":action516 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProgram":action517 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createExperiment":action518 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:leadFeedback":action519 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:processJourneySteps":action520 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:saveMarketingPlan":action521 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addPlanActivity":action522 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updatePlanActivity":action523 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addBudgetLine":action524 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:submitBudgetToFinance":action525 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourneyMap":action526 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyStage":action527 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyTouch":action528 as (...args:never[])=>Promise<unknown>,
"src/modules/people/services/finance-expenses:getApprovedExpenseSource":action529 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createPlan":action530 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveCell":action531 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addMeasure":action532 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAssumption":action533 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDriver":action534 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addLink":action535 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createScenario":action536 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:promoteScenario":action537 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:submitPlan":action538 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:approvePlan":action539 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:lockPlan":action540 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addGoal":action541 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addInitiative":action542 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createProjectForInitiative":action543 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAction":action544 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeAction":action545 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addRisk":action546 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDependency":action547 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDecision":action548 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addComment":action549 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addUpdate":action550 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeReview":action551 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addReview":action552 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:distributeTargets":action553 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:importGrid":action554 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:sharePlan":action555 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:unsharePlan":action556 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:setPlanAudience":action557 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addNote":action558 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveGoalProgress":action559 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:savePlanBrief":action560 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:listProductionPlans":action561 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getPlanOptions":action562 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getProductionPlan":action563 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:createProductionPlan":action564 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:addProductionPlanLine":action565 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getAssignedPlanningWork":action566 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/queries:getPlanningCoverage":action567 as (...args:never[])=>Promise<unknown>,
"src/modules/products/services/make:saveProductRecipe":action568 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createSpecification":action569 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:setSpecificationStatus":action570 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createControlPoint":action571 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:executeInspection":action572 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:releaseHold":action573 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:reportNcr":action574 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrInvestigation":action575 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:addNcrAction":action576 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrAction":action577 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:closeNcr":action578 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSubstance":action579 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addSafetyDataSheet":action580 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCoshhAssessment":action581 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveSubstance":action582 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCompetence":action583 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSafetyDocument":action584 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:acknowledgeDocument":action585 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveAudit":action586 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addAuditFinding":action587 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveAudit":action588 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveChange":action589 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:advanceChange":action590 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:linkSafetyRecord":action591 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveSafetyProfile":action592 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRiskMatrix":action593 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createRisk":action594 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addControl":action595 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:rateAssessment":action596 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:approveAssessment":action597 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviseAssessment":action598 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:requestRiskReview":action599 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reportIncident":action600 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveImmediateControl":action601 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:openInvestigation":action602 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addCause":action603 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRootCause":action604 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviewRiddor":action605 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createSafetyAction":action606 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:advanceAction":action607 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:verifyAction":action608 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveWorkplaceRecord":action609 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createPermit":action610 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:advancePermit":action611 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:extendPermit":action612 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createIsolation":action613 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:applyIsolationLock":action614 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:verifyIsolation":action615 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:clearIsolation":action616 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:removeIsolationLock":action617 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:placeSafetyHold":action618 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:updateReturnToService":action619 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:releaseSafetyHold":action620 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:overrideSafetyHold":action621 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:saveStatutoryCheck":action622 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:completeInspection":action623 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createInspection":action624 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/address-actions:createSalesAddress":action625 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/catalogue-actions:createSalesCatalogueProduct":action626 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:sendQuote":action627 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:changeQuoteStatus":action628 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:deleteQuote":action629 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:duplicateDocument":action630 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:saveQuoteTemplate":action631 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:createOrderFromQuote":action632 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:linkCommercialProject":action633 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:openCallOffOrder":action634 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:raiseCallOff":action635 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:invoiceCallOffDelivery":action636 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:deliverAndInvoiceCallOff":action637 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/csv-import:importSalescsv":action638 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/documents:saveDocument":action639 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:saveInvoiceTemplate":action640 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:retireInvoiceTemplate":action641 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:attachCustomerInvoiceTemplate":action642 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:detachCustomerInvoiceTemplate":action643 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:createDraftOrder":action644 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addOrderLine":action645 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:removeOrderLine":action646 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:updateDraftOrderFields":action647 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:confirmOrder":action648 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:decideApproval":action649 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendLineQuantity":action650 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:overrideLinePrice":action651 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendRequestedDate":action652 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelOrder":action653 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:deleteOrder":action654 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelLineRemaining":action655 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addHold":action656 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:releaseHold":action657 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:restoreCancelledOrder":action658 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:returnOrderToQuote":action659 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:saveOrderHashtags":action660 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:saveSalesView":action661 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:archiveSalesView":action662 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createCase":action663 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateCase":action664 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:assignCase":action665 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:transitionCase":action666 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addCaseEntry":action667 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createDepartmentTicket":action668 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateDepartmentTicket":action669 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createQueue":action670 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addQueueMember":action671 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:linkCaseRecord":action672 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:creditChoices":action673 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:askFinanceForCredit":action674 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getCaseOwners":action675 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getDepartmentWork":action676 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readAvailability":action677 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readOrderChain":action678 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/export:inventoryExportRows":action679 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:createTeam":action680 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:renameTeam":action681 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:addMember":action682 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMember":action683 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveTask":action684 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:setTaskStatus":action685 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeTask":action686 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveCover":action687 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeCover":action688 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveHandover":action689 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:savePlace":action690 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveMoment":action691 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMoment":action692 as (...args:never[])=>Promise<unknown>
};
