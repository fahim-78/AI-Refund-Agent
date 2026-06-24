import { useState } from "react";
import { DEMO_SCENARIOS } from "../demoScenarios.js";

export default function CustomerLogin({ customers, onSelect, onSkip }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = customers.filter(c => 
    c.customer_id.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div className="login-card">
      <h1>Welcome to Orbiq Support</h1>
      <p>
        Pick a customer to chat as (this simulates being logged in), or skip and identify
        yourself in the chat the way a real customer would — by email or customer ID.
      </p>

      <div className="search-container">
        <input 
          type="text" 
          className="search-input"
          placeholder="Search by customer ID..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="customer-grid">
        {filteredCustomers.map((c) => {
          const scenario = DEMO_SCENARIOS[c.customer_id];
          return (
            <button key={c.customer_id} className="customer-card" onClick={() => onSelect(c)}>
              <div className="name">{c.name}</div>
              <div className="email">{c.email}</div>
              <span className={`tier-pill ${c.tier}`}>{c.tier}</span>
              {scenario && (
                <div className="scenario-hint">
                  <code>{scenario.orderId}</code> — {scenario.label}
                </div>
              )}
            </button>
          );
        })}
      </div>
      <button className="skip-link" onClick={onSkip}>
        Skip — start as a guest →
      </button>
    </div>
  );
}
