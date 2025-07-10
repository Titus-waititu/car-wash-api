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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('users')
@Public()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 409, description: 'User with email already exists.' })
  create(@Body(ValidationPipe) createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search users by username or email',
  })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully.' })
  findAll(@Query('search') search?: string) {
    if (search) {
      return this.usersService.findAll(search);
    }
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Get('vendors/nearby')
  @ApiOperation({ summary: 'Find vendors near location' })
  @ApiQuery({ name: 'latitude', required: true, description: 'Latitude' })
  @ApiQuery({ name: 'longitude', required: true, description: 'Longitude' })
  @ApiQuery({
    name: 'radius',
    required: false,
    description: 'Radius in KM (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'Nearby vendors retrieved successfully.',
  })
  findVendorsNearby(
    @Query('latitude', ParseFloatPipe) latitude: number,
    @Query('longitude', ParseFloatPipe) longitude: number,
    @Query('radius') radius?: string,
  ) {
    const radiusKm = radius ? parseFloat(radius) : 10;
    return this.usersService.findVendorsNearLocation(
      latitude,
      longitude,
      radiusKm,
    );
  }

  @Get('vendors/city/:city')
  @ApiOperation({ summary: 'Find vendors by city' })
  @ApiResponse({
    status: 200,
    description: 'Vendors by city retrieved successfully.',
  })
  findVendorsByCity(@Param('city') city: string) {
    return this.usersService.findVendorsByCity(city);
  }

  @Get('vendors/stats')
  @ApiOperation({ summary: 'Get vendor statistics' })
  @ApiResponse({
    status: 200,
    description: 'Vendor stats retrieved successfully.',
  })
  getVendorStats() {
    return this.usersService.getVendorStats();
  }

  @Get('role/:role')
  @ApiOperation({ summary: 'Get users by role' })
  @ApiResponse({
    status: 200,
    description: 'Users by role retrieved successfully.',
  })
  findByRole(@Param('role') role: string) {
    return this.usersService.findByRole(role as any);
  }
}
