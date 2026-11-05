#!/usr/bin/env bash
# Blackhull's token check from the shell: the free sample, then the x402 price quote for any other token.
# curl cannot sign a payment; to pay, use the node/ or python/ example (or any x402 client) with the same URL.
#
#   ./check-token.sh [token address on Base]
set -euo pipefail
API="${BLACKHULL_API:-https://blackhullsystems.com}"
TOKEN="${1:-0x4200000000000000000000000000000000000006}"
UA="blackhull-examples/1.0 (curl)"

echo "Free sample (the route's own example query, USDC):"
curl -fsS -A "$UA" "$API/check/token?sample=1" | jq '{address, codes, as_of}'

echo "Price quote for $TOKEN (HTTP 402, nothing is charged):"
quote=$(curl -sS -A "$UA" -o /dev/null -D - "$API/check/token?address=$TOKEN" \
  | tr -d '\r' | awk 'tolower($1) == "payment-required:" {print $2}')
echo "$quote" | base64 -d | jq '.accepts[] | {network, asset, amount_atomic: .amount, usdc: ((.amount | tonumber) / 1e6)}'
