/**
 * AdminOversightCard — scroll-motion driven version.
 *
 * Each visual layer is animated purely by `scrollProgress` (0 → 1),
 * which the parent LandingPage reads from useScroll() and passes down.
 * Nothing auto-plays on mount; everything is scrubbed by the user's scroll.
 */
import { useMemo } from "react";

const SESSIONS = [
  { customer: "Emily Chen",     orderId: "ORD-8821", status: "approved",  amount: "$349.00" },
  { customer: "Michael Torres", orderId: "ORD-9143", status: "active",    amount: "$128.50" },
  { customer: "fraud@test.io",  orderId: "ORD-7755", status: "escalated", amount: "$892.00" },
  { customer: "Aria Johnson",   orderId: "ORD-6602", status: "denied",    amount: "$54.99"  },
  { customer: "David Kim",      orderId: "ORD-5540", status: "approved",  amount: "$210.00" },
];

const LOG_LINES = [
  { type: "user",     text: "I bought a laptop 10 days ago, want a refund.", color: "#94a3b8" },
  { type: "tool",     text: "lookup_customer → CUST-1047 Emily Chen",        color: "#818cf8" },
  { type: "tool",     text: "check_refund_eligibility ORD-8821",             color: "#818cf8" },
  { type: "think",    text: "R1: 10d < 20d electronics Gold window ✓",       color: "#f59e0b" },
  { type: "decision", text: "APPROVE — $349.00 refund, no fee (Gold)",       color: "#10b981" },
  { type: "tool",     text: "process_refund → RFND-9004 ✓",                  color: "#10b981" },
];

const STATUS_COLOR = {
  approved:  "#10b981",
  escalated: "#f59e0b",
  denied:    "#ef4444",
  active:    "#6366f1",
};

// lerp helper
const lerp = (a, b, t) => a + (b - a) * Math.max(0, Math.min(1, t));
// range-map helper: map scrollProgress [inLo, inHi] → [0, 1]
const remap = (p, lo, hi) => Math.max(0, Math.min(1, (p - lo) / (hi - lo)));

