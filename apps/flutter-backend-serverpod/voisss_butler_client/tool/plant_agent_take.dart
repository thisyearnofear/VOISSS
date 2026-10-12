import 'dart:io';
import 'dart:typed_data';

import 'package:voisss_butler_client/voisss_butler_client.dart';
import 'package:serverpod_client/serverpod_client.dart';

/// Plants one machine-generated take in the contest gallery.
/// Run: dart run tool/plant_agent_take.dart /path/to/take.m4a
/// The returned entry id goes into `kAgentEntryIds` in the mobile client —
/// used for the "one of these voices is a machine" reveal.
Future<void> main(List<String> args) async {
  if (args.isEmpty) {
    print('Usage: plant_agent_take.dart <audio-file>');
    exit(1);
  }
  final bytes = await File(args[0]).readAsBytes();

  final client = Client('https://butler.voisss.famile.xyz/')
    ..connectivityMonitor = null;

  final clip = await client.silenceClip.getActive();
  if (clip == null) {
    print('No active clip.');
    client.close();
    exit(1);
  }

  // A plausible stage name — the game is that judges don't know it's a machine.
  final entry = await client.silenceEntry.submit(
    clip.id!,
    'The Projectionist\'s Apprentice',
    ByteData.sublistView(Uint8List.fromList(bytes)),
    'm4a',
  );
  print('Planted agent take: id=${entry.id} name=${entry.displayName}');
  print('Add ${entry.id} to kAgentEntryIds in the mobile client.');
  client.close();
}
