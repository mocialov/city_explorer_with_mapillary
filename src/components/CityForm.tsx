import React, { useState } from 'react';
import './CityForm.css';

export interface CityFormData {
  city: string;
}

interface CityFormProps {
  onSubmit: (data: CityFormData) => void;
  isLoading: boolean;
}

const CityForm: React.FC<CityFormProps> = ({ onSubmit, isLoading }) => {
  const [city, setCity] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ city });
  };

  return (
    <div className="city-form-container">
      <h1>🌆 Explore A City</h1>
      <p className="subtitle">Discover random routes through any city with street-level imagery</p>
      
      <form onSubmit={handleSubmit} className="city-form">
        <div className="form-group">
          <label htmlFor="city">City Name</label>
          <input
            type="text"
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Enter a city name"
            required
            disabled={isLoading}
          />
          <small>Example: "San Francisco", "Paris, France", "Tokyo, Japan"</small>
        </div>

        <button type="submit" className={`submit-button ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
          <span className="button-text">{isLoading ? 'Generating routes...' : 'Explore City'}</span>
        </button>
      </form>
    </div>
  );
};

export default CityForm;
