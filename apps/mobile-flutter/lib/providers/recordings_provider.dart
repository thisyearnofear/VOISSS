import 'package:flutter/foundation.dart';
import 'package:record/record.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';

import 'dart:async';
import '../models/recording.dart';
import '../services/starknet_recording_service.dart' as starknet_service;
import '../services/ipfs_service.dart';
import '../services/sync_service.dart';

class RecordingsProvider extends ChangeNotifier {
  final AudioRecorder _recorder = AudioRecorder();
  final AudioPlayer _player = AudioPlayer();
  final starknet_service.StarknetRecordingService _starknetService = starknet_service.StarknetRecordingService();

  List<Recording> _recordings = [];
  bool _isRecording = false;
  bool _isPlaying = false;
  String? _currentlyPlaying;
  Duration _recordingDuration = Duration.zero;

  // IPFS and sync services
  IPFSService? _ipfsService;
  SyncService? _syncService;

  // Upload progress tracking
  bool _isUploading = false;
  double _uploadProgress = 0.0;

  // Getters
  List<Recording> get recordings => _recordings;
  bool get isRecording => _isRecording;
  bool get isPlaying => _isPlaying;
  String? get currentlyPlaying => _currentlyPlaying;
  Duration get recordingDuration => _recordingDuration;
  bool get isUploading => _isUploading;
  double get uploadProgress => _uploadProgress;

  // Initialize IPFS service
  void initializeIPFS(IPFSConfig config) {
    _ipfsService = IPFSService(config);
  }

  // Initialize sync service
  void initializeSync(starknetProvider) {
    if (_ipfsService != null) {
      _syncService = SyncService(
        starknetProvider: starknetProvider,
        ipfsService: _ipfsService!,
      );
    }
  }

  Future<bool> requestPermissions() async {
    try {
      final microphoneStatus = await Permission.microphone.request();

      // Storage permission is not needed on macOS/desktop platforms
      // and causes issues on web, so we'll only check microphone
      if (kIsWeb) {
        // On web, we only need microphone permission
        print('Web platform: Microphone permission ${microphoneStatus.isGranted ? 'granted' : 'denied'}');
        return microphoneStatus.isGranted;
      } else {
        // On mobile platforms, we might need storage permission
        try {
          final storageStatus = await Permission.storage.request();
          return microphoneStatus.isGranted && storageStatus.isGranted;
        } catch (e) {
          // If storage permission fails (like on macOS), just check microphone
          print('Storage permission not available on this platform: $e');
          return microphoneStatus.isGranted;
        }
      }
    } catch (e) {
      print('Permission request failed: $e');
      // On web, permissions might work differently, so we'll try to proceed
      if (kIsWeb) {
        print('Web platform: Attempting to proceed without explicit permission check');
        return true; // Let the recording attempt handle permission
      }
      return false;
    }
  }

  Future<void> startRecording() async {
    if (_isRecording) return;

    final hasPermission = await requestPermissions();
    if (!hasPermission) {
      throw Exception('Microphone permission denied');
    }

    try {
      String? filePath;

      if (kIsWeb) {
        // On web, we don't need a file path - the recording will be handled in memory
        filePath = null;
      } else {
        // On mobile/desktop, use the documents directory
        final directory = await getApplicationDocumentsDirectory();
        final timestamp = DateTime.now().millisecondsSinceEpoch;
        filePath = '${directory.path}/recording_$timestamp.m4a';
      }

      await _recorder.start(
        const RecordConfig(
          encoder: AudioEncoder.aacLc,
          bitRate: 128000,
          sampleRate: 44100,
        ),
        path: filePath ?? '',
      );

      _isRecording = true;
      _recordingDuration = Duration.zero;
      notifyListeners();

      // Start duration timer
      _startDurationTimer();
    } catch (e) {
      throw Exception('Failed to start recording: ${e.toString()}');
    }
  }

  Future<void> stopRecording() async {
    if (!_isRecording) return;

    try {
      final path = await _recorder.stop();
      _isRecording = false;

      if (path != null || kIsWeb) {
        int fileSize = 0;
        String filePath = '';

        if (kIsWeb) {
          // On web, we'll use a temporary path and estimate file size
          filePath = 'web_recording_${DateTime.now().millisecondsSinceEpoch}.m4a';
          fileSize = _recordingDuration.inSeconds * 16000; // Rough estimate
        } else {
          // On mobile/desktop, use actual file
          filePath = path!;
          final file = File(path);
          fileSize = await file.length();
        }

        final recording = Recording(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          title: 'Recording ${_recordings.length + 1}',
          filePath: filePath,
          duration: _recordingDuration,
          createdAt: DateTime.now(),
          fileSize: fileSize,
          tags: [],
        );

        _recordings.insert(0, recording);
      }

      _recordingDuration = Duration.zero;
      notifyListeners();
    } catch (e) {
      _isRecording = false;
      notifyListeners();
      throw Exception('Failed to stop recording: ${e.toString()}');
    }
  }

