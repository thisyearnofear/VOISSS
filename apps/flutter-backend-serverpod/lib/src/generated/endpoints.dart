/* AUTOMATICALLY GENERATED CODE DO NOT MODIFY */
/*   To generate run: "serverpod generate"    */

// ignore_for_file: implementation_imports
// ignore_for_file: library_private_types_in_public_api
// ignore_for_file: non_constant_identifier_names
// ignore_for_file: public_member_api_docs
// ignore_for_file: type_literal_in_constant_pattern
// ignore_for_file: use_super_parameters

// ignore_for_file: no_leading_underscores_for_library_prefixes
import 'package:serverpod/serverpod.dart' as _i1;
import '../butler_endpoint.dart' as _i2;
import '../greeting_endpoint.dart' as _i3;

class Endpoints extends _i1.EndpointDispatch {
  @override
  void initializeEndpoints(_i1.Server server) {
    var endpoints = <String, _i1.Endpoint>{
      'butler': _i2.ButlerEndpoint()
        ..initialize(
          server,
          'butler',
          null,
        ),
      'greeting': _i3.GreetingEndpoint()
        ..initialize(
          server,
          'greeting',
          null,
        ),
    };
    connectors['butler'] = _i1.EndpointConnector(
      name: 'butler',
      endpoint: endpoints['butler']!,
      methodConnectors: {
        'health': _i1.MethodConnector(
          name: 'health',
          params: {},
          call: (
            _i1.Session session,
            Map<String, dynamic> params,
          ) async =>
              (endpoints['butler'] as _i2.ButlerEndpoint).health(session),
        ),
        'chat': _i1.MethodConnector(
          name: 'chat',
          params: {
            'message': _i1.ParameterDescription(
              name: 'message',
              type: _i1.getType<String>(),
              nullable: false,
            ),
            'recordingId': _i1.ParameterDescription(
              name: 'recordingId',
              type: _i1.getType<String?>(),
              nullable: true,
            ),
            'context': _i1.ParameterDescription(
              name: 'context',
              type: _i1.getType<Map<String, dynamic>?>(),
              nullable: true,
            ),
          },
          call: (
            _i1.Session session,
            Map<String, dynamic> params,
          ) async =>
              (endpoints['butler'] as _i2.ButlerEndpoint).chat(
            session,
            message: params['message'],
            recordingId: params['recordingId'],
            context: params['context'],
          ),
        ),
        'analyzeAudio': _i1.MethodConnector(
          name: 'analyzeAudio',
          params: {
            'recordingId': _i1.ParameterDescription(
              name: 'recordingId',
              type: _i1.getType<String>(),
              nullable: false,
            ),
            'audioUrl': _i1.ParameterDescription(
              name: 'audioUrl',
              type: _i1.getType<String>(),
              nullable: false,
            ),
            'prompt': _i1.ParameterDescription(
              name: 'prompt',
              type: _i1.getType<String?>(),
              nullable: true,
            ),
          },
          call: (
            _i1.Session session,
            Map<String, dynamic> params,
          ) async =>
              (endpoints['butler'] as _i2.ButlerEndpoint).analyzeAudio(
            session,
            recordingId: params['recordingId'],
            audioUrl: params['audioUrl'],
            prompt: params['prompt'],
          ),
        ),
        'findRecordings': _i1.MethodConnector(
          name: 'findRecordings',
          params: {
            'query': _i1.ParameterDescription(
              name: 'query',
              type: _i1.getType<String>(),
              nullable: false,
            )
          },
          call: (
            _i1.Session session,
            Map<String, dynamic> params,
          ) async =>
              (endpoints['butler'] as _i2.ButlerEndpoint).findRecordings(
            session,
            query: params['query'],
          ),
        ),
        'getInsights': _i1.MethodConnector(
          name: 'getInsights',
          params: {},
          call: (
            _i1.Session session,
            Map<String, dynamic> params,
          ) async =>
              (endpoints['butler'] as _i2.ButlerEndpoint).getInsights(session),
        ),
        'getSuggestions': _i1.MethodConnector(
          name: 'getSuggestions',
          params: {},
          call: (
            _i1.Session session,
            Map<String, dynamic> params,
          ) async =>
              (endpoints['butler'] as _i2.ButlerEndpoint)
                  .getSuggestions(session),
        ),
      },
    );
    connectors['greeting'] = _i1.EndpointConnector(
      name: 'greeting',
      endpoint: endpoints['greeting']!,
      methodConnectors: {
        'hello': _i1.MethodConnector(
          name: 'hello',
          params: {
            'name': _i1.ParameterDescription(
              name: 'name',
              type: _i1.getType<String>(),
              nullable: false,
            )
          },
          call: (
            _i1.Session session,
            Map<String, dynamic> params,
          ) async =>
              (endpoints['greeting'] as _i3.GreetingEndpoint).hello(
            session,
            params['name'],
          ),
        )
      },
    );
  }
}
