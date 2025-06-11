// Free translation service using LibreTranslate (no API key required)
import { type Language } from './translations';

// Language code mapping for LibreTranslate
const languageCodeMap: Record<Language, string> = {
  en: 'en',
  fa: 'fa',
  zh: 'zh',
  tr: 'tr',
  de: 'de',
  es: 'es',
  fr: 'fr',
  ru: 'ru',
  ar: 'ar',
  ja: 'ja'
};

// Free LibreTranslate API endpoint
const LIBRE_TRANSLATE_API = 'https://libretranslate.de/translate';

interface TranslationRequest {
  q: string;
  source: string;
  target: string;
  format?: 'text' | 'html';
}

interface TranslationResponse {
  translatedText: string;
}

export class TranslationService {
  private cache: Map<string, string> = new Map();

  // Generate cache key
  private getCacheKey(text: string, from: Language, to: Language): string {
    return `${from}-${to}-${text.slice(0, 50)}`;
  }

  // Translate text using LibreTranslate
  async translateText(text: string, fromLang: Language, toLang: Language): Promise<string> {
    if (fromLang === toLang) return text;
    if (!text.trim()) return text;

    const cacheKey = this.getCacheKey(text, fromLang, toLang);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const requestData: TranslationRequest = {
        q: text,
        source: languageCodeMap[fromLang] || 'auto',
        target: languageCodeMap[toLang],
        format: 'text'
      };

      const response = await fetch(LIBRE_TRANSLATE_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`Translation failed: ${response.status}`);
      }

      const result: TranslationResponse = await response.json();
      const translatedText = result.translatedText;

      // Cache the result
      this.cache.set(cacheKey, translatedText);
      
      return translatedText;
    } catch (error) {
      console.warn('Translation failed, returning original text:', error);
      return text; // Fallback to original text
    }
  }

  // Translate multiple texts at once
  async translateBatch(texts: string[], fromLang: Language, toLang: Language): Promise<string[]> {
    const promises = texts.map(text => this.translateText(text, fromLang, toLang));
    return Promise.all(promises);
  }

  // Clear translation cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache size
  getCacheSize(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const translationService = new TranslationService();

// Utility function for quick translation
export async function translateQuick(text: string, from: Language, to: Language): Promise<string> {
  return translationService.translateText(text, from, to);
}

// Auto-detect language (simplified detection based on character patterns)
export function detectLanguage(text: string): Language {
  if (!text.trim()) return 'en';

  // Persian/Farsi detection
  if (/[\u0600-\u06FF]/.test(text)) return 'fa';
  
  // Arabic detection
  if (/[\u0621-\u064A]/.test(text)) return 'ar';
  
  // Chinese detection
  if (/[\u4e00-\u9fff]/.test(text)) return 'zh';
  
  // Japanese detection
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja';
  
  // Russian detection
  if (/[\u0400-\u04FF]/.test(text)) return 'ru';
  
  // Basic European language detection (simplified)
  const words = text.toLowerCase().split(/\s+/);
  
  // French indicators
  if (words.some(w => ['le', 'la', 'les', 'de', 'du', 'des', 'et', 'est', 'une', 'un'].includes(w))) {
    return 'fr';
  }
  
  // German indicators
  if (words.some(w => ['der', 'die', 'das', 'und', 'ist', 'eine', 'ein', 'mit', 'für'].includes(w))) {
    return 'de';
  }
  
  // Spanish indicators
  if (words.some(w => ['el', 'la', 'los', 'las', 'de', 'del', 'y', 'es', 'una', 'un'].includes(w))) {
    return 'es';
  }
  
  // Turkish indicators
  if (words.some(w => ['ve', 'bir', 'bu', 'için', 'ile', 'var', 'olan', 'kadar'].includes(w))) {
    return 'tr';
  }
  
  // Default to English
  return 'en';
}