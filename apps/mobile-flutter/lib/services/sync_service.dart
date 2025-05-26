import 'dart:convert';
import 'dart:typed_data';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/recording.dart';
import '../providers/starknet_provider.dart';
import 'ipfs_service.dart';

/// Sync status for cross-platform synchronization
enum SyncStatus {
  idle,
  syncing,
  success,
  error,
}

/// Sync result containing status and details
class SyncResult {
  final SyncStatus status;
  final String? message;
  final int? recordingsDownloaded;
  final int? recordingsUploaded;
  final DateTime? lastSync;

  SyncResult({
    required this.status,
    this.message,
    this.recordingsDownloaded,
    this.recordingsUploaded,
    this.lastSync,
  });
}

/// Service for synchronizing recordings between web and mobile apps
/// via Starknet blockchain and IPFS storage
class SyncService {
  final StarknetProvider starknetProvider;
  final IPFSService ipfsService;
  
  static const String _lastSyncKey = 'last_sync_timestamp';
  static const String _syncedRecordingsKey = 'synced_recordings';

  SyncService({
    required this.starknetProvider,
    required this.ipfsService,
  });

  /// Perform full synchronization with blockchain and IPFS
  Future<SyncResult> performSync(List<Recording> localRecordings) async {
    if (!starknetProvider.isConnected) {
      return SyncResult(
        status: SyncStatus.error,
        message: 'Wallet not connected',
      );
    }

    try {
      // Step 1: Get recordings from blockchain
      final chainRecordings = await starknetProvider.getUserRecordingsFromChain();
      
      // Step 2: Compare with local recordings
      final syncAnalysis = await _analyzeSyncNeeds(localRecordings, chainRecordings);
      
      // Step 3: Download missing recordings from IPFS
      int downloadedCount = 0;
      for (final chainRecording in syncAnalysis.toDownload) {
        try {
          await _downloadRecordingFromIPFS(chainRecording);
          downloadedCount++;
        } catch (e) {
          print('Failed to download recording ${chainRecording['id']}: $e');
        }
      }

      // Step 4: Upload pending local recordings
      int uploadedCount = 0;
      for (final localRecording in syncAnalysis.toUpload) {
        try {
          await _uploadRecordingToIPFS(localRecording);
          uploadedCount++;
        } catch (e) {
          print('Failed to upload recording ${localRecording.id}: $e');
        }
      }

      // Step 5: Update sync timestamp
      await _updateLastSyncTimestamp();

      return SyncResult(
        status: SyncStatus.success,
        message: 'Sync completed successfully',
        recordingsDownloaded: downloadedCount,
        recordingsUploaded: uploadedCount,
        lastSync: DateTime.now(),
      );

    } catch (e) {
      return SyncResult(
        status: SyncStatus.error,
        message: 'Sync failed: ${e.toString()}',
      );
    }
  }

  /// Analyze what needs to be synced
  Future<_SyncAnalysis> _analyzeSyncNeeds(
    List<Recording> localRecordings,
    List<Map<String, dynamic>> chainRecordings,
  ) async {
    final prefs = await SharedPreferences.getInstance();
    final syncedRecordingsJson = prefs.getString(_syncedRecordingsKey) ?? '[]';
    final syncedRecordings = List<String>.from(jsonDecode(syncedRecordingsJson));

    final toDownload = <Map<String, dynamic>>[];
    final toUpload = <Recording>[];

    // Find chain recordings not in local storage
    for (final chainRecording in chainRecordings) {
      final recordingId = chainRecording['id'].toString();
      final isLocallyAvailable = localRecordings.any((r) => r.id == recordingId);
      
      if (!isLocallyAvailable) {
        toDownload.add(chainRecording);
      }
    }

    // Find local recordings not on chain
    for (final localRecording in localRecordings) {
      final isOnChain = chainRecordings.any((r) => r['id'].toString() == localRecording.id);
      final isSynced = syncedRecordings.contains(localRecording.id);
      
      if (!isOnChain && !isSynced) {
        toUpload.add(localRecording);
      }
    }

    return _SyncAnalysis(
      toDownload: toDownload,
      toUpload: toUpload,
    );
  }

