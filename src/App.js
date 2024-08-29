import React, { useEffect, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Globe from './components/Globe';
import AttackLines from './components/AttackLines';
import AttackList from './components/AttackList';
import './App.css';
import countryCoordinates from './countries.json';

const WEBSOCKET_URL = 'wss://radware-proxy.onrender.com/';
const BATCH_INTERVAL = 500; // 0.5 seconds
const CLEANUP_INTERVAL = 5000; // 5 seconds
const OFFSET = 6.2;

function App() {
  const [attackData, setAttackData] = useState([]);
  const [currentBatch, setCurrentBatch] = useState([]);

  useEffect(() => {
    const ws = new WebSocket(WEBSOCKET_URL);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const transformedData = transformData(data);
      setAttackData((prevData) => [...prevData, ...transformedData]);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    if (attackData.length > 0) {
      const timer = setTimeout(() => {
        const nextBatch = attackData.slice(currentBatch.length, currentBatch.length + 1);
        setCurrentBatch((prevBatch) => [...prevBatch, ...nextBatch]);

        setTimeout(() => {
          setCurrentBatch((prevBatch) => prevBatch.slice(1));
        }, CLEANUP_INTERVAL);
      }, BATCH_INTERVAL);

      return () => clearTimeout(timer);
    }
  }, [attackData, currentBatch]);

  const transformData = useCallback((data) => {
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
  }, []);

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
    const latOffset = (Math.random() - 0.5) * OFFSET;
    const lngOffset = (Math.random() - 0.5) * OFFSET;
    return [coords[0] + latOffset, coords[1] + lngOffset];
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>
          <a href="https://livethreatmap.radware.com/" style={{ textDecoration: 'none', color: 'inherit' }}>
            Live Threat Map in 3D
          </a>
        </h1>
      </header>
      <Canvas
        camera={{
          far: 10000,
          fov: 55,
        }}
        style={{ height: '80vh', width: '100%', position: 'absolute', top: '10%' }}
      >
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} />
        <OrbitControls
          enableZoom={true}
          minDistance={6000}
          maxDistance={13000}
          rotateSpeed={0.4}
          enableDamping={true}
          dampingFactor={0.1}
          enablePan={false}
        />
        <Globe />
        <AttackLines attackData={currentBatch} />
      </Canvas>
      <AttackList attacks={currentBatch} />
      <footer>
        <a href="https://livethreatmap.radware.com/">Powered by Radware</a>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          Disclaimer: This is a student project and not affiliated with Radware. The data displayed here is for educational purposes only and does not represent real-time threat information.
        </div>
      </footer>
    </div>
  );
}

export default App;
