import { connect, StringCodec } from 'nats';
import { Redis } from 'ioredis';
import express from 'express';
import * as dotenv from 'dotenv';

dotenv.config();

const sc = StringCodec();
const app = express();

class AnalyticsService {
  private redis: Redis;
  private natsConn: any;

  // Real-time counters (backed by Redis)
  private metrics = {
    messagesTotal: 0,
    messagesPerMinute: 0,
    activeConnections: 0,
    aiRequestsTotal: 0,
  };

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async start() {
    this.natsConn = await connect({
      servers: process.env.NATS_URL || 'nats://localhost:4222',
      name: 'lumina-analytics',
    });

    console.log('[analytics] Connected to NATS');

    // Track message events
    this.trackMessages();
    this.trackPresence();
    this.trackAI();

    // Expose Prometheus-compatible metrics endpoint
    this.startMetricsServer();

    // Aggregate per-minute stats into Redis time-series
    setInterval(() => this.flushMinuteStats(), 60000);
  }

  private async trackMessages() {
    const sub = this.natsConn.subscribe('chat.*.messages');
    for await (const msg of sub) {
      this.metrics.messagesTotal++;
      this.metrics.messagesPerMinute++;

      // Increment Redis counter for hourly aggregation
      const hourKey = `stats:messages:${new Date().toISOString().slice(0, 13)}`;
      await this.redis.incr(hourKey);
      await this.redis.expire(hourKey, 7 * 24 * 3600); // Keep 7 days

      try {
        const data = JSON.parse(sc.decode(msg.data));
        // Track per-chat activity
        await this.redis.zincrby('stats:active_chats', 1, data.chatId || 'unknown');
        // Track per-user activity
        await this.redis.zincrby('stats:active_users', 1, data.senderId || 'unknown');
      } catch (e) {
        // Ignore parse errors
      }
    }
  }

  private async trackPresence() {
    const onlineSub = this.natsConn.subscribe('presence.online');
    const offlineSub = this.natsConn.subscribe('presence.offline');

    (async () => {
      for await (const _ of onlineSub) {
        this.metrics.activeConnections++;
        await this.redis.incr('stats:connections_current');
      }
    })();

    (async () => {
      for await (const _ of offlineSub) {
        this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
        await this.redis.decr('stats:connections_current');
      }
    })();
  }

  private async trackAI() {
    const sub = this.natsConn.subscribe('ai.process_message');
    for await (const _ of sub) {
      this.metrics.aiRequestsTotal++;
      const hourKey = `stats:ai:${new Date().toISOString().slice(0, 13)}`;
      await this.redis.incr(hourKey);
      await this.redis.expire(hourKey, 7 * 24 * 3600);
    }
  }

  private async flushMinuteStats() {
    const minuteKey = `stats:rpm:${new Date().toISOString().slice(0, 16)}`;
    await this.redis.set(minuteKey, this.metrics.messagesPerMinute.toString());
    await this.redis.expire(minuteKey, 24 * 3600); // Keep 24 hours
    this.metrics.messagesPerMinute = 0;
  }

  private startMetricsServer() {
    // Prometheus-compatible /metrics endpoint
    app.get('/metrics', async (_, res) => {
      const connections = await this.redis.get('stats:connections_current') || '0';
      const output = [
        `# HELP lumina_messages_total Total messages processed`,
        `# TYPE lumina_messages_total counter`,
        `lumina_messages_total ${this.metrics.messagesTotal}`,
        `# HELP lumina_active_connections Current WebSocket connections`,
        `# TYPE lumina_active_connections gauge`,
        `lumina_active_connections ${connections}`,
        `# HELP lumina_ai_requests_total Total AI processing requests`,
        `# TYPE lumina_ai_requests_total counter`,
        `lumina_ai_requests_total ${this.metrics.aiRequestsTotal}`,
      ].join('\n');
      res.set('Content-Type', 'text/plain');
      res.send(output);
    });

    app.get('/health', (_, res) => res.json({ status: 'ok' }));

    // Dashboard API for admin panel
    app.get('/api/stats', async (_, res) => {
      const topChats = await this.redis.zrevrange('stats:active_chats', 0, 9, 'WITHSCORES');
      const topUsers = await this.redis.zrevrange('stats:active_users', 0, 9, 'WITHSCORES');
      res.json({
        messagesTotal: this.metrics.messagesTotal,
        activeConnections: await this.redis.get('stats:connections_current'),
        topChats,
        topUsers,
      });
    });

    const port = process.env.PORT || 9090;
    app.listen(port, () => {
      console.log(`[analytics] Metrics server on :${port}`);
    });
  }
}

const service = new AnalyticsService();
service.start().catch(console.error);
