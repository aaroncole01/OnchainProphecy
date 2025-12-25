# OnchainProphecy

Encrypted daily price prediction game for ETH and BTC on Zama FHEVM. Users submit private predictions and directions,
stake ETH, and claim encrypted points when their prediction is correct after the daily price is recorded.

## Overview

OnchainProphecy is a privacy-preserving prediction game built on Fully Homomorphic Encryption (FHE).
All user inputs (price thresholds, directions, and points) are encrypted, yet the contract can still compare
predictions to actual prices on-chain. The protocol runs on a daily cadence (UTC day index) and records prices once per
day, ensuring a clear and auditable resolution window.

## Problem It Solves

- **Prediction privacy**: Public price predictions reveal user strategy and enable copy trading. This project hides
  the prediction price and direction on-chain while still allowing correct resolution.
- **Fairness and integrity**: Users cannot see each other's predictions, which removes information asymmetry.
- **On-chain settlement**: Users receive outcomes and points without relying on a centralized database.
- **Daily cadence**: The UTC-day model provides a deterministic window for placing predictions and resolving results.

## Key Advantages

- **FHE privacy by design**: Predictions, directions, and points are encrypted with Zama FHEVM primitives.
- **Simple two-direction logic**: Direction is encoded as `1` (above) or `2` (below) and compared to real prices on-chain.
- **Stake-aligned incentives**: Correct predictions add encrypted points equal to the staked ETH amount.
- **Transparent price record**: Prices are posted once per UTC day and stored on-chain for auditability.
- **Non-custodial**: Users keep control of their funds; stakes are refunded on resolution.

## Core Features

- **Two supported assets**: ETH and BTC.
- **Daily price updates**: The owner records the daily ETH/BTC price (scaled to 8 decimals).
- **Encrypted prediction entry**: Users submit encrypted price thresholds and direction using Zama FHE inputs.
- **Self-service resolution**: Users must confirm the prediction the next day to resolve outcomes and receive points.
- **Encrypted points**: Points are stored as encrypted values that only the user can decrypt off-chain.

## How It Works (User Flow)

1. **Daily prices are recorded**  
   The contract owner calls `updatePrices(ethPrice, btcPrice)` once per UTC day. This locks the day and stores prices.
2. **Users place predictions**  
   Before the daily prices are recorded, users submit an encrypted price and direction (1 = above, 2 = below) along
   with an ETH stake. The inputs are encrypted client-side.
3. **Next day confirmation**  
   After the daily price is recorded and the day has passed, users call `confirmPrediction(day, asset)` to resolve.
4. **Points and refund**  
   If the prediction is correct, the user receives encrypted points equal to the stake and the stake is refunded.

## On-Chain Design

### Contract: `OnchainProphecy`

Key structures and constants:

- `PricePoint`: ETH/BTC prices and timestamp for a day.
- `Prediction`: encrypted price, encrypted direction, encrypted outcome, stake, day, and resolution flags.
- `PRICE_DECIMALS = 8`: all prices are scaled to 8 decimals.
- `DIRECTION_ABOVE = 1`, `DIRECTION_BELOW = 2`.

Key functions:

- `updatePrices(ethPrice, btcPrice)`: owner-only, records prices once per day.
- `placePrediction(asset, encryptedPrice, encryptedDirection, inputProof)`: accepts encrypted inputs plus ETH stake.
- `confirmPrediction(day, asset)`: resolves prediction, updates encrypted points, refunds stake.
- `getUserPoints(user)`: returns encrypted points.
- `getPrediction(user, day, asset)`: returns prediction metadata and encrypted fields.
- `getUserPredictionDays(user, asset)`: list of days where the user predicted.

Security measures:

- Reentrancy guard on prediction resolution.
- Input validation for asset type, price range, stake size, and daily locking.

## Frontend Integration Notes

The frontend lives in `home` and must follow these rules:

- Use the ABI from `deployments/sepolia` (copy the generated ABI to the frontend).
- Use `ethers` for contract writes and `viem` for contract reads.
- Do not use environment variables in the frontend.
- Do not connect to localhost networks in the frontend.
- Do not use `localStorage` for application state.
- Do not add JSON files to the frontend.

## Tech Stack

- **Smart contracts**: Solidity + Hardhat + `hardhat-deploy`
- **Confidential compute**: Zama FHEVM (`@fhevm/solidity` + Hardhat FHEVM plugin)
- **Frontend**: React + Vite + viem + rainbowkit (no Tailwind)
- **Package manager**: npm

## Repository Layout

```
contracts/          # Smart contracts (OnchainProphecy + reference contract)
deploy/             # Deployment scripts
tasks/              # Hardhat tasks (price updates, predictions)
test/               # Contract tests
home/               # Frontend (React + Vite)
docs/               # Zama/FHE references
```

## Setup and Usage

### Prerequisites

- Node.js 20+
- npm

### Install Dependencies

```bash
npm install
```

### Compile and Test (required before deployment)

```bash
npm run compile
npm run test
```

### Local Development Deployment (contracts only)

```bash
npx hardhat node
npx hardhat deploy --network localhost
```

Note: The frontend is intended for Sepolia only and must not use localhost networks.

### Sepolia Deployment (uses private key)

Create `.env` with:

- `PRIVATE_KEY` (required, do not use MNEMONIC)
- `INFURA_API_KEY`

Deploy:

```bash
npx hardhat deploy --network sepolia
```

### Operational Tasks

Update daily prices (scaled by `PRICE_DECIMALS`):

```bash
npx hardhat task:update-prices --eth <ETH_PRICE> --btc <BTC_PRICE> --network sepolia
```

Place a prediction:

```bash
npx hardhat task:place-prediction --asset eth --price <SCALED_PRICE> --direction 1 --stake 0.01 --network sepolia
```

Confirm a prediction after the day passes:

```bash
npx hardhat task:confirm-prediction --day <DAY_INDEX> --asset eth --network sepolia
```

Decrypt points for the connected signer:

```bash
npx hardhat task:decrypt-points --network sepolia
```

## Assumptions and Limitations

- Price updates are owner-driven; an off-chain scheduler or oracle script must call `updatePrices` daily.
- Predictions are only accepted before the daily price update is recorded.
- Users must actively confirm predictions the following day to receive points and refunds.
- Points are encrypted internal scores, not an ERC-20 token.

## Future Roadmap

- Automated price updates via a trusted price feed or oracle service.
- Multi-day or rolling prediction windows with configurable cadence.
- Additional assets beyond ETH and BTC.
- Optional public leaderboard using zero-knowledge-friendly aggregates.
- Improved frontend analytics and historical performance views.
- Cross-chain expansion once FHEVM-compatible networks are available.

## License

Licensed under the BSD-3-Clause-Clear License. See `LICENSE`.
