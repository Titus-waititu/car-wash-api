import { Booking } from 'src/bookings/entities/booking.entity';
import { PaymentMethod, PaymentStatus } from 'src/types';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';

@Entity()
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: string;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CREDIT_CARD,
  })
  method: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  paid_at: Date;

  @OneToOne(() => Booking, (booking) => booking.payment, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  booking: Relation<Booking>;
}
