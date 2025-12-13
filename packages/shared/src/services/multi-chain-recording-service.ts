/**
 * Multi-Chain Recording Service
 * 
 * Chain-agnostic abstraction that routes to the appropriate blockchain service
 * based on user selection. Supports Base, Scroll, and Starknet chains.
 */

import { BaseRecordingService, BaseRecordingMetadata, SaveRecordingResponse } from './baseRecordingService';
import { blockchainService, SupportedChains } from '../blockchain';

// Define the interface for chain-specific recording services
export interface ChainRecordingService {
    saveRecording(ipfsHash: string, metadata: BaseRecordingMetadata): Promise<string>;
    // Add other chain-specific methods as needed
}

// Base chain service (already exists)
export class BaseChainRecordingService implements ChainRecordingService {
    private baseService: BaseRecordingService;

    constructor(baseService: BaseRecordingService) {
        this.baseService = baseService;
    }

    async saveRecording(ipfsHash: string, metadata: BaseRecordingMetadata): Promise<string> {
        return this.baseService.saveRecording(ipfsHash, metadata);
    }
}

// Scroll chain service (to be implemented)
export class ScrollChainRecordingService implements ChainRecordingService {
    async saveRecording(ipfsHash: string, metadata: BaseRecordingMetadata): Promise<string> {
        // Implement Scroll-specific recording logic
        // For now, use the blockchain service's privacy features
        const result = await blockchainService.createPrivateRecording(ipfsHash, 'user-address');
        return result.transactionHash;
    }
}

// Starknet chain service (to be implemented)
export class StarknetChainRecordingService implements ChainRecordingService {
    async saveRecording(ipfsHash: string, metadata: BaseRecordingMetadata): Promise<string> {
        // Implement Starknet-specific recording logic
        // This would use the existing Starknet recording service
        throw new Error('Starknet recording service not yet implemented for mobile');
    }
}

// Multi-chain service factory
export class MultiChainRecordingService {
    private services: Record<SupportedChains, ChainRecordingService>;
    private currentChain: SupportedChains;

    constructor(initialChain: SupportedChains = 'base') {
        this.currentChain = initialChain;
        this.services = {
            base: new BaseChainRecordingService(new (require('./baseRecordingService').BaseRecordingServiceImpl)(
                'user-address',
                'contract-address',
                'backend-url',
                () => null
            )),
            scroll: new ScrollChainRecordingService(),
            starknet: new StarknetChainRecordingService(),
        };
    }

    // Set the current chain
    setChain(chain: SupportedChains): void {
        if (!this.services[chain]) {
            throw new Error(`Chain ${chain} is not supported`);
        }
        this.currentChain = chain;
    }

    // Get the current chain
    getCurrentChain(): SupportedChains {
        return this.currentChain;
    }

    // Save recording to the current chain
    async saveRecording(ipfsHash: string, metadata: BaseRecordingMetadata): Promise<string> {
        const service = this.services[this.currentChain];
        if (!service) {
            throw new Error(`No recording service available for chain ${this.currentChain}`);
        }
        return service.saveRecording(ipfsHash, metadata);
    }

    // Create a multi-chain service instance
    static create(initialChain: SupportedChains = 'base'): MultiChainRecordingService {
        return new MultiChainRecordingService(initialChain);
    }
}

// Factory function for easy integration
export function createMultiChainRecordingService(
    initialChain: SupportedChains = 'base'
): MultiChainRecordingService {
    return MultiChainRecordingService.create(initialChain);
}