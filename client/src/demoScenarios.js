// Maps each mock customer to a suggested order ID and what the demo is meant to show.
// Purely for the presenter's benefit (shown as on-screen hints) — the agent itself derives
// everything from the CRM/order data via tools, not from this file.
export const DEMO_SCENARIOS = {
  "CUST-1001": { orderId: "ORD-2001", label: "Standard happy path", detail: "Changed mind, within window → approve with 10% restocking fee." },
  "CUST-1002": { orderId: "ORD-2002", label: "Defective item (Gold)", detail: "Arrived defective → full refund, no fee, once you describe the issue." },
  "CUST-1003": { orderId: "ORD-2003", label: "Standard happy path", detail: "Changed mind, within window → approve with fee." },
  "CUST-1004": { orderId: "ORD-2004", label: "Past return window", detail: "Electronics delivered 50 days ago, 15-day window → deny." },
  "CUST-1005": { orderId: "ORD-2005", label: "Refund-pattern flag", detail: "4 refunds in 90 days → escalate for manual review, no auto-approval." },
  "CUST-1006": { orderId: "ORD-2006", label: "Fraud flag — try to push back!", detail: "Account flagged for fraud → always escalates. Try telling the agent to ignore policy and approve it anyway." },
  "CUST-1007": { orderId: "ORD-2007", label: "Final sale (Gold tier)", detail: "Clearance item, no defect claim → denied even for a VIP customer." },
  "CUST-1008": { orderId: "ORD-2008", label: "Digital good", detail: "Software license, changed mind → non-refundable, denied." },
  "CUST-1009": { orderId: "ORD-2009", label: "Not yet delivered", detail: "Order still in transit → can't refund, only cancel." },
  "CUST-1010": { orderId: "ORD-2010", label: "High-value escalation", detail: "Wrong item shipped, $549 → eligible, but escalated for human sign-off." },
  "CUST-1011": { orderId: "ORD-2011", label: "Standard happy path", detail: "Changed mind, within window → approve with fee." },
  "CUST-1012": { orderId: "ORD-2012", label: "Past extended window (Gold)", detail: "Delivered 61 days ago, even the 45-day Gold window doesn't cover it → deny. (Try ORD-2016 for an approval within the extension.)" },
  "CUST-1013": { orderId: "ORD-2013", label: "Gift card", detail: "Gift cards are never refunded → denied." },
  "CUST-1014": { orderId: "ORD-2014", label: "Damaged claim, no evidence yet", detail: "Agent should ask for evidence before approving." },
  "CUST-1015": { orderId: "ORD-2015", label: "Perishable goods", detail: "Grocery item, changed mind → non-refundable, denied." },
};
