import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { CarWashLocationService } from './car-wash-location.service';
import { CreateCarWashLocationDto } from './dto/create-car-wash-location.dto';
import { UpdateCarWashLocationDto } from './dto/update-car-wash-location.dto';
import { AttachServicesDto } from './dto/attach-services.dto';
import { ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/types';

@ApiTags('Car Wash Locations')
@UseGuards(RolesGuard)
@Controller('locations')
export class CarWashLocationController {
  constructor(private readonly locationService: CarWashLocationService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  create(@Body() dto: CreateCarWashLocationDto) {
    return this.locationService.create(dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER)
  findAll() {
    return this.locationService.findAll();
  }

  // 📍 Get nearby locations
  @Get('nearby')
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER)
  findNearby(
    @Query('latitude') latitude: string,
    @Query('longitude') longitude: string,
    @Query('radius') radius?: string,
  ) {
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const rad = radius ? parseFloat(radius) : 10; // default 10km

    if (isNaN(lat) || isNaN(lng) || isNaN(rad)) {
      throw new BadRequestException(
        'Invalid latitude, longitude, or radius parameters',
      );
    }

    return this.locationService.findNearby(lat, lng, rad);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER)
  findOne(@Param('id') id: string) {
    return this.locationService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  update(@Param('id') id: string, @Body() dto: UpdateCarWashLocationDto) {
    return this.locationService.update(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  remove(@Param('id') id: string) {
    return this.locationService.remove(id);
  }

  // 🔁 Attach multiple services to a location
  @Post(':id/attach-services')
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  attachServices(@Param('id') id: string, @Body() dto: AttachServicesDto) {
    return this.locationService.attachServices(id, dto.serviceIds);
  }

  // ❌ Detach a single service
  @Delete(':id/detach-service/:serviceId')
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  detachService(
    @Param('id') id: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.locationService.detachService(id, serviceId);
  }

  // 🔍 Get all services offered at a location
  @Get(':id/services')
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER)
  getServices(@Param('id') id: string) {
    return this.locationService.getServicesForLocation(id);
  }
}
