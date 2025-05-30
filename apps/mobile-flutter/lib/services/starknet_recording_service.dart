import 'dart:typed_data';
import 'package:starknet/starknet.dart';
import 'package:starknet_provider/starknet_provider.dart';

class RecordingMetadata {
  final String title;
  final String description;
  final String ipfsHash;
  final int duration;
  final int fileSize;
  final bool isPublic;
  final List<String> tags;

  RecordingMetadata({
    required this.title,
    required this.description,
    required this.ipfsHash,
    required this.duration,
    required this.fileSize,
    required this.isPublic,
    required this.tags,
  });

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'description': description,
      'ipfs_hash': ipfsHash,
      'duration': duration,
      'file_size': fileSize,
      'is_public': isPublic,
      'tags': tags,
    };
  }
}

class Recording {
  final String id;
  final String owner;
  final String title;
  final String description;
  final String ipfsHash;
  final int duration;
  final int fileSize;
  final DateTime createdAt;
  final bool isPublic;
  final List<String> tags;
  final int playCount;

  Recording({
    required this.id,
    required this.owner,
    required this.title,
    required this.description,
    required this.ipfsHash,
    required this.duration,
    required this.fileSize,
    required this.createdAt,
    required this.isPublic,
    required this.tags,
    required this.playCount,
  });

  factory Recording.fromJson(Map<String, dynamic> json) {
    return Recording(
      id: json['id'].toString(),
      owner: json['owner'],
      title: json['title'],
      description: json['description'],
      ipfsHash: json['ipfs_hash'],
      duration: json['duration'],
      fileSize: json['file_size'],
      createdAt: DateTime.fromMillisecondsSinceEpoch(json['created_at'] * 1000),
      isPublic: json['is_public'],
      tags: List<String>.from(json['tags'] ?? []),
      playCount: json['play_count'],
    );
  }
}

class StarknetRecordingService {
  static const String _testnetRpcUrl = 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7';
  static const String _chainId = '0x534e5f5345504f4c4941'; // SN_SEPOLIA

  // Contract addresses (will be populated after deployment)
  static const String _voiceStorageAddress = '';
  static const String _userRegistryAddress = '';
  static const String _accessControlAddress = '';

  late final JsonRpcProvider _provider;

  StarknetRecordingService() {
    _provider = JsonRpcProvider(nodeUri: Uri.parse(_testnetRpcUrl));
  }

  Future<String> storeRecording({
    required Account account,
    required RecordingMetadata metadata,
  }) async {
    if (_voiceStorageAddress.isEmpty) {
      throw Exception('Voice storage contract address not set');
    }

    try {
      // Prepare call data
      final calldata = [
        Felt.fromString(metadata.title),
        Felt.fromString(metadata.description),
        Felt.fromString(metadata.ipfsHash),
        Felt.fromInt(metadata.duration),
        Felt.fromInt(metadata.fileSize),
        Felt.fromInt(metadata.isPublic ? 1 : 0),
        Felt.fromInt(metadata.tags.length),
        ...metadata.tags.map((tag) => Felt.fromString(tag)),
      ];

      // Execute the transaction using Account.execute
      final result = await account.execute(
        functionCalls: [
          FunctionCall(
            contractAddress: Felt.fromHexString(_voiceStorageAddress),
            entryPointSelector: getSelectorByName('store_recording'),
            calldata: calldata,
          ),
        ],
      );

      final txHash = result.when(
        result: (result) => result.transaction_hash,
        error: (error) => throw Exception('Transaction failed: ${error.message}'),
      );

      return txHash;
    } catch (error) {
      throw Exception('Failed to store recording on Starknet: $error');
    }
  }

  Future<Recording?> getRecording(String recordingId) async {
    if (_voiceStorageAddress.isEmpty) {
      throw Exception('Voice storage contract address not set');
    }

    try {
      final callResult = await _provider.call(
        request: FunctionCall(
          contractAddress: Felt.fromHexString(_voiceStorageAddress),
          entryPointSelector: getSelectorByName('get_recording'),
          calldata: [Felt.fromString(recordingId)],
        ),
        blockId: BlockId.latest,
      );

      final result = callResult.when(
        result: (result) => result,
        error: (error) => throw Exception('Call failed: ${error.message}'),
      );

      if (result.isNotEmpty) {
        return Recording.fromJson(_parseRecordingResult(result));
      }
      return null;
    } catch (error) {
      print('Failed to get recording: $error');
      return null;
    }
  }

