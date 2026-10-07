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
import {createDealContract as action35} from "@/app/(app)/crm/contracts/actions";
import {updateValueFormAction as action36} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {updateCloseDateFormAction as action37} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {setNextActionFormAction as action38} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {setForecastCategoryFormAction as action39} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {winFormAction as action40} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {loseFormAction as action41} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addStakeholderFormAction as action42} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addMilestoneFormAction as action43} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {toggleMilestoneFormAction as action44} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {logOpportunityActivityFormAction as action45} from "@/app/(app)/crm/opportunities/[opportunityId]/actions";
import {addDealAction as action46} from "@/app/(app)/crm/pipeline/actions";
import {qualifyFormAction as action47} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {disqualifyFormAction as action48} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {nurtureFormAction as action49} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {logProspectActivityFormAction as action50} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {assignProspectFormAction as action51} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {assignProspectTaskFormAction as action52} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {convertProspectFormAction as action53} from "@/app/(app)/crm/prospect/[prospectId]/actions";
import {pinReportToDashboard as action54} from "@/app/(app)/crm/reports/actions";
import {createContactFormAction as action55} from "@/app/(app)/customers/[partyId]/actions";
import {updateContactFormAction as action56} from "@/app/(app)/customers/[partyId]/actions";
import {deleteContactFormAction as action57} from "@/app/(app)/customers/[partyId]/actions";
import {createAddressFormAction as action58} from "@/app/(app)/customers/[partyId]/actions";
import {createTaxRegistrationFormAction as action59} from "@/app/(app)/customers/[partyId]/actions";
import {markTaxVerifiedFormAction as action60} from "@/app/(app)/customers/[partyId]/actions";
import {createBankAccountFormAction as action61} from "@/app/(app)/customers/[partyId]/actions";
import {createDirectDebitFormAction as action62} from "@/app/(app)/customers/[partyId]/actions";
import {cancelDirectDebitFormAction as action63} from "@/app/(app)/customers/[partyId]/actions";
import {updateCreditLimitFormAction as action64} from "@/app/(app)/customers/[partyId]/actions";
import {toggleCreditHoldFormAction as action65} from "@/app/(app)/customers/[partyId]/actions";
import {createNoteFormAction as action66} from "@/app/(app)/customers/[partyId]/actions";
import {updateStatusFormAction as action67} from "@/app/(app)/customers/[partyId]/actions";
import {archiveCustomerFormAction as action68} from "@/app/(app)/customers/[partyId]/actions";
import {unarchiveCustomerFormAction as action69} from "@/app/(app)/customers/[partyId]/actions";
import {deleteCustomerFormAction as action70} from "@/app/(app)/customers/[partyId]/actions";
import {createKpi as action71} from "@/app/(app)/kpis/actions";
import {saveGoal as action72} from "@/app/(app)/kpis/actions";
import {updateKpi as action73} from "@/app/(app)/kpis/actions";
import {recordProgress as action74} from "@/app/(app)/kpis/actions";
import {closeGoal as action75} from "@/app/(app)/kpis/actions";
import {addPlanGoal as action76} from "@/app/(app)/kpis/actions";
import {closePlan as action77} from "@/app/(app)/kpis/actions";
import {commentOnPlan as action78} from "@/app/(app)/kpis/actions";
import {syncDemandAction as action79} from "@/app/(app)/logistics/actions";
import {restoreDeliveryAction as action80} from "@/app/(app)/logistics/actions";
import {releaseAction as action81} from "@/app/(app)/logistics/actions";
import {allocateAction as action82} from "@/app/(app)/logistics/actions";
import {directShipAction as action83} from "@/app/(app)/logistics/actions";
import {groupAction as action84} from "@/app/(app)/logistics/actions";
import {scanAction as action85} from "@/app/(app)/logistics/actions";
import {lotAction as action86} from "@/app/(app)/logistics/actions";
import {serialAction as action87} from "@/app/(app)/logistics/actions";
import {shortAction as action88} from "@/app/(app)/logistics/actions";
import {completeWorkAction as action89} from "@/app/(app)/logistics/actions";
import {claimAction as action90} from "@/app/(app)/logistics/actions";
import {shipFromPickAction as action91} from "@/app/(app)/logistics/actions";
import {packageAction as action92} from "@/app/(app)/logistics/actions";
import {weightAction as action93} from "@/app/(app)/logistics/actions";
import {stageAction as action94} from "@/app/(app)/logistics/actions";
import {labelAction as action95} from "@/app/(app)/logistics/actions";
import {dispatchAction as action96} from "@/app/(app)/logistics/actions";
import {trackingAction as action97} from "@/app/(app)/logistics/actions";
import {deliverAction as action98} from "@/app/(app)/logistics/actions";
import {loadCreateAction as action99} from "@/app/(app)/logistics/actions";
import {loadScanAction as action100} from "@/app/(app)/logistics/actions";
import {departAction as action101} from "@/app/(app)/logistics/actions";
import {expectAction as action102} from "@/app/(app)/logistics/actions";
import {receiveLineAction as action103} from "@/app/(app)/logistics/actions";
import {putAwayAction as action104} from "@/app/(app)/logistics/actions";
import {completeReceiptAction as action105} from "@/app/(app)/logistics/actions";
import {transferAction as action106} from "@/app/(app)/logistics/actions";
import {transferReceiveAction as action107} from "@/app/(app)/logistics/actions";
import {returnRequestAction as action108} from "@/app/(app)/logistics/actions";
import {authoriseReturnAction as action109} from "@/app/(app)/logistics/actions";
import {receiveReturnAction as action110} from "@/app/(app)/logistics/actions";
import {inspectAction as action111} from "@/app/(app)/logistics/actions";
import {closeReturnAction as action112} from "@/app/(app)/logistics/actions";
import {assignEquipmentAction as action113} from "@/app/(app)/logistics/actions";
import {packUnitAction as action114} from "@/app/(app)/logistics/actions";
import {saveHandlingTypeAction as action115} from "@/app/(app)/logistics/actions";
import {retireHandlingTypeAction as action116} from "@/app/(app)/logistics/actions";
import {removeHandlingTypeAction as action117} from "@/app/(app)/logistics/actions";
import {policyAction as action118} from "@/app/(app)/logistics/actions";
import {runMrpAction as action119} from "@/app/(app)/manufacturing/plan/actions";
import {firmSuggestionAction as action120} from "@/app/(app)/manufacturing/plan/actions";
import {dismissSuggestionAction as action121} from "@/app/(app)/manufacturing/plan/actions";
import {setForecastAction as action122} from "@/app/(app)/manufacturing/plan/actions";
import {deleteForecastAction as action123} from "@/app/(app)/manufacturing/plan/actions";
import {runMrpAction as action124} from "@/app/(app)/manufacturing/planning/actions";
import {firmPlannedOrderAction as action125} from "@/app/(app)/manufacturing/planning/actions";
import {dismissPlannedOrderAction as action126} from "@/app/(app)/manufacturing/planning/actions";
import {runMrpForm as action127} from "@/app/(app)/manufacturing/planning/form-actions";
import {firmPlannedOrderForm as action128} from "@/app/(app)/manufacturing/planning/form-actions";
import {dismissPlannedOrderForm as action129} from "@/app/(app)/manufacturing/planning/form-actions";
import {raiseProductionOrderAction as action130} from "@/app/(app)/manufacturing/produce/actions";
import {previewMoveAction as action131} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {commitMoveAction as action132} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {toggleLockAction as action133} from "@/app/(app)/manufacturing/schedule/scheduler-actions";
import {saveShiftAction as action134} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {deleteShiftAction as action135} from "@/app/(app)/manufacturing/schedule/shifts-actions";
import {startAction as action136} from "@/app/(app)/manufacturing/shop-floor/actions";
import {pauseAction as action137} from "@/app/(app)/manufacturing/shop-floor/actions";
import {completeAction as action138} from "@/app/(app)/manufacturing/shop-floor/actions";
import {loadNotices as action139} from "@/app/(app)/notices/actions";
import {clearNotice as action140} from "@/app/(app)/notices/actions";
import {clearNotices as action141} from "@/app/(app)/notices/actions";
import {createPayrollRun as action142} from "@/app/(app)/payroll/actions";
import {updatePayslipDeductions as action143} from "@/app/(app)/payroll/actions";
import {finalisePayrollRun as action144} from "@/app/(app)/payroll/actions";
import {markPayrollRunPaid as action145} from "@/app/(app)/payroll/actions";
import {savePayrollSettings as action146} from "@/app/(app)/payroll/actions";
import {issueP45 as action147} from "@/app/(app)/payroll/actions";
import {issueP60 as action148} from "@/app/(app)/payroll/actions";
import {logAbsence as action149} from "@/app/(app)/people/absence/actions";
import {requestLeave as action150} from "@/app/(app)/people/absence/actions";
import {cancelOwnLeave as action151} from "@/app/(app)/people/absence/actions";
import {approveLeaveRequest as action152} from "@/app/(app)/people/absence/actions";
import {setLeaveAllowance as action153} from "@/app/(app)/people/absence/actions";
import {rejectLeaveRequest as action154} from "@/app/(app)/people/absence/actions";
import {createEmployee as action155} from "@/app/(app)/people/actions";
import {changeEmployeeStatus as action156} from "@/app/(app)/people/actions";
import {updateEmployeeProfile as action157} from "@/app/(app)/people/actions";
import {updateOwnEmployeeDetails as action158} from "@/app/(app)/people/actions";
import {addEmployeeDocument as action159} from "@/app/(app)/people/actions";
import {linkEmployeeToUser as action160} from "@/app/(app)/people/actions";
import {completeEmployeeTask as action161} from "@/app/(app)/people/actions";
import {addEmployeeTask as action162} from "@/app/(app)/people/actions";
import {updateEmployeeContact as action163} from "@/app/(app)/people/actions";
import {updateEmployeeTask as action164} from "@/app/(app)/people/actions";
import {scheduleAppraisal as action165} from "@/app/(app)/people/appraisals/actions";
import {completeAppraisal as action166} from "@/app/(app)/people/appraisals/actions";
import {getConductDesk as action167} from "@/app/(app)/people/conduct/actions";
import {getMyConduct as action168} from "@/app/(app)/people/conduct/actions";
import {getPlan as action169} from "@/app/(app)/people/conduct/actions";
import {getCase as action170} from "@/app/(app)/people/conduct/actions";
import {conductChoices as action171} from "@/app/(app)/people/conduct/actions";
import {savePlan as action172} from "@/app/(app)/people/conduct/actions";
import {addPlanReview as action173} from "@/app/(app)/people/conduct/actions";
import {commentOnPlan as action174} from "@/app/(app)/people/conduct/actions";
import {saveCase as action175} from "@/app/(app)/people/conduct/actions";
import {respondToCase as action176} from "@/app/(app)/people/conduct/actions";
import {addCaseEvent as action177} from "@/app/(app)/people/conduct/actions";
import {submitExpenseClaim as action178} from "@/app/(app)/people/expenses/actions";
import {approveExpenseClaim as action179} from "@/app/(app)/people/expenses/actions";
import {rejectExpenseClaim as action180} from "@/app/(app)/people/expenses/actions";
import {scheduleOneToOne as action181} from "@/app/(app)/people/one-to-ones/actions";
import {completeOneToOne as action182} from "@/app/(app)/people/one-to-ones/actions";
import {listPolicies as action183} from "@/app/(app)/people/policies/actions";
import {publishPolicy as action184} from "@/app/(app)/people/policies/actions";
import {archivePolicy as action185} from "@/app/(app)/people/policies/actions";
import {openPolicy as action186} from "@/app/(app)/people/policies/actions";
import {createShift as action187} from "@/app/(app)/people/rotas/actions";
import {changeShiftStatus as action188} from "@/app/(app)/people/rotas/actions";
import {getMyHR as action189} from "@/app/(app)/people/self-service";
import {getMyTeam as action190} from "@/app/(app)/people/self-service";
import {getTeamEmployee as action191} from "@/app/(app)/people/self-service";
import {addPrivateNote as action192} from "@/app/(app)/people/self-service";
import {updateWorkingPattern as action193} from "@/app/(app)/people/self-service";
import {updateHrSettings as action194} from "@/app/(app)/people/settings/actions";
import {createAppraisalTemplate as action195} from "@/app/(app)/people/settings/actions";
import {toggleAppraisalTemplateActive as action196} from "@/app/(app)/people/settings/actions";
import {createOneToOneTemplate as action197} from "@/app/(app)/people/settings/actions";
import {toggleOneToOneTemplateActive as action198} from "@/app/(app)/people/settings/actions";
import {getTimesheetContext as action199} from "@/app/(app)/people/timesheets/actions";
import {saveTimesheet as action200} from "@/app/(app)/people/timesheets/actions";
import {reviewTimesheet as action201} from "@/app/(app)/people/timesheets/actions";
import {createPriceList as action202} from "@/app/(app)/pricing/actions";
import {savePriceEntry as action203} from "@/app/(app)/pricing/actions";
import {saveRule as action204} from "@/app/(app)/pricing/actions";
import {setRuleActive as action205} from "@/app/(app)/pricing/actions";
import {updatePriceBasis as action206} from "@/app/(app)/pricing/actions";
import {renamePriceList as action207} from "@/app/(app)/pricing/actions";
import {assignPriceListCustomers as action208} from "@/app/(app)/pricing/actions";
import {checkSalesPrice as action209} from "@/app/(app)/pricing/actions";
import {assignPriceList as action210} from "@/app/(app)/pricing/actions";
import {previewPriceCsv as action211} from "@/app/(app)/pricing/actions";
import {applyPriceCsv as action212} from "@/app/(app)/pricing/actions";
import {saveAgreement as action213} from "@/app/(app)/pricing/actions";
import {saveAgreementPrice as action214} from "@/app/(app)/pricing/actions";
import {removeAgreementPrice as action215} from "@/app/(app)/pricing/actions";
import {previewAgreementCsv as action216} from "@/app/(app)/pricing/actions";
import {applyAgreementCsv as action217} from "@/app/(app)/pricing/actions";
import {saveProduct as action218} from "@/app/(app)/products/actions";
import {saveProductRecord as action219} from "@/app/(app)/products/actions";
import {saveCategory as action220} from "@/app/(app)/products/actions";
import {retireCategory as action221} from "@/app/(app)/products/actions";
import {addStandardCategories as action222} from "@/app/(app)/products/actions";
import {savePack as action223} from "@/app/(app)/products/actions";
import {saveLinks as action224} from "@/app/(app)/products/actions";
import {saveMeasures as action225} from "@/app/(app)/products/actions";
import {saveProfile as action226} from "@/app/(app)/profile/actions";
import {loadAssignedWork as action227} from "@/app/(app)/profile/work";
import {createProject as action228} from "@/app/(app)/projects/actions";
import {changeProjectStatus as action229} from "@/app/(app)/projects/actions";
import {editProject as action230} from "@/app/(app)/projects/actions";
import {setProjectMember as action231} from "@/app/(app)/projects/actions";
import {archiveProject as action232} from "@/app/(app)/projects/actions";
import {createTask as action233} from "@/app/(app)/projects/actions";
import {changeTaskStatus as action234} from "@/app/(app)/projects/actions";
import {editTask as action235} from "@/app/(app)/projects/actions";
import {checklistItem as action236} from "@/app/(app)/projects/actions";
import {addDependency as action237} from "@/app/(app)/projects/actions";
import {createMeeting as action238} from "@/app/(app)/projects/actions";
import {createDocument as action239} from "@/app/(app)/projects/actions";
import {editDocument as action240} from "@/app/(app)/projects/actions";
import {addComment as action241} from "@/app/(app)/projects/actions";
import {createMilestone as action242} from "@/app/(app)/projects/actions";
import {publishUpdate as action243} from "@/app/(app)/projects/actions";
import {createDecision as action244} from "@/app/(app)/projects/actions";
import {decide as action245} from "@/app/(app)/projects/actions";
import {createRisk as action246} from "@/app/(app)/projects/actions";
import {closeRisk as action247} from "@/app/(app)/projects/actions";
import {requestApproval as action248} from "@/app/(app)/projects/actions";
import {respondApproval as action249} from "@/app/(app)/projects/actions";
import {submitRequest as action250} from "@/app/(app)/projects/actions";
import {triageRequest as action251} from "@/app/(app)/projects/actions";
import {logTime as action252} from "@/app/(app)/projects/actions";
import {planToday as action253} from "@/app/(app)/projects/actions";
import {updateInbox as action254} from "@/app/(app)/projects/actions";
import {saveView as action255} from "@/app/(app)/projects/actions";
import {createPortfolio as action256} from "@/app/(app)/projects/actions";
import {createBaseline as action257} from "@/app/(app)/projects/actions";
import {setBudget as action258} from "@/app/(app)/projects/actions";
import {linkWork as action259} from "@/app/(app)/projects/actions";
import {getProjectActivity as action260} from "@/app/(app)/projects/actions";
import {createAutomation as action261} from "@/app/(app)/projects/actions";
import {toggleAutomation as action262} from "@/app/(app)/projects/actions";
import {saveProjectTemplate as action263} from "@/app/(app)/projects/actions";
import {useProjectTemplate as action264} from "@/app/(app)/projects/actions";
import {startTimer as action265} from "@/app/(app)/projects/actions";
import {stopTimer as action266} from "@/app/(app)/projects/actions";
import {projectPreference as action267} from "@/app/(app)/projects/actions";
import {uploadProjectFile as action268} from "@/app/(app)/projects/actions";
import {readProjectFile as action269} from "@/app/(app)/projects/actions";
import {createProperty as action270} from "@/app/(app)/projects/actions";
import {setProperty as action271} from "@/app/(app)/projects/actions";
import {restoreDocument as action272} from "@/app/(app)/projects/actions";
import {createTaskFromDocument as action273} from "@/app/(app)/projects/actions";
import {discardTimer as action274} from "@/app/(app)/projects/actions";
import {completeMilestone as action275} from "@/app/(app)/projects/actions";
import {resolveComment as action276} from "@/app/(app)/projects/actions";
import {getProjectWorkload as action277} from "@/app/(app)/projects/actions";
import {newContractAction as action278} from "@/app/(app)/sales/contracts/actions";
import {resendContractAction as action279} from "@/app/(app)/sales/contracts/actions";
import {deleteContractAction as action280} from "@/app/(app)/sales/contracts/actions";
import {createOrderForm as action281} from "@/app/(app)/sales/orders/actions";
import {addLineForm as action282} from "@/app/(app)/sales/orders/actions";
import {removeLineForm as action283} from "@/app/(app)/sales/orders/actions";
import {confirmOrderForm as action284} from "@/app/(app)/sales/orders/actions";
import {updateOrderForm as action285} from "@/app/(app)/sales/orders/actions";
import {chooseOrderAddresses as action286} from "@/app/(app)/sales/orders/actions";
import {addHoldForm as action287} from "@/app/(app)/sales/orders/actions";
import {releaseHoldForm as action288} from "@/app/(app)/sales/orders/actions";
import {approveOrderForm as action289} from "@/app/(app)/sales/orders/actions";
import {cancelOrderForm as action290} from "@/app/(app)/sales/orders/actions";
import {saveOrderHashtagsForm as action291} from "@/app/(app)/sales/orders/actions";
import {restoreCancelledOrderForm as action292} from "@/app/(app)/sales/orders/actions";
import {returnOrderToQuoteForm as action293} from "@/app/(app)/sales/orders/actions";
import {scheduleOrderDelivery as action294} from "@/app/(app)/sales/orders/actions";
import {rejectOrderApproval as action295} from "@/app/(app)/sales/orders/actions";
import {deleteOrderForm as action296} from "@/app/(app)/sales/orders/actions";
import {createQuote as action297} from "@/app/(app)/sales/quotes/actions";
import {deleteQuoteForm as action298} from "@/app/(app)/sales/quotes/actions";
import {saveCreationPolicy as action299} from "@/app/(app)/sales/settings/actions";
import {saveSiteAction as action300} from "@/app/(app)/sales/sites/actions";
import {setDocumentSiteAction as action301} from "@/app/(app)/sales/sites/actions";
import {getSchedule as action302} from "@/app/(app)/scheduling/actions";
import {createBulkShifts as action303} from "@/app/(app)/scheduling/actions";
import {setScheduledShift as action304} from "@/app/(app)/scheduling/actions";
import {completeShiftTask as action305} from "@/app/(app)/scheduling/actions";
import {editScheduledShift as action306} from "@/app/(app)/scheduling/actions";
import {publishWeekShifts as action307} from "@/app/(app)/scheduling/actions";
import {saveHoursBudget as action308} from "@/app/(app)/scheduling/actions";
import {getTeamPlan as action309} from "@/app/(app)/scheduling/actions";
import {getPersonSchedule as action310} from "@/app/(app)/scheduling/actions";
import {saveWorkType as action311} from "@/app/(app)/scheduling/actions";
import {archiveWorkType as action312} from "@/app/(app)/scheduling/actions";
import {saveDemand as action313} from "@/app/(app)/scheduling/actions";
import {saveBusyRule as action314} from "@/app/(app)/scheduling/actions";
import {removeBusyRule as action315} from "@/app/(app)/scheduling/actions";
import {fillTeamMonth as action316} from "@/app/(app)/scheduling/actions";
import {replanCover as action317} from "@/app/(app)/scheduling/actions";
import {publishMonth as action318} from "@/app/(app)/scheduling/actions";
import {saveShift as action319} from "@/app/(app)/scheduling/actions";
import {saveRole as action320} from "@/app/(app)/settings/actions";
import {saveMemberRoles as action321} from "@/app/(app)/settings/actions";
import {createUser as action322} from "@/app/(app)/settings/actions";
import {saveCompanyAccess as action323} from "@/app/(app)/settings/actions";
import {saveCompanyProfile as action324} from "@/app/(app)/settings/actions";
import {saveManagerPolicy as action325} from "@/app/(app)/settings/actions";
import {saveWorkspaceDetails as action326} from "@/app/(app)/settings/actions";
import {saveCompanyBrand as action327} from "@/app/(app)/settings/actions";
import {importCsv as action328} from "@/app/(app)/settings/imports/actions";
import {saveEmailAccount as action329} from "@/app/(app)/settings/it/actions";
import {verifyEmailAccount as action330} from "@/app/(app)/settings/it/actions";
import {sendTestEmail as action331} from "@/app/(app)/settings/it/actions";
import {makeDefaultAccount as action332} from "@/app/(app)/settings/it/actions";
import {setAccountActive as action333} from "@/app/(app)/settings/it/actions";
import {deleteEmailAccount as action334} from "@/app/(app)/settings/it/actions";
import {saveSocialAccount as action335} from "@/app/(app)/settings/it/actions";
import {deleteSocialAccount as action336} from "@/app/(app)/settings/it/actions";
import {checkSocialAccount as action337} from "@/app/(app)/settings/it/actions";
import {saveEmailTemplate as action338} from "@/app/(app)/settings/it/actions";
import {deleteEmailTemplate as action339} from "@/app/(app)/settings/it/actions";
import {checkInboxNow as action340} from "@/app/(app)/settings/it/actions";
import {saveDispatchDelivery as action341} from "@/app/(app)/settings/logistics/actions";
import {saveUserAccess as action342} from "@/app/(app)/settings/user-actions";
import {setUserStatus as action343} from "@/app/(app)/settings/user-actions";
import {revokeUserSessions as action344} from "@/app/(app)/settings/user-actions";
import {issuePasswordRecovery as action345} from "@/app/(app)/settings/user-actions";
import {createManagedUser as action346} from "@/app/(app)/settings/user-actions";
import {linkEmployeeProfile as action347} from "@/app/(app)/settings/user-actions";
import {createRole as action348} from "@/app/(app)/settings/user-actions";
import {saveManagementGroup as action349} from "@/app/(app)/settings/user-actions";
import {createWarehouse as action350} from "@/app/(app)/stock/actions";
import {adjustStock as action351} from "@/app/(app)/stock/actions";
import {savePlanningAction as action352} from "@/app/(app)/stock/actions";
import {makeFromForecastAction as action353} from "@/app/(app)/stock/actions";
import {transferStock as action354} from "@/app/(app)/stock/actions";
import {createSiteAction as action355} from "@/app/(app)/stock/actions";
import {createPlaceAction as action356} from "@/app/(app)/stock/actions";
import {assignSiteAction as action357} from "@/app/(app)/stock/actions";
import {addLocationAction as action358} from "@/app/(app)/stock/actions";
import {ensureLocationsAction as action359} from "@/app/(app)/stock/actions";
import {retireLocationAction as action360} from "@/app/(app)/stock/actions";
import {putOnLocationAction as action361} from "@/app/(app)/stock/actions";
import {moveLocatedAction as action362} from "@/app/(app)/stock/actions";
import {receiveMoveAction as action363} from "@/app/(app)/stock/actions";
import {saveTemplate as action364} from "@/app/(app)/templates/actions";
import {archiveTemplate as action365} from "@/app/(app)/templates/actions";
import {generateTemplateDocument as action366} from "@/app/(app)/templates/actions";
import {delegateApprovals as action367} from "@/core/approvals/actions";
import {loginAction as action368} from "@/core/auth/actions";
import {logoutAction as action369} from "@/core/auth/actions";
import {completePasswordRecovery as action370} from "@/core/auth/security-actions";
import {changeOwnPassword as action371} from "@/core/auth/security-actions";
import {signOutOtherSessions as action372} from "@/core/auth/security-actions";
import {createContract as action373} from "@/core/contracts/actions";
import {sendContract as action374} from "@/core/contracts/actions";
import {shareContractLink as action375} from "@/core/contracts/actions";
import {updateDraftContract as action376} from "@/core/contracts/actions";
import {revokeContract as action377} from "@/core/contracts/actions";
import {deleteContract as action378} from "@/core/contracts/actions";
import {signContract as action379} from "@/core/contracts/actions";
import {returnSignedContract as action380} from "@/core/contracts/actions";
import {reviewContractReturn as action381} from "@/core/contracts/actions";
import {declineContract as action382} from "@/core/contracts/actions";
import {loadPublicContract as action383} from "@/core/contracts/actions";
import {loadPublicContractFile as action384} from "@/core/contracts/actions";
import {checkForDuplicatesAction as action385} from "@/core/customers/actions";
import {createCustomerAction as action386} from "@/core/customers/actions";
import {createCustomer as action387} from "@/core/customers/commands";
import {updateCustomerStatus as action388} from "@/core/customers/commands";
import {archiveCustomer as action389} from "@/core/customers/commands";
import {unarchiveCustomer as action390} from "@/core/customers/commands";
import {deleteCustomer as action391} from "@/core/customers/commands";
import {createContact as action392} from "@/core/customers/commands";
import {updateContact as action393} from "@/core/customers/commands";
import {deleteContact as action394} from "@/core/customers/commands";
import {createAddress as action395} from "@/core/customers/commands";
import {updateCommercialSettings as action396} from "@/core/customers/commands";
import {updateCreditLimit as action397} from "@/core/customers/commands";
import {setCreditHold as action398} from "@/core/customers/commands";
import {setPaymentTerm as action399} from "@/core/customers/commands";
import {createTaxRegistration as action400} from "@/core/customers/commands";
import {markTaxRegistrationManuallyVerified as action401} from "@/core/customers/commands";
import {createBankAccount as action402} from "@/core/customers/commands";
import {revealBankAccount as action403} from "@/core/customers/commands";
import {createDirectDebitMandate as action404} from "@/core/customers/commands";
import {cancelDirectDebitMandate as action405} from "@/core/customers/commands";
import {createNote as action406} from "@/core/customers/commands";
import {saveCustomerHashtags as action407} from "@/core/customers/commands";
import {updateCustomerDetails as action408} from "@/core/customers/commands";
import {updateAddress as action409} from "@/core/customers/commands";
import {archiveAddress as action410} from "@/core/customers/commands";
import {saveOrderingPreferences as action411} from "@/core/customers/commercial-actions";
import {setCustomerParent as action412} from "@/core/customers/hierarchy-actions";
import {placeCustomer as action413} from "@/core/customers/hierarchy-actions";
import {moveCustomer as action414} from "@/core/customers/hierarchy-actions";
import {setContactReportsTo as action415} from "@/core/customers/hierarchy-actions";
import {saveCustomerTradingLink as action416} from "@/core/customers/trading-actions";
import {setInvoiceAccount as action417} from "@/core/customers/trading-actions";
import {archiveCustomerTradingLink as action418} from "@/core/customers/trading-actions";
import {requestSalesInvoice as action419} from "@/core/finance/actions";
import {createWorkTeam as action420} from "@/core/teams/actions";
import {loadAuditBoard as action421} from "@/modules/audit/services/actions";
import {exportAuditReport as action422} from "@/modules/audit/services/actions";
import {loadEcho as action423} from "@/modules/audit/services/actions";
import {postEchoNote as action424} from "@/modules/audit/services/actions";
import {loadEchoInbox as action425} from "@/modules/audit/services/actions";
import {loadAuditAccess as action426} from "@/modules/audit/services/actions";
import {saveAuditOwnActivity as action427} from "@/modules/audit/services/actions";
import {saveAuditAreas as action428} from "@/modules/audit/services/actions";
import {saveAutomation as action429} from "@/modules/automations/services/actions";
import {setAutomationEnabled as action430} from "@/modules/automations/services/actions";
import {deleteAutomation as action431} from "@/modules/automations/services/actions";
import {testOnPastEvent as action432} from "@/modules/automations/services/actions";
import {runNow as action433} from "@/modules/automations/services/actions";
import {logActivity as action434} from "@/modules/crm/services/activities";
import {completeActivity as action435} from "@/modules/crm/services/activities";
import {acceptMarketingHandoff as action436} from "@/modules/crm/services/marketing-handoff";
import {createOpportunity as action437} from "@/modules/crm/services/opportunities";
import {moveOpportunityStage as action438} from "@/modules/crm/services/opportunities";
import {updateOpportunityValue as action439} from "@/modules/crm/services/opportunities";
import {updateOpportunityCloseDate as action440} from "@/modules/crm/services/opportunities";
import {setOpportunityForecastCategory as action441} from "@/modules/crm/services/opportunities";
import {setOpportunityNextAction as action442} from "@/modules/crm/services/opportunities";
import {winOpportunity as action443} from "@/modules/crm/services/opportunities";
import {loseOpportunity as action444} from "@/modules/crm/services/opportunities";
import {addStakeholder as action445} from "@/modules/crm/services/opportunities";
import {addMilestone as action446} from "@/modules/crm/services/opportunities";
import {toggleMilestone as action447} from "@/modules/crm/services/opportunities";
import {checkProspectDuplicatesAction as action448} from "@/modules/crm/services/prospects";
import {createProspect as action449} from "@/modules/crm/services/prospects";
import {assignProspect as action450} from "@/modules/crm/services/prospects";
import {setProspectLifecycleStage as action451} from "@/modules/crm/services/prospects";
import {convertProspect as action452} from "@/modules/crm/services/prospects";
import {createIndustry as action453} from "@/modules/crm/services/prospects";
import {saveProspectGrouping as action454} from "@/modules/crm/services/prospects";
import {createSalesProject as action455} from "@/modules/crm/services/sales-projects-commands";
import {createSalesProjectFormAction as action456} from "@/modules/crm/services/sales-projects-commands";
import {saveSalesProjectAction as action457} from "@/modules/crm/services/sales-projects-commands";
import {saveNextActionAction as action458} from "@/modules/crm/services/sales-projects-commands";
import {addProjectOrganisationAction as action459} from "@/modules/crm/services/sales-projects-commands";
import {removeProjectOrganisationAction as action460} from "@/modules/crm/services/sales-projects-commands";
import {makePrimaryOrganisationAction as action461} from "@/modules/crm/services/sales-projects-commands";
import {addProjectStakeholderAction as action462} from "@/modules/crm/services/sales-projects-commands";
import {removeProjectStakeholderAction as action463} from "@/modules/crm/services/sales-projects-commands";
import {setDocumentSalesProjectAction as action464} from "@/modules/crm/services/sales-projects-commands";
import {deleteSalesProjectAction as action465} from "@/modules/crm/services/sales-projects-commands";
import {saveSurvey as action466} from "@/modules/csat/services/actions";
import {createSurveyFromTemplate as action467} from "@/modules/csat/services/actions";
import {setSurveyActive as action468} from "@/modules/csat/services/actions";
import {deleteSurvey as action469} from "@/modules/csat/services/actions";
import {recordCsatScore as action470} from "@/modules/csat/services/actions";
import {recordCsatComment as action471} from "@/modules/csat/services/actions";
import {setupFinance as action472} from "@/modules/finance/services/commands";
import {createFinanceDocument as action473} from "@/modules/finance/services/commands";
import {submitFinanceDocument as action474} from "@/modules/finance/services/commands";
import {saveApprovalPolicy as action475} from "@/modules/finance/services/commands";
import {decideFinanceApproval as action476} from "@/modules/finance/services/commands";
import {createPurchaseOrder as action477} from "@/modules/finance/services/commands";
import {raiseServiceCredit as action478} from "@/modules/finance/services/commands";
import {postFinanceDocument as action479} from "@/modules/finance/services/commands";
import {recordGoodsReceipt as action480} from "@/modules/finance/services/commands";
import {onboardSupplier as action481} from "@/modules/finance/services/commands";
import {approveSupplier as action482} from "@/modules/finance/services/commands";
import {requestSupplierBankChange as action483} from "@/modules/finance/services/commands";
import {verifySupplierBank as action484} from "@/modules/finance/services/commands";
import {createFinanceBank as action485} from "@/modules/finance/services/commands";
import {importBankTransactions as action486} from "@/modules/finance/services/commands";
import {allocateBankTransaction as action487} from "@/modules/finance/services/commands";
import {createPaymentRun as action488} from "@/modules/finance/services/commands";
import {approvePaymentRun as action489} from "@/modules/finance/services/commands";
import {createManualJournal as action490} from "@/modules/finance/services/commands";
import {approveManualJournal as action491} from "@/modules/finance/services/commands";
import {reverseJournal as action492} from "@/modules/finance/services/commands";
import {setFinancePeriodState as action493} from "@/modules/finance/services/commands";
import {saveFinanceBudget as action494} from "@/modules/finance/services/commands";
import {saveFinanceAsset as action495} from "@/modules/finance/services/commands";
import {postAssetDepreciation as action496} from "@/modules/finance/services/commands";
import {completeCloseTask as action497} from "@/modules/finance/services/commands";
import {saveFinanceContract as action498} from "@/modules/finance/services/commands";
import {saveFinanceScenario as action499} from "@/modules/finance/services/commands";
import {receiptForm as action500} from "@/modules/finance/services/commands";
import {journalForm as action501} from "@/modules/finance/services/commands";
import {statementForm as action502} from "@/modules/finance/services/commands";
import {allocationForm as action503} from "@/modules/finance/services/commands";
import {paymentRunForm as action504} from "@/modules/finance/services/commands";
import {policyForm as action505} from "@/modules/finance/services/commands";
import {scenarioForm as action506} from "@/modules/finance/services/commands";
import {uploadFinanceAttachment as action507} from "@/modules/finance/services/commands";
import {generateSalesInvoice as action508} from "@/modules/finance/services/commands";
import {generateInvoiceAdjustment as action509} from "@/modules/finance/services/commands";
import {voidFinanceDraft as action510} from "@/modules/finance/services/commands";
import {getFinanceHome as action511} from "@/modules/finance/services/queries";
import {listFinanceDocuments as action512} from "@/modules/finance/services/queries";
import {getFinanceDocument as action513} from "@/modules/finance/services/queries";
import {getFinanceWorkspace as action514} from "@/modules/finance/services/queries";
import {financeChoices as action515} from "@/modules/finance/services/queries";
import {getBudgetPositions as action516} from "@/modules/finance/services/queries";
import {getInvoiceCashForecast as action517} from "@/modules/finance/services/queries";
import {getFinancialReport as action518} from "@/modules/finance/services/queries";
import {getFinanceCustomerContribution as action519} from "@/modules/finance/services/queries";
import {searchFinance as action520} from "@/modules/finance/services/queries";
import {getFinanceAttachment as action521} from "@/modules/finance/services/queries";
import {getSalesFinanceProjection as action522} from "@/modules/finance/services/queries";
import {getReceivingWarehouses as action523} from "@/modules/finance/services/queries";
import {createProductionOrder as action524} from "@/modules/manufacturing/services/commands";
import {markOrderReady as action525} from "@/modules/manufacturing/services/commands";
import {releaseOrder as action526} from "@/modules/manufacturing/services/commands";
import {closeOrder as action527} from "@/modules/manufacturing/services/commands";
import {startWorkOrder as action528} from "@/modules/manufacturing/services/commands";
import {pauseWorkOrder as action529} from "@/modules/manufacturing/services/commands";
import {completeWorkOrder as action530} from "@/modules/manufacturing/services/commands";
import {listForecasts as action531} from "@/modules/manufacturing/services/forecast";
import {setForecast as action532} from "@/modules/manufacturing/services/forecast";
import {deleteForecast as action533} from "@/modules/manufacturing/services/forecast";
import {runMrp as action534} from "@/modules/manufacturing/services/mrp";
import {firmSuggestion as action535} from "@/modules/manufacturing/services/mrp";
import {dismissSuggestion as action536} from "@/modules/manufacturing/services/mrp";
import {latestPlan as action537} from "@/modules/manufacturing/services/mrp";
import {loadPlant as action538} from "@/modules/manufacturing/services/plant";
import {saveWorkCentre as action539} from "@/modules/manufacturing/services/plant";
import {saveMachine as action540} from "@/modules/manufacturing/services/plant";
import {retirePlantRecord as action541} from "@/modules/manufacturing/services/plant";
import {schedulePreview as action542} from "@/modules/manufacturing/services/scheduler";
import {rescheduleWorkOrder as action543} from "@/modules/manufacturing/services/scheduler";
import {setWorkOrderLock as action544} from "@/modules/manufacturing/services/scheduler";
import {listShifts as action545} from "@/modules/manufacturing/services/shifts";
import {saveShift as action546} from "@/modules/manufacturing/services/shifts";
import {deleteShift as action547} from "@/modules/manufacturing/services/shifts";
import {createCampaignAction as action548} from "@/modules/marketing/services/campaign-actions 2";
import {saveCampaignBriefAction as action549} from "@/modules/marketing/services/campaign-actions 2";
import {saveBudgetLineAction as action550} from "@/modules/marketing/services/campaign-actions 2";
import {deleteBudgetLineAction as action551} from "@/modules/marketing/services/campaign-actions 2";
import {saveActivityAction as action552} from "@/modules/marketing/services/campaign-actions 2";
import {setActivityStatusAction as action553} from "@/modules/marketing/services/campaign-actions 2";
import {deleteActivityAction as action554} from "@/modules/marketing/services/campaign-actions 2";
import {addPaidSpendAction as action555} from "@/modules/marketing/services/campaign-actions 2";
import {deletePaidSpendAction as action556} from "@/modules/marketing/services/campaign-actions 2";
import {createCampaignAction as action557} from "@/modules/marketing/services/campaign-actions";
import {saveCampaignBriefAction as action558} from "@/modules/marketing/services/campaign-actions";
import {saveBudgetLineAction as action559} from "@/modules/marketing/services/campaign-actions";
import {deleteBudgetLineAction as action560} from "@/modules/marketing/services/campaign-actions";
import {saveActivityAction as action561} from "@/modules/marketing/services/campaign-actions";
import {setActivityStatusAction as action562} from "@/modules/marketing/services/campaign-actions";
import {deleteActivityAction as action563} from "@/modules/marketing/services/campaign-actions";
import {addPaidSpendAction as action564} from "@/modules/marketing/services/campaign-actions";
import {deletePaidSpendAction as action565} from "@/modules/marketing/services/campaign-actions";
import {createCampaign as action566} from "@/modules/marketing/services/commands";
import {updateCampaign as action567} from "@/modules/marketing/services/commands";
import {createProfile as action568} from "@/modules/marketing/services/commands";
import {recordPermission as action569} from "@/modules/marketing/services/commands";
import {suppressProfile as action570} from "@/modules/marketing/services/commands";
import {createAudience as action571} from "@/modules/marketing/services/commands";
import {previewAudience as action572} from "@/modules/marketing/services/commands";
import {createContent as action573} from "@/modules/marketing/services/commands";
import {approveContent as action574} from "@/modules/marketing/services/commands";
import {createMessage as action575} from "@/modules/marketing/services/commands";
import {lockSend as action576} from "@/modules/marketing/services/commands";
import {cancelSend as action577} from "@/modules/marketing/services/commands";
import {ingestEvent as action578} from "@/modules/marketing/services/commands";
import {createJourney as action579} from "@/modules/marketing/services/commands";
import {publishJourney as action580} from "@/modules/marketing/services/commands";
import {reviseJourney as action581} from "@/modules/marketing/services/commands";
import {createProgram as action582} from "@/modules/marketing/services/commands";
import {createExperiment as action583} from "@/modules/marketing/services/commands";
import {leadFeedback as action584} from "@/modules/marketing/services/commands";
import {processJourneySteps as action585} from "@/modules/marketing/services/commands";
import {saveMarketingPlan as action586} from "@/modules/marketing/services/commands";
import {addPlanActivity as action587} from "@/modules/marketing/services/commands";
import {updatePlanActivity as action588} from "@/modules/marketing/services/commands";
import {addBudgetLine as action589} from "@/modules/marketing/services/commands";
import {submitBudgetToFinance as action590} from "@/modules/marketing/services/commands";
import {createJourneyMap as action591} from "@/modules/marketing/services/commands";
import {addJourneyStage as action592} from "@/modules/marketing/services/commands";
import {addJourneyTouch as action593} from "@/modules/marketing/services/commands";
import {saveSocialPost as action594} from "@/modules/marketing/services/social-actions";
import {deleteSocialPost as action595} from "@/modules/marketing/services/social-actions";
import {retrySocialPost as action596} from "@/modules/marketing/services/social-actions";
import {getApprovedExpenseSource as action597} from "@/modules/people/services/finance-expenses";
import {createPlan as action598} from "@/modules/plan/services/commands";
import {saveCell as action599} from "@/modules/plan/services/commands";
import {addMeasure as action600} from "@/modules/plan/services/commands";
import {addAssumption as action601} from "@/modules/plan/services/commands";
import {addDriver as action602} from "@/modules/plan/services/commands";
import {addLink as action603} from "@/modules/plan/services/commands";
import {createScenario as action604} from "@/modules/plan/services/commands";
import {promoteScenario as action605} from "@/modules/plan/services/commands";
import {submitPlan as action606} from "@/modules/plan/services/commands";
import {approvePlan as action607} from "@/modules/plan/services/commands";
import {lockPlan as action608} from "@/modules/plan/services/commands";
import {addGoal as action609} from "@/modules/plan/services/commands";
import {addInitiative as action610} from "@/modules/plan/services/commands";
import {createProjectForInitiative as action611} from "@/modules/plan/services/commands";
import {addAction as action612} from "@/modules/plan/services/commands";
import {completeAction as action613} from "@/modules/plan/services/commands";
import {addRisk as action614} from "@/modules/plan/services/commands";
import {addDependency as action615} from "@/modules/plan/services/commands";
import {addDecision as action616} from "@/modules/plan/services/commands";
import {addComment as action617} from "@/modules/plan/services/commands";
import {addUpdate as action618} from "@/modules/plan/services/commands";
import {completeReview as action619} from "@/modules/plan/services/commands";
import {addReview as action620} from "@/modules/plan/services/commands";
import {distributeTargets as action621} from "@/modules/plan/services/commands";
import {importGrid as action622} from "@/modules/plan/services/commands";
import {sharePlan as action623} from "@/modules/plan/services/commands";
import {unsharePlan as action624} from "@/modules/plan/services/commands";
import {setPlanAudience as action625} from "@/modules/plan/services/commands";
import {addNote as action626} from "@/modules/plan/services/commands";
import {saveGoalProgress as action627} from "@/modules/plan/services/commands";
import {savePlanBrief as action628} from "@/modules/plan/services/commands";
import {listProductionPlans as action629} from "@/modules/planning/services/plans";
import {getPlanOptions as action630} from "@/modules/planning/services/plans";
import {getProductionPlan as action631} from "@/modules/planning/services/plans";
import {createProductionPlan as action632} from "@/modules/planning/services/plans";
import {addProductionPlanLine as action633} from "@/modules/planning/services/plans";
import {getAssignedPlanningWork as action634} from "@/modules/planning/services/plans";
import {getPlanningCoverage as action635} from "@/modules/planning/services/queries";
import {saveProductRecipe as action636} from "@/modules/products/services/make";
import {createSpecification as action637} from "@/modules/quality/services/commands";
import {setSpecificationStatus as action638} from "@/modules/quality/services/commands";
import {createControlPoint as action639} from "@/modules/quality/services/commands";
import {executeInspection as action640} from "@/modules/quality/services/commands";
import {releaseHold as action641} from "@/modules/quality/services/commands";
import {reportNcr as action642} from "@/modules/quality/services/commands";
import {updateNcrInvestigation as action643} from "@/modules/quality/services/commands";
import {addNcrAction as action644} from "@/modules/quality/services/commands";
import {updateNcrAction as action645} from "@/modules/quality/services/commands";
import {closeNcr as action646} from "@/modules/quality/services/commands";
import {saveSubstance as action647} from "@/modules/safety/services/assurance";
import {addSafetyDataSheet as action648} from "@/modules/safety/services/assurance";
import {saveCoshhAssessment as action649} from "@/modules/safety/services/assurance";
import {approveSubstance as action650} from "@/modules/safety/services/assurance";
import {saveCompetence as action651} from "@/modules/safety/services/assurance";
import {saveSafetyDocument as action652} from "@/modules/safety/services/assurance";
import {acknowledgeDocument as action653} from "@/modules/safety/services/assurance";
import {saveAudit as action654} from "@/modules/safety/services/assurance";
import {addAuditFinding as action655} from "@/modules/safety/services/assurance";
import {approveAudit as action656} from "@/modules/safety/services/assurance";
import {saveChange as action657} from "@/modules/safety/services/assurance";
import {advanceChange as action658} from "@/modules/safety/services/assurance";
import {linkSafetyRecord as action659} from "@/modules/safety/services/assurance";
import {saveSafetyProfile as action660} from "@/modules/safety/services/commands";
import {saveRiskMatrix as action661} from "@/modules/safety/services/commands";
import {createRisk as action662} from "@/modules/safety/services/commands";
import {addControl as action663} from "@/modules/safety/services/commands";
import {rateAssessment as action664} from "@/modules/safety/services/commands";
import {approveAssessment as action665} from "@/modules/safety/services/commands";
import {reviseAssessment as action666} from "@/modules/safety/services/commands";
import {requestRiskReview as action667} from "@/modules/safety/services/commands";
import {reportIncident as action668} from "@/modules/safety/services/commands";
import {saveImmediateControl as action669} from "@/modules/safety/services/commands";
import {openInvestigation as action670} from "@/modules/safety/services/commands";
import {addCause as action671} from "@/modules/safety/services/commands";
import {saveRootCause as action672} from "@/modules/safety/services/commands";
import {reviewRiddor as action673} from "@/modules/safety/services/commands";
import {createSafetyAction as action674} from "@/modules/safety/services/commands";
import {advanceAction as action675} from "@/modules/safety/services/commands";
import {verifyAction as action676} from "@/modules/safety/services/commands";
import {saveWorkplaceRecord as action677} from "@/modules/safety/services/commands";
import {createPermit as action678} from "@/modules/safety/services/control";
import {advancePermit as action679} from "@/modules/safety/services/control";
import {extendPermit as action680} from "@/modules/safety/services/control";
import {createIsolation as action681} from "@/modules/safety/services/control";
import {applyIsolationLock as action682} from "@/modules/safety/services/control";
import {verifyIsolation as action683} from "@/modules/safety/services/control";
import {clearIsolation as action684} from "@/modules/safety/services/control";
import {removeIsolationLock as action685} from "@/modules/safety/services/control";
import {placeSafetyHold as action686} from "@/modules/safety/services/control";
import {updateReturnToService as action687} from "@/modules/safety/services/control";
import {releaseSafetyHold as action688} from "@/modules/safety/services/control";
import {overrideSafetyHold as action689} from "@/modules/safety/services/control";
import {saveStatutoryCheck as action690} from "@/modules/safety/services/control";
import {completeInspection as action691} from "@/modules/safety/services/control";
import {createInspection as action692} from "@/modules/safety/services/control";
import {createSalesAddress as action693} from "@/modules/sales/services/address-actions";
import {createSalesCatalogueProduct as action694} from "@/modules/sales/services/catalogue-actions";
import {sendQuote as action695} from "@/modules/sales/services/commands";
import {changeQuoteStatus as action696} from "@/modules/sales/services/commands";
import {deleteQuote as action697} from "@/modules/sales/services/commands";
import {duplicateDocument as action698} from "@/modules/sales/services/commands";
import {saveQuoteTemplate as action699} from "@/modules/sales/services/commands";
import {createOrderFromQuote as action700} from "@/modules/sales/services/commands";
import {linkCommercialProject as action701} from "@/modules/sales/services/commercial";
import {openCallOffOrder as action702} from "@/modules/sales/services/commercial";
import {raiseCallOff as action703} from "@/modules/sales/services/commercial";
import {invoiceCallOffDelivery as action704} from "@/modules/sales/services/commercial";
import {deliverAndInvoiceCallOff as action705} from "@/modules/sales/services/commercial";
import {importSalescsv as action706} from "@/modules/sales/services/csv-import";
import {addDeliveryAddress as action707} from "@/modules/sales/services/delivery-address";
import {addInstaller as action708} from "@/modules/sales/services/delivery-address";
import {pricePartyId as action709} from "@/modules/sales/services/delivery-address";
import {linkOrderedFor as action710} from "@/modules/sales/services/delivery-address";
import {saveDocument as action711} from "@/modules/sales/services/documents";
import {saveInvoiceTemplate as action712} from "@/modules/sales/services/invoice-template-actions";
import {retireInvoiceTemplate as action713} from "@/modules/sales/services/invoice-template-actions";
import {attachCustomerInvoiceTemplate as action714} from "@/modules/sales/services/invoice-template-actions";
import {detachCustomerInvoiceTemplate as action715} from "@/modules/sales/services/invoice-template-actions";
import {createDraftOrder as action716} from "@/modules/sales/services/orders";
import {addOrderLine as action717} from "@/modules/sales/services/orders";
import {removeOrderLine as action718} from "@/modules/sales/services/orders";
import {updateDraftOrderFields as action719} from "@/modules/sales/services/orders";
import {confirmOrder as action720} from "@/modules/sales/services/orders";
import {decideApproval as action721} from "@/modules/sales/services/orders";
import {amendLineQuantity as action722} from "@/modules/sales/services/orders";
import {overrideLinePrice as action723} from "@/modules/sales/services/orders";
import {amendRequestedDate as action724} from "@/modules/sales/services/orders";
import {cancelOrder as action725} from "@/modules/sales/services/orders";
import {deleteOrder as action726} from "@/modules/sales/services/orders";
import {cancelLineRemaining as action727} from "@/modules/sales/services/orders";
import {addHold as action728} from "@/modules/sales/services/orders";
import {releaseHold as action729} from "@/modules/sales/services/orders";
import {restoreCancelledOrder as action730} from "@/modules/sales/services/rewind";
import {returnOrderToQuote as action731} from "@/modules/sales/services/rewind";
import {saveOrderHashtags as action732} from "@/modules/sales/services/rewind";
import {saveSalesView as action733} from "@/modules/sales/services/saved-views";
import {archiveSalesView as action734} from "@/modules/sales/services/saved-views";
import {createCase as action735} from "@/modules/service/services/commands";
import {updateCase as action736} from "@/modules/service/services/commands";
import {assignCase as action737} from "@/modules/service/services/commands";
import {transitionCase as action738} from "@/modules/service/services/commands";
import {addCaseEntry as action739} from "@/modules/service/services/commands";
import {createDepartmentTicket as action740} from "@/modules/service/services/commands";
import {updateDepartmentTicket as action741} from "@/modules/service/services/commands";
import {createQueue as action742} from "@/modules/service/services/commands";
import {addQueueMember as action743} from "@/modules/service/services/commands";
import {linkCaseRecord as action744} from "@/modules/service/services/commands";
import {creditChoices as action745} from "@/modules/service/services/commands";
import {askFinanceForCredit as action746} from "@/modules/service/services/commands";
import {getCaseOwners as action747} from "@/modules/service/services/commands";
import {getDepartmentWork as action748} from "@/modules/service/services/commands";
import {readAvailability as action749} from "@/modules/stock/services/availability";
import {readOrderChain as action750} from "@/modules/stock/services/availability";
import {inventoryExportRows as action751} from "@/modules/stock/services/export";
import {createTeam as action752} from "@/modules/teams/services/commands";
import {renameTeam as action753} from "@/modules/teams/services/commands";
import {addMember as action754} from "@/modules/teams/services/commands";
import {removeMember as action755} from "@/modules/teams/services/commands";
import {saveTask as action756} from "@/modules/teams/services/commands";
import {setTaskStatus as action757} from "@/modules/teams/services/commands";
import {removeTask as action758} from "@/modules/teams/services/commands";
import {saveCover as action759} from "@/modules/teams/services/commands";
import {removeCover as action760} from "@/modules/teams/services/commands";
import {saveHandover as action761} from "@/modules/teams/services/commands";
import {savePlace as action762} from "@/modules/teams/services/commands";
import {saveMoment as action763} from "@/modules/teams/services/commands";
import {removeMoment as action764} from "@/modules/teams/services/commands";
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
"src/app/(app)/crm/contracts/actions:createDealContract":action35 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:updateValueFormAction":action36 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:updateCloseDateFormAction":action37 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:setNextActionFormAction":action38 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:setForecastCategoryFormAction":action39 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:winFormAction":action40 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:loseFormAction":action41 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:addStakeholderFormAction":action42 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:addMilestoneFormAction":action43 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:toggleMilestoneFormAction":action44 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/opportunities/[opportunityId]/actions:logOpportunityActivityFormAction":action45 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/pipeline/actions:addDealAction":action46 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:qualifyFormAction":action47 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:disqualifyFormAction":action48 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:nurtureFormAction":action49 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:logProspectActivityFormAction":action50 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:assignProspectFormAction":action51 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:assignProspectTaskFormAction":action52 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/prospect/[prospectId]/actions:convertProspectFormAction":action53 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/crm/reports/actions:pinReportToDashboard":action54 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createContactFormAction":action55 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateContactFormAction":action56 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:deleteContactFormAction":action57 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createAddressFormAction":action58 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createTaxRegistrationFormAction":action59 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:markTaxVerifiedFormAction":action60 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createBankAccountFormAction":action61 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createDirectDebitFormAction":action62 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:cancelDirectDebitFormAction":action63 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateCreditLimitFormAction":action64 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:toggleCreditHoldFormAction":action65 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:createNoteFormAction":action66 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:updateStatusFormAction":action67 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:archiveCustomerFormAction":action68 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:unarchiveCustomerFormAction":action69 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/customers/[partyId]/actions:deleteCustomerFormAction":action70 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:createKpi":action71 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:saveGoal":action72 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:updateKpi":action73 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:recordProgress":action74 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:closeGoal":action75 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:addPlanGoal":action76 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:closePlan":action77 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/kpis/actions:commentOnPlan":action78 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:syncDemandAction":action79 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:restoreDeliveryAction":action80 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:releaseAction":action81 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:allocateAction":action82 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:directShipAction":action83 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:groupAction":action84 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:scanAction":action85 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:lotAction":action86 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:serialAction":action87 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shortAction":action88 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeWorkAction":action89 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:claimAction":action90 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:shipFromPickAction":action91 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packageAction":action92 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:weightAction":action93 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:stageAction":action94 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:labelAction":action95 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:dispatchAction":action96 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:trackingAction":action97 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:deliverAction":action98 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadCreateAction":action99 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:loadScanAction":action100 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:departAction":action101 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:expectAction":action102 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveLineAction":action103 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:putAwayAction":action104 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:completeReceiptAction":action105 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferAction":action106 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:transferReceiveAction":action107 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:returnRequestAction":action108 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:authoriseReturnAction":action109 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:receiveReturnAction":action110 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:inspectAction":action111 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:closeReturnAction":action112 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:assignEquipmentAction":action113 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:packUnitAction":action114 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:saveHandlingTypeAction":action115 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:retireHandlingTypeAction":action116 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:removeHandlingTypeAction":action117 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/logistics/actions:policyAction":action118 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:runMrpAction":action119 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:firmSuggestionAction":action120 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:dismissSuggestionAction":action121 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:setForecastAction":action122 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/plan/actions:deleteForecastAction":action123 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:runMrpAction":action124 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:firmPlannedOrderAction":action125 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/actions:dismissPlannedOrderAction":action126 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:runMrpForm":action127 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:firmPlannedOrderForm":action128 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/planning/form-actions:dismissPlannedOrderForm":action129 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/produce/actions:raiseProductionOrderAction":action130 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:previewMoveAction":action131 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:commitMoveAction":action132 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/scheduler-actions:toggleLockAction":action133 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:saveShiftAction":action134 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/schedule/shifts-actions:deleteShiftAction":action135 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:startAction":action136 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:pauseAction":action137 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/manufacturing/shop-floor/actions:completeAction":action138 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:loadNotices":action139 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotice":action140 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/notices/actions:clearNotices":action141 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:createPayrollRun":action142 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:updatePayslipDeductions":action143 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:finalisePayrollRun":action144 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:markPayrollRunPaid":action145 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:savePayrollSettings":action146 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP45":action147 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/payroll/actions:issueP60":action148 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:logAbsence":action149 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:requestLeave":action150 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:cancelOwnLeave":action151 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:approveLeaveRequest":action152 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:setLeaveAllowance":action153 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/absence/actions:rejectLeaveRequest":action154 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:createEmployee":action155 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:changeEmployeeStatus":action156 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeProfile":action157 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateOwnEmployeeDetails":action158 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeDocument":action159 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:linkEmployeeToUser":action160 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:completeEmployeeTask":action161 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:addEmployeeTask":action162 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeContact":action163 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/actions:updateEmployeeTask":action164 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:scheduleAppraisal":action165 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/appraisals/actions:completeAppraisal":action166 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getConductDesk":action167 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getMyConduct":action168 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getPlan":action169 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:getCase":action170 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:conductChoices":action171 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:savePlan":action172 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addPlanReview":action173 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:commentOnPlan":action174 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:saveCase":action175 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:respondToCase":action176 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/conduct/actions:addCaseEvent":action177 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:submitExpenseClaim":action178 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:approveExpenseClaim":action179 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/expenses/actions:rejectExpenseClaim":action180 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:scheduleOneToOne":action181 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/one-to-ones/actions:completeOneToOne":action182 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:listPolicies":action183 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:publishPolicy":action184 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:archivePolicy":action185 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/policies/actions:openPolicy":action186 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:createShift":action187 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/rotas/actions:changeShiftStatus":action188 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyHR":action189 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getMyTeam":action190 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:getTeamEmployee":action191 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:addPrivateNote":action192 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/self-service:updateWorkingPattern":action193 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:updateHrSettings":action194 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createAppraisalTemplate":action195 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleAppraisalTemplateActive":action196 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:createOneToOneTemplate":action197 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/settings/actions:toggleOneToOneTemplateActive":action198 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:getTimesheetContext":action199 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:saveTimesheet":action200 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/people/timesheets/actions:reviewTimesheet":action201 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:createPriceList":action202 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:savePriceEntry":action203 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveRule":action204 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:setRuleActive":action205 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:updatePriceBasis":action206 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:renamePriceList":action207 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:assignPriceListCustomers":action208 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:checkSalesPrice":action209 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:assignPriceList":action210 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewPriceCsv":action211 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyPriceCsv":action212 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreement":action213 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:saveAgreementPrice":action214 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:removeAgreementPrice":action215 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:previewAgreementCsv":action216 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/pricing/actions:applyAgreementCsv":action217 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProduct":action218 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveProductRecord":action219 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveCategory":action220 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:retireCategory":action221 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:addStandardCategories":action222 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:savePack":action223 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveLinks":action224 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/products/actions:saveMeasures":action225 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/actions:saveProfile":action226 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/profile/work:loadAssignedWork":action227 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProject":action228 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeProjectStatus":action229 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editProject":action230 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProjectMember":action231 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:archiveProject":action232 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTask":action233 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:changeTaskStatus":action234 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editTask":action235 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:checklistItem":action236 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addDependency":action237 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMeeting":action238 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDocument":action239 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:editDocument":action240 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:addComment":action241 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createMilestone":action242 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:publishUpdate":action243 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createDecision":action244 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:decide":action245 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createRisk":action246 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:closeRisk":action247 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:requestApproval":action248 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:respondApproval":action249 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:submitRequest":action250 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:triageRequest":action251 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:logTime":action252 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:planToday":action253 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:updateInbox":action254 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveView":action255 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createPortfolio":action256 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createBaseline":action257 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setBudget":action258 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:linkWork":action259 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectActivity":action260 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createAutomation":action261 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:toggleAutomation":action262 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:saveProjectTemplate":action263 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:useProjectTemplate":action264 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:startTimer":action265 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:stopTimer":action266 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:projectPreference":action267 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:uploadProjectFile":action268 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:readProjectFile":action269 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createProperty":action270 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:setProperty":action271 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:restoreDocument":action272 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:createTaskFromDocument":action273 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:discardTimer":action274 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:completeMilestone":action275 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:resolveComment":action276 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/projects/actions:getProjectWorkload":action277 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:newContractAction":action278 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:resendContractAction":action279 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/contracts/actions:deleteContractAction":action280 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:createOrderForm":action281 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addLineForm":action282 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:removeLineForm":action283 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:confirmOrderForm":action284 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:updateOrderForm":action285 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:chooseOrderAddresses":action286 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:addHoldForm":action287 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:releaseHoldForm":action288 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:approveOrderForm":action289 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:cancelOrderForm":action290 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:saveOrderHashtagsForm":action291 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:restoreCancelledOrderForm":action292 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:returnOrderToQuoteForm":action293 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:scheduleOrderDelivery":action294 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:rejectOrderApproval":action295 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/orders/actions:deleteOrderForm":action296 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:createQuote":action297 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/quotes/actions:deleteQuoteForm":action298 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/settings/actions:saveCreationPolicy":action299 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/sites/actions:saveSiteAction":action300 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/sales/sites/actions:setDocumentSiteAction":action301 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getSchedule":action302 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:createBulkShifts":action303 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:setScheduledShift":action304 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:completeShiftTask":action305 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:editScheduledShift":action306 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishWeekShifts":action307 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveHoursBudget":action308 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getTeamPlan":action309 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:getPersonSchedule":action310 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveWorkType":action311 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:archiveWorkType":action312 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveDemand":action313 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveBusyRule":action314 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:removeBusyRule":action315 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:fillTeamMonth":action316 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:replanCover":action317 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:publishMonth":action318 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/scheduling/actions:saveShift":action319 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveRole":action320 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveMemberRoles":action321 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:createUser":action322 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyAccess":action323 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyProfile":action324 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveManagerPolicy":action325 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveWorkspaceDetails":action326 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/actions:saveCompanyBrand":action327 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/imports/actions:importCsv":action328 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveEmailAccount":action329 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:verifyEmailAccount":action330 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:sendTestEmail":action331 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:makeDefaultAccount":action332 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:setAccountActive":action333 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteEmailAccount":action334 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveSocialAccount":action335 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteSocialAccount":action336 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:checkSocialAccount":action337 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:saveEmailTemplate":action338 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:deleteEmailTemplate":action339 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/it/actions:checkInboxNow":action340 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/logistics/actions:saveDispatchDelivery":action341 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveUserAccess":action342 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:setUserStatus":action343 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:revokeUserSessions":action344 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:issuePasswordRecovery":action345 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createManagedUser":action346 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:linkEmployeeProfile":action347 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:createRole":action348 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/settings/user-actions:saveManagementGroup":action349 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createWarehouse":action350 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:adjustStock":action351 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:savePlanningAction":action352 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:makeFromForecastAction":action353 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:transferStock":action354 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createSiteAction":action355 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:createPlaceAction":action356 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:assignSiteAction":action357 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:addLocationAction":action358 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:ensureLocationsAction":action359 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:retireLocationAction":action360 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:putOnLocationAction":action361 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:moveLocatedAction":action362 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/stock/actions:receiveMoveAction":action363 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/templates/actions:saveTemplate":action364 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/templates/actions:archiveTemplate":action365 as (...args:never[])=>Promise<unknown>,
"src/app/(app)/templates/actions:generateTemplateDocument":action366 as (...args:never[])=>Promise<unknown>,
"src/core/approvals/actions:delegateApprovals":action367 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:loginAction":action368 as (...args:never[])=>Promise<unknown>,
"src/core/auth/actions:logoutAction":action369 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:completePasswordRecovery":action370 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:changeOwnPassword":action371 as (...args:never[])=>Promise<unknown>,
"src/core/auth/security-actions:signOutOtherSessions":action372 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:createContract":action373 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:sendContract":action374 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:shareContractLink":action375 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:updateDraftContract":action376 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:revokeContract":action377 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:deleteContract":action378 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:signContract":action379 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:returnSignedContract":action380 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:reviewContractReturn":action381 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:declineContract":action382 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:loadPublicContract":action383 as (...args:never[])=>Promise<unknown>,
"src/core/contracts/actions:loadPublicContractFile":action384 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:checkForDuplicatesAction":action385 as (...args:never[])=>Promise<unknown>,
"src/core/customers/actions:createCustomerAction":action386 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createCustomer":action387 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerStatus":action388 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:archiveCustomer":action389 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:unarchiveCustomer":action390 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteCustomer":action391 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createContact":action392 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateContact":action393 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:deleteContact":action394 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createAddress":action395 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCommercialSettings":action396 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCreditLimit":action397 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setCreditHold":action398 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:setPaymentTerm":action399 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createTaxRegistration":action400 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:markTaxRegistrationManuallyVerified":action401 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createBankAccount":action402 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:revealBankAccount":action403 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createDirectDebitMandate":action404 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:cancelDirectDebitMandate":action405 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:createNote":action406 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:saveCustomerHashtags":action407 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateCustomerDetails":action408 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:updateAddress":action409 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commands:archiveAddress":action410 as (...args:never[])=>Promise<unknown>,
"src/core/customers/commercial-actions:saveOrderingPreferences":action411 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setCustomerParent":action412 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:placeCustomer":action413 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:moveCustomer":action414 as (...args:never[])=>Promise<unknown>,
"src/core/customers/hierarchy-actions:setContactReportsTo":action415 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:saveCustomerTradingLink":action416 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:setInvoiceAccount":action417 as (...args:never[])=>Promise<unknown>,
"src/core/customers/trading-actions:archiveCustomerTradingLink":action418 as (...args:never[])=>Promise<unknown>,
"src/core/finance/actions:requestSalesInvoice":action419 as (...args:never[])=>Promise<unknown>,
"src/core/teams/actions:createWorkTeam":action420 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditBoard":action421 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:exportAuditReport":action422 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEcho":action423 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:postEchoNote":action424 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadEchoInbox":action425 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:loadAuditAccess":action426 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditOwnActivity":action427 as (...args:never[])=>Promise<unknown>,
"src/modules/audit/services/actions:saveAuditAreas":action428 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:saveAutomation":action429 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:setAutomationEnabled":action430 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:deleteAutomation":action431 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:testOnPastEvent":action432 as (...args:never[])=>Promise<unknown>,
"src/modules/automations/services/actions:runNow":action433 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:logActivity":action434 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/activities:completeActivity":action435 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/marketing-handoff:acceptMarketingHandoff":action436 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:createOpportunity":action437 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:moveOpportunityStage":action438 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityValue":action439 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:updateOpportunityCloseDate":action440 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityForecastCategory":action441 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:setOpportunityNextAction":action442 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:winOpportunity":action443 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:loseOpportunity":action444 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addStakeholder":action445 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:addMilestone":action446 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/opportunities:toggleMilestone":action447 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:checkProspectDuplicatesAction":action448 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createProspect":action449 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:assignProspect":action450 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:setProspectLifecycleStage":action451 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:convertProspect":action452 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:createIndustry":action453 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/prospects:saveProspectGrouping":action454 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProject":action455 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:createSalesProjectFormAction":action456 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:saveSalesProjectAction":action457 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:saveNextActionAction":action458 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addProjectOrganisationAction":action459 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:removeProjectOrganisationAction":action460 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:makePrimaryOrganisationAction":action461 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:addProjectStakeholderAction":action462 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:removeProjectStakeholderAction":action463 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:setDocumentSalesProjectAction":action464 as (...args:never[])=>Promise<unknown>,
"src/modules/crm/services/sales-projects-commands:deleteSalesProjectAction":action465 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:saveSurvey":action466 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:createSurveyFromTemplate":action467 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:setSurveyActive":action468 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:deleteSurvey":action469 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatScore":action470 as (...args:never[])=>Promise<unknown>,
"src/modules/csat/services/actions:recordCsatComment":action471 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setupFinance":action472 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceDocument":action473 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:submitFinanceDocument":action474 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveApprovalPolicy":action475 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:decideFinanceApproval":action476 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPurchaseOrder":action477 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:raiseServiceCredit":action478 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postFinanceDocument":action479 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:recordGoodsReceipt":action480 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:onboardSupplier":action481 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveSupplier":action482 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:requestSupplierBankChange":action483 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:verifySupplierBank":action484 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createFinanceBank":action485 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:importBankTransactions":action486 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocateBankTransaction":action487 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createPaymentRun":action488 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approvePaymentRun":action489 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:createManualJournal":action490 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:approveManualJournal":action491 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:reverseJournal":action492 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:setFinancePeriodState":action493 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceBudget":action494 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceAsset":action495 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:postAssetDepreciation":action496 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:completeCloseTask":action497 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceContract":action498 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:saveFinanceScenario":action499 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:receiptForm":action500 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:journalForm":action501 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:statementForm":action502 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:allocationForm":action503 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:paymentRunForm":action504 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:policyForm":action505 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:scenarioForm":action506 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:uploadFinanceAttachment":action507 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateSalesInvoice":action508 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:generateInvoiceAdjustment":action509 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/commands:voidFinanceDraft":action510 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceHome":action511 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:listFinanceDocuments":action512 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceDocument":action513 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceWorkspace":action514 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:financeChoices":action515 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getBudgetPositions":action516 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getInvoiceCashForecast":action517 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinancialReport":action518 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceCustomerContribution":action519 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:searchFinance":action520 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getFinanceAttachment":action521 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getSalesFinanceProjection":action522 as (...args:never[])=>Promise<unknown>,
"src/modules/finance/services/queries:getReceivingWarehouses":action523 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:createProductionOrder":action524 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:markOrderReady":action525 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:releaseOrder":action526 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:closeOrder":action527 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:startWorkOrder":action528 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:pauseWorkOrder":action529 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/commands:completeWorkOrder":action530 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:listForecasts":action531 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:setForecast":action532 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/forecast:deleteForecast":action533 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:runMrp":action534 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:firmSuggestion":action535 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:dismissSuggestion":action536 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/mrp:latestPlan":action537 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:loadPlant":action538 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveWorkCentre":action539 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:saveMachine":action540 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/plant:retirePlantRecord":action541 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:schedulePreview":action542 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:rescheduleWorkOrder":action543 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/scheduler:setWorkOrderLock":action544 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:listShifts":action545 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:saveShift":action546 as (...args:never[])=>Promise<unknown>,
"src/modules/manufacturing/services/shifts:deleteShift":action547 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:createCampaignAction":action548 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveCampaignBriefAction":action549 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveBudgetLineAction":action550 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deleteBudgetLineAction":action551 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:saveActivityAction":action552 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:setActivityStatusAction":action553 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deleteActivityAction":action554 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:addPaidSpendAction":action555 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions 2:deletePaidSpendAction":action556 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:createCampaignAction":action557 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveCampaignBriefAction":action558 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveBudgetLineAction":action559 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deleteBudgetLineAction":action560 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:saveActivityAction":action561 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:setActivityStatusAction":action562 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deleteActivityAction":action563 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:addPaidSpendAction":action564 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/campaign-actions:deletePaidSpendAction":action565 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createCampaign":action566 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updateCampaign":action567 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProfile":action568 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:recordPermission":action569 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:suppressProfile":action570 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createAudience":action571 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:previewAudience":action572 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createContent":action573 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:approveContent":action574 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createMessage":action575 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:lockSend":action576 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:cancelSend":action577 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:ingestEvent":action578 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourney":action579 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:publishJourney":action580 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:reviseJourney":action581 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createProgram":action582 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createExperiment":action583 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:leadFeedback":action584 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:processJourneySteps":action585 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:saveMarketingPlan":action586 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addPlanActivity":action587 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:updatePlanActivity":action588 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addBudgetLine":action589 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:submitBudgetToFinance":action590 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:createJourneyMap":action591 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyStage":action592 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/commands:addJourneyTouch":action593 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:saveSocialPost":action594 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:deleteSocialPost":action595 as (...args:never[])=>Promise<unknown>,
"src/modules/marketing/services/social-actions:retrySocialPost":action596 as (...args:never[])=>Promise<unknown>,
"src/modules/people/services/finance-expenses:getApprovedExpenseSource":action597 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createPlan":action598 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveCell":action599 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addMeasure":action600 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAssumption":action601 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDriver":action602 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addLink":action603 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createScenario":action604 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:promoteScenario":action605 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:submitPlan":action606 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:approvePlan":action607 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:lockPlan":action608 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addGoal":action609 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addInitiative":action610 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:createProjectForInitiative":action611 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addAction":action612 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeAction":action613 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addRisk":action614 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDependency":action615 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addDecision":action616 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addComment":action617 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addUpdate":action618 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:completeReview":action619 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addReview":action620 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:distributeTargets":action621 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:importGrid":action622 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:sharePlan":action623 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:unsharePlan":action624 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:setPlanAudience":action625 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:addNote":action626 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:saveGoalProgress":action627 as (...args:never[])=>Promise<unknown>,
"src/modules/plan/services/commands:savePlanBrief":action628 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:listProductionPlans":action629 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getPlanOptions":action630 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getProductionPlan":action631 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:createProductionPlan":action632 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:addProductionPlanLine":action633 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/plans:getAssignedPlanningWork":action634 as (...args:never[])=>Promise<unknown>,
"src/modules/planning/services/queries:getPlanningCoverage":action635 as (...args:never[])=>Promise<unknown>,
"src/modules/products/services/make:saveProductRecipe":action636 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createSpecification":action637 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:setSpecificationStatus":action638 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:createControlPoint":action639 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:executeInspection":action640 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:releaseHold":action641 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:reportNcr":action642 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrInvestigation":action643 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:addNcrAction":action644 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:updateNcrAction":action645 as (...args:never[])=>Promise<unknown>,
"src/modules/quality/services/commands:closeNcr":action646 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSubstance":action647 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addSafetyDataSheet":action648 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCoshhAssessment":action649 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveSubstance":action650 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveCompetence":action651 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveSafetyDocument":action652 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:acknowledgeDocument":action653 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveAudit":action654 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:addAuditFinding":action655 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:approveAudit":action656 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:saveChange":action657 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:advanceChange":action658 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/assurance:linkSafetyRecord":action659 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveSafetyProfile":action660 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRiskMatrix":action661 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createRisk":action662 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addControl":action663 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:rateAssessment":action664 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:approveAssessment":action665 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviseAssessment":action666 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:requestRiskReview":action667 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reportIncident":action668 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveImmediateControl":action669 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:openInvestigation":action670 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:addCause":action671 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveRootCause":action672 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:reviewRiddor":action673 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:createSafetyAction":action674 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:advanceAction":action675 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:verifyAction":action676 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/commands:saveWorkplaceRecord":action677 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createPermit":action678 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:advancePermit":action679 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:extendPermit":action680 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createIsolation":action681 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:applyIsolationLock":action682 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:verifyIsolation":action683 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:clearIsolation":action684 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:removeIsolationLock":action685 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:placeSafetyHold":action686 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:updateReturnToService":action687 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:releaseSafetyHold":action688 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:overrideSafetyHold":action689 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:saveStatutoryCheck":action690 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:completeInspection":action691 as (...args:never[])=>Promise<unknown>,
"src/modules/safety/services/control:createInspection":action692 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/address-actions:createSalesAddress":action693 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/catalogue-actions:createSalesCatalogueProduct":action694 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:sendQuote":action695 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:changeQuoteStatus":action696 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:deleteQuote":action697 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:duplicateDocument":action698 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:saveQuoteTemplate":action699 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commands:createOrderFromQuote":action700 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:linkCommercialProject":action701 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:openCallOffOrder":action702 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:raiseCallOff":action703 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:invoiceCallOffDelivery":action704 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/commercial:deliverAndInvoiceCallOff":action705 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/csv-import:importSalescsv":action706 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:addDeliveryAddress":action707 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:addInstaller":action708 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:pricePartyId":action709 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/delivery-address:linkOrderedFor":action710 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/documents:saveDocument":action711 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:saveInvoiceTemplate":action712 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:retireInvoiceTemplate":action713 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:attachCustomerInvoiceTemplate":action714 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/invoice-template-actions:detachCustomerInvoiceTemplate":action715 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:createDraftOrder":action716 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addOrderLine":action717 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:removeOrderLine":action718 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:updateDraftOrderFields":action719 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:confirmOrder":action720 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:decideApproval":action721 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendLineQuantity":action722 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:overrideLinePrice":action723 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:amendRequestedDate":action724 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelOrder":action725 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:deleteOrder":action726 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:cancelLineRemaining":action727 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:addHold":action728 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/orders:releaseHold":action729 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:restoreCancelledOrder":action730 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:returnOrderToQuote":action731 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/rewind:saveOrderHashtags":action732 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:saveSalesView":action733 as (...args:never[])=>Promise<unknown>,
"src/modules/sales/services/saved-views:archiveSalesView":action734 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createCase":action735 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateCase":action736 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:assignCase":action737 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:transitionCase":action738 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addCaseEntry":action739 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createDepartmentTicket":action740 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:updateDepartmentTicket":action741 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:createQueue":action742 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:addQueueMember":action743 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:linkCaseRecord":action744 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:creditChoices":action745 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:askFinanceForCredit":action746 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getCaseOwners":action747 as (...args:never[])=>Promise<unknown>,
"src/modules/service/services/commands:getDepartmentWork":action748 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readAvailability":action749 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/availability:readOrderChain":action750 as (...args:never[])=>Promise<unknown>,
"src/modules/stock/services/export:inventoryExportRows":action751 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:createTeam":action752 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:renameTeam":action753 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:addMember":action754 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMember":action755 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveTask":action756 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:setTaskStatus":action757 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeTask":action758 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveCover":action759 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeCover":action760 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveHandover":action761 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:savePlace":action762 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:saveMoment":action763 as (...args:never[])=>Promise<unknown>,
"src/modules/teams/services/commands:removeMoment":action764 as (...args:never[])=>Promise<unknown>
};
