import 'dart:typed_data';

/// Fallback — replaced by the IO or web implementation via conditional import.
Future<String> recordingPath() => throw UnsupportedError('Unsupported platform');

Future<Uint8List> readRecordingBytes(String path) =>
    throw UnsupportedError('Unsupported platform');

String recordingFormat() => 'm4a';
