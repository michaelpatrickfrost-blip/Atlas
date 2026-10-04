# ATLAS LOGISTICS

## Warehouse Management, Picking, Packing, Distribution, Transport, Shipping, Export, Returns and Stock Control

# 1. OBJECTIVE

Build Logistics as a major operational domain within Atlas.

This must not be a simple:

```text
Sales Order
→ Pick
→ Delivery Note
```

workflow.

Atlas Logistics must be capable of controlling the complete physical movement of goods from the moment stock enters a warehouse until it leaves the organisation and is delivered to its final destination.

It must support:

- warehouse topology
- locations and bins
- stock positions
- pallets and handling units
- stock counting
- cycle counts
- inventory adjustments
- internal stock movements
- replenishment
- allocation
- reservation
- picking
- wave management
- batch picking
- cluster picking
- zone picking
- full-pallet picking
- packing
- cartonisation
- palletisation
- staging
- loading
- dock management
- yard management
- shipments
- loads
- distribution
- carrier management
- own-fleet operations
- parcel carriers
- road freight
- sea freight
- air freight
- export
- customs information
- delivery documentation
- proof of delivery
- tracking
- returns
- failed deliveries
- stock returns
- reverse logistics
- freight costing
- carrier invoice reconciliation
- warehouse performance
- logistics analytics

The architecture must support a small warehouse using paperless handheld picking just as comfortably as a complex multi-site distribution business.

---

# 2. LOGISTICS DOMAIN STRUCTURE

Create the parent domain:

```text
LOGISTICS & WAREHOUSE
│
├── Logistics Control Tower
│
├── Warehouses
│
├── Locations
│
├── Stock Control
│
├── Stock Counts
│
├── Reservations & Allocation
│
├── Replenishment
│
├── Warehouse Work
│
├── Picking
│
├── Waves
│
├── Packing
│
├── Handling Units
│
├── Staging
│
├── Shipments
│
├── Loads
│
├── Transport Planning
│
├── Distribution
│
├── Fleet
│
├── Carriers
│
├── Yard & Docks
│
├── Export & Customs
│
├── Documents & Labels
│
├── Tracking & POD
│
├── Returns
│
├── Freight Costs
└── Logistics Analytics
```

These are linked modules.

They must not become disconnected applications.

---

# 3. CRITICAL OBJECT SEPARATION

Codex must understand these objects before implementing anything.

They are not interchangeable.

```text
SALES ORDER
Commercial promise to customer

FULFILMENT ORDER
Operational requirement to fulfil the sales order

SHIPMENT
Goods intended to travel together to a destination

WAREHOUSE WORK
Physical tasks required inside the warehouse

HANDLING UNIT
Physical pallet, carton, crate or other logistics unit

LOAD
Goods assigned to a vehicle, trailer, container or movement

TRIP
Actual transport journey

STOP
One collection/delivery point on the trip

DELIVERY
Execution of goods arriving at recipient

POD
Evidence confirming delivery
```

One sales order can create:

```text
multiple fulfilments
multiple shipments
multiple loads
multiple deliveries
```

One shipment may contain:

```text
multiple sales orders
```

where consolidation rules permit.

One load may contain:

```text
multiple shipments
multiple customers
multiple delivery stops
```

This separation is non-negotiable.

---

# 4. CORE PROCESS

Typical outbound flow:

```text
SALES ORDER
      ↓
FULFILMENT REQUIREMENT
      ↓
STOCK ALLOCATION
      ↓
SHIPMENT PLANNING
      ↓
WAREHOUSE RELEASE
      ↓
WAVE
      ↓
WAREHOUSE WORK
      ↓
PICK
      ↓
CONSOLIDATE
      ↓
PACK
      ↓
STAGE
      ↓
LOAD
      ↓
SHIP CONFIRM
      ↓
DISPATCH
      ↓
IN TRANSIT
      ↓
DELIVER
      ↓
POD
      ↓
CLOSE
```

But this workflow must be configurable.

For example:

```text
FULL PALLET CUSTOMER
Pick → Load
```

may not require packing.

Parcel operation:

```text
Pick → Pack → Label → Manifest → Dispatch
```

Export:

```text
Pick
→ Pack
→ Export Documentation
→ Customs Ready
→ Load
→ Dispatch
```

Atlas must not hard-code a single outbound workflow.

---

# 5. WAREHOUSE TOPOLOGY

Warehouse structure must reflect the physical operation.

Use:

```text
Legal Entity
    ↓
Site
    ↓
Warehouse
    ↓
Building
    ↓
Zone
    ↓
Aisle
    ↓
Bay
    ↓
Level
    ↓
Location / Bin
```

Not every organisation requires every layer.

Allow layers to be omitted.

---

# 6. LOCATION MASTER

Create:

```text
warehouse_location
```

Core fields:

```text
id

warehouse_id

location_code
barcode

name

parent_location_id

location_type_id
location_profile_id

zone_id
aisle
bay
level
position

pick_sequence

active

capacity_weight
capacity_volume
capacity_units
capacity_pallets

height
width
depth

temperature_profile

hazard_profile

allow_mixed_products
allow_mixed_batches
allow_mixed_statuses

license_plate_controlled

allow_cycle_count

fixed_product_id

replenishment_enabled

pick_enabled
putaway_enabled

created_at
updated_at
```

---

# 7. LOCATION TYPES

Locations must have business meaning.

Examples:

```text
RECEIVING
INBOUND_STAGING

QUALITY_HOLD
QUARANTINE

BULK_STORAGE
RESERVE_STORAGE

FORWARD_PICK

PALLET_RACK
SHELF
FLOOR

PRODUCTION_SUPPLY

RETURNS

DAMAGED
REWORK

PACKING
OUTBOUND_STAGING

DOCK

TRAILER

IN_TRANSIT

SCRAP
```

A location type controls allowed behaviour.

---

# 8. LOCATION PROFILES

Rather than configure every bin independently:

```text
location_profile
```

Example:

```text
Profile:
PALLET-RACK

Licence plate controlled:
Yes

Mixed products:
No

Mixed batches:
No

Cycle counting:
Yes

Maximum pallets:
1

Picking:
Yes

Putaway:
Yes
```

Multiple locations inherit the same profile.

Individual overrides require permission.

---

# 9. PHYSICAL CAPACITY

Location capacity should support several models.

Examples:

```text
Maximum weight
Maximum volume
Maximum pallet spaces
Maximum cases
Maximum units
Maximum handling units
```

Capacity checks occur during:

```text
putaway
replenishment
relocation
return
```

Do not simply allow stock to be placed anywhere.

---

# 10. LOCATION MAP

Atlas should provide a visual warehouse map.

Example:

```text
WAREHOUSE 1

Zone A
A01
A02
A03

Zone B
B01
B02

Bulk
BULK-01
BULK-02

Packing
PACK-01
PACK-02

Despatch
DOOR-01
DOOR-02
```

Future capability can include graphical layouts.

Initially the location hierarchy and walking/pick sequence are sufficient.

---

# 11. LOCATION STATUS

Locations may be:

```text
AVAILABLE
BLOCKED
COUNTING
MAINTENANCE
DAMAGED
FULL
TEMPORARILY_CLOSED
```

Blocked locations should not automatically be selected for new warehouse work.

---

# 12. STOCK POSITION

Atlas must be able to answer:

> Exactly where is Product X?

Not merely:

> Warehouse 1.

Stock position dimensions may include:

```text
Legal entity
Site
Warehouse
Location
Handling unit
Product
Variant
Batch
Serial
Inventory status
Owner
Quality status
UOM
```

Example:

```text
Product:
SP1

Warehouse:
DON-01

Location:
A03-B04-L02

Pallet:
LP000828

Batch:
B240922

Status:
AVAILABLE

Quantity:
480
```

---

# 13. STOCK BY LOCATION SCREEN

Opening a location should show:

```text
A03-B04-L02

Type:
PALLET RACK

Capacity:
2 pallet spaces

Used:
1

Last counted:
28 September

Next count:
28 October

STOCK

LP000828
SP1
Batch B240922
480 EA
Available
```

Also show:

```text
Incoming work
Outgoing work
Reservations
Movement history
Count history
```

---

# 14. PRODUCT STOCK VIEW

Opening Product SP1:

