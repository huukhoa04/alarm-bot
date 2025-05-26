import React, { createContext, ReactNode, useContext, useRef, useState } from 'react';

interface WebSocketContextType {
  socket: WebSocket | null;
  isConnected: boolean;
  error: string | null;
  disconnect: () => void;
  connectWebSocket: () => void;
  sendMessage: (message: string) => void;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

interface WebSocketProviderProps {
  children: ReactNode;
  url: string;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children, url }) => {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(url);
      console.log('Connecting to WebSocket:', url);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        console.log('Message received:', event.data);
        // Handle incoming messages here
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        socketRef.current = null;
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error');
      };

    } catch (err) {
      setError('Failed to create WebSocket connection');
    }
  };

  const sendMessage = (message: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(message);
      console.log('Message sent:', message);
    } else {
      console.warn('WebSocket is not connected. ReadyState:', socketRef.current?.readyState);
      setError('Cannot send message: WebSocket not connected');
    }
  };

  const reconnect = () => {
    if (socketRef.current) {
      socketRef.current.close();
    }
    connectWebSocket();
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setIsConnected(false);
    }
  }

  const value = {
    socket: socketRef.current,
    isConnected,
    error,
    disconnect,
    sendMessage,
    connectWebSocket,
    reconnect,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};