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
import {createSalesProjectAction as action29} from "@/app/(app)/crm/projects/new/actions";
import {qualifyFormAction as action30} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {disqualifyFormAction as action31} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {nurtureFormAction as action32} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {logProspectActivityFormAction as action33} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {assignProspectFormAction as action34} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {assignProspectTaskFormAction as action35} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {convertProspectFormAction as action36} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {pinReportToDashboard as action37} from "@/app/(app)/crm/reports/actions";
import {createContactFormAction as action38} from "@/app/(app)/customers/[partyId]/actions";
import {updateContactFormAction as action39} from "@/app/(app)/customers/[partyId]/actions";
import {deleteContactFormAction as action40} from "@/app/(app)/customers/[partyId]/actions";
import {createAddressFormAction as action41} from "@/app/(app)/customers/[partyId]/actions";
import {createTaxRegistrationFormAction as action42} from "@/app/(app)/customers/[partyId]/actions";
import {markTaxVerifiedFormAction as action43} from "@/app/(app)/customers/[partyId]/actions";
import {createBankAccountFormAction as action44} from "@/app/(app)/customers/[partyId]/actions";
import {createDirectDebitFormAction as action45} from "@/app/(app)/customers/[partyId]/actions";
import {cancelDirectDebitFormAction as action46} from "@/app/(app)/customers/[partyId]/actions";
import {updateCreditLimitFormAction as action47} from "@/app/(app)/customers/[partyId]/actions";
import {toggleCreditHoldFormAction as action48} from "@/app/(app)/customers/[partyId]/actions";
import {createNoteFormAction as action49} from "@/app/(app)/customers/[partyId]/actions";
import {updateStatusFormAction as action50} from "@/app/(app)/customers/[partyId]/actions";
import {deleteCustomerFormAction as action51} from "@/app/(app)/customers/[partyId]/actions";
import {createKpi as action52} from "@/app/(app)/kpis/actions";
import {saveGoal as action53} from "@/app/(app)/kpis/actions";
import {updateKpi as action54} from "@/app/(app)/kpis/actions";
import {recordProgress as action55} from "@/app/(app)/kpis/actions";
import {closeGoal as action56} from "@/app/(app)/kpis/actions";
import {addPlanGoal as action57} from "@/app/(app)/kpis/actions";
import {closePlan as action58} from "@/app/(app)/kpis/actions";
import {commentOnPlan as action59} from "@/app/(app)/kpis/actions";
import {syncDemandAction as action60} from "@/app/(app)/logistics/actions";
import {restoreDeliveryAction as action61} from "@/app/(app)/logistics/actions";
import {releaseAction as action62} from "@/app/(app)/logistics/actions";
import {allocateAction as action63} from "@/app/(app)/logistics/actions";
import {directShipAction as action64} from "@/app/(app)/logistics/actions";
import {groupAction as action65} from "@/app/(app)/logistics/actions";
import {scanAction as action66} from "@/app/(app)/logistics/actions";
import {lotAction as action67} from "@/app/(app)/logistics/actions";
import {serialAction as action68} from "@/app/(app)/logistics/actions";
import {shortAction as action69} from "@/app/(app)/logistics/actions";
import {completeWorkAction as action70} from "@/app/(app)/logistics/actions";
import {claimAction as action71} from "@/app/(app)/logistics/actions";
import {shipFromPickAction as action72} from "@/app/(app)/logistics/actions";
import {packageAction as action73} from "@/app/(app)/logistics/actions";
import {weightAction as action74} from "@/app/(app)/logistics/actions";
import {stageAction as action75} from "@/app/(app)/logistics/actions";
import {labelAction as action76} from "@/app/(app)/logistics/actions";
import {dispatchAction as action77} from "@/app/(app)/logistics/actions";
import {trackingAction as action78} from "@/app/(app)/logistics/actions";
import {deliverAction as action79} from "@/app/(app)/logistics/actions";
import {loadCreateAction as action80} from "@/app/(app)/logistics/actions";
import {loadScanAction as action81} from "@/app/(app)/logistics/actions";
import {departAction as action82} from "@/app/(app)/logistics/actions";
import {expectAction as action83} from "@/app/(app)/logistics/actions";
import {receiveLineAction as action84} from "@/app/(app)/logistics/actions";
import {putAwayAction as action85} from "@/app/(app)/logistics/actions";
import {completeReceiptAction as action86} from "@/app/(app)/logistics/actions";
import {transferAction as action87} from "@/app/(app)/logistics/actions";
import {transferReceiveAction as action88} from "@/app/(app)/logistics/actions";
import {returnRequestAction as action89} from "@/app/(app)/logistics/actions";
import {authoriseReturnAction as action90} from "@/app/(app)/logistics/actions";
import {receiveReturnAction as action91} from "@/app/(app)/logistics/actions";
import {inspectAction as action92} from "@/app/(app)/logistics/actions";
import {closeReturnAction as action93} from "@/app/(app)/logistics/actions";
import {assignEquipmentAction as action94} from "@/app/(app)/logistics/actions";
import {packUnitAction as action95} from "@/app/(app)/logistics/actions";
import {saveHandlingTypeAction as action96} from "@/app/(app)/logistics/actions";
import {retireHandlingTypeAction as action97} from "@/app/(app)/logistics/actions";
import {removeHandlingTypeAction as action98} from "@/app/(app)/logistics/actions";
import {policyAction as action99} from "@/app/(app)/logistics/actions";
import {runMrpAction as action100} from "@/app/(app)/manufacturing/plan/actions";
import {firmSuggestionAction as action101} from "@/app/(app)/manufacturing/plan/actions";
import {dismissSuggestionAction as action102} from "@/app/(app)/manufacturing/plan/actions";
import {setForecastAction as action103} from "@/app/(app)/manufacturing/plan/actions";
import {deleteForecastAction as action104} from "@/app/(app)/manufacturing/plan/actions";
import {runMrpAction as action105} from "@/app/(app)/manufacturing/planning/actions";
import {firmPlannedOrderAction as action106} from "@/app/(app)/manufacturing/planning/actions";
import {dismissPlannedOrderAction as action107} from "@/app/(app)/manufacturing/planning/actions";
import {runMrpForm as action108} from "@/app/(app)/manufacturing/planning/form-actions";
import {firmPlannedOrderForm as action109} from "@/app/(app)/manufacturing/planning/form-actions";
import {dismissPlannedOrderForm as action110} from "@/app/(app)/manufacturing/planning/form-actions";
import {previewMoveAction as action111} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {commitMoveAction as action112} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {toggleLockAction as action113} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {saveShiftAction as action114} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {deleteShiftAction as action115} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {startAction as action116} from "@/app/(app)/manufacturing/shop-floor/actions";
import {pauseAction as action117} from "@/app/(app)/manufacturing/shop-floor/actions";
import {completeAction as action118} from "@/app/(app)/manufacturing/shop-floor/actions";
import {loadNotices as action119} from "@/app/(app)/notices/actions";
import {clearNotice as action120} from "@/app/(app)/notices/actions";
import {clearNotices as action121} from "@/app/(app)/notices/actions";
import {createPayrollRun as action122} from "@/app/(app)/payroll/actions";
import {updatePayslipDeductions as action123} from "@/app/(app)/payroll/actions";
import {finalisePayrollRun as action124} from "@/app/(app)/payroll/actions";
import {markPayrollRunPaid as action125} from "@/app/(app)/payroll/actions";
import {savePayrollSettings as action126} from "@/app/(app)/payroll/actions";
import {issueP45 as action127} from "@/app/(app)/payroll/actions";
import {issueP60 as action128} from "@/app/(app)/payroll/actions";
import {logAbsence as action129} from "@/app/(app)/people/absence/actions";
import {requestLeave as action130} from "@/app/(app)/people/absence/actions";
import {cancelOwnLeave as action131} from "@/app/(app)/people/absence/actions";
import {approveLeaveRequest as action132} from "@/app/(app)/people/absence/actions";
import {setLeaveAllowance as action133} from "@/app/(app)/people/absence/actions";
import {rejectLeaveRequest as action134} from "@/app/(app)/people/absence/actions";
import {createEmployee as action135} from "@/app/(app)/people/actions";
import {changeEmployeeStatus as action136} from "@/app/(app)/people/actions";
import {updateEmployeeProfile as action137} from "@/app/(app)/people/actions";
import {updateOwnEmployeeDetails as action138} from "@/app/(app)/people/actions";
import {addEmployeeDocument as action139} from "@/app/(app)/people/actions";
import {linkEmployeeToUser as action140} from "@/app/(app)/people/actions";
import {completeEmployeeTask as action141} from "@/app/(app)/people/actions";
import {addEmployeeTask as action142} from "@/app/(app)/people/actions";
import {updateEmployeeContact as action143} from "@/app/(app)/people/actions";
import {updateEmployeeTask as action144} from "@/app/(app)/people/actions";
import {scheduleAppraisal as action145} from "@/app/(app)/people/appraisals/actions";
import {completeAppraisal as action146} from "@/app/(app)/people/appraisals/actions";
import {getConductDesk as action147} from "@/app/(app)/people/conduct/actions";
import {getMyConduct as action148} from "@/app/(app)/people/conduct/actions";
import {getPlan as action149} from "@/app/(app)/people/conduct/actions";
import {getCase as action150} from "@/app/(app)/people/conduct/actions";
import {conductChoices as action151} from "@/app/(app)/people/conduct/actions";
import {savePlan as action152} from "@/app/(app)/people/conduct/actions";
import {addPlanReview as action153} from "@/app/(app)/people/conduct/actions";
import {commentOnPlan as action154} from "@/app/(app)/people/conduct/actions";
import {saveCase as action155} from "@/app/(app)/people/conduct/actions";
import {respondToCase as action156} from "@/app/(app)/people/conduct/actions";
import {addCaseEvent as action157} from "@/app/(app)/people/conduct/actions";
import {submitExpenseClaim as action158} from "@/app/(app)/people/expenses/actions";
import {approveExpenseClaim as action159} from "@/app/(app)/people/expenses/actions";
import {rejectExpenseClaim as action160} from "@/app/(app)/people/expenses/actions";
import {scheduleOneToOne as action161} from "@/app/(app)/people/one-to-ones/actions";
import {completeOneToOne as action162} from "@/app/(app)/people/one-to-ones/actions";
import {listPolicies as action163} from "@/app/(app)/people/policies/actions";
import {publishPolicy as action164} from "@/app/(app)/people/policies/actions";
import {archivePolicy as action165} from "@/app/(app)/people/policies/actions";
import {openPolicy as action166} from "@/app/(app)/people/policies/actions";
import {createShift as action167} from "@/app/(app)/people/rotas/actions";
import {changeShiftStatus as action168} from "@/app/(app)/people/rotas/actions";
import {getMyHR as action169} from "@/app/(app)/people/self-service";
import {getMyTeam as action170} from "@/app/(app)/people/self-service";
import {getTeamEmployee as action171} from "@/app/(app)/people/self-service";
import {addPrivateNote as action172} from "@/app/(app)/people/self-service";
import {updateWorkingPattern as action173} from "@/app/(app)/people/self-service";
import {updateHrSettings as action174} from "@/app/(app)/people/settings/actions";
import {createAppraisalTemplate as action175} from "@/app/(app)/people/settings/actions";
import {toggleAppraisalTemplateActive as action176} from "@/app/(app)/people/settings/actions";
import {createOneToOneTemplate as action177} from "@/app/(app)/people/settings/actions";
import {toggleOneToOneTemplateActive as action178} from "@/app/(app)/people/settings/actions";
import {getTimesheetContext as action179} from "@/app/(app)/people/timesheets/actions";
import {saveTimesheet as action180} from "@/app/(app)/people/timesheets/actions";
import {reviewTimesheet as action181} from "@/app/(app)/people/timesheets/actions";
import {createPriceList as action182} from "@/app/(app)/pricing/actions";
import {savePriceEntry as action183} from "@/app/(app)/pricing/actions";
import {saveRule as action184} from "@/app/(app)/pricing/actions";
import {setRuleActive as action185} from "@/app/(app)/pricing/actions";
import {updatePriceBasis as action186} from "@/app/(app)/pricing/actions";
import {assignPriceList as action187} from "@/app/(app)/pricing/actions";
import {previewPriceCsv as action188} from "@/app/(app)/pricing/actions";
import {applyPriceCsv as action189} from "@/app/(app)/pricing/actions";
import {saveAgreement as action190} from "@/app/(app)/pricing/actions";
import {saveAgreementPrice as action191} from "@/app/(app)/pricing/actions";
import {removeAgreementPrice as action192} from "@/app/(app)/pricing/actions";
import {previewAgreementCsv as action193} from "@/app/(app)/pricing/actions";
import {applyAgreementCsv as action194} from "@/app/(app)/pricing/actions";
import {saveProduct as action195} from "@/app/(app)/products/actions";
import {saveProductRecord as action196} from "@/app/(app)/products/actions";
import {saveCategory as action197} from "@/app/(app)/products/actions";
import {retireCategory as action198} from "@/app/(app)/products/actions";
import {addStandardCategories as action199} from "@/app/(app)/products/actions";
import {savePack as action200} from "@/app/(app)/products/actions";
import {saveLinks as action201} from "@/app/(app)/products/actions";
import {saveMeasures as action202} from "@/app/(app)/products/actions";
import {saveProfile as action203} from "@/app/(app)/profile/actions";
import {loadAssignedWork as action204} from "@/app/(app)/profile/work";
import {createProject as action205} from "@/app/(app)/projects/actions";
import {changeProjectStatus as action206} from "@/app/(app)/projects/actions";
import {editProject as action207} from "@/app/(app)/projects/actions";
import {setProjectMember as action208} from "@/app/(app)/projects/actions";
import {archiveProject as action209} from "@/app/(app)/projects/actions";
import {createTask as action210} from "@/app/(app)/projects/actions";
import {changeTaskStatus as action211} from "@/app/(app)/projects/actions";
import {editTask as action212} from "@/app/(app)/projects/actions";
import {checklistItem as action213} from "@/app/(app)/projects/actions";
import {addDependency as action214} from "@/app/(app)/projects/actions";
import {createMeeting as action215} from "@/app/(app)/projects/actions";
import {createDocument as action216} from "@/app/(app)/projects/actions";
import {editDocument as action217} from "@/app/(app)/projects/actions";
import {addComment as action218} from "@/app/(app)/projects/actions";
import {createMilestone as action219} from "@/app/(app)/projects/actions";
import {publishUpdate as action220} from "@/app/(app)/projects/actions";
import {createDecision as action221} from "@/app/(app)/projects/actions";
import {decide as action222} from "@/app/(app)/projects/actions";
import {createRisk as action223} from "@/app/(app)/projects/actions";
import {closeRisk as action224} from "@/app/(app)/projects/actions";
import {requestApproval as action225} from "@/app/(app)/projects/actions";
import {respondApproval as action226} from "@/app/(app)/projects/actions";
import {submitRequest as action227} from "@/app/(app)/projects/actions";
import {triageRequest as action228} from "@/app/(app)/projects/actions";
import {logTime as action229} from "@/app/(app)/projects/actions";
import {planToday as action230} from "@/app/(app)/projects/actions";
import {updateInbox as action231} from "@/app/(app)/projects/actions";
import {saveView as action232} from "@/app/(app)/projects/actions";
import {createPortfolio as action233} from "@/app/(app)/projects/actions";
import {createBaseline as action234} from "@/app/(app)/projects/actions";
import {setBudget as action235} from "@/app/(app)/projects/actions";
import {linkWork as action236} from "@/app/(app)/projects/actions";
import {getProjectActivity as action237} from "@/app/(app)/projects/actions";
import {createAutomation as action238} from "@/app/(app)/projects/actions";
import {toggleAutomation as action239} from "@/app/(app)/projects/actions";
import {saveProjectTemplate as action240} from "@/app/(app)/projects/actions";
import {useProjectTemplate as action241} from "@/app/(app)/projects/actions";
import {startTimer as action242} from "@/app/(app)/projects/actions";
import {stopTimer as action243} from "@/app/(app)/projects/actions";
import {projectPreference as action244} from "@/app/(app)/projects/actions";
import {uploadProjectFile as action245} from "@/app/(app)/projects/actions";
import {readProjectFile as action246} from "@/app/(app)/projects/actions";
import {createProperty as action247} from "@/app/(app)/projects/actions";
import {setProperty as action248} from "@/app/(app)/projects/actions";
import {restoreDocument as action249} from "@/app/(app)/projects/actions";
import {createTaskFromDocument as action250} from "@/app/(app)/projects/actions";
import {discardTimer as action251} from "@/app/(app)/projects/actions";
import {completeMilestone as action252} from "@/app/(app)/projects/actions";
import {resolveComment as action253} from "@/app/(app)/projects/actions";
import {getProjectWorkload as action254} from "@/app/(app)/projects/actions";
import {createOrderForm as action255} from "@/app/(app)/sales/orders/actions";
import {addLineForm as action256} from "@/app/(app)/sales/orders/actions";
import {removeLineForm as action257} from "@/app/(app)/sales/orders/actions";
import {confirmOrderForm as action258} from "@/app/(app)/sales/orders/actions";
import {updateOrderForm as action259} from "@/app/(app)/sales/orders/actions";
import {chooseOrderAddresses as action260} from "@/app/(app)/sales/orders/actions";
import {addHoldForm as action261} from "@/app/(app)/sales/orders/actions";
import {releaseHoldForm as action262} from "@/app/(app)/sales/orders/actions";
import {approveOrderForm as action263} from "@/app/(app)/sales/orders/actions";
import {cancelOrderForm as action264} from "@/app/(app)/sales/orders/actions";
import {saveOrderHashtagsForm as action265} from "@/app/(app)/sales/orders/actions";
import {restoreCancelledOrderForm as action266} from "@/app/(app)/sales/orders/actions";
import {returnOrderToQuoteForm as action267} from "@/app/(app)/sales/orders/actions";
import {scheduleOrderDelivery as action268} from "@/app/(app)/sales/orders/actions";
import {rejectOrderApproval as action269} from "@/app/(app)/sales/orders/actions";
import {deleteOrderForm as action270} from "@/app/(app)/sales/orders/actions";
import {createQuote as action271} from "@/app/(app)/sales/quotes/actions";
import {deleteQuoteForm as action272} from "@/app/(app)/sales/quotes/actions";
import {saveCreationPolicy as action273} from "@/app/(app)/sales/settings/actions";
import {getSchedule as action274} from "@/app/(app)/scheduling/actions";
import {createBulkShifts as action275} from "@/app/(app)/scheduling/actions";
import {setScheduledShift as action276} from "@/app/(app)/scheduling/actions";
import {completeShiftTask as action277} from "@/app/(app)/scheduling/actions";
import {editScheduledShift as action278} from "@/app/(app)/scheduling/actions";
import {publishWeekShifts as action279} from "@/app/(app)/scheduling/actions";
import {saveHoursBudget as action280} from "@/app/(app)/scheduling/actions";
import {getTeamPlan as action281} from "@/app/(app)/scheduling/actions";
import {getPersonSchedule as action282} from "@/app/(app)/scheduling/actions";
import {saveWorkType as action283} from "@/app/(app)/scheduling/actions";
import {archiveWorkType as action284} from "@/app/(app)/scheduling/actions";
import {saveDemand as action285} from "@/app/(app)/scheduling/actions";
import {saveBusyRule as action286} from "@/app/(app)/scheduling/actions";
import {removeBusyRule as action287} from "@/app/(app)/scheduling/actions";
import {fillTeamMonth as action288} from "@/app/(app)/scheduling/actions";
import {replanCover as action289} from "@/app/(app)/scheduling/actions";
import {publishMonth as action290} from "@/app/(app)/scheduling/actions";
import {saveShift as action291} from "@/app/(app)/scheduling/actions";
import {saveRole as action292} from "@/app/(app)/settings/actions";
import {saveMemberRoles as action293} from "@/app/(app)/settings/actions";
import {createUser as action294} from "@/app/(app)/settings/actions";
import {saveCompanyAccess as action295} from "@/app/(app)/settings/actions";
import {saveCompanyProfile as action296} from "@/app/(app)/settings/actions";
import {saveManagerPolicy as action297} from "@/app/(app)/settings/actions";
import {saveWorkspaceDetails as action298} from "@/app/(app)/settings/actions";
import {saveCompanyBrand as action299} from "@/app/(app)/settings/actions";
import {importCsv as action300} from "@/app/(app)/settings/imports/actions";
import {saveEmailAccount as action301} from "@/app/(app)/settings/it/actions";
import {verifyEmailAccount as action302} from "@/app/(app)/settings/it/actions";
import {sendTestEmail as action303} from "@/app/(app)/settings/it/actions";
import {makeDefaultAccount as action304} from "@/app/(app)/settings/it/actions";
import {setAccountActive as action305} from "@/app/(app)/settings/it/actions";
import {deleteEmailAccount as action306} from "@/app/(app)/settings/it/actions";
import {saveSocialAccount as action307} from "@/app/(app)/settings/it/actions";
import {deleteSocialAccount as action308} from "@/app/(app)/settings/it/actions";
import {checkSocialAccount as action309} from "@/app/(app)/settings/it/actions";
import {saveEmailTemplate as action310} from "@/app/(app)/settings/it/actions";
import {deleteEmailTemplate as action311} from "@/app/(app)/settings/it/actions";
import {saveDispatchDelivery as action312} from "@/app/(app)/settings/logistics/actions";
import {saveUserAccess as action313} from "@/app/(app)/settings/user-actions";
import {setUserStatus as action314} from "@/app/(app)/settings/user-actions";
import {revokeUserSessions as action315} from "@/app/(app)/settings/user-actions";
import {issuePasswordRecovery as action316} from "@/app/(app)/settings/user-actions";
import {createManagedUser as action317} from "@/app/(app)/settings/user-actions";
import {linkEmployeeProfile as action318} from "@/app/(app)/settings/user-actions";
import {createRole as action319} from "@/app/(app)/settings/user-actions";
import {saveManagementGroup as action320} from "@/app/(app)/settings/user-actions";
import {createWarehouse as action321} from "@/app/(app)/stock/actions";
import {adjustStock as action322} from "@/app/(app)/stock/actions";
import {savePlanningAction as action323} from "@/app/(app)/stock/actions";
import {makeFromForecastAction as action324} from "@/app/(app)/stock/actions";
import {transferStock as action325} from "@/app/(app)/stock/actions";
import {createSiteAction as action326} from "@/app/(app)/stock/actions";
import {createPlaceAction as action327} from "@/app/(app)/stock/actions";
import {assignSiteAction as action328} from "@/app/(app)/stock/actions";
import {addLocationAction as action329} from "@/app/(app)/stock/actions";
import {ensureLocationsAction as action330} from "@/app/(app)/stock/actions";
import {retireLocationAction as action331} from "@/app/(app)/stock/actions";
import {putOnLocationAction as action332} from "@/app/(app)/stock/actions";
import {moveLocatedAction as action333} from "@/app/(app)/stock/actions";
import {receiveMoveAction as action334} from "@/app/(app)/stock/actions";
import {delegateApprovals as action335} from "@/core/approvals/actions";
import {loginAction as action336} from "@/core/auth/actions";
import {logoutAction as action337} from "@/core/auth/actions";
import {completePasswordRecovery as action338} from "@/core/auth/security-actions";
import {changeOwnPassword as action339} from "@/core/auth/security-actions";
import {signOutOtherSessions as action340} from "@/core/auth/security-actions";
import {createContract as action341} from "@/core/contracts/actions";
import {sendContract as action342} from "@/core/contracts/actions";
import {signContract as action343} from "@/core/contracts/actions";
import {declineContract as action344} from "@/core/contracts/actions";
import {loadPublicContract as action345} from "@/core/contracts/actions";
import {checkForDuplicatesAction as action346} from "@/core/customers/actions";
import {createCustomerAction as action347} from "@/core/customers/actions";
import {createCustomer as action348} from "@/core/customers/commands";
import {updateCustomerStatus as action349} from "@/core/customers/commands";
import {deleteCustomer as action350} from "@/core/customers/commands";
import {createContact as action351} from "@/core/customers/commands";
import {updateContact as action352} from "@/core/customers/commands";
import {deleteContact as action353} from "@/core/customers/commands";
import {createAddress as action354} from "@/core/customers/commands";
import {updateCommercialSettings as action355} from "@/core/customers/commands";
import {updateCreditLimit as action356} from "@/core/customers/commands";
import {setCreditHold as action357} from "@/core/customers/commands";
import {setPaymentTerm as action358} from "@/core/customers/commands";
import {createTaxRegistration as action359} from "@/core/customers/commands";
import {markTaxRegistrationManuallyVerified as action360} from "@/core/customers/commands";
import {createBankAccount as action361} from "@/core/customers/commands";
import {revealBankAccount as action362} from "@/core/customers/commands";
import {createDirectDebitMandate as action363} from "@/core/customers/commands";
import {cancelDirectDebitMandate as action364} from "@/core/customers/commands";
import {createNote as action365} from "@/core/customers/commands";
import {saveCustomerHashtags as action366} from "@/core/customers/commands";
import {saveOrderingPreferences as action367} from "@/core/customers/commercial-actions";
import {setCustomerParent as action368} from "@/core/customers/hierarchy-actions";
import {placeCustomer as action369} from "@/core/customers/hierarchy-actions";
import {moveCustomer as action370} from "@/core/customers/hierarchy-actions";
import {setContactReportsTo as action371} from "@/core/customers/hierarchy-actions";
import {saveCustomerTradingLink as action372} from "@/core/customers/trading-actions";
import {setInvoiceAccount as action373} from "@/core/customers/trading-actions";
import {archiveCustomerTradingLink as action374} from "@/core/customers/trading-actions";
import {requestSalesInvoice as action375} from "@/core/finance/actions";
import {createWorkTeam as action376} from "@/core/teams/actions";
import {loadAuditBoard as action377} from "@/modules/audit/services/actions";
import {exportAuditReport as action378} from "@/modules/audit/services/actions";
import {loadEcho as action379} from "@/modules/audit/services/actions";
import {postEchoNote as action380} from "@/modules/audit/services/actions";
import {loadEchoInbox as action381} from "@/modules/audit/services/actions";
import {loadAuditAccess as action382} from "@/modules/audit/services/actions";
import {saveAuditOwnActivity as action383} from "@/modules/audit/services/actions";
import {saveAuditAreas as action384} from "@/modules/audit/services/actions";
import {saveAutomation as action385} from "@/modules/automations/services/actions";
import {setAutomationEnabled as action386} from "@/modules/automations/services/actions";
import {deleteAutomation as action387} from "@/modules/automations/services/actions";
import {testOnPastEvent as action388} from "@/modules/automations/services/actions";
import {runNow as action389} from "@/modules/automations/services/actions";
import {logActivity as action390} from "@/modules/crm/services/activities";
import {completeActivity as action391} from "@/modules/crm/services/activities";
import {acceptMarketingHandoff as action392} from "@/modules/crm/services/marketing-handoff";
import {createOpportunity as action393} from "@/modules/crm/services/opportunities";
import {moveOpportunityStage as action394} from "@/modules/crm/services/opportunities";
import {updateOpportunityValue as action395} from "@/modules/crm/services/opportunities";
import {updateOpportunityCloseDate as action396} from "@/modules/crm/services/opportunities";
import {setOpportunityForecastCategory as action397} from "@/modules/crm/services/opportunities";
import {setOpportunityNextAction as action398} from "@/modules/crm/services/opportunities";
import {winOpportunity as action399} from "@/modules/crm/services/opportunities";
import {loseOpportunity as action400} from "@/modules/crm/services/opportunities";
import {addStakeholder as action401} from "@/modules/crm/services/opportunities";
import {addMilestone as action402} from "@/modules/crm/services/opportunities";
import {toggleMilestone as action403} from "@/modules/crm/services/opportunities";
import {checkProspectDuplicatesAction as action404} from "@/modules/crm/services/prospects";
import {createProspect as action405} from "@/modules/crm/services/prospects";
import {assignProspect as action406} from "@/modules/crm/services/prospects";
import {setProspectLifecycleStage as action407} from "@/modules/crm/services/prospects";
import {convertProspect as action408} from "@/modules/crm/services/prospects";
import {createIndustry as action409} from "@/modules/crm/services/prospects";
import {saveProspectGrouping as action410} from "@/modules/crm/services/prospects";
import {createSalesProject as action411} from "@/modules/crm/services/sales-projects-commands";
import {updateSalesProject as action412} from "@/modules/crm/services/sales-projects-commands";
import {addOrganisationToProject as action413} from "@/modules/crm/services/sales-projects-commands";
import {addStakeholderToProject as action414} from "@/modules/crm/services/sales-projects-commands";
import {linkQuoteToProject as action415} from "@/modules/crm/services/sales-projects-commands";
import {linkOrderToProject as action416} from "@/modules/crm/services/sales-projects-commands";
import {deleteSalesProject as action417} from "@/modules/crm/services/sales-projects-commands";
import {saveSurvey as action418} from "@/modules/csat/services/actions";
import {setSurveyActive as action419} from "@/modules/csat/services/actions";
import {recordCsatScore as action420} from "@/modules/csat/services/actions";
import {recordCsatComment as action421} from "@/modules/csat/services/actions";
import {setupFinance as action422} from "@/modules/finance/services/commands";
import {createFinanceDocument as action423} from "@/modules/finance/services/commands";
import {submitFinanceDocument as action424} from "@/modules/finance/services/commands";
import {saveApprovalPolicy as action425} from "@/modules/finance/services/commands";
import {decideFinanceApproval as action426} from "@/modules/finance/services/commands";
import {createPurchaseOrder as action427} from "@/modules/finance/services/commands";
import {raiseServiceCredit as action428} from "@/modules/finance/services/commands";
import {postFinanceDocument as action429} from "@/modules/finance/services/commands";
import {recordGoodsReceipt as action430} from "@/modules/finance/services/commands";
import {onboardSupplier as action431} from "@/modules/finance/services/commands";
import {approveSupplier as action432} from "@/modules/finance/services/commands";
import {requestSupplierBankChange as action433} from "@/modules/finance/services/commands";
import {verifySupplierBank as action434} from "@/modules/finance/services/commands";
import {createFinanceBank as action435} from "@/modules/finance/services/commands";
import {importBankTransactions as action436} from "@/modules/finance/services/commands";
import {allocateBankTransaction as action437} from "@/modules/finance/services/commands";
import {createPaymentRun as action438} from "@/modules/finance/services/commands";
import {approvePaymentRun as action439} from "@/modules/finance/services/commands";
import {createManualJournal as action440} from "@/modules/finance/services/commands";
import {approveManualJournal as action441} from "@/modules/finance/services/commands";
import {reverseJournal as action442} from "@/modules/finance/services/commands";
import {setFinancePeriodState as action443} from "@/modules/finance/services/commands";
import {saveFinanceBudget as action444} from "@/modules/finance/services/commands";
import {saveFinanceAsset as action445} from "@/modules/finance/services/commands";
import {postAssetDepreciation as action446} from "@/modules/finance/services/commands";
import {completeCloseTask as action447} from "@/modules/finance/services/commands";
import {saveFinanceContract as action448} from "@/modules/finance/services/commands";
import {saveFinanceScenario as action449} from "@/modules/finance/services/commands";
import {receiptForm as action450} from "@/modules/finance/services/commands";
import {journalForm as action451} from "@/modules/finance/services/commands";
import {statementForm as action452} from "@/modules/finance/services/commands";
import {allocationForm as action453} from "@/modules/finance/services/commands";
import {paymentRunForm as action454} from "@/modules/finance/services/commands";
import {policyForm as action455} from "@/modules/finance/services/commands";
import {scenarioForm as action456} from "@/modules/finance/services/commands";
import {uploadFinanceAttachment as action457} from "@/modules/finance/services/commands";
import {generateSalesInvoice as action458} from "@/modules/finance/services/commands";
import {generateInvoiceAdjustment as action459} from "@/modules/finance/services/commands";
import {voidFinanceDraft as action460} from "@/modules/finance/services/commands";
import {getFinanceHome as action461} from "@/modules/finance/services/queries";
import {listFinanceDocuments as action462} from "@/modules/finance/services/queries";
import {getFinanceDocument as action463} from "@/modules/finance/services/queries";
import {getFinanceWorkspace as action464} from "@/modules/finance/services/queries";
import {financeChoices as action465} from "@/modules/finance/services/queries";
import {getBudgetPositions as action466} from "@/modules/finance/services/queries";
import {getInvoiceCashForecast as action467} from "@/modules/finance/services/queries";
import {getFinancialReport as action468} from "@/modules/finance/services/queries";
import {getFinanceCustomerContribution as action469} from "@/modules/finance/services/queries";
import {searchFinance as action470} from "@/modules/finance/services/queries";
import {getFinanceAttachment as action471} from "@/modules/finance/services/queries";
import {getSalesFinanceProjection as action472} from "@/modules/finance/services/queries";
import {getReceivingWarehouses as action473} from "@/modules/finance/services/queries";
import {createProductionOrder as action474} from "@/modules/manufacturing/services/commands";
import {markOrderReady as action475} from "@/modules/manufacturing/services/commands";
import {releaseOrder as action476} from "@/modules/manufacturing/services/commands";
import {closeOrder as action477} from "@/modules/manufacturing/services/commands";
import {startWorkOrder as action478} from "@/modules/manufacturing/services/commands";
import {pauseWorkOrder as action479} from "@/modules/manufacturing/services/commands";
import {completeWorkOrder as action480} from "@/modules/manufacturing/services/commands";
import {listForecasts as action481} from "@/modules/manufacturing/services/forecast";
import {setForecast as action482} from "@/modules/manufacturing/services/forecast";
import {deleteForecast as action483} from "@/modules/manufacturing/services/forecast";
import {runMrp as action484} from "@/modules/manufacturing/services/mrp";
import {firmSuggestion as action485} from "@/modules/manufacturing/services/mrp";
import {dismissSuggestion as action486} from "@/modules/manufacturing/services/mrp";
import {latestPlan as action487} from "@/modules/manufacturing/services/mrp";
import {loadPlant as action488} from "@/modules/manufacturing/services/plant";
import {saveWorkCentre as action489} from "@/modules/manufacturing/services/plant";
import {saveMachine as action490} from "@/modules/manufacturing/services/plant";
import {retirePlantRecord as action491} from "@/modules/manufacturing/services/plant";
import {schedulePreview as action492} from "@/modules/manufacturing/services/scheduler";
import {rescheduleWorkOrder as action493} from "@/modules/manufacturing/services/scheduler";
import {setWorkOrderLock as action494} from "@/modules/manufacturing/services/scheduler";
import {listShifts as action495} from "@/modules/manufacturing/services/shifts";
import {saveShift as action496} from "@/modules/manufacturing/services/shifts";
import {deleteShift as action497} from "@/modules/manufacturing/services/shifts";
import {createCampaign as action498} from "@/modules/marketing/services/commands";
import {updateCampaign as action499} from "@/modules/marketing/services/commands";
import {createProfile as action500} from "@/modules/marketing/services/commands";
import {recordPermission as action501} from "@/modules/marketing/services/commands";
import {suppressProfile as action502} from "@/modules/marketing/services/commands";
import {createAudience as action503} from "@/modules/marketing/services/commands";
import {previewAudience as action504} from "@/modules/marketing/services/commands";
import {createContent as action505} from "@/modules/marketing/services/commands";
import {approveContent as action506} from "@/modules/marketing/services/commands";
import {createMessage as action507} from "@/modules/marketing/services/commands";
import {lockSend as action508} from "@/modules/marketing/services/commands";
import {cancelSend as action509} from "@/modules/marketing/services/commands";
import {ingestEvent as action510} from "@/modules/marketing/services/commands";
import {createJourney as action511} from "@/modules/marketing/services/commands";
import {publishJourney as action512} from "@/modules/marketing/services/commands";
import {reviseJourney as action513} from "@/modules/marketing/services/commands";
import {createProgram as action514} from "@/modules/marketing/services/commands";
import {createExperiment as action515} from "@/modules/marketing/services/commands";
import {leadFeedback as action516} from "@/modules/marketing/services/commands";
import {processJourneySteps as action517} from "@/modules/marketing/services/commands";
import {saveMarketingPlan as action518} from "@/modules/marketing/services/commands";
import {addPlanActivity as action519} from "@/modules/marketing/services/commands";
import {updatePlanActivity as action520} from "@/modules/marketing/services/commands";
import {addBudgetLine as action521} from "@/modules/marketing/services/commands";
import {submitBudgetToFinance as action522} from "@/modules/marketing/services/commands";
import {createJourneyMap as action523} from "@/modules/marketing/services/commands";
import {addJourneyStage as action524} from "@/modules/marketing/services/commands";
import {addJourneyTouch as action525} from "@/modules/marketing/services/commands";
import {getApprovedExpenseSource as action526} from "@/modules/people/services/finance-expenses";
import {createPlan as action527} from "@/modules/plan/services/commands";
import {saveCell as action528} from "@/modules/plan/services/commands";
import {addMeasure as action529} from "@/modules/plan/services/commands";
import {addAssumption as action530} from "@/modules/plan/services/commands";
import {addDriver as action531} from "@/modules/plan/services/commands";
import {addLink as action532} from "@/modules/plan/services/commands";
import {createScenario as action533} from "@/modules/plan/services/commands";
import {promoteScenario as action534} from "@/modules/plan/services/commands";
import {submitPlan as action535} from "@/modules/plan/services/commands";
import {approvePlan as action536} from "@/modules/plan/services/commands";
import {lockPlan as action537} from "@/modules/plan/services/commands";
import {addGoal as action538} from "@/modules/plan/services/commands";
import {addInitiative as action539} from "@/modules/plan/services/commands";
import {createProjectForInitiative as action540} from "@/modules/plan/services/commands";
import {addAction as action541} from "@/modules/plan/services/commands";
import {completeAction as action542} from "@/modules/plan/services/commands";
import {addRisk as action543} from "@/modules/plan/services/commands";
import {addDependency as action544} from "@/modules/plan/services/commands";
import {addDecision as action545} from "@/modules/plan/services/commands";
import {addComment as action546} from "@/modules/plan/services/commands";
import {addUpdate as action547} from "@/modules/plan/services/commands";
import {completeReview as action548} from "@/modules/plan/services/commands";
import {addReview as action549} from "@/modules/plan/services/commands";
import {distributeTargets as action550} from "@/modules/plan/services/commands";
import {importGrid as action551} from "@/modules/plan/services/commands";
import {sharePlan as action552} from "@/modules/plan/services/commands";
import {unsharePlan as action553} from "@/modules/plan/services/commands";
import {setPlanAudience as action554} from "@/modules/plan/services/commands";
import {addNote as action555} from "@/modules/plan/services/commands";
import {saveGoalProgress as action556} from "@/modules/plan/services/commands";
import {savePlanBrief as action557} from "@/modules/plan/services/commands";
import {listProductionPlans as action558} from "@/modules/planning/services/plans";
import {getPlanOptions as action559} from "@/modules/planning/services/plans";
import {getProductionPlan as action560} from "@/modules/planning/services/plans";
import {createProductionPlan as action561} from "@/modules/planning/services/plans";
import {addProductionPlanLine as action562} from "@/modules/planning/services/plans";
import {getAssignedPlanningWork as action563} from "@/modules/planning/services/plans";
import {getPlanningCoverage as action564} from "@/modules/planning/services/queries";
import {saveProductRecipe as action565} from "@/modules/products/services/make";
import {createSpecification as action566} from "@/modules/quality/services/commands";
import {setSpecificationStatus as action567} from "@/modules/quality/services/commands";
import {createControlPoint as action568} from "@/modules/quality/services/commands";
import {executeInspection as action569} from "@/modules/quality/services/commands";
import {releaseHold as action570} from "@/modules/quality/services/commands";
import {reportNcr as action571} from "@/modules/quality/services/commands";
import {updateNcrInvestigation as action572} from "@/modules/quality/services/commands";
import {addNcrAction as action573} from "@/modules/quality/services/commands";
import {updateNcrAction as action574} from "@/modules/quality/services/commands";
import {closeNcr as action575} from "@/modules/quality/services/commands";
import {saveSubstance as action576} from "@/modules/safety/services/assurance";
import {addSafetyDataSheet as action577} from "@/modules/safety/services/assurance";
import {saveCoshhAssessment as action578} from "@/modules/safety/services/assurance";
import {approveSubstance as action579} from "@/modules/safety/services/assurance";
import {saveCompetence as action580} from "@/modules/safety/services/assurance";
import {saveSafetyDocument as action581} from "@/modules/safety/services/assurance";
import {acknowledgeDocument as action582} from "@/modules/safety/services/assurance";
import {saveAudit as action583} from "@/modules/safety/services/assurance";
import {addAuditFinding as action584} from "@/modules/safety/services/assurance";
import {approveAudit as action585} from "@/modules/safety/services/assurance";
import {saveChange as action586} from "@/modules/safety/services/assurance";
import {advanceChange as action587} from "@/modules/safety/services/assurance";
import {linkSafetyRecord as action588} from "@/modules/safety/services/assurance";
import {saveSafetyProfile as action589} from "@/modules/safety/services/commands";
import {saveRiskMatrix as action590} from "@/modules/safety/services/commands";
import {createRisk as action591} from "@/modules/safety/services/commands";
import {addControl as action592} from "@/modules/safety/services/commands";
import {rateAssessment as action593} from "@/modules/safety/services/commands";
import {approveAssessment as action594} from "@/modules/safety/services/commands";
import {reviseAssessment as action595} from "@/modules/safety/services/commands";
import {requestRiskReview as action596} from "@/modules/safety/services/commands";
import {reportIncident as action597} from "@/modules/safety/services/commands";
import {saveImmediateControl as action598} from "@/modules/safety/services/commands";
import {openInvestigation as action599} from "@/modules/safety/services/commands";
import {addCause as action600} from "@/modules/safety/services/commands";
import {saveRootCause as action601} from "@/modules/safety/services/commands";
import {reviewRiddor as action602} from "@/modules/safety/services/commands";
import {createSafetyAction as action603} from "@/modules/safety/services/commands";
import {advanceAction as action604} from "@/modules/safety/services/commands";
import {verifyAction as action605} from "@/modules/safety/services/commands";
import {saveWorkplaceRecord as action606} from "@/modules/safety/services/commands";
import {createPermit as action607} from "@/modules/safety/services/control";
import {advancePermit as action608} from "@/modules/safety/services/control";
import {extendPermit as action609} from "@/modules/safety/services/control";
import {createIsolation as action610} from "@/modules/safety/services/control";
import {applyIsolationLock as action611} from "@/modules/safety/services/control";
import {verifyIsolation as action612} from "@/modules/safety/services/control";
import {clearIsolation as action613} from "@/modules/safety/services/control";
import {removeIsolationLock as action614} from "@/modules/safety/services/control";
import {placeSafetyHold as action615} from "@/modules/safety/services/control";
import {updateReturnToService as action616} from "@/modules/safety/services/control";
import {releaseSafetyHold as action617} from "@/modules/safety/services/control";
import {overrideSafetyHold as action618} from "@/modules/safety/services/control";
import {saveStatutoryCheck as action619} from "@/modules/safety/services/control";
import {completeInspection as action620} from "@/modules/safety/services/control";
import {createInspection as action621} from "@/modules/safety/services/control";
import {createSalesAddress as action622} from "@/modules/sales/services/address-actions";
import {createSalesCatalogueProduct as action623} from "@/modules/sales/services/catalogue-actions";
import {sendQuote as action624} from "@/modules/sales/services/commands";
import {changeQuoteStatus as action625} from "@/modules/sales/services/commands";
import {deleteQuote as action626} from "@/modules/sales/services/commands";
import {duplicateDocument as action627} from "@/modules/sales/services/commands";
import {saveQuoteTemplate as action628} from "@/modules/sales/services/commands";
import {createOrderFromQuote as action629} from "@/modules/sales/services/commands";
import {linkCommercialProject as action630} from "@/modules/sales/services/commercial";
import {openCallOffOrder as action631} from "@/modules/sales/services/commercial";
import {raiseCallOff as action632} from "@/modules/sales/services/commercial";
import {invoiceCallOffDelivery as action633} from "@/modules/sales/services/commercial";
import {deliverAndInvoiceCallOff as action634} from "@/modules/sales/services/commercial";
import {importSalescsv as action635} from "@/modules/sales/services/csv-import";
import {saveDocument as action636} from "@/modules/sales/services/documents";
import {saveInvoiceTemplate as action637} from "@/modules/sales/services/invoice-template-actions";
import {retireInvoiceTemplate as action638} from "@/modules/sales/services/invoice-template-actions";
import {attachCustomerInvoiceTemplate as action639} from "@/modules/sales/services/invoice-template-actions";
import {detachCustomerInvoiceTemplate as action640} from "@/modules/sales/services/invoice-template-actions";
import {createDraftOrder as action641} from "@/modules/sales/services/orders";
import {addOrderLine as action642} from "@/modules/sales/services/orders";
import {removeOrderLine as action643} from "@/modules/sales/services/orders";
import {updateDraftOrderFields as action644} from "@/modules/sales/services/orders";
import {confirmOrder as action645} from "@/modules/sales/services/orders";
import {decideApproval as action646} from "@/modules/sales/services/orders";
import {amendLineQuantity as action647} from "@/modules/sales/services/orders";
import {overrideLinePrice as action648} from "@/modules/sales/services/orders";
import {amendRequestedDate as action649} from "@/modules/sales/services/orders";
import {cancelOrder as action650} from "@/modules/sales/services/orders";
import {deleteOrder as action651} from "@/modules/sales/services/orders";
import {cancelLineRemaining as action652} from "@/modules/sales/services/orders";
import {addHold as action653} from "@/modules/sales/services/orders";
import {releaseHold as action654} from "@/modules/sales/services/orders";
import {restoreCancelledOrder as action655} from "@/modules/sales/services/rewind";
import {returnOrderToQuote as action656} from "@/modules/sales/services/rewind";
import {saveOrderHashtags as action657} from "@/modules/sales/services/rewind";
import {saveSalesView as action658} from "@/modules/sales/services/saved-views";
import {archiveSalesView as action659} from "@/modules/sales/services/saved-views";
import {createCase as action660} from "@/modules/service/services/commands";
import {updateCase as action661} from "@/modules/service/services/commands";
import {assignCase as action662} from "@/modules/service/services/commands";
import {transitionCase as action663} from "@/modules/service/services/commands";
import {addCaseEntry as action664} from "@/modules/service/services/commands";
import {createDepartmentTicket as action665} from "@/modules/service/services/commands";
import {updateDepartmentTicket as action666} from "@/modules/service/services/commands";
import {createQueue as action667} from "@/modules/service/services/commands";
import {addQueueMember as action668} from "@/modules/service/services/commands";
import {linkCaseRecord as action669} from "@/modules/service/services/commands";
import {creditChoices as action670} from "@/modules/service/services/commands";
import {askFinanceForCredit as action671} from "@/modules/service/services/commands";
import {getCaseOwners as action672} from "@/modules/service/services/commands";
import {getDepartmentWork as action673} from "@/modules/service/services/commands";
import {readAvailability as action674} from "@/modules/stock/services/availability";
import {readOrderChain as action675} from "@/modules/stock/services/availability";
import {inventoryExportRows as action676} from "@/modules/stock/services/export";
import {createTeam as action677} from "@/modules/teams/services/commands";
import {renameTeam as action678} from "@/modules/teams/services/commands";
import {addMember as action679} from "@/modules/teams/services/commands";
import {removeMember as action680} from "@/modules/teams/services/commands";
import {saveTask as action681} from "@/modules/teams/services/commands";
import {setTaskStatus as action682} from "@/modules/teams/services/commands";
import {removeTask as action683} from "@/modules/teams/services/commands";
import {saveCover as action684} from "@/modules/teams/services/commands";
import {removeCover as action685} from "@/modules/teams/services/commands";
import {saveHandover as action686} from "@/modules/teams/services/commands";
import {savePlace as action687} from "@/modules/teams/services/commands";
import {saveMoment as action688} from "@/modules/teams/services/commands";
import {removeMoment as action689} from "@/modules/teams/services/commands";
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
"src/app/(app)/crm/projects/new/actions:createSalesProjectAction":action29 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:qualifyFormAction":action30 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:disqualifyFormAction":action31 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:nurtureFormAction":action32 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:logProspectActivityFormAction":action33 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:assignProspectFormAction":action34 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:assignProspectTaskFormAction":action35 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:convertProspectFormAction":action36 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/reports/actions:pinReportToDashboard":action37 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createContactFormAction":action38 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateContactFormAction":action39 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:deleteContactFormAction":action40 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createAddressFormAction":action41 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createTaxRegistrationFormAction":action42 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:markTaxVerifiedFormAction":action43 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createBankAccountFormAction":action44 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createDirectDebitFormAction":action45 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:cancelDirectDebitFormAction":action46 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateCreditLimitFormAction":action47 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:toggleCreditHoldFormAction":action48 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createNoteFormAction":action49 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateStatusFormAction":action50 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:deleteCustomerFormAction":action51 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:createKpi":action52 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:saveGoal":action53 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:updateKpi":action54 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:recordProgress":action55 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:closeGoal":action56 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:addPlanGoal":action57 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:closePlan":action58 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:commentOnPlan":action59 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:syncDemandAction":action60 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:restoreDeliveryAction":action61 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:releaseAction":action62 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:allocateAction":action63 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:directShipAction":action64 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:groupAction":action65 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:scanAction":action66 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:lotAction":action67 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:serialAction":action68 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shortAction":action69 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeWorkAction":action70 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:claimAction":action71 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shipFromPickAction":action72 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packageAction":action73 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:weightAction":action74 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:stageAction":action75 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:labelAction":action76 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:dispatchAction":action77 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:trackingAction":action78 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:deliverAction":action79 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadCreateAction":action80 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadScanAction":action81 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:departAction":action82 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:expectAction":action83 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveLineAction":action84 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:putAwayAction":action85 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeReceiptAction":action86 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferAction":action87 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferReceiveAction":action88 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:returnRequestAction":action89 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:authoriseReturnAction":action90 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveReturnAction":action91 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:inspectAction":action92 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:closeReturnAction":action93 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:assignEquipmentAction":action94 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packUnitAction":action95 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:saveHandlingTypeAction":action96 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:retireHandlingTypeAction":action97 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:removeHandlingTypeAction":action98 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:policyAction":action99 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:runMrpAction":action100 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:firmSuggestionAction":action101 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:dismissSuggestionAction":action102 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:setForecastAction":action103 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:deleteForecastAction":action104 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:runMrpAction":action105 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:firmPlannedOrderAction":action106 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:dismissPlannedOrderAction":action107 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:runMrpForm":action108 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:firmPlannedOrderForm":action109 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:dismissPlannedOrderForm":action110 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:previewMoveAction":action111 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:commitMoveAction":action112 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:toggleLockAction":action113 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:saveShiftAction":action114 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:deleteShiftAction":action115 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:startAction":action116 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:pauseAction":action117 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:completeAction":action118 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:loadNotices":action119 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotice":action120 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotices":action121 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:createPayrollRun":action122 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:updatePayslipDeductions":action123 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:finalisePayrollRun":action124 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:markPayrollRunPaid":action125 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:savePayrollSettings":action126 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP45":action127 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP60":action128 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:logAbsence":action129 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:requestLeave":action130 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:cancelOwnLeave":action131 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:approveLeaveRequest":action132 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:setLeaveAllowance":action133 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:rejectLeaveRequest":action134 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:createEmployee":action135 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:changeEmployeeStatus":action136 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeProfile":action137 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateOwnEmployeeDetails":action138 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeDocument":action139 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:linkEmployeeToUser":action140 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:completeEmployeeTask":action141 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeTask":action142 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeContact":action143 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeTask":action144 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:scheduleAppraisal":action145 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:completeAppraisal":action146 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getConductDesk":action147 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getMyConduct":action148 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getPlan":action149 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getCase":action150 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:conductChoices":action151 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:savePlan":action152 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addPlanReview":action153 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:commentOnPlan":action154 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:saveCase":action155 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:respondToCase":action156 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addCaseEvent":action157 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:submitExpenseClaim":action158 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:approveExpenseClaim":action159 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:rejectExpenseClaim":action160 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:scheduleOneToOne":action161 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:completeOneToOne":action162 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:listPolicies":action163 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:publishPolicy":action164 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:archivePolicy":action165 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:openPolicy":action166 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:createShift":action167 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:changeShiftStatus":action168 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyHR":action169 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyTeam":action170 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getTeamEmployee":action171 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:addPrivateNote":action172 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:updateWorkingPattern":action173 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:updateHrSettings":action174 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createAppraisalTemplate":action175 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleAppraisalTemplateActive":action176 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createOneToOneTemplate":action177 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleOneToOneTemplateActive":action178 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:getTimesheetContext":action179 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:saveTimesheet":action180 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:reviewTimesheet":action181 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:createPriceList":action182 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:savePriceEntry":action183 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveRule":action184 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:setRuleActive":action185 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:updatePriceBasis":action186 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:assignPriceList":action187 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewPriceCsv":action188 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyPriceCsv":action189 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreement":action190 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreementPrice":action191 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:removeAgreementPrice":action192 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewAgreementCsv":action193 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyAgreementCsv":action194 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProduct":action195 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProductRecord":action196 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveCategory":action197 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:retireCategory":action198 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:addStandardCategories":action199 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:savePack":action200 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveLinks":action201 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveMeasures":action202 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/actions:saveProfile":action203 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/work:loadAssignedWork":action204 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProject":action205 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeProjectStatus":action206 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editProject":action207 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProjectMember":action208 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:archiveProject":action209 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTask":action210 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeTaskStatus":action211 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editTask":action212 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:checklistItem":action213 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addDependency":action214 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMeeting":action215 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDocument":action216 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editDocument":action217 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addComment":action218 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMilestone":action219 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:publishUpdate":action220 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDecision":action221 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:decide":action222 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createRisk":action223 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:closeRisk":action224 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:requestApproval":action225 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:respondApproval":action226 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:submitRequest":action227 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:triageRequest":action228 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:logTime":action229 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:planToday":action230 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:updateInbox":action231 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveView":action232 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createPortfolio":action233 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createBaseline":action234 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setBudget":action235 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:linkWork":action236 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectActivity":action237 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createAutomation":action238 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:toggleAutomation":action239 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveProjectTemplate":action240 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:useProjectTemplate":action241 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:startTimer":action242 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:stopTimer":action243 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:projectPreference":action244 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:uploadProjectFile":action245 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:readProjectFile":action246 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProperty":action247 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProperty":action248 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:restoreDocument":action249 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTaskFromDocument":action250 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:discardTimer":action251 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:completeMilestone":action252 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:resolveComment":action253 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectWorkload":action254 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:createOrderForm":action255 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addLineForm":action256 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:removeLineForm":action257 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:confirmOrderForm":action258 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:updateOrderForm":action259 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:chooseOrderAddresses":action260 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addHoldForm":action261 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:releaseHoldForm":action262 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:approveOrderForm":action263 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:cancelOrderForm":action264 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:saveOrderHashtagsForm":action265 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:restoreCancelledOrderForm":action266 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:returnOrderToQuoteForm":action267 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:scheduleOrderDelivery":action268 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:rejectOrderApproval":action269 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:deleteOrderForm":action270 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:createQuote":action271 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:deleteQuoteForm":action272 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/settings/actions:saveCreationPolicy":action273 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getSchedule":action274 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:createBulkShifts":action275 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:setScheduledShift":action276 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:completeShiftTask":action277 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:editScheduledShift":action278 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishWeekShifts":action279 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveHoursBudget":action280 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getTeamPlan":action281 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getPersonSchedule":action282 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveWorkType":action283 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:archiveWorkType":action284 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveDemand":action285 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveBusyRule":action286 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:removeBusyRule":action287 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:fillTeamMonth":action288 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:replanCover":action289 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishMonth":action290 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveShift":action291 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveRole":action292 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveMemberRoles":action293 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:createUser":action294 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyAccess":action295 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyProfile":action296 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveManagerPolicy":action297 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveWorkspaceDetails":action298 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyBrand":action299 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/imports/actions:importCsv":action300 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveEmailAccount":action301 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:verifyEmailAccount":action302 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:sendTestEmail":action303 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:makeDefaultAccount":action304 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:setAccountActive":action305 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteEmailAccount":action306 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveSocialAccount":action307 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteSocialAccount":action308 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:checkSocialAccount":action309 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveEmailTemplate":action310 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteEmailTemplate":action311 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/logistics/actions:saveDispatchDelivery":action312 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveUserAccess":action313 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:setUserStatus":action314 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:revokeUserSessions":action315 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:issuePasswordRecovery":action316 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createManagedUser":action317 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:linkEmployeeProfile":action318 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createRole":action319 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveManagementGroup":action320 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createWarehouse":action321 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:adjustStock":action322 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:savePlanningAction":action323 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:makeFromForecastAction":action324 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:transferStock":action325 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createSiteAction":action326 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createPlaceAction":action327 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:assignSiteAction":action328 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:addLocationAction":action329 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:ensureLocationsAction":action330 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:retireLocationAction":action331 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:putOnLocationAction":action332 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:moveLocatedAction":action333 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:receiveMoveAction":action334 as (...args:never[])=>Promise<unknown>,
"src/core/approvals/actions:delegateApprovals":action335 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:loginAction":action336 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:logoutAction":action337 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:completePasswordRecovery":action338 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:changeOwnPassword":action339 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:signOutOtherSessions":action340 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:createContract":action341 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:sendContract":action342 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:signContract":action343 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:declineContract":action344 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:loadPublicContract":action345 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:checkForDuplicatesAction":action346 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:createCustomerAction":action347 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createCustomer":action348 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerStatus":action349 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteCustomer":action350 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createContact":action351 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateContact":action352 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteContact":action353 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createAddress":action354 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCommercialSettings":action355 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCreditLimit":action356 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setCreditHold":action357 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setPaymentTerm":action358 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createTaxRegistration":action359 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:markTaxRegistrationManuallyVerified":action360 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createBankAccount":action361 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:revealBankAccount":action362 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createDirectDebitMandate":action363 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:cancelDirectDebitMandate":action364 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createNote":action365 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:saveCustomerHashtags":action366 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commercial-actions:saveOrderingPreferences":action367 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setCustomerParent":action368 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:placeCustomer":action369 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:moveCustomer":action370 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setContactReportsTo":action371 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:saveCustomerTradingLink":action372 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:setInvoiceAccount":action373 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:archiveCustomerTradingLink":action374 as (...args:never[])=>Promise<unknown>,
"src/core/finance/actions:requestSalesInvoice":action375 as (...args:never[])=>Promise<unknown>,
"src/core/teams/actions:createWorkTeam":action376 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditBoard":action377 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:exportAuditReport":action378 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEcho":action379 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:postEchoNote":action380 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEchoInbox":action381 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditAccess":action382 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditOwnActivity":action383 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditAreas":action384 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:saveAutomation":action385 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:setAutomationEnabled":action386 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:deleteAutomation":action387 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:testOnPastEvent":action388 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:runNow":action389 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:logActivity":action390 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:completeActivity":action391 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/marketing-handoff:acceptMarketingHandoff":action392 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:createOpportunity":action393 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:moveOpportunityStage":action394 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityValue":action395 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityCloseDate":action396 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityForecastCategory":action397 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityNextAction":action398 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:winOpportunity":action399 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:loseOpportunity":action400 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addStakeholder":action401 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addMilestone":action402 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:toggleMilestone":action403 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:checkProspectDuplicatesAction":action404 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createProspect":action405 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:assignProspect":action406 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:setProspectLifecycleStage":action407 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:convertProspect":action408 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createIndustry":action409 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:saveProspectGrouping":action410 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProject":action411 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:updateSalesProject":action412 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addOrganisationToProject":action413 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addStakeholderToProject":action414 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:linkQuoteToProject":action415 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:linkOrderToProject":action416 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:deleteSalesProject":action417 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:saveSurvey":action418 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:setSurveyActive":action419 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatScore":action420 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatComment":action421 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setupFinance":action422 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceDocument":action423 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:submitFinanceDocument":action424 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveApprovalPolicy":action425 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:decideFinanceApproval":action426 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPurchaseOrder":action427 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:raiseServiceCredit":action428 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postFinanceDocument":action429 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:recordGoodsReceipt":action430 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:onboardSupplier":action431 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveSupplier":action432 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:requestSupplierBankChange":action433 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:verifySupplierBank":action434 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceBank":action435 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:importBankTransactions":action436 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocateBankTransaction":action437 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPaymentRun":action438 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approvePaymentRun":action439 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createManualJournal":action440 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveManualJournal":action441 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:reverseJournal":action442 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setFinancePeriodState":action443 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceBudget":action444 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceAsset":action445 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postAssetDepreciation":action446 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:completeCloseTask":action447 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceContract":action448 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceScenario":action449 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:receiptForm":action450 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:journalForm":action451 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:statementForm":action452 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocationForm":action453 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:paymentRunForm":action454 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:policyForm":action455 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:scenarioForm":action456 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:uploadFinanceAttachment":action457 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateSalesInvoice":action458 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateInvoiceAdjustment":action459 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:voidFinanceDraft":action460 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceHome":action461 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:listFinanceDocuments":action462 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceDocument":action463 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceWorkspace":action464 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:financeChoices":action465 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getBudgetPositions":action466 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getInvoiceCashForecast":action467 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinancialReport":action468 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceCustomerContribution":action469 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:searchFinance":action470 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceAttachment":action471 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getSalesFinanceProjection":action472 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getReceivingWarehouses":action473 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:createProductionOrder":action474 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:markOrderReady":action475 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:releaseOrder":action476 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:closeOrder":action477 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:startWorkOrder":action478 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:pauseWorkOrder":action479 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:completeWorkOrder":action480 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:listForecasts":action481 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:setForecast":action482 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:deleteForecast":action483 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:runMrp":action484 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:firmSuggestion":action485 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:dismissSuggestion":action486 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:latestPlan":action487 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:loadPlant":action488 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveWorkCentre":action489 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveMachine":action490 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:retirePlantRecord":action491 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:schedulePreview":action492 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:rescheduleWorkOrder":action493 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:setWorkOrderLock":action494 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:listShifts":action495 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:saveShift":action496 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:deleteShift":action497 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createCampaign":action498 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updateCampaign":action499 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProfile":action500 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:recordPermission":action501 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:suppressProfile":action502 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createAudience":action503 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:previewAudience":action504 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createContent":action505 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:approveContent":action506 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createMessage":action507 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:lockSend":action508 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:cancelSend":action509 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:ingestEvent":action510 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourney":action511 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:publishJourney":action512 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:reviseJourney":action513 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProgram":action514 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createExperiment":action515 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:leadFeedback":action516 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:processJourneySteps":action517 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:saveMarketingPlan":action518 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addPlanActivity":action519 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updatePlanActivity":action520 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addBudgetLine":action521 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:submitBudgetToFinance":action522 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourneyMap":action523 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyStage":action524 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyTouch":action525 as (...args:never[])=>Promise<unknown>,
"src/modules/people/services/finance-expenses:getApprovedExpenseSource":action526 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createPlan":action527 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveCell":action528 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addMeasure":action529 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAssumption":action530 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDriver":action531 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addLink":action532 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createScenario":action533 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:promoteScenario":action534 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:submitPlan":action535 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:approvePlan":action536 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:lockPlan":action537 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addGoal":action538 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addInitiative":action539 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createProjectForInitiative":action540 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAction":action541 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeAction":action542 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addRisk":action543 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDependency":action544 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDecision":action545 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addComment":action546 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addUpdate":action547 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeReview":action548 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addReview":action549 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:distributeTargets":action550 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:importGrid":action551 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:sharePlan":action552 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:unsharePlan":action553 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:setPlanAudience":action554 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addNote":action555 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveGoalProgress":action556 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:savePlanBrief":action557 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:listProductionPlans":action558 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getPlanOptions":action559 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getProductionPlan":action560 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:createProductionPlan":action561 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:addProductionPlanLine":action562 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getAssignedPlanningWork":action563 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/queries:getPlanningCoverage":action564 as (...args:never[])=>Promise<unknown>,
"src/modules/products/services/make:saveProductRecipe":action565 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createSpecification":action566 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:setSpecificationStatus":action567 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createControlPoint":action568 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:executeInspection":action569 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:releaseHold":action570 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:reportNcr":action571 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrInvestigation":action572 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:addNcrAction":action573 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrAction":action574 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:closeNcr":action575 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSubstance":action576 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addSafetyDataSheet":action577 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCoshhAssessment":action578 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveSubstance":action579 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCompetence":action580 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSafetyDocument":action581 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:acknowledgeDocument":action582 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveAudit":action583 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addAuditFinding":action584 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveAudit":action585 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveChange":action586 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:advanceChange":action587 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:linkSafetyRecord":action588 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveSafetyProfile":action589 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRiskMatrix":action590 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createRisk":action591 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addControl":action592 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:rateAssessment":action593 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:approveAssessment":action594 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviseAssessment":action595 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:requestRiskReview":action596 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reportIncident":action597 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveImmediateControl":action598 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:openInvestigation":action599 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addCause":action600 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRootCause":action601 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviewRiddor":action602 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createSafetyAction":action603 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:advanceAction":action604 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:verifyAction":action605 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveWorkplaceRecord":action606 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createPermit":action607 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:advancePermit":action608 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:extendPermit":action609 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createIsolation":action610 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:applyIsolationLock":action611 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:verifyIsolation":action612 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:clearIsolation":action613 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:removeIsolationLock":action614 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:placeSafetyHold":action615 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:updateReturnToService":action616 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:releaseSafetyHold":action617 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:overrideSafetyHold":action618 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:saveStatutoryCheck":action619 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:completeInspection":action620 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createInspection":action621 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/address-actions:createSalesAddress":action622 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/catalogue-actions:createSalesCatalogueProduct":action623 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:sendQuote":action624 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:changeQuoteStatus":action625 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:deleteQuote":action626 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:duplicateDocument":action627 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:saveQuoteTemplate":action628 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:createOrderFromQuote":action629 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:linkCommercialProject":action630 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:openCallOffOrder":action631 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:raiseCallOff":action632 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:invoiceCallOffDelivery":action633 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:deliverAndInvoiceCallOff":action634 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/csv-import:importSalescsv":action635 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/documents:saveDocument":action636 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:saveInvoiceTemplate":action637 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:retireInvoiceTemplate":action638 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:attachCustomerInvoiceTemplate":action639 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:detachCustomerInvoiceTemplate":action640 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:createDraftOrder":action641 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addOrderLine":action642 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:removeOrderLine":action643 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:updateDraftOrderFields":action644 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:confirmOrder":action645 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:decideApproval":action646 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendLineQuantity":action647 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:overrideLinePrice":action648 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendRequestedDate":action649 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelOrder":action650 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:deleteOrder":action651 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelLineRemaining":action652 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addHold":action653 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:releaseHold":action654 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:restoreCancelledOrder":action655 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:returnOrderToQuote":action656 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:saveOrderHashtags":action657 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:saveSalesView":action658 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:archiveSalesView":action659 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createCase":action660 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateCase":action661 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:assignCase":action662 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:transitionCase":action663 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addCaseEntry":action664 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createDepartmentTicket":action665 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateDepartmentTicket":action666 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createQueue":action667 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addQueueMember":action668 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:linkCaseRecord":action669 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:creditChoices":action670 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:askFinanceForCredit":action671 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getCaseOwners":action672 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getDepartmentWork":action673 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readAvailability":action674 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readOrderChain":action675 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/export:inventoryExportRows":action676 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:createTeam":action677 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:renameTeam":action678 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:addMember":action679 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMember":action680 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveTask":action681 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:setTaskStatus":action682 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeTask":action683 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveCover":action684 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeCover":action685 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveHandover":action686 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:savePlace":action687 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveMoment":action688 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMoment":action689 as (...args:never[])=>Promise<unknown>
};
