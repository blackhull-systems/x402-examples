// The policy is tested offline; the trial-mode run goes to the live API and is free (no key is funded or needed).
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { decide } from "../guard.mjs";

test("a refused code blocks the trade even when other codes are fine", () => {
  assert.deepEqual(decide(["OWNER_RENOUNCED", "CAN_SET_FEE"]), { trade: false, because: ["CAN_SET_FEE"] });
});

test("a token a buyer could not sell back is refused, whatever else it says", () => {
  assert.deepEqual(decide(["OWNER_RENOUNCED", "LIQUIDITY", "SELL_BLOCKED"]), {
    trade: false,
    because: ["SELL_BLOCKED"],
  });
  assert.deepEqual(decide(["LIQUIDITY", "SELL_OK", "HIGH_TAX"]), { trade: false, because: ["HIGH_TAX"] });
});

test("an unreviewed caution holds the trade for review", () => {
  assert.deepEqual(decide(["CAN_MINT", "LIQUIDITY"]), { trade: false, because: ["CAN_MINT"], review: true });
});

test("only positive and accepted codes allow the trade", () => {
  assert.equal(decide(["OWNER_RENOUNCED", "LIQUIDITY", "SELL_OK"]).trade, true);
});

test("trial mode checks the sample token through AgentKit, free", async () => {
  // run as a user would, in its own process (AgentKit's analytics call outlives a test otherwise)
  const { stdout } = await promisify(execFile)(process.execPath, ["guard.mjs"], {
    env: { ...process.env, WALLET_KEY: "" },
  });
  const v = JSON.parse(stdout);
  assert.equal(v.trial, true);
  assert.equal(v.token, "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913");
  assert.ok(v.codes.includes("LIQUIDITY"), JSON.stringify(v));
  assert.ok(v.codes.includes("SELL_OK"), JSON.stringify(v)); // the sale was simulated, and went through
  assert.equal(v.receipt, undefined); // nothing was paid
});
