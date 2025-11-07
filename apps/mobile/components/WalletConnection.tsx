import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Wallet, Key, AlertCircle, CheckCircle } from 'lucide-react-native';
import { colors } from '@voisss/ui';
import { useBase } from '../hooks/useBase';

interface WalletConnectionProps {
  onConnected?: () => void;
  onClose?: () => void;
}

export function WalletConnection({ onConnected, onClose }: WalletConnectionProps) {
  const { isConnected, isConnecting, account, error, connect, disconnect } = useBase();

  const handleConnect = async () => {
    try {
      connect(); // Call without arguments - uses the first available connector
      onConnected?.();
    } catch (err) {
      Alert.alert(
        'Connection Failed',
        'Failed to connect to Base wallet. Please check your wallet and try again.',
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
        <Text style={styles.title}>Connect Base Wallet</Text>
        <Text style={styles.description}>
          Connect your Base wallet to store recordings on-chain and access Web3 features.
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={16} color="#FF6B6B" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.connectButton}
        onPress={handleConnect}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <ActivityIndicator size="small" color={colors.dark.text} />
        ) : (
          <>
            <Key size={20} color={colors.dark.text} />
            <Text style={styles.connectButtonText}>Connect Wallet</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          🔐 Your wallet connection is secured through the Base ecosystem. For best security, use official wallet apps.
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