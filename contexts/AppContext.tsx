/**
 * AppContext - Global Application State Management
 * 
 * Provides React Context for app-wide state that needs to be shared
 * across multiple components without prop drilling.
 * 
 * Architecture:
 * - Uses React Context API (lightweight alternative to Redux)
 * - Provider component wraps the app in layout.tsx
 * - Custom hooks provide type-safe access to specific state slices
 * 
 * Current State:
 * - ChatWidget: Controls visibility state of the chat widget
 *   - 'minimized': Hidden, shows floating button
 *   - 'compact': Sidebar mode (desktop)
 *   - 'maximized': Fullscreen modal (mobile/desktop)
 * 
 * Design Pattern:
 * - Each state slice has its own hook (useChatWidget, etc.)
 * - State and setter are grouped together
 * - Extensible: Easy to add new state slices (theme, auth, etc.)
 * 
 * For Remix Migration:
 * - Remix has built-in session management, but this context pattern
 *   can still be used for client-side UI state
 * - Consider using Remix sessions for server-side state (auth, etc.)
 */
'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define all app-wide state types
type ChatWidgetState = 'minimized' | 'compact' | 'maximized';

/**
 * AppState Interface
 * 
 * Defines the shape of global application state
 * Each slice contains state value and setter function
 * 
 * Extensibility: Add new slices as needed (theme, user, etc.)
 */
interface AppState {
  // Chat Widget State: Controls chat widget visibility
  chatWidget: {
    state: ChatWidgetState;
    setState: (state: ChatWidgetState) => void;
  };
  
  // Future state can be added here (examples commented out)
  // theme: {
  //   mode: 'light' | 'dark';
  //   setMode: (mode: 'light' | 'dark') => void;
  // };
  // user: {
  //   isLoggedIn: boolean;
  //   setIsLoggedIn: (loggedIn: boolean) => void;
  // };
}

/**
 * Create the context with null default (will be provided by AppProvider)
 * TypeScript ensures we check for null before using
 */
const AppContext = createContext<AppState | null>(null);

/**
 * useAppContext: Base hook to access full app context
 * 
 * Throws error if used outside AppProvider (prevents runtime errors)
 * Use this for accessing multiple state slices at once
 */
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

/**
 * useChatWidget: Specific hook for chat widget state
 * 
 * Provides type-safe access to chat widget state and setter
 * This is the recommended way to access chat widget state
 * 
 * Usage:
 *   const { state, setState } = useChatWidget();
 *   setState('maximized');
 */
export const useChatWidget = () => {
  const { chatWidget } = useAppContext();
  return chatWidget;
};

// Future hooks can be added here following the same pattern
// export const useTheme = () => {
//   const { theme } = useAppContext();
//   return theme;
// };

/**
 * AppProvider: Context provider component
 * 
 * Wraps the application and provides global state to all children
 * Must be placed high in the component tree (typically in layout.tsx)
 * 
 * State Management:
 * - Each state slice uses useState hook
 * - State and setter are grouped in appState object
 * - Provider value is memoized (could use useMemo for optimization if needed)
 * 
 * Initial State:
 * - ChatWidget: 'maximized' (shows chat on page load)
 *   - Can be changed to 'minimized' if you want chat hidden by default
 */
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // Chat Widget State: Controls visibility of the chat widget
  // Initial state: 'maximized' (shows chat on page load)
  // Change to 'minimized' if you want chat hidden by default
  const [chatWidgetState, setChatWidgetState] = useState<ChatWidgetState>('maximized');

  // Future state can be added here following the same pattern
  // const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  // const [isLoggedIn, setIsLoggedIn] = useState(false);

  /**
   * Construct the app state object
   * Groups all state slices together for the context value
   * 
   * Pattern: Each slice has { value, setter } structure
   */
  const appState: AppState = {
    chatWidget: {
      state: chatWidgetState,
      setState: setChatWidgetState,
    },
    
    // Future state can be added here following the same pattern
    // theme: {
    //   mode: themeMode,
    //   setMode: setThemeMode,
    // },
    // user: {
    //   isLoggedIn,
    //   setIsLoggedIn,
    // },
  };

  /**
   * Provide the context value to all children
   * Any component in the tree can now use useAppContext() or specific hooks
   */
  return (
    <AppContext.Provider value={appState}>
      {children}
    </AppContext.Provider>
  );
}
