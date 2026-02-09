
import { describe, it, expect } from 'vitest';
import { X402Client } from './x402Client';
import { getAddress } from 'viem';

// The hardcoded fallback address within x402Client.ts
const EXPECTED_FALLBACK = '0xA6a8736f18f383f1cc2d938576933E5eA7Df01A1';

describe('X402Client', () => {
    const client = new X402Client();
    const resource = 'https://voisss.ai/api/v1/voice/generate';
    const amount = '$0.01';

    it('should checksum a lowercase address', () => {
        // known address: 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 (hardhat account 0)
        const lowercaseAddr = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
        const checksummed = getAddress(lowercaseAddr);

        const req = client.createRequirements(resource, amount, lowercaseAddr);

        expect(req.payTo).toBe(checksummed);
        expect(req.payTo).not.toBe(lowercaseAddr);
    });

    it('should handle addresses with whitespace', () => {
        const validAddr = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
        const dirtyAddr = `  ${validAddr}  `;

        const req = client.createRequirements(resource, amount, dirtyAddr);

        expect(req.payTo).toBe(validAddr);
    });

    it('should fallback to default if payTo is empty string', () => {
        const emptyAddr = '';

        // Console warn is expected here
        const req = client.createRequirements(resource, amount, emptyAddr);

        expect(req.payTo).toBe(EXPECTED_FALLBACK);
    });

    it('should fallback to default if payTo is invalid format', () => {
        const invalidAddr = 'not-an-address';

        // Console error is expected here
        const req = client.createRequirements(resource, amount, invalidAddr);

        expect(req.payTo).toBe(EXPECTED_FALLBACK);
    });

    it('should format amount correctly', () => {
        const req = client.createRequirements(resource, '$1.50', EXPECTED_FALLBACK);

        // 1.50 * 1,000,000 = 1,500,000
        expect(req.maxAmountRequired).toBe('1500000');
    });

    it('should handle bigint amount correctly', () => {
        const amount = 124n; // 124 wei
        const req = client.createRequirements(resource, amount, EXPECTED_FALLBACK);

        expect(req.maxAmountRequired).toBe('124');
    });

    it('should use CAIP-2 network identifier', () => {
        const req = client.createRequirements(resource, amount, EXPECTED_FALLBACK);
        // Expecting 'eip155:8453' for base (default)
        expect(req.network).toBe('eip155:8453');
    });
});
