import json
import asyncio
from llm import client
from config import MODEL_NAME
from agent.tools import tool_schemas, execute_tool
from agent.system_prompt import SYSTEM_PROMPT
from utils.logger import log

MAX_TOOL_ITERATIONS = 8

async def run_agent_turn(session_id: str, history: list, user_message: str):
    messages = [
        {"role": "system", "content": SYSTEM_PROMPT}
    ]
    messages.extend(history)
    messages.append({"role": "user", "content": user_message})

    log(session_id, "user_message", {"text": user_message})

    iterations = 0
    while iterations < MAX_TOOL_ITERATIONS:
        iterations += 1

        try:
            response = await client.chat.completions.create(
                model=MODEL_NAME,
                messages=messages,
                tools=tool_schemas
            )
        except Exception as err:
            log(session_id, "error", {"message": f"Giving up after retries: {str(err)}"})
            return {
                "finalText": "I'm having trouble reaching the support system right now. Please try again in a moment, or I can flag this for a human agent.",
                "messages": history
            }

        choice = response.choices[0]
        message = choice.message

        if message.content:
            log(session_id, "thinking", {"text": message.content, "iteration": iterations})

        if not message.tool_calls:
            final_text = message.content.strip() if message.content else ""
            log(session_id, "agent_message", {"text": final_text})
            final_history = [m for m in messages if m["role"] != "system"]
            
            # Message is a Pydantic model, convert to dict
            msg_dict = message.model_dump(exclude_unset=True)
            final_history.append(msg_dict)
            return {"finalText": final_text, "messages": final_history}

        # Append assistant's tool-call message
        msg_dict = message.model_dump(exclude_unset=True)
        messages.append(msg_dict)

        for block in message.tool_calls:
            if block.type != "function":
                continue
                
            tool_name = block.function.name
            tool_args_string = block.function.arguments
            
            try:
                tool_input = json.loads(tool_args_string)
            except Exception:
                tool_input = {}
                log(session_id, "error", {"message": "Failed to parse tool arguments."})

            log(session_id, "tool_call", {"tool": tool_name, "input": tool_input, "tool_use_id": block.id, "iteration": iterations})

            try:
                result = execute_tool(tool_name, tool_input, {"sessionId": session_id})
            except Exception as err:
                result = {"error": str(err)}
                log(session_id, "error", {"tool": tool_name, "message": result["error"]})

            log(session_id, "tool_result", {"tool": tool_name, "output": result, "tool_use_id": block.id, "iteration": iterations})

            if tool_name in ["process_refund", "deny_case", "escalate_case"]:
                log(session_id, "decision", {"tool": tool_name, "output": result})

            messages.append({
                "role": "tool",
                "tool_call_id": block.id,
                "content": json.dumps(result)
            })

    log(session_id, "error", {"message": f"Reached MAX_TOOL_ITERATIONS ({MAX_TOOL_ITERATIONS}) without a final answer — escalating."})
    execute_tool(
        "escalate_case",
        {
            "customer_id": "UNKNOWN",
            "order_id": "UNKNOWN",
            "summary": "Agent loop exceeded max tool iterations without resolving the case. Needs manual handling."
        },
        {"sessionId": session_id}
    )

    final_history = [m for m in messages if m["role"] != "system"]
    return {
        "finalText": "This is taking longer than it should to resolve automatically, so I've escalated it to a human agent to make sure you're taken care of.",
        "messages": final_history
    }
