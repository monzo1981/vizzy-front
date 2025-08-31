// lib/response-normalizer.ts - Updated with URL preservation logic

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

  constructor(jsonResponse: JsonValue) {
    this.jsonResponse = jsonResponse;
  }

  public normalize(): NormalizedResponse {
    console.log("🔍 Starting normalization with response:", JSON.stringify(this.jsonResponse, null, 2));
    
    // Handle null/undefined responses
    if (this.jsonResponse === null || this.jsonResponse === undefined) {
      console.warn("⚠️ Response is null or undefined");
      return { text: "Response received but content is empty", mediaUrl: undefined };
    }

    // Handle direct string responses
    if (typeof this.jsonResponse === 'string') {
      console.log("🔤 Direct string response detected");
      const [urlInText, remainingText] = this._extractUrlFromText(this.jsonResponse, true); // Keep URL in text
      const cleanedText = ResponseTextCleaner.improveDisplayText(remainingText || this.jsonResponse);
      return { 
        text: cleanedText, 
        mediaUrl: urlInText 
      };
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
        const [urlInText, remainingText] = this._extractUrlFromText(firstItem, true); // Keep URL in text
        const cleanedText = ResponseTextCleaner.improveDisplayText(remainingText || firstItem);
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
          mediaUrl = value;
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
      const [urlInText, remainingText] = this._extractUrlFromText(text, true); // Keep URL in text
      if (urlInText) {
        mediaUrl = urlInText;
        text = remainingText; // Use the text with URL preserved
        console.log("✅ Extracted embedded URL from text content, keeping in text");
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
   * Extract URL from text with option to preserve it in the text
   * @param text - The text to search for URLs
   * @param preserveInText - Whether to keep the URL in the returned text
   * @returns [extractedUrl, processedText]
   */
  private _extractUrlFromText(text: string, preserveInText: boolean = false): [string | undefined, string] {
    if (!text || typeof text !== 'string') {
      return [undefined, text || ""];
    }

    // Multiple patterns to match various URL formats
    const urlPatterns = [
      /(?:(Design image URL|Image URL|Video link|URL):\s*\n*)?(https?:\/\/[^\s'"<>\n\)\]]+)/gi,
      /(https?:\/\/[^\s'"<>\n\)\]]+)/gi
    ];

    for (const pattern of urlPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        let url = match[2] || match[1] || match[0];
        if (url && url.startsWith('http')) {
          // Clean URL by removing common trailing characters
          url = this._cleanUrl(url);
          console.log("🔗 URL extracted:", url);
          
          if (preserveInText) {
            // Keep URL in text, just clean up the original text
            const cleanedText = text.trim();
            return [url, cleanedText];
          } else {
            // Remove URL from text (original behavior)
            const remainingText = text.replace(match[0], "").trim();
            return [url, remainingText];
          }
        }
      }
    }

    return [undefined, text];
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
    const mediaServices = ['cloudinary', 'supabase', 'imgur', 'youtube', 'vimeo'];
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

  private _cleanUrl(url: string): string {
    if (!url) return url;
    
    // Remove common trailing characters that might accidentally get included
    const trailingCharsToRemove = /[)\]\}>\s.,;!]+$/;
    let cleanedUrl = url.replace(trailingCharsToRemove, '');
    
    // Also remove any markdown link syntax at the end
    cleanedUrl = cleanedUrl.replace(/\)$/, '');
    
    return cleanedUrl;
  }
}