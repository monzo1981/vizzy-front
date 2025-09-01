// app/api/image-proxy/route.ts
import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory cache to prevent duplicate requests
const imageCache = new Map<string, { data: ArrayBuffer; contentType: string; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const imageUrl = searchParams.get('imageUrl')

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    // Decode the URL
    const decodedUrl = decodeURIComponent(imageUrl)
    
    // Check cache first
    const cacheKey = decodedUrl;
    const cached = imageCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      console.log('Serving from cache:', decodedUrl);
      return new NextResponse(cached.data, {
        status: 200,
        headers: {
          'Content-Type': cached.contentType,
          'Cache-Control': 'public, max-age=3600, immutable',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    console.log('Fetching fresh image from:', decodedUrl)

    // Fetch the image from the external URL with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const imageResponse = await fetch(decodedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'image/*,*/*',
        }
      });
      
      clearTimeout(timeoutId);

      if (!imageResponse.ok) {
        console.error('Failed to fetch image:', imageResponse.status, imageResponse.statusText);
        
        // Clear from cache if exists
        imageCache.delete(cacheKey);
        
        return NextResponse.json(
          { error: `Failed to fetch image: ${imageResponse.status}` },
          { status: imageResponse.status }
        );
      }

      // Get the image data as array buffer
      const imageBuffer = await imageResponse.arrayBuffer();
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';

      // Store in cache
      imageCache.set(cacheKey, {
        data: imageBuffer,
        contentType,
        timestamp: Date.now()
      });

      // Clean old cache entries
      if (imageCache.size > 100) {
        const now = Date.now();
        for (const [key, value] of imageCache.entries()) {
          if (now - value.timestamp > CACHE_DURATION) {
            imageCache.delete(key);
          }
        }
      }

      // Return the image with proper headers
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600, immutable',
          'Access-Control-Allow-Origin': '*',
          'X-Proxy-Cache': 'MISS',
        },
      });
      
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.error('Image fetch timeout');
        return NextResponse.json(
          { error: 'Image fetch timeout' },
          { status: 504 }
        );
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('Error in image proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}