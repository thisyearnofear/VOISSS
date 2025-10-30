const VoiceRecordsABI = [
  {
    inputs: [
      { internalType: 'string', name: 'ipfsHash', type: 'string' },
      { internalType: 'string', name: 'title', type: 'string' },
      { internalType: 'bool', name: 'isPublic', type: 'bool' }
    ],
    name: 'saveRecording',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
];

module.exports = { VoiceRecordsABI };
