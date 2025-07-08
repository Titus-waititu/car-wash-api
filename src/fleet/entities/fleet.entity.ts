import { VehicleStatus } from 'src/types';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';

@Entity()
export class Fleet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  plate_number: string;

  @Column()
  model: string;

  @Column()
  type: string;

  @Column({
    type: 'enum',
    enum: VehicleStatus,
    default: VehicleStatus.WAITING,
  })
  status: string;

  // Real-time tracking fields
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  current_latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  current_longitude: number;

  @Column({ nullable: true })
  last_location_update: Date;

  // Vehicle details
  @Column({ nullable: true })
  make: string;

  @Column({ nullable: true })
  year: number;

  @Column({ nullable: true })
  color: string;

  @Column({ nullable: true })
  vin_number: string;

  // Maintenance and service tracking
  @Column({ nullable: true })
  last_maintenance_date: Date;

  @Column({ nullable: true })
  next_maintenance_date: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total_mileage: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fuel_capacity: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  fuel_efficiency: number;

  // Equipment and capacity
  @Column({ type: 'json', nullable: true })
  equipment_list: string[];

  @Column({ default: 1 })
  service_capacity: number;

  @Column({ nullable: true })
  current_assignment: string;

  @Column({ nullable: true })
  driver_name: string;

  @Column({ nullable: true })
  driver_phone: string;

  // Expense tracking
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  daily_expense: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  monthly_expense: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.fleetVehicles, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  user: Relation<User>;
}
