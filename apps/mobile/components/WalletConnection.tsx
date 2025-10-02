import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Wallet, Key, AlertCircle, CheckCircle } from 'lucide-react-native';
import colors from '../constants/colors';
import { useStarknet } from '../hooks/useStarknet';

interface WalletConnectionProps {
  onConnected?: () => void;
  onClose?: () => void;
}

export function WalletConnection({ onConnected, onClose }: WalletConnectionProps) {
  const { isConnected, isConnecting, account, error, connect, disconnect } = useStarknet();
  const [privateKey, setPrivateKey] = useState('');
  const [showPrivateKeyInput, setShowPrivateKeyInput] = useState(false);

  const handleConnect = async () => {
    if (!privateKey.trim()) {
      Alert.alert('Error', 'Please enter your private key');
      return;
    }

    try {
      await connect(privateKey.trim());
      setPrivateKey('');
      setShowPrivateKeyInput(false);
      onConnected?.();
    } catch (err) {
      Alert.alert(
        'Connection Failed',
        'Failed to connect to Starknet. Please check your private key and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await disconnect();
            onClose?.();
          },
        },
      ]
    );
  };

  if (isConnected && account) {
    return (
      <View style={styles.container}>
        <View style={styles.connectedState}>
          <CheckCircle size={48} color={colors.dark.success} />
          <Text style={styles.connectedTitle}>Wallet Connected</Text>
          <Text style={styles.connectedAddress}>
            {account.address.slice(0, 6)}...{account.address.slice(-4)}
          </Text>
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={handleDisconnect}
          >
            <Text style={styles.disconnectButtonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Wallet size={48} color={colors.dark.primary} />
        <Text style={styles.title}>Connect Starknet Wallet</Text>
        <Text style={styles.description}>
          Connect your Starknet wallet to store recordings on-chain and access Web3 features.
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={16} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {!showPrivateKeyInput ? (
        <TouchableOpacity
          style={styles.connectButton}
          onPress={() => setShowPrivateKeyInput(true)}
          disabled={isConnecting}
        >
          <Key size={20} color={colors.dark.text} />
          <Text style={styles.connectButtonText}>Connect with Private Key</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Private Key</Text>
          <TextInput
            style={styles.input}
            value={privateKey}
            onChangeText={setPrivateKey}
            placeholder="Enter your Starknet private key"
            placeholderTextColor={colors.dark.textSecondary}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={styles.inputActions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setShowPrivateKeyInput(false);
                setPrivateKey('');
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={handleConnect}
              disabled={isConnecting || !privateKey.trim()}
            >
              {isConnecting ? (
                <ActivityIndicator size="small" color={colors.dark.text} />
              ) : (
                <Text style={styles.confirmButtonText}>Connect</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          ⚠️ This is a demo implementation. In production, use secure wallet connections like WalletConnect or browser extensions.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.dark.text,
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B20',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF6B6B',
    marginLeft: 8,
    fontSize: 14,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dark.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 20,
  },
  connectButtonText: {
    color: colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.dark.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.dark.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.dark.text,
    marginBottom: 16,
  },
  inputActions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.dark.card,
  },
  cancelButtonText: {
    color: colors.dark.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: colors.dark.primary,
  },
  confirmButtonText: {
    color: colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
  },
  connectedState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  connectedTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.dark.text,
    marginTop: 16,
    marginBottom: 8,
  },
  connectedAddress: {
    fontSize: 16,
    color: colors.dark.textSecondary,
    fontFamily: 'monospace',
    marginBottom: 24,
  },
  disconnectButton: {
    backgroundColor: '#FF6B6B20',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  disconnectButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    backgroundColor: colors.dark.card,
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  disclaimerText: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});