/**
 * Base interface for all domain events.
 * Domain events represent business occurrences that have happened in the past.
 */
export interface DomainEvent {
  /**
   * Unique identifier for this event instance
   */
  readonly eventId: string;

  /**
   * Timestamp when the event occurred
   */
  readonly occurredAt: Date;

  /**
   * Type discriminator for the event
   */
  readonly eventType: string;

  /**
   * Aggregate ID that this event relates to
   */
  readonly aggregateId: string;
}