```text
TOTAL ON HAND       12,800
AVAILABLE             8,600
RESERVED              2,400
QUALITY HOLD            600
PICKED                  800
IN TRANSIT              400
```

Then:

```text
Warehouse       Location       Pallet      Qty

WH1             A01-B03        LP01822      480
WH1             A01-B04        LP01893      480
WH1             BULK-07        LP01991      960
WH2             C02-B04        LP02931      480
```

---

# 15. HANDLING UNITS

Atlas needs a proper Handling Unit model.

A handling unit represents a physical logistics unit.

Examples:

```text
Pallet
Carton
Box
Crate
Stillages
IBC
Roll cage
Container
```

Create:

```text
handling_unit
handling_unit_content
handling_unit_type
handling_unit_relationship
```

---

# 16. NESTED HANDLING UNITS

Allow:

```text
PALLET LP1000
│
├── CARTON C001
├── CARTON C002
└── CARTON C003
```

and:

```text
SHIPPING CONTAINER CONT001
│
├── PALLET LP1000
├── PALLET LP1001
└── PALLET LP1002
```

Moving the parent handling unit moves all contained inventory.

SAP similarly models handling units as uniquely identifiable physical logistics units that can contain products and can themselves be nested.

---

# 17. HANDLING UNIT INFORMATION

Record:

```text
identifier
barcode

handling_unit_type

length
width
height

tare_weight
gross_weight
net_weight

volume

current_location

status

owner

seal_number

parent_handling_unit_id
```

---

# 18. HANDLING UNIT STATUS

Examples:

```text
EMPTY

OPEN

PICKING

PACKED

SEALED

STAGED

LOADED

IN_TRANSIT

DELIVERED

RETURNED

BLOCKED
```

---

# 19. STOCK COUNTING

Stock accuracy is a first-class warehouse capability.

Create module:

# Stock Counts

Support:

```text
Annual Physical Inventory

Cycle Count

Spot Count

Location Count

Product Count

Partial Location Count

Batch Count

Licence Plate Count

Recount
```

---

# 20. FULL PHYSICAL INVENTORY

Atlas must support complete warehouse stocktakes.

Process:

```text
CREATE COUNT
↓
DEFINE SCOPE
↓
GENERATE COUNT WORK
↓
FREEZE / CONTROL MOVEMENT
↓
COUNT
↓
RECOUNT EXCEPTIONS
↓
APPROVE VARIANCES
↓
POST ADJUSTMENTS
↓
CLOSE COUNT
```

---

# 21. COUNT SCOPE

Count can include:

```text
Entire company
Site
Warehouse
Zone
Aisle
Location range
Product family
Product
Batch
Inventory status
```

---

# 22. CYCLE COUNTING

Cycle counts continuously verify smaller parts of inventory.

Trigger by:

```text
Fixed frequency

ABC classification

Product value

Movement frequency

Location frequency

Quantity threshold

Inventory variance history

Previous count failure

Exception

Manual request
```

Dynamics supports cycle count plans, threshold-triggered counts, system-directed counting and partial-location counting. Atlas should incorporate these concepts into a configurable work engine.

---

# 23. ABC COUNT POLICY

Example:

```text
A ITEMS
Count every 14 days

B ITEMS
Count every 60 days

C ITEMS
Count every 180 days
```

Or:

```text
HIGH VALUE LOCATIONS
30 days

NORMAL
90 days
```

Allow policies by:

```text
product
category
warehouse
location profile
ABC class
value
risk
```

---

# 24. BLIND COUNTS

Support:

```text
Blind Count
```

Worker sees:

```text
Location
Product
Batch
```

but not expected quantity.

This reduces confirmation bias.

---

# 25. DOUBLE-BLIND COUNT

For high-risk inventory:

```text
Employee A counts

Employee B recounts independently

System compares results
```

Only then does variance approval occur.

---

# 26. COUNTING FROM MOBILE DEVICE

Example:

```text
COUNT LOCATION

Scan location:
[A03-B04-L02]

Scan pallet:
[LP000828]

Scan product:
[SP1]

Quantity:
[478]
```

Then:

```text
Location complete?
```

---

# 27. UNEXPECTED STOCK

If employee discovers:

```text
Product X

in a location where Atlas expects none
```

they must be able to report it.

Create an:

```text
UNEXPECTED_STOCK
```

count line.

Do not force the operator to hide the discovery.

---

# 28. MISSING STOCK

Likewise:

```text
Expected 480
Counted 0
```

must become a count variance.

Not an automatic deletion.

---

# 29. COUNT DIFFERENCE

Store:

```text
expected_quantity
counted_quantity
difference_quantity

unit_cost
difference_value

reason

counted_by
counted_at
```

---

# 30. RECOUNT RULES

Example:

```text
Difference quantity > 5

OR

Difference value > £500

→ mandatory recount
```

Another:

```text
Difference > £5,000

→ manager approval
```

---

# 31. VARIANCE APPROVAL

Workflow:

```text
COUNTED
↓
VARIANCE
↓
RECOUNT
↓
APPROVAL
↓
POST
```

Approval rules can depend upon:

```text
quantity
value
product class
warehouse
reason
```

---

# 32. COUNT FREEZE POLICY

Atlas must support different approaches.

### Hard Freeze

No inventory transactions inside scope.

### Soft Freeze

Transactions allowed but timestamped and reconciled against count snapshot.

### Location Freeze

Only counted locations restricted.

### No Freeze

Appropriate for frequent cycle counting where warehouse continues operating.

Policy must be configured by count type.

---

# 33. COUNT SNAPSHOT

When count starts:

```text
inventory_count_snapshot
```

records expected position.

This prevents later transactions making the count impossible to reconcile.

---

# 34. COUNT ADJUSTMENT

Approved difference creates normal immutable inventory transactions:

```text
COUNT_GAIN
COUNT_LOSS
```

Never alter the inventory ledger directly.

---

# 35. FINANCIAL COUNT IMPACT

Inventory variance flows into costing and Finance.

Example:

```text
COUNT LOSS
↓
Inventory value decreases
↓
Inventory variance accounting event
↓
Finance posting rules
```

Account selection is configurable.

No account numbers are hard-coded into WMS.

---

# 36. COUNT HISTORY

Product screen:

```text
Stock Accuracy

Last counted:
29 September

Last difference:
-2

12 month count accuracy:
99.3%
```

Location:

```text
Last 5 counts

30 Sep      100.0%
31 Aug       99.6%
31 Jul      100.0%
```

---

# 37. STOCK ACCURACY KPI

Measure:

```text
COUNT ACCURACY %
```

by:

```text
Warehouse
Zone
Product
Product family
Operator
Location
```

Also monitor:

```text
Inventory adjustment value

Repeated variance locations

Repeated variance products
```

---

# 38. INTERNAL STOCK MOVEMENTS

Support:

```text
Location transfer

Warehouse transfer

Pallet movement

Bin relocation

Stock consolidation

Stock split

Status transfer

Quality movement

Replenishment

Production staging

Return to stock
```

---

# 39. MOVEMENT WORKFLOW

Example:

```text
MOVE PALLET

From:
A01-B01

Pallet:
LP1011

To:
BULK-05

[CONFIRM]
```

Inventory ledger records the move.

Handling unit current location updates.

Audit event created.

---

# 40. PUTAWAY

Inbound inventory should not simply be placed wherever the worker chooses.

Create:

```text
PutawayEngine
```

Possible rules:

```text
Product fixed location

Product family zone

Package type

Hazard class

Temperature

Weight

Dimensions

Remaining capacity

Velocity

Nearest available location

Same product consolidation

Empty location preference
```

Odoo similarly supports product, category and package-specific putaway rules and location capacity concepts.

---

# 41. PUTAWAY PRIORITY

Example:

```text
1. Fixed product location
2. Same batch location
3. Same product location
4. Product category zone
5. General storage
```

Rules should be configurable.

---

# 42. STOCK REMOVAL STRATEGIES

Picking must support:

```text
FIFO

FEFO

LIFO

Closest location

Least packages

Oldest batch

Specific batch

Specific licence plate

Full pallet

Partial pallet

Customer-owned stock first
```

The applicable strategy may come from:

```text
product
product category
customer
warehouse
location
sales order
```

---

# 43. RESERVATION VS ALLOCATION

Keep these concepts explicit.

