import { type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const imageUrl = searchParams.get('imageUrl')

  if (!imageUrl) {
    return new Response('Image URL is required', { status: 400 })
  }

  try {
    // Fetch the image from the external URL
    const imageResponse = await fetch(imageUrl)

    if (!imageResponse.ok) {
      return new Response('Failed to fetch image', { status: imageResponse.status })
    }

    // Get the image data as a blob
    const imageBlob = await imageResponse.blob()
    const contentType = imageResponse.headers.get('content-type') || 'image/png';


    // Create a new response with the image data and correct headers
    const response = new Response(imageBlob, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })

    return response

  } catch (error) {
    console.error('Error fetching image:', error)
    return new Response('Error fetching image', { status: 500 })
  }
}
