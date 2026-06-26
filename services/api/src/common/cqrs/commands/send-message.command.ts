/**
 * CQRS Command - Write side of message handling.
 * Commands are fire-and-forget intents that modify state.
 * Decouples the "what happened" from the "what do we do about it."
 */
export class SendMessageCommand {
  constructor(
    public readonly chatId: string,
    public readonly senderId: string,
    public readonly content: string,
    public readonly replyToId?: string,
    public readonly type: string = 'TEXT',
  ) {}
}

export class EditMessageCommand {
  constructor(
    public readonly messageId: string,
    public readonly userId: string,
    public readonly newContent: string,
  ) {}
}

export class DeleteMessageCommand {
  constructor(
    public readonly messageId: string,
    public readonly userId: string,
    public readonly forEveryone: boolean = false,
  ) {}
}
