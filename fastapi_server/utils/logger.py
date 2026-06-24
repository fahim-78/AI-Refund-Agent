import time
from datetime import datetime
from .session_store import append_log

# In Python we can use asyncio hooks or Starlette background tasks, 
# but for simplicity we'll just define a callback list like EventEmitter.
log_listeners = []

counter = 0

def add_log_listener(callback):
    log_listeners.append(callback)

def log(session_id: str, log_type: str, payload: dict = None):
    global counter
    if payload is None:
        payload = {}
        
    entry = {
        "id": f"log-{int(time.time()*1000)}-{counter}",
        "sessionId": session_id,
        "type": log_type,
        "payload": payload,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    counter += 1
    
    append_log(session_id, entry)
    
    for callback in log_listeners:
        try:
            callback("entry", entry)
        except Exception:
            pass
            
    return entry
