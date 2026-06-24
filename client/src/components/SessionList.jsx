function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

export default function SessionList({ sessions, selectedId, onSelect }) {
  if (sessions.length === 0) {
    return (
      <div className="empty-state">
        No sessions yet. Open the customer chat in another tab and send a message — it'll show
        up here in real time.
      </div>
    );
  }

  return (
    <div className="session-list">
      {sessions.map((s) => (
        <button
          key={s.id}
          className={`session-item ${s.id === selectedId ? "active" : ""}`}
          onClick={() => onSelect(s.id)}
        >
          <div className="sid">{s.id.slice(0, 8)}</div>
          <div className="scust">{s.customerContext?.name || "Unidentified customer"}</div>
          <div className="smeta">
            <span>{s.messageCount} msgs</span>
            <span>·</span>
            <span>{timeAgo(s.createdAt)}</span>
            {s.lastDecision && (
              <span className={`decision-chip ${s.lastDecision.type}`} style={{ marginLeft: "auto" }}>
                {s.lastDecision.type}
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
