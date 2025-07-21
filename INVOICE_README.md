# Invoice Management System

## Overview

The Invoice Management System is a comprehensive solution for handling invoices in the CarWash API. It automatically creates and manages invoices when payments are completed, sends email notifications to customers, and provides full CRUD operations for invoice management.

## Features

### 🧾 Automatic Invoice Generation

- Invoices are automatically created when payments are marked as completed
- Generates unique invoice numbers in format: `INV-YYYYMM-XXXX`
- Links invoices to bookings, customers, and payments
- Calculates total amounts including tax

### 📧 Email Notifications

- **Invoice Email**: Sent when invoice is marked as "sent"
- **Payment Confirmation Email**: Sent when payment is completed and invoice is marked as "paid"
- Professional HTML email templates with service details and amount breakdown

### 📊 Invoice Status Management

- **PENDING**: Initial status for new invoices
- **SENT**: Invoice has been sent to customer
- **PAID**: Payment has been received
- **OVERDUE**: Invoice is past due date
- **CANCELLED**: Invoice has been cancelled

### 🔄 Payment Integration

- Automatic invoice creation when M-Pesa payments are completed
- Automatic invoice creation when Stripe payments are completed
- Links invoices to payment records
- Updates invoice status to "PAID" when payment is confirmed

## API Endpoints

### Invoice Management

```http
POST /invoice                           # Create new invoice
GET /invoice                           # Get all invoices
GET /invoice?customerId={id}           # Get invoices for specific customer
GET /invoice/{id}                      # Get invoice by ID
GET /invoice/number/{invoiceNumber}    # Get invoice by number
GET /invoice/booking/{bookingId}       # Get invoice by booking ID
PATCH /invoice/{id}                    # Update invoice
DELETE /invoice/{id}                   # Delete invoice
```

### Invoice Actions

```http
PATCH /invoice/{id}/send              # Mark invoice as sent (sends email)
PATCH /invoice/{id}/paid              # Mark invoice as paid (sends confirmation)
```

### Invoice Analytics

```http
GET /invoice/stats                    # Get invoice statistics
GET /invoice/overdue                  # Get overdue invoices
PATCH /invoice/overdue/update         # Update overdue invoice statuses
```

## Data Models

### Invoice Entity

```typescript
{
  id: string; // UUID
  invoice_number: string; // Unique invoice number (INV-YYYYMM-XXXX)
  amount: number; // Base service amount
  tax_amount: number; // Tax amount
  total_amount: number; // Total amount (amount + tax)
  status: InvoiceStatus; // Current status
  due_date: Date; // Payment due date
  sent_at: Date; // When invoice was sent
  paid_at: Date; // When payment was received
  notes: string; // Additional notes
  pdf_url: string; // URL to PDF invoice (future feature)
  created_at: Date;
  updated_at: Date;

  // Relations
  booking: Booking; // Associated booking
  payment: Payment; // Associated payment (if paid)
  customer: User; // Customer who receives the invoice
}
```

### Create Invoice DTO

```typescript
{
  booking_id: string          // Required: UUID of the booking
  customer_id: string         // Required: UUID of the customer
  tax_amount?: number         // Optional: Tax amount (default: 0)
  due_date?: string          // Optional: Due date (default: 30 days from creation)
  notes?: string             // Optional: Additional notes
}
```

## Email Templates

### Invoice Email

- Professional layout with service details
- Amount breakdown (service amount, tax, total)
- Due date information
- Custom notes if provided
- Branding consistent with CarWash service

### Payment Confirmation Email

- Payment success notification
- Invoice and payment details
- Service information
- Thank you message

## Automatic Workflows

### Payment Completion Workflow

1. Payment status changes to "COMPLETED" (M-Pesa or Stripe)
2. System checks if invoice exists for the booking
3. If no invoice exists, creates one automatically
4. Marks invoice as "PAID" and links to payment
5. Sets `paid_at` timestamp
6. Sends payment confirmation email to customer

### Manual Invoice Creation

1. Admin creates invoice via API
2. Invoice status is set to "PENDING"
3. Admin can mark invoice as "SENT" to trigger email
4. When payment is received, invoice is marked as "PAID"

## Configuration

### Environment Variables

```env
EMAIL=your-smtp-email@example.com
PASSWORD=your-smtp-password
```

### Email Service

The system uses NodeMailer with Gmail SMTP. Make sure to:

1. Enable 2-factor authentication on Gmail
2. Generate an app-specific password
3. Use the app password in the `PASSWORD` environment variable

## Usage Examples

### Creating an Invoice

```typescript
const invoice = await invoiceService.create({
  booking_id: '123e4567-e89b-12d3-a456-426614174000',
  customer_id: '987fcdeb-51a2-43d1-b1f4-426614174999',
  tax_amount: 5.0,
  due_date: '2025-08-21',
  notes: 'Car wash service - Premium package',
});
```

### Sending an Invoice

```typescript
// This will update status to SENT and send email
const invoice = await invoiceService.markAsSent(invoiceId);
```

### Marking as Paid

```typescript
// This will update status to PAID and send confirmation email
const invoice = await invoiceService.markAsPaid(invoiceId, paymentId);
```

## Statistics and Analytics

The system provides comprehensive analytics:

- Total number of invoices
- Number of paid invoices
- Number of pending invoices
- Number of overdue invoices
- Total revenue from paid invoices

## Overdue Invoice Management

The system includes utilities for managing overdue invoices:

- Automatic detection of overdue invoices (past due date)
- Bulk update of overdue statuses
- Retrieval of all overdue invoices for follow-up

## Integration Points

### With Payment System

- M-Pesa payment completion triggers invoice creation/update
- Stripe payment completion triggers invoice creation/update
- Payment records are linked to invoices

### With Booking System

- Invoices are created based on booking information
- Service details are included in invoices
- Customer information is automatically populated

### With Mail System

- Professional email templates for invoices
- Payment confirmation emails
- Error handling for failed email delivery

## Error Handling

The system includes comprehensive error handling:

- Validation of required fields
- Checking for duplicate invoices
- Handling of missing bookings/customers
- Graceful email delivery failures
- Database transaction rollback on errors

## Future Enhancements

- PDF invoice generation
- Recurring invoice support
- Invoice templates customization
- Multi-currency support
- Invoice approval workflows
- Integration with accounting systems
