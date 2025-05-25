import 'package:flutter/foundation.dart';
import 'package:starknet/starknet.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:convert';

class StarknetProvider extends ChangeNotifier {
  // Starknet connection state
  bool _isConnected = false;
  bool _isConnecting = false;
  String? _accountAddress;
  String? _privateKey;
  String? _error;
  String? _network = 'sepolia';

  // Starknet instances
  JsonRpcProvider? _provider;
  Account? _account;

  // Contract addresses (will be updated after deployment)
  static const String _voiceStorageAddress = '';
  static const String _userRegistryAddress = '';
  static const String _accessControlAddress = '';

  // Network configurations
  static const Map<String, String> _networkUrls = {
    'sepolia': 'https://starknet-sepolia.public.blastapi.io/rpc/v0_7',
    'mainnet': 'https://starknet-mainnet.public.blastapi.io/rpc/v0_7',
  };

  // Getters
  bool get isConnected => _isConnected;
  bool get isConnecting => _isConnecting;
  String? get accountAddress => _accountAddress;
  String? get error => _error;
  String? get network => _network;
  Account? get account => _account;
  JsonRpcProvider? get provider => _provider;

  StarknetProvider() {
    _initializeProvider();
    loadSavedState();
  }

  void _initializeProvider() {
    final networkUrl = _networkUrls[_network] ?? _networkUrls['sepolia']!;
    _provider = JsonRpcProvider(nodeUri: Uri.parse(networkUrl));
  }

  Future<void> connectWallet() async {
    _setConnecting(true);
    _clearError();

    try {
      // For mobile development, we'll provide multiple connection options:
      // 1. Import existing account with private key (for development)
      // 2. Connect to ArgentX mobile wallet (production)
      // 3. Connect to Braavos mobile wallet (production)

      // For hackathon demo, we'll use a development account
      // In production, this would integrate with mobile wallet apps

      await _connectDevelopmentAccount();

    } catch (e) {
      _error = 'Failed to connect wallet: ${e.toString()}';
    } finally {
      _setConnecting(false);
    }
  }

  Future<void> _connectDevelopmentAccount() async {
    // For development/demo purposes, create a test account
    // In production, this would come from wallet connection

    if (_provider == null) {
      throw Exception('Provider not initialized');
    }

    // Generate or use a development private key
    // WARNING: Never use this in production!
    const devPrivateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    const devAccountAddress = '0x1234567890abcdef1234567890abcdef12345678';

    try {
      // Create account instance
      _account = Account(
        provider: _provider!,
        accountAddress: Felt.fromHexString(devAccountAddress),
        privateKey: Felt.fromHexString(devPrivateKey),
      );

      _accountAddress = devAccountAddress;
      _privateKey = devPrivateKey;
      _isConnected = true;

      // Save connection state
      await _saveConnectionState();

      print('✅ Connected to Starknet ${_network} with account: $_accountAddress');

    } catch (e) {
      throw Exception('Failed to create account: $e');
    }
  }

