import 'dart:typed_data';
import 'dart:convert';
import 'package:http/http.dart' as http;

/// IPFS upload result containing hash, size, and URL
class IPFSUploadResult {
  final String hash;
  final int size;
  final String url;

  IPFSUploadResult({
    required this.hash,
    required this.size,
    required this.url,
  });

  Map<String, dynamic> toJson() => {
    'hash': hash,
    'size': size,
    'url': url,
  };

  factory IPFSUploadResult.fromJson(Map<String, dynamic> json) => IPFSUploadResult(
    hash: json['hash'],
    size: json['size'],
    url: json['url'],
  );
}

/// Audio metadata for IPFS uploads
class AudioMetadata {
  final String filename;
  final String mimeType;
  final int duration;
  final int? sampleRate;
  final int? bitRate;

  AudioMetadata({
    required this.filename,
    required this.mimeType,
    required this.duration,
    this.sampleRate,
    this.bitRate,
  });

  Map<String, dynamic> toJson() => {
    'filename': filename,
    'mimeType': mimeType,
    'duration': duration,
    'sampleRate': sampleRate,
    'bitRate': bitRate,
  };
}

/// IPFS configuration for different providers
class IPFSConfig {
  final String provider; // 'pinata', 'infura', 'web3storage', 'local'
  final String? apiKey;
  final String? apiSecret;
  final String? gatewayUrl;

  IPFSConfig({
    required this.provider,
    this.apiKey,
    this.apiSecret,
    this.gatewayUrl,
  });
}

/// IPFS Service for uploading and retrieving audio files
/// Supports multiple IPFS providers: Pinata, Infura, Web3.Storage, and Local
class IPFSService {
  final IPFSConfig config;
  final String defaultGateway = 'https://gateway.pinata.cloud/ipfs/';

  IPFSService(this.config);

  /// Upload audio file to IPFS
  Future<IPFSUploadResult> uploadAudio(
    Uint8List audioData,
    AudioMetadata metadata,
  ) async {
    try {
      switch (config.provider) {
        case 'pinata':
          return await _uploadToPinata(audioData, metadata);
        case 'infura':
          return await _uploadToInfura(audioData, metadata);
        case 'web3storage':
          return await _uploadToWeb3Storage(audioData, metadata);
        case 'local':
          return await _uploadToLocalNode(audioData, metadata);
        default:
          throw Exception('Unsupported IPFS provider: ${config.provider}');
      }
    } catch (error) {
      print('IPFS upload failed: $error');
      throw Exception('Failed to upload to IPFS: ${error.toString()}');
    }
  }

  /// Upload to Pinata (recommended for production)
  Future<IPFSUploadResult> _uploadToPinata(
    Uint8List audioData,
    AudioMetadata metadata,
  ) async {
    if (config.apiKey == null || config.apiSecret == null) {
      throw Exception('Pinata API key and secret are required');
    }

    final request = http.MultipartRequest(
      'POST',
      Uri.parse('https://api.pinata.cloud/pinning/pinFileToIPFS'),
    );

    // Add headers
    request.headers.addAll({
      'pinata_api_key': config.apiKey!,
      'pinata_secret_api_key': config.apiSecret!,
    });

    // Add file
    request.files.add(http.MultipartFile.fromBytes(
      'file',
      audioData,
      filename: metadata.filename,
    ));

    // Add metadata
    final pinataMetadata = {
      'name': metadata.filename,
      'keyvalues': {
        'duration': metadata.duration.toString(),
        'mimeType': metadata.mimeType,
        'sampleRate': metadata.sampleRate?.toString() ?? '',
        'bitRate': metadata.bitRate?.toString() ?? '',
        'uploadedAt': DateTime.now().toIso8601String(),
      }
    };

    request.fields['pinataMetadata'] = jsonEncode(pinataMetadata);

    final response = await request.send();
    final responseBody = await response.stream.bytesToString();

    if (response.statusCode != 200) {
      throw Exception('Pinata upload failed: $responseBody');
    }

    final result = jsonDecode(responseBody);
    final gatewayUrl = config.gatewayUrl ?? defaultGateway;

    return IPFSUploadResult(
      hash: result['IpfsHash'],
      size: result['PinSize'],
      url: '$gatewayUrl${result['IpfsHash']}',
    );
  }

