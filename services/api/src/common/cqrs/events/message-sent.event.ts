/**
 * Domain Event - Emitted after a message is successfully persisted.
 * Event Sourcing: these events form an append-only log that can
 * reconstruct state at any point in time.
 */
export class MessageSentEvent {
  public readonly occurredAt: Date;

  constructor(
    public readonly messageId: string,
    public readonly chatId: string,
    public readonly senderId: string,
    public readonly content: string,
    public readonly type: string,
  ) {
    this.occurredAt = new Date();
  }
}

export class MessageDeliveredEvent {
  constructor(
    public readonly messageId: string,
    public readonly chatId: string,
    public readonly recipientId: string,
    public readonly deliveredAt: Date = new Date(),
  ) {}
}

export class MessageReadEvent {
  constructor(
    public readonly messageId: string,
    public readonly chatId: string,
    public readonly readerId: string,
    public readonly readAt: Date = new Date(),
  ) {}
}
