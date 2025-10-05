// Image helper functions with multi-image support

export interface ToastFunction {
  success: (message: string) => void;
  error: (message: string) => void;
}

export interface ImageUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export interface MultiImageSelectHandlers {
  selectedImages: string[];
  setSelectedImages: (urls: string[] | ((prev: string[]) => string[])) => void;
  setIsImageUploading: (loading: boolean) => void;
  setUploadingCount: (count: number | ((prev: number) => number)) => void; // NEW
  toast: ToastFunction;
  maxImages?: number;
}

export interface ImageUploadConfig {
  token: string;
  apiBaseUrl: string;
}

// Existing single image handlers for backward compatibility
export interface ImageSelectHandlers {
  setSelectedImage: (url: string | null) => void;
  setIsImageUploading: (loading: boolean) => void;
  toast: ToastFunction;
}

// Download functions (unchanged)
export const downloadImage = async (imageUrl: string, fileName?: string): Promise<void> => {
  try {
    let blob: Blob
    let finalUrl: string
    
    if (imageUrl.startsWith('data:')) {
      const response = await fetch(imageUrl)
      blob = await response.blob()
    } else {
      if (imageUrl.includes('blob.core.windows.net') || imageUrl.includes('http')) {
        finalUrl = `/api/image-proxy?imageUrl=${encodeURIComponent(imageUrl)}`
      } else {
        finalUrl = imageUrl
      }
      
      const response = await fetch(finalUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`)
      }
      blob = await response.blob()
    }
    
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName || `vizzy-image-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading image:', error)
    try {
      window.open(imageUrl, '_blank')
    } catch (fallbackError) {
      console.error('Fallback failed too:', fallbackError)
    }
  }
}

export const downloadVideo = async (videoUrl: string, fileName?: string): Promise<void> => {
  try {
    let finalUrl: string
    
    if (videoUrl.includes('blob.core.windows.net') || videoUrl.includes('http')) {
      finalUrl = `/api/video-proxy?videoUrl=${encodeURIComponent(videoUrl)}`
    } else {
      finalUrl = videoUrl
    }
    
    const response = await fetch(finalUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status}`)
    }
    const blob = await response.blob()
    
    const url = window.URL.createObjectURL(blob)
    
    let fileExtension = 'mp4'
    if (blob.type.includes('webm')) {
      fileExtension = 'webm'
    } else if (blob.type.includes('mov')) {
      fileExtension = 'mov'
    } else if (blob.type.includes('avi')) {
      fileExtension = 'avi'
    }
    
    const link = document.createElement('a')
    link.href = url
    link.download = fileName || `vizzy-video-${Date.now()}.mp4`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading video:', error)
    try {
      window.open(videoUrl, '_blank')
    } catch (fallbackError) {
      console.error('Fallback failed too:', fallbackError)
    }
  }
}

export const downloadMedia = async (mediaUrl: string, fileName?: string): Promise<void> => {
  const isVideo = isVideoUrl(mediaUrl)
  
  if (isVideo) {
    let videoExtension = 'mp4'
    if (mediaUrl.includes('.webm')) videoExtension = 'webm'
    else if (mediaUrl.includes('.mov')) videoExtension = 'mov'
    else if (mediaUrl.includes('.avi')) videoExtension = 'avi'
    
    const videoFileName = fileName || `vizzy-video-${Date.now()}.${videoExtension}`
    await downloadVideo(mediaUrl, videoFileName)
  } else {
    const imageFileName = fileName || `vizzy-image-${Date.now()}.png`
    await downloadImage(mediaUrl, imageFileName)
  }
}

export const isVideoUrl = (url: string | undefined): boolean => {
  if (!url) return false
  
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.wmv']
  const lowerUrl = url.toLowerCase()
  
  for (const ext of videoExtensions) {
    if (lowerUrl.includes(ext)) {
      return true
    }
  }
  
  if (url.startsWith('data:video')) {
    return true
  }
  
  if (url.includes('/api/video-proxy')) {
    return true
  }
  
  return false
}

export const isBase64Image = (url: string | undefined): boolean => {
  if (!url) return false
  return url.startsWith('data:image')
}

// Compress and convert image
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
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to convert image'));
              return;
            }
            
            const compressedFile = new File(
              [blob], 
              file.name.replace(/\.[^/.]+$/, '.png'),
              { 
                type: 'image/png',
                lastModified: Date.now()
              }
            );
            
            console.log('Original size:', (file.size / 1024).toFixed(2), 'KB');
            console.log('Compressed size:', (compressedFile.size / 1024).toFixed(2), 'KB');
            
            resolve(compressedFile);
          },
          'image/png',
          quality
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

// Upload single image to server
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

// NEW: Handle multiple image selection and upload
export const handleMultiImageSelect = async (
  e: React.ChangeEvent<HTMLInputElement>,
  handlers: MultiImageSelectHandlers,
  config: ImageUploadConfig,
  options: ImageUploadOptions = {}
): Promise<void> => {
  const { selectedImages, setSelectedImages, setIsImageUploading, setUploadingCount, toast, maxImages = 3 } = handlers;
  const files = Array.from(e.target.files || []);
  
  if (files.length === 0) return;
  
  // Check total number of images
  const remainingSlots = maxImages - selectedImages.length;
  if (remainingSlots <= 0) {
    toast.error(`Maximum ${maxImages} images allowed`);
    return;
  }
  
  // Limit files to remaining slots
  const filesToProcess = files.slice(0, remainingSlots);
  
  if (files.length > remainingSlots) {
    toast.error(`Only ${remainingSlots} more image${remainingSlots > 1 ? 's' : ''} can be added`);
  }
  
  // Validate all files first
  for (const file of filesToProcess) {
    if (!file.type.startsWith('image/')) {
      toast.error("Please select only image files");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Each image must be less than 10MB");
      return;
    }
  }

  setIsImageUploading(true);
  setUploadingCount(filesToProcess.length); // NEW: Set uploading count

  try {
    const uploadPromises = filesToProcess.map(async (file) => {
      // Compress and convert each image
      const compressedFile = await compressAndConvertImage(file, {
        maxWidth: options.maxWidth || 1920,
        maxHeight: options.maxHeight || 1080,
        quality: options.quality || 0.85
      });
      
      // Upload compressed image
      const url = await handleImageUpload(compressedFile, config);
      
      return url;
    });
    
    // Wait for all uploads to complete before updating UI
    const uploadedUrls = await Promise.all(uploadPromises);
    
    // Filter out any failed uploads (null values)
    const successfulUrls = uploadedUrls.filter((url): url is string => url !== null);
    
    // Update images and uploading count together after all uploads complete
    if (successfulUrls.length > 0) {
      setSelectedImages(prev => [...prev, ...successfulUrls]);
      toast.success(`${successfulUrls.length} image${successfulUrls.length > 1 ? 's' : ''} uploaded successfully!`);
    }
    
    if (successfulUrls.length < filesToProcess.length) {
      toast.error("Some images failed to upload");
    }
  } catch (error) {
    console.error('Error processing images:', error);
    toast.error("Failed to process images. Please try again.");
  } finally {
    setIsImageUploading(false);
    setUploadingCount(0); // Reset uploading count after all uploads complete
  }

  // Reset input value
  if (e.target) {
    e.target.value = "";
  }
};

// Original single image handler (for backward compatibility)
export const handleImageSelect = async (
  e: React.ChangeEvent<HTMLInputElement>,
  handlers: ImageSelectHandlers,
  config: ImageUploadConfig,
  options: ImageUploadOptions = {}
): Promise<void> => {
  const { setSelectedImage, setIsImageUploading, toast } = handlers;
  const file = e.target.files?.[0];
  
  if (file) {
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    setIsImageUploading(true);

    try {
      const compressedFile = await compressAndConvertImage(file, {
        maxWidth: options.maxWidth || 1920,
        maxHeight: options.maxHeight || 1080,
        quality: options.quality || 0.85
      });
      
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
      setIsImageUploading(false);
    }
  }

  if (e.target) {
    e.target.value = "";
  }
};