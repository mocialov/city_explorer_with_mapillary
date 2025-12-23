import React, { useState, useRef } from 'react';
import CityForm, { CityFormData } from './components/CityForm';
import ImageSlideshow from './components/ImageSlideshow';
import RouteList, { RouteInfo } from './components/RouteList';
import { getCityBounds, getRouteCoordinates, getMapillaryImagesBatch, reverseGeocode } from './services/api';
import { generateRandomRoutes, generateEvenlySpacedPoints, distance } from './utils/calculations';
import './App.css';

interface LoadingState {
  isLoading: boolean;
  progress: number;
  message: string;
}

const App: React.FC = () => {
  const [routes, setRoutes] = useState<RouteInfo[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [cityName, setCityName] = useState<string>('');
  const [cityBoundsCache, setCityBoundsCache] = useState<any>(null);
  const [routeCounter, setRouteCounter] = useState<number>(0);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    message: '',
  });
  const [showExplorer, setShowExplorer] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const cancelDownloadRef = useRef<{ [key: string]: boolean }>({});

  // Debug routes changes
  React.useEffect(() => {
    console.log('🔄 Routes state updated:', {
      totalRoutes: routes.length,
      routes: routes.map(r => ({
        id: r.id,
        imageCount: r.imageCount,
        imagesLength: r.images.length,
        isLoading: r.isLoading,
        hasOriginAddress: !!r.originAddress,
        hasDestinationAddress: !!r.destinationAddress
      }))
    });
  }, [routes]);

  const fetchImagesForRoute = async (
    routeId: string,
    routeCoords: [number, number][],
    updateRouteProgress: (routeId: string, images: string[], coordinates: [number, number][], imageCount: number) => void
  ) => {
    // Generate evenly spaced points along the route
    const spacedPoints = generateEvenlySpacedPoints(routeCoords, 50);
    
    const fetchedImages: string[] = [];
    const fetchedCoordinates: [number, number][] = [];
    const usedImageIds = new Set<string>();
    const usedImageLocations: [number, number][] = [];
    const minImageDistanceKm = 0.03;
    const MAX_IMAGES_PER_ROUTE = 100; // Cap at 100 images per route

    const pointsToFetch = spacedPoints.map(({ coord, bearing }) => ({
      coord,
      heading: bearing,
    }));

    const batchSize = 10;
    for (let i = 0; i < pointsToFetch.length; i += batchSize) {
      if (cancelDownloadRef.current[routeId]) {
        break;
      }

      // Stop fetching if we've reached the maximum number of images
      if (fetchedImages.length >= MAX_IMAGES_PER_ROUTE) {
        break;
      }

      const batch = pointsToFetch.slice(i, i + batchSize);
      const batchResults = await getMapillaryImagesBatch(batch, batchSize);

      batchResults.forEach((imageData) => {
        // Check if we've reached the limit before adding more images
        if (fetchedImages.length >= MAX_IMAGES_PER_ROUTE) {
          return;
        }

        if (imageData && !usedImageIds.has(imageData.id)) {
          const [imgLon, imgLat] = imageData.geometry.coordinates;
          const imageCoord: [number, number] = [imgLat, imgLon];

          let tooClose = false;
          for (const usedLocation of usedImageLocations) {
            if (distance(imageCoord, usedLocation) < minImageDistanceKm) {
              tooClose = true;
              break;
            }
          }

          if (!tooClose) {
            fetchedImages.push(imageData.thumbUrl);
            fetchedCoordinates.push(imageCoord);
            usedImageIds.add(imageData.id);
            usedImageLocations.push(imageCoord);
          }
        }
      });

      updateRouteProgress(routeId, [...fetchedImages], [...fetchedCoordinates], fetchedImages.length);
    }
  };

  const handleCitySubmit = async (formData: CityFormData) => {
    setLoadingState({ isLoading: true, progress: 0, message: 'Fetching city boundaries...' });
    setRouteCounter(0);

    try {
      // Get city bounds
      const cityBounds = await getCityBounds(formData.city);
      setCityName(cityBounds.name);
      setCityBoundsCache(cityBounds);

      // Generate initial 5 routes
      await generateAndFetchRoutes(cityBounds, 5, true);
      
      setLoadingState({ isLoading: false, progress: 100, message: 'Complete!' });
    } catch (error) {
      console.error('Error generating routes:', error);
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLoadingState({ isLoading: false, progress: 0, message: '' });
    }
  };

  const generateAndFetchRoutes = async (cityBounds: any, numRoutes: number, isInitial: boolean = false) => {
    setLoadingState({ isLoading: true, progress: 20, message: 'Generating random routes...' });
    const randomRoutes = generateRandomRoutes(cityBounds.boundingBox, numRoutes);

    // Initialize route info
    const newRoutes: RouteInfo[] = randomRoutes.map((route, idx) => ({
      id: `route-${routeCounter + idx + 1}`,
      origin: route.origin,
      destination: route.destination,
      images: [],
      coordinates: [],
      isLoading: true,
      imageCount: 0,
    }));

    setRouteCounter(prev => prev + numRoutes);
    setRoutes(prev => [...prev, ...newRoutes]);
    
    if (isInitial) {
      setShowExplorer(true);
      setSelectedRouteId(newRoutes[0].id);
    }

    // Reverse geocode addresses in parallel (non-blocking)
    setLoadingState({ isLoading: true, progress: 25, message: 'Fetching addresses...' });
    const addressPromises = newRoutes.map(async (route) => {
      const [originLat, originLon] = route.origin;
      const [destLat, destLon] = route.destination;
      
      const [originAddr, destAddr] = await Promise.all([
        reverseGeocode(originLat, originLon),
        reverseGeocode(destLat, destLon),
      ]);
      
      return {
        id: route.id,
        originAddress: originAddr,
        destinationAddress: destAddr,
      };
    });

    Promise.all(addressPromises).then((addresses) => {
      setRoutes((prevRoutes) =>
        prevRoutes.map((r) => {
          const addr = addresses.find((a) => a.id === r.id);
          return addr ? { ...r, originAddress: addr.originAddress, destinationAddress: addr.destinationAddress } : r;
        })
      );
    })
    .catch(error => {
      console.error('Error fetching addresses:', error);
    });

    // Function to update a specific route's progress
    const updateRouteProgress = (
      routeId: string,
      images: string[],
      coordinates: [number, number][],
      imageCount: number
    ) => {
      console.log(`📸 Route ${routeId} progress:`, {
        fetchedImages: images.length,
        totalImageCount: imageCount,
        stillLoading: images.length < imageCount && imageCount > 0
      });
      setRoutes((prevRoutes) =>
        prevRoutes.map((r) =>
          r.id === routeId
            ? { ...r, images, coordinates, imageCount, isLoading: images.length < imageCount && imageCount > 0 }
            : r
        )
      );
    };

    // Fetch routes sequentially to avoid overwhelming the API
    for (let i = 0; i < newRoutes.length; i++) {
      const route = newRoutes[i];
      const routeId = route.id;

      setLoadingState({
        isLoading: true,
        progress: 20 + Math.floor((i / newRoutes.length) * 80),
        message: `Fetching route ${i + 1} of ${newRoutes.length}...`,
      });

      try {
        // Get route coordinates
        const origin = route.origin;
        const dest = route.destination;
        const originStr = `${origin[1]},${origin[0]}`; // lon,lat for OSRM
        const destStr = `${dest[1]},${dest[0]}`;

        const routeCoords = await getRouteCoordinates(originStr, destStr);

        if (routeCoords.length > 0) {
          // Fetch images for this route
          await fetchImagesForRoute(routeId, routeCoords, updateRouteProgress);
        }

        // Mark route as loaded
        console.log(`✅ Route ${routeId} finished loading`);
        setRoutes((prevRoutes) => {
          const updated = prevRoutes.map((r) => {
            if (r.id === routeId) {
              console.log(`✅ Final state for ${routeId}:`, {
                imageCount: r.imageCount,
                imagesLength: r.images.length,
                willBeFiltered: r.imageCount < 5
              });
              return { ...r, isLoading: false };
            }
            return r;
          });
          return updated;
        });
      } catch (error) {
        console.error(`❌ Error fetching route ${routeId}:`, error);
        setRoutes((prevRoutes) =>
          prevRoutes.map((r) => (r.id === routeId ? { ...r, isLoading: false } : r))
        );
      }
    }
  };

  const handleLoadMoreRoutes = async () => {
    if (!cityBoundsCache || isLoadingMore) return;
    
    setIsLoadingMore(true);
    try {
      await generateAndFetchRoutes(cityBoundsCache, 3, false);
    } catch (error) {
      console.error('Error loading more routes:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleRouteSelect = (routeId: string) => {
    setSelectedRouteId(routeId);
  };

  const handleRouteComplete = () => {
    // Find current route index
    const currentIndex = routes.findIndex((r) => r.id === selectedRouteId);
    if (currentIndex === -1) return;
    
    // Move to next route, or loop back to first
    const nextIndex = (currentIndex + 1) % routes.length;
    setSelectedRouteId(routes[nextIndex].id);
  };

  const handleBackToForm = () => {
    // Cancel all downloads
    Object.keys(cancelDownloadRef.current).forEach((key) => {
      cancelDownloadRef.current[key] = true;
    });
    setShowExplorer(false);
    setRoutes([]);
    setSelectedRouteId(null);
    setLoadingState({ isLoading: false, progress: 0, message: '' });
  };

  const selectedRoute = routes.find((r) => r.id === selectedRouteId);

  return (
    <div className={`App ${showExplorer ? 'explorer-active' : ''}`}>
      {!showExplorer ? (
        <CityForm onSubmit={handleCitySubmit} isLoading={loadingState.isLoading} />
      ) : (
        <div className="split-screen-layout">
          <div className="slideshow-panel">
            {selectedRoute ? (
              <ImageSlideshow
                key={selectedRouteId}
                images={selectedRoute.images}
                coordinates={selectedRoute.coordinates}
                onClose={handleBackToForm}
                isLoading={selectedRoute.isLoading}
                loadingMessage={`Loading images for route...`}
                onRouteComplete={handleRouteComplete}
              />
            ) : (
              <div className="no-selection">
                <p>Select a route to view</p>
              </div>
            )}
          </div>
          <div className="routes-panel">
            <RouteList
              routes={routes}
              selectedRouteId={selectedRouteId}
              onRouteSelect={handleRouteSelect}
              cityName={cityName}
              onLoadMoreRoutes={handleLoadMoreRoutes}
              isLoadingMore={isLoadingMore}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
