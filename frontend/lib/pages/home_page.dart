import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:math' as math;

import '../api/api_calls.dart';
import '../utils/theme.dart';
import '../models/home_page_model.dart';

class HomePageWidget extends StatefulWidget {
  const HomePageWidget({super.key});

  static String routeName = 'HomePage';
  static String routePath = '/homePage';

  @override
  State<HomePageWidget> createState() => _HomePageWidgetState();
}

class _HomePageWidgetState extends State<HomePageWidget> {
  late HomePageModel _model;
  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => HomePageModel());
  }

  @override
  void dispose() {
    _model.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        FocusScope.of(context).unfocus();
      },
      child: Scaffold(
        key: scaffoldKey,
        backgroundColor: FlutterFlowTheme.of(context).primaryBackground,
        appBar: AppBar(
          backgroundColor: FlutterFlowTheme.of(context).primary,
          automaticallyImplyLeading: false,
          title: Text(
            'Helios AI Dashboard',
            style: FlutterFlowTheme.of(context).headlineMedium.override(
                  fontFamily: 'Outfit',
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
          ),
          centerTitle: true,
          elevation: 2,
        ),
        body: SafeArea(
          top: true,
          child: FutureBuilder<ApiCallResponse>(
            // We use standard FutureBuilder. Ideally use a StreamBuilder for Firebase Realtime DB, but REST API is Future-based.
            // Converting to Stream or periodic refresh would be better, but sticking to dummy logic for now.
            // To make it "live", one would typically need a Timer to refresh or use Firebase SDK.
            // For now, let's keep it as is or maybe add a refresh button? 
            future: GetTrackerStatusCall.call(), 
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                 return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(
                        color: FlutterFlowTheme.of(context).primary,
                      ),
                      const SizedBox(height: 10),
                      const Text("Connecting to Helios...", style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                );
              }

              if (!snapshot.hasData || !snapshot.data!.succeeded) {
                 return Center(
                   child: Column(
                     mainAxisAlignment: MainAxisAlignment.center,
                     children: [
                       const Icon(Icons.error_outline, color: Colors.red, size: 60),
                       const SizedBox(height: 10),
                       Text("Failed to load data\n${snapshot.data?.bodyText ?? 'Unknown error'}", textAlign: TextAlign.center),
                       const SizedBox(height: 20),
                       ElevatedButton(
                         onPressed: () {
                           setState(() {});
                         },
                         child: const Text("Retry"),
                       )
                     ],
                   ),
                 );
              }

              final apiResult = snapshot.data!;
              final jsonBody = apiResult.jsonBody;

              // --- Data Parsing ---
              
              // 1. Weather Data
              // Check keys provided in virtual_helios.py: 'weather_data'
              final weatherData = getJsonField(jsonBody, r'weather_data') as Map<String, dynamic>?;
              String condition = weatherData?['condition']?.toString() ?? "Unknown";
              String suggestion = weatherData?['suggestion']?.toString() ?? "No Data";
              
              // 2. Sensor Data
              // Start with 'sensor_data' or 'sensors' (virtual_helios uses 'sensors' in payload, but writes to '/sensor_data')
              final sensorData = getJsonField(jsonBody, r'sensor_data') as Map<String, dynamic>?;
              
              String temp = sensorData?['temperature']?.toString() ?? "0";
              double humidity = double.tryParse(sensorData?['humidity']?.toString() ?? "") ?? 0.0;
              
              double luxTr = double.tryParse(sensorData?['lux_tr']?.toString() ?? "") ?? 0.0;
              double luxTl = double.tryParse(sensorData?['lux_tl']?.toString() ?? "") ?? 0.0;
              double luxBr = double.tryParse(sensorData?['lux_br']?.toString() ?? "") ?? 0.0;
              double luxBl = double.tryParse(sensorData?['lux_bl']?.toString() ?? "") ?? 0.0;
              double avgLux = (luxTr + luxTl + luxBr + luxBl) / 4; 

              // 3. Control/Angle Data
              final controlData = getJsonField(jsonBody, r'control_commands') as Map<String, dynamic>?;
              double angleX = double.tryParse(controlData?['target_h']?.toString() ?? "") ?? 45.0;
              double angleY = double.tryParse(controlData?['target_v']?.toString() ?? "") ?? 30.0;


              return SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                     // --- Refresh Button (Added for convenience) ---
                    Align(
                      alignment: Alignment.centerRight,
                      child: IconButton(
                        icon: const Icon(Icons.refresh),
                        onPressed: () {
                          setState(() {});
                        },
                      ),
                    ),
                    
                    // --- SECTION 1: Weather (AI Result) ---
                    _sectionTitle("Weather & AI Insight"),
                    const SizedBox(height: 8),
                    _buildWeatherCard(condition, temp, suggestion),
                    
                    const SizedBox(height: 24),
                    
                    // --- SECTION 2: Sensors (Gauges) ---
                    _sectionTitle("Environment Sensors"),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(child: _buildCircularGauge("Humidity", humidity, 100, Colors.blueAccent, "%")),
                        const SizedBox(width: 12),
                        Expanded(child: _buildCircularGauge("Light Intensity", avgLux, 5000, Colors.orangeAccent, "lux")), // Increased max lux to 5000
                      ],
                    ),

                    const SizedBox(height: 24),

                    // --- SECTION 3: Angle Monitor ---
                    _sectionTitle("Solar Tracker Status"),
                    const SizedBox(height: 8),
                    _buildAngleMonitor(angleX, angleY),
                    
                    const SizedBox(height: 30),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  // --- Widgets ---

  Widget _sectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4.0),
      child: Text(
        title,
        style: FlutterFlowTheme.of(context).bodyMedium.override(
          color: const Color(0xFF57636C),
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildWeatherCard(String condition, String temp, String suggestion) {
    IconData weatherIcon = Icons.wb_sunny;
    Color cardColor = const Color(0xFF4B39EF); 
    
    String lowerCond = condition.toLowerCase();
    if (lowerCond.contains('cloud')) {
      weatherIcon = Icons.cloud;
      cardColor = const Color(0xFF4B39EF).withValues(alpha: 0.8);
    } else if (lowerCond.contains('rain')) {
      weatherIcon = Icons.water_drop;
      cardColor = const Color(0xFF39D2C0); 
    } else if (lowerCond.contains('sunny') || lowerCond.contains('clear')) {
      cardColor = const Color(0xFFEE8B60); 
    }

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [
           BoxShadow(
            blurRadius: 4,
            color: Color(0x33000000),
            offset: Offset(0, 2),
          )
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      condition,
                      style: FlutterFlowTheme.of(context).headlineMedium.override(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Text(
                      'Temperature',
                      style: FlutterFlowTheme.of(context).bodyMedium.override(
                        color: const Color(0xB3FFFFFF),
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                Text(
                  '$temp°C',
                  style: FlutterFlowTheme.of(context).headlineMedium.override(
                    color: Colors.white,
                    fontSize: 44,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Container(
              decoration: BoxDecoration(
                color: const Color(0x33FFFFFF),
                borderRadius: BorderRadius.circular(8),
              ),
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  const Icon(Icons.auto_awesome, color: Colors.white, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'AI: $suggestion',
                      style: FlutterFlowTheme.of(context).bodyMedium.override(
                        color: Colors.white,
                        fontSize: 14,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCircularGauge(String title, double value, double max, Color color, String unit) {
    double progress = (value / max).clamp(0.0, 1.0);
    
    return Container(
      height: 160,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [
           BoxShadow(blurRadius: 4, color: Color(0x33000000), offset: Offset(0, 2))
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(title, style: FlutterFlowTheme.of(context).bodyMedium.override(color: const Color(0xFF57636C), fontSize: 12)),
            const SizedBox(height: 12),
            Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 80,
                  height: 80,
                  child: const CircularProgressIndicator(
                    value: 1.0, 
                    strokeWidth: 8,
                    color: Color(0xFFE0E3E7),
                  ),
                ),
                SizedBox(
                  width: 80,
                  height: 80,
                  child: CircularProgressIndicator(
                    value: progress,
                    strokeWidth: 8,
                    color: color,
                    strokeCap: StrokeCap.round,
                  ),
                ),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      value.toInt().toString(),
                      style: FlutterFlowTheme.of(context).headlineMedium.override(
                        color: const Color(0xFF14181B),
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      unit,
                      style: FlutterFlowTheme.of(context).bodyMedium.override(
                        color: const Color(0xFF57636C),
                        fontSize: 10,
                      ),
                    ),
                  ],
                )
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAngleMonitor(double x, double y) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [
           BoxShadow(blurRadius: 4, color: Color(0x33000000), offset: Offset(0, 2))
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _singleAngle("Pan Axis (X)", x, Colors.blue),
          Container(width: 1, height: 60, color: const Color(0xFFE0E3E7)),
          _singleAngle("Tilt Axis (Y)", y, Colors.green),
        ],
      ),
    );
  }

  Widget _singleAngle(String label, double angle, Color color) {
    return Column(
      children: [
        Transform.rotate(
          angle: angle * (math.pi / 180),
          child: Icon(Icons.navigation, size: 40, color: color),
        ),
        const SizedBox(height: 8),
        Text(
          label,
          style: FlutterFlowTheme.of(context).bodyMedium.override(color: const Color(0xFF57636C), fontSize: 12),
        ),
        Text(
          "${angle.toStringAsFixed(1)}°",
          style: FlutterFlowTheme.of(context).headlineMedium.override(
            color: const Color(0xFF14181B),
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}
