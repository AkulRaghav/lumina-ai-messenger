"""
Self-Attention Mechanism — The core of all Transformer models.

This is a from-scratch NumPy implementation of Scaled Dot-Product
Attention, the building block of GPT, BERT, and every modern LLM.

Understanding this code means you understand:
- How ChatGPT "attends" to relevant context
- Why transformers can process sequences in parallel (unlike RNNs)
- The Q/K/V (Query/Key/Value) paradigm

Formula: Attention(Q, K, V) = softmax(QK^T / sqrt(d_k)) * V
"""

import numpy as np
from typing import Tuple


def scaled_dot_product_attention(
    Q: np.ndarray,  # Queries: (seq_len, d_k)
    K: np.ndarray,  # Keys: (seq_len, d_k)
    V: np.ndarray,  # Values: (seq_len, d_v)
    mask: np.ndarray = None,  # Causal mask for autoregressive generation
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Compute attention weights and output.

    Returns:
        output: Weighted sum of values (seq_len, d_v)
        weights: Attention probability distribution (seq_len, seq_len)
    """
    d_k = K.shape[-1]

    # Step 1: Compute raw attention scores
    # QK^T gives us a (seq_len x seq_len) matrix of "how much should
    # position i attend to position j?"
    scores = np.matmul(Q, K.T) / np.sqrt(d_k)

    # Step 2: Apply causal mask (for autoregressive / decoder models)
    # This prevents attending to future tokens during generation
    if mask is not None:
        scores = np.where(mask == 0, -1e9, scores)

    # Step 3: Softmax — convert scores to probabilities
    # Each row sums to 1.0 (probability distribution over positions)
    exp_scores = np.exp(scores - np.max(scores, axis=-1, keepdims=True))
    weights = exp_scores / np.sum(exp_scores, axis=-1, keepdims=True)

    # Step 4: Weighted sum of values
    output = np.matmul(weights, V)

    return output, weights


def create_causal_mask(seq_len: int) -> np.ndarray:
    """
    Create a lower-triangular mask for autoregressive attention.
    Position i can only attend to positions j <= i.
    """
    return np.tril(np.ones((seq_len, seq_len)))


class MultiHeadAttention:
    """
    Multi-Head Attention splits Q, K, V into h heads,
    applies attention independently, then concatenates.

    This allows the model to attend to different representation
    subspaces at different positions simultaneously.
    """

    def __init__(self, d_model: int, num_heads: int):
        assert d_model % num_heads == 0
        self.d_model = d_model
        self.num_heads = num_heads
        self.d_k = d_model // num_heads

        # In production: these are learned weight matrices
        # Here we initialize randomly for demonstration
        self.W_q = np.random.randn(d_model, d_model) * 0.02
        self.W_k = np.random.randn(d_model, d_model) * 0.02
        self.W_v = np.random.randn(d_model, d_model) * 0.02
        self.W_o = np.random.randn(d_model, d_model) * 0.02

    def forward(
        self, x: np.ndarray, mask: np.ndarray = None
    ) -> np.ndarray:
        """
        x: Input embeddings (seq_len, d_model)
        Returns: Contextualized representations (seq_len, d_model)
        """
        seq_len = x.shape[0]

        # Project to Q, K, V
        Q = x @ self.W_q
        K = x @ self.W_k
        V = x @ self.W_v

        # Split into heads: (seq_len, d_model) → (num_heads, seq_len, d_k)
        Q = Q.reshape(seq_len, self.num_heads, self.d_k).transpose(1, 0, 2)
        K = K.reshape(seq_len, self.num_heads, self.d_k).transpose(1, 0, 2)
        V = V.reshape(seq_len, self.num_heads, self.d_k).transpose(1, 0, 2)

        # Apply attention per head
        outputs = []
        for h in range(self.num_heads):
            out, _ = scaled_dot_product_attention(Q[h], K[h], V[h], mask)
            outputs.append(out)

        # Concatenate heads and project
        concat = np.concatenate(outputs, axis=-1)  # (seq_len, d_model)
        return concat @ self.W_o
