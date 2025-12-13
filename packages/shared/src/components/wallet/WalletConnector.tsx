/**
 * Wallet Connector Component
 * 
 * Cross-platform wallet connection UI with platform-aware wallet options
 * Follows MODULAR and CLEAN principles
 */

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { walletConnectorService } from '../../services/wallet-connectors';
import { Web3Formatters } from '../../utils/web3-utils';

/**
 * Wallet connection status
 */
export type WalletConnectionStatus = {
  isConnected: boolean;
  isConnecting: boolean;
  address?: string;
  connectorName?: string;
  error?: Error | null;
};

/**
 * Wallet option type
 */
export type WalletOption = {
  id: string;
  name: string;
  description: string;
  icon: string;
  available: boolean;
  recommended: boolean;
  onConnect: () => void;
};

/**
 * Wallet Connector Component Props
 */
export interface WalletConnectorProps {
  onConnectionSuccess?: (address: string) => void;
  onConnectionError?: (error: Error) => void;
  showModal?: boolean;
  onClose?: () => void;
}

/**
 * Wallet Connector Component
 */
export const WalletConnector: React.FC<WalletConnectorProps> = ({
  onConnectionSuccess,
  onConnectionError,
  showModal = false,
  onClose,
}) => {
  const { isConnected, address, connector } = useAccount();
  const { connect, connectors, error, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Get available wallet options for current platform
   */
  const getWalletOptions = useCallback((): WalletOption[] => {
    const { isMobile, recommendedWallet } = walletConnectorService.getEnvironmentInfo();
    
    return [
      {
        id: 'walletconnect',
        name: 'WalletConnect',
        description: isMobile 
          ? 'Connect with any mobile wallet'
          : 'Scan QR code with mobile wallet',
        icon: '📱',
        available: true,
        recommended: recommendedWallet === 'walletconnect',
        onConnect: () => connectWallet('walletconnect'),
      },
      ...(!isMobile ? [
        {
          id: 'metamask',
          name: 'MetaMask',
          description: 'Browser extension wallet',
          icon: '🦊',
          available: walletConnectorService.isWalletAvailable('metamask'),
          recommended: recommendedWallet === 'metamask',
          onConnect: () => connectWallet('metamask'),
        },
        {
          id: 'coinbase',
          name: 'Coinbase Wallet',
          description: 'Browser extension wallet',
          icon: '💰',
          available: walletConnectorService.isWalletAvailable('coinbase'),
          recommended: recommendedWallet === 'coinbase',
          onConnect: () => connectWallet('coinbase'),
        },
      ] : []),
    ];
  }, [connect]);

  /**
   * Connect to specific wallet
   */
  const connectWallet = useCallback(async (walletId: string) => {
    try {
      setIsLoading(true);
      setConnectionError(null);
      
      // Find the connector
      const selectedConnector = connectors.find(c => 
        c.id.toLowerCase().includes(walletId.toLowerCase())
      );
      
      if (selectedConnector) {
        await connect({ connector: selectedConnector });
        
        if (onConnectionSuccess && address) {
          onConnectionSuccess(address);
        }
      } else {
        throw new Error(`Wallet ${walletId} not available`);
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setConnectionError(error instanceof Error ? error : new Error('Connection failed'));
      
      if (onConnectionError) {
        onConnectionError(error instanceof Error ? error : new Error('Connection failed'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [connect, connectors, address, onConnectionSuccess, onConnectionError]);

  /**
   * Handle disconnect
   */
  const handleDisconnect = useCallback(async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Disconnect failed:', error);
      setConnectionError(error instanceof Error ? error : new Error('Disconnect failed'));
    }
  }, [disconnect]);

  /**
   * Get connection status
   */
  const getConnectionStatus = (): WalletConnectionStatus => ({
    isConnected,
    isConnecting: isPending || isLoading,
    address,
    connectorName: connector?.name,
    error: error || connectionError,
  });

  const walletOptions = getWalletOptions();
  const availableWallets = walletOptions.filter(w => w.available);
  const status = getConnectionStatus();

  if (!showModal) return null;

  return (
    <Modal 
      visible={showModal}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Connect Wallet</Text>
            {onClose && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Connection Status */}
          {status.isConnected ? (
            <View style={styles.connectedContainer}>
              <Text style={styles.connectedTitle}>Connected</Text>
              <View style={styles.addressContainer}>
                <Text style={styles.addressText}>
                  {Web3Formatters.formatAddress(address || '')}
                </Text>
                <Text style={styles.connectorText}>
                  via {status.connectorName}
                </Text>
              </View>
              
              <TouchableOpacity 
                onPress={handleDisconnect}
                style={[styles.button, styles.disconnectButton]}
                disabled={status.isConnecting}
              >
                {status.isConnecting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Disconnect</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Wallet Options */}
              <Text style={styles.sectionTitle}>Available Wallets</Text>
              
              {availableWallets.length > 0 ? (
                <ScrollView style={styles.walletList}>
                  {availableWallets.map((wallet) => (
                    <TouchableOpacity
                      key={wallet.id}
                      onPress={wallet.onConnect}
                      style={[
                        styles.walletOption,
                        wallet.recommended && styles.recommendedWallet
                      ]}
                      disabled={status.isConnecting || !wallet.available}
                    >
                      <View style={styles.walletIcon}>{wallet.icon}</View>
                      <View style={styles.walletInfo}>
                        <Text style={styles.walletName}>{wallet.name}</Text>
                        <Text style={styles.walletDescription}>{wallet.description}</Text>
                        {wallet.recommended && (
                          <Text style={styles.recommendedText}>Recommended</Text>
                        )}
                      </View>
                      {status.isConnecting ? (
                        <ActivityIndicator size="small" />
                      ) : (
                        <Text style={styles.connectText}>Connect</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.noWallets}>
                  <Text style={styles.noWalletsText}>No wallets available</Text>
                  <Text style={styles.noWalletsSubtext}>
                    {walletConnectorService.getEnvironmentInfo().isMobile 
                      ? 'Install a mobile wallet like MetaMask or Trust Wallet'
                      : 'Install a browser extension like MetaMask or Coinbase Wallet'}
                  </Text>
                </View>
              )}
              
              {/* Error Display */}
              {status.error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorTitle}>Connection Failed</Text>
                  <Text style={styles.errorMessage}>{status.error.message}</Text>
                  <TouchableOpacity 
                    onPress={() => setConnectionError(null)}
                    style={styles.tryAgainButton}
                  >
                    <Text style={styles.tryAgainText}>Try Again</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

/**
 * Styles
 */
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 20,
    color: '#6B7280',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 12,
  },
  walletList: {
    marginBottom: 20,
  },
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  recommendedWallet: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  walletIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  walletInfo: {
    flex: 1,
  },
  walletName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  walletDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  recommendedText: {
    fontSize: 12,
    color: '#3B82F6',
    marginTop: 4,
  },
  connectText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  connectedContainer: {
    alignItems: 'center',
    padding: 20,
  },
  connectedTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 12,
  },
  addressContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  addressText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  connectorText: {
    fontSize: 14,
    color: '#6B7280',
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  disconnectButton: {
    backgroundColor: '#EF4444',
    width: '100%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 16,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    marginTop: 20,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#991B1B',
    marginBottom: 12,
  },
  tryAgainButton: {
    alignSelf: 'flex-start',
    padding: 8,
  },
  tryAgainText: {
    color: '#EF4444',
    fontWeight: '500',
  },
  noWallets: {
    padding: 20,
    alignItems: 'center',
  },
  noWalletsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  noWalletsSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});

/**
 * Wallet Connection Button
 * Simple button to trigger wallet connection modal
 */
export const WalletConnectionButton: React.FC<{
  onPress: () => void;
  address?: string;
  isConnected: boolean;
}> = ({ onPress, address, isConnected }) => {
  return (
    <TouchableOpacity onPress={onPress} style={styles.walletButton}>
      {isConnected ? (
        <Text style={styles.walletButtonText}>
          {Web3Formatters.formatAddress(address || '')}
        </Text>
      ) : (
        <Text style={styles.walletButtonText}>Connect Wallet</Text>
      )}
    </TouchableOpacity>
  );
};

// Add wallet button styles to existing styles
const walletButtonStyles = StyleSheet.create({
  walletButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
  },
});

// Merge styles
Object.assign(styles, walletButtonStyles);