// agentLoop.js
import { toolSchemas, executeTool } from "./tools.js";
import { SYSTEM_PROMPT } from "./systemPrompt.js";
import { log } from "../utils/logger.js";
import { config } from "../config.js";

const MODEL = config.openRouterModel;
const MAX_TOOL_ITERATIONS = 8;
const MAX_API_RETRIES = 2;

function isRetryable(status) {
  return status === 429 || (typeof status === "number" && status >= 500);
}

async function callModelWithRetry(params, sessionId) {
  let lastErr;
  for (let attempt = 0; attempt <= MAX_API_RETRIES; attempt++) {
    try {
      const response = await fetch(`${config.openRouterBaseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.openRouterApiKey}`,
          "HTTP-Referer": config.clientOrigin,
          "X-Title": "Orbiq Support",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(params)
      });
      
      if (!response.ok) {
        throw new Error(`OpenRouter API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      lastErr = err;
      log(sessionId, "error", {
        message: err?.message || String(err),
        attempt: attempt + 1,
      });
      
      // We don't have accurate status codes from generic fetch errors like ECONNRESET without checking cause
      const isRetriable = err.message.includes("429") || err.message.match(/50\d/);
      if (!isRetriable || attempt === MAX_API_RETRIES) throw err;
      
      const backoffMs = 500 * (attempt + 1);
      log(sessionId, "retry", {
        attempt: attempt + 1,
        max_attempts: MAX_API_RETRIES + 1,
        backoff_ms: backoffMs,
        reason: err?.message || "transient error",
      });
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }
  throw lastErr;
}

/**
 * @param {object} params
 * @param {string} params.sessionId
 * @param {{role: "user"|"assistant"|"tool", content: string, tool_calls?: any[], tool_call_id?: string}[]} params.history
 * @param {string} params.userMessage
 */
export async function runAgentTurn({ sessionId, history, userMessage }) {
  // Convert basic text history into OpenAI format
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...history,
    { role: "user", content: userMessage }
  ];
  
  log(sessionId, "user_message", { text: userMessage });

  let iterations = 0;
  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations++;

    let data;
    try {
      data = await callModelWithRetry(
        {
          model: MODEL,
          tools: toolSchemas,
          messages,
        },
        sessionId
      );
    } catch (err) {
      log(sessionId, "error", { message: `Giving up after retries: ${err?.message || err}` });
      return {
        finalText:
          "I'm having trouble reaching the support system right now. Please try again in a moment, or I can flag this for a human agent.",
        messages: history,
      };
    }

    const choice = data.choices[0];
    const message = choice.message;

    if (message.content) {
      log(sessionId, "thinking", { text: message.content, iteration: iterations });
    }

    if (!message.tool_calls || message.tool_calls.length === 0) {
      const finalText = message.content?.trim() || "";
      log(sessionId, "agent_message", { text: finalText });
      
      // Clean up system prompt before returning updated history
      const finalHistory = messages.filter(m => m.role !== "system");
      return { finalText, messages: [...finalHistory, message] };
    }

    // Append the assistant's tool-call message to the history
    messages.push(message);

    for (const block of message.tool_calls) {
      if (block.type !== "function") continue;
      
      const toolName = block.function.name;
      const toolArgsString = block.function.arguments;
      let toolInput = {};
      try {
        toolInput = JSON.parse(toolArgsString);
      } catch(e) {
        log(sessionId, "error", { message: "Failed to parse tool arguments." });
      }

      log(sessionId, "tool_call", { tool: toolName, input: toolInput, tool_use_id: block.id, iteration: iterations });

      let result;
      try {
        result = executeTool(toolName, toolInput, { sessionId });
      } catch (err) {
        result = { error: err?.message || String(err) };
        log(sessionId, "error", { tool: toolName, message: result.error });
      }

      log(sessionId, "tool_result", { tool: toolName, output: result, tool_use_id: block.id, iteration: iterations });

      if (["process_refund", "deny_case", "escalate_case"].includes(toolName)) {
        log(sessionId, "decision", { tool: toolName, output: result });
      }

      // Add the tool result back into the history
      messages.push({
        role: "tool",
        tool_call_id: block.id,
        content: JSON.stringify(result),
      });
    }
  }

  log(sessionId, "error", { message: `Reached MAX_TOOL_ITERATIONS (${MAX_TOOL_ITERATIONS}) without a final answer — escalating.` });
  executeTool(
    "escalate_case",
    {
      customer_id: "UNKNOWN",
      order_id: "UNKNOWN",
      summary: "Agent loop exceeded max tool iterations without resolving the case. Needs manual handling.",
    },
    { sessionId }
  );
  
  const finalHistory = messages.filter(m => m.role !== "system");
  return {
    finalText:
      "This is taking longer than it should to resolve automatically, so I've escalated it to a human agent to make sure you're taken care of.",
    messages: finalHistory,
  };
}
