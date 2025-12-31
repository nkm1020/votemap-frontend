
import axios from 'axios';

export interface LocationResult {
    latitude: number;
    longitude: number;
    region1: string; // 시/도 (e.g., 서울특별시, 경기도)
    region2?: string; // 시/군/구 (e.g., 강남구, 가평군)
    source: 'gps' | 'ip';
}

/**
 * Normalize region names to match basic Korean administrative divisions
 * This is a simplified mapping and might need expansion.
 */
function normalizeRegion1(name: string): string {
    if (name.includes('Seoul') || name.includes('서울')) return '서울특별시';
    if (name.includes('Busan') || name.includes('부산')) return '부산광역시';
    if (name.includes('Daegu') || name.includes('대구')) return '대구광역시';
    if (name.includes('Incheon') || name.includes('인천')) return '인천광역시';
    if (name.includes('Gwangju') || name.includes('광주')) return '광주광역시';
    if (name.includes('Daejeon') || name.includes('대전')) return '대전광역시';
    if (name.includes('Ulsan') || name.includes('울산')) return '울산광역시';
    if (name.includes('Sejong') || name.includes('세종')) return '세종특별자치시';
    if (name.includes('Gyeonggi') || name.includes('경기')) return '경기도';
    if (name.includes('Gangwon') || name.includes('강원')) return '강원특별자치도';
    if (name.includes('Chungbuk') || name.includes('North Chungcheong') || name.includes('충청북도') || name.includes('충북')) return '충청북도';
    if (name.includes('Chungnam') || name.includes('South Chungcheong') || name.includes('충청남도') || name.includes('충남')) return '충청남도';
    if (name.includes('Jeonbuk') || name.includes('North Jeolla') || name.includes('전북') || name.includes('전라북도')) return '전북특별자치도';
    if (name.includes('Jeonnam') || name.includes('South Jeolla') || name.includes('전남') || name.includes('전라남도')) return '전라남도';
    if (name.includes('Gyeongbuk') || name.includes('North Gyeongsang') || name.includes('경북') || name.includes('경상북도')) return '경상북도';
    if (name.includes('Gyeongnam') || name.includes('South Gyeongsang') || name.includes('경남') || name.includes('경상남도')) return '경상남도';
    if (name.includes('Jeju') || name.includes('제주')) return '제주특별자치도';
    return name;
}

/**
 * Reverse Geocoding using OpenStreetMap Nominatim API
 */
export async function reverseGeocode(lat: number, lng: number): Promise<LocationResult | null> {
    try {
        // Using OpenStreetMap Nominatim (Free, requires User-Agent)
        const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
            params: {
                format: 'json',
                lat,
                lon: lng,
                zoom: 14, // City/District level
                'accept-language': 'ko' // Get results in Korean
            },
            headers: {
                'User-Agent': 'VoteMap/1.0'
            }
        });

        const address = response.data.address;

        // Extract meaningful region names
        // Nominatim returns various fields like city, borough, county, province which map differently depending on the region.

        let region1 = address.province || address.city || ''; // Do or Si
        let region2 = address.borough || address.district || address.county || ''; // Gu or Gun

        // Fix for "Province + City" pattern (e.g. Gyeonggi-do Paju-si)
        // If province is present, but region2 (district) is empty, check if 'city' exists and use it as region2
        if (address.province && !region2 && address.city && address.city !== address.province) {
            region2 = address.city;
        }

        // Special handling for Metropolitan cities (Seoul, Busan, etc.)
        // Nominatim often puts 'Seoul' in 'city' and 'Gangnam-gu' in 'borough'
        // Or 'Gyeonggi-do' in 'province' and 'Suwon-si' in 'city'

        if (!region1 && address.municipality) region1 = address.municipality;

        // Normalize
        region1 = normalizeRegion1(region1);

        // If region2 is empty, it might be a general area or we missed it.
        // Also cleanup: sometimes region2 might contain region1 name

        return {
            latitude: lat,
            longitude: lng,
            region1,
            region2: region2 || undefined,
            source: 'gps'
        };

    } catch (error) {
        console.error('Reverse Geocoding failed:', error);
        return null;
    }
}

/**
 * Get Location from IP using ipapi.co (fallback)
 */
export async function getIpLocation(): Promise<LocationResult | null> {
    try {
        const response = await axios.get('https://ipapi.co/json/');
        const data = response.data;

        // ipapi.co returns region similar to 'Gyeonggi-do', 'Seoul', etc.
        const region1 = normalizeRegion1(data.region);

        // It provides 'city' which corresponds to Si/Gun/Gu usually
        const region2 = data.city;

        return {
            latitude: data.latitude,
            longitude: data.longitude,
            region1,
            region2,
            source: 'ip'
        };
    } catch (error) {
        console.error('IP Geolocation failed:', error);
        return null;
    }
}