  /// Download a recording from IPFS and save locally
  Future<void> _downloadRecordingFromIPFS(Map<String, dynamic> chainRecording) async {
    final ipfsHash = chainRecording['ipfs_hash'];
    if (ipfsHash == null || ipfsHash.isEmpty) {
      throw Exception('No IPFS hash available for recording');
    }

    // Download audio data from IPFS
    final audioData = await ipfsService.retrieveAudio(ipfsHash);
    
    // Save to local storage
    // This would integrate with your local file storage system
    // For now, we'll just mark it as downloaded
    
    await _markRecordingAsSynced(chainRecording['id'].toString());
  }

  /// Upload a recording to IPFS and store metadata on Starknet
  Future<void> _uploadRecordingToIPFS(Recording recording) async {
    // Read audio file
    final audioData = await _readRecordingFile(recording.filePath);
    
    // Prepare metadata
    final metadata = AudioMetadata(
      filename: '${recording.title.replaceAll(RegExp(r'[^a-zA-Z0-9]'), '_')}.m4a',
      mimeType: 'audio/mp4',
      duration: recording.duration.inSeconds,
      sampleRate: 44100,
      bitRate: 128000,
    );

    // Upload to IPFS
    final ipfsResult = await ipfsService.uploadAudio(audioData, metadata);

    // Store metadata on Starknet
    await starknetProvider.storeRecordingMetadata(
      title: recording.title,
      description: 'Voice recording created on ${recording.formattedDate}',
      duration: recording.duration.inSeconds,
      fileSize: recording.fileSize,
      tags: recording.tags,
      ipfsHash: ipfsResult.hash,
      isPublic: true,
    );

    // Mark as synced
    await _markRecordingAsSynced(recording.id);
  }

  /// Read recording file as bytes
  Future<Uint8List> _readRecordingFile(String filePath) async {
    // This would read the actual file from the device
    // For demo purposes, we'll return empty data
    // In real implementation: return File(filePath).readAsBytes();
    return Uint8List(0);
  }

  /// Mark a recording as synced
  Future<void> _markRecordingAsSynced(String recordingId) async {
    final prefs = await SharedPreferences.getInstance();
    final syncedRecordingsJson = prefs.getString(_syncedRecordingsKey) ?? '[]';
    final syncedRecordings = List<String>.from(jsonDecode(syncedRecordingsJson));
    
    if (!syncedRecordings.contains(recordingId)) {
      syncedRecordings.add(recordingId);
      await prefs.setString(_syncedRecordingsKey, jsonEncode(syncedRecordings));
    }
  }

  /// Update last sync timestamp
  Future<void> _updateLastSyncTimestamp() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_lastSyncKey, DateTime.now().millisecondsSinceEpoch);
  }

  /// Get last sync timestamp
  Future<DateTime?> getLastSyncTimestamp() async {
    final prefs = await SharedPreferences.getInstance();
    final timestamp = prefs.getInt(_lastSyncKey);
    return timestamp != null ? DateTime.fromMillisecondsSinceEpoch(timestamp) : null;
  }

  /// Check if sync is needed based on time elapsed
  Future<bool> isSyncNeeded() async {
    final lastSync = await getLastSyncTimestamp();
    if (lastSync == null) return true;
    
    final timeSinceLastSync = DateTime.now().difference(lastSync);
    return timeSinceLastSync.inMinutes > 30; // Sync every 30 minutes
  }

  /// Get sync statistics
  Future<Map<String, dynamic>> getSyncStats() async {
    final lastSync = await getLastSyncTimestamp();
    final prefs = await SharedPreferences.getInstance();
    final syncedRecordingsJson = prefs.getString(_syncedRecordingsKey) ?? '[]';
    final syncedRecordings = List<String>.from(jsonDecode(syncedRecordingsJson));

    return {
      'lastSync': lastSync?.toIso8601String(),
      'syncedRecordingsCount': syncedRecordings.length,
      'isSyncNeeded': await isSyncNeeded(),
    };
  }
}

/// Internal class for sync analysis results
class _SyncAnalysis {
  final List<Map<String, dynamic>> toDownload;
  final List<Recording> toUpload;

  _SyncAnalysis({
    required this.toDownload,
    required this.toUpload,
  });
}
