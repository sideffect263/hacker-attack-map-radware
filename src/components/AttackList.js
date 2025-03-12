import React, { useState } from 'react';
import { useAttackData } from '../context/AttackContext';
import { getAttackTypeLabel } from '../utils/dataTransformUtils';
import countryCodes from '../countriesCode.json';
import '../styles/AttackList.css';

// Create a lookup function
const getCountryName = (code) => {
  if (!code || code[0] === " ") return 'Unknown';
  const country = countryCodes.find(country => country.code === code);
  return country ? country.name : code;
};

const AttackList = () => {
  const { visibleAttacks, updateFilters } = useAttackData();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('time');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filter attacks by search term
  const filteredAttacks = visibleAttacks.filter(attack => {
    const sourceCountry = getCountryName(attack.sourceCountry).toLowerCase();
    const destCountry = getCountryName(attack.destinationCountry).toLowerCase();
    const attackType = getAttackTypeLabel(attack.type).toLowerCase();
    const term = searchTerm.toLowerCase();
    
    return sourceCountry.includes(term) || 
           destCountry.includes(term) || 
           attackType.includes(term);
  });

  // Sort attacks
  const sortedAttacks = [...filteredAttacks].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'source':
        comparison = getCountryName(a.sourceCountry).localeCompare(getCountryName(b.sourceCountry));
        break;
      case 'destination':
        comparison = getCountryName(a.destinationCountry).localeCompare(getCountryName(b.destinationCountry));
        break;
      case 'time':
      default:
        comparison = new Date(a.timestamp) - new Date(b.timestamp);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleTypeClick = (type) => {
    updateFilters({ types: [type] });
  };

  const handleCountryClick = (country) => {
    updateFilters({ countries: [country] });
  };

  const getSortIcon = (field) => {
    if (sortBy !== field) return null;
    return sortOrder === 'asc' ? '▲' : '▼';
  };

  return (
    <div className="attack-list">
      <h2>Active Attacks</h2>
      
      <div className="attack-list-controls">
        <input
          type="text"
          placeholder="Search attacks..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="attack-search"
        />
      </div>
      
      <div className="attack-list-header">
        <div className="attack-header-item" onClick={() => handleSortChange('time')}>
          Time {getSortIcon('time')}
        </div>
        <div className="attack-header-item" onClick={() => handleSortChange('type')}>
          Type {getSortIcon('type')}
        </div>
        <div className="attack-header-item" onClick={() => handleSortChange('source')}>
          Source {getSortIcon('source')}
        </div>
        <div className="attack-header-item" onClick={() => handleSortChange('destination')}>
          Destination {getSortIcon('destination')}
        </div>
      </div>
      
      <ul className="attack-items">
        {sortedAttacks.length > 0 ? (
          sortedAttacks.map((attack) => (
            <li key={attack.id} className="attack-item">
              <div className="attack-time">
                {new Date(attack.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div 
                className="attack-type" 
                style={{ color: getTypeColor(attack.type) }}
                onClick={() => handleTypeClick(attack.type)}
              >
                {getAttackTypeLabel(attack.type)}
              </div>
              <div 
                className="attack-country source-country"
                onClick={() => handleCountryClick(attack.sourceCountry)}
              >
                {getCountryName(attack.sourceCountry)}
              </div>
              <div 
                className="attack-country dest-country"
                onClick={() => handleCountryClick(attack.destinationCountry)}
              >
                {getCountryName(attack.destinationCountry)}
              </div>
            </li>
          ))
        ) : (
          <li className="no-attacks">No active attacks match your criteria</li>
        )}
      </ul>
    </div>
  );
};

// Helper function to get color for attack type
const getTypeColor = (type) => {
  switch (type) {
    case 'webAttackers':
      return '#fcec52';
    case 'scanners':
      return '#e94f37';
    case 'intruders':
      return '#48bfe3';
    case 'ioTBotnets':
      return '#80ffdb';
    default:
      return '#fdffb6';
  }
};

export default AttackList;