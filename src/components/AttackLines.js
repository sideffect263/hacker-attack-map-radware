// AttackLines.js
import React from 'react';
import { CatmullRomCurve3, Vector3 } from 'three';
import { Line } from '@react-three/drei';

const AttackLines = ({ attackData }) => {
  const renderLines = () => {
    return attackData.map((attack, index) => {
      const color = getAttackColor(attack.type);

      // Convert lat/lng to 3D coordinates
      const sourceCoords = latLngToCartesian(attack.sourceCoords[0], attack.sourceCoords[1]);
      const destinationCoords = latLngToCartesian(attack.destinationCoords[0], attack.destinationCoords[1]);

      // calculate the distance between the source and destination
      let tempDistance  = getDistance(attack.sourceCoords, attack.destinationCoords);

      tempDistance = tempDistance / (10000); // Adjust to control the curve
      console.log("temp",tempDistance);

      if (tempDistance < 0.5) {
        tempDistance = 0.6;
      }

      // Calculate the mid-point control position on the curve
      const midPoint = new Vector3()
        .addVectors(sourceCoords, destinationCoords)
        .multiplyScalar(tempDistance); // Adjust to control arc height

      // Move the mid-point outwards for better curvature
      midPoint.setLength((midPoint.length() + tempDistance)/1); // Adjust 50 to control the curve

      // Create a curved path using CatmullRomCurve3
      const curve = new CatmullRomCurve3([sourceCoords, midPoint, destinationCoords]);

      const points = curve.getPoints(50); // Get 50 points along the curve

      return (
        <Line
          key={index}
          points={points}
          color={color}
          lineWidth={5}
          dashed
          dashSize={5} // Adjust to control dash size
          gapSize={3} // Adjust to control gap between dashes
        />
      );
    });
  };

  const getDistance = (source, destination) => {
    const lat1 = source[0];
    const lon1 = source[1];
    const lat2 = destination[0];
    const lon2 = destination[1];

    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1); // deg2rad below
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };
  const getAttackColor = (type) => {
    switch (type) {
      case 'webAttackers':
        return 'red';
      case 'scanners':
        return 'blue';
      case 'intruders':
        return 'green';
      case 'ioTBotnets':
        return 'orange';
      default:
        return 'purple';
    }
  };

  // Converts degrees to radians
function deg2rad(degrees) {
  return degrees * (Math.PI / 180);
}

  // Convert latitude and longitude to 3D Cartesian coordinates
  const latLngToCartesian = (lat, lng, radius = 5000) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return new Vector3(x, y, z);
  };

  return <group>{renderLines()}</group>;
};

export default AttackLines;
