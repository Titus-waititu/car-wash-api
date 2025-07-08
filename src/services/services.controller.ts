import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  ParseFloatPipe,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('services')
@Public()
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({ status: 201, description: 'Service created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  create(@Body(ValidationPipe) createServiceDto: CreateServiceDto) {
    return this.servicesService.create(createServiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all services' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search services by name or description',
  })
  @ApiResponse({ status: 200, description: 'Services retrieved successfully.' })
  findAll(@Query('search') search?: string) {
    return this.servicesService.findAll(search);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get services by user ID' })
  @ApiResponse({
    status: 200,
    description: 'User services retrieved successfully.',
  })
  findByUser(@Param('userId') userId: string) {
    return this.servicesService.findByUser(userId);
  }

  @Get('price-range')
  @ApiOperation({ summary: 'Get services by price range' })
  @ApiQuery({ name: 'minPrice', required: true, description: 'Minimum price' })
  @ApiQuery({ name: 'maxPrice', required: true, description: 'Maximum price' })
  @ApiResponse({
    status: 200,
    description: 'Services in price range retrieved successfully.',
  })
  findByPriceRange(
    @Query('minPrice', ParseIntPipe) minPrice: number,
    @Query('maxPrice', ParseIntPipe) maxPrice: number,
  ) {
    return this.servicesService.findByPriceRange(minPrice, maxPrice);
  }

    @Get('compare/:category')
  @ApiOperation({ summary: 'Compare service prices by category' })
  @ApiQuery({ name: 'latitude', required: false, description: 'User latitude' })
  @ApiQuery({
    name: 'longitude',
    required: false,
    description: 'User longitude',
  })
  @ApiQuery({
    name: 'radius',
    required: false,
    description: 'Search radius in KM',
  })
  @ApiResponse({
    status: 200,
    description: 'Service price comparison retrieved successfully.',
  })
  compareServicePrices(
    @Param('category') category: string,
    @Query('latitude') latitude?: string,
    @Query('longitude') longitude?: string,
    @Query('radius') radius?: string,
  ) {
    const lat = latitude ? parseFloat(latitude) : undefined;
    const lng = longitude ? parseFloat(longitude) : undefined;
    const radiusKm = radius ? parseFloat(radius) : 10;

    return this.servicesService.compareServicePrices(
      category,
      lat,
      lng,
      radiusKm,
    );
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find services near location' })
  @ApiQuery({ name: 'latitude', required: true, description: 'Latitude' })
  @ApiQuery({ name: 'longitude', required: true, description: 'Longitude' })
  @ApiQuery({
    name: 'radius',
    required: false,
    description: 'Radius in KM (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Nearby services retrieved successfully.',
  })
  findNearbyServices(
    @Query('latitude', ParseFloatPipe) latitude: number,
    @Query('longitude', ParseFloatPipe) longitude: number,
    @Query('radius') radius?: string,
  ) {
    const radiusKm = radius ? parseFloat(radius) : 10;
    return this.servicesService.findServicesByLocation(
      latitude,
      longitude,
      radiusKm,
    );
  }

  @Get('mobile')
  @ApiOperation({ summary: 'Get mobile car wash services' })
  @ApiResponse({
    status: 200,
    description: 'Mobile services retrieved successfully.',
  })
  findMobileServices() {
    return this.servicesService.findMobileServices();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get service statistics' })
  @ApiResponse({
    status: 200,
    description: 'Service stats retrieved successfully.',
  })
  getServiceStats() {
    return this.servicesService.getServiceStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiResponse({ status: 200, description: 'Service retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update service by ID' })
  @ApiResponse({ status: 200, description: 'Service updated successfully.' })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateServiceDto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete service by ID' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Service not found.' })
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }


}
