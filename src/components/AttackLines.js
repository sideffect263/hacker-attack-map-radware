import React, { useMemo, useRef } from 'react';
import { CatmullRomCurve3, Vector3, TubeGeometry, ShaderMaterial, Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const AttackLines = ({ attackData }) => {

  const globeRef = useRef();


  const latLngToCartesian = (lat, lng, radius = 5000) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return new Vector3(x, y, z);
  };

  const getAttackColor = (type) => {
    switch (type) {
      case 'webAttackers':
        return '#fcec52';
      case 'scanners':
        return '#e94f37';
      case 'intruders':
        return '#48bfe3';
      case 'ioTBotnets':
        return '#80ffdb';
      default:
        return '#fdffb6';
    }
  };

  const getDistance = (source, destination) => {
    const lat1 = source[0];
    const lon1 = source[1];
    const lat2 = destination[0];
    const lon2 = destination[1];

    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return d;
  };

  const lines = useMemo(() => {
    return attackData.map((attack) => {
      const color = getAttackColor(attack.type);

      const sourceCoords = latLngToCartesian(attack.sourceCoords[0], attack.sourceCoords[1]);
      const destinationCoords = latLngToCartesian(attack.destinationCoords[0], attack.destinationCoords[1]);

      let tempDistance = getDistance(attack.sourceCoords, attack.destinationCoords);
      tempDistance = tempDistance / 10000;

      if (tempDistance < 0.5) {
        tempDistance = 0.6;
      }

      const midPoint = new Vector3()
        .addVectors(sourceCoords, destinationCoords)
        .multiplyScalar(tempDistance * 10000); // Adjust to control arc height

      midPoint.setLength((midPoint.length() + tempDistance) / 10000);

      const curve = new CatmullRomCurve3([sourceCoords, midPoint, destinationCoords]);

      const tubeGeometry = new TubeGeometry(curve, 64, 30.5, 8, false);

      const shaderMaterial = new ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(color) },
          time: { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color;
          uniform float time;
          varying vec2 vUv;
          void main() {
            float alpha = smoothstep(0.0, 0.1, mod(vUv.x + time, 1.0)) * smoothstep(0.9, 1.0, mod(vUv.x + time, 1.0));
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
      });

      const mesh = new Mesh(tubeGeometry, shaderMaterial);

      return { mesh, shaderMaterial };
    });
  }, [attackData]);

  useFrame(({ clock }) => {


    if(globeRef.current) {
      globeRef.current.rotation.y += 0.0005;
    }
    const elapsedTime = clock.getElapsedTime();
    lines.forEach(({ shaderMaterial }) => {
      shaderMaterial.uniforms.time.value = elapsedTime * 0.5; // Adjust speed of animation
    });
  });

  function deg2rad(degrees) {
    return degrees * (Math.PI / 180);
  }

  return <group ref={globeRef}>{lines.map(({ mesh }, index) => <primitive key={index} object={mesh} />)}</group>;
};

export default AttackLines;