## Reservation

Stock is committed to demand.

## Allocation

Specific physical stock is selected.

Example:

```text
Sales Order:
480 SP1

RESERVED:
480 from Warehouse 1

ALLOCATED:
LP00921
A03-B01
Batch B8291
480
```

The order can be reserved before Atlas knows exactly which pallet will be picked.

---

# 44. RESERVATION STATES

```text
NONE
SOFT_RESERVED
FIRM_RESERVED
ALLOCATED
PICKED
CONSUMED
RELEASED
```

---

# 45. RESERVATION POLICY

Possible rules:

```text
At sales order confirmation

At requested ship date minus X days

Manually

During wave release

When stock becomes available
```

---

# 46. SHORTAGE HANDLING

If:

```text
Demand:
500

Available:
420
```

policy may:

```text
Reserve 420 and backorder 80

Wait for full quantity

Split shipment

Source remaining quantity elsewhere

Trigger transfer

Trigger production

Escalate
```

Do not assume one behaviour.

---

# 47. REPLENISHMENT

Forward picking locations need replenishment from reserve storage.

Support:

```text
MIN/MAX

DEMAND-BASED

WAVE-BASED

TOP-UP

EMERGENCY
```

---

# 48. MIN/MAX REPLENISHMENT

Example:

```text
Pick Face A01

Minimum:
100

Maximum:
500

Current:
80

Suggested replenish:
420
```

---

# 49. DEMAND REPLENISHMENT

Wave requires:

```text
600 units
```

Pick face has:

```text
100
```

Reserve has:

```text
960
```

Atlas creates replenishment work before or alongside picking work.

---

# 50. ORDER RELEASE TO LOGISTICS

A confirmed Sales Order does not automatically mean warehouse staff should pick it.

Create:

```text
fulfilment_order
```

Release rules might consider:

```text
credit status
stock availability
requested date
payment
customer hold
export status
production completion
shipping method
route
minimum order rules
manual hold
```

---

# 51. FULFILMENT STATUS

```text
PENDING

AWAITING_STOCK

AWAITING_CREDIT

AWAITING_EXPORT_DATA

READY

RELEASED

PICKING

PICKED

PACKING

PACKED

STAGED

LOADED

DISPATCHED

PARTIALLY_DISPATCHED

DELIVERED

CLOSED

CANCELLED
```

Status must derive from underlying fulfilment execution.

Do not let users manually type a status.

---

# 52. FULFILMENT LINE STATUS

Lines require independent status.

Example:

```text
Order contains:

Product A      PACKED
Product B      PICKING
Product C      BACKORDERED
```

The header should show:

```text
PARTIAL
```

---

# 53. SHIPMENT CREATION

Shipment groups inventory intended to travel together.

Create:

```text
shipment
shipment_line
```

Possible sources:

```text
Sales order
Transfer order
Return to supplier
Project
Service order
Manual shipment
```

---

# 54. SHIPMENT CONSOLIDATION

Atlas may combine compatible demand.

Example:

Customer ABC has:

```text
SO100
SO101
SO103
```

same:

```text
ship-to address
date
carrier
service
warehouse
```

Atlas can propose:

```text
SHIPMENT SH00088
```

containing all three.

---

# 55. CONSOLIDATION RULES

Configurable keys:

```text
Customer
Ship-to
Warehouse
Date
Route
Carrier
Service
Incoterm
Currency
Export regime
Temperature class
Hazard compatibility
Customer PO
```

Certain customers may prohibit consolidation.

---

# 56. SHIPMENT SPLITTING

Atlas must also split demand.

Reasons:

```text
insufficient stock
multiple warehouses
weight
volume
different delivery dates
different carriers
different export requirements
hazard segregation
customer request
```

---

# 57. SHIPMENT STATUS

```text
PLANNING

READY_TO_RELEASE

RELEASED

PICKING

PARTIALLY_PICKED

PICKED

PACKING

PARTIALLY_PACKED

PACKED

STAGED

PARTIALLY_LOADED

LOADED

DISPATCHED

IN_TRANSIT

DELIVERED

POD_RECEIVED

CLOSED

EXCEPTION
```

---

# 58. WAVE MANAGEMENT

A wave groups warehouse demand for coordinated execution.

Example:

```text
WAVE-20261003-AM
```

could include:

```text
47 shipments
312 lines
18 tonnes
26 pallets
```

Dynamics uses waves to combine multiple outbound requirements before generating picking work. Atlas should implement a more user-friendly equivalent.

---

# 59. AUTOMATIC WAVE RULES

Wave by:

```text
Cut-off time

Carrier

Route

Dock

Departure time

Customer

Priority

Delivery date

Product family

Warehouse zone

Order type

Temperature class
```

---

# 60. WAVE THRESHOLDS

Process automatically when:

```text
100 orders

OR

24 pallets

OR

18 tonnes

OR

14:00 cut-off
```

---

# 61. WAVE WORKBENCH

Show:

```text
WAVE 01829

Orders             42
Shipments          39
Lines             284

Units           12,884
Pallets              26
Weight           18.2 t

Ready              96%
Shortages             3
```

Then:

```text
[Release]
[Recalculate]
[Resolve shortages]
```

---

# 62. PICKING METHODS

Atlas must support different warehouse operations.

## Single Order Picking

One picker, one order.

## Batch Picking

One picker collects goods for several orders, then sorts later.

## Cluster Picking

One picker collects several orders while sorting directly into dedicated containers.

## Wave Picking

Picking is coordinated across many shipments.

## Zone Picking

Different workers pick different warehouse zones.

## Full Pallet Picking

Entire handling units are moved.

## Case Picking

Cases/cartons.

## Piece Picking

Individual units.

---

# 63. PICKING STRATEGY SELECTION

Warehouse policy can determine method automatically.

Example:

```text
Full pallet quantity
→ Full pallet

<10 small order lines
→ Cluster

Parcel carrier
→ Batch

Large export order
→ Order-specific
```

Allow supervisor override.

---

# 64. WAREHOUSE WORK ENGINE

Create:

```text
warehouse_work
warehouse_work_line
warehouse_work_dependency
```

Work types:

```text
PICK
PUT
MOVE
REPLENISH
PACK
COUNT
LOAD
UNLOAD
STAGE
QUALITY_MOVE
```

---

# 65. WAREHOUSE TASK

Example:

```text
WORK 88129

Task 10:
Pick 480 SP1
From A03-B04
LP00192

Task 20:
Put
STAGE-DOOR-04
```

---

# 66. TASK DEPENDENCIES

Example:

```text
Replenishment
↓
Pick
↓
Pack
↓
Stage
↓
Load
```

The work engine must understand dependencies.

---

# 67. SYSTEM-DIRECTED WORK

Warehouse operator opens handheld:

```text
NEXT TASK
```

Atlas assigns the best permitted work based upon:

```text
location
skills
equipment
priority
zone
task age
travel distance
wave
```

---

# 68. USER-DIRECTED WORK

Certain operations permit:

```text
Select task
```

Examples:

```text
supervisor
special equipment
urgent order
manual exception
```

---

# 69. MOBILE WAREHOUSE UI

Mobile experience should be extremely focused.

Example:

```text
PICK

Location
A03-B04

Scan location
[____________]

Product
SP1

Qty
480

Pallet
LP00122
```

Large controls.

Minimal text.

Barcode-first.

---

# 70. PICK CONFIRMATION

Support:

```text
Scan location

Scan product

Scan batch

Scan pallet

Enter quantity
```

Required scans depend upon configuration.

---

# 71. PICK SHORT

Operator attempts:

```text
Expected:
480

Found:
460
```

Select:

```text
SHORT PICK
```

Reason:

```text
Stock missing
Damaged
Wrong stock
Unable to access
Count discrepancy
```

---

# 72. SHORT PICK RESPONSE

Atlas may:

```text
allocate another location

generate replenishment

create cycle count

short shipment

backorder quantity

escalate
```

depending upon policy.

---

# 73. PICK EXCEPTION

Other exceptions:

```text
Wrong product

Wrong batch

Damaged pallet

Location blocked

Pallet missing

No access

Forklift required

Stock quality hold
```

---

# 74. PICK SEQUENCE

Optimise task sequence using:

```text
pick sequence
zone
travel distance
priority
equipment
```

