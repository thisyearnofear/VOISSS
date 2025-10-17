export const VoiceRecordsABI = [
{
"anonymous": false,
"inputs": [
{
"indexed": true,
"internalType": "uint256",
"name": "recordingId",
"type": "uint256"
},
{
"indexed": true,
"internalType": "address",
"name": "owner",
"type": "address"
},
{
"indexed": false,
"internalType": "string",
"name": "ipfsHash",
"type": "string"
},
{
"indexed": false,
"internalType": "string",
"name": "title",
"type": "string"
},
{
"indexed": false,
"internalType": "bool",
"name": "isPublic",
"type": "bool"
}
],
"name": "RecordingSaved",
"type": "event"
},
{
"inputs": [
{
"internalType": "string",
"name": "ipfsHash",
"type": "string"
},
{
"internalType": "string",
"name": "title",
"type": "string"
},
{
"internalType": "bool",
"name": "isPublic",
"type": "bool"
}
],
"name": "saveRecording",
"outputs": [
{
"internalType": "uint256",
"name": "recordingId",
"type": "uint256"
}
],
"stateMutability": "nonpayable",
"type": "function"
},
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "recordingId",
        "type": "uint256"
      }
    ],
    "name": "getRecording",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "ipfsHash",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "isPublic",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getUserRecordings",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalRecordings",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "recordings",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "ipfsHash",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "title",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "isPublic",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "userRecordings",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalRecordings",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
