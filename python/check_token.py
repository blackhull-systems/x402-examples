"""Check a Base token before your agent buys it: one paid call to Blackhull's token check over x402.

    python check_token.py                       # free sample answer, no wallet needed
    WALLET_KEY=0x... python check_token.py 0x...   # a real check of any Base token, paid in USDC on Base

The wallet pays at most MAX_PRICE_USDC per call (default 0.02); anything quoted above that is refused before signing.
"""

import os
import re
import sys

import requests
from eth_account import Account
from x402 import SchemeRegistration, x402ClientConfig
from x402.http import decode_payment_response_header
from x402.http.clients.requests import PaymentError, wrapRequestsWithPaymentFromConfig
from x402.mechanisms.evm.exact import ExactEvmScheme
from x402.mechanisms.evm.signers import EthAccountSigner

API = os.environ.get("BLACKHULL_API", "https://blackhullsystems.com")
HEADERS = {"user-agent": "blackhull-examples/1.0 (python)"}


def main() -> int:
    key = os.environ.get("WALLET_KEY")
    cap = os.environ.get("MAX_PRICE_USDC", "0.02")
    if not key:
        # ?sample=1 answers the route's own example query (USDC) at no charge; any address you pass is ignored.
        ignored = f" (for USDC; {sys.argv[1]} needs a paid check)" if len(sys.argv) > 1 else ""
        print(f"No WALLET_KEY set: fetching the free sample answer{ignored}.", file=sys.stderr)
        try:
            res = requests.get(f"{API}/check/token", params={"sample": "1"}, headers=HEADERS, timeout=30)
        except requests.RequestException as e:
            print(f"Could not reach {API}: {e}", file=sys.stderr)
            return 1
    else:
        if len(sys.argv) < 2 or not re.fullmatch(r"0x[0-9a-fA-F]{40}", sys.argv[1]):
            print("usage: WALLET_KEY=0x... python check_token.py <token address on Base: 0x + 40 hex>", file=sys.stderr)
            return 64  # EX_USAGE
        signer = EthAccountSigner(Account.from_key(key))
        session = wrapRequestsWithPaymentFromConfig(
            requests.Session(),
            x402ClientConfig(
                schemes=[SchemeRegistration(network="eip155:8453", client=ExactEvmScheme(signer=signer))],
                spend_controls={"max_amount_per_payment": f"${cap}"},
            ),
        )
        try:
            res = session.get(f"{API}/check/token", params={"address": sys.argv[1]}, headers=HEADERS, timeout=60)
        except PaymentError as e:
            print(f"Not paid: {e}", file=sys.stderr)  # e.g. the quote was above MAX_PRICE_USDC
            return 2

    try:
        body = res.json()
    except ValueError:
        print(f"HTTP {res.status_code}, not a JSON answer: {res.text[:200]}", file=sys.stderr)
        return 1
    if not res.ok:
        print(f"HTTP {res.status_code}: {body.get('error', body)}", file=sys.stderr)
        return 1
    symbol = body.get("checks", {}).get("erc20", {}).get("evidence", {}).get("symbol", "(not an ERC-20)")
    print(f"{symbol} {body['address']} at Base block {body['as_of']['block']}")
    print(f"codes: {', '.join(body['codes']) or 'none'}")
    if receipt := res.headers.get("payment-response"):
        r = decode_payment_response_header(receipt)
        print(f"paid: tx {r.transaction} on {r.network}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
