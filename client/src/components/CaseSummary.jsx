export default function CaseSummary({ session }) {
  if (!session) {
    return <div className="empty-state">No session selected.</div>;
  }

  const { customerContext, decisions } = session;

  return (
    <>
      <div className="summary-card">
        <h4>Customer</h4>
        {customerContext ? (
          <>
            <div className="kv-row">
              <span className="k">Name</span>
              <span>{customerContext.name}</span>
            </div>
            <div className="kv-row">
              <span className="k">ID</span>
              <span>{customerContext.customer_id}</span>
            </div>
            <div className="kv-row">
              <span className="k">Email</span>
              <span>{customerContext.email}</span>
            </div>
            <div className="kv-row">
              <span className="k">Tier</span>
              <span>
                {customerContext.tier}
                {customerContext.fraud_flag && <span className="flag-chip">FRAUD FLAG</span>}
              </span>
            </div>
          </>
        ) : (
          <div className="kv-row">
            <span className="k">Not yet verified</span>
          </div>
        )}
      </div>

      <div className="summary-card">
        <h4>Decisions ({decisions.length})</h4>
        {decisions.length === 0 && <div className="kv-row">No decision recorded yet.</div>}
        {decisions.map((d, i) => (
          <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < decisions.length - 1 ? "1px solid var(--color-slate-600)" : "none" }}>
            <span className={`decision-chip ${d.type}`}>{d.type}</span>
            <div className="kv-row">
              <span className="k">Order</span>
              <span>{d.order_id}</span>
            </div>
            {d.type === "approve" && (
              <>
                <div className="kv-row">
                  <span className="k">Refund ID</span>
                  <span>{d.refund_id}</span>
                </div>
                <div className="kv-row">
                  <span className="k">Amount</span>
                  <span>${d.amount?.toFixed(2)}</span>
                </div>
              </>
            )}
            {d.type === "deny" && (
              <div className="kv-row">
                <span className="k">Reason</span>
                <span>{d.reason_code}</span>
              </div>
            )}
            {d.type === "escalate" && (
              <div className="kv-row">
                <span className="k">Ticket</span>
                <span>{d.ticket_id}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
