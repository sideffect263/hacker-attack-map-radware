import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
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

  // Use refs to track timeouts for cleanup
  const timeoutsRef = useRef([]);

  // Clear all timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, []);

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
    if (allAttacks.length === 0) return;

    // Find attacks that aren't already visible
    const newAttacks = allAttacks.filter(attack => 
      !visibleAttacks.some(visible => visible.id === attack.id)
    );

    if (newAttacks.length === 0) return;

    // Add one new attack at a time with interval
    const addNextAttack = () => {
      const nextAttack = newAttacks.shift();
      if (!nextAttack) return;

      setVisibleAttacks(prev => [...prev, nextAttack]);
      
      // Schedule removal after CLEANUP_INTERVAL
      const removalTimeout = setTimeout(() => {
        setVisibleAttacks(prev => prev.filter(attack => attack.id !== nextAttack.id));
      }, CLEANUP_INTERVAL);
      
      timeoutsRef.current.push(removalTimeout);
      
      // Schedule next attack if there are more
      if (newAttacks.length > 0) {
        const nextTimeout = setTimeout(addNextAttack, BATCH_INTERVAL);
        timeoutsRef.current.push(nextTimeout);
      }
    };

    // Start the process
    const initialTimeout = setTimeout(addNextAttack, BATCH_INTERVAL);
    timeoutsRef.current.push(initialTimeout);

    // Cleanup function
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
  }, [allAttacks]); // Only depend on allAttacks, not visibleAttacks

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

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
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
  }), [
    allAttacks, 
    filteredAttacks, 
    stats, 
    filters, 
    updateFilters, 
    clearFilters, 
    status, 
    error, 
    refresh, 
    lastMessageTime
  ]);

  return (
    <AttackContext.Provider value={value}>
      {children}
    </AttackContext.Provider>
  );
};

export default AttackContext; 