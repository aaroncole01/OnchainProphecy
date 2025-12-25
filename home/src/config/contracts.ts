export const PROPHECY_ADDRESS = '0x1D6902b2a6C5D55D32bDB25Cb0dF41D25dEFEF1c' as const; // Replace with Sepolia deployment address

export const PROPHECY_ABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "day",
        "type": "uint256"
      }
    ],
    "name": "CannotResolveYet",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "day",
        "type": "uint256"
      }
    ],
    "name": "DayAlreadyLocked",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidAsset",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotAuthorized",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "day",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "enum OnchainProphecy.Asset",
        "name": "asset",
        "type": "uint8"
      }
    ],
    "name": "PredictionAlreadyResolved",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "day",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "enum OnchainProphecy.Asset",
        "name": "asset",
        "type": "uint8"
      }
    ],
    "name": "PredictionExists",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "day",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "enum OnchainProphecy.Asset",
        "name": "asset",
        "type": "uint8"
      }
    ],
    "name": "PredictionMissing",
    "type": "error"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "day",
        "type": "uint256"
      }
    ],
    "name": "PriceNotRecorded",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "PriceTooLarge",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ReentrancyDetected",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "StakeRequired",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "StakeTooLarge",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "ZamaProtocolUnsupported",
    "type": "error"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "euint64",
        "name": "totalPoints",
        "type": "bytes32"
      }
    ],
    "name": "PointsUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "enum OnchainProphecy.Asset",
        "name": "asset",
        "type": "uint8"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "day",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "stake",
        "type": "uint256"
      }
    ],
    "name": "PredictionPlaced",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "enum OnchainProphecy.Asset",
        "name": "asset",
        "type": "uint8"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "day",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "stake",
        "type": "uint256"
      }
    ],
    "name": "PredictionResolved",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "day",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "ethPrice",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "btcPrice",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "updatedAt",
        "type": "uint256"
      }
    ],
    "name": "PricesUpdated",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "PRICE_DECIMALS",
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
    "name": "confidentialProtocolId",
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
        "name": "day",
        "type": "uint256"
      },
      {
        "internalType": "enum OnchainProphecy.Asset",
        "name": "asset",
        "type": "uint8"
      }
    ],
    "name": "confirmPrediction",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentDay",
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
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "day",
        "type": "uint256"
      },
      {
        "internalType": "enum OnchainProphecy.Asset",
        "name": "asset",
        "type": "uint8"
      }
    ],
    "name": "getPrediction",
    "outputs": [
      {
        "components": [
          {
            "internalType": "euint64",
            "name": "price",
            "type": "bytes32"
          },
          {
            "internalType": "euint8",
            "name": "direction",
            "type": "bytes32"
          },
          {
            "internalType": "ebool",
            "name": "outcome",
            "type": "bytes32"
          },
          {
            "internalType": "uint256",
            "name": "stake",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "day",
            "type": "uint256"
          },
          {
            "internalType": "bool",
            "name": "exists",
            "type": "bool"
          },
          {
            "internalType": "bool",
            "name": "resolved",
            "type": "bool"
          }
        ],
        "internalType": "struct OnchainProphecy.Prediction",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPriceDecimals",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "day",
        "type": "uint256"
      }
    ],
    "name": "getPricesForDay",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "ethPrice",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "btcPrice",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "updatedAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct OnchainProphecy.PricePoint",
        "name": "",
        "type": "tuple"
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
    "name": "getUserPoints",
    "outputs": [
      {
        "internalType": "euint64",
        "name": "",
        "type": "bytes32"
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
      },
      {
        "internalType": "enum OnchainProphecy.Asset",
        "name": "asset",
        "type": "uint8"
      }
    ],
    "name": "getUserPredictionDays",
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
    "name": "lastRecordedDay",
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
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "enum OnchainProphecy.Asset",
        "name": "asset",
        "type": "uint8"
      },
      {
        "internalType": "externalEuint64",
        "name": "encryptedPrice",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint8",
        "name": "encryptedDirection",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "placePrediction",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "day",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "ethPrice",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "btcPrice",
        "type": "uint256"
      }
    ],
    "name": "updatePrices",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
