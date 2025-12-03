/**
 * ChatInterface Component
 * 
 * Core chat UI component that handles:
 * - Message state management
 * - API communication with /api/chat endpoint
 * - Input validation and filtering
 * - Session management
 * - Error handling and retry logic
 * - Auto-scrolling to latest messages
 * 
 * Architecture:
 * - Client-side component ('use client' directive for Next.js)
 * - Local state management (useState hooks)
 * - Ref-based DOM manipulation (scroll, focus)
 * - Client-side input filtering (cost optimization)
 * 
 * Data Flow:
 * 1. User types message → input state
 * 2. Client-side filter checks if API call needed
 * 3. If filtered: Show canned response, skip API
 * 4. If valid: POST to /api/chat with messages + sessionId
 * 5. Server processes: rate limit → KB retrieval → LLM call
 * 6. Response updates messages state → re-render
 * 
 * Key Features:
 * - Welcome message on initialization
 * - Session ID generation (unique per browser session)
 * - Rate limit display (remaining messages)
 * - Error handling with retry option
 * - Auto-scroll to latest message
 * - Auto-focus input after sending
 * 
 * For Remix Migration:
 * - Replace fetch('/api/chat') with Remix action call
 * - Session ID can be managed via Remix sessions
 * - Component logic remains the same
 */
'use client';
import './ChatInterface.scss';
import React, { useState, useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import { filterInput } from '../lib/input-filter';

/**
 * Message interface matching the chat API format
 * - role: Message sender (user, assistant, or system)
 * - content: Message text content
 * - timestamp: When message was created (for display)
 */
interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  className?: string;
}

