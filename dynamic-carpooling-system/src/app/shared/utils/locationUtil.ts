import { Location } from "../../core/models/auth-model";

export function trimLocation(location: string): string {
    if (!location) {
        return '';
    }

    const parts = location.split(',');
    return parts.slice(0, 4).join(',').trim();
}

async function fetchLocation(location: Location) {
    const result = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${location.latitude}&lon=${location.longitude}&format=json`,
        {
            headers: { 'Accept-Language': 'en' }
        }
    );

    return result;
}

export async function reverseGeocode(location: Location) {
    try {
        const result = await fetchLocation(location);
        const data = await result.json();
        const address = trimLocation(data.display_name);

        return address;
    }
    catch (error) {
        return 'Unknown location';
    }
}

export async function getAddressDetails(location: Location): Promise<{ city: string; state: string; displayName: string }> {
    try {
        const result = await fetchLocation(location);
        const data = await result.json();
        const address = data.address;

        return {
            city: address?.state_district ?? address?.city ?? address?.village ?? address?.country ?? '',
            state: address?.state ?? '',
            displayName: trimLocation(data.display_name),
        };
    }
    catch (error) {
        return { 
            city: '', 
            state: '', 
            displayName: 'Unknown location' 
        };
    }
}