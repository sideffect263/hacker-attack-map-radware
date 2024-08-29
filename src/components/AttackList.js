// AttackList.js
import React, { useEffect } from 'react';
import '../styles/AttackList.css';

const AttackList = ({ attacks }) => {

    useEffect(() => {
        console.log(attacks);
    }
    , [attacks]);
return (
    <div className="attack-list">
        <h2>Active Attacks</h2>
        <ul>
            {attacks.map((attack, index) => (
                <li key={index}>
                    <span className="attack-type">{attack.type}</span> attack from{' '}
                    <span className="attack-country">
                        {attack.destinationCountry[0] === " " ? 'Unknown' : attack.destinationCountry}
                    </span>
                    {' '}to{' '}
                    <span className="attack-country">
                        {attack.sourceCountry[0] === " " ? 'Unknown' : attack.sourceCountry}
                    </span>
                    {' '} <span className="attack-time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </li>
            ))}
        </ul>
    </div>
);
};

export default AttackList;
