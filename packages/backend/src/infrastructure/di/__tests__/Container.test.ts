import { Container, ContainerConfig } from '../Container.js';
import { DI_TOKENS } from '../types.js';
import { EquipmentRepository } from '../../../domain/ports/EquipmentRepository.js';
import { MemberRepository } from '../../../domain/ports/MemberRepository.js';
import { RentalRepository } from '../../../domain/ports/RentalRepository.js';
import { ReservationRepository } from '../../../domain/ports/ReservationRepository.js';
import { PaymentService } from '../../../domain/ports/PaymentService.js';
import { NotificationService } from '../../../domain/ports/NotificationService.js';
import { EventPublisher } from '../../../domain/ports/EventPublisher.js';
import { RentalService } from '../../../application/services/RentalService.js';
import { ReservationService } from '../../../application/services/ReservationService.js';
import { RentalController } from '../../../adapters/inbound/http/controllers/RentalController.js';
import { EquipmentController } from '../../../adapters/inbound/http/controllers/EquipmentController.js';
import { MemberController } from '../../../adapters/inbound/http/controllers/MemberController.js';
import { ReservationController } from '../../../adapters/inbound/http/controllers/ReservationController.js';
import { InMemoryEquipmentRepository } from '../../../adapters/outbound/persistence/InMemoryEquipmentRepository.js';
import { MockPaymentService } from '../../../adapters/outbound/payment/MockPaymentService.js';
import { ConsoleNotificationService } from '../../../adapters/outbound/notification/ConsoleNotificationService.js';

