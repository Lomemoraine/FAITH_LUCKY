import assert from "node:assert/strict";

// Runs only against a local development server. Uses no real session or payment.
const base = "http://localhost:3002";
async function main() {
  for (const [path, body] of [
    ["/api/store/checkout", { productId: "hoodie-rose", phoneNumber: "invalid" }],
    ["/api/counseling/messages", { sessionId: "00000000-0000-4000-8000-000000000000", senderRole: "counselor", content: "Access-control regression check" }],
    ["/api/vouchers/redeem", { code: "CARE-DEMO-TFL" }],
    ["/api/counseling/sessions", { counselorId: "counselor-1", voucherCode: "CARE-DEMO-TFL" }],
    ["/api/moderation/auth", { password: "admin123" }],
  ] as const) {
    const response = await fetch(base + path, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    assert.equal(response.status, 401, `${path} must reject unauthenticated/default-password access`);
    console.log(`PASS ${path}`);
  }
  const response = await fetch(base + "/api/moderation/auth", {
    headers: { Cookie: "tfl_moderator_session=admin@talkfreelylifestyle.org" },
  });
  assert.equal((await response.json()).isModerator, false, "Unsigned staff cookies must not authenticate");
  console.log("PASS forged staff cookie rejected");
  const messages = await fetch(base + "/api/counseling/messages?sessionId=00000000-0000-4000-8000-000000000000");
  assert.equal(messages.status, 401, "Reading private messages requires authentication");
  console.log("PASS unauthenticated private-message read rejected");
  const order = await fetch(base + "/api/store/orders/00000000-0000-4000-8000-000000000000");
  assert.equal(order.status, 401, "Reading payment orders requires authentication");
  const recovery = await fetch(base + "/api/store/orders?attempt=00000000-0000-4000-8000-000000000000");
  assert.equal(recovery.status, 401, "Recovering payment attempts requires authentication");
  const callback = await fetch(base + "/api/mpesa/callback", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  assert.equal(callback.status, 400, "Callbacks without correlation/token must be rejected");
  const scheduler = await fetch(base + "/api/mpesa/reconcile");
  assert.equal(scheduler.status, 401, "Reconciliation job requires its secret");
  console.log("PASS payment order, callback and reconciliation access checks");
  const forgedProfile = JSON.stringify({ id: "00000000-0000-4000-8000-000000000000", public_id: "forged-profile", anonymous_handle: "ForgedIdentity", avatar_id: "lotus" });
  const identity = await fetch(base + "/api/auth/anonymous", { headers: { Cookie: `tfl_anon_profile=${forgedProfile}` } });
  assert.equal((await identity.json()).authenticated, false, "Unsigned identity cookies must not authenticate");
  const edit = await fetch(base + "/api/auth/anonymous", {
    method: "PATCH", headers: { "Content-Type": "application/json", Cookie: `tfl_anon_profile=${forgedProfile}` },
    body: JSON.stringify({ anonymous_handle: "ForgedIdentity", avatar_id: "lotus" }),
  });
  assert.equal(edit.status, 401, "Profile editing requires verified authentication");
  console.log("PASS forged identity and profile update rejected");
  for (const path of ["posts", "replies"]) {
    const response = await fetch(`${base}/api/community/${path}?id=00000000-0000-4000-8000-000000000000`, { method: "DELETE" });
    assert.equal(response.status, 401, `Deleting ${path} requires verified authentication`);
    console.log(`PASS unauthenticated ${path} deletion rejected`);
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
