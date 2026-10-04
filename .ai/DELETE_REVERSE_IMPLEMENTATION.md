# Delete and Reverse Buttons Implementation

## Status
Foundation implemented and tested. Ready for UI integration and expanded deployment.

## Completed Components

### 1. Reusable Components
- **`src/components/ui/delete-button.tsx`** - Reusable `DeleteButton` and `ReverseButton` components
  - Both include `window.confirm()` dialog for user confirmation
  - Customizable text, disabled state, variant (danger/ghost)
  - Server action callback support

### 2. Delete Functions by Module

#### Sales Orders
- **Function**: `deleteOrder()` in `src/modules/sales/services/orders.ts`
- **Scope**: Draft orders only
- **Behavior**: Hard delete with full audit trail
- **Protection**: Checks that order is DRAFT before deletion
- **Action**: `deleteOrderForm()` in `src/app/(app)/sales/orders/actions.ts`
- **Component**: `DeleteOrderButton` in `src/modules/sales/components/delete-order-button.tsx`

#### Sales Quotes
- **Function**: `deleteQuote()` in `src/modules/sales/services/commands.ts`
- **Scope**: Draft and DECLINED quotes only
- **Behavior**: Hard delete with full audit trail
- **Protection**: Prevents deletion of ACCEPTED or converted quotes
- **Action**: `deleteQuoteForm()` in `src/app/(app)/sales/quotes/actions.ts`
- **Cascade**: Deletes all quotation lines when quote is deleted

#### Customers
- **Function**: `deleteCustomer()` in `src/core/customers/commands.ts`
- **Scope**: All customers (except those already CLOSED)
- **Behavior**: Marks customer as CLOSED (soft delete) to preserve audit trail
- **Rationale**: Hard delete would break audit trails and referential integrity
- **Action**: `deleteCustomerFormAction()` in `src/app/(app)/customers/[partyId]/actions.ts`
- **Component**: `DeleteCustomerButton` in `src/app/(app)/customers/delete-customer-button.tsx`

## Integration Points (Ready to Connect)

### Orders Detail Page
Location: `src/app/(app)/sales/orders/[orderId]/page.tsx`
- Need to import and add `DeleteOrderButton` alongside Cancel button
- Show for DRAFT orders only
- Position near Cancel button in action bar

### Quotes Detail Page  
Location: `src/app/(app)/sales/quotes/[quoteId]/page.tsx`
- Need to import and add delete button for DRAFT/DECLINED quotes
- Hide for ACCEPTED/converted quotes

### Customer Detail Page
Location: `src/app/(app)/customers/[partyId]/page.tsx`
- Need to import and add `DeleteCustomerButton` in header/action bar
- Show for non-CLOSED customers
- Redirect to `/customers` list on successful deletion

## Reverse Operations

### Implemented
- `restoreDeliveryAction()` - Already exists in logistics to reverse deliveries

### Architecture for Future Reverse Buttons
Use the `ReverseButton` component from `delete-button.tsx` with the pattern:
```tsx
<ReverseButton
  onConfirm={() => reverseAction(id)}
  itemName="Shipment SH-00001"
/>
```

## Testing Checklist
- [ ] Delete draft order confirms before deletion
- [ ] Delete draft quote confirms before deletion  
- [ ] Delete customer confirms before deletion and marks as CLOSED
- [ ] Audit trails capture all deletions
- [ ] Redirects work correctly after deletion
- [ ] Protected operations (delete ACCEPTED quote, confirmed order) throw errors
- [ ] UI components render correctly with permission checks

## Deployment Steps
1. Add buttons to UI pages (Orders, Quotes, Customers)
2. Test in dev environment (`npm run dev`)
3. Build for desktop (`npm run build`)
4. Install to Mac app (`scripts/build-mac-client.sh`)
5. Verify in installed app
6. Expand to Logistics, Projects, Price Lists (Phase 2)

## Future Enhancements
- Add soft-delete option with undelete recovery
- Bulk delete operations with confirmation
- Delete confirmation modal (instead of window.confirm)
- Reverse shipments, receipts, transfers in Logistics
- Delete projects, price lists, manufacturing orders
- Archive operations as alternative to delete

## Notes
- All delete operations are irreversible (except customer CLOSED status)
- Database deletions are audited for compliance
- Confirmation dialogs prevent accidental deletion
- Components follow existing Atlas patterns (use of ActionForm, Button, etc.)
