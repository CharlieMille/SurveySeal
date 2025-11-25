# SurveySeal

A privacy-preserving survey platform built with FHEVM (Fully Homomorphic Encryption Virtual Machine) technology. SurveySeal enables users to create surveys and collect encrypted responses while maintaining complete privacy through homomorphic encryption.

## Features

- **Privacy-Preserving Surveys**: Create surveys with encrypted responses using FHEVM
- **Multiple Question Types**: Support for single choice, multiple choice, rating, and numeric input questions
- **Encrypted Statistics**: View aggregated survey statistics without decrypting individual responses
- **Web3 Integration**: Built on Ethereum with MetaMask wallet support
- **Dual Mode Operation**: Support for both mock (local development) and production (Relayer SDK) modes

## Project Structure

```
SurveySeal/
├── fhevm-hardhat-template/    # Smart contracts and deployment scripts
│   ├── contracts/              # Solidity smart contracts
│   ├── deploy/                 # Deployment scripts
│   ├── test/                   # Contract tests
│   └── tasks/                  # Hardhat tasks
└── surveyseal-frontend/         # Next.js frontend application
    ├── app/                    # Next.js app directory
    ├── components/              # React components
    ├── hooks/                   # Custom React hooks
    ├── fhevm/                   # FHEVM integration utilities
    └── scripts/                 # Build and utility scripts
```

## Prerequisites

- Node.js >= 20
- npm >= 7.0.0
- Hardhat node (for local development)
- MetaMask or compatible Web3 wallet

## Installation

### Smart Contracts

```bash
cd fhevm-hardhat-template
npm install
```

### Frontend

```bash
cd surveyseal-frontend
npm install
```

## Development

### Local Development (Mock Mode)

1. Start Hardhat node:
```bash
cd fhevm-hardhat-template
npx hardhat node
```

2. Deploy contracts:
```bash
npx hardhat deploy --network localhost
```

3. Start frontend in mock mode:
```bash
cd surveyseal-frontend
npm run dev:mock
```

### Production Mode (Relayer SDK)

1. Deploy contracts to your target network:
```bash
cd fhevm-hardhat-template
npx hardhat deploy --network sepolia
```

2. Start frontend:
```bash
cd surveyseal-frontend
npm run dev
```

## Testing

Run contract tests:
```bash
cd fhevm-hardhat-template
npm test
```

## Building

Build frontend for production:
```bash
cd surveyseal-frontend
npm run build
```

The static export will be available in the `out/` directory.

## License

BSD-3-Clause-Clear

