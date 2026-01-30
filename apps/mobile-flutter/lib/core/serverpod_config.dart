/// Serverpod client configuration
/// 
/// This connects to your Hetzner Serverpod backend.
/// The Serverpod backend is running at butler.voisss.famile.xyz
class ServerpodConfig {
  /// Your Hetzner server domain for Butler API
  static const String host = 'butler.voisss.famile.xyz';
  
  /// Serverpod server port (443 for HTTPS)
  static const int port = 443;
  
  /// WebSocket port for real-time features (443 for WSS)
  static const int webSocketPort = 443;
  
  /// Use HTTPS in production
  static const bool useHttps = true;
  
  /// API endpoints
  static String get baseUrl => useHttps 
      ? 'https://$host/' 
      : 'http://$host:$port/';
      
  static String get webSocketUrl => useHttps
      ? 'wss://$host/'
      : 'ws://$host:$webSocketPort/';
}