Future optimisation can use actual warehouse coordinates.

Initial implementation can use ordered location sequences.

---

# 75. PICK CART / TROLLEY

Cluster operations should support:

```text
Cart C029
│
├── Tote A → Order 100
├── Tote B → Order 101
├── Tote C → Order 102
└── Tote D → Order 103
```

The operator is told exactly which tote receives each item.

---

# 76. PICKED STOCK

Picked stock remains inventory.

Its status/location changes to something such as:

```text
PICKED
```

or:

```text
PACKING_LOCATION
```

Do not remove inventory from the ledger simply because it has been picked.

Goods leave company stock according to the configured goods issue/dispatch event.

---

# 77. PACKING MODULE

Packing must be a proper operational application.

Create:

```text
packing_session
packing_container
packing_container_line
```

---

# 78. PACKING STATION

Screen:

```text
PACKING STATION 04

Scan:
Shipment / Order / Pallet
```

After scan:

```text
SHIPMENT SH00192

Customer:
ABC Ltd

Picked:
8 items

Packed:
5

Remaining:
3
```

---

# 79. PACK VALIDATION

Packing operator verifies:

```text
Product
Quantity
Batch
Serial
```

Incorrect product should be rejected.

---

# 80. PACKAGING MATERIAL

Packaging materials can themselves be inventory items.

Examples:

```text
Carton
Pallet
Film
Strap
Crate
Edge protector
```

Consumption can feed cost.

---

# 81. PACKAGE TYPES

Define:

```text
length
width
height

empty weight

maximum weight

maximum volume

carrier compatibility

stackability
```

---

# 82. CARTONISATION ENGINE

Atlas can recommend:

```text
2 × Box Type A

1 × Box Type C
```

based upon:

```text
product dimensions
weight
quantity
package capacity
packing rules
hazard restrictions
```

Recommendation can be overridden.

---

# 83. PACKING A PALLET

Example:

```text
PALLET LP002882

12 × Product A
8 × Product B

Gross Weight:
782 kg

Dimensions:
1200 × 1000 × 1440 mm
```

---

# 84. PACKING STATUS

```text
OPEN

PACKING

COMPLETE

SEALED

REOPENED
```

Reopening a sealed package requires:

```text
reason
user
timestamp
```

---

# 85. PACKING EXCEPTION

Examples:

```text
Picked quantity missing

Unexpected product

Damaged item

Wrong batch

Package overweight

Oversized package

Serial mismatch
```

---

# 86. LABELS

Generate:

```text
Product label

Pallet label

Package label

Carrier label

Shipping label

SSCC-style logistics label where required

Hazard label

Customer-specific label
```

Labels should be template-driven.

---

# 87. STAGING

After packing or picking, goods are staged for loading.

Staging location can be determined by:

```text
Route
Load
Carrier
Door
Departure time
Customer
Shipment
```

---

# 88. STAGING BOARD

Example:

```text
DOOR 4
17:00 DEPARTURE

LOAD L0082

Pallets expected       18
Staged                  16
Missing                  2
```

Missing pallets clickable.

---

# 89. LOADING SEQUENCE

For multi-stop routes:

```text
Last delivery loaded first

First delivery loaded last
```

Atlas should calculate suggested loading sequence.

Allow override.

---

# 90. LOAD

A Load is the physical transport capacity.

Create:

```text
load
load_line
load_handling_unit
```

Load might represent:

```text
Rigid truck

Articulated trailer

Van

Shipping container

Airfreight ULD

Carrier collection
```

---

# 91. LOAD CAPACITY

Track:

```text
maximum weight
maximum volume
pallet spaces
length
special equipment
temperature
```

Current usage:

```text
Weight:
18.2 / 26 tonnes

Pallet spaces:
20 / 26

Volume:
72%
```

---

# 92. LOAD BUILDING WORKBENCH

Show available shipments on left.

Load in centre/right.

Example:

```text
AVAILABLE

SH102     4 pallets   2.1t
SH103     7 pallets   5.8t
SH104     2 pallets   1.1t


LOAD L0081

18 / 26 pallet spaces
17.4 / 26t
```

Drag shipment onto load.

Atlas validates constraints.

---

# 93. AUTOMATIC LOAD BUILDING

Recommend loads based upon:

```text
destination
route
carrier
capacity
weight
volume
delivery window
vehicle type
product restrictions
```

Do not force automated acceptance.

---

# 94. LOAD STATUS

```text
PLANNING

PLANNED

RELEASED

STAGING

LOADING

LOADED

DEPARTED

IN_TRANSIT

COMPLETED

CANCELLED
```

---

# 95. LOADING

Loader scans:

```text
Load
Door
Pallet
```

Atlas validates:

> LP00129 belongs to Load L0081.

Incorrect pallet:

> This pallet is assigned to Load L0092.

Do not permit silent loading mistakes.

---

# 96. LOAD COMPLETENESS

Before departure:

```text
Expected pallets: 24
Loaded: 24

Expected packages: 8
Loaded: 8

Weight:
24.1t

Documents:
Ready
```

Then:

```text
READY TO DISPATCH
```

---

# 97. PARTIAL LOADING

Support genuine partial loads.

Never force the whole shipment to look loaded if only some packages are physically on the vehicle.

Dynamics packing processes similarly support partial shipments of packed containers.

---

# 98. TRAILER / CONTAINER SEAL

Store:

```text
seal_number
sealed_by
sealed_at
```

Optional second seal / customs seal.

---

# 99. DOCK MANAGEMENT

Create:

```text
dock
dock_appointment
```

Manage:

```text
Inbound
Outbound
Cross-dock
Carrier collection
```

---

# 100. DOCK APPOINTMENTS

Fields:

```text
carrier
vehicle
trailer
driver
planned arrival
planned departure
load
door
appointment status
```

Statuses:

```text
BOOKED
ARRIVED
WAITING
AT_DOOR
LOADING
COMPLETE
DEPARTED
NO_SHOW
```

---

# 101. YARD MANAGEMENT

Advanced warehouses need yard positions.

Example:

```text
YARD
│
├── WAIT-01
├── WAIT-02
├── TRAILER-01
├── TRAILER-02
└── DOOR-01
```

Trailer can physically move:

```text
Gate
→ Yard
→ Door
→ Yard
→ Departed
```

---

# 102. DRIVER CHECK-IN

Record:

```text
driver
carrier
vehicle registration
trailer
booking
arrival
security checks
```

Optional self-service kiosk later.

---

# 103. TRANSPORT PLANNING

Create module:

# Transport

Objects:

```text
Carrier
Service
Vehicle
Trailer
Route
Trip
Stop
Load
Freight Rate
Shipment
```

---

# 104. TRANSPORT MODES

Support:

```text
Own Fleet

Parcel

Courier

Road Freight

Groupage

Full Load

Sea

Air

Rail

Customer Collection
```

---

# 105. OWN FLEET

Track:

```text
vehicle
registration
vehicle type
capacity
driver
availability
depot
```

Atlas should integrate with the wider asset/maintenance model where appropriate.

---

# 106. CARRIER MASTER

Fields:

```text
carrier_id

name

mode

services

contact

account_number

integration_type

tracking_url_template

insurance_details

active
```

---

# 107. CARRIER SERVICES

Example:

```text
Standard Road

Next Day

Timed AM

Parcel 24

International Economy

International Express
```

---

# 108. RATE SHOPPING

Where carrier integrations exist:

Atlas can request options:

```text
Carrier A      £82     Next day
Carrier B      £71     Two day
Carrier C      £109    Before noon
```

Selection may prioritise:

```text
cost
service
customer preference
delivery requirement
```

---

# 109. FREIGHT RATE ENGINE

Support internal rate cards too.

Rate calculation may use:

```text
zone
distance
weight
volume
pallet count
shipment value
service
fuel surcharge
accessorials
```

---

# 110. ACCESSORIAL CHARGES

Examples:

```text
Tail lift

Timed delivery

Residential

Remote area

Waiting time

Dangerous goods

Saturday delivery

Fuel surcharge
```

---

# 111. ROUTE

Route template:

```text
Yorkshire North
```

might define:

```text
days
depot
geographical area
carrier
vehicle type
cut-off
```

---

# 112. TRIP

A Trip is actual execution.

Example:

