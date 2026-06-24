import { useEffect, useRef } from "react";

const TAG_LABEL = {
  user_message: "customer",
  thinking: "reasoning",
  tool_call: "tool call",
  tool_result: "tool result",
  decision: "decision",
  retry: "retry",
  error: "error",
  agent_message: "agent reply",
};

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function EntryBody({ entry }) {
  const { type, payload } = entry;
  switch (type) {
    case "user_message":
      return <div className="log-body">"{payload.text}"</div>;
    case "agent_message":
      return <div className="log-body">"{payload.text}"</div>;
    case "thinking":
      return <div className="log-body">{payload.text}</div>;
    case "tool_call":
      return (
        <div className="log-body">
          <span className="field">{payload.tool}(</span>
          {JSON.stringify(payload.input)}
          <span className="field">)</span>
        </div>
      );
    case "tool_result":
      return (
        <div className="log-body">
          <span className="field">{payload.tool} →</span> {JSON.stringify(payload.output)}
        </div>
      );
    case "decision":
      return (
        <div className="log-body">
          <span className="field">{payload.tool} recorded:</span> {JSON.stringify(payload.output)}
        </div>
      );
    case "retry":
      return (
        <div className="log-body">
          attempt {payload.attempt}/{payload.max_attempts} · waiting {payload.backoff_ms}ms · {payload.reason}
        </div>
      );
    case "error":
      return (
        <div className="log-body">
          {payload.tool ? <span className="field">{payload.tool}: </span> : null}
          {payload.message} {payload.status ? `(status ${payload.status})` : ""}
        </div>
      );
    default:
      return <div className="log-body">{JSON.stringify(payload)}</div>;
  }
}

export default function ReasoningLog({ entries }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [entries.length]);

  if (entries.length === 0) {
    return (
      <div className="empty-state">
        Select a session to watch the agent's reasoning here — tool calls, tool results,
        retries, and the final decision, as they happen.
      </div>
    );
  }

  return (
    <div className="log-stream">
      {entries.map((entry) => (
        <div key={entry.id} className={`log-entry ${entry.type}`}>
          <div className="log-head">
            <span className={`log-tag ${entry.type}`}>{TAG_LABEL[entry.type] || entry.type}</span>
            <span className="log-time">{fmtTime(entry.timestamp)}</span>
          </div>
          <EntryBody entry={entry} />
        </div>
      ))}
      <div ref={endRef} className="scroll-anchor" />
    </div>
  );
}
