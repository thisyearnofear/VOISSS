import 'dart:io';
import 'dart:typed_data';

import 'package:voisss_butler_client/voisss_butler_client.dart';
import 'package:serverpod_client/serverpod_client.dart';

/// Seeds human-flagged takes + spread of votes so the contest reads alive.
/// Run: dart run tool/seed_takes.dart
Future<void> main(List<String> args) async {
  final client = Client('https://butler.voisss.famile.xyz/')
    ..connectivityMonitor = null;

  final clip = await client.silenceClip.getActive();
  if (clip == null) {
    print('No active clip.');
    client.close();
    exit(1);
  }
  print('Active clip: ${clip.id} ${clip.title}');

  final takes = <String, String>{
    '/tmp/voisss_takes/take_sandwich.mp3': 'Discount Chaplin',
    '/tmp/voisss_takes/take_recession.mp3': 'Loose Change Lou',
    '/tmp/voisss_takes/take_barker.mp3': 'Bond Barker Betty',
  };

  final ids = <int>[];
  for (final e in takes.entries) {
    final bytes = await File(e.key).readAsBytes();
    final entry = await client.silenceEntry.submit(
      clip.id!,
      e.value,
      ByteData.sublistView(Uint8List.fromList(bytes)),
      'mp3',
    );
    ids.add(entry.id!);
    print('Submitted id=${entry.id} "${entry.displayName}"');
  }

  client.close();
}
