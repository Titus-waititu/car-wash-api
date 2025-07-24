import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAuthDto {
  @ApiProperty({
    description: 'The username of the user',
    example: 'user123',
  })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'user@gmail.com',
  })
  @IsNotEmpty()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'The password for the user account',
    example: 'strongpassword123',
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
