'use client';
import './ChatWidget.scss';
import React, { useState, useEffect } from 'react';
import ChatInterface from './ChatInterface';

type WidgetState = 'minimized' | 'compact' | 'maximized';

export default function ChatWidget() {
  const [widgetState, setWidgetState] = useState<WidgetState>('maximized');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (widgetState === 'maximized') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [widgetState]);

  // Only render on client to avoid hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const handleMinimize = () => setWidgetState('minimized');
  const handleCompact = () => setWidgetState('compact');
  const handleMaximize = () => setWidgetState('maximized');

  // Determine container classes based on state
  const isCompact = widgetState === 'compact';
  const isMaximized = widgetState === 'maximized';
  const isOpen = isCompact || isMaximized;

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

      {/* Overlay for maximized state */}
      {isMaximized && <div className="chat-widget-overlay" onClick={handleCompact} />}

      {/* Chat container - always rendered but hidden when minimized */}
      <div 
        className={isMaximized ? "chat-widget-modal" : "chat-widget-panel"}
        style={{ display: isOpen ? 'flex' : 'none' }}
      >
        <div className={isMaximized ? "chat-widget-modal__header" : "chat-widget-panel__header"}>
          <div className={isMaximized ? "chat-widget-modal__title" : "chat-widget-panel__title"}>
            <span className={isMaximized ? "chat-widget-modal__title-icon" : "chat-widget-panel__title-icon"}>🤖</span>
            <h2 className={isMaximized ? "chat-widget-modal__title-text" : "chat-widget-panel__title-text"}>
              Chat with Mikkel's AI
            </h2>
          </div>
          <div className={isMaximized ? "chat-widget-modal__controls" : "chat-widget-panel__controls"}>
            {isCompact && (
              <button
                className="chat-widget-panel__control-btn"
                onClick={handleMaximize}
                aria-label="Maximize chat"
                title="Maximize"
              >
                ⛶
              </button>
            )}
            {isMaximized && (
              <button
                className="chat-widget-modal__control-btn"
                onClick={handleCompact}
                aria-label="Restore chat"
                title="Restore Down"
              >
                ◱
              </button>
            )}
            <button
              className={isMaximized ? "chat-widget-modal__control-btn chat-widget-modal__control-btn--close" : "chat-widget-panel__control-btn"}
              onClick={handleMinimize}
              aria-label="Close chat"
              title={isMaximized ? "Close" : "Minimize"}
            >
              {isMaximized ? "✕" : "➖"}
            </button>
          </div>
        </div>
        <div className={isMaximized ? "chat-widget-modal__content" : "chat-widget-panel__content"}>
          <ChatInterface />
        </div>
      </div>
    </>
  );
}