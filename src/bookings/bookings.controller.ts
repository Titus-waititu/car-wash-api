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
  UseGuards,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingStatus } from './entities/booking.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/types';

@UseGuards(RolesGuard)
@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Roles(UserRole.ADMIN,UserRole.VENDOR,UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'Booking created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  create(@Body(ValidationPipe) createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
  @Roles(UserRole.ADMIN,UserRole.VENDOR,UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get all bookings' })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: BookingStatus,
    description: 'Filter by booking status',
  })
  @ApiResponse({ status: 200, description: 'Bookings retrieved successfully.' })
  findAll(@Query('status') status?: BookingStatus) {
    return this.bookingsService.findAll(status);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN,UserRole.VENDOR,UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get booking statistics' })
  @ApiResponse({
    status: 200,
    description: 'Booking stats retrieved successfully.',
  })
  getStats() {
    return this.bookingsService.getBookingStats();
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get bookings by user ID' })
  @ApiResponse({
    status: 200,
    description: 'User bookings retrieved successfully.',
  })
  findByUser(@Param('userId') userId: string) {
    return this.bookingsService.findByUser(userId);
  }

  @Get('service/:serviceId')
  @Roles(UserRole.ADMIN,UserRole.VENDOR,UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get bookings by service ID' })
  @ApiResponse({
    status: 200,
    description: 'Service bookings retrieved successfully.',
  })
  findByService(@Param('serviceId') serviceId: string) {
    return this.bookingsService.findByService(serviceId);
  }

  @Get('date-range')
  @Roles(UserRole.ADMIN,UserRole.VENDOR,UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get bookings by date range' })
  @ApiQuery({
    name: 'startDate',
    required: true,
    description: 'Start date (ISO string)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    description: 'End date (ISO string)',
  })
  @ApiResponse({
    status: 200,
    description: 'Bookings in date range retrieved successfully.',
  })
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.bookingsService.findByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN,UserRole.VENDOR,UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Update booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking updated successfully.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateBookingDto: UpdateBookingDto,
  ) {
    return this.bookingsService.update(id, updateBookingDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN,UserRole.VENDOR,UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Update booking status' })
  @ApiResponse({
    status: 200,
    description: 'Booking status updated successfully.',
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition.' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: BookingStatus,
  ) {
    return this.bookingsService.updateBookingStatus(id, status);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  remove(@Param('id') id: string) {
    return this.bookingsService.remove(id);
  }


  @Patch(':id/start')
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @ApiOperation({ summary: 'Start service for booking' })
  @ApiResponse({ status: 200, description: 'Service started successfully.' })
  startService(@Param('id') id: string) {
    return this.bookingsService.startService(id);
  }

  @Patch(':id/complete')
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @ApiOperation({ summary: 'Complete service for booking' })
  @ApiResponse({ status: 200, description: 'Service completed successfully.' })
  completeService(
    @Param('id') id: string,
    @Body() completionData?: { serviceNotes?: string },
  ) {
    return this.bookingsService.completeService(
      id,
      completionData?.serviceNotes,
    );
  }
}
