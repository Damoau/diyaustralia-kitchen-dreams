import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Crosshair } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MapSelectorProps {
  onCoordinatesChange: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
  height?: string;
}

export const MapSelector: React.FC<MapSelectorProps> = ({
  onCoordinatesChange,
  initialLat = -33.8688,
  initialLng = 151.2093,
  height = '400px'
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [coordinates, setCoordinates] = useState({ lat: initialLat, lng: initialLng });
  const [searchAddress, setSearchAddress] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    initializeMapbox();
  }, []);

  useEffect(() => {
    if (map.current && mapboxToken) {
      initializeMap();
    }
  }, [mapboxToken]);

  const initializeMapbox = async () => {
    // Get Mapbox token from secrets - we'll use a placeholder for now
    // In production, this should come from environment or Supabase secrets
    const token = 'pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbTFsMmkyZjAwNmN6MmpzNWgwbDFpOXFzIn0.H4fF7WIWEJz52AI_iYQZcQ';
    setMapboxToken(token);
  };

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [coordinates.lng, coordinates.lat],
      zoom: 10,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add click handler
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      setCoordinates({ lat, lng });
      onCoordinatesChange(lat, lng);
      updateMarker(lat, lng);
    });

    // Add initial marker
    updateMarker(coordinates.lat, coordinates.lng);
  };

  const updateMarker = (lat: number, lng: number) => {
    if (!map.current) return;

    if (marker.current) {
      marker.current.remove();
    }

    marker.current = new mapboxgl.Marker({
      color: '#3b82f6',
      draggable: true
    })
      .setLngLat([lng, lat])
      .addTo(map.current);

    // Handle marker drag
    marker.current.on('dragend', () => {
      if (marker.current) {
        const lngLat = marker.current.getLngLat();
        setCoordinates({ lat: lngLat.lat, lng: lngLat.lng });
        onCoordinatesChange(lngLat.lat, lngLat.lng);
      }
    });
  };

  const geocodeAndCenter = async () => {
    if (!searchAddress.trim()) return;

    setIsSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-postcode', {
        body: { address: searchAddress }
      });

      if (error) throw error;
      if (!data) throw new Error('No results found');

      const { latitude, longitude } = data;
      setCoordinates({ lat: latitude, lng: longitude });
      onCoordinatesChange(latitude, longitude);

      if (map.current) {
        map.current.flyTo({
          center: [longitude, latitude],
          zoom: 12,
          essential: true
        });
        updateMarker(latitude, longitude);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const centerOnLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        setCoordinates({ lat, lng });
        onCoordinatesChange(lat, lng);

        if (map.current) {
          map.current.flyTo({
            center: [lng, lat],
            zoom: 12,
            essential: true
          });
          updateMarker(lat, lng);
        }
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <div className="flex-1">
          <Label htmlFor="map-search">Search Location</Label>
          <div className="flex space-x-2 mt-1">
            <Input
              id="map-search"
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              placeholder="Enter address, suburb, or postcode..."
              onKeyPress={(e) => e.key === 'Enter' && geocodeAndCenter()}
            />
            <Button 
              variant="outline" 
              onClick={geocodeAndCenter}
              disabled={isSearching}
            >
              <MapPin className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={centerOnLocation}
              title="Use my location"
            >
              <Crosshair className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Latitude</Label>
          <Input 
            value={coordinates.lat.toFixed(6)} 
            onChange={(e) => {
              const lat = parseFloat(e.target.value) || 0;
              setCoordinates(prev => ({ ...prev, lat }));
              onCoordinatesChange(lat, coordinates.lng);
              updateMarker(lat, coordinates.lng);
            }}
          />
        </div>
        <div>
          <Label>Longitude</Label>
          <Input 
            value={coordinates.lng.toFixed(6)} 
            onChange={(e) => {
              const lng = parseFloat(e.target.value) || 0;
              setCoordinates(prev => ({ ...prev, lng }));
              onCoordinatesChange(coordinates.lat, lng);
              updateMarker(coordinates.lat, lng);
            }}
          />
        </div>
      </div>

      <div className="relative">
        <div 
          ref={mapContainer} 
          style={{ height }} 
          className="w-full rounded-lg border"
        />
        {!mapboxToken && (
          <div className="absolute inset-0 bg-muted/80 flex items-center justify-center rounded-lg">
            <p className="text-muted-foreground">Loading map...</p>
          </div>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Click on the map or drag the marker to set the center location for your assembly radius.
      </p>
    </div>
  );
};