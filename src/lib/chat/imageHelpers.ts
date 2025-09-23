// Image helper functions extracted from chat page
// Provides reusable image handling functionality with proper TypeScript types

// Type definitions
export interface ToastFunction {
  success: (message: string) => void;
  error: (message: string) => void;
}

export interface ImageUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export interface ImageSelectHandlers {
  setSelectedImage: (url: string | null) => void;
  setIsImageUploading: (loading: boolean) => void;
  toast: ToastFunction;
}

export interface ImageUploadConfig {
  token: string;
  apiBaseUrl: string;
}

// Function to download an image from URL or base64 data
export const downloadImage = async (imageUrl: string, fileName?: string): Promise<void> => {
  try {
    let blob: Blob
    let finalUrl: string
    
    // Check if it's a base64 image
    if (imageUrl.startsWith('data:')) {
      // Convert base64 to blob directly
      const response = await fetch(imageUrl)
      blob = await response.blob()
    } else {
      // For external URLs (like Azure blob storage), use the image proxy
      if (imageUrl.includes('blob.core.windows.net') || imageUrl.includes('http')) {
        // Use the image proxy to bypass CORS
        finalUrl = `/api/image-proxy?imageUrl=${encodeURIComponent(imageUrl)}`
      } else {
        finalUrl = imageUrl
      }
      
      // Fetch through proxy or directly
      const response = await fetch(finalUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`)
      }
      blob = await response.blob()
    }
    
    // Create a temporary URL for the blob
    const url = window.URL.createObjectURL(blob)
    
    // Create a temporary anchor element and trigger download
    const link = document.createElement('a')
    link.href = url
    link.download = fileName || `vizzy-image-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    
    // Clean up
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading image:', error)
    // Fallback: try to open in new tab if download fails
    try {
      window.open(imageUrl, '_blank')
    } catch (fallbackError) {
      console.error('Fallback failed too:', fallbackError)
    }
  }
}

// Function to download video from URL
export const downloadVideo = async (videoUrl: string, fileName?: string): Promise<void> => {
  try {
    let finalUrl: string
    
    // For external URLs (like Azure blob storage), use the video proxy
    if (videoUrl.includes('blob.core.windows.net') || videoUrl.includes('http')) {
      // Use the video proxy to bypass CORS
      finalUrl = `/api/video-proxy?videoUrl=${encodeURIComponent(videoUrl)}`
    } else {
      finalUrl = videoUrl
    }
    
    // Fetch through proxy or directly
    const response = await fetch(finalUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status}`)
    }
    const blob = await response.blob()
    
    // Create a temporary URL for the blob
    const url = window.URL.createObjectURL(blob)
    
    // Determine file extension from the blob type or use default
    let fileExtension = 'mp4' // default
    if (blob.type.includes('webm')) {
      fileExtension = 'webm'
    } else if (blob.type.includes('mov')) {
      fileExtension = 'mov'
    } else if (blob.type.includes('avi')) {
      fileExtension = 'avi'
    }
    
    // Create a temporary anchor element and trigger download
    const link = document.createElement('a')
    link.href = url
    link.download = fileName || `vizzy-video-${Date.now()}.mp4` // Always use provided fileName or default with .mp4
    document.body.appendChild(link)
    link.click()
    
    // Clean up
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading video:', error)
    // Fallback: try to open in new tab if download fails
    try {
      window.open(videoUrl, '_blank')
    } catch (fallbackError) {
      console.error('Fallback failed too:', fallbackError)
    }
  }
}

// Function to download media (image or video) based on URL
export const downloadMedia = async (mediaUrl: string, fileName?: string): Promise<void> => {
  // Check if it's a video URL
  const isVideo = isVideoUrl(mediaUrl)
  
  if (isVideo) {
    // For videos, determine extension from URL or use mp4 as default
    let videoExtension = 'mp4'
    if (mediaUrl.includes('.webm')) videoExtension = 'webm'
    else if (mediaUrl.includes('.mov')) videoExtension = 'mov'
    else if (mediaUrl.includes('.avi')) videoExtension = 'avi'
    
    const videoFileName = fileName || `vizzy-video-${Date.now()}.${videoExtension}`
    await downloadVideo(mediaUrl, videoFileName)
  } else {
    // For images, use png as default
    const imageFileName = fileName || `vizzy-image-${Date.now()}.png`
    await downloadImage(mediaUrl, imageFileName)
  }
}

// Function to check if a URL is a video
export const isVideoUrl = (url: string | undefined): boolean => {
  if (!url) return false
  
  // Check for video file extensions
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.wmv']
  const lowerUrl = url.toLowerCase()
  
  for (const ext of videoExtensions) {
    if (lowerUrl.includes(ext)) {
      return true
    }
  }
  
  // Check for video MIME types in data URLs
  if (url.startsWith('data:video')) {
    return true
  }
  
  // Check for video proxy URLs
  if (url.includes('/api/video-proxy')) {
    return true
  }
  
  return false
}

// Function to check if a URL is a base64 image
export const isBase64Image = (url: string | undefined): boolean => {
  if (!url) return false
  return url.startsWith('data:image')
}

// Function to compress and convert image to PNG format
export const compressAndConvertImage = async (
  file: File, 
  options: ImageUploadOptions = {}
): Promise<File> => {
  const { 
    maxWidth = 1920, 
    maxHeight = 1080, 
    quality = 0.85 
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = document.createElement('img');
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        // Resize image if it's larger than maximum allowed
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        // Create canvas for drawing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Improve drawing quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert canvas to blob in PNG format
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to convert image'));
              return;
            }
            
            // Create new File object in PNG format
            const compressedFile = new File(
              [blob], 
              file.name.replace(/\.[^/.]+$/, '.png'), // Change file extension to .png
              { 
                type: 'image/png',
                lastModified: Date.now()
              }
            );
            
            console.log('Original size:', (file.size / 1024).toFixed(2), 'KB');
            console.log('Compressed size:', (compressedFile.size / 1024).toFixed(2), 'KB');
            console.log('Compression ratio:', ((1 - compressedFile.size / file.size) * 100).toFixed(1), '%');
            
            resolve(compressedFile);
          },
          'image/png',
          quality // Compression quality (0.85 = 85% quality)
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};

// Function to upload image to server
export const handleImageUpload = async (
  file: File, 
  config: ImageUploadConfig
): Promise<string | null> => {
  const { token, apiBaseUrl } = config;
  
  if (!token) {
    console.error('No auth token provided');
    return null;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${apiBaseUrl}/upload/image/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to upload image:', response.status, errorData);
      return null;
    }

    const data = await response.json();
    return data.public_url;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};

// Function to handle image selection and processing
export const handleImageSelect = async (
  e: React.ChangeEvent<HTMLInputElement>,
  handlers: ImageSelectHandlers,
  config: ImageUploadConfig,
  options: ImageUploadOptions = {}
): Promise<void> => {
  const { setSelectedImage, setIsImageUploading, toast } = handlers;
  const file = e.target.files?.[0];
  
  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }
    
    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    // Start loading animation
    setIsImageUploading(true);

    try {
      // Compress and convert image to PNG
      console.log('Converting and compressing image...');
      const compressedFile = await compressAndConvertImage(file, {
        maxWidth: options.maxWidth || 1920,  // Maximum width
        maxHeight: options.maxHeight || 1080,  // Maximum height
        quality: options.quality || 0.85   // Quality (85%)
      });
      
      // Upload compressed image
      const publicUrl = await handleImageUpload(compressedFile, config);

      if (publicUrl) {
        setSelectedImage(publicUrl);
        toast.success("Image uploaded successfully!");
      } else {
        toast.error("Failed to upload image. Please try again.");
      }
    } catch (error) {
      console.error('Error processing image:', error);
      toast.error("Failed to process image. Please try again.");
    } finally {
      // Stop loading animation
      setIsImageUploading(false);
    }
  }

  // Reset input value
  if (e.target) {
    e.target.value = "";
  }
};