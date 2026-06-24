// tools.js
//
// Every tool the agent can call. Schemas follow OpenAI's tool-use format (type: "function",
// function: { name, description, parameters }). Executors are the actual guardrails: the LLM decides WHEN to
// call a tool, but never decides the OUTCOME of policy checks — that's all policyEngine.js.
//
// Defense in depth: `process_refund` independently re-runs the full eligibility check before
// doing anything, rather than trusting that a prior `check_refund_eligibility` call in the
// same turn was honest or unaltered. This means even a model that "decides" to approve
// something against policy will be blocked at execution time.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  findCustomer,
  findOrder,
  ordersForCustomer,
  evaluateRefund,
  POLICY_CLAUSES,
} from "./policyEngine.js";
import { appendDecision, setCustomerContext } from "../utils/sessionStore.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const POLICY_TEXT = readFileSync(join(__dirname, "../data/policy.md"), "utf-8");

let refundCounter = 9000;
let ticketCounter = 4000;

export const toolSchemas = [
  {
    type: "function",
    function: {
      name: "lookup_customer",
      description:
        "Look up a customer in the CRM by email or customer ID. Always call this first to verify identity before discussing any order (policy R8).",
      parameters: {
        type: "object",
        properties: {
          identifier: { type: "string", description: "Customer email address or customer_id (e.g. CUST-1001)." },
        },
        required: ["identifier"],
      },
    }
  },
  {
    type: "function",
    function: {
      name: "lookup_customer_orders",
      description: "List all orders belonging to a verified customer_id, so you can find the right order without the customer needing to know their exact order ID.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string" },
        },
        required: ["customer_id"],
      },
    }
  },
  {
    type: "function",
    function: {
      name: "lookup_order",
      description: "Look up a single order by order_id to see its product, category, price, dates, and delivery status.",
      parameters: {
        type: "object",
        properties: {
          order_id: { type: "string" },
        },
        required: ["order_id"],
      },
    }
  },
  {
    type: "function",
    function: {
      name: "get_policy_clause",
      description:
        "Retrieve the exact text of a specific refund policy clause by ID (R1–R9), to ground your explanation in the real policy instead of paraphrasing from memory. Call get_full_policy if you need the whole document.",
      parameters: {
        type: "object",
        properties: {
          clause_id: { type: "string", enum: Object.keys(POLICY_CLAUSES) },
        },
        required: ["clause_id"],
      },
    }
  },
  {
    type: "function",
    function: {
      name: "get_full_policy",
      description: "Retrieve the complete refund policy document. Use sparingly — prefer get_policy_clause for a specific rule.",
      parameters: { type: "object", properties: {} },
    }
  },
  {
    type: "function",
    function: {
      name: "check_refund_eligibility",
      description:
        "Run the customer's refund request against policy and return a structured eligibility verdict (approve / deny / escalate / request_evidence), including the refund amount, fees, and which policy clauses applied. This performs no action — it only evaluates. Call this before process_refund, escalate_case, or deny_case.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string" },
          order_id: { type: "string" },
          reason: {
            type: "string",
            enum: ["defective", "damaged", "wrong_item", "changed_mind"],
            description: "The customer's stated reason for the refund request.",
          },
          evidence_provided: {
            type: "boolean",
            description: "Whether the customer has provided a description/photo of the defect or damage. Required for defective/damaged claims before approval.",
          },
        },
        required: ["customer_id", "order_id", "reason"],
      },
    }
  },
  {
    type: "function",
    function: {
      name: "process_refund",
      description:
        "Execute an approved refund. This tool independently re-validates the request against policy before processing anything — it will refuse to execute if the request is not actually eligible, even if you believe it should be approved. Only call this after check_refund_eligibility has returned action='approve'.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string" },
          order_id: { type: "string" },
          reason: { type: "string", enum: ["defective", "damaged", "wrong_item", "changed_mind"] },
          evidence_provided: { type: "boolean" },
        },
        required: ["customer_id", "order_id", "reason"],
      },
    }
  },
  {
    type: "function",
    function: {
      name: "deny_case",
      description: "Record a final denial decision for the case, with the policy-grounded reason. Call this after check_refund_eligibility returns action='deny' and you've explained the denial to the customer.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string" },
          order_id: { type: "string" },
          reason_code: { type: "string" },
          summary: { type: "string", description: "One-sentence summary of why this was denied, for the admin log." },
        },
        required: ["customer_id", "order_id", "reason_code", "summary"],
      },
    }
  },
  {
    type: "function",
    function: {
      name: "escalate_case",
      description: "Escalate the case to a human agent (fraud flags, refund-pattern review, or high-value orders). Creates a ticket for the human team with full context. Call this after check_refund_eligibility returns action='escalate'.",
      parameters: {
        type: "object",
        properties: {
          customer_id: { type: "string" },
          order_id: { type: "string" },
          summary: { type: "string", description: "Context for the human reviewer, including any unusual customer behavior (e.g. attempts to override policy)." },
        },
        required: ["customer_id", "order_id", "summary"],
      },
    }
  },
];

