import { useEffect, useState } from "react";
import { api } from "../api.js";
import CustomerLogin from "../components/CustomerLogin.jsx";
import ChatWindow from "../components/ChatWindow.jsx";
import { DEMO_SCENARIOS } from "../demoScenarios.js";

export default function CustomerView() {
  const [customers, setCustomers] = useState([]);
  const [selected, setSelected] = useState(undefined); // undefined = not chosen yet, null = guest

  useEffect(() => {
    api.listCustomers().then(setCustomers).catch(() => setCustomers([]));
  }, []);

  if (selected === undefined) {
    return (
      <div className="customer-view">
        <div className="customer-view-inner">
          <CustomerLogin customers={customers} onSelect={setSelected} onSkip={() => setSelected(null)} />
        </div>
      </div>
    );
  }

  const scenario = selected ? DEMO_SCENARIOS[selected.customer_id] : null;

  return (
    <div className="customer-view">
      <div className="customer-view-inner">
        <ChatWindow key={selected?.customer_id || "guest"} customer={selected} onEndChat={() => setSelected(undefined)} />
        {scenario && (
          <div className="scenario-panel">
            <h3>Demo scenario — {scenario.label}</h3>
            <p style={{ margin: 0 }}>
              Order <code>{scenario.orderId}</code>: {scenario.detail}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
