import { DI_TOKENS, Lifecycle, Registration } from './types.js';

// Domain Ports
import { EquipmentRepository } from '../../domain/ports/EquipmentRepository.js';
import { MemberRepository } from '../../domain/ports/MemberRepository.js';
import { RentalRepository } from '../../domain/ports/RentalRepository.js';
import { ReservationRepository } from '../../domain/ports/ReservationRepository.js';
import { PaymentService } from '../../domain/ports/PaymentService.js';
import { NotificationService } from '../../domain/ports/NotificationService.js';
import { EventPublisher } from '../../domain/ports/EventPublisher.js';
import { PaymentIntentRepository } from '../../domain/ports/PaymentIntentRepository.js';

// Application Services
import { RentalService } from '../../application/services/RentalService.js';
import { ReservationService } from '../../application/services/ReservationService.js';

// Command Handlers
import { CreateRentalCommandHandler } from '../../application/commands/rental/CreateRentalCommand.js';
import { ReturnRentalCommandHandler } from '../../application/commands/rental/ReturnRentalCommand.js';
import { ExtendRentalCommandHandler } from '../../application/commands/rental/ExtendRentalCommand.js';
import { CreateReservationCommandHandler } from '../../application/commands/reservation/CreateReservationCommand.js';
import { CancelReservationCommandHandler } from '../../application/commands/reservation/CancelReservationCommand.js';
import { AssessDamageCommandHandler } from '../../application/commands/damage/AssessDamageCommand.js';

// Query Handlers
import { GetAvailableEquipmentQueryHandler } from '../../application/queries/GetAvailableEquipmentQuery.js';
import { GetRentalQueryHandler } from '../../application/queries/GetRentalQuery.js';
import { GetMemberRentalsQueryHandler } from '../../application/queries/GetMemberRentalsQuery.js';
import { GetOverdueRentalsQueryHandler } from '../../application/queries/GetOverdueRentalsQuery.js';
import { GetEquipmentMaintenanceScheduleQueryHandler } from '../../application/queries/GetEquipmentMaintenanceScheduleQuery.js';

// Adapters - Persistence (In-Memory)
import { InMemoryEquipmentRepository } from '../../adapters/outbound/persistence/InMemoryEquipmentRepository.js';
import { InMemoryMemberRepository } from '../../adapters/outbound/persistence/InMemoryMemberRepository.js';
import { InMemoryRentalRepository } from '../../adapters/outbound/persistence/InMemoryRentalRepository.js';
import { InMemoryReservationRepository } from '../../adapters/outbound/persistence/InMemoryReservationRepository.js';
import { InMemoryPaymentIntentRepository } from '../../adapters/outbound/persistence/InMemoryPaymentIntentRepository.js';

// Adapters - Persistence (Prisma)
import { PrismaEquipmentRepository } from '../../adapters/outbound/persistence/PrismaEquipmentRepository.js';
import { PrismaMemberRepository } from '../../adapters/outbound/persistence/PrismaMemberRepository.js';
import { PrismaRentalRepository } from '../../adapters/outbound/persistence/PrismaRentalRepository.js';
import { PrismaReservationRepository } from '../../adapters/outbound/persistence/PrismaReservationRepository.js';
import { PrismaPaymentIntentRepository } from '../../adapters/outbound/persistence/PrismaPaymentIntentRepository.js';

// Adapters - Services
import { MockPaymentService } from '../../adapters/outbound/payment/MockPaymentService.js';
import { StripePaymentService } from '../../adapters/outbound/payment/StripePaymentService.js';
import { ConsoleNotificationService } from '../../adapters/outbound/notification/ConsoleNotificationService.js';
import { EmailNotificationService } from '../../adapters/outbound/notification/EmailNotificationService.js';
import { InMemoryEventPublisher } from '../../adapters/outbound/events/InMemoryEventPublisher.js';

// Infrastructure
import { createLogger } from '../logging/Logger.js';
import { LoggingConfig } from '../config/Config.js';

// Controllers
import { RentalController } from '../../adapters/inbound/http/controllers/RentalController.js';
import { EquipmentController } from '../../adapters/inbound/http/controllers/EquipmentController.js';
import { MemberController } from '../../adapters/inbound/http/controllers/MemberController.js';
import { ReservationController } from '../../adapters/inbound/http/controllers/ReservationController.js';

