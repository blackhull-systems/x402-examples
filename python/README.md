# Python: pay for a token check with `x402` and `requests`

```bash
pip install -r requirements.txt
python check_token.py                                   # free sample answer (USDC), no wallet needed
WALLET_KEY=0x... python check_token.py 0x<token on Base>  # a real check: $0.01 in USDC on Base
```

```
USDC 0x833589fcd6edb6e08f4c7c32d4f71b54bda02913 at Base block 53436148
codes: OWNER_ACTIVE, CAN_MINT, CAN_PAUSE, CAN_BLACKLIST, UPGRADEABLE, LIQUIDITY
```

A paid run also prints the settlement transaction. `MAX_PRICE_USDC` (default `0.02`) is enforced by the x402 client's
spend controls: a higher quote is refused before anything is signed, and the program exits with code 2. A token that
is not an address (`0x` and 40 hex digits) exits with code 64 before any request.

Import the requests client from `x402.http.clients.requests`, not `x402.http.clients`: the package-level import also
loads the httpx client, which this install does not include.

`pip install -r requirements-dev.txt && pytest -q` runs the program against the live API: once without a wallet, and once with a fresh,
never-funded key and a cap below the price to prove the refusal. Neither can spend money. Tested on Python 3.12.
