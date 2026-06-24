// policyEngine.test.js
//
// Exercises every branch of the policy engine against the seeded mock data, independent of
// the LLM. Run with `npm run test:policy` from /server. This is what gives confidence that
// "holding the line" cases (fraud, final sale, expired windows, high value, abuse patterns)
// are enforced in code, not just hoped for via prompting.

import assert from "node:assert/strict";
import { evaluateRefund } from "./policyEngine.js";

const cases = [
  { name: "Standard change-of-mind within window → approve w/ fee", input: { customerId: "CUST-1001", orderId: "ORD-2001", reason: "changed_mind" }, expectAction: "approve", expectAmount: 41.39 },
  { name: "Gold + defective, evidence provided → full refund", input: { customerId: "CUST-1002", orderId: "ORD-2002", reason: "defective", evidenceProvided: true }, expectAction: "approve", expectAmount: 199.99 },
  { name: "New customer, simple change of mind → approve w/ fee", input: { customerId: "CUST-1003", orderId: "ORD-2003", reason: "changed_mind" }, expectAction: "approve", expectAmount: 25.2 },
  { name: "Electronics past 15-day window → deny", input: { customerId: "CUST-1004", orderId: "ORD-2004", reason: "changed_mind" }, expectAction: "deny", expectReasonCode: "WINDOW_EXPIRED" },
  { name: "Refund-pattern abuse → escalate regardless of reason", input: { customerId: "CUST-1005", orderId: "ORD-2005", reason: "changed_mind" }, expectAction: "escalate", expectReasonCode: "REFUND_PATTERN_REVIEW" },
  { name: "Fraud-flagged account → escalate, even with override attempt semantics", input: { customerId: "CUST-1006", orderId: "ORD-2006", reason: "changed_mind" }, expectAction: "escalate", expectReasonCode: "FRAUD_FLAG" },
  { name: "Final sale item, Gold tier → still denied", input: { customerId: "CUST-1007", orderId: "ORD-2007", reason: "changed_mind" }, expectAction: "deny", expectReasonCode: "NON_REFUNDABLE_CATEGORY" },
  { name: "Digital good, change of mind → deny", input: { customerId: "CUST-1008", orderId: "ORD-2008", reason: "changed_mind" }, expectAction: "deny", expectReasonCode: "NON_REFUNDABLE_CATEGORY" },
  { name: "Order not yet delivered → deny, suggest cancellation", input: { customerId: "CUST-1009", orderId: "ORD-2009", reason: "changed_mind" }, expectAction: "deny", expectReasonCode: "NOT_YET_DELIVERED" },
  { name: "Wrong item, high value (>$500) → eligible but escalate", input: { customerId: "CUST-1010", orderId: "ORD-2010", reason: "wrong_item" }, expectAction: "escalate", expectReasonCode: "HIGH_VALUE_ESCALATION", expectEligible: true },
  { name: "Standard change of mind within window → approve w/ fee", input: { customerId: "CUST-1011", orderId: "ORD-2011", reason: "changed_mind" }, expectAction: "approve", expectAmount: 207 },
  { name: "Gold tier but past even the extended window → deny", input: { customerId: "CUST-1012", orderId: "ORD-2012", reason: "changed_mind" }, expectAction: "deny", expectReasonCode: "WINDOW_EXPIRED" },
  { name: "Gift card → deny (non-refundable)", input: { customerId: "CUST-1013", orderId: "ORD-2013", reason: "changed_mind" }, expectAction: "deny", expectReasonCode: "NON_REFUNDABLE_CATEGORY" },
  { name: "Damaged claim, no evidence yet → request evidence", input: { customerId: "CUST-1014", orderId: "ORD-2014", reason: "damaged", evidenceProvided: false }, expectAction: "request_evidence" },
  { name: "Damaged claim, evidence now provided → approve", input: { customerId: "CUST-1014", orderId: "ORD-2014", reason: "damaged", evidenceProvided: true }, expectAction: "approve", expectAmount: 38.5 },
  { name: "Grocery (perishable) → deny", input: { customerId: "CUST-1015", orderId: "ORD-2015", reason: "changed_mind" }, expectAction: "deny", expectReasonCode: "NON_REFUNDABLE_CATEGORY" },
  { name: "Gold tier, within extended 45-day window → approve, fee waived", input: { customerId: "CUST-1012", orderId: "ORD-2016", reason: "changed_mind" }, expectAction: "approve", expectAmount: 120 },
];

let passed = 0;
for (const c of cases) {
  const verdict = evaluateRefund(c.input);
  try {
    assert.equal(verdict.action, c.expectAction, `action mismatch (got "${verdict.action}")`);
    if (c.expectReasonCode) assert.equal(verdict.reason_code, c.expectReasonCode, `reason_code mismatch (got "${verdict.reason_code}")`);
    if (c.expectAmount !== undefined) assert.equal(verdict.refund_amount, c.expectAmount, `refund_amount mismatch (got ${verdict.refund_amount})`);
    if (c.expectEligible !== undefined) assert.equal(verdict.eligible, c.expectEligible, `eligible mismatch (got ${verdict.eligible})`);
    console.log(`✅ ${c.name}`);
    passed++;
  } catch (err) {
    console.error(`❌ ${c.name}\n   ${err.message}\n   verdict: ${JSON.stringify(verdict)}`);
  }
}

console.log(`\n${passed}/${cases.length} policy engine cases passed.`);
if (passed !== cases.length) process.exit(1);
