/**
 * Merkle Tree — Tamper-proof data verification structure.
 *
 * Used by: Git, Bitcoin, Ethereum, IPFS, AWS DynamoDB (anti-entropy).
 * Use case in Lumina: Verify message history integrity between
 * client and server (detect tampering or corruption during sync).
 *
 * Each leaf is a hash of a message. Parent nodes are hashes of
 * their children. If any message is modified, the root hash changes.
 * Verification is O(log n) — only need the "proof path" to root.
 */

import { createHash } from 'crypto';

export class MerkleTree {
  private leaves: string[] = [];
  private layers: string[][] = [];

  constructor(data: string[]) {
    this.leaves = data.map((d) => this.hash(d));
    this.buildTree();
  }

  get root(): string {
    return this.layers[this.layers.length - 1]?.[0] || '';
  }

  /**
   * Generate a proof path for a specific leaf index.
   * The verifier only needs this path + the leaf to recompute root.
   */
  getProof(index: number): Array<{ hash: string; position: 'left' | 'right' }> {
    const proof: Array<{ hash: string; position: 'left' | 'right' }> = [];
    let idx = index;

    for (let i = 0; i < this.layers.length - 1; i++) {
      const layer = this.layers[i];
      const isRightNode = idx % 2 === 1;
      const siblingIdx = isRightNode ? idx - 1 : idx + 1;

      if (siblingIdx < layer.length) {
        proof.push({
          hash: layer[siblingIdx],
          position: isRightNode ? 'left' : 'right',
        });
      }
      idx = Math.floor(idx / 2);
    }
    return proof;
  }

  /**
   * Verify a proof against a known root hash.
   */
  static verify(
    leaf: string,
    proof: Array<{ hash: string; position: 'left' | 'right' }>,
    root: string,
  ): boolean {
    let computed = createHash('sha256').update(leaf).digest('hex');

    for (const step of proof) {
      const combined = step.position === 'left'
        ? step.hash + computed
        : computed + step.hash;
      computed = createHash('sha256').update(combined).digest('hex');
    }
    return computed === root;
  }

  private buildTree(): void {
    this.layers = [this.leaves];
    let currentLayer = this.leaves;

    while (currentLayer.length > 1) {
      const nextLayer: string[] = [];
      for (let i = 0; i < currentLayer.length; i += 2) {
        const left = currentLayer[i];
        const right = currentLayer[i + 1] || left; // Duplicate odd leaf
        nextLayer.push(this.hash(left + right));
      }
      this.layers.push(nextLayer);
      currentLayer = nextLayer;
    }
  }

  private hash(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }
}
