import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../theme.dart';
import '../../models/chat_preview.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedFilter = 0;
  final List<String> _filters = const ['All', 'Unread', 'Groups', 'Channels'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgPrimary,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(context),
            const SizedBox(height: AppSpacing.md),
            _buildSearchBar(),
            const SizedBox(height: AppSpacing.md),
            _buildFilterChips(),
            const SizedBox(height: AppSpacing.sm),
            Expanded(child: _buildChatList()),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
          AppSpacing.screenPadding, 16, AppSpacing.screenPadding, 0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text('Lumina', style: AppTextStyles.appBarTitle),
          Container(
            width: 40,
            height: 40,
            decoration: const BoxDecoration(
              gradient: AppColors.accentGradient,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.add, color: Colors.white, size: 22),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding:
          const EdgeInsets.symmetric(horizontal: AppSpacing.screenPadding),
      child: TextField(
        style: const TextStyle(color: AppColors.textPrimary, fontSize: 15),
        decoration: const InputDecoration(
          hintText: 'Search anything',
          prefixIcon:
              Icon(Icons.search, color: AppColors.textMuted, size: 20),
        ),
      ),
    );
  }

  Widget _buildFilterChips() {
    return SizedBox(
      height: 36,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.screenPadding),
        itemCount: _filters.length,
        separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
        itemBuilder: (context, index) {
          final isSelected = _selectedFilter == index;
          return GestureDetector(
            onTap: () => setState(() => _selectedFilter = index),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 18),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: isSelected
                    ? AppColors.accentPrimary
                    : AppColors.bgSecondary,
                borderRadius: BorderRadius.circular(AppSpacing.pillRadius),
                border: Border.all(
                  color: isSelected
                      ? AppColors.accentPrimary
                      : AppColors.border,
                ),
              ),
              child: Text(
                _filters[index],
                style: AppTextStyles.filterChip.copyWith(
                  color:
                      isSelected ? Colors.white : AppColors.textSecondary,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildChatList() {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.screenPadding,
        AppSpacing.sm,
        AppSpacing.screenPadding,
        AppSpacing.lg,
      ),
      itemCount: mockChats.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, index) => _ChatRow(chat: mockChats[index])
          .animate()
          .fadeIn(delay: (index * 40).ms, duration: 300.ms),
    );
  }

  Widget _buildBottomNav() {
    return BottomNavigationBar(
      currentIndex: 0,
      onTap: (i) {
        if (i == 3) context.go('/profile');
      },
      items: const [
        BottomNavigationBarItem(
            icon: Icon(Icons.chat_bubble_outline), label: 'Chats'),
        BottomNavigationBarItem(
            icon: Icon(Icons.call_outlined), label: 'Calls'),
        BottomNavigationBarItem(
            icon: Icon(Icons.explore_outlined), label: 'Discover'),
        BottomNavigationBarItem(
            icon: Icon(Icons.person_outline), label: 'Profile'),
      ],
    );
  }
}

class _ChatRow extends StatelessWidget {
  final ChatPreview chat;
  const _ChatRow({required this.chat});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.bgSecondary,
      borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
        onTap: () => context.go('/chat/${chat.id}'),
        child: Padding(
          padding:
              const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          child: Row(
            children: [
              _buildAvatar(),
              const SizedBox(width: 14),
              Expanded(child: _buildContent()),
              const SizedBox(width: 8),
              _buildMeta(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAvatar() {
    final gradientColors = AppColors.avatarGradientFor(chat.name);
    return Stack(
      children: [
        Container(
          width: AppSpacing.avatarRadius * 2,
          height: AppSpacing.avatarRadius * 2,
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
              chat.name.isNotEmpty ? chat.name[0].toUpperCase() : '?',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: 18,
              ),
            ),
          ),
        ),
        if (chat.isOnline)
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              width: 14,
              height: 14,
              decoration: BoxDecoration(
                color: AppColors.online,
                shape: BoxShape.circle,
                border:
                    Border.all(color: AppColors.bgSecondary, width: 2),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(chat.name,
                  style: AppTextStyles.chatName,
                  overflow: TextOverflow.ellipsis),
            ),
            if (chat.isGroup) ...[
              const SizedBox(width: 6),
              const Icon(Icons.groups_2_outlined,
                  size: 14, color: AppColors.textMuted),
            ],
          ],
        ),
        const SizedBox(height: 4),
        Text(
          chat.lastMessage,
          style: chat.isTyping
              ? AppTextStyles.chatPreviewTyping
              : AppTextStyles.chatPreview,
          overflow: TextOverflow.ellipsis,
          maxLines: 1,
        ),
      ],
    );
  }

  Widget _buildMeta() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Text(chat.timestamp, style: AppTextStyles.timestamp),
        const SizedBox(height: 6),
        if (chat.unreadCount > 0)
          Container(
            constraints: const BoxConstraints(minWidth: 22),
            height: 22,
            padding: const EdgeInsets.symmetric(horizontal: 6),
            decoration: const BoxDecoration(
              color: AppColors.accentPrimary,
              shape: BoxShape.circle,
            ),
            alignment: Alignment.center,
            child: Text(
              chat.unreadCount > 99 ? '99+' : '${chat.unreadCount}',
              style: AppTextStyles.unreadBadge,
            ),
          )
        else
          const SizedBox(height: 22),
      ],
    );
  }
}
