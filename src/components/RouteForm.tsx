import React, { useState } from 'react';
import './RouteForm.css';

export interface RouteFormData {
  origin: string;
  destination: string;
}

interface RouteFormProps {
  onSubmit: (data: RouteFormData) => void;
  isLoading: boolean;
}

const RouteForm: React.FC<RouteFormProps> = ({ onSubmit, isLoading }) => {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData: RouteFormData = {
      origin,
      destination,
    };

    onSubmit(formData);
  };

  return (
    <div className="route-form-container">
      <div className="header-with-tooltip">
        <h1>🚗 Mapillary Street View Simulator</h1>
        <button 
          className="tooltip-trigger"
          onClick={() => setShowTooltip(!showTooltip)}
          type="button"
          aria-label="How it works"
        >
          <span className="question-icon">?</span>
        </button>
        
        {showTooltip && (
          <>
            <div 
              className="tooltip-backdrop"
              onClick={() => setShowTooltip(false)}
            />
            <div className="tooltip-popup">
              <button 
                className="tooltip-close"
                onClick={() => setShowTooltip(false)}
                aria-label="Close"
              >
                ✕
              </button>
              <h3>How it works</h3>
              <ul>
                <li>Enter origin and destination addresses</li>
                <li>The app fetches street-level images along the route from Mapillary</li>
                <li>View images as an interactive slideshow with continuous playback</li>
              </ul>
              <p className="tooltip-note">
                <strong>Note:</strong> Image availability depends on Mapillary's crowdsourced data. 
                Urban areas typically have better coverage.
              </p>
            </div>
          </>
        )}
      </div>
      
      <p className="subtitle">Generate virtual drive timelapses using crowdsourced street-level imagery</p>
      
      <form onSubmit={handleSubmit} className="route-form">
        <div className="form-group">
          <label htmlFor="origin">Origin</label>
          <input
            type="text"
            id="origin"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="Enter starting address"
            required
            disabled={isLoading}
          />
          <small>Example: "San Diego, CA"</small>
        </div>

        <div className="form-group">
          <label htmlFor="destination">Destination</label>
          <input
            type="text"
            id="destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Enter destination address"
            required
            disabled={isLoading}
          />
          <small>Example: "Los Angeles, CA"</small>
        </div>

        <button type="submit" className={`submit-button ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
          <span className="button-text">{isLoading ? 'Generating...' : 'Generate Route Preview'}</span>
        </button>
      </form>
    </div>
  );
};

export default RouteForm;
