/**
 * ChatWidget Component
 * 
 * Floating chat widget that provides a multi-state UI for the AI assistant.
 * This component handles the visual presentation and state management for the chat interface.
 * 
 * Architecture:
 * - Uses React Context (AppContext) for global state management
 * - Implements three states: minimized (button), compact (sidebar), maximized (modal)
 * - Handles mobile responsiveness with automatic state transitions
 * - Manages scroll locking when maximized to prevent background scrolling
 * 
 * State Management:
 * - widgetState: 'minimized' | 'compact' | 'maximized' (from AppContext)
 * - mounted: Prevents hydration mismatches in Next.js SSR
 * - isMobile: Tracks viewport size for responsive behavior
 * 
 * Key Features:
 * 1. SSR-safe mounting (prevents hydration errors)
 * 2. Mobile-first design (auto-maximizes on mobile)
 * 3. Scroll lock when maximized (prevents background scroll)
 * 4. Responsive resize handling (switches states on viewport change)
 * 
 * Integration Points:
 * - AppContext: Global state for widget visibility
 * - ChatInterface: Child component that handles actual chat logic
 * - SCSS Modules: Component-scoped styling
 * 
 * For Remix Migration:
 * - This component is framework-agnostic and can be reused as-is
 * - Only dependency is AppContext, which needs to be ported to Remix
 */
'use client';
import './ChatWidget.scss';
import React, { useState, useEffect } from 'react';
import ChatInterface from './ChatInterface';
import { useChatWidget } from '@/contexts/AppContext';

