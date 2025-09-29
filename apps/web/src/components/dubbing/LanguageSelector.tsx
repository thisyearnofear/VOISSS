"use client";

import React, { useState } from 'react';

// Enhanced language data with flags and metadata
const ENHANCED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', sampleText: 'Hello, how are you?', isPopular: false },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', sampleText: 'नमस्ते, आप कैसे हैं?', isPopular: true },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷', sampleText: 'Olá, como você está?', isPopular: true },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', sampleText: '你好，你怎么样？', isPopular: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', sampleText: 'Hola, ¿cómo estás?', isPopular: true },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', sampleText: 'Bonjour, comment allez-vous?', isPopular: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', sampleText: 'Hallo, wie geht es Ihnen?', isPopular: true },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', sampleText: 'こんにちは、お元気ですか？', isPopular: true },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', sampleText: 'مرحبا، كيف حالك؟', isPopular: true },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', sampleText: 'Привет, как дела?', isPopular: true },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', sampleText: '안녕하세요, 어떻게 지내세요?', isPopular: true },
  { code: 'id', name: 'Indonesian', nativeName: 'Indonesia', flag: '🇮🇩', sampleText: 'Halo, apa kabar?', isPopular: false },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', sampleText: 'Ciao, come stai?', isPopular: false },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', sampleText: 'Hallo, hoe gaat het?', isPopular: false },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', sampleText: 'Merhaba, nasılsınız?', isPopular: false },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', sampleText: 'Cześć, jak się masz?', isPopular: false },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', sampleText: 'Hej, hur mår du?', isPopular: false },
  { code: 'fil', name: 'Filipino', nativeName: 'Filipino', flag: '🇵🇭', sampleText: 'Kumusta, kamusta ka?', isPopular: false },
  { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾', sampleText: 'Hello, apa khabar?', isPopular: false },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴', sampleText: 'Bună, ce faci?', isPopular: false },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦', sampleText: 'Привіт, як справи?', isPopular: false },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷', sampleText: 'Γεια σας, τι κάνετε;', isPopular: false },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿', sampleText: 'Ahoj, jak se máš?', isPopular: false },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', sampleText: 'Hej, hvordan har du det?', isPopular: false },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', sampleText: 'Hei, mitä kuuluu?', isPopular: false },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', flag: '🇧🇬', sampleText: 'Здравей, как си?', isPopular: false },
  { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski', flag: '🇭🇷', sampleText: 'Bok, kako ste?', isPopular: false },
  { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina', flag: '🇸🇰', sampleText: 'Ahoj, ako sa máš?', isPopular: false },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳', sampleText: 'வணக்கம், எப்படி இருக்கிறீர்கள்?', isPopular: false }
];

interface Language {
  code: string;
  name: string;
  nativeName?: string;
  flag?: string;
  isPopular?: boolean;
  sampleText?: string;
}

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
  languages: Language[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  viewMode?: 'dropdown' | 'cards';
}

export default function LanguageSelector({
  selectedLanguage,
  onLanguageChange,
  languages,
  placeholder = "Select language...",
  disabled = false,
  className = "",
  viewMode = 'cards'
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Utility functions for language operations
  const getLanguageByCode = (code: string) => {
    return ENHANCED_LANGUAGES.find((lang) => lang.code === code);
  };

  const getPopularLanguages = () => {
    return ENHANCED_LANGUAGES.filter((lang) => lang.isPopular);
  };

  const selectedLanguageInfo = getLanguageByCode(selectedLanguage);
  const popularLanguages = getPopularLanguages();

  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.nativeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLanguageSelect = (languageCode: string) => {
    onLanguageChange(languageCode);
    setIsOpen(false);
    setSearchTerm("");
  };

  if (viewMode === 'dropdown') {
    return (
      <select
        className={`voisss-input ${className}`}
        value={selectedLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        disabled={disabled}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.nativeName && language.nativeName !== language.name
              ? `${language.flag} ${language.name} (${language.nativeName})`
              : `${language.flag} ${language.name}`}
          </option>
        ))}
      </select>
    );
  }

  // Enhanced cards view
  return (
    <div className={`relative ${className}`}>
      {/* Selected Language Display */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full p-3 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg text-left
          hover:border-[#7C5DFA] transition-colors flex items-center justify-between
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${isOpen ? 'border-[#7C5DFA]' : ''}
        `}
      >
        <div className="flex items-center gap-3">
          {selectedLanguageInfo ? (
            <>
              <span className="text-2xl">{selectedLanguageInfo.flag}</span>
              <div>
                <div className="text-white font-medium">
                  {selectedLanguageInfo.nativeName && selectedLanguageInfo.nativeName !== selectedLanguageInfo.name
                    ? `${selectedLanguageInfo.name} (${selectedLanguageInfo.nativeName})`
                    : selectedLanguageInfo.name}
                </div>
                {selectedLanguageInfo.sampleText && (
                  <div className="text-xs text-gray-400 mt-1">
                    {selectedLanguageInfo.sampleText}
                  </div>
                )}
              </div>
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg shadow-xl max-h-96 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-[#2A2A2A]">
            <input
              type="text"
              placeholder="Search languages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-[#7C5DFA]"
            />
          </div>

          {/* Popular Languages Section */}
          {searchTerm === "" && popularLanguages.length > 0 && (
            <div className="p-3 border-b border-[#2A2A2A]">
              <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Popular Languages
              </div>
              <div className="grid grid-cols-2 gap-1">
                {popularLanguages.slice(0, 6).map((language: Language) => (
                  <button
                    key={language.code}
                    onClick={() => handleLanguageSelect(language.code)}
                    className={`
                      p-2 rounded-lg text-left transition-colors flex items-center gap-2 text-sm
                      ${selectedLanguage === language.code
                        ? 'bg-[#7C5DFA] text-white'
                        : 'hover:bg-[#2A2A2A] text-gray-300'}
                    `}
                  >
                    <span className="text-lg">{language.flag}</span>
                    <div>
                      <div className="font-medium">{language.name}</div>
                      {language.nativeName && (
                        <div className="text-xs opacity-75">{language.nativeName}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All Languages Grid */}
          <div className="max-h-64 overflow-y-auto p-2">
            <div className="grid grid-cols-1 gap-1">
              {filteredLanguages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => handleLanguageSelect(language.code)}
                  className={`
                    w-full p-3 rounded-lg text-left transition-colors flex items-center gap-3
                    ${selectedLanguage === language.code
                      ? 'bg-[#7C5DFA] text-white'
                      : 'hover:bg-[#2A2A2A] text-gray-300'}
                  `}
                >
                  <span className="text-xl flex-shrink-0">{language.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {language.nativeName && language.nativeName !== language.name
                        ? `${language.name} (${language.nativeName})`
                        : language.name}
                    </div>
                    {language.sampleText && (
                      <div className="text-xs opacity-75 mt-1 truncate">
                        {language.sampleText}
                      </div>
                    )}
                  </div>
                  {language.isPopular && (
                    <svg className="w-4 h-4 text-yellow-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  )}
                </button>
              ))}
            </div>

            {filteredLanguages.length === 0 && (
              <div className="p-4 text-center text-gray-400 text-sm">
                No languages found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}