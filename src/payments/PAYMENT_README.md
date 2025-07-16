# Car Wash API Payment System

This Car Wash API now supports multiple payment providers including M-Pesa (Safaricom) and Stripe, providing comprehensive payment functionality for both mobile money and card payments.

## 🚀 Features

### Payment Providers

- **M-Pesa Integration**: Full STK Push, payment verification, and callback handling
- **Stripe Integration**: Payment Intents, Checkout Sessions, and webhook processing
- **Paystack Support**: Legacy support maintained for backward compatibility

### Payment Operations

- Initialize payments with multiple providers
- Real-time payment verification
- Automatic payment status updates
- Comprehensive webhook handling
- Payment refunds and cancellations
- Transaction history and reporting

## 📋 Prerequisites

### M-Pesa Requirements

1. Safaricom Developer Account
2. M-Pesa API credentials (Consumer Key, Secret, Passkey)
3. Business Shortcode
4. SSL-enabled callback URL

### Stripe Requirements

1. Stripe Account
2. API Keys (Secret and Publishable)
3. Webhook endpoint configuration
4. SSL-enabled domain for webhooks

## 🛠️ Installation & Setup

### 1. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Configure your environment variables:

```env
# M-Pesa Configuration
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_PASSKEY=your_mpesa_passkey
MPESA_SHORTCODE=174379
MPESA_ENVIRONMENT=sandbox

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 2. Database Migration

Ensure your database includes the updated payment entity with M-Pesa and Stripe fields:

```sql
-- Additional fields added to payment entity
ALTER TABLE payments ADD COLUMN mpesa_checkout_request_id VARCHAR;
ALTER TABLE payments ADD COLUMN stripe_payment_intent_id VARCHAR;
ALTER TABLE payments ADD COLUMN phone_number VARCHAR;
```

### 3. Start the Application

```bash
# Install dependencies
npm install

# Start in development mode
npm run start:dev

# Start in production mode
npm run start:prod
```

## 📖 API Documentation

### M-Pesa Endpoints

#### Initialize M-Pesa Payment

```http
POST /api/payments/mpesa/initialize
Content-Type: application/json

{
  "bookingId": "123e4567-e89b-12d3-a456-426614174000",
  "amount": 1500,
  "phoneNumber": "254708374149",
  "description": "Car wash service payment"
}
```

#### Verify M-Pesa Payment

```http
POST /api/payments/mpesa/verify
Content-Type: application/json

{
  "checkoutRequestId": "ws_CO_DMZ_123456789_12345678901234567890"
}
```

#### M-Pesa Callback (Webhook)

```http
POST /api/payments/mpesa/callback
Content-Type: application/json

{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "29115-34620561-1",
      "CheckoutRequestID": "ws_CO_DMZ_123456789_12345678901234567890",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [...]
      }
    }
  }
}
```

### Stripe Endpoints

#### Initialize Stripe Payment Intent

```http
POST /api/payments/stripe/initialize
Content-Type: application/json

{
  "bookingId": "123e4567-e89b-12d3-a456-426614174000",
  "amount": 1500,
  "currency": "usd",
  "description": "Car wash service payment"
}
```

#### Create Stripe Checkout Session

```http
POST /api/payments/stripe/checkout
Content-Type: application/json

{
  "bookingId": "123e4567-e89b-12d3-a456-426614174000",
  "amount": 1500,
  "currency": "usd",
  "successUrl": "https://yourapp.com/success",
  "cancelUrl": "https://yourapp.com/cancel"
}
```

#### Verify Stripe Payment

```http
POST /api/payments/stripe/verify
Content-Type: application/json

{
  "paymentIntentId": "pi_1234567890abcdef"
}
```

#### Stripe Webhook

```http
POST /api/payments/stripe/webhook
Content-Type: application/json
Stripe-Signature: t=1234567890,v1=signature

{
  "id": "evt_1234567890abcdef",
  "object": "event",
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1234567890abcdef",
      "status": "succeeded"
    }
  }
}
```

### Common Payment Endpoints

#### Get Payment Details

```http
GET /api/payments/:id
```

#### Process Refund

```http
POST /api/payments/:id/refund
Content-Type: application/json

{
  "amount": 500,
  "reason": "Service cancelled"
}
```

#### Get Payment History

```http
GET /api/payments/history/:bookingId
```

## 🧪 Testing

### M-Pesa Testing

**Sandbox Environment:**

- Use test phone numbers: `254708374149` (success), `254711049523` (failure)
- Test amounts: Any amount between 1 and 70,000 KES
- Environment: Set `MPESA_ENVIRONMENT=sandbox`

**Test Credentials:**

```env
MPESA_CONSUMER_KEY=sandbox_consumer_key
MPESA_CONSUMER_SECRET=sandbox_consumer_secret
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_SHORTCODE=174379
```

### Stripe Testing

**Test Card Numbers:**

- Success: `4242424242424242`
- Decline: `4000000000000002`
- Insufficient funds: `4000000000009995`
- CVV: Any 3 digits
- Expiry: Any future date

**Test Mode:**

- Use test API keys (starting with `sk_test_` and `pk_test_`)
- All transactions are simulated and won't charge real money

## 🔒 Security Considerations

### M-Pesa Security

- Store credentials securely using environment variables
- Validate callback authenticity
- Implement request signing verification
- Use HTTPS for all callback URLs

### Stripe Security

- Validate webhook signatures
- Use webhook secrets for authentication
- Store sensitive data encrypted
- Implement idempotency for payment operations

### General Security

- Rate limiting on payment endpoints
- Input validation and sanitization
- Comprehensive error handling without exposing sensitive information
- Audit logging for all payment operations

## 🐛 Error Handling

### Common M-Pesa Errors

- `Invalid phone number format` - Use format 254XXXXXXXXX
- `Insufficient funds` - Customer has insufficient balance
- `Transaction timeout` - Customer didn't complete payment within time limit
- `Authentication failed` - Check your API credentials

### Common Stripe Errors

- `card_declined` - Customer's card was declined
- `insufficient_funds` - Insufficient funds on card
- `authentication_required` - 3D Secure authentication needed
- `webhook_signature_verification_failed` - Invalid webhook signature

## 📊 Monitoring & Analytics

### Payment Metrics

- Payment success/failure rates
- Average transaction amounts
- Payment method preferences
- Geographic distribution

### Logging

- All payment operations are logged
- Error tracking and alerting
- Performance monitoring
- Webhook delivery tracking

## 🚀 Production Deployment

### M-Pesa Production

1. Complete Safaricom's production approval process
2. Update credentials to production values
3. Set `MPESA_ENVIRONMENT=production`
4. Configure production callback URLs

### Stripe Production

1. Activate your Stripe account
2. Update to live API keys
3. Configure production webhooks
4. Complete business verification

### General Production Setup

1. Use environment-specific configurations
2. Enable comprehensive monitoring
3. Set up automated backups
4. Configure proper SSL certificates
5. Implement proper error tracking

## 📞 Support & Documentation

### Resources

- [M-Pesa API Documentation](https://developer.safaricom.co.ke/)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [NestJS Documentation](https://docs.nestjs.com/)

### Support

For technical support or questions regarding the payment integration, please check the documentation or create an issue in the project repository.

## 🔄 API Versioning

Current API version: `v1`

All endpoints are prefixed with `/api/` and follow RESTful conventions. Breaking changes will be introduced in new API versions to maintain backward compatibility.

---

**Note:** This implementation provides production-ready payment processing capabilities. Ensure you comply with all relevant financial regulations and data protection laws in your jurisdiction.
