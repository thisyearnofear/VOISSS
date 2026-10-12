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
import 'package:voisss_butler_client/src/protocol/silence_clip.dart' as _i4;
import 'package:voisss_butler_client/src/protocol/silence_entry_view.dart'
    as _i5;
import 'dart:typed_data' as _i6;
import 'package:voisss_butler_client/src/protocol/silence_leaderboard_row.dart'
    as _i7;
import 'protocol.dart' as _i8;

/// {@category Endpoint}
class EndpointButler extends _i1.EndpointRef {
  EndpointButler(_i1.EndpointCaller caller) : super(caller);

  @override
  String get name => 'butler';

  _i2.Future<String> health() => caller.callServerEndpoint<String>(
        'butler',
        'health',
        {},
      );

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

  _i2.Future<List<Map<String, dynamic>>> findRecordings(
          {required String query}) =>
      caller.callServerEndpoint<List<Map<String, dynamic>>>(
        'butler',
        'findRecordings',
        {'query': query},
      );

  _i2.Future<Map<String, dynamic>> getInsights() =>
      caller.callServerEndpoint<Map<String, dynamic>>(
        'butler',
        'getInsights',
        {},
      );

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

/// Endpoints for the "Voice the Silence" weekly clip contest.
/// Accessed on the client as `client.silenceClip`.
/// {@category Endpoint}
class EndpointSilenceClip extends _i1.EndpointRef {
  EndpointSilenceClip(_i1.EndpointCaller caller) : super(caller);

  @override
  String get name => 'silenceClip';

  /// The currently active contest clip, or null if none is active.
  _i2.Future<_i4.SilenceClip?> getActive() =>
      caller.callServerEndpoint<_i4.SilenceClip?>(
        'silenceClip',
        'getActive',
        {},
      );

  /// Past (inactive) clips, newest first.
  _i2.Future<List<_i4.SilenceClip>> listArchive() =>
      caller.callServerEndpoint<List<_i4.SilenceClip>>(
        'silenceClip',
        'listArchive',
        {},
      );

  /// Creates a clip. Sprint admin path — no auth for now; do not expose
  /// publicly without adding an admin check.
  _i2.Future<_i4.SilenceClip> createClip(
    String title,
    String videoUrl,
    int durationSec,
    String rightsNote,
    DateTime weekStart, {
    required bool activate,
  }) =>
      caller.callServerEndpoint<_i4.SilenceClip>(
        'silenceClip',
        'createClip',
        {
          'title': title,
          'videoUrl': videoUrl,
          'durationSec': durationSec,
          'rightsNote': rightsNote,
          'weekStart': weekStart,
          'activate': activate,
        },
      );
}

/// Voiceover entry submission and listing. Accessed as `client.silenceEntry`.
/// {@category Endpoint}
class EndpointSilenceEntry extends _i1.EndpointRef {
  EndpointSilenceEntry(_i1.EndpointCaller caller) : super(caller);

  @override
  String get name => 'silenceEntry';

  /// The voice menu the client renders its picker from (name → display label).
  _i2.Future<Map<String, String>> aiVoices() =>
      caller.callServerEndpoint<Map<String, String>>(
        'silenceEntry',
        'aiVoices',
        {},
      );

  /// Synthesize a take via Featherless (Kokoro-82M) and submit it flagged
  /// `isAiGenerated` — the crowd votes blind, the flag powers the
  /// post-vote "this one was a machine" reveal.
  _i2.Future<_i5.SilenceEntryView> generate(
    int clipId,
    String displayName,
    String script,
    String voice,
  ) =>
      caller.callServerEndpoint<_i5.SilenceEntryView>(
        'silenceEntry',
        'generate',
        {
          'clipId': clipId,
          'displayName': displayName,
          'script': script,
          'voice': voice,
        },
      );

  /// Submit a voiceover for the active clip.
  /// [audio] is the raw encoded file (e.g. m4a from the `record` package).
  _i2.Future<_i5.SilenceEntryView> submit(
    int clipId,
    String displayName,
    _i6.ByteData audio,
    String audioFormat,
  ) =>
      caller.callServerEndpoint<_i5.SilenceEntryView>(
        'silenceEntry',
        'submit',
        {
          'clipId': clipId,
          'displayName': displayName,
          'audio': audio,
          'audioFormat': audioFormat,
        },
      );

  /// All entries for a clip, newest first.
  _i2.Future<List<_i5.SilenceEntryView>> list(int clipId) =>
      caller.callServerEndpoint<List<_i5.SilenceEntryView>>(
        'silenceEntry',
        'list',
        {'clipId': clipId},
      );
}

/// Voting and the live leaderboard. Accessed as `client.silenceVote`.
/// {@category Endpoint}
class EndpointSilenceVote extends _i1.EndpointRef {
  EndpointSilenceVote(_i1.EndpointCaller caller) : super(caller);

  @override
  String get name => 'silenceVote';

  /// Cast (or change) a vote. One vote per voter token per entry;
  /// repeat calls update the score. Returns the updated leaderboard.
  _i2.Future<List<_i7.SilenceLeaderboardRow>> cast(
    int entryId,
    String voterToken,
    int score,
  ) =>
      caller.callServerEndpoint<List<_i7.SilenceLeaderboardRow>>(
        'silenceVote',
        'cast',
        {
          'entryId': entryId,
          'voterToken': voterToken,
          'score': score,
        },
      );

  /// Current leaderboard for a clip, ordered by average score.
  _i2.Future<List<_i7.SilenceLeaderboardRow>> leaderboard(int clipId) =>
      caller.callServerEndpoint<List<_i7.SilenceLeaderboardRow>>(
        'silenceVote',
        'leaderboard',
        {'clipId': clipId},
      );

  /// Streams leaderboard updates for a clip. The client calls
  /// `client.silenceVote.watchLeaderboard(clipId)` and listens.
  _i2.Stream<List<_i7.SilenceLeaderboardRow>> watchLeaderboard(int clipId) =>
      caller.callStreamingServerEndpoint<
          _i2.Stream<List<_i7.SilenceLeaderboardRow>>,
          List<_i7.SilenceLeaderboardRow>>(
        'silenceVote',
        'watchLeaderboard',
        {'clipId': clipId},
        {},
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
          _i8.Protocol(),
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
    silenceClip = EndpointSilenceClip(this);
    silenceEntry = EndpointSilenceEntry(this);
    silenceVote = EndpointSilenceVote(this);
  }

  late final EndpointButler butler;

  late final EndpointGreeting greeting;

  late final EndpointSilenceClip silenceClip;

  late final EndpointSilenceEntry silenceEntry;

  late final EndpointSilenceVote silenceVote;

  @override
  Map<String, _i1.EndpointRef> get endpointRefLookup => {
        'butler': butler,
        'greeting': greeting,
        'silenceClip': silenceClip,
        'silenceEntry': silenceEntry,
        'silenceVote': silenceVote,
      };

  @override
  Map<String, _i1.ModuleEndpointCaller> get moduleLookup => {};
}
