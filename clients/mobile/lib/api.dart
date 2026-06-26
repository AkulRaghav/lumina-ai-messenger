import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'app_router.dart';

final apiProvider = Provider<ApiService>((ref) {
  final token = ref.watch(authProvider);
  return ApiService(token);
});

class ApiService {
  final String? _token;
  static const baseUrl = 'http://localhost:3000';

  ApiService(this._token);

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  Future<List<dynamic>> get(String path) async {
    final res = await http.get(
      Uri.parse('$baseUrl$path'),
      headers: _headers,
    );
    if (res.statusCode == 200) return jsonDecode(res.body);
    return [];
  }

  Future<Map<String, dynamic>> post(
    String path,
    Map<String, dynamic> body,
  ) async {
    final res = await http.post(
      Uri.parse('$baseUrl$path'),
      headers: _headers,
      body: jsonEncode(body),
    );
    return jsonDecode(res.body);
  }
}
