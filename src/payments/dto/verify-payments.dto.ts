import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyMpesaPaymentDto {
  @ApiProperty({ description: 'M-Pesa checkout request ID' })
  @IsString()
  @IsNotEmpty()
  checkoutRequestId: string;
}

export class VerifyStripePaymentDto {
  @ApiProperty({ description: 'Stripe session ID or payment intent ID' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;
}

export class ProcessWebhookDto {
  @ApiProperty({ description: 'Webhook payload' })
  payload: any;

  @ApiProperty({ description: 'Webhook signature for verification' })
  @IsString()
  signature?: string;
}