  Future<List<Recording>> getUserRecordings(String userAddress) async {
    if (_voiceStorageAddress.isEmpty) {
      throw Exception('Voice storage contract address not set');
    }

    try {
      final callResult = await _provider.call(
        request: FunctionCall(
          contractAddress: Felt.fromHexString(_voiceStorageAddress),
          entryPointSelector: getSelectorByName('get_user_recordings'),
          calldata: [Felt.fromHexString(userAddress)],
        ),
        blockId: BlockId.latest,
      );

      final result = callResult.when(
        result: (result) => result,
        error: (error) => throw Exception('Call failed: ${error.message}'),
      );

      final recordings = <Recording>[];
      for (final recordingId in result) {
        final recording = await getRecording(recordingId.toString());
        if (recording != null) {
          recordings.add(recording);
        }
      }

      return recordings;
    } catch (error) {
      print('Failed to get user recordings: $error');
      return [];
    }
  }

  Future<List<Recording>> getPublicRecordings({
    int offset = 0,
    int limit = 20,
  }) async {
    if (_voiceStorageAddress.isEmpty) {
      throw Exception('Voice storage contract address not set');
    }

    try {
      final callResult = await _provider.call(
        request: FunctionCall(
          contractAddress: Felt.fromHexString(_voiceStorageAddress),
          entryPointSelector: getSelectorByName('get_public_recordings'),
          calldata: [
            Felt.fromInt(offset),
            Felt.fromInt(limit),
          ],
        ),
        blockId: BlockId.latest,
      );

      final result = callResult.when(
        result: (result) => result,
        error: (error) => throw Exception('Call failed: ${error.message}'),
      );

      final recordings = <Recording>[];
      for (final recordingId in result) {
        final recording = await getRecording(recordingId.toString());
        if (recording != null) {
          recordings.add(recording);
        }
      }

      return recordings;
    } catch (error) {
      print('Failed to get public recordings: $error');
      return [];
    }
  }

  Future<void> incrementPlayCount({
    required Account account,
    required String recordingId,
  }) async {
    if (_voiceStorageAddress.isEmpty) {
      throw Exception('Voice storage contract address not set');
    }

    try {
      await account.execute(
        functionCalls: [
          FunctionCall(
            contractAddress: Felt.fromHexString(_voiceStorageAddress),
            entryPointSelector: getSelectorByName('increment_play_count'),
            calldata: [Felt.fromString(recordingId)],
          ),
        ],
      );
    } catch (error) {
      print('Failed to increment play count: $error');
    }
  }

  // Mock IPFS upload function
  Future<String> uploadToIPFS(Uint8List audioData) async {
    // In a real implementation, this would upload to IPFS
    // For demo purposes, we'll return a mock hash
    await Future.delayed(const Duration(seconds: 2)); // Simulate upload time
    return 'Qm${DateTime.now().millisecondsSinceEpoch.toRadixString(36)}';
  }

  Map<String, dynamic> _parseRecordingResult(List<Felt> result) {
    // Parse the contract result into a Recording object
    // This is a simplified version - actual parsing would depend on contract ABI
    return {
      'id': result[0].toString(),
      'owner': result[1].toHexString(),
      'title': result[2].toString(),
      'description': result[3].toString(),
      'ipfs_hash': result[4].toString(),
      'duration': result[5].toInt(),
      'file_size': result[6].toInt(),
      'created_at': result[7].toInt(),
      'is_public': result[8].toInt() == 1,
      'tags': <String>[], // Simplified for demo
      'play_count': result[9].toInt(),
    };
  }

  List<Map<String, dynamic>> _getVoiceStorageAbi() {
    // Simplified ABI for demo purposes
    return [
      {
        'type': 'function',
        'name': 'store_recording',
        'inputs': [
          {'name': 'metadata', 'type': 'RecordingMetadata'}
        ],
        'outputs': [
          {'type': 'felt'}
        ],
      },
      {
        'type': 'function',
        'name': 'get_recording',
        'inputs': [
          {'name': 'recording_id', 'type': 'felt'}
        ],
        'outputs': [
          {'type': 'Recording'}
        ],
      },
    ];
  }

  List<Map<String, dynamic>> _getUserRegistryAbi() {
    return [
      {
        'type': 'function',
        'name': 'register_user',
        'inputs': [
          {'name': 'profile', 'type': 'ProfileUpdate'}
        ],
        'outputs': [
          {'type': 'bool'}
        ],
      },
    ];
  }

  List<Map<String, dynamic>> _getAccessControlAbi() {
    return [
      {
        'type': 'function',
        'name': 'grant_access',
        'inputs': [
          {'name': 'recording_id', 'type': 'felt'},
          {'name': 'user', 'type': 'felt'},
          {'name': 'permission_type', 'type': 'felt'},
          {'name': 'expires_at', 'type': 'felt'},
        ],
        'outputs': [
          {'type': 'bool'}
        ],
      },
    ];
  }
}
