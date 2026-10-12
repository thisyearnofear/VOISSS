import 'dart:io';
import 'dart:typed_data';

import 'package:path_provider/path_provider.dart';

Future<String> recordingPath() async {
  final dir = await getTemporaryDirectory();
  return '${dir.path}/silence_entry.m4a';
}

Future<Uint8List> readRecordingBytes(String path) async {
  return File(path).readAsBytes();
}

String recordingFormat() => 'm4a';
