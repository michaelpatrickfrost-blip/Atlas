# Ticketing System Module

A flexible, multi-queue ticketing system for IT issues, customer service, complaints, internal requests and operational tracking. Organizations can create multiple ticket desks, customize workflows, and track all activity with full audit trails.

## Overview

The Ticketing module provides:

- **Flexible Queue Configuration**: Create and configure multiple ticket queues for different purposes (IT Help Desk, Customer Service, Complaints, Internal Requests, etc.)
- **Ticket Lifecycle**: NEW → IN_PROGRESS → RESOLVED → CLOSED workflow with custom status support
- **Multi-assignment**: Assign tickets to teams or individual users
- **Watchers & Visibility**: People see tickets they created, own, are assigned to, or are watching
- **Comments & Activity**: Full reply/comment system with audit trails
- **Priority & SLA**: Set ticket priority and track response times
- **Linking**: Connect tickets to Parties (customers), Projects, and other business records
- **Advanced Filtering**: Filter by queue, status, assignee, priority, date range
- **Full Audit Trail**: Every change recorded with user and timestamp

## Key Entities

### TicketQueue
- `id` - Unique identifier
- `code` - Human-readable code (e.g. "IT", "CUST_SERVICE")
- `name` - Display name
- `description` - Queue description
- `status` - ACTIVE | INACTIVE
- `defaultPriority` - Default priority for new tickets in this queue
- `autoAssignRule` - Optional auto-assignment logic (e.g. "round_robin", "skill_based")
- `organisationId` - Multi-tenant scoping
- `auditEntries` - History of changes

### Ticket
- `id` - Unique identifier (e.g. "TK-1234")
- `queueId` - Which queue this belongs to
- `title` - Short description
- `description` - Detailed description
- `status` - NEW | IN_PROGRESS | RESOLVED | CLOSED
- `priority` - LOW | MEDIUM | HIGH | URGENT
- `assignedToUserId` - Optional single user assignment
- `assignedToTeamId` - Optional team assignment
- `reportedById` - User who created the ticket
- `partyId` - Optional link to a customer (Party)
- `relatedProjectId` - Optional link to a project
- `relatedOrderId` - Optional link to a sales order
- `tags` - Array of tags for categorization
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp
- `resolvedAt` - When marked resolved
- `closedAt` - When marked closed
- `organisationId` - Multi-tenant scoping
- `auditEntries` - Full change history

### TicketComment
- `id` - Unique identifier
- `ticketId` - Parent ticket
- `authorId` - Who wrote the comment
- `content` - Comment text (supports @mentions)
- `attachmentUrls` - Optional file attachments
- `createdAt` - Timestamp
- `updatedAt` - Last edit timestamp
- `isInternal` - Internal note (not visible to customer)
- `auditEntries` - Edit history

### TicketWatcher
- `id` - Unique identifier
- `ticketId` - Parent ticket
- `userId` - Who is watching
- `addedAt` - When they were added
- `addedBy` - Who added them

## Capabilities

```typescript
tickets.queue.read       // View ticket queues
tickets.queue.manage     // Create, edit, delete queues (admin only)
tickets.ticket.read      // View tickets
tickets.ticket.create    // Create new tickets
tickets.ticket.manage    // Manage all tickets (assign, reassign, close, delete)
tickets.ticket.reply     // Add comments/replies to tickets
tickets.ticket.watch     // Watch/unwatch tickets
```

## Workflow

### Creating a Ticket
1. User navigates to a queue or clicks "Create ticket"
2. Selects queue type (IT Help, Customer Service, etc.)
3. Enters title, description, priority
4. Optionally links to a customer/project/order
5. Ticket created with status NEW
6. Auto-assignment rule applies if configured
7. Watchers notified (creator is added automatically)

### Managing Tickets
1. Queue manager assigns to user/team or uses auto-assignment
2. Assignee updates status to IN_PROGRESS
3. Assignee adds internal notes or customer replies
4. Requestor sees public comments only
5. When resolved, status → RESOLVED with closure comment
6. Manager closes when complete → CLOSED

### Visibility Rules
- **Own tickets**: You see tickets you created
- **Assigned tickets**: You see tickets assigned to you or your team
- **Watched tickets**: You see tickets you're watching
- **Queue managers**: See all tickets in their queues
- **System admins**: See all tickets in the organization

### Activity & Audit
- Ticket creation logged
- Every status change logged with user and timestamp
- Comments create activity entries
- Assignment changes tracked
- Watcher list maintained with audit

## Integration Points

### With Customer Master (Party)
- Tickets can link to a customer
- Customer record shows related tickets
- Customer can view their own tickets (future: portal)

### With Projects
- Tickets can link to projects
- Project detail shows related support tickets
- Help desk can track issues per project

### With CRM/Sales
- Sales reps can create service tickets
- Customer service can see related orders
- Complaints link to originating sales activity

### With HR
- HR tickets for employee requests (e.g. IT equipment)
- Scheduling can see team-related support tickets
- Audit trail visible to HR for compliance

## Queues & Customization

### Pre-configured Queues

**IT Help Desk**
- For internal IT support requests
- Auto-assigns to IT team
- Tracks resolution time

**Customer Service**
- For customer-facing issues
- Links to Party records
- Internal notes hidden from customer
- SLA tracking

**Complaints**
- For customer complaints
- Requires root-cause analysis
- Links to originating transaction
- Escalation workflow

**Internal Requests**
- For internal team requests
- Cross-departmental visibility
- Approval workflow optional

## Routes & Pages

- `/tickets` - Dashboard showing your tickets
- `/tickets/queues` - Queue management (admin)
- `/tickets/queues/[queueId]` - Queue detail
- `/tickets/[ticketId]` - Ticket detail with comments
- `/tickets/create` - Create new ticket form

## Future Enhancements

- **SLA Tracking**: Automatic response/resolution SLA enforcement
- **Templates**: Ticket templates with pre-filled fields
- **Automation**: Rules for auto-assignment, status updates, notifications
- **Escalation**: Automatic escalation after time threshold
- **Merge**: Merge related tickets
- **Bulk Actions**: Bulk update status, reassign, close
- **Advanced Analytics**: Ticket trends, queue performance, assignee workload
- **Customer Portal**: Customers can view and update their own tickets
- **Email Integration**: Create tickets from email, reply via email
- **Knowledge Base**: Link to related KB articles
