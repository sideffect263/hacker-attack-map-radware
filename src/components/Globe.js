import React, { useRef, useEffect } from 'react';
import { SphereGeometry, MeshPhongMaterial, LineBasicMaterial, BufferGeometry, Line, Vector3, Group } from 'three';
import { useLoader, useFrame } from '@react-three/fiber';
import { geoPath, geoOrthographic } from 'd3-geo';
import * as topojson from 'topojson-client';
import { TextureLoader } from 'three';
import earthTextureImage from '../assets/tex/earthTex.jpg';

const Globe = () => {
  const earthTexture = useLoader(TextureLoader, earthTextureImage);
  const globeRef = useRef();
  const bordersRef = useRef();

  const radius = 5000;

  useEffect(() => {
    fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json')
      .then(response => response.json())
      .then(worldData => {
        const countries = topojson.feature(worldData, worldData.objects.countries);
        const projection = geoOrthographic()
          .scale(radius)
          .translate([0, 0])
          .clipAngle(90);

        const borderGroup = new Group();

        countries.features.forEach(feature => {
          const geometry = new BufferGeometry();
          const points = [];

          if (feature.geometry.type === "Polygon") {
            feature.geometry.coordinates.forEach(ring => {
              ring.forEach(coord => {
                const [x, y, z] = projection(coord);
                points.push(new Vector3(x, y, z));
              });
            });
          } else if (feature.geometry.type === "MultiPolygon") {
            feature.geometry.coordinates.forEach(polygon => {
              polygon.forEach(ring => {
                ring.forEach(coord => {
                  const [x, y, z] = projection(coord);
                  points.push(new Vector3(x, y, z));
                });
              });
            });
          }

          geometry.setFromPoints(points);
          const line = new Line(geometry, new LineBasicMaterial({ color: '#ffffff', opacity: 0.3, transparent: true }));
          borderGroup.add(line);
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
        <meshPhongMaterial map={earthTexture} />
      </mesh>
      <group ref={bordersRef} />
    </>
  );
};

export default Globe;