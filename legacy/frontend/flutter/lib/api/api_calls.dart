import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiCallResponse {
  final Map<String, dynamic>? jsonBody;
  final int statusCode;
  final String bodyText;

  ApiCallResponse({
    this.jsonBody,
    required this.statusCode,
    required this.bodyText,
  });

  bool get succeeded => statusCode >= 200 && statusCode < 300;
}

class GetTrackerStatusCall {
  static const String _firebaseUrl = 'https://dualaxissolartracker-46ecc-default-rtdb.asia-southeast1.firebasedatabase.app/'; // TODO: Replace with your actual Firebase URL if different
  // Note: The structure in virtual_helios.py suggests data is at root or specific nodes. 
  // We'll fetch the whole DB to parse everything easily, or fetch specific nodes in parallel.
  // For simplicity based on dummy.txt, we'll fetch the root to get 'weather_data', 'sensor_data', 'control'.

  static Future<ApiCallResponse> call() async {
    try {
      final response = await http.get(Uri.parse('$_firebaseUrl/.json'));
      
      final jsonBody = json.decode(response.body);
      return ApiCallResponse(
        jsonBody: jsonBody is Map<String, dynamic> ? jsonBody : {},
        statusCode: response.statusCode,
        bodyText: response.body,
      );
    } catch (e) {
      return ApiCallResponse(
        jsonBody: {},
        statusCode: 500,
        bodyText: e.toString(),
      );
    }
  }
}

// Helper to safely get nested JSON fields
dynamic getJsonField(Map<String, dynamic>? json, String path) {
  if (json == null) return null;
  // path example: $.weather_data.condition
  // Remove $. and split by .
  final parts = path.replaceAll(r'$.', '').split('.');
  dynamic current = json;
  
  for (final part in parts) {
    if (current is Map && current.containsKey(part)) {
      current = current[part];
    } else {
      return null;
    }
  }
  return current;
}
