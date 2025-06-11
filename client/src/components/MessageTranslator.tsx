import { useState } from 'react';
import { Button } from './ui/button';
import { Languages, Copy, Volume2 } from 'lucide-react';
import { TranslationButton, QuickTranslate } from './TranslationButton';
import { type Language, languages } from '@/lib/translations';
import { detectLanguage } from '@/lib/translationService';
import { useToast } from '@/hooks/use-toast';

interface MessageTranslatorProps {
  messageText: string;
  messageId: string;
  senderLanguage?: Language;
  className?: string;
}

export function MessageTranslator({ 
  messageText, 
  messageId, 
  senderLanguage,
  className = ''
}: MessageTranslatorProps) {
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isTranslated, setIsTranslated] = useState(false);
  const [detectedLang, setDetectedLang] = useState<Language | null>(null);
  const { toast } = useToast();

  const handleTranslated = (text: string, targetLang: Language) => {
    setTranslatedText(text);
    setIsTranslated(true);
    
    // Auto-detect source language if not provided
    if (!senderLanguage && !detectedLang) {
      const detected = detectLanguage(messageText);
      setDetectedLang(detected);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(isTranslated ? translatedText : messageText);
      toast({
        title: 'Copied to clipboard',
        description: 'Message text copied successfully',
      });
    } catch (error) {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive'
      });
    }
  };

  const speakText = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(isTranslated ? translatedText : messageText);
      utterance.lang = isTranslated ? 'en' : (senderLanguage || detectedLang || 'en');
      speechSynthesis.speak(utterance);
    }
  };

  const resetTranslation = () => {
    setIsTranslated(false);
    setTranslatedText('');
  };

  return (
    <div className={`group relative ${className}`}>
      {/* Message text */}
      <div className="message-content">
        {isTranslated ? (
          <div className="space-y-2">
            <p className="text-blue-100 bg-blue-900/20 p-2 rounded border-l-2 border-blue-400">
              {translatedText}
            </p>
            <p className="text-gray-400 text-sm italic">
              Original: {messageText}
            </p>
          </div>
        ) : (
          <p>{messageText}</p>
        )}
      </div>

      {/* Translation controls - appear on hover */}
      <div className="absolute -bottom-8 right-0 hidden group-hover:flex items-center space-x-1 bg-black/80 rounded-lg p-1">
        <TranslationButton
          text={messageText}
          onTranslated={handleTranslated}
          sourceLanguage={senderLanguage || detectedLang || undefined}
          size="sm"
          className="h-6 w-6 text-white border-white/20"
        />
        
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-white hover:bg-white/20"
          onClick={copyToClipboard}
          title="Copy message"
        >
          <Copy size={12} />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-white hover:bg-white/20"
          onClick={speakText}
          title="Read aloud"
        >
          <Volume2 size={12} />
        </Button>

        {isTranslated && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white hover:bg-white/20"
            onClick={resetTranslation}
            title="Show original"
          >
            ↺
          </Button>
        )}

        {/* Language indicator */}
        {(senderLanguage || detectedLang) && (
          <span className="text-xs text-gray-400 px-1">
            {languages[senderLanguage || detectedLang!]?.slice(0, 3)}
          </span>
        )}
      </div>
    </div>
  );
}

// Bulk message translator for chat history
interface ChatTranslatorProps {
  messages: Array<{
    id: string;
    text: string;
    sender: string;
    language?: Language;
  }>;
  targetLanguage: Language;
  onTranslated: (messageId: string, translatedText: string) => void;
}

export function ChatTranslator({ messages, targetLanguage, onTranslated }: ChatTranslatorProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const translateAllMessages = async () => {
    setIsTranslating(true);
    setProgress(0);

    try {
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        const sourceLang = message.language || detectLanguage(message.text);
        
        if (sourceLang !== targetLanguage) {
          // Simulate translation delay for demo
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // In real implementation, would call translation service
          const translatedText = `[Translated to ${languages[targetLanguage]}] ${message.text}`;
          onTranslated(message.id, translatedText);
        }
        
        setProgress(((i + 1) / messages.length) * 100);
      }

      toast({
        title: 'Translation complete',
        description: `Translated ${messages.length} messages to ${languages[targetLanguage]}`,
      });
    } catch (error) {
      toast({
        title: 'Translation failed',
        description: 'Some messages could not be translated',
        variant: 'destructive'
      });
    } finally {
      setIsTranslating(false);
      setProgress(0);
    }
  };

  return (
    <div className="flex items-center space-x-2 p-2 bg-slate-800 rounded-lg">
      <Languages className="h-4 w-4 text-blue-400" />
      <span className="text-sm text-white">
        Translate all messages to {languages[targetLanguage]}
      </span>
      
      <Button
        onClick={translateAllMessages}
        disabled={isTranslating}
        size="sm"
        className="ml-auto"
      >
        {isTranslating ? `${Math.round(progress)}%` : 'Translate All'}
      </Button>
    </div>
  );
}