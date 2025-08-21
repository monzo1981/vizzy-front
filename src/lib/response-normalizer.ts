// src/lib/response-normalizer.ts

interface NormalizedResponse {
  text: string;
  mediaUrl?: string;
}

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

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
      console.log("📝 Direct string response detected");
      const [urlInText, , remainingText] = this._extractUrlFromText(this.jsonResponse);
      return { 
        text: remainingText || this.jsonResponse, 
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
        return { text: firstItem, mediaUrl: undefined };
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
    return { 
      text: String(this.jsonResponse), 
      mediaUrl: undefined 
    };
  }

  private _processObjectResponse(obj: { [key: string]: JsonValue }): NormalizedResponse {
    let text: string | undefined;
    let mediaUrl: string | undefined;

    console.log("🔎 Processing object with keys:", Object.keys(obj));

    // First, try to find direct matches for text and media
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

      // Check for media URL
      if (!mediaUrl && ResponseNormalizer.URL_KEYWORDS.some(k => lowerKey.includes(k))) {
        if (typeof value === 'string' && value.startsWith('http')) {
          mediaUrl = value;
          console.log(`✅ Found mediaUrl for key '${key}':`, mediaUrl);
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

    // Check if text contains embedded URL
    if (text && !mediaUrl) {
      const [urlInText, , remainingText] = this._extractUrlFromText(text);
      if (urlInText) {
        mediaUrl = urlInText;
        text = remainingText.trim();
        console.log("✅ Extracted URL from text content");
      }
    }

    // Clean up text
    if (text) {
      text = this._cleanText(text);
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

  private _extractUrlFromText(text: string): [string | undefined, string | undefined, string] {
    if (!text || typeof text !== 'string') {
      return [undefined, undefined, text || ""];
    }

    // Multiple patterns to match various URL formats
    const urlPatterns = [
      /(?:(Design image URL|Image URL|Video link|URL):\s*\n*)?(https?:\/\/[^\s'"<>\n]+)/gi,
      /(https?:\/\/[^\s'"<>\n]+)/gi
    ];

    for (const pattern of urlPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const url = match[2] || match[1] || match[0];
        if (url && url.startsWith('http')) {
          console.log("🔗 URL extracted:", url);
          const mediaType = this._getMediaType(url);
          const remainingText = text.replace(match[0], "").trim();
          return [url, mediaType, remainingText];
        }
      }
    }

    return [undefined, undefined, text];
  }

  private _cleanText(text: string): string {
    if (!text || typeof text !== 'string') return "";
    
    // Remove extra whitespace and newlines
    let cleaned = text.replace(/\n\s*\n/g, '\n').trim();
    
    // Remove common prefixes if they're alone
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
}