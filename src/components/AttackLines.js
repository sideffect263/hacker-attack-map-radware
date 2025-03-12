import React, { useMemo, useRef } from 'react';
import { CatmullRomCurve3, Vector3, TubeGeometry, ShaderMaterial, Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAttackData } from '../context/AttackContext';
import { getAttackColor, calculateDistance, latLngToCartesian } from '../utils/dataTransformUtils';

const AttackLines = () => {
  const { visibleAttacks } = useAttackData();
  const globeRef = useRef();

  const lines = useMemo(() => {
    return visibleAttacks.map((attack) => {
      const color = getAttackColor(attack.type);

      const sourceCoords = new Vector3(
        latLngToCartesian(attack.sourceCoords[0], attack.sourceCoords[1]).x,
        latLngToCartesian(attack.sourceCoords[0], attack.sourceCoords[1]).y,
        latLngToCartesian(attack.sourceCoords[0], attack.sourceCoords[1]).z
      );
      
      const destinationCoords = new Vector3(
        latLngToCartesian(attack.destinationCoords[0], attack.destinationCoords[1]).x,
        latLngToCartesian(attack.destinationCoords[0], attack.destinationCoords[1]).y,
        latLngToCartesian(attack.destinationCoords[0], attack.destinationCoords[1]).z
      );

      let tempDistance = calculateDistance(attack.sourceCoords, attack.destinationCoords);
      tempDistance = tempDistance / 10000;

      if (tempDistance < 0.5) {
        tempDistance = 0.6;
      }

      const midPoint = new Vector3()
        .addVectors(sourceCoords, destinationCoords)
        .multiplyScalar(tempDistance * 10000);

      midPoint.setLength((midPoint.length() + tempDistance) / 10000);

      const curve = new CatmullRomCurve3([sourceCoords, midPoint, destinationCoords]);

      const tubeGeometry = new TubeGeometry(curve, 64, 30.5, 8, false);

      const shaderMaterial = new ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(color) },
          time: { value: 0 },
          weight: { value: attack.weight || 1 },
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
          uniform float weight;
          varying vec2 vUv;
          void main() {
            float alpha = smoothstep(0.0, 0.1, mod(vUv.x + time, 1.0)) * smoothstep(0.9, 1.0, mod(vUv.x + time, 1.0));
            alpha *= min(weight, 1.0); // Scale alpha by weight, but cap at 1.0
            gl_FragColor = vec4(color, alpha);
          }
        `,
        transparent: true,
      });

      const mesh = new Mesh(tubeGeometry, shaderMaterial);
      mesh.userData = { attackId: attack.id };

      return { mesh, shaderMaterial };
    });
  }, [visibleAttacks]);

  useFrame(({ clock }) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.0005;
    }
    
    const elapsedTime = clock.getElapsedTime();
    lines.forEach(({ shaderMaterial }) => {
      shaderMaterial.uniforms.time.value = elapsedTime * 0.5; // Adjust speed of animation
    });
  });

  return (
    <group ref={globeRef}>
      {lines.map(({ mesh }, index) => (
        <primitive key={`attack-line-${index}`} object={mesh} />
      ))}
    </group>
  );
};

export default AttackLines;
