import { InMemoryEventPublisher } from '../InMemoryEventPublisher.js';
import { DomainEvent } from '../../../../domain/events/DomainEvent.js';

// Test event types
interface TestEvent extends DomainEvent {
  eventType: 'TestEvent';
  testData: string;
}

interface AnotherTestEvent extends DomainEvent {
  eventType: 'AnotherTestEvent';
  otherData: number;
}

const createTestEvent = (data: string): TestEvent => ({
  eventId: `event-${Math.random()}`,
  occurredAt: new Date(),
  eventType: 'TestEvent',
  aggregateId: 'test-aggregate-1',
  testData: data,
});

const createAnotherTestEvent = (data: number): AnotherTestEvent => ({
  eventId: `event-${Math.random()}`,
  occurredAt: new Date(),
  eventType: 'AnotherTestEvent',
  aggregateId: 'test-aggregate-2',
  otherData: data,
});

describe('InMemoryEventPublisher', () => {
  let publisher: InMemoryEventPublisher;

  beforeEach(() => {
    publisher = new InMemoryEventPublisher();
  });

  describe('publish', () => {
    it('should publish event and invoke subscribed handlers', async () => {
      const handler = jest.fn();
      publisher.subscribe('TestEvent', handler);

      const event = createTestEvent('test data');
      await publisher.publish(event);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should store published events', async () => {
      const event = createTestEvent('test data');
      await publisher.publish(event);

      const publishedEvents = publisher.getPublishedEvents();
      expect(publishedEvents).toHaveLength(1);
      expect(publishedEvents[0]).toBe(event);
    });

    it('should invoke multiple handlers for the same event type', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      publisher.subscribe('TestEvent', handler1);
      publisher.subscribe('TestEvent', handler2);

      const event = createTestEvent('test data');
      await publisher.publish(event);

      expect(handler1).toHaveBeenCalledWith(event);
      expect(handler2).toHaveBeenCalledWith(event);
    });

    it('should not invoke handlers for different event types', async () => {
      const testHandler = jest.fn();
      const anotherHandler = jest.fn();

      publisher.subscribe('TestEvent', testHandler);
      publisher.subscribe('AnotherTestEvent', anotherHandler);

      const event = createTestEvent('test data');
      await publisher.publish(event);

      expect(testHandler).toHaveBeenCalledTimes(1);
      expect(anotherHandler).not.toHaveBeenCalled();
    });

    it('should invoke subscribeToAll handlers for any event', async () => {
      const allHandler = jest.fn();
      publisher.subscribeToAll(allHandler);

      const testEvent = createTestEvent('test');
      const anotherEvent = createAnotherTestEvent(123);

      await publisher.publish(testEvent);
      await publisher.publish(anotherEvent);

      expect(allHandler).toHaveBeenCalledTimes(2);
      expect(allHandler).toHaveBeenCalledWith(testEvent);
      expect(allHandler).toHaveBeenCalledWith(anotherEvent);
    });

    it('should handle async handlers', async () => {
      const asyncHandler = jest.fn(async () => {
        await new Promise((resolve) => {
          // Simulate async work
          resolve(undefined);
        });
      });

      publisher.subscribe('TestEvent', asyncHandler);

      const event = createTestEvent('test data');
      await publisher.publish(event);

      expect(asyncHandler).toHaveBeenCalledWith(event);
    });

    it('should catch and log handler errors without failing', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const failingHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      const successHandler = jest.fn();

      publisher.subscribe('TestEvent', failingHandler);
      publisher.subscribe('TestEvent', successHandler);

      const event = createTestEvent('test data');
      await publisher.publish(event);

      expect(failingHandler).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('publishMany', () => {
    it('should publish multiple events', async () => {
      const handler = jest.fn();
      publisher.subscribe('TestEvent', handler);

      const events = [createTestEvent('event 1'), createTestEvent('event 2')];

      await publisher.publishMany(events);

      expect(handler).toHaveBeenCalledTimes(2);
      expect(publisher.getPublishedEvents()).toHaveLength(2);
    });

    it('should publish events in order', async () => {
      const callOrder: string[] = [];
      const handler = jest.fn((event: TestEvent) => {
        callOrder.push(event.testData);
      });

      publisher.subscribe('TestEvent', handler);

      const events = [
        createTestEvent('first'),
        createTestEvent('second'),
        createTestEvent('third'),
      ];

      await publisher.publishMany(events);

      expect(callOrder).toEqual(['first', 'second', 'third']);
    });
  });

  describe('subscribe', () => {
    it('should return unsubscribe function', async () => {
      const handler = jest.fn();
      const unsubscribe = publisher.subscribe('TestEvent', handler);

      const event = createTestEvent('test data');
      await publisher.publish(event);
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();

      await publisher.publish(event);
      expect(handler).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it('should clean up empty event type handlers', () => {
      const handler = jest.fn();
      const unsubscribe = publisher.subscribe('TestEvent', handler);

      expect(publisher.hasHandlers('TestEvent')).toBe(true);

      unsubscribe();

      expect(publisher.hasHandlers('TestEvent')).toBe(false);
    });
  });

  describe('subscribeToAll', () => {
    it('should return unsubscribe function', async () => {
      const handler = jest.fn();
      const unsubscribe = publisher.subscribeToAll(handler);

      const event = createTestEvent('test data');
      await publisher.publish(event);
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();

      await publisher.publish(event);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('unsubscribe', () => {
    it('should unsubscribe handler from event type', async () => {
      const handler = jest.fn();
      publisher.subscribe('TestEvent', handler);

      const event = createTestEvent('test data');
      await publisher.publish(event);
      expect(handler).toHaveBeenCalledTimes(1);

      publisher.unsubscribe('TestEvent', handler);

      await publisher.publish(event);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearAllHandlers', () => {
    it('should clear all handlers', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      const allHandler = jest.fn();

      publisher.subscribe('TestEvent', handler1);
      publisher.subscribe('AnotherTestEvent', handler2);
      publisher.subscribeToAll(allHandler);

      publisher.clearAllHandlers();

      await publisher.publish(createTestEvent('test'));
      await publisher.publish(createAnotherTestEvent(123));

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(allHandler).not.toHaveBeenCalled();
    });

    it('should not clear published events', () => {
      const event = createTestEvent('test data');
      publisher.publish(event);

      expect(publisher.getPublishedEvents()).toHaveLength(1);

      publisher.clearAllHandlers();

      expect(publisher.getPublishedEvents()).toHaveLength(1);
    });
  });

  describe('getHandlerCount', () => {
    it('should return number of handlers for event type', () => {
      expect(publisher.getHandlerCount('TestEvent')).toBe(0);

      publisher.subscribe('TestEvent', jest.fn());
      expect(publisher.getHandlerCount('TestEvent')).toBe(1);

      publisher.subscribe('TestEvent', jest.fn());
      expect(publisher.getHandlerCount('TestEvent')).toBe(2);
    });
  });

  describe('hasHandlers', () => {
    it('should check if event type has handlers', () => {
      expect(publisher.hasHandlers('TestEvent')).toBe(false);

      publisher.subscribe('TestEvent', jest.fn());
      expect(publisher.hasHandlers('TestEvent')).toBe(true);
    });
  });

  describe('getPublishedEvents', () => {
    it('should return all published events', async () => {
      const event1 = createTestEvent('event 1');
      const event2 = createAnotherTestEvent(123);

      await publisher.publish(event1);
      await publisher.publish(event2);

      const published = publisher.getPublishedEvents();
      expect(published).toHaveLength(2);
      expect(published[0]).toBe(event1);
      expect(published[1]).toBe(event2);
    });
  });

  describe('getPublishedEventsByType', () => {
    it('should return events filtered by type', async () => {
      await publisher.publish(createTestEvent('event 1'));
      await publisher.publish(createAnotherTestEvent(123));
      await publisher.publish(createTestEvent('event 2'));

      const testEvents = publisher.getPublishedEventsByType<TestEvent>('TestEvent');
      expect(testEvents).toHaveLength(2);
      expect(testEvents[0].testData).toBe('event 1');
      expect(testEvents[1].testData).toBe('event 2');

      const anotherEvents =
        publisher.getPublishedEventsByType<AnotherTestEvent>('AnotherTestEvent');
      expect(anotherEvents).toHaveLength(1);
      expect(anotherEvents[0].otherData).toBe(123);
    });
  });

  describe('getPublishedEventCount', () => {
    it('should return count of published events', async () => {
      expect(publisher.getPublishedEventCount()).toBe(0);

      await publisher.publish(createTestEvent('event 1'));
      expect(publisher.getPublishedEventCount()).toBe(1);

      await publisher.publish(createTestEvent('event 2'));
      expect(publisher.getPublishedEventCount()).toBe(2);
    });
  });

  describe('clearPublishedEvents', () => {
    it('should clear published events', async () => {
      await publisher.publish(createTestEvent('event 1'));
      await publisher.publish(createTestEvent('event 2'));

      expect(publisher.getPublishedEventCount()).toBe(2);

      publisher.clearPublishedEvents();

      expect(publisher.getPublishedEventCount()).toBe(0);
    });

    it('should not affect handlers', async () => {
      const handler = jest.fn();
      publisher.subscribe('TestEvent', handler);

      await publisher.publish(createTestEvent('event 1'));
      publisher.clearPublishedEvents();

      await publisher.publish(createTestEvent('event 2'));

      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe('clear', () => {
    it('should clear both handlers and published events', async () => {
      const handler = jest.fn();
      publisher.subscribe('TestEvent', handler);
      await publisher.publish(createTestEvent('event 1'));

      expect(publisher.hasHandlers('TestEvent')).toBe(true);
      expect(publisher.getPublishedEventCount()).toBe(1);

      publisher.clear();

      expect(publisher.hasHandlers('TestEvent')).toBe(false);
      expect(publisher.getPublishedEventCount()).toBe(0);
    });
  });
});
