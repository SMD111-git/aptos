#!/bin/bash

set -e

PROFILE=${1:-default}
CONTRACT_ADDR=${2}

if [ -z "$CONTRACT_ADDR" ]; then
  echo "Usage: ./initialize.sh <profile> <contract_address>"
  exit 1
fi

echo "🎬 Initializing Skill Passport Contract"
echo "Contract: $CONTRACT_ADDR"
echo "Profile: $PROFILE"

# Initialize the contract
aptos move run \
  --function-id ${CONTRACT_ADDR}::skill_passport::initialize \
  --profile $PROFILE \
  --assume-yes

echo "✅ Contract initialized successfully!"
