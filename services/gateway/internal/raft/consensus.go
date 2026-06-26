package raft

import (
	"sync"
	"time"
)

// Raft Consensus — Leader election for WebSocket gateway cluster.
// In production: Use HashiCorp Raft library. This demonstrates the
// core algorithm that powers etcd, CockroachDB, and TiKV.

type NodeState int

const (
	Follower  NodeState = iota
	Candidate
	Leader
)

type LogEntry struct {
	Term    int
	Index   int
	Command string
	Data    []byte
}

type RaftNode struct {
	mu          sync.RWMutex
	id          string
	state       NodeState
	currentTerm int
	votedFor    string
	log         []LogEntry
	commitIndex int
	lastApplied int
	peers       []string
	leaderID    string
	lastHeart   time.Time
}

func NewRaftNode(id string, peers []string) *RaftNode {
	return &RaftNode{
		id:        id,
		state:     Follower,
		peers:     peers,
		lastHeart: time.Now(),
	}
}

func (n *RaftNode) IsLeader() bool {
	n.mu.RLock()
	defer n.mu.RUnlock()
	return n.state == Leader
}

func (n *RaftNode) GetLeader() string {
	n.mu.RLock()
	defer n.mu.RUnlock()
	return n.leaderID
}

func (n *RaftNode) GetTerm() int {
	n.mu.RLock()
	defer n.mu.RUnlock()
	return n.currentTerm
}