export default function ChatInterface({ className }: ChatInterfaceProps) {
  // Message history state - array of all messages in conversation
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Current input value - controlled input for message textarea
  const [input, setInput] = useState("");
  
  // Loading state - true when API call is in progress
  const [isLoading, setIsLoading] = useState(false);
  
  // Error state - stores error message if API call fails
  const [error, setError] = useState("");
  
  // Session ID - unique identifier for this chat session (used for rate limiting)
  const [sessionId, setSessionId] = useState("");
  
  // Remaining messages - count of messages left in rate limit window
  const [remainingMessages, setRemainingMessages] = useState<number | null>(
    null
  );

  // Ref to scroll target - used to auto-scroll to bottom when new messages arrive
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Ref to input textarea - used to focus input after sending message
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Ref to track initialization - prevents welcome message from showing multiple times
  const initializedRef = useRef(false);

  /**
   * Effect 1: Initialize chat session
   * 
   * Runs once on component mount to:
   * 1. Generate unique session ID (for rate limiting on server)
   * 2. Display welcome message with usage instructions
   * 
   * Uses ref to prevent re-initialization on re-renders
   */
  useEffect(() => {
    // Prevent re-initialization if already done (React StrictMode may call twice)
    if (initializedRef.current) return;
    initializedRef.current = true;

    // Generate unique session ID for this browser session
    // Format: "session-{timestamp}-{random}"
    // Used by server for rate limiting and session tracking
    const id = generateSessionId();
    setSessionId(id);

    // Show welcome message with instructions
    // This is the first message users see when opening chat
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

  /**
   * Effect 2: Auto-scroll to bottom when new messages arrive
   * 
   * Ensures users always see the latest message without manual scrolling
   * Uses smooth scrolling for better UX
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /**
   * Effect 3: Auto-focus input after message is sent
   * 
   * Improves UX by keeping focus on input for rapid conversation
   * Only focuses when not loading (prevents focus during API call)
   */
  useEffect(() => {
    if (!isLoading) {
      inputRef.current?.focus();
    }
  }, [isLoading]);

  /**
   * sendMessage: Main function to handle message sending
   * 
   * Flow:
   * 1. Validate input (not empty, not already loading)
   * 2. Client-side filtering (cost optimization - skip API for filtered queries)
   * 3. If filtered: Show canned response immediately
   * 4. If valid: Add user message to UI, call API
   * 5. Handle response: Add assistant message or show error
   * 
   * Error Handling:
   * - On API failure: Remove user message, restore input, show error
   * - User can retry via retry button
   */
  const sendMessage = async () => {
    // Guard: Don't send if input is empty or already loading
    if (!input.trim() || isLoading) return;

    // Clear any previous errors
    setError('');
    
    // Create user message object
    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    /**
     * CLIENT-SIDE FILTERING (Cost Optimization)
     * 
     * Before calling the API, check if this query should be filtered.
     * Filtered queries get canned responses without API calls, saving:
     * - API costs (no LLM tokens used)
     * - Rate limit usage (filtered queries don't count)
     * - Response time (instant responses)
     * 
     * Filtered query types:
     * - Too short (< 10 chars)
     * - Spam patterns (repeated chars, keyboard mashing)
     * - Generic queries (greetings, vague questions)
     * - Work authorization (canned response)
     * - Salary queries (polite redirect)
     * - Location queries (canned response)
     */
    const conversationHistory = messages.map(m => m.content);
    const filterResult = filterInput(input.trim(), conversationHistory);
    
    if (!filterResult.shouldCallAPI) {
      // FILTERED: Add user message and canned response, skip API call
      setMessages((prev) => [
        ...prev,
        userMessage,
        {
          role: 'assistant',
          content: filterResult.response || "Invalid input, sorry, try again.",
          timestamp: new Date(),
        }
      ]);

      setInput(''); // Clear input

      // Log filtered query for debugging/monitoring
      console.log(`Filtered query (${filterResult.reason}):`, input.trim());

      return; // Early return - no API call needed
    }

    /**
     * VALID QUERY: Proceed with API call
     * 
     * 1. Add user message to UI immediately (optimistic update)
     * 2. Clear input
     * 3. Set loading state
     * 4. Call API
     * 5. Handle response or error
     */
    
    // Add user message to UI (optimistic update - shows immediately)
    setMessages((prev) => [...prev, userMessage]);
    setInput(''); // Clear input
    setIsLoading(true); // Show loading indicator

    try {
      /**
       * API Call to /api/chat
       * 
       * Sends:
       * - messages: Full conversation history (for context)
       * - sessionId: For rate limiting and session tracking
       * 
       * Server processes:
       * 1. Rate limiting check
       * 2. Server-side input validation
       * 3. Knowledge base retrieval (keyword-based RAG)
       * 4. Prompt building (context injection)
       * 5. LLM call (multi-provider with fallback)
       * 6. Response formatting
       */
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Send full conversation history for context awareness
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          sessionId, // For rate limiting
        }),
      });

      const data = await response.json();

      // Check for API errors (rate limit, server error, etc.)
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // SUCCESS: Add assistant response to messages
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.content, // LLM-generated response
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Update rate limit display (remaining messages in window)
      setRemainingMessages(data.remaining);

    } catch (error: any) {
      // ERROR: Handle API failure
      console.error('Chat error', error);
      setError(error.message || 'Failed to send message. Please try again.');

      // Rollback: Remove the user message that failed
      // This prevents orphaned user messages without responses
      setMessages((prev) => prev.slice(0, -1));
      
      // Restore input so user can retry
      setInput(userMessage.content);
    } finally {
      // Always clear loading state (success or failure)
      setIsLoading(false);
    }
  };

  /**
   * Keyboard handler for textarea
   * - Enter: Send message
   * - Shift+Enter: New line (default textarea behavior)
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default newline
      sendMessage();
    }
    // Shift+Enter allows newline (default behavior, no preventDefault)
  };

  /**
   * Retry handler for failed messages
   * Clears error and re-sends the last message
   */
  const handleRetry = () => {
    setError(''); // Clear error state
    sendMessage(); // Re-attempt send
  };

  return (
    <div className={`chat-interface ${className || ''}`}>
      {/* 
        Messages Area: Scrollable container for chat history
        - Renders all messages using ChatMessage component
        - Shows loading indicator when API call in progress
        - Auto-scrolls to bottom via messagesEndRef
      */}
      <div className="chat-interface__messages">
        {messages.map((message, index) => (
          <ChatMessage
            key={index} // Using index as key (acceptable for append-only list)
            message={message}
            timestamp={message.timestamp}
            isLatest={index === messages.length -1} // Highlight latest message
          />
        ))}

        {/* Loading indicator: Shows when API call is in progress */}
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

        {/* Scroll target: Invisible div at bottom for auto-scroll */}
        <div ref={messagesEndRef} />
      </div>

      {/* 
        Error Display: Shows API errors with retry option
        - Only visible when error state is set
        - Provides retry button to re-send failed message
      */}
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

      {/* 
        Input Area: Message composition and controls
        - Textarea for message input
        - Send button (disabled when loading or empty)
        - Rate limit indicator (shows remaining messages)
        - Keyboard hints
      */}
      <div className="chat-interface__input-container">
        {/* Rate limit indicator: Shows remaining messages in current window */}
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
            ref={inputRef} // For auto-focus after sending
            className="chat-interface__input"
            value={input} // Controlled input
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown} // Enter to send, Shift+Enter for newline
            placeholder="Ask about Mikkel's experience, or paste a job description..."
            disabled={isLoading} // Disable during API calls
            rows={2} // Initial height (auto-expands)
            maxLength={5000} // Prevent extremely long messages
            aria-label="Message input"
          />

          {/* Send button: Disabled when input is empty or loading */}
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

        {/* Keyboard hints for better UX */}
        <div className="chat-interface__input-hint">
          Press <kbd>Enter</kbd> to send, <kbd>Shift + Enter</kbd> for new line
        </div>
      </div>
    </div>
  );
}

/**
 * Generate unique session ID for rate limiting
 * Format: "session-{timestamp}-{random}"
 * - Timestamp ensures uniqueness across time
 * - Random string ensures uniqueness within same millisecond
 */
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
