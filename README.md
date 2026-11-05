# x402 examples: check a token before your agent buys it

[![examples](https://github.com/blackhull-systems/x402-examples/actions/workflows/examples.yml/badge.svg)](https://github.com/blackhull-systems/x402-examples/actions/workflows/examples.yml) [![security](https://github.com/blackhull-systems/x402-examples/actions/workflows/security.yml/badge.svg)](https://github.com/blackhull-systems/x402-examples/actions/workflows/security.yml)

Small, complete programs that buy one answer from [Blackhull](https://blackhull.systems) over
[x402](https://x402.org): a check of a Base token's contract (who controls it, whether its code can mint, pause,
blacklist or change fees, whether it can be upgraded, and how much liquidity its pools hold), for $0.01 in USDC on Base.
No account, no API key. Every one of them also runs **free**, without a wallet, against a fixed sample token.

| Folder | What it shows |
|---|---|
| [`node/`](node) | Pay per call from Node with Coinbase's `@x402/fetch`, with a spend cap |
| [`python/`](python) | The same from Python with Coinbase's `x402` package and `requests` |
| [`curl/`](curl) | The free sample and the price quote from the shell, to see the protocol by hand |
| [`safe-trading-agent/`](safe-trading-agent) | A pre-trade guard for a Coinbase AgentKit agent: check the token, apply your policy, then trade or hold |

## Run one

```bash
cd node && npm install && node check-token.mjs                 # free sample, no wallet
WALLET_KEY=0x… node check-token.mjs 0x4200000000000000000000000000000000000006   # paid: $0.01
```

```bash
cd python && pip install -r requirements.txt && python check_token.py
```

Use a wallet that holds only a little USDC on Base, keep its key in your secret store, and never commit it. Every
paid example refuses any price above `MAX_PRICE_USDC` (default `0.02`) before it signs anything.

## What a check returns

```json
{
  "address": "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  "codes": ["OWNER_ACTIVE", "CAN_MINT", "CAN_PAUSE", "CAN_BLACKLIST", "UPGRADEABLE", "LIQUIDITY"],
  "as_of": { "chain": "base", "block": 53436148 }
}
```

That is USDC itself: an issuer-controlled, upgradeable token that can mint, pause and blacklist, as its code says.
Each code is a measurement of the contract's code and state, with its evidence in the full answer, never a judgement of
anyone's intent. What each code means and how it is measured: <https://blackhullsystems.com/methodology>. Whether a
code is acceptable is your agent's decision; `safe-trading-agent/` shows one way to write that policy down.

## Tested

Every example has tests, and CI runs them against the live API on every change and every week, so a broken example
shows up as a red badge here rather than in your agent. The tests never spend money: the free sample needs no wallet,
and the spend-cap tests use a fresh, never-funded key with a cap below the price, so they prove the refusal happens
before signing. CI also checks every example with Prettier, ESLint, ruff and shellcheck, and installs exactly the
versions in each example's committed lockfile. [VERIFICATION.md](VERIFICATION.md) records the latest run.

## More

All products, prices, codes and errors: <https://blackhullsystems.com/docs> · the AgentKit action provider:
[@blackhull/agentkit](https://github.com/blackhull-systems/agentkit) · Terms: <https://blackhull.systems/terms> ·
Security: [SECURITY.md](SECURITY.md)

Facts, not financial, investment or legal advice. Built and maintained by Blackhull's AI system; every release is
reviewed and signed by its owner. Apache-2.0.
