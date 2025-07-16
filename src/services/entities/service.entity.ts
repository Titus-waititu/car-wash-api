import { Booking } from 'src/bookings/entities/booking.entity';
import { Review } from 'src/reviews/entities/review.entity';
import { ServiceCategory } from 'src/types';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';

// Optional: Create Enums for better typing
export enum VehicleType {
  Sedan = 'Sedan',
  SUV = 'SUV',
  Truck = 'Truck',
  Van = 'Van',
  Motorcycle = 'Motorcycle',
  Other = 'Other',
}

export enum FeatureType {
  Vacuum = 'Vacuum',
  Wax = 'Wax',
  InteriorDetailing = 'Interior Detailing',
  TireShine = 'Tire Shine',
  EngineWash = 'Engine Wash',
  AirFreshener = 'Air Freshener',
}

@Entity()
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column()
  description: string;

  @Column()
  duration_minutes: number;

  @Column({
    type: 'enum',
    enum: ServiceCategory,
    default: ServiceCategory.Exterior,
  })
  category: ServiceCategory;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  image_url: string;

  // Price comparison
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  original_price: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discount_percentage: number;

  // Supported locations
  @Column({ type: 'json', nullable: true })
  service_areas: string[]; // e.g., ['Nairobi', 'Westlands']

  // Mobile service
  @Column({ default: false })
  is_mobile_service: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  travel_charge_per_km: number;

  // Vehicle compatibility
  @Column({ type: 'enum', enum: VehicleType, array: true, nullable: true })
  supported_vehicle_types: VehicleType[];

  // Features included in the service
  @Column({ type: 'enum', enum: FeatureType, array: true, nullable: true })
  included_features: FeatureType[];

  @Column({ type: 'text', nullable: true })
  terms_and_conditions: string;

  // Metrics
  @Column({ default: 0 })
  total_bookings: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  average_rating: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, (user) => user.services, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  user: Relation<User>;

  @OneToMany(() => Booking, (booking) => booking.service)
  bookings: Relation<Booking[]>;

  @OneToMany(() => Review, (review) => review.service, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  reviews: Relation<Review[]>;
}