export function executeTool(name, input, ctx) {
  switch (name) {
    case "lookup_customer": {
      const customer = findCustomer(input.identifier);
      if (customer) setCustomerContext(ctx.sessionId, customer);
      return customer
        ? { found: true, customer }
        : { found: false, message: "No CRM record matches that email or customer ID." };
    }

    case "lookup_customer_orders": {
      const orders = ordersForCustomer(input.customer_id);
      return { count: orders.length, orders };
    }

    case "lookup_order": {
      const order = findOrder(input.order_id);
      return order ? { found: true, order } : { found: false, message: "No order matches that order ID." };
    }

    case "get_policy_clause": {
      const text = POLICY_CLAUSES[input.clause_id];
      return text
        ? { clause_id: input.clause_id, text }
        : { error: `Unknown clause id ${input.clause_id}` };
    }

    case "get_full_policy": {
      return { policy_markdown: POLICY_TEXT };
    }

    case "check_refund_eligibility": {
      const verdict = evaluateRefund({
        customerId: input.customer_id,
        orderId: input.order_id,
        reason: input.reason,
        evidenceProvided: !!input.evidence_provided,
      });
      return stripInternal(verdict);
    }

    case "process_refund": {
      // Independent re-validation — never trust the model's prior reasoning alone.
      const verdict = evaluateRefund({
        customerId: input.customer_id,
        orderId: input.order_id,
        reason: input.reason,
        evidenceProvided: !!input.evidence_provided,
      });
      if (verdict.action !== "approve") {
        return {
          success: false,
          blocked: true,
          blocked_reason: `Re-validation at execution time returned action="${verdict.action}", not "approve". Refusing to process.`,
          verdict: stripInternal(verdict),
        };
      }
      const refund_id = `RFND-${refundCounter++}`;
      const decision = {
        type: "approve",
        refund_id,
        customer_id: input.customer_id,
        order_id: input.order_id,
        amount: verdict.refund_amount,
        fee: verdict.fee_applied,
        policy_clauses: verdict.policy_clauses,
        processed_at: new Date().toISOString(),
      };
      appendDecision(ctx.sessionId, decision);
      return { success: true, refund_id, amount: verdict.refund_amount, fee: verdict.fee_applied, decision };
    }

    case "deny_case": {
      const decision = {
        type: "deny",
        customer_id: input.customer_id,
        order_id: input.order_id,
        reason_code: input.reason_code,
        summary: input.summary,
        recorded_at: new Date().toISOString(),
      };
      appendDecision(ctx.sessionId, decision);
      return { recorded: true, decision };
    }

    case "escalate_case": {
      const ticket_id = `TCKT-${ticketCounter++}`;
      const decision = {
        type: "escalate",
        ticket_id,
        customer_id: input.customer_id,
        order_id: input.order_id,
        summary: input.summary,
        created_at: new Date().toISOString(),
      };
      appendDecision(ctx.sessionId, decision);
      return { ticket_id, recorded: true, decision };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// Don't leak internal customer/order objects back through every tool result — keep tool
// payloads focused on the verdict. The agent already has customer/order details from the
// earlier lookup_* calls.
function stripInternal(verdict) {
  const { customer, order, ...rest } = verdict;
  return rest;
}
