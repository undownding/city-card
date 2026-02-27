import { NextRequest } from 'next/server';

type ReverseGeocodeResponse = {
    address?: Record<string, unknown>;
};

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const latitude = searchParams.get('lat');
    const longitude = searchParams.get('lon');

    if (!latitude || !longitude) {
        return new Response(JSON.stringify({ error: 'lat and lon parameters are required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
        });
    }

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
        latitude
    )}&lon=${encodeURIComponent(longitude)}&zoom=10&addressdetails=1`;

    try {
        const response = await fetch(url, {
            headers: {
                Accept: 'application/json',
                'User-Agent': 'city-card/1.0 (contact: support@city-card.local)'
            }
        });

        if (!response.ok) {
            return new Response(JSON.stringify({ error: 'Failed to fetch location data' }), {
                status: 502,
                headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
            });
        }

        const data = (await response.json()) as ReverseGeocodeResponse;
        return new Response(JSON.stringify({ address: data.address ?? null }), {
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
        });
    } catch (error) {
        console.error('Error proxying reverse geocode:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch location data' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
        });
    }
}
