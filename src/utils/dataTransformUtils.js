import countryCoordinates from '../countries.json';

const OFFSET = 6.2;

export const isValidCoords = (coords) => {
  return Array.isArray(coords) && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1]);
};

export const getCords = (country) => {
  if (!country) {
    return [0, 0]; // Default to center for unknown countries
  }
  
  const coords = countryCoordinates[country];
  if (coords) {
    return coords;
  } else {
    console.error(`Coordinates not found for country: ${country}`);
    return [0, 0];
  }
};

export const getCordsWithOffset = (country) => {
  const coords = getCords(country);
  const latOffset = (Math.random() - 0.5) * OFFSET;
  const lngOffset = (Math.random() - 0.5) * OFFSET;
  return [coords[0] + latOffset, coords[1] + lngOffset];
};

export const transformAttackData = (data) => {
  if (!data || !Array.isArray(data)) {
    console.error('Invalid data format received:', data);
    return [];
  }

  // The server now sends a flat array of attacks with IDs already assigned
  const transformedData = data.map((item) => {
    if (!item || typeof item !== 'object') {
      console.error('Invalid item format:', item);
      return null;
    }

    // Get coordinates for source and destination countries
    const sourceCoords = getCordsWithOffset(item.sourceCountry);
    const destinationCoords = getCordsWithOffset(item.destinationCountry);

    if (!isValidCoords(sourceCoords)) {
      console.warn(`Invalid source coordinates for country: ${item.sourceCountry}`);
      return null;
    }

    // For attacks without a destination, we'll use the source coordinates
    // This is common for "webAttackers" type attacks
    const validDestCoords = isValidCoords(destinationCoords) ? 
      destinationCoords : 
      getCordsWithOffset(item.sourceCountry);

    return {
      id: item.id, // Use the ID provided by the server
      sourceCountry: item.sourceCountry,
      destinationCountry: item.destinationCountry || null,
      sourceCoords,
      destinationCoords: validDestCoords,
      type: item.type,
      weight: item.weight,
      timestamp: item.timestamp,
    };
  });

  return transformedData.filter(item => item !== null);
};

export const getAttackColor = (type) => {
  switch (type) {
    case 'webAttackers':
      return '#fcec52'; // Yellow
    case 'scanners':
      return '#e94f37'; // Red
    case 'intruders':
      return '#48bfe3'; // Blue
    case 'ioTBotnets':
      return '#80ffdb'; // Teal
    default:
      return '#fdffb6'; // Light yellow
  }
};

export const getAttackTypeLabel = (type) => {
  switch (type) {
    case 'webAttackers':
      return 'Web Attack';
    case 'scanners':
      return 'Scanner';
    case 'intruders':
      return 'Intrusion';
    case 'ioTBotnets':
      return 'IoT Botnet';
    default:
      return 'Unknown';
  }
};

export const calculateDistance = (source, destination) => {
  const lat1 = source[0];
  const lon1 = source[1];
  const lat2 = destination[0];
  const lon2 = destination[1];

  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

function deg2rad(degrees) {
  return degrees * (Math.PI / 180);
}

export const latLngToCartesian = (lat, lng, radius = 5000) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return { x, y, z };
}; 