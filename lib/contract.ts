export const TRUSTLEDGER_ADDRESS = "0xA10bce27058FA1fE345f4326a61E1b24B9267C08";
export const TRUSTLEDGER_ABI = [
  {
    inputs: [
      { internalType: "string", name: "_credentialHash", type: "string" },
      { internalType: "uint256", name: "_score", type: "uint256" },
    ],
    name: "mintCredential",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "_id", type: "uint256" }],
    name: "verifyCredential",
    outputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "string", name: "credentialHash", type: "string" },
      { internalType: "uint256", name: "score", type: "uint256" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "_owner", type: "address" }],
    name: "getCredentialsByOwner",
    outputs: [{ internalType: "uint256[]", name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    name: "credentials",
    outputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "string", name: "credentialHash", type: "string" },
      { internalType: "uint256", name: "score", type: "uint256" },
      { internalType: "uint256", name: "timestamp", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "uint256", name: "id", type: "uint256" },
      { indexed: true, internalType: "address", name: "owner", type: "address" },
      { indexed: false, internalType: "string", name: "credentialHash", type: "string" },
      { indexed: false, internalType: "uint256", name: "score", type: "uint256" },
    ],
    name: "CredentialMinted",
    type: "event",
  },
] as const;