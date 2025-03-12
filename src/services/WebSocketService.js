import { useState, useEffect, useCallback, useRef } from 'react';
import pako from 'pako'; // Add this dependency for decompression

// Use local server in development, remote in production
const WEBSOCKET_URL = process.env.NODE_ENV === 'production' 
  ? 'wss://radware-proxy.onrender.com/' 
  : 'ws://localhost:3001';

const RECONNECT_DELAY = 3000; // 3 seconds
const HEARTBEAT_TIMEOUT = 35000; // 35 seconds (slightly longer than server's 30s)

export const useWebSocketConnection = (onMessage) => {
  const [status, setStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const [lastMessageTime, setLastMessageTime] = useState(0);
  
  // Use refs to avoid dependency issues in useCallback
  const onMessageRef = useRef(onMessage);
  const lastMessageTimeRef = useRef(lastMessageTime);
  const wsRef = useRef(null);
  const heartbeatCheckRef = useRef(null);
  
  // Update refs when values change
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);
  
  useEffect(() => {
    lastMessageTimeRef.current = lastMessageTime;
  }, [lastMessageTime]);

  // Function to request a refresh of data
  const requestRefresh = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: 'refresh' }));
    }
  }, []);

  const connect = useCallback(() => {
    // Don't create a new connection if one already exists and is open or connecting
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || 
                          wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }
    
    try {
      setStatus('connecting');
      const ws = new WebSocket(WEBSOCKET_URL);
      wsRef.current = ws;
      
      // Check if browser supports binary WebSocket
      const supportsBinary = typeof Blob !== 'undefined' && 
                             typeof ArrayBuffer !== 'undefined' && 
                             typeof Uint8Array !== 'undefined';

      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        console.log('WebSocket connection established');
        setStatus('connected');
        setError(null);
        setLastMessageTime(Date.now());
        
        // Inform server about binary support capability
        ws.send(JSON.stringify({ supportsBinary }));
      };

      ws.onmessage = (event) => {
        try {
          setLastMessageTime(Date.now());
          
          let data;
          // Handle binary (compressed) data
          if (event.data instanceof ArrayBuffer) {
            const decompressed = pako.inflate(new Uint8Array(event.data), { to: 'string' });
            data = JSON.parse(decompressed);
          } else {
            // Handle text data
            data = JSON.parse(event.data);
          }
          
          // Check if it's an error message
          if (data.error) {
            console.error('Server error:', data.message);
            setError(data.message);
          } else {
            // Process normal data
            onMessageRef.current(data);
          }
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
          setError('Failed to process message data');
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('Connection error occurred');
        setStatus('error');
      };

      ws.onclose = (event) => {
        console.log(`WebSocket connection closed: ${event.code} ${event.reason}`);
        setStatus('disconnected');
        wsRef.current = null;
        
        // Clear heartbeat check
        if (heartbeatCheckRef.current) {
          clearInterval(heartbeatCheckRef.current);
          heartbeatCheckRef.current = null;
        }
        
        // Attempt to reconnect unless the connection was closed cleanly
        if (event.code !== 1000) {
          console.log(`Attempting to reconnect in ${RECONNECT_DELAY}ms...`);
          setTimeout(() => connect(), RECONNECT_DELAY);
        }
      };

      // Set up heartbeat check
      if (heartbeatCheckRef.current) {
        clearInterval(heartbeatCheckRef.current);
      }
      
      heartbeatCheckRef.current = setInterval(() => {
        const now = Date.now();
        // If we haven't received a message in HEARTBEAT_TIMEOUT ms, consider the connection dead
        if (now - lastMessageTimeRef.current > HEARTBEAT_TIMEOUT) {
          console.log('Heartbeat timeout, reconnecting...');
          if (wsRef.current) {
            wsRef.current.close();
          }
        }
      }, HEARTBEAT_TIMEOUT);

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to establish connection');
      setStatus('error');
      wsRef.current = null;
      
      // Attempt to reconnect
      setTimeout(() => connect(), RECONNECT_DELAY);
    }
  }, []); // No dependencies to prevent recreation

  // Connect on mount and clean up on unmount
  useEffect(() => {
    connect();
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
      
      if (heartbeatCheckRef.current) {
        clearInterval(heartbeatCheckRef.current);
        heartbeatCheckRef.current = null;
      }
    };
  }, [connect]);

  // Return status, error, and a function to manually refresh data
  return { 
    status, 
    error,
    refresh: requestRefresh
  };
};

export default useWebSocketConnection; 