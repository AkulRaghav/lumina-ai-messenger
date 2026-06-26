/**
 * Bloom Filter — Probabilistic data structure for set membership testing.
 *
 * Use case in Lumina: Fast "has this user seen this message?" check
 * without hitting the database. False positives are acceptable
 * (worst case: we skip a redundant notification). False negatives
 * are impossible (we never miss a genuinely unseen message).
 *
 * Space: O(m) bits — far smaller than storing the full set.
 * Lookup: O(k) hash functions — constant time.
 *
 * Used by: Chrome (malicious URL detection), Medium (recommend articles),
 * Cassandra (avoid disk reads for non-existent keys).
 */

export class BloomFilter {
  private bitArray: Uint8Array;
  private readonly size: number;       // Number of bits
  private readonly numHashes: number;  // Number of hash functions

  constructor(expectedItems: number, falsePositiveRate: number = 0.01) {
    // Optimal size: m = -(n * ln(p)) / (ln(2))^2
    this.size = Math.ceil(
      -(expectedItems * Math.log(falsePositiveRate)) / Math.pow(Math.log(2), 2),
    );
    // Optimal hash count: k = (m/n) * ln(2)
    this.numHashes = Math.ceil((this.size / expectedItems) * Math.log(2));
    this.bitArray = new Uint8Array(Math.ceil(this.size / 8));
  }

  /**
   * Add an item to the filter.
   */
  add(item: string): void {
    for (let i = 0; i < this.numHashes; i++) {
      const position = this.hash(item, i) % this.size;
      const byteIndex = Math.floor(position / 8);
      const bitIndex = position % 8;
      this.bitArray[byteIndex] |= 1 << bitIndex;
    }
  }

  /**
   * Test if an item might be in the set.
   * Returns true = "probably yes" (small chance of false positive)
   * Returns false = "definitely not" (guaranteed)
   */
  mightContain(item: string): boolean {
    for (let i = 0; i < this.numHashes; i++) {
      const position = this.hash(item, i) % this.size;
      const byteIndex = Math.floor(position / 8);
      const bitIndex = position % 8;
      if ((this.bitArray[byteIndex] & (1 << bitIndex)) === 0) {
        return false; // Definitely not in set
      }
    }
    return true; // Probably in set
  }

  /**
   * FNV-1a hash with seed for multiple independent hash functions.
   * Using double hashing technique: h(i) = h1 + i * h2
   */
  private hash(item: string, seed: number): number {
    let h1 = 0x811c9dc5; // FNV offset basis
    let h2 = 0;

    for (let i = 0; i < item.length; i++) {
      h1 ^= item.charCodeAt(i);
      h1 = Math.imul(h1, 0x01000193); // FNV prime
      h2 ^= item.charCodeAt(i) * (i + 1);
      h2 = Math.imul(h2, 0x5bd1e995); // Murmur-like
    }

    // Double hashing: combine h1 and h2 with seed
    return Math.abs((h1 + seed * h2) | 0);
  }

  get stats() {
    let setBits = 0;
    for (let i = 0; i < this.bitArray.length; i++) {
      let byte = this.bitArray[i];
      while (byte) {
        setBits += byte & 1;
        byte >>= 1;
      }
    }
    return {
      totalBits: this.size,
      setBits,
      fillRatio: setBits / this.size,
      hashFunctions: this.numHashes,
      memoryBytes: this.bitArray.length,
    };
  }
}
