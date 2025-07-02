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
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { BookingStatus } from './entities/booking.entity';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'Booking created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  create(@Body(ValidationPipe) createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Get()
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
  @ApiOperation({ summary: 'Get booking statistics' })
  @ApiResponse({
    status: 200,
    description: 'Booking stats retrieved successfully.',
  })
  getStats() {
    return this.bookingsService.getBookingStats();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get bookings by user ID' })
  @ApiResponse({
    status: 200,
    description: 'User bookings retrieved successfully.',
  })
  findByUser(@Param('userId', ParseIntPipe) userId: number) {
    return this.bookingsService.findByUser(userId);
  }

  @Get('service/:serviceId')
  @ApiOperation({ summary: 'Get bookings by service ID' })
  @ApiResponse({
    status: 200,
    description: 'Service bookings retrieved successfully.',
  })
  findByService(@Param('serviceId', ParseIntPipe) serviceId: number) {
    return this.bookingsService.findByService(serviceId);
  }

  @Get('date-range')
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
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking updated successfully.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateBookingDto: UpdateBookingDto,
  ) {
    return this.bookingsService.update(id, updateBookingDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update booking status' })
  @ApiResponse({
    status: 200,
    description: 'Booking status updated successfully.',
  })
  @ApiResponse({ status: 400, description: 'Invalid status transition.' })
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: BookingStatus,
  ) {
    return this.bookingsService.updateBookingStatus(id, status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Booking not found.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.remove(id);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Create bulk booking for multiple vehicles' })
  @ApiResponse({
    status: 201,
    description: 'Bulk booking created successfully.',
  })
  createBulkBooking(@Body() bulkBookingData: any) {
    const bulkBookingId = `BULK_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    return this.bookingsService.createBulkBooking(
      bulkBookingData.bookings,
      bulkBookingId,
    );
  }

  @Get('bulk/:bulkId')
  @ApiOperation({ summary: 'Get bookings by bulk booking ID' })
  @ApiResponse({
    status: 200,
    description: 'Bulk bookings retrieved successfully.',
  })
  findBulkBookings(@Param('bulkId') bulkId: string) {
    return this.bookingsService.findBulkBookings(bulkId);
  }

  @Get('bulk-stats')
  @ApiOperation({ summary: 'Get bulk booking statistics' })
  @ApiResponse({
    status: 200,
    description: 'Bulk booking stats retrieved successfully.',
  })
  getBulkBookingStats() {
    return this.bookingsService.getBulkBookingStats();
  }

  @Patch(':id/location')
  @ApiOperation({ summary: 'Update booking service location' })
  @ApiResponse({
    status: 200,
    description: 'Booking location updated successfully.',
  })
  updateBookingLocation(
    @Param('id', ParseIntPipe) id: number,
    @Body() locationData: { latitude: number; longitude: number },
  ) {
    return this.bookingsService.updateBookingLocation(
      id,
      locationData.latitude,
      locationData.longitude,
    );
  }

  @Patch(':id/start')
  @ApiOperation({ summary: 'Start service for booking' })
  @ApiResponse({ status: 200, description: 'Service started successfully.' })
  startService(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.startService(id);
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: 'Complete service for booking' })
  @ApiResponse({ status: 200, description: 'Service completed successfully.' })
  completeService(
    @Param('id', ParseIntPipe) id: number,
    @Body() completionData?: { serviceNotes?: string },
  ) {
    return this.bookingsService.completeService(
      id,
      completionData?.serviceNotes,
    );
  }
}
