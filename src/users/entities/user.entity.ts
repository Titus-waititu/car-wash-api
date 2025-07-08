import { Booking } from 'src/bookings/entities/booking.entity';
import { Fleet } from 'src/fleet/entities/fleet.entity';
import { Review } from 'src/reviews/entities/review.entity';
import { Service } from 'src/services/entities/service.entity';
import { ServiceProviderStatus, UserRole } from 'src/types';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  username: string;

  @Column({ nullable: true })
  password: string;

  @Column()
  email: string;

  @Column({ nullable: true })
   phone_number: string;

     @Column({ nullable: true })
     profilePicture: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  // Location fields for location-based service discovery
  @Column({ nullable: true })
  address: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true, type: 'enum', enum: ServiceProviderStatus, default: ServiceProviderStatus.ONLINE })
  status: ServiceProviderStatus;

  @Column({ nullable: true })
  postal_code: string;

  // Vendor-specific fields
  @Column({ nullable: true })
  business_name: string;

  @Column({ nullable: true })
  business_license: string;

  @Column({ type: 'text', nullable: true })
  business_description: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  service_radius_km: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  commission_rate: number;

  @Column({ default: true })
  is_active: boolean;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  average_rating: number;

  @Column({ default: 0 })
  total_reviews: number;

  @Column({ type: 'text', nullable: true, default: null })
  hashedRefreshToken: string | null;

  @CreateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[];

  @OneToMany(() => Service, (service) => service.user)
  services: Service[];

  @OneToMany(() => Review, (review) => review.user)
  reviews: Review[];

  @OneToMany(() => Fleet, (fleet) => fleet.user)
  fleetVehicles: Fleet[];
}
