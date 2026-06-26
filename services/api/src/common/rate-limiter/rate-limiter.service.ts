import { Injectable, HttpStatus, HttpException } from '@nestjs/common';

/**
 * Sliding Window Log Rate Limiter using Redis ZSET.
 * Prevents the "Thundering Herd" problem at window boundaries.
 *
 * In production, inject a real Redis (ioredis) client.
 * This implementation shows the exact algorithm with an in-memory fallback.
 */
@Injectable()
export class RateLimiterService {
  // In-memory fallback (replace with Redis in production)
  private store = new Map<string, number[]>();

  /**
   * Sliding Window Log Algorithm
   * @param key Unique identifier (e.g., userId, IP)
   * @param limit Max requests allowed in the window
   * @param windowSeconds Time window in seconds
   */
  async throttle(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<void> {
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;
    const redisKey = `rate_limit:${key}`;

    // Get or create the request log
    let requests = this.store.get(redisKey) || [];

    // 1. Remove old requests outside the window
    requests = requests.filter((timestamp) => timestamp > windowStart);

    // 2. Check if limit exceeded BEFORE adding current request
    if (requests.length >= limit) {
      // Calculate Retry-After from the oldest request in window
      const oldestInWindow = requests[0];
      const retryAfterMs = oldestInWindow + windowSeconds * 1000 - now;
      const retryAfterSeconds = Math.ceil(retryAfterMs / 1000);

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded',
          retryAfter: retryAfterSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // 3. Add current request
    requests.push(now);
    this.store.set(redisKey, requests);

    // 4. Cleanup: remove keys that haven't been accessed (memory management)
    // In Redis, this is handled by EXPIRE automatically
  }

  /**
   * Get remaining requests for a key
   */
  getRemainingRequests(
    key: string,
    limit: number,
    windowSeconds: number,
  ): number {
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;
    const redisKey = `rate_limit:${key}`;
    const requests = (this.store.get(redisKey) || []).filter(
      (t) => t > windowStart,
    );
    return Math.max(0, limit - requests.length);
  }
}
