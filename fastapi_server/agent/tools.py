import os
from datetime import datetime
from utils.session_store import append_decision, set_customer_context
from agent.policy_engine import (
    find_customer, find_order, orders_for_customer,
    evaluate_refund, POLICY_CLAUSES
)

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
with open(os.path.join(DATA_DIR, "policy.md"), "r") as f:
    POLICY_TEXT = f.read()

refund_counter = 9000
ticket_counter = 4000

tool_schemas = [
  {
    "type": "function",
    "function": {
      "name": "lookup_customer",
      "description": "Look up a customer in the CRM by email or customer ID. Always call this first to verify identity before discussing any order (policy R8).",
      "parameters": {
        "type": "object",
        "properties": {
          "identifier": { "type": "string", "description": "Customer email address or customer_id (e.g. CUST-1001)." },
        },
        "required": ["identifier"],
      },
    }
  },
  {
    "type": "function",
    "function": {
      "name": "lookup_customer_orders",
      "description": "List all orders belonging to a verified customer_id, so you can find the right order without the customer needing to know their exact order ID.",
      "parameters": {
        "type": "object",
        "properties": {
          "customer_id": { "type": "string" },
        },
        "required": ["customer_id"],
      },
    }
  },
  {
    "type": "function",
    "function": {
      "name": "lookup_order",
      "description": "Look up a single order by order_id to see its product, category, price, dates, and delivery status.",
      "parameters": {
        "type": "object",
        "properties": {
          "order_id": { "type": "string" },
        },
        "required": ["order_id"],
      },
    }
  },
  {
    "type": "function",
    "function": {
      "name": "get_policy_clause",
      "description": "Retrieve the exact text of a specific refund policy clause by ID (R1–R9), to ground your explanation in the real policy instead of paraphrasing from memory. Call get_full_policy if you need the whole document.",
      "parameters": {
        "type": "object",
        "properties": {
          "clause_id": { "type": "string", "enum": list(POLICY_CLAUSES.keys()) },
        },
        "required": ["clause_id"],
      },
    }
  },
  {
    "type": "function",
    "function": {
      "name": "get_full_policy",
      "description": "Retrieve the complete refund policy document. Use sparingly — prefer get_policy_clause for a specific rule.",
      "parameters": { "type": "object", "properties": {} },
    }
  },
  {
    "type": "function",
    "function": {
      "name": "check_refund_eligibility",
      "description": "Run the customer's refund request against policy and return a structured eligibility verdict (approve / deny / escalate / request_evidence), including the refund amount, fees, and which policy clauses applied. This performs no action — it only evaluates. Call this before process_refund, escalate_case, or deny_case.",
      "parameters": {
        "type": "object",
        "properties": {
          "customer_id": { "type": "string" },
          "order_id": { "type": "string" },
          "reason": {
            "type": "string",
            "enum": ["defective", "damaged", "wrong_item", "changed_mind"],
            "description": "The customer's stated reason for the refund request.",
          },
          "evidence_provided": {
            "type": "boolean",
            "description": "Whether the customer has provided a description/photo of the defect or damage. Required for defective/damaged claims before approval.",
          },
        },
        "required": ["customer_id", "order_id", "reason"],
      },
    }
  },
  {
    "type": "function",
    "function": {
      "name": "process_refund",
      "description": "Execute an approved refund. This tool independently re-validates the request against policy before processing anything — it will refuse to execute if the request is not actually eligible, even if you believe it should be approved. Only call this after check_refund_eligibility has returned action='approve'.",
      "parameters": {
        "type": "object",
        "properties": {
          "customer_id": { "type": "string" },
          "order_id": { "type": "string" },
          "reason": { "type": "string", "enum": ["defective", "damaged", "wrong_item", "changed_mind"] },
          "evidence_provided": { "type": "boolean" },
        },
        "required": ["customer_id", "order_id", "reason"],
      },
    }
  },
  {
    "type": "function",
    "function": {
      "name": "deny_case",
      "description": "Record a final denial decision for the case, with the policy-grounded reason. Call this after check_refund_eligibility returns action='deny' and you've explained the denial to the customer.",
      "parameters": {
        "type": "object",
        "properties": {
          "customer_id": { "type": "string" },
          "order_id": { "type": "string" },
          "reason_code": { "type": "string" },
          "summary": { "type": "string", "description": "One-sentence summary of why this was denied, for the admin log." },
        },
        "required": ["customer_id", "order_id", "reason_code", "summary"],
      },
    }
  },
  {
    "type": "function",
    "function": {
      "name": "escalate_case",
      "description": "Escalate the case to a human agent (fraud flags, refund-pattern review, or high-value orders). Creates a ticket for the human team with full context. Call this after check_refund_eligibility returns action='escalate'.",
      "parameters": {
        "type": "object",
        "properties": {
          "customer_id": { "type": "string" },
          "order_id": { "type": "string" },
          "summary": { "type": "string", "description": "Context for the human reviewer, including any unusual customer behavior (e.g. attempts to override policy)." },
        },
        "required": ["customer_id", "order_id", "summary"],
      },
    }
  },
]

