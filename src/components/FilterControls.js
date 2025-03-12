import React, { useState, useMemo } from 'react';
import { useAttackData } from '../context/AttackContext';
import { getAttackTypeLabel } from '../utils/dataTransformUtils';
import countryCodes from '../countriesCode.json';
import '../styles/FilterControls.css';

const FilterControls = () => {
  const { filters, updateFilters, clearFilters, allAttacks } = useAttackData();
  const [isExpanded, setIsExpanded] = useState(false);

  // Get unique attack types from all attacks
  const attackTypes = useMemo(() => {
    const types = new Set();
    allAttacks.forEach(attack => types.add(attack.type));
    return Array.from(types).map(type => ({
      value: type,
      label: getAttackTypeLabel(type)
    }));
  }, [allAttacks]);

  // Get top 20 countries from all attacks
  const topCountries = useMemo(() => {
    const countryCounts = {};
    allAttacks.forEach(attack => {
      countryCounts[attack.sourceCountry] = (countryCounts[attack.sourceCountry] || 0) + 1;
      countryCounts[attack.destinationCountry] = (countryCounts[attack.destinationCountry] || 0) + 1;
    });

    return Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([code]) => {
        const country = countryCodes.find(c => c.code === code);
        return {
          value: code,
          label: country ? country.name : code
        };
      });
  }, [allAttacks]);

  const handleTypeChange = (e) => {
    const selectedTypes = Array.from(e.target.selectedOptions, option => option.value);
    updateFilters({ types: selectedTypes });
  };

  const handleCountryChange = (e) => {
    const selectedCountries = Array.from(e.target.selectedOptions, option => option.value);
    updateFilters({ countries: selectedCountries });
  };

  const handleTimeRangeChange = (e) => {
    const value = e.target.value;
    
    if (value === 'all') {
      updateFilters({ timeRange: null });
      return;
    }
    
    const now = new Date();
    const minutes = parseInt(value, 10);
    const start = new Date(now.getTime() - (minutes * 60 * 1000));
    
    updateFilters({
      timeRange: {
        start: start.getTime(),
        end: now.getTime()
      }
    });
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`filter-controls ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="filter-header" onClick={toggleExpand}>
        <h3>Filter Attacks</h3>
        <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>
      
      {isExpanded && (
        <div className="filter-content">
          <div className="filter-section">
            <label htmlFor="type-filter">Attack Types:</label>
            <select 
              id="type-filter" 
              multiple 
              value={filters.types} 
              onChange={handleTypeChange}
            >
              {attackTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-section">
            <label htmlFor="country-filter">Countries:</label>
            <select 
              id="country-filter" 
              multiple 
              value={filters.countries} 
              onChange={handleCountryChange}
            >
              {topCountries.map(country => (
                <option key={country.value} value={country.value}>{country.label}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-section">
            <label htmlFor="time-filter">Time Range:</label>
            <select 
              id="time-filter" 
              value={filters.timeRange ? '5' : 'all'} 
              onChange={handleTimeRangeChange}
            >
              <option value="all">All Time</option>
              <option value="5">Last 5 Minutes</option>
              <option value="15">Last 15 Minutes</option>
              <option value="30">Last 30 Minutes</option>
              <option value="60">Last Hour</option>
            </select>
          </div>
          
          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterControls; 