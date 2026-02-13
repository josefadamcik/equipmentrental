import { DomainEvent } from '../events/DomainEvent.js';

/**
 * Event subscription callback type
 * Called when an event of the subscribed type is published
 */
export type EventHandler<T extends DomainEvent = DomainEvent> = (event: T) => void | Promise<void>;

/**
 * Event publisher interface for publishing domain events
 * Enables event-driven architecture and decoupling of domain logic
 */
export interface EventPublisher {
  /**
   * Publish a single domain event
   * All registered handlers for this event type will be invoked
   * @param event - The domain event to publish
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * Publish multiple domain events
   * Useful for publishing events in batch
   * @param events - Array of domain events to publish
   */
  publishMany(events: DomainEvent[]): Promise<void>;

  /**
   * Subscribe to a specific event type
   * @param eventType - The type of event to subscribe to (e.g., 'RentalCreated')
   * @param handler - Callback function to invoke when event is published
   * @returns Unsubscribe function to remove the subscription
   */
  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): () => void;

  /**
   * Subscribe to all events
   * Useful for logging or monitoring purposes
   * @param handler - Callback function to invoke for any event
   * @returns Unsubscribe function to remove the subscription
   */
  subscribeToAll(handler: EventHandler): () => void;

  /**
   * Unsubscribe from a specific event type
   * @param eventType - The type of event to unsubscribe from
   * @param handler - The handler function to remove
   */
  unsubscribe(eventType: string, handler: EventHandler): void;

  /**
   * Clear all event handlers
   * Useful for testing or resetting the publisher
   */
  clearAllHandlers(): void;

  /**
   * Get number of handlers registered for an event type
   * Useful for debugging and testing
   * @param eventType - The event type to check
   * @returns Number of registered handlers
   */
  getHandlerCount(eventType: string): number;

  /**
   * Check if there are any handlers for an event type
   * @param eventType - The event type to check
   * @returns True if handlers exist, false otherwise
   */
  hasHandlers(eventType: string): boolean;
}
