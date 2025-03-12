import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import Globe from './components/Globe';
import AttackLines from './components/AttackLines';
import AttackList from './components/AttackList';
import AttackStats from './components/AttackStats';
import FilterControls from './components/FilterControls';
import ConnectionStatus from './components/ConnectionStatus';
import { AttackProvider } from './context/AttackContext';
import './App.css';

function App() {
  return (
    <AttackProvider>
      <div className="App">
        <header className="App-header">
          <h1>
            <a href="https://livethreatmap.radware.com/" style={{ textDecoration: 'none', color: 'inherit' }}>
              Live Threat Map in 3D
            </a>
          </h1>
          <ConnectionStatus />
        </header>
        
        <Canvas
          camera={{
            far: 10000,
            fov: 55,
            position: [0, 0, 8000]
          }}
          style={{ height: '100vh', width: '100%' }}
        >
          <ambientLight intensity={1.5} />
          <directionalLight position={[10, 10, 5]} intensity={1.5} />
          <Stars radius={6500} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          
          <OrbitControls
            enableZoom={true}
            minDistance={6000}
            maxDistance={13000}
            rotateSpeed={0.4}
            enableDamping={true}
            dampingFactor={0.1}
            enablePan={false}
            autoRotate={false}
            autoRotateSpeed={0.5}
          />
          
          <Globe />
          <AttackLines />
        </Canvas>
        
        <AttackStats />
        <AttackList />
        <FilterControls />
        
        <footer>
          <a href="https://livethreatmap.radware.com/">Powered by Radware</a>
          <div className="disclaimer">
            Disclaimer: This is a student project and not affiliated with Radware. 
            The data displayed here is for educational purposes only and does not represent real-time threat information.
          </div>
        </footer>
      </div>
    </AttackProvider>
  );
}

export default App;
