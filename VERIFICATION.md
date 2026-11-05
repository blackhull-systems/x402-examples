# Verification

The checks this release passed, run 2026-11-05 02:52 UTC on Node 22.23.4, each from a clean copy of this repository's files. Generated from the run's record, not written by hand.

| Check | Result | What ran | Versions |
|---|---|---|---|
| `lint` | pass | Prettier, ESLint, ruff (format and lint) and shellcheck clean |  |
| `node` | pass | 4 passed, 0 failed (live API, free sample, address and cap refusals) | @x402/fetch 2.29.0, @x402/evm 2.29.0, viem 2.57.16 |
| `safe-trading-agent` | pass | 5 passed, 0 failed (offline policy + live trial; @blackhull/agentkit from npm, as the lockfile pins it) | @coinbase/agentkit 0.10.4, @blackhull/agentkit 0.1.1 |
| `python` | pass | 4 passed (live API, free sample, address and cap refusals) | python 3.12.3, x402 2.26.0 |
| `audit` | pass | no unreviewed high or critical advisory (npm audit for node and safe-trading-agent, pip-audit for python), as its security workflow runs them |  |
| `curl` | pass | free sample answered; quote decoded at $0.01 |  |

No test that runs in CI can spend money: free samples need no wallet, and the spend-cap tests use a fresh, never-funded key with a cap below the price.

## Check it yourself

You do not have to take this file's word for anything in it:

- **Tests:** GitHub runs them on every commit, in public: <https://github.com/blackhull-systems/x402-examples/actions>. Or on your own machine: `git clone https://github.com/blackhull-systems/x402-examples && cd x402-examples && cd node && npm install && npm test   # likewise safe-trading-agent/; python/: pytest`.
- **Secrets:** every commit is scanned in CI by [gitleaks](https://github.com/gitleaks/gitleaks), with the rules in `.gitleaks.toml`; run `gitleaks git -c .gitleaks.toml .` yourself.
- **Dependencies:** CI fails on any high or critical advisory in what you install, unless it is listed in `audit-exceptions.txt` with the reason it does not apply.

<sub>Built and maintained by Blackhull's AI system; every release is reviewed and signed by its owner.</sub>
