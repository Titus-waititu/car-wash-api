import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { ILike, Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<Service> {
    const user = await this.userRepository.findOne({
      where: { id: createServiceDto.userId },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${createServiceDto.userId} not found`,
      );
    }

    const newService = this.serviceRepository.create({
      ...createServiceDto,
      user,
    });

    return await this.serviceRepository.save(newService);
  }

  async findAll(search?: string): Promise<Service[]> {
    if (search) {
      const cleanedSearch = search.trim().toLowerCase();
      return await this.serviceRepository.find({
        where: [
          { name: ILike(`%${cleanedSearch}%`) },
          { description: ILike(`%${cleanedSearch}%`) },
        ],
        relations: ['user', 'reviews', 'locations', 'bookings'],
        order: { created_at: 'DESC' },
      });
    }

    return await this.serviceRepository.find({
      relations: ['user', 'reviews', 'bookings', 'locations'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id },
      relations: ['user', 'bookings', 'reviews', 'locations'],
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return service;
  }

  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
  ): Promise<Service> {
    const service = await this.findOne(id);

    if (updateServiceDto.userId) {
      const user = await this.userRepository.findOne({
        where: { id: updateServiceDto.userId },
      });

      if (!user) {
        throw new NotFoundException(
          `User with ID ${updateServiceDto.userId} not found`,
        );
      }

      service.user = user;
    }

    Object.assign(service, updateServiceDto);
    return await this.serviceRepository.save(service);
  }

  async remove(id: string): Promise<{ message: string }> {
    const service = await this.findOne(id);
    await this.serviceRepository.remove(service);
    return { message: `Service with ID ${id} successfully deleted` };
  }

  async findByUser(userId: string): Promise<Service[]> {
    return await this.serviceRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async findByPriceRange(
    minPrice: number,
    maxPrice: number,
  ): Promise<Service[]> {
    return await this.serviceRepository
      .createQueryBuilder('service')
      .where('service.price >= :minPrice AND service.price <= :maxPrice', {
        minPrice,
        maxPrice,
      })
      .leftJoinAndSelect('service.user', 'user')
      .orderBy('service.price', 'ASC')
      .getMany();
  }

  // Price comparison features
  async compareServicePrices(
    serviceCategory: string,
    userLatitude?: number,
    userLongitude?: number,
    radiusKm: number = 10,
  ): Promise<any[]> {
    let query = this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.user', 'user')
      .where('service.category = :category', { category: serviceCategory })
      .andWhere('service.is_active = :active', { active: true })
      .andWhere('user.is_active = :userActive', { userActive: true });

    // Add location filtering if coordinates provided
    if (userLatitude && userLongitude) {
      query = query.andWhere(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(user.latitude)) *
            cos(radians(user.longitude) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(user.latitude))
          )
        ) <= :radius`,
        { lat: userLatitude, lng: userLongitude, radius: radiusKm },
      );
    }

    const services = await query.orderBy('service.price', 'ASC').getMany();

    // Calculate savings and add comparison data
    return services.map((service, index) => {
      const discountedPrice = service.original_price
        ? service.price
        : service.price * (1 - service.discount_percentage / 100);

      return {
        ...service,
        finalPrice: discountedPrice,
        savings: service.original_price
          ? service.original_price - service.price
          : 0,
        priceRank: index + 1,
        isLowestPrice: index === 0,
        priceDifferenceFromLowest:
          index === 0 ? 0 : discountedPrice - services[0].price,
      };
    });
  }

  async findServicesByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
  ): Promise<Service[]> {
    return await this.serviceRepository
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.user', 'user')
      .where('service.is_active = :active', { active: true })
      .andWhere('user.is_active = :userActive', { userActive: true })
      .andWhere(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(user.latitude)) *
            cos(radians(user.longitude) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(user.latitude))
          )
        ) <= :radius`,
        { lat: latitude, lng: longitude, radius: radiusKm },
      )
      .orderBy('user.average_rating', 'DESC')
      .addOrderBy('service.price', 'ASC')
      .getMany();
  }

  async findMobileServices(): Promise<Service[]> {
    return await this.serviceRepository.find({
      where: { is_mobile_service: true, is_active: true },
      relations: ['user'],
      order: { average_rating: 'DESC' },
    });
  }

  async getServiceStats(): Promise<any> {
    const [total, active, mobile] = await Promise.all([
      this.serviceRepository.count(),
      this.serviceRepository.count({ where: { is_active: true } }),
      this.serviceRepository.count({ where: { is_mobile_service: true } }),
    ]);

    const categoryStats = await this.serviceRepository
      .createQueryBuilder('service')
      .select(
        'service.category, COUNT(*) as count, AVG(service.price) as avg_price',
      )
      .groupBy('service.category')
      .getRawMany();

    const priceStats = await this.serviceRepository
      .createQueryBuilder('service')
      .select(
        'MIN(service.price) as min_price, MAX(service.price) as max_price, AVG(service.price) as avg_price',
      )
      .getRawOne();

    return {
      total,
      active,
      inactive: total - active,
      mobile,
      categoryBreakdown: categoryStats.reduce((acc, stat) => {
        acc[stat.service_category] = {
          count: parseInt(stat.count),
          averagePrice: parseFloat(stat.avg_price) || 0,
        };
        return acc;
      }, {}),
      priceRange: {
        min: parseFloat(priceStats.min_price) || 0,
        max: parseFloat(priceStats.max_price) || 0,
        average: parseFloat(priceStats.avg_price) || 0,
      },
    };
  }
}