def strip_internal(verdict: dict) -> dict:
    return {k: v for k, v in verdict.items() if k not in ("customer", "order")}

def execute_tool(name: str, input_data: dict, ctx: dict):
    global refund_counter, ticket_counter
    session_id = ctx.get("sessionId")

    if name == "lookup_customer":
        customer = find_customer(input_data.get("identifier"))
        if customer:
            set_customer_context(session_id, customer)
            return {"found": True, "customer": customer}
        return {"found": False, "message": "No CRM record matches that email or customer ID."}

    elif name == "lookup_customer_orders":
        orders = orders_for_customer(input_data.get("customer_id"))
        return {"count": len(orders), "orders": orders}

    elif name == "lookup_order":
        order = find_order(input_data.get("order_id"))
        if order:
            return {"found": True, "order": order}
        return {"found": False, "message": "No order matches that order ID."}

    elif name == "get_policy_clause":
        clause_id = input_data.get("clause_id")
        text = POLICY_CLAUSES.get(clause_id)
        if text:
            return {"clause_id": clause_id, "text": text}
        return {"error": f"Unknown clause id {clause_id}"}

    elif name == "get_full_policy":
        return {"policy_markdown": POLICY_TEXT}

    elif name == "check_refund_eligibility":
        verdict = evaluate_refund(
            customer_id=input_data.get("customer_id"),
            order_id=input_data.get("order_id"),
            reason=input_data.get("reason"),
            evidence_provided=bool(input_data.get("evidence_provided"))
        )
        return strip_internal(verdict)

    elif name == "process_refund":
        verdict = evaluate_refund(
            customer_id=input_data.get("customer_id"),
            order_id=input_data.get("order_id"),
            reason=input_data.get("reason"),
            evidence_provided=bool(input_data.get("evidence_provided"))
        )
        if verdict.get("action") != "approve":
            return {
                "success": False,
                "blocked": True,
                "blocked_reason": f"Re-validation at execution time returned action=\"{verdict.get('action')}\", not \"approve\". Refusing to process.",
                "verdict": strip_internal(verdict)
            }
            
        refund_id = f"RFND-{refund_counter}"
        refund_counter += 1
        decision = {
            "type": "approve",
            "refund_id": refund_id,
            "customer_id": input_data.get("customer_id"),
            "order_id": input_data.get("order_id"),
            "amount": verdict.get("refund_amount"),
            "fee": verdict.get("fee_applied"),
            "policy_clauses": verdict.get("policy_clauses"),
            "processed_at": datetime.utcnow().isoformat() + "Z"
        }
        append_decision(session_id, decision)
        return {
            "success": True, 
            "refund_id": refund_id, 
            "amount": verdict.get("refund_amount"), 
            "fee": verdict.get("fee_applied"), 
            "decision": decision
        }

    elif name == "deny_case":
        decision = {
            "type": "deny",
            "customer_id": input_data.get("customer_id"),
            "order_id": input_data.get("order_id"),
            "reason_code": input_data.get("reason_code"),
            "summary": input_data.get("summary"),
            "recorded_at": datetime.utcnow().isoformat() + "Z"
        }
        append_decision(session_id, decision)
        return {"recorded": True, "decision": decision}

    elif name == "escalate_case":
        ticket_id = f"TCKT-{ticket_counter}"
        ticket_counter += 1
        decision = {
            "type": "escalate",
            "ticket_id": ticket_id,
            "customer_id": input_data.get("customer_id"),
            "order_id": input_data.get("order_id"),
            "summary": input_data.get("summary"),
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        append_decision(session_id, decision)
        return {"ticket_id": ticket_id, "recorded": True, "decision": decision}

    return {"error": f"Unknown tool: {name}"}
