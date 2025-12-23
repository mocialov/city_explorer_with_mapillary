import React, { useState, useEffect } from 'react';
import MapTile from './MapTile';
import './ImageSlideshow.css';

interface ImageSlideshowProps {
  images: string[];
  coordinates: [number, number][];
  onClose: () => void;
  isLoading?: boolean;
  loadingMessage?: string;
  onRouteComplete?: () => void;
}

const ImageSlideshow: React.FC<ImageSlideshowProps> = ({ 
  images, 
  coordinates, 
  onClose, 
  isLoading = false, 
  loadingMessage = '',
  onRouteComplete
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false); // Start paused until images arrive
  const playbackSpeed = 2000; // milliseconds per frame - default 0.5 fps

  // Main playback loop - automatically loops through available images
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const currentLength = images.length;
        if (currentLength === 0) return prev;
        
        const nextIndex = prev + 1;
        
        // If we're about to go past the last image
        if (nextIndex >= currentLength) {
          // If still loading, stay on current image and wait for more
          if (isLoading) {
            return prev; // Stay on current image
          }
          // If loading complete, move to next route
          if (onRouteComplete) {
            onRouteComplete();
          }
          return 0; // Reset to start for current route
        }
        
        return nextIndex;
      });
    }, playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, isLoading, images.length, onRouteComplete]); // Added onRouteComplete

  // Auto-start playback when first images arrive
  useEffect(() => {
    if (images.length > 0 && !isPlaying) {
      console.log('Auto-starting playback with', images.length, 'images');
      setIsPlaying(true);
    }
  }, [images.length, isPlaying]);

  // Keep currentIndex in bounds as new images are added
  useEffect(() => {
    if (images.length > 0 && currentIndex >= images.length) {
      setCurrentIndex(images.length - 1);
    }
  }, [images.length, currentIndex]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentIndex, isPlaying]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show "no images found" message only after loading is complete and minimum wait time
  // Commented out - keep showing loading animation instead
  // if (showNoImagesMessage && images.length === 0) {
  //   return (
  //     <div className="slideshow-container">
  //       <div className="no-images">
  //         <p>No images found for this route.</p>
  //         <p>Try a different location with better Mapillary coverage.</p>
  //         <button onClick={onClose} className="close-button">Close</button>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="slideshow-container">
      {/* <div className="slideshow-header">
        <h2>Route Preview {isLoading && '(Loading...)'}</h2>
        <button onClick={onClose} className="close-button">✕</button>
      </div> */}

      <div className="slideshow-main">
        <div className="image-container">
          {images.length > 0 ? (
            <>
              <img
                src={images[currentIndex]}
                alt={`Street view ${currentIndex + 1}`}
                className="slideshow-image"
              />
              {/* Show map tile if we have coordinates for this image */}
              {coordinates && coordinates[currentIndex] && (
                <MapTile
                  latitude={coordinates[currentIndex][0]}
                  longitude={coordinates[currentIndex][1]}
                />
              )}
            </>
          ) : (
            <div className="loading-placeholder">
              <div className="loading-car-animation">🚗</div>
              <p>Loading route images...</p>
              {loadingMessage && <p className="loading-message">{loadingMessage}</p>}
            </div>
          )}
        </div>
        
        <div className="route-progress">
          <span className="progress-label">START</span>
          <div className="progress-track">
            <div 
              className="progress-indicator" 
              style={{ left: `${images.length > 0 ? (currentIndex / Math.max(images.length - 1, 1)) * 100 : 0}%` }}
            >
              <div className="progress-car">🚗</div>
            </div>
          </div>
          <span className="progress-label">FINISH</span>
        </div>

        {/* <div className="slideshow-controls">
          <button onClick={handlePrevious} className="control-btn" disabled={images.length === 0}>
            ⏮ Previous
          </button>
          
          <button onClick={handlePlayPause} className="control-btn play-pause" disabled={images.length === 0}>
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          
          <button onClick={handleNext} className="control-btn" disabled={images.length === 0}>
            Next ⏭
          </button>
        </div> */}

        {/* <div className="slideshow-info">
          <div className="speed-control">
            <label htmlFor="speed">Speed:</label>
            <select
              id="speed"
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            >
              <option value="10000">Very Slow (0.1 fps)</option>
              <option value="2000">Slow (0.5 fps)</option>
              <option value="1000">Medium (1 fps)</option>
              <option value="667">Fast (1.5 fps)</option>
              <option value="500">Very Fast (2 fps)</option>
            </select>
          </div>
        </div> */}
      </div>

      {/* <div className="slideshow-footer">
        <p>💡 Tips: Arrow keys to navigate • Spacebar to play/pause</p>
      </div> */}
    </div>
  );
};

export default ImageSlideshow;
