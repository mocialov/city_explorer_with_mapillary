import React from 'react';
import './RouteList.css';

export interface RouteInfo {
  id: string;
  origin: [number, number];
  destination: [number, number];
  originAddress?: string;
  destinationAddress?: string;
  images: string[];
  coordinates: [number, number][];
  isLoading: boolean;
  imageCount: number;
}

interface RouteListProps {
  routes: RouteInfo[];
  selectedRouteId: string | null;
  onRouteSelect: (routeId: string) => void;
  cityName: string;
  onLoadMoreRoutes: () => void;
  isLoadingMore: boolean;
}

const RouteList: React.FC<RouteListProps> = ({ routes, selectedRouteId, onRouteSelect, cityName, onLoadMoreRoutes, isLoadingMore }) => {
  // Filter out routes with less than 5 images (unless they're still loading)
  const visibleRoutes = routes.filter(route => route.isLoading || route.imageCount >= 5);

  return (
    <div className="route-list-container">
      <div className="route-list-header">
        <h2>🗺️ {cityName}</h2>
        <p className="route-count">{visibleRoutes.length} routes</p>
      </div>
      
      <div className="routes-grid">
        {visibleRoutes.map((route, index) => (
          <div
            key={route.id}
            className={`route-card ${selectedRouteId === route.id ? 'active' : ''} ${route.isLoading ? 'loading' : ''}`}
            onClick={() => onRouteSelect(route.id)}
          >
            <div className="route-thumbnail">
              {route.images.length > 0 ? (
                <img
                  src={route.images[0]}
                  alt={
                    route.originAddress && route.destinationAddress
                      ? `Route ${index + 1} in ${cityName}: ${route.originAddress} to ${route.destinationAddress} — Mapillary street-level preview`
                      : `Route ${index + 1} in ${cityName} — Mapillary street-level preview`
                  }
                />
              ) : (
                <div className="thumbnail-placeholder">
                  {route.isLoading ? (
                    <div className="spinner"></div>
                  ) : (
                    <span>📍</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="route-info">
              <h3 className="route-title">
                {route.originAddress || `${route.origin[0].toFixed(3)}°, ${route.origin[1].toFixed(3)}°`}
                <span className="arrow"> → </span>
                {route.destinationAddress || `${route.destination[0].toFixed(3)}°, ${route.destination[1].toFixed(3)}°`}
              </h3>
              <div className="route-stats">
                <span className="stat">
                  {route.isLoading ? (
                    <>Loading...</>
                  ) : (
                    <>{route.imageCount} images</>
                  )}
                </span>
              </div>
              
              {selectedRouteId === route.id && (
                <div className="now-playing">▶ Now Playing</div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className="load-more-container">
        <button 
          className={`load-more-button ${isLoadingMore ? 'loading' : ''}`} 
          onClick={onLoadMoreRoutes}
          disabled={isLoadingMore}
        >
          {isLoadingMore ? 'Loading more routes...' : '+ More Routes'}
        </button>
      </div>
    </div>
  );
};

export default RouteList;
