"""Runs the example exactly as a user would, against the live API. No test here can spend money:
the sample is free, and the cap test uses a fresh, never-funded key with a cap below the price."""

import os
import re
import subprocess
import sys

from eth_account import Account

USDC = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913"


def run(env, *args):
    return subprocess.run(
        [sys.executable, "check_token.py", *args], env={**os.environ, **env}, capture_output=True, text=True, timeout=90
    )


def test_without_a_wallet_it_prints_the_free_samples_finding_codes():
    r = run({"WALLET_KEY": ""})
    assert r.returncode == 0, r.stderr
    assert re.search(rf"^USDC {USDC} at Base block \d+$", r.stdout, re.M)
    assert re.search(r"^codes: [A-Z0-9_, ]+$", r.stdout, re.M)


def test_an_answer_that_is_not_json_is_reported_in_one_line_not_a_traceback():
    r = run({"WALLET_KEY": "", "BLACKHULL_API": "https://blackhullsystems.com/no-such-page"})
    assert r.returncode == 1
    assert re.search(r"^HTTP \d+, not a JSON answer: ", r.stderr, re.M)


def test_a_token_that_is_not_an_address_is_refused_before_any_request():
    r = run({"WALLET_KEY": "0x" + Account.create().key.hex().removeprefix("0x")}, "0x123&sample=1")
    assert r.returncode == 64
    assert r.stderr.startswith("usage: ")


def test_a_quote_above_the_cap_is_refused_before_anything_is_signed():
    r = run({"WALLET_KEY": "0x" + Account.create().key.hex().removeprefix("0x"), "MAX_PRICE_USDC": "0.001"}, USDC)
    assert r.returncode == 2
    assert re.search(r"^Not paid: .*spend_controls\.max_amount_per_payment \(\$0\.001", r.stderr, re.M)
