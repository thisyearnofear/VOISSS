// Blockchain API Routes for VOISSS
const { spenderWallet, getSpenderAddress } = require('./spender-wallet');
const { VoiceRecordsABI } = require('./contracts');

const VOICE_RECORDS_CONTRACT = process.env.NEXT_PUBLIC_VOICE_RECORDS_CONTRACT;
if (!VOICE_RECORDS_CONTRACT) {
  console.error('NEXT_PUBLIC_VOICE_RECORDS_CONTRACT environment variable is required');
}

function setupBlockchainRoutes(app) {
  // Gasless Recording Save API
  app.post('/api/base/save-recording', async (req, res) => {
    try {
      const { userAddress, permissionHash, ipfsHash, title, isPublic } = req.body;

      // Validate inputs
      if (!userAddress || !permissionHash || !ipfsHash || !title) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      console.log('📝 Processing gasless save for user:', userAddress);

      // Prepare the contract call data
      const contractCallData = {
        abi: VoiceRecordsABI,
        functionName: 'saveRecording',
        args: [ipfsHash, title, isPublic],
      };

      console.log('🔨 Executing transaction with spender wallet...');

      // Execute the transaction using spender wallet
      const recordingTxHash = await spenderWallet.sendTransaction({
        to: VOICE_RECORDS_CONTRACT,
        data: contractCallData,
      });

      console.log('✅ Recording saved:', recordingTxHash);

      // Wait for confirmation
      const receipt = await spenderWallet.waitForTransactionReceipt({
        hash: recordingTxHash,
      });

      res.json({
        success: true,
        txHash: recordingTxHash,
        status: receipt.status,
        blockNumber: receipt.blockNumber.toString(),
      });

    } catch (error) {
      console.error('❌ Gasless save failed:', error);

      // Provide user-friendly error messages
      let errorMessage = 'Failed to save recording';
      let statusCode = 500;

      if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Spender wallet has insufficient funds. Please contact support.';
        statusCode = 503;
      } else if (error.message?.includes('permission')) {
        errorMessage = 'Invalid or expired spend permission';
        statusCode = 403;
      } else if (error.message?.includes('revert')) {
        errorMessage = 'Contract execution failed. Please try again.';
        statusCode = 400;
      }

      res.status(statusCode).json({
        error: errorMessage,
        details: error.message,
      });
    }
  });

  // Spender wallet health check
  app.get('/api/base/save-recording', async (req, res) => {
    try {
      const balance = await spenderWallet.getBalance({
        address: getSpenderAddress(),
      });

      res.json({
        status: 'healthy',
        spenderAddress: getSpenderAddress(),
        balance: balance.toString(),
        chain: 'base',
        chainId: 8453,
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: error.message,
      });
    }
  });
}

module.exports = { setupBlockchainRoutes };
