// Runs the example exactly as a user would, against the live API. No test here can spend money:
// the sample is free, and the cap test uses a fresh, never-funded key with a cap below the price.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { generatePrivateKey } from "viem/accounts";

const run = (env = {}, args = []) =>
  promisify(execFile)(process.execPath, ["check-token.mjs", ...args], { env: { ...process.env, ...env } }).then(
    (r) => ({ code: 0, ...r }),
    (e) => ({ code: e.code, stdout: e.stdout, stderr: e.stderr }),
  );

test("without a wallet it prints the free sample's finding codes", async () => {
  const { code, stdout, stderr } = await run({ WALLET_KEY: "" });
  assert.equal(code, 0, stderr);
  assert.match(stdout, /^USDC 0x833589fcd6edb6e08f4c7c32d4f71b54bda02913 at Base block \d+$/m);
  assert.match(stdout, /^codes: [A-Z0-9_, ]+$/m);
});

test("an answer that is not JSON is reported in one line, not a stack trace", async () => {
  const { code, stderr } = await run({ WALLET_KEY: "", BLACKHULL_API: "https://blackhullsystems.com/no-such-page" });
  assert.equal(code, 1);
  assert.match(stderr, /^HTTP \d+, not a JSON answer: /m);
});

test("a token that is not an address is refused before any request", async () => {
  const { code, stderr } = await run({ WALLET_KEY: generatePrivateKey() }, ["0x123&sample=1"]);
  assert.equal(code, 64);
  assert.match(stderr, /^usage: /m);
});

test("a quote above MAX_PRICE_USDC is refused before anything is signed", async () => {
  const usdc = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
  const { code, stderr } = await run({ WALLET_KEY: generatePrivateKey(), MAX_PRICE_USDC: "0.001" }, [usdc]);
  assert.equal(code, 2);
  assert.match(stderr, /^Not paid: .*spendControls\.maxAmountPerPayment \(\$0\.001/m);
});
