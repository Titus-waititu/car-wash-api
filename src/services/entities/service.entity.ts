import { Booking } from 'src/bookings/entities/booking.entity';
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

  // Service categorization and features
  @Column({ default: 'general' })
  category: string;

  @Column({ default: true })
  is_active: boolean;

  @Column({ nullable: true })
  image_url: string;

  // Price comparison features
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  original_price: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  discount_percentage: number;

  // Location-based service
  @Column({ type: 'json', nullable: true })
  service_areas: string[];

  @Column({ default: false })
  is_mobile_service: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  travel_charge_per_km: number;

  // Vehicle types supported
  @Column({ type: 'json', nullable: true })
  supported_vehicle_types: string[];

  // Service features
  @Column({ type: 'json', nullable: true })
  included_features: string[];

  @Column({ type: 'text', nullable: true })
  terms_and_conditions: string;

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

  @ManyToOne(() => User, (user) => user.services, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  user: Relation<User>;

  @OneToMany(() => Booking, (booking) => booking.service)
  @JoinColumn()
  bookings: Relation<Booking[]>;
}
