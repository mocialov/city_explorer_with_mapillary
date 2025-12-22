import React, { useState, useEffect, useRef } from 'react';
import MapTile from './MapTile';
import './ImageSlideshow.css';

interface ImageSlideshowProps {
  images: string[];
  coordinates: [number, number][];
  onClose: () => void;
  isLoading?: boolean;
  loadingMessage?: string;
}

const ImageSlideshow: React.FC<ImageSlideshowProps> = ({ 
  images, 
  coordinates, 
  onClose, 
  isLoading = false, 
  loadingMessage = '' 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false); // Start paused until images arrive
  const [playbackSpeed, setPlaybackSpeed] = useState(2000); // milliseconds per frame - default 0.5 fps
  const [showNoImagesMessage, setShowNoImagesMessage] = useState(false);
  const mountTimeRef = useRef(Date.now());

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
          // If loading complete, loop back to start
          return 0;
        }
        
        return nextIndex;
      });
    }, playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, isLoading, images.length]); // Added isLoading to know when to pause vs loop

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

  // Smart "no images found" detection - only show after loading complete AND minimum wait time
  useEffect(() => {
    const MINIMUM_WAIT_TIME = 3000; // Wait at least 3 seconds before showing error
    
    // If we have images, hide the error message
    if (images.length > 0) {
      setShowNoImagesMessage(false);
      return;
    }
    
    // If still loading, don't show error yet
    if (isLoading) {
      setShowNoImagesMessage(false);
      return;
    }
    
    // Loading is complete and no images - check if minimum time has passed
    const timeElapsed = Date.now() - mountTimeRef.current;
    
    if (timeElapsed >= MINIMUM_WAIT_TIME) {
      // Enough time has passed, show the error message
      setShowNoImagesMessage(true);
    } else {
      // Wait for remaining time before showing error
      const timeoutId = setTimeout(() => {
        setShowNoImagesMessage(true);
      }, MINIMUM_WAIT_TIME - timeElapsed);
      
      return () => clearTimeout(timeoutId);
    }
  }, [images.length, isLoading]);

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
  if (showNoImagesMessage && images.length === 0) {
    return (
      <div className="slideshow-container">
        <div className="no-images">
          <p>No images found for this route.</p>
          <p>Try a different location with better Mapillary coverage.</p>
          <button onClick={onClose} className="close-button">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="slideshow-container">
      <div className="slideshow-header">
        <h2>Route Preview {isLoading && '(Loading...)'}</h2>
        <button onClick={onClose} className="close-button">✕</button>
      </div>

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
              <p>Loading images...</p>
              {loadingMessage && <p className="loading-message">{loadingMessage}</p>}
            </div>
          )}
        </div>
        
        <div className="slideshow-controls">
          <button onClick={handlePrevious} className="control-btn" disabled={images.length === 0}>
            ⏮ Previous
          </button>
          
          <button onClick={handlePlayPause} className="control-btn play-pause" disabled={images.length === 0}>
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          
          <button onClick={handleNext} className="control-btn" disabled={images.length === 0}>
            Next ⏭
          </button>
        </div>

        <div className="slideshow-info">
          <span>
            Image {images.length > 0 ? currentIndex + 1 : 0} of {images.length}
            {isLoading && currentIndex === images.length - 1 && ' (waiting for more...)'}
            {isLoading && currentIndex < images.length - 1 && ' (loading more...)'}
          </span>
          
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
        </div>
      </div>

      <div className="slideshow-footer">
        <p>💡 Tips: Arrow keys to navigate • Spacebar to play/pause</p>
      </div>
    </div>
  );
};

export default ImageSlideshow;
