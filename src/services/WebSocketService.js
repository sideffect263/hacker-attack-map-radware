import { useState, useEffect, useCallback } from 'react';
import pako from 'pako'; // Add this dependency for decompression

const WEBSOCKET_URL = 'wss://radware-proxy.onrender.com/';
const RECONNECT_DELAY = 3000; // 3 seconds
const HEARTBEAT_TIMEOUT = 35000; // 35 seconds (slightly longer than server's 30s)

export const useWebSocketConnection = (onMessage) => {
  const [status, setStatus] = useState('disconnected');
  const [error, setError] = useState(null);
  const [lastMessageTime, setLastMessageTime] = useState(0);

  const connect = useCallback(() => {
    try {
      setStatus('connecting');
      const ws = new WebSocket(WEBSOCKET_URL);
      
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
            onMessage(data);
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
        
        // Attempt to reconnect unless the connection was closed cleanly
        if (event.code !== 1000) {
          console.log(`Attempting to reconnect in ${RECONNECT_DELAY}ms...`);
          setTimeout(() => connect(), RECONNECT_DELAY);
        }
      };

      // Set up heartbeat check
      const heartbeatCheck = setInterval(() => {
        const now = Date.now();
        // If we haven't received a message in HEARTBEAT_TIMEOUT ms, consider the connection dead
        if (now - lastMessageTime > HEARTBEAT_TIMEOUT) {
          console.log('Heartbeat timeout, reconnecting...');
          ws.close();
          clearInterval(heartbeatCheck);
        }
      }, HEARTBEAT_TIMEOUT);

      // Function to request a refresh of data
      const requestRefresh = () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: 'refresh' }));
        }
      };

      return { 
        socket: ws, 
        heartbeatCheck,
        requestRefresh
      };
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to establish connection');
      setStatus('error');
      
      // Attempt to reconnect
      setTimeout(() => connect(), RECONNECT_DELAY);
      return null;
    }
  }, [onMessage, lastMessageTime]);

  useEffect(() => {
    const connection = connect();
    
    return () => {
      if (connection) {
        if (connection.socket) {
          connection.socket.close(1000, 'Component unmounted');
        }
        if (connection.heartbeatCheck) {
          clearInterval(connection.heartbeatCheck);
        }
      }
    };
  }, [connect]);

  // Return status, error, and a function to manually refresh data
  return { 
    status, 
    error,
    refresh: () => {
      const connection = connect();
      if (connection && connection.requestRefresh) {
        connection.requestRefresh();
      }
    }
  };
};

export default useWebSocketConnection; 