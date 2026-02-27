'use client';

import { useState, useEffect } from 'react';

type WeatherImageResponse = {
  imageUrl?: string;
  city?: string;
};

export default function Home() {
  const [city, setCity] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 直接获取天气卡片图片
    const fetchWeatherImage = async () => {
      try {
        const response = await fetch('/api/image');
        if (!response.ok) {
          throw new Error('Failed to fetch weather image');
        }
        const data = (await response.json()) as WeatherImageResponse;
        if (!data.imageUrl) {
          throw new Error('Image URL missing in response');
        }
        setImageUrl(data.imageUrl);
        if (data.city) {
          setCity(data.city);
        }
      } catch (error) {
        console.error('Error fetching weather image:', error);
        setError('无法获取天气卡片图片');
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherImage();
  }, []);

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
