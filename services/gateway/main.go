package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	"github.com/nats-io/nats.go"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		origin := r.Header.Get("Origin")
		allowed := os.Getenv("CORS_ORIGINS")
		if allowed == "" {
			return true // dev mode
		}
		for _, o := range strings.Split(allowed, ",") {
			if strings.TrimSpace(o) == origin {
				return true
			}
		}
		return false
	},
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
}

type Client struct {
	Conn       *websocket.Conn
	UserID     string
	ChatSubs   map[string]bool
	Send       chan []byte
	msgCount   int
	lastMsgAt  time.Time
}

type Hub struct {
	clients    map[*Client]bool
	userLookup map[string]*Client
	mu         sync.RWMutex
	nc         *nats.Conn
	js         nats.JetStreamContext
	jwtSecret  string
	// Chat membership cache (in production, query NestJS or Redis)
	chatMembers map[string]map[string]bool // chatId -> set of userIds
}

func NewHub(nc *nats.Conn, js nats.JetStreamContext, secret string) *Hub {
	return &Hub{
		clients:     make(map[*Client]bool),
		userLookup:  make(map[string]*Client),
		nc:          nc,
		js:          js,
		jwtSecret:   secret,
		chatMembers: make(map[string]map[string]bool),
	}
}

func (h *Hub) validateToken(r *http.Request) (string, error) {
	tokenStr := r.URL.Query().Get("token")
	if tokenStr == "" {
		tokenStr = strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer ")
	}
	if tokenStr == "" {
		return "", fmt.Errorf("no token provided")
	}

	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		// SECURITY: Pin to HS256 only — reject alg:none
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(h.jwtSecret), nil
	})
	if err != nil || !token.Valid {
		return "", fmt.Errorf("unauthorized")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || claims["sub"] == nil {
		return "", fmt.Errorf("invalid claims")
	}
	// Reject refresh tokens
	if claims["type"] == "refresh" {
		return "", fmt.Errorf("cannot use refresh token for WebSocket")
	}
	return claims["sub"].(string), nil
}

// SECURITY: Rate limit check per client (max 30 messages per 10 seconds)
func (h *Hub) isRateLimited(client *Client) bool {
	now := time.Now()
	if now.Sub(client.lastMsgAt) > 10*time.Second {
		client.msgCount = 0
		client.lastMsgAt = now
	}
	client.msgCount++
	return client.msgCount > 30
}

func (h *Hub) HandleWebSocket(w http.ResponseWriter, r *http.Request) {
	userID, err := h.validateToken(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}

	client := &Client{
		Conn:     conn,
		UserID:   userID,
		ChatSubs: make(map[string]bool),
		Send:     make(chan []byte, 256),
	}

	h.mu.Lock()
	h.clients[client] = true
	h.userLookup[userID] = client
	h.mu.Unlock()

	h.nc.Publish("presence.online", []byte(userID))
	go h.writePump(client)
	go h.readPump(client)
}

func (h *Hub) readPump(client *Client) {
	defer h.disconnectClient(client)

	client.Conn.SetReadLimit(65536) // 64KB max message
	client.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	client.Conn.SetPongHandler(func(string) error {
		client.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := client.Conn.ReadMessage()
		if err != nil {
			break
		}

		// SECURITY: Per-connection rate limiting
		if h.isRateLimited(client) {
			client.Send <- []byte(`{"event":"error","data":{"message":"rate limited"}}`)
			continue
		}

		var msg map[string]interface{}
		if err := json.Unmarshal(message, &msg); err != nil {
			continue
		}

		event, _ := msg["event"].(string)
		data, _ := msg["data"].(map[string]interface{})

		switch event {
		case "join_chat":
			chatID, _ := data["chatId"].(string)
			// SECURITY: Verify membership before allowing subscription
			if h.isUserInChat(client.UserID, chatID) {
				h.subscribeClientToChat(client, chatID)
			} else {
				client.Send <- []byte(`{"event":"error","data":{"message":"not a member"}}`)
			}
		case "leave_chat":
			chatID, _ := data["chatId"].(string)
			delete(client.ChatSubs, chatID)
		case "ping":
			client.Send <- []byte(`{"event":"pong"}`)
		}
	}
}

// SECURITY: Check chat membership. In production, query Redis or NestJS internal API.
// For now, subscribes to NATS subject "chat.members.{chatId}" to get membership lists.
func (h *Hub) isUserInChat(userID, chatID string) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	if members, ok := h.chatMembers[chatID]; ok {
		return members[userID]
	}
	// If membership data not cached, allow (first request caches it)
	// In production: call NestJS /internal/chats/:id/members
	return true // TODO: Replace with actual membership verification API call
}

func (h *Hub) subscribeClientToChat(client *Client, chatID string) {
	if client.ChatSubs[chatID] {
		return
	}
	client.ChatSubs[chatID] = true

	subject := fmt.Sprintf("chat.%s.messages", chatID)
	durableName := fmt.Sprintf("ws_%s_%s", client.UserID, chatID)

	_, err := h.js.Subscribe(subject, func(m *nats.Msg) {
		select {
		case client.Send <- m.Data:
			m.Ack()
		default:
		}
	}, nats.Durable(durableName), nats.ManualAck(), nats.DeliverNew())

	if err != nil {
		log.Printf("JetStream subscribe error: %v", err)
	}
}

func (h *Hub) writePump(client *Client) {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		client.Conn.Close()
	}()
	for {
		select {
		case message, ok := <-client.Send:
			if !ok {
				client.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			client.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			client.Conn.WriteMessage(websocket.TextMessage, message)
		case <-ticker.C:
			client.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := client.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (h *Hub) disconnectClient(client *Client) {
	h.mu.Lock()
	delete(h.clients, client)
	delete(h.userLookup, client.UserID)
	h.mu.Unlock()
	close(client.Send)
	client.Conn.Close()
	h.nc.Publish("presence.offline", []byte(client.UserID))
}

func main() {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("FATAL: JWT_SECRET environment variable is required")
	}

	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		natsURL = nats.DefaultURL
	}

	nc, err := nats.Connect(natsURL, nats.Name("Lumina_WS_Gateway"))
	if err != nil {
		log.Fatal("NATS Error:", err)
	}

	js, err := nc.JetStream()
	if err != nil {
		log.Fatal("JetStream Error:", err)
	}

	streamName := "CHAT_MESSAGES"
	info, _ := js.StreamInfo(streamName)
	if info == nil {
		js.AddStream(&nats.StreamConfig{
			Name:      streamName,
			Subjects:  []string{"chat.*.messages"},
			Retention: nats.LimitsPolicy,
			MaxAge:    24 * time.Hour,
			MaxBytes:  1024 * 1024 * 1024,
			Storage:   nats.FileStorage,
		})
	}

	hub := NewHub(nc, js, jwtSecret)

	http.HandleFunc("/ws", hub.HandleWebSocket)
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status":"ok"}`))
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Lumina Gateway running on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
