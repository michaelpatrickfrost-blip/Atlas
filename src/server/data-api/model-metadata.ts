// Generated from the application schema.
export const MODEL_FIELDS = {
  "Organisation": {
    "salesPolicy": {
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
    "chatMessages": {
      "type": "ChatMessage",
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
    "warehouses": {
      "type": "Warehouse",
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
    "opportunities": {
      "type": "Opportunity",
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
    "priceLists": {
      "type": "PriceList",
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
    "id": {
      "type": "String",
      "list": false,
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
    "id": {
      "type": "String",
      "list": false,
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
  "Product": {
    "id": {
      "type": "String",
      "list": false,
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
    "quoteLines": {
      "type": "QuoteLine",
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
    "quotes": {
      "type": "Quote",
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
    "opportunityId": {
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
    "quote": {
      "type": "Quote",
      "list": false,
      "nullable": false,
      "relation": true
    }
  },
  "SalesOrder": {
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
    "id": {
      "type": "String",
      "list": false,
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
    "party": {
      "type": "Party",
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
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
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
    "organisation": {
      "type": "Organisation",
      "list": false,
      "nullable": false,
      "relation": true
    },
    "updates": {
      "type": "KpiUpdate",
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
    "title": {
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
    }
  },
  "Meeting": {
    "id": {
      "type": "String",
      "list": false,
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
    }
  },
  "PlatformAdministrator": {
    "userId": {
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
  }
} as const;
