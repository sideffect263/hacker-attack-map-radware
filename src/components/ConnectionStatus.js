import React, { useState, useCallback, memo } from 'react';
import { useAttackData } from '../context/AttackContext';
import '../styles/ConnectionStatus.css';

const ConnectionStatus = () => {
  const { connectionStatus, connectionError, refreshConnection, lastMessageTime } = useAttackData();
  const [expanded, setExpanded] = useState(false);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'green';
      case 'connecting':
        return 'orange';
      case 'disconnected':
      case 'error':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  const handleRefresh = useCallback(() => {
    if (refreshConnection) {
      refreshConnection();
    }
  }, [refreshConnection]);

  const toggleExpanded = useCallback(() => {
    setExpanded(prevExpanded => !prevExpanded);
  }, []);

  // Format the last message time
  const getLastMessageTime = () => {
    if (!lastMessageTime) return 'No data received';
    
    const now = Date.now();
    const diff = now - lastMessageTime;
    
    if (diff < 1000) return 'Just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)} seconds ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    
    return new Date(lastMessageTime).toLocaleTimeString();
  };

  return (
    <div className="connection-status">
      <div 
        className="status-indicator" 
        onClick={toggleExpanded}
        title="Click for more details"
      >
        <span 
          className="status-dot"
          style={{ backgroundColor: getStatusColor() }}
        ></span>
        <span className="status-text">{getStatusText()}</span>
      </div>
      
      {expanded && (
        <div className="connection-details">
          <div className="connection-detail-item">
            <span className="detail-label">Status:</span>
            <span className="detail-value">{getStatusText()}</span>
          </div>
          
          {connectionError && (
            <div className="connection-detail-item">
              <span className="detail-label">Error:</span>
              <span className="detail-value error">{connectionError}</span>
            </div>
          )}
          
          <div className="connection-detail-item">
            <span className="detail-label">Last update:</span>
            <span className="detail-value">{getLastMessageTime()}</span>
          </div>
          
          <div className="connection-detail-item">
            <span className="detail-label">Server:</span>
            <span className="detail-value">Radware Proxy</span>
          </div>
          
          <button 
            className="refresh-button"
            onClick={handleRefresh}
            disabled={connectionStatus === 'connecting'}
          >
            Refresh Connection
          </button>
        </div>
      )}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(ConnectionStatus); 