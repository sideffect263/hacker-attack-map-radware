import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import useWebSocketConnection from '../services/WebSocketService';
import { transformAttackData } from '../utils/dataTransformUtils';

// Constants
const MAX_ATTACKS = 100; // Maximum number of attacks to store
const BATCH_INTERVAL = 500; // 0.5 seconds
const CLEANUP_INTERVAL = 5000; // 5 seconds

// Create context
const AttackContext = createContext();

export const useAttackData = () => {
  const context = useContext(AttackContext);
  if (!context) {
    throw new Error('useAttackData must be used within an AttackProvider');
  }
  return context;
};

export const AttackProvider = ({ children }) => {
  // State for all attack data
  const [allAttacks, setAllAttacks] = useState([]);
  
  // State for currently visible attacks (for animation)
  const [visibleAttacks, setVisibleAttacks] = useState([]);
  
  // State for attack statistics
  const [stats, setStats] = useState({
    total: 0,
    byType: {},
    byCountry: {},
    byTime: {}
  });

  // State for last message time
  const [lastMessageTime, setLastMessageTime] = useState(0);

  // Filter states
  const [filters, setFilters] = useState({
    types: [],
    countries: [],
    timeRange: null
  });

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((data) => {
    // Update last message time
    setLastMessageTime(Date.now());
    
    const transformedData = transformAttackData(data);
    
    if (transformedData.length > 0) {
      setAllAttacks(prevAttacks => {
        const newAttacks = [...prevAttacks, ...transformedData];
        // Keep only the most recent MAX_ATTACKS
        return newAttacks.slice(-MAX_ATTACKS);
      });
    }
  }, []);

  // Connect to WebSocket
  const { status, error, refresh } = useWebSocketConnection(handleMessage);

  // Process attacks for visualization in batches
  useEffect(() => {
    if (allAttacks.length > 0) {
      const timer = setTimeout(() => {
        // Get the next attack that isn't already visible
        const nextAttack = allAttacks.find(attack => 
          !visibleAttacks.some(visible => visible.id === attack.id)
        );
        
        if (nextAttack) {
          setVisibleAttacks(prev => [...prev, nextAttack]);
          
          // Schedule removal after CLEANUP_INTERVAL
          setTimeout(() => {
            setVisibleAttacks(prev => prev.filter(attack => attack.id !== nextAttack.id));
          }, CLEANUP_INTERVAL);
        }
      }, BATCH_INTERVAL);
      
      return () => clearTimeout(timer);
    }
  }, [allAttacks, visibleAttacks]);

  // Update statistics whenever allAttacks changes
  useEffect(() => {
    const updateStats = () => {
      const byType = {};
      const byCountry = {};
      const byTime = {};
      
      // Group last hour by 5-minute intervals
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      allAttacks.forEach(attack => {
        // Count by type
        byType[attack.type] = (byType[attack.type] || 0) + 1;
        
        // Count by source country
        byCountry[attack.sourceCountry] = (byCountry[attack.sourceCountry] || 0) + 1;
        
        // Count by time (last hour in 5-minute intervals)
        const attackTime = new Date(attack.timestamp);
        if (attackTime >= hourAgo) {
          const interval = Math.floor((attackTime - hourAgo) / (5 * 60 * 1000));
          const intervalKey = `interval-${interval}`;
          byTime[intervalKey] = (byTime[intervalKey] || 0) + 1;
        }
      });
      
      setStats({
        total: allAttacks.length,
        byType,
        byCountry,
        byTime
      });
    };
    
    updateStats();
  }, [allAttacks]);

  // Filter attacks based on current filters
  const filteredAttacks = useMemo(() => {
    return visibleAttacks.filter(attack => {
      // Filter by type
      if (filters.types.length > 0 && !filters.types.includes(attack.type)) {
        return false;
      }
      
      // Filter by country
      if (filters.countries.length > 0 && 
          !filters.countries.includes(attack.sourceCountry) && 
          !filters.countries.includes(attack.destinationCountry)) {
        return false;
      }
      
      // Filter by time range
      if (filters.timeRange) {
        const attackTime = new Date(attack.timestamp).getTime();
        if (attackTime < filters.timeRange.start || attackTime > filters.timeRange.end) {
          return false;
        }
      }
      
      return true;
    });
  }, [visibleAttacks, filters]);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      types: [],
      countries: [],
      timeRange: null
    });
  }, []);

  // Context value
  const value = {
    allAttacks,
    visibleAttacks: filteredAttacks,
    stats,
    filters,
    updateFilters,
    clearFilters,
    connectionStatus: status,
    connectionError: error,
    refreshConnection: refresh,
    lastMessageTime
  };

  return (
    <AttackContext.Provider value={value}>
      {children}
    </AttackContext.Provider>
  );
};

export default AttackContext; 