```text
TRIP 01882

Vehicle:
YK26 ABC

Driver:
Joe Smith

Departure:
06:00

Stops:
12
```

---

# 113. STOP

Each stop has:

```text
sequence

customer
address

delivery window

planned arrival
actual arrival

planned departure
actual departure

shipments

POD
```

---

# 114. ROUTE SEQUENCING

Atlas should initially support:

```text
manual sequence
postcode zone
route template
```

Advanced optimisation can later consider:

```text
distance
travel time
time windows
vehicle capacity
driver constraints
```

Keep optimisation as a service, not core transaction logic.

---

# 115. DISPATCH

Dispatch should be an explicit event.

Validation:

```text
All required goods loaded?

Mandatory documents created?

Export status valid?

Carrier assigned?

Vehicle assigned where required?

Seal captured where required?
```

Only then:

```text
CONFIRM DISPATCH
```

---

# 116. GOODS ISSUE

Depending upon accounting/inventory policy:

```text
Dispatch
```

may trigger:

```text
Inventory Goods Issue
```

This creates:

```text
inventory transaction
cost transaction
finance event
```

Do not directly mutate product stock.

---

# 117. IN TRANSIT

After dispatch:

```text
Stock ownership
```

and:

```text
inventory accounting
```

may depend upon commercial terms.

Therefore physical shipment status and financial ownership must remain separate concepts.

---

# 118. SHIPPING DOCUMENTS

Document templates may include:

```text
Delivery Note

Packing List

Despatch Note

Bill of Lading

CMR / road consignment document where applicable

Commercial Invoice

Pro Forma Invoice

Carrier Manifest

Certificate documents

Export packing list

Dangerous goods documentation

Customer-specific documents
```

Do not hard-code documentation by country.

Create document rules.

---

# 119. DOCUMENT ENGINE

Use:

```text
document_template
document_rule
generated_document
document_version
```

Trigger by:

```text
shipment
destination
carrier
customer
country
transport mode
export
product type
```

---

# 120. DOCUMENT SNAPSHOT

Generated shipping documentation must preserve the data at time of issue.

Do not regenerate historical documents using current customer/product data without clearly creating a new revision.

---

# 121. EXPORT MODULE

Create:

# Export & Customs

This should manage the data required to prepare and evidence international movements.

It does not have to become a customs broker.

It should provide accurate, controlled export data and integration points.

---

# 122. EXPORT MASTER DATA

Product export data may include:

```text
commodity / tariff classification

country of origin

preferential origin status

net weight

gross weight rules

customs description

dangerous goods classification

export control attributes

licence requirements

statistical UOM
```

---

# 123. CUSTOMER EXPORT DATA

Store where relevant:

```text
tax identifiers

EORI or equivalent customs identifier

import identifiers

ship-to country

consignee

notify party

customs agent

preferred Incoterm
```

---

# 124. INCOTERMS

Support configurable Incoterm master data.

Store:

```text
Incoterm code
named place
version
```

Example:

```text
DAP Paris
```

Never infer financial or customs ownership purely from a shipping status.

---

# 125. EXPORT SHIPMENT

Create:

```text
export_shipment
```

linked to Shipment.

Fields may include:

```text
exporter
consignee

country of dispatch
destination country

transport mode

customs office / broker reference

declaration reference

movement reference

export status

departure evidence status
```

---

# 126. EXPORT READINESS

Before export shipment releases:

```text
Commodity codes complete?

Origin complete?

Weights complete?

Values complete?

Consignee data complete?

Required licences present?

Commercial invoice ready?

Packing list ready?
```

Show:

```text
EXPORT READY

or

3 ITEMS REQUIRE ATTENTION
```

---

# 127. COMMERCIAL INVOICE

Generate from:

```text
shipment
sales order
customer
product customs data
```

Include configurable information such as:

```text
seller
buyer
ship-to
invoice reference
product description
quantity
value
currency
origin
commodity code
Incoterm
weights
freight where appropriate
```

UK export guidance requires invoices and relevant documentation to accompany goods, and requires exporters to classify goods correctly. Atlas should therefore treat this information as controlled master/transactional data rather than free text.

---

# 128. PACKING LIST

Packing List should show actual logistics structure.

Example:

```text
Container C001

Pallet LP001
    Product A 400
    Product B 120

Pallet LP002
    Product A 480
```

Not merely sales-order quantities.

---

# 129. EXPORT EVIDENCE

Store documentary evidence.

Examples:

```text
Customs departure confirmation

Carrier airway bill

Bill of lading

Consignment note

Customer receipt

Export declaration

Commercial transport evidence
```

UK VAT export rules make maintaining appropriate evidence particularly important where zero-rating is relied upon.

Atlas should therefore support:

```text
evidence_status

required_by_date

received_at

document_reference

attachment
```

---

# 130. EXPORT COMPLIANCE WORKFLOW

Example:

```text
SHIPMENT CREATED
↓
EXPORT DATA CHECK
↓
DOCUMENTATION READY
↓
CUSTOMS SUBMITTED
↓
CUSTOMS CLEARED
↓
DISPATCH
↓
DEPARTURE EVIDENCE RECEIVED
↓
EXPORT COMPLETE
```

Not every jurisdiction uses the same process.

Workflow must be configurable.

---

# 131. DANGEROUS GOODS

Products may carry logistics compliance attributes.

Potential fields:

```text
UN number

hazard class

packing group

transport description

limited quantity flag

temperature restrictions
```

Rules vary by transport mode and jurisdiction.

Atlas must therefore be configuration/integration driven rather than embedding one fixed legal interpretation.

---

# 132. SHIPPING HOLD

Shipment can be blocked for:

```text
Missing export information

Customs hold

Quality hold

Credit hold

Hazard documentation

Missing carrier booking

Missing customer documentation
```

Hold includes:

```text
reason
owner
created_at
resolution
```

---

# 133. CUSTOMER COLLECTION

Support:

```text
CUSTOMER COLLECTION
```

Process:

```text
Order ready
↓
Pick
↓
Pack / Stage
↓
Collection reference
↓
Vehicle / collector arrives
↓
Identity/reference check
↓
Load
↓
Collection confirmation
```

---

# 134. COLLECTION SLOT

Optional:

```text
collection appointment
```

Useful where customers or hauliers collect.

---

# 135. PROOF OF DELIVERY

Delivery completion should support:

```text
signature

recipient name

timestamp

GPS where available

photo

delivery notes

quantities delivered

damage

shortage

refusal
```

---

# 136. DELIVERY RESULT

Possible:

```text
DELIVERED_FULL

PARTIAL

REFUSED

FAILED

DAMAGED

LEFT_AT_LOCATION

RETURNING
```

---

# 137. PARTIAL DELIVERY

Example:

```text
Expected:
10 pallets

Delivered:
9

Refused:
1
```

Do not mark entire shipment “Delivered”.

Store actual delivery result by package/shipment line.

---

# 138. FAILED DELIVERY

Capture reason:

```text
Customer closed

Access denied

Incorrect address

Customer refused

Damaged in transit

Vehicle issue

Time window missed
```

Then workflow:

```text
Redeliver

Return to depot

Return to stock

Hold

Dispose
```

---

# 139. RETURNS MODULE

Reverse logistics needs the same rigour as outbound.

Create:

```text
return_authorisation
return_line
return_receipt
return_inspection
return_disposition
```

---

# 140. RETURN SOURCES

```text
Customer return

Delivery refusal

Failed delivery

Warranty return

Carrier damage

Internal warehouse return

Supplier return
```

---

# 141. RMA

Customer Service/Sales may create:

```text
RMA-001829
```

with:

```text
original order
invoice
product
quantity
reason
return deadline
```

---

# 142. RETURN REASONS

Examples:

```text
Damaged

Incorrect product

Too many delivered

Customer cancellation

Quality defect

Transport damage

Not required

Incorrect specification
```

Separate reason from disposition.

---

# 143. RETURN RECEIPT

Warehouse scans:

```text
RMA
Product
Quantity
Batch
Serial
```

Returned product should normally enter:

```text
RETURN_HOLD
```

not immediately:

```text
AVAILABLE
```

---

# 144. RETURN INSPECTION

Inspect:

```text
Condition

Packaging

Batch

Serial

Damage

Completeness

Quality
```

Capture photographs if appropriate.

---

