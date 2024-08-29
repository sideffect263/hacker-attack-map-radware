import React, { useRef, useEffect } from 'react';
import { SphereGeometry, MeshPhongMaterial, LineBasicMaterial, BufferGeometry, Line, Vector3, Group, DoubleSide } from 'three';
import { useLoader, useFrame } from '@react-three/fiber';
import * as topojson from 'topojson-client';
import { TextureLoader } from 'three';
import earthTextureImage from '../assets/tex/earthTex.jpg';

const Globe = () => {
  const earthTexture = useLoader(TextureLoader, earthTextureImage);
  const globeRef = useRef();
  const bordersRef = useRef();
  

  const radius = 5000;

  const latLongToVector3 = (lat, lon) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new Vector3(x, y, z);
  };

  useEffect(() => {
    fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json')
      .then(response => response.json())
      .then(worldData => {
        const countries = topojson.feature(worldData, worldData.objects.countries);
        const borderGroup = new Group();

        countries.features.forEach(feature => {
          if (feature.geometry.type === 'Polygon') {
            feature.geometry.coordinates.forEach(ring => {
              const points = ring.map(([lon, lat]) => latLongToVector3(lat, lon));
              const geometry = new BufferGeometry().setFromPoints(points);
              const line = new Line(geometry, new LineBasicMaterial({ color: '#ffffff', opacity: 0.5, transparent: true }));
              borderGroup.add(line);
            });
          } else if (feature.geometry.type === 'MultiPolygon') {
            feature.geometry.coordinates.forEach(polygon => {
              polygon.forEach(ring => {
                const points = ring.map(([lon, lat]) => latLongToVector3(lat, lon));
                const geometry = new BufferGeometry().setFromPoints(points);
                const line = new Line(geometry, new LineBasicMaterial({ color: '#ffffff', opacity: 0.5, transparent: true }));
                borderGroup.add(line);
              });
            });
          }
        });

        bordersRef.current.add(borderGroup);
      });
  }, []);

  useFrame(() => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.0005;
    }
    if (bordersRef.current) {
      bordersRef.current.rotation.y += 0.0005;
    }
  });

  return (
    <>
      <mesh ref={globeRef}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshPhongMaterial map={earthTexture} side={DoubleSide} />
      </mesh>
      <group ref={bordersRef} />
    </>
  );
};

export default Globe;