import { Injectable } from '@nestjs/common';

/**
 * Event Store — Append-only log of domain events.
 * In production: replace with EventStoreDB, Apache Kafka, or NATS JetStream.
 * This is the foundation of Event Sourcing + CQRS architecture.
 *
 * Benefits:
 * - Full audit trail of every state change
 * - Time-travel debugging (replay events to reconstruct state)
 * - Decoupled read/write models (projections)
 * - Zero data loss (events are immutable facts)
 */

interface StoredEvent {
  id: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  payload: Record<string, any>;
  metadata: {
    userId?: string;
    correlationId?: string;
    causationId?: string;
    timestamp: Date;
    version: number;
  };
}

@Injectable()
export class EventStoreService {
  // In-memory store for development (use EventStoreDB/Kafka in prod)
  private events: StoredEvent[] = [];
  private versionMap = new Map<string, number>();

  /**
   * Append an event to the store with optimistic concurrency control.
   * If expectedVersion doesn't match, another process modified the aggregate.
   */
  async append(
    aggregateId: string,
    aggregateType: string,
    eventType: string,
    payload: Record<string, any>,
    metadata: { userId?: string; correlationId?: string } = {},
    expectedVersion?: number,
  ): Promise<StoredEvent> {
    const currentVersion = this.versionMap.get(aggregateId) || 0;

    // Optimistic Concurrency Check
    if (expectedVersion !== undefined && expectedVersion !== currentVersion) {
      throw new Error(
        `Concurrency conflict on ${aggregateType}:${aggregateId}. ` +
        `Expected v${expectedVersion}, got v${currentVersion}`,
      );
    }

    const newVersion = currentVersion + 1;
    const event: StoredEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      aggregateId,
      aggregateType,
      eventType,
      payload,
      metadata: {
        ...metadata,
        timestamp: new Date(),
        version: newVersion,
      },
    };

    this.events.push(event);
    this.versionMap.set(aggregateId, newVersion);
    return event;
  }

  /**
   * Get all events for an aggregate (for rebuilding state).
   */
  async getEventsForAggregate(aggregateId: string): Promise<StoredEvent[]> {
    return this.events.filter((e) => e.aggregateId === aggregateId);
  }

  /**
   * Get events by type (for building read-model projections).
   */
  async getEventsByType(eventType: string, since?: Date): Promise<StoredEvent[]> {
    return this.events.filter(
      (e) => e.eventType === eventType && (!since || e.metadata.timestamp >= since),
    );
  }

  /**
   * Replay all events to rebuild a projection from scratch.
   */
  async replayAll(
    handler: (event: StoredEvent) => Promise<void>,
  ): Promise<number> {
    let count = 0;
    for (const event of this.events) {
      await handler(event);
      count++;
    }
    return count;
  }
}
