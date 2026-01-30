/* AUTOMATICALLY GENERATED CODE DO NOT MODIFY */
/*   To generate run: "serverpod generate"    */

// ignore_for_file: implementation_imports
// ignore_for_file: library_private_types_in_public_api
// ignore_for_file: non_constant_identifier_names
// ignore_for_file: public_member_api_docs
// ignore_for_file: type_literal_in_constant_pattern
// ignore_for_file: use_super_parameters

// ignore_for_file: no_leading_underscores_for_library_prefixes
import 'package:serverpod_client/serverpod_client.dart' as _i1;
import 'dart:async' as _i2;
import 'package:voisss_butler_client/src/protocol/greeting.dart' as _i3;
import 'protocol.dart' as _i4;

/// The Butler endpoint provides AI-powered voice assistant capabilities
/// {@category Endpoint}
class EndpointButler extends _i1.EndpointRef {
  EndpointButler(_i1.EndpointCaller caller) : super(caller);

  @override
  String get name => 'butler';

  /// Simple health check
  _i2.Future<String> health() => caller.callServerEndpoint<String>(
        'butler',
        'health',
        {},
      );

  /// Chat with the Butler AI
  _i2.Future<Map<String, dynamic>> chat({
    required String message,
    String? recordingId,
    Map<String, dynamic>? context,
  }) =>
      caller.callServerEndpoint<Map<String, dynamic>>(
        'butler',
        'chat',
        {
          'message': message,
          'recordingId': recordingId,
          'context': context,
        },
      );

  /// Analyze an audio recording
  _i2.Future<Map<String, dynamic>> analyzeAudio({
    required String recordingId,
    required String audioUrl,
    String? prompt,
  }) =>
      caller.callServerEndpoint<Map<String, dynamic>>(
        'butler',
        'analyzeAudio',
        {
          'recordingId': recordingId,
          'audioUrl': audioUrl,
          'prompt': prompt,
        },
      );

  /// Find recordings by query
  _i2.Future<List<Map<String, dynamic>>> findRecordings(
          {required String query}) =>
      caller.callServerEndpoint<List<Map<String, dynamic>>>(
        'butler',
        'findRecordings',
        {'query': query},
      );

  /// Get Butler insights
  _i2.Future<Map<String, dynamic>> getInsights() =>
      caller.callServerEndpoint<Map<String, dynamic>>(
        'butler',
        'getInsights',
        {},
      );

  /// Get suggested actions
  _i2.Future<List<String>> getSuggestions() =>
      caller.callServerEndpoint<List<String>>(
        'butler',
        'getSuggestions',
        {},
      );
}

/// This is an example endpoint that returns a greeting message through
/// its [hello] method.
/// {@category Endpoint}
class EndpointGreeting extends _i1.EndpointRef {
  EndpointGreeting(_i1.EndpointCaller caller) : super(caller);

  @override
  String get name => 'greeting';

  /// Returns a personalized greeting message: "Hello {name}".
  _i2.Future<_i3.Greeting> hello(String name) =>
      caller.callServerEndpoint<_i3.Greeting>(
        'greeting',
        'hello',
        {'name': name},
      );
}

class Client extends _i1.ServerpodClientShared {
  Client(
    String host, {
    dynamic securityContext,
    _i1.AuthenticationKeyManager? authenticationKeyManager,
    Duration? streamingConnectionTimeout,
    Duration? connectionTimeout,
    Function(
      _i1.MethodCallContext,
      Object,
      StackTrace,
    )? onFailedCall,
    Function(_i1.MethodCallContext)? onSucceededCall,
    bool? disconnectStreamsOnLostInternetConnection,
  }) : super(
          host,
          _i4.Protocol(),
          securityContext: securityContext,
          authenticationKeyManager: authenticationKeyManager,
          streamingConnectionTimeout: streamingConnectionTimeout,
          connectionTimeout: connectionTimeout,
          onFailedCall: onFailedCall,
          onSucceededCall: onSucceededCall,
          disconnectStreamsOnLostInternetConnection:
              disconnectStreamsOnLostInternetConnection,
        ) {
    butler = EndpointButler(this);
    greeting = EndpointGreeting(this);
  }

  late final EndpointButler butler;

  late final EndpointGreeting greeting;

  @override
  Map<String, _i1.EndpointRef> get endpointRefLookup => {
        'butler': butler,
        'greeting': greeting,
      };

  @override
  Map<String, _i1.ModuleEndpointCaller> get moduleLookup => {};
}