# 145. RETURN DISPOSITION

Possible:

```text
RETURN_TO_AVAILABLE_STOCK

QUARANTINE

REWORK

REPAIR

REFURBISH

SCRAP

RETURN_TO_VENDOR

RETURN_TO_CUSTOMER

SECONDARY_SALE
```

Dynamics similarly separates return reason from disposition and supports inventory, scrap, replacement and return-to-customer outcomes.

---

# 146. RETURN FINANCIAL OUTCOME

Physical disposition does not equal financial outcome.

Separate:

```text
Physical disposition
```

from:

```text
Credit decision
Replacement
Charge
```

Example:

```text
Scrap item

but

No customer credit
```

must be possible.

---

# 147. RETURN TO STOCK

Only after inspection:

```text
Return inventory transaction
↓
Status AVAILABLE
↓
Putaway work
```

---

# 148. RETURN PUTAWAY

Atlas determines:

```text
RETURN HOLD
→ inspection
→ available
→ putaway
```

or:

```text
RETURN HOLD
→ scrap
```

---

# 149. SUPPLIER RETURNS

Warehouse should also process:

```text
Return to Vendor
```

Process:

```text
Identify stock
↓
Create RTV
↓
Pick
↓
Pack
↓
Dispatch
↓
Supplier credit / replacement
```

Links Procurement and Finance.

---

# 150. INTER-WAREHOUSE TRANSFER

Create:

```text
transfer_order
```

Workflow:

```text
Warehouse A
Pick
Pack
Load
Dispatch

→ In Transit →

Warehouse B
Receive
Quality if required
Putaway
```

---

# 151. IN-TRANSIT STOCK

A transfer should not make stock disappear between warehouses.

Use an:

```text
IN_TRANSIT
```

inventory dimension/location.

Example:

```text
WH1:
-480

IN TRANSIT:
+480

WH2 receipt:
IN TRANSIT -480
WH2 +480
```

---

# 152. CROSS-DOCKING

Support goods moving directly:

```text
Inbound
→ Outbound
```

without long-term storage.

Example:

```text
Supplier delivery
↓
Cross-dock stage
↓
Customer shipment
```

Planning engine identifies matching inbound and outbound demand.

---

# 153. PARCEL SHIPPING

Parcel flow:

```text
Pick
↓
Pack
↓
Weigh
↓
Carrier rate/service
↓
Generate label
↓
Close package
↓
Manifest
↓
Carrier collection
```

---

# 154. MANIFEST

Carrier manifest groups parcel/package handover.

Create:

```text
carrier_manifest
```

Contains:

```text
carrier
service
packages
tracking numbers
collection
```

---

# 155. TRACKING

Store tracking at:

```text
shipment
package
```

where carrier supports it.

Events:

```text
COLLECTED

IN_TRANSIT

AT_DEPOT

OUT_FOR_DELIVERY

DELIVERED

EXCEPTION
```

---

# 156. TRACKING WEBHOOKS

Carrier integrations should feed:

```text
shipment_tracking_event
```

Events must be idempotent.

Do not create duplicate delivery events from carrier retries.

---

# 157. CUSTOMER DELIVERY VISIBILITY

Sales and Customer Service should see:

```text
Order
Picked
Packed
Dispatched
In transit
Delivered
```

without entering Logistics.

---

# 158. FREIGHT COSTING

Transportation cost must feed Finance and customer profitability.

Track:

```text
planned freight

quoted freight

carrier freight

fuel surcharge

accessorial charges

actual freight
```

---

# 159. FREIGHT ALLOCATION

Allocate freight across:

```text
shipment

sales order

order line

product

customer

cost centre
```

Allocation methods:

```text
Weight

Volume

Pallets

Quantity

Value

Equal split
```

---

# 160. EXPECTED FREIGHT VS ACTUAL

Example:

```text
Estimated freight:
£1,250

Carrier invoice:
£1,410

Variance:
+£160
```

Require reason where tolerance exceeded.

Dynamics uses a comparable freight reconciliation process to match estimated freight bills against carrier invoices and resolve variances.

---

# 161. FREIGHT INVOICE RECONCILIATION

Workflow:

```text
LOAD CONFIRMED
↓
EXPECTED FREIGHT
↓
CARRIER INVOICE
↓
MATCH
↓
TOLERANCE CHECK
↓
APPROVE VARIANCE
↓
FINANCE
```

---

# 162. LOGISTICS COST PER ORDER

Analytics should expose:

```text
Revenue

Margin before logistics

Pick cost

Pack cost

Packaging

Freight

Delivery cost

Margin after logistics
```

This is extremely valuable.

---

# 163. WAREHOUSE LABOUR

Warehouse activities can record labour time.

Examples:

```text
Receiving

Putaway

Replenishment

Picking

Packing

Loading

Counting
```

This enables:

```text
cost per order
cost per line
cost per pallet
```

---

# 164. WORKER PERFORMANCE

Monitor carefully:

```text
tasks completed
lines picked
units picked
accuracy
travel
exceptions
```

Avoid simplistic punitive metrics.

Operational data should help improve process and staffing.

---

# 165. PICK ACCURACY

Measure:

```text
correct picks
÷
total picks
```

Analyse:

```text
warehouse
zone
product
process
```

---

# 166. ORDER FULFILMENT KPI

Measure timestamps:

```text
Order released
Picking started
Picking completed
Packing completed
Staged
Loaded
Dispatched
Delivered
```

This exposes exactly where fulfilment time is being lost.

---

# 167. LOGISTICS CONTROL TOWER

Main dashboard:

```text
TODAY

Orders ready            182
Picking                   42
Picked                    28
Packing                   19
Packed                    37
Staged                    22
Loaded                    18
Dispatched                96

AT RISK

Stock shortage             8
Late picking               6
Carrier issue              2
Export hold                1
Dock delay                 3
```

---

# 168. OUTBOUND BOARD

Visual columns:

```text
READY
PICKING
PICKED
PACKING
PACKED
STAGED
LOADED
DISPATCHED
```

Cards may represent:

```text
Shipment
Order
Load
```

user selects view.

---

# 169. IMPORTANT: DO NOT TURN IT INTO KANBAN-ONLY UI

The visual board is useful operationally.

But detailed list/grid views are also required for:

```text
hundreds of shipments
bulk actions
filtering
analysis
export
```

---

# 170. SHIPMENT WORKSPACE

Opening shipment:

```text
SH-008821

Customer:
ABC

Ship-to:
Leeds

Requested delivery:
5 Oct

Status:
PACKING

Weight:
4.8 t

Packages:
8

Carrier:
Atlas Fleet
```

Tabs:

```text
Overview

Lines

Allocation

Warehouse Work

Packages

Documents

Load

Tracking

Costs

Events
```

---

# 171. ORDER FULFILMENT VIEW

Sales Order should expose:

```text
FULFILMENT

Allocated       100%
Picked           80%
Packed           62%
Loaded            0%
Delivered          0%
```

---

# 172. STOCK AVAILABILITY VIEW

Warehouse planner should see:

```text
PRODUCT

On hand

Available

Reserved

Allocated

Picked

Packed

Staged

Loaded

In Transit

Quality Hold

Return Hold
```

This gives complete physical state.

---

# 173. WAREHOUSE STATUS VIEW

Example:

```text
Warehouse Doncaster

Capacity                 81%

Open pick work           184
Open replenishment        12
Open count work           18

Packing queue             27

Loads today               14
Loads ready                6

Stock accuracy          99.4%
```

---

# 174. DOOR BOARD

```text
DOOR 1
Loading
Load L881
Depart 16:00

DOOR 2
Available

DOOR 3
Carrier ABC
Waiting

DOOR 4
Load L889
Staged 22/24 pallets
```

---

# 175. EXCEPTION CENTRE

Central Logistics Exceptions:

```text
Short Pick

Missing Pallet

Count Variance

Packing Variance

Overweight Package

Late Wave

Late Load

Dock Delay

Carrier Delay

Export Hold

Failed Delivery

Missing POD

Freight Variance
```

---

# 176. EXCEPTION PRIORITY

Calculate based upon:

```text
customer priority

delivery date

financial value

operational impact

number of downstream orders
```

---

# 177. ROOT CAUSE

Do not simply show:

> Shipment late.

Show:

