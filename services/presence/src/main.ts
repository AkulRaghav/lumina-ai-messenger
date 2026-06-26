import { connect, StringCodec } from 'nats';
import { Redis } from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config();

const sc = StringCodec();
const PRESENCE_TTL = 90; // seconds before user is considered offline
const TYPING_TTL = 4;   // seconds typing indicator stays active

class PresenceService {
  private redis: Redis;
  private natsConn: any;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async start() {
    this.natsConn = await connect({
      servers: process.env.NATS_URL || 'nats://localhost:4222',
      name: 'lumina-presence',
    });

    console.log('[presence] Connected to NATS');

    // Listen for online/offline events from WebSocket gateway
    this.subscribeOnline();
    this.subscribeOffline();
    this.subscribeTyping();
    this.subscribeHeartbeat();

    // Periodic cleanup of stale presence
    setInterval(() => this.cleanupStalePresence(), 30000);
  }

  private async subscribeOnline() {
    const sub = this.natsConn.subscribe('presence.online');
    for await (const msg of sub) {
      const userId = sc.decode(msg.data);
      await this.redis.setex(`presence:${userId}`, PRESENCE_TTL, 'online');
      await this.redis.set(`last_seen:${userId}`, Date.now().toString());

      // Broadcast to subscribers of this user's presence
      this.natsConn.publish(
        `presence.update.${userId}`,
        sc.encode(JSON.stringify({ userId, status: 'online', timestamp: Date.now() })),
      );
      console.log(`[presence] ${userId} → online`);
    }
  }

  private async subscribeOffline() {
    const sub = this.natsConn.subscribe('presence.offline');
    for await (const msg of sub) {
      const userId = sc.decode(msg.data);
      await this.redis.del(`presence:${userId}`);
      await this.redis.set(`last_seen:${userId}`, Date.now().toString());

      this.natsConn.publish(
        `presence.update.${userId}`,
        sc.encode(JSON.stringify({ userId, status: 'offline', timestamp: Date.now() })),
      );
      console.log(`[presence] ${userId} → offline`);
    }
  }

  private async subscribeTyping() {
    const sub = this.natsConn.subscribe('lumina.typing.*');
    for await (const msg of sub) {
      try {
        const data = JSON.parse(sc.decode(msg.data));
        const { userId, chatId, isTyping } = data;

        if (isTyping) {
          await this.redis.setex(`typing:${chatId}:${userId}`, TYPING_TTL, '1');
        } else {
          await this.redis.del(`typing:${chatId}:${userId}`);
        }

        // Broadcast typing state to chat members
        this.natsConn.publish(
          `chat.${chatId}.typing`,
          sc.encode(JSON.stringify({ userId, chatId, isTyping })),
        );
      } catch (e) {
        // Ignore malformed messages
      }
    }
  }

  private async subscribeHeartbeat() {
    const sub = this.natsConn.subscribe('presence.heartbeat');
    for await (const msg of sub) {
      const userId = sc.decode(msg.data);
      // Extend TTL on heartbeat
      await this.redis.expire(`presence:${userId}`, PRESENCE_TTL);
    }
  }

  private async cleanupStalePresence() {
    // Redis TTL handles this automatically, but we log for monitoring
    const keys = await this.redis.keys('presence:*');
    console.log(`[presence] Active users: ${keys.length}`);
  }
}

const service = new PresenceService();
service.start().catch(console.error);
