// App.js
import React, { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Globe from './components/Globe';
import AttackLines from './components/AttackLines';
import './App.css';
import countryCoordinates from './countries.json';

function App() {
  const [attackData, setAttackData] = useState([]);
  const [currentBatch, setCurrentBatch] = useState([]);

  useEffect(() => {
    const ws = new WebSocket('wss://radware-proxy.onrender.com/');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const transformedData = transformData(data);
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
        }, 12000);
      }, 1000); // Add each attack every 1.5 seconds

      return () => clearTimeout(timer);
    }
  }, [attackData, currentBatch]);

  const transformData = (data) => {
    const flattenedData = data.flat();

    const transformedData = flattenedData.map((item) => {
      const sourceCoords = getCordsWithOffset(item.sourceCountry);
      const destinationCoords = getCordsWithOffset(item.destinationCountry);

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

  const getCordsWithOffset = (country) => {
    const coords = getCords(country);
    const offset = 6.2; // Adjust this value to control the amount of variation
    const latOffset = (Math.random() - 0.5) * offset;
    const lngOffset = (Math.random() - 0.5) * offset;
    return [coords[0] + latOffset, coords[1] + lngOffset];
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Live Threat Map in 3D</h1>
      </header>
      <Canvas
      camera={{
        far: 10000,
      }}
      style={{ height: '80vh', width: '100%', position:'absolute', top:"10%" }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} />
        <OrbitControls
  enableZoom={true}
  minDistance={6500}
  maxDistance={9000}
  rotateSpeed={0.4}
  maxPolarAngle={Math.PI / 2} // Prevent zooming below the globe
/>

        <Globe />
        <AttackLines attackData={currentBatch} />
      </Canvas>
      <footer>
        <p>Powered by Radware</p>
      </footer>
    </div>
  );
}

export default App;
