import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { VehicleStatus } from '../entities/fleet.entity';

export class CreateFleetDto {
  @IsString()
  @IsNotEmpty()
  plate_number: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsEnum(VehicleStatus)
  @IsNotEmpty()
  status: VehicleStatus;

  @IsNotEmpty()
  userId: number; 
}
