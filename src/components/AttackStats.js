import React, { useMemo } from 'react';
import { useAttackData } from '../context/AttackContext';
import { getAttackTypeLabel } from '../utils/dataTransformUtils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import '../styles/AttackStats.css';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const AttackStats = () => {
  const { stats, updateFilters } = useAttackData();

  // Prepare data for type chart
  const typeData = useMemo(() => {
    return Object.entries(stats.byType).map(([type, count]) => ({
      name: getAttackTypeLabel(type),
      value: count,
      type
    }));
  }, [stats.byType]);

  // Prepare data for country chart (top 5)
  const countryData = useMemo(() => {
    return Object.entries(stats.byCountry)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country, count]) => ({
        name: country,
        value: count,
        country
      }));
  }, [stats.byCountry]);

  // Prepare data for time chart
  const timeData = useMemo(() => {
    return Object.entries(stats.byTime).map(([interval, count], index) => ({
      name: `${index * 5} min`,
      value: count
    }));
  }, [stats.byTime]);

  const handleTypeClick = (data) => {
    if (data && data.type) {
      updateFilters({ types: [data.type] });
    }
  };

  const handleCountryClick = (data) => {
    if (data && data.country) {
      updateFilters({ countries: [data.country] });
    }
  };

  return (
    <div className="attack-stats">
      <h2>Attack Statistics</h2>
      
      <div className="stats-section">
        <h3>Total Attacks: {stats.total}</h3>
      </div>
      
      <div className="stats-section">
        <h3>Attacks by Type</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={typeData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              onClick={handleTypeClick}
            >
              {typeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="stats-section">
        <h3>Top 5 Source Countries</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={countryData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8884d8" onClick={handleCountryClick} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="stats-section">
        <h3>Attacks Over Time (Last Hour)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={timeData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AttackStats; 