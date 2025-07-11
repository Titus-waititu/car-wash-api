# Payments Module Documentation

## Overview

The Payments module handles all payment-related operations for the Car Wash API, including Paystack integration for payment processing, transaction management, and database operations.

## Features

### Core Functionality

- ✅ Create and manage payment records
- ✅ Initialize payments with Paystack
- ✅ Verify payment transactions
- ✅ Handle payment webhooks
- ✅ Payment refunds
- ✅ Payment history and statistics
- ✅ Cancel pending payments

### Payment Methods Supported

- **Card**: Credit/Debit cards via Paystack
- **MPesa**: Mobile money (configured through Paystack)
- **Cash**: For in-person payments

### Payment Statuses

- **PENDING**: Payment initialized but not completed
- **COMPLETED**: Payment successfully processed
- **FAILED**: Payment failed or was cancelled

## API Endpoints

### Payment Management

- `POST /payments` - Create a payment record
- `GET /payments` - Get all payments (with optional user filtering)
- `GET /payments/:id` - Get payment by ID
- `PATCH /payments/:id` - Update payment
- `DELETE /payments/:id` - Delete payment

### Payment Processing

- `POST /payments/initialize` - Initialize payment with Paystack
- `POST /payments/verify` - Verify payment transaction
- `POST /payments/webhook` - Handle Paystack webhooks

### Additional Operations

- `GET /payments/statistics` - Get payment statistics
- `GET /payments/booking/:bookingId` - Get payments for a booking
- `POST /payments/:id/cancel` - Cancel pending payment
- `POST /payments/:id/refund` - Refund completed payment
- `GET /payments/transaction/:transactionId` - Get payment by transaction ID

## Database Schema

### Payment Entity

```sql
CREATE TABLE payment (
    id UUID PRIMARY KEY,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    transaction_id VARCHAR UNIQUE,
    payment_method ENUM('MPesa', 'Card', 'Cash') DEFAULT 'Card',
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    booking_id UUID REFERENCES booking(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_payment_status ON payment(status);
CREATE UNIQUE INDEX idx_payment_transaction_id ON payment(transaction_id);
```

## Environment Variables Required

```env
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_your_secret_key_here
PAYSTACK_BASE_URL=https://api.paystack.co
```

## Usage Examples

### 1. Initialize Payment

```javascript
const response = await fetch('/payments/initialize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    bookingId: 'booking-uuid',
    email: 'customer@example.com',
  }),
});

const { authorization_url, reference, payment } = await response.json();
// Redirect user to authorization_url
```

### 2. Verify Payment

```javascript
const response = await fetch('/payments/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    reference: 'paystack_reference',
  }),
});

const payment = await response.json();
```

### 3. Handle Webhook (Paystack)

```javascript
// Paystack will send POST request to /payments/webhook
{
  "event": "charge.success",
  "data": {
    "reference": "transaction_reference",
    "amount": 5000, // in kobo
    "status": "success"
  }
}
```

## Error Handling

The module implements comprehensive error handling:

- **404 Not Found**: Payment or booking not found
- **400 Bad Request**: Invalid data or business logic violations
- **500 Internal Server Error**: Paystack API errors or database issues

## Security Features

1. **Input Validation**: All DTOs use class-validator decorators
2. **UUID Validation**: UUIDs are validated using ParseUUIDPipe
3. **Webhook Security**: Paystack webhooks should be verified (implement signature verification)
4. **Public Endpoints**: Payment endpoints are marked as public for webhook access

## Integration with Other Modules

### Bookings Module

- Payments are linked to bookings via one-to-one relationship
- Payment status updates booking confirmation status
- Booking total_amount is used for payment initialization

### Users Module (Future)

- Payment history can be filtered by user ID
- User information is accessed through booking relationship

## Testing

Use the provided `payments.http` file to test all endpoints manually, or write unit tests for the service methods.

## Future Enhancements

1. **Webhook Signature Verification**: Implement Paystack webhook signature validation
2. **Partial Payments**: Support for partial payment scenarios
3. **Payment Plans**: Implement installment payment features
4. **Multiple Payment Methods**: Support for bank transfers, USSD, etc.
5. **Payment Analytics**: Enhanced reporting and analytics features
6. **Automated Refunds**: Integration with Paystack refund API

## Dependencies

- `@nestjs/typeorm`: Database ORM
- `typeorm`: Database operations
- `axios`: HTTP client for Paystack API
- `class-validator`: Input validation
- `@nestjs/config`: Configuration management
