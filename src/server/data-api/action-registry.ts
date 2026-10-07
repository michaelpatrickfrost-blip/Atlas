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
import {importCompanySetup as action25} from "@/app/(app)/atlas/setup-actions";
import {createCompanyUser as action26} from "@/app/(app)/atlas/setup-actions";
import {setCompanyUserStatus as action27} from "@/app/(app)/atlas/setup-actions";
import {postMessage as action28} from "@/app/(app)/chat/actions";
import {searchChatPeople as action29} from "@/app/(app)/chat/actions";
import {openChat as action30} from "@/app/(app)/chat/actions";
import {openDirectChat as action31} from "@/app/(app)/chat/actions";
import {searchChatRecords as action32} from "@/app/(app)/chat/actions";
import {sendChat as action33} from "@/app/(app)/chat/actions";
import {chatSnapshot as action34} from "@/app/(app)/chat/actions";
import {updateValueFormAction as action35} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {updateCloseDateFormAction as action36} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {setNextActionFormAction as action37} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {setForecastCategoryFormAction as action38} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {winFormAction as action39} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {loseFormAction as action40} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addStakeholderFormAction as action41} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addMilestoneFormAction as action42} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {toggleMilestoneFormAction as action43} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {logOpportunityActivityFormAction as action44} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addDealAction as action45} from "@/app/(app)/crm/pipeline/actions";
import {qualifyFormAction as action46} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {disqualifyFormAction as action47} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {nurtureFormAction as action48} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {logProspectActivityFormAction as action49} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {assignProspectFormAction as action50} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {assignProspectTaskFormAction as action51} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {convertProspectFormAction as action52} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {pinReportToDashboard as action53} from "@/app/(app)/crm/reports/actions";
import {createContactFormAction as action54} from "@/app/(app)/customers/[partyId]/actions";
import {updateContactFormAction as action55} from "@/app/(app)/customers/[partyId]/actions";
import {deleteContactFormAction as action56} from "@/app/(app)/customers/[partyId]/actions";
import {createAddressFormAction as action57} from "@/app/(app)/customers/[partyId]/actions";
import {createTaxRegistrationFormAction as action58} from "@/app/(app)/customers/[partyId]/actions";
import {markTaxVerifiedFormAction as action59} from "@/app/(app)/customers/[partyId]/actions";
import {createBankAccountFormAction as action60} from "@/app/(app)/customers/[partyId]/actions";
import {createDirectDebitFormAction as action61} from "@/app/(app)/customers/[partyId]/actions";
import {cancelDirectDebitFormAction as action62} from "@/app/(app)/customers/[partyId]/actions";
import {updateCreditLimitFormAction as action63} from "@/app/(app)/customers/[partyId]/actions";
import {toggleCreditHoldFormAction as action64} from "@/app/(app)/customers/[partyId]/actions";
import {createNoteFormAction as action65} from "@/app/(app)/customers/[partyId]/actions";
import {updateStatusFormAction as action66} from "@/app/(app)/customers/[partyId]/actions";
import {archiveCustomerFormAction as action67} from "@/app/(app)/customers/[partyId]/actions";
import {unarchiveCustomerFormAction as action68} from "@/app/(app)/customers/[partyId]/actions";
import {deleteCustomerFormAction as action69} from "@/app/(app)/customers/[partyId]/actions";
import {createKpi as action70} from "@/app/(app)/kpis/actions";
import {saveGoal as action71} from "@/app/(app)/kpis/actions";
import {updateKpi as action72} from "@/app/(app)/kpis/actions";
import {recordProgress as action73} from "@/app/(app)/kpis/actions";
import {closeGoal as action74} from "@/app/(app)/kpis/actions";
import {addPlanGoal as action75} from "@/app/(app)/kpis/actions";
import {closePlan as action76} from "@/app/(app)/kpis/actions";
import {commentOnPlan as action77} from "@/app/(app)/kpis/actions";
import {syncDemandAction as action78} from "@/app/(app)/logistics/actions";
import {restoreDeliveryAction as action79} from "@/app/(app)/logistics/actions";
import {releaseAction as action80} from "@/app/(app)/logistics/actions";
import {allocateAction as action81} from "@/app/(app)/logistics/actions";
import {directShipAction as action82} from "@/app/(app)/logistics/actions";
import {groupAction as action83} from "@/app/(app)/logistics/actions";
import {scanAction as action84} from "@/app/(app)/logistics/actions";
import {lotAction as action85} from "@/app/(app)/logistics/actions";
import {serialAction as action86} from "@/app/(app)/logistics/actions";
import {shortAction as action87} from "@/app/(app)/logistics/actions";
import {completeWorkAction as action88} from "@/app/(app)/logistics/actions";
import {claimAction as action89} from "@/app/(app)/logistics/actions";
import {shipFromPickAction as action90} from "@/app/(app)/logistics/actions";
import {packageAction as action91} from "@/app/(app)/logistics/actions";
import {weightAction as action92} from "@/app/(app)/logistics/actions";
import {stageAction as action93} from "@/app/(app)/logistics/actions";
import {labelAction as action94} from "@/app/(app)/logistics/actions";
import {dispatchAction as action95} from "@/app/(app)/logistics/actions";
import {trackingAction as action96} from "@/app/(app)/logistics/actions";
import {deliverAction as action97} from "@/app/(app)/logistics/actions";
import {loadCreateAction as action98} from "@/app/(app)/logistics/actions";
import {loadScanAction as action99} from "@/app/(app)/logistics/actions";
import {departAction as action100} from "@/app/(app)/logistics/actions";
import {expectAction as action101} from "@/app/(app)/logistics/actions";
import {receiveLineAction as action102} from "@/app/(app)/logistics/actions";
import {putAwayAction as action103} from "@/app/(app)/logistics/actions";
import {completeReceiptAction as action104} from "@/app/(app)/logistics/actions";
import {transferAction as action105} from "@/app/(app)/logistics/actions";
import {transferReceiveAction as action106} from "@/app/(app)/logistics/actions";
import {returnRequestAction as action107} from "@/app/(app)/logistics/actions";
import {authoriseReturnAction as action108} from "@/app/(app)/logistics/actions";
import {receiveReturnAction as action109} from "@/app/(app)/logistics/actions";
import {inspectAction as action110} from "@/app/(app)/logistics/actions";
import {closeReturnAction as action111} from "@/app/(app)/logistics/actions";
import {assignEquipmentAction as action112} from "@/app/(app)/logistics/actions";
import {packUnitAction as action113} from "@/app/(app)/logistics/actions";
import {saveHandlingTypeAction as action114} from "@/app/(app)/logistics/actions";
import {retireHandlingTypeAction as action115} from "@/app/(app)/logistics/actions";
import {removeHandlingTypeAction as action116} from "@/app/(app)/logistics/actions";
import {policyAction as action117} from "@/app/(app)/logistics/actions";
import {runMrpAction as action118} from "@/app/(app)/manufacturing/plan/actions";
import {firmSuggestionAction as action119} from "@/app/(app)/manufacturing/plan/actions";
import {dismissSuggestionAction as action120} from "@/app/(app)/manufacturing/plan/actions";
import {setForecastAction as action121} from "@/app/(app)/manufacturing/plan/actions";
import {deleteForecastAction as action122} from "@/app/(app)/manufacturing/plan/actions";
import {runMrpAction as action123} from "@/app/(app)/manufacturing/planning/actions";
import {firmPlannedOrderAction as action124} from "@/app/(app)/manufacturing/planning/actions";
import {dismissPlannedOrderAction as action125} from "@/app/(app)/manufacturing/planning/actions";
import {runMrpForm as action126} from "@/app/(app)/manufacturing/planning/form-actions";
import {firmPlannedOrderForm as action127} from "@/app/(app)/manufacturing/planning/form-actions";
import {dismissPlannedOrderForm as action128} from "@/app/(app)/manufacturing/planning/form-actions";
import {raiseProductionOrderAction as action129} from "@/app/(app)/manufacturing/produce/actions";
import {previewMoveAction as action130} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {commitMoveAction as action131} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {toggleLockAction as action132} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {saveShiftAction as action133} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {deleteShiftAction as action134} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {startAction as action135} from "@/app/(app)/manufacturing/shop-floor/actions";
import {pauseAction as action136} from "@/app/(app)/manufacturing/shop-floor/actions";
import {completeAction as action137} from "@/app/(app)/manufacturing/shop-floor/actions";
import {loadNotices as action138} from "@/app/(app)/notices/actions";
import {clearNotice as action139} from "@/app/(app)/notices/actions";
import {clearNotices as action140} from "@/app/(app)/notices/actions";
import {createPayrollRun as action141} from "@/app/(app)/payroll/actions";
import {updatePayslipDeductions as action142} from "@/app/(app)/payroll/actions";
import {finalisePayrollRun as action143} from "@/app/(app)/payroll/actions";
import {markPayrollRunPaid as action144} from "@/app/(app)/payroll/actions";
import {savePayrollSettings as action145} from "@/app/(app)/payroll/actions";
import {issueP45 as action146} from "@/app/(app)/payroll/actions";
import {issueP60 as action147} from "@/app/(app)/payroll/actions";
import {logAbsence as action148} from "@/app/(app)/people/absence/actions";
import {requestLeave as action149} from "@/app/(app)/people/absence/actions";
import {cancelOwnLeave as action150} from "@/app/(app)/people/absence/actions";
import {approveLeaveRequest as action151} from "@/app/(app)/people/absence/actions";
import {setLeaveAllowance as action152} from "@/app/(app)/people/absence/actions";
import {rejectLeaveRequest as action153} from "@/app/(app)/people/absence/actions";
import {createEmployee as action154} from "@/app/(app)/people/actions";
import {changeEmployeeStatus as action155} from "@/app/(app)/people/actions";
import {updateEmployeeProfile as action156} from "@/app/(app)/people/actions";
import {updateOwnEmployeeDetails as action157} from "@/app/(app)/people/actions";
import {addEmployeeDocument as action158} from "@/app/(app)/people/actions";
import {linkEmployeeToUser as action159} from "@/app/(app)/people/actions";
import {completeEmployeeTask as action160} from "@/app/(app)/people/actions";
import {addEmployeeTask as action161} from "@/app/(app)/people/actions";
import {updateEmployeeContact as action162} from "@/app/(app)/people/actions";
import {updateEmployeeTask as action163} from "@/app/(app)/people/actions";
import {scheduleAppraisal as action164} from "@/app/(app)/people/appraisals/actions";
import {completeAppraisal as action165} from "@/app/(app)/people/appraisals/actions";
import {getConductDesk as action166} from "@/app/(app)/people/conduct/actions";
import {getMyConduct as action167} from "@/app/(app)/people/conduct/actions";
import {getPlan as action168} from "@/app/(app)/people/conduct/actions";
import {getCase as action169} from "@/app/(app)/people/conduct/actions";
import {conductChoices as action170} from "@/app/(app)/people/conduct/actions";
import {savePlan as action171} from "@/app/(app)/people/conduct/actions";
import {addPlanReview as action172} from "@/app/(app)/people/conduct/actions";
import {commentOnPlan as action173} from "@/app/(app)/people/conduct/actions";
import {saveCase as action174} from "@/app/(app)/people/conduct/actions";
import {respondToCase as action175} from "@/app/(app)/people/conduct/actions";
import {addCaseEvent as action176} from "@/app/(app)/people/conduct/actions";
import {submitExpenseClaim as action177} from "@/app/(app)/people/expenses/actions";
import {approveExpenseClaim as action178} from "@/app/(app)/people/expenses/actions";
import {rejectExpenseClaim as action179} from "@/app/(app)/people/expenses/actions";
import {scheduleOneToOne as action180} from "@/app/(app)/people/one-to-ones/actions";
import {completeOneToOne as action181} from "@/app/(app)/people/one-to-ones/actions";
import {listPolicies as action182} from "@/app/(app)/people/policies/actions";
import {publishPolicy as action183} from "@/app/(app)/people/policies/actions";
import {archivePolicy as action184} from "@/app/(app)/people/policies/actions";
import {openPolicy as action185} from "@/app/(app)/people/policies/actions";
import {createShift as action186} from "@/app/(app)/people/rotas/actions";
import {changeShiftStatus as action187} from "@/app/(app)/people/rotas/actions";
import {getMyHR as action188} from "@/app/(app)/people/self-service";
import {getMyTeam as action189} from "@/app/(app)/people/self-service";
import {getTeamEmployee as action190} from "@/app/(app)/people/self-service";
import {addPrivateNote as action191} from "@/app/(app)/people/self-service";
import {updateWorkingPattern as action192} from "@/app/(app)/people/self-service";
import {updateHrSettings as action193} from "@/app/(app)/people/settings/actions";
import {createAppraisalTemplate as action194} from "@/app/(app)/people/settings/actions";
import {toggleAppraisalTemplateActive as action195} from "@/app/(app)/people/settings/actions";
import {createOneToOneTemplate as action196} from "@/app/(app)/people/settings/actions";
import {toggleOneToOneTemplateActive as action197} from "@/app/(app)/people/settings/actions";
import {getTimesheetContext as action198} from "@/app/(app)/people/timesheets/actions";
import {saveTimesheet as action199} from "@/app/(app)/people/timesheets/actions";
import {reviewTimesheet as action200} from "@/app/(app)/people/timesheets/actions";
import {createPriceList as action201} from "@/app/(app)/pricing/actions";
import {savePriceEntry as action202} from "@/app/(app)/pricing/actions";
import {saveRule as action203} from "@/app/(app)/pricing/actions";
import {setRuleActive as action204} from "@/app/(app)/pricing/actions";
import {updatePriceBasis as action205} from "@/app/(app)/pricing/actions";
import {renamePriceList as action206} from "@/app/(app)/pricing/actions";
import {assignPriceListCustomers as action207} from "@/app/(app)/pricing/actions";
import {checkSalesPrice as action208} from "@/app/(app)/pricing/actions";
import {assignPriceList as action209} from "@/app/(app)/pricing/actions";
import {previewPriceCsv as action210} from "@/app/(app)/pricing/actions";
import {applyPriceCsv as action211} from "@/app/(app)/pricing/actions";
import {saveAgreement as action212} from "@/app/(app)/pricing/actions";
import {saveAgreementPrice as action213} from "@/app/(app)/pricing/actions";
import {removeAgreementPrice as action214} from "@/app/(app)/pricing/actions";
import {previewAgreementCsv as action215} from "@/app/(app)/pricing/actions";
import {applyAgreementCsv as action216} from "@/app/(app)/pricing/actions";
import {saveProduct as action217} from "@/app/(app)/products/actions";
import {saveProductRecord as action218} from "@/app/(app)/products/actions";
import {saveCategory as action219} from "@/app/(app)/products/actions";
import {retireCategory as action220} from "@/app/(app)/products/actions";
import {addStandardCategories as action221} from "@/app/(app)/products/actions";
import {savePack as action222} from "@/app/(app)/products/actions";
import {saveLinks as action223} from "@/app/(app)/products/actions";
import {saveMeasures as action224} from "@/app/(app)/products/actions";
import {saveProfile as action225} from "@/app/(app)/profile/actions";
import {loadAssignedWork as action226} from "@/app/(app)/profile/work";
import {createProject as action227} from "@/app/(app)/projects/actions";
import {changeProjectStatus as action228} from "@/app/(app)/projects/actions";
import {editProject as action229} from "@/app/(app)/projects/actions";
import {setProjectMember as action230} from "@/app/(app)/projects/actions";
import {archiveProject as action231} from "@/app/(app)/projects/actions";
import {createTask as action232} from "@/app/(app)/projects/actions";
import {changeTaskStatus as action233} from "@/app/(app)/projects/actions";
import {editTask as action234} from "@/app/(app)/projects/actions";
import {checklistItem as action235} from "@/app/(app)/projects/actions";
import {addDependency as action236} from "@/app/(app)/projects/actions";
import {createMeeting as action237} from "@/app/(app)/projects/actions";
import {createDocument as action238} from "@/app/(app)/projects/actions";
import {editDocument as action239} from "@/app/(app)/projects/actions";
import {addComment as action240} from "@/app/(app)/projects/actions";
import {createMilestone as action241} from "@/app/(app)/projects/actions";
import {publishUpdate as action242} from "@/app/(app)/projects/actions";
import {createDecision as action243} from "@/app/(app)/projects/actions";
import {decide as action244} from "@/app/(app)/projects/actions";
import {createRisk as action245} from "@/app/(app)/projects/actions";
import {closeRisk as action246} from "@/app/(app)/projects/actions";
import {requestApproval as action247} from "@/app/(app)/projects/actions";
import {respondApproval as action248} from "@/app/(app)/projects/actions";
import {submitRequest as action249} from "@/app/(app)/projects/actions";
import {triageRequest as action250} from "@/app/(app)/projects/actions";
import {logTime as action251} from "@/app/(app)/projects/actions";
import {planToday as action252} from "@/app/(app)/projects/actions";
import {updateInbox as action253} from "@/app/(app)/projects/actions";
import {saveView as action254} from "@/app/(app)/projects/actions";
import {createPortfolio as action255} from "@/app/(app)/projects/actions";
import {createBaseline as action256} from "@/app/(app)/projects/actions";
import {setBudget as action257} from "@/app/(app)/projects/actions";
import {linkWork as action258} from "@/app/(app)/projects/actions";
import {getProjectActivity as action259} from "@/app/(app)/projects/actions";
import {createAutomation as action260} from "@/app/(app)/projects/actions";
import {toggleAutomation as action261} from "@/app/(app)/projects/actions";
import {saveProjectTemplate as action262} from "@/app/(app)/projects/actions";
import {useProjectTemplate as action263} from "@/app/(app)/projects/actions";
import {startTimer as action264} from "@/app/(app)/projects/actions";
import {stopTimer as action265} from "@/app/(app)/projects/actions";
import {projectPreference as action266} from "@/app/(app)/projects/actions";
import {uploadProjectFile as action267} from "@/app/(app)/projects/actions";
import {readProjectFile as action268} from "@/app/(app)/projects/actions";
import {createProperty as action269} from "@/app/(app)/projects/actions";
import {setProperty as action270} from "@/app/(app)/projects/actions";
import {restoreDocument as action271} from "@/app/(app)/projects/actions";
import {createTaskFromDocument as action272} from "@/app/(app)/projects/actions";
import {discardTimer as action273} from "@/app/(app)/projects/actions";
import {completeMilestone as action274} from "@/app/(app)/projects/actions";
import {resolveComment as action275} from "@/app/(app)/projects/actions";
import {getProjectWorkload as action276} from "@/app/(app)/projects/actions";
import {newContractAction as action277} from "@/app/(app)/sales/contracts/actions";
import {resendContractAction as action278} from "@/app/(app)/sales/contracts/actions";
import {deleteContractAction as action279} from "@/app/(app)/sales/contracts/actions";
import {createOrderForm as action280} from "@/app/(app)/sales/orders/actions";
import {addLineForm as action281} from "@/app/(app)/sales/orders/actions";
import {removeLineForm as action282} from "@/app/(app)/sales/orders/actions";
import {confirmOrderForm as action283} from "@/app/(app)/sales/orders/actions";
import {updateOrderForm as action284} from "@/app/(app)/sales/orders/actions";
import {chooseOrderAddresses as action285} from "@/app/(app)/sales/orders/actions";
import {addHoldForm as action286} from "@/app/(app)/sales/orders/actions";
import {releaseHoldForm as action287} from "@/app/(app)/sales/orders/actions";
import {approveOrderForm as action288} from "@/app/(app)/sales/orders/actions";
import {cancelOrderForm as action289} from "@/app/(app)/sales/orders/actions";
import {saveOrderHashtagsForm as action290} from "@/app/(app)/sales/orders/actions";
import {restoreCancelledOrderForm as action291} from "@/app/(app)/sales/orders/actions";
import {returnOrderToQuoteForm as action292} from "@/app/(app)/sales/orders/actions";
import {scheduleOrderDelivery as action293} from "@/app/(app)/sales/orders/actions";
import {rejectOrderApproval as action294} from "@/app/(app)/sales/orders/actions";
import {deleteOrderForm as action295} from "@/app/(app)/sales/orders/actions";
import {createQuote as action296} from "@/app/(app)/sales/quotes/actions";
import {deleteQuoteForm as action297} from "@/app/(app)/sales/quotes/actions";
import {saveCreationPolicy as action298} from "@/app/(app)/sales/settings/actions";
import {saveSiteAction as action299} from "@/app/(app)/sales/sites/actions";
import {setDocumentSiteAction as action300} from "@/app/(app)/sales/sites/actions";
import {getSchedule as action301} from "@/app/(app)/scheduling/actions";
import {createBulkShifts as action302} from "@/app/(app)/scheduling/actions";
import {setScheduledShift as action303} from "@/app/(app)/scheduling/actions";
import {completeShiftTask as action304} from "@/app/(app)/scheduling/actions";
import {editScheduledShift as action305} from "@/app/(app)/scheduling/actions";
import {publishWeekShifts as action306} from "@/app/(app)/scheduling/actions";
import {saveHoursBudget as action307} from "@/app/(app)/scheduling/actions";
import {getTeamPlan as action308} from "@/app/(app)/scheduling/actions";
import {getPersonSchedule as action309} from "@/app/(app)/scheduling/actions";
import {saveWorkType as action310} from "@/app/(app)/scheduling/actions";
import {archiveWorkType as action311} from "@/app/(app)/scheduling/actions";
import {saveDemand as action312} from "@/app/(app)/scheduling/actions";
import {saveBusyRule as action313} from "@/app/(app)/scheduling/actions";
import {removeBusyRule as action314} from "@/app/(app)/scheduling/actions";
import {fillTeamMonth as action315} from "@/app/(app)/scheduling/actions";
import {replanCover as action316} from "@/app/(app)/scheduling/actions";
import {publishMonth as action317} from "@/app/(app)/scheduling/actions";
import {saveShift as action318} from "@/app/(app)/scheduling/actions";
import {saveRole as action319} from "@/app/(app)/settings/actions";
import {saveMemberRoles as action320} from "@/app/(app)/settings/actions";
import {createUser as action321} from "@/app/(app)/settings/actions";
import {saveCompanyAccess as action322} from "@/app/(app)/settings/actions";
import {saveCompanyProfile as action323} from "@/app/(app)/settings/actions";
import {saveManagerPolicy as action324} from "@/app/(app)/settings/actions";
import {saveWorkspaceDetails as action325} from "@/app/(app)/settings/actions";
import {saveCompanyBrand as action326} from "@/app/(app)/settings/actions";
import {importCsv as action327} from "@/app/(app)/settings/imports/actions";
import {saveEmailAccount as action328} from "@/app/(app)/settings/it/actions";
import {verifyEmailAccount as action329} from "@/app/(app)/settings/it/actions";
import {sendTestEmail as action330} from "@/app/(app)/settings/it/actions";
import {makeDefaultAccount as action331} from "@/app/(app)/settings/it/actions";
import {setAccountActive as action332} from "@/app/(app)/settings/it/actions";
import {deleteEmailAccount as action333} from "@/app/(app)/settings/it/actions";
import {saveSocialAccount as action334} from "@/app/(app)/settings/it/actions";
import {deleteSocialAccount as action335} from "@/app/(app)/settings/it/actions";
import {checkSocialAccount as action336} from "@/app/(app)/settings/it/actions";
import {saveEmailTemplate as action337} from "@/app/(app)/settings/it/actions";
import {deleteEmailTemplate as action338} from "@/app/(app)/settings/it/actions";
import {checkInboxNow as action339} from "@/app/(app)/settings/it/actions";
import {saveDispatchDelivery as action340} from "@/app/(app)/settings/logistics/actions";
import {saveUserAccess as action341} from "@/app/(app)/settings/user-actions";
import {setUserStatus as action342} from "@/app/(app)/settings/user-actions";
import {revokeUserSessions as action343} from "@/app/(app)/settings/user-actions";
import {issuePasswordRecovery as action344} from "@/app/(app)/settings/user-actions";
import {createManagedUser as action345} from "@/app/(app)/settings/user-actions";
import {linkEmployeeProfile as action346} from "@/app/(app)/settings/user-actions";
import {createRole as action347} from "@/app/(app)/settings/user-actions";
import {saveManagementGroup as action348} from "@/app/(app)/settings/user-actions";
import {createWarehouse as action349} from "@/app/(app)/stock/actions";
import {adjustStock as action350} from "@/app/(app)/stock/actions";
import {savePlanningAction as action351} from "@/app/(app)/stock/actions";
import {makeFromForecastAction as action352} from "@/app/(app)/stock/actions";
import {transferStock as action353} from "@/app/(app)/stock/actions";
import {createSiteAction as action354} from "@/app/(app)/stock/actions";
import {createPlaceAction as action355} from "@/app/(app)/stock/actions";
import {assignSiteAction as action356} from "@/app/(app)/stock/actions";
import {addLocationAction as action357} from "@/app/(app)/stock/actions";
import {ensureLocationsAction as action358} from "@/app/(app)/stock/actions";
import {retireLocationAction as action359} from "@/app/(app)/stock/actions";
import {putOnLocationAction as action360} from "@/app/(app)/stock/actions";
import {moveLocatedAction as action361} from "@/app/(app)/stock/actions";
import {receiveMoveAction as action362} from "@/app/(app)/stock/actions";
import {delegateApprovals as action363} from "@/core/approvals/actions";
import {loginAction as action364} from "@/core/auth/actions";
import {logoutAction as action365} from "@/core/auth/actions";
import {completePasswordRecovery as action366} from "@/core/auth/security-actions";
import {changeOwnPassword as action367} from "@/core/auth/security-actions";
import {signOutOtherSessions as action368} from "@/core/auth/security-actions";
import {createContract as action369} from "@/core/contracts/actions";
import {sendContract as action370} from "@/core/contracts/actions";
import {shareContractLink as action371} from "@/core/contracts/actions";
import {deleteContract as action372} from "@/core/contracts/actions";
import {signContract as action373} from "@/core/contracts/actions";
import {declineContract as action374} from "@/core/contracts/actions";
import {loadPublicContract as action375} from "@/core/contracts/actions";
import {loadPublicContractFile as action376} from "@/core/contracts/actions";
import {checkForDuplicatesAction as action377} from "@/core/customers/actions";
import {createCustomerAction as action378} from "@/core/customers/actions";
import {createCustomer as action379} from "@/core/customers/commands";
import {updateCustomerStatus as action380} from "@/core/customers/commands";
import {archiveCustomer as action381} from "@/core/customers/commands";
import {unarchiveCustomer as action382} from "@/core/customers/commands";
import {deleteCustomer as action383} from "@/core/customers/commands";
import {createContact as action384} from "@/core/customers/commands";
import {updateContact as action385} from "@/core/customers/commands";
import {deleteContact as action386} from "@/core/customers/commands";
import {createAddress as action387} from "@/core/customers/commands";
import {updateCommercialSettings as action388} from "@/core/customers/commands";
import {updateCreditLimit as action389} from "@/core/customers/commands";
import {setCreditHold as action390} from "@/core/customers/commands";
import {setPaymentTerm as action391} from "@/core/customers/commands";
import {createTaxRegistration as action392} from "@/core/customers/commands";
import {markTaxRegistrationManuallyVerified as action393} from "@/core/customers/commands";
import {createBankAccount as action394} from "@/core/customers/commands";
import {revealBankAccount as action395} from "@/core/customers/commands";
import {createDirectDebitMandate as action396} from "@/core/customers/commands";
import {cancelDirectDebitMandate as action397} from "@/core/customers/commands";
import {createNote as action398} from "@/core/customers/commands";
import {saveCustomerHashtags as action399} from "@/core/customers/commands";
import {updateCustomerDetails as action400} from "@/core/customers/commands";
import {updateAddress as action401} from "@/core/customers/commands";
import {archiveAddress as action402} from "@/core/customers/commands";
import {saveOrderingPreferences as action403} from "@/core/customers/commercial-actions";
import {setCustomerParent as action404} from "@/core/customers/hierarchy-actions";
import {placeCustomer as action405} from "@/core/customers/hierarchy-actions";
import {moveCustomer as action406} from "@/core/customers/hierarchy-actions";
import {setContactReportsTo as action407} from "@/core/customers/hierarchy-actions";
import {saveCustomerTradingLink as action408} from "@/core/customers/trading-actions";
import {setInvoiceAccount as action409} from "@/core/customers/trading-actions";
import {archiveCustomerTradingLink as action410} from "@/core/customers/trading-actions";
import {requestSalesInvoice as action411} from "@/core/finance/actions";
import {createWorkTeam as action412} from "@/core/teams/actions";
import {loadAuditBoard as action413} from "@/modules/audit/services/actions";
import {exportAuditReport as action414} from "@/modules/audit/services/actions";
import {loadEcho as action415} from "@/modules/audit/services/actions";
import {postEchoNote as action416} from "@/modules/audit/services/actions";
import {loadEchoInbox as action417} from "@/modules/audit/services/actions";
import {loadAuditAccess as action418} from "@/modules/audit/services/actions";
import {saveAuditOwnActivity as action419} from "@/modules/audit/services/actions";
import {saveAuditAreas as action420} from "@/modules/audit/services/actions";
import {saveAutomation as action421} from "@/modules/automations/services/actions";
import {setAutomationEnabled as action422} from "@/modules/automations/services/actions";
import {deleteAutomation as action423} from "@/modules/automations/services/actions";
import {testOnPastEvent as action424} from "@/modules/automations/services/actions";
import {runNow as action425} from "@/modules/automations/services/actions";
import {logActivity as action426} from "@/modules/crm/services/activities";
import {completeActivity as action427} from "@/modules/crm/services/activities";
import {acceptMarketingHandoff as action428} from "@/modules/crm/services/marketing-handoff";
import {createOpportunity as action429} from "@/modules/crm/services/opportunities";
import {moveOpportunityStage as action430} from "@/modules/crm/services/opportunities";
import {updateOpportunityValue as action431} from "@/modules/crm/services/opportunities";
import {updateOpportunityCloseDate as action432} from "@/modules/crm/services/opportunities";
import {setOpportunityForecastCategory as action433} from "@/modules/crm/services/opportunities";
import {setOpportunityNextAction as action434} from "@/modules/crm/services/opportunities";
import {winOpportunity as action435} from "@/modules/crm/services/opportunities";
import {loseOpportunity as action436} from "@/modules/crm/services/opportunities";
import {addStakeholder as action437} from "@/modules/crm/services/opportunities";
import {addMilestone as action438} from "@/modules/crm/services/opportunities";
import {toggleMilestone as action439} from "@/modules/crm/services/opportunities";
import {checkProspectDuplicatesAction as action440} from "@/modules/crm/services/prospects";
import {createProspect as action441} from "@/modules/crm/services/prospects";
import {assignProspect as action442} from "@/modules/crm/services/prospects";
import {setProspectLifecycleStage as action443} from "@/modules/crm/services/prospects";
import {convertProspect as action444} from "@/modules/crm/services/prospects";
import {createIndustry as action445} from "@/modules/crm/services/prospects";
import {saveProspectGrouping as action446} from "@/modules/crm/services/prospects";
import {createSalesProject as action447} from "@/modules/crm/services/sales-projects-commands";
import {createSalesProjectFormAction as action448} from "@/modules/crm/services/sales-projects-commands";
import {saveSalesProjectAction as action449} from "@/modules/crm/services/sales-projects-commands";
import {saveNextActionAction as action450} from "@/modules/crm/services/sales-projects-commands";
import {addProjectOrganisationAction as action451} from "@/modules/crm/services/sales-projects-commands";
import {removeProjectOrganisationAction as action452} from "@/modules/crm/services/sales-projects-commands";
import {makePrimaryOrganisationAction as action453} from "@/modules/crm/services/sales-projects-commands";
import {addProjectStakeholderAction as action454} from "@/modules/crm/services/sales-projects-commands";
import {removeProjectStakeholderAction as action455} from "@/modules/crm/services/sales-projects-commands";
import {setDocumentSalesProjectAction as action456} from "@/modules/crm/services/sales-projects-commands";
import {deleteSalesProjectAction as action457} from "@/modules/crm/services/sales-projects-commands";
import {saveSurvey as action458} from "@/modules/csat/services/actions";
import {createSurveyFromTemplate as action459} from "@/modules/csat/services/actions";
import {setSurveyActive as action460} from "@/modules/csat/services/actions";
import {deleteSurvey as action461} from "@/modules/csat/services/actions";
import {recordCsatScore as action462} from "@/modules/csat/services/actions";
import {recordCsatComment as action463} from "@/modules/csat/services/actions";
import {setupFinance as action464} from "@/modules/finance/services/commands";
import {createFinanceDocument as action465} from "@/modules/finance/services/commands";
import {submitFinanceDocument as action466} from "@/modules/finance/services/commands";
import {saveApprovalPolicy as action467} from "@/modules/finance/services/commands";
import {decideFinanceApproval as action468} from "@/modules/finance/services/commands";
import {createPurchaseOrder as action469} from "@/modules/finance/services/commands";
import {raiseServiceCredit as action470} from "@/modules/finance/services/commands";
import {postFinanceDocument as action471} from "@/modules/finance/services/commands";
import {recordGoodsReceipt as action472} from "@/modules/finance/services/commands";
import {onboardSupplier as action473} from "@/modules/finance/services/commands";
import {approveSupplier as action474} from "@/modules/finance/services/commands";
import {requestSupplierBankChange as action475} from "@/modules/finance/services/commands";
import {verifySupplierBank as action476} from "@/modules/finance/services/commands";
import {createFinanceBank as action477} from "@/modules/finance/services/commands";
import {importBankTransactions as action478} from "@/modules/finance/services/commands";
import {allocateBankTransaction as action479} from "@/modules/finance/services/commands";
import {createPaymentRun as action480} from "@/modules/finance/services/commands";
import {approvePaymentRun as action481} from "@/modules/finance/services/commands";
import {createManualJournal as action482} from "@/modules/finance/services/commands";
import {approveManualJournal as action483} from "@/modules/finance/services/commands";
import {reverseJournal as action484} from "@/modules/finance/services/commands";
import {setFinancePeriodState as action485} from "@/modules/finance/services/commands";
import {saveFinanceBudget as action486} from "@/modules/finance/services/commands";
import {saveFinanceAsset as action487} from "@/modules/finance/services/commands";
import {postAssetDepreciation as action488} from "@/modules/finance/services/commands";
import {completeCloseTask as action489} from "@/modules/finance/services/commands";
import {saveFinanceContract as action490} from "@/modules/finance/services/commands";
import {saveFinanceScenario as action491} from "@/modules/finance/services/commands";
import {receiptForm as action492} from "@/modules/finance/services/commands";
import {journalForm as action493} from "@/modules/finance/services/commands";
import {statementForm as action494} from "@/modules/finance/services/commands";
import {allocationForm as action495} from "@/modules/finance/services/commands";
import {paymentRunForm as action496} from "@/modules/finance/services/commands";
import {policyForm as action497} from "@/modules/finance/services/commands";
import {scenarioForm as action498} from "@/modules/finance/services/commands";
import {uploadFinanceAttachment as action499} from "@/modules/finance/services/commands";
import {generateSalesInvoice as action500} from "@/modules/finance/services/commands";
import {generateInvoiceAdjustment as action501} from "@/modules/finance/services/commands";
import {voidFinanceDraft as action502} from "@/modules/finance/services/commands";
import {getFinanceHome as action503} from "@/modules/finance/services/queries";
import {listFinanceDocuments as action504} from "@/modules/finance/services/queries";
import {getFinanceDocument as action505} from "@/modules/finance/services/queries";
import {getFinanceWorkspace as action506} from "@/modules/finance/services/queries";
import {financeChoices as action507} from "@/modules/finance/services/queries";
import {getBudgetPositions as action508} from "@/modules/finance/services/queries";
import {getInvoiceCashForecast as action509} from "@/modules/finance/services/queries";
import {getFinancialReport as action510} from "@/modules/finance/services/queries";
import {getFinanceCustomerContribution as action511} from "@/modules/finance/services/queries";
import {searchFinance as action512} from "@/modules/finance/services/queries";
import {getFinanceAttachment as action513} from "@/modules/finance/services/queries";
import {getSalesFinanceProjection as action514} from "@/modules/finance/services/queries";
import {getReceivingWarehouses as action515} from "@/modules/finance/services/queries";
import {createProductionOrder as action516} from "@/modules/manufacturing/services/commands";
import {markOrderReady as action517} from "@/modules/manufacturing/services/commands";
import {releaseOrder as action518} from "@/modules/manufacturing/services/commands";
import {closeOrder as action519} from "@/modules/manufacturing/services/commands";
import {startWorkOrder as action520} from "@/modules/manufacturing/services/commands";
import {pauseWorkOrder as action521} from "@/modules/manufacturing/services/commands";
import {completeWorkOrder as action522} from "@/modules/manufacturing/services/commands";
import {listForecasts as action523} from "@/modules/manufacturing/services/forecast";
import {setForecast as action524} from "@/modules/manufacturing/services/forecast";
import {deleteForecast as action525} from "@/modules/manufacturing/services/forecast";
import {runMrp as action526} from "@/modules/manufacturing/services/mrp";
import {firmSuggestion as action527} from "@/modules/manufacturing/services/mrp";
import {dismissSuggestion as action528} from "@/modules/manufacturing/services/mrp";
import {latestPlan as action529} from "@/modules/manufacturing/services/mrp";
import {loadPlant as action530} from "@/modules/manufacturing/services/plant";
import {saveWorkCentre as action531} from "@/modules/manufacturing/services/plant";
import {saveMachine as action532} from "@/modules/manufacturing/services/plant";
import {retirePlantRecord as action533} from "@/modules/manufacturing/services/plant";
import {schedulePreview as action534} from "@/modules/manufacturing/services/scheduler";
import {rescheduleWorkOrder as action535} from "@/modules/manufacturing/services/scheduler";
import {setWorkOrderLock as action536} from "@/modules/manufacturing/services/scheduler";
import {listShifts as action537} from "@/modules/manufacturing/services/shifts";
import {saveShift as action538} from "@/modules/manufacturing/services/shifts";
import {deleteShift as action539} from "@/modules/manufacturing/services/shifts";
import {createCampaignAction as action540} from "@/modules/marketing/services/campaign-actions 2";
import {saveCampaignBriefAction as action541} from "@/modules/marketing/services/campaign-actions 2";
import {saveBudgetLineAction as action542} from "@/modules/marketing/services/campaign-actions 2";
import {deleteBudgetLineAction as action543} from "@/modules/marketing/services/campaign-actions 2";
import {saveActivityAction as action544} from "@/modules/marketing/services/campaign-actions 2";
import {setActivityStatusAction as action545} from "@/modules/marketing/services/campaign-actions 2";
import {deleteActivityAction as action546} from "@/modules/marketing/services/campaign-actions 2";
import {addPaidSpendAction as action547} from "@/modules/marketing/services/campaign-actions 2";
import {deletePaidSpendAction as action548} from "@/modules/marketing/services/campaign-actions 2";
import {createCampaignAction as action549} from "@/modules/marketing/services/campaign-actions";
import {saveCampaignBriefAction as action550} from "@/modules/marketing/services/campaign-actions";
import {saveBudgetLineAction as action551} from "@/modules/marketing/services/campaign-actions";
import {deleteBudgetLineAction as action552} from "@/modules/marketing/services/campaign-actions";
import {saveActivityAction as action553} from "@/modules/marketing/services/campaign-actions";
import {setActivityStatusAction as action554} from "@/modules/marketing/services/campaign-actions";
import {deleteActivityAction as action555} from "@/modules/marketing/services/campaign-actions";
import {addPaidSpendAction as action556} from "@/modules/marketing/services/campaign-actions";
import {deletePaidSpendAction as action557} from "@/modules/marketing/services/campaign-actions";
import {createCampaign as action558} from "@/modules/marketing/services/commands";
import {updateCampaign as action559} from "@/modules/marketing/services/commands";
import {createProfile as action560} from "@/modules/marketing/services/commands";
import {recordPermission as action561} from "@/modules/marketing/services/commands";
import {suppressProfile as action562} from "@/modules/marketing/services/commands";
import {createAudience as action563} from "@/modules/marketing/services/commands";
import {previewAudience as action564} from "@/modules/marketing/services/commands";
import {createContent as action565} from "@/modules/marketing/services/commands";
import {approveContent as action566} from "@/modules/marketing/services/commands";
import {createMessage as action567} from "@/modules/marketing/services/commands";
import {lockSend as action568} from "@/modules/marketing/services/commands";
import {cancelSend as action569} from "@/modules/marketing/services/commands";
import {ingestEvent as action570} from "@/modules/marketing/services/commands";
import {createJourney as action571} from "@/modules/marketing/services/commands";
import {publishJourney as action572} from "@/modules/marketing/services/commands";
import {reviseJourney as action573} from "@/modules/marketing/services/commands";
import {createProgram as action574} from "@/modules/marketing/services/commands";
import {createExperiment as action575} from "@/modules/marketing/services/commands";
import {leadFeedback as action576} from "@/modules/marketing/services/commands";
import {processJourneySteps as action577} from "@/modules/marketing/services/commands";
import {saveMarketingPlan as action578} from "@/modules/marketing/services/commands";
import {addPlanActivity as action579} from "@/modules/marketing/services/commands";
import {updatePlanActivity as action580} from "@/modules/marketing/services/commands";
import {addBudgetLine as action581} from "@/modules/marketing/services/commands";
import {submitBudgetToFinance as action582} from "@/modules/marketing/services/commands";
import {createJourneyMap as action583} from "@/modules/marketing/services/commands";
import {addJourneyStage as action584} from "@/modules/marketing/services/commands";
import {addJourneyTouch as action585} from "@/modules/marketing/services/commands";
import {saveSocialPost as action586} from "@/modules/marketing/services/social-actions";
import {deleteSocialPost as action587} from "@/modules/marketing/services/social-actions";
import {retrySocialPost as action588} from "@/modules/marketing/services/social-actions";
import {getApprovedExpenseSource as action589} from "@/modules/people/services/finance-expenses";
import {createPlan as action590} from "@/modules/plan/services/commands";
import {saveCell as action591} from "@/modules/plan/services/commands";
import {addMeasure as action592} from "@/modules/plan/services/commands";
import {addAssumption as action593} from "@/modules/plan/services/commands";
import {addDriver as action594} from "@/modules/plan/services/commands";
import {addLink as action595} from "@/modules/plan/services/commands";
import {createScenario as action596} from "@/modules/plan/services/commands";
import {promoteScenario as action597} from "@/modules/plan/services/commands";
import {submitPlan as action598} from "@/modules/plan/services/commands";
import {approvePlan as action599} from "@/modules/plan/services/commands";
import {lockPlan as action600} from "@/modules/plan/services/commands";
import {addGoal as action601} from "@/modules/plan/services/commands";
import {addInitiative as action602} from "@/modules/plan/services/commands";
import {createProjectForInitiative as action603} from "@/modules/plan/services/commands";
import {addAction as action604} from "@/modules/plan/services/commands";
import {completeAction as action605} from "@/modules/plan/services/commands";
import {addRisk as action606} from "@/modules/plan/services/commands";
import {addDependency as action607} from "@/modules/plan/services/commands";
import {addDecision as action608} from "@/modules/plan/services/commands";
import {addComment as action609} from "@/modules/plan/services/commands";
import {addUpdate as action610} from "@/modules/plan/services/commands";
import {completeReview as action611} from "@/modules/plan/services/commands";
import {addReview as action612} from "@/modules/plan/services/commands";
import {distributeTargets as action613} from "@/modules/plan/services/commands";
import {importGrid as action614} from "@/modules/plan/services/commands";
import {sharePlan as action615} from "@/modules/plan/services/commands";
import {unsharePlan as action616} from "@/modules/plan/services/commands";
import {setPlanAudience as action617} from "@/modules/plan/services/commands";
import {addNote as action618} from "@/modules/plan/services/commands";
import {saveGoalProgress as action619} from "@/modules/plan/services/commands";
import {savePlanBrief as action620} from "@/modules/plan/services/commands";
import {listProductionPlans as action621} from "@/modules/planning/services/plans";
import {getPlanOptions as action622} from "@/modules/planning/services/plans";
import {getProductionPlan as action623} from "@/modules/planning/services/plans";
import {createProductionPlan as action624} from "@/modules/planning/services/plans";
import {addProductionPlanLine as action625} from "@/modules/planning/services/plans";
import {getAssignedPlanningWork as action626} from "@/modules/planning/services/plans";
import {getPlanningCoverage as action627} from "@/modules/planning/services/queries";
import {saveProductRecipe as action628} from "@/modules/products/services/make";
import {createSpecification as action629} from "@/modules/quality/services/commands";
import {setSpecificationStatus as action630} from "@/modules/quality/services/commands";
import {createControlPoint as action631} from "@/modules/quality/services/commands";
import {executeInspection as action632} from "@/modules/quality/services/commands";
import {releaseHold as action633} from "@/modules/quality/services/commands";
import {reportNcr as action634} from "@/modules/quality/services/commands";
import {updateNcrInvestigation as action635} from "@/modules/quality/services/commands";
import {addNcrAction as action636} from "@/modules/quality/services/commands";
import {updateNcrAction as action637} from "@/modules/quality/services/commands";
import {closeNcr as action638} from "@/modules/quality/services/commands";
import {saveSubstance as action639} from "@/modules/safety/services/assurance";
import {addSafetyDataSheet as action640} from "@/modules/safety/services/assurance";
import {saveCoshhAssessment as action641} from "@/modules/safety/services/assurance";
import {approveSubstance as action642} from "@/modules/safety/services/assurance";
import {saveCompetence as action643} from "@/modules/safety/services/assurance";
import {saveSafetyDocument as action644} from "@/modules/safety/services/assurance";
import {acknowledgeDocument as action645} from "@/modules/safety/services/assurance";
import {saveAudit as action646} from "@/modules/safety/services/assurance";
import {addAuditFinding as action647} from "@/modules/safety/services/assurance";
import {approveAudit as action648} from "@/modules/safety/services/assurance";
import {saveChange as action649} from "@/modules/safety/services/assurance";
import {advanceChange as action650} from "@/modules/safety/services/assurance";
import {linkSafetyRecord as action651} from "@/modules/safety/services/assurance";
import {saveSafetyProfile as action652} from "@/modules/safety/services/commands";
import {saveRiskMatrix as action653} from "@/modules/safety/services/commands";
import {createRisk as action654} from "@/modules/safety/services/commands";
import {addControl as action655} from "@/modules/safety/services/commands";
import {rateAssessment as action656} from "@/modules/safety/services/commands";
import {approveAssessment as action657} from "@/modules/safety/services/commands";
import {reviseAssessment as action658} from "@/modules/safety/services/commands";
import {requestRiskReview as action659} from "@/modules/safety/services/commands";
import {reportIncident as action660} from "@/modules/safety/services/commands";
import {saveImmediateControl as action661} from "@/modules/safety/services/commands";
import {openInvestigation as action662} from "@/modules/safety/services/commands";
import {addCause as action663} from "@/modules/safety/services/commands";
import {saveRootCause as action664} from "@/modules/safety/services/commands";
import {reviewRiddor as action665} from "@/modules/safety/services/commands";
import {createSafetyAction as action666} from "@/modules/safety/services/commands";
import {advanceAction as action667} from "@/modules/safety/services/commands";
import {verifyAction as action668} from "@/modules/safety/services/commands";
import {saveWorkplaceRecord as action669} from "@/modules/safety/services/commands";
import {createPermit as action670} from "@/modules/safety/services/control";
import {advancePermit as action671} from "@/modules/safety/services/control";
import {extendPermit as action672} from "@/modules/safety/services/control";
import {createIsolation as action673} from "@/modules/safety/services/control";
import {applyIsolationLock as action674} from "@/modules/safety/services/control";
import {verifyIsolation as action675} from "@/modules/safety/services/control";
import {clearIsolation as action676} from "@/modules/safety/services/control";
import {removeIsolationLock as action677} from "@/modules/safety/services/control";
import {placeSafetyHold as action678} from "@/modules/safety/services/control";
import {updateReturnToService as action679} from "@/modules/safety/services/control";
import {releaseSafetyHold as action680} from "@/modules/safety/services/control";
import {overrideSafetyHold as action681} from "@/modules/safety/services/control";
import {saveStatutoryCheck as action682} from "@/modules/safety/services/control";
import {completeInspection as action683} from "@/modules/safety/services/control";
import {createInspection as action684} from "@/modules/safety/services/control";
import {createSalesAddress as action685} from "@/modules/sales/services/address-actions";
import {createSalesCatalogueProduct as action686} from "@/modules/sales/services/catalogue-actions";
import {sendQuote as action687} from "@/modules/sales/services/commands";
import {changeQuoteStatus as action688} from "@/modules/sales/services/commands";
import {deleteQuote as action689} from "@/modules/sales/services/commands";
import {duplicateDocument as action690} from "@/modules/sales/services/commands";
import {saveQuoteTemplate as action691} from "@/modules/sales/services/commands";
import {createOrderFromQuote as action692} from "@/modules/sales/services/commands";
import {linkCommercialProject as action693} from "@/modules/sales/services/commercial";
import {openCallOffOrder as action694} from "@/modules/sales/services/commercial";
import {raiseCallOff as action695} from "@/modules/sales/services/commercial";
import {invoiceCallOffDelivery as action696} from "@/modules/sales/services/commercial";
import {deliverAndInvoiceCallOff as action697} from "@/modules/sales/services/commercial";
import {importSalescsv as action698} from "@/modules/sales/services/csv-import";
import {addDeliveryAddress as action699} from "@/modules/sales/services/delivery-address";
import {addInstaller as action700} from "@/modules/sales/services/delivery-address";
import {pricePartyId as action701} from "@/modules/sales/services/delivery-address";
import {linkOrderedFor as action702} from "@/modules/sales/services/delivery-address";
import {saveDocument as action703} from "@/modules/sales/services/documents";
import {saveInvoiceTemplate as action704} from "@/modules/sales/services/invoice-template-actions";
import {retireInvoiceTemplate as action705} from "@/modules/sales/services/invoice-template-actions";
import {attachCustomerInvoiceTemplate as action706} from "@/modules/sales/services/invoice-template-actions";
import {detachCustomerInvoiceTemplate as action707} from "@/modules/sales/services/invoice-template-actions";
import {createDraftOrder as action708} from "@/modules/sales/services/orders";
import {addOrderLine as action709} from "@/modules/sales/services/orders";
import {removeOrderLine as action710} from "@/modules/sales/services/orders";
import {updateDraftOrderFields as action711} from "@/modules/sales/services/orders";
import {confirmOrder as action712} from "@/modules/sales/services/orders";
import {decideApproval as action713} from "@/modules/sales/services/orders";
import {amendLineQuantity as action714} from "@/modules/sales/services/orders";
import {overrideLinePrice as action715} from "@/modules/sales/services/orders";
import {amendRequestedDate as action716} from "@/modules/sales/services/orders";
import {cancelOrder as action717} from "@/modules/sales/services/orders";
import {deleteOrder as action718} from "@/modules/sales/services/orders";
import {cancelLineRemaining as action719} from "@/modules/sales/services/orders";
import {addHold as action720} from "@/modules/sales/services/orders";
import {releaseHold as action721} from "@/modules/sales/services/orders";
import {restoreCancelledOrder as action722} from "@/modules/sales/services/rewind";
import {returnOrderToQuote as action723} from "@/modules/sales/services/rewind";
import {saveOrderHashtags as action724} from "@/modules/sales/services/rewind";
import {saveSalesView as action725} from "@/modules/sales/services/saved-views";
import {archiveSalesView as action726} from "@/modules/sales/services/saved-views";
import {createCase as action727} from "@/modules/service/services/commands";
import {updateCase as action728} from "@/modules/service/services/commands";
import {assignCase as action729} from "@/modules/service/services/commands";
import {transitionCase as action730} from "@/modules/service/services/commands";
import {addCaseEntry as action731} from "@/modules/service/services/commands";
import {createDepartmentTicket as action732} from "@/modules/service/services/commands";
import {updateDepartmentTicket as action733} from "@/modules/service/services/commands";
import {createQueue as action734} from "@/modules/service/services/commands";
import {addQueueMember as action735} from "@/modules/service/services/commands";
import {linkCaseRecord as action736} from "@/modules/service/services/commands";
import {creditChoices as action737} from "@/modules/service/services/commands";
import {askFinanceForCredit as action738} from "@/modules/service/services/commands";
import {getCaseOwners as action739} from "@/modules/service/services/commands";
import {getDepartmentWork as action740} from "@/modules/service/services/commands";
import {readAvailability as action741} from "@/modules/stock/services/availability";
import {readOrderChain as action742} from "@/modules/stock/services/availability";
import {inventoryExportRows as action743} from "@/modules/stock/services/export";
import {createTeam as action744} from "@/modules/teams/services/commands";
import {renameTeam as action745} from "@/modules/teams/services/commands";
import {addMember as action746} from "@/modules/teams/services/commands";
import {removeMember as action747} from "@/modules/teams/services/commands";
import {saveTask as action748} from "@/modules/teams/services/commands";
import {setTaskStatus as action749} from "@/modules/teams/services/commands";
import {removeTask as action750} from "@/modules/teams/services/commands";
import {saveCover as action751} from "@/modules/teams/services/commands";
import {removeCover as action752} from "@/modules/teams/services/commands";
import {saveHandover as action753} from "@/modules/teams/services/commands";
import {savePlace as action754} from "@/modules/teams/services/commands";
import {saveMoment as action755} from "@/modules/teams/services/commands";
import {removeMoment as action756} from "@/modules/teams/services/commands";
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
"src/app/(app)/atlas/setup-actions:importCompanySetup":action25 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/setup-actions:createCompanyUser":action26 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/atlas/setup-actions:setCompanyUserStatus":action27 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:postMessage":action28 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:searchChatPeople":action29 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:openChat":action30 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:openDirectChat":action31 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:searchChatRecords":action32 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:sendChat":action33 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/chat/actions:chatSnapshot":action34 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:updateValueFormAction":action35 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:updateCloseDateFormAction":action36 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:setNextActionFormAction":action37 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:setForecastCategoryFormAction":action38 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:winFormAction":action39 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:loseFormAction":action40 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:addStakeholderFormAction":action41 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:addMilestoneFormAction":action42 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:toggleMilestoneFormAction":action43 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:logOpportunityActivityFormAction":action44 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/pipeline/actions:addDealAction":action45 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:qualifyFormAction":action46 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:disqualifyFormAction":action47 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:nurtureFormAction":action48 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:logProspectActivityFormAction":action49 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:assignProspectFormAction":action50 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:assignProspectTaskFormAction":action51 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:convertProspectFormAction":action52 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/reports/actions:pinReportToDashboard":action53 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createContactFormAction":action54 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateContactFormAction":action55 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:deleteContactFormAction":action56 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createAddressFormAction":action57 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createTaxRegistrationFormAction":action58 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:markTaxVerifiedFormAction":action59 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createBankAccountFormAction":action60 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createDirectDebitFormAction":action61 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:cancelDirectDebitFormAction":action62 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateCreditLimitFormAction":action63 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:toggleCreditHoldFormAction":action64 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createNoteFormAction":action65 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateStatusFormAction":action66 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:archiveCustomerFormAction":action67 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:unarchiveCustomerFormAction":action68 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:deleteCustomerFormAction":action69 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:createKpi":action70 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:saveGoal":action71 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:updateKpi":action72 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:recordProgress":action73 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:closeGoal":action74 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:addPlanGoal":action75 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:closePlan":action76 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:commentOnPlan":action77 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:syncDemandAction":action78 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:restoreDeliveryAction":action79 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:releaseAction":action80 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:allocateAction":action81 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:directShipAction":action82 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:groupAction":action83 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:scanAction":action84 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:lotAction":action85 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:serialAction":action86 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shortAction":action87 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeWorkAction":action88 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:claimAction":action89 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shipFromPickAction":action90 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packageAction":action91 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:weightAction":action92 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:stageAction":action93 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:labelAction":action94 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:dispatchAction":action95 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:trackingAction":action96 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:deliverAction":action97 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadCreateAction":action98 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadScanAction":action99 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:departAction":action100 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:expectAction":action101 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveLineAction":action102 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:putAwayAction":action103 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeReceiptAction":action104 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferAction":action105 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferReceiveAction":action106 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:returnRequestAction":action107 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:authoriseReturnAction":action108 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveReturnAction":action109 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:inspectAction":action110 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:closeReturnAction":action111 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:assignEquipmentAction":action112 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packUnitAction":action113 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:saveHandlingTypeAction":action114 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:retireHandlingTypeAction":action115 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:removeHandlingTypeAction":action116 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:policyAction":action117 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:runMrpAction":action118 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:firmSuggestionAction":action119 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:dismissSuggestionAction":action120 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:setForecastAction":action121 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:deleteForecastAction":action122 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:runMrpAction":action123 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:firmPlannedOrderAction":action124 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:dismissPlannedOrderAction":action125 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:runMrpForm":action126 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:firmPlannedOrderForm":action127 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:dismissPlannedOrderForm":action128 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/produce/actions:raiseProductionOrderAction":action129 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:previewMoveAction":action130 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:commitMoveAction":action131 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:toggleLockAction":action132 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:saveShiftAction":action133 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:deleteShiftAction":action134 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:startAction":action135 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:pauseAction":action136 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:completeAction":action137 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:loadNotices":action138 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotice":action139 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotices":action140 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:createPayrollRun":action141 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:updatePayslipDeductions":action142 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:finalisePayrollRun":action143 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:markPayrollRunPaid":action144 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:savePayrollSettings":action145 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP45":action146 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP60":action147 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:logAbsence":action148 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:requestLeave":action149 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:cancelOwnLeave":action150 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:approveLeaveRequest":action151 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:setLeaveAllowance":action152 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:rejectLeaveRequest":action153 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:createEmployee":action154 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:changeEmployeeStatus":action155 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeProfile":action156 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateOwnEmployeeDetails":action157 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeDocument":action158 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:linkEmployeeToUser":action159 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:completeEmployeeTask":action160 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeTask":action161 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeContact":action162 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeTask":action163 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:scheduleAppraisal":action164 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:completeAppraisal":action165 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getConductDesk":action166 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getMyConduct":action167 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getPlan":action168 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getCase":action169 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:conductChoices":action170 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:savePlan":action171 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addPlanReview":action172 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:commentOnPlan":action173 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:saveCase":action174 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:respondToCase":action175 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addCaseEvent":action176 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:submitExpenseClaim":action177 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:approveExpenseClaim":action178 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:rejectExpenseClaim":action179 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:scheduleOneToOne":action180 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:completeOneToOne":action181 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:listPolicies":action182 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:publishPolicy":action183 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:archivePolicy":action184 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:openPolicy":action185 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:createShift":action186 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:changeShiftStatus":action187 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyHR":action188 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyTeam":action189 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getTeamEmployee":action190 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:addPrivateNote":action191 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:updateWorkingPattern":action192 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:updateHrSettings":action193 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createAppraisalTemplate":action194 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleAppraisalTemplateActive":action195 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createOneToOneTemplate":action196 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleOneToOneTemplateActive":action197 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:getTimesheetContext":action198 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:saveTimesheet":action199 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:reviewTimesheet":action200 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:createPriceList":action201 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:savePriceEntry":action202 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveRule":action203 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:setRuleActive":action204 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:updatePriceBasis":action205 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:renamePriceList":action206 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:assignPriceListCustomers":action207 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:checkSalesPrice":action208 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:assignPriceList":action209 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewPriceCsv":action210 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyPriceCsv":action211 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreement":action212 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreementPrice":action213 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:removeAgreementPrice":action214 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewAgreementCsv":action215 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyAgreementCsv":action216 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProduct":action217 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProductRecord":action218 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveCategory":action219 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:retireCategory":action220 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:addStandardCategories":action221 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:savePack":action222 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveLinks":action223 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveMeasures":action224 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/actions:saveProfile":action225 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/work:loadAssignedWork":action226 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProject":action227 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeProjectStatus":action228 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editProject":action229 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProjectMember":action230 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:archiveProject":action231 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTask":action232 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeTaskStatus":action233 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editTask":action234 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:checklistItem":action235 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addDependency":action236 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMeeting":action237 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDocument":action238 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editDocument":action239 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addComment":action240 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMilestone":action241 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:publishUpdate":action242 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDecision":action243 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:decide":action244 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createRisk":action245 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:closeRisk":action246 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:requestApproval":action247 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:respondApproval":action248 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:submitRequest":action249 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:triageRequest":action250 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:logTime":action251 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:planToday":action252 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:updateInbox":action253 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveView":action254 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createPortfolio":action255 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createBaseline":action256 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setBudget":action257 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:linkWork":action258 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectActivity":action259 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createAutomation":action260 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:toggleAutomation":action261 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveProjectTemplate":action262 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:useProjectTemplate":action263 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:startTimer":action264 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:stopTimer":action265 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:projectPreference":action266 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:uploadProjectFile":action267 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:readProjectFile":action268 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProperty":action269 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProperty":action270 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:restoreDocument":action271 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTaskFromDocument":action272 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:discardTimer":action273 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:completeMilestone":action274 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:resolveComment":action275 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectWorkload":action276 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:newContractAction":action277 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:resendContractAction":action278 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:deleteContractAction":action279 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:createOrderForm":action280 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addLineForm":action281 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:removeLineForm":action282 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:confirmOrderForm":action283 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:updateOrderForm":action284 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:chooseOrderAddresses":action285 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addHoldForm":action286 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:releaseHoldForm":action287 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:approveOrderForm":action288 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:cancelOrderForm":action289 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:saveOrderHashtagsForm":action290 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:restoreCancelledOrderForm":action291 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:returnOrderToQuoteForm":action292 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:scheduleOrderDelivery":action293 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:rejectOrderApproval":action294 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:deleteOrderForm":action295 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:createQuote":action296 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:deleteQuoteForm":action297 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/settings/actions:saveCreationPolicy":action298 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/sites/actions:saveSiteAction":action299 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/sites/actions:setDocumentSiteAction":action300 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getSchedule":action301 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:createBulkShifts":action302 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:setScheduledShift":action303 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:completeShiftTask":action304 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:editScheduledShift":action305 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishWeekShifts":action306 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveHoursBudget":action307 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getTeamPlan":action308 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getPersonSchedule":action309 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveWorkType":action310 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:archiveWorkType":action311 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveDemand":action312 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveBusyRule":action313 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:removeBusyRule":action314 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:fillTeamMonth":action315 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:replanCover":action316 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishMonth":action317 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveShift":action318 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveRole":action319 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveMemberRoles":action320 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:createUser":action321 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyAccess":action322 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyProfile":action323 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveManagerPolicy":action324 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveWorkspaceDetails":action325 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyBrand":action326 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/imports/actions:importCsv":action327 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveEmailAccount":action328 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:verifyEmailAccount":action329 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:sendTestEmail":action330 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:makeDefaultAccount":action331 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:setAccountActive":action332 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteEmailAccount":action333 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveSocialAccount":action334 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteSocialAccount":action335 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:checkSocialAccount":action336 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveEmailTemplate":action337 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteEmailTemplate":action338 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:checkInboxNow":action339 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/logistics/actions:saveDispatchDelivery":action340 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveUserAccess":action341 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:setUserStatus":action342 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:revokeUserSessions":action343 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:issuePasswordRecovery":action344 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createManagedUser":action345 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:linkEmployeeProfile":action346 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createRole":action347 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveManagementGroup":action348 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createWarehouse":action349 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:adjustStock":action350 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:savePlanningAction":action351 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:makeFromForecastAction":action352 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:transferStock":action353 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createSiteAction":action354 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createPlaceAction":action355 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:assignSiteAction":action356 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:addLocationAction":action357 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:ensureLocationsAction":action358 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:retireLocationAction":action359 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:putOnLocationAction":action360 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:moveLocatedAction":action361 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:receiveMoveAction":action362 as (...args:never[])=>Promise<unknown>,
"src/core/approvals/actions:delegateApprovals":action363 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:loginAction":action364 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:logoutAction":action365 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:completePasswordRecovery":action366 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:changeOwnPassword":action367 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:signOutOtherSessions":action368 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:createContract":action369 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:sendContract":action370 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:shareContractLink":action371 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:deleteContract":action372 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:signContract":action373 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:declineContract":action374 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:loadPublicContract":action375 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:loadPublicContractFile":action376 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:checkForDuplicatesAction":action377 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:createCustomerAction":action378 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createCustomer":action379 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerStatus":action380 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:archiveCustomer":action381 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:unarchiveCustomer":action382 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteCustomer":action383 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createContact":action384 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateContact":action385 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteContact":action386 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createAddress":action387 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCommercialSettings":action388 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCreditLimit":action389 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setCreditHold":action390 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setPaymentTerm":action391 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createTaxRegistration":action392 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:markTaxRegistrationManuallyVerified":action393 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createBankAccount":action394 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:revealBankAccount":action395 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createDirectDebitMandate":action396 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:cancelDirectDebitMandate":action397 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createNote":action398 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:saveCustomerHashtags":action399 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerDetails":action400 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateAddress":action401 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:archiveAddress":action402 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commercial-actions:saveOrderingPreferences":action403 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setCustomerParent":action404 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:placeCustomer":action405 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:moveCustomer":action406 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setContactReportsTo":action407 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:saveCustomerTradingLink":action408 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:setInvoiceAccount":action409 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:archiveCustomerTradingLink":action410 as (...args:never[])=>Promise<unknown>,
"src/core/finance/actions:requestSalesInvoice":action411 as (...args:never[])=>Promise<unknown>,
"src/core/teams/actions:createWorkTeam":action412 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditBoard":action413 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:exportAuditReport":action414 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEcho":action415 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:postEchoNote":action416 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEchoInbox":action417 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditAccess":action418 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditOwnActivity":action419 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditAreas":action420 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:saveAutomation":action421 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:setAutomationEnabled":action422 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:deleteAutomation":action423 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:testOnPastEvent":action424 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:runNow":action425 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:logActivity":action426 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:completeActivity":action427 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/marketing-handoff:acceptMarketingHandoff":action428 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:createOpportunity":action429 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:moveOpportunityStage":action430 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityValue":action431 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityCloseDate":action432 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityForecastCategory":action433 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityNextAction":action434 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:winOpportunity":action435 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:loseOpportunity":action436 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addStakeholder":action437 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addMilestone":action438 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:toggleMilestone":action439 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:checkProspectDuplicatesAction":action440 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createProspect":action441 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:assignProspect":action442 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:setProspectLifecycleStage":action443 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:convertProspect":action444 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createIndustry":action445 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:saveProspectGrouping":action446 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProject":action447 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProjectFormAction":action448 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:saveSalesProjectAction":action449 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:saveNextActionAction":action450 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addProjectOrganisationAction":action451 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:removeProjectOrganisationAction":action452 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:makePrimaryOrganisationAction":action453 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addProjectStakeholderAction":action454 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:removeProjectStakeholderAction":action455 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:setDocumentSalesProjectAction":action456 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:deleteSalesProjectAction":action457 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:saveSurvey":action458 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:createSurveyFromTemplate":action459 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:setSurveyActive":action460 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:deleteSurvey":action461 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatScore":action462 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatComment":action463 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setupFinance":action464 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceDocument":action465 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:submitFinanceDocument":action466 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveApprovalPolicy":action467 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:decideFinanceApproval":action468 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPurchaseOrder":action469 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:raiseServiceCredit":action470 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postFinanceDocument":action471 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:recordGoodsReceipt":action472 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:onboardSupplier":action473 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveSupplier":action474 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:requestSupplierBankChange":action475 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:verifySupplierBank":action476 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceBank":action477 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:importBankTransactions":action478 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocateBankTransaction":action479 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPaymentRun":action480 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approvePaymentRun":action481 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createManualJournal":action482 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveManualJournal":action483 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:reverseJournal":action484 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setFinancePeriodState":action485 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceBudget":action486 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceAsset":action487 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postAssetDepreciation":action488 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:completeCloseTask":action489 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceContract":action490 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceScenario":action491 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:receiptForm":action492 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:journalForm":action493 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:statementForm":action494 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocationForm":action495 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:paymentRunForm":action496 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:policyForm":action497 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:scenarioForm":action498 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:uploadFinanceAttachment":action499 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateSalesInvoice":action500 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateInvoiceAdjustment":action501 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:voidFinanceDraft":action502 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceHome":action503 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:listFinanceDocuments":action504 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceDocument":action505 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceWorkspace":action506 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:financeChoices":action507 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getBudgetPositions":action508 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getInvoiceCashForecast":action509 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinancialReport":action510 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceCustomerContribution":action511 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:searchFinance":action512 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceAttachment":action513 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getSalesFinanceProjection":action514 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getReceivingWarehouses":action515 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:createProductionOrder":action516 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:markOrderReady":action517 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:releaseOrder":action518 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:closeOrder":action519 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:startWorkOrder":action520 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:pauseWorkOrder":action521 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:completeWorkOrder":action522 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:listForecasts":action523 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:setForecast":action524 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:deleteForecast":action525 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:runMrp":action526 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:firmSuggestion":action527 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:dismissSuggestion":action528 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:latestPlan":action529 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:loadPlant":action530 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveWorkCentre":action531 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveMachine":action532 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:retirePlantRecord":action533 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:schedulePreview":action534 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:rescheduleWorkOrder":action535 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:setWorkOrderLock":action536 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:listShifts":action537 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:saveShift":action538 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:deleteShift":action539 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:createCampaignAction":action540 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveCampaignBriefAction":action541 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveBudgetLineAction":action542 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deleteBudgetLineAction":action543 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveActivityAction":action544 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:setActivityStatusAction":action545 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deleteActivityAction":action546 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:addPaidSpendAction":action547 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deletePaidSpendAction":action548 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:createCampaignAction":action549 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveCampaignBriefAction":action550 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveBudgetLineAction":action551 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deleteBudgetLineAction":action552 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveActivityAction":action553 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:setActivityStatusAction":action554 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deleteActivityAction":action555 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:addPaidSpendAction":action556 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deletePaidSpendAction":action557 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createCampaign":action558 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updateCampaign":action559 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProfile":action560 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:recordPermission":action561 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:suppressProfile":action562 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createAudience":action563 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:previewAudience":action564 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createContent":action565 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:approveContent":action566 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createMessage":action567 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:lockSend":action568 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:cancelSend":action569 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:ingestEvent":action570 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourney":action571 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:publishJourney":action572 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:reviseJourney":action573 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProgram":action574 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createExperiment":action575 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:leadFeedback":action576 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:processJourneySteps":action577 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:saveMarketingPlan":action578 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addPlanActivity":action579 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updatePlanActivity":action580 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addBudgetLine":action581 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:submitBudgetToFinance":action582 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourneyMap":action583 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyStage":action584 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyTouch":action585 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:saveSocialPost":action586 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:deleteSocialPost":action587 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:retrySocialPost":action588 as (...args:never[])=>Promise<unknown>,
"src/modules/people/services/finance-expenses:getApprovedExpenseSource":action589 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createPlan":action590 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveCell":action591 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addMeasure":action592 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAssumption":action593 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDriver":action594 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addLink":action595 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createScenario":action596 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:promoteScenario":action597 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:submitPlan":action598 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:approvePlan":action599 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:lockPlan":action600 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addGoal":action601 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addInitiative":action602 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createProjectForInitiative":action603 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAction":action604 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeAction":action605 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addRisk":action606 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDependency":action607 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDecision":action608 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addComment":action609 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addUpdate":action610 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeReview":action611 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addReview":action612 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:distributeTargets":action613 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:importGrid":action614 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:sharePlan":action615 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:unsharePlan":action616 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:setPlanAudience":action617 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addNote":action618 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveGoalProgress":action619 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:savePlanBrief":action620 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:listProductionPlans":action621 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getPlanOptions":action622 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getProductionPlan":action623 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:createProductionPlan":action624 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:addProductionPlanLine":action625 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getAssignedPlanningWork":action626 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/queries:getPlanningCoverage":action627 as (...args:never[])=>Promise<unknown>,
"src/modules/products/services/make:saveProductRecipe":action628 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createSpecification":action629 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:setSpecificationStatus":action630 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createControlPoint":action631 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:executeInspection":action632 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:releaseHold":action633 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:reportNcr":action634 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrInvestigation":action635 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:addNcrAction":action636 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrAction":action637 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:closeNcr":action638 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSubstance":action639 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addSafetyDataSheet":action640 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCoshhAssessment":action641 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveSubstance":action642 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCompetence":action643 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSafetyDocument":action644 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:acknowledgeDocument":action645 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveAudit":action646 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addAuditFinding":action647 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveAudit":action648 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveChange":action649 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:advanceChange":action650 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:linkSafetyRecord":action651 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveSafetyProfile":action652 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRiskMatrix":action653 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createRisk":action654 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addControl":action655 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:rateAssessment":action656 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:approveAssessment":action657 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviseAssessment":action658 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:requestRiskReview":action659 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reportIncident":action660 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveImmediateControl":action661 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:openInvestigation":action662 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addCause":action663 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRootCause":action664 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviewRiddor":action665 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createSafetyAction":action666 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:advanceAction":action667 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:verifyAction":action668 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveWorkplaceRecord":action669 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createPermit":action670 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:advancePermit":action671 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:extendPermit":action672 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createIsolation":action673 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:applyIsolationLock":action674 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:verifyIsolation":action675 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:clearIsolation":action676 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:removeIsolationLock":action677 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:placeSafetyHold":action678 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:updateReturnToService":action679 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:releaseSafetyHold":action680 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:overrideSafetyHold":action681 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:saveStatutoryCheck":action682 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:completeInspection":action683 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createInspection":action684 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/address-actions:createSalesAddress":action685 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/catalogue-actions:createSalesCatalogueProduct":action686 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:sendQuote":action687 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:changeQuoteStatus":action688 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:deleteQuote":action689 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:duplicateDocument":action690 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:saveQuoteTemplate":action691 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:createOrderFromQuote":action692 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:linkCommercialProject":action693 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:openCallOffOrder":action694 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:raiseCallOff":action695 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:invoiceCallOffDelivery":action696 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:deliverAndInvoiceCallOff":action697 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/csv-import:importSalescsv":action698 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:addDeliveryAddress":action699 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:addInstaller":action700 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:pricePartyId":action701 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:linkOrderedFor":action702 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/documents:saveDocument":action703 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:saveInvoiceTemplate":action704 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:retireInvoiceTemplate":action705 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:attachCustomerInvoiceTemplate":action706 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:detachCustomerInvoiceTemplate":action707 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:createDraftOrder":action708 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addOrderLine":action709 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:removeOrderLine":action710 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:updateDraftOrderFields":action711 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:confirmOrder":action712 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:decideApproval":action713 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendLineQuantity":action714 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:overrideLinePrice":action715 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendRequestedDate":action716 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelOrder":action717 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:deleteOrder":action718 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelLineRemaining":action719 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addHold":action720 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:releaseHold":action721 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:restoreCancelledOrder":action722 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:returnOrderToQuote":action723 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:saveOrderHashtags":action724 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:saveSalesView":action725 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:archiveSalesView":action726 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createCase":action727 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateCase":action728 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:assignCase":action729 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:transitionCase":action730 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addCaseEntry":action731 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createDepartmentTicket":action732 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateDepartmentTicket":action733 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createQueue":action734 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addQueueMember":action735 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:linkCaseRecord":action736 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:creditChoices":action737 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:askFinanceForCredit":action738 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getCaseOwners":action739 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getDepartmentWork":action740 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readAvailability":action741 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readOrderChain":action742 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/export:inventoryExportRows":action743 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:createTeam":action744 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:renameTeam":action745 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:addMember":action746 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMember":action747 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveTask":action748 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:setTaskStatus":action749 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeTask":action750 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveCover":action751 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeCover":action752 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveHandover":action753 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:savePlace":action754 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveMoment":action755 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMoment":action756 as (...args:never[])=>Promise<unknown>
};
