import { useState, useEffect } from 'react';

export const useGoogleMaps = (apiKey) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        if (window.google && window.google.maps) {
            setIsLoaded(true);
            return;
        }

        const scriptId = 'google-maps-script';
        let script = document.getElementById(scriptId);

        if (!script) {
            script = document.createElement('script');
            script.id = scriptId;
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
            script.async = true;
            script.defer = true;
            
            script.onload = () => setIsLoaded(true);
            script.onerror = (err) => setLoadError(err);
            
            document.head.appendChild(script);
        } else {
            // Script already loading
            script.addEventListener('load', () => setIsLoaded(true));
            script.addEventListener('error', (err) => setLoadError(err));
        }

        return () => {
            // We usually don't remove the script to allow caching across components
        };
    }, [apiKey]);

    return { isLoaded, loadError };
};
