import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface StripeConfig {
  secretKey: string;
  publishableKey: string;
  webhookSecret: string;
  apiVersion: string;
}

export interface StripePaymentIntentResponse {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface StripeCheckoutSessionResponse {
  id: string;
  url: string;
  payment_intent: string;
  amount_total: number;
  currency: string;
  payment_status: string;
}

@Injectable()
export class StripeService {
  private config: StripeConfig;
  private baseUrl = 'https://api.stripe.com/v1';

  constructor(private configService: ConfigService) {
    this.config = {
      secretKey: this.configService.get<string>('STRIPE_SECRET_KEY', ''),
      publishableKey: this.configService.get<string>(
        'STRIPE_PUBLISHABLE_KEY',
        '',
      ),
      webhookSecret: this.configService.get<string>(
        'STRIPE_WEBHOOK_SECRET',
        '',
      ),
      apiVersion: '2023-10-16',
    };
  }

  private getAuthHeaders() {
    return {
      Authorization: `Bearer ${this.config.secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': this.config.apiVersion,
    };
  }

  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    metadata: Record<string, string> = {},
  ): Promise<StripePaymentIntentResponse> {
    try {
      const params = new URLSearchParams({
        amount: amount.toString(),
        currency,
        'automatic_payment_methods[enabled]': 'true',
        ...Object.entries(metadata).reduce(
          (acc, [key, value]) => {
            acc[`metadata[${key}]`] = value;
            return acc;
          },
          {} as Record<string, string>,
        ),
      });

      const response = await axios.post(
        `${this.baseUrl}/payment_intents`,
        params.toString(),
        { headers: this.getAuthHeaders() },
      );

      return response.data;
    } catch (error) {
      console.error(
        'Stripe Payment Intent Error:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        error.response?.data?.error?.message ||
          'Failed to create Stripe payment intent',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async createCheckoutSession(
    amount: number,
    currency: string = 'usd',
    successUrl: string,
    cancelUrl: string,
    customerEmail?: string,
    metadata: Record<string, string> = {},
  ): Promise<StripeCheckoutSessionResponse> {
    try {
      const params = new URLSearchParams({
        'payment_method_types[]': 'card',
        'line_items[0][price_data][currency]': currency,
        'line_items[0][price_data][product_data][name]': 'Car Wash Service',
        'line_items[0][price_data][unit_amount]': amount.toString(),
        'line_items[0][quantity]': '1',
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        ...Object.entries(metadata).reduce(
          (acc, [key, value]) => {
            acc[`metadata[${key}]`] = value;
            return acc;
          },
          {} as Record<string, string>,
        ),
      });

      if (customerEmail) {
        params.append('customer_email', customerEmail);
      }

      const response = await axios.post(
        `${this.baseUrl}/checkout/sessions`,
        params.toString(),
        { headers: this.getAuthHeaders() },
      );

      return response.data;
    } catch (error) {
      console.error(
        'Stripe Checkout Session Error:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        error.response?.data?.error?.message ||
          'Failed to create Stripe checkout session',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async retrievePaymentIntent(
    paymentIntentId: string,
  ): Promise<StripePaymentIntentResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/payment_intents/${paymentIntentId}`,
        { headers: this.getAuthHeaders() },
      );

      return response.data;
    } catch (error) {
      console.error(
        'Stripe Retrieve Payment Intent Error:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        'Failed to retrieve Stripe payment intent',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async retrieveCheckoutSession(
    sessionId: string,
  ): Promise<StripeCheckoutSessionResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/checkout/sessions/${sessionId}`,
        { headers: this.getAuthHeaders() },
      );

      return response.data;
    } catch (error) {
      console.error(
        'Stripe Retrieve Session Error:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        'Failed to retrieve Stripe checkout session',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async refundPayment(
    paymentIntentId: string,
    amount?: number,
    reason?: string,
  ): Promise<any> {
    try {
      const params = new URLSearchParams({
        payment_intent: paymentIntentId,
      });

      if (amount) {
        params.append('amount', amount.toString());
      }

      if (reason) {
        params.append('reason', reason);
      }

      const response = await axios.post(
        `${this.baseUrl}/refunds`,
        params.toString(),
        { headers: this.getAuthHeaders() },
      );

      return response.data;
    } catch (error) {
      console.error(
        'Stripe Refund Error:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        error.response?.data?.error?.message ||
          'Failed to process Stripe refund',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async constructWebhookEvent(
    payload: string,
    signature: string,
  ): Promise<any> {
    try {
      // In a real implementation, you would use Stripe's webhook signature verification
      // For now, we'll parse the payload directly
      const event = JSON.parse(payload);

      // Verify the signature here in production
      // stripe.webhooks.constructEvent(payload, signature, this.config.webhookSecret);

      return event;
    } catch (error) {
      console.error('Stripe Webhook Verification Error:', error);
      throw new HttpException(
        'Invalid webhook signature',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async processWebhookEvent(event: any): Promise<any> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          return {
            type: 'payment_success',
            paymentIntentId: event.data.object.id,
            amount: event.data.object.amount,
            currency: event.data.object.currency,
            metadata: event.data.object.metadata,
          };

        case 'payment_intent.payment_failed':
          return {
            type: 'payment_failed',
            paymentIntentId: event.data.object.id,
            failureReason: event.data.object.last_payment_error?.message,
            metadata: event.data.object.metadata,
          };

        case 'checkout.session.completed':
          return {
            type: 'checkout_completed',
            sessionId: event.data.object.id,
            paymentIntentId: event.data.object.payment_intent,
            amount: event.data.object.amount_total,
            currency: event.data.object.currency,
            metadata: event.data.object.metadata,
          };

        default:
          return {
            type: 'unhandled_event',
            eventType: event.type,
          };
      }
    } catch (error) {
      console.error('Stripe Webhook Processing Error:', error);
      throw new HttpException(
        'Failed to process Stripe webhook',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Convert amount to Stripe's expected format (cents)
  convertToStripeAmount(amount: number, currency: string = 'usd'): number {
    // Most currencies use cents (multiply by 100)
    // Some currencies like JPY don't use decimal places
    const zeroDecimalCurrencies = ['jpy', 'krw', 'vnd'];

    if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
      return Math.round(amount);
    }

    return Math.round(amount * 100);
  }

  // Convert from Stripe amount to regular amount
  convertFromStripeAmount(amount: number, currency: string = 'usd'): number {
    const zeroDecimalCurrencies = ['jpy', 'krw', 'vnd'];

    if (zeroDecimalCurrencies.includes(currency.toLowerCase())) {
      return amount;
    }

    return amount / 100;
  }
}
