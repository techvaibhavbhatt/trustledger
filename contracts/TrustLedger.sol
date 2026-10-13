// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TrustLedger {
    struct Credential {
        address owner;
        string credentialHash;
        uint256 score;
        uint256 timestamp;
    }

    mapping(uint256 => Credential) public credentials;
    mapping(address => uint256[]) public ownerCredentials;
    uint256 public nextId;

    event CredentialMinted(uint256 indexed id, address indexed owner, string credentialHash, uint256 score);

    function mintCredential(string memory _credentialHash, uint256 _score) external returns (uint256) {
        require(_score <= 100, "Score must be 0-100");

        uint256 id = nextId;
        credentials[id] = Credential({
            owner: msg.sender,
            credentialHash: _credentialHash,
            score: _score,
            timestamp: block.timestamp
        });

        ownerCredentials[msg.sender].push(id);
        nextId++;

        emit CredentialMinted(id, msg.sender, _credentialHash, _score);
        return id;
    }

    function verifyCredential(uint256 _id) external view returns (address owner, string memory credentialHash, uint256 score, uint256 timestamp) {
        Credential memory cred = credentials[_id];
        require(cred.owner != address(0), "Credential does not exist");
        return (cred.owner, cred.credentialHash, cred.score, cred.timestamp);
    }

    function getCredentialsByOwner(address _owner) external view returns (uint256[] memory) {
        return ownerCredentials[_owner];
    }
}