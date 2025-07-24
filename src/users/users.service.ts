import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ILike, Repository } from 'typeorm';
import { UserRole } from 'src/types';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}

  //helper methods 1
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  //helper methods 2
  private sanitizeUser(user: User): Partial<User> {
    const { password, hashedRefreshToken, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  async create(createUserDto: CreateUserDto): Promise<Partial<User>> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }
    try {
      if (createUserDto.password) {
        const hashedPassword = await this.hashPassword(createUserDto.password);
        const newUser = this.usersRepository.create({
          ...createUserDto,
          password: hashedPassword,
        });
        const savedUser = await this.usersRepository.save(newUser);
        return this.sanitizeUser(savedUser);
      }
      const newUser = this.usersRepository.create(createUserDto);
      const savedUser = await this.usersRepository.save(newUser);
      return this.sanitizeUser(savedUser);
    } catch (error) {
      throw new Error('Error creating user: ' + error.message);
    }
  }

  async findAll(search?: string): Promise<Partial<User>[] | string> {
    if (search) {
      const cleanedSearch = search.trim().toLowerCase();
      const users = await this.usersRepository.find({
        where: [
          { username: ILike(`%${cleanedSearch}%`) },
          { email: ILike(`%${cleanedSearch}%`) },
        ],
        order: {
          created_at: 'DESC',
        },
      });
      if (users.length === 0) {
        throw new Error('No users found matching the search criteria');
      }
      return users.map((user) => this.sanitizeUser(user));
    }
    const users = await this.usersRepository.find({
      order: {
        created_at: 'DESC',
      },
    });
    if (users.length === 0) {
      return 'No users found';
    }
    return users.map((user) => this.sanitizeUser(user));
  }

  async findOne(id: string): Promise<Partial<User>> {
    return await this.usersRepository
      .findOne({
        where: { id },
      })
      .then((user) => {
        if (!user) {
          throw new Error(`User with ID ${id} not found`);
        }
        return this.sanitizeUser(user);
      })
      .catch((error) => {
        throw new Error(`Error finding user with ID ${id}: ${error.message}`);
      });
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Partial<User>> {
    return await this.usersRepository
      .update(id, updateUserDto)
      .then(async (result) => {
        if (result.affected === 0) {
          throw new Error(`User with ID ${id} not found`);
        }
        const updatedUser = await this.usersRepository.findOne({
          where: { id },
        });
        if (!updatedUser) {
          throw new Error(`User with ID ${id} not found after update`);
        }
        return this.sanitizeUser(updatedUser);
      })
      .catch((error) => {
        throw new Error(`Error updating user with ID ${id}: ${error.message}`);
      });
  }

  async remove(id: string): Promise<{ message: string }> {
    return await this.usersRepository
      .delete(id)
      .then((result) => {
        if (result.affected === 0) {
          throw new Error(`User with ID ${id} not found`);
        }
        return { message: `User with ID ${id} successfully deleted` };
      })
      .catch((error) => {
        throw new Error(`Error deleting user with ID ${id}: ${error.message}`);
      });
  }

  async findByRole(role: UserRole): Promise<Partial<User>[]> {
    return await this.usersRepository
      .find({ where: { role } })
      .then((users) => users.map((user) => this.sanitizeUser(user)))
      .catch((error) => {
        throw new Error(`Error finding users by role: ${error.message}`);
      });
  }

  // Location-based service discovery
  async findVendorsNearLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
  ): Promise<Partial<User>[]> {
    return await this.usersRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.VENDOR })
      .andWhere('user.is_active = :active', { active: true })
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
      .orderBy(
        `(
          6371 * acos(
            cos(radians(:lat)) * cos(radians(user.latitude)) *
            cos(radians(user.longitude) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(user.latitude))
          )
        )`,
        'ASC',
      )
      .setParameters({ lat: latitude, lng: longitude })
      .getMany()
      .then((users) => users.map((user) => this.sanitizeUser(user)))
      .catch((error) => {
        throw new Error(
          `Error finding vendors near location: ${error.message}`,
        );
      });
  }

  async findVendorsByCity(city: string): Promise<Partial<User>[]> {
    return await this.usersRepository
      .find({
        where: {
          role: UserRole.VENDOR,
          city,
          is_active: true,
        },
      })
      .then((users) => users.map((user) => this.sanitizeUser(user)))
      .catch((error) => {
        throw new Error(`Error finding vendors by city: ${error.message}`);
      });
  }

  async getVendorStats(): Promise<any> {
    const [totalVendors, activeVendors, totalCustomers] = await Promise.all([
      this.usersRepository.count({ where: { role: UserRole.VENDOR } }),
      this.usersRepository.count({
        where: { role: UserRole.VENDOR, is_active: true },
      }),
      this.usersRepository.count({ where: { role: UserRole.CUSTOMER } }),
    ]);

    const avgRating = await this.usersRepository
      .createQueryBuilder('user')
      .select('AVG(user.average_rating)', 'avg_rating')
      .where('user.role = :role', { role: UserRole.VENDOR })
      .getRawOne();

    return {
      totalVendors,
      activeVendors,
      inactiveVendors: totalVendors - activeVendors,
      totalCustomers,
      averageVendorRating: parseFloat(avgRating.avg_rating) || 0,
    };
  }
}