describe('Container', () => {
  describe('initialization', () => {
    it('should initialize with default in-memory adapters', async () => {
      const container = new Container();
      await container.initialize();

      expect(container.has(DI_TOKENS.EquipmentRepository)).toBe(true);
      expect(container.has(DI_TOKENS.MemberRepository)).toBe(true);
      expect(container.has(DI_TOKENS.RentalRepository)).toBe(true);
      expect(container.has(DI_TOKENS.ReservationRepository)).toBe(true);

      await container.dispose();
    });

    it('should initialize with in-memory adapters when configured', async () => {
      const config: ContainerConfig = {
        useInMemoryAdapters: true,
        useMockPayment: true,
        useConsoleNotification: true,
      };

      const container = new Container(config);
      await container.initialize();

      const equipmentRepo = container.resolve<EquipmentRepository>(DI_TOKENS.EquipmentRepository);
      expect(equipmentRepo).toBeInstanceOf(InMemoryEquipmentRepository);

      await container.dispose();
    });

    it('should initialize payment service based on configuration', async () => {
      const container = new Container({ useMockPayment: true });
      await container.initialize();

      const paymentService = container.resolve<PaymentService>(DI_TOKENS.PaymentService);
      expect(paymentService).toBeInstanceOf(MockPaymentService);

      await container.dispose();
    });

    it('should initialize notification service based on configuration', async () => {
      const container = new Container({ useConsoleNotification: true });
      await container.initialize();

      const notificationService = container.resolve<NotificationService>(
        DI_TOKENS.NotificationService,
      );
      expect(notificationService).toBeInstanceOf(ConsoleNotificationService);

      await container.dispose();
    });

    it('should throw error when Stripe configuration is missing and useMockPayment is false', async () => {
      const container = new Container({ useMockPayment: false });

      await expect(container.initialize()).rejects.toThrow(
        'Stripe configuration is required when useMockPayment is false',
      );
    });

    it('should throw error when email config is missing and useConsoleNotification is false', async () => {
      const container = new Container({ useConsoleNotification: false });

      await expect(container.initialize()).rejects.toThrow(
        'Email configuration is required when useConsoleNotification is false',
      );
    });
  });

  describe('repository registration', () => {
    it('should register all repositories', async () => {
      const container = new Container();
      await container.initialize();

      expect(container.has(DI_TOKENS.EquipmentRepository)).toBe(true);
      expect(container.has(DI_TOKENS.MemberRepository)).toBe(true);
      expect(container.has(DI_TOKENS.RentalRepository)).toBe(true);
      expect(container.has(DI_TOKENS.ReservationRepository)).toBe(true);

      await container.dispose();
    });

    it('should resolve repositories', async () => {
      const container = new Container();
      await container.initialize();

      const equipmentRepo = container.resolve<EquipmentRepository>(DI_TOKENS.EquipmentRepository);
      const memberRepo = container.resolve<MemberRepository>(DI_TOKENS.MemberRepository);
      const rentalRepo = container.resolve<RentalRepository>(DI_TOKENS.RentalRepository);
      const reservationRepo = container.resolve<ReservationRepository>(
        DI_TOKENS.ReservationRepository,
      );

      expect(equipmentRepo).toBeDefined();
      expect(memberRepo).toBeDefined();
      expect(rentalRepo).toBeDefined();
      expect(reservationRepo).toBeDefined();

      await container.dispose();
    });
  });

  describe('service registration', () => {
    it('should register all services', async () => {
      const container = new Container();
      await container.initialize();

      expect(container.has(DI_TOKENS.PaymentService)).toBe(true);
      expect(container.has(DI_TOKENS.NotificationService)).toBe(true);
      expect(container.has(DI_TOKENS.EventPublisher)).toBe(true);

      await container.dispose();
    });

    it('should resolve services', async () => {
      const container = new Container();
      await container.initialize();

      const paymentService = container.resolve<PaymentService>(DI_TOKENS.PaymentService);
      const notificationService = container.resolve<NotificationService>(
        DI_TOKENS.NotificationService,
      );
      const eventPublisher = container.resolve<EventPublisher>(DI_TOKENS.EventPublisher);

      expect(paymentService).toBeDefined();
      expect(notificationService).toBeDefined();
      expect(eventPublisher).toBeDefined();

      await container.dispose();
    });
  });

  describe('application service registration', () => {
    it('should register application services', async () => {
      const container = new Container();
      await container.initialize();

      expect(container.has(DI_TOKENS.RentalService)).toBe(true);
      expect(container.has(DI_TOKENS.ReservationService)).toBe(true);

      await container.dispose();
    });

    it('should resolve application services with dependencies', async () => {
      const container = new Container();
      await container.initialize();

      const rentalService = container.resolve<RentalService>(DI_TOKENS.RentalService);
      const reservationService = container.resolve<ReservationService>(
        DI_TOKENS.ReservationService,
      );

      expect(rentalService).toBeInstanceOf(RentalService);
      expect(reservationService).toBeInstanceOf(ReservationService);

      await container.dispose();
    });
  });

  describe('command handler registration', () => {
    it('should register all command handlers', async () => {
      const container = new Container();
      await container.initialize();

      expect(container.has(DI_TOKENS.CreateRentalCommandHandler)).toBe(true);
      expect(container.has(DI_TOKENS.ReturnRentalCommandHandler)).toBe(true);
      expect(container.has(DI_TOKENS.ExtendRentalCommandHandler)).toBe(true);
      expect(container.has(DI_TOKENS.CreateReservationCommandHandler)).toBe(true);
      expect(container.has(DI_TOKENS.CancelReservationCommandHandler)).toBe(true);
      expect(container.has(DI_TOKENS.AssessDamageCommandHandler)).toBe(true);

      await container.dispose();
    });

    it('should resolve command handlers', async () => {
      const container = new Container();
      await container.initialize();

      const createRentalHandler = container.resolve(DI_TOKENS.CreateRentalCommandHandler);
      const returnRentalHandler = container.resolve(DI_TOKENS.ReturnRentalCommandHandler);
      const extendRentalHandler = container.resolve(DI_TOKENS.ExtendRentalCommandHandler);

      expect(createRentalHandler).toBeDefined();
      expect(returnRentalHandler).toBeDefined();
      expect(extendRentalHandler).toBeDefined();

      await container.dispose();
    });
  });

  describe('query handler registration', () => {
    it('should register all query handlers', async () => {
      const container = new Container();
      await container.initialize();

      expect(container.has(DI_TOKENS.GetAvailableEquipmentQueryHandler)).toBe(true);
      expect(container.has(DI_TOKENS.GetRentalQueryHandler)).toBe(true);
      expect(container.has(DI_TOKENS.GetMemberRentalsQueryHandler)).toBe(true);
      expect(container.has(DI_TOKENS.GetOverdueRentalsQueryHandler)).toBe(true);
      expect(container.has(DI_TOKENS.GetEquipmentMaintenanceScheduleQueryHandler)).toBe(true);

      await container.dispose();
    });

    it('should resolve query handlers', async () => {
      const container = new Container();
      await container.initialize();

      const getAvailableEquipmentHandler = container.resolve(
        DI_TOKENS.GetAvailableEquipmentQueryHandler,
      );
      const getRentalHandler = container.resolve(DI_TOKENS.GetRentalQueryHandler);
      const getMemberRentalsHandler = container.resolve(DI_TOKENS.GetMemberRentalsQueryHandler);

      expect(getAvailableEquipmentHandler).toBeDefined();
      expect(getRentalHandler).toBeDefined();
      expect(getMemberRentalsHandler).toBeDefined();

      await container.dispose();
    });
  });

  describe('controller registration', () => {
    it('should register all controllers', async () => {
      const container = new Container();
      await container.initialize();

      expect(container.has(DI_TOKENS.RentalController)).toBe(true);
      expect(container.has(DI_TOKENS.EquipmentController)).toBe(true);
      expect(container.has(DI_TOKENS.MemberController)).toBe(true);
      expect(container.has(DI_TOKENS.ReservationController)).toBe(true);

      await container.dispose();
    });

    it('should resolve controllers with dependencies', async () => {
      const container = new Container();
      await container.initialize();

      const rentalController = container.resolve<RentalController>(DI_TOKENS.RentalController);
      const equipmentController = container.resolve<EquipmentController>(
        DI_TOKENS.EquipmentController,
      );
      const memberController = container.resolve<MemberController>(DI_TOKENS.MemberController);
      const reservationController = container.resolve<ReservationController>(
        DI_TOKENS.ReservationController,
      );

      expect(rentalController).toBeInstanceOf(RentalController);
      expect(equipmentController).toBeInstanceOf(EquipmentController);
      expect(memberController).toBeInstanceOf(MemberController);
      expect(reservationController).toBeInstanceOf(ReservationController);

      await container.dispose();
    });
  });

  describe('lifecycle management', () => {
    it('should return same instance for singleton dependencies', async () => {
      const container = new Container();
      await container.initialize();

      const instance1 = container.resolve<RentalService>(DI_TOKENS.RentalService);
      const instance2 = container.resolve<RentalService>(DI_TOKENS.RentalService);

      expect(instance1).toBe(instance2);

      await container.dispose();
    });

    it('should return different instances for transient dependencies', async () => {
      const container = new Container();
      await container.initialize();

      const instance1 = container.resolve(DI_TOKENS.GetRentalQueryHandler);
      const instance2 = container.resolve(DI_TOKENS.GetRentalQueryHandler);

      expect(instance1).not.toBe(instance2);

      await container.dispose();
    });

    it('should support custom singleton registration', async () => {
      const container = new Container();
      const customService = { name: 'CustomService' };

      container.registerSingleton(Symbol.for('CustomService'), () => customService);

      const resolved1 = container.resolve(Symbol.for('CustomService'));
      const resolved2 = container.resolve(Symbol.for('CustomService'));

      expect(resolved1).toBe(customService);
      expect(resolved2).toBe(customService);
      expect(resolved1).toBe(resolved2);
    });

    it('should support custom transient registration', async () => {
      const container = new Container();

      container.registerTransient(Symbol.for('CustomTransient'), () => ({
        id: Math.random(),
      }));

      const resolved1 = container.resolve<{ id: number }>(Symbol.for('CustomTransient'));
      const resolved2 = container.resolve<{ id: number }>(Symbol.for('CustomTransient'));

      expect(resolved1).toBeDefined();
      expect(resolved2).toBeDefined();
      expect(resolved1.id).not.toBe(resolved2.id);
    });
  });

  describe('error handling', () => {
    it('should throw error when resolving unregistered token', async () => {
      const container = new Container();
      await container.initialize();

      const unknownToken = Symbol.for('UnknownToken');

      expect(() => container.resolve(unknownToken)).toThrow(
        `No registration found for token: ${unknownToken.toString()}`,
      );

      await container.dispose();
    });

    it('should return false when checking for unregistered token', async () => {
      const container = new Container();
      await container.initialize();

      const unknownToken = Symbol.for('UnknownToken');

      expect(container.has(unknownToken)).toBe(false);

      await container.dispose();
    });
  });

  describe('utility methods', () => {
    it('should return all registered tokens', async () => {
      const container = new Container();
      await container.initialize();

      const tokens = container.getRegisteredTokens();

      expect(tokens).toContain(DI_TOKENS.EquipmentRepository);
      expect(tokens).toContain(DI_TOKENS.RentalService);
      expect(tokens).toContain(DI_TOKENS.RentalController);
      expect(tokens.length).toBeGreaterThan(0);

      await container.dispose();
    });

    it('should check if token is registered', async () => {
      const container = new Container();
      await container.initialize();

      expect(container.has(DI_TOKENS.RentalService)).toBe(true);
      expect(container.has(Symbol.for('NonExistent'))).toBe(false);

      await container.dispose();
    });
  });

  describe('disposal', () => {
    it('should clear all registrations on dispose', async () => {
      const container = new Container();
      await container.initialize();

      expect(container.getRegisteredTokens().length).toBeGreaterThan(0);

      await container.dispose();

      expect(container.getRegisteredTokens().length).toBe(0);
    });

    it('should allow re-initialization after disposal', async () => {
      const container = new Container();

      await container.initialize();
      expect(container.has(DI_TOKENS.RentalService)).toBe(true);

      await container.dispose();
      expect(container.has(DI_TOKENS.RentalService)).toBe(false);

      await container.initialize();
      expect(container.has(DI_TOKENS.RentalService)).toBe(true);

      await container.dispose();
    });
  });

  describe('integration scenarios', () => {
    it('should wire up complete rental workflow dependencies', async () => {
      const container = new Container();
      await container.initialize();

      // Resolve the rental controller (which depends on service and query handlers)
      const rentalController = container.resolve<RentalController>(DI_TOKENS.RentalController);

      // Verify the controller has a router
      const router = rentalController.getRouter();
      expect(router).toBeDefined();

      await container.dispose();
    });

    it('should wire up complete reservation workflow dependencies', async () => {
      const container = new Container();
      await container.initialize();

      // Resolve the reservation controller
      const reservationController = container.resolve<ReservationController>(
        DI_TOKENS.ReservationController,
      );

      // Verify the controller has a router
      const router = reservationController.getRouter();
      expect(router).toBeDefined();

      await container.dispose();
    });

    it('should support multiple containers with different configurations', async () => {
      const container1 = new Container({ useMockPayment: true });
      const container2 = new Container({ useMockPayment: true });

      await container1.initialize();
      await container2.initialize();

      const service1 = container1.resolve<RentalService>(DI_TOKENS.RentalService);
      const service2 = container2.resolve<RentalService>(DI_TOKENS.RentalService);

      // Different containers should have different singleton instances
      expect(service1).not.toBe(service2);

      await container1.dispose();
      await container2.dispose();
    });
  });
});
