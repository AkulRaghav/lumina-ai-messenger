import 'package:flutter/material.dart';
import '../../theme.dart';
import '../../models/chat_message.dart';

class ChatPage extends StatefulWidget {
  final String chatId;
  const ChatPage({super.key, required this.chatId});

  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  bool _showAttachmentGrid = false;
  final TextEditingController _textController = TextEditingController();
  final String _chatName = 'Emma Watson';
  final bool _isOnline = true;

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgPrimary,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(context),
            const Divider(height: 1, color: AppColors.divider),
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(AppSpacing.screenPadding),
                itemCount: mockMessages.length,
                itemBuilder: (context, index) =>
                    _MessageBubble(message: mockMessages[index]),
              ),
            ),
            if (_showAttachmentGrid) _buildAttachmentGrid(),
            _buildInputBar(),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    final gradientColors = AppColors.avatarGradientFor(_chatName);
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.screenPadding,
        vertical: 10,
      ),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back_ios_new, size: 20),
            onPressed: () => Navigator.of(context).maybePop(),
          ),
          Stack(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: gradientColors,
                  ),
                ),
                child: Center(
                  child: Text(
                    _chatName[0].toUpperCase(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                ),
              ),
              if (_isOnline)
                Positioned(
                  right: 0,
                  bottom: 0,
                  child: Container(
                    width: 11,
                    height: 11,
                    decoration: BoxDecoration(
                      color: AppColors.online,
                      shape: BoxShape.circle,
                      border: Border.all(
                          color: AppColors.bgPrimary, width: 2),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(_chatName, style: AppTextStyles.chatName),
                Text(
                  _isOnline ? 'Online' : 'Offline',
                  style: AppTextStyles.chatPreview.copyWith(fontSize: 12),
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.call_outlined,
                color: AppColors.accentPrimary),
            onPressed: () {},
          ),
          IconButton(
            icon: const Icon(Icons.videocam_outlined,
                color: AppColors.accentPrimary),
            onPressed: () {},
          ),
        ],
      ),
    );
  }

  Widget _buildAttachmentGrid() {
    final items = [
      (Icons.image_outlined, 'Gallery', AppColors.accentPrimary),
      (Icons.camera_alt_outlined, 'Camera', const Color(0xFF4FD1C5)),
      (Icons.location_on_outlined, 'Location', const Color(0xFF34D399)),
      (Icons.person_outline, 'Contact', const Color(0xFFFFC857)),
      (Icons.insert_drive_file_outlined, 'Document', const Color(0xFF6FB1FF)),
      (Icons.mic_none_outlined, 'Voice', const Color(0xFFFF6FA0)),
      (Icons.poll_outlined, 'Poll', const Color(0xFFFF8A65)),
      (Icons.payments_outlined, 'Payment', const Color(0xFFE0A030)),
    ];

    return Container(
      padding: const EdgeInsets.symmetric(
          vertical: 16, horizontal: AppSpacing.screenPadding),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 4,
          mainAxisSpacing: 16,
          crossAxisSpacing: 12,
          childAspectRatio: 0.85,
        ),
        itemCount: items.length,
        itemBuilder: (context, index) {
          final (icon, label, color) = items[index];
          return Column(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: color.withOpacity(0.18),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(height: 6),
              Text(label,
                  style: AppTextStyles.chatPreview.copyWith(fontSize: 11)),
            ],
          );
        },
      ),
    );
  }

  Widget _buildInputBar() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.screenPadding,
        8,
        AppSpacing.screenPadding,
        AppSpacing.screenPadding,
      ),
      child: Row(
        children: [
          IconButton(
            icon: Icon(
              _showAttachmentGrid
                  ? Icons.close
                  : Icons.add_circle_outline,
              color: AppColors.accentPrimary,
            ),
            onPressed: () =>
                setState(() => _showAttachmentGrid = !_showAttachmentGrid),
          ),
          Expanded(
            child: TextField(
              controller: _textController,
              style: const TextStyle(
                  color: AppColors.textPrimary, fontSize: 15),
              decoration: const InputDecoration(
                hintText: 'Type a message...',
              ),
            ),
          ),
          const SizedBox(width: 8),
          Container(
            width: 44,
            height: 44,
            decoration: const BoxDecoration(
              gradient: AppColors.accentGradient,
              shape: BoxShape.circle,
            ),
            child: IconButton(
              icon:
                  const Icon(Icons.mic_none, color: Colors.white, size: 20),
              onPressed: () {},
            ),
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;
  const _MessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    final isMe = message.isMe;
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 6),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.72,
        ),
        child: Column(
          crossAxisAlignment:
              isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            _buildBubbleContent(context, isMe),
            const SizedBox(height: 4),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Text(message.timestamp, style: AppTextStyles.timestamp),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBubbleContent(BuildContext context, bool isMe) {
    switch (message.type) {
      case MessageType.image:
        return ClipRRect(
          borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
          child: Container(
            width: 220,
            height: 150,
            color: AppColors.bgSecondary,
            child: const Icon(Icons.image_outlined,
                color: AppColors.textMuted, size: 36),
          ),
        );
      case MessageType.voice:
        return _buildVoiceBubble(isMe);
      case MessageType.text:
        return Container(
          padding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: isMe
                ? AppColors.bubbleOutgoing
                : AppColors.bubbleIncoming,
            borderRadius: BorderRadius.only(
              topLeft: const Radius.circular(18),
              topRight: const Radius.circular(18),
              bottomLeft: Radius.circular(isMe ? 18 : 4),
              bottomRight: Radius.circular(isMe ? 4 : 18),
            ),
          ),
          child: Text(
            message.text,
            style: const TextStyle(
                color: AppColors.textPrimary, fontSize: 15, height: 1.3),
          ),
        );
    }
  }

  Widget _buildVoiceBubble(bool isMe) {
    final heights = [6, 12, 18, 10, 22, 14, 8, 16, 20, 10, 6, 18, 12, 22, 8, 14, 10, 6];
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: isMe ? AppColors.bubbleOutgoing : AppColors.bubbleIncoming,
        borderRadius: BorderRadius.only(
          topLeft: const Radius.circular(18),
          topRight: const Radius.circular(18),
          bottomLeft: Radius.circular(isMe ? 18 : 4),
          bottomRight: Radius.circular(isMe ? 4 : 18),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: const BoxDecoration(
              color: AppColors.accentPrimary,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.play_arrow, color: Colors.white, size: 18),
          ),
          const SizedBox(width: 10),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: List.generate(18, (i) {
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 1.2),
                width: 2.5,
                height: heights[i % heights.length].toDouble(),
                decoration: BoxDecoration(
                  color: AppColors.textMuted,
                  borderRadius: BorderRadius.circular(2),
                ),
              );
            }),
          ),
          const SizedBox(width: 8),
          Text(message.voiceDuration ?? '0:00',
              style: AppTextStyles.timestamp),
        ],
      ),
    );
  }
}
