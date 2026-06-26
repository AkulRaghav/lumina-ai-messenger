package main

import (
	"context"
	"log"
	"net"
	"sync"
	"time"

	"google.golang.org/grpc"
)

const (
	StatusOnline  = "ONLINE"
	StatusAway    = "AWAY"
	StatusDND     = "DND"
	StatusOffline = "OFFLINE"
	TypingTTL     = 3 * time.Second
)

// InMemoryPresenceStore — in production, use Redis for distributed state
type InMemoryPresenceStore struct {
	mu           sync.RWMutex
	userStatus   map[string]string
	typingExpiry map[string]map[string]time.Time // chatId -> userId -> expiryTime
	statusSubs   map[string][]chan *StatusUpdate
}

func NewStore() *InMemoryPresenceStore {
	return &InMemoryPresenceStore{
		userStatus:   make(map[string]string),
		typingExpiry: make(map[string]map[string]time.Time),
		statusSubs:   make(map[string][]chan *StatusUpdate),
	}
}

// StatusUpdate message (mirrors protobuf)
type StatusUpdate struct {
	UserId    string
	Status    string
	Timestamp int64
}

type PresenceServer struct {
	store *InMemoryPresenceStore
}

func (s *PresenceServer) UpdateStatus(ctx context.Context, userId string, status string) {
	s.store.mu.Lock()
	defer s.store.mu.Unlock()

	s.store.userStatus[userId] = status

	update := &StatusUpdate{
		UserId:    userId,
		Status:    status,
		Timestamp: time.Now().Unix(),
	}

	// Broadcast to all subscribers watching this user
	if subs, ok := s.store.statusSubs[userId]; ok {
		for _, ch := range subs {
			select {
			case ch <- update:
			default: // Non-blocking
			}
		}
	}
}

func (s *PresenceServer) SetTyping(chatId string, userId string) {
	s.store.mu.Lock()
	defer s.store.mu.Unlock()

	if _, ok := s.store.typingExpiry[chatId]; !ok {
		s.store.typingExpiry[chatId] = make(map[string]time.Time)
	}
	s.store.typingExpiry[chatId][userId] = time.Now().Add(TypingTTL)
}

func (s *PresenceServer) GetTypingUsers(chatId string, excludeUserId string) []string {
	s.store.mu.RLock()
	defer s.store.mu.RUnlock()

	var typing []string
	now := time.Now()

	if chatUsers, ok := s.store.typingExpiry[chatId]; ok {
		for uid, expiry := range chatUsers {
			if uid != excludeUserId && now.Before(expiry) {
				typing = append(typing, uid)
			}
		}
	}
	return typing
}

func (s *PresenceServer) GetUserStatus(userId string) string {
	s.store.mu.RLock()
	defer s.store.mu.RUnlock()

	if status, ok := s.store.userStatus[userId]; ok {
		return status
	}
	return StatusOffline
}

func (s *PresenceServer) SubscribeToUser(userId string) chan *StatusUpdate {
	s.store.mu.Lock()
	defer s.store.mu.Unlock()

	ch := make(chan *StatusUpdate, 10)
	s.store.statusSubs[userId] = append(s.store.statusSubs[userId], ch)
	return ch
}

// Cleanup goroutine to remove expired typing indicators
func (s *PresenceServer) startCleanup() {
	ticker := time.NewTicker(1 * time.Second)
	go func() {
		for range ticker.C {
			s.store.mu.Lock()
			now := time.Now()
			for chatId, users := range s.store.typingExpiry {
				for uid, expiry := range users {
					if now.After(expiry) {
						delete(users, uid)
					}
				}
				if len(users) == 0 {
					delete(s.store.typingExpiry, chatId)
				}
			}
			s.store.mu.Unlock()
		}
	}()
}

func main() {
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("failed to listen: %v", err)
	}

	store := NewStore()
	server := &PresenceServer{store: store}
	server.startCleanup()

	s := grpc.NewServer()
	// In production: register the generated protobuf service here
	// pb.RegisterPresenceServiceServer(s, server)

	log.Println("Presence gRPC service running on :50051")
	if err := s.Serve(lis); err != nil {
		log.Fatalf("failed to serve: %v", err)
	}
}
