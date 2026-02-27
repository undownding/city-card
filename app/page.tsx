'use client';

import { useState, useEffect } from 'react';

type ReverseGeocodeResponse = {
  address?: {
    city?: string;
    town?: string;
    village?: string;
  };
};

type WeatherImageResponse = {
  imageUrl?: string;
};

export default function Home() {
  const [city, setCity] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 获取当前位置
    const getCurrentLocation = () => {
      if (!navigator.geolocation) {
        setError('您的浏览器不支持地理定位');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // 通过坐标获取城市名称
            const cityName = await getCityFromCoordinates(
              position.coords.latitude,
              position.coords.longitude
            );
            setCity(cityName);

            // 获取天气卡片图片
            await fetchWeatherImage(cityName);
          } catch (err) {
            setError('无法获取城市信息');
            console.error(err);
          } finally {
            setLoading(false);
          }
        },
        (geoError) => {
          let errorMessage = '获取位置失败';
          switch (geoError.code) {
            case geoError.PERMISSION_DENIED:
              errorMessage = '您拒绝了位置请求';
              break;
            case geoError.POSITION_UNAVAILABLE:
              errorMessage = '位置信息不可用';
              break;
            case geoError.TIMEOUT:
              errorMessage = '位置请求超时';
              break;
          }
          setError(errorMessage);
          setLoading(false);
        }
      );
    };

    getCurrentLocation();
  }, []);

  // 通过坐标获取城市名称
  const getCityFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch location data');
      }
      const data = (await response.json()) as ReverseGeocodeResponse;
      return data.address?.city || data.address?.town || data.address?.village || 'Unknown';
    } catch (error) {
      console.error('Error getting city from coordinates:', error);
      throw error;
    }
  };

  // 获取天气卡片图片
  const fetchWeatherImage = async (cityName: string) => {
    try {
      const response = await fetch(`/api/image?city=${encodeURIComponent(cityName)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch weather image');
      }
      const data = (await response.json()) as WeatherImageResponse;
      if (!data.imageUrl) {
        throw new Error('Image URL missing in response');
      }
      setImageUrl(data.imageUrl);
    } catch (error) {
      console.error('Error fetching weather image:', error);
      setError('无法获取天气卡片图片');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          {city ? `${city} 天气卡片` : '获取城市天气卡片'}
        </h1>

        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600">正在获取位置和天气信息...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              重试
            </button>
          </div>
        )}

        {!loading && !error && imageUrl && (
          <div className="flex justify-center">
            <img
              src={imageUrl}
              alt={`${city} 天气卡片`}
              className="rounded-lg shadow-lg max-w-full h-auto"
              style={{ maxHeight: '80vh' }}
            />
          </div>
        )}
      </div>
    </main>
  );
}
