import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app_router.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: const Color(0xFF050508),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        title: const Text("Settings",
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          _sectionTitle("APPEARANCE"),
          _switchTile(Icons.dark_mode, "Pure Black Mode", true),
          _switchTile(Icons.text_fields, "Dynamic Font Size", false),
          const SizedBox(height: 24),
          _sectionTitle("PRIVACY & SECURITY"),
          _navTile(Icons.lock_outline, "End-to-End Encryption",
              trailing: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text("Active",
                    style: TextStyle(
                        color: Colors.green,
                        fontSize: 11,
                        fontWeight: FontWeight.bold)),
              )),
          _switchTile(Icons.fingerprint, "Biometric Lock", false),
          _switchTile(
              Icons.screenshot_monitor_outlined, "Block Screenshots", false),
          const SizedBox(height: 24),
          _sectionTitle("NOTIFICATIONS"),
          _switchTile(Icons.notifications_active, "Push Notifications", true),
          _navTile(Icons.volume_up, "Custom Sounds"),
          const SizedBox(height: 24),
          _sectionTitle("STORAGE & DATA"),
          _navTile(Icons.cloud_upload, "Force Sync Offline Data"),
          _navTile(Icons.delete_sweep, "Clear Cache",
              trailing: Text("124 MB",
                  style: TextStyle(color: Colors.white.withOpacity(0.5)))),
          const SizedBox(height: 40),
          GestureDetector(
            onTap: () => ref.read(authProvider.notifier).logout(),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 18),
              decoration: BoxDecoration(
                color: Colors.red.withOpacity(0.1),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.red.withOpacity(0.2)),
              ),
              child: const Center(
                child: Text("Log Out",
                    style: TextStyle(
                        color: Colors.redAccent,
                        fontWeight: FontWeight.bold,
                        fontSize: 16)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(title,
          style: TextStyle(
              color: Colors.white.withOpacity(0.4),
              fontSize: 12,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.5)),
    );
  }

  Widget _switchTile(IconData icon, String title, bool initialValue) {
    return StatefulBuilder(
      builder: (context, setState) {
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          child: Row(
            children: [
              Icon(icon, color: Colors.white70, size: 20),
              const SizedBox(width: 16),
              Expanded(
                  child: Text(title,
                      style: const TextStyle(color: Colors.white))),
              Switch.adaptive(
                value: initialValue,
                activeColor: const Color(0xFF6C63FF),
                onChanged: (v) {},
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _navTile(IconData icon, String title, {Widget? trailing}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(children: [
        Icon(icon, color: Colors.white70, size: 20),
        const SizedBox(width: 16),
        Expanded(
            child:
                Text(title, style: const TextStyle(color: Colors.white))),
        trailing ??
            Icon(Icons.chevron_right, color: Colors.white.withOpacity(0.3)),
      ]),
    );
  }
}
