/**
 * End-to-End Test Setup Utilities
 *
 * Provides utilities for bootstrapping a full application instance with in-memory adapters
 * for E2E testing through HTTP endpoints.
 */

import { Express } from 'express';
import { Container } from '../../infrastructure/di/Container.js';
import { createServer } from '../../adapters/inbound/http/server.js';
import { DI_TOKENS } from '../../infrastructure/di/types.js';
import { RentalController } from '../../adapters/inbound/http/controllers/RentalController.js';
import { EquipmentController } from '../../adapters/inbound/http/controllers/EquipmentController.js';
import { MemberController } from '../../adapters/inbound/http/controllers/MemberController.js';
import { ReservationController } from '../../adapters/inbound/http/controllers/ReservationController.js';
import { ILogger, NoOpLogger } from '../../infrastructure/logging/Logger.js';
import { EquipmentRepository } from '../../domain/ports/EquipmentRepository.js';
import { MemberRepository } from '../../domain/ports/MemberRepository.js';
import { RentalRepository } from '../../domain/ports/RentalRepository.js';
import { ReservationRepository } from '../../domain/ports/ReservationRepository.js';
import { Equipment } from '../../domain/entities/Equipment.js';
import { Member } from '../../domain/entities/Member.js';
import { EquipmentId, MemberId } from '../../domain/value-objects/identifiers.js';
import { Money } from '../../domain/value-objects/Money.js';
import { EquipmentCondition } from '../../domain/types/EquipmentCondition.js';
import { MembershipTier } from '../../domain/types/MembershipTier.js';

/**
 * Test context containing the Express app and repositories for test setup
 */
export interface TestContext {
  app: Express;
  container: Container;
  equipmentRepository: EquipmentRepository;
  memberRepository: MemberRepository;
  rentalRepository: RentalRepository;
  reservationRepository: ReservationRepository;
}

/**
 * Creates a fully configured Express application with in-memory adapters for E2E testing
 */
export async function createTestApp(): Promise<TestContext> {
  // Create container with in-memory adapters and mock services
  const container = new Container({
    useInMemoryAdapters: true,
    useMockPayment: true,
    useConsoleNotification: true,
    loggingConfig: {
      level: 'error', // Minimize logging during tests
      format: 'json',
      destination: 'console',
    },
  });

  await container.initialize();

  // Resolve repositories for test data setup
  const equipmentRepository = container.resolve<EquipmentRepository>(DI_TOKENS.EquipmentRepository);
  const memberRepository = container.resolve<MemberRepository>(DI_TOKENS.MemberRepository);
  const rentalRepository = container.resolve<RentalRepository>(DI_TOKENS.RentalRepository);
  const reservationRepository = container.resolve<ReservationRepository>(
    DI_TOKENS.ReservationRepository,
  );

  // Resolve controllers
  const rentalController = container.resolve<RentalController>(DI_TOKENS.RentalController);
  const equipmentController = container.resolve<EquipmentController>(DI_TOKENS.EquipmentController);
  const memberController = container.resolve<MemberController>(DI_TOKENS.MemberController);
  const reservationController = container.resolve<ReservationController>(
    DI_TOKENS.ReservationController,
  );

  // Create logger (NoOp for tests)
  const logger: ILogger = new NoOpLogger();

  // Create Express app
  const app = createServer({
    rentalController,
    equipmentController,
    memberController,
    reservationController,
    logger,
  });

  return {
    app,
    container,
    equipmentRepository,
    memberRepository,
    rentalRepository,
    reservationRepository,
  };
}

/**
 * Cleanup test context and dispose resources
 */
export async function cleanupTestApp(context: TestContext): Promise<void> {
  await context.container.dispose();
}

/**
 * Creates test equipment entities for E2E tests
 */
export async function createTestEquipment(
  repository: EquipmentRepository,
  overrides?: {
    id?: string;
    name?: string;
    category?: string;
    dailyRate?: number;
    condition?: string;
    isAvailable?: boolean;
  },
): Promise<Equipment> {
  const equipment = Equipment.reconstitute({
    id: EquipmentId.create(overrides?.id || 'eq-test-' + Date.now()),
    name: overrides?.name || 'Test Equipment',
    description: 'Test equipment description',
    category: overrides?.category || 'Power Tools',
    dailyRate: Money.dollars(overrides?.dailyRate !== undefined ? overrides.dailyRate : 50),
    condition: (overrides?.condition as EquipmentCondition) || EquipmentCondition.EXCELLENT,
    isAvailable: overrides?.isAvailable !== undefined ? overrides.isAvailable : true,
    purchaseDate: new Date(),
    lastMaintenanceDate: new Date(),
  });

  await repository.save(equipment);
  return equipment;
}

/**
 * Creates test member entities for E2E tests
 */
export async function createTestMember(
  repository: MemberRepository,
  overrides?: {
    id?: string;
    name?: string;
    email?: string;
    tier?: string;
    isActive?: boolean;
    activeRentalCount?: number;
  },
): Promise<Member> {
  // Generate unique email if not provided
  const uniqueEmail =
    overrides?.email || `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;

  const member = Member.reconstitute({
    id: MemberId.create(overrides?.id || 'mem-test-' + Date.now()),
    name: overrides?.name || 'Test Member',
    email: uniqueEmail,
    tier: (overrides?.tier as MembershipTier) || MembershipTier.BASIC,
    joinDate: new Date(),
    isActive: overrides?.isActive !== undefined ? overrides.isActive : true,
    activeRentalCount: overrides?.activeRentalCount || 0,
    totalRentals: 0,
  });

  await repository.save(member);
  return member;
}
