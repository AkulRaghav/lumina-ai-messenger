"""
Byte-Pair Encoding (BPE) Tokenizer — From scratch.

Used by: GPT-2, GPT-3, GPT-4, LLaMA, all modern LLMs.
This is the exact algorithm that converts text into tokens
before feeding to a transformer model.

Understanding BPE is critical for:
- Estimating token costs (OpenAI pricing)
- Chunking documents for RAG (stay under context window)
- Building custom tokenizers for domain-specific models

Algorithm:
1. Start with character-level vocabulary
2. Count all adjacent pairs in corpus
3. Merge the most frequent pair into a new token
4. Repeat until desired vocabulary size reached
"""

from collections import Counter
from typing import Dict, List, Tuple


class BPETokenizer:
    def __init__(self):
        self.vocab: Dict[str, int] = {}
        self.merges: List[Tuple[str, str]] = []
        self.token_to_id: Dict[str, int] = {}
        self.id_to_token: Dict[int, str] = {}

    def train(self, corpus: str, num_merges: int = 1000) -> None:
        """Train BPE on a corpus by iteratively merging frequent pairs."""
        # Initialize: split into characters + end-of-word marker
        words = corpus.split()
        word_freqs: Dict[Tuple[str, ...], int] = Counter()

        for word in words:
            chars = tuple(word) + ("</w>",)
            word_freqs[chars] += 1

        for i in range(num_merges):
            # Count all adjacent pairs
            pairs = Counter()
            for word, freq in word_freqs.items():
                for j in range(len(word) - 1):
                    pairs[(word[j], word[j + 1])] += freq

            if not pairs:
                break

            # Find most frequent pair
            best_pair = pairs.most_common(1)[0][0]
            self.merges.append(best_pair)

            # Merge that pair in all words
            new_word_freqs: Dict[Tuple[str, ...], int] = {}
            for word, freq in word_freqs.items():
                new_word = self._merge_pair(word, best_pair)
                new_word_freqs[new_word] = freq
            word_freqs = new_word_freqs

        # Build vocabulary
        all_tokens = set()
        for word in word_freqs.keys():
            all_tokens.update(word)
        for idx, token in enumerate(sorted(all_tokens)):
            self.token_to_id[token] = idx
            self.id_to_token[idx] = token

    def encode(self, text: str) -> List[int]:
        """Encode text into token IDs using learned merges."""
        tokens: List[str] = []
        for word in text.split():
            word_tokens = list(word) + ["</w>"]
            # Apply merges in order
            for merge in self.merges:
                word_tokens = self._apply_merge(word_tokens, merge)
            tokens.extend(word_tokens)
        return [self.token_to_id.get(t, 0) for t in tokens]

    def decode(self, ids: List[int]) -> str:
        """Decode token IDs back to text."""
        tokens = [self.id_to_token.get(i, "") for i in ids]
        text = "".join(tokens).replace("</w>", " ")
        return text.strip()

    def _merge_pair(
        self, word: Tuple[str, ...], pair: Tuple[str, str]
    ) -> Tuple[str, ...]:
        new_word: List[str] = []
        i = 0
        while i < len(word):
            if i < len(word) - 1 and (word[i], word[i + 1]) == pair:
                new_word.append(word[i] + word[i + 1])
                i += 2
            else:
                new_word.append(word[i])
                i += 1
        return tuple(new_word)

    def _apply_merge(
        self, tokens: List[str], merge: Tuple[str, str]
    ) -> List[str]:
        result: List[str] = []
        i = 0
        while i < len(tokens):
            if (
                i < len(tokens) - 1
                and tokens[i] == merge[0]
                and tokens[i + 1] == merge[1]
            ):
                result.append(merge[0] + merge[1])
                i += 2
            else:
                result.append(tokens[i])
                i += 1
        return result

    @property
    def vocab_size(self) -> int:
        return len(self.token_to_id)