// Prisma Client
import { PrismaClient } from '@prisma/client';

/**
 * Configuration options for the DI Container
 */
export interface ContainerConfig {
  /**
   * Use in-memory adapters (for testing) or real adapters (for production)
   */
  useInMemoryAdapters?: boolean;

  /**
   * Use mock payment service or Stripe
   */
  useMockPayment?: boolean;

  /**
   * Use console notification or email notification
   */
  useConsoleNotification?: boolean;

  /**
   * Stripe configuration (required if useMockPayment is false)
   */
  stripeConfig?: {
    apiKey: string;
    apiVersion?: string;
  };

  /**
   * Email service configuration (required if useConsoleNotification is false)
   */
  emailConfig?: {
    fromAddress: string;
    fromName: string;
    replyTo?: string;
    bccAddresses?: string[];
    enableHtml: boolean;
  };

  /**
   * Logging configuration (required)
   */
  loggingConfig?: LoggingConfig;

  /**
   * Prisma client instance (optional, will be created if not provided)
   */
  prismaClient?: PrismaClient;
}

/**
 * Dependency Injection Container
 *
 * This container manages the lifecycle of all dependencies in the application.
 * It supports both singleton and transient dependencies.
 */
export class Container {
  private registrations = new Map<symbol, Registration>();
  private config: ContainerConfig;
  private prismaClient?: PrismaClient;

  constructor(config: ContainerConfig = {}) {
    this.config = {
      useInMemoryAdapters: config.useInMemoryAdapters ?? true,
      useMockPayment: config.useMockPayment ?? true,
      useConsoleNotification: config.useConsoleNotification ?? true,
      ...config,
    };
  }

  /**
   * Initialize all dependencies
   * This method should be called once during application startup
   */
  public async initialize(): Promise<void> {
    // Register logger first (needed by other components)
    this.registerLogger();

    // Initialize Prisma client if using database adapters
    if (!this.config.useInMemoryAdapters) {
      this.prismaClient = this.config.prismaClient ?? new PrismaClient();
      await this.prismaClient.$connect();
      this.registerSingleton(DI_TOKENS.PrismaClient, () => this.prismaClient!);
    }

    // Register repositories
    this.registerRepositories();

    // Register services (ports)
    this.registerServices();

    // Register application services
    this.registerApplicationServices();

    // Register command handlers
    this.registerCommandHandlers();

    // Register query handlers
    this.registerQueryHandlers();

    // Register controllers
    this.registerControllers();
  }

  /**
   * Dispose of all resources and close connections
   */
  public async dispose(): Promise<void> {
    if (this.prismaClient) {
      await this.prismaClient.$disconnect();
      this.prismaClient = undefined;
    }

    // Clear all registrations
    this.registrations.clear();
  }

  /**
   * Register logger
   */
  private registerLogger(): void {
    const loggingConfig = this.config.loggingConfig ?? {
      level: 'info',
      format: 'text',
      destination: 'console',
    };

    this.registerSingleton(DI_TOKENS.Logger, () => createLogger(loggingConfig));
  }

  /**
   * Register repositories based on configuration
   */
  private registerRepositories(): void {
    if (this.config.useInMemoryAdapters) {
      // In-memory adapters (for testing)
      this.registerSingleton(
        DI_TOKENS.EquipmentRepository,
        () => new InMemoryEquipmentRepository(),
      );
      this.registerSingleton(DI_TOKENS.MemberRepository, () => new InMemoryMemberRepository());
      this.registerSingleton(DI_TOKENS.RentalRepository, () => new InMemoryRentalRepository());
      this.registerSingleton(
        DI_TOKENS.ReservationRepository,
        () => new InMemoryReservationRepository(),
      );
      this.registerSingleton(
        DI_TOKENS.PaymentIntentRepository,
        () => new InMemoryPaymentIntentRepository(),
      );
    } else {
      // Prisma adapters (for production)
      const prisma = this.resolve<PrismaClient>(DI_TOKENS.PrismaClient);
      this.registerSingleton(
        DI_TOKENS.EquipmentRepository,
        () => new PrismaEquipmentRepository(prisma),
      );
      this.registerSingleton(DI_TOKENS.MemberRepository, () => new PrismaMemberRepository(prisma));
      this.registerSingleton(DI_TOKENS.RentalRepository, () => new PrismaRentalRepository(prisma));
      this.registerSingleton(
        DI_TOKENS.ReservationRepository,
        () => new PrismaReservationRepository(prisma),
      );
      this.registerSingleton(
        DI_TOKENS.PaymentIntentRepository,
        () => new PrismaPaymentIntentRepository(prisma),
      );
    }
  }