export default function AdminOversightCard({ scrollProgress = 0 }) {
  // ── per-element scroll phases ────────────────────────────────────────────
  const cardReveal   = remap(scrollProgress, 0.00, 0.18);  // whole card slides up
  const headerReveal = remap(scrollProgress, 0.08, 0.22);  // header fades in
  const stat0        = remap(scrollProgress, 0.14, 0.28);
  const stat1        = remap(scrollProgress, 0.20, 0.34);
  const stat2        = remap(scrollProgress, 0.26, 0.40);
  const sessions     = SESSIONS.map((_, i) => remap(scrollProgress, 0.32 + i * 0.07, 0.46 + i * 0.07));
  const logLines     = LOG_LINES.map((_, i) => remap(scrollProgress, 0.62 + i * 0.06, 0.74 + i * 0.06));
  const progressBar  = remap(scrollProgress, 0.40, 0.90);

  // stat values driven by scroll
  const statVals = useMemo(() => ({
    sessions:  Math.round(lerp(0, 142, stat0)),
    resolved:  Math.round(lerp(0, 89,  stat1)),
    escalated: Math.round(lerp(0, 11,  stat2)),
  }), [stat0, stat1, stat2]);

  // card entry transform
  const cardStyle = {
    opacity:   cardReveal,
    transform: `translateY(${lerp(60, 0, cardReveal)}px) scale(${lerp(0.92, 1, cardReveal)})`,
  };

  return (
    <>
      <style>{`
        @keyframes ping {
          0%  { transform: scale(1); opacity: 0.9; }
          70% { transform: scale(2.2); opacity: 0; }
          100%{ transform: scale(2.2); opacity: 0; }
        }
        .aoc-root {
          font-family: Inter, sans-serif;
          background: rgba(8, 12, 22, 0.82);
          border: 1px solid rgba(16,185,129,0.22);
          border-radius: 22px;
          padding: 26px 24px;
          width: 100%;
          max-width: 440px;
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          box-shadow: 0 0 80px rgba(16,185,129,0.07), 0 32px 64px rgba(0,0,0,0.5);
          position: relative;
          overflow: hidden;
          transition: none;
        }
        /* neon top-edge glow */
        .aoc-root::before {
          content: '';
          position: absolute;
          top: 0; left: 10%; right: 10%; height: 1px;
          background: linear-gradient(90deg, transparent, rgba(16,185,129,0.6), transparent);
        }
        .aoc-stat {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          padding: 12px 14px;
          flex: 1;
        }
        .aoc-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          flex: 1;
        }
        .aoc-tag {
          font-size: 0.6rem;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          padding: 2px 7px;
          border-radius: 100px;
          font-family: "JetBrains Mono", monospace;
          white-space: nowrap;
        }
        .aoc-log-badge {
          font-size: 0.59rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: "JetBrains Mono", monospace;
          white-space: nowrap;
          flex-shrink: 0;
          margin-top: 2px;
        }
      `}</style>

      <div className="aoc-root" style={cardStyle}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 20,
          opacity: headerReveal,
          transform: `translateX(${lerp(-16, 0, headerReveal)}px)`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1rem", boxShadow: "0 0 18px rgba(16,185,129,0.45)"
            }}>🛡️</div>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "0.85rem", color: "#f1f5f9" }}>Admin Dashboard</p>
              <p style={{ margin: 0, fontSize: "0.68rem", color: "#64748b" }}>Live Monitoring • Real-time</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ position: "relative", display: "inline-block", width: 9, height: 9 }}>
              <span style={{ position:"absolute", inset:0, borderRadius:"50%", background:"#10b981", animation:"ping 1.6s ease-in-out infinite" }} />
              <span style={{ position:"absolute", inset:0, borderRadius:"50%", background:"#10b981" }} />
            </span>
            <span style={{ fontSize:"0.7rem", color:"#10b981", fontFamily:"JetBrains Mono" }}>LIVE</span>
          </div>
        </div>

        {/* ── Stat Cards ─────────────────────────────────────────────── */}
        <div style={{ display:"flex", gap:8, marginBottom:20 }}>
          {[
            { label:"Sessions", value: statVals.sessions,  color:"#6366f1", suffix:"",  reveal: stat0 },
            { label:"Resolved", value: statVals.resolved,  color:"#10b981", suffix:"%", reveal: stat1 },
            { label:"Escalated",value: statVals.escalated, color:"#f59e0b", suffix:"",  reveal: stat2 },
          ].map((s) => (
            <div key={s.label} className="aoc-stat" style={{
              opacity: s.reveal,
              transform: `translateY(${lerp(20, 0, s.reveal)}px)`,
            }}>
              <p style={{ margin:"0 0 3px", fontSize:"0.6rem", color:"#64748b", textTransform:"uppercase", letterSpacing:"0.07em" }}>{s.label}</p>
              <p style={{ margin:0, fontSize:"1.45rem", fontWeight:800, color:s.color, letterSpacing:"-0.03em", fontVariantNumeric:"tabular-nums" }}>
                {s.value}{s.suffix}
              </p>
            </div>
          ))}
        </div>

        {/* ── Resolution progress bar ─────────────────────────────────── */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
            <span style={{ fontSize:"0.62rem", color:"#64748b", textTransform:"uppercase", letterSpacing:"0.07em" }}>Auto-resolution rate</span>
            <span style={{ fontSize:"0.62rem", color:"#10b981", fontFamily:"JetBrains Mono" }}>{Math.round(progressBar * 89)}%</span>
          </div>
          <div style={{ height:6, background:"rgba(255,255,255,0.07)", borderRadius:100, overflow:"hidden" }}>
            <div style={{
              height:"100%", borderRadius:100,
              background:"linear-gradient(90deg, #10b981, #34d399)",
              width:`${progressBar * 89}%`,
              boxShadow:"0 0 10px rgba(16,185,129,0.5)",
              transition: "none"
            }} />
          </div>
        </div>

        {/* ── Session Rows ────────────────────────────────────────────── */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:9 }}>
          <span style={{ fontSize:"0.6rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#475569", whiteSpace:"nowrap" }}>Active Sessions</span>
          <div className="aoc-divider" />
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:18 }}>
          {SESSIONS.map((s, i) => {
            const p = sessions[i];
            const sc = STATUS_COLOR[s.status] || "#94a3b8";
            return (
              <div key={s.orderId} style={{
                display:"flex", alignItems:"center", gap:10,
                padding:"9px 12px",
                background:"rgba(255,255,255,0.04)",
                borderRadius:10,
                border:"1px solid rgba(255,255,255,0.06)",
                opacity: p,
                transform:`translateX(${lerp(-28, 0, p)}px)`,
              }}>
                <span style={{ position:"relative", display:"inline-block", width:9, height:9, flexShrink:0 }}>
                  {s.status === "active" && <span style={{ position:"absolute", inset:0, borderRadius:"50%", background:sc, animation:"ping 1.6s ease-in-out infinite" }} />}
                  <span style={{ position:"absolute", inset:0, borderRadius:"50%", background:sc }} />
                </span>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ margin:0, fontSize:"0.77rem", color:"#f1f5f9", fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{s.customer}</p>
                  <p style={{ margin:0, fontSize:"0.65rem", color:"#475569", fontFamily:"JetBrains Mono" }}>{s.orderId}</p>
                </div>
                <span className="aoc-tag" style={{ background:`${sc}1a`, color:sc }}>{s.status}</span>
                <span style={{ fontSize:"0.68rem", color:"#10b981", fontFamily:"JetBrains Mono", fontWeight:600, flexShrink:0 }}>{s.amount}</span>
              </div>
            );
          })}
        </div>

        {/* ── AI Reasoning Log ────────────────────────────────────────── */}
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:9 }}>
          <span style={{ fontSize:"0.6rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"#475569", whiteSpace:"nowrap" }}>AI Reasoning Log</span>
          <div className="aoc-divider" />
          <span style={{ fontSize:"0.58rem", color:"#10b981", fontFamily:"JetBrains Mono" }}>●</span>
        </div>
        <div style={{ background:"rgba(0,0,0,0.45)", borderRadius:12, padding:"12px 13px", border:"1px solid rgba(255,255,255,0.05)", display:"flex", flexDirection:"column", gap:7 }}>
          {LOG_LINES.map((line, i) => {
            const p = logLines[i];
            return (
              <div key={i} style={{
                display:"flex", gap:7, alignItems:"flex-start",
                opacity: p,
                transform: `translateX(${lerp(20, 0, p)}px)`,
              }}>
                <span className="aoc-log-badge" style={{ background:`${line.color}1a`, color:line.color }}>{line.type}</span>
                <span style={{ fontSize:"0.7rem", color:"#94a3b8", fontFamily:"JetBrains Mono", lineHeight:1.4 }}>{line.text}</span>
              </div>
            );
          })}
        </div>

      </div>
    </>
  );
}
