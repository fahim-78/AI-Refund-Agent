import { useEffect, useRef, useState } from "react";
import { api } from "../api.js";
import { useSpeech } from "../hooks/useSpeech.js";
import MessageBubble from "./MessageBubble.jsx";
import { DEMO_SCENARIOS } from "../demoScenarios.js";

function initials(name) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ChatWindow({ customer, onEndChat }) {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const listRef = useRef(null);

  const scenario = customer ? DEMO_SCENARIOS[customer.customer_id] : null;

  useEffect(() => {
    let cancelled = false;
    api.createSession().then(({ sessionId }) => {
      if (cancelled) return;
      setSessionId(sessionId);
      const greeting = customer
        ? `Hi ${customer.name.split(" ")[0]}! I'm Orbiq's support assistant. How can I help with your order today?`
        : "Hi! I'm Orbiq's support assistant. To get started, could you tell me your email or customer ID?";
      setMessages([{ role: "assistant", content: greeting }]);
      if (customer && scenario) {
        setInput(`Hi, my email is ${customer.email}. I'd like a refund for order ${scenario.orderId}.`);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const { supported: voiceSupported, listening, speaking, interimTranscript, startListening, stopListening, speak } =
    useSpeech({
      onResult: (text) => {
        sendMessage(text);
      },
    });

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || !sessionId || sending) return;
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setInput("");
    setSending(true);
    try {
      const { reply } = await api.sendMessage(sessionId, trimmed);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      if (autoSpeak && voiceSupported) speak(reply);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Something went wrong reaching the support system: ${err.message}` },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="chat-card">
      <div className="chat-header">
        <div className="who">
          <div className="avatar">{customer ? initials(customer.name) : "G"}</div>
          <div>
            <div className="name">{customer ? customer.name : "Guest"}</div>
            <div className="sub">{customer ? customer.email : "Not yet identified"}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {voiceSupported && (
            <button
              className="icon-btn"
              title={autoSpeak ? "Voice replies: on" : "Voice replies: off"}
              onClick={() => setAutoSpeak((v) => !v)}
              type="button"
            >
              {autoSpeak ? "🔊" : "🔇"}
            </button>
          )}
          <button className="end-chat-btn" onClick={onEndChat} type="button">
            ← Switch customer
          </button>
        </div>
      </div>

      <div className="message-list" ref={listRef}>
        {messages.map((m, i) => (
          <MessageBubble key={i} role={m.role} content={m.content} />
        ))}
        {sending && (
          <div className="msg-row assistant">
            <div className="msg-avatar">AI</div>
            <div className="msg-bubble typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
      </div>

      {listening && (
        <div className="voice-banner">🎙 listening… {interimTranscript && `"${interimTranscript}"`}</div>
      )}
      {speaking && <div className="voice-banner">🔊 speaking reply…</div>}

      <form className="chat-input-row" onSubmit={handleSubmit}>
        {voiceSupported && (
          <button
            type="button"
            className={`icon-btn mic ${listening ? "listening" : ""}`}
            onClick={() => (listening ? stopListening() : startListening())}
            title="Speak your message"
          >
            🎤
          </button>
        )}
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message…"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage(input);
            }
          }}
        />
        <button className="icon-btn send" type="submit" disabled={!input.trim() || sending}>
          ➤
        </button>
      </form>
    </div>
  );
}
