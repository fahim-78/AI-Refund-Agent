from datetime import datetime

sessions = {}

def ensure(session_id: str):
    if session_id not in sessions:
        sessions[session_id] = {
            "id": session_id,
            "createdAt": datetime.utcnow().isoformat() + "Z",
            "messages": [],
            "reasoningLog": [],
            "decisions": [],
            "customerContext": None
        }
    return sessions[session_id]

def create_session(session_id: str):
    return ensure(session_id)

def get_session(session_id: str):
    return sessions.get(session_id)

def list_sessions():
    s_list = []
    for s in sessions.values():
        s_list.append({
            "id": s["id"],
            "createdAt": s["createdAt"],
            "messageCount": len(s["messages"]),
            "lastDecision": s["decisions"][-1] if s["decisions"] else None,
            "customerContext": s["customerContext"]
        })
    return sorted(s_list, key=lambda x: x["createdAt"], reverse=True)

def append_message(session_id: str, message: dict):
    s = ensure(session_id)
    s["messages"].append(message)
    return s

def append_log(session_id: str, entry: dict):
    s = ensure(session_id)
    s["reasoningLog"].append(entry)
    return s

def append_decision(session_id: str, decision: dict):
    s = ensure(session_id)
    s["decisions"].append(decision)
    return s

def set_customer_context(session_id: str, customer: dict):
    s = ensure(session_id)
    if customer:
        s["customerContext"] = {
            "customer_id": customer.get("customer_id"),
            "name": customer.get("name"),
            "email": customer.get("email"),
            "tier": customer.get("tier"),
            "fraud_flag": customer.get("fraud_flag")
        }
    else:
        s["customerContext"] = None
    return s

def delete_session(session_id: str):
    if session_id in sessions:
        del sessions[session_id]
