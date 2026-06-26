/**
 * LRU Cache with O(1) get/put — Doubly Linked List + HashMap.
 *
 * Used by: Every database (PostgreSQL buffer pool), CDNs, CPU caches.
 * Use case in Lumina: Cache hot user profiles, chat metadata, and
 * frequently accessed messages without Redis round-trip latency.
 *
 * This is the #1 most-asked data structure interview question at Google.
 */

interface CacheNode<K, V> {
  key: K;
  value: V;
  prev: CacheNode<K, V> | null;
  next: CacheNode<K, V> | null;
  expiresAt?: number; // TTL support
}

export class LRUCache<K, V> {
  private capacity: number;
  private map: Map<K, CacheNode<K, V>>;
  private head: CacheNode<K, V>; // Most recently used
  private tail: CacheNode<K, V>; // Least recently used
  private hits = 0;
  private misses = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.map = new Map();
    // Sentinel nodes (simplifies edge cases)
    this.head = { key: null as any, value: null as any, prev: null, next: null };
    this.tail = { key: null as any, value: null as any, prev: null, next: null };
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  get(key: K): V | undefined {
    const node = this.map.get(key);
    if (!node) {
      this.misses++;
      return undefined;
    }
    // Check TTL
    if (node.expiresAt && Date.now() > node.expiresAt) {
      this.remove(node);
      this.map.delete(key);
      this.misses++;
      return undefined;
    }
    this.hits++;
    this.moveToHead(node);
    return node.value;
  }

  put(key: K, value: V, ttlMs?: number): void {
    const existing = this.map.get(key);
    if (existing) {
      existing.value = value;
      existing.expiresAt = ttlMs ? Date.now() + ttlMs : undefined;
      this.moveToHead(existing);
      return;
    }

    if (this.map.size >= this.capacity) {
      this.evict();
    }

    const node: CacheNode<K, V> = {
      key, value,
      prev: null, next: null,
      expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
    };
    this.map.set(key, node);
    this.addToHead(node);
  }

  get stats() {
    const total = this.hits + this.misses;
    return {
      size: this.map.size,
      capacity: this.capacity,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total * 100).toFixed(1) + '%' : '0%',
    };
  }

  private evict(): void {
    const lru = this.tail.prev!;
    if (lru === this.head) return;
    this.remove(lru);
    this.map.delete(lru.key);
  }

  private moveToHead(node: CacheNode<K, V>): void {
    this.remove(node);
    this.addToHead(node);
  }

  private addToHead(node: CacheNode<K, V>): void {
    node.prev = this.head;
    node.next = this.head.next;
    this.head.next!.prev = node;
    this.head.next = node;
  }

  private remove(node: CacheNode<K, V>): void {
    node.prev!.next = node.next;
    node.next!.prev = node.prev;
  }
}
