import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { blockchain, type SupportedChains, type BaseChainConfig } from '../utils/starknet';
import { ALL_CHAINS } from '@voisss/shared';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../store/settingsStore';

interface ChainSelectorProps {
  onChainSelected?: (chain: SupportedChains, network: string) => void;
  showNetworks?: boolean;
}

export const ChainSelector: React.FC<ChainSelectorProps> = ({
  onChainSelected,
  showNetworks = true,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { selectedChain, setSelectedChain } = useSettingsStore();
  const [selectedNetwork, setSelectedNetwork] = useState<string>('MAINNET');
  const [currentChainConfig, setCurrentChainConfig] = useState<BaseChainConfig | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const loadCurrentChain = async () => {
      try {
        // Get the current chain config based on selectedChain from settings
        const chain = selectedChain;
        const network = 'MAINNET'; // Default to MAINNET for now
        setSelectedNetwork(network);

        const config = ALL_CHAINS[chain][network as keyof typeof ALL_CHAINS[SupportedChains]];
        setCurrentChainConfig(config);
      } catch (error) {
        console.error('Failed to load current chain:', error);
      }
    };

    loadCurrentChain();
  }, [selectedChain]);

  const handleChainSelect = async (chain: SupportedChains, network: string) => {
    try {
      // Update the selected chain in settings store
      // Ensure chain is one of the supported types
      if (chain === 'base' || chain === 'scroll' || chain === 'starknet') {
        setSelectedChain(chain);
      }
      setSelectedNetwork(network);
      setModalVisible(false);

      const config = ALL_CHAINS[chain][network as keyof typeof ALL_CHAINS[SupportedChains]];
      setCurrentChainConfig(config);

      onChainSelected?.(chain, network);
    } catch (error) {
      console.error('Failed to switch chain:', error);
    }
  };

  const availableChains = Object.entries(ALL_CHAINS) as [SupportedChains, Record<string, BaseChainConfig>][];

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.chainButton, { paddingTop: insets.top + 10 }]}
        onPress={() => setModalVisible(true)}
      >
        {currentChainConfig ? (
          <>
            <View style={styles.chainInfo}>
              <Ionicons
                name={selectedChain === 'starknet' ? 'diamond' : selectedChain === 'base' ? 'rocket' : 'layers'}
                size={20}
                color="white"
                style={styles.chainIcon}
              />
              <Text style={styles.chainText}>
                {currentChainConfig.chainName}
                {showNetworks && ` (${selectedNetwork})`}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={20} color="white" />
          </>
        ) : (
          <Text style={styles.chainText}>Select Chain</Text>
        )}
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.modalTitle}>Select Blockchain</Text>

            {availableChains.map(([chain, networks]) => (
              <View key={chain} style={styles.chainGroup}>
                <Text style={styles.chainGroupTitle}>{chain.charAt(0).toUpperCase() + chain.slice(1)}</Text>

                {Object.entries(networks).map(([networkKey, networkConfig]) => {
                  const config = networkConfig as BaseChainConfig;
                  return (
                    <TouchableOpacity
                      key={`${String(chain)}-${networkKey}`}
                      style={styles.networkButton}
                      onPress={() => handleChainSelect(chain, networkKey)}
                    >
                      <View style={styles.networkInfo}>
                        <Ionicons
                          name={chain === 'starknet' ? 'diamond' : chain === 'base' ? 'rocket' : 'layers'}
                          size={18}
                          color={config.isTestnet ? '#FFA500' : '#4CAF50'}
                        />
                        <Text style={styles.networkText}>
                          {config.chainName}
                          {config.isTestnet && ' (Testnet)'}
                        </Text>
                      </View>
                      {(selectedChain === chain && selectedNetwork === networkKey) && (
                        <Ionicons name="checkmark" size={20} color="#4CAF50" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1000,
  },
  chainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingRight: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    margin: 10,
  },
  chainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  chainIcon: {
    marginRight: 6,
  },
  chainText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  chainGroup: {
    marginBottom: 20,
  },
  chainGroupTitle: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  networkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#2a2a2a',
    borderRadius: 10,
    marginBottom: 8,
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
  },
  closeButton: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
