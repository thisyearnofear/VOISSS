import 'dart:typed_data';

import 'package:http/http.dart' as http;

/// On web, `record` ignores the path and returns a blob URL on stop().
Future<String> recordingPath() async => 'silence_entry';

Future<Uint8List> readRecordingBytes(String path) async {
  final res = await http.get(Uri.parse(path));
  return res.bodyBytes;
}

/// `record` on web captures opus in a webm container.
String recordingFormat() => 'webm';
