import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import countryCoordinates from './countries.json';

function App() {
  const [attackData, setAttackData] = useState([]);
  const [currentBatch, setCurrentBatch] = useState([]);

  useEffect(() => {
    const ws = new WebSocket('wss://radware-proxy.onrender.com/');
    console.log('Connecting to WebSocket...');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const transformedData = transformData(data);
      console.log('Received data:', transformedData);
      setAttackData((prevData) => [...prevData, ...transformedData]);
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    if (attackData.length > 0) {
      const timer = setTimeout(() => {
        const nextBatch = attackData.slice(currentBatch.length, currentBatch.length + 1);
        setCurrentBatch((prevBatch) => [...prevBatch, ...nextBatch]);

        // Remove the oldest lines after 15 seconds to keep the map clean
        setTimeout(() => {
          setCurrentBatch((prevBatch) => prevBatch.slice(1));
        }, 15000);
      }, 1500); // Add each attack every 1.5 seconds

      return () => clearTimeout(timer);
    }
  }, [attackData, currentBatch]);

  const transformData = (data) => {
    const flattenedData = data.flat();

    const transformedData = flattenedData.map((item) => {
      const sourceCoords = getCords(item.sourceCountry);
      const destinationCoords = getCords(item.destinationCountry);

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
      return [0, 0];
    }
  };

  const renderAttackLines = () => {
    if (currentBatch.length === 0) return null;

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

      const weight = attack.weight === 'Heavy' ? 5 : attack.weight === 'Medium' ? 3 : 1;

      if (isValidCoords(attack.sourceCoords) && isValidCoords(attack.destinationCoords)) {
        return (
          <Polyline
            key={index}
            positions={getGreatCirclePath(attack.sourceCoords, attack.destinationCoords)}
            color={color}
            weight={weight}
            opacity={0.7}
            pathOptions={{
              dashArray: '5, 10',
              animate: {
                duration: 5,
                repeat: 1,
              },
            }}
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
