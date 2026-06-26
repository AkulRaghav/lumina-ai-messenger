import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import '../../theme.dart';
import '../../app_router.dart';

class LoginPage extends ConsumerStatefulWidget {
  const LoginPage({super.key});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final emailCtrl = TextEditingController();
  final passCtrl = TextEditingController();
  bool isLoading = false;

  void _loginWith(String email, String password) {
    emailCtrl.text = email;
    passCtrl.text = password;
    _handleLogin();
  }

  void _handleLogin() async {
    if (emailCtrl.text.isEmpty || passCtrl.text.isEmpty) return;
    setState(() => isLoading = true);
    try {
      final res = await http.post(
        Uri.parse('http://localhost:3000/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': emailCtrl.text,
          'password': passCtrl.text,
        }),
      );
      if (res.statusCode == 200 || res.statusCode == 201) {
        final body = jsonDecode(res.body);
        ref.read(authProvider.notifier).login(body['access_token']);
      } else {
        _showError('Login failed');
      }
    } catch (e) {
      _showError('Network error');
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  void _showError(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: Colors.red.shade800),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bgPrimary,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.accentPrimary.withOpacity(0.1),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.accentPrimary.withOpacity(0.3),
                      blurRadius: 40,
                      spreadRadius: 5,
                    ),
                  ],
                ),
                child: const Icon(Icons.lock_outline,
                    color: AppColors.accentPrimary, size: 40),
              ).animate().scale(duration: 500.ms, curve: Curves.elasticOut),
              const SizedBox(height: 32),
              const Text("Lumina",
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 32,
                      fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              const Text("Secure messaging, powered by AI",
                  style: TextStyle(color: AppColors.textSecondary)),
              const SizedBox(height: 48),

              // Quick Login Buttons
              Row(
                children: [
                  Expanded(child: _quickLoginCard(
                    "User",
                    "user@lumina.ai",
                    Icons.person,
                    AppColors.accentPrimary,
                    () => _loginWith('user@lumina.ai', 'Password123'),
                  )),
                  const SizedBox(width: 12),
                  Expanded(child: _quickLoginCard(
                    "Admin",
                    "admin@lumina.ai",
                    Icons.admin_panel_settings,
                    const Color(0xFFFF6B6B),
                    () => _loginWith('admin@lumina.ai', 'Admin@2024'),
                  )),
                ],
              ),
              const SizedBox(height: 24),

              // Divider
              Row(children: [
                Expanded(child: Divider(color: AppColors.border)),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text("or login manually",
                      style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                ),
                Expanded(child: Divider(color: AppColors.border)),
              ]),
              const SizedBox(height: 24),

              // Email
              _buildInput(emailCtrl, "Email", Icons.email_outlined, false),
              const SizedBox(height: 12),
              _buildInput(passCtrl, "Password", Icons.lock_outline, true),
              const SizedBox(height: 24),

              // Login Button
              GestureDetector(
                onTap: isLoading ? null : _handleLogin,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    color: AppColors.accentPrimary,
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Center(
                    child: isLoading
                        ? const SizedBox(width: 20, height: 20,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Text("Sign In",
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextButton(
                onPressed: () => ref.read(authProvider.notifier).login('demo_token'),
                child: const Text("Skip (Demo Mode)",
                    style: TextStyle(color: AppColors.textMuted)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _quickLoginCard(
    String label, String email, IconData icon, Color color, VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(label, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 4),
            Text(email, style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
          ],
        ),
      ),
    );
  }

  Widget _buildInput(TextEditingController ctrl, String hint, IconData icon, bool obscure) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.bgInputField,
        borderRadius: BorderRadius.circular(14),
      ),
      child: TextField(
        controller: ctrl,
        obscureText: obscure,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: AppColors.textMuted),
          prefixIcon: Icon(icon, color: AppColors.textMuted, size: 20),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 16),
        ),
      ),
    );
  }
}
