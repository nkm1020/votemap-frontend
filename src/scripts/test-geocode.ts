
import { reverseGeocode } from '../app/lib/geocoding';

async function test() {
    console.log('Testing Paju Coordinates (37.76, 126.78)...');
    try {
        const result = await reverseGeocode(37.76, 126.78);
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error(e);
    }
}

test();
