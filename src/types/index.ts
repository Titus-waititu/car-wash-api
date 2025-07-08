export enum UserRole {
  CUSTOMER = 'customer',
  VENDOR = 'vendor',
  ADMIN = 'admin',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum ServiceProviderStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy',
  UNAVAILABLE = 'unavailable',
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
  WAITING = 'WAITING',       
  IN_PROGRESS = 'IN_PROGRESS', 
  COMPLETED = 'COMPLETED',   
  CANCELLED = 'CANCELLED',  
}