export default function ChatWidget() {
  // Get widget state from global context (managed in AppContext)
  const { state: widgetState, setState: setWidgetState } = useChatWidget();
  
  // Track if component has mounted (prevents SSR hydration mismatches)
  // Next.js renders on server first, so we need to wait for client-side mount
  const [mounted, setMounted] = useState(false);
  
  // Check if we're on mobile - initialize safely for SSR
  // Mobile detection is client-only (window object not available on server)
  const [isMobile, setIsMobile] = useState(false);

  /**
   * Effect 1: Initialize component on client mount
   * Runs once on mount to:
   * - Mark component as mounted (enables client-only features)
   * - Detect initial mobile state (768px breakpoint)
   */
  useEffect(() => {
    setMounted(true);
    // Initialize mobile check on client (window only exists in browser)
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth <= 768);
    }
  }, []);

  /**
   * Effect 2: Handle scroll locking when maximized
   * 
   * When widget is maximized, we need to:
   * 1. Lock background scroll (prevent body from scrolling)
   * 2. Preserve scroll position (so user doesn't lose their place)
   * 3. Allow scrolling within the modal content
   * 4. Clean up on unmount or state change
   * 
   * This is critical for mobile UX - prevents awkward double-scroll behavior
   */
  useEffect(() => {
    // Don't run until mounted (SSR safety)
    if (!mounted || typeof window === 'undefined') return;
    
    if (widgetState === 'maximized') {
      // Save current scroll position before locking
      const scrollY = window.scrollY;
      const body = document.body;
      
      // Lock body scroll by fixing position and hiding overflow
      // This prevents background from scrolling while modal is open
      body.style.position = 'fixed';
      body.style.top = `-${scrollY}px`; // Offset by scroll position
      body.style.width = '100%';
      body.style.overflow = 'hidden';
      
      // Prevent touchmove events on overlay (mobile scroll prevention)
      // But allow scrolling within the modal content itself
      const preventTouchMove = (e: TouchEvent) => {
        // Check if touch is within modal content area
        const target = e.target as HTMLElement;
        const modalContent = target.closest('.chat-widget-modal__content');
        if (!modalContent) {
          // Touch is on overlay, prevent scrolling
          e.preventDefault();
        }
        // If touch is on modal content, allow normal scrolling
      };
      
      // Add touchmove listener with passive: false to allow preventDefault
      document.addEventListener('touchmove', preventTouchMove, { passive: false });
      
      // Cleanup function: restore scroll when maximized state ends
      return () => {
        // Restore body styles
        body.style.position = '';
        body.style.top = '';
        body.style.width = '';
        body.style.overflow = '';
        // Restore scroll position
        window.scrollTo(0, scrollY);
        // Remove touchmove listener
        document.removeEventListener('touchmove', preventTouchMove);
      };
    }

    // Additional cleanup if component unmounts while maximized
    return () => {
      if (typeof window !== 'undefined') {
        const body = document.body;
        body.style.position = '';
        body.style.top = '';
        body.style.width = '';
        body.style.overflow = '';
      }
    };
  }, [widgetState, mounted]);
  
  /**
   * Effect 3: Handle responsive resize events
   * 
   * Monitors viewport width and:
   * - Updates mobile state on resize
   * - Auto-transitions from compact to maximized on mobile
   * - Ensures optimal UX across device sizes
   */
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768; // Standard mobile breakpoint
      setIsMobile(mobile);
      // If we're on mobile and in compact state, switch to maximized
      // Compact sidebar doesn't work well on mobile, so force fullscreen
      if (mobile && widgetState === 'compact') {
        setWidgetState('maximized');
      }
    };
    
    // Check immediately on mount/state change
    checkMobile();
    // Listen for window resize events
    window.addEventListener('resize', checkMobile);
    // Cleanup listener on unmount
    return () => window.removeEventListener('resize', checkMobile);
  }, [widgetState, setWidgetState, mounted]);

  // Don't render until mounted (prevents SSR hydration mismatches)
  // This ensures client-only features (window, document) don't break SSR
  if (!mounted) {
    return null;
  }

  /**
   * State transition handlers
   * These functions update the global widget state via AppContext
   */
  
  // Minimize: Close widget to floating button
  const handleMinimize = () => setWidgetState('minimized');
  
  // Compact: Show sidebar (desktop) or minimize (mobile)
  // Mobile doesn't support compact state, so we minimize instead
  const handleCompact = () => {
    if (isMobile) {
      setWidgetState('minimized');
    } else {
      setWidgetState('compact');
    }
  };
  
  // Maximize: Show fullscreen modal
  const handleMaximize = () => setWidgetState('maximized');
  
  // Open: Initial state when button is clicked
  // Mobile goes straight to maximized, desktop starts with compact
  const handleOpen = () => {
    if (isMobile) {
      setWidgetState('maximized');
    } else {
      setWidgetState('compact');
    }
  };

  // Determine container classes and visibility based on state
  // These flags control which UI elements are rendered
  const isCompact = widgetState === 'compact';
  const isMaximized = widgetState === 'maximized';
  const isOpen = isCompact || isMaximized; // Widget is visible if not minimized

  return (
    <>
      {/* 
        Minimized State: Floating button in bottom-right corner
        - Only visible when widgetState === 'minimized'
        - Clicking opens the chat (calls handleOpen)
        - Includes pulsing animation for attention
      */}
      {widgetState === 'minimized' && (
        <button
          className="chat-widget-btn"
          onClick={handleOpen}
          aria-label="Open AI chat assistant"
        >
          <span className="chat-widget-btn__icon">💬</span>
          <span className="chat-widget-btn__pulse"></span>
        </button>
      )}

      {/* 
        Overlay: Dark backdrop when maximized
        - Clicking overlay restores to compact state (desktop) or minimizes (mobile)
        - Provides visual separation and focus
      */}
      {isMaximized && <div className="chat-widget-overlay" onClick={handleCompact} />}

      {/* 
        Chat Container: Main chat UI
        - Renders as modal (maximized) or panel (compact)
        - Always in DOM but hidden when minimized (display: none)
        - Contains header with controls and ChatInterface component
      */}
      <div 
        className={isMaximized ? "chat-widget-modal" : "chat-widget-panel"}
        style={{ display: isOpen ? 'flex' : 'none' }}
      >
        {/* 
          Header: Title and control buttons
          - Shows widget title and AI icon
          - Contains state transition buttons (maximize/restore/close)
        */}
        <div className={isMaximized ? "chat-widget-modal__header" : "chat-widget-panel__header"}>
          <div className={isMaximized ? "chat-widget-modal__title" : "chat-widget-panel__title"}>
            <span className={isMaximized ? "chat-widget-modal__title-icon" : "chat-widget-panel__title-icon"}>🤖</span>
            <h2 className={isMaximized ? "chat-widget-modal__title-text" : "chat-widget-panel__title-text"}>
              Chat with Mikkel's AI
            </h2>
          </div>
          <div className={isMaximized ? "chat-widget-modal__controls" : "chat-widget-panel__controls"}>
            {/* Maximize button: Only shown in compact state */}
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
            {/* Restore button: Only shown when maximized on desktop (mobile doesn't need it) */}
            {isMaximized && !isMobile && (
              <button
                className="chat-widget-modal__control-btn"
                onClick={handleCompact}
                aria-label="Restore chat"
                title="Restore Down"
              >
                ◱
              </button>
            )}
            {/* Close/Minimize button: Always visible when widget is open */}
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
        {/* 
          Content Area: Contains the actual chat interface
          - ChatInterface handles all message rendering and API communication
          - Scrollable area for message history
        */}
        <div className={isMaximized ? "chat-widget-modal__content" : "chat-widget-panel__content"}>
          <ChatInterface />
        </div>
      </div>
    </>
  );
}