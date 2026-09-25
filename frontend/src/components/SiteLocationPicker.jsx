import React, { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from '../hooks/useGoogleMaps';

// You should pass your API key via environment variable. 
// e.g. import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_FALLBACK_API_KEY';

const SiteLocationPicker = ({ address, latitude, longitude, onLocationChange }) => {
    const { isLoaded, loadError } = useGoogleMaps(GOOGLE_MAPS_API_KEY);
    const mapRef = useRef(null);
    const inputRef = useRef(null);
    const [map, setMap] = useState(null);
    const [marker, setMarker] = useState(null);
    const [autocomplete, setAutocomplete] = useState(null);

    // Initialize Map and Autocomplete when script loads
    useEffect(() => {
        if (!isLoaded || loadError) return;

        // Default to center of India if no coordinates
        const initialLat = latitude ? parseFloat(latitude) : 20.5937;
        const initialLng = longitude ? parseFloat(longitude) : 78.9629;
        const initialZoom = latitude && longitude ? 15 : 5;

        const mapInstance = new window.google.maps.Map(mapRef.current, {
            center: { lat: initialLat, lng: initialLng },
            zoom: initialZoom,
            mapTypeControl: false,
            streetViewControl: false,
        });

        const markerInstance = new window.google.maps.Marker({
            position: { lat: initialLat, lng: initialLng },
            map: latitude && longitude ? mapInstance : null, // Show only if we have coordinates
            draggable: true,
            animation: window.google.maps.Animation.DROP,
        });

        // Handle Marker Drag
        window.google.maps.event.addListener(markerInstance, 'dragend', () => {
            const position = markerInstance.getPosition();
            onLocationChange({
                address: address, // keep existing address text
                latitude: position.lat().toFixed(7),
                longitude: position.lng().toFixed(7)
            });
        });

        const autocompleteInstance = new window.google.maps.places.Autocomplete(inputRef.current, {
            fields: ['formatted_address', 'geometry', 'name'],
        });

        // Bind Autocomplete to Map
        autocompleteInstance.bindTo('bounds', mapInstance);

        // Handle Place selection
        autocompleteInstance.addListener('place_changed', () => {
            const place = autocompleteInstance.getPlace();
            
            if (!place.geometry || !place.geometry.location) {
                // User entered the name of a Place that was not suggested and pressed the Enter key, or the Place Details request failed.
                return;
            }

            const newLat = place.geometry.location.lat();
            const newLng = place.geometry.location.lng();
            const newAddress = place.formatted_address || place.name;

            // Move Map and Marker
            if (place.geometry.viewport) {
                mapInstance.fitBounds(place.geometry.viewport);
            } else {
                mapInstance.setCenter(place.geometry.location);
                mapInstance.setZoom(17);
            }
            
            markerInstance.setPosition(place.geometry.location);
            markerInstance.setMap(mapInstance);

            onLocationChange({
                address: newAddress,
                latitude: newLat.toFixed(7),
                longitude: newLng.toFixed(7)
            });
        });

        setMap(mapInstance);
        setMarker(markerInstance);
        setAutocomplete(autocompleteInstance);

    }, [isLoaded, loadError]);

    // Update map/marker when props change from OUTSIDE (e.g. initial load of edit modal)
    useEffect(() => {
        if (!map || !marker || !latitude || !longitude) return;
        
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        const pos = new window.google.maps.LatLng(lat, lng);
        
        // Only update if it's a significant distance to avoid jitter during drag
        const currentPos = marker.getPosition();
        if (!currentPos || currentPos.lat() !== lat || currentPos.lng() !== lng) {
            marker.setPosition(pos);
            marker.setMap(map);
            map.setCenter(pos);
            map.setZoom(17);
        }
    }, [latitude, longitude, map, marker]);

    if (loadError) return <div className="text-red-500 text-sm">Error loading Google Maps APIs. Please check API Key.</div>;
    if (!isLoaded) return <div className="text-slate-500 text-sm">Loading Google Maps...</div>;

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Address / Location</label>
                <input
                    ref={inputRef}
                    type="text"
                    defaultValue={address}
                    placeholder="Search or paste address..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                    onChange={(e) => {
                        // Allow typing manually if they want, without selecting autocomplete
                        onLocationChange({
                            address: e.target.value,
                            latitude: latitude,
                            longitude: longitude
                        });
                    }}
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
                    <input type="text" readOnly value={latitude || ''} className="w-full px-3 py-2 border rounded-lg bg-slate-50 text-slate-500 outline-none" placeholder="Auto-filled" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
                    <input type="text" readOnly value={longitude || ''} className="w-full px-3 py-2 border rounded-lg bg-slate-50 text-slate-500 outline-none" placeholder="Auto-filled" />
                </div>
            </div>

            <div className="relative">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-slate-700">Location Preview</span>
                    {latitude && longitude ? (
                        <span className="text-xs font-semibold text-green-600 flex items-center gap-1">✓ Coordinates verified</span>
                    ) : (
                        <span className="text-xs font-semibold text-amber-600 flex items-center gap-1">⚠ Coordinates missing</span>
                    )}
                </div>
                <div ref={mapRef} className="w-full h-64 rounded-lg border border-slate-200 shadow-inner"></div>
                <p className="text-[10px] text-slate-500 mt-1">* You can drag the marker to adjust the exact location.</p>
            </div>
        </div>
    );
};

export default SiteLocationPicker;
