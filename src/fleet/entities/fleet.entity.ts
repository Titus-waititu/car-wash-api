import { VehicleState, VehicleStatus, VehicleType } from 'src/types';
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

  // Basic vehicle identification
  @Column()
  plate_number: string;

  @Column()
  model: string;

  @Column({ type: 'enum', enum: VehicleType, default: VehicleType.Sedan })
  type: VehicleType;

  @Column({ nullable: true })
  image_url: string; // URL to vehicle image

  @Column({ nullable: true })
  color: string;

  @Column({ nullable: true })
  make: string;

  @Column({ nullable: true })
  year: number;

  @Column({ nullable: true })
  vin_number: string;

  @Column({ type: 'enum', enum: VehicleState, default: VehicleState.AVAILABLE })
  state: VehicleState;

  // Wash/service status tracking
  @Column({
    type: 'enum',
    enum: VehicleStatus,
    default: VehicleStatus.WAITING,
  })
  status: VehicleStatus;

  @Column({ nullable: true })
  last_service_date: Date;

  @Column({ nullable: true })
  next_service_due: Date;

  // Assignment (e.g., bay number or wash queue)
  @Column({ nullable: true })
  current_assignment: string;

  // Timestamps
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  // Relationship: Who owns the vehicle (usually a customer)
  @ManyToOne(() => User, (user) => user.fleetVehicles, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  user: Relation<User>;
}
