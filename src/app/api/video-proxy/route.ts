// app/api/video-proxy/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const videoUrl = searchParams.get('videoUrl')

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      )
    }

    // Decode the URL
    const decodedUrl = decodeURIComponent(videoUrl)
    
    console.log('Proxying video from:', decodedUrl)

    // Get range header for video streaming
    const range = request.headers.get('range')
    
    // Fetch headers for video info
    const videoHeaders: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'video/mp4,video/*,*/*;q=0.9',
    }
    
    // Add range header if present (for video streaming)
    if (range) {
      videoHeaders['Range'] = range
    }

    // Fetch the video from the external URL
    const videoResponse = await fetch(decodedUrl, {
      headers: videoHeaders,
    })

    if (!videoResponse.ok) {
      console.error('Failed to fetch video:', videoResponse.status, videoResponse.statusText)
      return NextResponse.json(
        { error: `Failed to fetch video: ${videoResponse.status}` },
        { status: videoResponse.status }
      )
    }

    // Get content type
    const contentType = videoResponse.headers.get('content-type') || 'video/mp4'
    
    // Create response headers
    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length',
      'Accept-Ranges': 'bytes',
    }

    // Copy important headers from the source
    const contentLength = videoResponse.headers.get('content-length')
    if (contentLength) {
      responseHeaders['Content-Length'] = contentLength
    }

    const contentRange = videoResponse.headers.get('content-range')
    if (contentRange) {
      responseHeaders['Content-Range'] = contentRange
    }

    // Handle partial content (206) for video streaming
    const status = videoResponse.status === 206 ? 206 : 200
    
    // Stream the video data
    const videoData = await videoResponse.arrayBuffer()

    return new NextResponse(videoData, {
      status,
      headers: responseHeaders,
    })

  } catch (error) {
    console.error('Error proxying video:', error)
    return NextResponse.json(
      { error: 'Internal server error while proxying video' },
      { status: 500 }
    )
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Range, Content-Length',
    },
  })
}
