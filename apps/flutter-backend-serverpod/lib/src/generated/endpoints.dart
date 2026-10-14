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
import '../silence_clip_endpoint.dart' as _i4;
import '../silence_co_writer_endpoint.dart' as _i5;
import '../silence_entry_endpoint.dart' as _i6;
import '../silence_vote_endpoint.dart' as _i7;
import 'package:voisss_butler_server/src/generated/co_writer_message.dart'
    as _i8;
import 'dart:typed_data' as _i9;

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
      'silenceClip': _i4.SilenceClipEndpoint()
        ..initialize(
          server,
          'silenceClip',
          null,
        ),
      'silenceCoWriter': _i5.SilenceCoWriterEndpoint()
        ..initialize(
          server,
          'silenceCoWriter',
          null,
        ),
      'silenceEntry': _i6.SilenceEntryEndpoint()
        ..initialize(
          server,
          'silenceEntry',
          null,
        ),
      'silenceVote': _i7.SilenceVoteEndpoint()
        ..initialize(
          server,
          'silenceVote',
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
          },
          call: (
            _i1.Session session,
            Map<String, dynamic> params,
          ) async =>
              (endpoints['butler'] as _i2.ButlerEndpoint).chat(
            session,
            message: params['message'],
            recordingId: params['recordingId'],
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
        'chatStream': _i1.MethodStreamConnector(
          name: 'chatStream',
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
          },
          streamParams: {},
          returnType: _i1.MethodStreamReturnType.streamType,
          call: (
            _i1.Session session,
            Map<String, dynamic> params,
            Map<String, Stream> streamParams,
          ) =>
              (endpoints['butler'] as _i2.ButlerEndpoint).chatStream(
            session,
            message: params['message'],
            recordingId: params['recordingId'],
          ),
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
    connectors['silenceClip'] = _i1.EndpointConnector(
      name: 'silenceClip',
      endpoint: endpoints['silenceClip']!,
      methodConnectors: {
        'getActive': _i1.MethodConnector(
          name: 'getActive',
          params: {},
          call: (
            _i1.Session session,
            Map<String, dynamic> params,
          ) async =>
              (endpoints['silenceClip'] as _i4.SilenceClipEndpoint)
                  .getActive(session),
        ),
        'listSelectable': _i1.MethodConnector(
          name: 'listSelectable',
          params: {},
          call: (
            _i1.Session session,
            Map<String, dynamic> params,
          ) async =>
              (endpoints['silenceClip'] as _i4.SilenceClipEndpoint)
                  .listSelectable(session),
        ),
        'updateClipMedia': _i1.MethodConnector(
          name: 'updateClipMedia',
          params: {
            'clipId': _i1.ParameterDescription(
              name: 'clipId',
              type: _i1.getType<int>(),
              nullable: false,
            ),
            'videoUrl': _i1.ParameterDescription(
              name: 'videoUrl',
              type: _i1.getType<String>(),
              nullable: false,
            ),
            'storageUri': _i1.ParameterDescription(
              name: 'storageUri',
              type: _i1.getType<String>(),
              nullable: false,
            ),
          },
          call: (
            _i1.Session session,
            Map<String, dynamic> params,
          ) async =>
              (endpoints['silenceClip'] as _i4.SilenceClipEndpoint)
                  .updateClipMedia(
            session,
            params['clipId'],
            params['videoUrl'],
            params['storageUri'],
          ),
        ),
        'listArchive': _i1.MethodConnector(
          name: 'listArchive',
          params: {},
          call: (
            _i1.Session session,
            Map<String, dynamic> params,
          ) async =>
              (endpoints['silenceClip'] as _i4.SilenceClipEndpoint)
                  .listArchive(session),
        ),
        'updateSceneGuide': _i1.MethodConnector(
          name: 'updateSceneGuide',
          params: {
            'clipId': _i1.ParameterDescription(
              name: 'clipId',
              type: _i1.getType<int>(),
              nullable: false,
            ),
            'sceneGuide': _i1.ParameterDescription(
              name: 'sceneGuide',
              type: _i1.getType<String>(),
              nullable: false,
            ),
          },
          call: (
            _i1.Session session,
            Map<String, dynamic> params,
          ) async =>
              (endpoints['silenceClip'] as _i4.SilenceClipEndpoint)
                  .updateSceneGuide(
            session,
            params['clipId'],
            params['sceneGuide'],
          ),
        ),
        'createClip': _i1.MethodConnector(
          name: 'createClip',
          params: {
            'title': _i1.ParameterDescription(
              name: 'title',
              type: _i1.getType<String>(),
              nullable: false,
            ),
            'videoUrl': _i1.ParameterDescription(
              name: 'videoUrl',
              type: _i1.getType<String>(),
              nullable: false,
            ),
            'durationSec': _i1.ParameterDescription(
              name: 'durationSec',
              type: _i1.getType<int>(),
              nullable: false,
            ),
            'rightsNote': _i1.ParameterDescription(
              name: 'rightsNote',
              type: _i1.getType<String>(),
              nullable: false,
            ),
            'weekStart': _i1.ParameterDescription(
              name: 'weekStart',
              type: _i1.getType<DateTime>(),
              nullable: false,
            ),
            'activate': _i1.ParameterDescription(
              name: 'activate',
              type: _i1.getType<bool>(),
              nullable: false,
            ),
          },
          call: (
            _i1.Session session,
            Map<String, dynamic> params,
          ) async =>
              (endpoints['silenceClip'] as _i4.SilenceClipEndpoint).createClip(
            session,
            params['title'],
            params['videoUrl'],
            params['durationSec'],
            params['rightsNote'],
            params['weekStart'],
            activate: params['activate'],
          ),
        ),
      },
    );
    connectors['silenceCoWriter'] = _i1.EndpointConnector(
      name: 'silenceCoWriter',
      endpoint: endpoints['silenceCoWriter']!,
      methodConnectors: {
        'openers': _i1.MethodConnector(
          name: 'openers',
          params: {
            'clipId': _i1.ParameterDescription(
              name: 'clipId',
              type: _i1.getType<int>(),
              nullable: false,
            )
          },
          call: (
            _i1.Session session,
            Map<String, dynamic> params,
          ) async =>
              (endpoints['silenceCoWriter'] as _i5.SilenceCoWriterEndpoint)
                  .openers(
            session,
            params['clipId'],
          ),
        ),
        'chat': _i1.MethodConnector(
          name: 'chat',
          params: {
            'clipId': _i1.ParameterDescription(
              name: 'clipId',
              type: _i1.getType<int>(),
              nullable: false,
            ),
            'history': _i1.ParameterDescription(
              name: 'history',
              type: _i1.getType<List<_i8.CoWriterMessage>>(),
              nullable: false,
            ),
            'draft': _i1.ParameterDescription(
              name: 'draft',
              type: _i1.getType<String>(),
              nullable: false,
            ),
          },
          call: (
            _i1.Session session,
            Map<String, dynamic> params,
          ) async =>
              (endpoints['silenceCoWriter'] as _i5.SilenceCoWriterEndpoint)
                  .chat(
            session,
            params['clipId'],
            params['history'],
            params['draft'],
          ),
        ),
        'riff': _i1.MethodStreamConnector(
          name: 'riff',
          params: {
            'clipId': _i1.ParameterDescription(
              name: 'clipId',
              type: _i1.getType<int>(),
              nullable: false,
            ),
            'history': _i1.ParameterDescription(
              name: 'history',
              type: _i1.getType<List<_i8.CoWriterMessage>>(),
              nullable: false,
            ),
            'draft': _i1.ParameterDescription(
              name: 'draft',
              type: _i1.getType<String>(),
              nullable: false,
            ),
          },
          streamParams: {},
          returnType: _i1.MethodStreamReturnType.streamType,
          call: (
            _i1.Session session,
            Map<String, dynamic> params,
            Map<String, Stream> streamParams,
          ) =>
              (endpoints['silenceCoWriter'] as _i5.SilenceCoWriterEndpoint)
                  .riff(
            session,
            params['clipId'],
            params['history'],
            params['draft'],
          ),
        ),
      },
    );
    connectors['silenceEntry'] = _i1.EndpointConnector(
      name: 'silenceEntry',
      endpoint: endpoints['silenceEntry']!,
      methodConnectors: {
        'aiVoices': _i1.MethodConnector(
          name: 'aiVoices',
          params: {},
          call: (
            _i1.Session session,
            Map<String, dynamic> params,
          ) async =>
              (endpoints['silenceEntry'] as _i6.SilenceEntryEndpoint)
                  .aiVoices(session),
        ),
        'generate': _i1.MethodConnector(
          name: 'generate',
          params: {
            'clipId': _i1.ParameterDescription(
              name: 'clipId',
              type: _i1.getType<int>(),
              nullable: false,
            ),
            'displayName': _i1.ParameterDescription(
              name: 'displayName',
              type: _i1.getType<String>(),
              nullable: false,
            ),
            'script': _i1.ParameterDescription(
              name: 'script',
              type: _i1.getType<String>(),
              nullable: false,
            ),
            'voice': _i1.ParameterDescription(
              name: 'voice',
              type: _i1.getType<String>(),
              nullable: false,
            ),
          },
          call: (
            _i1.Session session,
            Map<String, dynamic> params,
          ) async =>
              (endpoints['silenceEntry'] as _i6.SilenceEntryEndpoint).generate(
            session,
            params['clipId'],
            params['displayName'],
            params['script'],
            params['voice'],
          ),
        ),
        'submit': _i1.MethodConnector(
          name: 'submit',
          params: {
            'clipId': _i1.ParameterDescription(
              name: 'clipId',
              type: _i1.getType<int>(),
              nullable: false,
            ),
            'displayName': _i1.ParameterDescription(
              name: 'displayName',
              type: _i1.getType<String>(),
              nullable: false,
            ),
            'audio': _i1.ParameterDescription(
              name: 'audio',
              type: _i1.getType<_i9.ByteData>(),
              nullable: false,
            ),
            'audioFormat': _i1.ParameterDescription(
              name: 'audioFormat',
              type: _i1.getType<String>(),
              nullable: false,
            ),
          },
          call: (
            _i1.Session session,
            Map<String, dynamic> params,
          ) async =>
              (endpoints['silenceEntry'] as _i6.SilenceEntryEndpoint).submit(
            session,
            params['clipId'],
            params['displayName'],
            params['audio'],
            params['audioFormat'],
          ),
        ),
        'list': _i1.MethodConnector(
          name: 'list',
          params: {
            'clipId': _i1.ParameterDescription(
              name: 'clipId',
              type: _i1.getType<int>(),
              nullable: false,
            )
          },
          call: (
            _i1.Session session,
            Map<String, dynamic> params,
          ) async =>
              (endpoints['silenceEntry'] as _i6.SilenceEntryEndpoint).list(
            session,
            params['clipId'],
          ),
        ),
      },
    );
    connectors['silenceVote'] = _i1.EndpointConnector(
      name: 'silenceVote',
      endpoint: endpoints['silenceVote']!,
      methodConnectors: {
        'cast': _i1.MethodConnector(
          name: 'cast',
          params: {
            'entryId': _i1.ParameterDescription(
              name: 'entryId',
              type: _i1.getType<int>(),
              nullable: false,
            ),
            'voterToken': _i1.ParameterDescription(
              name: 'voterToken',
              type: _i1.getType<String>(),
              nullable: false,
            ),
            'score': _i1.ParameterDescription(
              name: 'score',
              type: _i1.getType<int>(),
              nullable: false,
            ),
          },
          call: (
            _i1.Session session,
            Map<String, dynamic> params,
          ) async =>
              (endpoints['silenceVote'] as _i7.SilenceVoteEndpoint).cast(
            session,
            params['entryId'],
            params['voterToken'],
            params['score'],
          ),
        ),
        'leaderboard': _i1.MethodConnector(
          name: 'leaderboard',
          params: {
            'clipId': _i1.ParameterDescription(
              name: 'clipId',
              type: _i1.getType<int>(),
              nullable: false,
            )
          },
          call: (
            _i1.Session session,
            Map<String, dynamic> params,
          ) async =>
              (endpoints['silenceVote'] as _i7.SilenceVoteEndpoint).leaderboard(
            session,
            params['clipId'],
          ),
        ),
        'watchLeaderboard': _i1.MethodStreamConnector(
          name: 'watchLeaderboard',
          params: {
            'clipId': _i1.ParameterDescription(
              name: 'clipId',
              type: _i1.getType<int>(),
              nullable: false,
            )
          },
          streamParams: {},
          returnType: _i1.MethodStreamReturnType.streamType,
          call: (
            _i1.Session session,
            Map<String, dynamic> params,
            Map<String, Stream> streamParams,
          ) =>
              (endpoints['silenceVote'] as _i7.SilenceVoteEndpoint)
                  .watchLeaderboard(
            session,
            params['clipId'],
          ),
        ),
      },
    );
  }
}
