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
import 'package:voisss_butler_client/src/protocol/butler_chat_response.dart'
    as _i3;
import 'package:voisss_butler_client/src/protocol/butler_stream_event.dart'
    as _i4;
import 'package:voisss_butler_client/src/protocol/butler_recording.dart' as _i5;
import 'package:voisss_butler_client/src/protocol/butler_insights.dart' as _i6;
import 'package:voisss_butler_client/src/protocol/greeting.dart' as _i7;
import 'package:voisss_butler_client/src/protocol/silence_clip.dart' as _i8;
import 'package:voisss_butler_client/src/protocol/co_writer_message.dart'
    as _i9;
import 'package:voisss_butler_client/src/protocol/silence_entry_view.dart'
    as _i10;
import 'dart:typed_data' as _i11;
import 'package:voisss_butler_client/src/protocol/silence_leaderboard_row.dart'
    as _i12;
import 'protocol.dart' as _i13;

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

  _i2.Future<_i3.ButlerChatResponse> chat({
    required String message,
    String? recordingId,
  }) =>
      caller.callServerEndpoint<_i3.ButlerChatResponse>(
        'butler',
        'chat',
        {
          'message': message,
          'recordingId': recordingId,
        },
      );

  /// Streaming chat — yields `delta` events as tokens land, then a final
  /// `done` event carrying the full [ButlerChatResponse]. Provider order is
  /// the same as [chat]: primary LLM → Venice → ACP (guarded). A provider
  /// is only skipped before it has emitted any deltas; a mid-stream failure
  /// surfaces an `error` event rather than silently restarting (which would
  /// emit a doubled answer).
  _i2.Stream<_i4.ButlerStreamEvent> chatStream({
    required String message,
    String? recordingId,
  }) =>
      caller.callStreamingServerEndpoint<_i2.Stream<_i4.ButlerStreamEvent>,
          _i4.ButlerStreamEvent>(
        'butler',
        'chatStream',
        {
          'message': message,
          'recordingId': recordingId,
        },
        {},
      );

  _i2.Future<_i3.ButlerChatResponse> analyzeAudio({
    required String recordingId,
    required String audioUrl,
    String? prompt,
  }) =>
      caller.callServerEndpoint<_i3.ButlerChatResponse>(
        'butler',
        'analyzeAudio',
        {
          'recordingId': recordingId,
          'audioUrl': audioUrl,
          'prompt': prompt,
        },
      );

  _i2.Future<List<_i5.ButlerRecording>> findRecordings(
          {required String query}) =>
      caller.callServerEndpoint<List<_i5.ButlerRecording>>(
        'butler',
        'findRecordings',
        {'query': query},
      );

  _i2.Future<_i6.ButlerInsights> getInsights() =>
      caller.callServerEndpoint<_i6.ButlerInsights>(
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
  _i2.Future<_i7.Greeting> hello(String name) =>
      caller.callServerEndpoint<_i7.Greeting>(
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

  /// The featured contest clip (newest active), or null if none is active.
  _i2.Future<_i8.SilenceClip?> getActive() =>
      caller.callServerEndpoint<_i8.SilenceClip?>(
        'silenceClip',
        'getActive',
        {},
      );

  /// Every selectable clip — the shelf users pick what to voice from.
  /// Featured first (newest weekStart), then the rest.
  _i2.Future<List<_i8.SilenceClip>> listSelectable() =>
      caller.callServerEndpoint<List<_i8.SilenceClip>>(
        'silenceClip',
        'listSelectable',
        {},
      );

  /// Points a clip's media at a new URL + records its Grove storage URI.
  /// Sprint admin path — same exposure caveat as [createClip].
  _i2.Future<_i8.SilenceClip> updateClipMedia(
    int clipId,
    String videoUrl,
    String storageUri,
  ) =>
      caller.callServerEndpoint<_i8.SilenceClip>(
        'silenceClip',
        'updateClipMedia',
        {
          'clipId': clipId,
          'videoUrl': videoUrl,
          'storageUri': storageUri,
        },
      );

  /// Past (inactive) clips, newest first.
  _i2.Future<List<_i8.SilenceClip>> listArchive() =>
      caller.callServerEndpoint<List<_i8.SilenceClip>>(
        'silenceClip',
        'listArchive',
        {},
      );

  /// Stores the vision-generated scene guide for a clip. Sprint admin
  /// path — same exposure caveat as [createClip].
  _i2.Future<_i8.SilenceClip> updateSceneGuide(
    int clipId,
    String sceneGuide,
  ) =>
      caller.callServerEndpoint<_i8.SilenceClip>(
        'silenceClip',
        'updateSceneGuide',
        {
          'clipId': clipId,
          'sceneGuide': sceneGuide,
        },
      );

  /// Creates a clip. Sprint admin path — no auth for now; do not expose
  /// publicly without adding an admin check.
  _i2.Future<_i8.SilenceClip> createClip(
    String title,
    String videoUrl,
    int durationSec,
    String rightsNote,
    DateTime weekStart, {
    required bool activate,
  }) =>
      caller.callServerEndpoint<_i8.SilenceClip>(
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

/// AI writing partner for "Voice the Silence" — riffs on voiceover ideas
/// with on-screen context from the clip's vision-distilled scene guide.
/// Accessed as `client.silenceCoWriter`.
/// {@category Endpoint}
class EndpointSilenceCoWriter extends _i1.EndpointRef {
  EndpointSilenceCoWriter(_i1.EndpointCaller caller) : super(caller);

  @override
  String get name => 'silenceCoWriter';

  /// Three cold-start directions a user could take the voiceover.
  _i2.Future<List<String>> openers(int clipId) =>
      caller.callServerEndpoint<List<String>>(
        'silenceCoWriter',
        'openers',
        {'clipId': clipId},
      );

  /// One riff turn. [history] is prior turns; [draft] is the user's current
  /// script so the model iterates on it rather than starting over.
  _i2.Future<_i9.CoWriterMessage> chat(
    int clipId,
    List<_i9.CoWriterMessage> history,
    String draft,
  ) =>
      caller.callServerEndpoint<_i9.CoWriterMessage>(
        'silenceCoWriter',
        'chat',
        {
          'clipId': clipId,
          'history': history,
          'draft': draft,
        },
      );

  /// Streaming riff — same prompt as [chat] but yields reply deltas so
  /// the client can render the answer as it lands instead of staring at
  /// a spinner for ~15s. Client calls `client.silenceCoWriter.riff(...)`.
  _i2.Stream<String> riff(
    int clipId,
    List<_i9.CoWriterMessage> history,
    String draft,
  ) =>
      caller.callStreamingServerEndpoint<_i2.Stream<String>, String>(
        'silenceCoWriter',
        'riff',
        {
          'clipId': clipId,
          'history': history,
          'draft': draft,
        },
        {},
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
  _i2.Future<_i10.SilenceEntryView> generate(
    int clipId,
    String displayName,
    String script,
    String voice,
  ) =>
      caller.callServerEndpoint<_i10.SilenceEntryView>(
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
  _i2.Future<_i10.SilenceEntryView> submit(
    int clipId,
    String displayName,
    _i11.ByteData audio,
    String audioFormat,
  ) =>
      caller.callServerEndpoint<_i10.SilenceEntryView>(
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
  _i2.Future<List<_i10.SilenceEntryView>> list(int clipId) =>
      caller.callServerEndpoint<List<_i10.SilenceEntryView>>(
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
  _i2.Future<List<_i12.SilenceLeaderboardRow>> cast(
    int entryId,
    String voterToken,
    int score,
  ) =>
      caller.callServerEndpoint<List<_i12.SilenceLeaderboardRow>>(
        'silenceVote',
        'cast',
        {
          'entryId': entryId,
          'voterToken': voterToken,
          'score': score,
        },
      );

  /// Current leaderboard for a clip, ordered by average score.
  _i2.Future<List<_i12.SilenceLeaderboardRow>> leaderboard(int clipId) =>
      caller.callServerEndpoint<List<_i12.SilenceLeaderboardRow>>(
        'silenceVote',
        'leaderboard',
        {'clipId': clipId},
      );

  /// Streams leaderboard updates for a clip. The client calls
  /// `client.silenceVote.watchLeaderboard(clipId)` and listens.
  _i2.Stream<List<_i12.SilenceLeaderboardRow>> watchLeaderboard(int clipId) =>
      caller.callStreamingServerEndpoint<
          _i2.Stream<List<_i12.SilenceLeaderboardRow>>,
          List<_i12.SilenceLeaderboardRow>>(
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
          _i13.Protocol(),
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
    silenceCoWriter = EndpointSilenceCoWriter(this);
    silenceEntry = EndpointSilenceEntry(this);
    silenceVote = EndpointSilenceVote(this);
  }

  late final EndpointButler butler;

  late final EndpointGreeting greeting;

  late final EndpointSilenceClip silenceClip;

  late final EndpointSilenceCoWriter silenceCoWriter;

  late final EndpointSilenceEntry silenceEntry;

  late final EndpointSilenceVote silenceVote;

  @override
  Map<String, _i1.EndpointRef> get endpointRefLookup => {
        'butler': butler,
        'greeting': greeting,
        'silenceClip': silenceClip,
        'silenceCoWriter': silenceCoWriter,
        'silenceEntry': silenceEntry,
        'silenceVote': silenceVote,
      };

  @override
  Map<String, _i1.ModuleEndpointCaller> get moduleLookup => {};
}
