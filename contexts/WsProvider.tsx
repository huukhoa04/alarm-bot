import React, { createContext, ReactNode, useContext, useRef, useState, useEffect } from 'react';

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
  const reconnectTimeoutRef = useRef<number | null>(null);
  const pingIntervalRef = useRef<number | null>(null); // Add ping interval ref
  const shouldReconnectRef = useRef<boolean>(true);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const maxReconnectAttempts = 5;

  // Setup ping interval when connection status changes
  useEffect(() => {
    // Clear any existing ping interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    // Start ping interval if connected
    if (isConnected && socketRef.current) {
      console.log('Starting ping interval');
      pingIntervalRef.current = setInterval(() => {
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: 'ping' }));
          console.log('Ping sent to server');
        }
      }, 2000);
    }

    // Cleanup on unmount or when connection changes
    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };
  }, [isConnected]);

  const connectWebSocket = () => {
    // Clear any existing reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      // Close existing connection if any
      if (socketRef.current) {
        socketRef.current.close();
      }

      const ws = new WebSocket(url);
      console.log('Connecting to WebSocket:', url);
      socketRef.current = ws;
      shouldReconnectRef.current = true; // Enable reconnection when connecting

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
        setReconnectAttempts(0);
      };

      ws.onmessage = (event) => {
        console.log('Message received:', event);
      };

      ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event);
        setIsConnected(false);
        socketRef.current = null;
        
        // Check if we should reconnect using the ref (not state)
        if (shouldReconnectRef.current && reconnectAttempts < maxReconnectAttempts && !event.wasClean) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connectWebSocket();
          }, delay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setError('Max reconnection attempts reached. Please reconnect manually.');
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error');
      };

    } catch (err) {
      console.error('Failed to create WebSocket:', err);
      setError('Failed to create WebSocket connection');
    }
  };

  const disconnect = () => {
    console.log('Manual disconnect triggered');
    
    // Disable reconnection
    shouldReconnectRef.current = false;
    
    // Clear reconnection timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Clear ping interval
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    
    if (socketRef.current) {
      socketRef.current.close(1000, 'Manual disconnect'); // Clean close
      socketRef.current = null;
      setIsConnected(false);
    }
    
    setError(null); // Clear any errors
  };

  const reconnect = () => {
    console.log('Manual reconnect triggered');
    shouldReconnectRef.current = true; // Enable reconnection
    setReconnectAttempts(0);
    setError(null);
    connectWebSocket();
  };

  const sendMessage = (message: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(message);
      console.log('Message sent:', message);
      setError(null); // Clear any previous errors on successful send
    } else {
      console.warn('WebSocket is not connected. ReadyState:', socketRef.current?.readyState);
      setError('Cannot send message: WebSocket not connected');
    }
  };

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      shouldReconnectRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

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