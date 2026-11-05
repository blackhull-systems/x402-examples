// A pre-trade guard for an AgentKit agent: before it buys a token, it checks the token's contract with Blackhull
// and applies YOUR policy to the finding codes. The policy below is an example to edit, not advice.
//
//   node guard.mjs                        # trial mode: free answers for the sample token (USDC), no funds needed
//   WALLET_KEY=0x… node guard.mjs 0x…     # paid mode: a real check of any Base token, at most $0.02 per check
import { AgentKit, ViemWalletProvider } from "@coinbase/agentkit";
import { blackhullActionProvider } from "@blackhull/agentkit";
import { createWalletClient, http } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { fileURLToPath } from "node:url";

// AgentKit 0.10.x sends a usage-analytics event when a wallet provider starts and does not catch its failure, which
// crashes the process when that endpoint errors. Ignore exactly that rejection; anything else still crashes loudly.
process.on("unhandledRejection", (e) => {
  if (String(e?.stack).includes("sendAnalyticsEvent")) return;
  throw e;
});

// Codes and their meanings: https://blackhullsystems.com/methodology
const POLICY = {
  // never trade these automatically: SELL_BLOCKED means a simulated buy went through and the sale of it did not
  refuse: ["NO_CONTRACT", "NOT_ERC20", "SELL_BLOCKED", "HIGH_TAX", "CAN_SET_FEE", "NO_POOL_FOUND", "THIN_LIQUIDITY"],
  review: ["OWNER_ACTIVE", "CAN_MINT", "CAN_PAUSE", "CAN_BLACKLIST", "UPGRADEABLE", "BUY_FAILED"], // trade only if you accept these
  accepted: [], // move codes here from `review` once you have decided they are acceptable for this agent
};

export function decide(codes) {
  const refused = codes.filter((c) => POLICY.refuse.includes(c));
  if (refused.length) return { trade: false, because: refused };
  const unreviewed = codes.filter((c) => POLICY.review.includes(c) && !POLICY.accepted.includes(c));
  if (unreviewed.length) return { trade: false, because: unreviewed, review: true };
  return { trade: true, because: codes };
}

export async function guard(token, key = process.env.WALLET_KEY) {
  const trialMode = !key;
  const account = privateKeyToAccount(key || generatePrivateKey()); // trial mode signs nothing; any key will do
  const walletProvider = new ViemWalletProvider(createWalletClient({ account, chain: base, transport: http() }));
  const agentkit = await AgentKit.from({
    walletProvider,
    actionProviders: [blackhullActionProvider({ trialMode, maxPriceUsdc: 0.02 })],
  });
  const checkToken = agentkit.getActions().find((a) => a.name.endsWith("check_token"));
  const answer = JSON.parse(await checkToken.invoke({ address: token }));
  if (answer.error) return { token, trade: false, because: [answer.message ?? `HTTP ${answer.status}`] }; // no answer, no trade
  const { address, codes } = answer.result;
  return { token: address, trial: trialMode, codes, ...decide(codes), receipt: answer.receipt };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const token = process.argv[2] || "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
  const verdict = await guard(token);
  console.log(JSON.stringify(verdict, null, 2));
  console.error(
    verdict.trade
      ? "→ the policy allows this trade"
      : verdict.review
        ? `→ hold: your policy has not accepted ${verdict.because.join(", ")}`
        : `→ do not trade: ${verdict.because.join(", ")}`,
  );
}
