import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Globe, RefreshCw, Check } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Badge } from './ui/badge';
import { type Language, languages } from '@/lib/translations';
import { useLanguage } from '@/lib/languageContext';
import { translationService } from '@/lib/translationService';
import { useToast } from '@/hooks/use-toast';

interface ContentItem {
  id: string;
  text: string;
  type: 'profile' | 'message' | 'post' | 'interface';
  translated?: boolean;
}

export function LanguageSync() {
  const { selectedLanguage, setSelectedLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const { toast } = useToast();

  // Mock content that would be translated
  const [contentItems] = useState<ContentItem[]>([
    { id: '1', text: 'Profile bio content', type: 'profile' },
    { id: '2', text: 'Chat messages', type: 'message' },
    { id: '3', text: 'User posts', type: 'post' },
    { id: '4', text: 'Interface elements', type: 'interface' }
  ]);

  const handleLanguageChange = async (newLanguage: Language) => {
    if (newLanguage === selectedLanguage) return;

    setIsSyncing(true);
    setSyncProgress(0);

    try {
      // Simulate progressive sync
      for (let i = 0; i <= 100; i += 20) {
        setSyncProgress(i);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Update language
      setSelectedLanguage(newLanguage);
      
      // Update document direction for RTL languages
      const rtlLanguages: Language[] = ['fa', 'ar'];
      const direction = rtlLanguages.includes(newLanguage) ? 'rtl' : 'ltr';
      document.documentElement.setAttribute('dir', direction);

      toast({
        title: 'Language synced successfully',
        description: `Content synchronized to ${languages[newLanguage]}`,
      });

      setIsOpen(false);
    } catch (error) {
      toast({
        title: 'Sync failed',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{languages[selectedLanguage]}</span>
          <Badge variant="secondary" className="ml-1">
            {Object.keys(languages).length}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            One-Click Language Sync
          </DialogTitle>
          <DialogDescription>
            Instantly translate all content to your preferred language
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Language */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="font-medium">Current Language</span>
            <Badge variant="default">{languages[selectedLanguage]}</Badge>
          </div>

          {/* Sync Progress */}
          {isSyncing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Syncing content...</span>
                <span>{syncProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Content Preview */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Content to sync:</h4>
            <div className="space-y-1">
              {contentItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded">
                  <span className="capitalize">{item.type}</span>
                  {item.translated ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      {selectedLanguage.toUpperCase()}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Language Grid */}
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(languages).map(([code, name]) => (
              <Button
                key={code}
                variant={selectedLanguage === code ? "default" : "outline"}
                className="h-12 flex flex-col items-center gap-1"
                onClick={() => handleLanguageChange(code as Language)}
                disabled={isSyncing || selectedLanguage === code}
              >
                <span className="text-xs font-medium">{code.toUpperCase()}</span>
                <span className="text-xs truncate">{name}</span>
              </Button>
            ))}
          </div>

          {/* Cache Info */}
          <div className="text-xs text-muted-foreground text-center">
            Translation cache: {translationService.getCacheSize()} items
            <Button 
              variant="link" 
              className="h-auto p-0 ml-2 text-xs"
              onClick={() => {
                translationService.clearCache();
                toast({ title: 'Cache cleared' });
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Floating translation widget for pages
export function FloatingTranslator() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <LanguageSync />
    </div>
  );
}