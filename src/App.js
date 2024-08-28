import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import './App.css';

function App() {
  const [attackData, setAttackData] = useState([]);

  useEffect(() => {
    // Function to fetch attack data
    const fetchData = async () => {
      try {
        const response = await axios.get('https://radware-proxy.onrender.com/api/attacks');
        console.log(response.data)
        const transformedData = await transformData(response.data); // Await the transformation
        setAttackData((prevData) => [...prevData, ...transformedData]);
        console.log('Attack data:', transformedData);
      } catch (error) {
        console.error('Error fetching attack data:', error);
      }
    };

    // Fetch initial data
    fetchData();

    // Set up interval to fetch data every 15 seconds
    const intervalId = setInterval(fetchData, 150000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const transformData = async (data) => {
    // Flatten the array
    const flattenedData = data.flat();

    // Map over the flattened data and fetch coordinates asynchronously
    const transformedData = await Promise.all(flattenedData.map(async (item) => {
        const { lat, lng } = await getCords(item.sourceCountry);
        console.log(lat, lng, item.sourceCountry);
        return {
            sourceCountry: item.sourceCountry,
            destinationCountry: item.destinationCountry || 'Unknown',
            latitude: lat || 0, // Handle cases where coordinates are undefined
            longitude: lng || 0, // Handle cases where coordinates are undefined
            type: item.type,
            weight: item.weight,
        };
    }));

    return transformedData;
  };

  const getCords = async (country) => {
    try {
      console.log('Fetching coordinates for:', country);
        const res = await axios.get('https://maps.googleapis.com/maps/api/geocode/json?key=AIzaSyBONZvJRaYPDVI-KSarCJ58PC8rLjPj2Iw&address=' + encodeURIComponent(country));
        const data = res.data;
        if (data.status === "OK" && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            const lat = location.lat;
            const lng = location.lng;
            return { lat, lng };
        } else {
            console.warn(`No results found for ${country}`);
            return { lat: 0, lng: 0 }; // Return default coordinates if no results found
        }
    } catch (error) {
        console.error(`Error fetching coordinates for ${country}:`, error);
        return { lat: 0, lng: 0 }; // Return default coordinates on error
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Live Threat Map</h1>
      </header>
      <MapContainer center={[20, 0]} zoom={2} style={{ height: "80vh", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {attackData.map((attack, index) => {
          const attackColor =
            attack.type === 'webAttackers' ? 'red' :
            attack.type === 'scanners' ? 'blue' :
            attack.type === 'intruders' ? 'green' :
            attack.type === 'ioTBotnets' ? 'orange' :
            'purple'; // Adjust color based on attack type
          return (
            <CircleMarker
              key={index}
              center={[attack.latitude, attack.longitude]}
              radius={5}
              fillColor={attackColor}
              fillOpacity={0.5}
              stroke={false}
            >
              <Popup>
                {attack.sourceCountry} - {attack.destinationCountry} <br />
                Type: {attack.type} <br />
                Weight: {attack.weight}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <footer>
        <p>Powered by Radware</p>
      </footer>
    </div>
  );
}

export default App;
