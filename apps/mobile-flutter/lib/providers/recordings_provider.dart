import 'package:flutter/foundation.dart';
import 'package:record/record.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import '../models/recording.dart';

class RecordingsProvider extends ChangeNotifier {
  final AudioRecorder _recorder = AudioRecorder();
  final AudioPlayer _player = AudioPlayer();
  
  List<Recording> _recordings = [];
  bool _isRecording = false;
  bool _isPlaying = false;
  String? _currentlyPlaying;
  Duration _recordingDuration = Duration.zero;
  
  // Getters
  List<Recording> get recordings => _recordings;
  bool get isRecording => _isRecording;
  bool get isPlaying => _isPlaying;
  String? get currentlyPlaying => _currentlyPlaying;
  Duration get recordingDuration => _recordingDuration;

  Future<bool> requestPermissions() async {
    final microphoneStatus = await Permission.microphone.request();
    final storageStatus = await Permission.storage.request();
    
    return microphoneStatus.isGranted && storageStatus.isGranted;
  }

  Future<void> startRecording() async {
    if (_isRecording) return;

    final hasPermission = await requestPermissions();
    if (!hasPermission) {
      throw Exception('Microphone permission denied');
    }

    try {
      final directory = await getApplicationDocumentsDirectory();
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final filePath = '${directory.path}/recording_$timestamp.m4a';

      await _recorder.start(
        const RecordConfig(
          encoder: AudioEncoder.aacLc,
          bitRate: 128000,
          sampleRate: 44100,
        ),
        path: filePath,
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
      
      if (path != null) {
        final file = File(path);
        final fileSize = await file.length();
        
        final recording = Recording(
          id: DateTime.now().millisecondsSinceEpoch.toString(),
          title: 'Recording ${_recordings.length + 1}',
          filePath: path,
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
    
    // Delete the file
    final file = File(recording.filePath);
    if (await file.exists()) {
      await file.delete();
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

  @override
  void dispose() {
    _recorder.dispose();
    _player.dispose();
    super.dispose();
  }
}
