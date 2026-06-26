/**
 * Skip List — Probabilistic sorted data structure.
 *
 * O(log n) search, insert, delete — like a balanced BST but simpler.
 * Used by: Redis (sorted sets ZSET), LevelDB, MemSQL.
 * Use case in Lumina: In-memory sorted message index for cursor-based
 * pagination without hitting the database on every scroll.
 *
 * Advantage over B-Tree: No rebalancing, lock-free concurrent reads.
 */

const MAX_LEVEL = 16;
const P = 0.5; // Probability of promoting to next level

interface SkipNode<K, V> {
  key: K;
  value: V;
  next: Array<SkipNode<K, V> | null>;
}

export class SkipList<K extends number | string, V> {
  private head: SkipNode<K, V>;
  private level: number = 0;
  private _size: number = 0;

  constructor() {
    this.head = {
      key: null as any,
      value: null as any,
      next: new Array(MAX_LEVEL).fill(null),
    };
  }

  get size(): number {
    return this._size;
  }

  insert(key: K, value: V): void {
    const update: Array<SkipNode<K, V>> = new Array(MAX_LEVEL);
    let current = this.head;

    for (let i = this.level; i >= 0; i--) {
      while (current.next[i] && current.next[i]!.key < key) {
        current = current.next[i]!;
      }
      update[i] = current;
    }

    const nodeLevel = this.randomLevel();
    if (nodeLevel > this.level) {
      for (let i = this.level + 1; i <= nodeLevel; i++) {
        update[i] = this.head;
      }
      this.level = nodeLevel;
    }

    const newNode: SkipNode<K, V> = {
      key,
      value,
      next: new Array(nodeLevel + 1).fill(null),
    };

    for (let i = 0; i <= nodeLevel; i++) {
      newNode.next[i] = update[i].next[i];
      update[i].next[i] = newNode;
    }
    this._size++;
  }

  search(key: K): V | null {
    let current = this.head;
    for (let i = this.level; i >= 0; i--) {
      while (current.next[i] && current.next[i]!.key < key) {
        current = current.next[i]!;
      }
    }
    current = current.next[0]!;
    if (current && current.key === key) return current.value;
    return null;
  }

  /** Range query: get all entries between low and high (inclusive). */
  range(low: K, high: K): Array<{ key: K; value: V }> {
    const result: Array<{ key: K; value: V }> = [];
    let current = this.head;

    for (let i = this.level; i >= 0; i--) {
      while (current.next[i] && current.next[i]!.key < low) {
        current = current.next[i]!;
      }
    }
    current = current.next[0]!;

    while (current && current.key <= high) {
      result.push({ key: current.key, value: current.value });
      current = current.next[0]!;
    }
    return result;
  }

  private randomLevel(): number {
    let level = 0;
    while (Math.random() < P && level < MAX_LEVEL - 1) {
      level++;
    }
    return level;
  }
}
