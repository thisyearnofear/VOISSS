import 'dart:io';

import 'package:serverpod_client/serverpod_client.dart';
import 'package:voisss_butler_client/voisss_butler_client.dart';

/// Registers the Grove-hosted clip shelf: three public-domain shorts
/// (already uploaded to Grove/Lens storage) plus records the Bond clip's
/// Grove copy. Safe to re-run — skips clips whose title already exists.
///
///   dart tool/seed_clip_shelf.dart
Future<void> main() async {
  final client = Client('https://butler.voisss.famile.xyz/')
    ..connectivityMonitor = null;

  const shelf = [
    (
      title: 'The Immigrant — Chaplin (1917)',
      gateway:
          'https://api.grove.storage/28667cc45c75f09e9694a77f3589926f5f0b4e408de6efd221d9b8de5570a23e',
      uri: 'lens://28667cc45c75f09e9694a77f3589926f5f0b4e408de6efd221d9b8de5570a23e',
      rights:
          'Public domain (1917, Mutual Film via Wikimedia Commons)',
      weekStart: '2026-10-11',
    ),
    (
      title: 'A Trip to the Moon — Méliès (1902)',
      gateway:
          'https://api.grove.storage/e979aea508e93dba8e311289d1e40222b57cb47a7bbdca2b3bea298255b885aa',
      uri: 'lens://e979aea508e93dba8e311289d1e40222b57cb47a7bbdca2b3bea298255b885aa',
      rights: 'Public domain (1902, Star Film via Wikimedia Commons)',
      weekStart: '2026-10-10',
    ),
    (
      title: 'A Trip Down Market Street (1906)',
      gateway:
          'https://api.grove.storage/6ec2a3aa2f28f47553bfb6b7ed91695e7897bb1609d81b54fd3c98cecc1a3e6c',
      uri: 'lens://6ec2a3aa2f28f47553bfb6b7ed91695e7897bb1609d81b54fd3c98cecc1a3e6c',
      rights:
          'Public domain (1906, Miles Brothers via Library of Congress)',
      weekStart: '2026-10-09',
    ),
  ];

  try {
    final existing =
        (await client.silenceClip.listSelectable()).map((c) => c.title).toSet();

    for (final c in shelf) {
      if (existing.contains(c.title)) {
        stdout.writeln('skip (exists): ${c.title}');
        continue;
      }
      final clip = await client.silenceClip.createClip(
        c.title,
        c.gateway,
        60,
        c.rights,
        DateTime.parse(c.weekStart).toUtc(),
        activate: true,
      );
      await client.silenceClip.updateClipMedia(clip.id!, c.gateway, c.uri);
      stdout.writeln('created id=${clip.id}: ${c.title}');
    }

    // Bond stays featured (newest weekStart) — record its Grove copy.
    await client.silenceClip.updateClipMedia(
      1,
      'https://api.grove.storage/fc0df3bb5fd4fbb56590a026242275aead68fab25cabbe9cfd0b208cce15502f',
      'lens://fc0df3bb5fd4fbb56590a026242275aead68fab25cabbe9cfd0b208cce15502f',
    );
    stdout.writeln('bond -> grove uri set');
  } finally {
    client.close();
  }
}