  Future<void> playRecording(String recordingId) async {
    final recording = _recordings.firstWhere((r) => r.id == recordingId);

    if (_isPlaying && _currentlyPlaying == recordingId) {
      await _player.pause();
      _isPlaying = false;
      _currentlyPlaying = null;
    } else {
      if (_isPlaying) {
        await _player.stop();
      }

      try {
        if (kIsWeb) {
          // On web, we can't play local files the same way
          // For now, we'll just simulate playback
          print('Web playback simulation for: ${recording.title}');
          _isPlaying = true;
          _currentlyPlaying = recordingId;

          // Simulate playback duration
          Future.delayed(recording.duration, () {
            _isPlaying = false;
            _currentlyPlaying = null;
            notifyListeners();
          });
        } else {
          // On mobile/desktop, play the actual file
          await _player.play(DeviceFileSource(recording.filePath));
          _isPlaying = true;
          _currentlyPlaying = recordingId;

          // Listen for completion
          _player.onPlayerComplete.listen((_) {
            _isPlaying = false;
            _currentlyPlaying = null;
            notifyListeners();
          });
        }
      } catch (e) {
        print('Playback error: $e');
        _isPlaying = false;
        _currentlyPlaying = null;
      }
    }

    notifyListeners();
  }

  Future<void> deleteRecording(String recordingId) async {
    final recording = _recordings.firstWhere((r) => r.id == recordingId);

    // Stop playing if this recording is currently playing
    if (_currentlyPlaying == recordingId) {
      await _player.stop();
      _isPlaying = false;
      _currentlyPlaying = null;
    }

    // Delete the file (only on non-web platforms)
    if (!kIsWeb) {
      final file = File(recording.filePath);
      if (await file.exists()) {
        await file.delete();
      }
    }

    // Remove from list
    _recordings.removeWhere((r) => r.id == recordingId);
    notifyListeners();
  }

  void updateRecordingTitle(String recordingId, String newTitle) {
    final index = _recordings.indexWhere((r) => r.id == recordingId);
    if (index != -1) {
      _recordings[index] = _recordings[index].copyWith(title: newTitle);
      notifyListeners();
    }
  }

  void addTagToRecording(String recordingId, String tag) {
    final index = _recordings.indexWhere((r) => r.id == recordingId);
    if (index != -1) {
      final currentTags = List<String>.from(_recordings[index].tags);
      if (!currentTags.contains(tag)) {
        currentTags.add(tag);
        _recordings[index] = _recordings[index].copyWith(tags: currentTags);
        notifyListeners();
      }
    }
  }

  void removeTagFromRecording(String recordingId, String tag) {
    final index = _recordings.indexWhere((r) => r.id == recordingId);
    if (index != -1) {
      final currentTags = List<String>.from(_recordings[index].tags);
      currentTags.remove(tag);
      _recordings[index] = _recordings[index].copyWith(tags: currentTags);
      notifyListeners();
    }
  }

  void _startDurationTimer() {
    Future.doWhile(() async {
      if (!_isRecording) return false;

      await Future.delayed(const Duration(seconds: 1));
      _recordingDuration = Duration(seconds: _recordingDuration.inSeconds + 1);
      notifyListeners();

      return _isRecording;
    });
  }

  // Upload recording to IPFS
  Future<IPFSUploadResult?> uploadRecordingToIPFS(String recordingId) async {
    if (_ipfsService == null) {
      throw Exception('IPFS service not initialized');
    }

    final recording = _recordings.firstWhere((r) => r.id == recordingId);

    try {
      _isUploading = true;
      _uploadProgress = 0.0;
      notifyListeners();

      Uint8List audioData;

      if (kIsWeb) {
        // On web, we'll create mock audio data for testing
        // In a real implementation, you'd get the actual recorded audio blob
        audioData = Uint8List.fromList(List.generate(
          recording.duration.inSeconds * 16000, // Simulate audio data
          (index) => (index % 256),
        ));
        print('Web: Using simulated audio data for IPFS upload');
      } else {
        // On mobile/desktop, read the actual file
        final file = File(recording.filePath);
        audioData = await file.readAsBytes();
      }

      _uploadProgress = 0.3;
      notifyListeners();

      // Prepare metadata
      final metadata = AudioMetadata(
        filename: '${recording.title.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '_')}.m4a',
        mimeType: 'audio/mp4',
        duration: recording.duration.inSeconds,
        sampleRate: 44100,
        bitRate: 128000,
      );

      _uploadProgress = 0.5;
      notifyListeners();

      // Upload to IPFS
      final result = await _ipfsService!.uploadAudio(audioData, metadata);

      _uploadProgress = 1.0;
      notifyListeners();

      return result;

    } catch (e) {
      print('Failed to upload to IPFS: $e');
      rethrow;
    } finally {
      _isUploading = false;
      _uploadProgress = 0.0;
      notifyListeners();
    }
  }

  // Perform sync with blockchain and IPFS
  Future<SyncResult?> performSync() async {
    if (_syncService == null) {
      throw Exception('Sync service not initialized');
    }

    return await _syncService!.performSync(_recordings);
  }

  // Get sync statistics
  Future<Map<String, dynamic>?> getSyncStats() async {
    if (_syncService == null) return null;
    return await _syncService!.getSyncStats();
  }

  @override
  void dispose() {
    _recorder.dispose();
    _player.dispose();
    super.dispose();
  }
}
