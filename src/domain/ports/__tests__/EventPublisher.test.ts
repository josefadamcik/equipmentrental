import { EventPublisher, EventHandler } from '../EventPublisher';
import { DomainEvent } from '../../events/DomainEvent';
import { RentalCreated } from '../../events/RentalEvents';
import { RentalId, MemberId, EquipmentId } from '../../value-objects/identifiers';
import { Money } from '../../value-objects/Money';
import { DateRange } from '../../value-objects/DateRange';

/**
 * Mock implementation of EventPublisher for testing
 */
class MockEventPublisher implements EventPublisher {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private allHandlers: Set<EventHandler> = new Set();

  async publish(event: DomainEvent): Promise<void> {
    // Call specific event type handlers
    const typeHandlers = this.handlers.get(event.eventType);
    if (typeHandlers) {
      for (const handler of typeHandlers) {
        await handler(event);
      }
    }

    // Call all-event handlers
    for (const handler of this.allHandlers) {
      await handler(event);
    }
  }

  async publishMany(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler as EventHandler);

    // Return unsubscribe function
    return () => this.unsubscribe(eventType, handler as EventHandler);
  }

  subscribeToAll(handler: EventHandler): () => void {
    this.allHandlers.add(handler);

    // Return unsubscribe function
    return () => {
      this.allHandlers.delete(handler);
    };
  }

  unsubscribe(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    }
  }

  clearAllHandlers(): void {
    this.handlers.clear();
    this.allHandlers.clear();
  }

  getHandlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.size ?? 0;
  }

  hasHandlers(eventType: string): boolean {
    return this.getHandlerCount(eventType) > 0;
  }
}

