/**
 * CRDT — Conflict-free Replicated Data Type (Last-Writer-Wins Register).
 *
 * Problem: In a distributed system with multiple replicas, two users
 * might edit the same chat name at the same time on different servers.
 * Traditional databases need distributed locks. CRDTs resolve conflicts
 * automatically without coordination.
 *
 * LWW-Register: The write with the highest timestamp wins.
 * Guarantee: All replicas will eventually converge to the same state
 * regardless of message ordering (Strong Eventual Consistency).
 *
 * Used by: Riak, Redis CRDT, Figma (multiplayer editing), Apple Notes sync.
 */

interface LWWEntry<T> {
  value: T;
  timestamp: number; // Lamport clock or wall clock
  nodeId: string;    // Tie-breaking when timestamps are equal
}

export class LWWRegister<T> {
  private entry: LWWEntry<T>;

  constructor(initialValue: T, nodeId: string) {
    this.entry = {
      value: initialValue,
      timestamp: Date.now(),
      nodeId,
    };
  }

  get value(): T {
    return this.entry.value;
  }

  get lastUpdated(): number {
    return this.entry.timestamp;
  }

  /**
   * Set a new value. Only takes effect if timestamp is newer.
   */
  set(value: T, timestamp: number, nodeId: string): boolean {
    if (this.shouldUpdate(timestamp, nodeId)) {
      this.entry = { value, timestamp, nodeId };
      return true;
    }
    return false; // Stale write rejected
  }

  /**
   * Merge with a remote replica's state.
   * This is the core CRDT merge operation — commutative, associative, idempotent.
   */
  merge(remote: LWWRegister<T>): void {
    if (this.shouldUpdate(remote.entry.timestamp, remote.entry.nodeId)) {
      this.entry = { ...remote.entry };
    }
  }

  private shouldUpdate(newTimestamp: number, newNodeId: string): boolean {
    if (newTimestamp > this.entry.timestamp) return true;
    if (newTimestamp === this.entry.timestamp) {
      // Tie-breaking: lexicographic comparison of node IDs
      return newNodeId > this.entry.nodeId;
    }
    return false;
  }

  /**
   * Serialize for network transmission between replicas.
   */
  serialize(): LWWEntry<T> {
    return { ...this.entry };
  }

  static fromSerialized<T>(data: LWWEntry<T>): LWWRegister<T> {
    const register = new LWWRegister<T>(data.value, data.nodeId);
    register.entry = { ...data };
    return register;
  }
}

/**
 * LWW-Map: A map where each key is an independent LWW-Register.
 * Use case: User profile fields that can be edited on multiple devices.
 */
export class LWWMap<T> {
  private registers = new Map<string, LWWRegister<T>>();
  private readonly nodeId: string;

  constructor(nodeId: string) {
    this.nodeId = nodeId;
  }

  set(key: string, value: T): void {
    const existing = this.registers.get(key);
    if (existing) {
      existing.set(value, Date.now(), this.nodeId);
    } else {
      this.registers.set(key, new LWWRegister(value, this.nodeId));
    }
  }

  get(key: string): T | undefined {
    return this.registers.get(key)?.value;
  }

  merge(remoteKey: string, remoteEntry: LWWEntry<T>): void {
    const local = this.registers.get(remoteKey);
    if (local) {
      const remote = LWWRegister.fromSerialized(remoteEntry);
      local.merge(remote);
    } else {
      this.registers.set(remoteKey, LWWRegister.fromSerialized(remoteEntry));
    }
  }

  entries(): Array<[string, T]> {
    const result: Array<[string, T]> = [];
    for (const [key, register] of this.registers) {
      result.push([key, register.value]);
    }
    return result;
  }
}
