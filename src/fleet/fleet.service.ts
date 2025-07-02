import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateFleetDto } from './dto/create-fleet.dto';
import { UpdateFleetDto } from './dto/update-fleet.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Fleet, VehicleStatus } from './entities/fleet.entity';
import { ILike, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class FleetService {
  constructor(
    @InjectRepository(Fleet)
    private fleetRepository: Repository<Fleet>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createFleetDto: CreateFleetDto): Promise<Fleet> {
    // Check if plate number already exists
    const existingVehicle = await this.fleetRepository.findOne({
      where: { plate_number: createFleetDto.plate_number },
    });

    if (existingVehicle) {
      throw new ConflictException(
        `Vehicle with plate number ${createFleetDto.plate_number} already exists`,
      );
    }

    // Validate user exists
    const user = await this.userRepository.findOne({
      where: { id: createFleetDto.userId },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${createFleetDto.userId} not found`,
      );
    }

    const newVehicle = this.fleetRepository.create({
      ...createFleetDto,
      user,
    });

    return await this.fleetRepository.save(newVehicle);
  }

  async findAll(status?: VehicleStatus, search?: string): Promise<Fleet[]> {
    const queryBuilder = this.fleetRepository
      .createQueryBuilder('fleet')
      .leftJoinAndSelect('fleet.user', 'user')
      .orderBy('fleet.created_at', 'DESC');

    if (status) {
      queryBuilder.andWhere('fleet.status = :status', { status });
    }

    if (search) {
      const cleanedSearch = search.trim().toLowerCase();
      queryBuilder.andWhere(
        '(LOWER(fleet.plate_number) LIKE :search OR LOWER(fleet.model) LIKE :search OR LOWER(fleet.type) LIKE :search)',
        { search: `%${cleanedSearch}%` },
      );
    }

    return await queryBuilder.getMany();
  }

  async findOne(id: number): Promise<Fleet> {
    const vehicle = await this.fleetRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    return vehicle;
  }

  async findByPlateNumber(plateNumber: string): Promise<Fleet> {
    const vehicle = await this.fleetRepository.findOne({
      where: { plate_number: plateNumber },
      relations: ['user'],
    });

    if (!vehicle) {
      throw new NotFoundException(
        `Vehicle with plate number ${plateNumber} not found`,
      );
    }

    return vehicle;
  }

  async update(id: number, updateFleetDto: UpdateFleetDto): Promise<Fleet> {
    const vehicle = await this.findOne(id);

    // Check if plate number is being updated and if it already exists
    if (
      updateFleetDto.plate_number &&
      updateFleetDto.plate_number !== vehicle.plate_number
    ) {
      const existingVehicle = await this.fleetRepository.findOne({
        where: { plate_number: updateFleetDto.plate_number },
      });

      if (existingVehicle) {
        throw new ConflictException(
          `Vehicle with plate number ${updateFleetDto.plate_number} already exists`,
        );
      }
    }

    // Validate user if being updated
    if (updateFleetDto.userId) {
      const user = await this.userRepository.findOne({
        where: { id: updateFleetDto.userId },
      });

      if (!user) {
        throw new NotFoundException(
          `User with ID ${updateFleetDto.userId} not found`,
        );
      }

      vehicle.user = user;
    }

    Object.assign(vehicle, updateFleetDto);
    return await this.fleetRepository.save(vehicle);
  }

  async remove(id: number): Promise<{ message: string }> {
    const vehicle = await this.findOne(id);

    // Check if vehicle can be deleted (not in service or dispatched)
    if (
      vehicle.status === VehicleStatus.IN_SERVICE ||
      vehicle.status === VehicleStatus.DISPATCHED
    ) {
      throw new ConflictException(
        'Cannot delete vehicle that is currently in service or dispatched',
      );
    }

    await this.fleetRepository.remove(vehicle);
    return { message: `Vehicle with ID ${id} successfully deleted` };
  }

  async findByUser(userId: number): Promise<Fleet[]> {
    return await this.fleetRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async updateVehicleStatus(id: number, status: VehicleStatus): Promise<Fleet> {
    const vehicle = await this.findOne(id);
    vehicle.status = status;
    return await this.fleetRepository.save(vehicle);
  }

  async getAvailableVehicles(): Promise<Fleet[]> {
    return await this.fleetRepository.find({
      where: { status: VehicleStatus.AVAILABLE },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async getFleetStats(): Promise<any> {
    const [total, available, inService, dispatched] = await Promise.all([
      this.fleetRepository.count(),
      this.fleetRepository.count({
        where: { status: VehicleStatus.AVAILABLE },
      }),
      this.fleetRepository.count({
        where: { status: VehicleStatus.IN_SERVICE },
      }),
      this.fleetRepository.count({
        where: { status: VehicleStatus.DISPATCHED },
      }),
    ]);

    const expenseStats = await this.fleetRepository
      .createQueryBuilder('fleet')
      .select('SUM(fleet.daily_expense) as total_daily_expense')
      .addSelect('SUM(fleet.monthly_expense) as total_monthly_expense')
      .addSelect('AVG(fleet.fuel_efficiency) as avg_fuel_efficiency')
      .getRawOne();

    return {
      total,
      statusBreakdown: {
        available,
        inService,
        dispatched,
      },
      expenses: {
        totalDailyExpense: parseFloat(expenseStats.total_daily_expense) || 0,
        totalMonthlyExpense:
          parseFloat(expenseStats.total_monthly_expense) || 0,
        averageFuelEfficiency:
          parseFloat(expenseStats.avg_fuel_efficiency) || 0,
      },
    };
  }

  // Real-time vehicle tracking
  async updateVehicleLocation(
    id: number,
    latitude: number,
    longitude: number,
  ): Promise<Fleet> {
    const vehicle = await this.findOne(id);

    vehicle.current_latitude = latitude;
    vehicle.current_longitude = longitude;
    vehicle.last_location_update = new Date();

    return await this.fleetRepository.save(vehicle);
  }

  async getVehicleLocation(id: number): Promise<{
    latitude: number;
    longitude: number;
    lastUpdate: Date;
  }> {
    const vehicle = await this.findOne(id);

    return {
      latitude: vehicle.current_latitude,
      longitude: vehicle.current_longitude,
      lastUpdate: vehicle.last_location_update,
    };
  }

  async findNearbyVehicles(
    latitude: number,
    longitude: number,
    radiusKm: number = 5,
  ): Promise<Fleet[]> {
    return await this.fleetRepository
      .createQueryBuilder('fleet')
      .where('fleet.status = :status', { status: VehicleStatus.AVAILABLE })
      .andWhere('fleet.current_latitude IS NOT NULL')
      .andWhere('fleet.current_longitude IS NOT NULL')
      .andWhere(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(fleet.current_latitude)) *
            cos(radians(fleet.current_longitude) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(fleet.current_latitude))
          )
        ) <= :radius`,
        { lat: latitude, lng: longitude, radius: radiusKm },
      )
      .leftJoinAndSelect('fleet.user', 'user')
      .orderBy(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(fleet.current_latitude)) *
            cos(radians(fleet.current_longitude) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(fleet.current_latitude))
          )
        )`,
        'ASC',
      )
      .setParameters({ lat: latitude, lng: longitude })
      .getMany();
  }

  // Maintenance scheduling
  async scheduleMaintenanceReminder(
    id: number,
    nextMaintenanceDate: Date,
  ): Promise<Fleet> {
    const vehicle = await this.findOne(id);

    vehicle.next_maintenance_date = nextMaintenanceDate;

    return await this.fleetRepository.save(vehicle);
  }

  async getMaintenanceDueVehicles(): Promise<Fleet[]> {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    return await this.fleetRepository
      .createQueryBuilder('fleet')
      .where('fleet.next_maintenance_date <= :nextWeek', { nextWeek })
      .leftJoinAndSelect('fleet.user', 'user')
      .orderBy('fleet.next_maintenance_date', 'ASC')
      .getMany();
  }

  // Expense management
  async updateDailyExpense(id: number, expense: number): Promise<Fleet> {
    const vehicle = await this.findOne(id);

    vehicle.daily_expense = expense;

    return await this.fleetRepository.save(vehicle);
  }

  async getExpenseReport(
    userId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const vehicles = await this.fleetRepository.find({
      where: { user: { id: userId } },
    });

    const totalExpenses = vehicles.reduce((sum, vehicle) => {
      const days = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      return sum + vehicle.daily_expense * days;
    }, 0);

    return {
      period: { startDate, endDate },
      totalVehicles: vehicles.length,
      totalExpenses,
      averageExpensePerVehicle:
        vehicles.length > 0 ? totalExpenses / vehicles.length : 0,
      vehicleBreakdown: vehicles.map((vehicle) => ({
        id: vehicle.id,
        plateNumber: vehicle.plate_number,
        model: vehicle.model,
        dailyExpense: vehicle.daily_expense,
        estimatedPeriodExpense:
          vehicle.daily_expense *
          Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
          ),
      })),
    };
  }

  async findByType(type: string): Promise<Fleet[]> {
    return await this.fleetRepository.find({
      where: { type: ILike(`%${type}%`) },
      relations: ['user'],
    });
  }
}
