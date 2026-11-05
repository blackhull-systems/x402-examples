// Check a Base token before your agent buys it: one paid call to Blackhull's token check over x402.
//
//   node check-token.mjs                       # free sample answer, no wallet needed
//   WALLET_KEY=0x… node check-token.mjs 0x…    # a real check of any Base token, paid in USDC on Base
//
// The wallet pays at most MAX_PRICE_USDC per call (default 0.02); anything quoted above that is refused before signing.
import { wrapFetchWithPaymentFromConfig, decodePaymentResponseHeader } from "@x402/fetch";
import { ExactEvmScheme } from "@x402/evm";
import { privateKeyToAccount } from "viem/accounts";

const API = process.env.BLACKHULL_API || "https://blackhullsystems.com";
const token = process.argv[2];
const key = process.env.WALLET_KEY;
const cap = process.env.MAX_PRICE_USDC || "0.02";
const headers = { "user-agent": "blackhull-examples/1.0 (node)" };

let res;
if (!key) {
  // ?sample=1 answers the route's own example query (USDC) at no charge; any address you pass is ignored.
  console.error(
    `No WALLET_KEY set: fetching the free sample answer${token ? ` (for USDC; ${token} needs a paid check)` : ""}.`,
  );
  try {
    res = await fetch(`${API}/check/token?sample=1`, { headers });
  } catch (e) {
    console.error(`Could not reach ${API}: ${e.cause?.message ?? e.message}`);
    process.exit(1);
  }
} else {
  if (!/^0x[0-9a-fA-F]{40}$/.test(token ?? "")) {
    console.error("usage: WALLET_KEY=0x… node check-token.mjs <token address on Base: 0x + 40 hex>");
    process.exit(64); // EX_USAGE
  }
  const pay = wrapFetchWithPaymentFromConfig(fetch, {
    schemes: [{ network: "eip155:8453", client: new ExactEvmScheme(privateKeyToAccount(key)) }],
    spendControls: { maxAmountPerPayment: `$${cap}` },
  });
  try {
    res = await pay(`${API}/check/token?${new URLSearchParams({ address: token })}`, { headers });
  } catch (e) {
    console.error(`Not paid: ${e.message}`); // e.g. the quote was above MAX_PRICE_USDC
    process.exit(2);
  }
}

const text = await res.text();
let body;
try {
  body = JSON.parse(text);
} catch {
  console.error(`HTTP ${res.status}, not a JSON answer: ${text.slice(0, 200)}`);
  process.exit(1);
}
if (!res.ok) {
  console.error(`HTTP ${res.status}:`, body.error || body);
  process.exit(1);
}
console.log(
  `${body.checks?.erc20?.evidence?.symbol ?? "(not an ERC-20)"} ${body.address} at Base block ${body.as_of.block}`,
);
console.log(`codes: ${body.codes.join(", ") || "none"}`);
const receipt = res.headers.get("payment-response");
if (receipt) {
  const r = decodePaymentResponseHeader(receipt);
  console.log(`paid: tx ${r.transaction} on ${r.network}`);
}
