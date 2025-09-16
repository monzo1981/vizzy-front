// lib/response-normalizer.ts - Fixed version with proper URL extraction including spaces

interface NormalizedResponse {
  text: string;
  mediaUrl?: string;
}

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

// Helper class لتحسين النصوص المختلطة
export class ResponseTextCleaner {
  /**
   * تنظيف النصوص المختلطة من N8N
   */
  static cleanMixedText(text: string): string {
    if (!text) return text;
    
    // إزالة مسافات زيادة وأسطر فارغة
    let cleaned = text.replace(/\n\s*\n/g, '\n').trim();
    
    // تحسين التنسيق للنص المختلط - إضافة مسافة بين العربي والإنجليزي
    cleaned = cleaned.replace(/([أ-ي])([A-Za-z])/g, '$1 $2');
    cleaned = cleaned.replace(/([A-Za-z])([أ-ي])/g, '$1 $2');
    
    // تصحيح مسائل علامات الترقيم
    cleaned = cleaned.replace(/\s+([.!؟،])/g, '$1');
    cleaned = cleaned.replace(/([.!؟،])([أ-يA-Za-z])/g, '$1 $2');
    
    return cleaned;
  }
  
  /**
   * تحسين النص للعرض مع تحسينات خاصة
   */
  static improveDisplayText(text: string): string {
    if (!text) return text;
    
    let improved = this.cleanMixedText(text);
    
    // تحسين التحية مع الأسماء الإنجليزية
    improved = improved.replace(/اسمك\s*([A-Za-z\s]+)!/g, 'اسمك $1!');
    improved = improved.replace(/اسمك\s*([A-Za-z\s]+)\s*!/g, 'اسمك $1!');
    
    // تحسين عبارات أخرى شائعة
    improved = improved.replace(/([أ-ي])\s+([A-Za-z])\s+([أ-ي])/g, '$1 $2 $3');
    
    return improved;
  }
}

