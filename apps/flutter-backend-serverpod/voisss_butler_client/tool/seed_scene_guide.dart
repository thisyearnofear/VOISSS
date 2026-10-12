import 'dart:convert';
import 'dart:io';

import 'package:serverpod_client/serverpod_client.dart';
import 'package:voisss_butler_client/voisss_butler_client.dart';

/// Builds the clip's `sceneGuide` by sampling frames and asking a vision
/// model to describe them, then stores it on the clip row. Run once per
/// new clip:
///
///   FEATHERLESS_API_KEY=... dart tool/seed_scene_guide.dart [clipId]
///
/// Requires ffmpeg on PATH.
Future<void> main(List<String> args) async {
  final apiKey = Platform.environment['FEATHERLESS_API_KEY'] ?? '';
  if (apiKey.isEmpty) {
    stderr.writeln('Set FEATHERLESS_API_KEY');
    exit(1);
  }

  final client = Client('https://butler.voisss.famile.xyz/')
    ..connectivityMonitor = null;

  try {
    SilenceClip? clip;
    if (args.isNotEmpty) {
      clip = await client.silenceClip.listArchive().then(
            (all) => all.where((c) => c.id == int.parse(args[0])).firstOrNull,
          );
      clip ??= await client.silenceClip.getActive();
    } else {
      clip = await client.silenceClip.getActive();
    }
    if (clip == null) {
      stderr.writeln('Clip not found');
      exit(1);
    }
    stdout.writeln('Building scene guide for ${clip.title} (id=${clip.id})');

    // ── Download + sample frames ──
    final workDir = await Directory.systemTemp.createTemp('scene_guide');
    final videoPath = '${workDir.path}/clip.${_ext(clip.videoUrl)}';
    final dl = await Process.run('curl', ['-sL', clip.videoUrl, '-o', videoPath]);
    if (dl.exitCode != 0) {
      stderr.writeln('download failed: ${dl.stderr}');
      exit(1);
    }

    const frameCount = 8;
    final everySec = clip.durationSec / frameCount;
    final frames = <({double t, String path})>[];
    for (var i = 0; i < frameCount; i++) {
      final t = (i + 0.5) * everySec;
      final path = '${workDir.path}/f$i.jpg';
      final r = await Process.run('ffmpeg', [
        '-y', '-loglevel', 'error',
        '-ss', t.toStringAsFixed(1),
        '-i', videoPath,
        '-frames:v', '1',
        '-vf', 'scale=640:-1',
        path,
      ]);
      if (r.exitCode == 0 && await File(path).length() > 0) {
        frames.add((t: t, path: path));
      }
    }
    stdout.writeln('extracted ${frames.length} frames');

    // ── Vision pass ──
    final tsList =
        frames.map((f) => _ts(f.t)).join(', ');
    final content = <Map<String, dynamic>>[
      {
        'type': 'text',
        'text': 'These ${frames.length} frames come from a silent film at '
            'timestamps $tsList (in order shown). For EACH frame, write one '
            'line: `M:SS — what is happening, who is on screen, mood, and '
            'any readable intertitle text.` Then add a final line '
            '`ARC — one sentence summarising the clip\'s story.`',
      },
      for (final f in frames)
        {
          'type': 'image_url',
          'image_url': {
            'url': 'data:image/jpeg;base64,'
                '${base64Encode(await File(f.path).readAsBytes())}',
          },
        },
    ];
    final guide = await _chat(apiKey, [
      {
        'role': 'user',
        'content': content,
      },
    ], model: 'Qwen/Qwen3-VL-32B-Instruct', maxTokens: 900);

    stdout.writeln('--- scene guide ---\n$guide\n-------------------');
    await client.silenceClip.updateSceneGuide(clip.id!, guide);
    stdout.writeln('Stored on clip ${clip.id}.');
  } finally {
    client.close();
  }
}

String _ext(String url) =>
    url.contains('.webm') ? 'webm' : (url.contains('.mp4') ? 'mp4' : 'ogv');

String _ts(double seconds) {
  final m = seconds.floor() ~/ 60;
  final s = (seconds % 60).floor();
  return '$m:${s.toString().padLeft(2, '0')}';
}

Future<String> _chat(
  String apiKey,
  List<Map<String, dynamic>> messages, {
  required String model,
  required int maxTokens,
}) async {
  final http = HttpClient();
  try {
    final req = await http.postUrl(
      Uri.parse('https://api.featherless.ai/v1/chat/completions'),
    );
    req.headers
      ..set('Authorization', 'Bearer $apiKey')
      ..set('Content-Type', 'application/json');
    req.add(utf8.encode(jsonEncode({
      'model': model,
      'messages': messages,
      'max_tokens': maxTokens,
    })));
    final res = await req.close().timeout(const Duration(seconds: 120));
    final body = await res.transform(utf8.decoder).join();
    if (res.statusCode != 200) {
      throw StateError('vision call failed ${res.statusCode}: $body');
    }
    final decoded = jsonDecode(body) as Map<String, dynamic>;
    return (decoded['choices'] as List).first['message']['content'] as String;
  } finally {
    http.close();
  }
}
