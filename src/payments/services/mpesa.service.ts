import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface MpesaConfig {
  consumerKey: string;
  consumerSecret: string;
  passkey: string;
  shortcode: string;
  environment: 'sandbox' | 'production';
  callbackUrl: string;
}

export interface MpesaAccessTokenResponse {
  access_token: string;
  expires_in: string;
}

export interface MpesaSTKPushResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export interface MpesaSTKQueryResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
}

@Injectable()
export class MpesaService {
  private config: MpesaConfig;
  private baseUrl: string;

  constructor(private configService: ConfigService) {
    this.config = {
      consumerKey: this.configService.get<string>('MPESA_CONSUMER_KEY', ''),
      consumerSecret: this.configService.get<string>(
        'MPESA_CONSUMER_SECRET',
        '',
      ),
      passkey: this.configService.get<string>('MPESA_PASSKEY', ''),
      shortcode: this.configService.get<string>('MPESA_SHORTCODE', '174379'),
      environment: this.configService.get<'sandbox' | 'production'>(
        'MPESA_ENVIRONMENT',
        'sandbox',
      ),
      callbackUrl: this.configService.get<string>(
        'MPESA_CALLBACK_URL',
        'https://yourdomain.com/api/payments/mpesa/callback',
      ),
    };

    this.baseUrl =
      this.config.environment === 'sandbox'
        ? 'https://sandbox.safaricom.co.ke'
        : 'https://api.safaricom.co.ke';
  }

  private async getAccessToken(): Promise<string> {
    try {
      const auth = Buffer.from(
        `${this.config.consumerKey}:${this.config.consumerSecret}`,
      ).toString('base64');

      const response = await axios.get(
        `${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {
          headers: {
            Authorization: `Basic ${auth}`,
          },
        },
      );

      const data: MpesaAccessTokenResponse = response.data;
      return data.access_token;
    } catch (error) {
      throw new HttpException(
        'Failed to get M-Pesa access token',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private generateTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}${hour}${minute}${second}`;
  }

  private generatePassword(timestamp: string): string {
    const data = `${this.config.shortcode}${this.config.passkey}${timestamp}`;
    return Buffer.from(data).toString('base64');
  }

  async initiateStkPush(
    phoneNumber: string,
    amount: number,
    accountReference: string,
    transactionDesc: string,
  ): Promise<MpesaSTKPushResponse> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(timestamp);

      // Format phone number (remove + and ensure it starts with 254)
      let formattedPhone = phoneNumber.replace(/\+/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '254' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('254')) {
        formattedPhone = '254' + formattedPhone;
      }

      const payload = {
        BusinessShortCode: this.config.shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amount),
        PartyA: formattedPhone,
        PartyB: this.config.shortcode,
        PhoneNumber: formattedPhone,
        CallBackURL: this.config.callbackUrl,
        AccountReference: accountReference,
        TransactionDesc: transactionDesc,
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpush/v1/processrequest`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error(
        'M-Pesa STK Push Error:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        error.response?.data?.errorMessage ||
          'Failed to initiate M-Pesa payment',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async queryStkStatus(
    checkoutRequestId: string,
  ): Promise<MpesaSTKQueryResponse> {
    try {
      const accessToken = await this.getAccessToken();
      const timestamp = this.generateTimestamp();
      const password = this.generatePassword(timestamp);

      const payload = {
        BusinessShortCode: this.config.shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      };

      const response = await axios.post(
        `${this.baseUrl}/mpesa/stkpushquery/v1/query`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data;
    } catch (error) {
      console.error(
        'M-Pesa STK Query Error:',
        error.response?.data || error.message,
      );
      throw new HttpException(
        'Failed to query M-Pesa payment status',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async processCallback(callbackData: any): Promise<any> {
    try {
      const { Body } = callbackData;
      const { stkCallback } = Body;

      return {
        merchantRequestId: stkCallback.MerchantRequestID,
        checkoutRequestId: stkCallback.CheckoutRequestID,
        resultCode: stkCallback.ResultCode,
        resultDesc: stkCallback.ResultDesc,
        amount: stkCallback.CallbackMetadata?.Item?.find(
          (item: any) => item.Name === 'Amount',
        )?.Value,
        mpesaReceiptNumber: stkCallback.CallbackMetadata?.Item?.find(
          (item: any) => item.Name === 'MpesaReceiptNumber',
        )?.Value,
        transactionDate: stkCallback.CallbackMetadata?.Item?.find(
          (item: any) => item.Name === 'TransactionDate',
        )?.Value,
        phoneNumber: stkCallback.CallbackMetadata?.Item?.find(
          (item: any) => item.Name === 'PhoneNumber',
        )?.Value,
      };
    } catch (error) {
      console.error('M-Pesa Callback Processing Error:', error);
      throw new HttpException(
        'Failed to process M-Pesa callback',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // Validate M-Pesa phone number format
  isValidPhoneNumber(phoneNumber: string): boolean {
    const phoneRegex = /^(\+254|254|0)[17]\d{8}$/;
    return phoneRegex.test(phoneNumber);
  }
}