```text
Shipment SH882 late

because

Packing finished 2h late

because

Pick P0193 was short

because

Location A03 was missing 48 units
```

This matches the Atlas causal design philosophy.

---

# 178. FINANCE INTEGRATION

Logistics events feed accounting through the shared accounting event layer.

Potential events:

```text
GOODS_ISSUED

TRANSFER_DISPATCHED

TRANSFER_RECEIVED

STOCK_ADJUSTED

STOCK_SCRAPPED

CUSTOMER_RETURN_RECEIVED

FREIGHT_ACCRUED

FREIGHT_INVOICED

PACKAGING_CONSUMED
```

---

# 179. FINANCIAL POSTING

Warehouse code must never directly decide:

```text
DR account 1234
CR account 5678
```

Use:

```text
Logistics Event
↓
Accounting Event
↓
Finance Posting Rules
↓
Journal
```

---

# 180. COST OF GOODS SOLD

Dispatch/invoice policy determines when financial COGS is recognised.

This belongs in Finance configuration.

Logistics emits the operational event.

Finance determines accounting treatment.

---

# 181. AUDIT TRAIL

Every physical operation requires:

```text
user

device

date/time

source location

destination location

quantity

product

handling unit

reason where applicable

related work

related shipment
```

---

# 182. IMMUTABLE TRANSACTIONS

Posted:

```text
stock movement

shipment dispatch

count adjustment

goods receipt

return receipt
```

must never simply be edited.

Correction:

```text
REVERSE
+
CORRECT
```

---

# 183. BARCODE ARCHITECTURE

Scanner engine should recognise:

```text
Product

Location

Pallet

Package

Batch

Serial

Shipment

Load

Order
```

by identifier type.

Do not build separate scanning systems for every screen.

---

# 184. MOBILE DEVICE SESSION

Store:

```text
worker
device
warehouse
current zone
current work
equipment
```

This allows intelligent task assignment.

---

# 185. OFFLINE / POOR CONNECTION

Design the mobile layer so scanning operations can tolerate temporary network instability.

At minimum:

```text
clear retry
idempotent transactions
no duplicate movements
local task state protection
```

Do not silently assume perfect warehouse Wi-Fi.

---

# 186. IDEMPOTENCY

Critical mobile commands require idempotency keys.

A retry must not:

```text
pick twice

load twice

receive twice

count twice
```

---

# 187. CONCURRENCY

Example:

Picker A and Picker B attempt to allocate the same pallet.

Atlas must use transactional locking/version control.

Only one succeeds.

---

# 188. EVENT ARCHITECTURE

Important events:

```text
FulfilmentCreated

StockReserved

StockAllocated

ShipmentCreated

ShipmentReleased

WaveCreated

WaveReleased

WarehouseWorkCreated

PickStarted

PickCompleted

PickShort

PackageCreated

PackageClosed

ShipmentPacked

ShipmentStaged

LoadCreated

LoadCompleted

ShipmentDispatched

ShipmentDelivered

PODReceived

CountStarted

CountCompleted

InventoryVarianceApproved

ReturnReceived

ReturnDispositioned

FreightCostPosted
```

---

# 189. EVENTS CONSUMED BY OTHER DOMAINS

## Sales

```text
Picked
Dispatched
Delivered
```

## Finance

```text
Goods issue
Freight
Returns
Adjustments
```

## CRM / Customer Service

```text
Delivery status
Exception
POD
```

## Inventory

```text
All physical movement
```

## Manufacturing

```text
Production staging
Finished goods
```

## Procurement

```text
Supplier returns
Inbound
```

---

# 190. DATA MODEL

Core logical entities:

```text
WAREHOUSE

site
warehouse
warehouse_zone
warehouse_location
location_type
location_profile

INVENTORY

inventory_transaction
inventory_balance
inventory_reservation
inventory_allocation
inventory_status

HANDLING

handling_unit
handling_unit_type
handling_unit_content
handling_unit_relationship

COUNTING

inventory_count
inventory_count_scope
inventory_count_work
inventory_count_line
inventory_count_snapshot
inventory_count_variance

WORK

warehouse_work
warehouse_work_line
warehouse_work_dependency
warehouse_exception

REPLENISHMENT

replenishment_rule
replenishment_request

FULFILMENT

fulfilment_order
fulfilment_line

SHIPMENT

shipment
shipment_line
shipment_status_history
shipment_hold

WAVE

warehouse_wave
warehouse_wave_line

PACKING

packing_session
packing_container
packing_container_line

LOAD

load
load_line
load_handling_unit

DOCK

dock
dock_appointment
yard_location
yard_movement

TRANSPORT

carrier
carrier_service
freight_rate
vehicle
trailer
route
trip
trip_stop

EXPORT

export_profile
export_shipment
customs_data
export_evidence

DOCUMENTS

shipping_document
shipping_document_version
label_template

TRACKING

tracking_event
proof_of_delivery

RETURNS

return_authorisation
return_line
return_receipt
return_inspection
return_disposition

FREIGHT

freight_estimate
freight_charge
freight_invoice
freight_reconciliation
```

---

# 191. MAIN NAVIGATION

Do not expose every table.

Use:

```text
LOGISTICS

Overview

Warehouse
    Stock
    Locations
    Movements
    Counts
    Replenishment

Outbound
    Fulfilment
    Waves
    Picking
    Packing
    Staging

Shipping
    Shipments
    Loads
    Transport
    Dispatch
    Tracking

Distribution
    Routes
    Trips
    Fleet
    Carriers

Export
    Export Shipments
    Documents
    Customs Status

Returns

Exceptions

Reports
```

Configuration belongs under:

```text
Settings
```

not operational navigation.

---

# 192. WAREHOUSE MOBILE NAVIGATION

Keep completely different from desktop.

```text
MY WORK

Pick

Putaway

Move

Replenish

Pack

Load

Count

Receive

Returns

Lookup
```

---

# 193. UNIVERSAL STOCK LOOKUP

Mobile worker scans:

```text
SP1
```

Atlas displays:

```text
SP1

WH1

A01-B01      480
A01-B02      480
BULK-09      960

Available:
1,920
```

Or scan pallet:

```text
LP00122
```

Show:

```text
Current location
Contents
Batch
Status
Reservations
```

---

# 194. ADVANCED LOCATION LOOKUP

Scan:

```text
A01-B02
```

Show:

```text
Current stock

Capacity

Open work

Last count

Next count
```

Useful for warehouse supervisors.

---

# 195. REPORTING

Warehouse:

```text
Stock accuracy
Stock by location
Location utilisation
Pick face utilisation
Replenishment frequency
Travel
Stock movements
Adjustments
```

Fulfilment:

```text
Orders released
Pick lead time
Pack lead time
Dock lead time
Dispatch performance
```

Transport:

```text
Freight spend
Cost per shipment
Cost per tonne
Cost per pallet
Carrier performance
Vehicle utilisation
```

Delivery:

```text
OTIF
On-time delivery
Failed delivery
Damage
POD completion
```

Returns:

```text
Return rate
Return reason
Return cost
Disposition
Customer
Product
```

---

# 196. LOGISTICS DASHBOARDS

All metrics must use the Atlas Analytics semantic layer.

Example Data Views:

```text
Warehouse Performance

Outbound Fulfilment

Shipment Performance

Distribution Performance

Carrier Performance

Inventory Accuracy

Returns

Freight Cost
```

---

# 197. CONTROL TOWER ALERTS

Examples:

```text
Wave not released by cut-off

Shipment short

Load over capacity

Missing pallet

Packing backlog

Dock conflict

Carrier no-show

Missing export document

Missing export evidence

Delivery failed

POD missing

Freight variance

Count variance above threshold
```

---

# 198. IMPLEMENTATION PHASE 1

Build warehouse foundation:

```text
Warehouses

Locations

Location profiles

Inventory dimensions

Handling units

Stock lookup

Internal movements
```

Then:

```text
Counts
```

before sophisticated outbound processing.

Stock must be trusted before Logistics depends upon it.

---

# 199. IMPLEMENTATION PHASE 2

Build:

```text
Reservations

Allocation

Putaway

Removal strategies

Replenishment

Warehouse work engine

Mobile scanning framework
```

---

# 200. IMPLEMENTATION PHASE 3

Build outbound:

