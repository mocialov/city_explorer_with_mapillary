import React from 'react';
import './MapTile.css';

interface MapTileProps {
  latitude: number;
  longitude: number;
  zoom?: number;
}

const MapTile: React.FC<MapTileProps> = ({ latitude, longitude, zoom = 15 }) => {
  // OpenStreetMap static map tile URL
  // We'll use a simple marker overlay on the map
  const mapWidth = 250;
  const mapHeight = 200;
  
  // Using OpenStreetMap's tile server with Leaflet marker
  // We'll create a simple static map using OSM tiles
  const tileSize = 256;
  
  // Convert lat/lon to precise tile coordinates (with decimal precision)
  const latRad = latitude * Math.PI / 180;
  const n = Math.pow(2, zoom);
  
  // Precise tile coordinates (not floored - we keep the decimal part)
  const xtileFloat = (longitude + 180) / 360 * n;
  const ytileFloat = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n;
  
  // Calculate pixel position of the point within the world at this zoom level
  const worldPixelX = xtileFloat * tileSize;
  const worldPixelY = ytileFloat * tileSize;
  
  // Center of our map view
  const centerX = mapWidth / 2;
  const centerY = mapHeight / 2;
  
  // Calculate which tiles we need to cover the map area
  const tilesToLoad = [];
  const tilesX = Math.ceil(mapWidth / tileSize) + 1;
  const tilesY = Math.ceil(mapHeight / tileSize) + 1;
  
  // Starting tile (top-left corner of our view)
  const startTileX = Math.floor(xtileFloat - (mapWidth / 2) / tileSize);
  const startTileY = Math.floor(ytileFloat - (mapHeight / 2) / tileSize);
  
  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const tileX = startTileX + tx;
      const tileY = startTileY + ty;
      
      // Calculate position of this tile relative to the center point
      const tileWorldPixelX = tileX * tileSize;
      const tileWorldPixelY = tileY * tileSize;
      
      const left = tileWorldPixelX - worldPixelX + centerX;
      const top = tileWorldPixelY - worldPixelY + centerY;
      
      tilesToLoad.push({
        x: tileX,
        y: tileY,
        left,
        top,
        url: `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`
      });
    }
  }
  
  // Format coordinates for display
  const latDisplay = latitude.toFixed(6);
  const lonDisplay = longitude.toFixed(6);

  return (
    <div className="map-tile-container">
      <div className="map-tile-header">
        <span className="map-coordinates">
          {latDisplay}, {lonDisplay}
        </span>
      </div>
      <div className="map-tile" style={{ width: mapWidth, height: mapHeight }}>
        <div className="map-tiles">
          {tilesToLoad.map((tile, idx) => (
            <img
              key={idx}
              src={tile.url}
              alt=""
              className="tile-image"
              style={{
                position: 'absolute',
                left: `${tile.left}px`,
                top: `${tile.top}px`,
                width: `${tileSize}px`,
                height: `${tileSize}px`,
              }}
            />
          ))}
        </div>
        {/* Center marker */}
        <div className="map-marker" style={{
          position: 'absolute',
          left: `${centerX}px`,
          top: `${centerY}px`,
          transform: 'translate(-50%, -100%)',
        }}>
          <svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.37 0 0 5.37 0 12C0 20.25 12 36 12 36C12 36 24 20.25 24 12C24 5.37 18.63 0 12 0ZM12 16.5C9.52 16.5 7.5 14.48 7.5 12C7.5 9.52 9.52 7.5 12 7.5C14.48 7.5 16.5 9.52 16.5 12C16.5 14.48 14.48 16.5 12 16.5Z" fill="#FF0000"/>
            <circle cx="12" cy="12" r="3" fill="white"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default MapTile;
