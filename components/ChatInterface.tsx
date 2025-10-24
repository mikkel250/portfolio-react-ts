'use client';
import './ChatInterface.scss';
import React, { useState, useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import { filterInput } from '../lib/input-filter';

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  className?: string;
}

export default function ChatInterface({ className }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [remainingMessages, setRemainingMessages] = useState<number | null>(
    null
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const initializedRef = useRef(false);

  // Initialize session ID and show welcome message (only once)
  useEffect(() => {
    // Prevent re-initialization if already done
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Generate session ID
    const id = generateSessionId();
    setSessionId(id);

    // Show welcome message
    setMessages([
      {
        role: "assistant",
        content: `Hi! I'm Mikkel's AI assistant—your interactive way to learn about his background and experience.

**How to use me:**
- **Paste a full job description** for a detailed match analysis with scoring
- **Ask me anything** about Mikkel's experience, projects, skills, or technical background
- **Close this chat** (✕ button above) to view his traditional portfolio site

Try asking: "What's Mikkel's experience with React?" or "Tell me about his most impactful project."

**Bonus:** English not your first language? In your message, say: "Give me the answer in Hindi" and I'll translate it for you, or just write your message in your preferred language and I'll respond in that language!`,
        timestamp: new Date(),
      },
    ]);
  }, []);

  // auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // focus input after sending
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    setError('');
    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    // check for input that should not be sent to the API
    const conversationHistory = messages.map(m => m.content);
    const filterResult = filterInput(input.trim(), conversationHistory);
    if (!filterResult.shouldCallAPI) {
      // add both user message and return canned reponse with it, skipping API call
      setMessages((prev) => [
        ...prev,
        userMessage,
        {
          role: 'assistant',
          content: filterResult.response || "Invalid input, sorry, try again.",
          timestamp: new Date(),
        }
      ]);

      setInput('');

      // optional: log that we filtered this
      console.log(`Filtered query (${filterResult.reason}):`, input.trim());

      return; // early return to prevent API call further down in the function
    }

    // add user message, continue with API call 
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          sessionId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.content,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setRemainingMessages(data.remaining);

    } catch (error: any) {
      console.error('Chat error', error);
      setError(error.message || 'Failed to send message. Please try again.');

      // remove the user message that failed
      setMessages((prev) => prev.slice(0, -1));
      // restore input
      setInput(userMessage.content);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleRetry = () => {
    setError('');
    sendMessage();
  };

  return (
    <div className={`chat-interface ${className || ''}`}>
      {/* Messages area */}
      <div className="chat-interface__messages">
        {messages.map((message, index) => (
          <ChatMessage
            key={index}
            message={message}
            timestamp={message.timestamp}
            isLatest={index === messages.length -1}
          />
        ))}

        {isLoading && (
          <div className="chat-interface__loading">
            <div className="chat-interface__loading-avatar">🤖</div>
            <div className="chat-interface__loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error display */}
      {error && (
        <div className="chat-interface__error" role="alert">
          <span className="chat-interface__error-icon">⚠️</span>
          <span className="chat-interface__error-text">{error}</span>
          <button
            className="chat-interface__error-retry"
            onClick={handleRetry}
          >
            Retry
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="chat-interface__input-container">
        {/* rate limit indicator */}
        {remainingMessages !== null && (
          <div className="chat-interface__rate-limit">
            <span className="chat-interface__rate-limit-icon">💬</span>
            <span className="chat-interface__rate-limit-text">
              {remainingMessages} {remainingMessages === 1 ? 'message' : 'messages'} remaining.
            </span>
          </div>
        )}

        <div className="chat-interface__input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-interface__input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about Mikkel's experience, or paste a job description..."
            disabled={isLoading}
            rows={2}
            maxLength={5000}
            aria-label="Message input"
          />

          <button
            className="chat-interface__send-btn"
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
          >
            {isLoading ? (
              <span className="chat-interface__send-icon">⏳</span>
            ) : (
            <span className="chat-interface__send-icon">📤</span>
            )}
          </button>
        </div>

        <div className="chat-interface__input-hint">
          Press <kbd>Enter</kbd> to send, <kbd>Shift + Enter</kbd> for new line
        </div>
      </div>
    </div>
  );
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
