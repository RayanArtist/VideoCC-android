import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { type Language } from './translations';

interface LanguageContextType {
  selectedLanguage: Language;
  setSelectedLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('selectedLanguage');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('selectedLanguage', selectedLanguage);
    document.documentElement.setAttribute('lang', selectedLanguage);
    
    // Set text direction based on language
    const rtlLanguages: Language[] = ['fa', 'ar'];
    const direction = rtlLanguages.includes(selectedLanguage) ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', direction);
  }, [selectedLanguage]);

  return (
    <LanguageContext.Provider value={{ selectedLanguage, setSelectedLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}