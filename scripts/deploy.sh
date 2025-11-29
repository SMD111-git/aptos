#!/bin/bash

# Skill Passport Contract Deployment Script

set -e

echo "🚀 Deploying Skill Passport Contract to Aptos"

# Configuration
PROFILE=${1:-default}
NETWORK=${2:-devnet}

echo "Profile: $PROFILE"
echo "Network: $NETWORK"

# Navigate to move directory
cd "$(dirname "$0")/../move"

# Compile the contract
echo "📦 Compiling Move contract..."
aptos move compile --named-addresses skill_passport_addr=$PROFILE

# Run tests
echo "🧪 Running tests..."
aptos move test --named-addresses skill_passport_addr=$PROFILE

# Publish to network
echo "📤 Publishing to $NETWORK..."
aptos move publish \
  --profile $PROFILE \
  --named-addresses skill_passport_addr=$PROFILE \
  --assume-yes

# Get the deployed address
DEPLOYED_ADDR=$(aptos config show-profiles --profile=$PROFILE | grep "account" | awk '{print $2}')

echo "✅ Contract deployed successfully!"
echo "📍 Contract Address: $DEPLOYED_ADDR"
echo ""
echo "Next steps:"
echo "1. Initialize the contract:"
echo "   aptos move run --function-id ${DEPLOYED_ADDR}::skill_passport::initialize --profile $PROFILE"
echo ""
echo "2. Add verifiers:"
echo "   aptos move run --function-id ${DEPLOYED_ADDR}::skill_passport::add_verifier --args address:0xVERIFIER_ADDRESS address:${DEPLOYED_ADDR} --profile $PROFILE"
