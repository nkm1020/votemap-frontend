
import { useState, useEffect } from 'react';
import { LocationResult, reverseGeocode, getIpLocation } from '../lib/geocoding';

interface GeolocationState {
    location: LocationResult | null;
    error: string | null;
    loading: boolean;
}

export function useGeolocation() {
    const [state, setState] = useState<GeolocationState>({
        location: null,
        error: null,
        loading: true
    });

    useEffect(() => {
        let isMounted = true;

        const handleSuccess = async (position: GeolocationPosition) => {
            const { latitude, longitude } = position.coords;

            try {
                // GPS가 성공하면 Reverse Geocoding 시도
                const result = await reverseGeocode(latitude, longitude);

                if (isMounted) {
                    if (result) {
                        setState({
                            location: result,
                            error: null,
                            loading: false
                        });
                    } else {
                        // Reverse Geocoding 실패 시 좌표만라도 반환할지, 아니면 IP로 갈지?
                        // 여기서는 IP Fallback으로 한 번 더 시도해봄 (보정)
                        console.warn('GPS Reverse Geoding returned null, trying IP fallback...');
                        handleFallback();
                    }
                }
            } catch (err) {
                if (isMounted) handleFallback();
            }
        };

        const handleError = (error: GeolocationPositionError) => {
            console.warn('Geolocation access denied or failed:', error.message);
            if (isMounted) handleFallback();
        };

        const handleFallback = async () => {
            // IP 기반 위치 추적 시도
            try {
                const ipResult = await getIpLocation();
                if (isMounted) {
                    setState({
                        location: ipResult,
                        error: ipResult ? null : 'Failed to retrieve location info.',
                        loading: false
                    });
                }
            } catch (err) {
                if (isMounted) {
                    setState({
                        location: null,
                        error: 'Location services unavailable.',
                        loading: false
                    });
                }
            }
        };

        if (!navigator.geolocation) {
            handleFallback();
        } else {
            navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            });
        }

        return () => {
            isMounted = false;
        };
    }, []);

    return state;
}
