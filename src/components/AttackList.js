import React, { useEffect } from 'react';
import countryCodes from '../countriesCode.json'; // Adjust the path as necessary
import '../styles/AttackList.css';

// Create a lookup function
const getCountryName = (code) => {
  const country = countryCodes.find(country => country.code === code);
  return country ? country.name : code;
};

const AttackList = ({ attacks }) => {
  useEffect(() => {
    console.log(attacks);
  }, [attacks]);

  return (
    <div className="attack-list">
      <h2>Active Attacks</h2>
      <ul>
        {attacks.map((attack, index) => (
          <li key={index}>
            <span className="attack-type">{attack.type}</span> attack from{' '}
            <span className="attack-country">
              {attack.destinationCountry[0] === " " ? 'Unknown' : getCountryName(attack.destinationCountry)}
            </span>
            {' '}to{' '}
            <span className="attack-country">
              {attack.sourceCountry[0] === " " ? 'Unknown' : getCountryName(attack.sourceCountry)}
            </span>
            {' '} <span className="attack-time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AttackList;