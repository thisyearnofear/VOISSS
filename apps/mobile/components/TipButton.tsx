import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { blockchain, type TipTransaction } from '../utils/starknet';
import { formatEther, parseEther } from 'ethers';

interface TipButtonProps {
  recipientAddress: string;
  recipientName?: string;
  onTipSent?: (transaction: TipTransaction, txHash: string) => void;
  onError?: (error: Error) => void;
  tokenAddress?: string; // Optional ERC20 token for tipping
  presetAmounts?: string[]; // Preset tip amounts in ETH
}

export const TipButton: React.FC<TipButtonProps> = ({ 
  recipientAddress,
  recipientName = 'Creator',
  onTipSent,
  onError,
  tokenAddress,
  presetAmounts = ['0.001', '0.005', '0.01', '0.05'],
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [tipAmount, setTipAmount] = useState('0.01');
  const [customAmount, setCustomAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState('');
  const [balance, setBalance] = useState('0');
  const [currentChain, setCurrentChain] = useState('starknet');

  useEffect(() => {
    const loadData = async () => {
      try {
        const chain = await blockchain.getStoredChain();
        setCurrentChain(chain);
        
        const address = await blockchain.getStoredWalletAddress();
        if (address) {
          const bal = tokenAddress 
            ? await blockchain.getTokenBalance(address, tokenAddress)
            : await blockchain.getBalance(address);
          setBalance(formatEther(bal));
        }
      } catch (error) {
        console.error('Failed to load tip data:', error);
        onError?.(error as Error);
      }
    };
    
    loadData();
  }, [tokenAddress]);

  const handleTipAmountSelect = (amount: string) => {
    setTipAmount(amount);
    setCustomAmount(amount);
    
    // Estimate cost when amount changes
    estimateTipCost(amount);
  };

  const estimateTipCost = async (amount: string) => {
    try {
      const cost = await blockchain.estimateTipCost(
        parseEther(amount).toString(),
        tokenAddress
      );
      setEstimatedCost(formatEther(cost));
    } catch (error) {
      console.error('Failed to estimate tip cost:', error);
      setEstimatedCost('0');
    }
  };

  const handleSendTip = async () => {
    if (!recipientAddress) {
      onError?.(new Error('Recipient address is required'));
      return;
    }
    
    if (parseFloat(tipAmount) <= 0) {
      onError?.(new Error('Tip amount must be greater than 0'));
      return;
    }
    
    if (parseFloat(tipAmount) > parseFloat(balance)) {
      onError?.(new Error('Insufficient balance'));
      return;
    }
    
    try {
      setIsSending(true);
      
      const amountWei = parseEther(tipAmount).toString();
      const txHash = await blockchain.sendTip(recipientAddress, amountWei, tokenAddress);
      
      // Create tip transaction record
      const chainConfig = await blockchain.getCurrentChainConfig();
      const tipTransaction: TipTransaction = {
        from: await blockchain.getStoredWalletAddress() || '',
        to: recipientAddress,
        amount: amountWei,
        token: tokenAddress,
        chain: currentChain,
        network: await blockchain.getStoredNetwork() || 'TESTNET',
        timestamp: Date.now(),
        message: `Tip to ${recipientName}`,
      };
      
      setModalVisible(false);
      setIsSending(false);
      setTipAmount('0.01');
      setCustomAmount('');
      
      onTipSent?.(tipTransaction, txHash);
    } catch (error) {
      console.error('Failed to send tip:', error);
      setIsSending(false);
      onError?.(error as Error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.tipButton}
        onPress={() => setModalVisible(true)}
        disabled={isSending}
      >
        {isSending ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <Ionicons name="heart" size={18} color="white" style={styles.heartIcon} />
            <Text style={styles.tipButtonText}>Tip {recipientName}</Text>
          </>
        )}
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send a Tip to {recipientName}</Text>
            
            <Text style={styles.balanceText}>
              Your Balance: {parseFloat(balance).toFixed(4)} {tokenAddress ? 'TOKEN' : 'ETH'}
            </Text>
            
            <Text style={styles.amountLabel}>Select Amount:</Text>
            <View style={styles.presetContainer}>
              {presetAmounts.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.presetButton,
                    tipAmount === amount && styles.presetButtonSelected
                  ]}
                  onPress={() => handleTipAmountSelect(amount)}
                >
                  <Text style={styles.presetButtonText}>
                    {amount} {tokenAddress ? 'TOKEN' : 'ETH'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.amountLabel}>Or enter custom amount:</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.amountInput}
                keyboardType="decimal-pad"
                placeholder="0.00"
                value={customAmount}
                onChangeText={(text) => {
                  setCustomAmount(text);
                  if (text === '' || parseFloat(text) <= 0) return;
                  handleTipAmountSelect(text);
                }}
              />
              <Text style={styles.currencyText}>{tokenAddress ? 'TOKEN' : 'ETH'}</Text>
            </View>
            
            {estimatedCost !== '' && (
              <Text style={styles.estimatedCost}>
                Estimated Gas: ~{parseFloat(estimatedCost).toFixed(6)} ETH
              </Text>
            )}
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                (parseFloat(tipAmount) > parseFloat(balance) || isSending) && styles.sendButtonDisabled
              ]}
              onPress={handleSendTip}
              disabled={parseFloat(tipAmount) > parseFloat(balance) || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.sendButtonText}>
                  Send {tipAmount} {tokenAddress ? 'TOKEN' : 'ETH'} Tip
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
              disabled={isSending}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 8,
  },
  tipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  heartIcon: {
    marginRight: 8,
  },
  tipButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  balanceText: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  amountLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  presetButton: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 10,
    width: '48%',
    marginBottom: 8,
    alignItems: 'center',
  },
  presetButtonSelected: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF8E8E',
    borderWidth: 1,
  },
  presetButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  amountInput: {
    flex: 1,
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  currencyText: {
    color: '#aaa',
    fontSize: 16,
    marginLeft: 8,
  },
  estimatedCost: {
    color: '#FFD700',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'right',
  },
  sendButton: {
    backgroundColor: '#FF6B6B',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.7,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#444',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});
