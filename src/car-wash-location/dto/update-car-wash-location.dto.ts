import { PartialType } from '@nestjs/swagger';
import { CreateCarWashLocationDto } from './create-car-wash-location.dto';

export class UpdateCarWashLocationDto extends PartialType(
  CreateCarWashLocationDto,
) {}
