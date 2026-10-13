# TrustLedger

AI-verified developer credentials, permanently proofed onchain on Monad.

Built for the Monad Metropolis hackathon, Trust, Identity & AI Infrastructure track.

## The problem

Anyone can write "expert in React" on a resume. Recruiters and clients have no quick way to check it, which leads to fake resumes and bad hiring. Self-taught developers without a famous degree or brand find it hardest to prove their skills.

## How it works

1. Connect a wallet (Dynamic embedded wallet, no browser extension needed).
2. Enter a GitHub username. An AI model (Groq, gpt-oss-120b) reads the public repositories and returns a trust score from 0 to 100, a short summary and the main skills.
3. Mint the result to the TrustLedger smart contract on Monad Testnet.
4. Anyone can open the Verify page, enter a credential ID and read the score, owner wallet and timestamp straight from the blockchain.

## Why Monad

Credential checks need many cheap and fast transactions. Monad's low fees and fast transactions make minting and verifying practical at scale.

## Tech stack

- Next.js (App Router) and Tailwind CSS
- Dynamic SDK for wallet login and transaction signing
- Groq API for AI scoring and GitHub REST API for repository data
- Solidity smart contract (Hardhat 3) deployed on Monad Testnet (chain ID 10143)
- viem for reading from the contract

## Deployed contract

- Network: Monad Testnet (chain ID 10143)
- Address: `0xA10bce27058FA1fE345f4326a61E1b24B9267C08`
- Explorer: https://testnet.monadvision.com/address/0xA10bce27058FA1fE345f4326a61E1b24B9267C08
- Source: `contracts/TrustLedger.sol`

## Run locally

```bash
npm install
npm run dev
```

Create a `.env.local` file:

```
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_dynamic_environment_id
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
```

## Known limitations and roadmap

- Right now the score is based on public GitHub activity. Proving that the minting wallet owns the GitHub account (GitHub login or a signed gist) is the next step.
- The score is an AI estimate from public repositories, not a guarantee of skill.
