import React from "react";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  message: {
    role: "user" | "assistant" | "system";
    content: string;
  };
  timestamp?: Date;
  isLatest?: boolean;
}

export default function ChatMessage({
  message,
  timestamp,
  isLatest,
}: ChatMessageProps) {
  const { role, content } = message;

  // don't render system messages (they're for the LLM)
  if (role === "system") return null;

  return (
    <div
      className={`chat-message chat-message--${role} ${
        isLatest ? "chat-message--latest" : ""
      }`}
      role='article'
      aria-label={`${role === "user" ? "Your" : "Assistant"} message`}
    >
      <div className="chat-message__avatar">
        {role === 'user' ? (
          <span className="chat-message__avatar-icon">👤</span>
        ) : (
          <span className="chat-message__avatar-icon">🤖</span>
        )}
      </div>

      <div className="chat-message__content-wrapper">
        <div className="chat-message__header">
          <span className="chat-message__role">
            {role === 'user' ? 'You' : 'AI Assistant'}
          </span>
          {timestamp && (
            <span className="chat-message__timestamp">
              {formatTimestamp(timestamp)}
            </span>
          )}
        </div>

        <div className="chat-message__content">
          {role === 'assistant' ? (
            <ReactMarkdown
              components={{
                // custom rendering for markdown elements
                p: ({ children }) => <p className="chat-message__paragraph">{children}</p>,
                ul: ({ children }) => <ul className="chat-message__list">{children}</ul>,
                ol: ({ children }) => <ol className="chat-message__list--ordered">{children}</ol>,
                li: ({ children }) => <li className="chat-message__list-item">{children}</li>,
                code: ({inline, children, ...props}: any) =>
                  inline ? (
                    <code className="chat-message__code-inline" {...props}>
                      {children}
                    </code>
                  ) : (
                    <pre className="chat-message__code-block">
                      <code {...props}>{children}</code>
                    </pre>
                  ),
                a: ({href, children}) => (
                  <a
                    href={href}
                    className="chat-message__link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
                strong: ({ children }) => <strong className="chat-message__bold">{children}</strong>,
                em: ({ children }) => <em className="chat-message__italic">{children}</em>,
                h1: ({ children }) => <h1 className="chat-message__heading chat-message__heading--1">{children}</h1>,
                h2: ({ children }) => <h2 className="chat-message__heading chat-message__heading--2">{children}</h2>,
                h3: ({ children }) => <h3 className="chat-message__heading chat-message__heading--3">{children}</h3>,
              }}
            >
              {content}
            </ReactMarkdown>
          ) : (
            <p className="chat-message__text">{content}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// helper function to format timestamp
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}