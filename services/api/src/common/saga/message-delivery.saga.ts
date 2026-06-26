import { Injectable } from '@nestjs/common';

/**
 * Saga Pattern — Distributed Transaction Coordinator.
 *
 * Problem: Sending a message involves multiple services:
 * 1. Persist to PostgreSQL
 * 2. Publish to NATS for real-time delivery
 * 3. Trigger AI embedding
 * 4. Send push notification
 * 5. Update read model / analytics
 *
 * If step 3 fails, we don't want to roll back step 1 (that would lose the message).
 * Instead, we use compensating transactions.
 *
 * This is the exact pattern used by Uber, Netflix, and Stripe for distributed systems.
 */

interface SagaStep<T> {
  name: string;
  execute: (context: T) => Promise<void>;
  compensate: (context: T) => Promise<void>;
}

interface SagaContext {
  messageId: string;
  chatId: string;
  senderId: string;
  content: string;
  completedSteps: string[];
  errors: Array<{ step: string; error: string }>;
}

@Injectable()
export class MessageDeliverySaga {
  private steps: SagaStep<SagaContext>[] = [
    {
      name: 'persist_message',
      execute: async (ctx) => {
        // Already done by the time saga runs (we persist first for durability)
        ctx.completedSteps.push('persist_message');
      },
      compensate: async (ctx) => {
        // Mark message as FAILED in DB (don't delete — audit trail)
        console.log(`[saga] Compensating: marking ${ctx.messageId} as FAILED`);
      },
    },
    {
      name: 'broadcast_realtime',
      execute: async (ctx) => {
        // Publish to NATS for WebSocket delivery
        // In production: this.natsClient.publish(`chat.${ctx.chatId}.messages`, ...)
        ctx.completedSteps.push('broadcast_realtime');
      },
      compensate: async (ctx) => {
        // Publish a "message_retracted" event to remove from UI
        console.log(`[saga] Compensating: retracting ${ctx.messageId} from real-time`);
      },
    },
    {
      name: 'trigger_ai_embedding',
      execute: async (ctx) => {
        // Publish to NATS for AI processing (non-critical — failure is acceptable)
        ctx.completedSteps.push('trigger_ai_embedding');
      },
      compensate: async (_ctx) => {
        // No compensation needed — AI can reprocess later
      },
    },
    {
      name: 'send_push_notification',
      execute: async (ctx) => {
        // Publish to notification service
        ctx.completedSteps.push('send_push_notification');
      },
      compensate: async (_ctx) => {
        // Cannot un-send a push notification — log for monitoring
      },
    },
  ];

  /**
   * Execute the saga. If any step fails, compensate all previously completed steps.
   */
  async execute(context: SagaContext): Promise<SagaContext> {
    for (const step of this.steps) {
      try {
        await step.execute(context);
      } catch (error: any) {
        context.errors.push({ step: step.name, error: error.message });
        console.error(`[saga] Step "${step.name}" failed: ${error.message}`);

        // Compensate in reverse order
        await this.compensate(context);
        break;
      }
    }
    return context;
  }

  private async compensate(context: SagaContext): Promise<void> {
    const completedSteps = [...context.completedSteps].reverse();
    for (const stepName of completedSteps) {
      const step = this.steps.find((s) => s.name === stepName);
      if (step) {
        try {
          await step.compensate(context);
        } catch (e: any) {
          console.error(`[saga] Compensation for "${stepName}" failed: ${e.message}`);
          // Log to dead-letter queue for manual intervention
        }
      }
    }
  }
}
