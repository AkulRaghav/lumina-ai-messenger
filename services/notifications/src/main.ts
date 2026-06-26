import { connect, StringCodec } from 'nats';
import { Redis } from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config();

const sc = StringCodec();

interface PushPayload {
  userId: string;
  chatId: string;
  senderName: string;
  messagePreview: string;
  messageId: string;
}

class NotificationService {
  private redis: Redis;
  private natsConn: any;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async start() {
    this.natsConn = await connect({
      servers: process.env.NATS_URL || 'nats://localhost:4222',
      name: 'lumina-notifications',
    });

    console.log('[notifications] Connected to NATS');

    // Subscribe to new message events
    const sub = this.natsConn.subscribe('lumina.notifications.push');
    for await (const msg of sub) {
      try {
        const payload: PushPayload = JSON.parse(sc.decode(msg.data));
        await this.handlePush(payload);
      } catch (e) {
        console.error('[notifications] Error processing:', e);
      }
    }
  }

  private async handlePush(payload: PushPayload) {
    // Check if user has muted this chat
    const isMuted = await this.redis.get(`mute:${payload.userId}:${payload.chatId}`);
    if (isMuted) return;

    // Check if user is currently online (skip push if active)
    const isOnline = await this.redis.get(`presence:${payload.userId}`);
    if (isOnline === 'online') return;

    // Get user's FCM tokens
    const tokens = await this.redis.smembers(`fcm_tokens:${payload.userId}`);
    if (tokens.length === 0) return;

    // Deduplicate: don't send same notification twice
    const dedupeKey = `notif_sent:${payload.messageId}`;
    const alreadySent = await this.redis.set(dedupeKey, '1', 'EX', 60, 'NX');
    if (!alreadySent) return;

    // In production: call Firebase Admin SDK
    // admin.messaging().sendEachForMulticast({
    //   tokens,
    //   notification: {
    //     title: payload.senderName,
    //     body: payload.messagePreview.substring(0, 100),
    //   },
    //   data: { chatId: payload.chatId, messageId: payload.messageId },
    //   android: { priority: 'high' },
    //   apns: { payload: { aps: { sound: 'default', badge: 1 } } },
    // });

    console.log(`[notifications] Push sent to ${payload.userId} (${tokens.length} devices)`);
  }
}

const service = new NotificationService();
service.start().catch(console.error);
