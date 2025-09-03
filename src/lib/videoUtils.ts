// Video validation utility
export const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  
  // Check file extension
  const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv', '.m4v'];
  const hasVideoExtension = videoExtensions.some(ext => url.toLowerCase().includes(ext));
  
  // Check URL patterns for video hosting (especially Supabase)
  const videoPatterns = [
    'supabase.co/storage/v1/object/public/files/videos/',
    '/videos/',
    'video',
    '.mp4',
    'v.mp4'
  ];
  const hasVideoPattern = videoPatterns.some(pattern => url.toLowerCase().includes(pattern));
  
  // Special handling for Supabase video URLs
  const isSupabaseVideo = url.includes('supabase.co') && url.includes('/videos/');
  
  // Special handling for Azure Blob Storage videos 
  // Check if it's actually a video by looking for video indicators in filename
  const isAzureBlobVideo = url.includes('vizzystorage.blob.core.windows.net') && 
    (url.toLowerCase().includes('ugc-') || // UGC prefix typically indicates video
     url.toLowerCase().includes('video') || 
     videoExtensions.some(ext => url.toLowerCase().includes(ext))) &&
    // Exclude obvious image patterns
    !url.toLowerCase().includes('linkedin') &&
    !url.toLowerCase().includes('image') &&
    !url.toLowerCase().includes('photo') &&
    !url.toLowerCase().includes('picture');
  
  return hasVideoExtension || hasVideoPattern || isSupabaseVideo || isAzureBlobVideo;
};

export const getVideoMimeType = (url: string): string => {
  // For Supabase videos, always assume mp4
  if (url.includes('supabase.co') && url.includes('/videos/')) {
    return 'video/mp4';
  }
  
  // For Azure Blob Storage videos, check if it's actually a video first
  if (url.includes('vizzystorage.blob.core.windows.net') && 
      (url.toLowerCase().includes('ugc-') || 
       url.toLowerCase().includes('video') ||
       ['.mp4', '.mov', '.avi', '.webm', '.mkv', '.flv', '.m4v'].some(ext => url.toLowerCase().includes(ext))) &&
      !url.toLowerCase().includes('linkedin') &&
      !url.toLowerCase().includes('image') &&
      !url.toLowerCase().includes('photo') &&
      !url.toLowerCase().includes('picture')) {
    return 'video/mp4';
  }
  
  const extension = url.toLowerCase().split('.').pop();
  switch (extension) {
    case 'mp4':
      return 'video/mp4';
    case 'mov':
      return 'video/quicktime';
    case 'avi':
      return 'video/x-msvideo';
    case 'webm':
      return 'video/webm';
    case 'mkv':
      return 'video/x-matroska';
    default:
      return 'video/mp4'; // Default to mp4
  }
};

export const getSupabaseVideoHeaders = () => {
  return {
    'Accept': 'video/mp4,video/*,*/*;q=0.9',
    'Range': 'bytes=0-',
  };
};

export const getAzureBlobVideoHeaders = () => {
  return {
    'Accept': 'video/mp4,video/*,*/*;q=0.9',
    'Range': 'bytes=0-',
  };
};
