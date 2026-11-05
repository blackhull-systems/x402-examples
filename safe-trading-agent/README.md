# A pre-trade guard for a Coinbase AgentKit agent

Before your agent buys a token, `guard.mjs` checks the token's contract through the
[@blackhull/agentkit](https://github.com/blackhull-systems/agentkit) action provider and applies **your** policy to the
finding codes. The policy is three lists at the top of the file:

- `refuse` — never trade automatically (for example `CAN_SET_FEE`: its code contains a fee-setting function)
- `review` — hold until you decide (for example `CAN_MINT`, `UPGRADEABLE`)
- `accepted` — codes from `review` you have decided this agent may live with

The lists shipped here are an example to edit, not advice.

```bash
npm install
node guard.mjs                        # trial mode: free answer for the sample token (USDC), no funds needed
WALLET_KEY=0x… node guard.mjs 0x…     # a real check of any Base token, at most $0.02 per check
```

The verdict is JSON on stdout (`trade`, `because`, and the payment `receipt` in paid mode); a one-line summary goes to
stderr. If Blackhull cannot answer, the guard says do not trade: no answer, no trade.

AgentKit 0.10 sends a usage-analytics event when a wallet provider starts and does not catch its failure, which can
crash the process; the guard ignores exactly that one rejection and nothing else.

`npm test` checks the policy offline and runs one trial-mode check against the live API, free. Requires Node 22 or later.
