enum MessageType { text, voice, image }

enum MessageStatus { sent, delivered, read }

class ChatMessage {
  final String id;
  final String text;
  final MessageType type;
  final bool isMe;
  final String timestamp;
  final MessageStatus status;
  final String? voiceDuration;
  final String? imageAssetPath;

  const ChatMessage({
    required this.id,
    required this.text,
    this.type = MessageType.text,
    required this.isMe,
    required this.timestamp,
    this.status = MessageStatus.read,
    this.voiceDuration,
    this.imageAssetPath,
  });
}

final List<ChatMessage> mockMessages = [
  const ChatMessage(
    id: 'm1',
    text: 'Hey! Are we still on for dinner tonight?',
    isMe: false,
    timestamp: '9:40 AM',
  ),
  const ChatMessage(
    id: 'm2',
    text: "Absolutely! Can't wait 😄",
    isMe: true,
    timestamp: '9:41 AM',
    status: MessageStatus.read,
  ),
  const ChatMessage(
    id: 'm3',
    text: '',
    type: MessageType.image,
    isMe: false,
    timestamp: '9:41 AM',
  ),
  const ChatMessage(
    id: 'm4',
    text: '',
    type: MessageType.voice,
    isMe: false,
    timestamp: '9:42 AM',
    voiceDuration: '0:15',
  ),
];
