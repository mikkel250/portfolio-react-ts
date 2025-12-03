/**
 * ChatMessage Component
 * 
 * Renders individual chat messages with:
 * - Role-based styling (user vs assistant)
 * - Markdown rendering for assistant messages
 * - Timestamp display (relative time)
 * - Custom markdown component styling
 * 
 * Architecture:
 * - Client component ('use client' for Next.js)
 * - Uses react-markdown for rich text rendering
 * - Custom component overrides for consistent styling
 * - System messages are filtered out (not displayed)
 * 
 * Markdown Features:
 * - Paragraphs, lists (ordered/unordered)
 * - Code blocks and inline code
 * - Links (external, opens in new tab)
 * - Bold, italic, headings
 * - Custom styling via SCSS modules
 * 
 * For Remix Migration:
 * - Component is framework-agnostic, works as-is
 * - Only dependency is react-markdown (works in any React app)
 */
'use client';
import './ChatMessage.scss';
import React from "react";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  message: {
    role: "user" | "assistant" | "system";
    content: string;
  };
  timestamp?: Date;
  isLatest?: boolean; // Used for highlighting the most recent message
}

export default function ChatMessage({
  message,
  timestamp,
  isLatest,
}: ChatMessageProps) {
  const { role, content } = message;

  // Don't render system messages (they're for the LLM, not for display)
  // System messages contain instructions and context, not user-facing content
  if (role === "system") return null;

  return (
    <div
      className={`chat-message chat-message--${role} ${
        isLatest ? "chat-message--latest" : ""
      }`}
      role='article'
      aria-label={`${role === "user" ? "Your" : "Assistant"} message`}
    >
      {/* Avatar: Visual indicator of message sender */}
      <div className="chat-message__avatar">
        {role === 'user' ? (
          <span className="chat-message__avatar-icon">👤</span>
        ) : (
          <span className="chat-message__avatar-icon">🤖</span>
        )}
      </div>

      <div className="chat-message__content-wrapper">
        {/* Header: Role label and timestamp */}
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

        {/* Content: Message body with markdown rendering for assistant messages */}
        <div className="chat-message__content">
          {role === 'assistant' ? (
            /**
             * Assistant messages: Render as markdown
             * 
             * react-markdown converts markdown syntax to HTML
             * Custom components ensure consistent styling via SCSS modules
             * 
             * Supported markdown features:
             * - Paragraphs, headings (h1-h3)
             * - Lists (ordered/unordered)
             * - Code blocks and inline code
             * - Links (external, secure)
             * - Bold, italic text
             */
            <ReactMarkdown
              components={{
                // Custom component overrides for consistent styling
                p: ({ children }) => <p className="chat-message__paragraph">{children}</p>,
                ul: ({ children }) => <ul className="chat-message__list">{children}</ul>,
                ol: ({ children }) => <ol className="chat-message__list--ordered">{children}</ol>,
                li: ({ children }) => <li className="chat-message__list-item">{children}</li>,
                // Code: Render as plain text (no special styling)
                code: ({inline, children, ...props}: any) =>
                  inline ? (
                    // Inline code: Render as plain text
                    <span {...props}>{children}</span>
                  ) : (
                    // Code block: Render as plain text paragraph
                    <p className="chat-message__paragraph">{children}</p>
                  ),
                // Links: External links open in new tab with security attributes
                a: ({href, children}) => (
                  <a
                    href={href}
                    className="chat-message__link"
                    target="_blank"
                    rel="noopener noreferrer" // Security: Prevents window.opener access
                  >
                    {children}
                  </a>
                ),
                // Text formatting
                strong: ({ children }) => <strong className="chat-message__bold">{children}</strong>,
                em: ({ children }) => <em className="chat-message__italic">{children}</em>,
                // Headings: Limited to h1-h3 for chat context
                h1: ({ children }) => <h1 className="chat-message__heading chat-message__heading--1">{children}</h1>,
                h2: ({ children }) => <h2 className="chat-message__heading chat-message__heading--2">{children}</h2>,
                h3: ({ children }) => <h3 className="chat-message__heading chat-message__heading--3">{children}</h3>,
              }}
            >
              {content}
            </ReactMarkdown>
          ) : (
            /**
             * User messages: Plain text (no markdown)
             * 
             * Users typically type plain text, so no markdown parsing needed
             * Simpler rendering for better performance
             */
            <p className="chat-message__text">{content}</p>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Format timestamp as relative time
 * 
 * Returns human-readable relative time:
 * - "Just now" (< 1 minute)
 * - "5m ago" (< 1 hour)
 * - "2h ago" (< 24 hours)
 * - "3:45 PM" (older than 24 hours, shows time)
 * 
 * This provides better UX than absolute timestamps for recent messages
 */
function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);

  // Less than 1 minute: "Just now"
  if (diffMins < 1) return 'Just now';
  
  // Less than 1 hour: "5m ago"
  if (diffMins < 60) return `${diffMins}m ago`;
  
  // Less than 24 hours: "2h ago"
  if (diffHours < 24) return `${diffHours}h ago`;

  // Older: Show actual time (e.g., "3:45 PM")
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}