  /**
   * Register services (ports) based on configuration
   */
  private registerServices(): void {
    // Payment service
    if (this.config.useMockPayment) {
      this.registerSingleton(DI_TOKENS.PaymentService, () => new MockPaymentService());
    } else {
      if (!this.config.stripeConfig) {
        throw new Error('Stripe configuration is required when useMockPayment is false');
      }
      this.registerSingleton(DI_TOKENS.PaymentService, () => {
        const paymentIntentRepo = this.resolve<PaymentIntentRepository>(
          DI_TOKENS.PaymentIntentRepository,
        );
        return new StripePaymentService(this.config.stripeConfig!, paymentIntentRepo);
      });
    }

    // Notification service
    if (this.config.useConsoleNotification) {
      this.registerSingleton(DI_TOKENS.NotificationService, () => new ConsoleNotificationService());
    } else {
      if (!this.config.emailConfig) {
        throw new Error('Email configuration is required when useConsoleNotification is false');
      }
      this.registerSingleton(
        DI_TOKENS.NotificationService,
        () => new EmailNotificationService(this.config.emailConfig!),
      );
    }

    // Event publisher
    this.registerSingleton(DI_TOKENS.EventPublisher, () => new InMemoryEventPublisher());
  }

  /**
   * Register application services
   */
  private registerApplicationServices(): void {
    this.registerSingleton(DI_TOKENS.RentalService, () => {
      const equipmentRepo = this.resolve<EquipmentRepository>(DI_TOKENS.EquipmentRepository);
      const memberRepo = this.resolve<MemberRepository>(DI_TOKENS.MemberRepository);
      const rentalRepo = this.resolve<RentalRepository>(DI_TOKENS.RentalRepository);
      const reservationRepo = this.resolve<ReservationRepository>(DI_TOKENS.ReservationRepository);
      const paymentService = this.resolve<PaymentService>(DI_TOKENS.PaymentService);
      const notificationService = this.resolve<NotificationService>(DI_TOKENS.NotificationService);
      const eventPublisher = this.resolve<EventPublisher>(DI_TOKENS.EventPublisher);

      return new RentalService(
        equipmentRepo,
        memberRepo,
        rentalRepo,
        reservationRepo,
        paymentService,
        notificationService,
        eventPublisher,
      );
    });

    this.registerSingleton(DI_TOKENS.ReservationService, () => {
      const equipmentRepo = this.resolve<EquipmentRepository>(DI_TOKENS.EquipmentRepository);
      const memberRepo = this.resolve<MemberRepository>(DI_TOKENS.MemberRepository);
      const rentalRepo = this.resolve<RentalRepository>(DI_TOKENS.RentalRepository);
      const reservationRepo = this.resolve<ReservationRepository>(DI_TOKENS.ReservationRepository);
      const paymentService = this.resolve<PaymentService>(DI_TOKENS.PaymentService);
      const notificationService = this.resolve<NotificationService>(DI_TOKENS.NotificationService);
      const eventPublisher = this.resolve<EventPublisher>(DI_TOKENS.EventPublisher);

      return new ReservationService(
        equipmentRepo,
        memberRepo,
        rentalRepo,
        reservationRepo,
        paymentService,
        notificationService,
        eventPublisher,
      );
    });
  }

