import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Backgrounds
  static const Color bgPrimary = Color(0xFF0E0B16);
  static const Color bgSecondary = Color(0xFF161220);
  static const Color bgElevated = Color(0xFF1E1830);
  static const Color bgInputField = Color(0xFF221C36);

  // Brand / accent
  static const Color accentPrimary = Color(0xFF7C5CFF);
  static const Color accentSecondary = Color(0xFF5B3FE0);
  static const Color accentTertiary = Color(0xFFA98BFF);
  static const LinearGradient accentGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [Color(0xFF8A6BFF), Color(0xFF5B3FE0)],
  );

  // Status
  static const Color online = Color(0xFF34D399);
  static const Color missedCall = Color(0xFFFF5C5C);
  static const Color typingIndicator = Color(0xFF34D399);

  // Text
  static const Color textPrimary = Color(0xFFF5F3FA);
  static const Color textSecondary = Color(0xFF9C96B5);
  static const Color textMuted = Color(0xFF6F698A);

  // Borders / dividers
  static const Color border = Color(0xFF2A2440);
  static const Color divider = Color(0xFF1E1830);

  // Bubble colors
  static const Color bubbleOutgoing = Color(0xFF6C4CF1);
  static const Color bubbleIncoming = Color(0xFF1E1830);

  // Avatar gradient rotation
  static const List<List<Color>> avatarGradients = [
    [Color(0xFF8A6BFF), Color(0xFF5B3FE0)],
    [Color(0xFFFF8A65), Color(0xFFE5563E)],
    [Color(0xFF4FD1C5), Color(0xFF2C9A8F)],
    [Color(0xFFFFC857), Color(0xFFE0A030)],
    [Color(0xFFFF6FA0), Color(0xFFD63D77)],
    [Color(0xFF6FB1FF), Color(0xFF3D7FE0)],
  ];

  static List<Color> avatarGradientFor(String seed) {
    final hash = seed.codeUnits.fold<int>(0, (acc, c) => acc + c);
    return avatarGradients[hash % avatarGradients.length];
  }
}

class AppSpacing {
  AppSpacing._();
  static const double xs = 4;
  static const double sm = 8;
  static const double md = 16;
  static const double lg = 24;
  static const double xl = 32;
  static const double screenPadding = 16;
  static const double cardRadius = 16;
  static const double avatarRadius = 26;
  static const double pillRadius = 100;
}

class AppTextStyles {
  AppTextStyles._();
  static const String fontFamily = 'Inter';

  static const TextStyle appBarTitle = TextStyle(
    fontFamily: fontFamily,
    fontSize: 26,
    fontWeight: FontWeight.w800,
    color: AppColors.textPrimary,
    letterSpacing: -0.5,
  );

  static const TextStyle chatName = TextStyle(
    fontFamily: fontFamily,
    fontSize: 16,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
  );

  static const TextStyle chatPreview = TextStyle(
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w400,
    color: AppColors.textSecondary,
  );

  static const TextStyle chatPreviewTyping = TextStyle(
    fontFamily: fontFamily,
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: AppColors.typingIndicator,
  );

  static const TextStyle timestamp = TextStyle(
    fontFamily: fontFamily,
    fontSize: 12,
    fontWeight: FontWeight.w400,
    color: AppColors.textMuted,
  );

  static const TextStyle unreadBadge = TextStyle(
    fontFamily: fontFamily,
    fontSize: 12,
    fontWeight: FontWeight.w700,
    color: Colors.white,
  );

  static const TextStyle filterChip = TextStyle(
    fontFamily: fontFamily,
    fontSize: 13,
    fontWeight: FontWeight.w600,
  );

  static const TextStyle searchHint = TextStyle(
    fontFamily: fontFamily,
    fontSize: 15,
    fontWeight: FontWeight.w400,
    color: AppColors.textMuted,
  );
}

class AppTheme {
  AppTheme._();

  static ThemeData get dark {
    final base = ThemeData.dark(useMaterial3: true);
    return base.copyWith(
      scaffoldBackgroundColor: AppColors.bgPrimary,
      primaryColor: AppColors.accentPrimary,
      colorScheme: base.colorScheme.copyWith(
        primary: AppColors.accentPrimary,
        secondary: AppColors.accentTertiary,
        surface: AppColors.bgSecondary,
        error: AppColors.missedCall,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.bgPrimary,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: AppTextStyles.appBarTitle,
      ),
      dividerColor: AppColors.divider,
      iconTheme: const IconThemeData(color: AppColors.textSecondary),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: AppColors.bgPrimary,
        selectedItemColor: AppColors.accentPrimary,
        unselectedItemColor: AppColors.textMuted,
        showUnselectedLabels: true,
        type: BottomNavigationBarType.fixed,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.bgInputField,
        hintStyle: AppTextStyles.searchHint,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppSpacing.pillRadius),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }
}
