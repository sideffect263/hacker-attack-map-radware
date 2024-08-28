import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import './App.css';
import countryCoordinates from './countries.json'; // Import the country coordinates from JSON

function App() {
  const [attackData, setAttackData] = useState([]);
  const [currentBatch, setCurrentBatch] = useState([]);
  const [lineLifeTime, setLineLifeTime] = useState(1000); // Line visibility duration in ms (e.g., 10 seconds)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('https://radware-proxy.onrender.com/api/attacks');
        const transformedData = await transformData(response.data);
        console.log('Fetched attack data:', transformedData);
        setAttackData(transformedData);
        setCurrentBatch([]); // Reset current batch when new data arrives
      } catch (error) {
        console.error('Error fetching attack data:', error);
      }
    };

    // Fetch initial data
    fetchData();

    // Set interval to fetch data every 30 seconds
    const intervalId = setInterval(fetchData, 30000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    console.log('Updating attack data...');
    console.log('attack data', attackData);
    if (attackData.length > 0) {
      const timer = setTimeout(() => {
        console.log('Adding new batch of attack data...');
        const nextBatch = attackData.slice(currentBatch.length, currentBatch.length + 10);
        setCurrentBatch((prevBatch) => [...prevBatch, ...nextBatch]);
        console.log('Current batch:', currentBatch);

        // Remove the oldest lines after `lineLifeTime` to keep the map clean
        setTimeout(() => {
          setCurrentBatch((prevBatch) => prevBatch.slice(10));
        }, lineLifeTime);

        console.log('Next batch:', nextBatch);

      }, 1000); // Add each batch every half a second for smooth rendering

      return () => clearTimeout(timer);
    }
  }, [attackData, currentBatch, lineLifeTime]);

  const transformData = async (data) => {
    const flattenedData = data.flat();

    const transformedData = flattenedData.map((item) => {



      if(!item.sourceCountry || !item.destinationCountry){
        return null;
      }

      const sourceCoords = getCords(item.sourceCountry);
      const destinationCoords = getCords(item.destinationCountry);

      

      // Skip if either source or destination coordinates are invalid
      if (!isValidCoords(sourceCoords) || !isValidCoords(destinationCoords)) {
        return null;
      }

      return {
        sourceCountry: item.sourceCountry,
        destinationCountry: item.destinationCountry || 'Unknown',
        sourceCoords,
        destinationCoords,
        type: item.type,
        weight: item.weight,
      };
    });

    return transformedData.filter(item => item !== null);
  };

  const isValidCoords = (coords) => {
    return Array.isArray(coords) && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1]);
  };

  const getCords = (country) => {
    const coords = countryCoordinates[country];
    if (coords) {
      return coords;
    } else {
      console.error(`Coordinates not found for country: ${country}`);
      return [0, 0]; // Return default coordinates if country not found
    }
  };

  const renderAttackLines = () => {
    console.log('Rendering attack lines...');
    if (currentBatch.length === 0) return null;

    console.log('Current batch:', currentBatch);

    return currentBatch.map((attack, index) => {
      const color =
        attack.type === 'webAttackers'
          ? 'red'
          : attack.type === 'scanners'
          ? 'blue'
          : attack.type === 'intruders'
          ? 'green'
          : attack.type === 'ioTBotnets'
          ? 'orange'
          : 'purple';

      

      if (
        isValidCoords(attack.sourceCoords) &&
        isValidCoords(attack.destinationCoords) 
      ) {
        console.log('Rendering attack:', attack);

        return (
          <Polyline
            key={index}
            positions={getGreatCirclePath(attack.sourceCoords, attack.destinationCoords)}
            color={color}
            weight={3}
            opacity={0.7}
          >
            <Popup>
              {attack.sourceCountry} - {attack.destinationCountry} <br />
              Type: {attack.type} <br />
              Weight: {attack.weight}
            </Popup>
          </Polyline>
        );
      }
      return null;
    });
  };

  const getGreatCirclePath = (source, destination) => {
    console.log('Calculating great circle path...');
    console.log('Source:', source);
    console.log('Destination:', destination);
    const latlngs = [];
    const lat1 = (Math.PI / 180) * source[0];
    const lng1 = (Math.PI / 180) * source[1];
    const lat2 = (Math.PI / 180) * destination[0];
    const lng2 = (Math.PI / 180) * destination[1];
    const d = 2 * Math.asin(Math.sqrt(Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2));

    for (let i = 0; i <= 100; i++) {
      const f = i / 100;
      const A = Math.sin((1 - f) * d) / Math.sin(d);
      const B = Math.sin(f * d) / Math.sin(d);
      const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
      const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
      const z = A * Math.sin(lat1) + B * Math.sin(lat2);
      const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
      const lng = Math.atan2(y, x);
      latlngs.push([lat * (180 / Math.PI), lng * (180 / Math.PI)]);
    }

    return latlngs;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Live Threat Map</h1>
      </header>
      <MapContainer center={[20, 0]} zoom={2} style={{ height: '80vh', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {renderAttackLines()}
      </MapContainer>
      <footer>
        <p>Powered by Radware</p>
      </footer>
    </div>
  );
}

export default App;