  Future<void> connectArgentXWallet() async {
    // This would integrate with ArgentX mobile wallet
    // For now, we'll show how this would work

    try {
      // In production, this would:
      // 1. Check if ArgentX is installed
      // 2. Open ArgentX app with connection request
      // 3. Handle the response with account details

      const argentXScheme = 'argentx://connect';
      final uri = Uri.parse(argentXScheme);

      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
        // Handle response in app lifecycle
      } else {
        throw Exception('ArgentX wallet not installed');
      }

    } catch (e) {
      throw Exception('Failed to connect ArgentX: $e');
    }
  }

  Future<void> connectBraavosWallet() async {
    // This would integrate with Braavos mobile wallet
    // Similar to ArgentX integration

    try {
      const braavosScheme = 'braavos://connect';
      final uri = Uri.parse(braavosScheme);

      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      } else {
        throw Exception('Braavos wallet not installed');
      }

    } catch (e) {
      throw Exception('Failed to connect Braavos: $e');
    }
  }

  Future<void> disconnectWallet() async {
    _isConnected = false;
    _accountAddress = null;
    _account = null;
    _clearError();

    // Clear saved state
    await _clearConnectionState();

    notifyListeners();
  }

  Future<String?> getBalance() async {
    if (!_isConnected || _account == null) return null;

    try {
      // Get ETH balance from Starknet
      const ethContractAddress = '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';

      // Simplified balance check for demo
      // In production, you'd call the ERC20 contract's balanceOf function
      final balance = BigInt.zero; // Mock balance

      return balance.toString();
    } catch (e) {
      _error = 'Failed to get balance: ${e.toString()}';
      notifyListeners();
      return null;
    }
  }

  Future<String> storeRecordingMetadata({
    required String title,
    required String description,
    required int duration,
    required int fileSize,
    required List<String> tags,
    required String ipfsHash,
    required bool isPublic,
  }) async {
    if (!_isConnected || _account == null) {
      throw Exception('Wallet not connected');
    }

    if (_voiceStorageAddress.isEmpty) {
      throw Exception('Voice storage contract not deployed yet');
    }

    try {
      // Real contract interaction
      final result = await _account!.execute([
        Call(
          contractAddress: Felt.fromHexString(_voiceStorageAddress),
          entrypoint: 'store_recording',
          calldata: [
            // RecordingMetadata struct
            Felt.fromString(title),
            Felt.fromString(description),
            Felt.fromString(ipfsHash),
            Felt.fromInt(duration),
            Felt.fromInt(fileSize),
            Felt.fromInt(isPublic ? 1 : 0),
            // Tags array (simplified for demo)
            Felt.fromInt(tags.length),
            ...tags.map((tag) => Felt.fromString(tag)),
          ],
        ),
      ]);

      print('✅ Recording metadata stored on Starknet: ${result.transactionHash}');
      return result.transactionHash;

    } catch (e) {
      _error = 'Failed to store metadata: ${e.toString()}';
      notifyListeners();
      rethrow;
    }
  }

  Future<Map<String, dynamic>?> getRecording(String recordingId) async {
    if (!_isConnected || _provider == null) {
      throw Exception('Not connected to Starknet');
    }

    if (_voiceStorageAddress.isEmpty) {
      throw Exception('Voice storage contract not deployed yet');
    }

    try {
      final result = await _provider!.call(
        contractAddress: Felt.fromHexString(_voiceStorageAddress),
        entrypoint: 'get_recording',
        calldata: [Felt.fromString(recordingId)],
      );

      if (result.isNotEmpty) {
        return _parseRecordingResult(result);
      }
      return null;

    } catch (e) {
      print('Failed to get recording: $e');
      return null;
    }
  }

  Future<List<String>> getUserRecordings() async {
    if (!_isConnected || _provider == null || _accountAddress == null) {
      throw Exception('Not connected to Starknet');
    }

    if (_voiceStorageAddress.isEmpty) {
      return []; // Return empty list if contract not deployed
    }

    try {
      final result = await _provider!.call(
        contractAddress: Felt.fromHexString(_voiceStorageAddress),
        entrypoint: 'get_user_recordings',
        calldata: [Felt.fromHexString(_accountAddress!)],
      );

      return result.map((felt) => felt.toString()).toList();

    } catch (e) {
      print('Failed to get user recordings: $e');
      return [];
    }
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
      'play_count': result[9].toInt(),
    };
  }

  void _setConnecting(bool connecting) {
    _isConnecting = connecting;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
    notifyListeners();
  }

  Future<void> _saveConnectionState() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('starknet_connected', _isConnected);
    if (_accountAddress != null) {
      await prefs.setString('starknet_address', _accountAddress!);
    }
    if (_privateKey != null) {
      // WARNING: In production, never store private keys in SharedPreferences!
      // This is only for development/demo purposes
      await prefs.setString('starknet_private_key', _privateKey!);
    }
    if (_network != null) {
      await prefs.setString('starknet_network', _network!);
    }
  }

  Future<void> _clearConnectionState() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('starknet_connected');
    await prefs.remove('starknet_address');
    await prefs.remove('starknet_private_key');
    await prefs.remove('starknet_network');
  }

  Future<void> loadSavedState() async {
    final prefs = await SharedPreferences.getInstance();
    _isConnected = prefs.getBool('starknet_connected') ?? false;
    _accountAddress = prefs.getString('starknet_address');
    _privateKey = prefs.getString('starknet_private_key');
    _network = prefs.getString('starknet_network') ?? 'sepolia';

    // Reinitialize provider with saved network
    _initializeProvider();

    // Recreate account if we have saved credentials
    if (_isConnected && _accountAddress != null && _privateKey != null && _provider != null) {
      try {
        _account = Account(
          provider: _provider!,
          accountAddress: Felt.fromHexString(_accountAddress!),
          privateKey: Felt.fromHexString(_privateKey!),
        );
        print('✅ Restored Starknet connection: $_accountAddress');
      } catch (e) {
        print('❌ Failed to restore account: $e');
        _isConnected = false;
        _accountAddress = null;
        _privateKey = null;
        _account = null;
      }
    }

    notifyListeners();
  }

  // Network switching
  Future<void> switchNetwork(String network) async {
    if (_networkUrls.containsKey(network)) {
      _network = network;
      _initializeProvider();

      // Reconnect account if connected
      if (_isConnected && _accountAddress != null && _privateKey != null) {
        try {
          _account = Account(
            provider: _provider!,
            accountAddress: Felt.fromHexString(_accountAddress!),
            privateKey: Felt.fromHexString(_privateKey!),
          );
        } catch (e) {
          print('Failed to reconnect after network switch: $e');
        }
      }

      await _saveConnectionState();
      notifyListeners();
    }
  }
}
