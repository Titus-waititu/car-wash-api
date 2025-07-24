// attach-services.dto.ts
import { IsArray, IsUUID } from 'class-validator';

export class AttachServicesDto {
  @IsArray()
  @IsUUID('all', { each: true })
  serviceIds: string[];
}
