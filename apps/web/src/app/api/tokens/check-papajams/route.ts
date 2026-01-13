import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, getContract } from 'viem';
import { base } from 'viem/chains';

// PapaJams Creator Token Contract ABI (minimal)
const PAPAJAMS_TOKEN_ABI = [
    {
        inputs: [{ name: 'account', type: 'address' }],
        name: 'balanceOf',
        outputs: [{ name: '', type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

// PapaJams Creator Token Contract Address (to be deployed)
const PAPAJAMS_TOKEN_ADDRESS = process.env.PAPAJAMS_TOKEN_ADDRESS as `0x${string}`;

export async function POST(req: NextRequest) {
    try {
        const { address } = await req.json();

        if (!address) {
            return NextResponse.json({ error: 'Address required' }, { status: 400 });
        }

        // If PapaJams token not deployed yet, return false
        if (!PAPAJAMS_TOKEN_ADDRESS) {
            return NextResponse.json({
                hasPapaJamsToken: false,
                balance: '0',
                note: 'PapaJams Creator Token not yet deployed'
            });
        }

        // Create public client for Base chain
        const publicClient = createPublicClient({
            chain: base,
            transport: http(),
        });

        // Get PapaJams token contract
        const papaJamsContract = getContract({
            address: PAPAJAMS_TOKEN_ADDRESS,
            abi: PAPAJAMS_TOKEN_ABI,
            client: publicClient,
        });

        // Check user's PapaJams token balance
        const balance = await papaJamsContract.read.balanceOf([address as `0x${string}`]);
        const hasPapaJamsToken = balance > 0n;

        return NextResponse.json({
            hasPapaJamsToken,
            balance: balance.toString(),
            contractAddress: PAPAJAMS_TOKEN_ADDRESS,
        });

    } catch (error) {
        console.error('Error checking PapaJams token:', error);
        return NextResponse.json(
            {
                error: 'Failed to check PapaJams token',
                hasPapaJamsToken: false,
                balance: '0'
            },
            { status: 500 }
        );
    }
}