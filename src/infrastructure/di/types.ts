/**
 * Dependency Injection Types and Tokens
 *
 * This file defines symbolic tokens for dependency injection.
 * Using symbols ensures type safety and prevents naming collisions.
 */

/**
 * Repository tokens
 */
export const DI_TOKENS = {
  // Repositories
  EquipmentRepository: Symbol.for('EquipmentRepository'),
  MemberRepository: Symbol.for('MemberRepository'),
  RentalRepository: Symbol.for('RentalRepository'),
  ReservationRepository: Symbol.for('ReservationRepository'),

  // Services (Ports)
  PaymentService: Symbol.for('PaymentService'),
  NotificationService: Symbol.for('NotificationService'),
  EventPublisher: Symbol.for('EventPublisher'),

  // Infrastructure
  Logger: Symbol.for('Logger'),

  // Application Services
  RentalService: Symbol.for('RentalService'),
  ReservationService: Symbol.for('ReservationService'),

  // Command Handlers
  CreateRentalCommandHandler: Symbol.for('CreateRentalCommandHandler'),
  ReturnRentalCommandHandler: Symbol.for('ReturnRentalCommandHandler'),
  ExtendRentalCommandHandler: Symbol.for('ExtendRentalCommandHandler'),
  CreateReservationCommandHandler: Symbol.for('CreateReservationCommandHandler'),
  CancelReservationCommandHandler: Symbol.for('CancelReservationCommandHandler'),
  AssessDamageCommandHandler: Symbol.for('AssessDamageCommandHandler'),

  // Query Handlers
  GetAvailableEquipmentQueryHandler: Symbol.for('GetAvailableEquipmentQueryHandler'),
  GetRentalQueryHandler: Symbol.for('GetRentalQueryHandler'),
  GetMemberRentalsQueryHandler: Symbol.for('GetMemberRentalsQueryHandler'),
  GetOverdueRentalsQueryHandler: Symbol.for('GetOverdueRentalsQueryHandler'),
  GetEquipmentMaintenanceScheduleQueryHandler: Symbol.for(
    'GetEquipmentMaintenanceScheduleQueryHandler',
  ),

  // Controllers
  RentalController: Symbol.for('RentalController'),
  EquipmentController: Symbol.for('EquipmentController'),
  MemberController: Symbol.for('MemberController'),
  ReservationController: Symbol.for('ReservationController'),

  // Database
  PrismaClient: Symbol.for('PrismaClient'),
} as const;

/**
 * Type for DI token keys
 */
export type DIToken = (typeof DI_TOKENS)[keyof typeof DI_TOKENS];

/**
 * Lifecycle management for registered dependencies
 */
export const Lifecycle = {
  /**
   * A new instance is created every time it is resolved
   */
  Transient: 'transient',

  /**
   * A single instance is created and reused for all resolutions
   */
  Singleton: 'singleton',
} as const;

/**
 * Type for Lifecycle values
 */
export type Lifecycle = (typeof Lifecycle)[keyof typeof Lifecycle];

/**
 * Registration entry in the container
 */
export interface Registration<T = unknown> {
  token: symbol;
  factory: () => T;
  lifecycle: Lifecycle;
  instance?: T;
}
