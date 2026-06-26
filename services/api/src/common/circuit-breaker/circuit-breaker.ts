/**
 * Circuit Breaker Pattern — Prevents cascading failures in distributed systems.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Requests immediately fail without calling the downstream service
 * - HALF_OPEN: Allow a single probe request to test if service recovered
 *
 * Used by: Netflix Hystrix, Resilience4j, Polly (.NET)
 * This is a from-scratch implementation (no library dependency).
 */

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

interface CircuitBreakerOptions {
  failureThreshold: number;    // Failures before opening (default: 5)
  successThreshold: number;    // Successes in HALF_OPEN before closing (default: 2)
  timeout: number;             // Time in ms before OPEN → HALF_OPEN (default: 30000)
  monitorInterval: number;     // Reset failure count window in ms (default: 60000)
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private readonly options: CircuitBreakerOptions;
  private readonly name: string;

  constructor(name: string, options: Partial<CircuitBreakerOptions> = {}) {
    this.name = name;
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      successThreshold: options.successThreshold || 2,
      timeout: options.timeout || 30000,
      monitorInterval: options.monitorInterval || 60000,
    };
  }

  get currentState(): CircuitState {
    return this.state;
  }

  /**
   * Execute a function through the circuit breaker.
   * If circuit is OPEN, immediately throws without calling fn.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.options.timeout) {
        this.state = CircuitState.HALF_OPEN;
        console.log(`[circuit-breaker:${this.name}] OPEN → HALF_OPEN (probing)`);
      } else {
        throw new Error(
          `[circuit-breaker:${this.name}] Circuit is OPEN. Service unavailable.`,
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failureCount = 0;
        this.successCount = 0;
        console.log(`[circuit-breaker:${this.name}] HALF_OPEN → CLOSED (recovered)`);
      }
    } else {
      this.failureCount = 0; // Reset on success in CLOSED state
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.successCount = 0;
      console.log(`[circuit-breaker:${this.name}] HALF_OPEN → OPEN (probe failed)`);
    } else if (this.failureCount >= this.options.failureThreshold) {
      this.state = CircuitState.OPEN;
      console.log(`[circuit-breaker:${this.name}] CLOSED → OPEN (threshold reached: ${this.failureCount})`);
    }
  }
}
