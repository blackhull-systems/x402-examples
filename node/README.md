# Node: pay for a token check with `@x402/fetch`

```bash
npm ci
node check-token.mjs                                   # free sample answer (USDC), no wallet needed
WALLET_KEY=0x… node check-token.mjs 0x<token on Base>  # a real check: $0.01 in USDC on Base
```

```
USDC 0x833589fcd6edb6e08f4c7c32d4f71b54bda02913 at Base block 53436148
codes: OWNER_ACTIVE, CAN_MINT, CAN_PAUSE, CAN_BLACKLIST, UPGRADEABLE, LIQUIDITY
```

A paid run also prints the settlement transaction. `MAX_PRICE_USDC` (default `0.02`) is enforced by the x402 client's
spend controls: a higher quote is refused before anything is signed, and the program exits with code 2. A token that
is not an address (`0x` and 40 hex digits) exits with code 64 before any request.

`npm test` runs the program against the live API: once without a wallet, and once with a fresh, never-funded key and a
cap below the price to prove the refusal. Neither can spend money. Requires Node 22 or later.
