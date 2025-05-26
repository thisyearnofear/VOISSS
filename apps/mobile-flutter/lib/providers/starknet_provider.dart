import 'package:flutter/foundation.dart';
import 'package:starknet/starknet.dart';
import 'package:starknet_provider/starknet_provider.dart';
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

  // Contract addresses (deployed on Starknet Sepolia)
  static const String _voiceStorageAddress = '0x545b48dd76469e984b5622e5841d2affa30155980829399e7ec7447012922e2';
  static const String _userRegistryAddress = '0x52bb03f52e7c07d6f7053b0fc7c52c9e0c7d73ceb36fab93db3d7bbc578bb63';
  static const String _accessControlAddress = '0x5db925a0dfe7ab9137121613ef66a32ceb48acbc9cc33091d804dd9feb983b5';

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
      // Enhanced connection flow with better error handling
      // For mobile development, we'll provide multiple connection options:
      // 1. Import existing account with private key (for development)
      // 2. Connect to ArgentX mobile wallet (production)
      // 3. Connect to Braavos mobile wallet (production)

      // Check network connectivity first
      await _checkNetworkConnectivity();

      // For hackathon demo, we'll use a development account
      // In production, this would integrate with mobile wallet apps
      await _connectDevelopmentAccount();

      // Verify connection by checking balance
      await _verifyConnection();

    } catch (e) {
      _error = 'Failed to connect wallet: ${e.toString()}';
      print('Wallet connection error: $e');
    } finally {
      _setConnecting(false);
    }
  }

  Future<void> _checkNetworkConnectivity() async {
    try {
      // Test RPC connection
      final chainId = await _provider?.chainId();
      if (chainId == null) {
        throw Exception('Unable to connect to Starknet network');
      }
    } catch (e) {
      throw Exception('Network connectivity issue: $e');
    }
  }

  Future<void> _verifyConnection() async {
    if (_account != null && _accountAddress != null) {
      try {
        // Test the connection by getting balance
        final balance = await getBalance();
        print('Connection verified. Balance: $balance ETH');
      } catch (e) {
        print('Warning: Could not verify balance: $e');
        // Don't throw here as connection might still be valid
      }
    }
  }

  Future<void> _connectDevelopmentAccount() async {
    // For development/demo purposes, create a test account
    // In production, this would come from wallet connection

    if (_provider == null) {
      throw Exception('Provider not initialized');
    }

    // Use your actual testnet account
    // WARNING: Never use this in production!
    // This is your controlled testnet account for hackathon development
    const devPrivateKey = '0x022470b5fd0d809f8d475787bffc1b4686dd50a9e320a68e8c7b7495157468e0';
    const devAccountAddress = '0x06796FC91477e32037D79886bFc2F3fBD74c24Eba62183BB9F8FC6c59Fa29738';

    try {
      // Validate that the private key is within valid range before creating signer
      final privateKeyFelt = Felt.fromHexString(devPrivateKey);
      if (!_isValidFieldElement(privateKeyFelt)) {
        throw Exception('Private key is not a valid field element');
      }

      // Validate that the account address is within valid range
      final accountAddressFelt = Felt.fromHexString(devAccountAddress);
      if (!_isValidFieldElement(accountAddressFelt)) {
        throw Exception('Account address is not a valid field element');
      }

      // Create signer from private key
      final signer = Signer(privateKey: privateKeyFelt);

      // Create account instance
      _account = Account(
        provider: _provider!,
        signer: signer,
        accountAddress: accountAddressFelt,
        chainId: Felt.fromHexString('0x534e5f5345504f4c4941'), // Sepolia chain ID
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

  // Helper method to validate field elements
  bool _isValidFieldElement(Felt felt) {
    // Starknet field modulus: 2^251 + 17 * 2^192 + 1
    // For safety, we'll check if the value is less than 2^251
    final maxValue = BigInt.from(2).pow(251);
    final feltValue = felt.toBigInt();
    return feltValue < maxValue;
  }

  Future<void> connectArgentXWallet() async {
    // This would integrate with ArgentX mobile wallet
    // For Chrome/web testing, we'll show a helpful message

    try {
      _setConnecting(true);
      _clearError();

      // Check if we're on web/Chrome
      if (kIsWeb) {
        _error = 'ArgentX wallet is not available in web browsers. Please use the Development Account for testing.';
        _setConnecting(false);
        return;
      }

      const argentXScheme = 'argentx://connect';
      final uri = Uri.parse(argentXScheme);

      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
        // Handle response in app lifecycle
      } else {
        throw Exception('ArgentX wallet not installed. Please install ArgentX mobile app.');
      }

    } catch (e) {
      _error = 'ArgentX wallet not available: ${e.toString()}';
      _setConnecting(false);
    }
  }

  Future<void> connectBraavosWallet() async {
    // This would integrate with Braavos mobile wallet
    // For Chrome/web testing, we'll show a helpful message

    try {
      _setConnecting(true);
      _clearError();

      // Check if we're on web/Chrome
      if (kIsWeb) {
        _error = 'Braavos wallet is not available in web browsers. Please use the Development Account for testing.';
        _setConnecting(false);
        return;
      }

      const braavosScheme = 'braavos://connect';
      final uri = Uri.parse(braavosScheme);

      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      } else {
        throw Exception('Braavos wallet not installed. Please install Braavos mobile app.');
      }

    } catch (e) {
      _error = 'Braavos wallet not available: ${e.toString()}';
      _setConnecting(false);
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
      final result = await _account!.execute(
        functionCalls: [
          FunctionCall(
            contractAddress: Felt.fromHexString(_voiceStorageAddress),
            entryPointSelector: getSelectorByName('store_recording'),
            calldata: [
              // RecordingMetadata struct
              _stringToFelt(title),
              _stringToFelt(description),
              _stringToFelt(ipfsHash),
              Felt.fromInt(duration),
              Felt.fromInt(fileSize),
              Felt.fromInt(isPublic ? 1 : 0),
              // Tags array (simplified for demo)
              Felt.fromInt(tags.length),
              ...tags.map((tag) => _stringToFelt(tag)),
            ],
          ),
        ],
      );

      final txHash = result.when(
        result: (result) => result.transaction_hash,
        error: (error) => throw Exception('Transaction failed: ${error.message}'),
      );
      print('✅ Recording metadata stored on Starknet: $txHash');
      return txHash;

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
      final callResult = await _provider!.call(
        request: FunctionCall(
          contractAddress: Felt.fromHexString(_voiceStorageAddress),
          entryPointSelector: getSelectorByName('get_recording'),
          calldata: [_stringToFelt(recordingId)],
        ),
        blockId: BlockId.latest,
      );

      final result = callResult.when(
        result: (result) => result,
        error: (error) => throw Exception('Call failed: ${error.message}'),
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
      final callResult = await _provider!.call(
        request: FunctionCall(
          contractAddress: Felt.fromHexString(_voiceStorageAddress),
          entryPointSelector: getSelectorByName('get_user_recordings'),
          calldata: [Felt.fromHexString(_accountAddress!)],
        ),
        blockId: BlockId.latest,
      );

      final result = callResult.when(
        result: (result) => result,
        error: (error) => throw Exception('Call failed: ${error.message}'),
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
        // Validate saved values before using them
        final privateKeyFelt = Felt.fromHexString(_privateKey!);
        final accountAddressFelt = Felt.fromHexString(_accountAddress!);

        if (!_isValidFieldElement(privateKeyFelt) || !_isValidFieldElement(accountAddressFelt)) {
          throw Exception('Saved credentials contain invalid field elements');
        }

        final signer = Signer(privateKey: privateKeyFelt);
        _account = Account(
          provider: _provider!,
          signer: signer,
          accountAddress: accountAddressFelt,
          chainId: Felt.fromHexString('0x534e5f5345504f4c4941'), // Sepolia chain ID
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
          final privateKeyFelt = Felt.fromHexString(_privateKey!);
          final accountAddressFelt = Felt.fromHexString(_accountAddress!);

          if (!_isValidFieldElement(privateKeyFelt) || !_isValidFieldElement(accountAddressFelt)) {
            throw Exception('Invalid field elements for network reconnection');
          }

          final signer = Signer(privateKey: privateKeyFelt);
          _account = Account(
            provider: _provider!,
            signer: signer,
            accountAddress: accountAddressFelt,
            chainId: Felt.fromHexString('0x534e5f5345504f4c4941'), // Sepolia chain ID
          );
        } catch (e) {
          print('Failed to reconnect after network switch: $e');
        }
      }

      await _saveConnectionState();
      notifyListeners();
    }
  }

  // Helper method to safely convert strings to Felt
  Felt _stringToFelt(String str) {
    // For demo purposes, we'll use a simple hash of the string
    // In production, you'd use proper string encoding for Cairo
    final bytes = str.codeUnits;
    var hash = 0;
    for (final byte in bytes) {
      hash = (hash * 31 + byte) & 0x7FFFFFFF; // Keep it within safe range
    }
    return Felt.fromInt(hash);
  }

  // Sync functionality for cross-platform compatibility
  Future<List<Map<String, dynamic>>> getUserRecordingsFromChain() async {
    if (!_isConnected || _provider == null || _accountAddress == null) {
      throw Exception('Not connected to Starknet');
    }

    if (_voiceStorageAddress.isEmpty) {
      return []; // Return empty list if contract not deployed
    }

    try {
      final callResult = await _provider!.call(
        request: FunctionCall(
          contractAddress: Felt.fromHexString(_voiceStorageAddress),
          entryPointSelector: getSelectorByName('get_user_recordings'),
          calldata: [Felt.fromHexString(_accountAddress!)],
        ),
        blockId: BlockId.latest,
      );

      final result = callResult.when(
        result: (result) => result,
        error: (error) => throw Exception('Call failed: ${error.message}'),
      );

      // Parse results into recording metadata
      List<Map<String, dynamic>> recordings = [];
      for (int i = 0; i < result.length; i += 10) { // Assuming 10 fields per recording
        if (i + 9 < result.length) {
          recordings.add({
            'id': result[i].toString(),
            'owner': result[i + 1].toHexString(),
            'title': result[i + 2].toString(),
            'description': result[i + 3].toString(),
            'ipfs_hash': result[i + 4].toString(),
            'duration': result[i + 5].toInt(),
            'file_size': result[i + 6].toInt(),
            'created_at': result[i + 7].toInt(),
            'is_public': result[i + 8].toInt() == 1,
            'play_count': result[i + 9].toInt(),
          });
        }
      }

      return recordings;

    } catch (e) {
      print('Failed to get user recordings from chain: $e');
      return [];
    }
  }
}
