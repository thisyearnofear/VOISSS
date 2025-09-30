import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Wallet, Shield, Zap, Globe, CheckCircle, AlertCircle } from 'lucide-react-native';
import colors from '../constants/colors';
import { useStarknet } from '../hooks/useStarknet';

interface WalletModalProps {
  visible: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export function WalletModal({ visible, onClose, onConnected }: WalletModalProps) {
  const { isConnected, isConnecting, account, error, connect, disconnect, getBalance } = useStarknet();
  const [balance, setBalance] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'connect' | 'features' | 'manage'>('connect');

  useEffect(() => {
    if (isConnected && account) {
      setActiveTab('manage');
      loadBalance();
      onConnected?.();
    }
  }, [isConnected, account]);

  const loadBalance = async () => {
    try {
      const bal = await getBalance();
      setBalance(bal);
    } catch (err) {
      console.error('Failed to load balance:', err);
    }
  };

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      Alert.alert(
        'Connection Failed',
        'Failed to connect to Starknet wallet. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            disconnect();
            setActiveTab('connect');
            setBalance(null);
          },
        },
      ]
    );
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (bal: string | null) => {
    if (!bal) return '0.00';
    const ethValue = parseFloat(bal) / 1e18;
    return ethValue.toFixed(4);
  };

  const web3Features = [
    {
      icon: Shield,
      title: 'NFT Minting',
      description: 'Mint your recordings as unique NFTs on Starknet',
    },
    {
      icon: Globe,
      title: 'On-Chain Storage',
      description: 'Store recording metadata permanently on blockchain',
    },
    {
      icon: Zap,
      title: 'Starknet Rewards',
      description: 'Earn rewards for participating in the ecosystem',
    },
    {
      icon: CheckCircle,
      title: 'Decentralized Sharing',
      description: 'Share recordings through decentralized protocols',
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Starknet Wallet</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.dark.text} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'connect' && styles.activeTab]}
            onPress={() => setActiveTab('connect')}
          >
            <Text style={[styles.tabText, activeTab === 'connect' && styles.activeTabText]}>
              Connect
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'features' && styles.activeTab]}
            onPress={() => setActiveTab('features')}
          >
            <Text style={[styles.tabText, activeTab === 'features' && styles.activeTabText]}>
              Features
            </Text>
          </TouchableOpacity>
          {isConnected && (
            <TouchableOpacity
              style={[styles.tab, activeTab === 'manage' && styles.activeTab]}
              onPress={() => setActiveTab('manage')}
            >
              <Text style={[styles.tabText, activeTab === 'manage' && styles.activeTabText]}>
                Manage
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'connect' && (
            <View style={styles.tabContent}>
              {!isConnected ? (
                <>
                  <View style={styles.walletIcon}>
                    <Wallet size={64} color={colors.dark.primary} />
                  </View>
                  
                  <Text style={styles.connectTitle}>Connect Your Starknet Wallet</Text>
                  <Text style={styles.connectDescription}>
                    Connect your Starknet wallet to unlock Web3 features and join the decentralized ecosystem.
                  </Text>

                  {error && (
                    <View style={styles.errorContainer}>
                      <AlertCircle size={16} color="#FF6B6B" />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    style={[styles.connectButton, isConnecting && styles.connectButtonDisabled]}
                    onPress={handleConnect}
                    disabled={isConnecting}
                  >
                    {isConnecting ? (
                      <ActivityIndicator size="small" color={colors.dark.text} />
                    ) : (
                      <Wallet size={20} color={colors.dark.text} />
                    )}
                    <Text style={styles.connectButtonText}>
                      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.disclaimer}>
                    This is a demo implementation. In production, you would connect to actual Starknet wallets like ArgentX or Braavos.
                  </Text>
                </>
              ) : (
                <View style={styles.connectedState}>
                  <CheckCircle size={64} color="#4CAF50" />
                  <Text style={styles.connectedTitle}>Wallet Connected!</Text>
                  <Text style={styles.connectedDescription}>
                    Your Starknet wallet is now connected and ready to use.
                  </Text>
                  <TouchableOpacity
                    style={styles.manageButton}
                    onPress={() => setActiveTab('manage')}
                  >
                    <Text style={styles.manageButtonText}>Manage Wallet</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {activeTab === 'features' && (
            <View style={styles.tabContent}>
              <Text style={styles.featuresTitle}>Web3 Features</Text>
              <Text style={styles.featuresDescription}>
                Unlock these powerful Web3 capabilities by connecting your Starknet wallet:
              </Text>

              {web3Features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <feature.icon size={24} color={colors.dark.primary} />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </View>
                </View>
              ))}

              {!isConnected && (
                <TouchableOpacity
                  style={styles.getStartedButton}
                  onPress={() => setActiveTab('connect')}
                >
                  <Text style={styles.getStartedButtonText}>Get Started</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {activeTab === 'manage' && isConnected && (
            <View style={styles.tabContent}>
              <Text style={styles.manageTitle}>Wallet Management</Text>
              
              <View style={styles.walletInfo}>
                <View style={styles.walletInfoRow}>
                  <Text style={styles.walletInfoLabel}>Address:</Text>
                  <Text style={styles.walletInfoValue}>{formatAddress(account!)}</Text>
                </View>
                <View style={styles.walletInfoRow}>
                  <Text style={styles.walletInfoLabel}>Balance:</Text>
                  <Text style={styles.walletInfoValue}>{formatBalance(balance)} ETH</Text>
                </View>
                <View style={styles.walletInfoRow}>
                  <Text style={styles.walletInfoLabel}>Network:</Text>
                  <Text style={styles.walletInfoValue}>Starknet Testnet</Text>
                </View>
              </View>

              <View style={styles.manageActions}>
                <TouchableOpacity style={styles.refreshButton} onPress={loadBalance}>
                  <Text style={styles.refreshButtonText}>Refresh Balance</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
                  <Text style={styles.disconnectButtonText}>Disconnect Wallet</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.dark.text,
  },
  closeButton: {
    padding: 8,
  },
  tabs: {
    flexDirection: 'row' as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.dark.border,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 16,
    borderRadius: 20,
    backgroundColor: colors.dark.card,
  },
  activeTab: {
    backgroundColor: colors.dark.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.dark.textSecondary,
  },
  activeTabText: {
    color: colors.dark.text,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  walletIcon: {
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  connectTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.dark.text,
    textAlign: 'center' as const,
    marginBottom: 12,
  },
  connectDescription: {
    fontSize: 16,
    color: colors.dark.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 24,
    marginBottom: 32,
  },
  errorContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
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
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.dark.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 20,
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    color: colors.dark.text,
    fontSize: 16,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  disclaimer: {
    fontSize: 12,
    color: colors.dark.textSecondary,
    textAlign: 'center' as const,
    fontStyle: 'italic' as const,
  },
  connectedState: {
    alignItems: 'center' as const,
    paddingVertical: 40,
  },
  connectedTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.dark.text,
    marginTop: 16,
    marginBottom: 8,
  },
  connectedDescription: {
    fontSize: 16,
    color: colors.dark.textSecondary,
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  manageButton: {
    backgroundColor: colors.dark.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  manageButtonText: {
    color: colors.dark.text,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  featuresTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.dark.text,
    marginBottom: 12,
  },
  featuresDescription: {
    fontSize: 16,
    color: colors.dark.textSecondary,
    lineHeight: 24,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 24,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.dark.card,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.dark.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.dark.textSecondary,
    lineHeight: 20,
  },
  getStartedButton: {
    backgroundColor: colors.dark.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center' as const,
    marginTop: 20,
  },
  getStartedButtonText: {
    color: colors.dark.text,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  manageTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.dark.text,
    marginBottom: 24,
  },
  walletInfo: {
    backgroundColor: colors.dark.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  walletInfoRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  walletInfoLabel: {
    fontSize: 16,
    color: colors.dark.textSecondary,
  },
  walletInfoValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.dark.text,
  },
  manageActions: {
    gap: 12,
  },
  refreshButton: {
    backgroundColor: colors.dark.card,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  refreshButtonText: {
    color: colors.dark.text,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  disconnectButton: {
    backgroundColor: '#FF6B6B20',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center' as const,
  },
  disconnectButtonText: {
    color: '#FF6B6B',
    fontSize: 16,
    fontWeight: '600' as const,
  },
};