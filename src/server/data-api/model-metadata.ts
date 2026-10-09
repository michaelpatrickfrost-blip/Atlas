// Generated from the application schema.
export const MODEL_FIELDS = {
  "AuthenticationRateLimit": {
    "key": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "attempts": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "expiresAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "Organisation": {
    "studioDefinitions": {
      "type": "StudioDefinition",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "studioExtensionRecords": {
      "type": "StudioExtensionRecord",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "operationalMeetingEntry": {
      "type": "MeetingEntry",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "operationalMicrosoftCalendarConnection": {
      "type": "MicrosoftCalendarConnection",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "operationalMeetingOAuthState": {
      "type": "MeetingOAuthState",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "operationalMaintenanceEquipment": {
      "type": "MaintenanceEquipment",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "operationalMaintenanceWorkOrder": {
      "type": "MaintenanceWorkOrder",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "operationalMaintenancePart": {
      "type": "MaintenancePart",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "operationalFleetVehicle": {
      "type": "FleetVehicle",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "operationalFleetLog": {
      "type": "FleetLog",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "operationalEngineeringRevision": {
      "type": "EngineeringRevision",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "operationalEngineeringAttachment": {
      "type": "EngineeringAttachment",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "operationalFieldServiceJob": {
      "type": "FieldServiceJob",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "operationalFieldServiceEntry": {
      "type": "FieldServiceEntry",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "isTest": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "qualitySequences": {
      "type": "QualitySequence",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "qualitySpecifications": {
      "type": "QualitySpecification",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "qualityCharacteristics": {
      "type": "QualityCharacteristic",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "qualityControlPoints": {
      "type": "QualityControlPoint",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "qualityInspections": {
      "type": "QualityInspection",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "qualityMeasurements": {
      "type": "QualityMeasurement",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "qualityHolds": {
      "type": "QualityHold",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "nonConformances": {
      "type": "NonConformance",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "nonConformanceActions": {
      "type": "NonConformanceAction",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "manufacturingCounters": {
      "type": "ManufacturingCounter",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "manufacturingWorkCentres": {
      "type": "ManufacturingWorkCentre",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "manufacturingResources": {
      "type": "ManufacturingResource",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "manufacturingOrders": {
      "type": "ManufacturingOrder",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "manufacturingWorkOrders": {
      "type": "ManufacturingWorkOrder",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "manufacturingPlanningRuns": {
      "type": "ManufacturingPlanningRun",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "manufacturingSupplySuggestions": {
      "type": "ManufacturingSupplySuggestion",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "manufacturingShifts": {
      "type": "ManufacturingShift",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "manufacturingDemandForecasts": {
      "type": "ManufacturingDemandForecast",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "schedulingHoursBudgets": {
      "type": "SchedulingHoursBudget",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "schedulingWorkTypes": {
      "type": "SchedulingWorkType",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "schedulingDemands": {
      "type": "SchedulingDemand",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "schedulingCalendarRules": {
      "type": "SchedulingCalendarRule",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "marketingExperimentAssignmentRows": {
      "type": "MarketingExperimentAssignment",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "marketingExperimentRows": {
      "type": "MarketingExperiment",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "marketingTouchRows": {
      "type": "MarketingTouch",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "marketingProgramRows": {
      "type": "MarketingProgram",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "marketingLeadRows": {
      "type": "MarketingLead",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "marketingJourneyEnrolmentRows": {
      "type": "MarketingJourneyEnrolment",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "marketingJourneyVersionRows": {
      "type": "MarketingJourneyVersion",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "marketingJourneyRows": {
      "type": "MarketingJourney",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "marketingDeliveryRows": {
      "type": "MarketingDelivery",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "marketingSendJobRows": {
      "type": "MarketingSendJob",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "marketingMessageRows": {
      "type": "MarketingMessage",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "marketingContentRows": {
      "type": "MarketingContent",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "marketingCampaignRows": {
      "type": "MarketingCampaign",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "marketingAudienceMemberRows": {
      "type": "MarketingAudienceMember",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "marketingAudienceRows": {
      "type": "MarketingAudience",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "marketingEventRows": {
      "type": "MarketingEvent",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "marketingSuppressionRows": {
      "type": "MarketingSuppression",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "marketingPermissionRows": {
      "type": "MarketingPermission",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "marketingProfileRows": {
      "type": "MarketingProfile",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "serviceCases": {
      "type": "ServiceCase",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "serviceWork": {
      "type": "ServiceWorkItem",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "serviceWorkEntries": {
      "type": "ServiceWorkEntry",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "serviceFiles": {
      "type": "ServiceFile",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "serviceEntries": {
      "type": "ServiceEntry",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "serviceTickets": {
      "type": "ServiceTicket",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "serviceQueues": {
      "type": "ServiceQueue",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "serviceQueueMembers": {
      "type": "ServiceQueueMember",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "serviceLinks": {
      "type": "ServiceLink",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "serviceSequences": {
      "type": "ServiceSequence",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "workTeams": {
      "type": "WorkTeam",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "plannerTeams": {
      "type": "PlannerTeam",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "plannerTeamMembers": {
      "type": "PlannerTeamMember",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "plannerTasks": {
      "type": "PlannerTask",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "plannerCovers": {
      "type": "PlannerCover",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "plannerHandovers": {
      "type": "PlannerHandover",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "plannerPlaces": {
      "type": "PlannerPlace",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "plannerMoments": {
      "type": "PlannerMoment",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "productionPlans": {
      "type": "ProductionPlan",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "productionPlanLines": {
      "type": "ProductionPlanLine",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "restrictedAccessAreas": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "auditAccess": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "salesPolicy": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "managerPolicy": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "outboxEvents": {
      "type": "DomainOutbox",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "allowProductCreation": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "allowCustomerCreation": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "quotationTemplates": {
      "type": "SalesQuotationTemplate",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "invoiceDocumentTemplates": {
      "type": "InvoiceDocumentTemplate",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "customerInvoiceTemplates": {
      "type": "CustomerInvoiceTemplate",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "salesProformas": {
      "type": "SalesProforma",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "slug": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "logoDataUrl": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "companyProfile": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "archivedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "archiveReason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "subscriptionStatus": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "trialEndsAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "planName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "memberships": {
      "type": "Membership",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "moduleStates": {
      "type": "ModuleState",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "projects": {
      "type": "Project",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "businessPlans": {
      "type": "BusinessPlan",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "planVersions": {
      "type": "PlanVersion",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "planMeasures": {
      "type": "PlanMeasure",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "planCells": {
      "type": "PlanCell",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "planAssumptions": {
      "type": "PlanAssumption",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "planDrivers": {
      "type": "PlanDriver",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "planBlocks": {
      "type": "PlanBlock",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "planGoals": {
      "type": "PlanGoal",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "planInitiatives": {
      "type": "PlanInitiative",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "planActions": {
      "type": "PlanAction",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "planRisks": {
      "type": "PlanRisk",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "planDependencies": {
      "type": "PlanDependency",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "planDecisions": {
      "type": "PlanDecision",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "planComments": {
      "type": "PlanComment",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "planReviews": {
      "type": "PlanReview",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "planUpdates": {
      "type": "PlanUpdate",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "planLenses": {
      "type": "PlanLens",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "planModelLinks": {
      "type": "PlanModelLink",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "planSourceLinks": {
      "type": "PlanSourceLink",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "planShares": {
      "type": "PlanShare",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "planNotes": {
      "type": "PlanNote",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "chatConversations": {
      "type": "ChatConversation",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "chatParticipants": {
      "type": "ChatParticipant",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "chatMessages": {
      "type": "ChatMessage",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "chatLinks": {
      "type": "ChatLink",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "dashboards": {
      "type": "Dashboard",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "crmIndustries": {
      "type": "CrmIndustry",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "sites": {
      "type": "Site",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "warehouses": {
      "type": "Warehouse",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "internalMoves": {
      "type": "InternalMove",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "inventoryBalances": {
      "type": "InventoryBalance",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "inventoryMovements": {
      "type": "InventoryMovement",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "stockLocations": {
      "type": "StockLocation",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "stockLots": {
      "type": "StockLot",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "stockSerials": {
      "type": "StockSerial",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "stockPositions": {
      "type": "StockPosition",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "stockReservations": {
      "type": "StockReservation",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "stockDiscrepancies": {
      "type": "StockDiscrepancy",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "stockForecasts": {
      "type": "StockForecast",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "logisticsPolicy": {
      "type": "LogisticsPolicy",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "fulfilments": {
      "type": "FulfilmentRequirement",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "fulfilmentLines": {
      "type": "FulfilmentLine",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "logisticsWaves": {
      "type": "LogisticsWave",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "warehouseTasks": {
      "type": "WarehouseTask",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "warehouseTaskLines": {
      "type": "WarehouseTaskLine",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "logisticsPackages": {
      "type": "LogisticsPackage",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "packageContents": {
      "type": "PackageContent",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "shipments": {
      "type": "Shipment",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "shipmentSources": {
      "type": "ShipmentSource",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "trackingEvents": {
      "type": "TrackingEvent",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "logisticsLoads": {
      "type": "LogisticsLoad",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "loadStops": {
      "type": "LoadStop",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "expectedReceipts": {
      "type": "ExpectedReceipt",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "receiptLines": {
      "type": "ReceiptLine",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "returnAuthorisations": {
      "type": "ReturnAuthorisation",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "returnLines": {
      "type": "ReturnLine",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "logisticsOperations": {
      "type": "LogisticsOperation",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "logisticsCounters": {
      "type": "LogisticsCounter",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "carrierRules": {
      "type": "CarrierRule",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "logisticsSavedViews": {
      "type": "LogisticsSavedView",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "logisticsNotes": {
      "type": "LogisticsNote",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "handlingUnitTypes": {
      "type": "HandlingUnitType",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyProfile": {
      "type": "SafetyProfile",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "safetyCounters": {
      "type": "SafetyCounter",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyPlaces": {
      "type": "SafetyPlace",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyMatrices": {
      "type": "SafetyMatrix",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyRisks": {
      "type": "SafetyRisk",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyAssessments": {
      "type": "SafetyAssessment",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyControls": {
      "type": "SafetyControl",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyActions": {
      "type": "SafetyAction",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyIncidents": {
      "type": "SafetyIncident",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyInvestigations": {
      "type": "SafetyInvestigation",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyCauses": {
      "type": "SafetyCause",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyRiddorDecisions": {
      "type": "SafetyRiddorDecision",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyReviewRequests": {
      "type": "SafetyReviewRequest",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyInspectionTemplates": {
      "type": "SafetyInspectionTemplate",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyInspections": {
      "type": "SafetyInspection",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyAudits": {
      "type": "SafetyAudit",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyFindings": {
      "type": "SafetyFinding",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyPermits": {
      "type": "SafetyPermit",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyIsolations": {
      "type": "SafetyIsolation",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyIsolationLocks": {
      "type": "SafetyIsolationLock",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyHolds": {
      "type": "SafetyHold",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyStatutoryChecks": {
      "type": "SafetyStatutoryCheck",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetySubstances": {
      "type": "SafetySubstance",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetySdsRecords": {
      "type": "SafetySds",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyCoshhAssessments": {
      "type": "SafetyCoshhAssessment",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyCompetences": {
      "type": "SafetyCompetence",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyDocuments": {
      "type": "SafetyDocument",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyAcknowledgements": {
      "type": "SafetyAcknowledgement",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyObligations": {
      "type": "SafetyObligation",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyChanges": {
      "type": "SafetyChange",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyLinks": {
      "type": "SafetyLink",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "safetyRecords": {
      "type": "SafetyRecord",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "kpiScorecards": {
      "type": "KpiScorecard",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "staffingIntervals": {
      "type": "StaffingInterval",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "openRotaShifts": {
      "type": "OpenRotaShift",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "kpis": {
      "type": "Kpi",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "projectTasks": {
      "type": "ProjectTask",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "meetings": {
      "type": "Meeting",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "parties": {
      "type": "Party",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "auditEntries": {
      "type": "AuditEntry",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "activities": {
      "type": "Activity",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "echoNotes": {
      "type": "EchoNote",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "echoMentions": {
      "type": "EchoMention",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "opportunities": {
      "type": "Opportunity",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "salesProjects": {
      "type": "SalesProject",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "quotes": {
      "type": "Quote",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "salesOrders": {
      "type": "SalesOrder",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "salesAgreements": {
      "type": "SalesAgreement",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "prospects": {
      "type": "Prospect",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "pipelines": {
      "type": "Pipeline",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "salesTeams": {
      "type": "SalesTeam",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "lossReasons": {
      "type": "LossReason",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "salesActivities": {
      "type": "SalesActivity",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "products": {
      "type": "Product",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "productDefinitions": {
      "type": "ProductDefinition",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "productBomLines": {
      "type": "ProductBomLine",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "productOperations": {
      "type": "ProductOperation",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "productCategories": {
      "type": "ProductCategory",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "productLinks": {
      "type": "ProductLink",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "priceLists": {
      "type": "PriceList",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "commercialAgreements": {
      "type": "CommercialAgreement",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "salesSavedViews": {
      "type": "SalesSavedView",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "salesWorkingDrafts": {
      "type": "SalesWorkingDraft",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "employeeNotes": {
      "type": "EmployeeNote",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "timesheets": {
      "type": "Timesheet",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "timesheetEntries": {
      "type": "TimesheetEntry",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "shiftTasks": {
      "type": "ShiftTask",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "employees": {
      "type": "Employee",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "employeeTasks": {
      "type": "EmployeeTask",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "appraisals": {
      "type": "Appraisal",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "oneToOnes": {
      "type": "OneToOne",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "absenceRecords": {
      "type": "AbsenceRecord",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "rotaShifts": {
      "type": "RotaShift",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "payrollRuns": {
      "type": "PayrollRun",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "payslips": {
      "type": "Payslip",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "payrollSettings": {
      "type": "PayrollSettings",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "employeeTaxYearToDates": {
      "type": "EmployeeTaxYearToDate",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "statutoryPayRecords": {
      "type": "StatutoryPayRecord",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "payrollDocuments": {
      "type": "PayrollDocument",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "employeeHistoryEvents": {
      "type": "EmployeeHistoryEvent",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "employeeDocuments": {
      "type": "EmployeeDocument",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "hrVacancies": {
      "type": "HrVacancy",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "hrApplications": {
      "type": "HrApplication",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "employeeTraining": {
      "type": "EmployeeTraining",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "expenseClaims": {
      "type": "ExpenseClaim",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "hrPolicies": {
      "type": "HrPolicy",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "performancePlans": {
      "type": "PerformancePlan",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "performanceReviews": {
      "type": "PerformanceReview",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "disciplinaryCases": {
      "type": "DisciplinaryCase",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "disciplinaryEvents": {
      "type": "DisciplinaryEvent",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "appraisalTemplates": {
      "type": "AppraisalTemplate",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "oneToOneTemplates": {
      "type": "OneToOneTemplate",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "hrAppraisalCadenceMonths": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "hrOneToOneCadenceWeeks": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "hrStandardWeeklyHours": {
      "type": "Float",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "hrOvertimeMultiplier": {
      "type": "Float",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "customerTradingLinks": {
      "type": "CustomerTradingLink",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "User": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "email": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "passwordHash": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "authVersion": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "platformAdmin": {
      "type": "PlatformAdministrator",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "memberships": {
      "type": "Membership",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "employeeProfiles": {
      "type": "Employee",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "Membership": {
    "workTeamMemberships": {
      "type": "WorkTeamMember",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "planningAssignments": {
      "type": "ProductionPlanLine",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "userId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sessionVersion": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "grantedCapabilities": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "deniedCapabilities": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "lastLoginAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "passwordResets": {
      "type": "PasswordReset",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "user": {
      "type": "User",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "roles": {
      "type": "RoleOnMembership",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "Role": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "key": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "capabilities": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "memberships": {
      "type": "RoleOnMembership",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "RoleOnMembership": {
    "membershipId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "roleId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "membership": {
      "type": "Membership",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "role": {
      "type": "Role",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ModuleState": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "moduleId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "enabled": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entitled": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "installedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "CustomerTradingLink": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "accountId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "tradingAccountId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "account": {
      "type": "Party",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "tradingAccount": {
      "type": "Party",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "Party": {
    "fieldServiceJobs": {
      "type": "FieldServiceJob",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "financeDocuments": {
      "type": "FinanceDocument",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "financeSuppliers": {
      "type": "FinanceSupplier",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "marketingProfiles": {
      "type": "MarketingProfile",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "serviceCases": {
      "type": "ServiceCase",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "fulfilments": {
      "type": "FulfilmentRequirement",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "shipments": {
      "type": "Shipment",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "returnAuthorisations": {
      "type": "ReturnAuthorisation",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "PartyKind",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "tradingName": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "customerCode": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "CustomerStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "hierarchyRole": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "customerGroup": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "parentPartyId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "website": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "industry": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "registrationNumber": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "countryOfRegistration": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "relationshipStartDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "accountManagerUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "territory": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "tags": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "preferredLanguage": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "preferredCurrency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "archived": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "identityScrubbed": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "parent": {
      "type": "Party",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "children": {
      "type": "Party",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "projects": {
      "type": "Project",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "contacts": {
      "type": "Contact",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "addresses": {
      "type": "Address",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "communicationDestinations": {
      "type": "CommunicationDestination",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "taxRegistrations": {
      "type": "TaxRegistration",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "bankAccounts": {
      "type": "BankAccount",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "directDebitMandates": {
      "type": "DirectDebitMandate",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "documents": {
      "type": "Document",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "notes": {
      "type": "Note",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "commercialSettings": {
      "type": "CustomerCommercialSettings",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "invoiceTemplates": {
      "type": "CustomerInvoiceTemplate",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "creditProfile": {
      "type": "CustomerCreditProfile",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "activities": {
      "type": "Activity",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "opportunities": {
      "type": "Opportunity",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "salesProjectOrganisations": {
      "type": "SalesProjectOrganisation",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "quotes": {
      "type": "Quote",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "salesOrders": {
      "type": "SalesOrder",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "salesAgreements": {
      "type": "SalesAgreement",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "pricedAgreements": {
      "type": "SalesAgreement",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "prospects": {
      "type": "Prospect",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "salesActivities": {
      "type": "SalesActivity",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "customerProducts": {
      "type": "CustomerProduct",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "commercialAgreements": {
      "type": "CommercialAgreement",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "tradingLinks": {
      "type": "CustomerTradingLink",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "suppliedForAccounts": {
      "type": "CustomerTradingLink",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "pricedQuotes": {
      "type": "Quote",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "pricedOrders": {
      "type": "SalesOrder",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "Contact": {
    "marketingProfile": {
      "type": "MarketingProfile",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "firstName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "middleName": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "surname": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "preferredName": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "jobTitle": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "department": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "email": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "alternativeEmail": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "phone": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "mobile": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "preferredContactMethod": {
      "type": "ContactPreferredMethod",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "language": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "ContactStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "identityScrubbed": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "isPrimary": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "roles": {
      "type": "ContactRole",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "reportsToContactId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "reportsTo": {
      "type": "Contact",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "directReports": {
      "type": "Contact",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "chatParticipants": {
      "type": "ChatParticipant",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "communicationDestinations": {
      "type": "CommunicationDestination",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "addresses": {
      "type": "Address",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "opportunityStakeholders": {
      "type": "OpportunityStakeholder",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "salesProjectStakeholders": {
      "type": "SalesProjectStakeholder",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "opportunitiesAsPrimaryContact": {
      "type": "Opportunity",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "CommunicationDestination": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "purpose": {
      "type": "CommunicationPurpose",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "contactId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "email": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "contact": {
      "type": "Contact",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "Address": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "type": {
      "type": "AddressType",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "label": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "locationName": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "line1": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "line2": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "city": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "region": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "postcode": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "country": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "telephone": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "contactId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "deliveryInstructions": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "isDefaultBilling": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "isDefaultDelivery": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "contact": {
      "type": "Contact",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "CustomerCommercialSettings": {
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "secondaryAccountManagerUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "customerSegment": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "priceList": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "defaultPriceList": {
      "type": "PriceList",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "discountGroup": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "pricingAgreementReference": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "customerPoRequired": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "poFormatRules": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "orderReferenceRequired": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partialShipmentAllowed": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "backordersAllowed": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "defaultDeliveryAddressId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "deliveryMethod": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "shippingTerms": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "preferredWarehouse": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "shippingAccountReference": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "quoteTemplate": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "orderConfirmationPreference": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "invoiceDeliveryPreference": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PaymentTerm": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "key": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "days": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "type": {
      "type": "PaymentTermType",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "creditProfiles": {
      "type": "CustomerCreditProfile",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "quotes": {
      "type": "Quote",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "salesOrders": {
      "type": "SalesOrder",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "salesAgreements": {
      "type": "SalesAgreement",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "CustomerCreditProfile": {
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "creditLimitAmount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "creditLimitCurrency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "onHold": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "holdReason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "holdDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "holdSetByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reviewDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "riskRating": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "insuranceLimitAmount": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "collectionsStatus": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "statementFrequency": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reminderPolicy": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "paymentTermId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "paymentMethod": {
      "type": "PaymentMethod",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "paymentTerm": {
      "type": "PaymentTerm",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "TaxRegistration": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "jurisdiction": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "registrationType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "number": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "normalizedNumber": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "effectiveDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "expiryDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "validationStatus": {
      "type": "TaxValidationStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "validationDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "validationSource": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "verifiedLegalName": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "verifiedAddress": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "BankAccount": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "accountHolder": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "bankName": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "label": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "country": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "currency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sortCode": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "accountNumber": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "iban": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "bic": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "purpose": {
      "type": "BankAccountPurpose",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "isDefault": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "verifiedStatus": {
      "type": "BankVerificationStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "verifiedDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "directDebitMandates": {
      "type": "DirectDebitMandate",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "DirectDebitMandate": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "bankAccountId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "scheme": {
      "type": "DirectDebitScheme",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "mandateReference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "DirectDebitStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "agreedDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "effectiveDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "firstCollectionDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "lastCollectionDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "cancellationDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "cancellationReason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "bankAccount": {
      "type": "BankAccount",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "Document": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "type": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "date": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "expiryDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "uploadedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "visibility": {
      "type": "DocumentVisibility",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "url": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "Note": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "body": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "pinned": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "restricted": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "authorUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "AuditEntry": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "actorUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "action": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "before": {
      "type": "Json",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "after": {
      "type": "Json",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "workProjectId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "workTaskId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "workDocumentId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "workProject": {
      "type": "Project",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "workTask": {
      "type": "ProjectTask",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "workDocument": {
      "type": "ProjectDocument",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "Activity": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "type": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "summary": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityType": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "entityId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "metadata": {
      "type": "Json",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "EchoNote": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "authorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "body": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "mentions": {
      "type": "EchoMention",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "EchoMention": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "noteId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "userId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "seenAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "note": {
      "type": "EchoNote",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "Product": {
    "planInputs": {
      "type": "PlanInput",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "qualitySpecifications": {
      "type": "QualitySpecification",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "qualityControlPoints": {
      "type": "QualityControlPoint",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "qualityInspections": {
      "type": "QualityInspection",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "qualityHolds": {
      "type": "QualityHold",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "nonConformances": {
      "type": "NonConformance",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "financeLines": {
      "type": "FinanceDocumentLine",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "productionPlanLines": {
      "type": "ProductionPlanLine",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "categoryCode": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "itemClass": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "code": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "kind": {
      "type": "ProductKind",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "unitOfMeasure": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "basePriceAmount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "baseCurrency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "taxCategory": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "netWeightGrams": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "grossWeightGrams": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "lengthMm": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "widthMm": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "heightMm": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "volumeMl": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "unitsPerPack": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "packUnit": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "packsPerLayer": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "layersPerPallet": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "stackable": {
      "type": "Boolean",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "originCountry": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "commodityCode": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "customsDescription": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "hazardClass": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "unNumber": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "trackingMode": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "barcode": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sellable": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "safetyStockLevel": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "leadTimeDays": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "monthlyUsage": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "averageDailyDemand": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "forecastMethod": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lastForecastDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "customerProducts": {
      "type": "CustomerProduct",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "priceListEntries": {
      "type": "PriceListEntry",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "agreementPrices": {
      "type": "AgreementPrice",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "quoteLines": {
      "type": "QuoteLine",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "engineeringRevisions": {
      "type": "EngineeringRevision",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "maintenanceParts": {
      "type": "MaintenancePart",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "orderLines": {
      "type": "SalesOrderLine",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "agreementLines": {
      "type": "SalesAgreementLine",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "inventoryBalances": {
      "type": "InventoryBalance",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "inventoryMovements": {
      "type": "InventoryMovement",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "internalMoves": {
      "type": "InternalMove",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "stockLots": {
      "type": "StockLot",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "stockSerials": {
      "type": "StockSerial",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "stockPositions": {
      "type": "StockPosition",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "definitions": {
      "type": "ProductDefinition",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "usedIn": {
      "type": "ProductBomLine",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "outgoingLinks": {
      "type": "ProductLink",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "incomingLinks": {
      "type": "ProductLink",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "manufacturingOrders": {
      "type": "ManufacturingOrder",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "manufacturingSupplySuggestions": {
      "type": "ManufacturingSupplySuggestion",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "manufacturingDemandForecasts": {
      "type": "ManufacturingDemandForecast",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "stockForecasts": {
      "type": "StockForecast",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "ProductDefinition": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "supply": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "batchQuantity": {
      "type": "Decimal",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "yieldPercent": {
      "type": "Decimal",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "subcontractMinorPerUnit": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "lines": {
      "type": "ProductBomLine",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "operations": {
      "type": "ProductOperation",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "manufacturingOrders": {
      "type": "ManufacturingOrder",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "ProductBomLine": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "definitionId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "componentProductId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "quantityPerUnit": {
      "type": "Decimal",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "scrapPercent": {
      "type": "Decimal",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "position": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "definition": {
      "type": "ProductDefinition",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "component": {
      "type": "Product",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ProductOperation": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "definitionId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "position": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "setupMinutes": {
      "type": "Decimal",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "runMinutesPerUnit": {
      "type": "Decimal",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "crewSize": {
      "type": "Decimal",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "machineMinorPerHour": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "labourMinorPerHour": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "logisticsMinorPerBatch": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "machineIncludesLabour": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "workCentre": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "workCentreId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "resourceId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "overheadMinorPerHour": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "machineIncludesOverhead": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "definition": {
      "type": "ProductDefinition",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "centre": {
      "type": "ManufacturingWorkCentre",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "machine": {
      "type": "ManufacturingResource",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "ProductCategory": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "code": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "itemClass": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "parentId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "position": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "parent": {
      "type": "ProductCategory",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "children": {
      "type": "ProductCategory",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "ProductLink": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "relatedProductId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "quantity": {
      "type": "Decimal",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "related": {
      "type": "Product",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "CustomerProduct": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "customerProductCode": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "customerDescription": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "contractedPriceAmount": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "contractedPriceCurrency": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "packQuantity": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "preferredDeliveryUnit": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PriceList": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "key": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "currency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "baseCurrency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "exchangeRate": {
      "type": "Float",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "entries": {
      "type": "PriceListEntry",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "customerDefaults": {
      "type": "CustomerCommercialSettings",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "agreements": {
      "type": "CommercialAgreement",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "quotes": {
      "type": "Quote",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "orders": {
      "type": "SalesOrder",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "PriceListEntry": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "priceListId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "scope": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "method": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "categoryCode": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "percentage": {
      "type": "Float",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "adjustmentAmount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "priority": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "unitPriceAmount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "minimumQuantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "validFrom": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "validTo": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "priceList": {
      "type": "PriceList",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "CommercialAgreement": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "number": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "CommercialAgreementStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startsOn": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "endsOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "priceListId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "paymentTerms": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "slaName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "coverage": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "responseMinutes": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "resolutionMinutes": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "slaNotes": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "priceList": {
      "type": "PriceList",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "prices": {
      "type": "AgreementPrice",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "AgreementPrice": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "agreementId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "unitPriceAmount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "minimumQuantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "agreement": {
      "type": "CommercialAgreement",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SalesTeam": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "managerUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "members": {
      "type": "SalesTeamMember",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "opportunities": {
      "type": "Opportunity",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "salesProjects": {
      "type": "SalesProject",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "prospects": {
      "type": "Prospect",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "SalesTeamMember": {
    "teamId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "userId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "team": {
      "type": "SalesTeam",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "Pipeline": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "key": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "isDefault": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "stages": {
      "type": "PipelineStage",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "opportunities": {
      "type": "Opportunity",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "PipelineStage": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "pipelineId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "key": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "order": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "defaultProbability": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "guidance": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "typicalDurationDays": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "pipeline": {
      "type": "Pipeline",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "opportunities": {
      "type": "Opportunity",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "LossReason": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "key": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "label": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "opportunities": {
      "type": "Opportunity",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "OpportunityStakeholder": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "opportunityId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "contactId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "roles": {
      "type": "OpportunityStakeholderRole",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "opportunity": {
      "type": "Opportunity",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "contact": {
      "type": "Contact",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "OpportunityMilestone": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "opportunityId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "label": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "dueDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "MilestoneStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "order": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "opportunity": {
      "type": "Opportunity",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "OpportunityChangeEvent": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "opportunityId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "type": {
      "type": "OpportunityChangeType",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "fromValue": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "toValue": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "changedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "opportunity": {
      "type": "Opportunity",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "Opportunity": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "prospectId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "pipelineId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "stageId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "OpportunityStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "stageEnteredAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "valueAmount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "valueCurrency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "recurringValueAmount": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "recurringPeriod": {
      "type": "RecurringPeriod",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "probability": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "forecastCategory": {
      "type": "ForecastCategory",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "expectedCloseDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "actualCloseDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "nextActionNote": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "nextActionAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "teamId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "territory": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "source": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "campaign": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "primaryContactId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "industryId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "tags": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "qualificationNotes": {
      "type": "Json",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "useCase": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "painPoint": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "lossReasonId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "lossNotes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "competitor": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "prospect": {
      "type": "Prospect",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "pipeline": {
      "type": "Pipeline",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "stage": {
      "type": "PipelineStage",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "team": {
      "type": "SalesTeam",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "primaryContact": {
      "type": "Contact",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "lossReason": {
      "type": "LossReason",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "industry": {
      "type": "CrmIndustry",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "quotes": {
      "type": "Quote",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "projects": {
      "type": "Project",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "agreements": {
      "type": "SalesAgreement",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "stakeholders": {
      "type": "OpportunityStakeholder",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "milestones": {
      "type": "OpportunityMilestone",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "changeEvents": {
      "type": "OpportunityChangeEvent",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "activities": {
      "type": "SalesActivity",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "CrmIndustry": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "prospects": {
      "type": "Prospect",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "opportunities": {
      "type": "Opportunity",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "salesProjects": {
      "type": "SalesProject",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "Prospect": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "companyName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "contactFirstName": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "contactSurname": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "jobTitle": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "email": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "phone": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "website": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "country": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "teamId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "territory": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "source": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "sourceDetail": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "campaign": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "referrer": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "originalSource": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "utmSource": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "utmMedium": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "utmCampaign": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "utmContent": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "utmTerm": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "lifecycleStage": {
      "type": "ProspectLifecycleStage",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "fitScore": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "fitFactors": {
      "type": "Json",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "engagementScore": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "engagementFactors": {
      "type": "Json",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "intentScore": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "intentFactors": {
      "type": "Json",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "priorityScore": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "estimatedValueAmount": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "estimatedValueCurrency": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "timeframe": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "isTargetAccount": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "accountTier": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "industryId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "tags": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "disqualifiedReason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "nurtureReason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "nextReviewAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "nextActivityAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "firstContactedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "lastContactedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "assignedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "convertedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "disqualifiedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "industry": {
      "type": "CrmIndustry",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "team": {
      "type": "SalesTeam",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "opportunity": {
      "type": "Opportunity",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "activities": {
      "type": "SalesActivity",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "SalesActivity": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "type": {
      "type": "SalesActivityType",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "subject": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "prospectId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "opportunityId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "salesProjectId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "dueAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "completedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "outcome": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "prospect": {
      "type": "Prospect",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "opportunity": {
      "type": "Opportunity",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "salesProject": {
      "type": "SalesProject",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "SalesProject": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "stage": {
      "type": "SalesProjectStage",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "stageEnteredAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "teamId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "potentialValueAmount": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "potentialValueCurrency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "quotedValueAmount": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "quotedValueCurrency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "awardedValueAmount": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "awardedValueCurrency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "orderedValueAmount": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "orderedValueCurrency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "remainingValueAmount": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "remainingValueCurrency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "probability": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "expectedValueAmount": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "targetAwardDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "expectedStartDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "expectedCompletionDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "nextActionNote": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "nextActionAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "industryId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "tags": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "lastActivityAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "team": {
      "type": "SalesTeam",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "industry": {
      "type": "CrmIndustry",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "organisations": {
      "type": "SalesProjectOrganisation",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "stakeholders": {
      "type": "SalesProjectStakeholder",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "quotes": {
      "type": "Quote",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "orders": {
      "type": "SalesOrder",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "activities": {
      "type": "SalesActivity",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "SalesProjectOrganisation": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "salesProjectId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "roles": {
      "type": "SalesProjectOrganisationRole",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "isPrimary": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "salesProject": {
      "type": "SalesProject",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SalesProjectStakeholder": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "salesProjectId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "contactId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "roles": {
      "type": "SalesProjectStakeholderRole",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "influence": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "relationshipStrength": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "sentiment": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "lastContactAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "salesProject": {
      "type": "SalesProject",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "contact": {
      "type": "Contact",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "Quote": {
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "tags": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "pricingPartyId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "pricingParty": {
      "type": "Party",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "financeInstructions": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "deliveryInstructions": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "invoiceAssignmentId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "invoiceAssignment": {
      "type": "CustomerInvoiceTemplate",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "opportunityId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "salesProjectId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "QuoteStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "QuoteKind",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "revision": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "customerNotes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "externalReference": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "invoiceAddressSnapshot": {
      "type": "Json",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "deliveryAddressSnapshot": {
      "type": "Json",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "priceListId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "priceList": {
      "type": "PriceList",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "paymentTermId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "paymentTerm": {
      "type": "PaymentTerm",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "expiryDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "customerPoReference": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "netAmount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "taxAmount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "headerDiscountPercent": {
      "type": "Float",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "project": {
      "type": "Project",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "totalAmount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "totalCurrency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "opportunity": {
      "type": "Opportunity",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "salesProject": {
      "type": "SalesProject",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "lines": {
      "type": "QuoteLine",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "salesOrder": {
      "type": "SalesOrder",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "agreement": {
      "type": "SalesAgreement",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "SalesAgreement": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "pricingPartyId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "opportunityId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "quoteId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "AgreementStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "currency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startsAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "endsAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "paymentTermId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "customerPoReference": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "pricingParty": {
      "type": "Party",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "opportunity": {
      "type": "Opportunity",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "quote": {
      "type": "Quote",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "project": {
      "type": "Project",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "paymentTerm": {
      "type": "PaymentTerm",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "lines": {
      "type": "SalesAgreementLine",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "callOffs": {
      "type": "SalesOrder",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "SalesAgreementLine": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "agreementId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lineNumber": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "committedQuantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "unitPriceAmount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "unitOfMeasure": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "currency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "agreement": {
      "type": "SalesAgreement",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "callOffs": {
      "type": "SalesOrderLine",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "QuoteLine": {
    "lineNumber": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "type": {
      "type": "OrderLineType",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "optional": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "unitOfMeasure": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "taxCategory": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "priceSource": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "quoteId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "discountPercent": {
      "type": "Float",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "netAmount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "taxAmount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "quantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "unitAmount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "currency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "invoiceWhenInStock": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "quote": {
      "type": "Quote",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SalesOrder": {
    "financeDocuments": {
      "type": "FinanceDocument",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "revisions": {
      "type": "SalesOrderRevision",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "tags": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "pricingPartyId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "pricingParty": {
      "type": "Party",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "financeInstructions": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "commercialStatus": {
      "type": "CommercialOrderStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "orderType": {
      "type": "OrderType",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "revision": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "quoteId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "opportunityId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "salesProjectId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "agreementId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "teamId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "customerPoReference": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "contractReference": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "projectReference": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "externalReference": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "currency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "priceListId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "paymentTermId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "invoiceAssignmentId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "invoiceAssignment": {
      "type": "CustomerInvoiceTemplate",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "proforma": {
      "type": "SalesProforma",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "incoterms": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "deliveryTerms": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "allowPartialDelivery": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "orderDate": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "confirmationDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "requestedDeliveryDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "promisedDeliveryDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "latestAcceptableDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "expiryDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "invoiceAddressSnapshot": {
      "type": "Json",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "deliveryAddressSnapshot": {
      "type": "Json",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "orderContactId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "invoiceContactId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "deliveryContactId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "netAmount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "discountAmount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "taxAmount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "grossAmount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "headerDiscountPercent": {
      "type": "Float",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "internalNotes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "customerNotes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "deliveryInstructions": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "cancelledAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "closedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "quote": {
      "type": "Quote",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "project": {
      "type": "Project",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "salesProject": {
      "type": "SalesProject",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "agreement": {
      "type": "SalesAgreement",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "priceList": {
      "type": "PriceList",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "paymentTerm": {
      "type": "PaymentTerm",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "lines": {
      "type": "SalesOrderLine",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "fulfilments": {
      "type": "FulfilmentRequirement",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "holds": {
      "type": "OrderHold",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "changeEvents": {
      "type": "OrderChangeEvent",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "approvals": {
      "type": "OrderApproval",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "SalesOrderLine": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "orderId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lineNumber": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "type": {
      "type": "OrderLineType",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "descriptionSnapshot": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "customerProductReference": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "orderedQuantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "cancelledQuantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "unitOfMeasure": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "unitPriceAmount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "priceSource": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "discountPercent": {
      "type": "Float",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "netAmount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "taxCategory": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "taxAmount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "requestedDeliveryDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "promisedDeliveryDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "warehousePreference": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "projectReference": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "agreementLineId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "invoiceWhenInStock": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "order": {
      "type": "SalesOrder",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "agreementLine": {
      "type": "SalesAgreementLine",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "manufacturingOrders": {
      "type": "ManufacturingOrder",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "OrderHold": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "orderId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "type": {
      "type": "OrderHoldType",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "blockingScope": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "releaseAuthority": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "releasedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "releasedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "order": {
      "type": "SalesOrder",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "OrderChangeEvent": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "orderId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lineId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "type": {
      "type": "OrderChangeType",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "fromValue": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "toValue": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "changedByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "order": {
      "type": "SalesOrder",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "OrderApproval": {
    "revision": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "decisionReason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "orderId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reason": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "OrderApprovalStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "requestedByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "requestedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "decidedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "decidedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "order": {
      "type": "SalesOrder",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "Project": {
    "financeDocuments": {
      "type": "FinanceDocument",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "health": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "projectType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "visibility": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "opportunityId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "leadUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "teamId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "startAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "targetAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "completedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "archivedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "progressMethod": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "manualProgress": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updateCadenceDays": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "tags": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "team": {
      "type": "WorkTeam",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "opportunity": {
      "type": "Opportunity",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "quotes": {
      "type": "Quote",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "salesOrders": {
      "type": "SalesOrder",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "agreements": {
      "type": "SalesAgreement",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "tasks": {
      "type": "ProjectTask",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "meetings": {
      "type": "Meeting",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "members": {
      "type": "ProjectMember",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "milestones": {
      "type": "ProjectMilestone",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "documents": {
      "type": "ProjectDocument",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "decisions": {
      "type": "ProjectDecision",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "updates": {
      "type": "ProjectUpdate",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "risks": {
      "type": "ProjectRisk",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "approvals": {
      "type": "ProjectApproval",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "requests": {
      "type": "ProjectRequest",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "baselines": {
      "type": "ProjectBaseline",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "portfolioLinks": {
      "type": "ProjectPortfolioLink",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "workAudit": {
      "type": "AuditEntry",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "automations": {
      "type": "ProjectAutomationRule",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "preferences": {
      "type": "ProjectPreference",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "files": {
      "type": "ProjectFile",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "properties": {
      "type": "ProjectProperty",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "budgets": {
      "type": "ProjectBudgetLine",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "comments": {
      "type": "ProjectComment",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "inbox": {
      "type": "ProjectInboxItem",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "workLinks": {
      "type": "ProjectWorkLink",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "ChatConversation": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "directKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "messages": {
      "type": "ChatMessage",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "participants": {
      "type": "ChatParticipant",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "ChatParticipant": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "conversationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "userId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "contactId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "lastReadAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "conversation": {
      "type": "ChatConversation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "contact": {
      "type": "Contact",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "ChatMessage": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "conversationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "authorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "body": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "taskId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "meetingId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "conversation": {
      "type": "ChatConversation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "task": {
      "type": "ProjectTask",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "meeting": {
      "type": "Meeting",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "links": {
      "type": "ChatLink",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "ChatLink": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "messageId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "message": {
      "type": "ChatMessage",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "Dashboard": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "userId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "widgets": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "Site": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "code": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "warehouses": {
      "type": "Warehouse",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "Warehouse": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "code": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "siteId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "site": {
      "type": "Site",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "balances": {
      "type": "InventoryBalance",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "movements": {
      "type": "InventoryMovement",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "locations": {
      "type": "StockLocation",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "positions": {
      "type": "StockPosition",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "reservations": {
      "type": "StockReservation",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "discrepancies": {
      "type": "StockDiscrepancy",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "receipts": {
      "type": "ExpectedReceipt",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "movesFrom": {
      "type": "InternalMove",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "movesTo": {
      "type": "InternalMove",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "InventoryBalance": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "warehouseId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "quantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "warehouse": {
      "type": "Warehouse",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "InventoryMovement": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "shipmentId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "receiptId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "manufacturingOrderId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "workOrderId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "warehouseId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "delta": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reason": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "requestKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "actorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "warehouse": {
      "type": "Warehouse",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "InternalMove": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "fromWarehouseId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "toWarehouseId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "fromLocationId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "toLocationId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "quantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reason": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "requestKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "actorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "receivedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "fromWarehouse": {
      "type": "Warehouse",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "toWarehouse": {
      "type": "Warehouse",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "fromLocation": {
      "type": "StockLocation",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "toLocation": {
      "type": "StockLocation",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "Kpi": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "teamName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "unit": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "direction": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "target": {
      "type": "Float",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "current": {
      "type": "Float",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startsAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "endsAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "scope": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "visibility": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "department": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "metricId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "breakdown": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sliceLabel": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "planId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "personName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planTitle": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planKind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "support": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reviewOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "leadUserIds": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "employee": {
      "type": "Employee",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "plan": {
      "type": "PerformancePlan",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "updates": {
      "type": "KpiUpdate",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "scorecardItems": {
      "type": "KpiScorecardItem",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "KpiUpdate": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kpiId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "value": {
      "type": "Float",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "note": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "actorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kpi": {
      "type": "Kpi",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ProjectTask": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "meetingId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "parentTaskId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "milestoneId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "taskType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "assigneeUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "creatorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "contributorUserIds": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "visibility": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "priority": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "dueAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "completedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "waitingReason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "waitingUntil": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "estimatedMinutes": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "weight": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "position": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "recurrence": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "tags": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "project": {
      "type": "Project",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "meeting": {
      "type": "Meeting",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "parentTask": {
      "type": "ProjectTask",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "subtasks": {
      "type": "ProjectTask",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "milestone": {
      "type": "ProjectMilestone",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "checklist": {
      "type": "ProjectChecklistItem",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "predecessors": {
      "type": "ProjectDependency",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "successors": {
      "type": "ProjectDependency",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "workAudit": {
      "type": "AuditEntry",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "timers": {
      "type": "ProjectTimer",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "propertyValues": {
      "type": "ProjectPropertyValue",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "timeEntries": {
      "type": "ProjectTimeEntry",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "comments": {
      "type": "ProjectComment",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "inbox": {
      "type": "ProjectInboxItem",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "workLinks": {
      "type": "ProjectWorkLink",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "personalPlans": {
      "type": "ProjectPersonalPlan",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "chatMessages": {
      "type": "ChatMessage",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "Meeting": {
    "endsAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "timezone": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "agenda": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "location": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "joinUrl": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "visibility": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "microsoftManaged": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "microsoftEventId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "microsoftOwnerUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "microsoftCalendarId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "entries": {
      "type": "MeetingEntry",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startsAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organiserUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "attendeeUserIds": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "project": {
      "type": "Project",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "tasks": {
      "type": "ProjectTask",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "chatMessages": {
      "type": "ChatMessage",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "PlatformAdministrator": {
    "userId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "role": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "user": {
      "type": "User",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SalesQuotationTemplate": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "validityDays": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lines": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "InvoiceDocumentTemplate": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "InvoiceTemplateKind",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "blocks": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "exporterEori": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "footer": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "assignments": {
      "type": "CustomerInvoiceTemplate",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "proformas": {
      "type": "SalesProforma",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "CustomerInvoiceTemplate": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "templateId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "invoiceAddressId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "deliveryAddressId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "notifyAddressId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "buyerEori": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "buyerVat": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "marks": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "isDefault": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "template": {
      "type": "InvoiceDocumentTemplate",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "quotes": {
      "type": "Quote",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "orders": {
      "type": "SalesOrder",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "SalesProforma": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "orderId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "templateId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "incoterms": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "namedPlace": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "countryOfDestination": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "portOfLoading": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "portOfDischarge": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "packageCount": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "packageType": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "marks": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reasonForExport": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "buyerEori": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "buyerVat": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "netWeightGrams": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "grossWeightGrams": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "volumeMl": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "missing": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "snapshot": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "issuedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "order": {
      "type": "SalesOrder",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "template": {
      "type": "InvoiceDocumentTemplate",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "SalesOrderRevision": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "orderId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "revision": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "snapshot": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reason": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "order": {
      "type": "SalesOrder",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "DomainOutbox": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "eventKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "eventName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "payload": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "attempts": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "publishedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SalesSavedView": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "mode": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "definition": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "archived": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SalesWorkingDraft": {
    "captureVersion": {
      "type": "BigInt",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "mode": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "payload": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "archived": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "Employee": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "userId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "managerId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "employeeNumber": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "firstName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lastName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "preferredName": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "email": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "phone": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "dateOfBirth": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "jobTitle": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "department": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "employmentType": {
      "type": "EmploymentType",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "EmployeeStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startDate": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "endDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "leaveReason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "annualSalaryMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "payBasis": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "hourlyRateMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "currency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "annualLeaveDaysEntitlement": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "payFrequency": {
      "type": "PayFrequency",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "taxCode": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "niNumber": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "niCategory": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "starterDeclaration": {
      "type": "StarterDeclaration",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "studentLoanPlan": {
      "type": "StudentLoanPlan",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "postgraduateLoan": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "pensionOptOut": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "bankAccountName": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "bankSortCode": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "bankAccountNumber": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "address": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "emergencyContactName": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "emergencyContactPhone": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "linkedUser": {
      "type": "User",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "manager": {
      "type": "Employee",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "reports": {
      "type": "Employee",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "skills": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "availability": {
      "type": "EmployeeAvailability",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "shiftRequests": {
      "type": "OpenShiftRequest",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "payrollAdjustments": {
      "type": "PayrollPeriodAdjustment",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "appraisalCadenceMonths": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "oneToOneCadenceWeeks": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "contractedWeeklyHours": {
      "type": "Float",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "privateNotes": {
      "type": "EmployeeNote",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "timesheets": {
      "type": "Timesheet",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "workingDays": {
      "type": "Int",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "onboardingTasks": {
      "type": "EmployeeTask",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "appraisals": {
      "type": "Appraisal",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "oneToOnes": {
      "type": "OneToOne",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "absences": {
      "type": "AbsenceRecord",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "shifts": {
      "type": "RotaShift",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "payslips": {
      "type": "Payslip",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "taxYearToDates": {
      "type": "EmployeeTaxYearToDate",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "statutoryPayRecords": {
      "type": "StatutoryPayRecord",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "payrollDocuments": {
      "type": "PayrollDocument",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "history": {
      "type": "EmployeeHistoryEvent",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "documents": {
      "type": "EmployeeDocument",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "training": {
      "type": "EmployeeTraining",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "recruitmentApplications": {
      "type": "HrApplication",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "expenseClaims": {
      "type": "ExpenseClaim",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "performancePlans": {
      "type": "PerformancePlan",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "goals": {
      "type": "Kpi",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "disciplinaryCases": {
      "type": "DisciplinaryCase",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "plannerMemberships": {
      "type": "PlannerTeamMember",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "plannerTasks": {
      "type": "PlannerTask",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "plannerCoversAway": {
      "type": "PlannerCover",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "plannerCoversFor": {
      "type": "PlannerCover",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "plannerHandovers": {
      "type": "PlannerHandover",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "plannerPlaces": {
      "type": "PlannerPlace",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "EmployeeTask": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "phase": {
      "type": "EmployeeTaskPhase",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "category": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "dueDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "completedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "assignedToUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "employee": {
      "type": "Employee",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "AppraisalTemplate": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "questions": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "appraisals": {
      "type": "Appraisal",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "Appraisal": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reviewerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "templateId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "cycle": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "scheduledAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "completedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "AppraisalStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "rating": {
      "type": "AppraisalRating",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "strengths": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "areasForGrowth": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "goals": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "answers": {
      "type": "Json",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "employee": {
      "type": "Employee",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "template": {
      "type": "AppraisalTemplate",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "OneToOneTemplate": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "talkingPoints": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "oneToOnes": {
      "type": "OneToOne",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "OneToOne": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "managerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "templateId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "scheduledAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "completedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "OneToOneStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "talkingPoints": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "actionPoints": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "answers": {
      "type": "Json",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "employee": {
      "type": "Employee",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "template": {
      "type": "OneToOneTemplate",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "AbsenceRecord": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "type": {
      "type": "AbsenceType",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startDate": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "endDate": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "certifiedByDoctor": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "AbsenceRequestStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "approverUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "approvedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "rejectionReason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "bookedDays": {
      "type": "Float",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "employee": {
      "type": "Employee",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "statutoryPayRecord": {
      "type": "StatutoryPayRecord",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "RotaShift": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startsAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "endsAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "role": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "location": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "RotaShiftStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "breakMinutes": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "breakStartsAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "requiredSkills": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "activities": {
      "type": "RotaActivity",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "workTypeId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "teamId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "workType": {
      "type": "SchedulingWorkType",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "team": {
      "type": "WorkTeam",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "tasks": {
      "type": "ShiftTask",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "employee": {
      "type": "Employee",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PayrollRun": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "periodLabel": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "periodStart": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "periodEnd": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "PayrollRunStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "finalisedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "paidAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "taxYear": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "inputDigest": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "inputSnapshot": {
      "type": "Json",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "payFrequency": {
      "type": "PayFrequency",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "payslips": {
      "type": "Payslip",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "PayrollPeriodAdjustment": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "periodStart": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "periodEnd": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "statutoryPayMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "additionalPayMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "salaryReductionMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "statutoryReviewed": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "note": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reviewedByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employee": {
      "type": "Employee",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "Payslip": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "payrollRunId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "grossMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "overtimeHours": {
      "type": "Float",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "approvedHours": {
      "type": "Float",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sourceTimesheetIds": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "overtimeMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "unpaidLeaveDays": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "unpaidLeaveDeductionMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "taxMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeNiMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employerNiMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeePensionMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employerPensionMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "studentLoanMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "statutoryPayMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "additionalPayMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "deductionsMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "netMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "currency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "payrollRun": {
      "type": "PayrollRun",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "employee": {
      "type": "Employee",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PayrollSettings": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "payeReference": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "accountsOfficeReference": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "currentTaxYear": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "pensionSchemeName": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "employerPensionPercent": {
      "type": "Float",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeePensionPercent": {
      "type": "Float",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "EmployeeTaxYearToDate": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "taxYear": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "grossToDateMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "taxToDateMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "niToDateMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "openingGrossMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "openingTaxMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "openingReviewNote": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "openingReviewed": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "employee": {
      "type": "Employee",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "StatutoryPayRecord": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "absenceRecordId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "type": {
      "type": "StatutoryPayType",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "weeklyRateMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "qualifyingDays": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "totalMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "employee": {
      "type": "Employee",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "absenceRecord": {
      "type": "AbsenceRecord",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PayrollDocument": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "type": {
      "type": "PayrollDocumentType",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "taxYear": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "figures": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "generatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "employee": {
      "type": "Employee",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "EmployeeHistoryEvent": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "type": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "occurredAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "employee": {
      "type": "Employee",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "EmployeeDocument": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "category": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "url": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "issuedOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "expiresOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "employee": {
      "type": "Employee",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ExpenseClaim": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "category": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "amountMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "currency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "incurredOn": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "ExpenseClaimStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "approverUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "approvedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "rejectionReason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "employee": {
      "type": "Employee",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "HrPolicy": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "category": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "summary": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "audience": {
      "type": "HrPolicyAudience",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "HrPolicyStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "effectiveOn": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reviewOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "fileName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "checksum": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "content": {
      "type": "Bytes",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "uploadedByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PerformancePlan": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reason": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "support": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "startOn": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reviewOn": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "endOn": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "PerformancePlanStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "objectives": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeComment": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "outcome": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "personName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "leadUserIds": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "employee": {
      "type": "Employee",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "reviews": {
      "type": "PerformanceReview",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "cases": {
      "type": "DisciplinaryCase",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "goals": {
      "type": "Kpi",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "PerformanceReview": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "heldOn": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "progress": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "managerNotes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "employeeNotes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "authorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "plan": {
      "type": "PerformancePlan",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "DisciplinaryCase": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "stage": {
      "type": "DisciplinaryStage",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "DisciplinaryStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "allegation": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "facts": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "employeeResponse": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "hearingOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "outcome": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "sanction": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "appealBy": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "confidentialNotes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "employee": {
      "type": "Employee",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "plan": {
      "type": "PerformancePlan",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "events": {
      "type": "DisciplinaryEvent",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "DisciplinaryEvent": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "caseId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "DisciplinaryEventKind",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "occurredOn": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "summary": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "detail": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "shared": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "authorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "case": {
      "type": "DisciplinaryCase",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "WorkTeam": {
    "departments": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "code": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "members": {
      "type": "WorkTeamMember",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "planningAssignments": {
      "type": "ProductionPlanLine",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "projects": {
      "type": "Project",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "workTypes": {
      "type": "SchedulingWorkType",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "shifts": {
      "type": "RotaShift",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "WorkTeamMember": {
    "isManager": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "teamId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "membershipId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "team": {
      "type": "WorkTeam",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "membership": {
      "type": "Membership",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ProductionPlan": {
    "requestKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startsOn": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "endsOn": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "bucket": {
      "type": "PlanningBucket",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "lines": {
      "type": "ProductionPlanLine",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "ProductionPlanLine": {
    "requestKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startsOn": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "endsOn": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "quantity": {
      "type": "Decimal",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "unitOfMeasure": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "teamId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "assignedMembershipId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "plan": {
      "type": "ProductionPlan",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "team": {
      "type": "WorkTeam",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "assignedMembership": {
      "type": "Membership",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "ManufacturingCounter": {
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "value": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ManufacturingWorkCentre": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "code": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "resources": {
      "type": "ManufacturingResource",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "workOrders": {
      "type": "ManufacturingWorkOrder",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "recipeSteps": {
      "type": "ProductOperation",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "shifts": {
      "type": "ManufacturingShift",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "ManufacturingResource": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "workCentreId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "type": {
      "type": "ManufacturingResourceType",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "nominalUnitsPerHour": {
      "type": "Decimal",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "planningEfficiencyPercent": {
      "type": "Decimal",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "workCentre": {
      "type": "ManufacturingWorkCentre",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "workOrders": {
      "type": "ManufacturingWorkOrder",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "recipeSteps": {
      "type": "ProductOperation",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "shifts": {
      "type": "ManufacturingShift",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "ManufacturingShift": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "workCentreId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "resourceId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "label": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "daysOfWeek": {
      "type": "Int",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "startMinute": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "endMinute": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "crewCount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "workCentre": {
      "type": "ManufacturingWorkCentre",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "resource": {
      "type": "ManufacturingResource",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "ManufacturingOrder": {
    "warehouseId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "orderNumber": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "definitionId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "quantity": {
      "type": "Decimal",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "unitOfMeasure": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "ManufacturingOrderStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "priority": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "requiredDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "plannedStart": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "plannedFinish": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "actualStart": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "actualFinish": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "sourceSalesOrderLineId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "definition": {
      "type": "ProductDefinition",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "sourceSalesOrderLine": {
      "type": "SalesOrderLine",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "workOrders": {
      "type": "ManufacturingWorkOrder",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "ManufacturingWorkOrder": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productionOrderId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sequence": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "operationName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "workCentreId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "resourceId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "ManufacturingWorkOrderStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "scheduledStart": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "scheduledEnd": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "actualStart": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "actualEnd": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "plannedMinutes": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "setupMinutes": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "runMinutes": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "actualMinutes": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "producedQuantity": {
      "type": "Decimal",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "scrapQuantity": {
      "type": "Decimal",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "pauseReason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lastRequestKey": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "locked": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "productionOrder": {
      "type": "ManufacturingOrder",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "workCentre": {
      "type": "ManufacturingWorkCentre",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "resource": {
      "type": "ManufacturingResource",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "ManufacturingPlanningRun": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "finishedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "triggeredByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productCount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "suggestionCount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "warnings": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "suggestions": {
      "type": "ManufacturingSupplySuggestion",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "ManufacturingSupplySuggestion": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "runId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "ManufacturingSuggestionKind",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "quantity": {
      "type": "Decimal",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "neededBy": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "startBy": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "ManufacturingSuggestionStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "pegging": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "resultingOrderId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "resultingPurchaseDocumentId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "run": {
      "type": "ManufacturingPlanningRun",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "purchaseDocument": {
      "type": "FinanceDocument",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "ManufacturingDemandForecast": {
    "sourceSopVersionId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "sopVersion": {
      "type": "SopVersion",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "periodStart": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "quantity": {
      "type": "Decimal",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "EmployeeNote": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "authorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "audience": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "body": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "employee": {
      "type": "Employee",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "Timesheet": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "weekStart": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "submittedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "submittedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reviewedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reviewedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reviewNote": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "employee": {
      "type": "Employee",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "entries": {
      "type": "TimesheetEntry",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "TimesheetEntry": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "timesheetId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "workedOn": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "minutes": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "timesheet": {
      "type": "Timesheet",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ShiftTask": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "shiftId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "completedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "completedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "shift": {
      "type": "RotaShift",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ProjectMember": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "userId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "role": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "project": {
      "type": "Project",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ProjectMilestone": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "targetAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "completedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "project": {
      "type": "Project",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "tasks": {
      "type": "ProjectTask",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "ProjectChecklistItem": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "taskId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "done": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "position": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "task": {
      "type": "ProjectTask",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ProjectDependency": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "predecessorId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "successorId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lagDays": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "predecessor": {
      "type": "ProjectTask",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "successor": {
      "type": "ProjectTask",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ProjectDocument": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "visibility": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "body": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "project": {
      "type": "Project",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "workAudit": {
      "type": "AuditEntry",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "revisions": {
      "type": "ProjectDocumentRevision",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "ProjectDocumentRevision": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "documentId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "body": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "authorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "document": {
      "type": "ProjectDocument",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ProjectDecision": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reason": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "alternatives": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "supersedesId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "decidedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "project": {
      "type": "Project",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ProjectUpdate": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "authorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "health": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "summary": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "next": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "risks": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "decisionsNeeded": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "project": {
      "type": "Project",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ProjectRisk": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "probability": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "impact": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "mitigation": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "dueAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "project": {
      "type": "Project",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ProjectApproval": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "requesterUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "approverUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "subjectVersion": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "response": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "respondedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "project": {
      "type": "Project",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ProjectRequest": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "creatorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "priority": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "dueAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "taskId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "project": {
      "type": "Project",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ProjectComment": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "taskId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "authorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "body": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "mentionUserIds": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "resolved": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "project": {
      "type": "Project",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "task": {
      "type": "ProjectTask",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "ProjectTimeEntry": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "taskId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "userId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "minutes": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "workedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "note": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "task": {
      "type": "ProjectTask",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ProjectPersonalPlan": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "userId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "taskId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "day": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "position": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "task": {
      "type": "ProjectTask",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ProjectInboxItem": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "userId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "taskId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "label": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "dismissedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "snoozedUntil": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "project": {
      "type": "Project",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "task": {
      "type": "ProjectTask",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "ProjectSavedView": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "userId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "definition": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "ProjectPortfolio": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "targetValue": {
      "type": "Float",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "currentValue": {
      "type": "Float",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "projects": {
      "type": "ProjectPortfolioLink",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "ProjectPortfolioLink": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "portfolioId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "portfolio": {
      "type": "ProjectPortfolio",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "project": {
      "type": "Project",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ProjectBaseline": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "authorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "snapshot": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "project": {
      "type": "Project",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ProjectBudgetLine": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "category": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "currency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "amountMinorUnits": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "project": {
      "type": "Project",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ProjectWorkLink": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "taskId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "relationship": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "targetEntity": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "targetId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "targetVersion": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "anchorStart": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "anchorEnd": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "project": {
      "type": "Project",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "task": {
      "type": "ProjectTask",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "ProjectTemplate": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "definition": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "ProjectAutomationRule": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "creatorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "trigger": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "taskType": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "action": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "followUpTitle": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "enabled": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "project": {
      "type": "Project",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "executions": {
      "type": "ProjectAutomationExecution",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "ProjectAutomationExecution": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ruleId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "eventKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "result": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "rule": {
      "type": "ProjectAutomationRule",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ProjectTimer": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "userId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "taskId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "task": {
      "type": "ProjectTask",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ProjectPreference": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "userId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "favourite": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "notificationMode": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lastViewedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "project": {
      "type": "Project",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ProjectFile": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "mediaType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "size": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "content": {
      "type": "Bytes",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "uploadedByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "project": {
      "type": "Project",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ProjectProperty": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "options": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "project": {
      "type": "Project",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "values": {
      "type": "ProjectPropertyValue",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "ProjectPropertyValue": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "propertyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "taskId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "value": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "property": {
      "type": "ProjectProperty",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "task": {
      "type": "ProjectTask",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ServiceCase": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "number": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "contactId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "subject": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "type": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "category": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "priority": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "severity": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "channel": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "security": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "queueId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reopenCount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "mergedIntoId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "mergedInto": {
      "type": "ServiceCase",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "mergedFrom": {
      "type": "ServiceCase",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "firstResponseAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "resolvedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "closedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "resolutionCode": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "resolutionSummary": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "rootCause": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "customerUpdateDueAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "queue": {
      "type": "ServiceQueue",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "recoveries": {
      "type": "ServiceRecovery",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "work": {
      "type": "ServiceWorkItem",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "files": {
      "type": "ServiceFile",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "context": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sla": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "firstResponseDueAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "resolutionDueAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "pausedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "investigation": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entries": {
      "type": "ServiceEntry",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "tickets": {
      "type": "ServiceTicket",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "links": {
      "type": "ServiceLink",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "ServiceEntry": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "caseId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ticketId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "sourceKey": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "visibility": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "body": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "authorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "case": {
      "type": "ServiceCase",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "ticket": {
      "type": "ServiceTicket",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "ServiceTicket": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "caseId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "queueId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "number": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "subject": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "dueAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "outcome": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "customerSafeSummary": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "completedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "case": {
      "type": "ServiceCase",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "queue": {
      "type": "ServiceQueue",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "entries": {
      "type": "ServiceEntry",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "ServiceQueue": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "prefix": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "department": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "members": {
      "type": "ServiceQueueMember",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "cases": {
      "type": "ServiceCase",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "work": {
      "type": "ServiceWorkItem",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "restricted": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "configuration": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "tickets": {
      "type": "ServiceTicket",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "ServiceQueueMember": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "queueId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "userId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "queue": {
      "type": "ServiceQueue",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ServiceLink": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "caseId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "relationship": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "case": {
      "type": "ServiceCase",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ServiceSequence": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "prefix": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "value": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "PasswordReset": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "membershipId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "purpose": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "tokenHash": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "expiresAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "usedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "membership": {
      "type": "Membership",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "MarketingProfile": {
    "marketingExperimentAssignmentRows": {
      "type": "MarketingExperimentAssignment",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "marketingTouchRows": {
      "type": "MarketingTouch",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "marketingJourneyEnrolmentRows": {
      "type": "MarketingJourneyEnrolment",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "marketingDeliveryRows": {
      "type": "MarketingDelivery",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "marketingAudienceMemberRows": {
      "type": "MarketingAudienceMember",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "contactId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lifecycle": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "source": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "country": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "brand": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "score": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "fitScore": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "engagementScore": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "contact": {
      "type": "Contact",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "permissions": {
      "type": "MarketingPermission",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "suppressions": {
      "type": "MarketingSuppression",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "events": {
      "type": "MarketingEvent",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "leads": {
      "type": "MarketingLead",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingPermission": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "profileId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "channel": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "purpose": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "brand": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "country": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "legalEntity": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "state": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "source": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "evidence": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "textVersion": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "noticeVersion": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lawfulBasis": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "recordedBy": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "occurredAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "profile": {
      "type": "MarketingProfile",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingSuppression": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "profileId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "channel": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reason": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "source": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdBy": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "profile": {
      "type": "MarketingProfile",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingEvent": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "profileId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "type": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "source": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "occurredAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "idempotencyKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "campaignId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "properties": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "scoreDelta": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "profile": {
      "type": "MarketingProfile",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingAudience": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "type": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "rules": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "source": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "purpose": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "permissionBasis": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "evidence": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "acquiredAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "members": {
      "type": "MarketingAudienceMember",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "campaigns": {
      "type": "MarketingCampaign",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingAudienceMember": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "audienceId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "profileId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "profile": {
      "type": "MarketingProfile",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "audience": {
      "type": "MarketingAudience",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingCampaign": {
    "objective": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "businessGoal": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "targetMarket": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "persona": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "positioning": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "message": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "offer": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "cta": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "channels": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "targetPipelineMinor": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "targetRevenueMinor": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "targetCustomers": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "targetLeads": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "risks": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "dependencies": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "teamName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "brand": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "region": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "language": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "utmCampaign": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "isProgramme": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "brief": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "launchedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "completedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "code": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "type": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "parentId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "audienceId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "startAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "endAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "budgetMinor": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "currency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "goal": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "goalTarget": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "approvedBy": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "approvedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "audience": {
      "type": "MarketingAudience",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "messages": {
      "type": "MarketingMessage",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingContent": {
    "persona": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "journeyStage": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "topic": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "language": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "summary": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "url": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reviewAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "copyrightOwner": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "licence": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "territory": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "permittedUse": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "restrictions": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "parentId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "requiresTechnicalApproval": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "technicalApprovedBy": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "brief": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "views": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "downloads": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "dueAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "body": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "brand": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "campaignId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "approvedBy": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "rights": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "expiresAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingMessage": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "campaignId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "channel": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "classification": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "purpose": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "brand": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "country": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "legalEntity": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "subject": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "body": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "campaign": {
      "type": "MarketingCampaign",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "jobs": {
      "type": "MarketingSendJob",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingSendJob": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "messageId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "scheduledAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "snapshot": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "idempotencyKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "approvedBy": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "cancelledAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "message": {
      "type": "MarketingMessage",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "deliveries": {
      "type": "MarketingDelivery",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingDelivery": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "jobId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "profileId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "profile": {
      "type": "MarketingProfile",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "exclusionReason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "providerId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "sentAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "job": {
      "type": "MarketingSendJob",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingJourney": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "trigger": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "publishedVersion": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "versions": {
      "type": "MarketingJourneyVersion",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingJourneyVersion": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "journeyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "number": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "nodes": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "exitRule": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "journey": {
      "type": "MarketingJourney",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "enrolments": {
      "type": "MarketingJourneyEnrolment",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingJourneyEnrolment": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "versionId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "profileId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "profile": {
      "type": "MarketingProfile",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "currentNode": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "nextExecutionAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "state": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "MarketingJourneyVersion",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingLead": {
    "assignedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "firstActionAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "recycleReason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "mqlAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "profileId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "campaignId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "explanation": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "prospectId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "feedback": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "dueAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "profile": {
      "type": "MarketingProfile",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingProgram": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "campaignId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "definition": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startsAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingTouch": {
    "channel": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "contentId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "activityId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "utm": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "profileId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "profile": {
      "type": "MarketingProfile",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "campaignId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "source": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "occurredAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "idempotencyKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingExperiment": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "audienceId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "control": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "variant": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "holdout": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "metric": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "assignments": {
      "type": "MarketingExperimentAssignment",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingExperimentAssignment": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "experimentId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "profileId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "profile": {
      "type": "MarketingProfile",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "group": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "experiment": {
      "type": "MarketingExperiment",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "FinanceEntity": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "code": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "currency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "country": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "vatNumber": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "registrationNumber": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "registeredAddress": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "fiscalStartMonth": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "matchToleranceBps": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "accounts": {
      "type": "FinanceAccount",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "periods": {
      "type": "FinancePeriod",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "journals": {
      "type": "FinanceJournal",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "documents": {
      "type": "FinanceDocument",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "banks": {
      "type": "FinanceBank",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "budgets": {
      "type": "FinanceBudget",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "assets": {
      "type": "FinanceAsset",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "contracts": {
      "type": "FinanceContract",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "scenarios": {
      "type": "FinanceScenario",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "closeTasks": {
      "type": "FinanceCloseTask",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "FinanceAccount": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "code": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "type": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "control": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "subType": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "parentId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "postingAllowed": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "currencyRestriction": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "dimensionRules": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entity": {
      "type": "FinanceEntity",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "lines": {
      "type": "FinanceJournalLine",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "banks": {
      "type": "FinanceBank",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "FinancePeriod": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "endAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "state": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "allowedSources": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "entity": {
      "type": "FinanceEntity",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "journals": {
      "type": "FinanceJournal",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "closeTasks": {
      "type": "FinanceCloseTask",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "FinanceJournal": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "periodId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sourceKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sourceType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sourceId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "accountingDate": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "currency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "exchangeRate": {
      "type": "Decimal",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "postingFingerprint": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "documentDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "taxDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "creatorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "approverUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "postedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reversalOfId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entity": {
      "type": "FinanceEntity",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "period": {
      "type": "FinancePeriod",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "lines": {
      "type": "FinanceJournalLine",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "documents": {
      "type": "FinanceDocument",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "FinanceJournalLine": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "journalId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "accountId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "debit": {
      "type": "BigInt",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "credit": {
      "type": "BigInt",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "transactionDebit": {
      "type": "BigInt",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "transactionCredit": {
      "type": "BigInt",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "department": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "costCentre": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "site": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "taxCode": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "journal": {
      "type": "FinanceJournal",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "account": {
      "type": "FinanceAccount",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "FinanceSupplier": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "currency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "paymentDays": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "category": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "creatorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "approvedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "bankVersions": {
      "type": "FinanceBankVersion",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "FinanceBankVersion": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "supplierId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "accountName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "accountNumber": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sortCode": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "iban": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "fingerprint": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "requesterUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "verifierUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "evidence": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "verifiedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "supplier": {
      "type": "FinanceSupplier",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "FinanceDocument": {
    "expenseClaimId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "externalReference": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "duplicateKey": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "creatorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "approverUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "sourceId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "salesOrderRevision": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "salesOrderId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "journalId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "bankVersionId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "currency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "exchangeRate": {
      "type": "Decimal",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "documentDate": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "accountingDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "taxDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "dueAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "net": {
      "type": "BigInt",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "tax": {
      "type": "BigInt",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "gross": {
      "type": "BigInt",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "settled": {
      "type": "BigInt",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "department": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "costCentre": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "site": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "category": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "capex": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "recurring": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "risk": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "salesOrder": {
      "type": "SalesOrder",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "entity": {
      "type": "FinanceEntity",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "project": {
      "type": "Project",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "journal": {
      "type": "FinanceJournal",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "source": {
      "type": "FinanceDocument",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "children": {
      "type": "FinanceDocument",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "lines": {
      "type": "FinanceDocumentLine",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "settlements": {
      "type": "FinanceSettlement",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "collectionActivities": {
      "type": "FinanceCollectionActivity",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "timeline": {
      "type": "FinanceTimeline",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "manufacturingSuggestions": {
      "type": "ManufacturingSupplySuggestion",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "FinanceDocumentLine": {
    "salesOrderLineId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "documentId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "number": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "sourceLineId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "quantity": {
      "type": "Decimal",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "damagedQuantity": {
      "type": "Decimal",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "unitPrice": {
      "type": "BigInt",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "net": {
      "type": "BigInt",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "tax": {
      "type": "BigInt",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "taxCode": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "taxRateBps": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "accountId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "document": {
      "type": "FinanceDocument",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "FinanceSettlement": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "documentId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "bankTransactionId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "amount": {
      "type": "BigInt",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "bankAmount": {
      "type": "BigInt",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "carryingAmount": {
      "type": "BigInt",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "realisedFx": {
      "type": "BigInt",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "actorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "document": {
      "type": "FinanceDocument",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "transaction": {
      "type": "FinanceBankTransaction",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "FinanceBank": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "accountId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "currency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "statementBalance": {
      "type": "BigInt",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "statementDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "entity": {
      "type": "FinanceEntity",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "account": {
      "type": "FinanceAccount",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "transactions": {
      "type": "FinanceBankTransaction",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "FinanceBankTransaction": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "bankId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "externalId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "date": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "amount": {
      "type": "BigInt",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "allocated": {
      "type": "BigInt",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "bank": {
      "type": "FinanceBank",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "settlements": {
      "type": "FinanceSettlement",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "FinanceBudget": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "department": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "startAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "endAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "amount": {
      "type": "BigInt",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "policy": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entity": {
      "type": "FinanceEntity",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "FinanceAsset": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sourceDocumentId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "acquiredAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "cost": {
      "type": "BigInt",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "residual": {
      "type": "BigInt",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lifeMonths": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "method": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "accumulated": {
      "type": "BigInt",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "department": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "location": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "serialNumber": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entity": {
      "type": "FinanceEntity",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "FinanceContract": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "annualAmount": {
      "type": "BigInt",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "renewalAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "noticeDays": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entity": {
      "type": "FinanceEntity",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "FinanceScenario": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "assumptions": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entity": {
      "type": "FinanceEntity",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "FinanceCloseTask": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "periodId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "dueAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "evidence": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "entity": {
      "type": "FinanceEntity",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "period": {
      "type": "FinancePeriod",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "FinanceTimeline": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "documentId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "actorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "action": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "detail": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "document": {
      "type": "FinanceDocument",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ApprovalPolicy": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "subjectType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "minAmount": {
      "type": "BigInt",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "maxAmount": {
      "type": "BigInt",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "currency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "conditions": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "stages": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "ApprovalInstance": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "subjectType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "subjectId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "subjectVersion": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "requesterUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "policyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "policyVersion": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "currentStage": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "snapshot": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "steps": {
      "type": "ApprovalStep",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "ApprovalStep": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "instanceId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "stage": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "approverUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "actedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "dueAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "actedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "instance": {
      "type": "ApprovalInstance",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ApprovalDelegation": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "fromUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "toUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "endAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "FinancePaymentRun": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "bankId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "creatorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "approverUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "total": {
      "type": "BigInt",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "currency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "items": {
      "type": "FinancePaymentItem",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "FinancePaymentItem": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "runId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "documentId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "bankVersionId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "amount": {
      "type": "BigInt",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "run": {
      "type": "FinancePaymentRun",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "FinanceAttachment": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "documentId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "mimeType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "checksum": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "content": {
      "type": "Bytes",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "uploadedByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "SchedulingHoursBudget": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "managerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "weekStart": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "department": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "minutes": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SchedulingWorkType": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "category": {
      "type": "SchedulingWorkCategory",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startTime": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "endTime": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "breakMinutes": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "weekdays": {
      "type": "Int",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "teamId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "team": {
      "type": "WorkTeam",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "shifts": {
      "type": "RotaShift",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "SchedulingDemand": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "demandDate": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "teamId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "department": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "workTypeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "label": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "forecastVolume": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "volumeUnit": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "minutesPerUnit": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "shrinkagePercent": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "requiredMinutes": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SchedulingCalendarRule": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startsOn": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "endsOn": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "teamId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "department": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "maxOffPerDay": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "blockHolidays": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "note": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "StockLocation": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "warehouseId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "parentId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "code": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "capabilities": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "sequence": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "warehouse": {
      "type": "Warehouse",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "parent": {
      "type": "StockLocation",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "children": {
      "type": "StockLocation",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "positions": {
      "type": "StockPosition",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "movesFrom": {
      "type": "InternalMove",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "movesTo": {
      "type": "InternalMove",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "StockLot": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "code": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "manufacturedOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "expiresOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "bestBeforeOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "removalOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "warningOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "StockSerial": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "serial": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "warehouseId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "locationId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "lotId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "StockPosition": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "warehouseId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "locationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lotId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "quantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "warehouse": {
      "type": "Warehouse",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "location": {
      "type": "StockLocation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "StockForecast": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "forecastDate": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "quantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "method": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "confidence": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "StockReservation": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "fulfilmentLineId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "warehouseId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "locationId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "lotId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "quantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sourceType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sourceId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "requestKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "warehouse": {
      "type": "Warehouse",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "StockDiscrepancy": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "warehouseId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "locationId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "systemQuantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reportedQuantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sourceType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sourceId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "requestKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "warehouse": {
      "type": "Warehouse",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "LogisticsPolicy": {
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "mode": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reservationPolicy": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reserveDaysBefore": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "releaseMethod": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "packVerification": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "overPickPolicy": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "removalStrategy": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "otifOnTimeRule": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "otifFullPercent": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "fulfilmentModel": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "dispatchConfirmsDelivery": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "cutOffs": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "LogisticsCounter": {
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "value": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "FulfilmentRequirement": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "salesOrderId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "splitKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "shipTo": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "priority": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "priorityReason": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "holdSummary": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "warehouseId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "warehousePreference": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "requestedOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "promisedOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "partialPolicy": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "deliveryRules": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "shippingInstructions": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "serviceLevel": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "timeWindow": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "fulfilmentMode": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sourceEventKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "releasedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "expectedCompletion": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "salesOrder": {
      "type": "SalesOrder",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "lines": {
      "type": "FulfilmentLine",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "tasks": {
      "type": "WarehouseTask",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "sources": {
      "type": "ShipmentSource",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "packages": {
      "type": "LogisticsPackage",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "FulfilmentLine": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "requirementId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "salesOrderLineId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "orderedQuantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "cancelledQuantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "allocatedQuantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "pickedQuantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "packedQuantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "shippedQuantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "deliveredQuantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "returnedQuantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "allocationStatus": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "shortage": {
      "type": "Json",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "unitOfMeasure": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "requirement": {
      "type": "FulfilmentRequirement",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "sources": {
      "type": "ShipmentSource",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "LogisticsWave": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "method": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "criteria": {
      "type": "Json",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "cutOffAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "tasks": {
      "type": "WarehouseTask",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "WarehouseTask": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "method": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "requirementId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "waveId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "shipmentId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "receiptId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "assigneeUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "claimedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "startedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "completedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "requirement": {
      "type": "FulfilmentRequirement",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "wave": {
      "type": "LogisticsWave",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "shipment": {
      "type": "Shipment",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "receipt": {
      "type": "ExpectedReceipt",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "lines": {
      "type": "WarehouseTaskLine",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "WarehouseTaskLine": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "taskId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "fulfilmentLineId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productCode": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "locationCode": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "expectedBarcode": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "requiredQuantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "confirmedQuantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lotCode": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "serials": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "exceptionReason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "clusterSlot": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "zoneCode": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "sequence": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "task": {
      "type": "WarehouseTask",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "HandlingUnitType": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "code": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lengthMm": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "widthMm": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "heightMm": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "tareWeightGrams": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "canContain": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "LogisticsPackage": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "shipmentId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "requirementId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "parentId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "packageType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "typeCode": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "barcode": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "weightGrams": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "expectedWeightGrams": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "tareWeightGrams": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "lengthMm": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "widthMm": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "heightMm": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "locationCode": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "trackingNumber": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "sealNumber": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "sscc": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "packedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "packedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "shipment": {
      "type": "Shipment",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "requirement": {
      "type": "FulfilmentRequirement",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "parent": {
      "type": "LogisticsPackage",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "children": {
      "type": "LogisticsPackage",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "contents": {
      "type": "PackageContent",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "PackageContent": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "packageId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "quantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lotCode": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "serials": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "fulfilmentLineId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "package": {
      "type": "LogisticsPackage",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "Shipment": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "shipTo": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "carrierCode": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "carrierReason": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "serviceLevel": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "plannedDispatchAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "dispatchedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "expectedDeliveryAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "deliveredAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "trackingNumber": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "rawCarrierStatus": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "estimatedCostMinor": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "actualCostMinor": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "customerChargeMinor": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "currency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "loadId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "stageLane": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "collection": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "onTime": {
      "type": "Boolean",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "inFull": {
      "type": "Boolean",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "failureReason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "pod": {
      "type": "Json",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "load": {
      "type": "LogisticsLoad",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "sources": {
      "type": "ShipmentSource",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "packages": {
      "type": "LogisticsPackage",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "events": {
      "type": "TrackingEvent",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "tasks": {
      "type": "WarehouseTask",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "stops": {
      "type": "LoadStop",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "ShipmentSource": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "salesOrderId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "shipmentId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "requirementId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "fulfilmentLineId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "quantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "shipment": {
      "type": "Shipment",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "requirement": {
      "type": "FulfilmentRequirement",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "line": {
      "type": "FulfilmentLine",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "TrackingEvent": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "shipmentId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "packageId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "rawStatus": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "occurredAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "note": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "requestKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "shipment": {
      "type": "Shipment",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "LogisticsLoad": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "vehicleLabel": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "fleetVehicleRef": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "driverName": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "routeName": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "plannedDepartureAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "maxWeightKg": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "maxPallets": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "shipments": {
      "type": "Shipment",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "stops": {
      "type": "LoadStop",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "LoadStop": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "loadId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "shipmentId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sequence": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "windowLabel": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "load": {
      "type": "LogisticsLoad",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "shipment": {
      "type": "Shipment",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ExpectedReceipt": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sourceType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sourceReference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyName": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "warehouseId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "expectedOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "warehouse": {
      "type": "Warehouse",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "lines": {
      "type": "ReceiptLine",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "tasks": {
      "type": "WarehouseTask",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "ReceiptLine": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "receiptId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "expectedQuantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "receivedQuantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lotCode": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "serials": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "condition": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "discrepancy": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "receipt": {
      "type": "ExpectedReceipt",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "ReturnAuthorisation": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "salesOrderId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "shipmentId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reason": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "requestedResolution": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "authorisationRequired": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "lines": {
      "type": "ReturnLine",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "ReturnLine": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "returnId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "quantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "receivedQuantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lotCode": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "serials": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "condition": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "disposition": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "replacementRequirementId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "returnAuthorisation": {
      "type": "ReturnAuthorisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "LogisticsOperation": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "requestKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "action": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "result": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "CarrierRule": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "priority": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "explanation": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "match": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "carrierCode": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "serviceLevel": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "LogisticsSavedView": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "scope": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "definition": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "BusinessPlan": {
    "revision": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "inputs": {
      "type": "PlanInput",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "purpose": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "teamName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "periodLabel": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "periodStart": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "periodEnd": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "currency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sensitive": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "audience": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "brief": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "locked": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lockedPeriods": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "parentPlanId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "parent": {
      "type": "BusinessPlan",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "children": {
      "type": "BusinessPlan",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "versions": {
      "type": "PlanVersion",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "measures": {
      "type": "PlanMeasure",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "cells": {
      "type": "PlanCell",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "assumptions": {
      "type": "PlanAssumption",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "drivers": {
      "type": "PlanDriver",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "blocks": {
      "type": "PlanBlock",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "goals": {
      "type": "PlanGoal",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "initiatives": {
      "type": "PlanInitiative",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "actions": {
      "type": "PlanAction",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "risks": {
      "type": "PlanRisk",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "dependencies": {
      "type": "PlanDependency",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "dependedOnBy": {
      "type": "PlanDependency",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "decisions": {
      "type": "PlanDecision",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "comments": {
      "type": "PlanComment",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "reviews": {
      "type": "PlanReview",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "updates": {
      "type": "PlanUpdate",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "lenses": {
      "type": "PlanLens",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "modelLinks": {
      "type": "PlanModelLink",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "sourceLinks": {
      "type": "PlanSourceLink",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "shares": {
      "type": "PlanShare",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "notes": {
      "type": "PlanNote",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "PlanVersion": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "shared": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "basedOnId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "note": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "approvedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "plan": {
      "type": "BusinessPlan",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "basedOn": {
      "type": "PlanVersion",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "derived": {
      "type": "PlanVersion",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "cells": {
      "type": "PlanCell",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "assumptions": {
      "type": "PlanAssumption",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "drivers": {
      "type": "PlanDriver",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "PlanMeasure": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "metricKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sortOrder": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "plan": {
      "type": "BusinessPlan",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PlanCell": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "versionId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "metricKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "periodKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "dimensionKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "dimensionLabel": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "value": {
      "type": "Decimal",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedByName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "plan": {
      "type": "BusinessPlan",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "version": {
      "type": "PlanVersion",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PlanAssumption": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "versionId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "valueText": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "effectiveOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "note": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "series": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "plan": {
      "type": "BusinessPlan",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "version": {
      "type": "PlanVersion",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PlanDriver": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "versionId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "outputLabel": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "outputUnit": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "inputs": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "plan": {
      "type": "BusinessPlan",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "version": {
      "type": "PlanVersion",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PlanBlock": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sortOrder": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "width": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "config": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "plan": {
      "type": "BusinessPlan",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PlanGoal": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "parentId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "targetText": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "metricKey": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "qualitative": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "detail": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "progressNote": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startsOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "endsOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "plan": {
      "type": "BusinessPlan",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "parent": {
      "type": "PlanGoal",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "children": {
      "type": "PlanGoal",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "initiatives": {
      "type": "PlanInitiative",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "PlanInitiative": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "goalId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "detail": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "projectId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startsOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "endsOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "plan": {
      "type": "BusinessPlan",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "goal": {
      "type": "PlanGoal",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "actions": {
      "type": "PlanAction",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "PlanAction": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "initiativeId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "detail": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startsOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "dueOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "plan": {
      "type": "BusinessPlan",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "initiative": {
      "type": "PlanInitiative",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "PlanRisk": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "impactText": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "metricKey": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "severity": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "plan": {
      "type": "BusinessPlan",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PlanDependency": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "dependsOnPlanId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "note": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "plan": {
      "type": "BusinessPlan",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "dependsOn": {
      "type": "BusinessPlan",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "PlanDecision": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "decidedOn": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reason": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "impact": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "plan": {
      "type": "BusinessPlan",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PlanComment": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "targetType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "targetKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "body": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "authorName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "plan": {
      "type": "BusinessPlan",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PlanReview": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "scheduledFor": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "agenda": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "snapshot": {
      "type": "Json",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "completedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "plan": {
      "type": "BusinessPlan",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PlanUpdate": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "tone": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "summary": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "detail": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "actionsText": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "authorName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "plan": {
      "type": "BusinessPlan",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PlanLens": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "audience": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "sections": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "plan": {
      "type": "BusinessPlan",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PlanModelLink": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "fromKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "toKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "passthrough": {
      "type": "Decimal",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "note": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "plan": {
      "type": "BusinessPlan",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PlanSourceLink": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sourceModule": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sourceId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sourceLabel": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "mode": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "plan": {
      "type": "BusinessPlan",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PlanShare": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "userId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "access": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sharedByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "plan": {
      "type": "BusinessPlan",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PlanNote": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "body": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "authorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "authorName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "plan": {
      "type": "BusinessPlan",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "LogisticsNote": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "audience": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "body": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "authorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyProfile": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "operatingProfile": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "features": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "jurisdiction": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "anonymousReports": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyCounter": {
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "value": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyPlace": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "parentId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "code": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "parent": {
      "type": "SafetyPlace",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "children": {
      "type": "SafetyPlace",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "risks": {
      "type": "SafetyRisk",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "incidents": {
      "type": "SafetyIncident",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "permits": {
      "type": "SafetyPermit",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "substances": {
      "type": "SafetySubstance",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyMatrix": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "config": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyRisk": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "category": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "placeId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "place": {
      "type": "SafetyPlace",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "assessments": {
      "type": "SafetyAssessment",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "reviews": {
      "type": "SafetyReviewRequest",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyAssessment": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "riskId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "revision": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "hazard": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "whoHarmed": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "howHarmed": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "existingControls": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "initialLikelihood": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "initialSeverity": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "initialRating": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "initialExplanation": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "residualLikelihood": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "residualSeverity": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "residualRating": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "residualExplanation": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "responsibleUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "targetDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reviewDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "authorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reviewerUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "approverUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "approvedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "changeReason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "effectiveFrom": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "effectiveTo": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "evidenceNote": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "matrixId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "risk": {
      "type": "SafetyRisk",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "controls": {
      "type": "SafetyControl",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyControl": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "assessmentId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "hierarchy": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "inPlace": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "assessment": {
      "type": "SafetyAssessment",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyAction": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "detail": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "dueDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "priority": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sourceType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sourceId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "evidence": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "capaStage": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "verifiedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "verifiedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "verificationNote": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "effectivenessDue": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "effectivenessNote": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "estimatedCostMinor": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyIncident": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "summary": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "narrative": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "whereLabel": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "placeId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "occurredAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reportedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "involvedLabel": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "immediateDanger": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "anyoneStillAtRisk": {
      "type": "Boolean",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "isolationRequired": {
      "type": "Boolean",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "areaClosureRequired": {
      "type": "Boolean",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "firstAidRequired": {
      "type": "Boolean",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "emergencyServicesRequired": {
      "type": "Boolean",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "managementNotified": {
      "type": "Boolean",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "actualConsequence": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "potentialConsequence": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "evidenceNote": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "confidential": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "anonymous": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "commitment": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "place": {
      "type": "SafetyPlace",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "investigation": {
      "type": "SafetyInvestigation",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "riddor": {
      "type": "SafetyRiddorDecision",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "SafetyInvestigation": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "incidentId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "method": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "timeline": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "immediateCauses": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "underlyingCauses": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "rootCause": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "leadUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "incident": {
      "type": "SafetyIncident",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "causes": {
      "type": "SafetyCause",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyCause": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "investigationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "category": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "statement": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "investigation": {
      "type": "SafetyInvestigation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyRiddorDecision": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "incidentId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "workRelated": {
      "type": "Boolean",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "personClass": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "outcome": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "potentialCategory": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "decision": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "rationale": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "responsibleUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "decidedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "decidedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reportDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reportingMethod": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "submissionReference": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reminderDue": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "ruleVersion": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "guidance": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "incident": {
      "type": "SafetyIncident",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyReviewRequest": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "riskId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reason": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sourceType": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "sourceId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "requestedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "risk": {
      "type": "SafetyRisk",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyInspectionTemplate": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "cadence": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "questions": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "inspections": {
      "type": "SafetyInspection",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyInspection": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "templateId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "placeId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "scheduledFor": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "completedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "inspectorUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "responses": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "commitment": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "template": {
      "type": "SafetyInspectionTemplate",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "SafetyAudit": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "scope": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "auditorUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "startedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "completedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "approvedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "approvedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "findings": {
      "type": "SafetyFinding",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyFinding": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "auditId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "statement": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "audit": {
      "type": "SafetyAudit",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyPermit": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "placeId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startsAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "expiresAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "requestedByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "authorisedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "contractorPartyId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "hazards": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "controlsConfirmed": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "isolationRequired": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "extensionCount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "suspendedReason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "handbackAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "closedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "conditionsChanged": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "payload": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "place": {
      "type": "SafetyPlace",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "isolations": {
      "type": "SafetyIsolation",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyIsolation": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "assetLabel": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "targetType": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "targetId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "energyTypes": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "permitId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "appliedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "verifiedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "removedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "appliedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "clearedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "permit": {
      "type": "SafetyPermit",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "locks": {
      "type": "SafetyIsolationLock",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyIsolationLock": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "isolationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "identifier": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "appliedByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "appliedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "removedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "removedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "isolation": {
      "type": "SafetyIsolation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyHold": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "targetType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "targetId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "targetLabel": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reason": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "placedByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "placedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "releasedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "releasedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "repairComplete": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "inspectionComplete": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "safetyVerified": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "verificationNote": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "overrideReason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "overrideByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "overrideScope": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "overrideApprovedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "overrideExpiresAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "maintenanceActionId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyStatutoryCheck": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "assetLabel": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "targetType": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "targetId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "safeWorkingLoad": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "examiner": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "scheme": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "lastExaminedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "nextDueAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "seriousDefect": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "defectSummary": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "restriction": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reportNote": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "overall": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "checklist": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SafetySubstance": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "tradeName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "manufacturer": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "useSummary": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "placeId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "signalWord": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "hazardStatements": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "precautionaryStatements": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "pictograms": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "classifications": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "storageRequirements": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "ppe": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "emergencyResponse": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "disposalGuidance": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "exposureLimits": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "approvedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "approvedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "place": {
      "type": "SafetyPlace",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "sheets": {
      "type": "SafetySds",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "assessments": {
      "type": "SafetyCoshhAssessment",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "SafetySds": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "substanceId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "versionLabel": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "supplier": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "issueDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "uploadedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "supersededAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "language": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "note": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "substance": {
      "type": "SafetySubstance",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyCoshhAssessment": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "substanceId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "revision": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "task": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "quantity": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "frequency": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "duration": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "route": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "peopleExposed": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "hazard": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "controls": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "engineeringControls": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "lev": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "ppe": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "storage": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "spillResponse": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "waste": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "emergencyAction": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "exposureLimits": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "healthSurveillance": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "residualRisk": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "canEliminate": {
      "type": "Boolean",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "canSubstitute": {
      "type": "Boolean",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "substitutionReason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reviewDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "authorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "substance": {
      "type": "SafetySubstance",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyCompetence": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "key": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "label": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "expiresAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "issuedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "evidenceNote": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyDocument": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "revision": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "body": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "effectiveFrom": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reviewDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "supersedesId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "requiresAcknowledgement": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "supersedes": {
      "type": "SafetyDocument",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "successors": {
      "type": "SafetyDocument",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "acknowledgements": {
      "type": "SafetyAcknowledgement",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyAcknowledgement": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "documentId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "userId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "acknowledgedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "document": {
      "type": "SafetyDocument",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyObligation": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "jurisdiction": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "topic": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "requirement": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "applicable": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "responsibleUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "evidence": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "frequency": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "nextDue": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "source": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ruleVersion": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyChange": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "trigger": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "impact": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "proposedByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "approvedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "implementedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reviewDue": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyLink": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sourceType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sourceId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "targetType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "targetId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "label": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SafetyRecord": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "placeId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "dueAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "payload": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sensitive": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "commitment": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PlannerTeam": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "members": {
      "type": "PlannerTeamMember",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "tasks": {
      "type": "PlannerTask",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "covers": {
      "type": "PlannerCover",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "handovers": {
      "type": "PlannerHandover",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "places": {
      "type": "PlannerPlace",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "moments": {
      "type": "PlannerMoment",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "PlannerTeamMember": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "teamId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lead": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "team": {
      "type": "PlannerTeam",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "employee": {
      "type": "Employee",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PlannerTask": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "teamId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "detail": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "assigneeEmployeeId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "dueOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "startsOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "estimatedHours": {
      "type": "Float",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "priority": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "goalId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "PlannerTaskStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "team": {
      "type": "PlannerTeam",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "assignee": {
      "type": "Employee",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "KpiScorecard": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "items": {
      "type": "KpiScorecardItem",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "KpiScorecardItem": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "scorecardId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "goalId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "weight": {
      "type": "Float",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "scorecard": {
      "type": "KpiScorecard",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "goal": {
      "type": "Kpi",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "StaffingInterval": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "department": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "label": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "role": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "requiredSkills": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "startsAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "endsAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "volume": {
      "type": "Float",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "handlingMinutes": {
      "type": "Float",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "shrinkagePercent": {
      "type": "Float",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "occupancyPercent": {
      "type": "Float",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "minimumPeople": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "RotaActivity": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "shiftId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "label": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startsAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "endsAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "shift": {
      "type": "RotaShift",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "EmployeeAvailability": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startsAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "endsAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "note": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employee": {
      "type": "Employee",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "OpenRotaShift": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "department": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "role": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "location": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "requiredSkills": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "startsAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "endsAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "breakMinutes": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "breakStartsAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "assignedShiftId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "requests": {
      "type": "OpenShiftRequest",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "OpenShiftRequest": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "openingId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reviewedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reviewedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "opening": {
      "type": "OpenRotaShift",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "employee": {
      "type": "Employee",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PlannerCover": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "teamId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "coverEmployeeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startsOn": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "endsOn": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "note": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "team": {
      "type": "PlannerTeam",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "employee": {
      "type": "Employee",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "cover": {
      "type": "Employee",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PlannerHandover": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "teamId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startsOn": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "endsOn": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "note": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "team": {
      "type": "PlannerTeam",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "employee": {
      "type": "Employee",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PlannerPlace": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "teamId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "onDate": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "PlannerPlaceKind",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "note": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "team": {
      "type": "PlannerTeam",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "employee": {
      "type": "Employee",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PlannerMoment": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "teamId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "onDate": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "PlannerMomentKind",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "note": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "team": {
      "type": "PlannerTeam",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "QualitySequence": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "prefix": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "value": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "QualitySpecification": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "code": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "revision": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "QualitySpecificationStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "effectiveFrom": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "effectiveTo": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "changeReason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "characteristics": {
      "type": "QualityCharacteristic",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "controlPoints": {
      "type": "QualityControlPoint",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "inspections": {
      "type": "QualityInspection",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "nonConformances": {
      "type": "NonConformance",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "QualityCharacteristic": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "specificationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "method": {
      "type": "QualityCheckMethod",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "unit": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "target": {
      "type": "Decimal",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "lowerLimit": {
      "type": "Decimal",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "upperLimit": {
      "type": "Decimal",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "position": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "specification": {
      "type": "QualitySpecification",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "measurements": {
      "type": "QualityMeasurement",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "QualityControlPoint": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "code": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "operation": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "trigger": {
      "type": "QualityControlTrigger",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "specificationId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "sampleSize": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "specification": {
      "type": "QualitySpecification",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "inspections": {
      "type": "QualityInspection",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "QualityInspection": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "number": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "controlPointId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "specificationId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lotCode": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "warehouseId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "locationId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "sourceType": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "sourceId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "quantityInspected": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "result": {
      "type": "QualityInspectionResult",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "inspectedByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "inspectedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "controlPoint": {
      "type": "QualityControlPoint",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "specification": {
      "type": "QualitySpecification",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "measurements": {
      "type": "QualityMeasurement",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "holds": {
      "type": "QualityHold",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "nonConformances": {
      "type": "NonConformance",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "QualityMeasurement": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "inspectionId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "characteristicId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "sampleIndex": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "valueText": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "valueNumber": {
      "type": "Decimal",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "pass": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "inspection": {
      "type": "QualityInspection",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "characteristic": {
      "type": "QualityCharacteristic",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "QualityHold": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "number": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lotCode": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "warehouseId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "locationId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "quantity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "QualityHoldStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reason": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "inspectionId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "placedByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "placedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "releasedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "releasedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "releaseNote": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "inspection": {
      "type": "QualityInspection",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "nonConformances": {
      "type": "NonConformance",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "NonConformance": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "number": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "source": {
      "type": "NonConformanceSource",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "NonConformanceStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "severity": {
      "type": "NonConformanceSeverity",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "specificationId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "inspectionId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "holdId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "quantityAffected": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "defect": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "containment": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "disposition": {
      "type": "NonConformanceDisposition",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "dispositionNote": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "rootCause": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "rootCauseConfirmed": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reportedByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reportedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "closedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "closedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "dueAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "workspace": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "specification": {
      "type": "QualitySpecification",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "inspection": {
      "type": "QualityInspection",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "hold": {
      "type": "QualityHold",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "actions": {
      "type": "NonConformanceAction",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "NonConformanceAction": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ncrId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "dueDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "NonConformanceActionStatus",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "effectivenessCriterion": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "effectivenessReviewDate": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "effectivenessResult": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "ncr": {
      "type": "NonConformance",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "TicketQueue": {
    "model": {
      "type": "AutomationEvent",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityType": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "entityId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "payload": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "occurredAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "processedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    }
  },
  "Automation": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "enabled": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "triggerType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "triggerEvent": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "schedule": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "conditions": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "steps": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "templateKey": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lastRunAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "runCount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "failCount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "runs": {
      "type": "AutomationRun",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "AutomationRun": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "automationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "eventId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "idempotencyKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "dryRun": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "cursor": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "context": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "results": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "error": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "resumeAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "attempts": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "finishedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "automation": {
      "type": "Automation",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "EmailAccount": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "scope": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "label": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "fromName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "fromEmail": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "replyTo": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "smtpHost": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "smtpPort": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "smtpSecurity": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "smtpUser": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "passwordEnc": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "imapHost": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "imapPort": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "imapSecurity": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "imapUser": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "imapEnabled": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "imapStatus": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "imapError": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "imapSyncedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "imapLastUid": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "signatureHtml": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "dailyLimit": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "isDefault": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lastError": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "lastVerifiedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "EmailInbound": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "accountId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "uid": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "messageId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "inReplyTo": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "fromEmail": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "fromName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "subject": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "text": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "receivedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "contactId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "replyToMessageId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "EmailTemplate": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "category": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "subject": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "preheader": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "blocks": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "brand": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdBy": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "EmailMessage": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "accountId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "templateId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "messageClass": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "toEmail": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "toName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "cc": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "subject": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "html": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "text": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "attachments": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "calendar": {
      "type": "Json",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "scheduledAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sentAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "error": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "providerMessageId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "contactId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "entityType": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "entityId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "campaignId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "automationRunId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "openToken": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "openedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "SocialAccount": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "platform": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "label": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "credentialsEnc": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lastError": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "ContractDocument": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reference": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "bodyHtml": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "contactId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "quoteId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "orderId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "opportunityId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "sourceModule": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "sourceType": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "sourceId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "templateId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "templateVersion": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "templateSnapshot": {
      "type": "Json",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "signingMode": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "completionMethod": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "returns": {
      "type": "ContractReturn",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "tokenHash": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "expiresAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "sentAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "viewedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "signedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "signerName": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "signerEmail": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "signerIp": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "declinedReason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "contentHash": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "message": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "fileName": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "fileType": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "fileSize": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "fileContent": {
      "type": "Bytes",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "signerUserAgent": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "signatureImage": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdBy": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "DocumentTemplate": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "category": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "targetModules": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "titleTemplate": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "blocks": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdBy": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "ContractReturn": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "contractId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "contract": {
      "type": "ContractDocument",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "fileName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "fileSize": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "fileContent": {
      "type": "Bytes",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "contentHash": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "signerName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "signerIp": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "signerUserAgent": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "submittedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reviewedBy": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reviewedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reviewNote": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    }
  },
  "CsatSurvey": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "question": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "followUpQuestion": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lowFollowUpQuestion": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reasons": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "lowLabel": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "highLabel": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "emailSubject": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "emailIntro": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "thanksText": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "scale": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "context": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdBy": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "responses": {
      "type": "CsatResponse",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "CsatResponse": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "surveyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "token": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "contactId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "email": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "entityType": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "entityId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "score": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "comment": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "commentSubmittedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "invalidReason": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "invalidatedBy": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "invalidatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reasons": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "sentAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "respondedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "automationRunId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "deliveryStatus": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "emailMessageId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "sourceKey": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "serviceContext": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "survey": {
      "type": "CsatSurvey",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "MarketingSetting": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "settings": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingBudgetLine": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "campaignId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "category": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "label": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "month": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "plannedMinor": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "committedMinor": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "actualMinor": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "forecastMinor": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "source": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sourceRef": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "approvedBy": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "approvedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingActivity": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "campaignId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "channel": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "endAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "phase": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "contentId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "messageId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "socialPostId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "eventId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "costMinor": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingSegment": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "mode": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entity": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "rules": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "purpose": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lastCount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lastAccountCount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lastCountAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "staticPartyIds": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "snapshots": {
      "type": "MarketingSegmentSnapshot",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "MarketingSegmentSnapshot": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "segmentId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "takenAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyIds": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "contactCount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "note": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "segment": {
      "type": "MarketingSegment",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "MarketingTargetAccount": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "listName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "tier": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "strategicValue": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingBrandKit": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "brand": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "displayName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "colours": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "typography": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "tone": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "boilerplate": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "legalCopy": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "dos": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "donts": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "senderName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingForm": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "slug": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "campaignId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "fields": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "consentText": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "routing": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "thanksMessage": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "redirectUrl": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "views": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdBy": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "submissions": {
      "type": "MarketingFormSubmission",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "MarketingFormSubmission": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "formId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "data": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "utm": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "email": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "contactId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "prospectId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "outcome": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "form": {
      "type": "MarketingForm",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "MarketingLandingPage": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "slug": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "campaignId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "formId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "brand": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "blocks": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "seoTitle": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "seoDescription": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "views": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "conversions": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "publishedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdBy": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingLink": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "code": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "destination": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "campaignId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "activityId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "contentId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "source": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "medium": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "campaignName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "utmContent": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "utmTerm": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "clicks": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdBy": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingEventPlan": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "campaignId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "venue": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startsAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "endsAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "capacity": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "agenda": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "speakers": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sponsors": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "budgetMinor": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "actualCostMinor": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "checkInCode": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdBy": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "attendees": {
      "type": "MarketingEventAttendee",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "MarketingEventAttendee": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "eventId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "email": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "company": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "contactId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "prospectId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "checkedInAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "interest": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "source": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "event": {
      "type": "MarketingEventPlan",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "MarketingKnowledge": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "body": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "data": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "source": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reviewedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdBy": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingAttributionModel": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "effectiveFrom": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "rules": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingCampaignSnapshot": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "campaignId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "takenAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "model": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "metrics": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "note": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdBy": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingPaidSpend": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "campaignId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "provider": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "account": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "externalCampaign": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "day": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "spendMinor": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "impressions": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "clicks": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "conversions": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "importedBy": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MarketingSocialPost": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "campaignId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "contentId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "caption": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "linkUrl": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "mediaUrls": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "hashtags": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "scheduledAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "publishedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "lastError": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdBy": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "targets": {
      "type": "MarketingSocialPostTarget",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "MarketingSocialPostTarget": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "postId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "platform": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "accountId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "publishMode": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "captionOverride": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "externalId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "permalink": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "lastError": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "publishedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "post": {
      "type": "MarketingSocialPost",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "GuardianIssue": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "fingerprint": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "severity": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "route": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "source": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "expected": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "actual": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "steps": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "evidence": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "brief": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "revision": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "runId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "occurrences": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "firstSeenAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lastSeenAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "resolution": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "verifiedRevision": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reviewedBy": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    }
  },
  "GuardianRun": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "requestedBy": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "finishedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "revision": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "summary": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "coverage": {
      "type": "Json",
      "list": false,
      "nullable": true,
      "relation": false
    }
  },
  "GuardianWorker": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "heartbeatAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "revision": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "GuardianRateLimit": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "count": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "expiresAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "ServiceWorkItem": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "number": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "subject": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "type": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "category": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "priority": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "severity": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "impact": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "urgency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "queueId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "queue": {
      "type": "ServiceQueue",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "requesterUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "requestedForUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "watcherIds": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "parentCaseId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "parentCase": {
      "type": "ServiceCase",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "parentId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "parent": {
      "type": "ServiceWorkItem",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "children": {
      "type": "ServiceWorkItem",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "mergedIntoId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "mergedInto": {
      "type": "ServiceWorkItem",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "mergedFrom": {
      "type": "ServiceWorkItem",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "context": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "definition": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sla": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "firstResponseDueAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "resolutionDueAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "firstResponseAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "pausedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "resolvedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "resolution": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "reopenCount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "approvalId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entries": {
      "type": "ServiceWorkEntry",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "files": {
      "type": "ServiceFile",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "ServiceWorkEntry": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "workId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "work": {
      "type": "ServiceWorkItem",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "visibility": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "body": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "actorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "ServiceFile": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "caseId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "case": {
      "type": "ServiceCase",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "workId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "work": {
      "type": "ServiceWorkItem",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "storageKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "mime": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "size": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sha256": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "visibility": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "actorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "ServiceRecovery": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "caseId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "case": {
      "type": "ServiceCase",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "number": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "type": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "currency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "value": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "maximum": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "minimumOrder": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "validFrom": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "expiresAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "usageLimit": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "usedCount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "eligibleProductIds": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "excludedProductIds": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "reason": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "creatorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "approvalId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "redemptions": {
      "type": "ServiceRedemption",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "ServiceRedemption": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "recoveryId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "recovery": {
      "type": "ServiceRecovery",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "orderId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "amount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "actorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "ServiceKnowledge": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "category": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "content": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "keywords": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "productIds": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "visibility": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "queueId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "previousId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reviewedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "FinanceDimensionValue": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "dimension": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "code": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "active": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "FinanceCollectionActivity": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "documentId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "promisedAmount": {
      "type": "BigInt",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "followUpAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "actorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "document": {
      "type": "FinanceDocument",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "PlanInput": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "planId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sourceModule": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sourceType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sourceId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "label": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "metricKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "periodKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "value": {
      "type": "Decimal",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "probability": {
      "type": "Decimal",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "probabilityOverride": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "unitPriceMinor": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "note": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "included": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "revision": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "plan": {
      "type": "BusinessPlan",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "SopCycle": {
    "inputRevision": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "startsOn": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "endsOn": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "currency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "companyVisible": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sourcePlanIds": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "settings": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "workflow": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "risks": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "actions": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "decisions": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "revision": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "versions": {
      "type": "SopVersion",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "SopVersion": {
    "forecasts": {
      "type": "ManufacturingDemandForecast",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "cycleId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sourceRevision": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "basedOnId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "payload": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "requiredCapabilities": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "requiredModules": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "createdByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "approvedByUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "approvedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "publishedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "publicationId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "cycle": {
      "type": "SopCycle",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "HrVacancy": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "department": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "location": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "employmentType": {
      "type": "EmploymentType",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "description": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "targetStartOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "applications": {
      "type": "HrApplication",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "HrApplication": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "vacancyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "email": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "phone": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "source": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "evidenceUrl": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "stage": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "interviewOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "vacancy": {
      "type": "HrVacancy",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "employee": {
      "type": "Employee",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "EmployeeTraining": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "employeeId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "category": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "provider": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "required": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "dueOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "completedOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "expiresOn": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "evidenceUrl": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "employee": {
      "type": "Employee",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "CompanyCleanupRun": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "actorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "companies": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "remainingFileKeys": {
      "type": "String",
      "list": true,
      "nullable": false,
      "relation": false
    },
    "removedFileCount": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MeetingEntry": {
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "meetingId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "body": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "dueAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "authorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "completedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "meeting": {
      "type": "Meeting",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "MicrosoftCalendarConnection": {
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "userId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "accessToken": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "refreshToken": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "expiresAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "calendarId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "calendarName": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "connectedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "lastSyncAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    }
  },
  "MeetingOAuthState": {
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "stateHash": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "userId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "verifier": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "expiresAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    }
  },
  "MaintenanceEquipment": {
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "code": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "serialNumber": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "location": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "manufacturer": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "model": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "criticality": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "serviceIntervalDays": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "nextServiceAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "workOrders": {
      "type": "MaintenanceWorkOrder",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "MaintenanceWorkOrder": {
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "equipmentId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "vehicleId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "priority": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reportedByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "assigneeUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "dueAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "startedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "completedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "downtimeStartedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "downtimeEndedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "findings": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "resolution": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "actualMinutes": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "equipment": {
      "type": "MaintenanceEquipment",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "vehicle": {
      "type": "FleetVehicle",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "parts": {
      "type": "MaintenancePart",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "MaintenancePart": {
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "workOrderId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "quantity": {
      "type": "Decimal",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "note": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "workOrder": {
      "type": "MaintenanceWorkOrder",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "FleetVehicle": {
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "registration": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "make": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "model": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "vin": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "fuelType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "driverUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "odometer": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "motDueAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "insuranceDueAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "serviceDueAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "logs": {
      "type": "FleetLog",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "workOrders": {
      "type": "MaintenanceWorkOrder",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "FleetLog": {
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "vehicleId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "occurredAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "odometer": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "quantity": {
      "type": "Decimal",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "costMinor": {
      "type": "Int",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "currency": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "result": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "notes": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "authorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "vehicle": {
      "type": "FleetVehicle",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "EngineeringRevision": {
    "lastEditorUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "productId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "revision": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reason": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "specification": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "authorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "reviewerUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "approvedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "releasedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "product": {
      "type": "Product",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "attachments": {
      "type": "EngineeringAttachment",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "EngineeringAttachment": {
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "revisionId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "storageKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "mime": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "size": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "sha256": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "authorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "revision": {
      "type": "EngineeringRevision",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "FieldServiceJob": {
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "partyId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "title": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "site": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "contactName": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "contactPhone": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "engineerUserId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "scheduledStart": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "scheduledEnd": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "timezone": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "status": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "instructions": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "findings": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "resolution": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "actualMinutes": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "completedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdByUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "party": {
      "type": "Party",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "entries": {
      "type": "FieldServiceEntry",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "FieldServiceEntry": {
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "jobId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "body": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "authorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "job": {
      "type": "FieldServiceJob",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "StudioDefinition": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "key": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "kind": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "name": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "revision": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "latestVersion": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "activeVersionId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "retiredAt": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdBy": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "draft": {
      "type": "StudioDraft",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "fieldBinding": {
      "type": "StudioFieldBinding",
      "list": false,
      "nullable": true,
      "relation": true
    },
    "versions": {
      "type": "StudioDefinitionVersion",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "activeVersion": {
      "type": "StudioDefinitionVersion",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "StudioDraft": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "definitionId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "revision": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "baseVersionId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "editorUserId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "payload": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "validation": {
      "type": "Json",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "definition": {
      "type": "StudioDefinition",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "baseVersion": {
      "type": "StudioDefinitionVersion",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "StudioDefinitionVersion": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "definitionId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "semanticVersion": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "schemaVersion": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "payload": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "compiledPlan": {
      "type": "Json",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "checksum": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdBy": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "publishedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "definition": {
      "type": "StudioDefinition",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "activeFor": {
      "type": "StudioDefinition",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "draftBases": {
      "type": "StudioDraft",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "dependencies": {
      "type": "StudioDependency",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "fieldOrigins": {
      "type": "StudioFieldBinding",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "generationOrigins": {
      "type": "StudioFieldGeneration",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "fieldValues": {
      "type": "StudioFieldValue",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "StudioDependency": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "definitionId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "versionId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "ownerModuleId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "contractId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "contractVersion": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "schemaHash": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "contractHash": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "version": {
      "type": "StudioDefinitionVersion",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "StudioFieldBinding": {
    "definitionId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "fieldKey": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "originVersionId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "initialGenerationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "definition": {
      "type": "StudioDefinition",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "originVersion": {
      "type": "StudioDefinitionVersion",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "initialGeneration": {
      "type": "StudioFieldGeneration",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "generations": {
      "type": "StudioFieldGeneration",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "StudioFieldGeneration": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "definitionId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "valueType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "originVersionId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "binding": {
      "type": "StudioFieldBinding",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "originVersion": {
      "type": "StudioDefinitionVersion",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "initialFor": {
      "type": "StudioFieldBinding",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "slots": {
      "type": "StudioFieldSlot",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "values": {
      "type": "StudioFieldValue",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "StudioExtensionRecord": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "recordId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "revision": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "updatedAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "slots": {
      "type": "StudioFieldSlot",
      "list": true,
      "nullable": false,
      "relation": true
    }
  },
  "StudioFieldSlot": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "entityId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "extensionId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "definitionId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "generationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "revision": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "activeValueId": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "uniqueToken": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "extension": {
      "type": "StudioExtensionRecord",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "generation": {
      "type": "StudioFieldGeneration",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "values": {
      "type": "StudioFieldValue",
      "list": true,
      "nullable": false,
      "relation": true
    },
    "activeValue": {
      "type": "StudioFieldValue",
      "list": false,
      "nullable": true,
      "relation": true
    }
  },
  "StudioFieldValue": {
    "id": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "organisationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "definitionId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "generationId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "slotId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "versionId": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "revision": {
      "type": "Int",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "valueType": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "isNull": {
      "type": "Boolean",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "textValue": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "integerValue": {
      "type": "BigInt",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "decimalValue": {
      "type": "Decimal",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "currency": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "booleanValue": {
      "type": "Boolean",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "dateValue": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "instantValue": {
      "type": "DateTime",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "jsonValue": {
      "type": "Json",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "referenceValue": {
      "type": "String",
      "list": false,
      "nullable": true,
      "relation": false
    },
    "fingerprint": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdBy": {
      "type": "String",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "createdAt": {
      "type": "DateTime",
      "list": false,
      "nullable": false,
      "relation": false
    },
    "slot": {
      "type": "StudioFieldSlot",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "generation": {
      "type": "StudioFieldGeneration",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "schemaVersion": {
      "type": "StudioDefinitionVersion",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "activeFor": {
      "type": "StudioFieldSlot",
      "list": true,
      "nullable": false,
      "relation": true
    }
  }
} as const;
