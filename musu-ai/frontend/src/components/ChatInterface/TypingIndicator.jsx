export default function TypingIndicator() {
  return (
    <div className="typing-indicator" id="typing-indicator">
      <div className="typing-indicator__avatar">M</div>
      <div className="typing-indicator__bubble">
        <div className="typing-indicator__dot"></div>
        <div className="typing-indicator__dot"></div>
        <div className="typing-indicator__dot"></div>
      </div>
    </div>
  );
}
