import { DomainEvent } from '../../../domain/events/DomainEvent.js';
import { EventPublisher, EventHandler } from '../../../domain/ports/EventPublisher.js';

/**
 * In-memory implementation of EventPublisher for testing
 * Provides a simple event bus for domain events with subscription management
 */
export class InMemoryEventPublisher implements EventPublisher {
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private allHandlers: Set<EventHandler> = new Set();
  private publishedEvents: DomainEvent[] = [];

  async publish(event: DomainEvent): Promise<void> {
    // Store event for debugging/testing
    this.publishedEvents.push(event);

    // Get handlers for this specific event type
    const eventHandlers = this.handlers.get(event.eventType);

    // Collect all handlers to invoke
    const handlersToInvoke: EventHandler[] = [];

    if (eventHandlers) {
      handlersToInvoke.push(...Array.from(eventHandlers));
    }

    // Add handlers subscribed to all events
    handlersToInvoke.push(...Array.from(this.allHandlers));

    // Invoke all handlers
    await Promise.all(handlersToInvoke.map((handler) => this.invokeHandler(handler, event)));
  }

  async publishMany(events: DomainEvent[]): Promise<void> {
    // Publish events sequentially to maintain order
    for (const event of events) {
      await this.publish(event);
    }
  }

  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    const handlers = this.handlers.get(eventType)!;
    handlers.add(handler as EventHandler);

    // Return unsubscribe function
    return () => {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    };
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
    const handlers = this.handlers.get(eventType);
    return handlers ? handlers.size : 0;
  }

  hasHandlers(eventType: string): boolean {
    const handlers = this.handlers.get(eventType);
    return handlers !== undefined && handlers.size > 0;
  }

  /**
   * Get all published events
   * Useful for testing and debugging
   */
  getPublishedEvents(): DomainEvent[] {
    return [...this.publishedEvents];
  }

  /**
   * Get published events of a specific type
   * Useful for testing
   */
  getPublishedEventsByType<T extends DomainEvent>(eventType: string): T[] {
    return this.publishedEvents.filter((e) => e.eventType === eventType) as T[];
  }

  /**
   * Get count of published events
   */
  getPublishedEventCount(): number {
    return this.publishedEvents.length;
  }

  /**
   * Clear all published events
   * Useful for testing
   */
  clearPublishedEvents(): void {
    this.publishedEvents = [];
  }

  /**
   * Clear everything (handlers and published events)
   * Useful for testing
   */
  clear(): void {
    this.clearAllHandlers();
    this.clearPublishedEvents();
  }

  /**
   * Safely invoke a handler, catching and logging any errors
   */
  private async invokeHandler(handler: EventHandler, event: DomainEvent): Promise<void> {
    try {
      await handler(event);
    } catch (error) {
      // In a real implementation, this would be logged
      console.error(`Error in event handler for ${event.eventType}:`, error);
      // Optionally rethrow or handle the error
      // For now, we'll swallow it to prevent one failing handler from affecting others
    }
  }
}
