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
  ParseFloatPipe,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { FleetService } from './fleet.service';
import { CreateFleetDto } from './dto/create-fleet.dto';
import { UpdateFleetDto } from './dto/update-fleet.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { UserRole, VehicleStatus, VehicleType } from 'src/types';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { User } from 'src/users/entities/user.entity';

@ApiTags('fleet')
@UseGuards(RolesGuard)
@Controller('fleet')
export class FleetController {
  constructor(private readonly fleetService: FleetService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.VENDOR,UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Add a new vehicle to fleet' })
  @ApiResponse({ status: 201, description: 'Vehicle added successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({
    status: 409,
    description: 'Vehicle with plate number already exists.',
  })
  create(@Body(ValidationPipe) createFleetDto: CreateFleetDto) {
    return this.fleetService.create(createFleetDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get all fleet vehicles' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: VehicleStatus,
    description: 'Filter by vehicle status',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by plate number, model, or type',
  })
  @ApiResponse({
    status: 200,
    description: 'Fleet vehicles retrieved successfully.',
  })
  findAll(
    @Query('status') status?: VehicleStatus,
    @Query('search') search?: string,
  ) {
    return this.fleetService.findAll(status, search);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.VENDOR,UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get fleet statistics' })
  @ApiResponse({
    status: 200,
    description: 'Fleet stats retrieved successfully.',
  })
  getStats() {
    return this.fleetService.getFleetStats();
  }

  @Get('available')
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get available vehicles' })
  @ApiResponse({
    status: 200,
    description: 'Available vehicles retrieved successfully.',
  })
  getAvailableVehicles() {
    return this.fleetService.getAvailableVehicles();
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get vehicles by user ID' })
  @ApiResponse({
    status: 200,
    description: 'User vehicles retrieved successfully.',
  })
  findByUser(@Param('userId') userId: string) {
    return this.fleetService.findByUser(userId);
  }

  @Get('type/:type')
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get vehicles by type' })
  @ApiResponse({
    status: 200,
    description: 'Vehicles by type retrieved successfully.',
  })
  findByType(@Param('type') type: VehicleType) {
    return this.fleetService.findByType(type);
  }

  @Get('plate/:plateNumber')
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get vehicle by plate number' })
  @ApiResponse({ status: 200, description: 'Vehicle retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Vehicle not found.' })
  findByPlateNumber(@Param('plateNumber') plateNumber: string) {
    return this.fleetService.findByPlateNumber(plateNumber);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get vehicle by ID' })
  @ApiResponse({ status: 200, description: 'Vehicle retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Vehicle not found.' })
  findOne(@Param('id') id: string) {
    return this.fleetService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.VENDOR,UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Update vehicle by ID' })
  @ApiResponse({ status: 200, description: 'Vehicle updated successfully.' })
  @ApiResponse({ status: 404, description: 'Vehicle not found.' })
  @ApiResponse({ status: 409, description: 'Plate number already exists.' })
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateFleetDto: UpdateFleetDto,
  ) {
    return this.fleetService.update(id, updateFleetDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.VENDOR,UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Update vehicle status' })
  @ApiResponse({
    status: 200,
    description: 'Vehicle status updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Vehicle not found.' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: VehicleStatus,
  ) {
    return this.fleetService.updateVehicleStatus(id, status);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.VENDOR,UserRole.CUSTOMER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete vehicle by ID' })
  @ApiResponse({ status: 200, description: 'Vehicle deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Vehicle not found.' })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete vehicle in service.',
  })
  remove(@Param('id') id: string) {
    return this.fleetService.remove(id);
  }

  // @Patch(':id/location')
  // @ApiOperation({ summary: 'Update vehicle real-time location' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Vehicle location updated successfully.',
  // })
  // updateVehicleLocation(
  //   @Param('id') id: string,
  //   @Body() locationData: { latitude: number; longitude: number },
  // ) {
  //   return this.fleetService.updateVehicleLocation(
  //     id,
  //     locationData.latitude,
  //     locationData.longitude,
  //   );
  // }

  // @Get(':id/location')
  // @ApiOperation({ summary: 'Get vehicle current location' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Vehicle location retrieved successfully.',
  // })
  // getVehicleLocation(@Param('id') id: string) {
  //   return this.fleetService.getVehicleLocation(id);
  // }

  // @Get('nearby')
  // @ApiOperation({ summary: 'Find nearby available vehicles' })
  // @ApiQuery({ name: 'latitude', required: true, description: 'Latitude' })
  // @ApiQuery({ name: 'longitude', required: true, description: 'Longitude' })
  // @ApiQuery({
  //   name: 'radius',
  //   required: false,
  //   description: 'Radius in KM (default: 5)',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Nearby vehicles retrieved successfully.',
  // })
  // findNearbyVehicles(
  //   @Query('latitude', ParseFloatPipe) latitude: number,
  //   @Query('longitude', ParseFloatPipe) longitude: number,
  //   @Query('radius') radius?: string,
  // ) {
  //   const radiusKm = radius ? parseFloat(radius) : 5;
  //   return this.fleetService.findNearbyVehicles(latitude, longitude, radiusKm);
  // }

  @Get('maintenance/due')
  @Roles(UserRole.ADMIN, UserRole.VENDOR,UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get vehicles due for maintenance' })
  @ApiResponse({
    status: 200,
    description: 'Maintenance due vehicles retrieved successfully.',
  })
  getMaintenanceDueVehicles() {
    return this.fleetService.getMaintenanceDueVehicles();
  }

  @Patch(':id/maintenance')
  @Roles(UserRole.ADMIN, UserRole.VENDOR,UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Schedule maintenance reminder' })
  @ApiResponse({
    status: 200,
    description: 'Maintenance scheduled successfully.',
  })
  scheduleMaintenanceReminder(
    @Param('id') id: string,
    @Body() maintenanceData: { nextMaintenanceDate: string },
  ) {
    return this.fleetService.scheduleMaintenanceReminder(
      id,
      new Date(maintenanceData.nextMaintenanceDate),
    );
  }

  // @Patch(':id/expense')
  // @ApiOperation({ summary: 'Update daily expense for vehicle' })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Vehicle expense updated successfully.',
  // })
  // updateDailyExpense(
  //   @Param('id') id: string,
  //   @Body() expenseData: { expense: number },
  // ) {
  //   return this.fleetService.updateDailyExpense(id, expenseData.expense);
  // }

  // @Get('expense/report')
  // @ApiOperation({ summary: 'Get expense report for date range' })
  // @ApiQuery({ name: 'userId', required: true, description: 'User ID' })
  // @ApiQuery({
  //   name: 'startDate',
  //   required: true,
  //   description: 'Start date (YYYY-MM-DD)',
  // })
  // @ApiQuery({
  //   name: 'endDate',
  //   required: true,
  //   description: 'End date (YYYY-MM-DD)',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Expense report retrieved successfully.',
  // })
  // getExpenseReport(
  //   @Query('userId') userId: string,
  //   @Query('startDate') startDate: string,
  //   @Query('endDate') endDate: string,
  // ) {
  //   return this.fleetService.getExpenseReport(
  //     userId,
  //     new Date(startDate),
  //     new Date(endDate),
  //   );
  // }
}
