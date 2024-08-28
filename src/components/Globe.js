// Globe.js
import React, { useRef } from 'react';
import { TextureLoader, SphereGeometry, MeshBasicMaterial, MeshStandardMaterial } from 'three';
import { useLoader, useFrame } from '@react-three/fiber';
import earthTextureImage from '../assets/tex/earthTex.jpg';

const Globe = () => {
  const earthTexture = useLoader(TextureLoader, earthTextureImage);
  const globeRef = useRef();

  // Rotate the globe slowly
  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.0005;
    }
  });

  return (
    <>
      {/* Main Earth Globe */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[5000, 64, 64]} />
        <meshStandardMaterial map={earthTexture} />
      </mesh>

      {/* Unknown Location Indicator at (0, 0) */}
      <mesh position={[5000, -200, 200]} ref={globeRef}>
        <sphereGeometry args={[200, 32, 32]} />
        <meshBasicMaterial color={'red'} />
      </mesh>
    </>
  );
};

export default Globe;
