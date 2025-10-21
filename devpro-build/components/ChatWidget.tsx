// devpro-build/components/ChatWidget.tsx

import React, { useState } from 'react';
import ChatInterface from './ChatInterface';

type WidgetState = 'minimized' | 'compact' | 'maximized';

export default function ChatWidget() {
  const [widgetState, setWidgetState] = useState<WidgetState>('minimized');

  const handleMinimize = () => setWidgetState('minimized');
  const handleCompact = () => setWidgetState('compact');
  const handleMaximize = () => setWidgetState('maximized');

  return (
    <>
      {/* Minimized State - Floating Button */}
      {widgetState === 'minimized' && (
        <button
          className="chat-widget-btn"
          onClick={handleCompact}
          aria-label="Open AI chat assistant"
        >
          <span className="chat-widget-btn__icon">💬</span>
          <span className="chat-widget-btn__pulse"></span>
        </button>
      )}

      {/* Compact State - Bottom-Right Panel */}
      {widgetState === 'compact' && (
        <div className="chat-widget-panel">
          <div className="chat-widget-panel__header">
            <div className="chat-widget-panel__title">
              <span className="chat-widget-panel__title-icon">🤖</span>
              <h2 className="chat-widget-panel__title-text">Chat with Mikkel's AI</h2>
            </div>
            <div className="chat-widget-panel__controls">
              <button
                className="chat-widget-panel__control-btn"
                onClick={handleMaximize}
                aria-label="Maximize chat"
                title="Maximize"
              >
                ⛶
              </button>
              <button
                className="chat-widget-panel__control-btn"
                onClick={handleMinimize}
                aria-label="Minimize chat"
                title="Minimize"
              >
                ➖
              </button>
            </div>
          </div>
          <div className="chat-widget-panel__content">
            <ChatInterface />
          </div>
        </div>
      )}

      {/* Maximized State - Full-Screen Modal */}
      {widgetState === 'maximized' && (
        <>
          <div className="chat-widget-overlay" onClick={handleCompact} />
          <div className="chat-widget-modal">
            <div className="chat-widget-modal__header">
              <div className="chat-widget-modal__title">
                <span className="chat-widget-modal__title-icon">🤖</span>
                <h2 className="chat-widget-modal__title-text">Chat with Mikkel's AI</h2>
              </div>
              <div className="chat-widget-modal__controls">
                <button
                  className="chat-widget-modal__control-btn"
                  onClick={handleCompact}
                  aria-label="Restore chat"
                  title="Restore Down"
                >
                  ◱
                </button>
                <button
                  className="chat-widget-modal__control-btn chat-widget-modal__control-btn--close"
                  onClick={handleMinimize}
                  aria-label="Close chat"
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="chat-widget-modal__content">
              <ChatInterface />
            </div>
          </div>
        </>
      )}
    </>
  );
}