  /**
   * Register command handlers
   */
  private registerCommandHandlers(): void {
    this.registerTransient(DI_TOKENS.CreateRentalCommandHandler, () => {
      const equipmentRepo = this.resolve<EquipmentRepository>(DI_TOKENS.EquipmentRepository);
      const memberRepo = this.resolve<MemberRepository>(DI_TOKENS.MemberRepository);
      const rentalRepo = this.resolve<RentalRepository>(DI_TOKENS.RentalRepository);
      const reservationRepo = this.resolve<ReservationRepository>(DI_TOKENS.ReservationRepository);
      const eventPublisher = this.resolve<EventPublisher>(DI_TOKENS.EventPublisher);

      return new CreateRentalCommandHandler(
        equipmentRepo,
        memberRepo,
        rentalRepo,
        reservationRepo,
        eventPublisher,
      );
    });

    this.registerTransient(DI_TOKENS.ReturnRentalCommandHandler, () => {
      const rentalRepo = this.resolve<RentalRepository>(DI_TOKENS.RentalRepository);
      const equipmentRepo = this.resolve<EquipmentRepository>(DI_TOKENS.EquipmentRepository);
      const memberRepo = this.resolve<MemberRepository>(DI_TOKENS.MemberRepository);
      const eventPublisher = this.resolve<EventPublisher>(DI_TOKENS.EventPublisher);

      return new ReturnRentalCommandHandler(rentalRepo, equipmentRepo, memberRepo, eventPublisher);
    });

    this.registerTransient(DI_TOKENS.ExtendRentalCommandHandler, () => {
      const rentalRepo = this.resolve<RentalRepository>(DI_TOKENS.RentalRepository);
      const equipmentRepo = this.resolve<EquipmentRepository>(DI_TOKENS.EquipmentRepository);
      const memberRepo = this.resolve<MemberRepository>(DI_TOKENS.MemberRepository);
      const reservationRepo = this.resolve<ReservationRepository>(DI_TOKENS.ReservationRepository);

      return new ExtendRentalCommandHandler(rentalRepo, equipmentRepo, memberRepo, reservationRepo);
    });

    this.registerTransient(DI_TOKENS.CreateReservationCommandHandler, () => {
      const equipmentRepo = this.resolve<EquipmentRepository>(DI_TOKENS.EquipmentRepository);
      const memberRepo = this.resolve<MemberRepository>(DI_TOKENS.MemberRepository);
      const reservationRepo = this.resolve<ReservationRepository>(DI_TOKENS.ReservationRepository);
      const eventPublisher = this.resolve<EventPublisher>(DI_TOKENS.EventPublisher);

      return new CreateReservationCommandHandler(
        equipmentRepo,
        memberRepo,
        reservationRepo,
        eventPublisher,
      );
    });

    this.registerTransient(DI_TOKENS.CancelReservationCommandHandler, () => {
      const reservationRepo = this.resolve<ReservationRepository>(DI_TOKENS.ReservationRepository);
      const eventPublisher = this.resolve<EventPublisher>(DI_TOKENS.EventPublisher);

      return new CancelReservationCommandHandler(reservationRepo, eventPublisher);
    });

    this.registerTransient(DI_TOKENS.AssessDamageCommandHandler, () => {
      const rentalRepo = this.resolve<RentalRepository>(DI_TOKENS.RentalRepository);
      const equipmentRepo = this.resolve<EquipmentRepository>(DI_TOKENS.EquipmentRepository);

      return new AssessDamageCommandHandler(rentalRepo, equipmentRepo);
    });
  }

  /**
   * Register query handlers
   */
  private registerQueryHandlers(): void {
    this.registerTransient(DI_TOKENS.GetAvailableEquipmentQueryHandler, () => {
      const equipmentRepo = this.resolve<EquipmentRepository>(DI_TOKENS.EquipmentRepository);
      return new GetAvailableEquipmentQueryHandler(equipmentRepo);
    });

    this.registerTransient(DI_TOKENS.GetRentalQueryHandler, () => {
      const rentalRepo = this.resolve<RentalRepository>(DI_TOKENS.RentalRepository);
      return new GetRentalQueryHandler(rentalRepo);
    });

    this.registerTransient(DI_TOKENS.GetMemberRentalsQueryHandler, () => {
      const rentalRepo = this.resolve<RentalRepository>(DI_TOKENS.RentalRepository);
      return new GetMemberRentalsQueryHandler(rentalRepo);
    });

    this.registerTransient(DI_TOKENS.GetOverdueRentalsQueryHandler, () => {
      const rentalRepo = this.resolve<RentalRepository>(DI_TOKENS.RentalRepository);
      return new GetOverdueRentalsQueryHandler(rentalRepo);
    });

    this.registerTransient(DI_TOKENS.GetEquipmentMaintenanceScheduleQueryHandler, () => {
      const equipmentRepo = this.resolve<EquipmentRepository>(DI_TOKENS.EquipmentRepository);
      return new GetEquipmentMaintenanceScheduleQueryHandler(equipmentRepo);
    });
  }

