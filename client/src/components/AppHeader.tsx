import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Globe, Languages } from "lucide-react";
import { useTranslation, languages, type Language } from "@/lib/translations";
import { LanguageSync } from "./LanguageSync";
import { TranslationButton } from "./TranslationButton";

interface AppHeaderProps {
  userData: any;
  selectedLanguage: Language;
  onLanguageChange: (language: Language) => void;
}

export function AppHeader({ userData, selectedLanguage, onLanguageChange }: AppHeaderProps) {
  const [greetingText, setGreetingText] = useState(`Hello ${userData.user?.username || 'User'}`);
  const t = useTranslation(selectedLanguage);

  const handleGreetingTranslated = (translatedText: string) => {
    setGreetingText(translatedText);
  };

  return (
    <div className="flex justify-between items-center mb-6 bg-black/20 backdrop-blur-sm rounded-lg p-4">
      <div className="flex items-center space-x-4">
        {/* App Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {t('appName')}
            </h1>
            <p className="text-slate-400 text-xs">Video Communication Platform</p>
          </div>
        </div>
        
        {/* User Welcome */}
        <div className="flex items-center space-x-3 ml-8">
          <Avatar className="w-10 h-10">
            <AvatarImage src={userData.user?.avatar} />
            <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              {userData.user?.username?.charAt(0).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center space-x-2">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {greetingText}
              </h2>
              <p className="text-slate-400 text-xs">
                Welcome to the social network
              </p>
            </div>
            <TranslationButton
              text={`Hello ${userData.user?.username || 'User'}`}
              onTranslated={handleGreetingTranslated}
              sourceLanguage="en"
              className="text-white border-white/20 hover:bg-white/10"
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* One-Click Language Translation */}
      <div className="flex items-center space-x-2">
        <LanguageSync />
        <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}