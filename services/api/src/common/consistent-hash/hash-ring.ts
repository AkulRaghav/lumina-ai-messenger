/**
 * Consistent Hashing — Distributes load across nodes with minimal rehashing.
 *
 * Problem: When you add/remove a WebSocket gateway node, a naive hash
 * (userId % numNodes) would reassign ALL users. Consistent hashing only
 * reassigns ~1/n of the keys.
 *
 * Used by: DynamoDB, Cassandra, Memcached, Discord (guild sharding),
 * Akamai CDN, and every serious distributed system.
 *
 * Virtual nodes prevent hotspots from uneven distribution.
 */

export class ConsistentHashRing {
  private ring = new Map<number, string>(); // position → nodeId
  private sortedKeys: number[] = [];
  private readonly virtualNodes: number;

  constructor(virtualNodes: number = 150) {
    this.virtualNodes = virtualNodes;
  }

  /**
   * Add a node to the ring with virtual node replicas.
   */
  addNode(nodeId: string): void {
    for (let i = 0; i < this.virtualNodes; i++) {
      const virtualKey = `${nodeId}#${i}`;
      const position = this.hash(virtualKey);
      this.ring.set(position, nodeId);
    }
    this.rebuildSortedKeys();
  }

  /**
   * Remove a node and all its virtual replicas.
   */
  removeNode(nodeId: string): void {
    for (let i = 0; i < this.virtualNodes; i++) {
      const virtualKey = `${nodeId}#${i}`;
      const position = this.hash(virtualKey);
      this.ring.delete(position);
    }
    this.rebuildSortedKeys();
  }

  /**
   * Get the node responsible for a given key.
   * Walks clockwise on the ring until it finds the first node.
   */
  getNode(key: string): string | null {
    if (this.sortedKeys.length === 0) return null;

    const position = this.hash(key);

    // Binary search for the first position >= hash
    let low = 0;
    let high = this.sortedKeys.length - 1;

    while (low < high) {
      const mid = (low + high) >>> 1;
      if (this.sortedKeys[mid] < position) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    // If we've gone past the end, wrap around to the first node
    const idx = low < this.sortedKeys.length ? low : 0;
    return this.ring.get(this.sortedKeys[idx]) || null;
  }

  /**
   * Get N nodes for replication (the next N distinct nodes clockwise).
   */
  getNodes(key: string, count: number): string[] {
    if (this.sortedKeys.length === 0) return [];

    const nodes: string[] = [];
    const seen = new Set<string>();
    const position = this.hash(key);

    let idx = this.sortedKeys.findIndex((k) => k >= position);
    if (idx === -1) idx = 0;

    while (nodes.length < count && seen.size < this.ring.size) {
      const node = this.ring.get(this.sortedKeys[idx % this.sortedKeys.length]);
      if (node && !seen.has(node)) {
        seen.add(node);
        nodes.push(node);
      }
      idx++;
    }

    return nodes;
  }

  get nodeCount(): number {
    const unique = new Set(this.ring.values());
    return unique.size;
  }

  /**
   * MurmurHash3-like 32-bit hash for uniform distribution.
   */
  private hash(key: string): number {
    let h = 0x12345678;
    for (let i = 0; i < key.length; i++) {
      h ^= key.charCodeAt(i);
      h = Math.imul(h, 0x5bd1e995);
      h ^= h >>> 15;
    }
    return h >>> 0; // Unsigned 32-bit
  }

  private rebuildSortedKeys(): void {
    this.sortedKeys = Array.from(this.ring.keys()).sort((a, b) => a - b);
  }
}
