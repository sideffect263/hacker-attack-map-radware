import React, { useRef, useEffect, useState, useMemo } from 'react';
import { SphereGeometry, MeshPhongMaterial, LineBasicMaterial, BufferGeometry, Line, Vector3, DoubleSide, Color } from 'three';
import { useLoader, useFrame, useThree } from '@react-three/fiber';
import * as topojson from 'topojson-client';
import { TextureLoader } from 'three';
import { useAttackData } from '../context/AttackContext';
import earthTextureImage from '../assets/tex/earthTex.jpg';

const Globe = () => {
  const earthTexture = useLoader(TextureLoader, earthTextureImage);
  const globeRef = useRef();
  const [lines, setLines] = useState([]);
  const [hoveredCountry, setHoveredCountry] = useState(null);
  const { updateFilters } = useAttackData();
  const { camera } = useThree();

  const radius = 5000;

  const latLongToVector3 = (lat, lon) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);
    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return new Vector3(x, y, z);
  };

  // Improved country borders with country data
  useEffect(() => {
    fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json')
      .then(response => response.json())
      .then(worldData => {
        const countries = topojson.feature(worldData, worldData.objects.countries);
        const countryNames = worldData.objects.countries.geometries.reduce((acc, country) => {
          acc[country.id] = country.properties.name;
          return acc;
        }, {});

        const generatedLines = countries.features.flatMap((feature) => {
          const countryId = feature.id;
          const countryName = countryNames[countryId] || 'Unknown';
          
          if (feature.geometry.type === 'Polygon') {
            return feature.geometry.coordinates.map(ring => {
              const points = ring.map(([lon, lat]) => latLongToVector3(lat, lon));
              const geometry = new BufferGeometry().setFromPoints(points);
              const material = new LineBasicMaterial({ 
                color: 'black', 
                opacity: 0.5, 
                transparent: true 
              });
              return { geometry, material, countryId, countryName };
            });
          } else if (feature.geometry.type === 'MultiPolygon') {
            return feature.geometry.coordinates.flatMap(polygon => {
              return polygon.map(ring => {
                const points = ring.map(([lon, lat]) => latLongToVector3(lat, lon));
                const geometry = new BufferGeometry().setFromPoints(points);
                const material = new LineBasicMaterial({ 
                  color: 'black', 
                  opacity: 0.5, 
                  transparent: true 
                });
                return { geometry, material, countryId, countryName };
              });
            });
          }
          return [];
        });

        setLines(generatedLines);
      })
      .catch(error => {
        console.error('Error loading country data:', error);
      });
  }, []);

  // Slow rotation for ambient effect
  useFrame(() => {
    if (globeRef.current && !hoveredCountry) {
      globeRef.current.rotation.y += 0.0005;
    }
  });

  // Enhanced material with better lighting
  const globeMaterial = useMemo(() => {
    return new MeshPhongMaterial({
      map: earthTexture,
      side: DoubleSide,
      shininess: 5,
      bumpScale: 0.05,
    });
  }, [earthTexture]);

  const handlePointerOver = (event, line) => {
    event.stopPropagation();
    
    // Highlight the country borders
    line.material.color.set(new Color('#61dafb'));
    line.material.opacity = 1;
    line.material.needsUpdate = true;
    
    setHoveredCountry({
      id: line.countryId,
      name: line.countryName
    });
  };

  const handlePointerOut = (event, line) => {
    event.stopPropagation();
    
    // Reset the country borders
    line.material.color.set(new Color('black'));
    line.material.opacity = 0.5;
    line.material.needsUpdate = true;
    
    setHoveredCountry(null);
  };

  const handleClick = (event, line) => {
    event.stopPropagation();
    
    // Filter attacks by the clicked country
    if (line.countryId) {
      updateFilters({ countries: [line.countryId] });
      
      // Animate camera to focus on the country
      const countryPosition = event.point.normalize().multiplyScalar(radius * 1.5);
      camera.position.copy(countryPosition);
    }
  };

  return (
    <>
      <mesh ref={globeRef}>
        <sphereGeometry args={[radius, 64, 64]} />
        {globeMaterial && <primitive object={globeMaterial} attach="material" />}

        {/* Render all the border lines */}
        {lines.map((line, index) => (
          <line
            key={`country-${line.countryId}-${index}`}
            geometry={line.geometry}
            material={line.material}
            onPointerOver={(e) => handlePointerOver(e, line)}
            onPointerOut={(e) => handlePointerOut(e, line)}
            onClick={(e) => handleClick(e, line)}
          />
        ))}
      </mesh>

      {/* Country info tooltip */}
      {hoveredCountry && (
        <sprite
          position={[0, radius * 1.2, 0]}
          scale={[radius * 0.2, radius * 0.05, 1]}
        >
          <spriteMaterial
            attach="material"
            color="#000000"
            opacity={0.8}
            transparent
          />
          {/* Country name would be displayed here in a real implementation */}
        </sprite>
      )}
    </>
  );
};

export default Globe;
