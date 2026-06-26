class ChatPreview {
  final String id;
  final String name;
  final String lastMessage;
  final String timestamp;
  final int unreadCount;
  final bool isOnline;
  final bool isTyping;
  final bool isGroup;

  const ChatPreview({
    required this.id,
    required this.name,
    required this.lastMessage,
    required this.timestamp,
    this.unreadCount = 0,
    this.isOnline = false,
    this.isTyping = false,
    this.isGroup = false,
  });
}

final List<ChatPreview> mockChats = [
  const ChatPreview(
    id: '1',
    name: 'Emma Watson',
    lastMessage: 'Hey! Are we still on for dinner tonight?',
    timestamp: '9:41 AM',
    unreadCount: 2,
    isOnline: true,
  ),
  const ChatPreview(
    id: '2',
    name: 'Design Squad',
    lastMessage: "Alex: Here's the new mockup.",
    timestamp: '8:15 AM',
    unreadCount: 12,
    isGroup: true,
  ),
  const ChatPreview(
    id: '3',
    name: 'Tech Talk',
    lastMessage: 'Sam: Check out this new AI tool!',
    timestamp: 'Yesterday',
    isGroup: true,
  ),
  const ChatPreview(
    id: '4',
    name: 'James Carter',
    lastMessage: 'Thanks! It was awesome 🔥',
    timestamp: 'Yesterday',
    isOnline: true,
  ),
  const ChatPreview(
    id: '5',
    name: 'Travel Buddies',
    lastMessage: 'Mia: Next stop, Thailand! 🇹🇭',
    timestamp: 'Yesterday',
    isGroup: true,
  ),
  const ChatPreview(
    id: '6',
    name: 'Olivia Brooks',
    lastMessage: 'Typing...',
    timestamp: 'Yesterday',
    isOnline: true,
    isTyping: true,
  ),
];
