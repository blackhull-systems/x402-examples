# curl: see the protocol by hand

```bash
./check-token.sh [token address on Base]
```

It fetches the free sample answer, then asks for a real check of your token without paying, and decodes the
`402 Payment Required` reply's `PAYMENT-REQUIRED` header: the network, the asset (USDC on Base) and the amount
(10000 atomic units = $0.01). An x402 client pays exactly that by signing a USDC authorization and repeating the
request; curl cannot sign, so use the [Node](../node) or [Python](../python) example to pay. Requires `curl` and `jq`.