  /**
   * Register controllers
   */
  private registerControllers(): void {
    this.registerSingleton(DI_TOKENS.RentalController, () => {
      const rentalService = this.resolve<RentalService>(DI_TOKENS.RentalService);
      const getRentalQueryHandler = this.resolve<GetRentalQueryHandler>(
        DI_TOKENS.GetRentalQueryHandler,
      );
      const getMemberRentalsQueryHandler = this.resolve<GetMemberRentalsQueryHandler>(
        DI_TOKENS.GetMemberRentalsQueryHandler,
      );
      const getOverdueRentalsQueryHandler = this.resolve<GetOverdueRentalsQueryHandler>(
        DI_TOKENS.GetOverdueRentalsQueryHandler,
      );
      const rentalRepo = this.resolve<RentalRepository>(DI_TOKENS.RentalRepository);

      return new RentalController(
        rentalService,
        getRentalQueryHandler,
        getMemberRentalsQueryHandler,
        getOverdueRentalsQueryHandler,
        rentalRepo,
      );
    });

    this.registerSingleton(DI_TOKENS.EquipmentController, () => {
      const getAvailableEquipmentQueryHandler = this.resolve<GetAvailableEquipmentQueryHandler>(
        DI_TOKENS.GetAvailableEquipmentQueryHandler,
      );
      const equipmentRepo = this.resolve<EquipmentRepository>(DI_TOKENS.EquipmentRepository);

      return new EquipmentController(getAvailableEquipmentQueryHandler, equipmentRepo);
    });

    this.registerSingleton(DI_TOKENS.MemberController, () => {
      const memberRepo = this.resolve<MemberRepository>(DI_TOKENS.MemberRepository);
      const equipmentRepo = this.resolve<EquipmentRepository>(DI_TOKENS.EquipmentRepository);
      const getMemberRentalsQueryHandler = this.resolve<GetMemberRentalsQueryHandler>(
        DI_TOKENS.GetMemberRentalsQueryHandler,
      );

      return new MemberController(memberRepo, equipmentRepo, getMemberRentalsQueryHandler);
    });

    this.registerSingleton(DI_TOKENS.ReservationController, () => {
      const reservationService = this.resolve<ReservationService>(DI_TOKENS.ReservationService);
      const reservationRepo = this.resolve<ReservationRepository>(DI_TOKENS.ReservationRepository);

      return new ReservationController(reservationService, reservationRepo);
    });
  }

  /**
   * Register a singleton dependency
   */
  public registerSingleton<T>(token: symbol, factory: () => T): void {
    this.registrations.set(token, {
      token,
      factory: factory as () => unknown,
      lifecycle: Lifecycle.Singleton,
    });
  }

  /**
   * Register a transient dependency (new instance each time)
   */
  public registerTransient<T>(token: symbol, factory: () => T): void {
    this.registrations.set(token, {
      token,
      factory: factory as () => unknown,
      lifecycle: Lifecycle.Transient,
    });
  }

  /**
   * Resolve a dependency by token
   */
  public resolve<T>(token: symbol): T {
    const registration = this.registrations.get(token);

    if (!registration) {
      throw new Error(`No registration found for token: ${token.toString()}`);
    }

    // For singleton, create instance once and cache it
    if (registration.lifecycle === Lifecycle.Singleton) {
      if (!registration.instance) {
        registration.instance = registration.factory();
      }
      return registration.instance as T;
    }

    // For transient, create a new instance each time
    return registration.factory() as T;
  }

  /**
   * Check if a token is registered
   */
  public has(token: symbol): boolean {
    return this.registrations.has(token);
  }

  /**
   * Get all registered tokens
   */
  public getRegisteredTokens(): symbol[] {
    return Array.from(this.registrations.keys());
  }
}
