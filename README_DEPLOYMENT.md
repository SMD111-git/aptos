# Skill Passport - Deployment Guide

## Prerequisites

1. Install Aptos CLI:
```bash
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3
```

2. Create and fund account:
```bash
aptos init --profile devnet --network devnet
aptos account fund-with-faucet --profile devnet
```

## Deployment Steps

### 1. Compile and Test

```bash
cd move
aptos move compile --named-addresses skill_passport_addr=devnet
aptos move test
```

### 2. Deploy Contract

```bash
chmod +x ../scripts/deploy.sh
../scripts/deploy.sh devnet devnet
```

### 3. Initialize Contract

```bash
chmod +x ../scripts/initialize.sh
../scripts/initialize.sh devnet <CONTRACT_ADDRESS>
```

### 4. Add Verifiers

```bash
aptos move run \
  --function-id <CONTRACT_ADDR>::skill_passport::add_verifier \
  --args address:<VERIFIER_ADDR> address:<CONTRACT_ADDR> \
  --profile devnet
```

### 5. Mint Test Badge

```bash
aptos move run \
  --function-id <CONTRACT_ADDR>::skill_passport::mint_verified_badge \
  --args \
    address:<CONTRACT_ADDR> \
    address:<STUDENT_ADDR> \
    string:"Python Programming" \
    string:"Intermediate" \
    string:"Code Academy" \
    u64:0 \
    string:"ipfs://QmExample" \
  --profile devnet
```

## Upgrade Contract

1. Update Move code
2. Recompile
3. Publish upgrade:
```bash
aptos move publish --profile devnet --assume-yes
```

## Verify Deployment

Check badges:
```bash
aptos move view \
  --function-id <CONTRACT_ADDR>::skill_passport::get_badges_by_owner \
  --args address:<CONTRACT_ADDR> address:<STUDENT_ADDR>
```

## Environment Variables for Frontend

Create `.env` in frontend folder:
```
VITE_CONTRACT_ADDRESS=<YOUR_CONTRACT_ADDRESS>
VITE_NETWORK=devnet
```

## Mainnet Deployment

1. Create mainnet profile:
```bash
aptos init --profile mainnet --network mainnet
```

2. Fund account (buy APT)
3. Deploy:
```bash
../scripts/deploy.sh mainnet mainnet
```
