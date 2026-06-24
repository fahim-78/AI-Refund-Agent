export default function CrmReference({ crm }) {
  if (!crm) return <div className="empty-state">Loading CRM data…</div>;

  return (
    <>
      <div className="summary-card">
        <h4>Customers ({crm.customers.length})</h4>
        <div style={{ maxHeight: 220, overflowY: "auto" }}>
          <table className="crm-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Tier</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {crm.customers.map((c) => (
                <tr key={c.customer_id}>
                  <td>{c.customer_id}</td>
                  <td style={{ fontFamily: "var(--font-body)" }}>{c.name}</td>
                  <td>{c.tier}</td>
                  <td>{c.fraud_flag ? "FRAUD" : c.refunds_last_90_days > 3 ? "HIGH REFUNDS" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="summary-card">
        <h4>Orders ({crm.orders.length})</h4>
        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          <table className="crm-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {crm.orders.map((o) => (
                <tr key={o.order_id}>
                  <td>{o.order_id}</td>
                  <td>{o.category}{o.final_sale ? "*" : ""}</td>
                  <td>${o.price.toFixed(2)}</td>
                  <td>{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="kv-row" style={{ marginTop: 6 }}>
          <span className="k">* = final sale</span>
        </div>
      </div>
    </>
  );
}
