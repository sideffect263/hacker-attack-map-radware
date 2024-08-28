// Globe.js
import React from 'react';
import { TextureLoader } from 'three';
import { useLoader } from '@react-three/fiber';
import earthTextureImage from '../assets/tex/earthTex.jpg';

const Globe = () => {
  const earthTexture = useLoader(TextureLoader, earthTextureImage);

  return (
    <mesh>
      <sphereGeometry args={[5000, 64, 64]} />
      <meshStandardMaterial map={earthTexture} />
    </mesh>
  );
};

export default Globe;
