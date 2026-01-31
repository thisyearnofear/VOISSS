export const ReputationRegistryABI = [
  {
    "inputs": [],
    "name": "AgentCannotRateSelf",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "FeedbackNotFound",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidFeedback",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "agentId",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "clientAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "feedbackIndex",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "int128",
        "name": "value",
        "type": "int128"
      },
      {
        "indexed": false,
        "internalType": "uint8",
        "name": "valueDecimals",
        "type": "uint8"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "tag1",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "tag2",
        "type": "string"
      }
    ],
    "name": "NewFeedback",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "agentId",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "clientAddress",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "feedbackIndex",
        "type": "uint256"
      }
    ],
    "name": "FeedbackRevoked",
    "type": "event"
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
    "name": "agentFeedback",
    "outputs": [
      {
        "internalType": "address",
        "name": "client",
        "type": "address"
      },
      {
        "internalType": "int128",
        "name": "value",
        "type": "int128"
      },
      {
        "internalType": "uint8",
        "name": "valueDecimals",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "tag1",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "tag2",
        "type": "string"
      },
      {
        "internalType": "uint64",
        "name": "timestamp",
        "type": "uint64"
      },
      {
        "internalType": "bool",
        "name": "isRevoked",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "agentId",
        "type": "address"
      },
      {
        "internalType": "int128",
        "name": "value",
        "type": "int128"
      },
      {
        "internalType": "uint8",
        "name": "valueDecimals",
        "type": "uint8"
      },
      {
        "internalType": "string",
        "name": "tag1",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "tag2",
        "type": "string"
      }
    ],
    "name": "giveFeedback",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "feedbackIndex",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "agentId",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "feedbackIndex",
        "type": "uint256"
      }
    ],
    "name": "revokeFeedback",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "agentId",
        "type": "address"
      }
    ],
    "name": "getAgentFeedback",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "client",
            "type": "address"
          },
          {
            "internalType": "int128",
            "name": "value",
            "type": "int128"
          },
          {
            "internalType": "uint8",
            "name": "valueDecimals",
            "type": "uint8"
          },
          {
            "internalType": "string",
            "name": "tag1",
            "type": "string"
          },
          {
            "internalType": "string",
            "name": "tag2",
            "type": "string"
          },
          {
            "internalType": "uint64",
            "name": "timestamp",
            "type": "uint64"
          },
          {
            "internalType": "bool",
            "name": "isRevoked",
            "type": "bool"
          }
        ],
        "internalType": "struct ReputationRegistry.Feedback[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "agentId",
        "type": "address"
      }
    ],
    "name": "getFeedbackCount",
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
        "internalType": "address",
        "name": "agentId",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "category",
        "type": "string"
      }
    ],
    "name": "getCategoryScore",
    "outputs": [
      {
        "internalType": "int256",
        "name": "",
        "type": "int256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "agentId",
        "type": "address"
      }
    ],
    "name": "getAverageReputation",
    "outputs": [
      {
        "internalType": "int256",
        "name": "averageScore",
        "type": "int256"
      },
      {
        "internalType": "uint256",
        "name": "count",
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
        "name": "client",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "agent",
        "type": "address"
      }
    ],
    "name": "hasFeedback",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "category",
        "type": "string"
      },
      {
        "internalType": "address[]",
        "name": "agentList",
        "type": "address[]"
      }
    ],
    "name": "getTopAgentsByCategory",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "sortedAgents",
        "type": "address[]"
      },
      {
        "internalType": "int256[]",
        "name": "scores",
        "type": "int256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];
