export default function MessageBubble({ role, content }) {
  const isUser = role === "user";
  return (
    <div className={`msg-row ${isUser ? "user" : "assistant"}`}>
      <div className="msg-avatar">{isUser ? "You" : "AI"}</div>
      <div className="msg-bubble">{content}</div>
    </div>
  );
}
