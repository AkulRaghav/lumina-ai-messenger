import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'features/login/login_page.dart';
import 'features/home/home_page.dart';
import 'features/chat/chat_page.dart';
import 'profile_screen.dart';
import 'settings_screen.dart';
import 'ai_tools_screen.dart';

// Simple auth state: holds JWT token or null
final authProvider = StateNotifierProvider<AuthNotifier, String?>(
  (ref) => AuthNotifier(),
);

class AuthNotifier extends StateNotifier<String?> {
  AuthNotifier() : super(null);
  void login(String token) => state = token;
  void logout() => state = null;
}

final appRouterProvider = Provider<GoRouter>((ref) {
  final token = ref.watch(authProvider);

  return GoRouter(
    refreshListenable: _AuthNotifier(ref),
    initialLocation: '/login',
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginPage()),
      GoRoute(path: '/', builder: (_, __) => const HomePage()),
      GoRoute(
        path: '/chat/:id',
        builder: (_, state) => ChatPage(chatId: state.pathParameters['id']!),
      ),
      GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
      GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
      GoRoute(path: '/ai-tools', builder: (_, __) => const AIToolsScreen()),
    ],
    redirect: (_, state) {
      final isLoggedIn = token != null;
      final isLogin = state.matchedLocation == '/login';
      if (!isLoggedIn && !isLogin) return '/login';
      if (isLoggedIn && isLogin) return '/';
      return null;
    },
  );
});

class _AuthNotifier extends ChangeNotifier {
  final Ref ref;
  _AuthNotifier(this.ref) {
    ref.listen(authProvider, (_, __) => notifyListeners());
  }
}