```text
Fulfilment orders

Shipments

Waves

Picking

Short picks

Warehouse exceptions
```

---

# 201. IMPLEMENTATION PHASE 4

Build:

```text
Handling units

Packing stations

Cartonisation

Labels

Staging
```

---

# 202. IMPLEMENTATION PHASE 5

Build:

```text
Loads

Load planning

Dock management

Loading

Dispatch
```

---

# 203. IMPLEMENTATION PHASE 6

Build Transport:

```text
Carriers

Own fleet

Freight rates

Routes

Trips

Stops

Tracking

POD
```

---

# 204. IMPLEMENTATION PHASE 7

Build:

```text
Export

Commercial documents

Customs data

Export evidence

Shipping holds
```

---

# 205. IMPLEMENTATION PHASE 8

Build reverse logistics:

```text
RMA

Return receipt

Inspection

Disposition

Supplier returns

Failed-delivery returns
```

---

# 206. IMPLEMENTATION PHASE 9

Build financial transport features:

```text
Freight accrual

Freight allocation

Carrier invoices

Freight reconciliation

Logistics profitability
```

---

# 207. IMPLEMENTATION PHASE 10

Build advanced optimisation:

```text
Automatic wave optimisation

Automatic load building

Route optimisation

Warehouse travel optimisation

Labour forecasting

Dock optimisation

Predictive replenishment
```

Only after deterministic warehouse operations are reliable.

---

# 208. TEST 1: STOCK LOCATION

Product A exists:

```text
A01-B01     100
A01-B02     200
BULK-01     500
```

Total must equal:

```text
800
```

Moving 100:

```text
A01-B01
→
A01-B03
```

must preserve total quantity.

---

# 209. TEST 2: NESTED PALLET

Pallet:

```text
LP100
```

contains:

```text
Carton A
Carton B
```

Move LP100.

Both cartons and all inventory must move.

---

# 210. TEST 3: COUNT

Expected:

```text
100
```

Blind count:

```text
96
```

Difference:

```text
-4
```

Threshold requires recount.

Second employee:

```text
96
```

Manager approves.

Atlas posts:

```text
COUNT_LOSS -4
```

and appropriate costing/Finance event.

---

# 211. TEST 4: WAVE

Three shipments:

```text
SH1
SH2
SH3
```

group into Wave W1.

Wave creates appropriate warehouse work.

Picking each shipment separately must not be required where batch/cluster method applies.

---

# 212. TEST 5: SHORT PICK

Required:

```text
100
```

Allocated location contains:

```text
80
```

Operator short-picks 20.

Atlas should:

```text
record exception

attempt alternate allocation

create count work if configured

update shipment risk
```

---

# 213. TEST 6: PARTIAL SHIPMENT

Order:

```text
Product A 100
Product B 100
```

Only Product A available.

Policy permits split.

Create:

```text
Shipment 1
A 100

Shipment 2
B 100 pending
```

Sales order remains partially fulfilled.

---

# 214. TEST 7: PACKING

Shipment contains:

```text
3 cartons
```

Only two closed.

Shipment status cannot become:

```text
PACKED
```

until rules are satisfied.

---

# 215. TEST 8: WRONG PALLET LOAD

Load expects:

```text
LP100
```

Operator scans:

```text
LP200
```

Atlas must reject loading and clearly identify the correct destination of LP200.

---

# 216. TEST 9: EXPORT HOLD

Export shipment missing product commodity classification.

It may be:

```text
PICKED
PACKED
```

but must not become:

```text
EXPORT READY
```

under configuration requiring complete export data.

---

# 217. TEST 10: FAILED DELIVERY

Ten pallets dispatched.

Customer accepts nine.

One damaged pallet returns.

System must preserve:

```text
9 delivered

1 returning
```

rather than changing all ten back to warehouse stock.

---

# 218. TEST 11: FREIGHT

Estimated:

```text
£500
```

Actual carrier invoice:

```text
£560
```

Tolerance:

```text
£25
```

System creates freight variance exception:

```text
£60
```

before Finance approval.

---

# 219. NON-NEGOTIABLE RULES FOR CODEX

Do not:

- store warehouse stock only at warehouse level
- use product.quantity as stock truth
- confuse reservation with physical allocation
- confuse order with shipment
- confuse shipment with load
- confuse pallet with shipment
- mark stock dispatched when merely picked
- mark an entire order delivered after partial delivery
- return customer goods directly to available inventory without policy
- allow count differences to silently modify stock
- overwrite historical stock transactions
- allow duplicate scanning transactions
- hard-code one picking strategy
- hard-code one warehouse flow
- assume every shipment is domestic
- assume every delivery is own fleet
- assume every delivery is carrier transport
- assume every customer order fits on one vehicle
- assume one shipment contains one sales order
- assume one sales order creates one shipment
- assume every item requires packing
- assume every location accepts every product
- assume location capacity is unlimited
- hard-code customs rules into generic logistics logic
- hard-code GL accounts
- build transport costing separately from Finance
- create a separate stock model inside Logistics

---

# 220. ATLAS LOGISTICS PHILOSOPHY

The system must answer:

> Where is my stock?

with:

```text
Warehouse
Zone
Location
Pallet
Batch
Status
Quantity
```

Not merely:

```text
Warehouse 1
```

It must answer:

> Where is Order 882?

with:

```text
Allocated       ✓
Picking         ✓
Picked          ✓
Packing         80%
Missing         Product C × 20
Load            L0192
Departure       16:00
Delivery        Tomorrow
```

It must answer:

> Why has it not left?

with:

```text
Shipment held

because

20 units remain unpacked

because

Pick Work PW992 short-picked

because

Location A03 expected 100 but contained 80

Cycle Count CC881 created
```

---

# 221. END-TO-END ATLAS MODEL

```text
                       SALES
                         │
                         ▼
                   SALES ORDER
                         │
                         ▼
                 FULFILMENT ORDER
                         │
                  ┌──────┴──────┐
                  │             │
                  ▼             ▼
              INVENTORY      SHIPMENT
                  │             │
              RESERVE           │
                  │             │
              ALLOCATE          │
                  └──────┬──────┘
                         ▼
                        WAVE
                         │
                         ▼
                  WAREHOUSE WORK
                         │
                ┌────────┴────────┐
                ▼                 ▼
          REPLENISHMENT          PICK
                                  │
                                  ▼
                                PACK
                                  │
                                  ▼
                                STAGE
                                  │
                         ┌────────┴────────┐
                         │                 │
                         ▼                 ▼
                       LOAD             EXPORT
                         │                 │
                         └────────┬────────┘
                                  ▼
                              DISPATCH
                                  │
                                  ▼
                                TRIP
                                  │
                                  ▼
                              DELIVERY
                                  │
                                  ▼
                                 POD
                                  │
                         ┌────────┴─────────┐
                         ▼                  ▼
                       CLOSE             RETURN
                                             │
                                             ▼
                                         INSPECT
                                             │
                                  ┌──────────┼──────────┐
                                  ▼          ▼          ▼
                                STOCK      REWORK      SCRAP
```

Meanwhile:

```text
WAREHOUSE
   │
   ├── Locations
   │
   ├── Handling Units
   │
   ├── Stock
   │
   └── Counts
```

continually maintains physical inventory truth.

---

# 222. DEFINITION OF SUCCESS

Atlas Logistics succeeds when the business can answer immediately:

### Stock

What have we got?

### Location

Exactly where is it?

### Accuracy

When was it last counted?

### Pallet

What is physically on this pallet?

### Reservation

Who is this stock committed to?

### Picking

What needs picking next?

### Replenishment

What must be moved into the pick face?

### Packing

What has been packed and what remains?

### Shipment

What is travelling together?

### Staging

Where are the goods waiting?

### Loading

What is physically on the truck?

### Transport

Who is moving it?

### Distribution

Where is the vehicle going?

### Export

Is the shipment ready to leave the country?

### Documentation

Do we have everything required?

### Cost

What will the freight cost?

### Tracking

Where is the shipment?

### Delivery

Was everything delivered?

### POD

Who received it?

### Returns

What came back and why?

### Inventory

What happened to returned goods?

### Finance

What did the entire fulfilment actually cost?

And all of those answers must come from the same physical inventory, warehouse, shipment and transaction model.

That is the required Atlas Logistics architecture.