import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarWashLocation } from './entities/car-wash-location.entity';
import { CreateCarWashLocationDto } from './dto/create-car-wash-location.dto';
import { UpdateCarWashLocationDto } from './dto/update-car-wash-location.dto';
import { Service } from 'src/services/entities/service.entity';

@Injectable()
export class CarWashLocationService {
  constructor(
    @InjectRepository(CarWashLocation)
    private readonly locationRepo: Repository<CarWashLocation>,

    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
  ) {}

  async create(dto: CreateCarWashLocationDto): Promise<CarWashLocation> {
    const location = this.locationRepo.create(dto);
    return this.locationRepo.save(location);
  }

  async findAll(): Promise<CarWashLocation[]> {
    return this.locationRepo.find({ relations: ['services', 'vendors'] });
  }

  async findOne(id: string): Promise<CarWashLocation> {
    const location = await this.locationRepo.findOne({
      where: { id },
      relations: ['services', 'vendors'],
    });
    if (!location) throw new NotFoundException('Location not found');
    return location;
  }

  async update(
    id: string,
    dto: UpdateCarWashLocationDto,
  ): Promise<CarWashLocation> {
    const location = await this.findOne(id);
    Object.assign(location, dto);
    return this.locationRepo.save(location);
  }

  async remove(id: string): Promise<void> {
    const location = await this.findOne(id);
    await this.locationRepo.remove(location);
  }

  // 🔁 Attach services to location
  async attachServices(
    locationId: string,
    serviceIds: string[],
  ): Promise<CarWashLocation> {
    const location = await this.findOne(locationId);
    const services = await this.serviceRepo.findByIds(serviceIds);

    if (services.length !== serviceIds.length) {
      throw new NotFoundException('One or more services not found');
    }

    location.services = [...(location.services || []), ...services];
    return this.locationRepo.save(location);
  }

  // ❌ Detach a service
  async detachService(
    locationId: string,
    serviceId: string,
  ): Promise<CarWashLocation> {
    const location = await this.findOne(locationId);
    location.services = (location.services || []).filter(
      (s) => s.id !== serviceId,
    );
    return this.locationRepo.save(location);
  }

  // 🔍 List services for a location
  async getServicesForLocation(locationId: string): Promise<Service[]> {
    const location = await this.findOne(locationId);
    return location.services;
  }

  // 📍 Find nearby locations using latitude, longitude and radius
  async findNearby(
    latitude: number,
    longitude: number,
    radius: number = 10, // default radius in km
  ): Promise<CarWashLocation[]> {
    // Using Haversine formula to calculate distance
    // 6371 is Earth's radius in kilometers
    const distanceFormula = `(6371 * acos(
      cos(radians(:latitude)) * 
      cos(radians(location.latitude)) * 
      cos(radians(location.longitude) - radians(:longitude)) + 
      sin(radians(:latitude)) * 
      sin(radians(location.latitude))
    ))`;

    const query = this.locationRepo
      .createQueryBuilder('location')
      .addSelect(distanceFormula, 'distance')
      .where('location.latitude IS NOT NULL')
      .andWhere('location.longitude IS NOT NULL')
      .andWhere(`${distanceFormula} <= :radius`)
      .orderBy(distanceFormula, 'ASC')
      .setParameters({
        latitude,
        longitude,
        radius,
      });

    return query.getMany();
  }
}
