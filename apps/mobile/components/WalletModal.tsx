import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Wallet, Shield, Zap, Globe, CheckCircle, AlertCircle } from 'lucide-react-native';
import { colors } from "@voisss/ui";
import { useBase } from '../hooks/useBase';
import { BaseModal } from "@voisss/ui/src/components/BaseModal";

interface WalletModalProps {
  visible: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export function WalletModal({ visible, onClose, onConnected }: WalletModalProps) {
  const { isConnected, isConnecting, account, error, connect, disconnect } = useBase();
  const [balance, setBalance] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'connect' | 'features' | 'manage'>('connect');

  useEffect(() => {
    if (isConnected && account) {
      setActiveTab('manage');
      // Balance loading is commented out since getBalance function is not properly defined
      // loadBalance();
      onConnected?.();
    }
  }, [isConnected, account]);

  // Commented out since getBalance function is not properly defined
  /*
  const loadBalance = async () => {
    try {
      const bal = await getBalance();
      setBalance(bal);
    } catch (err) {
      console.error('Failed to load balance:', err);
    }
  };
  */

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      Alert.alert(
        'Connection Failed',
        'Failed to connect to Base wallet. Please try again.',
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
      description: 'Store your recordings permanently on Base',
    },
    {
      icon: Globe,
      title: 'On-Chain Storage',
      description: 'Store recording metadata permanently on blockchain',
    },
    {
      icon: Zap,
      title: 'Base Rewards',
      description: 'Earn rewards for participating in the ecosystem',
    },
  ];

  const renderConnectTab = () => (
    <View style={{ padding: 16 }}>
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <Wallet size={48} color={colors.dark.primary} style={{ marginBottom: 16 }} />
        <Text style={{ 
          fontSize: 20, 
          fontWeight: '600', 
          color: colors.dark.text, 
          textAlign: 'center',
          marginBottom: 8
        }}>
          Connect Your Wallet
        </Text>
        <Text style={{ 
          fontSize: 16, 
          color: colors.dark.textSecondary, 
          textAlign: 'center',
          lineHeight: 24
        }}>
          Connect your Base wallet to unlock Web3 features and earn rewards
        </Text>
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: colors.dark.primary,
          padding: 16,
          borderRadius: 12,
          alignItems: 'center',
          marginBottom: 16,
        }}
        onPress={handleConnect}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <ActivityIndicator color={colors.dark.text} />
        ) : (
          <>
            <Wallet size={24} color={colors.dark.text} style={{ marginBottom: 8 }} />
            <Text style={{ 
              color: colors.dark.text, 
              fontWeight: '600', 
              fontSize: 16 
            }}>
              Connect Wallet
            </Text>
          </>
        )}
      </TouchableOpacity>

      {error && (
        <View style={{
          backgroundColor: 'rgba(255, 82, 82, 0.1)',
          borderColor: colors.dark.error,
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          <AlertCircle size={20} color={colors.dark.error} style={{ marginRight: 8 }} />
          <Text style={{ color: colors.dark.error }}>{error || 'Connection failed'}</Text>
        </View>
      )}

      <View style={{ marginTop: 24 }}>
        <Text style={{ 
          fontSize: 16, 
          fontWeight: '600', 
          color: colors.dark.text, 
          marginBottom: 12 
        }}>
          Why Connect?
        </Text>
        {web3Features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <View key={index} style={{ 
              flexDirection: 'row', 
              alignItems: 'flex-start', 
              marginBottom: 16 
            }}>
              <IconComponent size={20} color={colors.dark.primary} style={{ marginRight: 12, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: '500', 
                  color: colors.dark.text, 
                  marginBottom: 4 
                }}>
                  {feature.title}
                </Text>
                <Text style={{ 
                  fontSize: 14, 
                  color: colors.dark.textSecondary 
                }}>
                  {feature.description}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderManageTab = () => (
    <View style={{ padding: 16 }}>
      <View style={{ 
        backgroundColor: colors.dark.card, 
        borderRadius: 12, 
        padding: 16, 
        marginBottom: 24 
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.dark.primary,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
          }}>
            <Wallet size={20} color={colors.dark.text} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: '600', 
              color: colors.dark.text 
            }}>
              Connected
            </Text>
            {account?.address && (
              <Text style={{ 
                fontSize: 14, 
                color: colors.dark.textSecondary 
              }}>
                {formatAddress(account.address)}
              </Text>
            )}
          </View>
          <CheckCircle size={24} color={colors.dark.success} />
        </View>

        {/* Balance display commented out since getBalance is not properly implemented */}
        {/* 
        <View style={{ 
          backgroundColor: colors.dark.background, 
          borderRadius: 8, 
          padding: 12 
        }}>
          <Text style={{ 
            fontSize: 14, 
            color: colors.dark.textSecondary, 
            marginBottom: 4 
          }}>
            Balance
          </Text>
          <Text style={{ 
            fontSize: 24, 
            fontWeight: '600', 
            color: colors.dark.text 
          }}>
            {formatBalance(balance)} ETH
          </Text>
        </View>
        */}
      </View>

      <TouchableOpacity
        style={{
          backgroundColor: colors.dark.card,
          padding: 16,
          borderRadius: 12,
          alignItems: 'center',
          marginBottom: 16,
        }}
        onPress={handleDisconnect}
      >
        <Text style={{ 
          color: colors.dark.error, 
          fontWeight: '600', 
          fontSize: 16 
        }}>
          Disconnect Wallet
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <BaseModal
      visible={visible}
      onClose={onClose}
      title={activeTab === 'connect' ? 'Connect Wallet' : 'Wallet Connected'}
    >
      <ScrollView>
        {activeTab === 'connect' ? renderConnectTab() : renderManageTab()}
      </ScrollView>
    </BaseModal>
  );
}