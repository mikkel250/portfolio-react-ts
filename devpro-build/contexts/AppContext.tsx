'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define all app-wide state types
type ChatWidgetState = 'minimized' | 'compact' | 'maximized';

// App-wide state interface
interface AppState {
  // Chat Widget State
  chatWidget: {
    state: ChatWidgetState;
    setState: (state: ChatWidgetState) => void;
  };
  
  // Future state can be added here
  // theme: {
  //   mode: 'light' | 'dark';
  //   setMode: (mode: 'light' | 'dark') => void;
  // };
  // user: {
  //   isLoggedIn: boolean;
  //   setIsLoggedIn: (loggedIn: boolean) => void;
  // };
}

// Create the context
const AppContext = createContext<AppState | null>(null);

// Custom hook to use app context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

// Specific hooks for different parts of the app
export const useChatWidget = () => {
  const { chatWidget } = useAppContext();
  return chatWidget;
};

// Future hooks can be added here
// export const useTheme = () => {
//   const { theme } = useAppContext();
//   return theme;
// };

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // Chat Widget State
  const [chatWidgetState, setChatWidgetState] = useState<ChatWidgetState>('maximized');

  // Future state can be added here
  // const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  // const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Construct the app state
  const appState: AppState = {
    chatWidget: {
      state: chatWidgetState,
      setState: setChatWidgetState,
    },
    
    // Future state can be added here
    // theme: {
    //   mode: themeMode,
    //   setMode: setThemeMode,
    // },
    // user: {
    //   isLoggedIn,
    //   setIsLoggedIn,
    // },
  };

  return (
    <AppContext.Provider value={appState}>
      {children}
    </AppContext.Provider>
  );
}
