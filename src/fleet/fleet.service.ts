import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateFleetDto } from './dto/create-fleet.dto';
import { UpdateFleetDto } from './dto/update-fleet.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Fleet } from './entities/fleet.entity';
import { ILike, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { VehicleStatus } from 'src/types';

@Injectable()
export class FleetService {
  constructor(
    @InjectRepository(Fleet)
    private fleetRepository: Repository<Fleet>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createFleetDto: CreateFleetDto): Promise<Fleet> {
    const existingVehicle = await this.fleetRepository.findOne({
      where: { plate_number: createFleetDto.plate_number },
    });

    if (existingVehicle) {
      throw new ConflictException(
        `Vehicle with plate number ${createFleetDto.plate_number} already exists`,
      );
    }

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

  async findOne(id: string): Promise<Fleet> {
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

  async update(id: string, updateFleetDto: UpdateFleetDto): Promise<Fleet> {
    const vehicle = await this.findOne(id);

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

  async remove(id: string): Promise<{ message: string }> {
    const vehicle = await this.findOne(id);

    if (
      vehicle.status === VehicleStatus.IN_PROGRESS ||
      vehicle.status === VehicleStatus.WAITING
    ) {
      throw new ConflictException(
        'Cannot delete vehicle currently undergoing service or waiting',
      );
    }

    await this.fleetRepository.remove(vehicle);
    return { message: `Vehicle with ID ${id} successfully deleted` };
  }

  async findByUser(userId: string): Promise<Fleet[]> {
    return await this.fleetRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async updateVehicleStatus(id: string, status: VehicleStatus): Promise<Fleet> {
    const vehicle = await this.findOne(id);
    vehicle.status = status;
    return await this.fleetRepository.save(vehicle);
  }

  async getAvailableVehicles(): Promise<Fleet[]> {
    return await this.fleetRepository.find({
      where: { status: VehicleStatus.WAITING },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async getFleetStats(): Promise<any> {
    const [total, waiting, inProgress, completed] = await Promise.all([
      this.fleetRepository.count(),
      this.fleetRepository.count({ where: { status: VehicleStatus.WAITING } }),
      this.fleetRepository.count({ where: { status: VehicleStatus.IN_PROGRESS } }),
      this.fleetRepository.count({ where: { status: VehicleStatus.COMPLETED } }),
    ]);

    return {
      total,
      statusBreakdown: {
        waiting,
        inProgress,
        completed,
      },
    };
  }

  async scheduleMaintenanceReminder(
    id: string,
    nextMaintenanceDate: Date,
  ): Promise<Fleet> {
    const vehicle = await this.findOne(id);
    vehicle.next_service_due = nextMaintenanceDate;
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

  async findByType(type: string): Promise<Fleet[]> {
    return await this.fleetRepository.find({
      where: { type: ILike(`%${type}%`) },
      relations: ['user'],
    });
  }
}
