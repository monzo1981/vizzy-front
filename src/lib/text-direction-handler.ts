// lib/text-direction-handler.ts
import React from 'react';

// تحديث response-normalizer عشان يحسن تنسيق النص المختلط
export class ResponseTextCleaner {
  /**
   * تنظيف النصوص المختلطة من N8N
   */
  static cleanMixedText(text: string): string {
    if (!text) return text;
    
    // إزالة مسافات زيادة وأسطر فارغة
    let cleaned = text.replace(/\n\s*\n/g, '\n').trim();
    
    // تحسين التنسيق للنص المختلط
    // إضافة مسافة قبل الأسماء الإنجليزية في النص العربي
    cleaned = cleaned.replace(/([أ-ي])([A-Za-z])/g, '$1 $2');
    cleaned = cleaned.replace(/([A-Za-z])([أ-ي])/g, '$1 $2');
    
    // تصحيح مسائل علامات الترقيم
    cleaned = cleaned.replace(/\s+([.!؟،])/g, '$1');
    cleaned = cleaned.replace(/([.!؟،])([أ-يA-Za-z])/g, '$1 $2');
    
    return cleaned;
  }
  
  /**
   * تحسين النص للعرض
   */
  static improveDisplayText(text: string): string {
    if (!text) return text;
    
    let improved = this.cleanMixedText(text);
    
    // تحسين التحية
    improved = improved.replace(/اسمك\s+([A-Za-z\s]+)!/g, 'اسمك $1!');
    
    return improved;
  }
}

interface TextSegment {
  text: string;
  isArabic: boolean;
  isEnglish: boolean;
}

export class TextDirectionHandler {
  private static readonly ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  private static readonly ENGLISH_REGEX = /[a-zA-Z]/;

  /**
   * تحليل النص وتحديد اتجاه كل جزء
   */
  static analyzeText(text: string): TextSegment[] {
    if (!text) return [];

    const segments: TextSegment[] = [];
    const words = text.split(/(\s+)/); // Keep whitespace

    let currentSegment = '';
    let currentIsArabic = false;
    let currentIsEnglish = false;

    for (const word of words) {
      if (!word.trim()) {
        currentSegment += word;
        continue;
      }

      const isArabic = this.containsArabic(word);
      const isEnglish = this.containsEnglish(word);

      // إذا تغير نوع الكتابة، ابدأ segment جديد
      if (currentSegment && (isArabic !== currentIsArabic || isEnglish !== currentIsEnglish)) {
        segments.push({
          text: currentSegment,
          isArabic: currentIsArabic,
          isEnglish: currentIsEnglish
        });
        currentSegment = word;
        currentIsArabic = isArabic;
        currentIsEnglish = isEnglish;
      } else {
        currentSegment += word;
        currentIsArabic = currentIsArabic || isArabic;
        currentIsEnglish = currentIsEnglish || isEnglish;
      }
    }

    if (currentSegment) {
      segments.push({
        text: currentSegment,
        isArabic: currentIsArabic,
        isEnglish: currentIsEnglish
      });
    }

    return segments;
  }

  /**
   * إنشاء JSX elements مع التوجيه الصحيح
   */
  static renderMixedText(text: string): React.ReactElement {
    const segments = this.analyzeText(text);
    
    if (segments.length <= 1) {
      // نص بلغة واحدة فقط
      const direction = this.detectMainDirection(text);
      return React.createElement('span', {
        dir: direction,
        style: { textAlign: direction === 'rtl' ? 'right' : 'left' }
      }, text);
    }

    // نص مختلط
    return React.createElement('span', {
      dir: 'auto',
      style: { textAlign: 'start' }
    }, segments.map((segment, index) => 
      React.createElement('span', {
        key: index,
        dir: segment.isArabic ? 'rtl' : 'ltr',
        style: {
          display: 'inline',
          textAlign: segment.isArabic ? 'right' : 'left',
          unicodeBidi: 'isolate'
        }
      }, segment.text)
    ));
  }

  /**
   * إنشاء HTML string مع التوجيه الصحيح
   */
  static formatMixedTextHTML(text: string): string {
    const segments = this.analyzeText(text);
    
    if (segments.length <= 1) {
      const direction = this.detectMainDirection(text);
      return `<span dir="${direction}" style="text-align: ${direction === 'rtl' ? 'right' : 'left'}">${text}</span>`;
    }

    const segmentHTML = segments.map(segment => 
      `<span dir="${segment.isArabic ? 'rtl' : 'ltr'}" style="display: inline; text-align: ${segment.isArabic ? 'right' : 'left'}; unicode-bidi: isolate;">${segment.text}</span>`
    ).join('');

    return `<span dir="auto" style="text-align: start;">${segmentHTML}</span>`;
  }

  /**
   * تطبيق CSS classes للتوجيه
   */
  static getTextDirectionClasses(text: string): string {
    if (!text) return '';

    const hasArabic = this.containsArabic(text);
    const hasEnglish = this.containsEnglish(text);

    if (hasArabic && hasEnglish) {
      return 'mixed-text rtl-base';
    } else if (hasArabic) {
      return 'arabic-text rtl';
    } else {
      return 'english-text ltr';
    }
  }

  private static containsArabic(text: string): boolean {
    return this.ARABIC_REGEX.test(text);
  }

  private static containsEnglish(text: string): boolean {
    return this.ENGLISH_REGEX.test(text);
  }

  private static detectMainDirection(text: string): 'rtl' | 'ltr' {
    const arabicChars = (text.match(this.ARABIC_REGEX) || []).length;
    const englishChars = (text.match(this.ENGLISH_REGEX) || []).length;
    
    return arabicChars > englishChars ? 'rtl' : 'ltr';
  }
}

// CSS classes to add to your global styles
export const TEXT_DIRECTION_CSS = `
.mixed-text {
  direction: rtl;
  text-align: start;
  unicode-bidi: plaintext;
}

.mixed-text .english-word {
  direction: ltr;
  display: inline-block;
  unicode-bidi: isolate;
}

.arabic-text {
  direction: rtl;
  text-align: right;
}

.english-text {
  direction: ltr;
  text-align: left;
}

.rtl-base {
  direction: rtl;
  text-align: start;
}

.ltr-base {
  direction: ltr;
  text-align: start;
}
`;