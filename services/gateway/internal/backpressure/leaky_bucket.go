package backpressure

import (
	"sync"
	"time"
)

// LeakyBucket — Smooths bursty traffic into a steady stream.
// Used by: Network traffic shaping, ATM networks, API gateways.
//
// Difference from TokenBucket:
// - TokenBucket allows bursts up to capacity
// - LeakyBucket enforces constant output rate (no bursts)
//
// Use case: Prevent a single user from flooding NATS with messages
// faster than downstream consumers can process them.

type LeakyBucket struct {
	mu       sync.Mutex
	queue    [][]byte
	capacity int
	leakRate time.Duration // Time between each leak
	done     chan struct{}
}

func NewLeakyBucket(capacity int, leakRate time.Duration) *LeakyBucket {
	lb := &LeakyBucket{
		queue:    make([][]byte, 0, capacity),
		capacity: capacity,
		leakRate: leakRate,
		done:     make(chan struct{}),
	}
	return lb
}

// Add adds data to the bucket. Returns false if bucket is full (drop).
func (lb *LeakyBucket) Add(data []byte) bool {
	lb.mu.Lock()
	defer lb.mu.Unlock()

	if len(lb.queue) >= lb.capacity {
		return false // Drop — bucket overflow
	}
	lb.queue = append(lb.queue, data)
	return true
}

// Start begins the leak goroutine that drains at a constant rate.
// The handler function is called for each item at the leak rate.
func (lb *LeakyBucket) Start(handler func([]byte)) {
	go func() {
		ticker := time.NewTicker(lb.leakRate)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				lb.mu.Lock()
				if len(lb.queue) > 0 {
					item := lb.queue[0]
					lb.queue = lb.queue[1:]
					lb.mu.Unlock()
					handler(item)
				} else {
					lb.mu.Unlock()
				}
			case <-lb.done:
				return
			}
		}
	}()
}

func (lb *LeakyBucket) Stop() {
	close(lb.done)
}

func (lb *LeakyBucket) Len() int {
	lb.mu.Lock()
	defer lb.mu.Unlock()
	return len(lb.queue)
}
