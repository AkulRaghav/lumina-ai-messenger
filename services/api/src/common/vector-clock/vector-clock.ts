/**
 * Vector Clock — Causal ordering in distributed systems.
 *
 * Problem: Wall clocks drift. Two servers might disagree on "which
 * message came first." Vector clocks capture causality without
 * synchronized clocks.
 *
 * Used by: Amazon DynamoDB, Riak, distributed chat systems.
 * Guarantees: If event A happened-before event B, A's vector clock
 * is strictly less than B's. Concurrent events are incomparable.
 */

export class VectorClock {
  private clock: Map<string, number>;

  constructor(nodeId?: string) {
    this.clock = new Map();
    if (nodeId) this.clock.set(nodeId, 0);
  }

  /** Increment this node's logical timestamp (on local event). */
  increment(nodeId: string): VectorClock {
    const current = this.clock.get(nodeId) || 0;
    this.clock.set(nodeId, current + 1);
    return this;
  }

  /** Merge with a received clock (on message receive). */
  merge(other: VectorClock): VectorClock {
    for (const [node, time] of other.clock) {
      const local = this.clock.get(node) || 0;
      this.clock.set(node, Math.max(local, time));
    }
    return this;
  }

  /** Check if this clock happened-before another. */
  happenedBefore(other: VectorClock): boolean {
    let atLeastOneLess = false;
    for (const [node, time] of this.clock) {
      const otherTime = other.clock.get(node) || 0;
      if (time > otherTime) return false;
      if (time < otherTime) atLeastOneLess = true;
    }
    // Check nodes in other but not in this
    for (const [node, time] of other.clock) {
      if (!this.clock.has(node) && time > 0) {
        atLeastOneLess = true;
      }
    }
    return atLeastOneLess;
  }

  /** Check if two events are concurrent (neither happened-before). */
  isConcurrentWith(other: VectorClock): boolean {
    return !this.happenedBefore(other) && !other.happenedBefore(this);
  }

  serialize(): Record<string, number> {
    return Object.fromEntries(this.clock);
  }

  static deserialize(data: Record<string, number>): VectorClock {
    const vc = new VectorClock();
    for (const [node, time] of Object.entries(data)) {
      vc.clock.set(node, time);
    }
    return vc;
  }
}
