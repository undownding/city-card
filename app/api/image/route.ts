import { NextRequest } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

function formatDatePath(date: Date) {
  const isoDate = date.toISOString().slice(0, 10); // yyyy-mm-dd
  const [yearMonth, day] = [isoDate.slice(0, 7), isoDate.slice(8, 10)];
  return { yearMonth, day };
}

function slugifyCity(city: string) {
  const trimmed = city.trim();

  // Prefer readable letters/numbers across scripts; collapse other chars to dashes
  const compact = trimmed
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
    .toLowerCase();

  if (compact) return compact;

  // Deterministic ASCII fallback so we never save as unknown-city
  const hex = Array.from(trimmed)
    .map((ch) => ch.codePointAt(0)?.toString(16).padStart(4, '0'))
    .join('');

  return hex ? `u-${hex}` : 'unknown-city';
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const city = searchParams.get('city')?.trim();

  if (!city) {
    return new Response(JSON.stringify({ error: 'City parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const { env } = await getCloudflareContext({ async: true });
    const ai = env['ai-gallery'];
    const cardsBucket = env.WEATHER_CARDS_R2_BUCKET;

    if (!ai) {
      throw new Error('AI instance not available');
    }

    if (!cardsBucket) {
      throw new Error('WEATHER_CARDS_R2_BUCKET is not available');
    }

    const citySlug = slugifyCity(city);
    const { yearMonth, day } = formatDatePath(new Date());
    const objectKey = `${yearMonth}/${day}/${citySlug}.webp`;
    const encodedKey = objectKey.split('/').map(encodeURIComponent).join('/');
    const imageUrl = `https://card-r2.undownding.dev/${encodedKey}`;

    const existingObject = await cardsBucket.head(objectKey);
    if (existingObject) {
      return new Response(JSON.stringify({ imageUrl }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const gateway = ai.gateway('ai-gallery');
    const endpoint = 'v1beta/models/gemini-3.1-flash-image-preview:generateContent';

    const requestBody = {
      tools: [{ googleSearch: {} }],
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `
              You have access to Google Search. Search for today's real-time weather in "${city}", then generate a weather card image.

Image style:
Present a clear, 45° top-down view of a vertical (9:16) isometric miniature 3D scene, highlighting iconic landmarks centered in the composition to showcase precise and delicate modeling.
The scene features soft, refined textures with realistic PBR materials and gentle, lifelike lighting and shadow effects.
Weather elements are creatively integrated into the urban architecture, establishing a dynamic interaction between the city's landscape and atmospheric conditions, creating an immersive but restrained weather ambiance.
Use a clean, unified composition with minimalistic aesthetics and a soft, solid-colored background that highlights the main content.
The overall visual style should feel modern, calm, and semi-realistic, avoiding exaggerated cartoon proportions or playful styling.

Text header layout:
Text and weather information should be placed near the top center of the canvas, forming a clearly separated, well-balanced header area with sufficient vertical spacing from the 3D city scene below to prevent visual overlap.
The header is divided horizontally into two parts:
- Left part: a weather emoji. Slightly larger than a single text line, its total height matches the full height of the three-line text group on the right. Prominent but not overpowering.
- Right part: a vertically stacked three-line text group:
  - Top line: city name (largest text size).
  - Middle line: daily temperature range (medium text size, lowest to highest, in ℃).
  - Bottom line: date (smallest text size).
A very subtle, extremely light and thin vertical divider line may be placed between the emoji and the text group, serving only as a gentle visual separator.
Maintain comfortable horizontal spacing between the emoji, divider, and text group. The entire header block should appear centered, aligned, and floating cleanly above the scene, with no background panel.
All text must be in the city's native language.

After generating the image, output ONLY the following JSON as text (no markdown fences, no extra text):
{"city_slug":"<lowercase-romanized-no-spaces>","resolved_name":"<city name on card>","condition":"<weather in native lang>","icon":"<emoji>","temp_min":<int>,"temp_max":<int>,"current_temp":<int>}

city_slug examples: 杭州→hangzhou, 东京→tokyo, 巴黎→paris, New York→newyork, São Paulo→saopaulo
              `
            }
          ]
        }
      ],
      generationConfig: {
        responseModalities: ['IMAGE'],
        thinkingConfig: {
          includeThoughts: false
        },
        imageConfig: {
          aspectRatio: '1:1',
          imageSize: '2k'
        }
      }
    };

    const response = await gateway.run({
      provider: 'google-ai-studio',
      endpoint,
      headers: {
        'Content-Type': 'application/json'
      },
      query: requestBody
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway Error:', errorText);
      throw new Error(`AI Gateway request failed: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();

    // 处理响应
    const candidate = data.candidates?.[0];
    if (!candidate?.content?.parts) {
      throw new Error('No content generated');
    }

    // 查找图片部分
    const imagePart = candidate.content.parts.find((part: any) => part.inlineData);
    if (!imagePart?.inlineData) {
      throw new Error('No image generated');
    }

    if (!imagePart.inlineData.data) {
      throw new Error('Generated image has no binary data');
    }

    const imageBytes = Uint8Array.from(atob(imagePart.inlineData.data), (char) => char.charCodeAt(0));
    await cardsBucket.put(objectKey, imageBytes, {
      httpMetadata: {
        contentType: imagePart.inlineData.mimeType || 'image/webp'
      }
    });

    return new Response(JSON.stringify({ imageUrl }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate image' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