export class ResponseNormalizer {
  private readonly jsonResponse: JsonValue;
  private static readonly TEXT_KEYWORDS = ["text", "content", "message", "output", "description", "result", "subtitle_text", "response"];
  private static readonly URL_KEYWORDS = ["url", "image_url", "video_url", "file_url", "visual", "media", "transformed_video_url", "image", "video"];
  private static readonly IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];
  private static readonly VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".mkv", ".webm"];
  private static readonly ALL_MEDIA_EXTENSIONS = [...ResponseNormalizer.IMAGE_EXTENSIONS, ...ResponseNormalizer.VIDEO_EXTENSIONS];

  constructor(jsonResponse: JsonValue) {
    this.jsonResponse = jsonResponse;
  }

  public normalize(): NormalizedResponse {
    // Better logging for debugging
    let logText = "";
    if (typeof this.jsonResponse === 'string') {
      logText = this.jsonResponse.substring(0, 300);
      // Log if we can see a URL in the raw text
      if (this.jsonResponse.includes('http')) {
        const urlMatch = this.jsonResponse.match(/(https?:\/\/\S+)/);
        if (urlMatch) {
          console.log("🔍 Raw URL found in response:", urlMatch[0]);
        }
      }
    } else {
      logText = JSON.stringify(this.jsonResponse, null, 2);
    }
    
    console.log("🔍 Starting normalization with response:", logText);
    
    // Handle null/undefined responses
    if (this.jsonResponse === null || this.jsonResponse === undefined) {
      console.warn("⚠️ Response is null or undefined");
      return { text: "Response received but content is empty", mediaUrl: undefined };
    }

    // Handle direct string responses
    if (typeof this.jsonResponse === 'string') {
      console.log("🔤 Direct string response detected");
      
      // Clean the string first to handle escaped characters
      const cleanedResponse = this.jsonResponse.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
      
      // Log the full text if it contains a URL for debugging
      if (cleanedResponse.includes('http')) {
        const urlIndex = cleanedResponse.indexOf('http');
        console.log("📍 URL found at index", urlIndex);
        console.log("📝 Text around URL:", cleanedResponse.substring(Math.max(0, urlIndex - 20), Math.min(cleanedResponse.length, urlIndex + 150)));
      }
      
      const [urlInText, remainingText] = this._extractUrlFromText(cleanedResponse, false); // Remove URL from text
      const cleanedText = ResponseTextCleaner.improveDisplayText(remainingText || cleanedResponse);
      
      const result = { 
        text: cleanedText, 
        mediaUrl: urlInText 
      };
      
      console.log("📦 Final normalized result:", {
        text: result.text.substring(0, 100) + "...",
        mediaUrl: result.mediaUrl
      });
      
      return result;
    }

    // Handle array responses (N8N often returns arrays)
    if (Array.isArray(this.jsonResponse)) {
      console.log("📚 Array response detected, processing first item");
      if (this.jsonResponse.length === 0) {
        return { text: "Empty response from service", mediaUrl: undefined };
      }
      
      // Process first item in array
      const firstItem = this.jsonResponse[0];
      if (typeof firstItem === 'string') {
        const cleanedItem = firstItem.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
        const [urlInText, remainingText] = this._extractUrlFromText(cleanedItem, false); // Remove URL from text
        const cleanedText = ResponseTextCleaner.improveDisplayText(remainingText || cleanedItem);
        return { text: cleanedText, mediaUrl: urlInText };
      } else if (typeof firstItem === 'object' && firstItem !== null) {
        return this._processObjectResponse(firstItem as { [key: string]: JsonValue });
      }
    }

    // Handle object responses
    if (typeof this.jsonResponse === 'object' && this.jsonResponse !== null) {
      console.log("📦 Object response detected");
      return this._processObjectResponse(this.jsonResponse as { [key: string]: JsonValue });
    }

    // Fallback for any other type
    console.warn("⚠️ Unknown response type, converting to string");
    const cleanedText = ResponseTextCleaner.improveDisplayText(String(this.jsonResponse));
    return { 
      text: cleanedText, 
      mediaUrl: undefined 
    };
  }

  private _processObjectResponse(obj: { [key: string]: JsonValue }): NormalizedResponse {
    let text: string | undefined;
    let mediaUrl: string | undefined;
    let isUrlFromSeparateField = false; // Track if URL came from separate field

    console.log("🔎 Processing object with keys:", Object.keys(obj));

    // First, try to find direct matches for media URLs in separate fields
    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      const value = obj[key];

      // Check for media URL in separate fields
      if (!mediaUrl && ResponseNormalizer.URL_KEYWORDS.some(k => lowerKey.includes(k))) {
        if (typeof value === 'string' && value.startsWith('http')) {
          mediaUrl = this._cleanAndEncodeUrl(value);
          isUrlFromSeparateField = true; // Mark as coming from separate field
          console.log(`✅ Found mediaUrl in separate field '${key}':`, mediaUrl);
        }
      }
    }

    // Then, find text content
    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      const value = obj[key];

      // Check for text content
      if (!text && ResponseNormalizer.TEXT_KEYWORDS.some(k => lowerKey.includes(k))) {
        if (typeof value === 'string') {
          text = value;
          console.log(`✅ Found text for key '${key}':`, text.substring(0, 100));
        } else if (value !== null && value !== undefined) {
          text = String(value);
          console.log(`✅ Converted non-string text for key '${key}'`);
        }
      }
    }

    // If no text found, try to extract from nested structure
    if (!text) {
      // Look for any string value in the object
      for (const value of Object.values(obj)) {
        if (typeof value === 'string' && value.length > 0 && !value.startsWith('http')) {
          text = value;
          console.log("✅ Found text from object value:", text.substring(0, 100));
          break;
        }
      }
    }

    // Check if text contains embedded URL (only if we don't have URL from separate field)
    if (text && !isUrlFromSeparateField) {
      const [urlInText, remainingText] = this._extractUrlFromText(text, false); // Remove URL from text
      if (urlInText) {
        mediaUrl = urlInText;
        text = remainingText; // Use the text with URL removed
        console.log("✅ Extracted embedded URL from text content, removed from text");
      }
    }

    // Clean up text with Arabic/English improvements
    if (text) {
      text = ResponseTextCleaner.improveDisplayText(this._cleanText(text, isUrlFromSeparateField));
    }

    // Provide fallback text if none found
    if (!text && !mediaUrl) {
      // Try to create meaningful text from the object
      if (obj.error) {
        text = String(obj.error);
      } else if (obj.status) {
        text = `Status: ${String(obj.status)}`;
      } else {
        text = "Content generated successfully";
      }
      console.log("ℹ️ Using fallback text:", text);
    } else if (!text && mediaUrl) {
      text = "Visual content generated";
    }

    const result = { text: text || "", mediaUrl };
    console.log("✨ Final normalized output:", result);
    return result;
  }

  /**
   * Extract URL from text with improved handling of URLs with spaces
   * @param text - The text to search for URLs
   * @param preserveInText - Whether to keep the URL in the returned text
   * @returns [extractedUrl, processedText]
   */
  private _extractUrlFromText(text: string, preserveInText: boolean = false): [string | undefined, string] {
    if (!text || typeof text !== 'string') {
      return [undefined, text || ""];
    }

    console.log("🔍 Starting URL extraction from text");

    // First, try to find URLs with known media extensions (more reliable)
    const extensionPattern = this._createExtensionPattern();
    const extensionMatches = text.match(extensionPattern);
    
    if (extensionMatches) {
      const fullMatch = extensionMatches[0];
      console.log("🎯 Found URL with media extension:", fullMatch);
      
      // Extract the complete URL including any spaces before the extension
      const urlStart = fullMatch.indexOf('http');
      if (urlStart !== -1) {
        let url = fullMatch.substring(urlStart);
        
        // Encode spaces and clean the URL
        url = this._cleanAndEncodeUrl(url);
        console.log("✅ Extracted and encoded URL:", url);
        
        if (preserveInText) {
          // Keep URL in text but encoded
          const encodedText = text.replace(fullMatch, fullMatch.substring(0, urlStart) + url);
          return [url, encodedText];
        } else {
          const remainingText = text.replace(fullMatch, "").trim();
          return [url, remainingText];
        }
      }
    }

    // Fallback: Try standard URL patterns (for URLs without spaces)
    const standardPatterns = [
      // Pattern that captures URLs with optional prefix
      /(?:(Design image URL|Image URL|Video link|URL):\s*\n*)?(https?:\/\/[^\s'"<>\n\r\)\]]+)/gi,
      // Fallback pattern for standalone URLs
      /(https?:\/\/[^\s'"<>\n\r\)\]]+)/gi
    ];

    for (const pattern of standardPatterns) {
      pattern.lastIndex = 0; // Reset regex state
      const matches = text.matchAll(pattern);
      
      for (const match of matches) {
        console.log("🎯 Standard regex match found:", match[0]);
        let url = match[2] || match[1] || match[0];
        console.log("🔗 Extracted URL candidate:", url);
        
        if (url && url.startsWith('http')) {
          // Clean and encode URL
          url = this._cleanAndEncodeUrl(url);
          
          // Validate URL is still valid after cleaning
          if (url && url.startsWith('http')) {
            console.log("✅ Valid URL extracted:", url);
            
            if (preserveInText) {
              // Replace original URL with encoded version in text
              const encodedText = text.replace(match[0], match[0].replace(match[2] || match[1] || match[0], url));
              return [url, encodedText];
            } else {
              const remainingText = text.replace(match[0], "").trim();
              return [url, remainingText];
            }
          }
        }
      }
    }

    console.log("⚠️ No valid URL found in text");
    return [undefined, text];
  }

  /**
   * Create a regex pattern to match URLs with media extensions (including spaces)
   */
  private _createExtensionPattern(): RegExp {
    const extensions = ResponseNormalizer.ALL_MEDIA_EXTENSIONS.join('|').replace(/\./g, '\\.');
    // This pattern captures:
    // 1. Optional prefix text
    // 2. The URL starting with http/https
    // 3. Any characters (including spaces) until we hit a media extension
    // 4. The media extension itself
    return new RegExp(
      `((?:Design image URL|Image URL|Video link|URL):\\s*\\n?)?(https?:\\/\\/[^\\n\\r]+(${extensions}))`,
      'gi'
    );
  }

  /**
   * Clean and encode URL properly, handling spaces and special characters
   */
  private _cleanAndEncodeUrl(url: string): string {
    if (!url) return url;
    
    console.log("🧹 Cleaning URL:", url);
    
    // First, handle escaped newlines by replacing them with actual newlines
    let cleanedUrl = url.replace(/\\n/g, '\n').replace(/\\r/g, '\r');
    
    // Split at actual newline characters to get only the URL part
    cleanedUrl = cleanedUrl.split('\n')[0];
    cleanedUrl = cleanedUrl.split('\r')[0];
    
    // Remove any text after the URL ends (look for common patterns)
    // But be careful to preserve the file extension
    const extensionMatch = cleanedUrl.match(/\.(jpg|jpeg|png|gif|webp|svg|mp4|mov|avi|mkv|webm)/i);
    if (extensionMatch) {
      const extensionIndex = cleanedUrl.lastIndexOf(extensionMatch[0]);
      const endIndex = extensionIndex + extensionMatch[0].length;
      cleanedUrl = cleanedUrl.substring(0, endIndex);
    }
    
    // Now encode spaces and other special characters
    // Split URL into parts to encode properly
    try {
      const urlParts = cleanedUrl.match(/^(https?:\/\/[^\/]+)(\/.*)?$/);
      if (urlParts) {
        const domain = urlParts[1];
        const path = urlParts[2] || '';
        
        // Encode spaces in the path part only
        const encodedPath = path
          .split('/')
          .map(segment => {
            // Encode spaces to %20
            return segment.replace(/ /g, '%20');
          })
          .join('/');
        
        cleanedUrl = domain + encodedPath;
      } else {
        // Fallback: just encode spaces
        cleanedUrl = cleanedUrl.replace(/ /g, '%20');
      }
    } catch (e) {
      console.error("Error encoding URL:", e);
      // Fallback: just encode spaces
      cleanedUrl = cleanedUrl.replace(/ /g, '%20');
    }
    
    // Remove any trailing punctuation that's definitely not part of URL
    cleanedUrl = cleanedUrl.replace(/[\)\]\}>,;!]+$/, '');
    
    // Remove any trailing backslashes
    cleanedUrl = cleanedUrl.replace(/\\+$/, '');
    
    // Final trim
    cleanedUrl = cleanedUrl.trim();
    
    console.log("✨ URL cleaned and encoded to:", cleanedUrl);
    
    return cleanedUrl;
  }

  private _cleanUrl(url: string): string {
    // Deprecated - use _cleanAndEncodeUrl instead
    return this._cleanAndEncodeUrl(url);
  }

  private _cleanText(text: string, hasUrlFromSeparateField: boolean = false): string {
    if (!text || typeof text !== 'string') return "";
    
    // Remove extra whitespace and newlines
    let cleaned = text.replace(/\n\s*\n/g, '\n').trim();
    
    // Only remove URL-related prefixes if URL came from separate field
    if (hasUrlFromSeparateField) {
      const prefixesToRemove = [
        'Design image URL:',
        'Image URL:',
        'Video link:',
        'URL:',
        'Response:',
        'Output:'
      ];
      
      for (const prefix of prefixesToRemove) {
        if (cleaned.startsWith(prefix) && cleaned.length === prefix.length) {
          cleaned = "";
          break;
        }
      }
    }
    
    return cleaned;
  }

  private _isMediaUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    
    const lowerUrl = url.toLowerCase();
    const extensions = [...ResponseNormalizer.IMAGE_EXTENSIONS, ...ResponseNormalizer.VIDEO_EXTENSIONS];
    
    // Check for file extensions
    if (extensions.some(ext => lowerUrl.includes(ext))) {
      return true;
    }
    
    // Check for known media services
    const mediaServices = ['cloudinary', 'supabase', 'imgur', 'youtube', 'vimeo', 'vizzystorage'];
    return mediaServices.some(service => lowerUrl.includes(service));
  }

  private _getMediaType(url: string): string | undefined {
    if (!url) return undefined;
    
    const lowerUrl = url.toLowerCase();
    
    if (ResponseNormalizer.IMAGE_EXTENSIONS.some(ext => lowerUrl.includes(ext))) {
      return "image";
    }
    if (ResponseNormalizer.VIDEO_EXTENSIONS.some(ext => lowerUrl.includes(ext))) {
      return "video";
    }
    
    // Check for known patterns
    if (lowerUrl.includes('youtube') || lowerUrl.includes('vimeo')) {
      return "video";
    }
    
    return undefined;
  }
}