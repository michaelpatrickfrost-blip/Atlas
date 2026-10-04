// Generated allowlist: public calls still enforce their own server capabilities.
import {loadLiveMetrics as action0} from "@/app/(app)/analytics/actions";
import {loadMetricSlice as action1} from "@/app/(app)/analytics/actions";
import {saveAnalyticsDashboard as action2} from "@/app/(app)/analytics/actions";
import {deleteAnalyticsDashboard as action3} from "@/app/(app)/analytics/actions";
import {toggleModuleAction as action4} from "@/app/(app)/apps/actions";
import {updateCompanyAccount as action5} from "@/app/(app)/atlas/actions";
import {saveCompanyEntitlements as action6} from "@/app/(app)/atlas/actions";
import {createCompanyAccount as action7} from "@/app/(app)/atlas/actions";
import {importCompanySetup as action8} from "@/app/(app)/atlas/setup-actions";
import {createCompanyUser as action9} from "@/app/(app)/atlas/setup-actions";
import {setCompanyUserStatus as action10} from "@/app/(app)/atlas/setup-actions";
import {postMessage as action11} from "@/app/(app)/chat/actions";
import {searchChatPeople as action12} from "@/app/(app)/chat/actions";
import {openChat as action13} from "@/app/(app)/chat/actions";
import {openDirectChat as action14} from "@/app/(app)/chat/actions";
import {searchChatRecords as action15} from "@/app/(app)/chat/actions";
import {sendChat as action16} from "@/app/(app)/chat/actions";
import {chatSnapshot as action17} from "@/app/(app)/chat/actions";
import {updateValueFormAction as action18} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {updateCloseDateFormAction as action19} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {setNextActionFormAction as action20} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {setForecastCategoryFormAction as action21} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {winFormAction as action22} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {loseFormAction as action23} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addStakeholderFormAction as action24} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addMilestoneFormAction as action25} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {toggleMilestoneFormAction as action26} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {logOpportunityActivityFormAction as action27} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {createSalesProjectAction as action28} from "@/app/(app)/crm/projects/new/actions";
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
import {previewMoveAction as action104} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {commitMoveAction as action105} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {toggleLockAction as action106} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {saveShiftAction as action107} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {deleteShiftAction as action108} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {startAction as action109} from "@/app/(app)/manufacturing/shop-floor/actions";
import {pauseAction as action110} from "@/app/(app)/manufacturing/shop-floor/actions";
import {completeAction as action111} from "@/app/(app)/manufacturing/shop-floor/actions";
import {loadNotices as action112} from "@/app/(app)/notices/actions";
import {clearNotice as action113} from "@/app/(app)/notices/actions";
import {clearNotices as action114} from "@/app/(app)/notices/actions";
import {createPayrollRun as action115} from "@/app/(app)/payroll/actions";
import {updatePayslipDeductions as action116} from "@/app/(app)/payroll/actions";
import {finalisePayrollRun as action117} from "@/app/(app)/payroll/actions";
import {markPayrollRunPaid as action118} from "@/app/(app)/payroll/actions";
import {savePayrollSettings as action119} from "@/app/(app)/payroll/actions";
import {issueP45 as action120} from "@/app/(app)/payroll/actions";
import {issueP60 as action121} from "@/app/(app)/payroll/actions";
import {logAbsence as action122} from "@/app/(app)/people/absence/actions";
import {requestLeave as action123} from "@/app/(app)/people/absence/actions";
import {cancelOwnLeave as action124} from "@/app/(app)/people/absence/actions";
import {approveLeaveRequest as action125} from "@/app/(app)/people/absence/actions";
import {setLeaveAllowance as action126} from "@/app/(app)/people/absence/actions";
import {rejectLeaveRequest as action127} from "@/app/(app)/people/absence/actions";
import {createEmployee as action128} from "@/app/(app)/people/actions";
import {changeEmployeeStatus as action129} from "@/app/(app)/people/actions";
import {updateEmployeeProfile as action130} from "@/app/(app)/people/actions";
import {updateOwnEmployeeDetails as action131} from "@/app/(app)/people/actions";
import {addEmployeeDocument as action132} from "@/app/(app)/people/actions";
import {linkEmployeeToUser as action133} from "@/app/(app)/people/actions";
import {completeEmployeeTask as action134} from "@/app/(app)/people/actions";
import {addEmployeeTask as action135} from "@/app/(app)/people/actions";
import {updateEmployeeContact as action136} from "@/app/(app)/people/actions";
import {updateEmployeeTask as action137} from "@/app/(app)/people/actions";
import {scheduleAppraisal as action138} from "@/app/(app)/people/appraisals/actions";
import {completeAppraisal as action139} from "@/app/(app)/people/appraisals/actions";
import {getConductDesk as action140} from "@/app/(app)/people/conduct/actions";
import {getMyConduct as action141} from "@/app/(app)/people/conduct/actions";
import {getPlan as action142} from "@/app/(app)/people/conduct/actions";
import {getCase as action143} from "@/app/(app)/people/conduct/actions";
import {conductChoices as action144} from "@/app/(app)/people/conduct/actions";
import {savePlan as action145} from "@/app/(app)/people/conduct/actions";
import {addPlanReview as action146} from "@/app/(app)/people/conduct/actions";
import {commentOnPlan as action147} from "@/app/(app)/people/conduct/actions";
import {saveCase as action148} from "@/app/(app)/people/conduct/actions";
import {respondToCase as action149} from "@/app/(app)/people/conduct/actions";
import {addCaseEvent as action150} from "@/app/(app)/people/conduct/actions";
import {submitExpenseClaim as action151} from "@/app/(app)/people/expenses/actions";
import {approveExpenseClaim as action152} from "@/app/(app)/people/expenses/actions";
import {rejectExpenseClaim as action153} from "@/app/(app)/people/expenses/actions";
import {scheduleOneToOne as action154} from "@/app/(app)/people/one-to-ones/actions";
import {completeOneToOne as action155} from "@/app/(app)/people/one-to-ones/actions";
import {listPolicies as action156} from "@/app/(app)/people/policies/actions";
import {publishPolicy as action157} from "@/app/(app)/people/policies/actions";
import {archivePolicy as action158} from "@/app/(app)/people/policies/actions";
import {openPolicy as action159} from "@/app/(app)/people/policies/actions";
import {createShift as action160} from "@/app/(app)/people/rotas/actions";
import {changeShiftStatus as action161} from "@/app/(app)/people/rotas/actions";
import {getMyHR as action162} from "@/app/(app)/people/self-service";
import {getMyTeam as action163} from "@/app/(app)/people/self-service";
import {getTeamEmployee as action164} from "@/app/(app)/people/self-service";
import {addPrivateNote as action165} from "@/app/(app)/people/self-service";
import {updateWorkingPattern as action166} from "@/app/(app)/people/self-service";
import {updateHrSettings as action167} from "@/app/(app)/people/settings/actions";
import {createAppraisalTemplate as action168} from "@/app/(app)/people/settings/actions";
import {toggleAppraisalTemplateActive as action169} from "@/app/(app)/people/settings/actions";
import {createOneToOneTemplate as action170} from "@/app/(app)/people/settings/actions";
import {toggleOneToOneTemplateActive as action171} from "@/app/(app)/people/settings/actions";
import {getTimesheetContext as action172} from "@/app/(app)/people/timesheets/actions";
import {saveTimesheet as action173} from "@/app/(app)/people/timesheets/actions";
import {reviewTimesheet as action174} from "@/app/(app)/people/timesheets/actions";
import {createPriceList as action175} from "@/app/(app)/pricing/actions";
import {savePriceEntry as action176} from "@/app/(app)/pricing/actions";
import {saveRule as action177} from "@/app/(app)/pricing/actions";
import {setRuleActive as action178} from "@/app/(app)/pricing/actions";
import {updatePriceBasis as action179} from "@/app/(app)/pricing/actions";
import {assignPriceList as action180} from "@/app/(app)/pricing/actions";
import {previewPriceCsv as action181} from "@/app/(app)/pricing/actions";
import {applyPriceCsv as action182} from "@/app/(app)/pricing/actions";
import {saveAgreement as action183} from "@/app/(app)/pricing/actions";
import {saveAgreementPrice as action184} from "@/app/(app)/pricing/actions";
import {removeAgreementPrice as action185} from "@/app/(app)/pricing/actions";
import {previewAgreementCsv as action186} from "@/app/(app)/pricing/actions";
import {applyAgreementCsv as action187} from "@/app/(app)/pricing/actions";
import {saveProduct as action188} from "@/app/(app)/products/actions";
import {saveProductRecord as action189} from "@/app/(app)/products/actions";
import {saveCategory as action190} from "@/app/(app)/products/actions";
import {retireCategory as action191} from "@/app/(app)/products/actions";
import {addStandardCategories as action192} from "@/app/(app)/products/actions";
import {savePack as action193} from "@/app/(app)/products/actions";
import {saveLinks as action194} from "@/app/(app)/products/actions";
import {saveMeasures as action195} from "@/app/(app)/products/actions";
import {saveProfile as action196} from "@/app/(app)/profile/actions";
import {loadAssignedWork as action197} from "@/app/(app)/profile/work";
import {createProject as action198} from "@/app/(app)/projects/actions";
import {changeProjectStatus as action199} from "@/app/(app)/projects/actions";
import {editProject as action200} from "@/app/(app)/projects/actions";
import {setProjectMember as action201} from "@/app/(app)/projects/actions";
import {archiveProject as action202} from "@/app/(app)/projects/actions";
import {createTask as action203} from "@/app/(app)/projects/actions";
import {changeTaskStatus as action204} from "@/app/(app)/projects/actions";
import {editTask as action205} from "@/app/(app)/projects/actions";
import {checklistItem as action206} from "@/app/(app)/projects/actions";
import {addDependency as action207} from "@/app/(app)/projects/actions";
import {createMeeting as action208} from "@/app/(app)/projects/actions";
import {createDocument as action209} from "@/app/(app)/projects/actions";
import {editDocument as action210} from "@/app/(app)/projects/actions";
import {addComment as action211} from "@/app/(app)/projects/actions";
import {createMilestone as action212} from "@/app/(app)/projects/actions";
import {publishUpdate as action213} from "@/app/(app)/projects/actions";
import {createDecision as action214} from "@/app/(app)/projects/actions";
import {decide as action215} from "@/app/(app)/projects/actions";
import {createRisk as action216} from "@/app/(app)/projects/actions";
import {closeRisk as action217} from "@/app/(app)/projects/actions";
import {requestApproval as action218} from "@/app/(app)/projects/actions";
import {respondApproval as action219} from "@/app/(app)/projects/actions";
import {submitRequest as action220} from "@/app/(app)/projects/actions";
import {triageRequest as action221} from "@/app/(app)/projects/actions";
import {logTime as action222} from "@/app/(app)/projects/actions";
import {planToday as action223} from "@/app/(app)/projects/actions";
import {updateInbox as action224} from "@/app/(app)/projects/actions";
import {saveView as action225} from "@/app/(app)/projects/actions";
import {createPortfolio as action226} from "@/app/(app)/projects/actions";
import {createBaseline as action227} from "@/app/(app)/projects/actions";
import {setBudget as action228} from "@/app/(app)/projects/actions";
import {linkWork as action229} from "@/app/(app)/projects/actions";
import {getProjectActivity as action230} from "@/app/(app)/projects/actions";
import {createAutomation as action231} from "@/app/(app)/projects/actions";
import {toggleAutomation as action232} from "@/app/(app)/projects/actions";
import {saveProjectTemplate as action233} from "@/app/(app)/projects/actions";
import {useProjectTemplate as action234} from "@/app/(app)/projects/actions";
import {startTimer as action235} from "@/app/(app)/projects/actions";
import {stopTimer as action236} from "@/app/(app)/projects/actions";
import {projectPreference as action237} from "@/app/(app)/projects/actions";
import {uploadProjectFile as action238} from "@/app/(app)/projects/actions";
import {readProjectFile as action239} from "@/app/(app)/projects/actions";
import {createProperty as action240} from "@/app/(app)/projects/actions";
import {setProperty as action241} from "@/app/(app)/projects/actions";
import {restoreDocument as action242} from "@/app/(app)/projects/actions";
import {createTaskFromDocument as action243} from "@/app/(app)/projects/actions";
import {discardTimer as action244} from "@/app/(app)/projects/actions";
import {completeMilestone as action245} from "@/app/(app)/projects/actions";
import {resolveComment as action246} from "@/app/(app)/projects/actions";
import {getProjectWorkload as action247} from "@/app/(app)/projects/actions";
import {createOrderForm as action248} from "@/app/(app)/sales/orders/actions";
import {addLineForm as action249} from "@/app/(app)/sales/orders/actions";
import {removeLineForm as action250} from "@/app/(app)/sales/orders/actions";
import {confirmOrderForm as action251} from "@/app/(app)/sales/orders/actions";
import {updateOrderForm as action252} from "@/app/(app)/sales/orders/actions";
import {chooseOrderAddresses as action253} from "@/app/(app)/sales/orders/actions";
import {addHoldForm as action254} from "@/app/(app)/sales/orders/actions";
import {releaseHoldForm as action255} from "@/app/(app)/sales/orders/actions";
import {approveOrderForm as action256} from "@/app/(app)/sales/orders/actions";
import {cancelOrderForm as action257} from "@/app/(app)/sales/orders/actions";
import {saveOrderHashtagsForm as action258} from "@/app/(app)/sales/orders/actions";
import {restoreCancelledOrderForm as action259} from "@/app/(app)/sales/orders/actions";
import {returnOrderToQuoteForm as action260} from "@/app/(app)/sales/orders/actions";
import {scheduleOrderDelivery as action261} from "@/app/(app)/sales/orders/actions";
import {rejectOrderApproval as action262} from "@/app/(app)/sales/orders/actions";
import {deleteOrderForm as action263} from "@/app/(app)/sales/orders/actions";
import {createQuote as action264} from "@/app/(app)/sales/quotes/actions";
import {deleteQuoteForm as action265} from "@/app/(app)/sales/quotes/actions";
import {saveCreationPolicy as action266} from "@/app/(app)/sales/settings/actions";
import {getSchedule as action267} from "@/app/(app)/scheduling/actions";
import {createBulkShifts as action268} from "@/app/(app)/scheduling/actions";
import {setScheduledShift as action269} from "@/app/(app)/scheduling/actions";
import {completeShiftTask as action270} from "@/app/(app)/scheduling/actions";
import {editScheduledShift as action271} from "@/app/(app)/scheduling/actions";
import {publishWeekShifts as action272} from "@/app/(app)/scheduling/actions";
import {saveHoursBudget as action273} from "@/app/(app)/scheduling/actions";
import {getTeamPlan as action274} from "@/app/(app)/scheduling/actions";
import {getPersonSchedule as action275} from "@/app/(app)/scheduling/actions";
import {saveWorkType as action276} from "@/app/(app)/scheduling/actions";
import {archiveWorkType as action277} from "@/app/(app)/scheduling/actions";
import {saveDemand as action278} from "@/app/(app)/scheduling/actions";
import {saveBusyRule as action279} from "@/app/(app)/scheduling/actions";
import {removeBusyRule as action280} from "@/app/(app)/scheduling/actions";
import {fillTeamMonth as action281} from "@/app/(app)/scheduling/actions";
import {replanCover as action282} from "@/app/(app)/scheduling/actions";
import {publishMonth as action283} from "@/app/(app)/scheduling/actions";
import {saveShift as action284} from "@/app/(app)/scheduling/actions";
import {saveRole as action285} from "@/app/(app)/settings/actions";
import {saveMemberRoles as action286} from "@/app/(app)/settings/actions";
import {createUser as action287} from "@/app/(app)/settings/actions";
import {saveCompanyAccess as action288} from "@/app/(app)/settings/actions";
import {saveCompanyProfile as action289} from "@/app/(app)/settings/actions";
import {saveManagerPolicy as action290} from "@/app/(app)/settings/actions";
import {saveWorkspaceDetails as action291} from "@/app/(app)/settings/actions";
import {saveCompanyBrand as action292} from "@/app/(app)/settings/actions";
import {importCsv as action293} from "@/app/(app)/settings/imports/actions";
import {saveDispatchDelivery as action294} from "@/app/(app)/settings/logistics/actions";
import {saveUserAccess as action295} from "@/app/(app)/settings/user-actions";
import {setUserStatus as action296} from "@/app/(app)/settings/user-actions";
import {revokeUserSessions as action297} from "@/app/(app)/settings/user-actions";
import {issuePasswordRecovery as action298} from "@/app/(app)/settings/user-actions";
import {createManagedUser as action299} from "@/app/(app)/settings/user-actions";
import {linkEmployeeProfile as action300} from "@/app/(app)/settings/user-actions";
import {createRole as action301} from "@/app/(app)/settings/user-actions";
import {saveManagementGroup as action302} from "@/app/(app)/settings/user-actions";
import {createWarehouse as action303} from "@/app/(app)/stock/actions";
import {adjustStock as action304} from "@/app/(app)/stock/actions";
import {transferStock as action305} from "@/app/(app)/stock/actions";
import {createSiteAction as action306} from "@/app/(app)/stock/actions";
import {createPlaceAction as action307} from "@/app/(app)/stock/actions";
import {assignSiteAction as action308} from "@/app/(app)/stock/actions";
import {addLocationAction as action309} from "@/app/(app)/stock/actions";
import {ensureLocationsAction as action310} from "@/app/(app)/stock/actions";
import {retireLocationAction as action311} from "@/app/(app)/stock/actions";
import {putOnLocationAction as action312} from "@/app/(app)/stock/actions";
import {moveLocatedAction as action313} from "@/app/(app)/stock/actions";
import {receiveMoveAction as action314} from "@/app/(app)/stock/actions";
import {delegateApprovals as action315} from "@/core/approvals/actions";
import {loginAction as action316} from "@/core/auth/actions";
import {logoutAction as action317} from "@/core/auth/actions";
import {completePasswordRecovery as action318} from "@/core/auth/security-actions";
import {changeOwnPassword as action319} from "@/core/auth/security-actions";
import {signOutOtherSessions as action320} from "@/core/auth/security-actions";
import {checkForDuplicatesAction as action321} from "@/core/customers/actions";
import {createCustomerAction as action322} from "@/core/customers/actions";
import {createCustomer as action323} from "@/core/customers/commands";
import {updateCustomerStatus as action324} from "@/core/customers/commands";
import {deleteCustomer as action325} from "@/core/customers/commands";
import {createContact as action326} from "@/core/customers/commands";
import {updateContact as action327} from "@/core/customers/commands";
import {deleteContact as action328} from "@/core/customers/commands";
import {createAddress as action329} from "@/core/customers/commands";
import {updateCommercialSettings as action330} from "@/core/customers/commands";
import {updateCreditLimit as action331} from "@/core/customers/commands";
import {setCreditHold as action332} from "@/core/customers/commands";
import {setPaymentTerm as action333} from "@/core/customers/commands";
import {createTaxRegistration as action334} from "@/core/customers/commands";
import {markTaxRegistrationManuallyVerified as action335} from "@/core/customers/commands";
import {createBankAccount as action336} from "@/core/customers/commands";
import {revealBankAccount as action337} from "@/core/customers/commands";
import {createDirectDebitMandate as action338} from "@/core/customers/commands";
import {cancelDirectDebitMandate as action339} from "@/core/customers/commands";
import {createNote as action340} from "@/core/customers/commands";
import {saveCustomerHashtags as action341} from "@/core/customers/commands";
import {saveOrderingPreferences as action342} from "@/core/customers/commercial-actions";
import {setCustomerParent as action343} from "@/core/customers/hierarchy-actions";
import {placeCustomer as action344} from "@/core/customers/hierarchy-actions";
import {moveCustomer as action345} from "@/core/customers/hierarchy-actions";
import {setContactReportsTo as action346} from "@/core/customers/hierarchy-actions";
import {saveCustomerTradingLink as action347} from "@/core/customers/trading-actions";
import {setInvoiceAccount as action348} from "@/core/customers/trading-actions";
import {archiveCustomerTradingLink as action349} from "@/core/customers/trading-actions";
import {requestSalesInvoice as action350} from "@/core/finance/actions";
import {createWorkTeam as action351} from "@/core/teams/actions";
import {loadAuditBoard as action352} from "@/modules/audit/services/actions";
import {exportAuditReport as action353} from "@/modules/audit/services/actions";
import {loadEcho as action354} from "@/modules/audit/services/actions";
import {postEchoNote as action355} from "@/modules/audit/services/actions";
import {loadEchoInbox as action356} from "@/modules/audit/services/actions";
import {loadAuditAccess as action357} from "@/modules/audit/services/actions";
import {saveAuditOwnActivity as action358} from "@/modules/audit/services/actions";
import {saveAuditAreas as action359} from "@/modules/audit/services/actions";
import {logActivity as action360} from "@/modules/crm/services/activities";
import {completeActivity as action361} from "@/modules/crm/services/activities";
import {acceptMarketingHandoff as action362} from "@/modules/crm/services/marketing-handoff";
import {createOpportunity as action363} from "@/modules/crm/services/opportunities";
import {moveOpportunityStage as action364} from "@/modules/crm/services/opportunities";
import {updateOpportunityValue as action365} from "@/modules/crm/services/opportunities";
import {updateOpportunityCloseDate as action366} from "@/modules/crm/services/opportunities";
import {setOpportunityForecastCategory as action367} from "@/modules/crm/services/opportunities";
import {setOpportunityNextAction as action368} from "@/modules/crm/services/opportunities";
import {winOpportunity as action369} from "@/modules/crm/services/opportunities";
import {loseOpportunity as action370} from "@/modules/crm/services/opportunities";
import {addStakeholder as action371} from "@/modules/crm/services/opportunities";
import {addMilestone as action372} from "@/modules/crm/services/opportunities";
import {toggleMilestone as action373} from "@/modules/crm/services/opportunities";
import {checkProspectDuplicatesAction as action374} from "@/modules/crm/services/prospects";
import {createProspect as action375} from "@/modules/crm/services/prospects";
import {assignProspect as action376} from "@/modules/crm/services/prospects";
import {setProspectLifecycleStage as action377} from "@/modules/crm/services/prospects";
import {convertProspect as action378} from "@/modules/crm/services/prospects";
import {createIndustry as action379} from "@/modules/crm/services/prospects";
import {saveProspectGrouping as action380} from "@/modules/crm/services/prospects";
import {createSalesProject as action381} from "@/modules/crm/services/sales-projects-commands";
import {updateSalesProject as action382} from "@/modules/crm/services/sales-projects-commands";
import {addOrganisationToProject as action383} from "@/modules/crm/services/sales-projects-commands";
import {addStakeholderToProject as action384} from "@/modules/crm/services/sales-projects-commands";
import {linkQuoteToProject as action385} from "@/modules/crm/services/sales-projects-commands";
import {linkOrderToProject as action386} from "@/modules/crm/services/sales-projects-commands";
import {deleteSalesProject as action387} from "@/modules/crm/services/sales-projects-commands";
import {setupFinance as action388} from "@/modules/finance/services/commands";
import {createFinanceDocument as action389} from "@/modules/finance/services/commands";
import {submitFinanceDocument as action390} from "@/modules/finance/services/commands";
import {saveApprovalPolicy as action391} from "@/modules/finance/services/commands";
import {decideFinanceApproval as action392} from "@/modules/finance/services/commands";
import {createPurchaseOrder as action393} from "@/modules/finance/services/commands";
import {raiseServiceCredit as action394} from "@/modules/finance/services/commands";
import {postFinanceDocument as action395} from "@/modules/finance/services/commands";
import {recordGoodsReceipt as action396} from "@/modules/finance/services/commands";
import {onboardSupplier as action397} from "@/modules/finance/services/commands";
import {approveSupplier as action398} from "@/modules/finance/services/commands";
import {requestSupplierBankChange as action399} from "@/modules/finance/services/commands";
import {verifySupplierBank as action400} from "@/modules/finance/services/commands";
import {createFinanceBank as action401} from "@/modules/finance/services/commands";
import {importBankTransactions as action402} from "@/modules/finance/services/commands";
import {allocateBankTransaction as action403} from "@/modules/finance/services/commands";
import {createPaymentRun as action404} from "@/modules/finance/services/commands";
import {approvePaymentRun as action405} from "@/modules/finance/services/commands";
import {createManualJournal as action406} from "@/modules/finance/services/commands";
import {approveManualJournal as action407} from "@/modules/finance/services/commands";
import {reverseJournal as action408} from "@/modules/finance/services/commands";
import {setFinancePeriodState as action409} from "@/modules/finance/services/commands";
import {saveFinanceBudget as action410} from "@/modules/finance/services/commands";
import {saveFinanceAsset as action411} from "@/modules/finance/services/commands";
import {postAssetDepreciation as action412} from "@/modules/finance/services/commands";
import {completeCloseTask as action413} from "@/modules/finance/services/commands";
import {saveFinanceContract as action414} from "@/modules/finance/services/commands";
import {saveFinanceScenario as action415} from "@/modules/finance/services/commands";
import {receiptForm as action416} from "@/modules/finance/services/commands";
import {journalForm as action417} from "@/modules/finance/services/commands";
import {statementForm as action418} from "@/modules/finance/services/commands";
import {allocationForm as action419} from "@/modules/finance/services/commands";
import {paymentRunForm as action420} from "@/modules/finance/services/commands";
import {policyForm as action421} from "@/modules/finance/services/commands";
import {scenarioForm as action422} from "@/modules/finance/services/commands";
import {uploadFinanceAttachment as action423} from "@/modules/finance/services/commands";
import {generateSalesInvoice as action424} from "@/modules/finance/services/commands";
import {generateInvoiceAdjustment as action425} from "@/modules/finance/services/commands";
import {voidFinanceDraft as action426} from "@/modules/finance/services/commands";
import {getFinanceHome as action427} from "@/modules/finance/services/queries";
import {listFinanceDocuments as action428} from "@/modules/finance/services/queries";
import {getFinanceDocument as action429} from "@/modules/finance/services/queries";
import {getFinanceWorkspace as action430} from "@/modules/finance/services/queries";
import {financeChoices as action431} from "@/modules/finance/services/queries";
import {getBudgetPositions as action432} from "@/modules/finance/services/queries";
import {getInvoiceCashForecast as action433} from "@/modules/finance/services/queries";
import {getFinancialReport as action434} from "@/modules/finance/services/queries";
import {getFinanceCustomerContribution as action435} from "@/modules/finance/services/queries";
import {searchFinance as action436} from "@/modules/finance/services/queries";
import {getFinanceAttachment as action437} from "@/modules/finance/services/queries";
import {getSalesFinanceProjection as action438} from "@/modules/finance/services/queries";
import {getReceivingWarehouses as action439} from "@/modules/finance/services/queries";
import {createProductionOrder as action440} from "@/modules/manufacturing/services/commands";
import {markOrderReady as action441} from "@/modules/manufacturing/services/commands";
import {releaseOrder as action442} from "@/modules/manufacturing/services/commands";
import {closeOrder as action443} from "@/modules/manufacturing/services/commands";
import {startWorkOrder as action444} from "@/modules/manufacturing/services/commands";
import {pauseWorkOrder as action445} from "@/modules/manufacturing/services/commands";
import {completeWorkOrder as action446} from "@/modules/manufacturing/services/commands";
import {listForecasts as action447} from "@/modules/manufacturing/services/forecast";
import {setForecast as action448} from "@/modules/manufacturing/services/forecast";
import {deleteForecast as action449} from "@/modules/manufacturing/services/forecast";
import {runMrp as action450} from "@/modules/manufacturing/services/mrp";
import {firmSuggestion as action451} from "@/modules/manufacturing/services/mrp";
import {dismissSuggestion as action452} from "@/modules/manufacturing/services/mrp";
import {latestPlan as action453} from "@/modules/manufacturing/services/mrp";
import {loadPlant as action454} from "@/modules/manufacturing/services/plant";
import {saveWorkCentre as action455} from "@/modules/manufacturing/services/plant";
import {saveMachine as action456} from "@/modules/manufacturing/services/plant";
import {retirePlantRecord as action457} from "@/modules/manufacturing/services/plant";
import {schedulePreview as action458} from "@/modules/manufacturing/services/scheduler";
import {rescheduleWorkOrder as action459} from "@/modules/manufacturing/services/scheduler";
import {setWorkOrderLock as action460} from "@/modules/manufacturing/services/scheduler";
import {listShifts as action461} from "@/modules/manufacturing/services/shifts";
import {saveShift as action462} from "@/modules/manufacturing/services/shifts";
import {deleteShift as action463} from "@/modules/manufacturing/services/shifts";
import {createCampaign as action464} from "@/modules/marketing/services/commands";
import {updateCampaign as action465} from "@/modules/marketing/services/commands";
import {createProfile as action466} from "@/modules/marketing/services/commands";
import {recordPermission as action467} from "@/modules/marketing/services/commands";
import {suppressProfile as action468} from "@/modules/marketing/services/commands";
import {createAudience as action469} from "@/modules/marketing/services/commands";
import {previewAudience as action470} from "@/modules/marketing/services/commands";
import {createContent as action471} from "@/modules/marketing/services/commands";
import {approveContent as action472} from "@/modules/marketing/services/commands";
import {createMessage as action473} from "@/modules/marketing/services/commands";
import {lockSend as action474} from "@/modules/marketing/services/commands";
import {cancelSend as action475} from "@/modules/marketing/services/commands";
import {ingestEvent as action476} from "@/modules/marketing/services/commands";
import {createJourney as action477} from "@/modules/marketing/services/commands";
import {publishJourney as action478} from "@/modules/marketing/services/commands";
import {reviseJourney as action479} from "@/modules/marketing/services/commands";
import {createProgram as action480} from "@/modules/marketing/services/commands";
import {createExperiment as action481} from "@/modules/marketing/services/commands";
import {leadFeedback as action482} from "@/modules/marketing/services/commands";
import {processJourneySteps as action483} from "@/modules/marketing/services/commands";
import {saveMarketingPlan as action484} from "@/modules/marketing/services/commands";
import {addPlanActivity as action485} from "@/modules/marketing/services/commands";
import {updatePlanActivity as action486} from "@/modules/marketing/services/commands";
import {addBudgetLine as action487} from "@/modules/marketing/services/commands";
import {submitBudgetToFinance as action488} from "@/modules/marketing/services/commands";
import {createJourneyMap as action489} from "@/modules/marketing/services/commands";
import {addJourneyStage as action490} from "@/modules/marketing/services/commands";
import {addJourneyTouch as action491} from "@/modules/marketing/services/commands";
import {getApprovedExpenseSource as action492} from "@/modules/people/services/finance-expenses";
import {createPlan as action493} from "@/modules/plan/services/commands";
import {saveCell as action494} from "@/modules/plan/services/commands";
import {addMeasure as action495} from "@/modules/plan/services/commands";
import {addAssumption as action496} from "@/modules/plan/services/commands";
import {addDriver as action497} from "@/modules/plan/services/commands";
import {addLink as action498} from "@/modules/plan/services/commands";
import {createScenario as action499} from "@/modules/plan/services/commands";
import {promoteScenario as action500} from "@/modules/plan/services/commands";
import {submitPlan as action501} from "@/modules/plan/services/commands";
import {approvePlan as action502} from "@/modules/plan/services/commands";
import {lockPlan as action503} from "@/modules/plan/services/commands";
import {addGoal as action504} from "@/modules/plan/services/commands";
import {addInitiative as action505} from "@/modules/plan/services/commands";
import {createProjectForInitiative as action506} from "@/modules/plan/services/commands";
import {addAction as action507} from "@/modules/plan/services/commands";
import {completeAction as action508} from "@/modules/plan/services/commands";
import {addRisk as action509} from "@/modules/plan/services/commands";
import {addDependency as action510} from "@/modules/plan/services/commands";
import {addDecision as action511} from "@/modules/plan/services/commands";
import {addComment as action512} from "@/modules/plan/services/commands";
import {addUpdate as action513} from "@/modules/plan/services/commands";
import {completeReview as action514} from "@/modules/plan/services/commands";
import {addReview as action515} from "@/modules/plan/services/commands";
import {distributeTargets as action516} from "@/modules/plan/services/commands";
import {importGrid as action517} from "@/modules/plan/services/commands";
import {sharePlan as action518} from "@/modules/plan/services/commands";
import {unsharePlan as action519} from "@/modules/plan/services/commands";
import {setPlanAudience as action520} from "@/modules/plan/services/commands";
import {addNote as action521} from "@/modules/plan/services/commands";
import {saveGoalProgress as action522} from "@/modules/plan/services/commands";
import {savePlanBrief as action523} from "@/modules/plan/services/commands";
import {listProductionPlans as action524} from "@/modules/planning/services/plans";
import {getPlanOptions as action525} from "@/modules/planning/services/plans";
import {getProductionPlan as action526} from "@/modules/planning/services/plans";
import {createProductionPlan as action527} from "@/modules/planning/services/plans";
import {addProductionPlanLine as action528} from "@/modules/planning/services/plans";
import {getAssignedPlanningWork as action529} from "@/modules/planning/services/plans";
import {getPlanningCoverage as action530} from "@/modules/planning/services/queries";
import {saveProductRecipe as action531} from "@/modules/products/services/make";
import {createSpecification as action532} from "@/modules/quality/services/commands";
import {setSpecificationStatus as action533} from "@/modules/quality/services/commands";
import {createControlPoint as action534} from "@/modules/quality/services/commands";
import {executeInspection as action535} from "@/modules/quality/services/commands";
import {releaseHold as action536} from "@/modules/quality/services/commands";
import {reportNcr as action537} from "@/modules/quality/services/commands";
import {updateNcrInvestigation as action538} from "@/modules/quality/services/commands";
import {addNcrAction as action539} from "@/modules/quality/services/commands";
import {updateNcrAction as action540} from "@/modules/quality/services/commands";
import {closeNcr as action541} from "@/modules/quality/services/commands";
import {saveSubstance as action542} from "@/modules/safety/services/assurance";
import {addSafetyDataSheet as action543} from "@/modules/safety/services/assurance";
import {saveCoshhAssessment as action544} from "@/modules/safety/services/assurance";
import {approveSubstance as action545} from "@/modules/safety/services/assurance";
import {saveCompetence as action546} from "@/modules/safety/services/assurance";
import {saveSafetyDocument as action547} from "@/modules/safety/services/assurance";
import {acknowledgeDocument as action548} from "@/modules/safety/services/assurance";
import {saveAudit as action549} from "@/modules/safety/services/assurance";
import {addAuditFinding as action550} from "@/modules/safety/services/assurance";
import {approveAudit as action551} from "@/modules/safety/services/assurance";
import {saveChange as action552} from "@/modules/safety/services/assurance";
import {advanceChange as action553} from "@/modules/safety/services/assurance";
import {linkSafetyRecord as action554} from "@/modules/safety/services/assurance";
import {saveSafetyProfile as action555} from "@/modules/safety/services/commands";
import {saveRiskMatrix as action556} from "@/modules/safety/services/commands";
import {createRisk as action557} from "@/modules/safety/services/commands";
import {addControl as action558} from "@/modules/safety/services/commands";
import {rateAssessment as action559} from "@/modules/safety/services/commands";
import {approveAssessment as action560} from "@/modules/safety/services/commands";
import {reviseAssessment as action561} from "@/modules/safety/services/commands";
import {requestRiskReview as action562} from "@/modules/safety/services/commands";
import {reportIncident as action563} from "@/modules/safety/services/commands";
import {saveImmediateControl as action564} from "@/modules/safety/services/commands";
import {openInvestigation as action565} from "@/modules/safety/services/commands";
import {addCause as action566} from "@/modules/safety/services/commands";
import {saveRootCause as action567} from "@/modules/safety/services/commands";
import {reviewRiddor as action568} from "@/modules/safety/services/commands";
import {createSafetyAction as action569} from "@/modules/safety/services/commands";
import {advanceAction as action570} from "@/modules/safety/services/commands";
import {verifyAction as action571} from "@/modules/safety/services/commands";
import {saveWorkplaceRecord as action572} from "@/modules/safety/services/commands";
import {createPermit as action573} from "@/modules/safety/services/control";
import {advancePermit as action574} from "@/modules/safety/services/control";
import {extendPermit as action575} from "@/modules/safety/services/control";
import {createIsolation as action576} from "@/modules/safety/services/control";
import {applyIsolationLock as action577} from "@/modules/safety/services/control";
import {verifyIsolation as action578} from "@/modules/safety/services/control";
import {clearIsolation as action579} from "@/modules/safety/services/control";
import {removeIsolationLock as action580} from "@/modules/safety/services/control";
import {placeSafetyHold as action581} from "@/modules/safety/services/control";
import {updateReturnToService as action582} from "@/modules/safety/services/control";
import {releaseSafetyHold as action583} from "@/modules/safety/services/control";
import {overrideSafetyHold as action584} from "@/modules/safety/services/control";
import {saveStatutoryCheck as action585} from "@/modules/safety/services/control";
import {completeInspection as action586} from "@/modules/safety/services/control";
import {createInspection as action587} from "@/modules/safety/services/control";
import {createSalesAddress as action588} from "@/modules/sales/services/address-actions";
import {createSalesCatalogueProduct as action589} from "@/modules/sales/services/catalogue-actions";
import {sendQuote as action590} from "@/modules/sales/services/commands";
import {changeQuoteStatus as action591} from "@/modules/sales/services/commands";
import {deleteQuote as action592} from "@/modules/sales/services/commands";
import {duplicateDocument as action593} from "@/modules/sales/services/commands";
import {saveQuoteTemplate as action594} from "@/modules/sales/services/commands";
import {createOrderFromQuote as action595} from "@/modules/sales/services/commands";
import {linkCommercialProject as action596} from "@/modules/sales/services/commercial";
import {openCallOffOrder as action597} from "@/modules/sales/services/commercial";
import {raiseCallOff as action598} from "@/modules/sales/services/commercial";
import {invoiceCallOffDelivery as action599} from "@/modules/sales/services/commercial";
import {deliverAndInvoiceCallOff as action600} from "@/modules/sales/services/commercial";
import {saveDocument as action601} from "@/modules/sales/services/documents";
import {saveInvoiceTemplate as action602} from "@/modules/sales/services/invoice-template-actions";
import {retireInvoiceTemplate as action603} from "@/modules/sales/services/invoice-template-actions";
import {attachCustomerInvoiceTemplate as action604} from "@/modules/sales/services/invoice-template-actions";
import {detachCustomerInvoiceTemplate as action605} from "@/modules/sales/services/invoice-template-actions";
import {createDraftOrder as action606} from "@/modules/sales/services/orders";
import {addOrderLine as action607} from "@/modules/sales/services/orders";
import {removeOrderLine as action608} from "@/modules/sales/services/orders";
import {updateDraftOrderFields as action609} from "@/modules/sales/services/orders";
import {confirmOrder as action610} from "@/modules/sales/services/orders";
import {decideApproval as action611} from "@/modules/sales/services/orders";
import {amendLineQuantity as action612} from "@/modules/sales/services/orders";
import {overrideLinePrice as action613} from "@/modules/sales/services/orders";
import {amendRequestedDate as action614} from "@/modules/sales/services/orders";
import {cancelOrder as action615} from "@/modules/sales/services/orders";
import {deleteOrder as action616} from "@/modules/sales/services/orders";
import {cancelLineRemaining as action617} from "@/modules/sales/services/orders";
import {addHold as action618} from "@/modules/sales/services/orders";
import {releaseHold as action619} from "@/modules/sales/services/orders";
import {restoreCancelledOrder as action620} from "@/modules/sales/services/rewind";
import {returnOrderToQuote as action621} from "@/modules/sales/services/rewind";
import {saveOrderHashtags as action622} from "@/modules/sales/services/rewind";
import {saveSalesView as action623} from "@/modules/sales/services/saved-views";
import {archiveSalesView as action624} from "@/modules/sales/services/saved-views";
import {createCase as action625} from "@/modules/service/services/commands";
import {updateCase as action626} from "@/modules/service/services/commands";
import {assignCase as action627} from "@/modules/service/services/commands";
import {transitionCase as action628} from "@/modules/service/services/commands";
import {addCaseEntry as action629} from "@/modules/service/services/commands";
import {createDepartmentTicket as action630} from "@/modules/service/services/commands";
import {updateDepartmentTicket as action631} from "@/modules/service/services/commands";
import {createQueue as action632} from "@/modules/service/services/commands";
import {addQueueMember as action633} from "@/modules/service/services/commands";
import {linkCaseRecord as action634} from "@/modules/service/services/commands";
import {creditChoices as action635} from "@/modules/service/services/commands";
import {askFinanceForCredit as action636} from "@/modules/service/services/commands";
import {getCaseOwners as action637} from "@/modules/service/services/commands";
import {getDepartmentWork as action638} from "@/modules/service/services/commands";
import {readAvailability as action639} from "@/modules/stock/services/availability";
import {readOrderChain as action640} from "@/modules/stock/services/availability";
import {inventoryExportRows as action641} from "@/modules/stock/services/export";
import {createTeam as action642} from "@/modules/teams/services/commands";
import {renameTeam as action643} from "@/modules/teams/services/commands";
import {addMember as action644} from "@/modules/teams/services/commands";
import {removeMember as action645} from "@/modules/teams/services/commands";
import {saveTask as action646} from "@/modules/teams/services/commands";
import {setTaskStatus as action647} from "@/modules/teams/services/commands";
import {removeTask as action648} from "@/modules/teams/services/commands";
import {saveCover as action649} from "@/modules/teams/services/commands";
import {removeCover as action650} from "@/modules/teams/services/commands";
import {saveHandover as action651} from "@/modules/teams/services/commands";
import {savePlace as action652} from "@/modules/teams/services/commands";
import {saveMoment as action653} from "@/modules/teams/services/commands";
import {removeMoment as action654} from "@/modules/teams/services/commands";
export const DATA_ACTIONS:Record<string,(...args:never[])=>Promise<unknown>>={
"src/app/(app)/analytics/actions:loadLiveMetrics":action0 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:loadMetricSlice":action1 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:saveAnalyticsDashboard":action2 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/analytics/actions:deleteAnalyticsDashboard":action3 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/apps/actions:toggleModuleAction":action4 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/actions:updateCompanyAccount":action5 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/actions:saveCompanyEntitlements":action6 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/actions:createCompanyAccount":action7 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/setup-actions:importCompanySetup":action8 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/setup-actions:createCompanyUser":action9 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/setup-actions:setCompanyUserStatus":action10 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:postMessage":action11 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:searchChatPeople":action12 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:openChat":action13 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:openDirectChat":action14 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:searchChatRecords":action15 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:sendChat":action16 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:chatSnapshot":action17 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:updateValueFormAction":action18 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:updateCloseDateFormAction":action19 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:setNextActionFormAction":action20 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:setForecastCategoryFormAction":action21 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:winFormAction":action22 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:loseFormAction":action23 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:addStakeholderFormAction":action24 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:addMilestoneFormAction":action25 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:toggleMilestoneFormAction":action26 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:logOpportunityActivityFormAction":action27 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/projects/new/actions:createSalesProjectAction":action28 as (...args:never[])=>Promise<unknown>,
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
"src/app/(app)/manufacturing/schedule/scheduler-actions:previewMoveAction":action104 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:commitMoveAction":action105 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:toggleLockAction":action106 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:saveShiftAction":action107 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:deleteShiftAction":action108 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:startAction":action109 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:pauseAction":action110 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:completeAction":action111 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:loadNotices":action112 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotice":action113 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotices":action114 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:createPayrollRun":action115 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:updatePayslipDeductions":action116 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:finalisePayrollRun":action117 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:markPayrollRunPaid":action118 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:savePayrollSettings":action119 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP45":action120 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP60":action121 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:logAbsence":action122 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:requestLeave":action123 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:cancelOwnLeave":action124 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:approveLeaveRequest":action125 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:setLeaveAllowance":action126 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:rejectLeaveRequest":action127 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:createEmployee":action128 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:changeEmployeeStatus":action129 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeProfile":action130 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateOwnEmployeeDetails":action131 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeDocument":action132 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:linkEmployeeToUser":action133 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:completeEmployeeTask":action134 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeTask":action135 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeContact":action136 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeTask":action137 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:scheduleAppraisal":action138 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:completeAppraisal":action139 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getConductDesk":action140 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getMyConduct":action141 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getPlan":action142 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getCase":action143 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:conductChoices":action144 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:savePlan":action145 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addPlanReview":action146 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:commentOnPlan":action147 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:saveCase":action148 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:respondToCase":action149 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addCaseEvent":action150 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:submitExpenseClaim":action151 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:approveExpenseClaim":action152 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:rejectExpenseClaim":action153 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:scheduleOneToOne":action154 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:completeOneToOne":action155 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:listPolicies":action156 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:publishPolicy":action157 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:archivePolicy":action158 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:openPolicy":action159 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:createShift":action160 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:changeShiftStatus":action161 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyHR":action162 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyTeam":action163 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getTeamEmployee":action164 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:addPrivateNote":action165 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:updateWorkingPattern":action166 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:updateHrSettings":action167 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createAppraisalTemplate":action168 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleAppraisalTemplateActive":action169 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createOneToOneTemplate":action170 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleOneToOneTemplateActive":action171 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:getTimesheetContext":action172 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:saveTimesheet":action173 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:reviewTimesheet":action174 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:createPriceList":action175 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:savePriceEntry":action176 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveRule":action177 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:setRuleActive":action178 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:updatePriceBasis":action179 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:assignPriceList":action180 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewPriceCsv":action181 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyPriceCsv":action182 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreement":action183 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreementPrice":action184 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:removeAgreementPrice":action185 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewAgreementCsv":action186 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyAgreementCsv":action187 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProduct":action188 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProductRecord":action189 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveCategory":action190 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:retireCategory":action191 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:addStandardCategories":action192 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:savePack":action193 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveLinks":action194 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveMeasures":action195 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/actions:saveProfile":action196 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/work:loadAssignedWork":action197 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProject":action198 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeProjectStatus":action199 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editProject":action200 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProjectMember":action201 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:archiveProject":action202 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTask":action203 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeTaskStatus":action204 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editTask":action205 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:checklistItem":action206 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addDependency":action207 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMeeting":action208 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDocument":action209 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editDocument":action210 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addComment":action211 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMilestone":action212 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:publishUpdate":action213 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDecision":action214 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:decide":action215 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createRisk":action216 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:closeRisk":action217 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:requestApproval":action218 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:respondApproval":action219 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:submitRequest":action220 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:triageRequest":action221 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:logTime":action222 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:planToday":action223 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:updateInbox":action224 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveView":action225 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createPortfolio":action226 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createBaseline":action227 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setBudget":action228 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:linkWork":action229 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectActivity":action230 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createAutomation":action231 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:toggleAutomation":action232 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveProjectTemplate":action233 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:useProjectTemplate":action234 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:startTimer":action235 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:stopTimer":action236 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:projectPreference":action237 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:uploadProjectFile":action238 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:readProjectFile":action239 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProperty":action240 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProperty":action241 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:restoreDocument":action242 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTaskFromDocument":action243 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:discardTimer":action244 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:completeMilestone":action245 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:resolveComment":action246 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectWorkload":action247 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:createOrderForm":action248 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addLineForm":action249 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:removeLineForm":action250 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:confirmOrderForm":action251 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:updateOrderForm":action252 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:chooseOrderAddresses":action253 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addHoldForm":action254 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:releaseHoldForm":action255 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:approveOrderForm":action256 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:cancelOrderForm":action257 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:saveOrderHashtagsForm":action258 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:restoreCancelledOrderForm":action259 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:returnOrderToQuoteForm":action260 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:scheduleOrderDelivery":action261 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:rejectOrderApproval":action262 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:deleteOrderForm":action263 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:createQuote":action264 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:deleteQuoteForm":action265 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/settings/actions:saveCreationPolicy":action266 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getSchedule":action267 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:createBulkShifts":action268 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:setScheduledShift":action269 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:completeShiftTask":action270 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:editScheduledShift":action271 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishWeekShifts":action272 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveHoursBudget":action273 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getTeamPlan":action274 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getPersonSchedule":action275 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveWorkType":action276 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:archiveWorkType":action277 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveDemand":action278 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveBusyRule":action279 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:removeBusyRule":action280 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:fillTeamMonth":action281 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:replanCover":action282 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishMonth":action283 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveShift":action284 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveRole":action285 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveMemberRoles":action286 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:createUser":action287 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyAccess":action288 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyProfile":action289 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveManagerPolicy":action290 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveWorkspaceDetails":action291 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyBrand":action292 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/imports/actions:importCsv":action293 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/logistics/actions:saveDispatchDelivery":action294 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveUserAccess":action295 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:setUserStatus":action296 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:revokeUserSessions":action297 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:issuePasswordRecovery":action298 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createManagedUser":action299 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:linkEmployeeProfile":action300 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createRole":action301 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveManagementGroup":action302 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createWarehouse":action303 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:adjustStock":action304 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:transferStock":action305 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createSiteAction":action306 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createPlaceAction":action307 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:assignSiteAction":action308 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:addLocationAction":action309 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:ensureLocationsAction":action310 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:retireLocationAction":action311 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:putOnLocationAction":action312 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:moveLocatedAction":action313 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:receiveMoveAction":action314 as (...args:never[])=>Promise<unknown>,
"src/core/approvals/actions:delegateApprovals":action315 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:loginAction":action316 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:logoutAction":action317 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:completePasswordRecovery":action318 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:changeOwnPassword":action319 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:signOutOtherSessions":action320 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:checkForDuplicatesAction":action321 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:createCustomerAction":action322 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createCustomer":action323 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerStatus":action324 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteCustomer":action325 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createContact":action326 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateContact":action327 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteContact":action328 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createAddress":action329 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCommercialSettings":action330 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCreditLimit":action331 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setCreditHold":action332 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setPaymentTerm":action333 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createTaxRegistration":action334 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:markTaxRegistrationManuallyVerified":action335 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createBankAccount":action336 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:revealBankAccount":action337 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createDirectDebitMandate":action338 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:cancelDirectDebitMandate":action339 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createNote":action340 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:saveCustomerHashtags":action341 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commercial-actions:saveOrderingPreferences":action342 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setCustomerParent":action343 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:placeCustomer":action344 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:moveCustomer":action345 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setContactReportsTo":action346 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:saveCustomerTradingLink":action347 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:setInvoiceAccount":action348 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:archiveCustomerTradingLink":action349 as (...args:never[])=>Promise<unknown>,
"src/core/finance/actions:requestSalesInvoice":action350 as (...args:never[])=>Promise<unknown>,
"src/core/teams/actions:createWorkTeam":action351 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditBoard":action352 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:exportAuditReport":action353 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEcho":action354 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:postEchoNote":action355 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEchoInbox":action356 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditAccess":action357 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditOwnActivity":action358 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditAreas":action359 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:logActivity":action360 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:completeActivity":action361 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/marketing-handoff:acceptMarketingHandoff":action362 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:createOpportunity":action363 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:moveOpportunityStage":action364 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityValue":action365 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityCloseDate":action366 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityForecastCategory":action367 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityNextAction":action368 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:winOpportunity":action369 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:loseOpportunity":action370 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addStakeholder":action371 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addMilestone":action372 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:toggleMilestone":action373 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:checkProspectDuplicatesAction":action374 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createProspect":action375 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:assignProspect":action376 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:setProspectLifecycleStage":action377 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:convertProspect":action378 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createIndustry":action379 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:saveProspectGrouping":action380 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProject":action381 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:updateSalesProject":action382 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addOrganisationToProject":action383 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addStakeholderToProject":action384 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:linkQuoteToProject":action385 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:linkOrderToProject":action386 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:deleteSalesProject":action387 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setupFinance":action388 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceDocument":action389 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:submitFinanceDocument":action390 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveApprovalPolicy":action391 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:decideFinanceApproval":action392 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPurchaseOrder":action393 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:raiseServiceCredit":action394 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postFinanceDocument":action395 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:recordGoodsReceipt":action396 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:onboardSupplier":action397 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveSupplier":action398 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:requestSupplierBankChange":action399 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:verifySupplierBank":action400 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceBank":action401 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:importBankTransactions":action402 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocateBankTransaction":action403 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPaymentRun":action404 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approvePaymentRun":action405 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createManualJournal":action406 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveManualJournal":action407 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:reverseJournal":action408 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setFinancePeriodState":action409 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceBudget":action410 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceAsset":action411 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postAssetDepreciation":action412 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:completeCloseTask":action413 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceContract":action414 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceScenario":action415 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:receiptForm":action416 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:journalForm":action417 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:statementForm":action418 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocationForm":action419 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:paymentRunForm":action420 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:policyForm":action421 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:scenarioForm":action422 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:uploadFinanceAttachment":action423 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateSalesInvoice":action424 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateInvoiceAdjustment":action425 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:voidFinanceDraft":action426 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceHome":action427 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:listFinanceDocuments":action428 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceDocument":action429 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceWorkspace":action430 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:financeChoices":action431 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getBudgetPositions":action432 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getInvoiceCashForecast":action433 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinancialReport":action434 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceCustomerContribution":action435 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:searchFinance":action436 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceAttachment":action437 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getSalesFinanceProjection":action438 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getReceivingWarehouses":action439 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:createProductionOrder":action440 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:markOrderReady":action441 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:releaseOrder":action442 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:closeOrder":action443 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:startWorkOrder":action444 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:pauseWorkOrder":action445 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:completeWorkOrder":action446 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:listForecasts":action447 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:setForecast":action448 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:deleteForecast":action449 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:runMrp":action450 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:firmSuggestion":action451 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:dismissSuggestion":action452 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:latestPlan":action453 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:loadPlant":action454 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveWorkCentre":action455 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveMachine":action456 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:retirePlantRecord":action457 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:schedulePreview":action458 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:rescheduleWorkOrder":action459 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:setWorkOrderLock":action460 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:listShifts":action461 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:saveShift":action462 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:deleteShift":action463 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createCampaign":action464 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updateCampaign":action465 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProfile":action466 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:recordPermission":action467 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:suppressProfile":action468 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createAudience":action469 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:previewAudience":action470 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createContent":action471 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:approveContent":action472 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createMessage":action473 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:lockSend":action474 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:cancelSend":action475 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:ingestEvent":action476 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourney":action477 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:publishJourney":action478 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:reviseJourney":action479 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProgram":action480 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createExperiment":action481 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:leadFeedback":action482 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:processJourneySteps":action483 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:saveMarketingPlan":action484 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addPlanActivity":action485 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updatePlanActivity":action486 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addBudgetLine":action487 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:submitBudgetToFinance":action488 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourneyMap":action489 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyStage":action490 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyTouch":action491 as (...args:never[])=>Promise<unknown>,
"src/modules/people/services/finance-expenses:getApprovedExpenseSource":action492 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createPlan":action493 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveCell":action494 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addMeasure":action495 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAssumption":action496 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDriver":action497 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addLink":action498 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createScenario":action499 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:promoteScenario":action500 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:submitPlan":action501 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:approvePlan":action502 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:lockPlan":action503 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addGoal":action504 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addInitiative":action505 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createProjectForInitiative":action506 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAction":action507 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeAction":action508 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addRisk":action509 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDependency":action510 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDecision":action511 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addComment":action512 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addUpdate":action513 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeReview":action514 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addReview":action515 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:distributeTargets":action516 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:importGrid":action517 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:sharePlan":action518 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:unsharePlan":action519 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:setPlanAudience":action520 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addNote":action521 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveGoalProgress":action522 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:savePlanBrief":action523 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:listProductionPlans":action524 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getPlanOptions":action525 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getProductionPlan":action526 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:createProductionPlan":action527 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:addProductionPlanLine":action528 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getAssignedPlanningWork":action529 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/queries:getPlanningCoverage":action530 as (...args:never[])=>Promise<unknown>,
"src/modules/products/services/make:saveProductRecipe":action531 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createSpecification":action532 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:setSpecificationStatus":action533 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createControlPoint":action534 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:executeInspection":action535 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:releaseHold":action536 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:reportNcr":action537 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrInvestigation":action538 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:addNcrAction":action539 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrAction":action540 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:closeNcr":action541 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSubstance":action542 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addSafetyDataSheet":action543 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCoshhAssessment":action544 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveSubstance":action545 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCompetence":action546 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSafetyDocument":action547 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:acknowledgeDocument":action548 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveAudit":action549 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addAuditFinding":action550 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveAudit":action551 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveChange":action552 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:advanceChange":action553 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:linkSafetyRecord":action554 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveSafetyProfile":action555 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRiskMatrix":action556 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createRisk":action557 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addControl":action558 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:rateAssessment":action559 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:approveAssessment":action560 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviseAssessment":action561 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:requestRiskReview":action562 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reportIncident":action563 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveImmediateControl":action564 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:openInvestigation":action565 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addCause":action566 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRootCause":action567 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviewRiddor":action568 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createSafetyAction":action569 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:advanceAction":action570 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:verifyAction":action571 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveWorkplaceRecord":action572 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createPermit":action573 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:advancePermit":action574 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:extendPermit":action575 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createIsolation":action576 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:applyIsolationLock":action577 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:verifyIsolation":action578 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:clearIsolation":action579 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:removeIsolationLock":action580 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:placeSafetyHold":action581 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:updateReturnToService":action582 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:releaseSafetyHold":action583 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:overrideSafetyHold":action584 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:saveStatutoryCheck":action585 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:completeInspection":action586 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createInspection":action587 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/address-actions:createSalesAddress":action588 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/catalogue-actions:createSalesCatalogueProduct":action589 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:sendQuote":action590 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:changeQuoteStatus":action591 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:deleteQuote":action592 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:duplicateDocument":action593 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:saveQuoteTemplate":action594 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:createOrderFromQuote":action595 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:linkCommercialProject":action596 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:openCallOffOrder":action597 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:raiseCallOff":action598 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:invoiceCallOffDelivery":action599 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:deliverAndInvoiceCallOff":action600 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/documents:saveDocument":action601 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:saveInvoiceTemplate":action602 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:retireInvoiceTemplate":action603 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:attachCustomerInvoiceTemplate":action604 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:detachCustomerInvoiceTemplate":action605 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:createDraftOrder":action606 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addOrderLine":action607 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:removeOrderLine":action608 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:updateDraftOrderFields":action609 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:confirmOrder":action610 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:decideApproval":action611 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendLineQuantity":action612 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:overrideLinePrice":action613 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendRequestedDate":action614 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelOrder":action615 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:deleteOrder":action616 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelLineRemaining":action617 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addHold":action618 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:releaseHold":action619 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:restoreCancelledOrder":action620 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:returnOrderToQuote":action621 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:saveOrderHashtags":action622 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:saveSalesView":action623 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:archiveSalesView":action624 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createCase":action625 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateCase":action626 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:assignCase":action627 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:transitionCase":action628 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addCaseEntry":action629 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createDepartmentTicket":action630 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateDepartmentTicket":action631 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createQueue":action632 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addQueueMember":action633 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:linkCaseRecord":action634 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:creditChoices":action635 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:askFinanceForCredit":action636 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getCaseOwners":action637 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getDepartmentWork":action638 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readAvailability":action639 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readOrderChain":action640 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/export:inventoryExportRows":action641 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:createTeam":action642 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:renameTeam":action643 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:addMember":action644 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMember":action645 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveTask":action646 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:setTaskStatus":action647 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeTask":action648 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveCover":action649 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeCover":action650 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveHandover":action651 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:savePlace":action652 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveMoment":action653 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMoment":action654 as (...args:never[])=>Promise<unknown>
};