describe('EventPublisher Port', () => {
  let publisher: MockEventPublisher;
  let testEvent: RentalCreated;

  beforeEach(() => {
    publisher = new MockEventPublisher();
    testEvent = RentalCreated.create(
      RentalId.generate(),
      MemberId.generate(),
      EquipmentId.generate(),
      DateRange.create(new Date('2024-01-01'), new Date('2024-01-10')),
      Money.dollars(25),
    );
  });

  describe('publish', () => {
    it('should publish event to subscribed handlers', async () => {
      const handler = jest.fn();
      publisher.subscribe('RentalCreated', handler);

      await publisher.publish(testEvent);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(testEvent);
    });

    it('should not call handler for different event type', async () => {
      const handler = jest.fn();
      publisher.subscribe('RentalReturned', handler);

      await publisher.publish(testEvent);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should call multiple handlers for the same event type', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      publisher.subscribe('RentalCreated', handler1);
      publisher.subscribe('RentalCreated', handler2);

      await publisher.publish(testEvent);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should support async handlers', async () => {
      const results: string[] = [];
      const asyncHandler = async (event: DomainEvent) => {
        await new Promise<void>((resolve) => {
          // Simulate async operation
          resolve();
        });
        results.push(event.eventType);
      };

      publisher.subscribe('RentalCreated', asyncHandler);
      await publisher.publish(testEvent);

      expect(results).toContain('RentalCreated');
    });
  });

  describe('publishMany', () => {
    it('should publish multiple events', async () => {
      const handler = jest.fn();
      publisher.subscribe('RentalCreated', handler);

      const event2 = RentalCreated.create(
        RentalId.generate(),
        MemberId.generate(),
        EquipmentId.generate(),
        DateRange.create(new Date('2024-02-01'), new Date('2024-02-10')),
        Money.dollars(30),
      );

      await publisher.publishMany([testEvent, event2]);

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should handle empty event array', async () => {
      const handler = jest.fn();
      publisher.subscribe('RentalCreated', handler);

      await publisher.publishMany([]);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('subscribe', () => {
    it('should subscribe handler to event type', () => {
      const handler = jest.fn();
      publisher.subscribe('RentalCreated', handler);

      expect(publisher.hasHandlers('RentalCreated')).toBe(true);
      expect(publisher.getHandlerCount('RentalCreated')).toBe(1);
    });

    it('should return unsubscribe function', async () => {
      const handler = jest.fn();
      const unsubscribe = publisher.subscribe('RentalCreated', handler);

      await publisher.publish(testEvent);
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();

      await publisher.publish(testEvent);
      expect(handler).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it('should allow multiple subscriptions to same event type', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      publisher.subscribe('RentalCreated', handler1);
      publisher.subscribe('RentalCreated', handler2);

      expect(publisher.getHandlerCount('RentalCreated')).toBe(2);
    });
  });

  describe('subscribeToAll', () => {
    it('should subscribe handler to all events', async () => {
      const handler = jest.fn();
      publisher.subscribeToAll(handler);

      await publisher.publish(testEvent);

      expect(handler).toHaveBeenCalledWith(testEvent);
    });

    it('should call all-event handler for any event type', async () => {
      const handler = jest.fn();
      publisher.subscribeToAll(handler);

      await publisher.publish(testEvent);

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should return unsubscribe function', async () => {
      const handler = jest.fn();
      const unsubscribe = publisher.subscribeToAll(handler);

      await publisher.publish(testEvent);
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();

      await publisher.publish(testEvent);
      expect(handler).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should call both specific and all-event handlers', async () => {
      const specificHandler = jest.fn();
      const allHandler = jest.fn();

      publisher.subscribe('RentalCreated', specificHandler);
      publisher.subscribeToAll(allHandler);

      await publisher.publish(testEvent);

      expect(specificHandler).toHaveBeenCalledTimes(1);
      expect(allHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe handler from event type', async () => {
      const handler = jest.fn();
      publisher.subscribe('RentalCreated', handler);

      await publisher.publish(testEvent);
      expect(handler).toHaveBeenCalledTimes(1);

      publisher.unsubscribe('RentalCreated', handler);

      await publisher.publish(testEvent);
      expect(handler).toHaveBeenCalledTimes(1); // Not called again
    });

    it('should not affect other handlers', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      publisher.subscribe('RentalCreated', handler1);
      publisher.subscribe('RentalCreated', handler2);

      publisher.unsubscribe('RentalCreated', handler1);

      await publisher.publish(testEvent);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should handle unsubscribing non-existent handler', () => {
      const handler = jest.fn();
      expect(() => publisher.unsubscribe('RentalCreated', handler)).not.toThrow();
    });
  });

  describe('clearAllHandlers', () => {
    it('should remove all handlers', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const allHandler = jest.fn();

      publisher.subscribe('RentalCreated', handler1);
      publisher.subscribe('RentalReturned', handler2);
      publisher.subscribeToAll(allHandler);

      publisher.clearAllHandlers();

      await publisher.publish(testEvent);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(allHandler).not.toHaveBeenCalled();
    });

    it('should reset handler counts', () => {
      const handler = jest.fn();
      publisher.subscribe('RentalCreated', handler);

      expect(publisher.hasHandlers('RentalCreated')).toBe(true);

      publisher.clearAllHandlers();

      expect(publisher.hasHandlers('RentalCreated')).toBe(false);
      expect(publisher.getHandlerCount('RentalCreated')).toBe(0);
    });
  });

  describe('getHandlerCount', () => {
    it('should return correct handler count', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      expect(publisher.getHandlerCount('RentalCreated')).toBe(0);

      publisher.subscribe('RentalCreated', handler1);
      expect(publisher.getHandlerCount('RentalCreated')).toBe(1);

      publisher.subscribe('RentalCreated', handler2);
      expect(publisher.getHandlerCount('RentalCreated')).toBe(2);

      publisher.unsubscribe('RentalCreated', handler1);
      expect(publisher.getHandlerCount('RentalCreated')).toBe(1);
    });

    it('should return 0 for non-existent event type', () => {
      expect(publisher.getHandlerCount('NonExistentEvent')).toBe(0);
    });
  });

  describe('hasHandlers', () => {
    it('should return true when handlers exist', () => {
      const handler = jest.fn();
      publisher.subscribe('RentalCreated', handler);

      expect(publisher.hasHandlers('RentalCreated')).toBe(true);
    });

    it('should return false when no handlers exist', () => {
      expect(publisher.hasHandlers('RentalCreated')).toBe(false);
    });

    it('should return false after all handlers are removed', () => {
      const handler = jest.fn();
      publisher.subscribe('RentalCreated', handler);

      expect(publisher.hasHandlers('RentalCreated')).toBe(true);

      publisher.unsubscribe('RentalCreated', handler);

      expect(publisher.hasHandlers('RentalCreated')).toBe(false);
    });
  });

  describe('type compliance', () => {
    it('should implement all required methods', () => {
      const pub: EventPublisher = publisher;
      expect(typeof pub.publish).toBe('function');
      expect(typeof pub.publishMany).toBe('function');
      expect(typeof pub.subscribe).toBe('function');
      expect(typeof pub.subscribeToAll).toBe('function');
      expect(typeof pub.unsubscribe).toBe('function');
      expect(typeof pub.clearAllHandlers).toBe('function');
      expect(typeof pub.getHandlerCount).toBe('function');
      expect(typeof pub.hasHandlers).toBe('function');
    });
  });
});