  /// Upload to Infura IPFS
  Future<IPFSUploadResult> _uploadToInfura(
    Uint8List audioData,
    AudioMetadata metadata,
  ) async {
    if (config.apiKey == null || config.apiSecret == null) {
      throw Exception('Infura project ID and secret are required');
    }

    final request = http.MultipartRequest(
      'POST',
      Uri.parse('https://ipfs.infura.io:5001/api/v0/add'),
    );

    // Add authorization
    final auth = base64Encode(utf8.encode('${config.apiKey}:${config.apiSecret}'));
    request.headers['Authorization'] = 'Basic $auth';

    // Add file
    request.files.add(http.MultipartFile.fromBytes(
      'file',
      audioData,
      filename: metadata.filename,
    ));

    final response = await request.send();
    final responseBody = await response.stream.bytesToString();

    if (response.statusCode != 200) {
      throw Exception('Infura upload failed: $responseBody');
    }

    final result = jsonDecode(responseBody);
    
    return IPFSUploadResult(
      hash: result['Hash'],
      size: result['Size'],
      url: 'https://ipfs.infura.io/ipfs/${result['Hash']}',
    );
  }

  /// Upload to Web3.Storage
  Future<IPFSUploadResult> _uploadToWeb3Storage(
    Uint8List audioData,
    AudioMetadata metadata,
  ) async {
    if (config.apiKey == null) {
      throw Exception('Web3.Storage API token is required');
    }

    final request = http.MultipartRequest(
      'POST',
      Uri.parse('https://api.web3.storage/upload'),
    );

    request.headers['Authorization'] = 'Bearer ${config.apiKey}';

    request.files.add(http.MultipartFile.fromBytes(
      'file',
      audioData,
      filename: metadata.filename,
    ));

    final response = await request.send();
    final responseBody = await response.stream.bytesToString();

    if (response.statusCode != 200) {
      throw Exception('Web3.Storage upload failed: $responseBody');
    }

    final result = jsonDecode(responseBody);
    
    return IPFSUploadResult(
      hash: result['cid'],
      size: audioData.length,
      url: 'https://${result['cid']}.ipfs.w3s.link',
    );
  }

  /// Upload to local IPFS node
  Future<IPFSUploadResult> _uploadToLocalNode(
    Uint8List audioData,
    AudioMetadata metadata,
  ) async {
    final nodeUrl = config.gatewayUrl ?? 'http://localhost:5001';
    
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$nodeUrl/api/v0/add'),
    );

    request.files.add(http.MultipartFile.fromBytes(
      'file',
      audioData,
      filename: metadata.filename,
    ));

    final response = await request.send();
    final responseBody = await response.stream.bytesToString();

    if (response.statusCode != 200) {
      throw Exception('Local IPFS upload failed: $responseBody');
    }

    final result = jsonDecode(responseBody);
    
    return IPFSUploadResult(
      hash: result['Hash'],
      size: result['Size'],
      url: '$nodeUrl/ipfs/${result['Hash']}',
    );
  }

  /// Retrieve audio file from IPFS
  Future<Uint8List> retrieveAudio(String ipfsHash) async {
    final gatewayUrl = config.gatewayUrl ?? defaultGateway;
    final url = '$gatewayUrl$ipfsHash';

    final response = await http.get(Uri.parse(url));

    if (response.statusCode != 200) {
      throw Exception('Failed to retrieve audio from IPFS: ${response.statusCode}');
    }

    return response.bodyBytes;
  }

  /// Get IPFS URL for a hash
  String getIPFSUrl(String ipfsHash) {
    final gatewayUrl = config.gatewayUrl ?? defaultGateway;
    return '$gatewayUrl$ipfsHash';
  }
}
