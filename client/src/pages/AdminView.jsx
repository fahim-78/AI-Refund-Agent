import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { useAdminSocket } from "../hooks/useSocket.js";
import SessionList from "../components/SessionList.jsx";
import ReasoningLog from "../components/ReasoningLog.jsx";
import CaseSummary from "../components/CaseSummary.jsx";
import CrmReference from "../components/CrmReference.jsx";

export default function AdminView() {
  const [sessions, setSessions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [rightTab, setRightTab] = useState("summary");
  const [crm, setCrm] = useState(null);

  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const knownSessionIds = useRef(new Set());

  const refreshSessions = useCallback(async () => {
    const list = await api.adminListSessions();
    setSessions(list);
    list.forEach((s) => knownSessionIds.current.add(s.id));
    return list;
  }, []);

  // Initial load.
  useEffect(() => {
    refreshSessions().then((list) => {
      if (list.length > 0) setSelectedId(list[0].id);
    });
    api.adminGetCrm().then(setCrm).catch(() => { });
  }, [refreshSessions]);

  // Poll as a safety net in case any socket events are missed.
  useEffect(() => {
    const interval = setInterval(refreshSessions, 5000);
    return () => clearInterval(interval);
  }, [refreshSessions]);

  // Load full detail whenever the selected session changes.
  useEffect(() => {
    if (!selectedId) {
      setSelectedSession(null);
      return;
    }
    api.adminGetSession(selectedId).then(setSelectedSession).catch(() => setSelectedSession(null));
  }, [selectedId]);

  const { connected } = useAdminSocket((entry) => {
    // Brand-new session showing up live → refresh the list, and auto-focus it if nothing
    // is selected yet (great for "open the dashboard and watch the next chat arrive" demos).
    if (!knownSessionIds.current.has(entry.sessionId)) {
      knownSessionIds.current.add(entry.sessionId);
      refreshSessions().then(() => {
        if (!selectedIdRef.current) setSelectedId(entry.sessionId);
      });
    } else if (entry.type === "decision" || entry.type === "user_message") {
      refreshSessions();
    }

    if (entry.sessionId === selectedIdRef.current) {
      setSelectedSession((prev) => (prev ? { ...prev, reasoningLog: [...prev.reasoningLog, entry] } : prev));
      if (entry.type === "decision") {
        // Re-fetch full session so the decisions array (parsed structured object, not just
        // the raw log entry) stays in sync for the CaseSummary panel.
        api.adminGetSession(selectedIdRef.current).then(setSelectedSession).catch(() => { });
      }
    }
  });

  return (
    <div className="admin-shell">
      <div className="admin-col">
        <div className="admin-col-header">
          <h2>Sessions</h2>
          <span className={`live-dot ${connected ? "" : "off"}`} title={connected ? "Live" : "Disconnected"} />
        </div>
        <SessionList sessions={sessions} selectedId={selectedId} onSelect={setSelectedId} />
      </div>

      <div className="admin-col">
        <div className="admin-col-header">
          <h2>Reasoning Log</h2>
          {selectedSession && <span className="sid" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--color-slate-text-muted)" }}>{selectedId?.slice(0, 8)}</span>}
        </div>
        <ReasoningLog entries={selectedSession?.reasoningLog || []} />
      </div>

      <div className="admin-col">
        <div className="admin-col-header">
          <h2>Case Detail</h2>
        </div>
        <div className="right-panel">
          <div className="panel-tabs">
            <button className={rightTab === "summary" ? "active" : ""} onClick={() => setRightTab("summary")}>
              Case Summary
            </button>
            <button className={rightTab === "crm" ? "active" : ""} onClick={() => setRightTab("crm")}>
              CRM Reference
            </button>
          </div>
          {rightTab === "summary" ? <CaseSummary session={selectedSession} /> : <CrmReference crm={crm} />}
        </div>
      </div>
    </div>
  );
}
