import 'package:voisss_butler_client/voisss_butler_client.dart';
import 'package:serverpod_client/serverpod_client.dart';

Future<void> main() async {
  final client = Client('https://butler.voisss.famile.xyz/')
    ..connectivityMonitor = null;

  final existing = await client.silenceClip.getActive();
  if (existing != null) {
    print('Active clip already exists: ${existing.title} (id=${existing.id})');
    client.close();
    return;
  }

  final clip = await client.silenceClip.createClip(
    'The Bond — Chaplin (1918)',
    'https://commons.wikimedia.org/wiki/Special:FilePath/Charlie_Chaplin%2C_The_Bond%2C_1918.ogv',
    60,
    'Public domain (1918, US National Archives via Wikimedia Commons)',
    DateTime.utc(2026, 10, 12),
    activate: true,
  );
  print('Seeded clip id=${clip.id}: ${clip.title}');
  client.close();
}
