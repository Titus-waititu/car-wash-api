export enum UserRole {
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
  ADMIN = 'admin',
  FLEET_MANAGER = 'fleet_manager',
  SUPPORT_STAFF = 'support_staff',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum PaymentMethod {
  MPESA = 'MPesa',
  CREDIT_CARD = 'Card',
  CASH = 'Cash',
}

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum VehicleStatus {
  AVAILABLE = 'available',
  IN_SERVICE = 'in-service',
  DISPATCHED = 'dispatched',
}
