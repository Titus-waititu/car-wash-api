import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsNotEmpty()
  comment: string;

  @IsOptional()
  isReply?: boolean;
  
  @IsNotEmpty()
  userId: string; 

  @IsNotEmpty()
  serviceId: string; 
}
