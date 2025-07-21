import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'The token for password reset',
    example: '1234567890abcdef',
  })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({
    description: 'The new password for the user',
    example: 'newPassword123',
  })
  @IsNotEmpty()
  @IsString()
  newPassword: string;

  @ApiProperty({
    description: 'Confirmation of the new password',
    example: 'newPassword123',
  })
  @IsNotEmpty()
  @IsString()
  confirmPassword: string;
}