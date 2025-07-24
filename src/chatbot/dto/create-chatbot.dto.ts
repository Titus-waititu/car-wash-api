import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateChatbotDto {
  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsUUID()
  userId?: string;

  @IsOptional()
  @IsString()
  sessionId?: string;
}

export class ChatQueryDto {
  @IsNotEmpty()
  @IsString()
  query: string;

  @IsOptional()
  @IsUUID()
  userId?: string;
}
