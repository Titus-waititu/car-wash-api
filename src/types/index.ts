export enum UserRole {
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
  ADMIN = 'admin',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  EXPIRED = 'expired',
}

export enum ServiceProviderStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy',
  UNAVAILABLE = 'unavailable',
}

export enum ServiceCategory {
  ALL = 'all',
  Exterior = 'exterior',
  Interior = 'interior',
  Detailing = 'detail',
  Protection = 'protection',
}

export enum VehicleState {
  AVAILABLE = 'available',
  ARCHIVED = 'archived',
}

export enum VehicleType {
  Sedan = 'Sedan',
  SUV = 'SUV',
  Truck = 'Truck',
  Coupe = 'Coupe',
  Hatchback = 'Hatchback',
  Convertible = 'Convertible',
  Van = 'Van',
  Motorcycle = 'Motorcycle',
}

export enum PaymentMethod {
  MPESA = 'mpesa',
  STRIPE = 'stripe',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum VehicleStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}
