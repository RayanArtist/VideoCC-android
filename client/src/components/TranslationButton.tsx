import { useState } from 'react';
import { Button } from './ui/button';
import { Languages, Loader2 } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { type Language, languages } from '@/lib/translations';
import { translationService, detectLanguage } from '@/lib/translationService';
import { useToast } from '@/hooks/use-toast';

interface TranslationButtonProps {
  text: string;
  onTranslated: (translatedText: string, targetLang: Language) => void;
  sourceLanguage?: Language;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function TranslationButton({ 
  text, 
  onTranslated, 
  sourceLanguage,
  className = '',
  size = 'sm'
}: TranslationButtonProps) {
  const [isTranslating, setIsTranslating] = useState(false);
  const { toast } = useToast();

  const handleTranslate = async (targetLang: Language) => {
    if (!text.trim()) {
      toast({
        title: 'No text to translate',
        description: 'Please enter some text first',
        variant: 'destructive'
      });
      return;
    }

    setIsTranslating(true);

    try {
      // Auto-detect source language if not provided
      const sourceLang = sourceLanguage || detectLanguage(text);
      
      // Translate the text
      const translatedText = await translationService.translateText(text, sourceLang, targetLang);
      
      // Call the callback with translated text
      onTranslated(translatedText, targetLang);
      
      toast({
        title: 'Translation completed',
        description: `Translated to ${languages[targetLang]}`,
      });
    } catch (error) {
      toast({
        title: 'Translation failed',
        description: 'Please try again later',
        variant: 'destructive'
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const buttonSize = size === 'sm' ? 'h-8 w-8' : size === 'md' ? 'h-10 w-10' : 'h-12 w-12';
  const iconSize = size === 'sm' ? 14 : size === 'md' ? 16 : 20;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={`${buttonSize} ${className}`}
          disabled={isTranslating}
        >
          {isTranslating ? (
            <Loader2 className="animate-spin" size={iconSize} />
          ) : (
            <Languages size={iconSize} />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {Object.entries(languages).map(([code, name]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleTranslate(code as Language)}
            className="cursor-pointer"
          >
            <Languages className="mr-2 h-4 w-4" />
            Translate to {name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Quick translate component for inline text
interface QuickTranslateProps {
  children: string;
  sourceLanguage?: Language;
  className?: string;
}

export function QuickTranslate({ children, sourceLanguage, className = '' }: QuickTranslateProps) {
  const [translatedText, setTranslatedText] = useState<string>(children);
  const [currentLang, setCurrentLang] = useState<Language>(sourceLanguage || 'en');
  const [originalText] = useState<string>(children);

  const handleTranslated = (text: string, targetLang: Language) => {
    setTranslatedText(text);
    setCurrentLang(targetLang);
  };

  const resetToOriginal = () => {
    setTranslatedText(originalText);
    setCurrentLang(sourceLanguage || 'en');
  };

  return (
    <div className={`group relative ${className}`}>
      <span>{translatedText}</span>
      <div className="absolute -top-8 right-0 hidden group-hover:flex gap-1">
        <TranslationButton
          text={originalText}
          onTranslated={handleTranslated}
          sourceLanguage={sourceLanguage}
          size="sm"
        />
        {translatedText !== originalText && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={resetToOriginal}
            title="Show original"
          >
            ↺
          </Button>
        )}
      </div>
    </div>
  );
}